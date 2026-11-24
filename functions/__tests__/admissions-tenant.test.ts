// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ type: 'college', calls: [] as unknown[][], queue: vi.fn(), create: vi.fn(), batch: vi.fn() }));
vi.mock('../lib/auth', () => ({ withAuth: (fn: unknown) => fn, getContextUser: () => ({ id: 'member', roles: [`${f.type}_admin`], org_id: 'org' }) }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from(table: string) {
  class Query {
    select(...args: unknown[]) { f.calls.push([table, 'select', ...args]); return this; }
    eq(...args: unknown[]) { f.calls.push([table, 'eq', ...args]); return this; }
    async maybeSingle() { return { data: { id: 'org', organization_type: f.type }, error: null }; }
    then(resolve: (r: unknown) => unknown) {
      return Promise.resolve({ data: [{ id: 'class', grade: '1', section: 'A' }], error: null }).then(resolve);
    }
  }
  return new Query();
} }) }));
import { onRequestPost } from '../api/college-admin/admissions';
const post = (body: unknown) => onRequestPost({ env: { SSO_SERVICE: { queueBulkLearnerUpload: f.queue, createLearnerUser: f.create, getBulkUploadStatus: f.batch } }, request: new Request('https://app.test/api/college-admin/admissions', { method: 'POST', body: JSON.stringify(body) }) } as never);
beforeEach(() => { vi.clearAllMocks(); f.type = 'college'; f.calls = []; f.queue.mockResolvedValue({ success: true, batch_id: 'batch' }); });
it.each(['college', 'school'])('uses scoped %s class identifiers without faculty joins', async type => {
  f.type = type;
  expect((await post({ action: 'get-admission-classes' })).status).toBe(200);
  const table = `${type}_classes`;
  expect(f.calls).toContainEqual([table, 'eq', `${type}_id`, 'org']);
  expect(f.calls).toContainEqual([table, 'select', 'id, grade, section']);
  expect(f.calls).toContainEqual([table, 'eq', type === 'college' ? 'status' : 'account_status', 'active']);
});
it('rejects cross-tenant bulk and manual creation requests before any SSO mutation', async () => {
  expect((await post({ action: 'bulk-upload-csv', organization_id: 'other', csv_data: 'name,email' })).status).toBe(403);
  expect((await post({ action: 'create-application', organization_id: 'other', name: 'Learner', email: 'learner@example.test' })).status).toBe(403);
  expect(f.queue).not.toHaveBeenCalled(); expect(f.create).not.toHaveBeenCalled();
});
it('queues CSV under the verified tenant and actor', async () => {
  expect((await post({ action: 'bulk-upload-csv', organization_id: 'org', csv_data: 'name,email' })).status).toBe(200);
  expect(f.queue).toHaveBeenCalledWith({ organization_id: 'org', admin_id: 'member', csv_data: 'name,email' });
});
it.each(['bulk-upload-status', 'bulk-upload-errors'])('denies foreign tenant %s results', async action => {
  f.batch.mockResolvedValue({ organization_id: 'other' });
  expect((await post({ action, batch_id: 'foreign' })).status).toBe(403);
});
