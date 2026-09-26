// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { checkHybridFeatureAccess } from '../lib/hybrid-features';
import { requireAdminRequestFeature, resolveAdminFeaturePolicy } from '../lib/admin-feature-request';
import { syncAllFeatureKeysCache } from '../lib/sync-shadow';

function database(options: { type?: string; status?: string; features?: string[]; rows?: any[]; errorTable?: string; catalog?: any[]; memberships?: any[] } = {}) {
  const type = options.type || 'college';
  const rows = options.rows || [{ id: 'sub-new', organization_id: 'org-1', is_organization_subscription: true,
    plan_code: 'hybrid', status: options.status || 'active', features: options.features || [],
    subscription_start_date: '2026-01-01', synced_at: '2026-09-01' }];
  const tables: Record<string, any[]> = {
    organizations: [{ id: 'org-1', organization_type: type, admin_id: 'owner' }],
    organization_members: options.memberships || [{ user_id: 'member-admin', organization_id: 'org-1', status: 'active' }],
    subscription_cache: rows,
    feature_keys_cache: options.catalog || ['circulars', 'departments', 'user_management', 'library_assets', 'courses', 'finance', 'library', 'exam_management'].map(key => ({
      key, role: `${type}_admin`, product_code: 'skillpassport', is_active: true,
    })),
  };
  return { from(table: string) {
    let predicates: ((r: any) => boolean)[] = []; let orders: any[] = []; let maximum = Infinity;
    const result = () => {
      let data = (tables[table] || []).filter(r => predicates.every(p => p(r)));
      data.sort((a, b) => {
        for (const [key, opts] of orders) {
          if (a[key] === b[key]) continue;
          if (a[key] == null) return opts.nullsFirst ? -1 : 1;
          if (b[key] == null) return opts.nullsFirst ? 1 : -1;
          return String(a[key]).localeCompare(String(b[key])) * (opts.ascending ? 1 : -1);
        }
        return 0;
      });
      return { data: data.slice(0, maximum), error: table === options.errorTable ? { message: 'database unavailable' } : null };
    };
    const q: any = {
      select: () => q,
      eq: (key: string, value: any) => { predicates.push(r => r[key] === value); return q; },
      neq: (key: string, value: any) => { predicates.push(r => r[key] !== value); return q; },
      in: (key: string, values: any[]) => { predicates.push(r => values.includes(r[key])); return q; },
      or: () => { predicates.push(r => !r.subscription_start_date || new Date(r.subscription_start_date) <= new Date()); return q; },
      order: (key: string, opts: any) => { orders.push([key, opts]); return q; },
      limit: (n: number) => { maximum = n; return q; },
      maybeSingle: async () => { const r = result(); return { ...r, data: r.data[0] || null }; },
      then: (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject),
    };
    return q;
  } } as any;
}

const request = (path: string, action: string, extra = {}) => new Request(`https://example.test/api/${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }),
});
const admin = { sub: 'member-admin', roles: ['college_admin'], org_id: 'org-1' };

describe('Hybrid organization grants', () => {
  it('resolves member admins even when they are not organizations.admin_id', async () => {
    expect(await checkHybridFeatureAccess(database(), 'member-admin', 'college', 'circulars')).toMatchObject({ allowed: false });
  });
  it('accepts verified org scope for users with multiple memberships', async () => {
    expect(await checkHybridFeatureAccess(database({ features: ['circulars'] }), 'member-admin', 'college', 'circulars', 'org-1')).toEqual({ allowed: true, reason: undefined });
  });
  it.each(['active', 'paused', 'cancelled', 'grace_period', 'expired'])('keeps restrictions for %s contracts', async status => {
    expect(await checkHybridFeatureAccess(database({ status }), 'owner', 'college', 'circulars', 'org-1')).toMatchObject({ allowed: false });
  });
  it.each(['organizations', 'organization_members', 'subscription_cache', 'feature_keys_cache'])('fails closed on %s errors', async errorTable => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await checkHybridFeatureAccess(database({ errorTable }), 'member-admin', 'college', 'circulars')).toMatchObject({ allowed: false, unavailable: true });
    vi.restoreAllMocks();
  });
  it('selects the effective contract rather than the most recently synced row', async () => {
    const rows = [
      { id: 'old', organization_id: 'org-1', is_organization_subscription: true, plan_code: 'starter', status: 'active', subscription_start_date: '2025-01-01', synced_at: '2026-10-01' },
      { id: 'new', organization_id: 'org-1', is_organization_subscription: true, plan_code: 'hybrid', status: 'active', subscription_start_date: '2026-01-01', synced_at: '2026-01-01', features: [] },
    ];
    expect(await checkHybridFeatureAccess(database({ rows }), 'owner', 'college', 'circulars', 'org-1')).toMatchObject({ allowed: false });
    rows[0].plan_code = 'hybrid'; rows[1].plan_code = 'starter';
    expect(await checkHybridFeatureAccess(database({ rows }), 'owner', 'college', 'circulars', 'org-1')).toEqual({ allowed: true });
  });
  it('does not enforce explicitly retired features', async () => {
    const catalog = [{ key: 'circulars', role: 'college_admin', product_code: 'skillpassport', is_active: false }];
    expect(await checkHybridFeatureAccess(database({ catalog }), 'owner', 'college', 'circulars', 'org-1')).toMatchObject({ allowed: true });
  });
  it('rejects missing catalogs and ignores keys belonging to another product', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const catalog = [{ key: 'circulars', role: 'college_admin', product_code: 'lte', is_active: false }];
    expect(await checkHybridFeatureAccess(database({ catalog }), 'owner', 'college', 'circulars', 'org-1')).toMatchObject({ allowed: false, unavailable: true });
    vi.restoreAllMocks();
  });
  it('preserves no-subscription access after successful organization lookup', async () => {
    expect(await checkHybridFeatureAccess(database({ rows: [] }), 'owner', 'college', 'circulars', 'org-1')).toEqual({ allowed: true });
  });
});

describe('request boundary', () => {
  it.each(['get-circulars', 'get-circular-by-id', 'create-circular', 'update-circular', 'delete-circular', 'toggle-circular-status'])('protects %s before dispatch', async action => {
    const denied = await requireAdminRequestFeature(database(), request('college-admin/college-circulars', action), admin);
    expect(denied?.status).toBe(403);
  });
  it('allows a granted mutation and leaves the request body readable by the handler', async () => {
    const req = request('college-admin/college-circulars', 'create-circular');
    expect(await requireAdminRequestFeature(database({ features: ['circulars'] }), req, admin)).toBeNull();
    expect((await req.json()).action).toBe('create-circular');
  });
  it('protects GET aliases and generic writes', async () => {
    expect((await requireAdminRequestFeature(database(), new Request('https://example.test/api/college-admin/alias?action=get-assessments'), admin))?.status).toBe(403);
    expect((await requireAdminRequestFeature(database(), request('college-admin/alias', 'delete-table', { table: 'college_circulars' }), admin))?.status).toBe(403);
  });
  it('does not let generic queries modify entitlements or embed restricted tables', async () => {
    const db = database({ features: ['library'] });
    expect((await requireAdminRequestFeature(db, request('college-admin/alias', 'update-table', { table: 'subscription_cache' }), admin))?.status).toBe(403);
    expect((await requireAdminRequestFeature(db, request('college-admin/alias', 'query-table', { table: 'library_books', select_columns: '*,exams:assessments(*)' }), admin))?.status).toBe(403);
  });
  it('protects school and university operations', async () => {
    for (const [type, path, action] of [['school', 'school-admin/actions', 'deleteLibraryBook'], ['university', 'university-admin/actions', 'upsert-course']]) {
      const denied = await requireAdminRequestFeature(database({ type }), request(path, action), { ...admin, roles: [`${type}_admin`] });
      expect(denied?.status).toBe(403);
    }
  });
  it('allows department choices for User Management without allowing department edits', async () => {
    const db = database({ features: ['user_management'] });
    expect(await requireAdminRequestFeature(db, request('college-admin/academic', 'get-departments'), admin)).toBeNull();
    expect((await requireAdminRequestFeature(db, request('college-admin/academic', 'update-department'), admin))?.status).toBe(403);
  });
  it('denies unknown operations on Hybrid and preserves unrelated routes', async () => {
    expect((await requireAdminRequestFeature(database(), request('college-admin/future', 'new-operation'), admin))?.status).toBe(403);
    expect(resolveAdminFeaturePolicy('/api/payments/get-active-subscription', undefined, {}, 'college')).toBeNull();
  });
});

describe('catalog synchronization', () => {
  it('sends empty snapshots to the atomic refresh operation to retire the previous catalog', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await syncAllFeatureKeysCache({ rpc } as any, []);
    expect(rpc).toHaveBeenCalledWith('refresh_feature_keys_cache', { catalog: [] });
  });
  it('propagates refresh failures rather than reporting successful reconciliation', async () => {
    await expect(syncAllFeatureKeysCache({ rpc: vi.fn().mockResolvedValue({ error: { message: 'failed' } }) } as any, [])).rejects.toThrow('failed');
  });
});
