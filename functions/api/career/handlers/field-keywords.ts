/**
 * Generate Field Keywords Handler - AI-generated domain keywords for fields of study
 * 
 * Features:
 * - Dynamic keyword generation using centralized AI config
 * - Comprehensive domain coverage
 * - Automatic retry and fallback
 * 
 * Source: cloudflare-workers/career-api/src/index.ts (handleGenerateFieldKeywords)
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { getOpenRouterKey } from '../[[path]]';
import { getModelForUseCase, callOpenRouterWithRetry } from '../../shared/ai-config';

export async function handleGenerateFieldKeywords(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: { field: string };
  try {
    body = await request.json() as { field: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { field } = body;

  if (!field || typeof field !== 'string' || field.trim().length === 0) {
    return jsonResponse({ error: 'Field is required' }, 400);
  }

  const fieldTrimmed = field.trim();

  try {
    console.log(`[Field Keywords] Generating for: "${fieldTrimmed}"`);

    const openRouterKey = getOpenRouterKey(env);
    if (!openRouterKey) {
      return jsonResponse({
        error: 'OpenRouter API key not configured',
        useFallback: true
      }, 500);
    }

    // Use centralized AI call with automatic retry and fallback
    const keywords = await callOpenRouterWithRetry(
      openRouterKey,
      [
        {
          role: 'system',
          content: 'You are an education domain expert. Generate a comprehensive list of relevant course domain keywords for a given field of study. Return ONLY a comma-separated list of ALL possible keywords, no explanations.'
        },
        {
          role: 'user',
          content: `Field of Study: "${fieldTrimmed}"\n\nGenerate a comprehensive list of ALL possible domain keywords that represent this field. Include:\n1. Core subjects and topics\n2. Technical skills and competencies\n3. Industry-specific tools and technologies\n4. Career domains and job roles\n5. Related disciplines and specializations\n6. Soft skills relevant to this field\n7. Certifications and qualifications\n8. Industry terminology\n\nBe thorough and comprehensive. Return ONLY the comma-separated keywords, nothing else.`
        }
      ],
      {
        models: [getModelForUseCase('keyword_generation')],
        maxRetries: 3,
        maxTokens: 500,
        temperature: 0.3
      }
    );

    if (!keywords) {
      console.warn(`[Field Keywords] No keywords generated for "${fieldTrimmed}"`);
      return jsonResponse({
        error: 'No keywords generated',
        useFallback: true
      }, 500);
    }

    console.log(`[Field Keywords] ✓ Generated for "${fieldTrimmed}": ${keywords}`);

    return jsonResponse({
      success: true,
      field: fieldTrimmed,
      keywords,
      source: 'ai',
      model: getModelForUseCase('keyword_generation')
    });

  } catch (error) {
    console.error(`[Field Keywords] Error for "${fieldTrimmed}":`, error);
    return jsonResponse({
      error: (error as Error).message,
      useFallback: true
    }, 500);
  }
}
