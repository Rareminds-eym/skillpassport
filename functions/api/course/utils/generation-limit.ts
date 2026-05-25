/**
 * Generation Limit Utility
 * 
 * Centralized logic for teacher-learner generation limits.
 * Handles fetching, checking, and incrementing generation counts.
 * 
 * Backend is the single source of truth for the limit value.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '../../../../src/shared/config/logging';

const logger = getLogger('generation-limit');

// Single source of truth for generation limit
export const TEACHER_GENERATION_LIMIT = 2;
export const GENERATION_COUNT_KEY = 'ai_tutor_generation_count';

export interface GenerationUsage {
  limit: number;
  used: number;
  remaining: number;
}

/**
 * Get the current generation usage for a user
 */
export async function getGenerationUsage(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<GenerationUsage> {
  const { data: userData, error } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', userId)
    .maybeSingle();

  if (error || !userData) {
    logger.error('Failed to fetch user metadata', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Failed to fetch generation usage');
  }

  const rawMetadata = userData.metadata;
  const metadata: Record<string, unknown> =
    typeof rawMetadata === 'object' && rawMetadata !== null && !Array.isArray(rawMetadata)
      ? (rawMetadata as Record<string, unknown>)
      : {};
  const rawCount = metadata[GENERATION_COUNT_KEY];
  const used = Number.isFinite(Number(rawCount)) ? Math.max(0, Math.floor(Number(rawCount))) : 0;
  const remaining = Math.max(0, TEACHER_GENERATION_LIMIT - used);

  return {
    limit: TEACHER_GENERATION_LIMIT,
    used,
    remaining,
  };
}

/**
 * Check if user has reached generation limit
 */
export async function hasReachedLimit(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<boolean> {
  const usage = await getGenerationUsage(supabaseAdmin, userId);
  return usage.used >= usage.limit;
}

/**
 * Increment generation count for a user
 * Returns the updated usage
 */
export async function incrementGenerationCount(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<GenerationUsage> {
  // Re-fetch latest to avoid race conditions
  const { data: latestUserData, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('metadata')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError || !latestUserData) {
    logger.error('Failed to fetch user metadata for increment', fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
    throw new Error('Failed to update generation usage');
  }

  const rawLatestMetadata = latestUserData.metadata;
  const latestMetadata: Record<string, unknown> =
    typeof rawLatestMetadata === 'object' && rawLatestMetadata !== null && !Array.isArray(rawLatestMetadata)
      ? (rawLatestMetadata as Record<string, unknown>)
      : {};
  const latestRawCount = latestMetadata[GENERATION_COUNT_KEY];
  const latestCount = Number.isFinite(Number(latestRawCount)) ? Math.max(0, Math.floor(Number(latestRawCount))) : 0;
  const newCount = latestCount + 1;

  // Update with incremented count
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      metadata: {
        ...latestMetadata,
        [GENERATION_COUNT_KEY]: newCount,
      },
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    logger.error('Failed to update generation count', updateError instanceof Error ? updateError : new Error(String(updateError)));
    throw new Error('Failed to update generation usage');
  }

  // Verify the update
  const verifiedUsage = await getGenerationUsage(supabaseAdmin, userId);
  
  logger.info('Generation count incremented', {
    userId,
    used: verifiedUsage.used,
    remaining: verifiedUsage.remaining,
  });

  return verifiedUsage;
}
