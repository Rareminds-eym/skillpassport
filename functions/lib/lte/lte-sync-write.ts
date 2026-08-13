import { WriteDbError, type WriteDb } from '../../api/internal/lte/v1/write-db';

/** LTE capability lifecycle statuses (mirrors LTE `capabilities:get` status). */
export type LteCapabilityStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export const LTE_CAPABILITY_STATUSES: readonly LteCapabilityStatus[] = [
  'not_started',
  'in_progress',
  'completed',
  'paused',
];

/** A single level inside an LTE capability (the progress ladder shown on the card). */
export interface LteSyncLevel {
  id?: string;
  code: string;
  title: string;
  status: string;
  completionPercentage: number;
  totalModules: number;
  completedModules: number;
}

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
  /** Real module count across the capability's published levels. */
  totalModules: number;
  /** Real modules the learner has completed across those levels. */
  completedModules: number;
  /** Per-level progress ladder; empty when the capability has no published levels. */
  levels: LteSyncLevel[];
  roleName?: string;
  resumeUrl?: string;
  /** Content fingerprint (SHA-256) from LTE — used to skip unchanged courses. */
  fingerprint?: string;
}

export interface LteSyncResult {
  synced: number;
  updated: number;
  /** Courses whose fingerprint matched the stored one — no write happened. */
  skipped: number;
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
  // Prefer the real module counts computed from LTE levels → modules. When the
  // capability has no published course content at all (no levels, no modules),
  // keep total_modules = 0 so the UI can show "no content yet" instead of a
  // fabricated "1".
  const hasContent = cap.totalModules > 0 || cap.totalLevels > 0;
  const totalModules = hasContent
    ? cap.totalModules > 0
      ? cap.totalModules
      : Math.max(1, cap.totalLevels)
    : 0;
  const completedModules = cap.completedModules > 0 ? cap.completedModules : Math.max(0, cap.currentLevel);

  return {
    lte_course_id: cap.id,
    source: 'lte',
    title: cap.name,
    description: cap.description ?? null,
    organization: cap.roleName ?? 'Rareminds LTE',
    status: TRAINING_STATUS[cap.status],
    completed_modules: cap.status === 'completed' ? totalModules : completedModules,
    total_modules: totalModules,
    hours_spent: cap.durationHours,
    approval_status: 'approved',
    resume_url: cap.resumeUrl ?? null, // deep-link back into LTE (built from LTE's LTE_PUBLIC_URL)
    lte_levels: cap.levels && cap.levels.length > 0 ? cap.levels : null, // per-level progress ladder
    lte_hash: cap.fingerprint ?? null, // change-detection fingerprint for delta sync
  };
}

/**
 * Upsert the snapshot into `trainings` keyed on (learner_id, source='lte',
 * lte_course_id), skipping courses whose fingerprint already matches the stored
 * `lte_hash` so an unchanged refresh is a no-op at the data layer. Idempotent;
 * a concurrent pull that races the INSERT surfaces as a 23505 unique_violation,
 * which we resolve by re-querying and updating.
 */
export async function upsertLteTrainings(
  db: WriteDb,
  learnerId: string,
  capabilities: LteSyncCapability[],
): Promise<LteSyncResult> {
  let synced = 0;
  let updated = 0;
  let skipped = 0;

  for (const cap of capabilities) {
    const row = mapCapabilityToTrainingRow(cap);
    const existing = await db.queryOne<{ id: string; lte_hash?: string | null }>(
      lteCourseQuery(learnerId, cap.id, 'id, lte_hash'),
    );

    if (existing) {
      // No fingerprint from LTE → can't prove "unchanged", so update (safe default).
      if (cap.fingerprint && existing.lte_hash === cap.fingerprint) {
        skipped += 1;
        continue;
      }
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

  return { synced, updated, skipped };
}
