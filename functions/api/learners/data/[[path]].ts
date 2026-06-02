import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiMethodNotAllowed } from '../../../lib/response';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'college_admin', 'university_admin', 'school_admin'];

function isAdmin(user: any): boolean {
  return user?.roles?.some((r: string) => ADMIN_ROLES.includes(r));
}

const LEVEL_MAP: Record<string, number> = {
  beginner: 1, '1': 1,
  intermediate: 2, '2': 2,
  advanced: 3, '3': 3,
  expert: 4, '4': 4,
};

function normalizeLevel(level: unknown): number {
  if (typeof level === 'number') return level;
  if (typeof level === 'string') return LEVEL_MAP[level.trim().toLowerCase()] || 3;
  return 3;
}

async function ensureOwnData(supabase: any, user: any, learnerId: string): Promise<{ allowed: boolean; response?: Response }> {
  if (isAdmin(user)) return { allowed: true };
  const { data: learner } = await supabase
    .from('learners')
    .select('user_id, email')
    .eq('id', learnerId)
    .maybeSingle();
  if (!learner) return { allowed: false, response: forbiddenResponse() };
  if (learner.user_id === user.id) return { allowed: true };
  if (!learner.user_id && learner.email === user.email) return { allowed: true };
  return { allowed: false, response: forbiddenResponse() };
}

function forbiddenResponse(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only access your own data' },
      data: null,
      meta: { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() },
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } },
  );
}

const ENTITY_SYNC_TABLES = new Set([
  'education', 'experience', 'certificates', 'projects', 'trainings', 'skills',
  'recent_updates',
]);

const TABLE_ID_COLUMN: Record<string, string> = {
  education: 'learner_id',
  experience: 'learner_id',
  certificates: 'learner_id',
  projects: 'learner_id',
  trainings: 'learner_id',
  skills: 'learner_id',
  recent_updates: 'learner_id',
};

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const path = (context.params as any).path as string[] || [];
  const url = new URL(context.request.url);

  if (path.length === 1 && path[0] === 'find-by-email') {
    const email = url.searchParams.get('email');
    if (!email) {
      return apiError(400, 'VALIDATION_ERROR', 'email query param required', context.request);
    }
    if (!isAdmin(user) && user.email !== email) {
      return apiError(403, 'FORBIDDEN', 'You can only access your own data', context.request);
    }
    const { data, error } = await supabase
      .from('learners')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    if (!data) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request);
    return apiSuccess({ id: data.id }, context.request);
  }

  if (path.length >= 2 && path[0] && path[1]) {
    const learnerId = path[0];
    const entityType = path[1];
    if (!ENTITY_SYNC_TABLES.has(entityType)) {
      return apiError(400, 'VALIDATION_ERROR', `Unknown entity type: ${entityType}`, context.request);
    }
    const auth = await ensureOwnData(supabase, user, learnerId);
    if (!auth.allowed) return auth.response!;
    const idCol = TABLE_ID_COLUMN[entityType] || 'learner_id';
    let query = supabase.from(entityType).select('*').eq(idCol, learnerId);
    if (entityType === 'skills' && path.length === 2) {
      const typeFilter = url.searchParams.get('type');
      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }
    }
    const { data, error } = await query;
    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    return apiSuccess(data || [], context.request);
  }

  return apiError(400, 'VALIDATION_ERROR', 'Invalid path', context.request);
});

export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const path = (context.params as any).path as string[] || [];

  if (path.length < 2) {
    return apiError(400, 'VALIDATION_ERROR', 'Path must include learnerId and entityType', context.request);
  }

  // PUT /api/learners/data/:learnerId/trainings/:trainingId — single training update
  // Uses the training's own learner_id for ownership check, NOT path[0]
  if (path.length === 3 && path[1] === 'trainings' && path[2]) {
    const trainingId = path[2];
    let body: any;
    try {
      body = await context.request.json();
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
    }

    // Verify training exists and user owns it
    const { data: existingTraining } = await supabase
      .from('trainings')
      .select('learner_id')
      .eq('id', trainingId)
      .maybeSingle();
    if (!existingTraining) return apiError(404, 'NOT_FOUND', 'Training not found', context.request);
    const auth = await ensureOwnData(supabase, user, existingTraining.learner_id);
    if (!auth.allowed) return auth.response!;

    const updateRecord: any = {};
    if (body.title !== undefined) updateRecord.title = body.title;
    if (body.organization !== undefined) updateRecord.organization = body.organization;
    if (body.start_date !== undefined) updateRecord.start_date = body.start_date;
    if (body.end_date !== undefined) updateRecord.end_date = body.end_date;
    if (body.duration !== undefined) updateRecord.duration = body.duration;
    if (body.description !== undefined) updateRecord.description = body.description;
    if (body.status !== undefined) updateRecord.status = body.status;
    if (body.completed_modules !== undefined) updateRecord.completed_modules = body.completed_modules;
    if (body.total_modules !== undefined) updateRecord.total_modules = body.total_modules;
    if (body.hours_spent !== undefined) updateRecord.hours_spent = body.hours_spent;
    updateRecord.updated_at = new Date().toISOString();

    if (Object.keys(updateRecord).length <= 1) {
      return apiError(400, 'VALIDATION_ERROR', 'No fields to update', context.request);
    }

    const { data: updatedTraining, error: updateError } = await supabase
      .from('trainings')
      .update(updateRecord)
      .eq('id', trainingId)
      .select()
      .single();

    if (updateError) return apiError(500, 'INTERNAL_ERROR', updateError.message, context.request);

    if (Array.isArray(body.skills)) {
      const { data: existingSkills, error: fetchSkillsErr } = await supabase
        .from('skills')
        .select('id, name, type, level, description')
        .eq('training_id', trainingId);
      if (fetchSkillsErr) return apiError(500, 'FETCH_ERROR', fetchSkillsErr.message, context.request);

      const existingMap = new Map(
        (existingSkills || []).map((s: any) => [`${s.name.toLowerCase().trim()}_${s.type}`, s])
      );
      const nowIso = new Date().toISOString();
      const processedKeys = new Set<string>();
      const toUpsert: any[] = [];

      for (const skill of body.skills) {
        const normalized = typeof skill === 'string'
          ? { name: skill.trim(), type: 'technical', level: 3, description: '' }
          : { name: skill.name?.trim() || '', type: skill.type || 'technical', level: normalizeLevel(skill.level), description: skill.description || '' };
        if (!normalized.name) continue;
        const key = `${normalized.name.toLowerCase()}_${normalized.type}`;
        processedKeys.add(key);
        const existing = existingMap.get(key);
        if (existing) {
          if (existing.level !== normalized.level || existing.description !== normalized.description) {
            const { error: updErr } = await supabase.from('skills').update({ level: normalized.level, description: normalized.description, updated_at: nowIso }).eq('id', existing.id);
            if (updErr) return apiError(500, 'UPDATE_ERROR', updErr.message, context.request);
          }
        } else {
          toUpsert.push({ id: crypto.randomUUID(), learner_id: updatedTraining.learner_id, training_id: trainingId, ...normalized, created_at: nowIso, updated_at: nowIso });
        }
      }

      const toDelete = (existingSkills || []).filter((s: any) => !processedKeys.has(`${s.name.toLowerCase().trim()}_${s.type}`)).map((s: any) => s.id);
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase.from('skills').delete().in('id', toDelete);
        if (delErr) return apiError(500, 'DELETE_ERROR', delErr.message, context.request);
      }
      if (toUpsert.length > 0) {
        const { error: insErr } = await supabase.from('skills').insert(toUpsert);
        if (insErr) return apiError(500, 'INSERT_ERROR', insErr.message, context.request);
      }
    }

    return apiSuccess({ training: updatedTraining }, context.request);
  }

  // PUT /api/learners/data/:learnerId/:entityType — sync-upsert
  const learnerId = path[0];
  const auth = await ensureOwnData(supabase, user, learnerId);
  if (!auth.allowed) return auth.response!;

  const entityType = path[1];
  if (!ENTITY_SYNC_TABLES.has(entityType)) {
    return apiError(400, 'VALIDATION_ERROR', `Unknown entity type: ${entityType}`, context.request);
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const deleteIds: string[] = body.deleteIds || [];
  const records: any[] = body.records || [];

  let deleted = 0;
  let upserted = 0;

  // Main delete first (scoped by learner_id) so only own rows are affected
  if (deleteIds.length > 0) {
    const { data: deletedRows, error: delError } = await supabase
      .from(entityType)
      .delete()
      .in('id', deleteIds)
      .eq('learner_id', learnerId)
      .select('id');
    if (delError) return apiError(500, 'DELETE_ERROR', delError.message, context.request);
    deleted = deletedRows?.length || 0;

    // Cascade delete for trainings — only for rows that were actually deleted
    if (entityType === 'trainings' && deleted > 0) {
      const ownIds = deletedRows!.map((r: any) => r.id);
      const { error: certErr } = await supabase.from('certificates').delete().in('training_id', ownIds).eq('learner_id', learnerId);
      if (certErr) return apiError(500, 'DELETE_ERROR', `Failed to cascade delete certificates: ${certErr.message}`, context.request);
      const { error: skillErr } = await supabase.from('skills').delete().in('training_id', ownIds).eq('learner_id', learnerId);
      if (skillErr) return apiError(500, 'DELETE_ERROR', `Failed to cascade delete skills: ${skillErr.message}`, context.request);
    }
  }

  if (records.length > 0) {
    const safeRecords = records.map((r: any) => ({ ...r, learner_id: learnerId }));
    const { error: upsertError } = await supabase.from(entityType).upsert(safeRecords, { onConflict: 'id' });
    if (upsertError) return apiError(500, 'UPSERT_ERROR', upsertError.message, context.request);
    upserted = records.length;
  }

  return apiSuccess({ deleted, upserted }, context.request);
});

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
};
