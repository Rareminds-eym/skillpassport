import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { learningServiceRequest, learningEvaluationPolicy, LearningError } from './learning-eligibility';
import type { CareerPreferences } from '../../shared/contracts/career-preferences';

const summarySchema = z.object({
  schemaVersion: z.literal(1), evaluationPolicy: z.enum(['human', 'ai']), revision: z.string().regex(/^[a-f0-9]{32}$/), truncated: z.boolean(),
  levels: z.array(z.object({ levelId: z.string().uuid(), capabilityName: z.string().min(1).max(300), title: z.string().min(1).max(500), levelNumber: z.number().int().min(1).max(5), fingerprint: z.string().regex(/^[a-f0-9]{32}$/) }).strict()).max(50),
}).strict();

export async function prepareRecommendationLearning(db: SupabaseClient, env: Record<string, any>, learnerId: string, userId: string, preferences: CareerPreferences) {
  if (!preferences.useVerifiedLearning) return null;
  const policy = await learningEvaluationPolicy(db, userId, learnerId);
  const parsed = summarySchema.safeParse(await learningServiceRequest(env, '/api/v1/internal/learning/recommendation-summary', { userId, evaluationPolicy: policy }));
  if (!parsed.success || parsed.data.evaluationPolicy !== policy) throw new LearningError('LEARNING_UNAVAILABLE', 'Learning recommendations could not be verified.');
  const synced = await db.rpc('sync_recommendation_learning_dependency_v1', { p_learner_id: learnerId, p_user_id: userId, p_hash: parsed.data.revision });
  if (synced.error) throw new LearningError('LEARNING_UNAVAILABLE', 'Learning context revision could not be recorded.');
  return parsed.data;
}

/** Curated inferred intent only. No personality, scores, raw responses, or
 * generated skill claims enter career evidence or vector text. */
export function assessmentRoleIntent(value: unknown): string[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as any).clusters)) return [];
  return [...new Set<string>((value as any).clusters.slice(0, 3).flatMap((cluster: any) =>
    Array.isArray(cluster?.examples) ? cluster.examples.slice(0, 10).filter((role: unknown): role is string => typeof role === 'string' && role.trim().length > 0 && role.length <= 100).map((role: string) => role.normalize('NFKC').trim()) : [],
  ))].slice(0, 30);
}
