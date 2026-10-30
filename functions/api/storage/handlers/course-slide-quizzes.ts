import { apiError } from '../../../lib/response';
import { checkCourseEnrollment } from '../utils/course-authorization';

async function questionVersion(questions: any[]): Promise<string> {
  const content = JSON.stringify(questions.map(q => ({ question: q.question, options: q.options })));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Read and save an enrolled learner's own ungraded slide responses. */
export async function handleCourseSlideQuizzes(context: any): Promise<Response> {
  const { request, user, supabaseAdmin } = context;
  if (!['GET', 'POST'].includes(request.method)) return apiError(405, 'ERROR', 'Method not allowed', request);
  const params = new URL(request.url).searchParams;
  const courseId = params.get('courseId');
  const lessonId = params.get('lessonId');
  const resourceId = params.get('resourceId');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (![courseId, lessonId, resourceId].every(value => value && uuid.test(value))) return apiError(400, 'VALIDATION_ERROR', 'Invalid course resource', request);
  const enrollment = await checkCourseEnrollment(supabaseAdmin, user.id, courseId!);
  if (!enrollment.authorized) return apiError(403, 'FORBIDDEN', 'Access denied', request);
  const { data: lesson, error: lessonError } = await supabaseAdmin.from('lessons').select('lesson_id, course_modules!inner(course_id)').eq('lesson_id', lessonId).eq('course_modules.course_id', courseId).maybeSingle();
  if (lessonError || !lesson) return apiError(403, 'FORBIDDEN', 'Lesson not found in this course', request);
  const { data: resource, error: resourceError } = await supabaseAdmin.from('lesson_resources').select('resource_id').eq('resource_id', resourceId).eq('lesson_id', lessonId).maybeSingle();
  if (resourceError || !resource) return apiError(403, 'FORBIDDEN', 'Resource not found in this lesson', request);
  const { data, error } = await supabaseAdmin.from('ppt_slide_quizzes').select('quiz_id, slide_number, questions').eq('resource_id', resourceId).order('slide_number');
  if (error) return apiError(500, 'INTERNAL_ERROR', 'Could not load slide questions', request);
  const quizzes = await Promise.all((data || []).map(async (quiz: any) => {
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    return { id: quiz.quiz_id, slideNumber: quiz.slide_number, version: await questionVersion(questions), questions: questions.map((q: any) => ({ question: q.question, options: q.options })) };
  }));
  if (request.method === 'POST') {
    let body: any;
    try { body = await request.json(); } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid answers', request); }
    const quiz = quizzes.find((item: any) => item.id === body?.quizId);
    if (!quiz || body.version !== quiz.version) return apiError(409, 'VALIDATION_ERROR', 'The slide questions changed. Reload and try again.', request);
    const answers = body.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers) || Object.entries(answers).some(([key, value]) => !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= quiz.questions.length || !Number.isInteger(value) || Number(value) < 0 || Number(value) >= quiz.questions[Number(key)].options.length)) return apiError(400, 'VALIDATION_ERROR', 'Invalid answers', request);
    const { error: saveError } = await supabaseAdmin.from('course_slide_quiz_responses').upsert({ quiz_id: quiz.id, user_id: user.id, question_version: quiz.version, answers, updated_at: new Date().toISOString() }, { onConflict: 'quiz_id,user_id' });
    if (saveError) return apiError(500, 'INTERNAL_ERROR', 'Could not save answers', request);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  }
  let saved: any[] = [];
  if (quizzes.length) {
    const result = await supabaseAdmin.from('course_slide_quiz_responses').select('quiz_id, question_version, answers').eq('user_id', user.id).in('quiz_id', quizzes.map((quiz: any) => quiz.id));
    if (result.error) return apiError(500, 'INTERNAL_ERROR', 'Could not load saved answers', request);
    saved = result.data || [];
  }
  return Response.json({ quizzes: quizzes.map((quiz: any) => ({ ...quiz, answers: saved.find(answer => answer.quiz_id === quiz.id && answer.question_version === quiz.version)?.answers || {} })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
