import { withAuth } from '../lib/auth';
import { getServiceClient } from '../lib/supabase';
import type { AuthenticatedPagesContext } from '../lib/types';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const fields = new Set(['rawGrade', 'grade', 'programName', 'programCode', 'degreeLevel', 'selectedStream', 'selectedCategory', 'learnerType', 'specialization']);
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
/** Self-described report context only. This capability cannot write scores,
 * achievements, identity, ownership, result status or adaptive links. */
export const onRequestPost = withAuth(async (context: AuthenticatedPagesContext) => {
  let body: Record<string, any>;
  try {
    const raw = await context.request.text();
    if (new TextEncoder().encode(raw).byteLength > 16384) return json({ error: 'Request too large' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['attemptId', 'context'].includes(key))
    || !uuid(body.attemptId) || !body.context || typeof body.context !== 'object' || Array.isArray(body.context)
    || typeof body.context.rawGrade !== 'string' || !body.context.rawGrade.trim()
    || Object.entries(body.context).some(([key, value]) => !fields.has(key) || (value !== null && (typeof value !== 'string' || value.length > 300)))) {
    return json({ error: 'Invalid assessment context' }, 400);
  }
  const owner = context.data.user.sub;
  if (!uuid(owner)) return json({ error: 'Authentication required' }, 401);
  const attemptId = body.attemptId.toLowerCase();
  try {
    const result = await getServiceClient(context.env).rpc('patch_owned_assessment_context', {
      p_owner: owner, p_attempt: attemptId, p_context: body.context,
    });
    if (result.error) return json({ error: 'Assessment context unavailable' }, result.error.code === '22023' ? 400 : result.error.code === 'P0001' ? 409 : 503);
    if (!result.data) return json({ error: 'Assessment attempt not found' }, 404);
    if (result.data.attemptId !== attemptId) return json({ error: 'Assessment context confirmation unavailable' }, 503);
    return json({ success: true, attemptId });
  } catch { return json({ error: 'Assessment context unavailable' }, 503); }
});
