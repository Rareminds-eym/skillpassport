import { z } from 'zod';

export const READINESS_POLICY_VERSION = 'career-readiness-4' as const;
export const contextCategorySchema = z.enum(['skills', 'education', 'experience', 'projects', 'credentials', 'completed_learning']);
export const recommendationReadinessSchema = z.object({
  state: z.enum(['needs_profile', 'limited_context', 'ready']),
  policyVersion: z.literal(READINESS_POLICY_VERSION),
  coverage: z.array(contextCategorySchema),
  suggestedActions: z.array(z.enum(['add_skill', 'add_education', 'describe_project', 'review_learning'])),
}).strict().superRefine((value, context) => {
  if ((value.state === 'ready') !== (value.coverage.length > 0)) context.addIssue({
    code: z.ZodIssueCode.custom, message: 'Readiness must agree with career-source coverage',
  });
});
export type RecommendationReadiness = z.infer<typeof recommendationReadinessSchema>;

// Shared response contract contains no source records, credentials or UI code.
export const recommendationEnvelopeSchema = z.object({
  schemaVersion: z.literal(2),
  state: z.enum(['needs_profile', 'limited_context', 'ready', 'no_matches', 'processing', 'index_building']),
  readiness: recommendationReadinessSchema,
  recommendations: z.array(z.object({ id: z.string().min(1) }).passthrough()).max(50),
  provenance: z.enum(['none', 'embedding', 'rules']),
  cached: z.boolean(),
  retry_after_seconds: z.number().int().min(1).max(60).optional(),
  input_revision: z.string().min(1),
}).passthrough().superRefine((value, context) => {
  const pending = value.state === 'processing' || value.state === 'index_building';
  if (pending) {
    if (value.readiness.state !== 'ready' || value.recommendations.length || value.provenance !== 'none' || value.cached || value.retry_after_seconds === undefined) context.addIssue({code:z.ZodIssueCode.custom,message:'Pending responses require ready context, a bounded wait and no personalized results'});
    return;
  }
  if (value.retry_after_seconds !== undefined) context.addIssue({code:z.ZodIssueCode.custom,message:'Only pending responses advertise a polling interval'});
  const blocked = value.state === 'needs_profile' || value.state === 'limited_context';
  if (blocked && (value.readiness.state !== value.state || value.recommendations.length || value.provenance !== 'none' || value.cached)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Profile-needed responses cannot contain personalized results or vector provenance' });
  }
  if (!blocked && (value.readiness.state !== 'ready' || value.provenance === 'none' || (value.state === 'no_matches') !== (value.recommendations.length === 0))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Result state must agree with readiness, provenance and results' });
  }
});
export type RecommendationEnvelope = z.infer<typeof recommendationEnvelopeSchema>;

export function recommendationPending(envelope: RecommendationEnvelope | null | undefined) {
  return envelope && (envelope.state === 'processing' || envelope.state === 'index_building') && typeof envelope.retry_after_seconds === 'number'
    ? { state: envelope.state, retryAfterSeconds: envelope.retry_after_seconds, retryAt: typeof envelope.retry_at === 'number' && Number.isFinite(envelope.retry_at) ? envelope.retry_at : undefined } : null;
}
