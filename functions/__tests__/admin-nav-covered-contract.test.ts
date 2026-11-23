// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ entitlement: vi.fn(), tables: [] as string[] }));
vi.mock('../lib/auth', () => ({ withAuth: (fn: unknown) => fn, getContextUser: () => ({ id: 'admin', roles: ['college_admin'], org_id: 'org' }) }));
vi.mock('../shared/lib/org-subscription', () => ({ resolveUserEntitlement: f.entitlement }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from(table: string) {
  f.tables.push(table);
  class Query {
    select() { return this; }
    eq() { return this; }
    order() { return this; }
    async maybeSingle() { return { data: { id: 'org', organization_type: 'college' }, error: null }; }
    then(resolve: (r: unknown) => unknown) {
      return Promise.resolve({ data: [{ key: 'admissions_data', is_active: true }], error: null }).then(resolve);
    }
  }
  return new Query();
} }) }));
import { onRequestGet } from '../api/admin-nav-features';
const get = () => onRequestGet({ env: {}, request: new Request('https://app.test/api/admin-nav-features?role=college_admin') } as never);
beforeEach(() => { vi.clearAllMocks(); f.tables = []; });
it('uses the covered contract rather than independently selecting subscription history for navigation', async () => {
  f.entitlement.mockResolvedValue({ plan_code: 'hybrid', features: ['admissions_data'] });
  const response = await get();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: { isHybrid: true, organizationId: 'org', features: ['admissions_data'] } });
  expect(f.tables).not.toContain('subscription_cache');
});
it('does not advertise uncovered organization access', async () => {
  f.entitlement.mockResolvedValue(null);
  expect((await get()).status).toBe(403);
});
