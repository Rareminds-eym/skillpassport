import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  try {
    switch (action) {
      case 'get-analytics-data': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('applied_jobs')
          .select('*, opportunities!fk_applied_jobs_opportunity(id, job_title, title, company_name, employment_type, location, salary_range_min, salary_range_max, mode)')
          .eq('learner_id', learnerId)
          .order('applied_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-course-filter-options': {
        const [categories, skillTypes, durations] = await Promise.all([
          supabase.from('courses').select('category').not('category', 'is', null).is('deleted_at', null),
          supabase.from('courses').select('skill_type').not('skill_type', 'is', null).is('deleted_at', null),
          supabase.from('courses').select('duration').not('duration', 'is', null).is('deleted_at', null),
        ]);
        return apiSuccess({
          categories: [...new Set(categories.data?.map((c: any) => c.category).filter(Boolean) || [])],
          skillTypes: [...new Set(skillTypes.data?.map((s: any) => s.skill_type).filter(Boolean) || [])],
          durations: [...new Set(durations.data?.map((d: any) => d.duration).filter(Boolean) || [])],
        }, context.request, { startTime });
      }

      case 'get-recommended-courses': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        try {
          // Fetch recommendations with DENORMALIZED capability columns (no LTE API calls)
          const { data: recommendations, error: recError } = await supabase
            .from('learner_course_recommendations')
            .select(`
              id,
              learner_id,
              course_id,
              role_id,
              capability_id,
              capability_name,
              capability_code,
              capability_description,
              cached_at
            `)
            .eq('learner_id', learnerId)
            .eq('status', 'active')
            .order('relevance_score', { ascending: false });

          if (recError) return apiDbError(recError, context.request, { startTime });

          if (!recommendations || recommendations.length === 0) {
            return apiSuccess([], context.request, { startTime });
          }

          // Transform recommendations to include capability object
          const result = recommendations.map((rec: any) => {
            // Build capability from denormalized columns
            const capability = rec.capability_id ? {
              id: rec.capability_id,
              name: rec.capability_name || '',
              code: rec.capability_code || '',
              description: rec.capability_description || ''
            } : null;

            return {
              id: rec.id,
              learner_id: rec.learner_id,
              course_id: rec.course_id,
              role_id: rec.role_id,
              capability
            };
          });

          // Fallback: fetch missing capability data from old courses table for unfound capabilities
          const unfoundRecs = result.filter((r: any) => !r.capability);

          if (unfoundRecs.length > 0) {
            const courseIds = Array.from(new Set(unfoundRecs.map((r: any) => r.course_id)));
            const { data: oldCourses, error: courseError } = await supabase
              .from('courses')
              .select('course_id, title, code, description')
              .in('course_id', courseIds);

            if (!courseError && oldCourses) {
              const oldCourseMap: Record<string, any> = {};
              oldCourses.forEach((course: any) => {
                oldCourseMap[course.course_id] = {
                  id: course.course_id,
                  name: course.title,
                  code: course.code,
                  description: course.description
                };
              });

              // Update unfound records with old course data
              return apiSuccess(
                result.map((rec: any) => ({
                  ...rec,
                  capability: rec.capability || oldCourseMap[rec.course_id] || null
                })),
                context.request,
                { startTime }
              );
            }
          }

          return apiSuccess(result, context.request, { startTime });
        } catch (error: any) {
          console.error('[get-recommended-courses]', error?.message || error);
          return apiError(500, 'INTERNAL_ERROR', error?.message || 'Failed to fetch recommendations', context.request, { startTime });
        }
      }

      case 'get-learning-courses': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('trainings')
          .select('*, certificates(id, title, level, link, issued_on)')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-certificate-url': {
        const { learnerId, courseId } = params;
        if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('certificate_url')
          .eq('learner_id', learnerId)
          .eq('course_id', courseId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-institution-info': {
        const { organizationId, collegeId } = params;
        if (organizationId) {
          const { data, error } = await supabase
            .from('organizations')
            .select('name, city, state')
            .eq('id', organizationId)
            .maybeSingle();
          if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        }
        if (collegeId) {
          const { data, error } = await supabase
            .from('university_colleges')
            .select('name, university:organizations!university_colleges_university_id_fkey(name, city, state, organization_type)')
            .eq('id', collegeId)
            .maybeSingle();
          if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        }
        return apiError(400, 'VALIDATION_ERROR', 'Missing organizationId or collegeId', context.request, { startTime });
      }

      case 'get-learner-by-user': {
        const { userId, email } = params;
        if (userId) {
          const { data, error } = await supabase
            .from('learners')
            .select('id, email, name, user_id')
            .eq('user_id', userId)
            .maybeSingle();
          if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          if (data) return apiSuccess(data, context.request, { startTime });
        }
        if (email) {
          const { data, error } = await supabase
            .from('learners')
            .select('id, email, name')
            .eq('email', email)
            .maybeSingle();
          if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
          return apiSuccess(data || null, context.request, { startTime });
        }
        return apiError(400, 'VALIDATION_ERROR', 'Missing userId or email', context.request, { startTime });
      }

      case 'get-select-course-data': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });

        const [coursesRes, enrollmentsRes, progressRes, modulesRes] = await Promise.all([
          supabase.from('courses').select('course_id, title, code, description, duration, category, university').eq('status', 'Active').order('title'),
          supabase.from('course_enrollments').select('course_id').eq('learner_id', learnerId),
          supabase.from('learner_course_progress').select('course_id, lesson_id, status').eq('learner_id', learnerId),
          supabase.from('course_modules').select('course_id, lessons:lessons(lesson_id)'),
        ]);

        if (coursesRes.error) return apiDbError(coursesRes.error, context.request, { startTime });
        if (enrollmentsRes.error) return apiDbError(enrollmentsRes.error, context.request, { startTime });
        if (progressRes.error) return apiDbError(progressRes.error, context.request, { startTime });

        const enrolledIds = enrollmentsRes.data?.map((e: any) => e.course_id) || [];

        const totalLessonsMap: Record<string, number> = {};
        modulesRes.data?.forEach((mod: any) => {
          if (!totalLessonsMap[mod.course_id]) totalLessonsMap[mod.course_id] = 0;
          totalLessonsMap[mod.course_id] += mod.lessons?.length || 0;
        });

        const courseProgressTemp: Record<string, { completed: number }> = {};
        progressRes.data?.forEach((p: any) => {
          if (!courseProgressTemp[p.course_id]) courseProgressTemp[p.course_id] = { completed: 0 };
          if (p.status === 'completed') courseProgressTemp[p.course_id].completed++;
        });

        const progressMap: Record<string, { completedModules: number; totalModules: number; status: string }> = {};
        Object.keys(courseProgressTemp).forEach(courseId => {
          const total = totalLessonsMap[courseId] || 0;
          const completed = courseProgressTemp[courseId].completed;
          progressMap[courseId] = { completedModules: completed, totalModules: total, status: total > 0 && completed >= total ? 'completed' : 'ongoing' };
        });
        enrolledIds.forEach((courseId: string) => {
          if (!progressMap[courseId]) {
            progressMap[courseId] = { completedModules: 0, totalModules: totalLessonsMap[courseId] || 0, status: 'ongoing' };
          }
        });

        return apiSuccess({
          courses: coursesRes.data || [],
          enrolledCourseIds: enrolledIds,
          enrollmentProgress: progressMap,
          totalLessonsMap,
        }, context.request, { startTime });
      }

      case 'enroll-course': {
        const { learnerId, courseId, courseTitle, description, duration, university } = params;
        if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId or courseId', context.request, { startTime });

        const { data: modules } = await supabase.from('course_modules').select('module_id').eq('course_id', courseId);
        const totalModules = modules?.length || 0;

        const { error: enrollError } = await supabase.from('course_enrollments').insert({
          learner_id: learnerId, course_id: courseId, course_title: courseTitle, enrolled_at: new Date().toISOString(), status: 'active', progress: 0,
        });
        if (enrollError) return apiDbError(enrollError, context.request, { startTime });

        const { data: training, error: trainingError } = await supabase.from('trainings').insert({
          learner_id: learnerId, course_id: courseId, title: courseTitle, organization: university || 'Internal Platform', description, duration,
          status: 'ongoing', completed_modules: 0, total_modules: totalModules, hours_spent: 0, approval_status: 'approved', source: 'internal_course',
        }).select().single();

        if (training && !trainingError) {
          const { data: courseSkills } = await supabase.from('course_skills').select('skill_name, proficiency_level, type').eq('course_id', courseId);
          if (courseSkills && courseSkills.length > 0) {
            const learnerSkills = courseSkills.map((skill: any) => ({
              learner_id: learnerId, training_id: training.id, name: skill.skill_name, type: skill.type || 'technical',
              level: 3, approval_status: 'approved', enabled: true, verified: true,
            }));
            await supabase.from('skills').insert(learnerSkills);
          }
        }

        return apiSuccess({ enrolled: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[learner-dashboard-widgets/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
