/**
 * Question Bank API - Cloudflare Pages Function
 *
 * Thin HTTP routing layer that delegates to core.ts functions.
 * This keeps the external HTTP API working (health check, etc.)
 * while the core logic can also be imported directly by other handlers.
 *
 * Endpoints:
 * - GET  /health                 - Health check
 * - POST /generate/diagnostic    - 8 diagnostic screener questions (difficulty 3)
 * - POST /generate/adaptive      - Adaptive core questions at given difficulty
 * - POST /generate/stability     - Stability confirmation at provisional band ±1
 * - POST /generate/single        - Single question at given difficulty + subtag
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import { createSupabaseAdminClient } from '../../../src/functions-lib/supabase';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import {
  fetchDiagnosticQuestions,
  fetchAdaptiveQuestions,
  fetchStabilityQuestions,
  fetchSingleQuestion,
  getQuestionCount,
  type GradeLevel,
  type DifficultyLevel,
  type Subtag,
} from './core';

// ─── Router ─────────────────────────────────────────────────────────────────

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/question-bank', '');

  try {
    if (path === '/health' && request.method === 'GET') {
      const supabase = createSupabaseAdminClient(env);
      const questionCount = await getQuestionCount(supabase);

      return jsonResponse({
        status: 'ok',
        service: 'question-bank-api',
        source: 'database',
        questionCount,
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const supabase = createSupabaseAdminClient(env);
    const body = (await request.json()) as Record<string, unknown>;

    if (!body.gradeLevel) {
      return jsonResponse({ error: 'Missing required field: gradeLevel' }, 400);
    }

    const validGradeLevels: GradeLevel[] = ['middle_school', 'high_school', 'higher_secondary'];
    if (!validGradeLevels.includes(body.gradeLevel as GradeLevel)) {
      return jsonResponse(
        { error: 'Invalid gradeLevel. Must be one of: middle_school, high_school, higher_secondary' },
        400,
      );
    }

    if (path === '/generate/diagnostic') {
      const result = await fetchDiagnosticQuestions(supabase, {
        gradeLevel: body.gradeLevel as GradeLevel,
        studentGrade: body.studentGrade as string | undefined,
        excludeQuestionIds: body.excludeQuestionIds as string[] | undefined,
      });
      return jsonResponse(result);
    }

    if (path === '/generate/adaptive') {
      const result = await fetchAdaptiveQuestions(supabase, {
        gradeLevel: body.gradeLevel as GradeLevel,
        startingDifficulty: body.startingDifficulty as DifficultyLevel | undefined,
        difficulty: body.difficulty as DifficultyLevel | undefined,
        count: body.count as number | undefined,
        excludeQuestionIds: body.excludeQuestionIds as string[] | undefined,
        studentGrade: body.studentGrade as string | undefined,
      });
      return jsonResponse(result);
    }

    if (path === '/generate/stability') {
      const result = await fetchStabilityQuestions(supabase, {
        gradeLevel: body.gradeLevel as GradeLevel,
        provisionalBand: body.provisionalBand as DifficultyLevel | undefined,
        difficulty: body.difficulty as DifficultyLevel | undefined,
        count: body.count as number | undefined,
        excludeQuestionIds: body.excludeQuestionIds as string[] | undefined,
        studentGrade: body.studentGrade as string | undefined,
      });
      return jsonResponse(result);
    }

    if (path === '/generate/single') {
      const result = await fetchSingleQuestion(supabase, {
        gradeLevel: body.gradeLevel as GradeLevel,
        difficulty: body.difficulty as DifficultyLevel | undefined,
        subtag: body.subtag as Subtag | undefined,
        excludeQuestionIds: body.excludeQuestionIds as string[] | undefined,
        studentGrade: body.studentGrade as string | undefined,
      });
      return jsonResponse(result);
    }

    return jsonResponse(
      {
        error: 'Not found',
        availableEndpoints: [
          'GET  /health',
          'POST /generate/diagnostic',
          'POST /generate/adaptive',
          'POST /generate/stability',
          'POST /generate/single',
        ],
      },
      404,
    );
  } catch (error) {
    console.error('[QuestionBank] Error:', error);
    return jsonResponse(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown' },
      500,
    );
  }
};
