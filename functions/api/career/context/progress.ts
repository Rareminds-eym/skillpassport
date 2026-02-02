// Career Progress Context Builder

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CareerProgress } from '../types';

export async function buildCareerProgressContext(
  supabase: SupabaseClient, 
  studentId: string
): Promise<CareerProgress> {
  const defaultProgress: CareerProgress = {
    appliedJobs: [],
    savedJobs: [],
    courseEnrollments: [],
    recommendedCourses: []
  };

  try {
    const [applications, saved, enrollments, recommendations] = await Promise.all([
      supabase.from('applied_jobs').select('*, opportunities(id, title, company_name)').eq('student_id', studentId).limit(20),
      supabase.from('saved_jobs').select('*, opportunities(id, title, company_name)').eq('student_id', studentId).limit(20),
      supabase.from('course_enrollments').select('course_id, course_title, progress, status').eq('student_id', studentId).limit(10),
      supabase.from('student_course_recommendations').select('course_id, relevance_score, match_reasons, courses(title)').eq('student_id', studentId).eq('status', 'active').limit(10)
    ]);

    return {
      appliedJobs: (applications.data || []).map((a: any) => ({
        id: a.opportunities?.id,
        title: a.opportunities?.title || 'Unknown',
        company: a.opportunities?.company_name || 'Unknown',
        status: a.application_status,
        appliedAt: a.applied_at
      })),
      savedJobs: (saved.data || []).map((s: any) => ({
        id: s.opportunities?.id,
        title: s.opportunities?.title || 'Unknown',
        company: s.opportunities?.company_name || 'Unknown'
      })),
      courseEnrollments: (enrollments.data || []).map((e: any) => ({
        courseId: e.course_id,
        title: e.course_title,
        progress: e.progress,
        status: e.status
      })),
      recommendedCourses: (recommendations.data || []).map((r: any) => ({
        courseId: r.course_id,
        title: r.courses?.title || 'Unknown',
        relevanceScore: r.relevance_score,
        matchReasons: r.match_reasons || []
      }))
    };
  } catch (error) {
    console.error('Error in buildCareerProgressContext:', error);
    return defaultProgress;
  }
}
