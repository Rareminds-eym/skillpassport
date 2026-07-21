import { withAuth, getContextUser, getServiceClient } from '../../lib/auth';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed, apiNotFound } from '../../lib/response';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

function parseBody(request: Request): Promise<any> {
  return request.json().catch(() => ({}));
}

async function handler(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  const env = context.env as Record<string, unknown>;
  const supabase = getServiceClient(env as any);
  const request = context.request;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/courses', '') || '/';
  const method = request.method;

  // ─── ENROLLMENT ────────────────────────────────────────────────────

  // POST /api/courses/enroll
  if (path === '/enroll' && method === 'POST') {
    const { learnerEmail, courseId } = await parseBody(request);
    if (!learnerEmail || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerEmail and courseId required', request);

    const { data: learner } = await supabase.from('learners').select('id, name, email').eq('email', learnerEmail).maybeSingle();
    if (!learner) return apiError(404, 'NOT_FOUND', 'Learner not found', request);

    const { data: course } = await supabase.from('courses').select('course_id, title, educator_id').eq('course_id', courseId).maybeSingle();
    if (!course) return apiError(404, 'NOT_FOUND', 'Course not found', request);

    let educatorName = 'Unknown Educator';
    if (course.educator_id) {
      const { data: educator } = await supabase.from('users').select('firstName, lastName, email').eq('id', course.educator_id).maybeSingle();
      if (educator) educatorName = `${educator.firstName || ''} ${educator.lastName || ''}`.trim() || educator.email || 'Unknown Educator';
    }

    const { data: existing } = await supabase.from('course_enrollments').select('*').eq('learner_id', learner.id).eq('course_id', courseId).maybeSingle();

    if (existing) {
      const updateData: Record<string, unknown> = { last_accessed: new Date().toISOString(), status: existing.status === 'completed' ? 'completed' : 'in_progress' };
      if (existing.progress === 0) updateData.progress = 1;
      await supabase.from('course_enrollments').update(updateData).eq('id', existing.id);
      return apiSuccess({ ...existing, ...updateData }, request);
    }

    const { data: modulesData } = await supabase.from('course_modules').select('module_id, lessons!fk_module (lesson_id)').eq('course_id', courseId);
    const totalLessons = modulesData?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;

    const { data: enrollment, error: enrollError } = await supabase.from('course_enrollments').insert({
      learner_id: learner.id, learner_name: learner.name, learner_email: learner.email,
      course_id: courseId, course_title: course.title, educator_id: course.educator_id,
      educator_name: educatorName, enrolled_at: new Date().toISOString(), progress: 1,
      completed_lessons: [], total_lessons: totalLessons, status: 'active', last_accessed: new Date().toISOString(),
    }).select().single();

    if (enrollError) {
      if (enrollError.code === '23505') {
        const { data: dup } = await supabase.from('course_enrollments').select('*').eq('learner_id', learner.id).eq('course_id', courseId).maybeSingle();
        if (dup) return apiSuccess(dup, request);
      }
      return apiDbError(enrollError, request);
    }

    try { await supabase.rpc('increment_course_enrollment', { course_id_param: courseId }); } catch {}
    return apiSuccess(enrollment, request, 201);
  }

  // GET /api/courses/enrollment?learnerEmail=&courseId=
  if (path === '/enrollment' && method === 'GET') {
    const qLearnerEmail = url.searchParams.get('learnerEmail');
    const qCourseId = url.searchParams.get('courseId');
    if (!qLearnerEmail || !qCourseId) return apiError(400, 'VALIDATION_ERROR', 'learnerEmail and courseId required', request);
    const { data: l } = await supabase.from('learners').select('id').eq('email', qLearnerEmail).maybeSingle();
    if (!l) return apiSuccess(null, request);
    const { data } = await supabase.from('course_enrollments').select('*').eq('learner_id', l.id).eq('course_id', qCourseId).maybeSingle();
    return apiSuccess(data || null, request);
  }

  // PUT /api/courses/enrollment/progress
  if (path === '/enrollment/progress' && method === 'PUT') {
    const { learnerEmail, courseId, completedLessons } = await parseBody(request);
    if (!learnerEmail || !courseId || !completedLessons) return apiError(400, 'VALIDATION_ERROR', 'learnerEmail, courseId, completedLessons required', request);

    const { data: l } = await supabase.from('learners').select('id').eq('email', learnerEmail).maybeSingle();
    if (!l) return apiError(404, 'NOT_FOUND', 'Learner not found', request);

    const { data: enrollment } = await supabase.from('course_enrollments').select('*').eq('learner_id', l.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return apiError(404, 'NOT_FOUND', 'Enrollment not found', request);

    const totalLessons = enrollment.total_lessons || completedLessons.length || 1;
    const progress = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
    let status = 'active';
    if (progress >= 100) status = 'completed';
    else if (progress > 0) status = 'in_progress';

    const updateData: Record<string, unknown> = {
      completed_lessons: completedLessons, progress, status,
      last_accessed: new Date().toISOString(), completed_at: progress >= 100 ? new Date().toISOString() : null,
    };

    if (progress >= 100 && (!enrollment.skills_acquired || enrollment.skills_acquired.length === 0)) {
      const { data: courseSkills } = await supabase.from('course_skills').select('skill_name').eq('course_id', courseId);
      if (courseSkills?.length) updateData.skills_acquired = courseSkills.map((s: any) => s.skill_name);
    }

    const { data: updated, error: updateError } = await supabase.from('course_enrollments').update(updateData).eq('id', enrollment.id).select().single();
    if (updateError) return apiDbError(updateError, request);
    return apiSuccess(updated, request);
  }

  // GET /api/courses/enrollment/learner?learnerEmail=
  if (path === '/enrollment/learner' && method === 'GET') {
    const qEmail = url.searchParams.get('learnerEmail');
    if (!qEmail) return apiError(400, 'VALIDATION_ERROR', 'learnerEmail required', request);
    const { data: l } = await supabase.from('learners').select('id').eq('email', qEmail).maybeSingle();
    if (!l) return apiSuccess([], request);
    const { data } = await supabase.from('course_enrollments').select('*').eq('learner_id', l.id).order('enrolled_at', { ascending: false });
    return apiSuccess(data || [], request);
  }

  // GET /api/courses/enrollment/course?courseId=
  if (path === '/enrollment/course' && method === 'GET') {
    const qId = url.searchParams.get('courseId');
    if (!qId) return apiError(400, 'VALIDATION_ERROR', 'courseId required', request);
    const { data } = await supabase.from('course_enrollments').select('*').eq('course_id', qId).order('enrolled_at', { ascending: false });
    return apiSuccess(data || [], request);
  }

  // GET /api/courses/enrollment/educator-stats?educatorId=
  if (path === '/enrollment/educator-stats' && method === 'GET') {
    const qId = url.searchParams.get('educatorId');
    if (!qId) return apiError(400, 'VALIDATION_ERROR', 'educatorId required', request);
    const { data } = await supabase.from('course_enrollments').select('*').eq('educator_id', qId);
    const enrollments = data || [];
    const stats = {
      total_enrollments: enrollments.length,
      active_learners: enrollments.filter((e: any) => e.status === 'active').length,
      completed_learners: enrollments.filter((e: any) => e.status === 'completed').length,
      average_progress: enrollments.length > 0 ? Math.round(enrollments.reduce((acc: number, e: any) => acc + (e.progress || 0), 0) / enrollments.length) : 0,
      recent_enrollments: enrollments.sort((a: any, b: any) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()).slice(0, 10),
    };
    return apiSuccess(stats, request);
  }

  // ─── VIDEO / LESSON PROGRESS ──────────────────────────────────────

  // GET /api/courses/progress/video-position?learnerId=&courseId=&lessonId=
  if (path === '/progress/video-position' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const courseId = url.searchParams.get('courseId');
    const lessonId = url.searchParams.get('lessonId');
    if (!learnerId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId required', request);
    const { data } = await supabase.from('learner_course_progress').select('video_position_seconds, video_duration_seconds, video_completed').eq('learner_id', learnerId).eq('course_id', courseId).eq('lesson_id', lessonId).maybeSingle();
    return apiSuccess(data || null, request);
  }

  // POST /api/courses/progress/video-position
  if (path === '/progress/video-position' && method === 'POST') {
    const body = await parseBody(request);
    const { learnerId, courseId, lessonId, positionSeconds, durationSeconds } = body;
    if (!learnerId || !courseId || !lessonId || typeof positionSeconds !== 'number') return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId, positionSeconds required', request);
    const videoCompleted = durationSeconds > 0 && (positionSeconds / durationSeconds) >= 0.9;
    const { error } = await supabase.from('learner_course_progress').upsert({
      learner_id: learnerId, course_id: courseId, lesson_id: lessonId,
      video_position_seconds: Math.floor(positionSeconds), video_duration_seconds: Math.floor(durationSeconds || 0),
      video_completed: videoCompleted, last_accessed: new Date().toISOString(),
      status: videoCompleted ? 'completed' : 'in_progress',
    }, { onConflict: 'learner_id,course_id,lesson_id' });
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // POST /api/courses/progress/video-completed
  if (path === '/progress/video-completed' && method === 'POST') {
    const { learnerId, courseId, lessonId } = await parseBody(request);
    if (!learnerId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId required', request);
    const { error } = await supabase.from('learner_course_progress').upsert({
      learner_id: learnerId, course_id: courseId, lesson_id: lessonId,
      video_completed: true, status: 'completed', completed_at: new Date().toISOString(), last_accessed: new Date().toISOString(),
    }, { onConflict: 'learner_id,course_id,lesson_id' });
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // ─── RESTORE POINT ────────────────────────────────────────────────

  // GET /api/courses/progress/restore-point?learnerId=&courseId=
  if (path === '/progress/restore-point' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const courseId = url.searchParams.get('courseId');
    if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId required', request);
    const { data } = await supabase.from('course_enrollments').select('course_id, last_module_index, last_lesson_index, last_lesson_id, last_video_position, progress, last_accessed, status, course_title').eq('learner_id', learnerId).eq('course_id', courseId).maybeSingle();
    if (data && data.progress > 0 && data.progress < 100) {
      return apiSuccess({ courseId: data.course_id, lastModuleIndex: data.last_module_index || 0, lastLessonIndex: data.last_lesson_index || 0, lastLessonId: data.last_lesson_id, lastVideoPosition: data.last_video_position || 0, progress: data.progress, lastAccessed: data.last_accessed, courseTitle: data.course_title }, request);
    }
    return apiSuccess(null, request);
  }

  // POST /api/courses/progress/restore-point
  if (path === '/progress/restore-point' && method === 'POST') {
    const { learnerId, courseId, moduleIndex, lessonIndex, lessonId, videoPosition = 0 } = await parseBody(request);
    if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId required', request);
    const { error } = await supabase.from('course_enrollments').update({
      last_module_index: moduleIndex, last_lesson_index: lessonIndex, last_lesson_id: lessonId,
      last_video_position: Math.floor(videoPosition), last_accessed: new Date().toISOString(),
    }).eq('learner_id', learnerId).eq('course_id', courseId);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // DELETE /api/courses/progress/restore-point?learnerId=&courseId=
  if (path === '/progress/restore-point' && method === 'DELETE') {
    const learnerId = url.searchParams.get('learnerId');
    const courseId = url.searchParams.get('courseId');
    if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId required', request);
    const { error } = await supabase.from('course_enrollments').update({ last_module_index: 0, last_lesson_index: 0, last_lesson_id: null, last_video_position: 0 }).eq('learner_id', learnerId).eq('course_id', courseId);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // ─── LESSON PROGRESS ──────────────────────────────────────────────

  // GET /api/courses/progress/lesson?learnerId=&courseId=&lessonId=
  if (path === '/progress/lesson' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const courseId = url.searchParams.get('courseId');
    const lessonId = url.searchParams.get('lessonId');
    if (!learnerId || !courseId || !lessonId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId required', request);
    const { data } = await supabase.from('learner_course_progress').select('*').eq('learner_id', learnerId).eq('course_id', courseId).eq('lesson_id', lessonId).maybeSingle();
    return apiSuccess(data || null, request);
  }

  // POST /api/courses/progress/lesson-status
  if (path === '/progress/lesson-status' && method === 'POST') {
    const { learnerId, courseId, lessonId, status } = await parseBody(request);
    if (!learnerId || !courseId || !lessonId || !status) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId, status required', request);
    const updateData: Record<string, unknown> = { learner_id: learnerId, course_id: courseId, lesson_id: lessonId, status, last_accessed: new Date().toISOString() };
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    const { error } = await supabase.from('learner_course_progress').upsert(updateData, { onConflict: 'learner_id,course_id,lesson_id' });
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // POST /api/courses/progress/time-spent
  if (path === '/progress/time-spent' && method === 'POST') {
    const { learnerId, courseId, lessonId, additionalSeconds } = await parseBody(request);
    if (!learnerId || !courseId || !lessonId || typeof additionalSeconds !== 'number') return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId, additionalSeconds required', request);
    const { data: existing } = await supabase.from('learner_course_progress').select('time_spent_seconds').eq('learner_id', learnerId).eq('course_id', courseId).eq('lesson_id', lessonId).maybeSingle();
    const newTime = (existing?.time_spent_seconds || 0) + additionalSeconds;
    const { error } = await supabase.from('learner_course_progress').upsert({
      learner_id: learnerId, course_id: courseId, lesson_id: lessonId, time_spent_seconds: newTime, last_accessed: new Date().toISOString(),
    }, { onConflict: 'learner_id,course_id,lesson_id' });
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true, totalTime: newTime }, request);
  }

  // ─── QUIZ PROGRESS ────────────────────────────────────────────────

  // POST /api/courses/progress/quiz/start
  if (path === '/progress/quiz/start' && method === 'POST') {
    const { learnerId, courseId, lessonId, quizId, totalQuestions } = await parseBody(request);
    if (!learnerId || !courseId || !lessonId || !quizId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, lessonId, quizId required', request);
    const { data: existing } = await supabase.from('learner_quiz_progress').select('*').eq('learner_id', learnerId).eq('quiz_id', quizId).eq('status', 'in_progress').order('attempt_number', { ascending: false }).limit(1).maybeSingle();
    if (existing) return apiSuccess({ data: existing, resumed: true }, request);
    const { data: lastAttempt } = await supabase.from('learner_quiz_progress').select('attempt_number').eq('learner_id', learnerId).eq('quiz_id', quizId).order('attempt_number', { ascending: false }).limit(1).maybeSingle();
    const attemptNumber = (lastAttempt?.attempt_number || 0) + 1;
    const { data, error } = await supabase.from('learner_quiz_progress').insert({
      learner_id: learnerId, course_id: courseId, lesson_id: lessonId, quiz_id: quizId,
      attempt_number: attemptNumber, total_questions: totalQuestions, status: 'in_progress', started_at: new Date().toISOString(),
    }).select().single();
    if (error) return apiDbError(error, request);
    return apiSuccess({ data, resumed: false }, request);
  }

  // POST /api/courses/progress/quiz/answer
  if (path === '/progress/quiz/answer' && method === 'POST') {
    const { learnerId, quizId, attemptNumber, questionId, answer } = await parseBody(request);
    if (!learnerId || !quizId || attemptNumber == null || !questionId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, quizId, attemptNumber, questionId required', request);
    const { data: current } = await supabase.from('learner_quiz_progress').select('answers, current_question_index').eq('learner_id', learnerId).eq('quiz_id', quizId).eq('attempt_number', attemptNumber).maybeSingle();
    const answers = (current?.answers as Record<string, unknown>) || {};
    answers[questionId] = answer;
    const { error } = await supabase.from('learner_quiz_progress').update({ answers, current_question_index: (current?.current_question_index || 0) + 1, updated_at: new Date().toISOString() }).eq('learner_id', learnerId).eq('quiz_id', quizId).eq('attempt_number', attemptNumber);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // GET /api/courses/progress/quiz?learnerId=&quizId=
  if (path === '/progress/quiz' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const quizId = url.searchParams.get('quizId');
    if (!learnerId || !quizId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, quizId required', request);
    const { data } = await supabase.from('learner_quiz_progress').select('*').eq('learner_id', learnerId).eq('quiz_id', quizId).eq('status', 'in_progress').order('attempt_number', { ascending: false }).limit(1).maybeSingle();
    return apiSuccess(data || null, request);
  }

  // POST /api/courses/progress/quiz/submit
  if (path === '/progress/quiz/submit' && method === 'POST') {
    const { learnerId, quizId, attemptNumber, correctAnswers, totalQuestions } = await parseBody(request);
    if (!learnerId || !quizId || attemptNumber == null || correctAnswers == null || totalQuestions == null) return apiError(400, 'VALIDATION_ERROR', 'learnerId, quizId, attemptNumber, correctAnswers, totalQuestions required', request);
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = scorePercentage >= 70;
    const { data, error } = await supabase.from('learner_quiz_progress').update({
      status: 'completed', correct_answers: correctAnswers, score_percentage: scorePercentage, passed,
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('learner_id', learnerId).eq('quiz_id', quizId).eq('attempt_number', attemptNumber).select().single();
    if (error) return apiDbError(error, request);
    return apiSuccess({ data, score: scorePercentage, passed }, request);
  }

  // ─── PROGRESS SUMMARY ─────────────────────────────────────────────

  // GET /api/courses/progress/summary?learnerId=&courseId=
  if (path === '/progress/summary' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const courseId = url.searchParams.get('courseId');
    if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId required', request);
    const { data: enrollment } = await supabase.from('course_enrollments').select('*').eq('learner_id', learnerId).eq('course_id', courseId).maybeSingle();
    const { data: lessonProgress } = await supabase.from('learner_course_progress').select('*').eq('learner_id', learnerId).eq('course_id', courseId);
    const completedLessons = lessonProgress?.filter((l: any) => l.status === 'completed').length || 0;
    const totalTimeSpent = lessonProgress?.reduce((acc: number, l: any) => acc + (l.time_spent_seconds || 0), 0) || 0;
    return apiSuccess({
      courseId, overallProgress: enrollment?.progress || 0, completedLessons, totalLessons: enrollment?.total_lessons || 0,
      totalTimeSpent, lastAccessed: enrollment?.last_accessed, status: enrollment?.status || 'not_started',
      restorePoint: enrollment ? { lastModuleIndex: enrollment.last_module_index || 0, lastLessonIndex: enrollment.last_lesson_index || 0, lastLessonId: enrollment.last_lesson_id, lastVideoPosition: enrollment.last_video_position || 0 } : null,
      lessonProgress: lessonProgress || [],
    }, request);
  }

  // GET /api/courses/progress/all?learnerId=
  if (path === '/progress/all' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', request);
    const { data } = await supabase.from('course_enrollments').select('course_id, course_title, progress, status, last_accessed, last_module_index, last_lesson_index, total_lessons, completed_lessons').eq('learner_id', learnerId).order('last_accessed', { ascending: false });
    return apiSuccess(data || [], request);
  }

  // POST /api/courses/progress/course-time
  if (path === '/progress/course-time' && method === 'POST') {
    const { learnerId, courseId, additionalSeconds } = await parseBody(request);
    if (!learnerId || !courseId || typeof additionalSeconds !== 'number') return apiError(400, 'VALIDATION_ERROR', 'learnerId, courseId, additionalSeconds required', request);
    const { data: current } = await supabase.from('course_enrollments').select('total_time_spent_seconds').eq('learner_id', learnerId).eq('course_id', courseId).maybeSingle();
    const newTotal = (current?.total_time_spent_seconds || 0) + additionalSeconds;
    const { error } = await supabase.from('course_enrollments').update({ total_time_spent_seconds: newTotal, last_accessed: new Date().toISOString() }).eq('learner_id', learnerId).eq('course_id', courseId);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true, totalTime: newTotal }, request);
  }

  // ─── COURSE DETAILS ───────────────────────────────────────────────

  // GET /api/courses/details/skills?courseIds=a,b,c
  if (path === '/details/skills' && method === 'GET') {
    const idsParam = url.searchParams.get('courseIds');
    if (!idsParam) return apiError(400, 'VALIDATION_ERROR', 'courseIds required', request);
    const courseIds = idsParam.split(',');
    const { data } = await supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds);
    return apiSuccess(data || [], request);
  }

  // GET /api/courses/details/classes?courseIds=a,b,c
  if (path === '/details/classes' && method === 'GET') {
    const idsParam = url.searchParams.get('courseIds');
    if (!idsParam) return apiError(400, 'VALIDATION_ERROR', 'courseIds required', request);
    const courseIds = idsParam.split(',');
    const { data } = await supabase.from('course_classes').select('course_id, class_name').in('course_id', courseIds);
    return apiSuccess(data || [], request);
  }

  // GET /api/courses/details/modules?courseIds=a,b,c
  if (path === '/details/modules' && method === 'GET') {
    const idsParam = url.searchParams.get('courseIds');
    if (!idsParam) return apiError(400, 'VALIDATION_ERROR', 'courseIds required', request);
    const courseIds = idsParam.split(',');
    const { data } = await supabase.from('course_modules').select('*, lessons(*, lesson_resources(*))').in('course_id', courseIds).order('order_index', { ascending: true });
    return apiSuccess(data || [], request);
  }

  // ─── COURSE LIST ──────────────────────────────────────────────────

  // GET /api/courses/list/filter-options
  if (path === '/list/filter-options' && method === 'GET') {
    const { data: categories } = await supabase.from('courses').select('category').not('category', 'is', null).is('deleted_at', null);
    const { data: skillTypes } = await supabase.from('courses').select('skill_type').not('skill_type', 'is', null).is('deleted_at', null);
    const { data: durations } = await supabase.from('courses').select('duration').not('duration', 'is', null).is('deleted_at', null);
    return apiSuccess({
      categories: [...new Set(categories?.map((c: any) => c.category).filter(Boolean) as string[])],
      skillTypes: [...new Set(skillTypes?.map((s: any) => s.skill_type).filter(Boolean) as string[])],
      durations: [...new Set(durations?.map((d: any) => d.duration).filter(Boolean) as string[])],
    }, request);
  }

  // GET /api/courses/list/:courseId/modules
  const modulesMatch = path.match(/^\/list\/([^/]+)\/modules$/);
  if (modulesMatch && method === 'GET') {
    const courseId = modulesMatch[1];
    if (!courseId) return apiNotFound('Course ID required', request);
    const { data } = await supabase.from('course_modules').select('*, lessons:lessons!fk_module (*)').eq('course_id', courseId).order('order_index', { ascending: true });
    const sorted = (data || []).map((m: any) => ({ ...m, lessons: (m.lessons || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)) }));
    return apiSuccess(sorted, request);
  }

  // GET /api/courses/list/:courseId
  const courseMatch = path.match(/^\/list\/([^/]+)$/);
  if (courseMatch && method === 'GET') {
    const courseId = courseMatch[1];
    const { data } = await supabase.from('courses').select('*').eq('course_id', courseId).is('deleted_at', null).maybeSingle();
    if (!data) return apiNotFound('Course not found', request);
    return apiSuccess(data, request);
  }

  // GET /api/courses/list
  if (path === '/list' && method === 'GET') {
    let query = supabase.from('courses').select('*', { count: 'exact' }).is('deleted_at', null);

    const statusFilter = url.searchParams.get('status');
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      query = query.in('status', statuses);
    } else {
      query = query.in('status', ['Active', 'Upcoming']);
    }

    const category = url.searchParams.get('category');
    if (category) query = query.eq('category', category);

    const skillType = url.searchParams.get('skillType');
    if (skillType) query = query.eq('skill_type', skillType);

    const duration = url.searchParams.get('duration');
    if (duration) query = query.eq('duration', duration);

    const search = url.searchParams.get('search');
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,code.ilike.%${search}%`);

    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error) return apiDbError(error, request);
    return apiSuccess({ courses: data || [], total: count || 0 }, request);
  }

  // ─── RECOMMENDATIONS ──────────────────────────────────────────────

  // GET /api/courses/recommendations/saved?learnerId=&status=&assessmentResultId=
  if (path === '/recommendations/saved' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    const status = url.searchParams.get('status');
    let assessmentResultId = url.searchParams.get('assessmentResultId');
    if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', request);

    // Auto-scope to the latest assessment result when not specified
    // (prevents mixing stale recommendations from old assessments)
    if (!assessmentResultId) {
      const { data: latest } = await supabase
        .from('learner_course_recommendations')
        .select('assessment_result_id')
        .eq('learner_id', learnerId)
        .order('recommended_at', { ascending: false })
        .limit(1);
      if (latest?.length > 0) {
        assessmentResultId = latest[0].assessment_result_id;
      }
    }

    // Note: Don't join with courses table because course_id may contain:
    // - Actual course IDs (for RAG recommendations)
    // - LTE capability IDs (for assessment-based capability recommendations)
    // Both can coexist in the same table, so we just fetch raw recommendations
    console.log('[Recommendations/Saved] Query params:', { learnerId, status, assessmentResultId });
    let q = supabase.from('learner_course_recommendations').select('*').eq('learner_id', learnerId).order('relevance_score', { ascending: false });
    if (status) q = q.eq('status', status);
    if (assessmentResultId) q = q.eq('assessment_result_id', assessmentResultId);
    const { data, error } = await q;
    console.log('[Recommendations/Saved] Query result:', { count: data?.length, error: error?.message });
    if (error) {
      console.error('[Recommendations/Saved] DB Error:', error);
      return apiDbError(error, request);
    }
    return apiSuccess(data || [], request);
  }

  // POST /api/courses/recommendations/save
  if (path === '/recommendations/save' && method === 'POST') {
    const { learnerId, recommendations, assessmentResultId, recommendationType } = await parseBody(request);
    if (!learnerId || !recommendations?.length) return apiError(400, 'VALIDATION_ERROR', 'learnerId and recommendations required', request);
    if (!assessmentResultId) return apiError(400, 'VALIDATION_ERROR', 'assessmentResultId is required', request);
    console.log('[Save] Request:', { learnerId, assessmentResultId, courseIds: recommendations.map((r: any) => r.course_id), recommendationType });
    const records = recommendations.map((rec: any) => ({
      learner_id: learnerId, course_id: rec.course_id, role_id: rec.role_id || null, assessment_result_id: assessmentResultId,
      relevance_score: rec.relevance_score, match_reasons: rec.match_reasons || [], skill_gaps_addressed: rec.skill_gaps_addressed || [],
      recommendation_type: recommendationType || 'assessment', status: 'active', recommended_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from('learner_course_recommendations').upsert(records, { onConflict: 'learner_id,course_id,role_id,assessment_result_id', ignoreDuplicates: false }).select();
    if (error) {
      console.error('[Save] DB Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return apiDbError(error, request);
    }
    return apiSuccess(data || [], request);
  }

  // PUT /api/courses/recommendations/status
  if (path === '/recommendations/status' && method === 'PUT') {
    const { id, status, dismissedReason } = await parseBody(request);
    if (!id || !status) return apiError(400, 'VALIDATION_ERROR', 'id and status required', request);
    const validStatuses = ['active', 'enrolled', 'dismissed', 'completed'];
    if (!validStatuses.includes(status)) return apiError(400, 'VALIDATION_ERROR', `Invalid status. Must be one of: ${validStatuses.join(', ')}`, request);
    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'dismissed') { updateData.dismissed_at = new Date().toISOString(); updateData.dismissed_reason = dismissedReason; }
    const { data, error } = await supabase.from('learner_course_recommendations').update(updateData).eq('id', id).select().single();
    if (error) return apiDbError(error, request);
    return apiSuccess(data, request);
  }

  // ─── STREAM RECOMMENDATION ────────────────────────────────────────

  // GET /api/courses/stream-recommendation?learnerId=
  if (path === '/stream-recommendation' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', request);
    const { data, error } = await supabase.from('stream_recommendation_reports').select('*').eq('learner_id', learnerId).eq('is_latest', true).single();
    if (error && error.code !== 'PGRST116') return apiDbError(error, request);
    return apiSuccess(data || null, request);
  }

  // POST /api/courses/stream-recommendation
  if (path === '/stream-recommendation' && method === 'POST') {
    const rec = await parseBody(request);
    if (!rec.learner_id) return apiError(400, 'VALIDATION_ERROR', 'learner_id required', request);
    const { data, error } = await supabase.from('stream_recommendation_reports').insert({
      learner_id: rec.learner_id, academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      current_grade: rec.current_grade, subject_marks: rec.subject_marks, projects_summary: rec.projects_summary,
      experiences_summary: rec.experiences_summary, interests: rec.interests, hobbies: rec.hobbies,
      science_score: rec.science_score, commerce_score: rec.commerce_score, arts_score: rec.arts_score,
      science_breakdown: rec.science_breakdown, commerce_breakdown: rec.commerce_breakdown, arts_breakdown: rec.arts_breakdown,
      recommended_stream: rec.recommended_stream, confidence_level: rec.confidence_level, alternative_stream: rec.alternative_stream,
      strengths: rec.strengths, career_suggestions: rec.career_suggestions, recommended_subjects: rec.recommended_subjects,
      ai_model_used: rec.ai_model_used || 'rule-based-v1',
    }).select().single();
    if (error) return apiDbError(error, request);
    return apiSuccess(data, request, 201);
  }

  // GET /api/courses/stream-recommendation/data?learnerId=
  if (path === '/stream-recommendation/data' && method === 'GET') {
    const learnerId = url.searchParams.get('learnerId');
    if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'learnerId required', request);
    const { data, error } = await supabase.rpc('get_learner_stream_recommendation_data', { p_learner_id: learnerId });
    if (error) return apiDbError(error, request);
    return apiSuccess(data, request);
  }

  // ─── EMBEDDING ────────────────────────────────────────────────────

  // GET /api/courses/embeddings
  if (path === '/embeddings' && method === 'GET') {
    const { data: courses, error } = await supabase.from('courses').select('course_id, title, code, description, duration, category, target_outcomes, status, embedding').eq('status', 'Active').not('embedding', 'is', null).is('deleted_at', null);
    if (error) return apiDbError(error, request);
    if (!courses?.length) return apiSuccess([], request);
    const courseIds = courses.map((c: any) => c.course_id);
    const { data: skillsData } = await supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds);
    const skillsByCourse: Record<string, string[]> = {};
    (skillsData || []).forEach((s: any) => { if (!skillsByCourse[s.course_id]) skillsByCourse[s.course_id] = []; skillsByCourse[s.course_id].push(s.skill_name); });
    return apiSuccess(courses.map((c: any) => ({ ...c, skills: skillsByCourse[c.course_id] || [], embedding: Array.isArray(c.embedding) ? c.embedding : (() => { try { return JSON.parse(c.embedding); } catch { return []; } })() })), request);
  }

  // GET /api/courses/by-skill-type?skillType=
  if (path === '/by-skill-type' && method === 'GET') {
    const skillType = url.searchParams.get('skillType');
    if (!skillType) return apiError(400, 'VALIDATION_ERROR', 'skillType required', request);
    const { data: courses, error } = await supabase.from('courses').select('course_id, title, code, description, duration, category, target_outcomes, status, skill_type, embedding').eq('status', 'Active').eq('skill_type', skillType).not('embedding', 'is', null).is('deleted_at', null);
    if (error) return apiDbError(error, request);
    if (!courses?.length) return apiSuccess([], request);
    const courseIds = courses.map((c: any) => c.course_id);
    const { data: skillsData } = await supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds);
    const skillsByCourse: Record<string, string[]> = {};
    (skillsData || []).forEach((s: any) => { if (!skillsByCourse[s.course_id]) skillsByCourse[s.course_id] = []; skillsByCourse[s.course_id].push(s.skill_name); });
    return apiSuccess(courses.map((c: any) => ({ ...c, skills: skillsByCourse[c.course_id] || [], embedding: Array.isArray(c.embedding) ? c.embedding : (() => { try { return JSON.parse(c.embedding); } catch { return []; } })() })), request);
  }

  // GET /api/courses/basic
  if (path === '/basic' && method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const { data: courses, error } = await supabase.from('courses').select('course_id, title, code, description, duration, category, target_outcomes, status').eq('status', 'Active').is('deleted_at', null).limit(limit);
    if (error) return apiDbError(error, request);
    if (!courses?.length) return apiSuccess([], request);
    const courseIds = courses.map((c: any) => c.course_id);
    const { data: skillsData } = await supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds);
    const skillsByCourse: Record<string, string[]> = {};
    (skillsData || []).forEach((s: any) => { if (!skillsByCourse[s.course_id]) skillsByCourse[s.course_id] = []; skillsByCourse[s.course_id].push(s.skill_name); });
    return apiSuccess(courses.map((c: any) => ({ ...c, skills: skillsByCourse[c.course_id] || [] })), request);
  }

  // GET /api/courses/by-skill-name?skillName=
  if (path === '/by-skill-name' && method === 'GET') {
    const skillName = url.searchParams.get('skillName');
    if (!skillName) return apiError(400, 'VALIDATION_ERROR', 'skillName required', request);
    const skillLower = skillName.toLowerCase();
    const { data: skillMatches } = await supabase.from('course_skills').select('course_id, skill_name, proficiency_level').ilike('skill_name', `%${skillLower}%`);
    if (!skillMatches?.length) return apiSuccess([], request);
    const courseIds = [...new Set(skillMatches.map((s: any) => s.course_id))];
    const { data: courses } = await supabase.from('courses').select('course_id, title, code, description, duration, category, target_outcomes, status').in('course_id', courseIds).eq('status', 'Active').is('deleted_at', null);
    if (!courses?.length) return apiSuccess([], request);
    const { data: allSkills } = await supabase.from('course_skills').select('course_id, skill_name').in('course_id', courseIds);
    const skillsByCourse: Record<string, string[]> = {};
    (allSkills || []).forEach((s: any) => { if (!skillsByCourse[s.course_id]) skillsByCourse[s.course_id] = []; skillsByCourse[s.course_id].push(s.skill_name); });
    const result = courses.map((c: any) => {
      const matchedSkill = skillMatches.find((s: any) => s.course_id === c.course_id);
      const courseSkills = skillsByCourse[c.course_id] || [];
      const exactMatch = courseSkills.some((s: string) => s.toLowerCase() === skillLower);
      const partialMatch = courseSkills.some((s: string) => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()));
      return { ...c, skills: courseSkills, match_type: 'direct', match_strength: exactMatch ? 1.0 : (partialMatch ? 0.8 : 0.6), matched_skill: matchedSkill?.skill_name, proficiency_level: matchedSkill?.proficiency_level };
    });
    return apiSuccess(result, request);
  }

  // GET /api/courses/embedding/check?courseId=
  if (path === '/embedding/check' && method === 'GET') {
    const courseId = url.searchParams.get('courseId');
    if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'courseId required', request);
    const { data } = await supabase.from('courses').select('embedding').eq('course_id', courseId).maybeSingle();
    return apiSuccess({ hasEmbedding: !!(data?.embedding) }, request);
  }

  // GET /api/courses/embedding/stats
  if (path === '/embedding/stats' && method === 'GET') {
    const { count: total, error: totalError } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'Active').is('deleted_at', null);
    const { count: withEmbedding } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'Active').is('deleted_at', null).not('embedding', 'is', null);
    if (totalError) return apiDbError(totalError, request);
    return apiSuccess({ total: total || 0, withEmbedding: withEmbedding || 0, withoutEmbedding: (total || 0) - (withEmbedding || 0) }, request);
  }

  // POST /api/courses/embedding/generate
  if (path === '/embedding/generate' && method === 'POST') {
    const { courseId, embeddingString } = await parseBody(request);
    if (!courseId || !embeddingString) return apiError(400, 'VALIDATION_ERROR', 'courseId and embeddingString required', request);
    const { error } = await supabase.from('courses').update({ embedding: embeddingString }).eq('course_id', courseId);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // ─── LESSON PLANS ─────────────────────────────────────────────────

  // DELETE /api/courses/lesson-plans/:id
  const lpMatch = path.match(/^\/lesson-plans\/(.+)$/);
  if (lpMatch && method === 'DELETE') {
    const { error } = await supabase.from('lesson_plans').delete().eq('id', lpMatch[1]);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // GET /api/courses/lesson-plans?teacherEmail=
  if (path === '/lesson-plans' && method === 'GET') {
    const teacherEmail = url.searchParams.get('teacherEmail');
    if (!teacherEmail) return apiError(400, 'VALIDATION_ERROR', 'teacherEmail required', request);
    const { data: teacher } = await supabase.from('school_educators').select('id').eq('email', teacherEmail).maybeSingle();
    if (!teacher) return apiSuccess([], request);
    const { data } = await supabase.from('lesson_plans').select('*').eq('teacher_id', teacher.id).order('date', { ascending: false });
    return apiSuccess(data || [], request);
  }

  // ─── COURSE EMBEDDING MANAGER: fetch course with skills ───────────

  // GET /api/courses/embed/course?courseId=
  if (path === '/embed/course' && method === 'GET') {
    const courseId = url.searchParams.get('courseId');
    if (!courseId) return apiError(400, 'VALIDATION_ERROR', 'courseId required', request);
    const { data: course } = await supabase.from('courses').select('course_id, title, description, target_outcomes, status').eq('course_id', courseId).maybeSingle();
    if (!course) return apiSuccess(null, request);
    const { data: skillsData } = await supabase.from('course_skills').select('skill_name').eq('course_id', courseId);
    return apiSuccess({ ...course, skills: (skillsData || []).map((s: any) => s.skill_name) }, request);
  }

  // GET /api/courses/embed/pending
  if (path === '/embed/pending' && method === 'GET') {
    const { data: courses } = await supabase.from('courses').select('course_id, title').eq('status', 'Active').is('embedding', null).is('deleted_at', null);
    return apiSuccess(courses || [], request);
  }

  // fallback: fetch courses by category for recommendationService
  // GET /api/courses/by-category?category=&skillType=
  if (path === '/by-category' && method === 'GET') {
    const category = url.searchParams.get('category');
    const skillType = url.searchParams.get('skillType');
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    let q = supabase.from('courses').select('course_id, title, code, description, duration, category, skill_type').eq('status', 'Active').is('deleted_at', null);
    if (skillType) q = q.eq('skill_type', skillType);
    if (category) q = q.eq('category', category);
    const { data } = await q.limit(limit);
    return apiSuccess((data || []).map((c: any) => ({ ...c, skills: [], relevance_score: 50, match_reasons: ['Recommended course'], skill_gaps_addressed: [] })), request);
  }

  // ─── COURSE COMPLETION ────────────────────────────────────────────

  // POST /api/courses/course-complete
  if (path === '/course-complete' && method === 'POST') {
    const { learnerId, courseId } = await parseBody(request);
    if (!learnerId || !courseId) return apiError(400, 'VALIDATION_ERROR', 'learnerId and courseId required', request);
    const { error } = await supabase.from('course_enrollments').update({
      status: 'completed', completed_at: new Date().toISOString(), progress: 100,
    }).eq('learner_id', learnerId).eq('course_id', courseId);
    if (error) return apiDbError(error, request);
    return apiSuccess({ success: true }, request);
  }

  // ─── SCHOOL EDUCATORS ─────────────────────────────────────────────

  // GET /api/courses/school-educators?schoolId=
  if (path === '/school-educators' && method === 'GET') {
    const schoolId = url.searchParams.get('schoolId');
    if (!schoolId) return apiError(400, 'VALIDATION_ERROR', 'schoolId required', request);
    const { data, error } = await supabase.from('school_educators').select('user_id, first_name, last_name, email').eq('school_id', schoolId).order('first_name', { ascending: true });
    if (error) return apiDbError(error, request);
    return apiSuccess(data || [], request);
  }

  return apiNotFound(`Unknown endpoint: ${method} ${path}`, request);
}

export const onRequest = withAuth(handler);
