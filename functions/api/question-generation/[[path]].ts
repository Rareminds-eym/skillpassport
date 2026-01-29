/**
 * Question Generation API - Cloudflare Pages Function
 * 
 * Unified API that merges functionality from:
 * - assessment-api (career aptitude/knowledge questions)
 * - adaptive-aptitude-api (adaptive test questions)
 * 
 * Endpoints:
 * - GET /health - Health check
 * - POST /career-assessment/generate-aptitude - Generate 50 aptitude questions
 * - POST /career-assessment/generate-knowledge - Generate 20 knowledge questions
 * - POST /generate - Generate course-specific assessment questions
 * - POST /generate/diagnostic - Generate 6 diagnostic screener questions
 * - POST /generate/adaptive - Generate 8-11 adaptive core questions
 * - POST /generate/stability - Generate 4-6 stability confirmation questions
 * - POST /generate/single - Generate a single adaptive question
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';

import { generateAptitudeQuestions } from './handlers/career-aptitude';
import { generateKnowledgeQuestions } from './handlers/career-knowledge';
import {
  generateDiagnosticScreenerQuestions,
  generateAdaptiveCoreQuestions,
  generateStabilityConfirmationQuestions,
  generateSingleQuestion
} from './handlers/adaptive';
import { generateAssessment } from './handlers/course-assessment';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  // Validate critical environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // console.error('❌ Missing Supabase environment variables');
    // Silent check - errors will be thrown by handlers if actually needed and missing
  }

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
  const path = url.pathname.replace('/api/question-generation', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'question-generation-api',
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
          hasSupabaseKey: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
          hasOpenRouter: !!(env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY)
        }
      });
    }

    // Career Assessment Endpoints
    if (path === '/career-assessment/generate-aptitude' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { streamId, questionsPerCategory = 5, studentId, attemptId, gradeLevel } = body;

        if (!streamId) {
          return jsonResponse({ error: 'Stream ID is required' }, 400);
        }

        const result = await generateAptitudeQuestions(env, streamId, questionsPerCategory, studentId, attemptId, gradeLevel);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Aptitude generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate aptitude questions' }, 500);
      }
    }

    if (path === '/career-assessment/generate-aptitude/stream' && request.method === 'POST') {
      return jsonResponse(
        {
          error: 'Not implemented',
          message: 'Streaming aptitude generation not yet implemented. See README.md for details.',
        },
        501
      );
    }

    if (path === '/career-assessment/generate-knowledge' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { streamId, streamName, topics, questionCount = 20, studentId, attemptId, gradeLevel } = body;

        if (!streamId || !streamName || !topics) {
          return jsonResponse({ error: 'Stream ID, name, and topics are required' }, 400);
        }

        const result = await generateKnowledgeQuestions(env, streamId, streamName, topics, questionCount, studentId, attemptId, gradeLevel);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Knowledge generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate knowledge questions' }, 500);
      }
    }

    // --- Adaptive Assessment Endpoints ---

    if (path === '/generate/diagnostic' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, excludeQuestionIds, excludeQuestionTexts } = body;
        const result = await generateDiagnosticScreenerQuestions(env, gradeLevel, excludeQuestionIds, excludeQuestionTexts);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Diagnostic generation error:', error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (path === '/generate/adaptive' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, startingDifficulty, count, excludeQuestionIds, excludeQuestionTexts } = body;
        const result = await generateAdaptiveCoreQuestions(env, gradeLevel, startingDifficulty, count, excludeQuestionIds, excludeQuestionTexts);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Adaptive generation error:', error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (path === '/generate/stability' && request.method === 'POST') {
      return jsonResponse(
        {
          error: 'Not implemented',
          message: 'Stability confirmation generation not yet implemented. See README.md for details.',
        },
        501
      );
    }

    if (path === '/generate/single' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, phase, difficulty, subtag, excludeQuestionIds } = body;
        const result = await generateSingleQuestion(env, gradeLevel, phase, difficulty, subtag, excludeQuestionIds);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Single question generation error:', error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Unknown endpoint',
        availableEndpoints: [
          'GET /health - Health check',
          'POST /career-assessment/generate-aptitude - Generate 50 aptitude questions',
          'POST /career-assessment/generate-knowledge - Generate 20 knowledge questions',
          'POST /generate - Generate course-specific assessment',
          'POST /generate/diagnostic - Generate diagnostic screener',
          'POST /generate/adaptive - Generate adaptive core questions',
          'POST /generate/stability - Generate stability confirmation',
          'POST /generate/single - Generate single question',
        ],
      },
      404
    );
  } catch (error: any) {
    console.error('❌ Error in question-generation-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
