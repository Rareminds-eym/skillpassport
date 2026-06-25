import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env;
  const supabase = getServiceClient(env);

  let body: Record<string, any>;
  try { body = await context.request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action field', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      // ─────────────────────────────────────────
      // USERS
      // ─────────────────────────────────────────
      case 'get-user-by-id': {
        const { userId, select: selectField } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const q = selectField ? supabase.from('users').select(selectField) : supabase.from('users').select('*');
        const { data, error } = await q.eq('id', userId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ─────────────────────────────────────────
      // ASSESSMENT RESULTS
      // ─────────────────────────────────────────
      case 'list-assessment-results': {
        const { select: selectField, orderBy = 'created_at', orderDir = 'desc' } = params;
        const q = selectField
          ? supabase.from('personal_assessment_results').select(selectField)
          : supabase.from('personal_assessment_results').select('*');
        const { data, error } = await q.order(orderBy, { ascending: orderDir === 'asc' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'list-learners-by-ids': {
        const { learnerIds, select: selectField } = params;
        if (!learnerIds || !Array.isArray(learnerIds)) return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid learnerIds', context.request, { startTime });
        const q = selectField ? supabase.from('learners').select(selectField) : supabase.from('learners').select('*');
        const { data, error } = await q.in('user_id', learnerIds);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'list-organizations-by-type': {
        const { orgType = 'college', select: selectField, orderBy = 'name', orderDir = 'asc' } = params;
        const q = selectField ? supabase.from('organizations').select(selectField) : supabase.from('organizations').select('id, name');
        const { data, error } = await q.eq('organization_type', orgType).order(orderBy, { ascending: orderDir === 'asc' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─────────────────────────────────────────
      // COURSES
      // ─────────────────────────────────────────
      case 'list-courses': {
        const { filters, select: selectField, orderBy = 'created_at', orderDir = 'desc' } = params;
        let q = selectField ? supabase.from('courses').select(selectField) : supabase.from('courses').select('*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.in) q = q.in(key, v.in);
              if (v.is) q = q.is(key, v.is);
              if (v.eq) q = q.eq(key, v.eq);
              if (v.neq) q = q.neq(key, v.neq);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        const { data, error } = await q.order(orderBy, { ascending: orderDir === 'asc' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'upsert-course': {
        const { courseId, values } = params;
        if (!values) return apiError(400, 'VALIDATION_ERROR', 'Missing values', context.request, { startTime });
        if (courseId) {
          const { data, error } = await supabase.from('courses').update(values).eq('course_id', courseId).select();
          if (error) return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        } else {
          const { data, error } = await supabase.from('courses').insert(values).select();
          if (error) return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        }
      }

      // ─────────────────────────────────────────
      // DIGITAL PORTFOLIOS
      // ─────────────────────────────────────────
      case 'list-digital-portfolios': {
        const { filters, select: selectField, orderBy = 'created_at', orderDir = 'desc' } = params;
        let q = selectField ? supabase.from('digital_portfolios').select(selectField) : supabase.from('digital_portfolios').select('*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.in) q = q.in(key, v.in);
              if (v.is) q = q.is(key, v.is);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        const { data, error } = await q.order(orderBy, { ascending: orderDir === 'asc' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─────────────────────────────────────────
      // SYLLABUS APPROVAL / CURRICULUM
      // ─────────────────────────────────────────
      case 'get-curriculum': {
        const { filters, select: selectField } = params;
        let q = selectField ? supabase.from('curriculum').select(selectField) : supabase.from('curriculum').select('*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.in) q = q.in(key, v.in);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-curriculum-units': {
        const { filters, select: selectField } = params;
        let q = selectField ? supabase.from('curriculum_units').select(selectField) : supabase.from('curriculum_units').select('*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.in) q = q.in(key, v.in);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-subject-outcomes': {
        const { filters, select: selectField } = params;
        let q = selectField ? supabase.from('subject_outcomes').select(selectField) : supabase.from('subject_outcomes').select('*');
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'object' && value !== null) {
              const v = value as Record<string, any>;
              if (v.eq) q = q.eq(key, v.eq);
              if (v.in) q = q.in(key, v.in);
            } else {
              q = q.eq(key, value);
            }
          }
        }
        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ─────────────────────────────────────────
      // COLLEGE CURRICULUM
      // ─────────────────────────────────────────
      case 'get-curriculum-by-id': {
        const { curriculumId, select: selectField } = params;
        if (!curriculumId) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculumId', context.request, { startTime });
        const q = selectField ? supabase.from('college_curriculums').select(selectField) : supabase.from('college_curriculums').select('*');
        const { data, error } = await q.eq('id', curriculumId).single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-curriculum-units-by-curriculum': {
        const { curriculumId, select: selectField, orderBy = 'order_index', orderDir = 'asc' } = params;
        if (!curriculumId) return apiError(400, 'VALIDATION_ERROR', 'Missing curriculumId', context.request, { startTime });
        const q = selectField ? supabase.from('college_curriculum_units').select(selectField) : supabase.from('college_curriculum_units').select('*');
        const { data, error } = await q.eq('curriculum_id', curriculumId).order(orderBy, { ascending: orderDir === 'asc' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-unit-outcomes': {
        const { unitId, select: selectField } = params;
        if (!unitId) return apiError(400, 'VALIDATION_ERROR', 'Missing unitId', context.request, { startTime });
        const q = selectField ? supabase.from('college_curriculum_outcomes').select(selectField) : supabase.from('college_curriculum_outcomes').select('*');
        const { data, error } = await q.eq('unit_id', unitId).order('created_at', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-unit-outcomes-batch': {
        const { unitIds, select: selectField } = params;
        if (!unitIds || !Array.isArray(unitIds)) return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid unitIds', context.request, { startTime });
        const q = selectField ? supabase.from('college_curriculum_outcomes').select(selectField) : supabase.from('college_curriculum_outcomes').select('*');
        const { data, error } = await q.in('unit_id', unitIds).order('created_at', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[university-admin/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
