// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
const fetchMock = vi.hoisted(() => vi.fn());
vi.mock('./ssoClient', () => ({ ssoClient: { fetch: fetchMock } }));
import { apiPost, ApiError } from './apiClient';
afterEach(() => fetchMock.mockReset());
it.each([
  [{ error: { code: 'PROFILE_UNAVAILABLE', message: 'Profile service is unavailable' } }, 'Profile service is unavailable'],
  [{ error: 'Unable to save profile' }, 'Unable to save profile'],
  [{ error: { message: { nested: 'invalid' } } }, 'Request failed'],
  [{ error: {} }, 'Request failed'],
])('shows a readable signup API error for %j', async (body, message) => {
  fetchMock.mockResolvedValueOnce(Response.json(body, { status: 503 }));
  const error = await apiPost('/user/signup', { userId: 'saved-account' }).catch(error => error);
  expect(error).toBeInstanceOf(ApiError); expect(error.message).toBe(message); expect(error.message).not.toContain('[object Object]');
  expect(error.status).toBe(503); expect(fetchMock).toHaveBeenCalledOnce();
});
it('preserves the server error code for recovery', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ error: { code: 'PROFILE_UNAVAILABLE', message: 'Try again' } }, { status: 503 }));
  await expect(apiPost('/user/signup', {})).rejects.toMatchObject({ code: 'PROFILE_UNAVAILABLE', status: 503, message: 'Try again' });
});
it('returns an idempotent successful profile response unchanged', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ success: true, data: { id: 'saved-account' } }));
  await expect(apiPost('/user/signup', { userId: 'saved-account' })).resolves.toEqual({ success: true, data: { id: 'saved-account' } });
});
