// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock('../lib/supabase', () => ({ getServiceClient: io.db }));
import { onRequestPost } from '../api/promos/validate';
import { signupPromoValid } from '../lib/signup-promo';
const now = Date.parse('2026-11-25T00:00:00Z');
let campaign: any, overall: any, scoped: any, lookupError: any, calls: string[], mutations: string[];
function database() {
  return { from(table: string) {
    calls.push(table); let role: string | undefined;
    const chain: any = { select: () => chain, eq: (key: string, value: string) => { if (key === 'role') role = value; return chain; },
      maybeSingle: async () => ({ data: campaign, error: lookupError }), then: (resolve: any) => Promise.resolve(role ? scoped : overall).then(resolve),
      insert: () => mutations.push('insert'), update: () => mutations.push('update'), delete: () => mutations.push('delete') };
    return chain;
  } } as any;
}
const check = (role = 'learner') => signupPromoValid(database(), ' TEST ', role, now);
beforeEach(() => {
  vi.clearAllMocks(); calls = []; mutations = []; lookupError = null;
  campaign = { id: 'promo', active: true, starts_at: '2026-11-20T00:00:00Z', expires_at: '2026-12-25T00:00:00Z', overall_max_uses: 100, role_quotas: { learner: 40, school_admin: 30, college_admin: 30 } };
  overall = { count: 5, error: null }; scoped = { count: 2, error: null }; io.db.mockImplementation(database);
});
describe('read-only signup promo eligibility', () => {
  it.each(['learner', 'school_admin', 'college_admin'])('accepts valid %s campaign without consuming quota', async role => {
    expect(await check(role)).toBe(true); expect(mutations).toEqual([]);
  });
  it.each(['missing', 'paused', 'expired', 'future', 'expiry boundary', 'unsupported role', 'zero role quota', 'overall exhausted', 'role exhausted', 'missing role'])('rejects %s', async reason => {
    let role = 'learner';
    if (reason === 'missing') campaign = null;
    if (reason === 'paused') campaign.active = false;
    if (reason === 'expired') campaign.expires_at = '2026-11-24T00:00:00Z';
    if (reason === 'expiry boundary') campaign.expires_at = '2026-11-25T00:00:00Z';
    if (reason === 'future') campaign.starts_at = '2026-11-26T00:00:00Z';
    if (reason === 'unsupported role') role = 'recruiter';
    if (reason === 'zero role quota') campaign.role_quotas.learner = 0;
    if (reason === 'overall exhausted') overall.count = 100;
    if (reason === 'role exhausted') scoped.count = 40;
    if (reason === 'missing role') delete campaign.role_quotas.learner;
    expect(await check(role)).toBe(false); expect(mutations).toEqual([]);
  });
  it('distinguishes storage outages from invalid codes', async () => {
    lookupError = { message: 'db unavailable' }; await expect(check()).rejects.toBeTruthy();
    lookupError = null; scoped.error = { message: 'count unavailable' }; await expect(check()).rejects.toBeTruthy();
  });
});
describe('anonymous signup validation endpoint', () => {
  async function request(body: unknown, headers = { 'Content-Type': 'application/json' }) {
    return onRequestPost({ request: new Request('https://example.invalid/api/promos/validate', { method: 'POST', headers, body: JSON.stringify(body) }), env: {} } as any);
  }
  it('returns only validity, with no campaign, price or personal data', async () => {
    campaign.expires_at = '2099-01-01T00:00:00Z';
    const response = await request({ code: 'TEST', role: 'learner' });
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ valid: true });
    expect(response.headers.get('Cache-Control')).toBe('no-store'); expect(mutations).toEqual([]);
  });
  it('returns invalid for expired and unknown codes', async () => {
    campaign.expires_at = '2000-01-01T00:00:00Z'; expect(await (await request({ code: 'TEST', role: 'learner' })).json()).toEqual({ valid: false });
    campaign = null; expect(await (await request({ code: 'UNKNOWN', role: 'learner' })).json()).toEqual({ valid: false });
  });
  it.each([null, {}, { code: 123, role: 'learner' }, { code: 'x'.repeat(600), role: 'learner' }])('bounds invalid request %j', async body => {
    expect((await request(body)).status).toBe(400); expect(io.db).not.toHaveBeenCalled();
  });
  it('does not call storage for empty codes and returns 503 for storage errors', async () => {
    expect(await (await request({ code: '', role: 'learner' })).json()).toEqual({ valid: false }); expect(io.db).not.toHaveBeenCalled();
    lookupError = { message: 'private database details' }; const result = await request({ code: 'TEST', role: 'learner' });
    expect(result.status).toBe(503); expect(await result.text()).not.toContain('private database details');
  });
});
