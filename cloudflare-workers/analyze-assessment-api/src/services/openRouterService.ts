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
  'google/gemini-2.0-flash-exp:free',  // Google's Gemini 2.0 - free, fast, 1M context
  'google/gemini-flash-1.5-8b',        // Gemini 1.5 Flash 8B - fast and efficient
  'anthropic/claude-3.5-sonnet',       // Claude 3.5 Sonnet - best quality (paid)
  'xiaomi/mimo-v2-flash:free'          // Fallback: Xiaomi's free model
];

// Configuration
const AI_CONFIG = {
  temperature: 0.1,  // Low temperature for consistent, deterministic results
  maxTokens: 20000,  // Increased from 16000 to ensure streamRecommendation is not truncated
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
  userPrompt: string
): Promise<Response> {
  const openRouterKey = getOpenRouterKey(env);
  if (!openRouterKey) {
    throw new Error('OpenRouter API key not configured');
  }

  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.VITE_SUPABASE_URL || 'https://skillpassport.rareminds.in',
      'X-Title': 'SkillPassport Assessment Analyzer'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens
    })
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

  let lastError = '';

  // Try each model until one succeeds
  for (const model of AI_MODELS) {
    console.log(`[AI] Trying model: ${model}`);
    
    try {
      const response = await callOpenRouter(env, model, systemMessage, prompt);
      
      if (!response.ok) {
        const errorText = await response.text();
        lastError = errorText;
        console.error(`[AI] Model ${model} failed:`, response.status, errorText);
        continue;
      }

      const data = await response.json() as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        lastError = 'Empty response from AI';
        console.error(`[AI] Model ${model} returned empty content`);
        continue;
      }

      console.log(`[AI] Success with model: ${model}`);
      
      // Parse and return the JSON response
      const result = extractJsonFromResponse(content);
      
      // Validate required fields for after10 students
      if (assessmentData.gradeLevel === 'after10') {
        if (!result.streamRecommendation?.recommendedStream || 
            result.streamRecommendation.recommendedStream === 'N/A') {
          console.error('[AI] Missing streamRecommendation for after10 student!');
          console.error('[AI] Result keys:', Object.keys(result));
          console.error('[AI] streamRecommendation:', result.streamRecommendation);
          throw new Error('AI response missing required streamRecommendation field for after10 student');
        }
        console.log('[AI] ✅ streamRecommendation validated:', result.streamRecommendation.recommendedStream);
      }
      
      return result;
      
    } catch (error) {
      lastError = (error as Error).message;
      console.error(`[AI] Model ${model} error:`, error);
    }
  }

  // All models failed
  throw new Error(`AI analysis failed: ${lastError}`);
}
