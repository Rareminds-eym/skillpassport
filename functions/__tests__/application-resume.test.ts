// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { validateApplicationResume } from '../lib/application-resume';
const head = vi.fn();
const env = { R2_BUCKET: { head } } as never;
const validate = (url: unknown) => validateApplicationResume(env, 'owner', url, 'https://app.test/api/opportunities');
beforeEach(() => { head.mockReset().mockResolvedValue({ size: 100, httpMetadata: { contentType: 'application/pdf' } }); });
it('requires a resume and rejects foreign ownership before accessing storage', async () => {
  await expect(validate(null)).rejects.toMatchObject({ code: 'RESUME_REQUIRED' });
  await expect(validate('uploads/foreign/resume.pdf')).rejects.toMatchObject({ code: 'INVALID_RESUME' });
  expect(head).not.toHaveBeenCalled();
});
it('verifies the stored PDF and generates a preview without trusting the submitted host', async () => {
  expect(await validate('https://untrusted.test/uploads/owner/resume.pdf')).toMatchObject({ key: 'uploads/owner/resume.pdf', url: 'https://app.test/api/storage/document-access?key=uploads%2Fowner%2Fresume.pdf&mode=inline' });
  expect(head).toHaveBeenCalledWith('uploads/owner/resume.pdf');
});
it('accepts a valid owned DOCX', async () => {
  head.mockResolvedValue({ size: 5 * 1024 * 1024, httpMetadata: { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
  expect(await validate('uploads/owner/resume.docx')).toMatchObject({ filename: 'resume.docx' });
});
it.each([null, { size: 0 }, { size: 5 * 1024 * 1024 + 1 }, { size: 100, httpMetadata: { contentType: 'image/jpeg' } }])('rejects missing, empty, oversized or invalid stored objects', async object => {
  head.mockResolvedValue(object);
  await expect(validate('uploads/owner/resume.pdf')).rejects.toMatchObject({ code: 'INVALID_RESUME' });
});
it('rejects unsupported extensions and reports storage failure', async () => {
  await expect(validate('uploads/owner/resume.exe')).rejects.toMatchObject({ code: 'INVALID_RESUME' });
  head.mockRejectedValue(new Error('Offline'));
  await expect(validate('uploads/owner/resume.pdf')).rejects.toMatchObject({ status: 503 });
});
