/**
 * Program Career Paths Service
 * Frontend service to generate AI-powered career paths for degree programs
 */

import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('program-career-paths-service');

const API_URL = getApiUrl('analyze-assessment');

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
  learnerProfile: {
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
    const response = await fetch(`${API_URL}/generate-program-career-paths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data: GenerateCareerPathsResponse = await response.json();

    if (!data.success || !data.careerPaths) {
      throw new Error(data.error || 'Failed to generate career paths');
    }

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
    // Using fallback - this is expected when Worker is not deployed
    logger.warn('AI career paths generation failed, using fallback', {
      program: request.programName,
      error: error instanceof Error ? error.message : String(error)
    });
    // Return fallback paths from COURSE_KNOWLEDGE_BASE
    return fallbackPaths;
  }
}
