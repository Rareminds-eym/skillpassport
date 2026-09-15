/**
 * Role Overview API - Cloudflare Pages Function
 * 
 * Generates comprehensive career role overview data including:
 * - Job responsibilities
 * - Industry demand
 * - Career progression
 * - Learning roadmap
 * - Recommended courses
 * - Free resources
 * - Action items
 * 
 * Endpoints:
 * - GET /health - Health check
 * - POST /role-overview - Generate role overview data
 * - POST /match-courses - AI-powered course matching for a role
 */

import { apiSuccess, apiError } from '../../lib/response';
import { handleCorsPreflightRequest } from '../../lib/cors';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { withAuth, getContextUser } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { createSupabaseAdminClient } from '../../lib/supabase';
import { handleCourseMatching } from './handlers/course-matching';
import { handleRoleOverviewRpc } from './handlers/role-overview';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  let { request, env }: { request: Request; env: Record<string, string> } = context as any;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/role-overview', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return apiSuccess({
        status: 'ok',
        service: 'role-overview-api',
        version: '1.2.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET /health - Health check',
          'POST /role-overview - Generate role overview data',
          'POST /match-courses - AI-powered course matching for a role',
          'GET /storage?attemptId=xxx&roleName=xxx - Retrieve stored role overview',
          'POST /storage - Store role overview data',
        ],
      }, request);
    }

    // All other endpoints require authentication
    return withAuth(async (authContext: AuthenticatedContext) => {
      env = authContext.env as Record<string, string>;
      request = authContext.request;

    // Retrieve stored role overview from DB
    if (path === '/storage' && request.method === 'GET') {
      const url = new URL(request.url);
      const attemptId = url.searchParams.get('attemptId');
      const roleName = url.searchParams.get('roleName');

      if (!attemptId || !roleName) {
        return apiError(400, 'VALIDATION_ERROR', 'Missing required query parameters: attemptId and roleName', request);
      }

      console.log(`[Storage] Retrieving: ${roleName} for attempt ${attemptId}`);

      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return apiError(500, 'INTERNAL_ERROR', 'Supabase not configured', request);
      }

      const supabase = createSupabaseAdminClient(env);

      // Query database for stored role overview
      const { data, error } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('attempt_id', attemptId)
        .maybeSingle();

      if (error) {
        console.error('[Storage] DB error:', error);
        return apiSuccess({ exists: false, data: null }, request);
      }

      if (!data || !data.gemini_results) {
        console.log('[Storage] No gemini_results data found');
        return apiSuccess({ exists: false, data: null }, request);
      }

      // Search for role in all three arrays: highFit, mediumFit, exploreLater
      const specificOptions = data.gemini_results?.careerFit?.specificOptions;
      if (!specificOptions) {
        console.log('[Storage] No specificOptions found in gemini_results');
        return apiSuccess({ exists: false, data: null }, request);
      }

      const highFit = specificOptions.highFit || [];
      const mediumFit = specificOptions.mediumFit || [];
      const exploreLater = specificOptions.exploreLater || [];

      // Search in all arrays
      let roleData = highFit.find((role: any) => role.name === roleName);
      if (!roleData) {
        roleData = mediumFit.find((role: any) => role.name === roleName);
      }
      if (!roleData) {
        roleData = exploreLater.find((role: any) => role.name === roleName);
      }

      if (!roleData || !roleData.roleOverview) {
        console.log(`[Storage] Role "${roleName}" not found in any fit array or no roleOverview`);
        return apiSuccess({ exists: false, data: null }, request);
      }

      console.log(`[Storage] ✅ Found roleOverview for: ${roleName}`);
      return apiSuccess({ exists: true, data: roleData.roleOverview }, request);
    }

    // Store role overview in DB
    if (path === '/storage' && request.method === 'POST') {
      const body = await request.json() as { 
        attemptId: string; 
        roleName: string; 
        roleOverview: any;
      };

      if (!body.attemptId || !body.roleName || !body.roleOverview) {
        return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: attemptId, roleName, roleOverview', request);
      }

      console.log(`[Storage] Storing: ${body.roleName} for attempt ${body.attemptId}`);

      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return apiError(500, 'INTERNAL_ERROR', 'Supabase not configured', request);
      }

      const supabase = createSupabaseAdminClient(env);

      // Get current gemini_results data
      const { data: currentData, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('attempt_id', body.attemptId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Storage] DB fetch error:', fetchError);
        return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch current data', request);
      }

      if (!currentData || !currentData.gemini_results) {
        console.error('[Storage] No gemini_results found for attempt:', body.attemptId);
        return apiError(404, 'NOT_FOUND', 'Assessment result not found', request);
      }

      // Update the roleOverview for the specific role in gemini_results
      const geminiResults = currentData.gemini_results || {};
      const careerFit = geminiResults.careerFit || {};
      const specificOptions = careerFit.specificOptions || {};
      
      const highFit = specificOptions.highFit || [];
      const mediumFit = specificOptions.mediumFit || [];
      const exploreLater = specificOptions.exploreLater || [];
      
      // Find role in all three arrays
      let roleIndex = highFit.findIndex((role: any) => role.name === body.roleName);
      let targetArray = highFit;
      let arrayName = 'highFit';
      
      if (roleIndex === -1) {
        roleIndex = mediumFit.findIndex((role: any) => role.name === body.roleName);
        if (roleIndex !== -1) {
          targetArray = mediumFit;
          arrayName = 'mediumFit';
        }
      }
      
      if (roleIndex === -1) {
        roleIndex = exploreLater.findIndex((role: any) => role.name === body.roleName);
        if (roleIndex !== -1) {
          targetArray = exploreLater;
          arrayName = 'exploreLater';
        }
      }
      
      if (roleIndex === -1) {
        console.error(`[Storage] Role "${body.roleName}" not found in any fit array`);
        return apiError(404, 'NOT_FOUND', 'Role not found in assessment results', request);
      }

      console.log(`[Storage] Found role in ${arrayName} array at index ${roleIndex}`);

      // Merge new data with existing roleOverview
      const existingOverview = targetArray[roleIndex].roleOverview || {};
      const roleOverviewWithMeta = {
        ...existingOverview,
        ...body.roleOverview,
        lastUpdated: new Date().toISOString(),
      };

      // Add generatedAt only if it doesn't exist
      if (!existingOverview.generatedAt) {
        roleOverviewWithMeta.generatedAt = new Date().toISOString();
      }

      targetArray[roleIndex].roleOverview = roleOverviewWithMeta;
      
      // Update the correct array in specificOptions
      specificOptions.highFit = highFit;
      specificOptions.mediumFit = mediumFit;
      specificOptions.exploreLater = exploreLater;
      
      careerFit.specificOptions = specificOptions;
      geminiResults.careerFit = careerFit;

      // Update database
      const { error: updateError } = await supabase
        .from('personal_assessment_results')
        .update({ gemini_results: geminiResults })
        .eq('attempt_id', body.attemptId);

      if (updateError) {
        console.error('[Storage] DB update error:', updateError);
        return apiError(500, 'INTERNAL_ERROR', 'Failed to store data', request);
      }

      console.log(`[Storage] ✅ Stored roleOverview for: ${body.roleName}`);
      return apiSuccess({ message: 'Role overview stored successfully' }, request);
    }

    // Generate role overview (RPC cutover — see handlers/role-overview.ts)
    if (path === '/role-overview' && request.method === 'POST') {
      const user = getContextUser(authContext as never) as { id: string };
      return handleRoleOverviewRpc(request, env as unknown as Record<string, string>, user.id);
    }

    // Match courses for role
    if (path === '/match-courses' && request.method === 'POST') {
      return handleCourseMatching(context);
    }

    // 404 for unknown routes
    return apiError(404, 'NOT_FOUND', 'Unknown endpoint', request);
  })(context);
  } catch (error: any) {
    console.error('❌ Error in role-overview-api:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Internal server error', request);
  }
};