import {getServiceClient} from './supabase';
import type {AuthenticatedPagesContext} from './types';
const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const object = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});

export async function finalizeAssessment(context: AuthenticatedPagesContext, action: 'submit' | 'results') {
  let body: Record<string, any>;
  try {
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > 262144) return json({error: 'Request too large'}, 413);
    body = JSON.parse(raw);
  } catch {return json({error: 'Invalid JSON'}, 400);}
  const allowed = action === 'submit' ? ['attemptId', 'answers'] : ['attemptId', 'learnerId', 'streamId', 'gradeLevel',
    'geminiResults', 'adaptiveAptitudeSessionId', 'sectionTimings'];
  if (!object(body) || Object.keys(body).some(key => !allowed.includes(key)) || !uuid(body.attemptId)) {
    return json({error: 'Invalid finalization request'}, 400);
  }
  if (action === 'submit' && body.answers !== undefined && !object(body.answers)) return json({error: 'Invalid answers'}, 400);
  if (action === 'results' && (!object(body.geminiResults) || !Object.keys(body.geminiResults).length
    || (body.learnerId !== undefined && !uuid(body.learnerId))
    || (body.adaptiveAptitudeSessionId != null && !uuid(body.adaptiveAptitudeSessionId))
    || (body.streamId !== undefined && body.streamId !== null && typeof body.streamId !== 'string')
    || (body.gradeLevel !== undefined && typeof body.gradeLevel !== 'string')
    || (body.sectionTimings != null && (!object(body.sectionTimings)
      || Object.values(body.sectionTimings).some(value => !Number.isInteger(value) || Number(value) < 0 || Number(value) > 2147483647))))) {
    return json({error: 'Invalid results'}, 400);
  }
  const owner = context.data.user.sub;
  if (!uuid(owner)) return json({error: 'Authentication required'}, 401);
  const attempt = body.attemptId.toLowerCase();
  const {attemptId: _attempt, ...payload} = body;
  if (payload.learnerId) payload.learnerId = payload.learnerId.toLowerCase();
  if (payload.adaptiveAptitudeSessionId) payload.adaptiveAptitudeSessionId = payload.adaptiveAptitudeSessionId.toLowerCase();
  // Legacy callers supply null when no new timings are available.
  if (payload.sectionTimings === null) delete payload.sectionTimings;
  try {
    const {data, error} = await getServiceClient(context.env).rpc('finalize_owned_assessment', {
      p_owner: owner, p_attempt: attempt, p_action: action, p_payload: payload,
    });
    if (error) {
      if (['22023', '22P02'].includes(error.code)) return json({error: 'Invalid finalization request'}, 400);
      if (error.code === '42501') return json({error: 'Finalization access denied'}, 403);
      if (error.code === 'P0001') return json({error: 'Assessment state changed'}, 409);
      return json({error: 'Finalization unavailable'}, 503);
    }
    if (!data) return json({error: 'Assessment attempt not found'}, 404);
    if (typeof data !== 'object' || Array.isArray(data) || data.attemptId !== attempt || !uuid(data.resultId)) {
      return json({error: 'Finalization confirmation unavailable'}, 503);
    }
    return json({success: true, data, message: action === 'submit' ? 'Assessment submitted successfully' : 'Assessment results saved successfully'});
  } catch {return json({error: 'Finalization unavailable'}, 503);}
}
