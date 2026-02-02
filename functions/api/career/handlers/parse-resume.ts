/**
 * Parse Resume Handler - Extract structured data from resume text
 * 
 * Features:
 * - AI-powered resume parsing
 * - Structured data extraction
 * - Validation and sanitization
 * 
 * Source: cloudflare-workers/career-api/src/index.ts (handleParseResume)
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';
import { getModelForUseCase, callOpenRouterWithRetry } from '../../shared/ai-config';

export async function handleParseResume(request: Request, env: Record<string, string>): Promise<Response> {
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
    body = await request.json() as { resumeText: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { resumeText } = body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.length < 50) {
    return jsonResponse({ error: 'Valid resume text is required' }, 400);
  }

  const prompt = `Extract information from this resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words)
- DO NOT dump entire resume text into any single field
- Parse each section into separate array items with unique IDs
- Return ONLY the JSON object, no markdown formatting or backticks

Return ONLY the JSON object with this structure:
{
  "name": "",
  "email": "",
  "contact_number": "",
  "college_school_name": "",
  "university": "",
  "branch_field": "",
  "education": [{"id": 1, "degree": "", "department": "", "university": "", "yearOfPassing": "", "cgpa": "", "level": "Bachelor's", "status": "completed"}],
  "experience": [{"id": 1, "organization": "", "role": "", "duration": "", "description": "", "verified": false}],
  "projects": [{"id": 1, "title": "", "description": "", "technologies": [], "link": "", "status": "Completed"}],
  "technicalSkills": [{"id": 1, "name": "", "category": "", "level": 3, "verified": false}],
  "softSkills": [{"id": 1, "name": "", "level": 3}],
  "certificates": [{"id": 1, "title": "", "issuer": "", "issuedOn": "", "credentialId": "", "link": ""}],
  "training": []
}

Resume Text:
"""
${resumeText.slice(0, 15000)}
"""
`;

  try {
    const openRouterKey = getOpenRouterKey(env);
    if (!openRouterKey) {
      return jsonResponse({ error: 'OpenRouter API key not configured' }, 500);
    }

    // Use centralized AI call with retry logic
    const content = await callOpenRouterWithRetry(
      openRouterKey,
      [
        {
          role: 'system',
          content: 'You are an expert resume parser. You extract structured data from resume text with high accuracy. You always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        models: [getModelForUseCase('resume_parsing')],
        maxRetries: 3,
        maxTokens: 4096,
        temperature: 0.1
      }
    );

    if (!content) {
      return jsonResponse({ error: 'Empty response from AI' }, 500);
    }

    // Clean up response (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return jsonResponse({ error: 'Failed to parse AI response' }, 500);
    }

    return jsonResponse({ success: true, data: parsedData });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
