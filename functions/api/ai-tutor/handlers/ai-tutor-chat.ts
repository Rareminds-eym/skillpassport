/**
 * AI Tutor Chat Handler — RPC cutover (learner + educator generation).
 *
 * Cut over 2026-09-12: learner chat streaming replaced by
 * `seniorEducator({ feature: 'tutor-chat' })`; educator worksheet/lesson-plan
 * generation replaced by `seniorEducator({ feature: 'generate-material' })`.
 * Every pre/post step preserved exactly (auth, learner_type override,
 * generation limit, educator block, course context, phase, history tail,
 * persistence, title generation). Single deliberate difference per path:
 * reasoning executes in ai-worker instead of direct provider calls.
 */

import { apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import type { WorksheetConfig } from '../types/worksheet';
import type { LessonPlanConfig } from '../types/lesson-plan';
import {
  buildCourseContext,
} from '../utils/course-context';
import { claimTutorGeneration, completeTutorGeneration } from '../utils/generation-claim';
import { createLogger } from '../../../lib/logger';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import { buildTutorChatPrompt } from '../prompts/tutor-chat';
import { buildMaterialPrompts } from '../prompts/material';
import type { EducatorRequest, OrchestratorRequest, TutorCourseContext } from '@rareminds-eym/ai-protocol';
import { videoIdentityHash } from '../../course/utils/video-job';
import { loadEnrolledCourse, resolveCourseLesson } from '../../internal/lesson-evidence';
import { loadAuthoringCourse } from '../../internal/authoring-course-evidence';
import { OrchestratorEventSchema, WorksheetConfigSchema, LessonPlanConfigSchema } from '@rareminds-eym/ai-protocol';
import { readBoundedWorkerText } from '../../ai/lib/orchestrator-result';

type EducatorMaterialRpcRequest = Extract<EducatorRequest, { feature: 'generate-material' }>;

const logger = createLogger('ai-tutor-chat');

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
type TypedContext = Parameters<typeof getContextUser>[0] & { request: Request; env: RequiredEnv & PagesEnv };
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  requestHash?: string;
}
interface AiTutorChatRequest {
  turnId?: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  message?: string;
  worksheetConfig?: WorksheetConfig;
  lessonPlanConfig?: LessonPlanConfig;
}

export interface TutorChatPorts {
  supabase?: ReturnType<typeof getServiceClient>;
  buildCourseContext?: typeof buildCourseContext;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    conversationId: string;
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    course: TutorCourseContext;
    userRole: string;
  }) => Promise<Response>;
  callMaterialWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    conversationId: string;
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    course: TutorCourseContext;
    userRole: string;
    messageCount: number;
    worksheetConfig?: WorksheetConfig;
    lessonPlanConfig?: LessonPlanConfig;
  }) => Promise<Response>;
}

export const handleAiTutorChat = async (context: TypedContext, ports?: TutorChatPorts) => {
  const { request, env } = context;
  const user = getContextUser(context);
  const p = ports ?? {};

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }
  const learnerId = user.id;
  const supabase = p.supabase ?? getServiceClient(env);

  let body: AiTutorChatRequest;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }
  if (!body || typeof body !== 'object') {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid request body', request);
  }
  const { conversationId, courseId, lessonId, message, worksheetConfig, lessonPlanConfig } = body;
  if (body.turnId !== undefined && (typeof body.turnId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.turnId))) return apiError(400, 'VALIDATION_ERROR', 'Invalid turnId', request);
  const turnId = body.turnId ?? crypto.randomUUID();
  if (!courseId || typeof courseId !== 'string' || courseId.length > 128 || !message || typeof message !== 'string' || !message.trim() || (lessonId !== undefined && (typeof lessonId !== 'string' || lessonId.length > 128))) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: courseId and message', request);
  }
  if (worksheetConfig !== undefined && !WorksheetConfigSchema.safeParse(worksheetConfig).success ||
      lessonPlanConfig !== undefined && !LessonPlanConfigSchema.safeParse(lessonPlanConfig).success) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid material generation configuration', request);
  }

  // Fetch existing messages if conversation exists — preserved
  let currentConversationId = conversationId;
  let existingMessages: StoredMessage[] = [];
  const requestHash = await videoIdentityHash({ courseId, lessonId: lessonId ?? null, message,
    worksheetConfig: worksheetConfig ?? null, lessonPlanConfig: lessonPlanConfig ?? null });
  if (conversationId || body.turnId) {
    const { data: conversation, error: conversationError } = await supabase
      .from('tutor_conversations')
      .select('id, course_id, lesson_id, messages')
      .eq('id', conversationId ?? turnId)
      .eq('learner_id', learnerId)
      .maybeSingle();
    if (conversationError) return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'Conversation lookup is unavailable', request);
    if (conversation) {
      if (conversation.course_id !== undefined && (conversation.course_id !== courseId || (conversation.lesson_id ?? null) !== (lessonId ?? null))) {
        return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Conversation resource scope changed', request);
      }
      currentConversationId = conversationId ?? turnId;
      existingMessages = (conversation as { messages?: StoredMessage[] }).messages || [];
      const previousIndex = existingMessages.findIndex(item => item.id === turnId && item.role === 'user');
      if (previousIndex >= 0) {
        const previous = existingMessages[previousIndex]!;
        if (previous.requestHash !== requestHash) return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Turn payload changed or its original identity is unavailable', request);
        const answer = existingMessages[previousIndex + 1];
        if (!answer || answer.role !== 'assistant' || !answer.content) return apiError(409, 'AI_REQUEST_IN_PROGRESS', 'This turn requires reconciliation', request);
        // Replays still require current course/lesson authority; they never call a model.
        const course = await loadEnrolledCourse(supabase, learnerId, courseId) ?? await loadAuthoringCourse(supabase, learnerId, courseId);
        if (!course || lessonId && !await resolveCourseLesson(supabase, courseId, lessonId)) return apiError(403, 'FORBIDDEN', 'Course access is required', request);
        const generationUsage = worksheetConfig || lessonPlanConfig
          ? await completeTutorGeneration(supabase, learnerId, turnId, requestHash) : undefined;
        return new Response(`event: token\ndata: ${JSON.stringify({ content: answer.content })}\n\nevent: done\ndata: ${JSON.stringify({ conversationId: currentConversationId, messageId: answer.id, generationUsage })}\n\n`,
          { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' } });
      }
    } else if (conversationId) {
      return apiError(404, 'NOT_FOUND', 'Conversation not found', request);
    }
  }
  const isGenerationRequest = Boolean(worksheetConfig || lessonPlanConfig);
  let userRole = (user.roles && user.roles[0]) || 'learner';
  const { data: learnerData } = await supabase
    .from('learners')
    .select('learner_type')
    .eq('user_id', learnerId)
    .maybeSingle();
  const isTeacherLearner = (learnerData as { learner_type?: string } | null)?.learner_type === 'teacher';
  if (userRole === 'learner') {
    if (isTeacherLearner) {
      userRole = 'educator';
      logger.info('User role override: learner_type="teacher" → treating as educator');
    }
  }
  let generationUsage: { limit: number; used: number; remaining: number } | undefined;
  if (isTeacherLearner && isGenerationRequest) {
    try {
      const course = await loadAuthoringCourse(supabase, learnerId, courseId);
      if (!course || lessonId && !await resolveCourseLesson(supabase, courseId, lessonId)) return apiError(403, 'FORBIDDEN', 'Course authoring access is required', request);
      generationUsage = await claimTutorGeneration(supabase, learnerId, turnId, requestHash);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DEPENDENCY_UNAVAILABLE: Generation allowance unavailable';
      return apiError(message.startsWith('FORBIDDEN:') ? 403 : rpcErrorToHttpStatus(error), message.split(':')[0]!, message.slice(0, 300), request);
    }
  }
  if (userRole.toLowerCase().includes('educator')) {
    if (!worksheetConfig && !lessonPlanConfig) {
      logger.warn('Blocked: Educator attempted to use chat without worksheet/lesson plan config');
      return apiError(403, 'FORBIDDEN', 'Chat functionality is not available for educators. Please use the worksheet or lesson plan generation feature.', request);
    }
    logger.info('Educator request validated', {
      hasWorksheetConfig: !!worksheetConfig,
      hasLessonPlanConfig: !!lessonPlanConfig
    });
  }

  // Educator generation path — cut over to worker (single/two-pass owned by ai-worker)
  const isEducatorGeneration = userRole.toLowerCase().includes('educator') && isGenerationRequest;
  if (isEducatorGeneration) {
    return handleEducatorMaterialRpc({
      supabase,
      env,
      request,
      learnerId,
      turnId,
      requestHash,
      currentConversationId,
      existingMessages,
      courseId,
      lessonId,
      message,
      worksheetConfig,
      lessonPlanConfig,
      userRole,
      isTeacherLearner,
      isGenerationRequest,
      generationUsage,
      ports: p,
    });
  }

  // Learner chat — cut over to worker
  const courseContextBuilder = p.buildCourseContext ?? buildCourseContext;
  let courseContext: Awaited<ReturnType<typeof buildCourseContext>>;
  try {
    courseContext = await courseContextBuilder(supabase as never, courseId, lessonId || null, learnerId);
  } catch (e) {
    return apiError(404, 'NOT_FOUND', e instanceof Error ? e.message : 'Course not found', request);
  }

  const userMessageId = turnId;
  const userMessage: StoredMessage = {
    id: userMessageId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
    requestHash,
  };
  const recentMessages = existingMessages.slice(-6);
  const historyForWorker = recentMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Worker streaming — single deliberate difference
  let workerResponse: Response;
  try {
    workerResponse = p.callWorker
      ? await p.callWorker({
          env: env as unknown as Record<string, unknown>,
          userId: learnerId,
          conversationId: currentConversationId || turnId,
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
        })
      : await callTutorChatWorker(env as unknown as Record<string, string>, learnerId, {
          operationId: turnId,
          courseId,
          ...(lessonId ? { lessonId } : {}),
          conversationId: currentConversationId || turnId,
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
        });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('binding is not configured') || msg.includes('AI_ASSERT_SECRET')) {
      logger.error('Worker wiring error', err instanceof Error ? err : new Error(msg));
      return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'AI service not configured', request);
    }
    const status = rpcErrorToHttpStatus(err);
    return apiError(status, (msg.split(':')[0] || 'INTERNAL_ERROR'), msg.slice(0, 500), request);
  }

  // If worker returned an error JSON (bounded? but tutor-chat is streaming — should be Response)
  if (!workerResponse.body || workerResponse.headers.get('content-type')?.includes('application/json')) {
    // Try to parse as AiResult failure (e.g., FEATURE_ACCESS_DENIED)
    try {
      const json = await workerResponse.clone().json() as { ok?: boolean; error?: { code?: string; message?: string } };
      if (json && json.ok === false && json.error) {
        const status = rpcErrorToHttpStatus(new Error(`${json.error.code}: ${json.error.message}`));
        return apiError(status, json.error.code || 'INTERNAL_ERROR', json.error.message || 'Generation failed', request);
      }
    } catch {}
  }

  const encoder = new TextEncoder();
  let fullResponse = '';
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const text = await readBoundedWorkerText(workerResponse, 120000);
        let completed = false;
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.replace('data: ', '').trim();
          if (!data) continue;
          let event: { type?: string; text?: string; question?: string; outcome?: string; error?: { code?: string; message?: string } };
          try {
            event = OrchestratorEventSchema.parse(JSON.parse(data));
          } catch {
            throw new Error('INVALID_MODEL_OUTPUT: Malformed tutor event');
          }
          if (completed) throw new Error('Unexpected event after tutor completion');
          if (event.type === 'delta' && typeof event.text === 'string' && event.text) {
            fullResponse += event.text;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: event.text })}\n\n`));
          } else if (event.type === 'clarification' && typeof event.question === 'string') {
            fullResponse += event.question;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: event.question })}\n\n`));
          } else if (event.type === 'completed') {
            completed = event.outcome === 'answered' || event.outcome === 'clarify';
          } else if (event.type === 'failed' || event.type === 'partial' || event.type === 'unsupported') {
            const msg = event.error?.message || 'Generation failed';
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
            return;
          }
        }
        if (!completed || !fullResponse.trim()) throw new Error('Tutor response did not complete');

        // Persistence — preserved exactly
        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: StoredMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString()
        };
        const updatedMessages = [...existingMessages, userMessage, assistantMessage];
        if (currentConversationId) {
          const { error: updateError } = await supabase.rpc('append_tutor_messages', {
            p_conversation_id: currentConversationId,
            p_learner_id: learnerId,
            p_new_messages: [userMessage, assistantMessage]
          });
          if (updateError) {
            throw new Error('DEPENDENCY_UNAVAILABLE: Conversation save could not be confirmed. Do not regenerate this turn.');
          } else {
            logger.info('Updated conversation', { conversationId: currentConversationId });
          }
        } else {
          const title = message.slice(0, 50);
          const { data: newConv, error: insertError } = await supabase
            .from('tutor_conversations')
            .insert({
              id: turnId,
              learner_id: learnerId,
              course_id: courseId,
              lesson_id: lessonId || null,
              title: title.slice(0, 255),
              messages: updatedMessages
            })
            .select('id')
            .single();
          if (insertError || !newConv) throw new Error('DEPENDENCY_UNAVAILABLE: Conversation save could not be confirmed. Do not regenerate this turn.');
          if (newConv) {
            currentConversationId = (newConv as { id: string }).id;
            logger.info('Created new conversation', { conversationId: currentConversationId });
          }
        }
        if (isTeacherLearner && isGenerationRequest) {
          try {
            generationUsage = await completeTutorGeneration(supabase, learnerId, turnId, requestHash);
            if (!generationUsage) throw new Error('DEPENDENCY_UNAVAILABLE: Generation receipt is missing');
            logger.info('Generation count incremented', { used: (generationUsage as { used: number }).used });
          } catch (err) {
            throw new Error('DEPENDENCY_UNAVAILABLE: Generation receipt could not be confirmed. Retry the same turn.');
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
          conversationId: currentConversationId,
          messageId: assistantMessage.id,
          generationUsage
        })}\n\n`));
        logger.info('Streaming complete', { responseLength: fullResponse.length });
        controller.close();
      } catch (error: unknown) {
        logger.error('Streaming error', error instanceof Error ? error : new Error(String(error)));
        const errorMessage = error instanceof Error ? error.message : 'Stream processing error';
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`));
        controller.close();
      }
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  });
};

// Educator material generation via worker (single/two-pass owned by ai-worker)
async function handleEducatorMaterialRpc(args: {
  supabase: ReturnType<typeof getServiceClient>;
  env: RequiredEnv & PagesEnv;
  request: Request;
  learnerId: string;
  turnId: string;
  requestHash: string;
  currentConversationId?: string;
  existingMessages: StoredMessage[];
  courseId: string;
  lessonId?: string;
  message: string;
  worksheetConfig?: WorksheetConfig;
  lessonPlanConfig?: LessonPlanConfig;
  userRole: string;
  isTeacherLearner: boolean;
  isGenerationRequest: boolean;
  generationUsage: { limit: number; used: number; remaining: number } | undefined;
  ports: TutorChatPorts;
}): Promise<Response> {
  const { supabase, env, request, learnerId, turnId, existingMessages, courseId, lessonId, message, worksheetConfig, lessonPlanConfig, userRole, ports } = args;
  let { currentConversationId, generationUsage } = args;

  const courseContextBuilder = ports.buildCourseContext ?? buildCourseContext;
  let courseContext: Awaited<ReturnType<typeof buildCourseContext>>;
  try {
    courseContext = await courseContextBuilder(supabase as never, courseId, lessonId || null, learnerId);
  } catch (e) {
    return apiError(404, 'NOT_FOUND', e instanceof Error ? e.message : 'Course not found', request);
  }

  const userMessageId = turnId;
  const userMessage: StoredMessage = { id: userMessageId, role: 'user', content: message, timestamp: new Date().toISOString(), requestHash: args.requestHash };
  const recentMessages = existingMessages.slice(-6);
  const historyForWorker = recentMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  const fullMessageCount = existingMessages.length;

  let workerResponse: Response;
  try {
    workerResponse = ports.callMaterialWorker
      ? await ports.callMaterialWorker({
          env: env as unknown as Record<string, unknown>,
          userId: learnerId,
          conversationId: currentConversationId || turnId,
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
          messageCount: fullMessageCount,
          worksheetConfig,
          lessonPlanConfig,
        })
      : await callMaterialWorker(env as unknown as Record<string, string>, learnerId, {
          courseId,
          ...(lessonId ? { lessonId } : {}),
          operationId: turnId,
          conversationId: currentConversationId || turnId,
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
          messageCount: fullMessageCount,
          worksheetConfig,
          lessonPlanConfig,
        });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('binding is not configured') || msg.includes('AI_ASSERT_SECRET')) {
      logger.error('Worker wiring error', err instanceof Error ? err : new Error(msg));
      return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'AI service not configured', request);
    }
    const status = rpcErrorToHttpStatus(err);
    return apiError(status, (msg.split(':')[0] || 'INTERNAL_ERROR'), msg.slice(0, 500), request);
  }

  if (!workerResponse.body || workerResponse.headers.get('content-type')?.includes('application/json')) {
    try {
      const json = await workerResponse.clone().json() as { ok?: boolean; error?: { code?: string; message?: string } };
      if (json && json.ok === false && json.error) {
        const status = rpcErrorToHttpStatus(new Error(`${json.error.code}: ${json.error.message}`));
        return apiError(status, json.error.code || 'INTERNAL_ERROR', json.error.message || 'Generation failed', request);
      }
    } catch {}
  }

  const encoder = new TextEncoder();
  let fullResponse = '';
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const text = await readBoundedWorkerText(workerResponse, 300000);
        let completed = false;
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.replace('data: ', '').trim();
          if (!data) continue;
          let event: { type?: string; text?: string; outcome?: string; error?: { code?: string; message?: string } };
          try {
            event = OrchestratorEventSchema.parse(JSON.parse(data));
          } catch {
            throw new Error('INVALID_MODEL_OUTPUT: Malformed material event');
          }
          if (completed) throw new Error('Unexpected event after material completion');
          if (event.type === 'delta' && typeof event.text === 'string' && event.text) {
            fullResponse += event.text;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: event.text })}\n\n`));
          } else if (event.type === 'completed') {
            if (event.outcome !== 'answered') throw new Error('Material response did not complete');
            completed = true;
          } else if (event.type === 'failed' || event.type === 'partial' || event.type === 'unsupported') {
            const msg = event.error?.message || 'Generation failed';
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
            return;
          }
        }

        if (!completed || !fullResponse.trim()) throw new Error('Material response did not complete');

        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: StoredMessage = { id: assistantMessageId, role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() };
        const updatedMessages = [...existingMessages, userMessage, assistantMessage];
        if (currentConversationId) {
          const { error: updateError } = await supabase.rpc('append_tutor_messages', { p_conversation_id: currentConversationId, p_learner_id: learnerId, p_new_messages: [userMessage, assistantMessage] });
          if (updateError) throw new Error('DEPENDENCY_UNAVAILABLE: Material save could not be confirmed. Do not regenerate this turn.');
          else logger.info('Updated conversation', { conversationId: currentConversationId });
        } else {
          const title = message.slice(0, 50);
          const { data: newConv, error: insertError } = await supabase.from('tutor_conversations').insert({ id: turnId, learner_id: learnerId, course_id: courseId, lesson_id: lessonId || null, title: title.slice(0, 255), messages: updatedMessages }).select('id').single();
          if (insertError || !newConv) throw new Error('DEPENDENCY_UNAVAILABLE: Material save could not be confirmed. Do not regenerate this turn.');
          if (newConv) {
            currentConversationId = (newConv as { id: string }).id;
            logger.info('Created new conversation', { conversationId: currentConversationId });
          }
        }
        if (args.isTeacherLearner && args.isGenerationRequest) {
          try {
            generationUsage = await completeTutorGeneration(supabase, learnerId, turnId, args.requestHash);
            if (!generationUsage) throw new Error('DEPENDENCY_UNAVAILABLE: Generation receipt is missing');
            logger.info('Generation count incremented', { used: (generationUsage as { used: number }).used });
          } catch (err) {
            throw new Error('DEPENDENCY_UNAVAILABLE: Generation receipt could not be confirmed. Retry the same turn.');
          }
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversationId: currentConversationId, messageId: assistantMessage.id, generationUsage })}\n\n`));
        logger.info('Streaming complete', { responseLength: fullResponse.length });
        controller.close();
      } catch (error: unknown) {
        logger.error('Streaming error', error instanceof Error ? error : new Error(String(error)));
        const errorMessage = error instanceof Error ? error.message : 'Stream processing error';
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`));
        controller.close();
      }
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
}

async function callMaterialWorker(
  env: Record<string, string>,
  userId: string,
  input: { courseId: string; lessonId?: string; operationId: string; conversationId: string; message: string; history: Array<{ role: 'user' | 'assistant'; content: string }>; course: TutorCourseContext; userRole: string; messageCount: number; worksheetConfig?: WorksheetConfig; lessonPlanConfig?: LessonPlanConfig },
): Promise<Response> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const prompts = buildMaterialPrompts(input as Parameters<typeof buildMaterialPrompts>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'orchestration.assist',
    promptPayload: { prompts },
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: OrchestratorRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: input.operationId,
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    input: { kind: 'task', task: { action: 'seniorEducator.generate-material', input: {
      courseId: input.courseId,
      ...(input.lessonId ? { lessonId: input.lessonId } : {}),
      prompts,
      conversationId: input.conversationId,
      message: input.message,
      history: input.history as EducatorMaterialRpcRequest['input']['history'],
      course: input.course,
      userRole: input.userRole,
      messageCount: input.messageCount,
      ...(input.worksheetConfig ? { worksheetConfig: input.worksheetConfig as EducatorMaterialRpcRequest['input']['worksheetConfig'] } : {}),
      ...(input.lessonPlanConfig ? { lessonPlanConfig: input.lessonPlanConfig as EducatorMaterialRpcRequest['input']['lessonPlanConfig'] } : {}),
    } } },
  };
  const result = await worker.orchestrator(request);
  if (result.headers.get('content-type')?.includes('application/json')) {
    const payload = await result.json() as { error?: { code?: string; message?: string } };
    if (!result.ok && payload.error?.code) throw new Error(`${payload.error.code}: ${payload.error.message ?? 'Material request unavailable'}`);
    throw new Error('AI_REQUEST_IN_PROGRESS: Material execution already exists');
  }
  return result;
}

async function callTutorChatWorker(
  env: Record<string, string>,
  userId: string,
  input: { operationId: string; courseId: string; lessonId?: string; conversationId: string; message: string; history: Array<{ role: 'user' | 'assistant'; content: string }>; course: TutorCourseContext; userRole: string },
): Promise<Response> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const message = input.message.trim();
  const prompt = buildTutorChatPrompt({ ...input, message });
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'orchestration.assist',
    promptPayload: { prompt },
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: OrchestratorRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: input.operationId,
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    input: { kind: 'task', task: { action: 'seniorEducator.tutor-chat', input: {
      courseId: input.courseId,
      ...(input.lessonId ? { lessonId: input.lessonId } : {}),
      prompt,
      conversationId: input.conversationId,
      message,
      history: input.history,
      course: input.course,
      userRole: input.userRole,
    } } },
  };
  const result = await worker.orchestrator(request);
  if (result.headers.get('content-type')?.includes('application/json')) {
    const payload = await result.json() as { error?: { code?: string; message?: string } };
    if (!result.ok && payload.error?.code) throw new Error(`${payload.error.code}: ${payload.error.message ?? 'Tutor request unavailable'}`);
    throw new Error('AI_REQUEST_IN_PROGRESS: Tutor execution already exists');
  }
  return result;
}
