/**
 * College Admin - Notifications & Approvals API
 * POST: Action-based dispatch for notifications, training/experience/project approvals
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

// ── Local type definitions for certificate and skill DB rows with joined learner ──
interface LearnerJoin {
  id: string;
  name: string;
  email: string;
  school_id: string | null;
  university_college_id: string | null;
  college_id: string | null;
}

interface CertificateRow {
  id: string;
  learner_id: string;
  title: string;
  issuer: string | null;
  issued_on: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string | null;
  learner: LearnerJoin | LearnerJoin[];
}

interface SkillRow {
  id: string;
  learner_id: string;
  name: string | null;
  skill_name: string | null;
  type: string | null;
  level: number | null;
  category: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string | null;
  learner: LearnerJoin | LearnerJoin[];
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ── Notifications ──
      case 'get-notifications': {
        const { college_id, unread_only } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        let query = supabase
          .from('training_notifications')
          .select('*')
          .eq('recipient_type', 'college_admin')
          .eq('college_id', college_id)
          .order('created_at', { ascending: false });

        if (unread_only) {
          query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const trainingIds = new Set<string>();
        const experienceIds = new Set<string>();
        const projectIds = new Set<string>();

        for (const n of notifications || []) {
          if (n.training_id) trainingIds.add(n.training_id);
          if (n.experience_id) experienceIds.add(n.experience_id);
          if (n.project_id) projectIds.add(n.project_id);
        }

        const trainingMap = new Map<string, any>();
        const experienceMap = new Map<string, any>();
        const projectMap = new Map<string, any>();

        if (trainingIds.size > 0) {
          const ids = Array.from(trainingIds);
          const { data: trainings } = await supabase
            .from('trainings')
            .select('id, title, learner_id, learners!trainings_learner_id_fkey(id, name)')
            .in('id', ids);
          if (trainings) {
            for (const t of trainings) {
              trainingMap.set(t.id, t);
            }
          }
        }

        if (experienceIds.size > 0) {
          const ids = Array.from(experienceIds);
          const { data: experiences } = await supabase
            .from('experience')
            .select('id, role, organization, learner_id, learners!experience_learner_id_fkey(id, name)')
            .in('id', ids);
          if (experiences) {
            for (const e of experiences) {
              experienceMap.set(e.id, e);
            }
          }
        }

        if (projectIds.size > 0) {
          const ids = Array.from(projectIds);
          const { data: projects } = await supabase
            .from('projects')
            .select('id, title, learner_id, learners!projects_learner_id_fkey(id, name)')
            .in('id', ids);
          if (projects) {
            for (const p of projects) {
              projectMap.set(p.id, p);
            }
          }
        }

        const results = (notifications || []).map((n: any) => {
          let item_title = 'Unknown';
          let learner_name: string | null = null;
          let notification_type = 'unknown';

          if (n.training_id) {
            const t = trainingMap.get(n.training_id);
            item_title = t?.title || 'Unknown';
            notification_type = 'training';
            learner_name = t?.learners?.name || null;
          } else if (n.experience_id) {
            const e = experienceMap.get(n.experience_id);
            item_title = e ? `${e.role || ''} at ${e.organization || ''}` : 'Unknown';
            if (item_title === ' at ') item_title = 'Unknown';
            notification_type = 'experience';
            learner_name = e?.learners?.name || null;
          } else if (n.project_id) {
            const p = projectMap.get(n.project_id);
            item_title = p?.title || 'Unknown';
            notification_type = 'project';
            learner_name = p?.learners?.name || null;
          }

          return {
            notification_id: n.id,
            training_id: n.training_id,
            experience_id: n.experience_id,
            project_id: n.project_id,
            message: n.message,
            is_read: n.is_read,
            created_at: n.created_at,
            item_title,
            learner_name,
            notification_type,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'get-unread-count': {
        const { college_id, admin_type } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        if (admin_type === 'college_admin') {
          const { count, error } = await supabase
            .from('training_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_type', 'college_admin')
            .eq('college_id', college_id)
            .eq('is_read', false);
          if (error) return apiDbError(error, context.request, { startTime });
          return apiSuccess(count || 0, context.request, { startTime });
        }

        return apiSuccess(0, context.request, { startTime });
      }

      case 'mark-notification-read': {
        const { notification_id } = params;
        if (!notification_id) return apiError(400, 'VALIDATION_ERROR', 'Missing notification_id', context.request, { startTime });

        const { error } = await supabase
          .from('training_notifications')
          .update({ is_read: true, updated_at: new Date().toISOString() })
          .eq('id', notification_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(true, context.request, { startTime });
      }

      // ── Training Approvals ──
      case 'get-pending-trainings': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('trainings')
          .select('*, learner:learners!trainings_learner_id_fkey(*)')
          .eq('approval_status', 'pending')
          .eq('approval_authority', 'college_admin')
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const filtered = (data || []).filter((t: any) => {
          const l = Array.isArray(t.learner) ? t.learner[0] : t.learner;
          return l?.university_college_id === college_id || l?.college_id === college_id;
        });

        const results = filtered.map((t: any) => {
          const l = Array.isArray(t.learner) ? t.learner[0] : t.learner;
          return {
            ...t,
            learner_name: l?.name || '',
            learner_email: l?.email || '',
            learner_school_id: l?.school_id || null,
            learner_college_id: l?.university_college_id || l?.college_id || null,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-training': {
        const { training_id, approver_id, notes } = params;
        if (!training_id) return apiError(400, 'VALIDATION_ERROR', 'Missing training_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('trainings')
          .update({
            approval_status: 'approved',
            approved_by: approver_id || user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', training_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Training approved', training_id }, context.request, { startTime });
      }

      case 'reject-training': {
        const { training_id, rejector_id, notes } = params;
        if (!training_id) return apiError(400, 'VALIDATION_ERROR', 'Missing training_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason (notes) is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('trainings')
          .update({
            approval_status: 'rejected',
            rejected_by: rejector_id || user.id,
            rejected_at: new Date().toISOString(),
            approval_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', training_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Training rejected', training_id }, context.request, { startTime });
      }

      // ── Experience Approvals ──
      case 'get-pending-experiences': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('experience')
          .select('*, learner:learners!experience_learner_id_fkey(*)')
          .eq('approval_status', 'pending')
          .eq('approval_authority', 'college_admin')
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const filtered = (data || []).filter((e: any) => {
          const l = Array.isArray(e.learner) ? e.learner[0] : e.learner;
          return l?.university_college_id === college_id || l?.college_id === college_id;
        });

        const results = filtered.map((e: any) => {
          const l = Array.isArray(e.learner) ? e.learner[0] : e.learner;
          return {
            ...e,
            learner_name: l?.name || '',
            learner_email: l?.email || '',
            learner_school_id: l?.school_id || null,
            learner_college_id: l?.university_college_id || l?.college_id || null,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-experience': {
        const { experience_id, approver_id, notes } = params;
        if (!experience_id) return apiError(400, 'VALIDATION_ERROR', 'Missing experience_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('experience')
          .update({
            approval_status: 'approved',
            verified: true,
            approved_by: approver_id || user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', experience_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Experience approved', experience_id }, context.request, { startTime });
      }

      case 'reject-experience': {
        const { experience_id, rejector_id, notes } = params;
        if (!experience_id) return apiError(400, 'VALIDATION_ERROR', 'Missing experience_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason (notes) is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('experience')
          .update({
            approval_status: 'rejected',
            rejected_by: rejector_id || user.id,
            rejected_at: new Date().toISOString(),
            approval_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', experience_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Experience rejected' }, context.request, { startTime });
      }

      // ── Project Approvals ──
      case 'get-pending-projects': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('projects')
          .select('*, learner:learners!projects_learner_id_fkey(*)')
          .eq('approval_status', 'pending')
          .eq('approval_authority', 'college_admin')
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const filtered = (data || []).filter((p: any) => {
          const l = Array.isArray(p.learner) ? p.learner[0] : p.learner;
          return l?.university_college_id === college_id || l?.college_id === college_id;
        });

        const results = filtered.map((p: any) => {
          const l = Array.isArray(p.learner) ? p.learner[0] : p.learner;
          return {
            ...p,
            learner_name: l?.name || '',
            learner_email: l?.email || '',
            learner_school_id: l?.school_id || null,
            learner_college_id: l?.university_college_id || l?.college_id || null,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-project': {
        const { project_id, approver_id, notes } = params;
        if (!project_id) return apiError(400, 'VALIDATION_ERROR', 'Missing project_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('projects')
          .update({
            approval_status: 'approved',
            approved_by: approver_id || user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Project approved', project_id }, context.request, { startTime });
      }

      case 'reject-project': {
        const { project_id, rejector_id, notes } = params;
        if (!project_id) return apiError(400, 'VALIDATION_ERROR', 'Missing project_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason (notes) is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('projects')
          .update({
            approval_status: 'rejected',
            rejected_by: rejector_id || user.id,
            rejected_at: new Date().toISOString(),
            approval_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project_id)
          .eq('approval_status', 'pending')
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true, message: 'Project rejected', project_id }, context.request, { startTime });
      }

      // ── Certificate Approvals ──
      case 'get-pending-certificates': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('certificates')
          .select('*, learner:learners!certificates_learner_id_fkey(*)')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const filtered = (data || []).filter((c: CertificateRow) => {
          const l = Array.isArray(c.learner) ? c.learner[0] : c.learner;
          return l?.university_college_id === college_id || l?.college_id === college_id;
        });

        const results = filtered.map((c: CertificateRow) => {
          const l = Array.isArray(c.learner) ? c.learner[0] : c.learner;
          return {
            ...c,
            learner_name: l?.name || '',
            learner_email: l?.email || '',
            learner_school_id: l?.school_id || null,
            learner_college_id: l?.university_college_id || l?.college_id || null,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-certificate': {
        const { certificate_id, approver_id, notes } = params;
        if (!certificate_id) return apiError(400, 'VALIDATION_ERROR', 'Missing certificate_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('certificates')
          .update({
            approval_status: 'approved',
            approved_by: approver_id || user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', certificate_id)
          .eq('approval_status', 'pending')
          .select('id');
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data || data.length === 0) {
          return apiError(409, 'CONFLICT', 'Certificate not found or already processed', context.request, { startTime });
        }
        return apiSuccess({ success: true, message: 'Certificate approved', certificate_id }, context.request, { startTime });
      }

      case 'reject-certificate': {
        const { certificate_id, rejector_id, notes } = params;
        if (!certificate_id) return apiError(400, 'VALIDATION_ERROR', 'Missing certificate_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason (notes) is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('certificates')
          .update({
            approval_status: 'rejected',
            rejected_by: rejector_id || user.id,
            rejected_at: new Date().toISOString(),
            approval_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', certificate_id)
          .eq('approval_status', 'pending')
          .select('id');
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data || data.length === 0) {
           return apiError(409, 'CONFLICT', 'Certificate not found or already processed', context.request, { startTime });
        }
        return apiSuccess({ success: true, message: 'Certificate rejected', certificate_id }, context.request, { startTime });
      }

      // ── Skill Approvals ──
      case 'get-pending-skills': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('skills')
          .select('*, learner:learners!skills_learner_id_fkey(*)')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });

        const filtered = (data || []).filter((s: SkillRow) => {
          const l = Array.isArray(s.learner) ? s.learner[0] : s.learner;
          return l?.university_college_id === college_id || l?.college_id === college_id;
        });

        const results = filtered.map((s: SkillRow) => {
          const l = Array.isArray(s.learner) ? s.learner[0] : s.learner;
          return {
            ...s,
            learner_name: l?.name || '',
            learner_email: l?.email || '',
            learner_school_id: l?.school_id || null,
            learner_college_id: l?.university_college_id || l?.college_id || null,
          };
        });

        return apiSuccess(results, context.request, { startTime });
      }

      case 'approve-skill': {
        const { skill_id, approver_id, notes } = params;
        if (!skill_id) return apiError(400, 'VALIDATION_ERROR', 'Missing skill_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('skills')
          .update({
            approval_status: 'approved',
            approved_by: approver_id || user.id,
            approved_at: new Date().toISOString(),
            approval_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', skill_id)
          .eq('approval_status', 'pending')
          .select('id');
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data || data.length === 0) {
           return apiError(409, 'CONFLICT', 'Skill not found or already processed', context.request, { startTime });
        }
        return apiSuccess({ success: true, message: 'Skill approved', skill_id }, context.request, { startTime });
      }

      case 'reject-skill': {
        const { skill_id, rejector_id, notes } = params;
        if (!skill_id) return apiError(400, 'VALIDATION_ERROR', 'Missing skill_id', context.request, { startTime });
        if (!notes?.trim()) return apiError(400, 'VALIDATION_ERROR', 'Rejection reason (notes) is required', context.request, { startTime });

        const { data, error } = await supabase
          .from('skills')
          .update({
            approval_status: 'rejected',
            rejected_by: rejector_id || user.id,
            rejected_at: new Date().toISOString(),
            approval_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', skill_id)
          .eq('approval_status', 'pending')
          .select('id');
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data || data.length === 0) {
           return apiError(409, 'CONFLICT', 'Skill not found or already processed', context.request, { startTime });
        }
        return apiSuccess({ success: true, message: 'Skill rejected', skill_id }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[notifications POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
