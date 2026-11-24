import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: f.fetch } }));
import { uploadFile } from '../storageApiService';
beforeEach(() => { vi.clearAllMocks(); });
it('sends a named resume in the actual authenticated multipart request without overriding its boundary', async () => {
  f.fetch.mockImplementation(async (_url: string, init: RequestInit) => {
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('filename')).toBe('synthetic-resume.pdf');
    expect(body.get('context')).toBe('resume');
    expect(body.get('file')).toMatchObject({ name: 'synthetic-resume.pdf', type: 'application/pdf' });
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
    return Response.json({ success: true, url: 'uploads/owner/resume.pdf' });
  });
  await expect(uploadFile(new File(['%PDF-1.4'], 'synthetic-resume.pdf', { type: 'application/pdf' }), { context: 'resume', filename: 'synthetic-resume.pdf' })).resolves.toMatchObject({ success: true });
  expect(f.fetch).toHaveBeenCalledTimes(1);
});
it('surfaces a rejected multipart upload rather than claiming success', async () => {
  f.fetch.mockResolvedValue(Response.json({ error: 'filename required' }, { status: 400 }));
  await expect(uploadFile(new File(['pdf'], 'resume.pdf'), { context: 'resume' })).rejects.toThrow('filename required');
});
