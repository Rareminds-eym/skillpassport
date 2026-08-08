/**
 * Parse Resume Handler - Extract structured data from resume text
 *
 * Features:
 * - Deterministic (script-based) resume parsing — no AI/LLM call
 * - Structured data extraction
 * - Validation and sanitization
 *
 * Source: cloudflare-workers/career-api/src/index.ts (handleParseResume)
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { checkRateLimit } from '../utils/rate-limit';
import { parseResumeDeterministic } from './resume-parser/parser';

export async function handleParseResume(request: Request, env: Record<string, string>, learnerId: string): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  if (!await checkRateLimit(learnerId, env)) {
    return apiError(429, 'ERROR', 'Rate limit exceeded', request);
  }

  let body;
  try {
    body = await request.json() as { resumeText: string };
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
  }

  const { resumeText } = body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.length < 50) {
    return apiError(400, 'VALIDATION_ERROR', 'Valid resume text is required', request);
  }

  try {
    const parsedData = parseResumeDeterministic(resumeText);
    return apiSuccess({ data: parsedData }, request);
  } catch (error) {
    console.error('Resume parsing error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message, request);
  }
}
