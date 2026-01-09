/**
 * Adaptive Assessment - Single Question Handler
 * Generates a single question for dynamic adaptive testing
 */

import type { Env, AdaptiveQuestion, DifficultyLevel, Subtag, TestPhase } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { generateQuestionId } from '../../utils/uuid';
import { parseAIArrayResponse } from '../../utils/jsonParser';
import { getAdaptiveCachedQuestions, cacheAdaptiveQuestions } from '../../services/cacheService';
import { callOpenRouterForAdaptive } from '../../services/openRouterService';
import { buildAdaptiveSystemPrompt, buildAdaptiveUserPrompt } from '../../prompts/adaptive';

type GradeLevel = 'middle_school' | 'high_school';

interface SingleRequestBody {
  gradeLevel: GradeLevel;
  phase?: TestPhase;
  difficulty: DifficultyLevel;
  subtag: Subtag;
  excludeQuestionIds?: string[];
}

export async function handleSingleGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as SingleRequestBody;
    const { gradeLevel, phase = 'adaptive_core', difficulty, subtag, excludeQuestionIds = [] } = body;

    if (!gradeLevel || !difficulty || !subtag) {
      return errorResponse('gradeLevel, difficulty, and subtag are required', 400);
    }

    const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      return errorResponse('API key not configured', 500);
    }

    // Try cache first
    const cached = await getAdaptiveCachedQuestions(
      env, gradeLevel, phase, difficulty, subtag, 1, excludeQuestionIds
    );

    if (cached.length > 0) {
      return jsonResponse({
        questions: cached,
        fromCache: true,
        generatedCount: 0,
        cachedCount: 1,
      });
    }

    // Generate new question
    const systemPrompt = buildAdaptiveSystemPrompt(gradeLevel);
    const userPrompt = buildAdaptiveUserPrompt([{ difficulty, subtag }], gradeLevel);

    const content = await callOpenRouterForAdaptive(apiKey, systemPrompt, userPrompt);
    const rawQuestions = parseAIArrayResponse(content);

    const generated: AdaptiveQuestion[] = rawQuestions.map((raw: any) => ({
      id: generateQuestionId(gradeLevel, phase, difficulty, subtag),
      text: raw.text,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      difficulty,
      subtag,
      gradeLevel,
      phase,
      explanation: raw.explanation,
      createdAt: new Date().toISOString(),
    }));

    // Cache generated questions
    if (generated.length > 0) {
      await cacheAdaptiveQuestions(env, generated);
    }

    return jsonResponse({
      questions: generated,
      fromCache: false,
      generatedCount: generated.length,
      cachedCount: 0,
    });
  } catch (error: any) {
    console.error('❌ Error generating single question:', error);
    return errorResponse(error.message || 'Failed to generate question', 500);
  }
}
