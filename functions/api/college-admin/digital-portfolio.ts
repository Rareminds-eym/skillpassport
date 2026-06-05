import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
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
      // ── Certificates ──
      case 'insert-certificate': {
        const { data, error } = await supabase
          .from('certificates')
          .insert([params])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-enrollment-certificate': {
        const { learner_id, course_id, certificate_url } = params;
        if (!learner_id || !course_id || !certificate_url) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id, course_id, or certificate_url', context.request, { startTime });
        }
        const { error } = await supabase
          .from('course_enrollments')
          .update({ certificate_url })
          .eq('learner_id', learner_id)
          .eq('course_id', course_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      // ── Projects ──
      case 'insert-projects': {
        const { records } = params;
        if (!records || !Array.isArray(records) || records.length === 0) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('projects')
          .insert(records)
          .select();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Learners ──
      case 'update-learner': {
        const { id, ...updates } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-learner': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Badges ──
      case 'save-badges': {
        const { learner_id, metadata } = params;
        if (!learner_id || !metadata) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or metadata', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('learners')
          .update({ metadata })
          .eq('id', learner_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ── Portfolio ──
      case 'get-portfolio-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });

        const { data: learner, error: learnerError } = await supabase
          .from('learners')
          .select(`
            *,
            school:organizations!learners_school_id_fkey (
              id, name, code, city, state, organization_type
            ),
            college:organizations!learners_college_id_fkey (
              id, name, code, city, state, organization_type
            ),
            universityInfo:organizations!learners_universityid_fkey (
              id, name, code, state, city, website, organization_type
            ),
            university_colleges:university_college_id (
              id, name, code,
              university:organizations!university_colleges_university_id_fkey (
                id, name, state, city, organization_type
              )
            )
          `)
          .eq('email', email)
          .maybeSingle();

        if (learnerError) return apiDbError(learnerError, context.request, { startTime });
        if (!learner) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });

        if (learner.school_id && !learner.school) {
          const { data: schoolData } = await supabase
            .from('organizations')
            .select('id, name, code, city, state, organization_type')
            .eq('id', learner.school_id)
            .single();
          if (schoolData) learner.school = schoolData;
        }

        if (learner.college_id && !learner.college) {
          const { data: collegeData } = await supabase
            .from('organizations')
            .select('id, name, code, city, state, organization_type')
            .eq('id', learner.college_id)
            .single();
          if (collegeData) learner.college = collegeData;
        }

        const userId = learner.id;

        const [
          skillsResult,
          trainingsResult,
          projectsResult,
          certificatesResult,
          educationResult,
          experienceResult
        ] = await Promise.all([
          supabase.from('skills').select('*').eq('learner_id', userId).in('approval_status', ['verified', 'approved']).eq('enabled', true).order('created_at', { ascending: false }),
          supabase.from('trainings').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
          supabase.from('projects').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
          supabase.from('certificates').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('issued_on', { ascending: false }),
          supabase.from('education').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('year_of_passing', { ascending: false }),
          supabase.from('experience').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false })
        ]);

        return apiSuccess({
          learner,
          skills: skillsResult.data || [],
          trainings: trainingsResult.data || [],
          projects: projectsResult.data || [],
          certificates: certificatesResult.data || [],
          education: educationResult.data || [],
          experience: experienceResult.data || [],
        }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[digital-portfolio POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
