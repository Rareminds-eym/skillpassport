import { useEffect, useRef, useState } from 'react';
import { ssoClient } from '@/shared/api/ssoClient';
import { apiPost } from '@/shared/api/apiClient';
import { uploadFile } from '@/shared/api/storageApiService';
import { OpportunityDialog } from './OpportunityDialog';

type Resume = { key: string; url: string; filename: string; size: number };
type ApiResult<T> = { data?: T; error?: { message?: string } };
type Review = { title: string; submit: () => Promise<boolean>; resolve: (result: boolean) => void };

/** Shared review for the Opportunities and Saved Jobs application entrypoints. */
export function useResumeApplicationReview(learnerId?: string) {
  const [review, setReview] = useState<Review | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ key: string; url: string } | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const generation = useRef(0);
  const active = useRef<Review | null>(null);
  const close = () => {
    generation.current++;
    active.current?.resolve(false);
    active.current = null;
    setReview(null);
    setBusy(false);
  };
  useEffect(() => {
    // Identity changes must remove the prior account's visible attachment as well
    // as invalidate pending reads and submission callbacks.
    setReview(null);
    setResume(null);
    setError('');
    setBusy(false);
    return () => {
      generation.current++;
      active.current?.resolve(false);
      active.current = null;
    };
  }, [learnerId]);

  useEffect(() => {
    setPreview(null);
    setPreviewError('');
    if (!resume || !review) return;
    const controller = new AbortController();
    let disposed = false;
    let objectUrl: string | undefined;
    void (async () => {
      try {
        const response = await ssoClient.fetch(resume.url, { signal: controller.signal });
        if (!response.ok) throw new Error('Resume preview could not be loaded. Please retry.');
        const blob = await response.blob();
        if (disposed) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ key: resume.key, url: objectUrl });
      } catch (failure) {
        if (!disposed) setPreviewError(failure instanceof Error ? failure.message : 'Resume preview could not be loaded.');
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resume, review, learnerId, previewAttempt]);

  const requestReview = (opportunity: { job_title?: string; title?: string }, submit: () => Promise<boolean>) => new Promise<boolean>(resolve => {
    active.current?.resolve(false);
    const next = { title: opportunity.job_title || opportunity.title || 'Job application', submit, resolve };
    active.current = next;
    const ticket = ++generation.current;
    setReview(next);
    setResume(null);
    setError('');
    setBusy(true);
    apiPost<ApiResult<{ resume: Resume | null; validationMessage?: string }>>('/opportunities', { action: 'get-application-resume', learner_id: learnerId })
      .then(result => {
        if (ticket !== generation.current) return;
        if (result.error || !result.data) throw new Error(result.error?.message || 'Resume could not be loaded.');
        setResume(result.data.resume);
        setError(result.data.validationMessage || '');
      })
      .catch(err => { if (ticket === generation.current) setError(err instanceof Error ? err.message : 'Resume could not be loaded.'); })
      .finally(() => { if (ticket === generation.current) setBusy(false); });
  });

  const replaceResume = async (file?: File) => {
    if (!file) return;
    const ticket = ++generation.current;
    // Clear the prior selection so an invalid replacement cannot submit it silently.
    setResume(null);
    if (!/\.(pdf|docx)$/i.test(file.name) || file.size < 1 || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF or DOCX resume up to 5 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadFile(file, { context: 'resume', filename: file.name });
      if (ticket !== generation.current) return;
      const result = await apiPost<ApiResult<{ resume: Resume }>>('/opportunities', {
        action: 'set-application-resume', learner_id: learnerId, resume_url: uploaded.url,
      });
      if (ticket !== generation.current) return;
      if (result.error || !result.data?.resume) throw new Error(result.error?.message || 'Resume could not be attached.');
      setResume(result.data.resume);
    } catch (err) {
      if (ticket === generation.current) setError(err instanceof Error ? err.message : 'Resume upload failed.');
    } finally { if (ticket === generation.current) setBusy(false); }
  };

  const submit = async () => {
    if (!resume || busy || !review || active.current !== review) return;
    const ticket = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const result = await review.submit();
      if (ticket !== generation.current) return;
      if (result) {
        review.resolve(true);
        active.current = null;
        setReview(null);
      } else setError('Application was not submitted. Check the reported error and try again.');
    } catch (err) {
      if (ticket === generation.current) setError(err instanceof Error ? err.message : 'Application could not be submitted.');
    } finally { if (ticket === generation.current) setBusy(false); }
  };

  const resumeReview = <OpportunityDialog open={Boolean(review) && active.current === review} onOpenChange={(open: boolean) => { if (!open && !busy) close(); }}
    variant="confirmation" title="Review your application" description={review?.title}
    footer={<button type="button" disabled={!resume || busy} onClick={submit} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Please wait…' : 'Submit Application'}</button>}>
    <div className="space-y-4">
      <label htmlFor="application-resume" className="block font-medium">Resume <span className="text-red-600">* Required</span></label>
      {resume && <div className="break-all"><p>{resume.filename}</p>
        {preview?.key === resume.key && <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Preview resume</a>}
        {!preview && !previewError && <p role="status">Loading preview…</p>}
        {previewError && <div><p role="alert">{previewError}</p><button type="button" onClick={() => setPreviewAttempt(value => value + 1)}>Retry preview</button></div>}
      </div>}
      <input id="application-resume" type="file" accept=".pdf,.docx" disabled={busy} aria-required="true" aria-invalid={Boolean(error)} aria-describedby="resume-validation" onChange={event => { void replaceResume(event.target.files?.[0]); event.target.value = ''; }} className="block w-full rounded-md border border-slate-300 p-2" />
      <p className="text-sm text-slate-600">{resume ? 'Choose another file to replace this resume.' : 'Upload a resume to continue.'} PDF or DOCX, up to 5 MB.</p>
      <p id="resume-validation" role={error ? 'alert' : undefined} className="text-sm text-red-700">{error}</p>
    </div>
  </OpportunityDialog>;
  return { requestReview, resumeReview };
}
