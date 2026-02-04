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
 * - POST /generate/diagnostic - Generate 8 diagnostic screener questions
 * - POST /generate/adaptive - Generate adaptive core questions (dynamic count)
 * - POST /generate/stability - Generate 6 stability confirmation questions
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
import { handleStreamingAptitude } from './handlers/streaming';

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
          hasOpenRouter: !!(env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY)
        }
      });
    }

    // Career Assessment Endpoints
    if (path === '/career-assessment/generate-aptitude' && request.method === 'POST') {
      console.log('🧠 ============================================');
      console.log('🧠 ENDPOINT HIT: /career-assessment/generate-aptitude');
      console.log('🧠 ============================================');
      try {
        const body = await request.json() as any;
        console.log('📥 Request body:', JSON.stringify(body, null, 2));
        const { streamId, questionsPerCategory = 5, studentId, attemptId, gradeLevel } = body;

        if (!streamId) {
          console.error('❌ Missing streamId in request');
          return jsonResponse({ error: 'Stream ID is required' }, 400);
        }

        const result = await generateAptitudeQuestions(env, streamId, questionsPerCategory, studentId, attemptId, gradeLevel);
        console.log(`✅ Aptitude generation complete: ${result?.length || 0} questions`);
        // Wrap in {questions: [...]} format for frontend compatibility
        return jsonResponse({ questions: result });
      } catch (error: any) {
        console.error('❌ Aptitude generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate aptitude questions' }, 500);
      }
    }

    if (path === '/career-assessment/generate-aptitude/stream' && request.method === 'POST') {
      try {
        return await handleStreamingAptitude(request, env);
      } catch (error: any) {
        console.error('❌ Streaming aptitude error:', error);
        return jsonResponse({ error: error.message || 'Failed to stream aptitude questions' }, 500);
      }
    }

    if (path === '/career-assessment/generate-knowledge' && request.method === 'POST') {
      console.log('🎓 ============================================');
      console.log('🎓 ENDPOINT HIT: /career-assessment/generate-knowledge');
      console.log('🎓 ============================================');
      try {
        const body = await request.json() as any;
        console.log('📥 Request body:', JSON.stringify(body, null, 2));
        const { streamId, streamName, topics, questionCount = 20, studentId, attemptId, gradeLevel } = body;

        if (!streamId || !streamName || !topics) {
          console.error('❌ Missing required fields:', { streamId, streamName, topics });
          return jsonResponse({ error: 'Stream ID, name, and topics are required' }, 400);
        }

        const result = await generateKnowledgeQuestions(env, streamId, streamName, topics, questionCount, studentId, attemptId, gradeLevel);
        console.log(`✅ Knowledge generation complete: ${result?.length || 0} questions`);
        // Wrap in {questions: [...]} format for frontend compatibility
        return jsonResponse({ questions: result });
      } catch (error: any) {
        console.error('❌ Knowledge generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate knowledge questions' }, 500);
      }
    }

    // --- Adaptive Assessment Endpoints ---

    if (path === '/generate' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { courseName, level, questionCount = 10 } = body;

        if (!courseName || !level) {
          return jsonResponse({ error: 'Course name and level are required' }, 400);
        }

        const result = await generateAssessment(env, courseName, level, questionCount);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Course assessment generation error:', error);
        return jsonResponse({ error: error.message || 'Failed to generate course assessment' }, 500);
      }
    }

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
      try {
        const body = await request.json() as any;
        const { gradeLevel, provisionalBand, count, excludeQuestionIds, excludeQuestionTexts } = body;
        const result = await generateStabilityConfirmationQuestions(env, gradeLevel, provisionalBand, count, excludeQuestionIds, excludeQuestionTexts);
        return jsonResponse(result);
      } catch (error: any) {
        console.error('❌ Stability generation error:', error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (path === '/generate/single' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, phase, difficulty, subtag, excludeQuestionIds, excludeQuestionTexts } = body;
        const result = await generateSingleQuestion(env, gradeLevel, phase, difficulty, subtag, excludeQuestionIds, excludeQuestionTexts);
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
          'POST /career-assessment/generate-aptitude/stream - Stream aptitude questions with SSE',
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
