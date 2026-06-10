/**
 * Learner Assessment Service
 * 
 * Fetches assessment recommendations from backend API using JWT authentication
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-assessment-service');

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

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
 * Uses learnerId from store for consistency
 */
export async function getLearnerAssessmentData(learnerId?: string): Promise<AssessmentResponse> {
  try {
    let url = `${ORIGIN}/api/learners/assessments`;
    // If learnerId provided, use it; otherwise rely on JWT
    if (learnerId) {
      url += `?id=${encodeURIComponent(learnerId)}`;
    }
    
    logger.info('Fetching assessment data from backend', { url });

    const response = await ssoClient.fetch(url, {
      method: 'GET',
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
