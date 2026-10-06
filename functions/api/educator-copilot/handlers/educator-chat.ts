/**
 * Educator copilot chat handler (server-side LLM ops for EducatorCopilot UI).
 *
 * Scoped endpoint: intent classification + grounded response generation only.
 * Data-first intents (at-risk learners, matches, class analytics) keep running
 * browser-side over Supabase data — they involve no provider and are not
 * proxied here. No arbitrary prompts/models/budgets: fixed GLM → Nemotron
 * chain with per-op allowances (classify 20 / respond 1000 / stream 800).
 */
import { apiError, apiSuccess } from '../../../lib/response';
import { callCloudflareWithRetry, getCloudflareConfig } from '../../shared/ai-config';
import { createCloudflareClient } from '../../shared/cloudflare-ai';
import {
  buildEducatorSystemPrompt,
  buildIntentClassificationPrompt,
  parseIntent,
  sanitizeEducatorContext,
  type EducatorCopilotIntent,
} from '../lib/educator-prompts';

const MAX_QUERY = 2000;
const MAX_HISTORY = 6;
const MAX_HISTORY_ITEM = 2000;

type Op = 'classify' | 'respond' | 'respond-stream';

function asMessages(history: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is { role: string; content: string } =>
        typeof m === 'object' &&
        m !== null &&
        ((m as { role: string }).role === 'user' || (m as { role: string }).role === 'assistant') &&
        typeof (m as { content: string }).content === 'string',
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, MAX_HISTORY_ITEM) }));
}

export async function handleEducatorCopilotChat(env: unknown, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const op = body.op as Op;
  if (op !== 'classify' && op !== 'respond' && op !== 'respond-stream') {
    return apiError(400, 'VALIDATION_ERROR', 'op must be classify, respond or respond-stream', request);
  }
  const query = typeof body.query === 'string' ? body.query.slice(0, MAX_QUERY) : '';
  if (!query.trim()) {
    return apiError(400, 'VALIDATION_ERROR', 'query is required', request);
  }

  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    return apiError(500, 'INTERNAL_ERROR', 'Cloudflare AI binding not configured', request);
  }

  if (op === 'classify') {
    try {
      const raw = await callCloudflareWithRetry(
        env,
        [{ role: 'user', content: buildIntentClassificationPrompt(query) }],
        { maxTokens: 20, temperature: 0.3 },
      );
      return apiSuccess({ intent: parseIntent(raw) }, request);
    } catch (error) {
      // Classify failures fall back to general (browser parity).
      return apiSuccess({ intent: 'general' as EducatorCopilotIntent, degraded: true }, request);
    }
  }

  const intent = parseIntent(typeof body.intent === 'string' ? body.intent : 'general');
  const context = sanitizeEducatorContext(body.context);
  const history = asMessages(body.history);
  const system = buildEducatorSystemPrompt(context);
  const messages = [
    { role: 'system' as const, content: system },
    ...history.slice(-5),
    { role: 'user' as const, content: op === 'respond-stream' ? query : `[Intent: ${intent}]\n\n${query}` },
  ];

  if (op === 'respond') {
    try {
      const text = await callCloudflareWithRetry(env, messages, { maxTokens: 1000, temperature: 0.7 });
      return apiSuccess({ intent, message: text }, request);
    } catch (error) {
      return apiError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        error instanceof Error ? error.message.slice(0, 200) : 'Generation failed',
        request,
      );
    }
  }

  // respond-stream: OpenAI-style SSE (data: {"text"} … data: [DONE]).
  // GLM first; Nemotron only when GLM fails before any visible text.
  const client = createCloudflareClient({ ai: cfConfig.ai, gatewayId: cfConfig.gatewayId });
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      const models = ['@cf/zai-org/glm-4.7-flash', '@cf/nvidia/nemotron-3-120b-a12b'];
      let emittedText = false;
      try {
        for (const model of models) {
          try {
            for await (const chunk of client.stream(model, messages, {
              maxTokens: 800,
              temperature: 0.7,
              timeoutMs: 60000,
            })) {
              if (chunk.text) {
                emittedText = true;
                send(JSON.stringify({ intent, text: chunk.text }));
              }
            }
            break;
          } catch (error) {
            if (emittedText) throw error;
            if (model === models[models.length - 1]) throw error;
          }
        }
        send('[DONE]');
      } catch (error) {
        send(JSON.stringify({ error: error instanceof Error ? error.message.slice(0, 200) : 'Generation failed' }));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
