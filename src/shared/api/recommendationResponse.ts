import { recommendationEnvelopeSchema, recommendationPending } from '../../../shared/contracts/job-recommendations';

export function recommendationRetryAt(headers: Headers): number | undefined {
  const value = headers.get('Retry-After');
  if (!value?.trim()) return undefined;
  const seconds = Number(value);
  const deadline = Number.isFinite(seconds) ? Date.now() + Math.max(0, seconds) * 1000 : Date.parse(value);
  return Number.isFinite(deadline) ? deadline : undefined;
}

export function parseRecommendationResponse(response: Response, data: unknown) {
  const envelope = recommendationEnvelopeSchema.parse(data);
  const pending = recommendationPending(envelope);
  if ((response.status === 202) !== Boolean(pending)) throw new Error('Invalid recommendation response status');
  if (pending) envelope.retry_at = Math.max(Date.now() + pending.retryAfterSeconds * 1000, recommendationRetryAt(response.headers) || 0);
  return envelope;
}
