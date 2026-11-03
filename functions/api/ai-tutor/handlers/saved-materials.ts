import { z } from 'zod';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { requireCourseAccess } from '../utils/course-index';
import { splitWorksheetContent } from '../utils/worksheet-content';
import { materialRequestFingerprint, materialContextFingerprint } from '../utils/saved-materials';
import { structureSavedWorksheet } from '../utils/saved-assessment';
import { evaluateSavedSubmission } from '../utils/assignment-evaluation';

type Context = { request: Request; env: PagesEnv; data?: Parameters<typeof getContextUser>[0]['data'] };
const uuid = z.string().uuid();
export async function handleSavedMaterials(context: Context) {
  const { request, env } = context;
  const user = getContextUser(context), db = getServiceClient(env);
  const fail = (status: number, message: string) => apiError(status, 'MATERIAL_ERROR', message, request);
  try {
    const body = z.object({ action: z.string() }).passthrough().parse(await request.json());
    if (body.action === 'capabilities') return apiSuccess({ enabled: env.AI_ASSIGNMENTS_ENABLED === 'true' }, request);
    if (env.AI_ASSIGNMENTS_ENABLED !== 'true') return fail(503, 'Saved assignments are not enabled yet.');
    if (body.action === 'resolve-task') {
      const id = uuid.parse(body.allocationId);
      const { data: learner } = await db.from('learners').select('id').eq('user_id', user.id).maybeSingle();
      if (!learner) return fail(403, 'Learner profile required');
      const result = await db.from('ai_assignment_learners').select('id').eq('learner_id', learner.id).or(`school_allocation_id.eq.${id},college_allocation_id.eq.${id}`).maybeSingle();
      if (result.error) throw result.error;
      return apiSuccess(result.data, request);
    }
    const courseId = uuid.parse(body.courseId);
    const profile = await db.from('users').select('role').eq('id', user.id).single();
    const educator = !profile.error && ['educator','school_educator','college_educator'].includes(profile.data?.role);
    if (body.action === 'deliveries') {
      const query = db.from('ai_assignment_learners').select('id,assigned_by,learner_id,due_at,assigned_at,assignment:ai_assignments!inner(id,title,course_id,content),learner:learners!inner(id,user_id,name),submissions:ai_assignment_submissions(id,file_name,submitted_at,results:ai_assignment_results(id,status,total_marks,maximum_marks,feedback,question_results,released_at))').eq('assignment.course_id', courseId).order('assigned_at', { ascending: false }).limit(500);
      if (educator) query.eq('assigned_by', user.id); else query.eq('learner.user_id', user.id);
      const result = await query;
      if (result.error) throw result.error;
      const rows = result.data || [];
      if (!educator) for (const row of rows) for (const submission of row.submissions || []) submission.results = (submission.results || []).map((r: any) => r.status === 'released' ? r : { id: r.id, status: r.status });
      return apiSuccess(rows, request);
    }
    if (!educator || !await requireCourseAccess(db, user.id, courseId)) return fail(403, 'Educator course access required');
    if (body.action === 'library') {
      const table = body.kind === 'lesson_plan' ? 'ai_lesson_plans' : 'ai_assignments';
      const result = await db.from(table).select('id,title,content,generation_config,created_at').eq('course_id', courseId).order('created_at', { ascending: false }).limit(100);
      if (result.error) throw result.error;
      return apiSuccess(result.data || [], request);
    }
    if (body.action === 'allocate') {
      const id = uuid.parse(body.assignmentId), learners = z.array(uuid).min(1).max(500).parse(body.learnerIds), due = z.string().datetime().parse(body.dueAt);
      const material = await db.from('ai_assignments').select('id').eq('id', id).eq('course_id', courseId).single();
      if (material.error) return fail(404, 'Saved assignment not found');
      if (body.reviewed !== true) return fail(400, 'Review questions and grading rules before assigning');
      const result = await db.rpc('allocate_saved_ai_assignment', { p_user: user.id, p_assignment: id, p_learners: learners, p_due: due });
      if (result.error) return fail(409, 'Unable to assign. Verify mapped learners, deadline, and existing allocations.');
      return apiSuccess({ learnerCount: result.data }, request);
    }
    if (body.action === 'review-detail') {
      const result = await db.from('ai_assignments').select('id,content,grading_rules').eq('id', uuid.parse(body.assignmentId)).eq('course_id', courseId).single();
      if (result.error) return fail(404, 'Assignment not found');
      return apiSuccess(result.data, request);
    }
    if (body.action === 'retry' || body.action === 'release') {
      const resultId = uuid.parse(body.resultId);
      const owned = await db.from('ai_assignment_results').select('id,status,updated_at,submission_id,submission:ai_assignment_submissions!inner(recipient:ai_assignment_learners!inner(assigned_by,assignment:ai_assignments!inner(course_id)))').eq('id', resultId).eq('submission.recipient.assigned_by', user.id).eq('submission.recipient.assignment.course_id', courseId).single();
      if (owned.error) return fail(403, 'Assigned educator access required');
      if (body.action === 'retry') {
        if (owned.data.status === 'evaluating' && Date.parse(owned.data.updated_at) < Date.now() - 300000) await db.from('ai_assignment_results').update({ status: 'failed' }).eq('id', resultId).eq('updated_at', owned.data.updated_at);
        await evaluateSavedSubmission(db, owned.data.submission_id, env.OPENROUTER_API_KEY, undefined, env.AI_ASSIGNMENT_FILES);
      } else {
        const results = z.array(z.object({ questionId: uuid, marks: z.number().nonnegative().max(100), reason: z.string().trim().min(1).max(2000) })).min(1).max(90).parse(body.results);
        const released = await db.rpc('release_saved_ai_result', { p_user: user.id, p_result: resultId, p_results: results, p_feedback: z.string().max(10000).parse(body.feedback ?? '') });
        if (released.error) return fail(409, 'Review all question marks and reasons before releasing');
      }
      return apiSuccess({ success: true }, request);
    }
    const conversationId = uuid.parse(body.conversationId), messageId = uuid.parse(body.messageId);
    const conversation = await db.from('tutor_conversations').select('messages,course_id').eq('id', conversationId).eq('learner_id', user.id).eq('course_id', courseId).single();
    const messages = conversation.data?.messages || [];
    const index = messages.findIndex((m: any) => m.id === messageId && m.role === 'assistant');
    const message = messages[index];
    if (conversation.error || !message) return fail(404, 'Owned generated message required');
    const kind = message.worksheetVariants?.length ? 'assignment' : message.lessonPlanConfig ? 'lesson_plan' : null;
    if (!kind) return fail(400, 'Only generated assignments or lesson plans can be saved');
    if (body.action === 'choice') return apiSuccess(message.materialChoice || { state: 'unanswered' }, request);
    if (body.action === 'defer') {
      if (message.materialChoice?.id) return apiSuccess(message.materialChoice, request);
      const saved = await db.rpc('set_ai_material_choice', { p_user: user.id, p_conversation: conversationId, p_message: messageId, p_choice: { state: 'deferred' } });
      if (saved.error || !saved.data) throw new Error('Choice not saved');
      return apiSuccess({ state: 'deferred' }, request);
    }
    if (body.action !== 'save') return fail(400, 'Unknown material action');
    if (message.materialChoice?.id) return apiSuccess(message.materialChoice, request);
    const config = message.worksheetConfig || message.lessonPlanConfig || {};
    const prior = [...messages.slice(0, index)].reverse().find((m: any) => m.role === 'user')?.content || '';
    const fingerprint = message.materialRequestFingerprint || await materialRequestFingerprint(prior, config, null);
    const contextHash = message.materialContextFingerprint || await materialContextFingerprint(db, courseId);
    const table = kind === 'assignment' ? 'ai_assignments' : 'ai_lesson_plans';
    let existing = await db.from(table).select('id').eq('course_id', courseId).eq('request_fingerprint', fingerprint).eq('context_fingerprint', contextHash).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      const data: Record<string, unknown> = { course_id: courseId, title: String(message.content).replace(/<!--[^]*?-->|[#*]/g, '').trim().split('\n')[0].slice(0,200) || 'Saved material', generation_config: config, request_fingerprint: fingerprint, context_fingerprint: contextHash };
      if (kind === 'assignment') {
        const variants = message.worksheetVariants.map((v: any) => ({ difficulty: v.difficulty, ...splitWorksheetContent(v.content, config) }));
        const structured = await structureSavedWorksheet(variants, config, env.OPENROUTER_API_KEY);
        data.content = { questions: structured.questions }; data.grading_rules = structured.rules;
      } else data.content = { markdown: message.content };
      const inserted = await db.from(table).insert(data).select('id').single();
      if (inserted.error?.code === '23505') existing = await db.from(table).select('id').eq('course_id', courseId).eq('request_fingerprint', fingerprint).eq('context_fingerprint', contextHash).single();
      else existing = inserted;
      if (existing.error || !existing.data) throw new Error('Material save failed');
    }
    const choice = { state: 'saved', kind, id: existing.data.id };
    const saved = await db.rpc('set_ai_material_choice', { p_user: user.id, p_conversation: conversationId, p_message: messageId, p_choice: choice });
    if (saved.error || !saved.data) throw new Error('Material saved; refresh and retry to link the message');
    return apiSuccess(choice, request);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail(400, 'Invalid material request');
    return fail(503, 'Unable to complete this operation. Verify migration, model and storage configuration, then retry.');
  }
}
