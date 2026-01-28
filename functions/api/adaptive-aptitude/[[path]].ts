/**
 * Adaptive Aptitude API - Cloudflare Pages Function
 * 
 * Generates adaptive aptitude test questions using AI (OpenRouter).
 * Handles question generation for all test phases with caching support.
 * 
 * Endpoints:
 * - POST /generate - Generate questions based on options
 * - POST /generate/diagnostic - Generate diagnostic screener questions
 * - POST /generate/adaptive - Generate adaptive core questions
 * - POST /generate/stability - Generate stability confirmation questions
 * - POST /generate/single - Generate single question
 * - GET /health - Health check
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { jsonResponse } from '../../../src/functions-lib/response';
import { createSupabaseClient } from '../../../src/functions-lib/supabase';
import type { PagesEnv } from '../../../src/functions-lib/types';
import {
  generateDiagnosticScreenerQuestions,
  generateAdaptiveCoreQuestions,
  generateStabilityConfirmationQuestions,
  generateSingleQuestion,
} from './handlers/generate';
import type { QuestionGenerationOptions } from './types';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
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
  const path = url.pathname.replace('/api/adaptive-aptitude', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'adaptive-aptitude-api',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate diagnostic screener questions
    if (path === '/generate/diagnostic' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const { gradeLevel, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

      if (!gradeLevel || !['middle_school', 'high_school', 'higher_secondary'].includes(gradeLevel)) {
        return jsonResponse(
          { error: 'Valid gradeLevel is required (middle_school, high_school, or higher_secondary)' },
          400
        );
      }

      const result = await generateDiagnosticScreenerQuestions(
        env,
        gradeLevel,
        excludeQuestionIds,
        excludeQuestionTexts
      );
      return jsonResponse(result);
    }

    // Generate adaptive core questions
    if (path === '/generate/adaptive' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const {
        gradeLevel,
        startingDifficulty = 3,
        count = 10,
        excludeQuestionIds = [],
        excludeQuestionTexts = [],
      } = body;

      if (!gradeLevel || !['middle_school', 'high_school', 'higher_secondary'].includes(gradeLevel)) {
        return jsonResponse(
          { error: 'Valid gradeLevel is required (middle_school, high_school, or higher_secondary)' },
          400
        );
      }

      const result = await generateAdaptiveCoreQuestions(
        env,
        gradeLevel,
        startingDifficulty,
        count,
        excludeQuestionIds,
        excludeQuestionTexts
      );
      return jsonResponse(result);
    }

    // Generate stability confirmation questions
    if (path === '/generate/stability' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const {
        gradeLevel,
        provisionalBand = 3,
        count = 4,
        excludeQuestionIds = [],
        excludeQuestionTexts = [],
      } = body;

      if (!gradeLevel || !['middle_school', 'high_school', 'higher_secondary'].includes(gradeLevel)) {
        return jsonResponse(
          { error: 'Valid gradeLevel is required (middle_school, high_school, or higher_secondary)' },
          400
        );
      }

      const result = await generateStabilityConfirmationQuestions(
        env,
        gradeLevel,
        provisionalBand,
        count,
        excludeQuestionIds,
        excludeQuestionTexts
      );
      return jsonResponse(result);
    }

    // Single question generation
    if (path === '/generate/single' && request.method === 'POST') {
      const body = (await request.json()) as any;
      const { gradeLevel, phase, difficulty, subtag, excludeQuestionIds = [] } = body;

      if (!gradeLevel || !difficulty || !subtag) {
        return jsonResponse({ error: 'gradeLevel, difficulty, and subtag are required' }, 400);
      }

      const result = await generateSingleQuestion(
        env,
        gradeLevel,
        phase || 'adaptive_core',
        difficulty,
        subtag,
        excludeQuestionIds
      );
      return jsonResponse(result);
    }

    // Generic generate endpoint
    if (path === '/generate' && request.method === 'POST') {
      const body = (await request.json()) as QuestionGenerationOptions;
      const { gradeLevel, phase, difficulty, subtag, count = 1, excludeQuestionIds = [] } = body;

      if (!gradeLevel || !['middle_school', 'high_school', 'higher_secondary'].includes(gradeLevel)) {
        return jsonResponse({ error: 'Valid gradeLevel is required' }, 400);
      }

      if (!phase || !['diagnostic_screener', 'adaptive_core', 'stability_confirmation'].includes(phase)) {
        return jsonResponse({ error: 'Valid phase is required' }, 400);
      }

      let result;

      switch (phase) {
        case 'diagnostic_screener':
          result = await generateDiagnosticScreenerQuestions(env, gradeLevel, excludeQuestionIds);
          break;
        case 'adaptive_core':
          result = await generateAdaptiveCoreQuestions(
            env,
            gradeLevel,
            difficulty || 3,
            count,
            excludeQuestionIds
          );
          break;
        case 'stability_confirmation':
          result = await generateStabilityConfirmationQuestions(
            env,
            gradeLevel,
            difficulty || 3,
            count,
            excludeQuestionIds
          );
          break;
        default:
          return jsonResponse({ error: 'Invalid phase' }, 400);
      }

      return jsonResponse(result);
    }

    // 404 for unknown routes
    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error: any) {
    console.error('❌ Error in adaptive-aptitude-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
