import { WriteDbError, type WriteDb } from '../../api/internal/lte/v1/write-db';

/** LTE capability lifecycle statuses (mirrors LTE `capabilities:get` status). */
export type LteCapabilityStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export const LTE_CAPABILITY_STATUSES: readonly LteCapabilityStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'paused',
];

/** A capability snapshot as returned by LTE's `capabilities:get`. */
export interface LteSyncCapability {
  id: string;
  code?: string;
  name: string;
  description?: string;
  status: LteCapabilityStatus;
  currentLevel: number;
  totalLevels: number;
  durationHours: number;
  roleName?: string;
  resumeUrl?: string;
}

export interface LteSyncResult {
  synced: number;
  updated: number;
}

/**
 * Map LTE capability status -> SP trainings.status. The trainings status check
 * constraint allows: ongoing | completed | not_started | paused.
 */
const TRAINING_STATUS: Record<LteCapabilityStatus, string> = {
  not_started: 'not_started',
  in_progress: 'ongoing',
  paused: 'paused',
  completed: 'completed',
};

/** PostgREST query selecting the upsert key for one synced LTE course. */
function lteCourseQuery(learnerId: string, courseId: string, select = 'id'): string {
  return (
    `trainings?learner_id=eq.${encodeURIComponent(learnerId)}` +
    '&source=eq.lte&lte_course_id=eq.' +
    encodeURIComponent(courseId) +
    `&select=${select}`
  );
}

export function mapCapabilityToTrainingRow(cap: LteSyncCapability): Record<string, unknown> {
  return {
    lte_course_id: cap.id,
    source: 'lte',
    title: cap.name,
    description: cap.description ?? null,
    organization: cap.roleName ?? 'Rareminds LTE',
    status: TRAINING_STATUS[cap.status],
    completed_modules: cap.status === 'completed' ? cap.totalLevels : Math.max(0, cap.currentLevel),
    total_modules: Math.max(1, cap.totalLevels),
    hours_spent: cap.durationHours,
    approval_status: 'approved',
    resume_url: cap.resumeUrl ?? null, // deep-link back into LTE (built from LTE's LTE_PUBLIC_URL)
  };
}

/**
 * Upsert the snapshot into `trainings` keyed on (learner_id, source='lte',
 * lte_course_id). Idempotent; a concurrent pull that races the INSERT surfaces
 * as a 23505 unique_violation, which we resolve by re-querying and updating.
 */
export async function upsertLteTrainings(
  db: WriteDb,
  learnerId: string,
  capabilities: LteSyncCapability[],
): Promise<LteSyncResult> {
  let synced = 0;
  let updated = 0;

  for (const cap of capabilities) {
    const row = mapCapabilityToTrainingRow(cap);
    const existing = await db.queryOne<{ id: string }>(lteCourseQuery(learnerId, cap.id));

    if (existing) {
      await db.update('trainings', existing.id, row);
      updated += 1;
    } else {
      try {
        await db.insert('trainings', { learner_id: learnerId, ...row });
        synced += 1;
      } catch (err) {
        if (err instanceof WriteDbError && err.code === '23505') {
          const concurrent = await db.queryOne<{ id: string }>(lteCourseQuery(learnerId, cap.id));
          if (concurrent) {
            await db.update('trainings', concurrent.id, row);
            updated += 1;
          }
        } else {
          throw err;
        }
      }
    }
  }

  return { synced, updated };
}
