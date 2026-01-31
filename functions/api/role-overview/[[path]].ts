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
import { callOpenRouterWithRetry, getAPIKeys } from '../shared/ai-config';

// Models to try for role overview generation
const ROLE_OVERVIEW_MODELS = [
  'google/gemini-flash-1.5-exp',           // FREE - Experimental
  'meta-llama/llama-3.1-8b-instruct:free', // FREE
  'google/gemini-flash-1.5',               // Affordable
  'openai/gpt-3.5-turbo',                  // Cheap fallback
];

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
        ],
      });
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
          models: ROLE_OVERVIEW_MODELS,
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
      // TODO: Implement AI-powered course matching
      // - Validate request body (roleTitle, availableCourses, etc.)
      // - Build course matching prompt
      // - Call OpenRouter API
      // - Parse and rank courses
      // - Return matched courses with relevance scores
      return jsonResponse(
        {
          error: 'Not implemented',
          message: 'Course matching not yet implemented. See README.md for implementation details.',
        },
        501
      );
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
