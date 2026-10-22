/**
 * Replay protection: a nonce is claimed before evidence is read.
 *
 * The distinction between "already used" and "store unreachable" is the
 * whole point of this module — a replay must be refused as a replay, and an
 * outage must stay an outage so the worker can retry.
 */
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EvidenceReplayError, claimEvidenceNonce } from '../api/internal/evidence-nonce';

function storeWith(
  respond: (row: Record<string, unknown>) => { error: null | { code: string; message: string } },
): { client: SupabaseClient; rows: Array<Record<string, unknown>> } {
  const rows: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      expect(table).toBe('internal_evidence_nonces');
      return {
        insert: async (row: Record<string, unknown>) => {
          rows.push(row);
          return respond(row);
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, rows };
}

describe('claimEvidenceNonce', () => {
  it('claims the nonce with its expiry', async () => {
    const store = storeWith(() => ({ error: null }));
    await claimEvidenceNonce(store.client, 'nonce-1', '2026-10-21T12:01:00.000Z');
    expect(store.rows).toEqual([
      { nonce: 'nonce-1', expires_at: '2026-10-21T12:01:00.000Z' },
    ]);
  });

  it('refuses a duplicate nonce as a replay', async () => {
    const store = storeWith(() => ({ error: { code: '23505', message: 'duplicate key' } }));
    await expect(
      claimEvidenceNonce(store.client, 'nonce-1', '2026-10-21T12:01:00.000Z'),
    ).rejects.toBeInstanceOf(EvidenceReplayError);
  });

  it('reports any other store failure as an outage, not a replay', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = storeWith(() => ({ error: { code: 'XX000', message: 'private diagnostic' } }));
    const attempt = claimEvidenceNonce(store.client, 'nonce-1', '2026-10-21T12:01:00.000Z');
    await expect(attempt).rejects.not.toBeInstanceOf(EvidenceReplayError);
    await expect(attempt).rejects.toThrowError('Evidence store is unavailable');
    vi.restoreAllMocks();
  });
});
