import type { GatewayAction } from '../types';
import { createWriteDb } from '../write-db';
import { upsertSingleProgressPayload } from '../../../../../lib/lte/lte-sync-write';

/**
 * Single-door gateway action: `lte:sync`
 * Executed when auth-sync-consumer processes a queue event from `lte-db-sync-queue`.
 * Accepts self-contained progress payload directly from queue and performs DB upsert.
 */
export const handleLteSync: GatewayAction = async (ctx, payload) => {
  const userId = ctx.userId;

  const db = createWriteDb(ctx.env);
  const learner = await db.queryOne<{ id: string }>(
    `learners?user_id=eq.${encodeURIComponent(userId)}&select=id`
  );

  if (!learner) {
    return { ok: false, error: { code: 'NOT_FOUND', message: 'Learner profile not found' } };
  }

  const syncResult = await upsertSingleProgressPayload(db, learner.id, (payload || {}) as Record<string, unknown>);
  return {
    ok: true,
    data: {
      synced: syncResult.synced,
      trainingId: syncResult.trainingId,
      timestamp: new Date().toISOString(),
    },
  };
};
