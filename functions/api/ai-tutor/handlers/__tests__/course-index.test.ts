// @vitest-environment node
import { it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../../../lib/auth', () => ({ getContextUser: () => ({ id: 'user' }), getServiceClient: () => mocks }));
import { handleCourseIndex } from '../course-index';
it('returns 403 for unauthorized status requests without listing index records', async () => {
  mocks.rpc.mockResolvedValue({ data: false });
  const response = await handleCourseIndex({ env: {}, request: new Request('https://test/course-index', { method: 'POST', body: JSON.stringify({ action: 'status', courseId: '00000000-0000-4000-8000-000000000001' }) }) } as never);
  expect(response.status).toBe(403);
});
