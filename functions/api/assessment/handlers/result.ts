/**
 * Get Assessment Result Handler
 *
 * Handles GET /api/assessment/result?attemptId=...
 * Returns the stored analysis result for an attempt owned by the caller, plus the
 * attempt metadata and a normalized learner-info object for the result page.
 *
 * Backend-first: all Supabase access happens here (service role), with ownership
 * verification, so the frontend never queries the database directly.
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

const UNIVERSITY_GRADES = new Set(['after12', 'after10', 'college']);

function mapLearnerInfo(learner: any, gradeLevel: string | null, streamId: string | null) {
  const program = learner?.programs;
  return {
    name: learner?.name || '—',
    regNo: learner?.enrollmentNumber || learner?.admission_number || learner?.roll_number || learner?.registration_number || '—',
    rollNumberType: UNIVERSITY_GRADES.has(gradeLevel as string) ? 'university' : 'school',
    college: learner?.college_school_name || '—',
    school: learner?.college_school_name || '—',
    stream: streamId || '—',
    grade: learner?.grade || '—',
    branchField: learner?.branch_field || '—',
    courseName: learner?.course_name || program?.name || '—',
  };
}

export async function resultHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const attemptId = url.searchParams.get('attemptId');
  if (!attemptId) {
    return Response.json({ error: 'attemptId is required' }, { status: 400 });
  }

  // Resolve the caller's learner (ownership check + profile for the report header).
  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select(`
      id, name, grade, branch_field, course_name, college_school_name,
      enrollmentNumber, admission_number, roll_number, registration_number,
      programs ( name, code, degree_level )
    `)
    .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
    .maybeSingle();

  if (learnerError || !learner?.id) {
    return Response.json({ error: 'Learner not found' }, { status: 404 });
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('personal_assessment_attempts')
    .select('id, learner_id, grade_level, stream_id, learner_context, started_at, completed_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError || !attempt) {
    return Response.json({ error: 'Attempt not found' }, { status: 404 });
  }

  // Ownership check — never serve another learner's result.
  if (attempt.learner_id !== learner.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: result, error: resultError } = await supabase
    .from('personal_assessment_results')
    .select('*')
    .eq('attempt_id', attemptId)
    .maybeSingle();

  if (resultError) {
    return Response.json({ error: 'Failed to load result', message: resultError.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    hasResult: !!result,
    result: result || null,
    attempt: {
      id: attempt.id,
      gradeLevel: attempt.grade_level,
      streamId: attempt.stream_id,
      learnerContext: attempt.learner_context || null,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
    },
    learnerInfo: mapLearnerInfo(learner, attempt.grade_level, attempt.stream_id),
  });
}
