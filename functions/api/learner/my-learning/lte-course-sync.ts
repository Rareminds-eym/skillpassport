import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { apiError, apiSuccess } from '../../../lib/response';
import { fetchLteCapabilities } from '../../../lib/lte/lte-capabilities';
import { upsertLteTrainings } from '../../../lib/lte/lte-sync-write';
import { createWriteDb } from '../../internal/lte/v1/write-db';

/**
 * POST /api/learner/my-learning/lte-course-sync
 * Fired when the learner opens MyLearning. Refreshes SP `trainings` from the
 * learner's current LTE capability snapshot via the SP → LTE capabilities
 * gateway (`POST {LTE_APP_URL}/api/internal/skillpassport`).
 *
 * Thin adapter: wires auth → pull → upsert; never blocks rendering (fail-open,
 * soft 502) so the page keeps showing cached trainings and retries next view.
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const userId = context.data.user.sub;

  try {
    const db = createWriteDb(env as never);

    // Resolve SP learner from the SSO user id.
    const learner = await db.queryOne<{ id: string }>(
      `learners?user_id=eq.${encodeURIComponent(userId)}&select=id`,
    );
    if (!learner) {
      return apiSuccess({ found: false, synced: 0, updated: 0, skipped: 0 }, context.request);
    }

    const capabilities = await fetchLteCapabilities(env, userId);
    const result = await upsertLteTrainings(db, learner.id, capabilities);

    return apiSuccess(
      { found: true, synced: result.synced, updated: result.updated, skipped: result.skipped },
      context.request,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    return apiError(502, 'LTE_SYNC_FAILED', message, context.request);
  }
});
