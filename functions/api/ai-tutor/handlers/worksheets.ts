import { z } from 'zod';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { splitWorksheetContent, type WorksheetSeparationOptions } from '../utils/worksheet-content';

const uuid = z.string().uuid();
const bundleSchema = z.object({
  conversationId: uuid, messageId: uuid, groupId: uuid,
  title: z.string().trim().min(1).max(200), instructions: z.string().max(10000).default(''),
  dueAt: z.string().datetime().nullable().default(null), reviewed: z.literal(true),
});
export const publicationSchema = z.object({
  conversationId: uuid, messageId: uuid, groupId: uuid,
  title: z.string().trim().min(1).max(200), instructions: z.string().max(10000),
  dueAt: z.string().datetime().nullable(), reviewed: z.literal(true),
  variants: z.array(z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    learnerIds: z.array(uuid).min(1).max(500),
  })).min(1).max(3),
}).superRefine((data, ctx) => {
  const levels = data.variants.map(v => v.difficulty);
  const learners = data.variants.flatMap(v => v.learnerIds);
  if (new Set(levels).size !== levels.length || new Set(learners).size !== learners.length)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select each difficulty and learner only once.' });
});

export async function handleWorksheets(context: AuthenticatedContext) {
  const { request, env } = context;
  const user = getContextUser(context);
  const db = getServiceClient(env as unknown as PagesEnv);
  const fail = (status: number, message: string) => apiError(status, 'WORKSHEET_ERROR', message, request);
  try {
    const body = z.object({ action: z.string() }).passthrough().parse(await request.json());
    if (body.action === 'list' || body.action === 'open') {
      const courseId = uuid.parse(body.courseId);
      const { data: learner, error: learnerError } = await db.from('learners').select('id').eq('user_id', user.id).maybeSingle();
      if (learnerError) throw learnerError;
      if (!learner) return fail(403, 'Learner profile required.');
      if (body.action === 'list') {
        const page = z.number().int().min(0).max(10000).parse(body.page ?? 0);
        const { data: memberships, error: membershipError } = await db.from('organization_members').select('organization_id').eq('user_id', user.id).eq('status', 'active');
        if (membershipError) throw membershipError;
        const orgs = (memberships || []).map(m => m.organization_id);
        if (!orgs.length) return apiSuccess([], request);
        const { data, error } = await db.from('ai_worksheet_recipients')
          .select('id,assigned_at,opened_at,worksheet:ai_worksheet_sets!inner(id,title,difficulty,due_at,course_id,status,organization_id)')
          .eq('learner_id', learner.id).eq('worksheet.status', 'published').in('worksheet.organization_id', orgs)
          .eq('worksheet.course_id', courseId)
          .order('assigned_at', { ascending: false }).order('id').range(page * 25, page * 25 + 24);
        if (error) throw error;
        return apiSuccess(data || [], request);
      }
      const recipientId = uuid.parse(body.recipientId);
      const { data: row, error } = await db.from('ai_worksheet_recipients')
        .select('id,worksheet:ai_worksheet_sets!inner(id,title,difficulty,student_content,instructions,due_at,course_id,status,organization_id)')
        .eq('id', recipientId).eq('learner_id', learner.id).eq('worksheet.status', 'published').eq('worksheet.course_id', courseId).maybeSingle();
      if (error) throw error;
      if (!row) return fail(404, 'Assigned worksheet not found.');
      const worksheet = (row as unknown as { worksheet: { organization_id: string } }).worksheet;
      const { data: membership, error: membershipError } = await db.from('organization_members').select('id').eq('user_id', user.id).eq('organization_id', worksheet.organization_id).eq('status', 'active').maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return fail(403, 'Organization access has ended.');
      const { error: openedError } = await db.from('ai_worksheet_recipients').update({ opened_at: new Date().toISOString() }).eq('id', recipientId).is('opened_at', null);
      if (openedError) throw openedError;
      return apiSuccess(worksheet, request);
    }

    // Never trust caller-supplied educator roles or organization IDs.
    const { data: profile, error: profileError } = await db.from('users').select('role').eq('id', user.id).single();
    if (profileError) throw profileError;
    if (!['educator', 'school_educator', 'college_educator'].includes(profile.role)) return fail(403, 'Educator access required.');
    const { data: scope, error: scopeError } = await db.rpc('ai_worksheet_educator_scope', { p_user_id: user.id }).single();
    if (scopeError || !scope) return fail(403, 'Your active educator college or school profile could not be resolved. Contact your administrator.');
    if (body.action === 'context') {
      const { data, error } = await db.rpc('ai_worksheet_context', { p_user_id: user.id });
      if (error) throw error;
      return apiSuccess(data, request);
    }
    if (body.action === 'status') {
      const conversationId = uuid.parse(body.conversationId);
      const messageId = uuid.parse(body.messageId);
      const { data, error } = await db.from('ai_worksheet_sets')
        .select('id,published_at,recipients:ai_worksheet_recipients(count)')
        .eq('educator_user_id', user.id).eq('organization_id', scope.organization_id)
        .eq('source_conversation_id', conversationId).eq('source_message_id', messageId)
        .eq('status', 'published').order('published_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return apiSuccess({ published: !!data, learnerCount: data?.recipients?.[0]?.count ?? 0 }, request);
    }
    if (body.action === 'source' || body.action === 'publish' || body.action === 'publish-all') {
      const { data: conversation, error } = await db.from('tutor_conversations').select('messages,course_id').eq('id', uuid.parse(body.conversationId)).eq('learner_id', user.id).maybeSingle();
      if (error) throw error;
      const messages = (conversation?.messages || []) as Array<{ id: string; role: string; worksheetConfig?: WorksheetSeparationOptions; worksheetVariants?: Array<{ difficulty: string; content: string }> }>;
      const message = messages.find(m => m.id === body.messageId && m.role === 'assistant');
      if (!message?.worksheetVariants?.length) return fail(400, 'Regenerate this worksheet to enable difficulty-specific assignment.');
      let variants;
      try {
        variants = message.worksheetVariants.map(variant => ({ ...variant, ...splitWorksheetContent(variant.content, message.worksheetConfig) }));
      } catch (error) {
        if (body.action === 'source') return apiSuccess({
          variants: message.worksheetVariants,
          organization: { id: scope.organization_id, name: scope.organization_name },
          assignmentReady: false,
          readinessMessage: 'This older worksheet needs regeneration before publishing so learner questions and private answers can be separated. Your mapped learners are shown below.',
        }, request);
        return fail(409, error instanceof Error ? error.message : 'Regenerate the worksheet before assigning.');
      }
      if (body.action === 'source') return apiSuccess({ variants: variants.map(v => ({ difficulty: v.difficulty, content: v.studentContent })), organization: { id: scope.organization_id, name: scope.organization_name }, assignmentReady: true }, request);
      if (body.action === 'publish-all') {
        const input = bundleSchema.parse(body);
        const { data, error } = await db.rpc('publish_ai_worksheet_bundle', {
          p_user_id: user.id, p_conversation_id: input.conversationId, p_message_id: input.messageId,
          p_group_id: input.groupId, p_title: input.title, p_instructions: input.instructions, p_due_at: input.dueAt,
          p_variants: [...variants].sort((a, b) => ['beginner', 'intermediate', 'advanced'].indexOf(a.difficulty) - ['beginner', 'intermediate', 'advanced'].indexOf(b.difficulty))
            .map(v => ({ difficulty: v.difficulty, studentContent: v.studentContent, solutions: v.solutions })),
        });
        if (error) return fail(400, 'Unable to assign. Check that active learners are still mapped to your programs or classes.');
        return apiSuccess(data, request);
      }
      const input = publicationSchema.parse(body);
      const selectedVariants = input.variants.map(selection => {
        const generated = variants.find(v => v.difficulty === selection.difficulty);
        return generated ? { difficulty: generated.difficulty, studentContent: generated.studentContent, solutions: generated.solutions, learnerIds: selection.learnerIds } : null;
      });
      if (selectedVariants.some(v => !v)) return fail(400, 'Selected difficulty is not part of this generated worksheet.');
      const { data, error: publishError } = await db.rpc('publish_ai_worksheets', {
        p_user_id: user.id, p_organization_id: scope.organization_id, p_conversation_id: input.conversationId,
        p_message_id: input.messageId, p_group_id: input.groupId, p_title: input.title,
        p_instructions: input.instructions, p_due_at: input.dueAt, p_variants: selectedVariants,
      });
      if (publishError) return fail(400, 'Unable to publish. Verify selected learners are still mapped to your program or class.');
      return apiSuccess({ groupId: data }, request);
    }
    if (body.action === 'learners') {
      const page = z.number().int().min(0).max(10000).parse(body.page ?? 0);
      const search = z.string().max(100).parse(body.search ?? '').replace(/[%_\\]/g, '\\$&');
      let query = db.rpc('ai_worksheet_eligible_learners', { p_user_id: user.id })
        .order('name').order('id').range(page * 50, page * 50 + 49);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return apiSuccess((data || []).map(learner => ({ id: learner.id, name: learner.name, user_id: learner.user_id, school_class_id: learner.school_class_id, program_section_id: learner.program_section_id })), request);
    }
    return fail(400, 'Unknown worksheet action.');
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return fail(400, 'Invalid worksheet request. Check required fields and selections.');
    console.error('Worksheet request failed', error);
    return fail(500, 'Worksheet request failed. Please retry.');
  }
}
