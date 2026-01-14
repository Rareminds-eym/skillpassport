/**
 * Generate Program Career Paths Handler
 * AI-powered career path generation for degree programs
 */

import { buildProgramCareerPathsPrompt, parseCareerPathsResponse, type StudentProfile, type CareerPath } from '../prompts/programCareerPaths';

export interface GenerateProgramCareerPathsRequest {
  programName: string;
  programCategory: string;
  programStream: string;
  studentProfile: {
    riasecScores: {
      R: number;
      I: number;
      A: number;
      S: number;
      E: number;
      C: number;
    };
    aptitudeScores?: {
      verbal?: number;
      numerical?: number;
      abstract?: number;
      spatial?: number;
      clerical?: number;
    };
    topSkills?: string[];
    interests?: string[];
    projects?: Array<{ title: string; description?: string }>;
    experiences?: Array<{ role: string; organization?: string }>;
  };
}

export interface GenerateProgramCareerPathsResponse {
  success: boolean;
  careerPaths?: CareerPath[];
  error?: string;
}

/**
 * Generate career paths for a program using AI
 */
export async function generateProgramCareerPaths(
  request: GenerateProgramCareerPathsRequest,
  env: any
): Promise<GenerateProgramCareerPathsResponse> {
  try {
    console.log('[CAREER_PATHS] Generating career paths for:', request.programName);

    // Build student profile
    const profile: StudentProfile = {
      programName: request.programName,
      programCategory: request.programCategory,
      programStream: request.programStream,
      riasecScores: request.studentProfile.riasecScores,
      aptitudeScores: request.studentProfile.aptitudeScores,
      topSkills: request.studentProfile.topSkills,
      interests: request.studentProfile.interests,
      projects: request.studentProfile.projects,
      experiences: request.studentProfile.experiences
    };

    // Build prompt
    const prompt = buildProgramCareerPathsPrompt(profile);

    console.log('[CAREER_PATHS] Calling AI with prompt length:', prompt.length);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.SITE_URL || 'https://skillpassport.in',
        'X-Title': 'Skill Passport - Career Path Generator'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor specializing in program-specific career guidance. Generate personalized, realistic career paths based on student profiles. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CAREER_PATHS] OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('[CAREER_PATHS] AI response length:', aiResponse.length);

    // Parse and validate career paths
    const careerPaths = parseCareerPathsResponse(aiResponse);

    console.log('[CAREER_PATHS] Successfully generated', careerPaths.length, 'career paths');

    return {
      success: true,
      careerPaths
    };
  } catch (error) {
    console.error('[CAREER_PATHS] Error generating career paths:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Handle HTTP request for career path generation
 */
export async function handleGenerateProgramCareerPaths(
  request: Request,
  env: any
): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Parse request body
    const body = await request.json() as GenerateProgramCareerPathsRequest;

    // Validate required fields
    if (!body.programName || !body.programCategory || !body.studentProfile?.riasecScores) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: programName, programCategory, studentProfile.riasecScores' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate career paths
    const result = await generateProgramCareerPaths(body, env);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('[CAREER_PATHS] Request handling error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
