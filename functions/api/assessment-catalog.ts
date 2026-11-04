import { withAuth } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import { sanitizeLearnerQuestions } from '../lib/assessment-question-safety';
import type { AuthenticatedPagesContext } from '../lib/types';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
/** Active attempt delivery snapshots objective keys before returning keyless
 * questions. Preview delivery has no grading authority. */
export const onRequestGet = withAuth(async (context: AuthenticatedPagesContext) => {
  const params = new URL(context.request.url).searchParams;
  const section = params.get('sectionId'); const attempt = params.get('attemptId'); const stream = params.get('streamId');
  if ([...params.keys()].some(key => !['sectionId', 'attemptId', 'streamId'].includes(key) || params.getAll(key).length !== 1)
    || !section || !uuid.test(section) || (attempt !== null && !uuid.test(attempt)) || (stream !== null && (stream.length > 100 || !stream))) {
    return json({ error: 'Invalid assessment catalog query' }, 400);
  }
  const owner = context.data.user.sub;
  if (typeof owner !== 'string' || !uuid.test(owner)) return json({ error: 'Authentication required' }, 401);
  try {
    const db = getServiceClient(context.env);
    if (attempt) {
      const result = await db.rpc('snapshot_owned_assessment_catalog', { p_owner: owner, p_attempt: attempt.toLowerCase(), p_section: section.toLowerCase() });
      if (result.error) return json({ error: 'Question delivery unavailable' }, result.error.code === 'P0001' ? 409 : 503);
      if (!result.data) return json({ error: 'Assessment questions not found' }, 404);
      if (!Array.isArray(result.data.questions)) return json({ error: 'Question delivery confirmation unavailable' }, 503);
      return json({ questions: sanitizeLearnerQuestions(result.data.questions) });
    }
    let query = db.from('personal_assessment_questions').select('*').eq('section_id', section.toLowerCase()).eq('is_active', true).order('order_number');
    query = stream ? query.eq('stream_id', stream) : query.is('stream_id', null);
    const result = await query;
    if (result.error || !Array.isArray(result.data)) return json({ error: 'Question preview unavailable' }, 503);
    return json({ questions: sanitizeLearnerQuestions(result.data) });
  } catch { return json({ error: 'Question delivery unavailable' }, 503); }
});
