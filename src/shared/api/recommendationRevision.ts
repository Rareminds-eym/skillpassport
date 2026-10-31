import { apiGet } from './apiClient';

export async function loadRecommendationRevision(learnerId: string, signal: AbortSignal): Promise<{ inputRevision: string; catalogRevision: string }> {
  const result = await apiGet<{ data: { learnerId: string; inputRevision: string; catalogRevision: string } }>(`/learners/recommendation-revision?learnerId=${encodeURIComponent(learnerId)}`, { signal });
  if (result.data?.learnerId !== learnerId || !/^\d+$/.test(result.data.inputRevision) || !/^\d+$/.test(result.data.catalogRevision)) throw new Error('Career context revision could not be verified.');
  return result.data;
}
