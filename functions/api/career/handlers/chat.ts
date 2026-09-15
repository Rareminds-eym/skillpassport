/**
 * Career Chat Handler - Streaming AI chat via the AI worker (RPC cutover).
 *
 * Cut over 2026-09-12: the direct-OpenRouter implementation was replaced by
 * the worker path (see migration record). Every pre/post-step is preserved
 * exactly (rate limit, guards, conversation load, quota pre-check, intent +
 * phase, context builders, system prompt + memory assembly, guardrail
 * validation, `save_career_ai_message` persistence, legacy browser SSE
 * shape). The single deliberate difference: reasoning executes in ai-worker
 * over the protocol 0.24.0 `{ system, history }` context channel instead of
 * direct provider calls from Pages.
 */

import { apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { sanitizeInput, generateConversationTitle } from '../../../lib/validation';
import { checkRateLimit } from '../utils/rate-limit';
import { getAPIKeys } from '../../shared/ai-config';
import type { ChatRequest, StoredMessage, CareerIntent, Opportunity } from '../types';
import { validateResponse } from '../ai/guardrails';
import { detectIntent } from '../ai/intent-detection';
import { compressContext, buildMemoryContext } from '../ai/memory';
import { getConversationPhase } from '../ai/conversation-phase';
import { buildEnhancedSystemPrompt } from '../ai/prompts/enhanced-system-prompt';
import { buildlearnerContext } from '../context/learner';
import { buildAssessmentContext } from '../context/assessment';
import { buildCareerProgressContext } from '../context/progress';
import { buildCourseContext } from '../context/courses';
import { fetchSmartOpportunities } from '../context/smart-opportunities';
import { getAiWorker, type AiServiceBinding } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';

interface QueryChain {
  select(cols: string): QueryChain;
  eq(col: string, val: unknown): QueryChain;
  single(): Promise<{ data: unknown; error: unknown }>;
}

interface SupabaseLike {
  from(table: string): QueryChain;
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

export interface AssembledContext {
  conversationPhase: string;
  intent: CareerIntent;
  confidence: string;
  hasAssessment: boolean;
  systemPromptWithMemory: string;
  historyTail: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatFlipPorts {
  checkRateLimit?: (userId: string, env: Record<string, string>) => Promise<boolean>;
  loadConversation?: (
    db: () => SupabaseLike,
    conversationId: string,
    learnerId: string,
  ) => Promise<{ messages: StoredMessage[]; updated_at: string } | null>;
  countUserMessages?: (db: () => SupabaseLike, learnerId: string) => Promise<number | null>;
  assembleContext?: (args: {
    db: () => SupabaseLike;
    dbAdmin: () => DbClient;
    env: Record<string, string>;
    learnerId: string;
    message: string;
    chips: string[];
    history: StoredMessage[];
  }) => Promise<AssembledContext | null>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    rpcConversationId: string;
    message: string;
    system: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) => Promise<Response>;
  saveMessages?: (
    db: () => SupabaseLike,
    args: { learnerId: string; conversationId: string | null; title: string; messages: StoredMessage[] },
  ) => Promise<{ success: boolean; conversation_id?: string; error?: string }>;
}

type DbClient = ReturnType<typeof createSupabaseAdminClient>;

async function defaultLoadConversation(db: DbClient, conversationId: string, learnerId: string) {
  const chain = (db as unknown as SupabaseLike).from('career_ai_conversations');
  const { data, error } = await chain.select('messages, updated_at').eq('id', conversationId).eq('learner_id', learnerId).single();
  void error;
  return (data ?? null) as { messages: unknown; updated_at: string } | null;
}

/** Legacy-identical assembly: phase, intent, profile/assessment/progress/courses, system prompt, memory tail. */
async function defaultAssembleContext(args: {
  db: () => SupabaseLike;
  dbAdmin: () => DbClient;
  env: Record<string, string>;
  learnerId: string;
  message: string;
  chips: string[];
  history: StoredMessage[];
}): Promise<AssembledContext | null> {
  const { env, learnerId, message, chips, history } = args;
  const db = args.db();
  const dbAdmin = args.dbAdmin();
  const conversationPhase = getConversationPhase(history.length);
  const intentResult = detectIntent(message, chips, history);

  const [learnerProfile, assessmentContext, progressContext, courseContext] = await Promise.all([
    buildlearnerContext(dbAdmin, learnerId),
    buildAssessmentContext(dbAdmin, learnerId),
    buildCareerProgressContext(db as never, learnerId),
    buildCourseContext(db as never, learnerId),
  ]);

  if (!learnerProfile) return null;

  let opportunities: Opportunity[] = [];
  const jobRelatedIntents: CareerIntent[] = ['find-jobs', 'skill-gap', 'career-guidance', 'application-status'];
  if (jobRelatedIntents.includes(intentResult.intent)) {
    const { openRouter: openRouterKey } = getAPIKeys(env);
    opportunities = await fetchSmartOpportunities(db as never, {
      userMessage: message,
      conversationHistory: history,
      learnerProfile,
      intent: intentResult.intent,
      openRouterKey,
    });
  }

  const systemPrompt = buildEnhancedSystemPrompt({
    profile: learnerProfile,
    assessment: assessmentContext,
    progress: progressContext,
    opportunities,
    phase: conversationPhase,
    intentResult,
    courseContext,
  });

  let memoryContext = '';
  let recentMessages = history;
  if (history.length > 10) {
    const compressed = compressContext(history, 10);
    recentMessages = compressed.recentMessages;
    memoryContext = buildMemoryContext(compressed);
  } else {
    recentMessages = history.slice(-10);
  }

  return {
    conversationPhase,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    hasAssessment: Boolean(
      (assessmentContext as { hasAssessment?: boolean } | null)?.hasAssessment,
    ),
    systemPromptWithMemory: memoryContext ? `${systemPrompt}\n\n${memoryContext}` : systemPrompt,
    historyTail: recentMessages.map((m) => ({ role: m.role, content: m.content })),
  };
}

export async function handleCareerChat(
  request: Request,
  env: Record<string, string>,
  userId: string,
  ports: ChatFlipPorts = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  const startTime = Date.now();
  const learnerId = userId;
  // Lazily created: stubbed ports in tests never touch the network, and
  // client construction itself requires env vars — so build it only when
  // a default (live) port runs.
  let adminClient: DbClient | null = null;
  const admin = (): DbClient => (adminClient ??= createSupabaseAdminClient(env));
  const db = (): SupabaseLike => admin() as unknown as SupabaseLike;

  const limited = ports.checkRateLimit
    ? await ports.checkRateLimit(learnerId, env)
    : await checkRateLimit(learnerId, env);
  if (!limited) {
    return apiError(429, 'ERROR', 'Too many requests. Please wait a moment.', request);
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
  }

  const { conversationId, message, selectedChips = [] } = body;

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1048576) {
    return apiError(413, 'ERROR', 'Request too large', request);
  }

  if (!message || typeof message !== 'string') {
    return apiError(400, 'VALIDATION_ERROR', 'Message is required', request);
  }

  if (message.length > 10000) {
    return apiError(400, 'VALIDATION_ERROR', 'Message too long. Maximum 10,000 characters.', request);
  }

  const sanitizedMessage = sanitizeInput(message, 10000);
  if (!sanitizedMessage) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid message', request);
  }
  const processedMessage = sanitizedMessage;

  try {
    // ==================== FETCH CONVERSATION HISTORY (legacy-identical) ====================
    let existingMessages: StoredMessage[] = [];
    let existingConversation: { messages: unknown; updated_at: string } | null = null;

    if (conversationId) {
      const conv = ports.loadConversation
        ? await ports.loadConversation(db, conversationId, learnerId)
        : await defaultLoadConversation(admin(), conversationId, learnerId);
      if (!conv) {
        return apiError(403, 'FORBIDDEN', 'Conversation not found or access denied', request);
      }
      existingConversation = conv;
      existingMessages = Array.isArray(conv.messages) ? (conv.messages as StoredMessage[]) : [];
    }

    // ==================== QUOTA PRE-CHECK (legacy-identical, pre-spend) ====================
    const userMsgCount = ports.countUserMessages
      ? await ports.countUserMessages(db, learnerId)
      : await (async () => {
          const { data, error } = await db().rpc('count_career_ai_user_messages', { p_learner_id: learnerId });
          if (error) return null;
          return data as number;
        })();

    if (userMsgCount !== null && userMsgCount >= 2) {
      return apiError(403, 'QUOTA_EXCEEDED', 'You have used your 2 free messages.', request);
    }

    // ==================== PHASE, INTENT, CONTEXT (legacy-identical) ====================
    // Thunks: the client is built only if the running branch needs it —
    // stubbed ports in tests never touch the network or env vars.
    const ctxArgs = {
      db,
      dbAdmin: admin,
      env,
      learnerId,
      message: processedMessage,
      chips: selectedChips,
      history: existingMessages,
    };
    const assembled = ports.assembleContext
      ? await ports.assembleContext(ctxArgs)
      : await defaultAssembleContext(ctxArgs);

    if (!assembled) {
      return apiError(500, 'INTERNAL_ERROR', 'Unable to load learner profile', request);
    }

    const { conversationPhase, intent, confidence, hasAssessment, systemPromptWithMemory, historyTail } = assembled;

    // ==================== MEMORY TAIL (legacy-identical) ====================
    const turnId = crypto.randomUUID();
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: processedMessage,
      timestamp: new Date().toISOString(),
    };

    // ==================== WORKER CALL (the single deliberate difference) ====================
    const rpcConversationId = conversationId || crypto.randomUUID();
    const workerResponse = ports.callWorker
      ? await ports.callWorker({
          env: env as unknown as Record<string, unknown>,
          userId,
          rpcConversationId,
          message: processedMessage,
          system: systemPromptWithMemory,
          history: historyTail,
        })
      : await callChatWorker(env, userId, {
          conversationId: rpcConversationId,
          message: processedMessage,
          system: systemPromptWithMemory,
          history: historyTail,
        });

    // ==================== STREAM ADAPTATION (house → legacy shape) ====================
    const encoder = new TextEncoder();
    let assistantMessage = '';
    let finalConversationId = conversationId;

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
              assistantMessage += event.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.text })}\n\n`));
            } else if (event.type === 'failed') {
              throw new Error('WORKER_FAILED');
            }
            // started/completed/clarification/unsupported carry no browser payload.
          }

          // ==================== VALIDATE + SAVE (legacy-identical) ====================
          const responseValidation = validateResponse(assistantMessage);
          if (responseValidation.flags.length > 0) {
            console.log(`[RESPONSE FLAGS] ${responseValidation.flags.join(', ')}`);
          }

          const assistantMessageObj: StoredMessage = {
            id: turnId,
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date().toISOString(),
          };

          const newMessages = [userMessage, assistantMessageObj];

          const saved = ports.saveMessages
            ? await ports.saveMessages(db, {
                learnerId,
                conversationId: conversationId || null,
                title: existingConversation ? '' : generateConversationTitle(processedMessage).slice(0, 255),
                messages: newMessages,
              })
            : await (async () => {
                const { data, error } = await db().rpc('save_career_ai_message', {
                  p_learner_id: learnerId,
                  p_conversation_id: conversationId || null,
                  p_title: existingConversation ? '' : generateConversationTitle(processedMessage).slice(0, 255),
                  p_messages: newMessages,
                });
                if (error) return { success: false as const, error: 'DB_ERROR' };
                const row = data as { success: boolean; conversation_id?: string; error?: string };
                if (!row.success) return { success: false as const, error: row.error ?? 'DB_ERROR' };
                return { success: true as const, conversation_id: row.conversation_id ?? '' };
              })();

          if (!saved.success) {
            const errorPayload =
              saved.error === 'QUOTA_EXCEEDED'
                ? { type: 'QUOTA_EXCEEDED', used: 2, limit: 2, remaining: 0 }
                : 'DB_ERROR';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: errorPayload })}\n\n`));
            controller.close();
            return;
          }

          finalConversationId = saved.conversation_id || conversationId;

          const executionTime = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: finalConversationId,
                messageId: assistantMessageObj.id,
                intent,
                intentConfidence: confidence,
                phase: conversationPhase,
                hasAssessment,
                executionTime,
              })}\n\n`,
            ),
          );
          controller.close();
        } catch (error) {
          if (error instanceof Error && error.message === 'WORKER_FAILED') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: 'Worker generation failed' })}\n\n`),
            );
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream processing error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Career chat (worker) error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
}

async function callChatWorker(
  env: Record<string, string>,
  userId: string,
  input: { conversationId: string; message: string; system: string; history: Array<{ role: 'user' | 'assistant'; content: string }> },
): Promise<Response> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker: AiServiceBinding = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'careerTalentStrategist.chat',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  // Clamp to protocol limits (career.ts: message 8000, system 12000, history content 8000, max 12 items)
  const clampedInput = {
    conversationId: input.conversationId,
    message: input.message.slice(0, 8000),
    ...(input.system && input.system.trim() ? { system: input.system.slice(0, 12000) } : {}),
    ...(input.history?.length
      ? {
          history: input.history.slice(-12).map((h) => ({ role: h.role, content: h.content.slice(0, 8000) })),
        }
      : {}),
  } as typeof input;
  const result = await worker.careerTalentStrategist({
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: {
      actorId: userId,
      product: 'skillpassport',
      goals: [],
      responsibilities: [],
      permissions: [],
      capabilities: ['career_ai'],
      resourceScope: [],
      relevantContext: [],
    },
    feature: 'chat',
    input: clampedInput,
  });
  if (result instanceof Response) return result;
  throw new Error('WORKER_FAILED');
}
