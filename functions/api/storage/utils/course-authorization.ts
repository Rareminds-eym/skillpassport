/**
 * Course Authorization Utilities
 * 
 * Validates user access to course resources.
 * Checks enrollment status and permissions.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthorizationResult {
  authorized: boolean;
  error?: string;
  enrollment?: any;
}

/**
 * Check if user is enrolled in a course
 */
export async function checkCourseEnrollment(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<AuthorizationResult> {
  try {
    // Check enrollment
    const { data: enrollment, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      console.error('[Authorization] Enrollment check error:', error);
      return { authorized: false, error: 'Failed to verify enrollment' };
    }

    if (!enrollment) {
      return { authorized: false, error: 'Not enrolled in this course' };
    }

    return { authorized: true, enrollment };
  } catch (error) {
    console.error('[Authorization] Exception:', error);
    return { authorized: false, error: 'Authorization check failed' };
  }
}

/**
 * Check if user has access to a specific lesson
 */
export async function checkLessonAccess(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
  lessonId: string
): Promise<AuthorizationResult> {
  try {
    // First check course enrollment
    const enrollmentCheck = await checkCourseEnrollment(supabase, userId, courseId);
    if (!enrollmentCheck.authorized) {
      return enrollmentCheck;
    }

    // Verify lesson belongs to course
    const { data: lesson, error } = await supabase
      .from('course_lessons')
      .select('module_id, course_modules!inner(course_id)')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error || !lesson) {
      return { authorized: false, error: 'Lesson not found' };
    }

    // @ts-ignore - Supabase typing issue with nested relations
    const lessonCourseId = lesson.course_modules?.course_id;
    if (lessonCourseId !== courseId) {
      return { authorized: false, error: 'Lesson does not belong to this course' };
    }

    return { authorized: true, enrollment: enrollmentCheck.enrollment };
  } catch (error) {
    console.error('[Authorization] Lesson access check error:', error);
    return { authorized: false, error: 'Access check failed' };
  }
}

/**
 * Validate file belongs to course/lesson
 */
export function validateFileKey(
  fileKey: string,
  courseId: string,
  lessonId?: string
): boolean {
  const parts = fileKey.split('/');
  
  let courseIdIndex: number;
  let lessonsIndex: number;
  let lessonIdIndex: number;
  
  if (fileKey.startsWith('courses/')) {
    if (parts.length < 5) return false;
    courseIdIndex = 1;
    lessonsIndex = 2;
    lessonIdIndex = 3;
  } else {
    if (parts.length < 4) return false;
    courseIdIndex = 0;
    lessonsIndex = 1;
    lessonIdIndex = 2;
  }

  if (parts[courseIdIndex] !== courseId) return false;
  if (parts[lessonsIndex] !== 'lessons') return false;
  if (lessonId && parts[lessonIdIndex] !== lessonId) return false;

  return true;
}

/**
 * Rate limiting check (simple in-memory implementation)
 * For production, use Cloudflare KV or Durable Objects
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowSeconds: number = 3600
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const key = `ratelimit:${userId}`;
  
  let record = rateLimitMap.get(key);
  
  // Reset if window expired
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: now + windowSeconds,
    };
    rateLimitMap.set(key, record);
  }

  // Check limit
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment counter
  record.count++;
  rateLimitMap.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}
