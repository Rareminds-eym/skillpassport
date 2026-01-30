/**
 * Program Career Paths Handler
 * Generate AI-powered career paths for degree programs
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { authenticateUser } from '../../shared/auth';
import type { PagesEnv } from '../../../../src/functions-lib/types';
import { callOpenRouterWithRetry, getAPIKeys } from '../../shared/ai-config';

interface CareerPath {
  role: string;
  salary: {
    min: number;
    max: number;
  };
  matchScore?: number;
  whyItFits?: string;
  requiredSkills?: string[];
  growthPotential?: string;
}

interface GenerateCareerPathsRequest {
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

/**
 * Build prompt for career path generation
 */
function buildCareerPathPrompt(request: GenerateCareerPathsRequest): string {
  const { programName, programCategory, programStream, studentProfile } = request;
  const { riasecScores, aptitudeScores, topSkills, interests, projects, experiences } = studentProfile;

  // Get top 3 RIASEC types
  const riasecEntries = Object.entries(riasecScores).sort((a, b) => b[1] - a[1]);
  const topRiasec = riasecEntries.slice(0, 3).map(([type, score]) => `${type}: ${score}`).join(', ');

  const prompt = `You are a career counselor helping a student understand career opportunities for their degree program.

Program Details:
- Program: ${programName}
- Category: ${programCategory}
- Stream: ${programStream}

Student Profile:
- RIASEC Personality (top 3): ${topRiasec}
${aptitudeScores ? `- Aptitude Strengths: ${Object.entries(aptitudeScores).filter(([_, v]) => v && v > 60).map(([k, v]) => `${k}: ${v}%`).join(', ') || 'Not assessed'}` : ''}
${topSkills && topSkills.length > 0 ? `- Top Skills: ${topSkills.join(', ')}` : ''}
${interests && interests.length > 0 ? `- Interests: ${interests.join(', ')}` : ''}
${projects && projects.length > 0 ? `- Projects: ${projects.map(p => p.title).join(', ')}` : ''}
${experiences && experiences.length > 0 ? `- Experience: ${experiences.map(e => e.role).join(', ')}` : ''}

Generate 5-8 career paths that:
1. Are realistic for graduates of ${programName}
2. Match the student's RIASEC personality profile
3. Consider their aptitude strengths and interests
4. Include both traditional and emerging roles
5. Cover a range of salary levels

For each career path, provide:
- role: Job title
- salary: {min: number, max: number} in USD per year
- matchScore: 1-100 based on student profile fit
- whyItFits: 2-3 sentences explaining why this role suits the student
- requiredSkills: Array of 3-5 key skills needed
- growthPotential: 1-2 sentences about career growth

Return ONLY a valid JSON array of career paths. No markdown, no explanation.

Example format:
[
  {
    "role": "Data Scientist",
    "salary": {"min": 80000, "max": 150000},
    "matchScore": 92,
    "whyItFits": "Your strong analytical skills and interest in problem-solving align perfectly with data science. The role combines technical expertise with business impact.",
    "requiredSkills": ["Python", "Machine Learning", "Statistics", "SQL", "Data Visualization"],
    "growthPotential": "High demand field with opportunities to advance to Senior Data Scientist, ML Engineer, or Chief Data Officer roles."
  }
]`;

  return prompt;
}

/**
 * Parse and validate career paths from AI response
 */
function parseCareerPaths(content: string): CareerPath[] {
  try {
    // Remove markdown code blocks if present
    let cleaned = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Find JSON array boundaries
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');

    if (startIdx === -1 || endIdx === -1) {
      throw new Error('No JSON array found in response');
    }

    cleaned = cleaned.substring(startIdx, endIdx + 1);

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Validate and normalize each career path
    const careerPaths: CareerPath[] = parsed.map((path: any) => ({
      role: path.role || 'Unknown Role',
      salary: {
        min: path.salary?.min || 40000,
        max: path.salary?.max || 80000,
      },
      matchScore: path.matchScore || 70,
      whyItFits: path.whyItFits || 'This role aligns with your program and profile.',
      requiredSkills: Array.isArray(path.requiredSkills) ? path.requiredSkills : [],
      growthPotential: path.growthPotential || 'Good growth potential in this field.',
    }));

    return careerPaths;
  } catch (error: any) {
    console.error('Failed to parse career paths:', error.message);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Handle program career paths generation
 */
export async function handleGenerateProgramCareerPaths(
  request: Request,
  env: PagesEnv
): Promise<Response> {
  try {
    // Optional authentication (allow unauthenticated for public program exploration)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        await authenticateUser(request, env as unknown as Record<string, string>);
      } catch (authError) {
        console.log('⚠️ Authentication failed, proceeding without auth');
      }
    }

    // Parse request body
    const body = await request.json() as GenerateCareerPathsRequest;

    // Validate required fields
    if (!body.programName || !body.programCategory || !body.studentProfile?.riasecScores) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing required fields: programName, programCategory, studentProfile.riasecScores',
        },
        400
      );
    }

    console.log(`🎓 Generating career paths for: ${body.programName}`);

    // Get API keys
    const { openRouter } = getAPIKeys(env);

    if (!openRouter) {
      return jsonResponse(
        {
          success: false,
          error: 'OpenRouter API key not configured',
        },
        500
      );
    }

    // Build prompt
    const prompt = buildCareerPathPrompt(body);

    // Call AI
    const content = await callOpenRouterWithRetry(
      openRouter,
      [
        {
          role: 'system',
          content: 'You are an expert career counselor with deep knowledge of various industries and career paths.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        maxTokens: 2000,
        temperature: 0.7,
      }
    );

    // Parse response
    const careerPaths = parseCareerPaths(content);

    console.log(`✅ Generated ${careerPaths.length} career paths`);

    return jsonResponse({
      success: true,
      careerPaths,
    });
  } catch (error: any) {
    console.error('❌ Error generating program career paths:', error);
    return jsonResponse(
      {
        success: false,
        error: error.message || 'Failed to generate career paths',
      },
      500
    );
  }
}
