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

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { callOpenRouterWithRetry, getAPIKeys, MODEL_PROFILES } from '../shared/ai-config';
import { createClient } from '@supabase/supabase-js';
import { handleCourseMatching } from './handlers/course-matching';

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
  const path = url.pathname.replace('/api/role-overview', '');

  try {
    // Health check
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return jsonResponse({
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
      });
    }

    // Retrieve stored role overview from DB
    if (path === '/storage' && request.method === 'GET') {
      const url = new URL(request.url);
      const attemptId = url.searchParams.get('attemptId');
      const roleName = url.searchParams.get('roleName');

      if (!attemptId || !roleName) {
        return jsonResponse({ error: 'Missing required query parameters: attemptId and roleName' }, 400);
      }

      console.log(`[Storage] Retrieving: ${roleName} for attempt ${attemptId}`);

      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse({ error: 'Supabase not configured' }, 500);
      }

      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      // Query database for stored role overview
      const { data, error } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('attempt_id', attemptId)
        .maybeSingle();

      if (error) {
        console.error('[Storage] DB error:', error);
        return jsonResponse({ exists: false, data: null }, 200);
      }

      if (!data || !data.gemini_results) {
        console.log('[Storage] No gemini_results data found');
        return jsonResponse({ exists: false, data: null }, 200);
      }

      // Search for role in all three arrays: highFit, mediumFit, exploreLater
      const specificOptions = data.gemini_results?.careerFit?.specificOptions;
      if (!specificOptions) {
        console.log('[Storage] No specificOptions found in gemini_results');
        return jsonResponse({ exists: false, data: null }, 200);
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
        return jsonResponse({ exists: false, data: null }, 200);
      }

      console.log(`[Storage] ✅ Found roleOverview for: ${roleName}`);
      return jsonResponse({ exists: true, data: roleData.roleOverview }, 200);
    }

    // Store role overview in DB
    if (path === '/storage' && request.method === 'POST') {
      const body = await request.json() as { 
        attemptId: string; 
        roleName: string; 
        roleOverview: any;
      };

      if (!body.attemptId || !body.roleName || !body.roleOverview) {
        return jsonResponse({ error: 'Missing required fields: attemptId, roleName, roleOverview' }, 400);
      }

      console.log(`[Storage] Storing: ${body.roleName} for attempt ${body.attemptId}`);

      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse({ error: 'Supabase not configured' }, 500);
      }

      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      // Get current gemini_results data
      const { data: currentData, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('attempt_id', body.attemptId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Storage] DB fetch error:', fetchError);
        return jsonResponse({ error: 'Failed to fetch current data' }, 500);
      }

      if (!currentData || !currentData.gemini_results) {
        console.error('[Storage] No gemini_results found for attempt:', body.attemptId);
        return jsonResponse({ error: 'Assessment result not found' }, 404);
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
        return jsonResponse({ error: 'Role not found in assessment results' }, 404);
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
        return jsonResponse({ error: 'Failed to store data' }, 500);
      }

      console.log(`[Storage] ✅ Stored roleOverview for: ${body.roleName}`);
      return jsonResponse({ success: true, message: 'Role overview stored successfully' }, 200);
    }

    // Generate role overview
    if (path === '/role-overview' && request.method === 'POST') {
      const body = await request.json() as { roleName: string; clusterTitle: string };
      
      if (!body.roleName || !body.clusterTitle) {
        return jsonResponse(
          { error: 'Missing required fields: roleName and clusterTitle' },
          400
        );
      }

      console.log(`[RoleOverview] Generating overview for: ${body.roleName} in ${body.clusterTitle}`);

      const { openRouter } = getAPIKeys(env);
      if (!openRouter) {
        return jsonResponse(
          { error: 'OpenRouter API key not configured' },
          500
        );
      }

      const prompt = `Generate a comprehensive role overview for a ${body.roleName} position in the ${body.clusterTitle} career cluster.

Return ONLY a JSON object with this EXACT structure (no markdown, no extra text):

{
  "responsibilities": [
    "Action verb + specific responsibility 1",
    "Action verb + specific responsibility 2",
    "Action verb + specific responsibility 3"
  ],
  "demandDescription": "2 sentences about current market demand for this role (max 25 words total)",
  "demandLevel": "Low" | "Medium" | "High" | "Very High",
  "demandPercentage": 20-100 (number matching the demand level),
  "careerProgression": [
    {"title": "Junior ${body.roleName}", "yearsExperience": "0-2 yrs"},
    {"title": "${body.roleName}", "yearsExperience": "2-5 yrs"},
    {"title": "Senior ${body.roleName}", "yearsExperience": "5-8 yrs"},
    {"title": "Lead ${body.roleName}", "yearsExperience": "8+ yrs"}
  ],
  "learningRoadmap": [
    {
      "month": "Month 1-2",
      "title": "Specific phase title",
      "description": "What they'll learn in this phase",
      "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
      "color": "#22c55e"
    },
    {
      "month": "Month 3-4",
      "title": "Specific phase title",
      "description": "What they'll learn in this phase",
      "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
      "color": "#3b82f6"
    },
    {
      "month": "Month 5-6",
      "title": "Specific phase title",
      "description": "What they'll learn in this phase",
      "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
      "color": "#a855f7"
    }
  ],
  "recommendedCourses": [
    {
      "title": "Specific course name",
      "description": "What the course covers",
      "duration": "4 weeks",
      "level": "Beginner" | "Intermediate" | "Advanced" | "Professional",
      "skills": ["Skill 1", "Skill 2", "Skill 3"]
    },
    // 3 more courses...
  ],
  "freeResources": [
    {
      "title": "Specific resource name",
      "description": "What this resource provides",
      "type": "YouTube" | "Documentation" | "Certification" | "Community" | "Tool",
      "url": "https://..."
    },
    // 2 more resources...
  ],
  "actionItems": [
    {"title": "Action 1", "description": "Specific action to take"},
    {"title": "Action 2", "description": "Specific action to take"},
    {"title": "Action 3", "description": "Specific action to take"},
    {"title": "Action 4", "description": "Specific action to take"}
  ],
  "suggestedProjects": [
    {
      "title": "Specific project name",
      "description": "What they'll build and learn (2-3 sentences)",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "estimatedTime": "2-4 hours"
    },
    // 2 more projects...
  ]
}

CRITICAL: All content must be SPECIFIC to ${body.roleName} role. NO generic placeholders.`;

      try {
        const content = await callOpenRouterWithRetry(openRouter, [
          {
            role: 'system',
            content: 'You are a career advisor generating detailed role overviews. Always return valid JSON with specific, actionable content. No placeholders or generic text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ], {
          models: [MODEL_PROFILES.question_generation.primary, ...MODEL_PROFILES.question_generation.fallbacks],
          maxRetries: 3,
          maxTokens: 2000,
          temperature: 0.7,
        });

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.responsibilities || !Array.isArray(parsed.responsibilities)) {
          throw new Error('Invalid response: missing responsibilities array');
        }

        // Return structured response
        return jsonResponse({
          success: true,
          data: {
            responsibilities: parsed.responsibilities.slice(0, 3),
            industryDemand: {
              description: parsed.demandDescription || `${body.roleName} roles show steady market demand.`,
              demandLevel: parsed.demandLevel || 'Medium',
              demandPercentage: parsed.demandPercentage || 65
            },
            careerProgression: parsed.careerProgression || [],
            learningRoadmap: parsed.learningRoadmap || [],
            recommendedCourses: parsed.recommendedCourses || [],
            freeResources: parsed.freeResources || [],
            actionItems: parsed.actionItems || [],
            suggestedProjects: parsed.suggestedProjects || []
          },
          source: 'openrouter'
        });
      } catch (error: any) {
        console.error('[RoleOverview] AI generation failed:', error);
        return jsonResponse(
          {
            success: false,
            error: 'Failed to generate role overview',
            details: error.message
          },
          500
        );
      }
    }

    // Match courses for role
    if (path === '/match-courses' && request.method === 'POST') {
      return handleCourseMatching(context);
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Unknown endpoint',
        availableEndpoints: [
          'GET /health - Health check',
          'POST /role-overview - Generate role overview data',
          'POST /match-courses - AI-powered course matching for a role',
        ],
      },
      404
    );
  } catch (error: any) {
    console.error('❌ Error in role-overview-api:', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
