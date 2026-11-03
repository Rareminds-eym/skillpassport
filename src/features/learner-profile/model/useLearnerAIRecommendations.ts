import { recommendationPending } from '../../../../shared/contracts/job-recommendations';
import { useUser } from '@/shared/model/authStore';
import { useRecommendationQuery } from '@/shared/model/recommendations/useRecommendationQuery';
import { getLearnerRecommendationEnvelope } from '../api/learnerAIRecommendationsService';

export interface UseLearnerAIRecommendationsOptions {
  enabled?: boolean;
  autoFetch?: boolean;
  learnerId?: string;
}

export const useLearnerAIRecommendations = ({ enabled = true, autoFetch = true, learnerId = '' }: UseLearnerAIRecommendationsOptions = {}) => {
  const user = useUser();
  const query = useRecommendationQuery<Awaited<ReturnType<typeof getLearnerRecommendationEnvelope>>>({
    actorId: user?.id || '', orgId: user?.orgId || '', learnerId, surface: 'dashboard',
    enabled, autoFetch,
    pending: value => recommendationPending(value),
    load: signal => getLearnerRecommendationEnvelope(signal),
  });
  const data = query.data || null;
  return {
    recommendations: data?.recommendations || [],
    cached: data?.cached || false,
    fallback: data?.fallback === true,
    learnerProfile: data?.learnerProfile || null,
    readiness: data?.readiness || null,
    state: data?.state || null,
    loading: query.loading,
    processing: query.processing,
    error: query.error,
    fetchRecommendations: query.refresh,
    refreshRecommendations: query.refresh,
    data,
  };
};
