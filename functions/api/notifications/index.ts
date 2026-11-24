import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const jwtIsCollegeAdmin = (Array.isArray(user.roles) && user.roles.includes('college_admin')) || user.role === 'college_admin';
  if (jwtIsCollegeAdmin) {
    const { data: actor } = await supabase.from('users').select('organizationId').eq('id', user.id).maybeSingle();
    if (actor?.organizationId) {
      const { data: currData } = await supabase
        .from('college_curriculums')
        .select('id, course_id, pending_changes, academic_year')
        .eq('college_id', actor.organizationId);

      for (const curr of currData || []) {
        const changes = Array.isArray(curr.pending_changes) ? curr.pending_changes : [];
        for (const r of changes) {
          const isPending = !r?.status || r.status === 'pending' || r.status === 'submitted';
          if (isPending && r.id && r.requested_by !== user.id) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('recipient_id', user.id)
              .eq('curriculum_change_id', r.id)
              .eq('type', 'curriculum_change_submitted')
              .maybeSingle();

            if (!existing) {
              let courseTitle = 'a course';
              if (curr.course_id) {
                const { data: c } = await supabase.from('college_courses').select('course_name').eq('id', curr.course_id).maybeSingle();
                if (c?.course_name) courseTitle = c.course_name;
              }
              let educatorName = r.requester_name || '';
              if (!educatorName && r.requested_by) {
                const { data: u } = await supabase.from('users').select('email').eq('id', r.requested_by).maybeSingle();
                educatorName = u?.email || 'An educator';
              }
              const entityLabel = (r.change_type === 'unit_add' || r.change_type === 'unit_edit') ? 'unit' : 'learning outcome';
              const actionVerb = r.change_type?.endsWith('_add') ? 'a new' : 'an edit to a';
              const message = `${educatorName} submitted ${actionVerb} ${entityLabel} for ${courseTitle} (${curr.academic_year || 'current'}).`;

              await supabase.from('notifications').insert({
                recipient_id: user.id,
                type: 'curriculum_change_submitted',
                title: 'Curriculum change awaiting review',
                message,
                read: false,
                curriculum_change_id: r.id,
                action_url: `/college-admin/academics/curriculum?reviewChange=${r.id}`,
              });
            }
          }
        }
      }

      const { data: plansData } = await supabase
        .from('college_lesson_plans')
        .select('id, course_id, title, metadata')
        .eq('college_id', actor.organizationId);

      for (const p of plansData || []) {
        const pa = p.metadata?.pending_approval;
        if (pa && pa.status === 'pending' && pa.id && pa.requested_by !== user.id) {
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('curriculum_change_id', pa.id)
            .eq('type', 'curriculum_change_submitted')
            .maybeSingle();

          if (!existing) {
            const isEdit = pa.action === 'edit';
            const actionTitle = isEdit ? 'Session plan edit awaiting review' : 'New session plan awaiting review';
            const message = `${pa.requester_name || 'An educator'} submitted ${isEdit ? 'an edit for session plan "' + p.title + '"' : 'a new session plan "' + (pa.proposed_plan?.title || p.title) + '"'} for review.`;

            await supabase.from('notifications').insert({
              recipient_id: user.id,
              type: 'curriculum_change_submitted',
              title: actionTitle,
              message,
              read: false,
              curriculum_change_id: pa.id,
              action_url: `/college-admin/academics/lesson-plans?reviewChange=${pa.id}`,
            });
          }
        }
      }
    }
  }

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const before = url.searchParams.get('before');

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }

  return apiSuccess({ notifications: data, total: count }, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (!body.action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  }

  switch (body.action) {
    case 'mark-read': {
      if (!body.ids || body.ids.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'ids are required for mark-read', context.request);
      }
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'mark-all-read': {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'delete': {
      if (!body.ids || body.ids.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'ids are required for delete', context.request);
      }
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'unread-count': {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess({ count: count || 0 }, context.request);
    }

    case 'create': {
      const { recipient_id, type, title, message } = body;
      if (!recipient_id || !type || !title) {
        return apiError(400, 'VALIDATION_ERROR', 'recipient_id, type, and title are required', context.request);
      }
      const { data, error } = await supabase
        .from('notifications')
        .insert({ recipient_id, type, title, message: message || '', read: false })
        .select()
        .single();
      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(data, context.request);
    }

    case 'create-batch': {
      const { notifications } = body;
      if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'notifications array is required', context.request);
      }
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications.map((n: any) => ({
          recipient_id: n.recipient_id,
          type: n.type,
          title: n.title,
          message: n.message || '',
          read: false,
        })))
        .select();
      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess({ data, count: notifications.length }, context.request);
    }

    case 'resolve-users': {
      const { identifiers } = body;
      if (!identifiers || !Array.isArray(identifiers)) {
        return apiError(400, 'VALIDATION_ERROR', 'identifiers array is required', context.request);
      }
      const resolved: Record<string, string | null> = {};

      for (const identifier of identifiers) {
        if (!identifier) { resolved[identifier] = null; continue; }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (!isUUID) {
          const tables = ['school_educators', 'learners', 'recruiters', 'users'];
          for (const table of tables) {
            const idField = table === 'school_educators' || table === 'learners' ? 'user_id' : 'id';
            const { data: row } = await supabase
              .from(table)
              .select(idField)
              .ilike('email', identifier)
              .maybeSingle();
            if (row) { resolved[identifier] = row[idField]; break; }
          }
          if (!resolved[identifier]) resolved[identifier] = null;
          continue;
        }

        const { data: learnerRow } = await supabase
          .from('learners')
          .select('user_id')
          .eq('id', identifier)
          .maybeSingle();
        if (learnerRow?.user_id) { resolved[identifier] = learnerRow.user_id; continue; }

        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('id', identifier)
          .maybeSingle();
        if (userRow?.id) { resolved[identifier] = userRow.id; continue; }

        resolved[identifier] = identifier;
      }

      return apiSuccess({ resolved }, context.request);
    }

    case 'resolve-admin-context': {
      // TODO(task 13): LEFT for task 13 (§7.5/7.10), NOT converted in task 12.2. This is an
      // admin-context RESOLUTION endpoint keyed by an arbitrary `identifier` (email/userId) — it resolves
      // SOMEONE ELSE'S context, not the current authenticated user, so it is NOT a simple
      // JWT/`resolveSchoolRole` replacement (the resolver is built around `getContextUser`).
      // It also needs `school_id`/`organizationId` COLUMNS and uses `role = 'admin'` /
      // `users.role = '<sso role>'` as query FILTERS, none of which `resolveSchoolRole`
      // reproduces. The `school_educators.role` read here is a DATA-SCOPE filter, NOT an
      // authority use (task 22.3 finalized: not an authz decision); the `users.role` reads
      // feed the frontend role-resolution path being neutralized in task 13.
      const { identifier } = body;
      if (!identifier) {
        return apiSuccess({ userId: null, schoolId: null, collegeId: null, adminType: null }, context.request);
      }

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      let userId = identifier;

      if (!isUUID) {
        const response: any = await supabase
          .from('users')
          .select('id')
          .ilike('email', identifier)
          .maybeSingle();
        if (!response?.data?.id) {
          return apiSuccess({ userId: null, schoolId: null, collegeId: null, adminType: null }, context.request);
        }
        userId = response.data.id;
      }

      const { data: schoolAdmin } = await supabase
        .from('school_educators')
        .select('school_id, role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (schoolAdmin) {
        return apiSuccess({ userId, schoolId: schoolAdmin.school_id, collegeId: null, adminType: 'school_admin' }, context.request);
      }

      const jwtIsCollegeAdmin = (Array.isArray(user.roles) && user.roles.includes('college_admin')) || user.role === 'college_admin';
      const { data: collegeAdmin } = await supabase
        .from('users')
        .select('id, organizationId, role')
        .eq('id', userId)
        .maybeSingle();

      if ((jwtIsCollegeAdmin || collegeAdmin?.role === 'college_admin') && collegeAdmin?.organizationId) {
        return apiSuccess({ userId, schoolId: null, collegeId: collegeAdmin.organizationId, adminType: 'college_admin' }, context.request);
      }

      const { data: universityAdmin } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .eq('role', 'university_admin')
        .maybeSingle();

      if (universityAdmin) {
        return apiSuccess({ userId, schoolId: null, collegeId: null, adminType: 'university_admin' }, context.request);
      }

      return apiSuccess({ userId, schoolId: null, collegeId: null, adminType: null }, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${body.action}`, context.request);
  }
});
