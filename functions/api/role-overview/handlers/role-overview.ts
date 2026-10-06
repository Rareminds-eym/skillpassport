/**
 * Role Overview Handler - Pages Function
 * Generates comprehensive role overview data with fallback chain
 * 
 * Migrated from: cloudflare-workers/role-overview-api/src/handlers/roleOverviewHandler.ts
 * Changes:
 * - Uses callCloudflareWithRetry from shared/ai-config
 * - Uses shared utilities (apiSuccess, apiError, PagesFunction)
 * - Simplified fallback chain (OpenRouter with model fallback → Static fallback)
 */

import type { PagesFunction } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { callCloudflareWithRetry, getCloudflareConfig } from '../../shared/ai-config';
import { buildRoleOverviewPrompt, SYSTEM_PROMPT } from '../prompts/role-overview';
import { parseRoleOverviewResponse } from '../utils/parser';
import { getFallbackRoleOverview } from '../utils/fallback';

export interface RoleOverviewRequest {
  roleName: string;
  clusterTitle: string;
}

export interface RoleOverviewData {
  responsibilities: string[];
  demandDescription: string;
  demandLevel: string;
  demandPercentage: number;
  careerProgression: Array<{
    title: string;
    yearsExperience: string;
  }>;
  learningRoadmap: Array<{
    month: string;
    title: string;
    description: string;
    tasks: string[];
  }>;
  recommendedCourses: Array<{
    title: string;
    description: string;
    duration: string;
    level: string;
    skills: string[];
  }>;
  freeResources: Array<{
    title: string;
    description: string;
    type: string;
    url: string;
  }>;
  actionItems: Array<{
    title: string;
    description: string;
  }>;
  suggestedProjects: Array<{
    title: string;
    description: string;
    difficulty: string;
    skills: string[];
    estimatedTime: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'openrouter' | 'cloudflare' | 'fallback';
}

/**
 * Handle POST /role-overview
 * Generates comprehensive role overview data
 */
export const handleRoleOverview: PagesFunction = async (context) => {
  const { request, env } = context;

  // Parse request body
  let body: RoleOverviewRequest;
  try {
    body = await request.json() as RoleOverviewRequest;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const { roleName, clusterTitle } = body;

  // Validate required fields
  if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
    return apiError(400, 'VALIDATION_ERROR', 'roleName is required', request);
  }

  if (!clusterTitle || typeof clusterTitle !== 'string') {
    return apiError(400, 'VALIDATION_ERROR', 'clusterTitle is required', request);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = clusterTitle.trim();

  console.log(`[RoleOverview] Request for: ${cleanRoleName} in ${cleanClusterTitle}`);

  // Get Cloudflare AI binding
  const cfConfig = getCloudflareConfig(env);

  if (!cfConfig) {
    console.warn('[RoleOverview] No Cloudflare AI binding, using static fallback');
    const fallbackData = getFallbackRoleOverview(cleanRoleName);
    return apiSuccess({
      data: fallbackData,
      source: 'fallback',
    }, request);
  }

  // Try Cloudflare Workers AI with model fallback
  try {
    const prompt = buildRoleOverviewPrompt(cleanRoleName, cleanClusterTitle);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const response = await callCloudflareWithRetry(env, messages, {
      maxTokens: 4000,
      temperature: 0.7,
    });

    const data = parseRoleOverviewResponse(response, cleanRoleName);

    console.log(`[RoleOverview] Success via Cloudflare AI for: ${cleanRoleName}`);
    return apiSuccess({
      data,
      source: 'cloudflare',
    }, request);
  } catch (error: any) {
    console.error(`[RoleOverview] Cloudflare AI failed:`, error.message);

    // Use static fallback
    console.log(`[RoleOverview] Using static fallback for: ${cleanRoleName}`);
    const fallbackData = getFallbackRoleOverview(cleanRoleName);
    
    return apiSuccess({
      data: fallbackData,
      source: 'fallback',
    }, request);
  }
};
