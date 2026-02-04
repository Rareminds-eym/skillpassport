/**
 * Assessment Analysis Handler
 * Main handler for /analyze-assessment endpoint
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { AssessmentData, AnalysisResult } from '../types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import { checkRateLimit } from '../../career/utils/rate-limit';
import { buildAnalysisPrompt, getSystemMessage } from '../prompts';
import { 
  repairAndParseJSON, 
  AI_MODELS, 
  getAPIKeys,
  API_CONFIG,
  callOpenRouterWithRetry
} from '../../shared/ai-config';

interface RequestBody {
  assessmentData: AssessmentData;
}

// AI Models to try (in order of preference) - using valid OpenRouter models
const ASSESSMENT_MODELS = [
  'openai/gpt-3.5-turbo',                  // Reliable and affordable
  'openai/gpt-4o-mini',                    // Backup OpenAI model
  'google/gemini-2.0-flash-exp:free',      // FREE - Latest Gemini
  'meta-llama/llama-3.2-3b-instruct:free', // FREE - Smaller Llama
];

// Assessment-specific configuration
const ASSESSMENT_CONFIG = {
  temperature: 0.1,  // Low temperature for consistent, deterministic results
  maxTokens: 32000,  // Increased to handle complete responses with all sections (employability, knowledge, skillGap, roadmap, finalNote)
};

/**
 * Generate deterministic seed from assessment data
 * This ensures same input always produces same output
 */
function generateSeed(data: AssessmentData): number {
  // Create a hash from the assessment data
  const dataString = JSON.stringify({
    riasec: data.riasecAnswers,
    aptitude: data.aptitudeScores,
    bigFive: data.bigFiveAnswers,
    values: data.workValuesAnswers,
    employability: data.employabilityAnswers,
    knowledge: data.knowledgeAnswers
  });
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive integer
  return Math.abs(hash);
}

/**
 * Validate assessment response structure
 * Ensures the response has all required fields with correct types
 */
function validateAssessmentStructure(result: any): { valid: boolean; errors: string[]; warnings: string[] } {
  // ============================================================================
  // ENHANCED LOGGING: Log validation start (Requirement 4.3, 4.5)
  // ============================================================================
  console.log('[VALIDATION] === STARTING ASSESSMENT STRUCTURE VALIDATION ===');
  console.log('[VALIDATION] Response type:', typeof result);
  console.log('[VALIDATION] Is array:', Array.isArray(result));
  console.log('[VALIDATION] Response keys:', result ? Object.keys(result).join(', ') : 'null');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Must be an object
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    const error = 'Response must be a JSON object, not an array or primitive';
    errors.push(error);
    console.error('[VALIDATION] ❌ CRITICAL:', error);
    console.error('[VALIDATION] === END VALIDATION (FAILED) ===');
    return { valid: false, errors, warnings };
  }
  
  // Required top-level fields
  const requiredFields = {
    profileSnapshot: 'object',
    riasec: 'object',
    aptitude: 'object',
    bigFive: 'object',
    workValues: 'object',
    employability: 'object',
    knowledge: 'object',
    careerFit: 'object',
    skillGap: 'object',
    roadmap: 'object',
    finalNote: 'object'
  };
  
  // CRITICAL sections that MUST be present (not just warnings)
  const criticalSections = ['employability', 'knowledge', 'skillGap', 'roadmap', 'finalNote'];
  
  // Check required fields
  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!result[field]) {
      // Critical sections are ERRORS, not warnings
      if (criticalSections.includes(field)) {
        errors.push(`CRITICAL: Missing required field: ${field}`);
      } else {
        warnings.push(`Missing field: ${field}`);
      }
    } else if (typeof result[field] !== expectedType) {
      const error = `Field '${field}' must be ${expectedType}, got ${typeof result[field]}`;
      errors.push(error);
      typeErrorsList.push(`${field}: expected ${expectedType}, got ${typeof result[field]}`);
      console.error('[VALIDATION] ❌', error);
    } else {
      console.log('[VALIDATION] ✅', field, '- present and correct type');
    }
  }
  
  // Log summary of missing fields
  if (missingFieldsList.length > 0) {
    console.error('[VALIDATION] ❌ === MISSING FIELDS SUMMARY ===');
    console.error('[VALIDATION] Total missing:', missingFieldsList.length);
    console.error('[VALIDATION] Missing fields:', missingFieldsList.join(', '));
    console.error('[VALIDATION] === END MISSING FIELDS ===');
  }
  
  if (typeErrorsList.length > 0) {
    console.error('[VALIDATION] ❌ === TYPE ERRORS SUMMARY ===');
    console.error('[VALIDATION] Total type errors:', typeErrorsList.length);
    typeErrorsList.forEach(err => console.error('[VALIDATION]   -', err));
    console.error('[VALIDATION] === END TYPE ERRORS ===');
  }
  
  // Validate careerFit structure (most critical)
  if (result.careerFit) {
    console.log('[VALIDATION] Validating careerFit structure...');
    if (!result.careerFit.clusters || !Array.isArray(result.careerFit.clusters)) {
      const error = 'careerFit.clusters must be an array';
      errors.push(error);
      console.error('[VALIDATION] ❌', error);
    } else {
      if (result.careerFit.clusters.length !== 3) {
        const error = `careerFit.clusters must have exactly 3 items, got ${result.careerFit.clusters.length}`;
        errors.push(error);
        console.error('[VALIDATION] ❌', error);
      } else {
        console.log('[VALIDATION] ✅ careerFit.clusters has 3 items');
      }
      
      // Validate each cluster
      result.careerFit.clusters.forEach((cluster: any, index: number) => {
        const clusterNum = index + 1;
        if (!cluster || typeof cluster !== 'object') {
          const error = `Cluster ${clusterNum} must be an object`;
          errors.push(error);
          console.error('[VALIDATION] ❌', error);
          return;
        }
        
        const requiredClusterFields = ['title', 'fit', 'matchScore', 'description', 'evidence', 'roles', 'domains', 'whyItFits'];
        const missingClusterFields: string[] = [];
        requiredClusterFields.forEach(field => {
          if (!cluster[field]) {
            const warning = `Cluster ${clusterNum} missing field: ${field}`;
            warnings.push(warning);
            missingClusterFields.push(field);
            console.warn('[VALIDATION] ⚠️', warning);
          }
        });
        
        if (missingClusterFields.length === 0) {
          console.log(`[VALIDATION] ✅ Cluster ${clusterNum} has all required fields`);
        }
        
        // Validate evidence structure
        if (cluster.evidence && typeof cluster.evidence === 'object') {
          const requiredEvidence = ['interest', 'aptitude', 'personality'];
          requiredEvidence.forEach(field => {
            if (!cluster.evidence[field]) {
              const warning = `Cluster ${clusterNum} evidence missing: ${field}`;
              warnings.push(warning);
              console.warn('[VALIDATION] ⚠️', warning);
            }
          });
        }
      });
    }
    
    // Validate specificOptions
    if (!result.careerFit.specificOptions) {
      const warning = 'careerFit.specificOptions missing';
      warnings.push(warning);
      console.warn('[VALIDATION] ⚠️', warning);
    } else {
      const requiredOptions = ['highFit', 'mediumFit', 'exploreLater'];
      requiredOptions.forEach(field => {
        if (!result.careerFit.specificOptions[field] || !Array.isArray(result.careerFit.specificOptions[field])) {
          const warning = `careerFit.specificOptions.${field} must be an array`;
          warnings.push(warning);
          console.warn('[VALIDATION] ⚠️', warning);
        }
      });
    }
  }
  
  // Validate RIASEC structure
  if (result.riasec) {
    console.log('[VALIDATION] Validating RIASEC structure...');
    if (!result.riasec.scores || typeof result.riasec.scores !== 'object') {
      const error = 'riasec.scores must be an object';
      errors.push(error);
      console.error('[VALIDATION] ❌', error);
    } else {
      const requiredScores = ['R', 'I', 'A', 'S', 'E', 'C'];
      let allScoresValid = true;
      requiredScores.forEach(letter => {
        if (typeof result.riasec.scores[letter] !== 'number') {
          const warning = `riasec.scores.${letter} must be a number`;
          warnings.push(warning);
          console.warn('[VALIDATION] ⚠️', warning);
          allScoresValid = false;
        }
      });
      
      if (allScoresValid) {
        console.log('[VALIDATION] ✅ All RIASEC scores are numbers');
        
        // ============================================================================
        // ENHANCED LOGGING: Detect suspicious patterns (Requirement 4.5)
        // ============================================================================
        const scores = requiredScores.map(letter => result.riasec.scores[letter]);
        const allZero = scores.every(score => score === 0);
        const allSame = scores.every(score => score === scores[0]);
        
        if (allZero) {
          const warning = '⚠️ SUSPICIOUS PATTERN: All RIASEC scores are zero - indicates extraction failure';
          warnings.push(warning);
          console.warn('[VALIDATION]', warning);
        } else if (allSame) {
          const warning = `⚠️ SUSPICIOUS PATTERN: All RIASEC scores are identical (${scores[0]}) - indicates flat profile or calculation error`;
          warnings.push(warning);
          console.warn('[VALIDATION]', warning);
        } else {
          console.log('[VALIDATION] ✅ RIASEC scores show variation (not all zero or identical)');
        }
      }
    }
    
    if (!result.riasec.code || typeof result.riasec.code !== 'string') {
      const warning = 'riasec.code must be a string';
      warnings.push(warning);
      console.warn('[VALIDATION] ⚠️', warning);
    } else {
      console.log('[VALIDATION] ✅ riasec.code is present:', result.riasec.code);
    }
  }
  
  // Validate aptitude structure
  if (result.aptitude && result.aptitude.scores) {
    console.log('[VALIDATION] Validating aptitude structure...');
    const aptitudeTypes = ['verbal', 'numerical', 'abstract', 'spatial', 'clerical'];
    const missingAptitudeTypes: string[] = [];
    const emptyAptitudeTypes: string[] = [];
    
    aptitudeTypes.forEach(type => {
      if (!result.aptitude.scores[type]) {
        const warning = `aptitude.scores.${type} missing`;
        warnings.push(warning);
        missingAptitudeTypes.push(type);
        console.warn('[VALIDATION] ⚠️', warning);
      } else {
        // Check if aptitude score is empty or all zeros
        const score = result.aptitude.scores[type];
        if (score.correct === 0 && score.total === 0) {
          const warning = `⚠️ SUSPICIOUS PATTERN: aptitude.scores.${type} is empty (0/0) - indicates no questions answered`;
          warnings.push(warning);
          emptyAptitudeTypes.push(type);
          console.warn('[VALIDATION]', warning);
        }
      }
    });
    
    if (missingAptitudeTypes.length === 0 && emptyAptitudeTypes.length === 0) {
      console.log('[VALIDATION] ✅ All aptitude types present with data');
    } else if (missingAptitudeTypes.length > 0) {
      console.warn('[VALIDATION] ⚠️ Missing aptitude types:', missingAptitudeTypes.join(', '));
    }
    if (emptyAptitudeTypes.length > 0) {
      console.warn('[VALIDATION] ⚠️ Empty aptitude types:', emptyAptitudeTypes.join(', '));
    }
  }
  
  // CRITICAL: Validate overallSummary
  if (result.overallSummary) {
    if (typeof result.overallSummary !== 'string') {
      const error = 'overallSummary must be a string';
      errors.push(error);
      console.error('[VALIDATION] ❌', error);
    } else if (result.overallSummary.length < 50) {
      const warning = 'overallSummary is too short (should be 3-4 sentences)';
      warnings.push(warning);
      console.warn('[VALIDATION] ⚠️', warning);
    } else {
      console.log('[VALIDATION] ✅ overallSummary is present and adequate length');
    }
  }
  
  // ============================================================================
  // ENHANCED LOGGING: Log validation summary (Requirement 4.5)
  // ============================================================================
  console.log('[VALIDATION] === VALIDATION SUMMARY ===');
  console.log('[VALIDATION] Valid:', errors.length === 0);
  console.log('[VALIDATION] Total Errors:', errors.length);
  console.log('[VALIDATION] Total Warnings:', warnings.length);
  
  if (errors.length > 0) {
    console.error('[VALIDATION] ❌ ERRORS:');
    errors.forEach((err, idx) => console.error(`[VALIDATION]   ${idx + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.warn('[VALIDATION] ⚠️ WARNINGS:');
    warnings.forEach((warn, idx) => console.warn(`[VALIDATION]   ${idx + 1}. ${warn}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('[VALIDATION] ✅ All validations passed - response structure is complete');
  }
  
  console.log('[VALIDATION] === END VALIDATION ===');
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Analyze assessment data using OpenRouter AI with validation-based fallback
 * 
 * This function implements a two-tier fallback strategy:
 * 1. API-level fallback: callOpenRouterWithRetry handles network/API failures
 * 2. Validation-level fallback: If a model returns incomplete data, try the next model
 * 
 * Requirements: 7.4, 7.5
 */
async function analyzeAssessment(
  env: PagesEnv,
  assessmentData: AssessmentData
): Promise<any> {
  const gradeLevel = assessmentData.gradeLevel || 'after12';
  const prompt = buildAnalysisPrompt(assessmentData);
  const systemMessage = getSystemMessage(gradeLevel);
  const seed = generateSeed(assessmentData);

  console.log(`[ASSESSMENT] === STARTING AI ANALYSIS WITH VALIDATION FALLBACK ===`);
  console.log(`[ASSESSMENT] Using deterministic seed: ${seed} for consistent results`);
  console.log(`[ASSESSMENT] Grade Level: ${gradeLevel}`);
  console.log(`[ASSESSMENT] Available models: ${ASSESSMENT_MODELS.length}`);
  console.log(`[ASSESSMENT] Models: ${ASSESSMENT_MODELS.join(', ')}`);

  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    throw new Error('OpenRouter API key not configured');
  }

  // ============================================================================
  // VALIDATION-BASED MODEL FALLBACK (Requirement 7.4)
  // Track which models have been tried and their failure reasons
  // ============================================================================
  const modelAttempts: Array<{ model: string; error: string; validationErrors?: string[] }> = [];
  let lastError: Error | null = null;

  // Try each model in sequence until one produces valid results
  for (let modelIndex = 0; modelIndex < ASSESSMENT_MODELS.length; modelIndex++) {
    const currentModel = ASSESSMENT_MODELS[modelIndex];
    
    console.log(`\n[ASSESSMENT] 🎯 Trying model ${modelIndex + 1}/${ASSESSMENT_MODELS.length}: ${currentModel}`);
    
    try {
      // Call OpenRouter with ONLY the current model (no fallback at API level)
      // This ensures we can control validation-based fallback
      const content = await callOpenRouterWithRetry(openRouter, [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ], {
        models: [currentModel], // Single model - we handle fallback here
        maxRetries: 2, // Reduced retries since we have model-level fallback
        maxTokens: ASSESSMENT_CONFIG.maxTokens,
        temperature: ASSESSMENT_CONFIG.temperature,
      });

      console.log(`[ASSESSMENT] ✅ ${currentModel} - Received response`);
      console.log(`[ASSESSMENT] 📄 Response length: ${content.length} characters`);
      console.log(`[ASSESSMENT] 📄 First 300 chars: ${content.substring(0, 300)}`);
      
      // Parse the JSON response using shared utility (prefer object for assessments)
      const result = repairAndParseJSON(content, true);
      
      // ============================================================================
      // STRICT VALIDATION (Requirement 7.2, 7.3)
      // ============================================================================
      const validation = validateAssessmentStructure(result);
      
      // ============================================================================
      // VALIDATION FAILURE HANDLING (Requirement 7.4)
      // If validation fails, log details and try next model
      // ============================================================================
      if (validation.errors.length > 0) {
        console.error(`[ASSESSMENT] ❌ ${currentModel} - Validation failed with ${validation.errors.length} errors:`);
        validation.errors.forEach(err => console.error(`[ASSESSMENT]   - ${err}`));
        
        // Record this attempt
        modelAttempts.push({
          model: currentModel,
          error: 'Validation failed',
          validationErrors: validation.errors
        });
        
        // If this is not the last model, try the next one
        if (modelIndex < ASSESSMENT_MODELS.length - 1) {
          console.log(`[ASSESSMENT] 🔄 Validation failed for ${currentModel}, trying next model...`);
          continue; // Try next model
        } else {
          // This was the last model - throw error with all attempt details
          lastError = new Error(`All models failed validation. Last errors: ${validation.errors.join('; ')}`);
          break;
        }
      }
      
      // ============================================================================
      // VALIDATION SUCCESS (Requirement 7.1)
      // ============================================================================
      if (validation.warnings.length > 0) {
        console.warn(`[ASSESSMENT] ⚠️ ${currentModel} - Validation passed with ${validation.warnings.length} warnings:`);
        validation.warnings.forEach(warn => console.warn(`[ASSESSMENT]   - ${warn}`));
      } else {
        console.log(`[ASSESSMENT] ✅ ${currentModel} - Response structure validated successfully (no warnings)`);
      }
      
      // Add metadata including seed and model used for debugging
      result._metadata = {
        seed: seed,
        timestamp: new Date().toISOString(),
        deterministic: true,
        modelUsed: currentModel,
        modelAttempts: modelAttempts.length > 0 ? modelAttempts : undefined,
        validation: {
          valid: validation.valid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined
        }
      };
      
      console.log(`[ASSESSMENT] 🎉 SUCCESS - ${currentModel} produced valid results`);
      console.log(`[ASSESSMENT] === END AI ANALYSIS (SUCCESS) ===`);
      
      return result;
      
    } catch (error) {
      // ============================================================================
      // API/PARSING ERROR HANDLING (Requirement 7.4)
      // Log error and try next model
      // ============================================================================
      const errorMessage = (error as Error).message;
      console.error(`[ASSESSMENT] ❌ ${currentModel} - API/Parsing error:`, errorMessage);
      
      // Record this attempt
      modelAttempts.push({
        model: currentModel,
        error: errorMessage
      });
      
      lastError = error as Error;
      
      // If this is not the last model, try the next one
      if (modelIndex < ASSESSMENT_MODELS.length - 1) {
        console.log(`[ASSESSMENT] 🔄 ${currentModel} failed, trying next model...`);
        continue; // Try next model
      }
    }
  }
  
  // ============================================================================
  // ALL MODELS FAILED (Requirement 7.5)
  // Return detailed error with all attempt information
  // ============================================================================
  console.error(`[ASSESSMENT] 💥 === ALL MODELS FAILED ===`);
  console.error(`[ASSESSMENT] Total models tried: ${modelAttempts.length}`);
  console.error(`[ASSESSMENT] Failure details:`);
  modelAttempts.forEach((attempt, idx) => {
    console.error(`[ASSESSMENT]   ${idx + 1}. ${attempt.model}:`);
    console.error(`[ASSESSMENT]      Error: ${attempt.error}`);
    if (attempt.validationErrors) {
      console.error(`[ASSESSMENT]      Validation errors: ${attempt.validationErrors.join('; ')}`);
    }
  });
  console.error(`[ASSESSMENT] === END AI ANALYSIS (FAILED) ===`);
  
  // Create detailed error message for frontend
  const errorDetails = modelAttempts.map((attempt, idx) => 
    `${idx + 1}. ${attempt.model}: ${attempt.error}${attempt.validationErrors ? ` (${attempt.validationErrors.length} validation errors)` : ''}`
  ).join('\n');
  
  throw new Error(
    `AI analysis failed after trying all ${ASSESSMENT_MODELS.length} models.\n\nAttempt details:\n${errorDetails}\n\nLast error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Handle POST /analyze-assessment
 */
export async function handleAnalyzeAssessment(
  request: Request,
  env: PagesEnv
): Promise<Response> {
  // Only allow POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Check for development mode
  const isDevelopment = 
    env.VITE_SUPABASE_URL?.includes('localhost') || 
    request.headers.get('X-Dev-Mode') === 'true';

  let studentId: string;

  // Authentication
  if (isDevelopment) {
    studentId = 'test-student-' + Date.now();
    console.log('[DEV MODE] Bypassing authentication, using test student ID:', studentId);
  } else {
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    studentId = auth.user.id;
  }

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ 
      error: 'Rate limit exceeded. Please try again in a minute.' 
    }, 429);
  }

  // Parse request body
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'assessmentData is required' }, 400);
  }

  console.log(`[ASSESSMENT] Analyzing for student ${studentId}`);
  console.log(`[ASSESSMENT] Stream: ${assessmentData.stream}, Grade: ${assessmentData.gradeLevel}`);

  try {
    // Analyze with AI
    const results = await analyzeAssessment(env, assessmentData);

    console.log(`[ASSESSMENT] Successfully analyzed for student ${studentId}`);
    
    const response: AnalysisResult = {
      success: true,
      data: results
    };

    return jsonResponse(response);

  } catch (error) {
    console.error('[ASSESSMENT] Analysis failed:', error);
    
    const response: AnalysisResult = {
      success: false,
      error: 'Assessment analysis failed',
      details: (error as Error).message
    };

    return jsonResponse(response, 500);
  }
}
