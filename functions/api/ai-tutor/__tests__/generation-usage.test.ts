import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet } from '../handlers/get-generation-usage';
import { getServiceClient } from '../../../lib/auth';
vi.mock('../../../lib/auth', () => ({ getServiceClient: vi.fn(), getContextUser: (context: any) => ({ id: context.data.user.sub, roles: context.data.user.roles ?? [] }) }));
const context = (query = '') => ({ request: new Request(`https://pages.test/api/ai-tutor/generation-usage${query}`), env: {}, data: { user: { sub: 'actor' } } }) as never;
function database(teacher = true, outage = false) {
  const rpc = vi.fn(async () => ({ data: outage ? null : { limit: 2, used: 1, remaining: 0 }, error: outage ? { code: 'outage' } : null }));
  return { rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { learner_type: teacher ? 'teacher' : 'learner' }, error: null }) }) }) }) };
}
describe('teacher generation usage projection', () => {
  beforeEach(() => vi.resetAllMocks());
  it('reports available capacity including pending claims for the authenticated actor', async () => {
    const db = database(); vi.mocked(getServiceClient).mockReturnValue(db as never);
    expect(await (await onRequestGet(context())).json()).toMatchObject({ data: { userId: 'actor', used: 1, remaining: 0, isTeacher: true } });
    expect(db.rpc).toHaveBeenCalledWith('get_tutor_generation_usage', { p_actor_id: 'actor' });
  });
  it('denies another user before reading allowance state', async () => {
    const db = database(); vi.mocked(getServiceClient).mockReturnValue(db as never);
    expect((await onRequestGet(context('?userId=other'))).status).toBe(403);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('preserves the non-teacher response without creating a claim', async () => {
    const db = database(false); vi.mocked(getServiceClient).mockReturnValue(db as never);
    expect(await (await onRequestGet(context())).json()).toMatchObject({ data: { limit: null, remaining: null, isTeacher: false } });
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it('reports outages instead of granting a fresh allowance', async () => {
    vi.mocked(getServiceClient).mockReturnValue(database(true, true) as never);
    expect((await onRequestGet(context())).status).toBe(503);
  });
});
