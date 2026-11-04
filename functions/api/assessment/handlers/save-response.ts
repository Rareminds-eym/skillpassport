import {getServiceClient} from '../../../lib/supabase';
import type {AuthenticatedPagesContext} from '../../../lib/types';

const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});

/** Ownership and terminal-state checks remain locked through the answer upsert. */
export async function saveResponseHandler(context: AuthenticatedPagesContext) {
  let body: Record<string, unknown>;
  try {
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > 262144) return json({error: 'Request too large'}, 413);
    body = JSON.parse(raw);
  } catch { return json({error: 'Invalid JSON'}, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some(key => !['attemptId', 'questionId', 'answer'].includes(key))
    || !uuid(body.attemptId) || !uuid(body.questionId) || body.answer === undefined || body.answer === null) {
    return json({error: 'Invalid response request'}, 400);
  }
  body.attemptId = body.attemptId.toLowerCase();
  body.questionId = body.questionId.toLowerCase();
  const owner = context.data.user.sub;
  if (!uuid(owner)) return json({error: 'Authentication required'}, 401);
  try {
    const {data, error} = await getServiceClient(context.env).rpc('save_owned_assessment_response', {
      p_owner: owner, p_attempt: body.attemptId, p_question: body.questionId, p_answer: body.answer,
    });
    if (error) {
      if (['22023', '22P02'].includes(error.code)) return json({error: 'Invalid response request'}, 400);
      if (error.code === 'P0001') return json({error: 'Assessment state changed'}, 409);
      if (error.code === '42501') return json({error: 'Response access denied'}, 403);
      return json({error: 'Response save unavailable'}, 503);
    }
    if (!data) return json({error: 'Assessment attempt not found'}, 404);
    if (Array.isArray(data) || typeof data !== 'object' || !uuid(data.id)
      || data.attempt_id !== body.attemptId || data.question_id !== body.questionId || data.is_correct !== null) {
      return json({error: 'Response confirmation unavailable'}, 503);
    }
    return json({success: true, response: data});
  } catch { return json({error: 'Response save unavailable'}, 503); }
}
