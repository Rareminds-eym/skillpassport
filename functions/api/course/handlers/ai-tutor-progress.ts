/**
 * AI Tutor Progress Handler
 * 
 * Handles student progress tracking for courses:
 * - GET: Fetch progress and calculate completion percentage
 * - POST: Update lesson progress status
 * 
 * Requirements: 7.6
 */

import type { PagesFunction, PagesEnv } from '../../../../src/functions-lib/types';
import { authenticateUser } from '../../shared/auth';
import { jsonResponse } from '../../../../src/functions-lib/response';

interface UpdateProgressRequestBody {
  courseId?: string;
  lessonId?: string;
  status?: string;
}

/**
 * GET /api/course/ai-tutor-progress?courseId=<id>
 * 
 * Fetch student progress for a course
 * 
 * Query parameters:
 * - courseId: string (required) - ID of the course
 * 
 * Response:
 * - courseId: string
 * - totalLessons: number
 * - completedLessons: number
 * - completionPercentage: number
 * - lastAccessedLessonId: string | null
 * - lastAccessedAt: string | null
 * - progress: array of progress records
 */
export const onRequestGet: PagesFunction<PagesEnv> = async (context) => {
  try {
    const { request, env } = context;

    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { user, supabase } = auth;
    const studentId = user.id;

    // Parse query parameters
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return jsonResponse({ error: 'Missing courseId parameter' }, 400);
    }

    // Fetch student progress for the course
    const { data: progress, error: progressError } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status, last_accessed, completed_at, time_spent_seconds')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (progressError) {
      console.error('Failed to fetch progress:', progressError);
      return jsonResponse({ error: 'Failed to fetch progress' }, 500);
    }

    // Fetch total lessons in the course
    const { data: lessons } = await supabase
      .from('lessons')
      .select('lesson_id, course_modules!inner(course_id)')
      .eq('course_modules.course_id', courseId);

    // Calculate completion statistics
    const totalLessons = lessons?.length || 0;
    const completedLessons = (progress || []).filter((p: any) => p.status === 'completed').length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Find last accessed lesson
    const lastAccessed = (progress || [])
      .filter((p: any) => p.last_accessed)
      .sort((a: any, b: any) => new Date(b.last_accessed!).getTime() - new Date(a.last_accessed!).getTime())[0];

    return jsonResponse({
      courseId,
      totalLessons,
      completedLessons,
      completionPercentage,
      lastAccessedLessonId: lastAccessed?.lesson_id || null,
      lastAccessedAt: lastAccessed?.last_accessed || null,
      progress: progress || []
    });
  } catch (error) {
    console.error('AI tutor progress GET error:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};

/**
 * POST /api/course/ai-tutor-progress
 * 
 * Update student progress for a lesson
 * 
 * Request body:
 * - courseId: string (required) - ID of the course
 * - lessonId: string (required) - ID of the lesson
 * - status: string (required) - Progress status: 'not_started', 'in_progress', or 'completed'
 * 
 * Response:
 * - success: boolean
 * - progress: object with updated progress record
 */
export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  try {
    const { request, env } = context;

    // Authenticate user
    const auth = await authenticateUser(request, env as unknown as Record<string, string>);
    if (!auth) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { user, supabase } = auth;
    const studentId = user.id;

    // Parse request body
    let body: UpdateProgressRequestBody;
    try {
      body = await request.json() as UpdateProgressRequestBody;
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { courseId, lessonId, status } = body;

    // Validate required fields
    if (!courseId || !lessonId || !status) {
      return jsonResponse(
        { error: 'Missing required fields: courseId, lessonId, status' },
        400
      );
    }

    // Validate status value
    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return jsonResponse(
        { error: 'Invalid status. Must be: not_started, in_progress, or completed' },
        400
      );
    }

    // Prepare update data
    const now = new Date().toISOString();
    const updateData: any = {
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      status,
      last_accessed: now,
      updated_at: now
    };

    // Set completed_at timestamp if status is completed
    if (status === 'completed') {
      updateData.completed_at = now;
    }

    // Upsert progress record
    const { data: result, error: upsertError } = await supabase
      .from('student_course_progress')
      .upsert(updateData, { onConflict: 'student_id,course_id,lesson_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to update progress:', upsertError);
      return jsonResponse({ error: 'Failed to update progress' }, 500);
    }

    return jsonResponse({ success: true, progress: result });
  } catch (error) {
    console.error('AI tutor progress POST error:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};
