import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

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
      case 'validate-organization': {
        const { organization_id } = params;
        if (!organization_id) return apiError(400, 'VALIDATION_ERROR', 'Missing organization_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .eq('id', organization_id)
          .eq('admin_id', user.id)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiSuccess({ valid: false, message: 'Organization not found or access denied' }, context.request, { startTime });
        return apiSuccess({ valid: true, organization: data }, context.request, { startTime });
      }

      case 'validate-classes': {
        const { college_id, classes } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });
        if (!classes || !Array.isArray(classes) || classes.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing classes array', context.request, { startTime });
        }
        const results: any[] = [];
        for (const cls of classes) {
          const { grade, section, academic_year } = cls;
          if (!grade || !section || !academic_year) {
            results.push({ ...cls, found: false, error: 'Missing grade, section, or academic_year' });
            continue;
          }
          const { data, error } = await supabase
            .from('school_classes')
            .select('id, max_learners, current_learners')
            .eq('school_id', college_id)
            .eq('grade', grade)
            .eq('section', section)
            .eq('academic_year', academic_year)
            .maybeSingle();
          if (error) results.push({ ...cls, found: false, error: error.message });
          else if (!data) results.push({ ...cls, found: false, error: `Class ${grade}-${section} (${academic_year}) does not exist` });
          else results.push({ ...cls, found: true, class_id: data.id, max_learners: data.max_learners, current_learners: data.current_learners });
        }
        return apiSuccess(results, context.request, { startTime });
      }

      case 'check-curriculum-approval': {
        const { college_id, course_id, program_id, academic_year } = params;
        if (!college_id || !course_id || !program_id || !academic_year) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required params: college_id, course_id, program_id, academic_year', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('college_curriculums')
          .select('id, status')
          .eq('college_id', college_id)
          .eq('course_id', course_id)
          .eq('program_id', program_id)
          .eq('academic_year', academic_year)
          .eq('status', 'published')
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) {
          return apiSuccess({ approved: false, message: 'No published curriculum found for the given criteria' }, context.request, { startTime });
        }
        return apiSuccess({ approved: true, curriculum_id: data.id }, context.request, { startTime });
      }

      case 'check-duplicate-learners': {
        const { emails, enrollment_numbers, roll_numbers } = params;
        const duplicates: Record<string, any[]> = {};
        if (emails && Array.isArray(emails) && emails.length > 0) {
          const { data } = await supabase
            .from('learners')
            .select('id, email, name')
            .in('email', emails);
          if (data && data.length > 0) duplicates.emails = data;
        }
        if (enrollment_numbers && Array.isArray(enrollment_numbers) && enrollment_numbers.length > 0) {
          const { data } = await supabase
            .from('learners')
            .select('id, enrollment_number, name')
            .in('enrollment_number', enrollment_numbers.filter(Boolean));
          if (data && data.length > 0) duplicates.enrollment_numbers = data;
        }
        if (roll_numbers && Array.isArray(roll_numbers) && roll_numbers.length > 0) {
          const { data } = await supabase
            .from('learners')
            .select('id, roll_number, name')
            .in('roll_number', roll_numbers.filter(Boolean));
          if (data && data.length > 0) duplicates.roll_numbers = data;
        }
        return apiSuccess({
          has_duplicates: Object.keys(duplicates).length > 0,
          duplicates,
        }, context.request, { startTime });
      }

      case 'check-capacity': {
        const { class_id, new_learner_count } = params;
        if (!class_id) return apiError(400, 'VALIDATION_ERROR', 'Missing class_id', context.request, { startTime });
        if (!new_learner_count || typeof new_learner_count !== 'number') {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or invalid new_learner_count', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('school_classes')
          .select('max_learners, current_learners')
          .eq('id', class_id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        const available = data.max_learners - data.current_learners;
        return apiSuccess({
          max_learners: data.max_learners,
          current_learners: data.current_learners,
          available,
          has_capacity: available >= new_learner_count,
          requested: new_learner_count,
        }, context.request, { startTime });
      }

      case 'validate-learner-data': {
        const { learners } = params;
        if (!learners || !Array.isArray(learners)) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learners array', context.request, { startTime });
        }
        const results: any[] = [];
        const allEmails = learners.map((l: any) => l.email).filter(Boolean);
        const allEnrollments = learners.map((l: any) => l.enrollment_number).filter(Boolean);
        const { data: existingByEmail } = allEmails.length > 0
          ? await supabase.from('learners').select('email').in('email', allEmails)
          : { data: [] };
        const { data: existingByEnrollment } = allEnrollments.length > 0
          ? await supabase.from('learners').select('enrollment_number').in('enrollment_number', allEnrollments)
          : { data: [] };
        const existingEmailSet = new Set((existingByEmail || []).map((e: any) => e.email));
        const existingEnrollmentSet = new Set((existingByEnrollment || []).map((e: any) => e.enrollment_number));

        for (const [index, learner] of learners.entries()) {
          const errors: string[] = [];
          if (!learner.learner_name) errors.push('Missing learner_name');
          if (!learner.email) errors.push('Missing email');
          else if (existingEmailSet.has(learner.email)) errors.push('Duplicate email');
          if (!learner.contact_number) errors.push('Missing contact_number');
          if (learner.enrollment_number && existingEnrollmentSet.has(learner.enrollment_number)) {
            errors.push('Duplicate enrollment_number');
          }
          results.push({ row: index + 1, valid: errors.length === 0, errors, data: learner });
        }
        return apiSuccess({ total: learners.length, valid: results.filter((r: any) => r.valid).length, invalid: results.filter((r: any) => !r.valid).length, rows: results }, context.request, { startTime });
      }

      case 'import-learners': {
        const { learners } = params;
        if (!learners || !Array.isArray(learners) || learners.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty learners array', context.request, { startTime });
        }
        const enriched = learners.map((l: any) => ({
          ...l,
          created_by: user.id,
          created_at: new Date().toISOString(),
        }));
        const { data, error } = await supabase
          .from('learners')
          .insert(enriched)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ imported: data?.length || 0, data: data || [] }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[csv-import POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
