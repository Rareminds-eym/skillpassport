/**
 * Learner Assessment Service
 * 
 * Fetches assessment recommendations from backend API using JWT authentication
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-assessment-service');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export interface AssessmentRecommendations {
  recommendedTrack: string | null;
  learningTracks: any[];
  coursesByType: {
    technical: any[];
    soft: any[];
  };
  careerClusters: any[];
  prioritySkills: any[];
  strengths: any[];
  certifications: any[];
  projects: any[];
  readiness: any;
  riasecCode: string | null;
  aptitudeStrengths: any[];
  assessmentDate: string;
  streamId: string | null;
}

export interface AssessmentData {
  hasAssessment: boolean;
  hasInProgressAssessment: boolean;
  inProgressAttempt: any | null;
  latestAttemptId: string | null;
  recommendations: AssessmentRecommendations | null;
  latestResult: any | null;
}

export interface AssessmentResponse {
  success: boolean;
  data?: AssessmentData;
  error?: string;
}

/**
 * Fetch assessment recommendations from backend API
 * Uses JWT token from HTTP-only cookie for authentication
 */
export async function getLearnerAssessmentData(): Promise<AssessmentResponse> {
  try {
    const url = `${API_BASE_URL}/api/learners/assessments`;
    
    logger.info('Fetching assessment data from backend', { url });

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include HTTP-only cookies (JWT token)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Failed to fetch assessment data', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorData 
      });
      
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();
    
    logger.info('Assessment data fetched successfully', { 
      hasAssessment: result.data?.hasAssessment,
      hasInProgress: result.data?.hasInProgressAssessment
    });

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    logger.error('Failed to fetch assessment data', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}
