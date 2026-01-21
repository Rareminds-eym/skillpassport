/**
 * Program Career Paths Service
 * Frontend service to generate AI-powered career paths for degree programs
 */

export interface CareerPath {
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

export interface GenerateCareerPathsRequest {
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

export interface GenerateCareerPathsResponse {
  success: boolean;
  careerPaths?: CareerPath[];
  error?: string;
}

/**
 * Generate AI-powered career paths for a program
 */
export async function generateProgramCareerPaths(
  request: GenerateCareerPathsRequest
): Promise<CareerPath[]> {
  try {
    const API_URL =
      import.meta.env.VITE_ANALYZE_ASSESSMENT_API_URL ||
      'https://analyze-assessment-api.rareminds.workers.dev';

    const response = await fetch(`${API_URL}/generate-program-career-paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data: GenerateCareerPathsResponse = await response.json();

    if (!data.success || !data.careerPaths) {
      throw new Error(data.error || 'Failed to generate career paths');
    }

    console.log(
      '[CAREER_PATHS_SERVICE] Successfully generated',
      data.careerPaths.length,
      'career paths'
    );

    return data.careerPaths;
  } catch (error) {
    // Don't log error here - let the caller handle it
    throw error;
  }
}

/**
 * Generate career paths with fallback to hardcoded data
 */
export async function generateProgramCareerPathsWithFallback(
  request: GenerateCareerPathsRequest,
  fallbackPaths: CareerPath[]
): Promise<CareerPath[]> {
  try {
    // Try AI generation first
    const aiPaths = await generateProgramCareerPaths(request);
    return aiPaths;
  } catch (error) {
    // Silently use fallback - this is expected when Worker is not deployed
    console.log('[CAREER_PATHS_SERVICE] Using fallback career paths (AI service unavailable)');
    // Return fallback paths from COURSE_KNOWLEDGE_BASE
    return fallbackPaths;
  }
}
