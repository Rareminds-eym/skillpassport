/**
 * Assessment Analysis Handler
 * Main handler for /analyze-assessment endpoint
 */

import type { PagesEnv } from '../../../../src/functions-lib/types';
import type { AssessmentData, AnalysisResult } from '../types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import { checkRateLimit } from '../../career/utils/rate-limit';
import { getSystemMessage } from '../prompts';
import { buildHighSchoolPrompt as buildCleanHighSchoolPrompt } from '../prompts/high-school-clean';
import { buildMiddleSchoolPrompt } from '../prompts/middle-school';
import { buildHigherSecondaryPrompt } from '../prompts/higher-secondary';
import { buildCollegePrompt } from '../prompts/college';
import { 
  repairAndParseJSON, 
  AI_MODELS, 
  getAPIKeys,
  API_CONFIG,
  callOpenRouterWithRetry
} from '../../shared/ai-config';
import { 
  fetchJobMarketData, 
  generateJobMarketSection, 
  extractCareerCategories 
} from '../services/job-market-data';

interface RequestBody {
  assessmentData: AssessmentData;
}

// AI Models to try (in order of preference) - imported from ai-config
const ASSESSMENT_MODELS = [
  AI_MODELS.GPT_4O_MINI,           // Primary: OpenAI GPT-4o-mini
  AI_MODELS.GPT_4O,                // Fallback 1: OpenAI GPT-4o
  AI_MODELS.GEMINI_2_FLASH,        // Fallback 2: Google Gemini 2.0 Flash
  AI_MODELS.LLAMA_3_2_3B,          // Fallback 3: Meta Llama 3.2 3B (free)
];

// Assessment-specific configuration
const ASSESSMENT_CONFIG = {
  temperature: 0.1,  // Low temperature for consistent, deterministic results
  maxTokens: 32000,  // Increased to handle complete responses with all sections (employability, knowledge, skillGap, roadmap, finalNote)
  maxRetries: API_CONFIG.RETRY.maxRetries,
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
  
  // Track missing fields and type errors
  const missingFieldsList: string[] = [];
  const typeErrorsList: string[] = [];
  
  // Check required fields
  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!result[field]) {
      // Track missing field
      missingFieldsList.push(field);
      
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
  
  console.log(`[ASSESSMENT] === STARTING AI ANALYSIS ===`);
  console.log(`[ASSESSMENT] Grade Level: ${gradeLevel}`);
  
  // ============================================================================
  // STEP 1: Build prompt WITHOUT pre-fetching job market data
  // Let AI determine RIASEC first, then we can fetch targeted data if needed
  // ============================================================================
  
  // Generate deterministic hash for consistent results
  const seed = generateSeed(assessmentData);
  
  // Choose the appropriate prompt based on grade level
  let basePrompt: string;
  
  if (gradeLevel === 'middle') {
    // Grades 6-8: Use middle school prompt
    basePrompt = buildMiddleSchoolPrompt(assessmentData, seed);
    console.log(`[ASSESSMENT] ✅ Using MIDDLE SCHOOL prompt (grades 6-8)`);
  } else if (gradeLevel === 'highschool') {
    // Grades 9-10: Use high school prompt
    basePrompt = buildCleanHighSchoolPrompt(assessmentData, seed);
    console.log(`[ASSESSMENT] ✅ Using HIGH SCHOOL prompt (grades 9-10)`);
  } else if (gradeLevel === 'higher_secondary' || gradeLevel === 'after10') {
    // Grades 11-12: Use higher secondary prompt
    basePrompt = buildHigherSecondaryPrompt(assessmentData, seed);
    console.log(`[ASSESSMENT] ✅ Using HIGHER SECONDARY prompt (grades 11-12)`);
  } else {
    // College/After 12th: Use college prompt
    basePrompt = buildCollegePrompt(assessmentData, seed);
    console.log(`[ASSESSMENT] ✅ Using COLLEGE prompt (after 12th/college)`);
  }
  console.log('[ASSESSMENT] 📊 AI will analyze raw answers and calculate RIASEC scores');
  console.log('[ASSESSMENT] 🎯 Career recommendations will be based on AI-calculated RIASEC');
  console.log('[ASSESSMENT] 📏 Prompt length:', basePrompt.length, 'characters');
  
  const systemMessage = getSystemMessage(gradeLevel);
  console.log('[ASSESSMENT] 📏 System message length:', systemMessage.length, 'characters');

  console.log(`[ASSESSMENT] Using deterministic seed: ${seed} for consistent results`);
  console.log(`[ASSESSMENT] Available models: ${ASSESSMENT_MODELS.length}`);
  console.log(`[ASSESSMENT] Models: ${ASSESSMENT_MODELS.join(', ')}`);

  console.log('[ASSESSMENT] === CHECKING API KEYS ===');
  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    console.error('[ASSESSMENT] ❌ CRITICAL: OpenRouter API key not configured');
    console.error('[ASSESSMENT] ❌ env.OPENROUTER_API_KEY exists:', !!env.OPENROUTER_API_KEY);
    console.error('[ASSESSMENT] ❌ env.OPENROUTER_API_KEY length:', env.OPENROUTER_API_KEY?.length || 0);
    throw new Error('OpenRouter API key not configured');
  }
  console.log('[ASSESSMENT] ✅ OpenRouter API key found, length:', openRouter.length);

  // ============================================================================
  // VALIDATION-BASED MODEL FALLBACK (Requirement 7.4)
  // Track which models have been tried and their failure reasons
  // ============================================================================
  const modelAttempts: Array<{ model: string; error: string; validationErrors?: string[] }> = [];
  let lastError: Error | null = null;

  // Try each model in sequence until one produces valid results
  for (let modelIndex = 0; modelIndex < ASSESSMENT_MODELS.length; modelIndex++) {
    const currentModel = ASSESSMENT_MODELS[modelIndex];
    
    console.log(`\n[ASSESSMENT] 🎯 === TRYING MODEL ${modelIndex + 1}/${ASSESSMENT_MODELS.length} ===`);
    console.log(`[ASSESSMENT] 🎯 Model: ${currentModel}`);
    
    try {
      console.log(`[ASSESSMENT] 📡 Calling OpenRouter API...`);
      console.log(`[ASSESSMENT] 📡 Temperature: ${ASSESSMENT_CONFIG.temperature}`);
      console.log(`[ASSESSMENT] 📡 Max Tokens: ${ASSESSMENT_CONFIG.maxTokens}`);
      console.log(`[ASSESSMENT] 📡 Max Retries: ${ASSESSMENT_CONFIG.maxRetries}`);
      
      // Call OpenRouter with ONLY the current model (no fallback at API level)
      // This ensures we can control validation-based fallback
      const content = await callOpenRouterWithRetry(openRouter, [
        { role: 'system', content: systemMessage },
        { role: 'user', content: basePrompt }
      ], {
        models: [currentModel], // Single model - we handle fallback here
        maxRetries: ASSESSMENT_CONFIG.maxRetries,
        maxTokens: ASSESSMENT_CONFIG.maxTokens,
        temperature: ASSESSMENT_CONFIG.temperature,
      });

      console.log(`[ASSESSMENT] ✅ ${currentModel} - Received response`);
      console.log(`[ASSESSMENT] 📄 Response length: ${content.length} characters`);
      console.log(`[ASSESSMENT] 📄 First 300 chars: ${content.substring(0, 300)}`);
      
      console.log(`[ASSESSMENT] 🔍 Parsing JSON response...`);
      // Parse the JSON response using shared utility (prefer object for assessments)
      const result = repairAndParseJSON(content, true);
      console.log(`[ASSESSMENT] ✅ JSON parsed successfully`);
      console.log(`[ASSESSMENT] 📊 Result keys:`, Object.keys(result).join(', '));
      
      // ============================================================================
      // ADAPTIVE APTITUDE FIX: Override AI's zero scores with pre-calculated scores
      // If adaptive aptitude results exist and AI returned zeros, use pre-calculated scores
      // This fixes the issue where AI ignores pre-calculated scores in the prompt
      // ============================================================================
      console.log('[ASSESSMENT] 🔍 Checking for adaptive aptitude fix...');
      console.log('[ASSESSMENT] 🔍 Has adaptiveAptitudeResults:', !!assessmentData.adaptiveAptitudeResults);
      console.log('[ASSESSMENT] 🔍 Has result.aptitude:', !!result.aptitude);
      console.log('[ASSESSMENT] 🔍 Has result.aptitude.scores:', !!result.aptitude?.scores);
      
      if (assessmentData.adaptiveAptitudeResults && result.aptitude && result.aptitude.scores) {
        const adaptiveResults = assessmentData.adaptiveAptitudeResults;
        const aiScores = result.aptitude.scores;
        
        console.log('[ASSESSMENT] 🔍 AI returned scores:', JSON.stringify(aiScores));
        console.log('[ASSESSMENT] 🔍 Adaptive results:', JSON.stringify(adaptiveResults));
        
        // Check if AI returned all zeros (indicates it ignored pre-calculated scores)
        const allZeros = Object.values(aiScores).every((score: any) => 
          score && score.percentage === 0
        );
        
        console.log('[ASSESSMENT] 🔍 All zeros check:', allZeros);
        
        if (allZeros) {
          console.warn('[ASSESSMENT] ⚠️ AI returned all zero aptitude scores despite adaptive results existing');
          console.log('[ASSESSMENT] 🔧 Applying backend fix: Converting adaptive results to standard format');
          
          // Convert adaptive results to standard format
          // Handle both camelCase (from frontend) and snake_case (from database)
          const accuracyBySubtag = (adaptiveResults as any).accuracyBySubtag || (adaptiveResults as any).accuracy_by_subtag || {};
          
          console.log('[ASSESSMENT] 🔍 accuracyBySubtag keys:', Object.keys(accuracyBySubtag));
          console.log('[ASSESSMENT] 🔍 accuracyBySubtag data:', JSON.stringify(accuracyBySubtag));
          
          // Calculate converted scores
          const verbal = accuracyBySubtag.verbal_reasoning?.accuracy || 0;
          
          // Numerical = average of numerical_reasoning and data_interpretation
          const numericalTotal = (accuracyBySubtag.numerical_reasoning?.total || 0) + 
                                 (accuracyBySubtag.data_interpretation?.total || 0);
          const numericalCorrect = (accuracyBySubtag.numerical_reasoning?.correct || 0) + 
                                   (accuracyBySubtag.data_interpretation?.correct || 0);
          const numerical = numericalTotal > 0 ? (numericalCorrect / numericalTotal * 100) : 0;
          
          // Abstract = average of logical_reasoning and pattern_recognition
          const abstractTotal = (accuracyBySubtag.logical_reasoning?.total || 0) + 
                                (accuracyBySubtag.pattern_recognition?.total || 0);
          const abstractCorrect = (accuracyBySubtag.logical_reasoning?.correct || 0) + 
                                  (accuracyBySubtag.pattern_recognition?.correct || 0);
          const abstract = abstractTotal > 0 ? (abstractCorrect / abstractTotal * 100) : 0;
          
          // Spatial = spatial_reasoning
          const spatial = accuracyBySubtag.spatial_reasoning?.accuracy || 0;
          
          // Override AI's scores with converted scores
          result.aptitude.scores = {
            verbal: {
              total: accuracyBySubtag.verbal_reasoning?.total || 0,
              correct: accuracyBySubtag.verbal_reasoning?.correct || 0,
              percentage: Math.round(verbal)
            },
            numerical: {
              total: numericalTotal,
              correct: numericalCorrect,
              percentage: Math.round(numerical)
            },
            abstract: {
              total: abstractTotal,
              correct: abstractCorrect,
              percentage: Math.round(abstract)
            },
            spatial: {
              total: accuracyBySubtag.spatial_reasoning?.total || 0,
              correct: accuracyBySubtag.spatial_reasoning?.correct || 0,
              percentage: Math.round(spatial)
            },
            clerical: {
              total: 0,
              correct: 0,
              percentage: 0
            }
          };
          
          // Calculate overall aptitude score
          // Handle both camelCase and snake_case
          const totalQuestions = (adaptiveResults as any).totalQuestions || (adaptiveResults as any).total_questions || 0;
          const totalCorrect = (adaptiveResults as any).totalCorrect || (adaptiveResults as any).total_correct || 0;
          result.aptitude.overall = totalQuestions > 0 ? 
            Math.round((totalCorrect / totalQuestions) * 100) : 0;
          
          console.log('[ASSESSMENT] ✅ Backend fix applied successfully');
          console.log('[ASSESSMENT] 📊 Converted scores:', {
            verbal: Math.round(verbal),
            numerical: Math.round(numerical),
            abstract: Math.round(abstract),
            spatial: Math.round(spatial),
            overall: result.aptitude.overall
          });
        } else {
          console.log('[ASSESSMENT] ✅ AI correctly used pre-calculated aptitude scores (not all zeros)');
        }
        
        // ============================================================================
        // ADAPTIVE APTITUDE OVERALL SCORE FIX
        // Even if individual scores are correct, AI sometimes returns overall = 0
        // Always set overall score from adaptive results when available
        // Set both 'overall' and 'overallScore' for compatibility
        // Check BOTH fields since AI might set one but not the other
        // ============================================================================
        const needsOverallFix = result.aptitude && (
          !result.aptitude.overall || 
          result.aptitude.overall === 0 ||
          !result.aptitude.overallScore ||
          result.aptitude.overallScore === 0
        );
        
        if (needsOverallFix) {
          const totalQuestions = (adaptiveResults as any).totalQuestions || (adaptiveResults as any).total_questions || 0;
          const totalCorrect = (adaptiveResults as any).totalCorrect || (adaptiveResults as any).total_correct || 0;
          const calculatedOverall = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
          
          console.log('[ASSESSMENT] 🔧 Fixing overall aptitude score:');
          console.log('[ASSESSMENT]    AI returned overall:', result.aptitude.overall);
          console.log('[ASSESSMENT]    AI returned overallScore:', result.aptitude.overallScore);
          console.log('[ASSESSMENT]    Calculated from adaptive:', calculatedOverall);
          console.log('[ASSESSMENT]    Total questions:', totalQuestions, 'Total correct:', totalCorrect);
          
          // Set both fields for compatibility
          result.aptitude.overall = calculatedOverall;
          result.aptitude.overallScore = calculatedOverall;
          console.log('[ASSESSMENT] ✅ Overall aptitude score fixed to:', calculatedOverall);
          console.log('[ASSESSMENT] ✅ Both overall and overallScore now set to:', calculatedOverall);
        }
      }
      
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
  console.log('[ASSESSMENT-API] === REQUEST RECEIVED ===');
  console.log('[ASSESSMENT-API] Method:', request.method);
  console.log('[ASSESSMENT-API] URL:', request.url);
  
  // Only allow POST
  if (request.method !== 'POST') {
    console.error('[ASSESSMENT-API] ❌ Method not allowed:', request.method);
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Check for development mode
  const isDevelopment = 
    env.VITE_SUPABASE_URL?.includes('localhost') || 
    request.headers.get('X-Dev-Mode') === 'true';

  console.log('[ASSESSMENT-API] Development mode:', isDevelopment);

  let studentId: string;

  // Authentication
  if (isDevelopment) {
    studentId = 'test-student-' + Date.now();
    console.log('[ASSESSMENT-API] [DEV MODE] Bypassing authentication, using test student ID:', studentId);
  } else {
    console.log('[ASSESSMENT-API] Authenticating user...');
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      console.error('[ASSESSMENT-API] ❌ Authentication failed');
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    studentId = auth.user.id;
    console.log('[ASSESSMENT-API] ✅ Authenticated student:', studentId);
  }

  // Rate limiting
  console.log('[ASSESSMENT-API] Checking rate limit for student:', studentId);
  if (!checkRateLimit(studentId)) {
    console.error('[ASSESSMENT-API] ❌ Rate limit exceeded for student:', studentId);
    return jsonResponse({ 
      error: 'Rate limit exceeded. Please try again in a minute.' 
    }, 429);
  }
  console.log('[ASSESSMENT-API] ✅ Rate limit check passed');

  // Parse request body
  let body: RequestBody;
  try {
    console.log('[ASSESSMENT-API] Parsing request body...');
    body = await request.json() as RequestBody;
    console.log('[ASSESSMENT-API] ✅ Request body parsed successfully');
  } catch (error) {
    console.error('[ASSESSMENT-API] ❌ Failed to parse request body:', error);
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    console.error('[ASSESSMENT-API] ❌ assessmentData is missing from request body');
    return jsonResponse({ error: 'assessmentData is required' }, 400);
  }

  console.log('[ASSESSMENT-API] === ASSESSMENT DATA RECEIVED ===');
  console.log('[ASSESSMENT-API] Student ID:', studentId);
  console.log('[ASSESSMENT-API] Stream:', assessmentData.stream);
  console.log('[ASSESSMENT-API] Grade Level:', assessmentData.gradeLevel);
  console.log('[ASSESSMENT-API] Has Student Context:', !!assessmentData.studentContext);
  if (assessmentData.studentContext) {
    console.log('[ASSESSMENT-API] Student Context:', {
      rawGrade: assessmentData.studentContext.rawGrade,
      programName: assessmentData.studentContext.programName,
      programCode: assessmentData.studentContext.programCode,
      degreeLevel: assessmentData.studentContext.degreeLevel
    });
  }
  console.log('[ASSESSMENT-API] Has Adaptive Results:', !!assessmentData.adaptiveAptitudeResults);

  // Check environment variables
  console.log('[ASSESSMENT-API] === ENVIRONMENT CHECK ===');
  console.log('[ASSESSMENT-API] OPENROUTER_API_KEY exists:', !!env.OPENROUTER_API_KEY);
  console.log('[ASSESSMENT-API] OPENROUTER_API_KEY length:', env.OPENROUTER_API_KEY?.length || 0);
  console.log('[ASSESSMENT-API] GEMINI_API_KEY exists:', !!env.GEMINI_API_KEY);
  console.log('[ASSESSMENT-API] CLAUDE_API_KEY exists:', !!env.CLAUDE_API_KEY);

  try {
    console.log('[ASSESSMENT-API] === STARTING AI ANALYSIS ===');
    // Analyze with AI
    const results = await analyzeAssessment(env, assessmentData);

    console.log('[ASSESSMENT-API] === AI ANALYSIS COMPLETED ===');
    console.log('[ASSESSMENT-API] ✅ Successfully analyzed for student:', studentId);
    console.log('[ASSESSMENT-API] Results has careerFit:', !!results?.careerFit);
    console.log('[ASSESSMENT-API] Results has riasec:', !!results?.riasec);
    // ============================================================================
    // PRESERVE ADAPTIVE APTITUDE RESULTS
    // Add adaptive results to the response so they're saved in the database
    // ============================================================================
    if (assessmentData.adaptiveAptitudeResults) {
      console.log('[ASSESSMENT] ✅ Including adaptive aptitude results in response');
      console.log('[ASSESSMENT] Adaptive level:', assessmentData.adaptiveAptitudeResults.aptitudeLevel);
      console.log('[ASSESSMENT] Adaptive accuracy:', assessmentData.adaptiveAptitudeResults.overallAccuracy);
      
      results.adaptiveAptitudeResults = assessmentData.adaptiveAptitudeResults;
    } else {
      console.log('[ASSESSMENT] ℹ️ No adaptive aptitude results to include');
    }

    console.log(`[ASSESSMENT] Successfully analyzed for student ${studentId}`);
    
    const response: AnalysisResult = {
      success: true,
      data: results
    };

    console.log('[ASSESSMENT-API] === RETURNING SUCCESS RESPONSE ===');
    return jsonResponse(response);

  } catch (error) {
    console.error('[ASSESSMENT-API] === AI ANALYSIS FAILED ===');
    console.error('[ASSESSMENT-API] ❌ Error type:', error?.constructor?.name);
    console.error('[ASSESSMENT-API] ❌ Error message:', (error as Error).message);
    console.error('[ASSESSMENT-API] ❌ Error stack:', (error as Error).stack);
    
    const response: AnalysisResult = {
      success: false,
      error: 'Assessment analysis failed',
      details: (error as Error).message
    };

    console.log('[ASSESSMENT-API] === RETURNING ERROR RESPONSE ===');
    return jsonResponse(response, 500);
  }
}
