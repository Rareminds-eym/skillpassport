import type { PagesEnv } from './types';
import { R2Client } from '../api/storage/utils/r2-client';
import { validateUploadOwnership } from '../api/storage/utils/ownership';
import { getFileSizeLimit } from '../api/storage/config/fileSizeLimits';

export class ApplicationResumeError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

/** Validate the actual owned object, never fetch a caller-controlled remote URL. */
export async function validateApplicationResume(env: PagesEnv, userId: string, value: unknown, requestUrl: string) {
  if (typeof value !== 'string' || !value.trim())
    throw new ApplicationResumeError(400, 'RESUME_REQUIRED', 'Attach a PDF or DOCX resume before submitting your application.');
  const key = R2Client.extractKeyFromUrl(value);
  if (!key || !key.startsWith(`uploads/${userId}/`) || !validateUploadOwnership(key, userId).isOwner || key.split('/').some(part => part === '..' || part === '.'))
    throw new ApplicationResumeError(400, 'INVALID_RESUME', 'Choose a resume uploaded by your account.');
  const extension = key.split('.').pop()?.toLowerCase();
  const mime = extension === 'pdf' ? 'application/pdf' : extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : null;
  if (!mime) throw new ApplicationResumeError(400, 'INVALID_RESUME', 'Resume must be a PDF or DOCX file.');
  if (!env.R2_BUCKET) throw new ApplicationResumeError(503, 'RESUME_UNAVAILABLE', 'Resume storage is unavailable. Please retry.');
  let object;
  try { object = await env.R2_BUCKET.head(key); }
  catch { throw new ApplicationResumeError(503, 'RESUME_UNAVAILABLE', 'Your resume could not be verified. Please retry.'); }
  if (!object || object.size < 1 || object.size > getFileSizeLimit('resume').maxSize || object.httpMetadata?.contentType !== mime)
    throw new ApplicationResumeError(400, 'INVALID_RESUME', 'Choose an existing PDF or DOCX resume up to 5 MB.');
  // Always build the preview from the verified key, not the supplied URL host.
  const url = new URL('/api/storage/document-access', requestUrl);
  url.searchParams.set('key', key);
  url.searchParams.set('mode', 'inline');
  return { key, url: url.href, filename: key.split('/').pop()!, size: object.size };
}
