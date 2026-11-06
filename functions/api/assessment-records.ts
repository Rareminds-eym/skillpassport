import {withAuth} from '../lib/auth';
import {getServiceClient} from '../lib/supabase';
import type {AuthenticatedPagesContext} from '../lib/types';
import {sanitizeLearnerQuestions} from '../lib/assessment-question-safety';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 200;
const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: {'Cache-Control': 'no-store'},
});

/** Owner-only reads. Client IDs narrow this scope; they never establish ownership. */
export const onRequestGet = withAuth(async (context: AuthenticatedPagesContext) => {
  const params = new URL(context.request.url).searchParams;
  const mode = params.get('mode');
  const allowed = new Set(['mode', 'reference', 'attemptId', 'cursor']);
  if ([...params.keys()].some(key => !allowed.has(key) || params.getAll(key).length !== 1)
    || !['history', 'attempt', 'responses', 'latest', 'latest-date', 'in-progress'].includes(mode ?? '')) {
    return json({error: 'Invalid assessment query'}, 400);
  }
  const attemptId = params.get('attemptId');
  const cursor = params.get('cursor');
  const reference = params.get('reference');
  const needsAttempt = mode === 'attempt' || mode === 'responses';
  if ((needsAttempt && (!attemptId || !UUID.test(attemptId)))
    || (!needsAttempt && attemptId !== null)
    || (reference !== null && !UUID.test(reference))
    || (cursor !== null && (!UUID.test(cursor) || !['history', 'responses'].includes(mode!)))) {
    return json({error: 'Invalid assessment query'}, 400);
  }
  const owner = context.data.user.sub;
  if (!owner) return json({error: 'Authentication required'}, 401);

  try {
    const db = getServiceClient(context.env);
    const {data: learner, error: learnerError} = await db.from('learners')
      .select('id,user_id').eq('user_id', owner).maybeSingle();
    if (learnerError) return json({error: 'Assessment owner lookup failed'}, 500);
    if (!learner) return json({error: 'Learner profile not found'}, 404);
    if (reference !== null && reference !== learner.id && reference !== owner) {
      return json({error: 'Assessment reference is not yours'}, 403);
    }

    if (mode === 'in-progress') {
      const {data: attempt, error} = await db.from('personal_assessment_attempts').select('*')
        .eq('learner_id', learner.id).eq('status', 'in_progress')
        .order('created_at', {ascending: false}).order('id', {ascending: false}).limit(1).maybeSingle();
      if (error) return json({error: 'Assessment resume lookup failed'}, 500);
      if (attempt?.adaptive_aptitude_session_id) {
        const {data: session, error: sessionError} = await db.from('adaptive_aptitude_sessions')
          .select('questions_answered,current_question_index,status,current_phase')
          .eq('id', attempt.adaptive_aptitude_session_id).eq('learner_id', learner.id).maybeSingle();
        if (sessionError) return json({error: 'Adaptive resume lookup failed'}, 500);
        if (!session) return json({error: 'Adaptive session ownership mismatch'}, 409);
        attempt.adaptiveProgress = {questionsAnswered: session.questions_answered ?? 0,
          currentQuestionIndex: session.current_question_index ?? 0, status: session.status, currentPhase: session.current_phase};
      }
      return json({data: attempt});
    }
    if (mode === 'history') {
      let query = db.from('personal_assessment_attempts').select('*')
        .eq('learner_id', learner.id).order('id').limit(PAGE_SIZE + 1);
      if (cursor) query = query.gt('id', cursor);
      const {data, error} = await query;
      if (error) return json({error: 'Assessment history lookup failed'}, 500);
      const rows = data ?? [];
      return json({data: rows.slice(0, PAGE_SIZE),
        nextCursor: rows.length > PAGE_SIZE ? rows[PAGE_SIZE - 1].id : null});
    }

    if (needsAttempt) {
      const {data: attempt, error} = await db.from('personal_assessment_attempts')
        .select('*').eq('id', attemptId!).eq('learner_id', learner.id).maybeSingle();
      if (error) return json({error: 'Assessment lookup failed'}, 500);
      // Same response for an absent attempt and someone else's attempt.
      if (!attempt) return json({error: 'Assessment attempt not found'}, 404);
      if (mode === 'responses') {
        let query = db.from('personal_assessment_responses')
          .select('*,question:personal_assessment_questions(*)')
          .eq('attempt_id', attempt.id).order('id').limit(PAGE_SIZE + 1);
        if (cursor) query = query.gt('id', cursor);
        const {data, error: responseError} = await query;
        if (responseError) return json({error: 'Assessment responses lookup failed'}, 500);
        const rows = data ?? [];
        return json({data: rows.slice(0, PAGE_SIZE).map(row => ({...row, ...(row.question ? {question: sanitizeLearnerQuestions(row.question)} : {})})),
          nextCursor: rows.length > PAGE_SIZE ? rows[PAGE_SIZE - 1].id : null});
      }
      // Check both ownership columns rather than trusting only the result's FK.
      const {data: results, error: resultError} = await db.from('personal_assessment_results')
        .select('*').eq('attempt_id', attempt.id).eq('learner_id', learner.id);
      if (resultError) return json({error: 'Assessment results lookup failed'}, 500);
      return json({data: {...attempt, results: results ?? []}});
    }

    const {data: result, error: resultError} = await db.from('personal_assessment_results')
      .select(mode === 'latest-date' ? 'created_at' : '*')
      .eq('learner_id', learner.id).eq('status', 'completed')
      .order('created_at', {ascending: false}).order('id', {ascending: false})
      .limit(1).maybeSingle();
    if (resultError) return json({error: 'Assessment results lookup failed'}, 500);
    if (mode === 'latest' && result?.adaptive_aptitude_session_id && result.gemini_results) {
      const {data: adaptive, error: adaptiveError} = await db.from('adaptive_aptitude_results')
        .select('*').eq('session_id', result.adaptive_aptitude_session_id)
        .eq('learner_id', learner.id).maybeSingle();
      if (adaptiveError) return json({error: 'Adaptive results lookup failed'}, 500);
      if (adaptive) result.gemini_results = {...result.gemini_results, adaptiveAptitudeResults: adaptive};
    }
    return json({data: result});
  } catch {
    return json({error: 'Assessment records unavailable'}, 500);
  }
});
