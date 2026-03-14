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
import { validateRequest } from '../../../../src/validation/middleware/functions.js';
import { tutorProgressQuery, tutorProgressUpdate } from '../../../../src/validation/schemas/course/ai-tutor.js';
import { getLogger } from '../../../../src/config/logging.js';

const logger = getLogger('ai-tutor-progress');

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

    // Validate query parameters using Zod
    const validation = await validateRequest(request, {
      query: tutorProgressQuery
    });

    if (!validation.success) {
      return validation.response;
    }

    const { courseId } = validation.data.query;

    // Fetch student progress for the course
    const { data: progress, error: progressError } = await supabase
      .from('student_course_progress')
      .select('lesson_id, status, last_accessed, completed_at, time_spent_seconds')
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (progressError) {
      logger.error('Failed to fetch progress', progressError);
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
    logger.error('AI tutor progress GET error', error as Error);
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

    // Validate request body using Zod
    const validation = await validateRequest(request, {
      body: tutorProgressUpdate
    });

    if (!validation.success) {
      return validation.response;
    }

    const { courseId, lessonId, status, timeSpent } = validation.data.body;

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
      logger.error('Failed to update progress', upsertError);
      return jsonResponse({ error: 'Failed to update progress' }, 500);
    }

    return jsonResponse({ success: true, progress: result });
  } catch (error) {
    logger.error('AI tutor progress POST error', error as Error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};
