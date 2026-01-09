/**
 * Assessment Analysis Handler
 * Main handler for /analyze-assessment endpoint
 */

import type { Env, AssessmentData, AnalysisResult } from '../types';
import { jsonResponse } from '../utils/cors';
import { authenticateUser } from '../utils/auth';
import { checkRateLimit } from '../utils/rateLimit';
import { analyzeAssessment } from '../services/openRouterService';

interface RequestBody {
  assessmentData: AssessmentData;
}

/**
 * Handle POST /analyze-assessment
 */
export async function handleAnalyzeAssessment(
  request: Request,
  env: Env
): Promise<Response> {
  // Only allow POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Check for development mode
  const isDevelopment = 
    env.VITE_SUPABASE_URL?.includes('localhost') || 
    request.headers.get('X-Dev-Mode') === 'true';

  let studentId: string;

  // Authentication
  if (isDevelopment) {
    studentId = 'test-student-' + Date.now();
    console.log('[DEV MODE] Bypassing authentication, using test student ID:', studentId);
  } else {
    const auth = await authenticateUser(request, env);
    if (!auth) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }
    studentId = auth.user.id;
  }

  // Rate limiting
  if (!checkRateLimit(studentId)) {
    return jsonResponse({ 
      error: 'Rate limit exceeded. Please try again in a minute.' 
    }, 429);
  }

  // Parse request body
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'assessmentData is required' }, 400);
  }

  console.log(`[ASSESSMENT] Analyzing for student ${studentId}`);
  console.log(`[ASSESSMENT] Stream: ${assessmentData.stream}, Grade: ${assessmentData.gradeLevel}`);

  try {
    // Analyze with AI
    const results = await analyzeAssessment(env, assessmentData);

    console.log(`[ASSESSMENT] Successfully analyzed for student ${studentId}`);
    
    const response: AnalysisResult = {
      success: true,
      data: results
    };

    return jsonResponse(response);

  } catch (error) {
    console.error('[ASSESSMENT] Analysis failed:', error);
    
    const response: AnalysisResult = {
      success: false,
      error: 'Assessment analysis failed',
      details: (error as Error).message
    };

    return jsonResponse(response, 500);
  }
}
