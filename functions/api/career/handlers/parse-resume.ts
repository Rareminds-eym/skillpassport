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

import { apiSuccess, apiError } from '../../../lib/response';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';
import { getModelForUseCase, callOpenRouterWithRetry } from '../../shared/ai-config';

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

  const prompt = `Extract information from this ENTIRE resume and return ONLY a valid JSON object.

CRITICAL RULES:
- name: Extract ONLY the person's full name (2-4 words)
- DO NOT dump entire resume text into any single field
- Parse each section into separate array items with unique IDs
- IMPORTANT: Extract ALL experiences, projects, skills, and certificates from the ENTIRE resume document
- Read through ALL pages and sections - do not stop after the first page
- For experience: Include organization, role, duration, and a brief description for EACH job
- Extract profile/contact fields when present: address, city, state, country, pincode, bio, LinkedIn, GitHub, portfolio, Twitter, Facebook, Instagram, interests, languages, and hobbies
- Return interests, languages, and hobbies as arrays of strings, not comma-separated strings
- For education: Extract ALL education levels including:
  * School education (10th/SSLC, 12th/HSC) with level "10th" or "12th"
  * Diploma education with level "Diploma"
  * Bachelor's degree with level "Bachelor's"
  * Master's degree with level "Master's"
  * Doctoral/PhD with level "Doctoral"
  * Include school/college/university name, board/university, year of passing, and percentage/CGPA/grade
- Return ONLY the JSON object, no markdown formatting or backticks

Return ONLY the JSON object with this structure:
{
  "name": "",
  "email": "",
  "contact_number": "",
  "alternate_number": "",
  "date_of_birth": "",
  "address": "",
  "city": "",
  "state": "",
  "country": "",
  "pincode": "",
  "college_school_name": "",
  "university": "",
  "branch_field": "",
  "registration_number": "",
  "bio": "",
  "linkedin_link": "",
  "github_link": "",
  "portfolio_link": "",
  "twitter_link": "",
  "facebook_link": "",
  "instagram_link": "",
  "interests": [],
  "languages": [],
  "hobbies": [],
  "education": [
    {"id": 1, "degree": "SSLC/10th Standard", "department": "", "university": "State Board", "yearOfPassing": "2015", "cgpa": "85%", "level": "10th", "status": "completed"},
    {"id": 2, "degree": "HSC/12th Standard", "department": "Science", "university": "State Board", "yearOfPassing": "2017", "cgpa": "80%", "level": "12th", "status": "completed"},
    {"id": 3, "degree": "B.Tech", "department": "Computer Science", "university": "Anna University", "yearOfPassing": "2021", "cgpa": "8.5", "level": "Bachelor's", "status": "completed"}
  ],
  "experience": [{"id": 1, "organization": "", "role": "", "duration": "", "description": "", "verified": false}],
  "projects": [{"id": 1, "title": "", "description": "", "technologies": [], "link": "", "status": "Completed"}],
  "technicalSkills": [{"id": 1, "name": "", "category": "", "level": 3, "verified": false}],
  "softSkills": [{"id": 1, "name": "", "level": 3}],
  "certificates": [{"id": 1, "title": "", "issuer": "", "issuedOn": "", "credentialId": "", "link": ""}],
  "training": []
}

Resume Text:
"""
${resumeText.slice(0, 50000)}
"""
`;

  try {
    const openRouterKey = getOpenRouterKey(env);
    if (!openRouterKey) {
      return apiError(500, 'INTERNAL_ERROR', 'OpenRouter API key not configured', request);
    }

    // Use centralized AI call with retry logic
    const content = await callOpenRouterWithRetry(
      openRouterKey,
      [
        {
          role: 'system',
          content: 'You are an expert resume parser. You extract structured data from resume text with high accuracy. Extract ALL education levels (10th, 12th, Diploma, Bachelor\'s, Master\'s), ALL experiences, projects, skills, and certificates found in the ENTIRE resume, not just the first page. You always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        models: [getModelForUseCase('resume_parsing')],
        maxRetries: 3,
        maxTokens: 3000,  // Increased to allow for more comprehensive extraction
        temperature: 0.1
      }
    );

    if (!content) {
      return apiError(500, 'INTERNAL_ERROR', 'Empty response from AI', request);
    }

    // Clean up response (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to parse AI response', request);
    }

    return apiSuccess(parsedData, request);

  } catch (error) {
    console.error('Resume parsing error:', error);
    return apiError(500, 'INTERNAL_ERROR', (error as Error).message, request);
  }
}
