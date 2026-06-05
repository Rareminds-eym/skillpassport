import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'get-courses': {
        let query = supabase
          .from('courses')
          .select('*')
          .order('createdAt', { ascending: false });

        if (params.category) {
          query = query.eq('category', params.category);
        }
        if (params.skillType) {
          query = query.eq('skillType', params.skillType);
        }
        if (params.status) {
          query = query.eq('status', params.status);
        }
        if (params.search) {
          query = query.or(
            `title.ilike.%${params.search}%,description.ilike.%${params.search}%,code.ilike.%${params.search}%`
          );
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-active-courses': {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'Active')
          .order('title', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-user-enrollments': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*')
          .eq('userId', userId)
          .order('enrolledAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'is-user-enrolled': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('userId', userId)
          .eq('courseId', courseId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess({ enrolled: data !== null }, context.request, { startTime });
      }

      case 'get-course-progress': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_progress')
          .select('*')
          .eq('userId', userId)
          .eq('courseId', courseId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-user-course-progress': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_progress')
          .select('*')
          .eq('userId', userId)
          .order('lastAccessedAt', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-course-analytics': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_analytics')
          .select('*')
          .eq('courseId', courseId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-educator-by-email': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'Missing email', context.request, { startTime });
        const { data, error } = await supabase
          .from('school_educators')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'get-lesson-plans': {
        const { teacherId } = params;
        if (!teacherId) return apiError(400, 'VALIDATION_ERROR', 'Missing teacherId', context.request, { startTime });
        const { data, error } = await supabase
          .from('lesson_plans')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-course-modules': {
        const { courseId } = params;
        if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_modules')
          .select('*')
          .eq('courseId', courseId)
          .order('order', { ascending: true });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-course-module': {
        const { moduleId } = params;
        if (!moduleId) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_modules')
          .select('*')
          .eq('id', moduleId)
          .maybeSingle();
        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'create-course': {
        const { courseData } = params;
        if (!courseData) return apiError(400, 'VALIDATION_ERROR', 'Missing courseData', context.request, { startTime });
        const { data, error } = await supabase
          .from('courses')
          .insert(courseData)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-course': {
        const { courseId, courseData } = params;
        if (!courseId || !courseData) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or courseData', context.request, { startTime });
        const { data, error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-course-status': {
        const { courseId, status } = params;
        if (!courseId || !status) return apiError(400, 'VALIDATION_ERROR', 'Missing courseId or status', context.request, { startTime });
        const { data, error } = await supabase
          .from('courses')
          .update({ status })
          .eq('id', courseId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'enroll-in-course': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_enrollments')
          .insert({
            userId,
            courseId,
            enrolledAt: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'unenroll-from-course': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { error } = await supabase
          .from('course_enrollments')
          .update({ status: 'dropped' })
          .eq('userId', userId)
          .eq('courseId', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'complete-course': {
        const { userId, courseId } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { error } = await supabase
          .from('course_enrollments')
          .update({
            status: 'completed',
            completedAt: new Date().toISOString(),
          })
          .eq('userId', userId)
          .eq('courseId', courseId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'update-course-progress': {
        const { userId, courseId, completedLessons, totalLessons, progressPercentage } = params;
        if (!userId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId or courseId', context.request, { startTime });
        const { error } = await supabase
          .from('course_progress')
          .upsert({
            userId,
            courseId,
            completedLessons,
            totalLessons,
            progressPercentage,
            lastAccessedAt: new Date().toISOString(),
          });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'save-certificate': {
        const { certificateData, learnerId, courseId } = params;
        if (!certificateData || !learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'Missing required fields', context.request, { startTime });
        
        // Save to certificates table
        const { error: certificateError } = await supabase.from('certificates').insert(certificateData);
        if (certificateError) return apiDbError(certificateError, context.request, { startTime });
        
        // Update course_enrollments
        const { error: enrollmentError } = await supabase
          .from('course_enrollments')
          .update({ certificate_url: certificateData.link || certificateData.document_url })
          .eq('userId', learnerId) // Use userId instead of learner_id as seen in enroll-in-course
          .eq('courseId', courseId);
          
        if (enrollmentError) return apiDbError(enrollmentError, context.request, { startTime });
        
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'mark-lesson-complete': {
        const { userId, courseId, lessonId } = params;
        if (!userId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId, courseId, or lessonId', context.request, { startTime });
        const { error } = await supabase
          .from('lesson_completions')
          .insert({
            userId,
            courseId,
            lessonId,
            completedAt: new Date().toISOString(),
          });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'create-course-module': {
        const { moduleData } = params;
        if (!moduleData) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleData', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_modules')
          .insert(moduleData)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-course-module': {
        const { moduleId, moduleData } = params;
        if (!moduleId || !moduleData) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleId or moduleData', context.request, { startTime });
        const { data, error } = await supabase
          .from('course_modules')
          .update(moduleData)
          .eq('id', moduleId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-course-module': {
        const { moduleId } = params;
        if (!moduleId) return apiError(400, 'VALIDATION_ERROR', 'Missing moduleId', context.request, { startTime });
        const { error } = await supabase
          .from('course_modules')
          .delete()
          .eq('id', moduleId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[course/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});
