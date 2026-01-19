import { Env, CourseMatchingRequest, CourseMatchingResult, ApiResponse } from '../types';
import { jsonResponse } from '../utils/cors';
import { buildCourseMatchingPrompt, COURSE_MATCHING_SYSTEM_PROMPT } from '../prompts/roleOverviewPrompt';

/**
 * Call OpenRouter API for course matching
 */
async function callOpenRouterForMatching(
  roleName: string,
  clusterTitle: string,
  courses: CourseMatchingRequest['courses'],
  env: Env
): Promise<CourseMatchingResult> {
  const prompt = buildCourseMatchingPrompt(roleName, clusterTitle, courses);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://skillpassport.rareminds.in',
      'X-Title': 'Course Matching API',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: COURSE_MATCHING_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more consistent matching
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content || '';

  return parseMatchingResponse(content);
}

/**
 * Call Gemini API for course matching (fallback)
 */
async function callGeminiForMatching(
  roleName: string,
  clusterTitle: string,
  courses: CourseMatchingRequest['courses'],
  env: Env
): Promise<CourseMatchingResult> {
  const prompt = buildCourseMatchingPrompt(roleName, clusterTitle, courses);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${COURSE_MATCHING_SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return parseMatchingResponse(content);
}

/**
 * Parse the AI response to extract matched course IDs
 */
function parseMatchingResponse(content: string): CourseMatchingResult {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        matchedCourseIds: Array.isArray(parsed.matchedCourseIds) ? parsed.matchedCourseIds : [],
        reasoning: parsed.reasoning || 'AI-matched courses based on role relevance',
      };
    }
  } catch (e) {
    console.error('Error parsing course matching response:', e);
  }

  return { matchedCourseIds: [], reasoning: 'Failed to parse AI response' };
}

/**
 * Handle POST /match-courses
 * AI-powered course matching for a specific role
 */
export async function handleCourseMatching(
  request: Request,
  env: Env
): Promise<Response> {
  // Parse request body
  let body: CourseMatchingRequest;
  try {
    body = await request.json() as CourseMatchingRequest;
  } catch {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'Invalid JSON body',
    }, 400);
  }

  const { roleName, clusterTitle, courses } = body;

  // Validate required fields
  if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'roleName is required',
    }, 400);
  }

  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return jsonResponse<ApiResponse<null>>({
      success: false,
      error: 'courses array is required and must not be empty',
    }, 400);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = (clusterTitle || '').trim();

  console.log(`[CourseMatching] Request for: ${cleanRoleName} with ${courses.length} courses`);

  // Limit courses to prevent token overflow (max 20 courses)
  const limitedCourses = courses.slice(0, 20);

  // STEP 1: Try OpenRouter
  try {
    const result = await callOpenRouterForMatching(cleanRoleName, cleanClusterTitle, limitedCourses, env);
    
    console.log(`[CourseMatching] Success via OpenRouter for: ${cleanRoleName}`);
    return jsonResponse<ApiResponse<CourseMatchingResult>>({
      success: true,
      data: result,
      source: 'openrouter',
    });
  } catch (openRouterError: any) {
    console.warn(`[CourseMatching] OpenRouter failed:`, openRouterError.message);

    // STEP 2: Try Gemini as fallback
    try {
      const result = await callGeminiForMatching(cleanRoleName, cleanClusterTitle, limitedCourses, env);
      
      console.log(`[CourseMatching] Success via Gemini for: ${cleanRoleName}`);
      return jsonResponse<ApiResponse<CourseMatchingResult>>({
        success: true,
        data: result,
        source: 'gemini',
      });
    } catch (geminiError: any) {
      console.warn(`[CourseMatching] Gemini failed:`, geminiError.message);

      // STEP 3: Return empty result (no fallback for matching)
      console.log(`[CourseMatching] All AI services failed for: ${cleanRoleName}`);
      return jsonResponse<ApiResponse<CourseMatchingResult>>({
        success: true,
        data: {
          matchedCourseIds: [],
          reasoning: 'AI services unavailable, unable to match courses',
        },
        source: 'fallback',
      });
    }
  }
}
