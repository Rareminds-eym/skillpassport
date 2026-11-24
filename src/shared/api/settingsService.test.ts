// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiGet: mocks.get, apiPost: mocks.post }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ error: vi.fn() }) }));
import { getAvailableModules, getRolesWithPermissions, saveRolePermissions } from './settingsService';
beforeEach(() => vi.clearAllMocks());
describe('existing college role configuration', () => {
  it('retains stored role identity and converts module and scope records for the cards', async () => {
    mocks.get.mockResolvedValue({ data: { roles: [{ roleType: 'college_educator', moduleAccess: { Courses: ['view', 'edit'] }, scopeRules: { department: ['department-id'] } }] } });
    expect(await getRolesWithPermissions()).toEqual([{ id: 'college_educator', roleName: 'Faculty (College Educator)', moduleAccess: [{ module: 'Courses', permissions: ['view', 'edit'] }], scopeRules: [{ type: 'department', values: ['department-id'] }] }]);
  });
  it('does not turn failed role or catalog requests into zero-count configuration', async () => {
    mocks.get.mockRejectedValue(new Error('Service unavailable'));
    await expect(getRolesWithPermissions()).rejects.toThrow('Service unavailable');
    await expect(getAvailableModules()).rejects.toThrow('Service unavailable');
  });
  it('saves the role code and its permissions through the existing endpoint', async () => {
    mocks.post.mockResolvedValue({ data: { success: true } });
    expect(await saveRolePermissions('college_educator', [{ module: 'Courses', permissions: ['view'] }])).toBe(true);
    expect(mocks.post).toHaveBeenCalledWith('/settings/roles', { action: 'save', roleType: 'college_educator', modulePermissions: [{ module: 'Courses', permissions: ['view'] }], scopeRules: [] });
  });
  it('does not report a malformed save response as success', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    expect(await saveRolePermissions('college_educator', [])).toBe(false);
  });
});
