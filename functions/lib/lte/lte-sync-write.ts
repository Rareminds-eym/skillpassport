import { type WriteDb, WriteDbError } from '../../api/internal/lte/v1/write-db';

/** A single module inside an LTE level (used by the UI progress card ladder). */
export interface LteSyncModule {
  id?: string;
  title: string;
  status: string;
  completionPercentage: number;
}

/** A single level inside an LTE capability (the progress ladder shown on the UI card). */
export interface LteSyncLevel {
  id?: string;
  code: string;
  title: string;
  status: string;
  completionPercentage: number;
  totalModules: number;
  completedModules: number;
  modules?: LteSyncModule[];
}

/**
 * Upserts a single progress payload emitted by `lte` via Cloudflare Queue
 * (`lte-db-sync-queue`) into `skillpassport` database tables (`trainings` & `skills`).
 */
export async function upsertSingleProgressPayload(
  db: WriteDb,
  learnerId: string,
  payload: Record<string, unknown>,
): Promise<{ synced: boolean; trainingId: string | null }> {
  const lteCourseId = String(payload.lteCourseId || payload.levelId || '');
  if (!lteCourseId) {
    throw new Error('Missing lteCourseId in queue payload');
  }

  const status = String(payload.status || 'in_progress');
  const rawCompleted = Math.max(0, Number(payload.completedModules ?? 0));
  const totalModules = Math.max(0, Number(payload.totalModules ?? 0));
  const completedModules = totalModules > 0 ? Math.min(rawCompleted, totalModules) : rawCompleted;
  const durationHours = Number(payload.durationHours || 0);

  let currentLevelNum = 1;
  if (Array.isArray(payload.levels) && payload.levels.length > 0) {
    const activeIdx = payload.levels.findIndex((l: any) => l.status === 'in_progress' || l.status === 'ongoing');
    if (activeIdx >= 0) {
      currentLevelNum = activeIdx + 1;
    } else {
      const completedCount = payload.levels.filter((l: any) => l.status === 'completed').length;
      currentLevelNum = Math.min(completedCount + 1, payload.levels.length);
    }
  }

  const totalDurationHours = Number(payload.totalDurationHours || 35);
  const resumeUrl = payload.resumeUrl ? String(payload.resumeUrl) : null;

  const row = {
    source: 'lte',
    lte_course_id: lteCourseId,
    title: String(payload.courseTitle || `LTE Course ${lteCourseId}`),
    organization: 'Rareminds LTE',
    status: status === 'completed' ? 'completed' : 'ongoing',
    completed_modules: completedModules,
    total_modules: totalModules,
    hours_spent: durationHours,
    duration: `${totalDurationHours} hrs`,
    resume_url: resumeUrl,
    approval_status: 'approved',
    lte_course_code: payload.lteCourseCode ? String(payload.lteCourseCode) : null,
    lte_levels: Array.isArray(payload.levels) && payload.levels.length > 0 ? payload.levels : null,
    lte_current_level: currentLevelNum,
    lte_total_levels: Array.isArray(payload.levels) && payload.levels.length > 0 ? payload.levels.length : 1,
  };

  const existing = await db.queryOne<{ id: string; completed_modules: number; status: string }>(
    `trainings?learner_id=eq.${encodeURIComponent(learnerId)}&source=eq.lte&lte_course_id=eq.${encodeURIComponent(lteCourseId)}&select=id,completed_modules,status`
  );

  let targetTrainingId: string | null = null;

  if (existing) {
    targetTrainingId = existing.id;
    const isCompleted = existing.status === 'completed';
    const isStale = (existing.completed_modules || 0) > completedModules;
    const safeRow = {
      ...row,
      status: isCompleted ? 'completed' : row.status,
      completed_modules: isStale ? existing.completed_modules : row.completed_modules,
    };
    await db.update('trainings', existing.id, safeRow);
  } else {
    try {
      const inserted = await db.insert<{ id: string }>('trainings', { learner_id: learnerId, ...row });
      targetTrainingId = inserted?.id ?? null;
    } catch (err) {
      if (err instanceof WriteDbError && err.code === '23505') {
        const concurrent = await db.queryOne<{ id: string }>(
          `trainings?learner_id=eq.${encodeURIComponent(learnerId)}&source=eq.lte&lte_course_id=eq.${encodeURIComponent(lteCourseId)}&select=id`
        );
        if (concurrent) {
          targetTrainingId = concurrent.id;
          await db.update('trainings', concurrent.id, row);
        }
      } else {
        throw err;
      }
    }
  }

  if (Array.isArray(payload.earnedSkills) && payload.earnedSkills.length > 0) {
    for (const item of payload.earnedSkills) {
      const skillName = typeof item === 'string' ? item.trim() : (item && typeof item === 'object' && 'name' in item) ? String((item as any).name).trim() : '';
      if (!skillName) continue;

      const explicitLevel = (item && typeof item === 'object' && 'level' in item) ? Number((item as any).level) : 0;
      const computedSkillLevel = explicitLevel > 0 ? explicitLevel : Math.max(1, currentLevelNum);
      const lteSkillId = item && typeof item === 'object' && 'id' in item ? String((item as any).id) : (item && typeof item === 'object' && 'lteSkillId' in item) ? String((item as any).lteSkillId) : null;

      try {
        const queryByLteId = lteSkillId
          ? `skills?learner_id=eq.${encodeURIComponent(learnerId)}&lte_skill_id=eq.${encodeURIComponent(lteSkillId)}&select=id`
          : null;
        const existingSkill = (queryByLteId ? await db.queryOne<{ id: string }>(queryByLteId) : null)
          || await db.queryOne<{ id: string }>(
            `skills?learner_id=eq.${encodeURIComponent(learnerId)}&name=eq.${encodeURIComponent(skillName)}&select=id`
          );
        if (!existingSkill) {
          await db.insert('skills', {
            learner_id: learnerId,
            name: skillName,
            type: 'technical',
            level: computedSkillLevel,
            training_id: targetTrainingId,
            verified: true,
            approval_status: 'approved',
            source: 'lte',
            ...(lteSkillId ? { lte_skill_id: lteSkillId } : {}),
          });
        }
      } catch (skillErr) {
        // Fail-soft for skills insertion
      }
    }
  }

  return { synced: true, trainingId: targetTrainingId };
}
