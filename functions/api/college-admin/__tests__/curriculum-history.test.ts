// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { onRequestPost } from '../curriculum-changes';
const mocks = vi.hoisted(() => ({ actor: { role: 'college_admin', isActive: true, organizationId: 'own-college' }, eq: vi.fn(), order: vi.fn() }));
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler, getContextUser: () => ({ id: 'admin' }) }));
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => ({ from: (table: string) => {
  const chain = { select: () => chain, eq: (...args: unknown[]) => { if (table === 'college_curriculums') mocks.eq(...args); return chain; }, maybeSingle: async () => ({ data: mocks.actor, error: null }), order: mocks.order };
  return chain;
} }) }));
vi.mock('../../../lib/entitlements', () => ({ hasFeatureEntitlement: async () => true }));
beforeEach(() => { vi.clearAllMocks(); mocks.actor = { role: 'college_admin', isActive: true, organizationId: 'own-college' }; mocks.order.mockResolvedValue({ data: [], error: null }); });
async function send() {
  return await onRequestPost({ request: new Request('https://example.test/api/college-admin/curriculum-changes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'get-all-curriculum-changes', faculty_history: true, college_id: 'other-college' }) }), env: {} } as never) as Response;
}
it('scopes faculty history to the authenticated administrators college', async () => {
  expect((await send()).status).toBe(200);
  expect(mocks.eq).toHaveBeenCalledWith('college_id', 'own-college');
  expect(mocks.eq).not.toHaveBeenCalledWith('college_id', 'other-college');
});
it('rejects educator access to the admin history view', async () => {
  mocks.actor.role = 'college_educator';
  expect((await send()).status).toBe(403);
  expect(mocks.order).not.toHaveBeenCalled();
});

it('does not grant an owner the college administrator history bypass', async () => {
  mocks.actor.role = 'owner';
  expect((await send()).status).toBe(403);
  expect(mocks.order).not.toHaveBeenCalled();
});
