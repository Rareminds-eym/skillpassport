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

function mapLearnerInfo(learner: any, gradeLevel: string | null, streamId: string | null, attemptContext?: any) {
  const program = learner?.programs;
  const contextProgram = attemptContext?.programName || attemptContext?.selectedStream;
  const derivedStream = streamId ? streamId.toUpperCase() : '—';
  const derivedCourse = learner?.course_name || program?.name || contextProgram || (streamId ? derivedStream : '—');
  // College/School: resolve via organization membership first (source of truth for invited learners like Soundarya),
  // then direct columns. Never fallback to programName here — that is for Program field only.
  const orgCollege = (learner as any)?.college?.name;
  const orgSchool = (learner as any)?.school?.name;
  const orgUni = (learner as any)?.universityOrganization?.name;
  const institution = orgCollege || orgSchool || orgUni || learner?.college_school_name || learner?.school_name || learner?.university || '—';
  const isCollege = UNIVERSITY_GRADES.has(gradeLevel as string) || String(learner?.grade || '').toLowerCase().includes('college') || String(gradeLevel || '').toLowerCase()==='college' || !!learner?.specialization || !!contextProgram;
  return {
    name: learner?.name || '—',
    regNo: learner?.enrollmentNumber || learner?.admission_number || learner?.roll_number || learner?.registration_number || '—',
    rollNumberType: isCollege ? 'university' : 'school',
    college: institution,
    school: institution,
    stream: streamId || derivedStream,
    grade: learner?.grade || attemptContext?.rawGrade || gradeLevel || '—',
    branchField: learner?.branch_field || contextProgram || '—',
    courseName: derivedCourse,
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
      id, name, grade, branch_field, course_name, college_school_name, school_name, university, specialization,
      enrollmentNumber, admission_number, roll_number, registration_number, learner_type,
      college_id, school_id, universityId, university_college_id, universityCollegeId,
      programs ( name, code, degree_level )
    `)
    .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
    .maybeSingle();

  if (learnerError || !learner?.id) {
    return Response.json({ error: 'Learner not found' }, { status: 404 });
  }

  // Enrich with organization names without breaking main fetch (best-effort, 2-table fallback).
  const enrichName = async (id: string | null, tables: string[]) => {
    if (!id) return null;
    for (const tbl of tables) {
      try {
        const { data } = await supabase.from(tbl as any).select('name').eq('id', id).maybeSingle();
        if ((data as any)?.name) return (data as any).name;
      } catch { /* try next table */ }
    }
    return null;
  };
  try {
    const [collegeName, schoolName, uniName, uniCollegeName] = await Promise.all([
      enrichName((learner as any).college_id, ['organizations']),
      enrichName((learner as any).school_id, ['organizations']),
      enrichName((learner as any).universityId, ['organizations']),
      enrichName((learner as any).university_college_id || (learner as any).universityCollegeId, ['university_colleges', 'organizations']),
    ]);
    if (collegeName) (learner as any).college = { name: collegeName };
    else if (uniCollegeName) (learner as any).college = { name: uniCollegeName };
    if (schoolName) (learner as any).school = { name: schoolName };
    if (uniName) (learner as any).universityOrganization = { name: uniName };
  } catch { /* ignore org enrichment errors */ }

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
    learnerInfo: mapLearnerInfo(learner, attempt.grade_level, attempt.stream_id, attempt.learner_context),
  });
}
