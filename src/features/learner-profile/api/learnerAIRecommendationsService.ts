/**
 * Learner AI Recommendations Service
 * 
 * Fetches AI-powered job recommendations from backend API using JWT authentication
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-ai-recommendations-service');

// Get API base URL from environment, fallback to current origin
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export interface AIRecommendation {
  id: string;
  title: string;
  job_title?: string;
  company_name: string;
  department?: string;
  sector?: string;
  description?: string;
  location: string;
  employment_type: string;
  experience_level?: string;
  posted_date?: string;
  status: string;
  match_percentage: number;
  match_reasons: {
    skill_match?: boolean;
    matched_skills?: string[];
    employment_type_match?: boolean;
    location_match?: boolean;
    department_match?: boolean;
    experience_match?: boolean;
    recent_post?: boolean;
  };
  final_score: number;
  isAIRecommended: boolean;
  [key: string]: any;
}

export interface AIRecommendationsData {
  recommendations: AIRecommendation[];
  cached: boolean;
  fallback: boolean;
  learnerProfile: {
    skills: {
      technical: string[];
      soft: string[];
    };
    preferences: {
      employmentTypes: string[];
      locations: string[];
      departments: string[];
    };
  };
}

export interface AIRecommendationsResponse {
  success: boolean;
  data?: AIRecommendationsData;
  error?: string;
}

/**
 * Fetch AI recommendations from backend API
 * Uses ssoClient to automatically inject JWT tokens
 */
export async function getLearnerAIRecommendations(): Promise<AIRecommendationsResponse> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/api/learners/ai-recommendations`;
    
    logger.info('Fetching AI recommendations from backend', { url });

    const response = await ssoClient.fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Failed to fetch AI recommendations', { 
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
    
    logger.info('AI recommendations fetched successfully', { 
      count: result.data?.recommendations?.length || 0,
      cached: result.data?.cached,
      fallback: result.data?.fallback
    });

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    logger.error('Failed to fetch AI recommendations', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}
