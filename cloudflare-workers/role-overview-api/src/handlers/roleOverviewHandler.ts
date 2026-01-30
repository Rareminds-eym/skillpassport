import { Env, RoleOverviewData, RoleOverviewRequest, ApiResponse } from '../types';
import { jsonResponse } from '../utils/cors';
import { callOpenRouter } from '../services/openRouterService';
import { callGemini } from '../services/geminiService';
import { getFallbackRoleOverview } from '../services/fallbackService';
import { parseRoleOverviewResponse } from '../utils/parser';

/**
 * Handle POST /role-overview
 * Generates comprehensive role overview data with fallback chain:
 * OpenRouter → Gemini → Static Fallback
 */
export async function handleRoleOverview(
  request: Request,
  env: Env
): Promise<Response> {
  // Parse request body
  let body: RoleOverviewRequest;
  try {
    body = await request.json() as RoleOverviewRequest;
  } catch {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'Invalid JSON body',
    }, 400);
  }

  const { roleName, clusterTitle } = body;

  // Validate required fields
  if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'roleName is required',
    }, 400);
  }

  if (!clusterTitle || typeof clusterTitle !== 'string') {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'clusterTitle is required',
    }, 400);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = clusterTitle.trim();

  console.log(`[RoleOverview] Request for: ${cleanRoleName} in ${cleanClusterTitle}`);

  // STEP 1: Try OpenRouter
  try {
    const openRouterResponse = await callOpenRouter(cleanRoleName, cleanClusterTitle, env);
    const data = parseRoleOverviewResponse(openRouterResponse, cleanRoleName);
    
    console.log(`[RoleOverview] Success via OpenRouter for: ${cleanRoleName}`);
    return jsonResponse<ApiResponse<RoleOverviewData>>({
      success: true,
      data,
      source: 'openrouter',
    });
  } catch (openRouterError: any) {
    console.warn(`[RoleOverview] OpenRouter failed:`, openRouterError.message);

    // STEP 2: Try Gemini as fallback
    try {
      const geminiResponse = await callGemini(cleanRoleName, cleanClusterTitle, env);
      const data = parseRoleOverviewResponse(geminiResponse, cleanRoleName);
      
      console.log(`[RoleOverview] Success via Gemini for: ${cleanRoleName}`);
      return jsonResponse<ApiResponse<RoleOverviewData>>({
        success: true,
        data,
        source: 'gemini',
      });
    } catch (geminiError: any) {
      console.warn(`[RoleOverview] Gemini failed:`, geminiError.message);

      // STEP 3: Use static fallback
      console.log(`[RoleOverview] Using static fallback for: ${cleanRoleName}`);
      const fallbackData = getFallbackRoleOverview(cleanRoleName);
      
      return jsonResponse<ApiResponse<RoleOverviewData>>({
        success: true,
        data: fallbackData,
        source: 'fallback',
      });
    }
  }
}
