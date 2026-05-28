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
 * - Stream recommendation for after-10th learners
 * - Career cluster matching with salary ranges
 * - Skill gap analysis and learning tracks
 * 
 * Migrated: Now calls /api/analyze-assessment Pages Function
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { checkRateLimit } from '../utils/rate-limit';

export async function handleAnalyzeAssessment(request: Request, env: Record<string, string>, learnerId: string): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  if (!await checkRateLimit(learnerId, env)) {
    return apiError(429, 'ERROR', 'Rate limit exceeded', request);
  }

  let body;
  try {
    body = await request.json() as { assessmentData: any };
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
  }

  const { assessmentData } = body;

  if (!assessmentData) {
    return apiError(400, 'VALIDATION_ERROR', 'Assessment data is required', request);
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
      return apiError(response.status, 'ERROR', (data as any)?.error || `Request failed with status ${response.status}`, request);
    }

    console.log(`[CAREER API] Successfully analyzed assessment for learner ${learnerId}`);
    return apiSuccess(data, request);

  } catch (error) {
    console.error('[CAREER API] Failed to proxy to analyze-assessment API:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Assessment analysis failed', request);
  }
}
