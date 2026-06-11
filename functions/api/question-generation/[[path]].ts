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

import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

import { generateAptitudeQuestions } from './handlers/career-aptitude';
import { generateKnowledgeQuestions } from './handlers/career-knowledge';
import {
  generateDiagnosticScreenerQuestions,
  generateAdaptiveCoreQuestions,
  generateStabilityConfirmationQuestions,
  generateSingleQuestion
} from './handlers/adaptive-bank';
import { generateAssessment } from './handlers/course-assessment';
import { handleStreamingAptitude } from './handlers/streaming';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  let { request, env }: { request: Request; env: Record<string, string> } = context as any;

  // Validate critical environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // Silent check - errors will be thrown by handlers if actually needed and missing
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/question-generation', '');

  try {
    // Health check
    if (path === '/health' && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'question-generation-api',
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
          hasSupabaseKey: !!(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
          hasOpenRouter: !!(env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY)
        }
      }, request);
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      env = authContext.env as Record<string, string>;
      request = authContext.request;

    // Career Assessment Endpoints
    if (path === '/career-assessment/generate-aptitude' && request.method === 'POST') {
      console.log('🧠 ============================================');
      console.log('🧠 ENDPOINT HIT: /career-assessment/generate-aptitude');
      console.log('🧠 ============================================');
      try {
        const body = await request.json() as any;
        console.log('📥 Request body:', JSON.stringify(body, null, 2));
        const { streamId, questionsPerCategory = 5, learnerId, attemptId, gradeLevel } = body;

        if (!streamId) {
          console.error('❌ Missing streamId in request');
          return apiError(400, 'VALIDATION_ERROR', 'Stream ID is required', request);
        }

        const result = await generateAptitudeQuestions(env as unknown as PagesEnv, streamId, questionsPerCategory, learnerId, attemptId, gradeLevel);
        console.log(`✅ Aptitude generation complete: ${result?.length || 0} questions`);
        // Wrap in {questions: [...]} format for frontend compatibility
        return apiSuccess({ questions: result }, request);
      } catch (error: any) {
        console.error('❌ Aptitude generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to generate aptitude questions', request);
      }
    }

    if (path === '/career-assessment/generate-aptitude/stream' && request.method === 'POST') {
      try {
        return await handleStreamingAptitude(request, env as unknown as PagesEnv);
      } catch (error: any) {
        console.error('❌ Streaming aptitude error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to stream aptitude questions', request);
      }
    }

    if (path === '/career-assessment/generate-knowledge' && request.method === 'POST') {
      console.log('🎓 ============================================');
      console.log('🎓 ENDPOINT HIT: /career-assessment/generate-knowledge');
      console.log('🎓 ============================================');
      try {
        const body = await request.json() as any;
        console.log('📥 Request body:', JSON.stringify(body, null, 2));
        const { streamId, streamName, topics, questionCount = 20, learnerId, attemptId, gradeLevel, isCollegeLearner } = body;

        // For college learners and higher secondary (11th/12th), topics can be null (AI will determine dynamically)
        const usesDynamicTopics = isCollegeLearner || gradeLevel === 'higher_secondary';
        
        if (!streamId || !streamName) {
          console.error('❌ Missing required fields:', { streamId, streamName });
          return apiError(400, 'VALIDATION_ERROR', 'Stream ID and name are required', request);
        }
        
        // Topics are optional for college learners and 11th/12th learners
        if (!usesDynamicTopics && !topics) {
          console.error('❌ Topics required for non-college/non-higher-secondary learners');
          return apiError(400, 'VALIDATION_ERROR', 'Topics are required for learners below 11th grade', request);
        }

        const result = await generateKnowledgeQuestions(env as unknown as PagesEnv, streamId, streamName, topics, questionCount, learnerId, attemptId, gradeLevel, isCollegeLearner);
        console.log(`✅ Knowledge generation complete: ${result?.length || 0} questions`);
        // Wrap in {questions: [...]} format for frontend compatibility
        return apiSuccess({ questions: result }, request);
      } catch (error: any) {
        console.error('❌ Knowledge generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to generate knowledge questions', request);
      }
    }

    // --- Adaptive Assessment Endpoints ---

    if (path === '/generate' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { courseName, level, questionCount = 10 } = body;

        if (!courseName || !level) {
          return apiError(400, 'VALIDATION_ERROR', 'Course name and level are required', request);
        }

        const result = await generateAssessment(env as unknown as PagesEnv, courseName, level, questionCount);
        return apiSuccess(result, request);
      } catch (error: any) {
        console.error('❌ Course assessment generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to generate course assessment', request);
      }
    }

    if (path === '/generate/diagnostic' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, excludeQuestionIds } = body;
        const result = await generateDiagnosticScreenerQuestions(env as unknown as PagesEnv, gradeLevel, excludeQuestionIds);
        return apiSuccess(result, request);
      } catch (error: any) {
        console.error('❌ Diagnostic generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message, request);
      }
    }

    if (path === '/generate/adaptive' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, startingDifficulty, excludeQuestionIds } = body;
        const result = await generateAdaptiveCoreQuestions(env as unknown as PagesEnv, gradeLevel, startingDifficulty, excludeQuestionIds);
        return apiSuccess(result, request);
      } catch (error: any) {
        console.error('❌ Adaptive generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message, request);
      }
    }

    if (path === '/generate/stability' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, provisionalBand, excludeQuestionIds } = body;
        const result = await generateStabilityConfirmationQuestions(env as unknown as PagesEnv, gradeLevel, provisionalBand, excludeQuestionIds);
        return apiSuccess(result, request);
      } catch (error: any) {
        console.error('❌ Stability generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message, request);
      }
    }

    if (path === '/generate/single' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { gradeLevel, phase, difficulty, subtag, excludeQuestionIds } = body;
        console.log('🎯 [Router] /generate/single called with:', { gradeLevel, phase, difficulty, subtag, excludeCount: excludeQuestionIds?.length || 0 });
        const result = await generateSingleQuestion(env as unknown as PagesEnv, gradeLevel, phase || 'adaptive_core', difficulty, subtag, excludeQuestionIds);
        console.log('✅ [Router] Single question generated:', { questionId: result.id, difficulty: result.difficulty });
        // Wrap in array format expected by next-question handler
        return apiSuccess({ questions: [result] }, request);
      } catch (error: any) {
        console.error('❌ Single question generation error:', error);
        return apiError(500, 'INTERNAL_ERROR', error.message, request);
      }
    }

    // 404 for unknown routes
    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  })(context);
  } catch (error: any) {
    console.error('❌ Error in question-generation-api:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Internal server error', request);
  }
};
