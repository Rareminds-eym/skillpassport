import {getServiceClient} from './supabase';
import type {AuthenticatedPagesContext} from './types';

const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const object = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fields: Record<string, string> = {
  sectionIndex: 'current_section_index', questionIndex: 'current_question_index',
  timerRemaining: 'timer_remaining', elapsedTime: 'elapsed_time', aptitudeQuestionTimer: 'aptitude_question_timer',
  sectionTimings: 'section_timings', allResponses: 'all_responses', answers: 'all_responses',
  adaptiveAptitudeSessionId: 'adaptive_aptitude_session_id',
};
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});

/** Only the verified subject is forwarded as owner; no request owner/target override. */
export async function handleAssessmentProgress(context: AuthenticatedPagesContext, forced?: 'progress' | 'abandon', format: 'progress' | 'adaptive-link' = 'progress') {
  let body: Record<string, any>;
  try {
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > 262144) return json({error: 'Request too large'}, 413);
    body = JSON.parse(raw);
  } catch { return json({error: 'Invalid JSON'}, 400); }
  if (format === 'adaptive-link') {
    if (!object(body) || Object.keys(body).some(key => !['attemptId', 'sessionId'].includes(key)) || !uuid(body.sessionId)) {
      return json({error: 'Invalid adaptive link request'}, 400);
    }
    body = {attemptId: body.attemptId, adaptiveAptitudeSessionId: body.sessionId};
  }
  if (!object(body) || Object.keys(body).some(key => !['attemptId', 'action', ...Object.keys(fields)].includes(key))) {
    return json({error: 'Unsupported progress fields'}, 400);
  }
  const action = forced ?? body.action ?? 'progress';
  if (!uuid(body.attemptId) || !['progress', 'abandon'].includes(action)
    || (forced && body.action !== undefined && forced !== body.action)
    || (body.answers !== undefined && body.allResponses !== undefined && body.allResponses !== null)) return json({error: 'Invalid progress request'}, 400);
  body.attemptId = body.attemptId.toLowerCase();
  const patch: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(fields)) {
    const value = body[key];
    if (value === undefined) continue;
    if (action === 'abandon') return json({error: 'Abandon does not accept progress'}, 400);
    // Legacy callers use null for these optional fields to mean "not supplied".
    // Timer nulls remain explicit resets; actual response maps still require objects.
    if (value === null && ['elapsedTime', 'allResponses'].includes(key)) continue;
    if (['sectionTimings', 'allResponses', 'answers'].includes(key)) {
      if (!object(value)) return json({error: 'Progress maps must be objects'}, 400);
      if (key === 'sectionTimings' && Object.values(value).some(v => !Number.isInteger(v) || Number(v) < 0 || Number(v) > 2147483647)) {
        return json({error: 'Invalid section timings'}, 400);
      }
    } else if (key === 'adaptiveAptitudeSessionId') {
      if (!uuid(value)) return json({error: 'Invalid adaptive session'}, 400);
    } else if (!(value === null && ['timerRemaining', 'aptitudeQuestionTimer'].includes(key))
      && (!Number.isInteger(value) || value < 0 || value > 2147483647)) return json({error: 'Invalid progress number'}, 400);
    patch[column] = key === 'adaptiveAptitudeSessionId' ? value.toLowerCase() : value;
  }
  const owner = context.data.user.sub;
  if (!uuid(owner)) return json({error: 'Authentication required'}, 401);
  try {
    const {data, error} = await getServiceClient(context.env).rpc('patch_owned_assessment_progress', {
      p_owner: owner, p_attempt: body.attemptId, p_action: action, p_patch: patch,
    });
    if (error) {
      if (error.code === '22023' || error.code === '22P02') return json({error: 'Invalid progress request'}, 400);
      if (error.code === '42501') return json({error: 'Progress access denied'}, 403);
      if (error.code === 'P0001') return json({error: 'Assessment state changed'}, 409);
      return json({error: 'Progress save unavailable'}, 503);
    }
    if (!data) return json({error: 'Assessment attempt not found'}, 404);
    if (Array.isArray(data) || typeof data !== 'object' || data.id !== body.attemptId) {
      return json({error: 'Progress confirmation unavailable'}, 503);
    }
    return json({success: true, attempt: data});
  } catch { return json({error: 'Progress save unavailable'}, 503); }
}
