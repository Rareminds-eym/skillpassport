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
  API_CONFIG
} from '../../shared/ai-config';

interface RequestBody {
  assessmentData: AssessmentData;
}

// AI Models to try (in order of preference) - using shared AI_MODELS
const ASSESSMENT_MODELS = [
  AI_MODELS.CLAUDE_SONNET,       // Claude 3.5 Sonnet - best quality, truly deterministic (paid)
  AI_MODELS.GEMINI_2_FLASH,      // Google's Gemini 2.0 - free, fast, 1M context
  AI_MODELS.GEMINI_PRO,          // Google Gemini Pro - free, reliable
  AI_MODELS.XIAOMI_MIMO          // Fallback: Xiaomi's free model
];

// Assessment-specific configuration
const ASSESSMENT_CONFIG = {
  temperature: 0.1,  // Low temperature for consistent, deterministic results
  maxTokens: 20000,  // Increased to handle complete responses (large nested object)
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
 * Call OpenRouter API with the given model
 */
async function callOpenRouter(
  env: PagesEnv,
  model: string,
  systemMessage: string,
  userPrompt: string,
  seed?: number
): Promise<Response> {
  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    throw new Error('OpenRouter API key not configured');
  }

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ],
    temperature: ASSESSMENT_CONFIG.temperature,
    max_tokens: ASSESSMENT_CONFIG.maxTokens
  };

  // Add seed for deterministic results (same input = same output)
  if (seed !== undefined) {
    requestBody.seed = seed;
  }

  return fetch(API_CONFIG.OPENROUTER.endpoint, {
    method: 'POST',
    headers: {
      ...API_CONFIG.OPENROUTER.headers,
      'Authorization': `Bearer ${openRouter}`,
      'HTTP-Referer': env.VITE_SUPABASE_URL || 'https://skillpassport.rareminds.in',
      'X-Title': 'SkillPassport Assessment Analyzer'
    },
    body: JSON.stringify(requestBody)
  });
}

/**
 * Validate assessment response structure
 * Ensures the response has all required fields with correct types
 */
function validateAssessmentStructure(result: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Must be an object
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    errors.push('Response must be a JSON object, not an array or primitive');
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
  
  // Check required fields
  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!result[field]) {
      warnings.push(`Missing field: ${field}`);
    } else if (typeof result[field] !== expectedType) {
      errors.push(`Field '${field}' must be ${expectedType}, got ${typeof result[field]}`);
    }
  }
  
  // Validate careerFit structure (most critical)
  if (result.careerFit) {
    if (!result.careerFit.clusters || !Array.isArray(result.careerFit.clusters)) {
      errors.push('careerFit.clusters must be an array');
    } else {
      if (result.careerFit.clusters.length !== 3) {
        errors.push(`careerFit.clusters must have exactly 3 items, got ${result.careerFit.clusters.length}`);
      }
      
      // Validate each cluster
      result.careerFit.clusters.forEach((cluster: any, index: number) => {
        const clusterNum = index + 1;
        if (!cluster || typeof cluster !== 'object') {
          errors.push(`Cluster ${clusterNum} must be an object`);
          return;
        }
        
        const requiredClusterFields = ['title', 'fit', 'matchScore', 'description', 'evidence', 'roles', 'domains', 'whyItFits'];
        requiredClusterFields.forEach(field => {
          if (!cluster[field]) {
            warnings.push(`Cluster ${clusterNum} missing field: ${field}`);
          }
        });
        
        // Validate evidence structure
        if (cluster.evidence && typeof cluster.evidence === 'object') {
          const requiredEvidence = ['interest', 'aptitude', 'personality'];
          requiredEvidence.forEach(field => {
            if (!cluster.evidence[field]) {
              warnings.push(`Cluster ${clusterNum} evidence missing: ${field}`);
            }
          });
        }
      });
    }
    
    // Validate specificOptions
    if (!result.careerFit.specificOptions) {
      warnings.push('careerFit.specificOptions missing');
    } else {
      const requiredOptions = ['highFit', 'mediumFit', 'exploreLater'];
      requiredOptions.forEach(field => {
        if (!result.careerFit.specificOptions[field] || !Array.isArray(result.careerFit.specificOptions[field])) {
          warnings.push(`careerFit.specificOptions.${field} must be an array`);
        }
      });
    }
  }
  
  // Validate RIASEC structure
  if (result.riasec) {
    if (!result.riasec.scores || typeof result.riasec.scores !== 'object') {
      errors.push('riasec.scores must be an object');
    } else {
      const requiredScores = ['R', 'I', 'A', 'S', 'E', 'C'];
      requiredScores.forEach(letter => {
        if (typeof result.riasec.scores[letter] !== 'number') {
          warnings.push(`riasec.scores.${letter} must be a number`);
        }
      });
    }
    
    if (!result.riasec.code || typeof result.riasec.code !== 'string') {
      warnings.push('riasec.code must be a string');
    }
  }
  
  // Validate aptitude structure
  if (result.aptitude && result.aptitude.scores) {
    const aptitudeTypes = ['verbal', 'numerical', 'abstract', 'spatial', 'clerical'];
    aptitudeTypes.forEach(type => {
      if (!result.aptitude.scores[type]) {
        warnings.push(`aptitude.scores.${type} missing`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Analyze assessment data using OpenRouter AI
 */
async function analyzeAssessment(
  env: PagesEnv,
  assessmentData: AssessmentData
): Promise<any> {
  const gradeLevel = assessmentData.gradeLevel || 'after12';
  const prompt = buildAnalysisPrompt(assessmentData);
  const systemMessage = getSystemMessage(gradeLevel);
  const seed = generateSeed(assessmentData);

  console.log(`[AI] Using deterministic seed: ${seed} for consistent results`);

  let lastError = '';
  const failedModels: string[] = [];
  const failureDetails: Array<{model: string, status?: number, error: string}> = [];

  // Try each model until one succeeds
  for (const model of ASSESSMENT_MODELS) {
    console.log(`[AI] 🔄 Trying model: ${model}`);
    
    try {
      const response = await callOpenRouter(env, model, systemMessage, prompt, seed);
      
      if (!response.ok) {
        const errorText = await response.text();
        lastError = errorText;
        failedModels.push(model);
        failureDetails.push({
          model: model,
          status: response.status,
          error: errorText.substring(0, 200)
        });
        console.error(`[AI] ❌ Model ${model} FAILED with status ${response.status}`);
        console.error(`[AI] ❌ Error: ${errorText.substring(0, 200)}`);
        console.log(`[AI] 🔄 Trying next fallback model...`);
        continue;
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        lastError = 'Empty response from AI';
        failedModels.push(model);
        failureDetails.push({
          model: model,
          error: 'Empty response from AI'
        });
        console.error(`[AI] ❌ Model ${model} FAILED: returned empty content`);
        console.log(`[AI] 🔄 Trying next fallback model...`);
        continue;
      }

      console.log(`[AI] ✅ SUCCESS with model: ${model}`);
      if (failedModels.length > 0) {
        console.log(`[AI] ℹ️ Note: ${failedModels.length} model(s) failed before success: ${failedModels.join(', ')}`);
      }
      
      // Log raw response for debugging
      console.log(`[AI] 📄 RAW RESPONSE (first 500 chars):`);
      console.log(content.substring(0, 500));
      console.log(`[AI] 📄 RAW RESPONSE (last 500 chars):`);
      console.log(content.substring(Math.max(0, content.length - 500)));
      console.log(`[AI] 📄 Total response length: ${content.length} characters`);
      
      // Parse the JSON response using shared utility (prefer object for assessments)
      const result = repairAndParseJSON(content, true);
      
      // Strict validation of response structure
      const validation = validateAssessmentStructure(result);
      
      // Log validation results
      if (validation.errors.length > 0) {
        console.error(`[AI] ❌ Validation errors (${validation.errors.length}):`);
        validation.errors.forEach(err => console.error(`  - ${err}`));
        throw new Error(`Invalid response structure: ${validation.errors.join('; ')}`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn(`[AI] ⚠️ Validation warnings (${validation.warnings.length}):`);
        validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
      } else {
        console.log(`[AI] ✅ Response structure validated successfully`);
      }
      
      // Add metadata including seed for debugging
      result._metadata = {
        seed: seed,
        model: model,
        timestamp: new Date().toISOString(),
        deterministic: true,
        failedModels: failedModels.length > 0 ? failedModels : undefined,
        failureDetails: failureDetails.length > 0 ? failureDetails : undefined,
        validation: {
          valid: validation.valid,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined
        }
      };
      
      return result;
      
    } catch (error) {
      lastError = (error as Error).message;
      failedModels.push(model);
      failureDetails.push({
        model: model,
        error: (error as Error).message
      });
      console.error(`[AI] ❌ Model ${model} FAILED with exception:`, error);
      console.log(`[AI] 🔄 Trying next fallback model...`);
    }
  }

  // All models failed
  console.error(`[AI] ❌ ALL MODELS FAILED!`);
  console.error(`[AI] ❌ Failed models (${failedModels.length}): ${failedModels.join(', ')}`);
  console.error(`[AI] ❌ Last error: ${lastError}`);
  throw new Error(`AI analysis failed: ${lastError}`);
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
