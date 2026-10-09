/**
 * Career Chat Handler - Streaming AI chat via the AI worker (RPC cutover).
 *
 * 30-credit plan: every send carries a stable client turn UUID. Pages claims
 * the turn (claim_career_turn_intent), resolves one owned session for it
 * (pre-created conversation, adopted exactly once), freezes the worker input
 * (ready_career_turn_intent) and binds session/turn/input-hash into the
 * execution assertion. Transport retries reuse the session and frozen input,
 * so the worker dedupes by operation id instead of rebilling. Duplicate
 * worker responses replay the saved answer; unrecoverable turns fail closed
 * with TURN_STATE_UNKNOWN (send as a new message).
 *
 * Every pre-step is otherwise preserved (rate limit, guards, conversation
 * load, intent + phase, context builders, system prompt + memory assembly,
 * guardrail validation, `save_career_ai_message` persistence, legacy
 * browser SSE shape). Reasoning executes in ai-worker over the protocol
 * `{ system, history }` context channel.
 */

import { apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import { sanitizeInput, generateConversationTitle } from '../../../lib/validation';
import { checkRateLimit } from '../utils/rate-limit';
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
import { getAiWorker, rpcErrorToHttpStatus, type AiServiceBinding } from '../../ai/lib/aiBinding';
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

/** Deterministic JSON with sorted keys: same logical turn, same hash. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isUUID(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export interface ClaimedTurn {
  created: boolean;
  turnId: string;
  sessionId: string | null;
  state: string;
  workerInput?: unknown;
  workerInputHash?: string | null;
  responseText?: string | null;
  assistantMessageId?: string | null;
}

export interface ChatFlipPorts {
  checkRateLimit?: (userId: string, env: Record<string, string>) => Promise<boolean>;
  loadConversation?: (
    db: () => SupabaseLike,
    conversationId: string,
    learnerId: string,
  ) => Promise<{ messages: StoredMessage[]; updated_at: string } | null>;
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
  /**
   * Stable-turn ports (30-credit plan). Defaults hit the turn-intent RPCs
   * and the conversations table; tests stub them.
   */
  claimTurnIntent?: (
    db: () => SupabaseLike,
    args: { turnId: string; learnerId: string; requestHash: string },
  ) => Promise<{ created: boolean; sessionId: string | null; state: string; workerInput?: unknown; workerInputHash?: string | null; responseText?: string | null; assistantMessageId?: string | null } | { error: string }>;
  resolveTurnSession?: (
    args: {
      db: () => SupabaseLike;
      dbAdmin: () => DbClient;
      learnerId: string;
      turnId: string;
      claimedSessionId: string | null;
      requestedConversationId: string | null;
      title: string;
    },
  ) => Promise<{ sessionId: string } | { error: string; status: number }>;
  freezeTurnIntent?: (
    db: () => SupabaseLike,
    args: { turnId: string; workerInput: unknown; workerInputHash: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  completeTurnIntent?: (
    db: () => SupabaseLike,
    args: { turnId: string; responseText: string | null; assistantMessageId: string | null; state: "terminal" | "failed" },
  ) => Promise<void>;
}

type DbClient = ReturnType<typeof createSupabaseAdminClient>;

async function defaultLoadConversation(db: DbClient, conversationId: string, learnerId: string) {
  const chain = (db as unknown as SupabaseLike).from('career_ai_conversations');
  const { data, error } = await chain.select('messages, updated_at').eq('id', conversationId).eq('learner_id', learnerId).single();
  void error;
  return (data ?? null) as { messages: unknown; updated_at: string } | null;
}

/** Claim (or re-read) a client turn. Transport-safe: same turn+hash, same row. */
async function defaultClaimTurnIntent(
  db: SupabaseLike,
  args: { turnId: string; learnerId: string; requestHash: string },
): Promise<ClaimedTurn | { error: string }> {
  const { data, error } = await db.rpc('claim_career_turn_intent', {
    p_turn_id: args.turnId,
    p_user_id: args.learnerId,
    p_request_hash: args.requestHash,
  }) as unknown as { data: Record<string, unknown> | null; error: unknown };
  if (error || !data || data['ok'] !== true) {
    const code = (data as Record<string, unknown> | null)?.['error'];
    if (code === 'TURN_OWNER_MISMATCH' || code === 'TURN_PAYLOAD_CONFLICT') {
      return { error: code as string };
    }
    throw new Error(`Turn claim failed: ${error instanceof Error ? error.message : String(error ?? code ?? 'unknown')}`);
  }
  return {
    created: data['created'] === true,
    turnId: args.turnId,
    sessionId: (data['session_id'] as string | null) ?? null,
    state: String(data['state'] ?? 'preparing'),
    workerInput: data['worker_input'],
    workerInputHash: (data['worker_input_hash'] as string | null) ?? null,
    responseText: (data['response_text'] as string | null) ?? null,
    assistantMessageId: (data['assistant_message_id'] as string | null) ?? null,
  };
}

/**
 * Resolve exactly one owned session for the turn. Replays adopt the claimed
 * session (ownership-verified). Fresh turns use the requested conversation
 * (ownership-verified) or allocate + insert a new conversation row, then win
 * or adopt the NULL→session compare-and-set. Losers delete their orphan.
 */
async function defaultResolveTurnSession(args: {
  db: () => SupabaseLike;
  dbAdmin: () => DbClient;
  learnerId: string;
  turnId: string;
  claimedSessionId: string | null;
  requestedConversationId: string | null;
  title: string;
}): Promise<{ sessionId: string } | { error: string; status: number }> {
  const admin = args.dbAdmin() as unknown as SupabaseClientType;
  if (args.claimedSessionId) {
    const conv = await defaultLoadConversation(args.dbAdmin(), args.claimedSessionId, args.learnerId);
    if (!conv) return { error: 'Conversation not found or access denied', status: 403 };
    return { sessionId: args.claimedSessionId };
  }
  if (args.requestedConversationId) {
    const conv = await defaultLoadConversation(args.dbAdmin(), args.requestedConversationId, args.learnerId);
    if (!conv) return { error: 'Conversation not found or access denied', status: 403 };
    const { data, error } = await args.db().rpc('adopt_career_turn_session', {
      p_turn_id: args.turnId,
      p_session_id: args.requestedConversationId,
    }) as unknown as { data: Record<string, unknown> | null; error: unknown };
    if (error || !data || data['ok'] !== true) {
      throw new Error(`Turn session adopt failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
    return { sessionId: String(data['session_id']) };
  }
  const sessionId = crypto.randomUUID();
  const { error: insertError } = await admin
    .from('career_ai_conversations')
    .insert({ id: sessionId, learner_id: args.learnerId, title: args.title, messages: [] });
  if (insertError) {
    throw new Error(`Conversation pre-create failed: ${insertError.message}`);
  }
  const { data, error } = await args.db().rpc('adopt_career_turn_session', {
    p_turn_id: args.turnId,
    p_session_id: sessionId,
  }) as unknown as { data: Record<string, unknown> | null; error: unknown };
  if (error || !data || data['ok'] !== true) {
    throw new Error(`Turn session adopt failed: ${error instanceof Error ? error.message : 'unknown'}`);
  }
  if (data['won'] !== true) {
    // Lost the race: drop the orphan empty row, adopt the winner's session.
    try {
      await admin.from('career_ai_conversations').delete().eq('id', sessionId);
    } catch {
      // Orphan cleanup is best-effort; empty rows never affect credits.
    }
  }
  return { sessionId: String(data['session_id']) };
}

async function defaultFreezeTurnIntent(
  db: SupabaseLike,
  args: { turnId: string; workerInput: unknown; workerInputHash: string },
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await db.rpc('ready_career_turn_intent', {
    p_turn_id: args.turnId,
    p_worker_input: args.workerInput,
    p_worker_input_hash: args.workerInputHash,
  }) as unknown as { data: Record<string, unknown> | null; error: unknown };
  if (error || !data || data['ok'] !== true) {
    return { ok: false, error: String((data as Record<string, unknown> | null)?.['error'] ?? 'unknown') };
  }
  return { ok: true };
}

async function defaultCompleteTurnIntent(
  db: SupabaseLike,
  args: { turnId: string; responseText: string | null; assistantMessageId: string | null; state: "terminal" | "failed" },
): Promise<void> {
  try {
    await db.rpc('complete_career_turn_intent', {
      p_turn_id: args.turnId,
      p_response_text: args.responseText,
      p_assistant_message_id: args.assistantMessageId,
      p_state: args.state,
    });
  } catch {
    // Terminal marking is best-effort: the transcript row (keyed by turn id)
    // is the recovery source for duplicate replays.
  }
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
    opportunities = await fetchSmartOpportunities(db as never, {
      userMessage: message,
      conversationHistory: history,
      learnerProfile,
      intent: intentResult.intent,
      env,
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

  const { conversationId, message, selectedChips = [], turnId: clientTurnId } = body;

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

  // Stable turn identity: one UUID per send, reused across retries. A
  // missing turn id is minted single-use (retries cannot dedupe).
  let turnId: string;
  if (clientTurnId === undefined) {
    turnId = crypto.randomUUID();
  } else if (!isUUID(clientTurnId)) {
    return apiError(400, 'VALIDATION_ERROR', 'turnId must be a UUID', request);
  } else {
    turnId = clientTurnId;
  }
  const requestHash = await sha256Hex(stableStringify({
    message: processedMessage,
    chips: [...selectedChips].sort(),
    conversationId: conversationId ?? null,
  }));
  const completeTurn = (
    args: { responseText: string | null; assistantMessageId: string | null; state: "terminal" | "failed" },
  ): Promise<void> => {
    if (ports.completeTurnIntent) return ports.completeTurnIntent(db, { turnId, ...args });
    return defaultCompleteTurnIntent(db(), { turnId, ...args });
  };

  try {
    // ==================== CLAIM TURN (idempotent first write wins) ====================
    const claim = ports.claimTurnIntent
      ? await ports.claimTurnIntent(db, { turnId, learnerId, requestHash })
      : await defaultClaimTurnIntent(db(), { turnId, learnerId, requestHash });
    if ('error' in claim) {
      if (claim.error === 'TURN_OWNER_MISMATCH') {
        return apiError(403, 'FORBIDDEN', 'Turn belongs to a different user', request);
      }
      return apiError(409, 'TURN_PAYLOAD_CONFLICT', 'This turn was already sent with different content. Send as a new message.', request);
    }

    // Terminal replay: the answer is already saved under this turn.
    if (!claim.created && claim.state === 'terminal' && claim.responseText) {
      return replayTurn(request, {
        conversationId: claim.sessionId ?? conversationId ?? '',
        messageId: claim.assistantMessageId ?? turnId,
        content: claim.responseText,
      });
    }

    // ==================== RESOLVE ONE OWNED SESSION ====================
    const title = generateConversationTitle(processedMessage).slice(0, 255);
    const session = ports.resolveTurnSession
      ? await ports.resolveTurnSession({
          db, dbAdmin: admin, learnerId, turnId,
          claimedSessionId: claim.sessionId, requestedConversationId: conversationId ?? null, title,
        })
      : await defaultResolveTurnSession({
          db, dbAdmin: admin, learnerId, turnId,
          claimedSessionId: claim.sessionId, requestedConversationId: conversationId ?? null, title,
        });
    if ('error' in session) {
      return apiError(session.status, 'FORBIDDEN', session.error, request);
    }
    const sessionId = session.sessionId;

    // ==================== FETCH CONVERSATION HISTORY (by session) ====================
    let existingMessages: StoredMessage[] = [];

    {
      const conv = ports.loadConversation
        ? await ports.loadConversation(db, sessionId, learnerId)
        : await defaultLoadConversation(admin(), sessionId, learnerId);
      if (!conv) {
        return apiError(403, 'FORBIDDEN', 'Conversation not found or access denied', request);
      }
      existingMessages = Array.isArray(conv.messages) ? (conv.messages as StoredMessage[]) : [];
    }

    // ==================== WORKER INPUT: frozen wins on replay ====================
    // A replay reuses the exact input the first attempt froze, so the
    // worker's operation id always pairs with an identical payload (no
    // IDEMPOTENCY_CONFLICT on retries). Only a turn with no frozen input
    // assembles context and freezes it now.
    let systemPromptWithMemory: string;
    let historyTail: Array<{ role: 'user' | 'assistant'; content: string }>;
    let conversationPhase: string;
    let intent: CareerIntent;
    let confidence: string;
    let hasAssessment: boolean;
    let workerInputHash: string;

    if (!claim.created && claim.workerInput && typeof claim.workerInput === 'object' && claim.workerInputHash) {
      const frozen = claim.workerInput as {
        system?: string; history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      };
      systemPromptWithMemory = typeof frozen.system === 'string' ? frozen.system : '';
      historyTail = Array.isArray(frozen.history) ? frozen.history : [];
      workerInputHash = claim.workerInputHash;
      // Replay display metadata is best-effort: re-derive cheaply.
      conversationPhase = getConversationPhase(existingMessages.length);
      intent = detectIntent(processedMessage, selectedChips, existingMessages).intent;
      confidence = 'high';
      hasAssessment = false;
    } else {
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

      systemPromptWithMemory = assembled.systemPromptWithMemory;
      historyTail = assembled.historyTail;
      conversationPhase = assembled.conversationPhase;
      intent = assembled.intent;
      confidence = assembled.confidence;
      hasAssessment = assembled.hasAssessment;

      const workerInput = {
        conversationId: sessionId,
        message: processedMessage.slice(0, 8000),
        ...(systemPromptWithMemory.trim() ? { system: systemPromptWithMemory.slice(0, 12000) } : {}),
        ...(historyTail.length
          ? { history: historyTail.slice(-12).map((h) => ({ role: h.role, content: h.content.slice(0, 8000) })) }
          : {}),
      };
      workerInputHash = await sha256Hex(stableStringify(workerInput));
      const frozen = ports.freezeTurnIntent
        ? await ports.freezeTurnIntent(db, { turnId, workerInput, workerInputHash })
        : await defaultFreezeTurnIntent(db(), { turnId, workerInput, workerInputHash });
      if (!frozen.ok) {
        // Lost the freeze race: a twin prepared first. Adopt its frozen
        // input (any deterministic assembly of the same turn is billable
        // under this turn exactly once) rather than forking identity.
        const reread = ports.claimTurnIntent
          ? await ports.claimTurnIntent(db, { turnId, learnerId, requestHash })
          : await defaultClaimTurnIntent(db(), { turnId, learnerId, requestHash });
        if ('error' in reread || typeof reread.workerInput !== 'object' || !reread.workerInput || !reread.workerInputHash) {
          return apiError(500, 'INTERNAL_ERROR', 'Turn preparation raced; please retry', request);
        }
        const adopted = reread.workerInput as { system?: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> };
        systemPromptWithMemory = typeof adopted.system === 'string' ? adopted.system : '';
        historyTail = Array.isArray(adopted.history) ? adopted.history : [];
        workerInputHash = reread.workerInputHash;
      }
    }
    const userMessage: StoredMessage = {
      id: turnId,
      role: 'user',
      content: processedMessage,
      timestamp: new Date().toISOString(),
    };

    // ==================== WORKER CALL (stable turn identity) ====================
    // operationId is the turn id (stable across retries); the assertion binds
    // session + turn + frozen-input hash. The worker dedupes replays by
    // operation id and returns a duplicate pointer instead of rebilling.
    let workerResponse: Response | { duplicate: true; executionId?: string };
    try {
      workerResponse = ports.callWorker
        ? await ports.callWorker({
            env: env as unknown as Record<string, unknown>,
            userId,
            rpcConversationId: sessionId,
            message: processedMessage,
            system: systemPromptWithMemory,
            history: historyTail,
          })
        : await callChatWorker(env, userId, {
            conversationId: sessionId,
            message: processedMessage,
            system: systemPromptWithMemory,
            history: historyTail,
            turnId,
            workerInputHash,
            sessionId,
          });
    } catch (err) {
      await completeTurn({ responseText: null, assistantMessageId: null, state: 'failed' });
      return mapWorkerError(err, request);
    }

    if (!(workerResponse instanceof Response)) {
      // Worker deduped this turn: recover the saved answer without rebilling.
      return await handleDuplicateTurn({
        request, db, ports, admin, learnerId, turnId, sessionId, requestHash, startTime,
      });
    }

    // ==================== STREAM ADAPTATION (house → legacy shape) ====================
    const encoder = new TextEncoder();
    let assistantMessage = '';
    let finalConversationId: string | null = sessionId;

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
                conversationId: sessionId,
                title: '',
                messages: newMessages,
              })
            : await (async () => {
                const { data, error } = await db().rpc('save_career_ai_message', {
                  p_learner_id: learnerId,
                  p_conversation_id: sessionId,
                  p_title: '',
                  p_messages: newMessages,
                });
                if (error) return { success: false as const, error: 'DB_ERROR' };
                const row = data as { success: boolean; conversation_id?: string; error?: string };
                if (!row.success) return { success: false as const, error: row.error ?? 'DB_ERROR' };
                return { success: true as const, conversation_id: row.conversation_id ?? '' };
              })();

          if (!saved.success) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, error: 'DB_ERROR' })}\n\n`));
            controller.close();
            return;
          }

          finalConversationId = saved.conversation_id || sessionId;
          await completeTurn({ responseText: assistantMessage, assistantMessageId: assistantMessageObj.id, state: 'terminal' });

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
    try {
      // Best-effort: only runs when the turn was claimed above. Replays use
      // the transcript row as their recovery source.
      await completeTurn({ responseText: null, assistantMessageId: null, state: 'failed' });
    } catch {
      // Terminal marking must never mask the original failure.
    }
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
}

/**
 * Map a worker RPC failure to a Pages response. Credit denials carry their
 * typed codes (429 exhausted/busy/pending, never a generic 500); everything
 * else reuses the shared CODE→status table.
 */
function mapWorkerError(err: unknown, request: Request): Response {
  const raw = err instanceof Error ? err.message : String(err);
  const code = raw.split(':')[0] ?? '';
  if (code === 'AI_CREDITS_EXHAUSTED') {
    return apiError(429, 'AI_CREDITS_EXHAUSTED', "You've reached your free Career AI credit limit.", request);
  }
  if (code === 'AI_REQUEST_IN_PROGRESS') {
    return apiError(429, 'AI_REQUEST_IN_PROGRESS', 'A Career AI request is already running. Please wait.', request);
  }
  if (code === 'AI_CREDITS_PENDING') {
    return apiError(429, 'AI_CREDITS_PENDING', 'Credit settlement is pending. Please try again shortly.', request);
  }
  if (code === 'IDEMPOTENCY_CONFLICT') {
    return apiError(409, 'IDEMPOTENCY_CONFLICT', 'This turn changed since it was sent. Send as a new message.', request);
  }
  const status = rpcErrorToHttpStatus(err);
  return apiError(status, code || 'INTERNAL_ERROR', raw.slice(0, 500), request);
}

/** Replay a saved answer in the legacy SSE shape (no rebill, no re-save). */
function replayTurn(
  request: Request,
  args: { conversationId: string; messageId: string; content: string },
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: args.content })}\n\n`));
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            conversationId: args.conversationId,
            messageId: args.messageId,
            replayed: true,
          })}\n\n`,
        ),
      );
      controller.close();
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
}

/**
 * Worker deduped this turn (its root idempotency already ran). Recover the
 * saved answer: terminal intent with response first, else the transcript row
 * keyed by turn id (both messages share it). Anything else is an honest
 * 409 — the turn cannot be rebilled, so the user sends a new message.
 */
async function handleDuplicateTurn(args: {
  request: Request;
  db: () => SupabaseLike;
  ports: ChatFlipPorts;
  admin: () => DbClient;
  learnerId: string;
  turnId: string;
  sessionId: string;
  requestHash: string;
  startTime: number;
}): Promise<Response> {
  const { request, db, ports, admin, learnerId, turnId, sessionId, requestHash } = args;
  const claim = ports.claimTurnIntent
    ? await ports.claimTurnIntent(db, { turnId, learnerId, requestHash })
    : await defaultClaimTurnIntent(db(), { turnId, learnerId, requestHash });
  if (!('error' in claim) && !claim.created && claim.state === 'terminal' && claim.responseText) {
    return replayTurn(request, {
      conversationId: claim.sessionId ?? sessionId,
      messageId: claim.assistantMessageId ?? turnId,
      content: claim.responseText,
    });
  }
  const conv = ports.loadConversation
    ? await ports.loadConversation(db, sessionId, learnerId)
    : await defaultLoadConversation(admin(), sessionId, learnerId);
  const messages = conv && Array.isArray(conv.messages) ? (conv.messages as StoredMessage[]) : [];
  const assistant = messages.find((m) => m.id === turnId && m.role === 'assistant');
  if (assistant && assistant.content) {
    if (ports.completeTurnIntent) {
      await ports.completeTurnIntent(db, { turnId, responseText: assistant.content, assistantMessageId: assistant.id, state: 'terminal' });
    } else {
      await defaultCompleteTurnIntent(db(), { turnId, responseText: assistant.content, assistantMessageId: assistant.id, state: 'terminal' });
    }
    return replayTurn(request, { conversationId: sessionId, messageId: assistant.id, content: assistant.content });
  }
  return apiError(409, 'TURN_STATE_UNKNOWN', 'This turn completed elsewhere but its answer is unavailable. Send as a new message.', request);
}

async function callChatWorker(
  env: Record<string, string>,
  userId: string,
  input: {
    conversationId: string; message: string; system: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    turnId: string; workerInputHash: string; sessionId: string;
  },
): Promise<Response | { duplicate: true; executionId?: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker: AiServiceBinding = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  // Assertion binds session + stable turn + frozen-input hash alongside the
  // existing user/product/action claims; the worker cross-checks all three.
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'careerTalentStrategist.chat',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
    sessionId: input.sessionId,
    operationId: input.turnId,
    workerInputHash: input.workerInputHash,
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
    workerInputHash: input.workerInputHash,
  };
  // operationId is the stable turn id (replays dedupe); requestId is fresh
  // per HTTP attempt and never reused for billing identity.
  const result = await worker.careerTalentStrategist({
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: input.turnId,
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
  if (!(result instanceof Response)) throw new Error('WORKER_FAILED');
  // Duplicate replays arrive as JSON, billed turns as event-stream SSE.
  const contentType = result.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await result.json()) as {
      success?: boolean; data?: { duplicate?: boolean; executionId?: string };
    };
    if (payload?.data?.duplicate) {
      return { duplicate: true, executionId: payload.data.executionId };
    }
    throw new Error('WORKER_FAILED');
  }
  return result;
}
