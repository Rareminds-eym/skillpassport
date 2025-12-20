// Career Progress Context Builder

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.38.4';
import type { CareerProgress } from '../types/career-ai.ts';

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
    // Fetch applied jobs
    const { data: appliedData } = await supabase
      .from('applied_jobs')
      .select(`
        id,
        application_status,
        applied_at,
        opportunities (id, title, company_name)
      `)
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false })
      .limit(20);

    // Fetch saved jobs
    const { data: savedData } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        opportunities (id, title, company_name)
      `)
      .eq('student_id', studentId)
      .limit(20);

    // Fetch course enrollments
    const { data: enrollmentsData } = await supabase
      .from('course_enrollments')
      .select('course_id, course_title, progress, status')
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false })
      .limit(10);

    // Fetch recommended courses
    const { data: recommendationsData } = await supabase
      .from('student_course_recommendations')
      .select(`
        course_id,
        relevance_score,
        match_reasons,
        courses (title)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('relevance_score', { ascending: false })
      .limit(10);

    return {
      appliedJobs: (appliedData || []).map((a: any) => ({
        id: a.opportunities?.id,
        title: a.opportunities?.title || 'Unknown',
        company: a.opportunities?.company_name || 'Unknown',
        status: a.application_status,
        appliedAt: a.applied_at
      })),
      savedJobs: (savedData || []).map((s: any) => ({
        id: s.opportunities?.id,
        title: s.opportunities?.title || 'Unknown',
        company: s.opportunities?.company_name || 'Unknown'
      })),
      courseEnrollments: (enrollmentsData || []).map((e: any) => ({
        courseId: e.course_id,
        title: e.course_title,
        progress: e.progress,
        status: e.status
      })),
      recommendedCourses: (recommendationsData || []).map((r: any) => ({
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
