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

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import { getAPIKeys, API_CONFIG, AI_MODELS } from '../../shared/ai-config';
import type { WorksheetConfig } from '../types/worksheet';
import type { LessonPlanConfig } from '../types/lesson-plan';
import {
  buildCourseContext,
} from '../utils/course-context';
import { hasReachedLimit, incrementGenerationCount } from '../utils/generation-limit';
import { createLogger } from '../../../lib/logger';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest, TutorCourseContext } from '@rareminds-eym/ai-protocol';

type TutorChatRpcRequest = Extract<EducatorRequest, { feature: 'tutor-chat' }>;
type EducatorMaterialRpcRequest = Extract<EducatorRequest, { feature: 'generate-material' }>;

const logger = createLogger('ai-tutor-chat');

interface RequiredEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
type TypedContext = AuthenticatedContext<PagesEnv> & { env: RequiredEnv };
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
}
function isValidOpenRouterResponse(data: unknown): data is OpenRouterResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.choices)) return false;
  return obj.choices.every(choice =>
    typeof choice === 'object' &&
    choice !== null &&
    (!('message' in choice) || typeof choice.message === 'object')
  );
}
interface AiTutorChatRequest {
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
  if (!courseId || !message) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: courseId and message', request);
  }

  // Fetch existing messages if conversation exists — preserved
  let currentConversationId = conversationId;
  let existingMessages: StoredMessage[] = [];
  if (conversationId) {
    const { data: conversation } = await supabase
      .from('tutor_conversations')
      .select('messages')
      .eq('id', conversationId)
      .eq('learner_id', learnerId)
      .maybeSingle();
    if (conversation) {
      existingMessages = (conversation as { messages?: StoredMessage[] }).messages || [];
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
    const limitReached = await hasReachedLimit(supabase, learnerId);
    if (limitReached) {
      logger.warn('Blocked: teacher learner reached generation limit');
      return apiError(403, 'FORBIDDEN', 'You have reached your 2-generation limit for worksheet and lesson plan generation.', request);
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

  const userMessageId = crypto.randomUUID();
  const userMessage: StoredMessage = {
    id: userMessageId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
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
          conversationId: currentConversationId || crypto.randomUUID(),
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
        })
      : await callTutorChatWorker(env as unknown as Record<string, string>, learnerId, {
          conversationId: currentConversationId || crypto.randomUUID(),
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
        const text = await workerResponse.text();
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.replace('data: ', '').trim();
          if (!data) continue;
          let event: { type?: string; text?: string; error?: { code?: string; message?: string } };
          try {
            event = JSON.parse(data) as typeof event;
          } catch {
            continue;
          }
          if (event.type === 'delta' && typeof event.text === 'string' && event.text) {
            fullResponse += event.text;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: event.text })}\n\n`));
          } else if (event.type === 'failed') {
            const msg = event.error?.message || 'Generation failed';
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
            return;
          }
          // started/completed carry no legacy payload
        }

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
            logger.error('Failed to append messages', updateError as Error);
          } else {
            logger.info('Updated conversation', { conversationId: currentConversationId });
          }
        } else {
          let title = message.slice(0, 50);
          try {
            const { openRouter: openRouterKey } = getAPIKeys(env);
            const chatModel = AI_MODELS.GPT_4O_MINI;
            const endpoint = API_CONFIG.OPENROUTER.endpoint;
            if (openRouterKey) {
              const titleAbortController = new AbortController();
              const titleTimeoutId = setTimeout(() => titleAbortController.abort(), 5000);
              const titleResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openRouterKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': env.SUPABASE_URL ?? '',
                  'X-Title': 'AI Course Tutor - Title Generation'
                },
                body: JSON.stringify({
                  model: chatModel,
                  messages: [{ role: 'user', content: `Generate a short title (max 50 chars) for a tutoring conversation about "${courseContext.courseTitle}" starting with: "${message}"` }],
                  max_tokens: 60,
                  temperature: 0.5
                }),
                signal: titleAbortController.signal
              });
              clearTimeout(titleTimeoutId);
              if (titleResponse.ok) {
                let titleData: unknown;
                try { titleData = await titleResponse.json(); } catch { titleData = null; }
                if (titleData && isValidOpenRouterResponse(titleData)) {
                  const generatedTitle = (titleData as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content?.trim();
                  if (generatedTitle) title = generatedTitle;
                }
              }
            }
          } catch (error) {
            logger.warn('Title generation failed, using default', { error: error instanceof Error ? error.message : String(error) });
          }
          const { data: newConv } = await supabase
            .from('tutor_conversations')
            .insert({
              learner_id: learnerId,
              course_id: courseId,
              lesson_id: lessonId || null,
              title: title.slice(0, 255),
              messages: updatedMessages
            })
            .select('id')
            .single();
          if (newConv) {
            currentConversationId = (newConv as { id: string }).id;
            logger.info('Created new conversation', { conversationId: currentConversationId });
          }
        }
        if (isTeacherLearner && isGenerationRequest) {
          try {
            generationUsage = await incrementGenerationCount(supabase, learnerId);
            logger.info('Generation count incremented', { used: (generationUsage as { used: number }).used });
          } catch (err) {
            logger.error('Failed to increment generation count', err instanceof Error ? err : new Error(String(err)));
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
  const { supabase, env, request, learnerId, existingMessages, courseId, lessonId, message, worksheetConfig, lessonPlanConfig, userRole, ports } = args;
  let { currentConversationId, generationUsage } = args;

  const courseContextBuilder = ports.buildCourseContext ?? buildCourseContext;
  let courseContext: Awaited<ReturnType<typeof buildCourseContext>>;
  try {
    courseContext = await courseContextBuilder(supabase as never, courseId, lessonId || null, learnerId);
  } catch (e) {
    return apiError(404, 'NOT_FOUND', e instanceof Error ? e.message : 'Course not found', request);
  }

  const userMessageId = crypto.randomUUID();
  const userMessage: StoredMessage = { id: userMessageId, role: 'user', content: message, timestamp: new Date().toISOString() };
  const recentMessages = existingMessages.slice(-6);
  const historyForWorker = recentMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  const fullMessageCount = existingMessages.length;

  let workerResponse: Response;
  try {
    workerResponse = ports.callMaterialWorker
      ? await ports.callMaterialWorker({
          env: env as unknown as Record<string, unknown>,
          userId: learnerId,
          conversationId: currentConversationId || crypto.randomUUID(),
          message,
          history: historyForWorker,
          course: courseContext as unknown as TutorCourseContext,
          userRole,
          messageCount: fullMessageCount,
          worksheetConfig,
          lessonPlanConfig,
        })
      : await callMaterialWorker(env as unknown as Record<string, string>, learnerId, {
          conversationId: currentConversationId || crypto.randomUUID(),
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
        const text = await workerResponse.text();
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.replace('data: ', '').trim();
          if (!data) continue;
          let event: { type?: string; text?: string; error?: { code?: string; message?: string } };
          try {
            event = JSON.parse(data) as typeof event;
          } catch {
            continue;
          }
          if (event.type === 'delta' && typeof event.text === 'string' && event.text) {
            fullResponse += event.text;
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ content: event.text })}\n\n`));
          } else if (event.type === 'failed') {
            const msg = event.error?.message || 'Generation failed';
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`));
            controller.close();
            return;
          }
        }

        const assistantMessageId = crypto.randomUUID();
        const assistantMessage: StoredMessage = { id: assistantMessageId, role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() };
        const updatedMessages = [...existingMessages, userMessage, assistantMessage];
        if (currentConversationId) {
          const { error: updateError } = await supabase.rpc('append_tutor_messages', { p_conversation_id: currentConversationId, p_learner_id: learnerId, p_new_messages: [userMessage, assistantMessage] });
          if (updateError) logger.error('Failed to append messages', updateError as Error);
          else logger.info('Updated conversation', { conversationId: currentConversationId });
        } else {
          let title = message.slice(0, 50);
          try {
            const { openRouter: openRouterKey } = getAPIKeys(env);
            if (openRouterKey) {
              const titleAbortController = new AbortController();
              const titleTimeoutId = setTimeout(() => titleAbortController.abort(), 5000);
              const titleResponse = await fetch(API_CONFIG.OPENROUTER.endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': env.SUPABASE_URL ?? '', 'X-Title': 'AI Course Tutor - Title Generation' },
                body: JSON.stringify({ model: AI_MODELS.GPT_4O_MINI, messages: [{ role: 'user', content: `Generate a short title (max 50 chars) for a tutoring conversation about "${courseContext.courseTitle}" starting with: "${message}"` }], max_tokens: 60, temperature: 0.5 }),
                signal: titleAbortController.signal
              });
              clearTimeout(titleTimeoutId);
              if (titleResponse.ok) {
                let titleData: unknown;
                try { titleData = await titleResponse.json(); } catch { titleData = null; }
                if (titleData && isValidOpenRouterResponse(titleData)) {
                  const gen = (titleData as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content?.trim();
                  if (gen) title = gen;
                }
              }
            }
          } catch (error) {
            logger.warn('Title generation failed, using default', { error: error instanceof Error ? error.message : String(error) });
          }
          const { data: newConv } = await supabase.from('tutor_conversations').insert({ learner_id: learnerId, course_id: courseId, lesson_id: lessonId || null, title: title.slice(0, 255), messages: updatedMessages }).select('id').single();
          if (newConv) {
            currentConversationId = (newConv as { id: string }).id;
            logger.info('Created new conversation', { conversationId: currentConversationId });
          }
        }
        if (args.isTeacherLearner && args.isGenerationRequest) {
          try {
            generationUsage = await incrementGenerationCount(supabase, learnerId);
            logger.info('Generation count incremented', { used: (generationUsage as { used: number }).used });
          } catch (err) {
            logger.error('Failed to increment generation count', err instanceof Error ? err : new Error(String(err)));
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
  input: { conversationId: string; message: string; history: Array<{ role: 'user' | 'assistant'; content: string }>; course: TutorCourseContext; userRole: string; messageCount: number; worksheetConfig?: WorksheetConfig; lessonPlanConfig?: LessonPlanConfig },
): Promise<Response> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.generate-material',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: EducatorMaterialRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'generate-material',
    input: {
      conversationId: input.conversationId,
      message: input.message,
      history: input.history as EducatorMaterialRpcRequest['input']['history'],
      course: input.course,
      userRole: input.userRole,
      messageCount: input.messageCount,
      ...(input.worksheetConfig ? { worksheetConfig: input.worksheetConfig as EducatorMaterialRpcRequest['input']['worksheetConfig'] } : {}),
      ...(input.lessonPlanConfig ? { lessonPlanConfig: input.lessonPlanConfig as EducatorMaterialRpcRequest['input']['lessonPlanConfig'] } : {}),
    },
  };
  const result: unknown = await worker.seniorEducator(request);
  if (result instanceof Response) return result;
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    throw new Error(`IDEMPOTENCY_CONFLICT: duplicate execution`);
  }
  const failed = result as { ok: boolean; error: { code: string; message: string } };
  if (!failed.ok) throw new Error(`${failed.error.code}: ${failed.error.message}`);
  throw new Error('INTERNAL_ERROR: unexpected non-stream for generate-material');
}

async function callTutorChatWorker(
  env: Record<string, string>,
  userId: string,
  input: { conversationId: string; message: string; history: Array<{ role: 'user' | 'assistant'; content: string }>; course: TutorCourseContext; userRole: string },
): Promise<Response> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.tutor-chat',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: TutorChatRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'tutor-chat',
    input: {
      conversationId: input.conversationId,
      message: input.message,
      history: input.history as TutorChatRpcRequest['input']['history'],
      course: input.course,
      userRole: input.userRole,
    },
  };
  const result: unknown = await worker.seniorEducator(request);
  if (result instanceof Response) return result;
  // Bounded duplicate pointer — treat as error (should not happen with fresh operationId)
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    throw new Error(`IDEMPOTENCY_CONFLICT: duplicate execution`);
  }
  const failed = result as { ok: boolean; error: { code: string; message: string } };
  if (!failed.ok) throw new Error(`${failed.error.code}: ${failed.error.message}`);
  throw new Error('INTERNAL_ERROR: unexpected non-stream for tutor-chat');
}
