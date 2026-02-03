/**
 * Analyze Assessment Handler - Proxy to analyze-assessment Pages Function
 * 
 * This handler proxies requests to the dedicated analyze-assessment API
 * which provides comprehensive career assessment analysis.
 * 
 * Features (via analyze-assessment API):
 * - RIASEC career interest scoring
 * - Multi-aptitude battery analysis
 * - Big Five personality assessment
 * - Work values analysis
 * - Employability skills diagnostic
 * - Stream recommendation for after-10th students
 * - Career cluster matching with salary ranges
 * - Skill gap analysis and learning tracks
 * 
 * Migrated: Now calls /api/analyze-assessment Pages Function
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';

export async function handleAnalyzeAssessment(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  const { user } = auth;
  const studentId = user.id;

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429);
  }

  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return jsonResponse({ error: 'Assessment data is required' }, 400);
  }

  // Proxy to analyze-assessment Pages Function
  try {
    const url = new URL(request.url);
    const analyzeUrl = `${url.protocol}//${url.host}/api/analyze-assessment/analyze`;
    
    console.log(`[CAREER API] Proxying assessment analysis to: ${analyzeUrl}`);

    // Forward the request to the analyze-assessment API
    const analyzeRequest = new Request(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ assessmentData })
    });

    const response = await fetch(analyzeRequest);
    const data = await response.json();

    if (!response.ok) {
      console.error('[CAREER API] Analyze-assessment API error:', data);
      return jsonResponse(data, response.status);
    }

    console.log(`[CAREER API] Successfully analyzed assessment for student ${studentId}`);
    return jsonResponse(data);

  } catch (error) {
    console.error('[CAREER API] Failed to proxy to analyze-assessment API:', error);
    return jsonResponse({
      error: 'Assessment analysis failed',
      details: (error as Error).message
    }, 500);
  }
}
