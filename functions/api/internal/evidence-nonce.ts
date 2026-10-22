/**
 * Replay protection for the internal evidence API.
 *
 * Every signed request carries a nonce. The nonce is claimed atomically in
 * the database before any evidence is read, so the same signed request can
 * be served at most once: a second presentation fails the primary-key
 * insert and is refused as a replay.
 *
 * Only a duplicate is a replay. Any other store error is an outage and is
 * reported as such — an unreachable nonce store must never be mistaken for
 * a used nonce, nor silently skipped.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** The nonce was already used by an earlier request. */
export class EvidenceReplayError extends Error {
  constructor(message = 'Evidence request has already been used') {
    super(message);
    this.name = 'EvidenceReplayError';
  }
}

/**
 * Claim the request nonce. Throws `EvidenceReplayError` on a duplicate and a
 * plain error when the store cannot be reached.
 */
export async function claimEvidenceNonce(
  supabase: SupabaseClient,
  nonce: string,
  expiresAt: string,
): Promise<void> {
  const { error } = await supabase
    .from('internal_evidence_nonces')
    .insert({ nonce, expires_at: expiresAt });

  if (!error) return;

  // 23505 = unique violation: the nonce is already claimed.
  if (error.code === '23505') {
    throw new EvidenceReplayError();
  }
  console.error('[evidence] nonce claim failed', { code: error.code });
  throw new Error('Evidence store is unavailable');
}
