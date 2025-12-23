// Course Context Builder

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.38.4';
import type { CourseContext, CourseEnrollment, AvailableCourse } from '../types/career-ai.ts';

export async function buildCourseContext(
  supabase: SupabaseClient,
  studentId: string
): Promise<CourseContext> {
  const defaultResult: CourseContext = {
    enrolledCourses: [],
    availableCourses: [],
    totalEnrolled: 0,
    inProgress: 0,
    completed: 0
  };

  try {
    // Fetch student's enrolled courses
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select(`
        id,
        course_id,
        course_title,
        progress,
        status,
        enrolled_at,
        last_accessed,
        completed_at,
        total_lessons,
        completed_lessons,
        skills_acquired,
        grade,
        certificate_url
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (enrollError) {
      console.error('Error fetching course enrollments:', enrollError);
    }

    // Get enrolled course IDs to exclude from available courses
    const enrolledCourseIds = (enrollments || []).map(e => e.course_id);

    // Fetch available courses (not enrolled)
    let availableQuery = supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        skill_type,
        enrollment_count,
        educator_name
      `)
      .eq('status', 'Active')
      .limit(20);

    // Exclude already enrolled courses
    if (enrolledCourseIds.length > 0) {
      availableQuery = availableQuery.not('course_id', 'in', `(${enrolledCourseIds.join(',')})`);
    }

    const { data: availableCourses, error: availableError } = await availableQuery;

    if (availableError) {
      console.error('Error fetching available courses:', availableError);
    }

    // Transform enrolled courses
    const transformedEnrollments: CourseEnrollment[] = (enrollments || []).map(e => ({
      id: e.id,
      courseId: e.course_id,
      courseTitle: e.course_title,
      progress: e.progress || 0,
      status: e.status || 'active',
      enrolledAt: e.enrolled_at,
      lastAccessed: e.last_accessed,
      completedAt: e.completed_at,
      totalLessons: e.total_lessons,
      completedLessons: Array.isArray(e.completed_lessons) ? e.completed_lessons.length : 0,
      skillsAcquired: e.skills_acquired ? Object.keys(e.skills_acquired) : [],
      grade: e.grade,
      certificateUrl: e.certificate_url
    }));

    // Transform available courses
    const transformedAvailable: AvailableCourse[] = (availableCourses || []).map(c => ({
      courseId: c.course_id,
      title: c.title,
      code: c.code,
      description: c.description || '',
      duration: c.duration,
      category: c.category || 'General',
      skillType: c.skill_type || 'technical',
      enrollmentCount: c.enrollment_count || 0,
      educatorName: c.educator_name
    }));

    // Calculate stats
    const inProgress = transformedEnrollments.filter(e => 
      e.status === 'active' && e.progress < 100
    ).length;
    const completed = transformedEnrollments.filter(e => 
      e.status === 'completed' || e.progress === 100
    ).length;

    return {
      enrolledCourses: transformedEnrollments,
      availableCourses: transformedAvailable,
      totalEnrolled: transformedEnrollments.length,
      inProgress,
      completed
    };
  } catch (error) {
    console.error('Error in buildCourseContext:', error);
    return defaultResult;
  }
}
