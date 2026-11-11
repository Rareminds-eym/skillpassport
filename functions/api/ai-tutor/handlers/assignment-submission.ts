import { z } from 'zod';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import type { PagesEnv } from '../../../lib/types';
import { apiError, apiSuccess } from '../../../lib/response';
import { submissionPath, SUBMISSION_MAX_BYTES, validateSubmissionDocument } from '../utils/assignment-document';
import { InvalidSubmissionDocument, validateAssignmentSubmission, type SubmissionAnswers, type SubmissionQuestion } from '../utils/submission-validation';
import { evaluateSavedSubmission } from '../utils/assignment-evaluation';
import { broadcastAssignmentNotifications } from '../utils/assignment-notifications';

type Context = { request: Request; env: PagesEnv; data?: Parameters<typeof getContextUser>[0]['data'] };
export async function handleAssignmentSubmission(context: Context) {
  const { request, env } = context;
  const user = getContextUser(context), db = getServiceClient(env);
  const fail = (status: number, message: string) => apiError(status, 'SUBMISSION_ERROR', message, request);
  if (env.AI_ASSIGNMENTS_ENABLED !== 'true' || !env.R2_BUCKET) return fail(503, 'Assignment storage is not configured');
  try {
    if (request.method === 'GET') {
      const id = z.string().uuid().parse(new URL(request.url).searchParams.get('submissionId'));
      const row = await db.from('ai_assignment_submissions').select('file_key,file_name,mime_type,recipient:ai_assignment_learners!inner(assigned_by,learner:learners!inner(user_id))').eq('id', id).single();
      const owner = row.data?.recipient as unknown as { assigned_by: string; learner: { user_id: string } } | undefined;
      if (row.error || !row.data || !owner || (owner.assigned_by !== user.id && owner.learner.user_id !== user.id)) return fail(403, 'Submission access denied');
      const object = await env.R2_BUCKET.get(row.data.file_key);
      if (!object) return fail(404, 'Document not found');
      const name = row.data.file_name.replace(/[\r\n"\\]/g, '_').replace(/[^\x20-\x7e]/g, '_');
      return new Response(object.body, { headers: { 'Content-Type': row.data.mime_type, 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    // formData buffers the body. Enforce a streaming cap first, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return fail(400, 'Document required');
    const pieces: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        size += next.value.length;
        if (size > SUBMISSION_MAX_BYTES + 65536) { await reader.cancel(); return fail(413, 'Submission exceeds the upload limit'); }
        pieces.push(next.value);
      }
    } finally { reader.releaseLock(); }
    const all = new Uint8Array(size); let offset = 0;
    for (const piece of pieces) { all.set(piece, offset); offset += piece.length; }
    const form = await new Response(all, { headers: { 'Content-Type': request.headers.get('Content-Type') || '' } }).formData();
    const id = z.string().uuid().parse(form.get('recipientId'));
    const file = form.get('file') as unknown as File | null;
    if (!(file instanceof File) || form.getAll('file').length !== 1) return fail(400, 'Select one completed document');
    const recipient = await db.from('ai_assignment_learners').select('id,assignment_id,due_at,learner:learners!inner(user_id),assignment:ai_assignments!inner(course_id,content)').eq('id', id).eq('learner.user_id', user.id).single();
    if (recipient.error || !recipient.data) return fail(403, 'Assigned learner access required');
    const existing = await db.from('ai_assignment_submissions').select('id').eq('assignment_learner_id', id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return apiSuccess({ submissionId: existing.data.id, alreadySubmitted: true }, request);
    if (Date.parse(recipient.data.due_at) < Date.now()) return fail(409, 'The submission deadline has passed');
    const bytes = new Uint8Array(await file.arrayBuffer());
    let type: { ext: string; mime: string };
    try { type = validateSubmissionDocument(file.name, file.type, bytes); } catch (error) { return fail(400, error instanceof Error ? error.message : 'Invalid document'); }
    let answers: SubmissionAnswers;
    try {
      answers = await validateAssignmentSubmission((recipient.data.assignment as unknown as {content:{questions:SubmissionQuestion[]}}).content.questions, file.name, bytes, env.OPENROUTER_API_KEY);
    } catch(error) {
      if(error instanceof InvalidSubmissionDocument)return apiError(422, 'INVALID_SUBMISSION_DOCUMENT', error.message, request);
      return fail(503, 'Unable to validate this document right now. Nothing was submitted. Please try again.');
    }
    const submissionId = crypto.randomUUID();
    const key = submissionPath((recipient.data.assignment as unknown as { course_id: string }).course_id, recipient.data.assignment_id, id, submissionId, type.ext);
    await env.R2_BUCKET.put(key, bytes, { httpMetadata: { contentType: type.mime, contentDisposition: 'attachment' } });
    const notificationStart = new Date().toISOString();
    const saved = await db.rpc('commit_ai_submission', { p_user: user.id, p_recipient: id, p_id: submissionId, p_key: key, p_name: file.name.slice(0,255), p_mime: type.mime });
    if (saved.error || saved.data !== submissionId) {
      // A lost RPC response may follow a successful commit. Verify before deleting the uploaded object.
      const duplicate = await db.from('ai_assignment_submissions').select('id,file_key').eq('assignment_learner_id', id).maybeSingle();
      if (duplicate.error) return fail(503, 'Unable to verify submission status. Refresh before retrying.');
      if (duplicate.data) {
        if (duplicate.data.file_key !== key) await env.R2_BUCKET.delete(key);
        return apiSuccess({ submissionId: duplicate.data.id, alreadySubmitted: true }, request);
      }
      // An explicit PostgreSQL error confirms rollback. Transport failures are ambiguous: preserve bytes.
      if (saved.error?.code && /^[0-9A-Z]{5}$/.test(saved.error.code) && !saved.error.code.startsWith('08')) await env.R2_BUCKET.delete(key);
      return fail(409, 'Submission was not confirmed. Refresh status and check the deadline before retrying.');
    }
    await broadcastAssignmentNotifications(db, env, 'submission_id', submissionId, notificationStart);
    // Evaluation failures never roll back the successfully submitted document.
    try { await evaluateSavedSubmission(db, submissionId, env.OPENROUTER_API_KEY, bytes, env.R2_BUCKET, answers); } catch { /* The saved pending result remains visible to the educator for retry. */ }
    await broadcastAssignmentNotifications(db, env, 'submission_id', submissionId, notificationStart);
    return apiSuccess({ submissionId, alreadySubmitted: false }, request);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof TypeError) return fail(400, 'Invalid submission request');
    return fail(503, 'Unable to complete the upload. Refresh assignment status before retrying.');
  }
}
