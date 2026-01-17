/**
 * OpenRouter AI Service
 * Handles communication with OpenRouter API
 */

import type { Env, AssessmentData } from '../types';
import { getOpenRouterKey } from '../utils/auth';
import { extractJsonFromResponse } from '../utils/jsonParser';
import { buildAnalysisPrompt, getSystemMessage } from '../prompts';

// AI Models to try (in order of preference)
const AI_MODELS = [
  'anthropic/claude-3.5-sonnet',       // Claude 3.5 Sonnet - best quality, truly deterministic (paid)
  'google/gemini-2.0-flash-exp:free',  // Google's Gemini 2.0 - free, fast, 1M context
  'google/gemma-3-4b-it:free',         // Google Gemma 3 4B - free, reliable
  'xiaomi/mimo-v2-flash:free'          // Fallback: Xiaomi's free model
];

// Configuration
const AI_CONFIG = {
  temperature: 0.1,  // Low temperature for consistent, deterministic results
  maxTokens: 16000,  // Increased from 8000 to handle complete responses
};

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Call OpenRouter API with the given model
 */
async function callOpenRouter(
  env: Env,
  model: string,
  systemMessage: string,
  userPrompt: string,
  seed?: number
): Promise<Response> {
  const openRouterKey = getOpenRouterKey(env);
  if (!openRouterKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const requestBody: any = {
    model,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ],
    temperature: AI_CONFIG.temperature,
    max_tokens: AI_CONFIG.maxTokens
  };

  // Add seed for deterministic results (same input = same output)
  if (seed !== undefined) {
    requestBody.seed = seed;
  }

  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.VITE_SUPABASE_URL || 'https://skillpassport.rareminds.in',
      'X-Title': 'SkillPassport Assessment Analyzer'
    },
    body: JSON.stringify(requestBody)
  });
}

/**
 * Analyze assessment data using OpenRouter AI
 */
export async function analyzeAssessment(
  env: Env,
  assessmentData: AssessmentData
): Promise<any> {
  const gradeLevel = assessmentData.gradeLevel || 'after12';
  const prompt = buildAnalysisPrompt(assessmentData);
  const systemMessage = getSystemMessage(gradeLevel);

  // Generate deterministic seed from assessment data
  // This ensures same input always produces same output
  const generateSeed = (data: AssessmentData): number => {
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
  };

  const seed = generateSeed(assessmentData);
  console.log(`[AI] Using deterministic seed: ${seed} for consistent results`);
  console.log(`[AI] Seed will be included in API request for deterministic results`);

  let lastError = '';
  const failedModels: string[] = [];
  const failureDetails: Array<{model: string, status?: number, error: string}> = [];

  // Try each model until one succeeds
  for (const model of AI_MODELS) {
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

      const data = await response.json() as OpenRouterResponse;
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
      
      // Parse the JSON response
      const result = extractJsonFromResponse(content);
      
      // Add metadata including seed for debugging
      result._metadata = {
        seed: seed,
        model: model,
        timestamp: new Date().toISOString(),
        deterministic: true,
        failedModels: failedModels.length > 0 ? failedModels : undefined,
        failureDetails: failureDetails.length > 0 ? failureDetails : undefined
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
