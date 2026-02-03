/**
 * Role Overview Handler - Pages Function
 * Generates comprehensive role overview data with fallback chain
 * 
 * Migrated from: cloudflare-workers/role-overview-api/src/handlers/roleOverviewHandler.ts
 * Changes:
 * - Uses callOpenRouterWithRetry from shared/ai-config
 * - Uses shared utilities (jsonResponse, PagesFunction)
 * - Simplified fallback chain (OpenRouter with model fallback → Static fallback)
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';
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
  source?: 'openrouter' | 'fallback';
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
    return jsonResponse({
      success: false,
      error: 'Invalid JSON body',
    }, 400);
  }

  const { roleName, clusterTitle } = body;

  // Validate required fields
  if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
    return jsonResponse({
      success: false,
      error: 'roleName is required',
    }, 400);
  }

  if (!clusterTitle || typeof clusterTitle !== 'string') {
    return jsonResponse({
      success: false,
      error: 'clusterTitle is required',
    }, 400);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = clusterTitle.trim();

  console.log(`[RoleOverview] Request for: ${cleanRoleName} in ${cleanClusterTitle}`);

  // Get API keys
  const { openRouter } = getAPIKeys(env);

  if (!openRouter) {
    console.warn('[RoleOverview] No OpenRouter API key, using static fallback');
    const fallbackData = getFallbackRoleOverview(cleanRoleName);
    return jsonResponse({
      success: true,
      data: fallbackData,
      source: 'fallback',
    });
  }

  // Try OpenRouter with model fallback
  try {
    const prompt = buildRoleOverviewPrompt(cleanRoleName, cleanClusterTitle);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const response = await callOpenRouterWithRetry(openRouter, messages, {
      maxTokens: 4000,
      temperature: 0.7,
    });

    const data = parseRoleOverviewResponse(response, cleanRoleName);
    
    console.log(`[RoleOverview] Success via OpenRouter for: ${cleanRoleName}`);
    return jsonResponse({
      success: true,
      data,
      source: 'openrouter',
    });
  } catch (error: any) {
    console.error(`[RoleOverview] OpenRouter failed:`, error.message);

    // Use static fallback
    console.log(`[RoleOverview] Using static fallback for: ${cleanRoleName}`);
    const fallbackData = getFallbackRoleOverview(cleanRoleName);
    
    return jsonResponse({
      success: true,
      data: fallbackData,
      source: 'fallback',
    });
  }
};
