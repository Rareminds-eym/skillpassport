import { recommendationPending } from '../../../../shared/contracts/job-recommendations';
import { getJobRecommendations } from '../api/aiJobMatchingService';
import { useUser } from '@/shared/model/authStore';
import { useRecommendationQuery } from '@/shared/model/recommendations/useRecommendationQuery';

/** Query-owned envelope with a compatibility view for existing job cards. */
export const useAIJobMatching = (learnerProfile: any, enabled = true, topN = 3) => {
  const user = useUser();
  const learnerId = learnerProfile?.id || learnerProfile?.learner_id || '';
  const limit = Number.isFinite(topN) ? Math.max(1, Math.min(50, Math.trunc(topN))) : 3;
  const query = useRecommendationQuery<Awaited<ReturnType<typeof getJobRecommendations>>>({
    actorId: user?.id || '', orgId: user?.orgId || '', learnerId, surface: 'semantic', limit,
    profileRevision: String(learnerProfile?.recommendation_revision ?? learnerProfile?.updated_at ?? ''),
    enabled: enabled && (!learnerProfile?.user_id || learnerProfile.user_id === user?.id),
    pending: value => recommendationPending(value?.envelope),
    load: (signal, force) => getJobRecommendations({ id: learnerId }, limit, force, signal),
  });
  const envelope = query.data?.envelope || null;
  return {
    matchedJobs: query.data?.matches || [],
    loading: query.loading,
    processing: query.processing,
    error: query.error,
    cacheInfo: envelope ? { cached: envelope.cached, computedAt: envelope.computed_at } : {},
    readiness: envelope?.readiness || null,
    state: envelope?.state || null,
    envelope,
    refreshMatches: query.refresh,
  };
};
export default useAIJobMatching;
