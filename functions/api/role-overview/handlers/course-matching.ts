/**
 * Course Matching Handler - Pages Function
 * AI-powered course matching for specific roles
 * 
 * Migrated from: cloudflare-workers/role-overview-api/src/handlers/courseMatchingHandler.ts
 * Changes:
 * - Uses callOpenRouterWithRetry from shared/ai-config
 * - Uses shared utilities (jsonResponse, PagesFunction)
 * - Uses repairAndParseJSON for response parsing
 * - Simplified fallback chain (OpenRouter → Empty result)
 */

import type { PagesFunction } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib';
import { callOpenRouterWithRetry, getAPIKeys, repairAndParseJSON } from '../../shared/ai-config';
import { buildCourseMatchingPrompt, COURSE_MATCHING_SYSTEM_PROMPT } from '../prompts/role-overview';

export interface CourseInput {
  id: string;
  title: string;
  description: string;
  skills?: string[];
  category?: string;
  duration?: string;
  level?: string;
}

export interface CourseMatchingRequest {
  roleName: string;
  clusterTitle?: string;
  courses: CourseInput[];
}

export interface CourseMatchingResult {
  matchedCourseIds: string[];
  reasoning: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'openrouter' | 'fallback';
}

/**
 * Parse the AI response to extract matched course IDs
 */
function parseMatchingResponse(content: string): CourseMatchingResult {
  try {
    const parsed = repairAndParseJSON(content, true); // preferObject = true
    return {
      matchedCourseIds: Array.isArray(parsed.matchedCourseIds) ? parsed.matchedCourseIds : [],
      reasoning: parsed.reasoning || 'AI-matched courses based on role relevance',
    };
  } catch (e) {
    console.error('Error parsing course matching response:', e);
    return { matchedCourseIds: [], reasoning: 'Failed to parse AI response' };
  }
}

/**
 * Handle POST /match-courses
 * AI-powered course matching for a specific role
 */
export const handleCourseMatching: PagesFunction = async (context) => {
  const { request, env } = context;

  // Parse request body
  let body: CourseMatchingRequest;
  try {
    body = await request.json() as CourseMatchingRequest;
  } catch {
    return jsonResponse({
      success: false,
      error: 'Invalid JSON body',
    }, 400);
  }

  const { roleName, clusterTitle, courses } = body;

  // Validate required fields
  if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
    return jsonResponse({
      success: false,
      error: 'roleName is required',
    }, 400);
  }

  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return jsonResponse({
      success: false,
      error: 'courses array is required and must not be empty',
    }, 400);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = (clusterTitle || '').trim();

  console.log(`[CourseMatching] Request for: ${cleanRoleName} with ${courses.length} courses`);

  // Limit courses to prevent token overflow (max 20 courses)
  const limitedCourses = courses.slice(0, 20);

  // Get API keys
  const { openRouter } = getAPIKeys(env);

  if (!openRouter) {
    console.warn('[CourseMatching] No OpenRouter API key, returning empty result');
    return jsonResponse({
      success: true,
      data: {
        matchedCourseIds: [],
        reasoning: 'AI services unavailable, unable to match courses',
      },
      source: 'fallback',
    });
  }

  // Try OpenRouter with model fallback
  try {
    const prompt = buildCourseMatchingPrompt(cleanRoleName, cleanClusterTitle, limitedCourses);
    const messages = [
      { role: 'system', content: COURSE_MATCHING_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const response = await callOpenRouterWithRetry(openRouter, messages, {
      maxTokens: 500,
      temperature: 0.3, // Lower temperature for more consistent matching
    });

    const result = parseMatchingResponse(response);
    
    console.log(`[CourseMatching] Success via OpenRouter for: ${cleanRoleName}, matched ${result.matchedCourseIds.length} courses`);
    return jsonResponse({
      success: true,
      data: result,
      source: 'openrouter',
    });
  } catch (error: any) {
    console.error(`[CourseMatching] OpenRouter failed:`, error.message);

    // Return empty result (no static fallback for matching)
    console.log(`[CourseMatching] AI services failed for: ${cleanRoleName}`);
    return jsonResponse({
      success: true,
      data: {
        matchedCourseIds: [],
        reasoning: 'AI services unavailable, unable to match courses',
      },
      source: 'fallback',
    });
  }
};
