import type { SupabaseClient } from '@supabase/supabase-js';
import { validateEmbeddingVector } from '../../embedding/services/embeddingValidation';
import { RECOMMENDATION_PREPROCESSING_VERSION, RECOMMENDATION_RANKING_POLICY_VERSION } from './recommendation-versions';

export interface RecommendationState {
  revision: string;
  catalog_revision: string;
  embedding: number[] | null;
  matches: any[] | null;
  computed_at: string | null;
  algorithm_version: 'v1.0' | 'v2.0' | null;
}

export async function readRecommendationState(db: SupabaseClient, learnerId: string, userId: string, model: string): Promise<RecommendationState> {
  const { data, error } = await db.rpc('get_recommendation_state_v3', {
    p_learner_id: learnerId, p_user_id: userId, p_model: model,
    p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION,
  });
  if (error || !data || typeof data.revision !== 'string' || typeof data.catalog_revision !== 'string') {
    throw new Error('RECOMMENDATION_STATE_UNAVAILABLE');
  }
  if (typeof data.embedding === 'string') data.embedding = JSON.parse(data.embedding);
  if (data.embedding !== null) validateEmbeddingVector(data.embedding);
  if (data.matches !== null && !Array.isArray(data.matches)) throw new Error('INVALID_RECOMMENDATION_CACHE');
  if (data.matches !== null && !['v1.0', 'v2.0'].includes(data.algorithm_version)) throw new Error('INVALID_RECOMMENDATION_CACHE_VERSION');
  return data;
}

export async function publishRecommendationVector(db: SupabaseClient, learnerId: string, userId: string, revision: string, model: string, embedding: number[]): Promise<boolean> {
  validateEmbeddingVector(embedding);
  const { data, error } = await db.rpc('publish_recommendation_vector_v3', {
    p_learner_id: learnerId, p_user_id: userId, p_revision: revision, p_model: model, p_embedding: embedding,
    p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION,
  });
  if (error) throw new Error('VECTOR_PUBLICATION_UNAVAILABLE');
  return data === true;
}
