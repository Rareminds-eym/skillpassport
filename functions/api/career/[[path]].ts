/**
 * Career API - Cloudflare Pages Function
 * Migrated from cloudflare-workers/career-api
 * 
 * Endpoints:
 * - /api/career/chat - Career AI chat with streaming
 * - /api/career/recommend-opportunities - Get job recommendations
 * - /api/career/analyze-assessment - Analyze career assessment
 * - /api/career/generate-embedding - Generate embeddings for opportunities/learners
 * - /api/career/generate-field-keywords - Generate domain keywords for fields
 * - /api/career/parse-resume - Parse resume text
 * - /api/career/get-actions - Get grade-appropriate career actions
 * - /api/career/profile - Get learner profile
 * - /api/career/opportunities - List all opportunities
 * - /api/career/skills-demand - Get in-demand skills
 * - /api/career/readiness-score - Save career readiness score
 * - /api/career/profile-health - Save profile health analysis
 * - /api/career/peer-benchmarks - Get peer benchmark data
 * - /api/career/conversations - List/delete conversations
 * - /api/career/conversation - Get single conversation
 * - /api/career/feedback - Get/upsert AI feedback
 */

import type { PagesFunction } from '../../lib/types';
import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import { withAuth, getContextUser } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getAPIKeys } from '../shared/ai-config';
import { handleCareerChat } from './handlers/chat';
import { handleRecommendOpportunities } from './handlers/recommend';
import { handleAnalyzeAssessment } from './handlers/analyze-assessment';
import { handleGenerateEmbedding } from '../embedding/handlers/generateEmbedding';
import { handleGenerateFieldKeywords } from './handlers/field-keywords';
import { handleParseResume } from './handlers/parse-resume';
import { handleGetActions } from './handlers/get-actions';
import { handleGetProfile } from './handlers/profile';
import { handleGetOpportunities } from './handlers/opportunities';
import { handleGetSkillsDemand } from './handlers/skills-demand';
import { handleSaveReadinessScore, handleSaveProfileHealth, handleGetPeerBenchmarks } from './handlers/analytics';
import { handleListConversations, handleGetConversation, handleDeleteConversation } from './handlers/conversations';
import { handleUpsertFeedback, handleGetFeedback } from './handlers/feedback';

// Helper to get OpenRouter API key (uses shared utility)
export const getOpenRouterKey = (env: any): string | undefined => {
  return getAPIKeys(env).openRouter;
};

export const onRequest: PagesFunction = async (context) => {
  let { request, env }: { request: Request; env: Record<string, string> } = context as any;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const pathSegments = context.params.path as unknown as string[] | undefined;
  const path = '/' + (Array.isArray(pathSegments) ? pathSegments.join('/') : '');

  // Validate environment
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return apiError(500, 'INTERNAL_ERROR', 'Server configuration error', request);
  }

  try {
    // Health check — public
    if (path === '/health') {
      return apiSuccess({
        status: 'ok',
        service: 'career-api',
        version: '2.0-pages-function',
        endpoints: ['/chat', '/recommend-opportunities', '/analyze-assessment', '/generate-embedding', '/generate-field-keywords', '/parse-resume'],
        timestamp: new Date().toISOString()
      });
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      env = authContext.env as Record<string, string>;
      request = authContext.request;
      const user = getContextUser(authContext);
      const userId = user.id;

    // Route requests
    if (path === '/chat' || path === '/career-ai-chat' || path === '/') {
      if (!getOpenRouterKey(env)) {
        return apiError(500, 'INTERNAL_ERROR', 'AI service not configured', request);
      }
      return await handleCareerChat(request, env as any, userId);
    }

    if (path === '/recommend-opportunities' || path === '/recommend') {
      return await handleRecommendOpportunities(request, env as any);
    }

    if (path === '/analyze-assessment') {
      if (!getOpenRouterKey(env)) {
        return apiError(500, 'INTERNAL_ERROR', 'AI service not configured', request);
      }
      return await handleAnalyzeAssessment(request, env as any, userId);
    }

    if (path === '/generate-embedding') {
      return await handleGenerateEmbedding(request, env as any, userId);
    }

    if (path === '/generate-field-keywords') {
      if (!getOpenRouterKey(env)) {
        return apiError(500, 'INTERNAL_ERROR', 'AI service not configured', request);
      }
      return await handleGenerateFieldKeywords(request, env as any, userId);
    }

    if (path === '/parse-resume') {
      if (!getOpenRouterKey(env)) {
        return apiError(500, 'INTERNAL_ERROR', 'AI service not configured', request);
      }
      return await handleParseResume(request, env as any, userId);
    }

    if (path === '/get-actions' || path === '/actions') {
      return await handleGetActions(env as any, userId, request);
    }

    if (path === '/profile') {
      return await handleGetProfile(env as any, userId, request);
    }

    if (path === '/opportunities') {
      return await handleGetOpportunities(env as any, request);
    }

    if (path === '/skills-demand') {
      return await handleGetSkillsDemand(env as any, request);
    }

    if (path === '/readiness-score') {
      return await handleSaveReadinessScore(env as any, userId, request);
    }

    if (path === '/profile-health') {
      return await handleSaveProfileHealth(env as any, userId, request);
    }

    if (path === '/peer-benchmarks') {
      return await handleGetPeerBenchmarks(env as any, request);
    }

    if (path === '/conversations') {
      if (request.method === 'DELETE') {
        return await handleDeleteConversation(env as any, userId, request);
      }
      return await handleListConversations(env as any, userId, request);
    }

    if (path === '/conversation') {
      return await handleGetConversation(env as any, userId, request);
    }

    if (path === '/feedback') {
      if (request.method === 'GET') {
        return await handleGetFeedback(env as any, userId, request);
      }
      return await handleUpsertFeedback(env as any, userId, request);
    }

    return apiError(404, 'NOT_FOUND', 'Not found', request);
  })(context);
  } catch (error) {
    console.error('[ERROR] career-api:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error)?.message || 'Internal server error', request);
  }
};
