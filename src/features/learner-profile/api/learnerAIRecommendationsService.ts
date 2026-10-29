/**
 * Learner AI Recommendations Service
 * 
 * Fetches AI-powered job recommendations from backend API using JWT authentication
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { parseRecommendationResponse, recommendationRetryAt } from '@/shared/api/recommendationResponse';
import { getLogger } from '@/shared/config/logging';
import { type RecommendationReadiness, type RecommendationEnvelope } from '../../../../shared/contracts/job-recommendations';

const logger = getLogger('learner-ai-recommendations-service');

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

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
  schemaVersion?: number;
  readiness?: RecommendationReadiness;
  recommendations: AIRecommendation[];
  cached: boolean;
  fallback?: boolean;
  learnerProfile?: {
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
export async function getLearnerRecommendationEnvelope(signal?: AbortSignal) {
  const response = await ssoClient.fetch(`${ORIGIN}/api/learners/ai-recommendations`, {
    method: 'GET', signal, headers: { 'Content-Type': 'application/json' },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const detail = result.error;
    const retryAt = recommendationRetryAt(response.headers);
    throw Object.assign(new Error((typeof detail === 'string' ? detail : detail?.message) || `Job recommendations unavailable (${response.status})`), {
      status: response.status, code: typeof detail === 'object' ? detail?.code : result.code,
      retryAt: retryAt,
    });
  }
  const envelope = parseRecommendationResponse(response, result.data);
  return envelope as RecommendationEnvelope & { learnerProfile?: AIRecommendationsData['learnerProfile'] };
}

/** Compatibility response for callers outside the migrated query hook. */
export async function getLearnerAIRecommendations(): Promise<AIRecommendationsResponse> {
  try {
    const data = await getLearnerRecommendationEnvelope();
    return { success: true, data: data as unknown as AIRecommendationsData };
  } catch (error: any) {
    logger.error('Failed to fetch AI recommendations', error);
    return { success: false, error: error.message || 'Network error' };
  }
}
