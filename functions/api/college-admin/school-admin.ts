/**
 * School Admin API
 * POST: Action-based dispatch for school-level admin operations
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

// ── Type Definitions ──
interface LearnerSnapshot {
  id: string;
  name: string;
  email: string;
  school_id: string | null;
  university_college_id: string | null;
  learner_type?: string;
}

interface RecordWithLearner {
  id: string;
  approval_status: string;
  approval_authority?: string;
  created_at: string;
  updated_at?: string;
  learner: LearnerSnapshot | LearnerSnapshot[];
  organization?: string;
  [key: string]: unknown;
}

interface FlattenedRecord extends Omit<RecordWithLearner, 'learner'> {
  learner_name: string;
  learner_email: string;
  learner_school_id: string | null;
  learner_college_id: string | null;
  learner_type?: string;
  _needsApprovalAuthorityFix?: true;
}

// ── Helper Functions ──
function filterAndFlattenBySchool(
  data: RecordWithLearner[],
  school_id: string,
  extra?: (l: LearnerSnapshot) => Partial<FlattenedRecord>
): FlattenedRecord[] {
  return data
    .filter((item) => {
      const l = Array.isArray(item.learner) ? (item.learner[0] ?? item.learner) : item.learner;
      return l?.school_id === school_id;
    })
    .map((item) => {
      const l = Array.isArray(item.learner) ? (item.learner[0] ?? item.learner) : item.learner;
      const { learner: _, ...rest } = item;
      return {
        ...rest,
        learner_name: l?.name ?? '',
        learner_email: l?.email ?? '',
        learner_school_id: l?.school_id ?? null,
        learner_college_id: l?.university_college_id ?? null,
        ...(extra ? extra(l) : {}),
      };
    });
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: Record<string, any>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body = (await context.request.json()) as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── School ID Resolution ──
      case 'get-school-id': {
        const { email, user_id } = params;
        const lookupEmail = email || user?.email;
        if (!lookupEmail && !user_id) return apiError(400, 'VALIDATION_ERROR', 'Missing email or user_id', context.request, { startTime });

        const eData = await supabase.from('school_educators').select('school_id').eq('email', lookupEmail).maybeSingle();
        if (eData.data?.school_id) return apiSuccess({ school_id: eData.data.school_id }, context.request, { startTime });

        const uid = user_id || user?.id;
        if (uid) {
          const oData = await supabase.from('organizations').select('id').eq('organization_type', 'school').or(`admin_id.eq.${uid},email.eq.${lookupEmail}`).maybeSingle();
          if (oData.data?.id) return apiSuccess({ school_id: oData.data.id }, context.request, { startTime });
        }
        return apiSuccess({ school_id: null }, context.request, { startTime });
      }

      // ── School Info ──
      case 'get-school-by-owner': {
        const { user_id } = params;
        const uid = user_id || user?.id;
        if (!uid) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase.from('organizations').select('*').eq('organization_type', 'school').eq('admin_id', uid).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-school-by-id': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('organizations').select('*').eq('id', school_id).eq('organization_type', 'school').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-all-schools': {
        const { data, error } = await supabase.from('organizations').select('*').eq('organization_type', 'school').order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'check-school-code': {
        const { name } = params;
        if (!name) return apiError(400, 'VALIDATION_ERROR', 'Missing name', context.request, { startTime });
        const { data, error } = await supabase.from('organizations').select('id').eq('organization_type', 'school').ilike('name', name).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ isUnique: !data }, context.request, { startTime });
      }

      case 'get-school-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('organizations').select('*').eq('organization_type', 'school').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Notifications ──
      case 'get-notifications': {
        const { school_id, unread_only } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });

        const { data, error } = await supabase.rpc('get_school_admin_notifications', { admin_school_id: school_id, unread_only: unread_only || false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-unread-count': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.rpc('get_unread_notification_count', { admin_school_id: school_id, admin_type: 'school_admin' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || 0, context.request, { startTime });
      }

      case 'mark-notification-read': {
        const { notification_id } = params;
        if (!notification_id) return apiError(400, 'VALIDATION_ERROR', 'Missing notification_id', context.request, { startTime });
        const { error } = await supabase.rpc('mark_notification_read', { notification_id });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(true, context.request, { startTime });
      }

      // ── Training Approvals ──
      case 'get-pending-trainings': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });

        const { data, error } = await supabase.from('trainings').select('*, learner:learners!trainings_learner_id_fkey(*)').eq('approval_status', 'pending').eq('approval_authority', 'school_admin').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        let results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);

        if (results.length === 0) {
          const { data: fb } = await supabase.from('trainings').select('*, learner:learners!trainings_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
          if (fb) {
            const fallback = (fb as RecordWithLearner[]).filter((t) => {
              const l = Array.isArray(t.learner) ? t.learner[0] : t.learner;
              const org = (t.organization || '').toLowerCase();
              return org === 'rareminds' && l?.school_id === school_id && l?.learner_type !== 'learner';
            });
            results = filterAndFlattenBySchool(fallback, school_id).map(r => ({ ...r, _needsApprovalAuthorityFix: true as const }));
          }
        }

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-training': {
        const { training_id, approver_id, notes } = params;
        if (!training_id) return apiError(400, 'VALIDATION_ERROR', 'Missing training_id', context.request, { startTime });
        const { error } = await supabase.from('trainings').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', training_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Training approved', training_id }, context.request, { startTime });
      }

      case 'reject-training': {
        const { training_id, rejector_id, notes } = params;
        if (!training_id) return apiError(400, 'VALIDATION_ERROR', 'Missing training_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('trainings').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', training_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Training rejected', training_id, reason: notes }, context.request, { startTime });
      }

      // ── Experience Approvals ──
      case 'get-pending-experiences': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('experience').select('*, learner:learners!experience_learner_id_fkey(*)').eq('approval_status', 'pending').eq('approval_authority', 'school_admin').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id, (l) => ({
          learner_type: l?.learner_type
        }));
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-experience': {
        const { experience_id, approver_id, notes } = params;
        if (!experience_id) return apiError(400, 'VALIDATION_ERROR', 'Missing experience_id', context.request, { startTime });
        const { error } = await supabase.from('experience').update({ approval_status: 'approved', verified: true, approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', experience_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Experience approved', experience_id }, context.request, { startTime });
      }

      case 'reject-experience': {
        const { experience_id, rejector_id, notes } = params;
        if (!experience_id) return apiError(400, 'VALIDATION_ERROR', 'Missing experience_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { data, error } = await supabase.rpc('reject_experience', { experience_id, rejector_id: rejector_id || user.id, notes });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || { success: true }, context.request, { startTime });
      }

      // ── Certificate Approvals ──
      case 'get-pending-certificates': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('certificates').select('*, learner:learners!certificates_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-certificate': {
        const { certificate_id, approver_id, notes } = params;
        if (!certificate_id) return apiError(400, 'VALIDATION_ERROR', 'Missing certificate_id', context.request, { startTime });
        const { error } = await supabase.from('certificates').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', certificate_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Certificate approved', certificate_id }, context.request, { startTime });
      }

      case 'reject-certificate': {
        const { certificate_id, rejector_id, notes } = params;
        if (!certificate_id) return apiError(400, 'VALIDATION_ERROR', 'Missing certificate_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('certificates').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', certificate_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Certificate rejected', certificate_id, reason: notes }, context.request, { startTime });
      }

      // ── Education Approvals ──
      case 'get-pending-education': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('education').select('*, learner:learners!education_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-education': {
        const { education_id, approver_id, notes } = params;
        if (!education_id) return apiError(400, 'VALIDATION_ERROR', 'Missing education_id', context.request, { startTime });
        const { error } = await supabase.from('education').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', education_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Education approved', education_id }, context.request, { startTime });
      }

      case 'reject-education': {
        const { education_id, rejector_id, notes } = params;
        if (!education_id) return apiError(400, 'VALIDATION_ERROR', 'Missing education_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('education').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', education_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Education rejected', education_id, reason: notes }, context.request, { startTime });
      }

      // ── Skill Approvals ──
      case 'get-pending-skills': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('skills').select('*, learner:learners!skills_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-skill': {
        const { skill_id, approver_id, notes } = params;
        if (!skill_id) return apiError(400, 'VALIDATION_ERROR', 'Missing skill_id', context.request, { startTime });
        const { error } = await supabase.from('skills').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', skill_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Skill approved', skill_id }, context.request, { startTime });
      }

      case 'reject-skill': {
        const { skill_id, rejector_id, notes } = params;
        if (!skill_id) return apiError(400, 'VALIDATION_ERROR', 'Missing skill_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('skills').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', skill_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Skill rejected', skill_id, reason: notes }, context.request, { startTime });
      }

      // ── Achievement Approvals ──
      case 'get-pending-achievements': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('achievements').select('*, learner:learners!achievements_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-achievement': {
        const { achievement_id, approver_id, notes } = params;
        if (!achievement_id) return apiError(400, 'VALIDATION_ERROR', 'Missing achievement_id', context.request, { startTime });
        const { error } = await supabase.from('achievements').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', achievement_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Achievement approved', achievement_id }, context.request, { startTime });
      }

      case 'reject-achievement': {
        const { achievement_id, rejector_id, notes } = params;
        if (!achievement_id) return apiError(400, 'VALIDATION_ERROR', 'Missing achievement_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('achievements').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', achievement_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Achievement rejected', achievement_id, reason: notes }, context.request, { startTime });
      }

      // ── Project Approvals ──
      case 'get-pending-projects': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('projects').select('*, learner:learners!projects_learner_id_fkey(*)').eq('approval_status', 'pending').eq('approval_authority', 'school_admin').order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        let results = filterAndFlattenBySchool(data as RecordWithLearner[], school_id);

        if (results.length === 0) {
          const { data: fb } = await supabase.from('projects').select('*, learner:learners!projects_learner_id_fkey(*)').eq('approval_status', 'pending').order('created_at', { ascending: false });
          if (fb) {
            const fallback = (fb as RecordWithLearner[]).filter((p) => {
              const l = Array.isArray(p.learner) ? p.learner[0] : p.learner;
              return l?.school_id === school_id && l?.learner_type !== 'learner';
            });
            results = filterAndFlattenBySchool(fallback, school_id).map(r => ({ ...r, _needsApprovalAuthorityFix: true as const }));
          }
        }
        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-project': {
        const { project_id, approver_id, notes } = params;
        if (!project_id) return apiError(400, 'VALIDATION_ERROR', 'Missing project_id', context.request, { startTime });
        const { error } = await supabase.from('projects').update({ approval_status: 'approved', approved_by: approver_id || user.id, approved_at: new Date().toISOString(), approval_notes: notes || null, updated_at: new Date().toISOString() }).eq('id', project_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Project approved', project_id }, context.request, { startTime });
      }

      case 'reject-project': {
        const { project_id, rejector_id, notes } = params;
        if (!project_id) return apiError(400, 'VALIDATION_ERROR', 'Missing project_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason is required', context.request, { startTime });
        const { error } = await supabase.from('projects').update({ approval_status: 'rejected', rejected_by: rejector_id || user.id, rejected_at: new Date().toISOString(), approval_notes: notes, updated_at: new Date().toISOString() }).eq('id', project_id).eq('approval_status', 'pending').select().single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Project rejected', project_id, reason: notes }, context.request, { startTime });
      }

      // ── Curriculum ──
      case 'copy-curriculum-template': {
        const { source_curriculum_id, target_school_id, target_subject, target_class, target_academic_year, created_by } = params;
        if (!source_curriculum_id) return apiError(400, 'VALIDATION_ERROR', 'Missing source_curriculum_id', context.request, { startTime });
        const { data, error } = await supabase.rpc('copy_curriculum_template', {
          p_source_curriculum_id: source_curriculum_id,
          p_target_school_id: target_school_id,
          p_target_subject: target_subject,
          p_target_class: target_class,
          p_target_academic_year: target_academic_year,
          p_created_by: created_by || user.id,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Timetable Operations ──
      case 'create-timetable-slot': {
        const { slot_data } = params;
        if (!slot_data) return apiError(400, 'VALIDATION_ERROR', 'Missing slot_data', context.request, { startTime });
        const { error } = await supabase.from('timetable_slots').insert(slot_data);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'delete-timetable-slot': {
        const { slot_id } = params;
        if (!slot_id) return apiError(400, 'VALIDATION_ERROR', 'Missing slot_id', context.request, { startTime });
        const { error } = await supabase.from('timetable_slots').delete().eq('id', slot_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'calculate-teacher-workload': {
        const { teacher_id, timetable_id } = params;
        if (!teacher_id || !timetable_id) return apiError(400, 'VALIDATION_ERROR', 'Missing teacher_id or timetable_id', context.request, { startTime });
        const { data, error } = await supabase.rpc('calculate_teacher_workload', { p_teacher_id: teacher_id, p_timetable_id: timetable_id });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data && data.length > 0 ? data[0] : null, context.request, { startTime });
      }

      case 'get-timetable-slots': {
        const { timetable_id, educator_id, class_id } = params;
        let query = supabase.from('timetable_slots').select('*, school_classes:class_id(*), school_educators:educator_id(*)');
        if (timetable_id) query = query.eq('timetable_id', timetable_id);
        if (educator_id) query = query.eq('educator_id', educator_id);
        if (class_id) query = query.eq('class_id', class_id);
        query = query.order('day_of_week').order('period_number');
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-timetable-conflicts': {
        const { timetable_id, teacher_id, resolved } = params;
        let query = supabase.from('timetable_conflicts').select('*');
        if (timetable_id) query = query.eq('timetable_id', timetable_id);
        if (teacher_id) query = query.eq('teacher_id', teacher_id);
        if (resolved !== undefined) query = query.eq('resolved', resolved);
        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-or-create-timetable': {
        const { academic_year, status, school_id, ...createParams } = params;
        const year = academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        let query = supabase.from('timetables').select('id, status').eq('academic_year', year).eq('status', status || 'draft');
        if (school_id) query = query.eq('school_id', school_id);
        query = query.order('created_at', { ascending: false }).limit(1).maybeSingle();
        const { data: existing } = await query;
        if (existing) return apiSuccess(existing, context.request, { startTime });
        const { data: newTimetable, error } = await supabase.from('timetables').insert({ school_id, academic_year: year, term: createParams.term || 'Term 1', start_date: createParams.start_date, end_date: createParams.end_date, status: status || 'draft' }).select('id, status').single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(newTimetable, context.request, { startTime });
      }

      case 'update-timetable-slot': {
        const { id, ...slotUpdates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing slot id', context.request, { startTime });
        const { error } = await supabase.from('timetable_slots').update(slotUpdates).eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'batch-create-slots': {
        const { slots } = params;
        if (!slots || !Array.isArray(slots) || slots.length === 0) return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid slots array', context.request, { startTime });
        const { error } = await supabase.from('timetable_slots').insert(slots);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, count: slots.length }, context.request, { startTime });
      }

      case 'publish-timetable': {
        const { timetable_id } = params;
        if (!timetable_id) return apiError(400, 'VALIDATION_ERROR', 'Missing timetable_id', context.request, { startTime });
        const { error } = await supabase.from('timetables').update({ status: 'published' }).eq('id', timetable_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Teachers ──
      case 'get-teachers': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('*').eq('school_id', school_id).order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-teachers-dropdown': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('id, teacher_id, first_name, last_name').eq('school_id', school_id).eq('account_status', 'active').order('first_name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'update-teacher-status': {
        const { teacher_id, onboarding_status } = params;
        if (!teacher_id || !onboarding_status) return apiError(400, 'VALIDATION_ERROR', 'Missing teacher_id or onboarding_status', context.request, { startTime });
        const { error } = await supabase.from('school_educators').update({ onboarding_status }).eq('id', teacher_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'update-teacher-document-urls': {
        const { teacher_id, degree_certificate_url, id_proof_url, experience_letters_url } = params;
        if (!teacher_id) return apiError(400, 'VALIDATION_ERROR', 'Missing teacher_id', context.request, { startTime });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Record<string, any> = {};
        if (degree_certificate_url !== undefined) updates.degree_certificate_url = degree_certificate_url;
        if (id_proof_url !== undefined) updates.id_proof_url = id_proof_url;
        if (experience_letters_url !== undefined) updates.experience_letters_url = experience_letters_url;
        const { error } = await supabase.from('school_educators').update(updates).eq('id', teacher_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Subjects ──
      case 'get-subjects': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('curriculum_subjects').select('id, name, description').eq('school_id', school_id).eq('is_active', true).order('display_order').order('name');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── Classes ──
      case 'get-classes': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase.from('school_classes').select('id, name, grade, section, academic_year, room_no').eq('school_id', school_id).eq('account_status', 'active').order('grade').order('section');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ── User role lookup ──
      case 'get-user-role': {
        // TODO(§7.5/7.10 frontend-resolver reconciliation): lookup endpoint returning
        // `users.role` by arbitrary user_id — NOT an in-handler authz decision, so not
        // a JWT replacement. Deferred (out of scope for 12.1).
        const { user_id } = params;
        const uid = user_id || user?.id;
        if (!uid) return apiError(400, 'VALIDATION_ERROR', 'Missing user_id', context.request, { startTime });
        const { data, error } = await supabase.from('users').select('role').eq('id', uid).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── School Educators by email ──
      case 'get-educator-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase.from('school_educators').select('school_id, user_id').eq('email', email).maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Organizations lookup ──
      case 'get-organization-by-admin': {
        const { admin_id, org_type, email } = params;
        const uid = admin_id || user?.id;
        let query = supabase.from('organizations').select('id, name, email').eq('organization_type', org_type || 'school');
        if (uid && email) {
          query = query.or(`admin_id.eq.${uid},email.ilike.${email}`);
        } else if (uid) {
          query = query.eq('admin_id', uid);
        } else if (email) {
          query = query.eq('email', email);
        }
        const { data, error } = await query.maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(`[school-admin POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
