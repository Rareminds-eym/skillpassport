/**
 * Counselling chat handler (server-side LLM ops for CounsellingChat UI).
 *
 * Scoped ops: chat / chat-stream (1000 tokens, 0.7) and summarize (200
 * tokens, 0.5). Topic-gated system prompts, bounded history and sanitized
 * learner context. No arbitrary models/budgets.
 */
import { apiError, apiSuccess } from '../../../lib/response';
import { callCloudflareWithRetry, getCloudflareConfig } from '../../shared/ai-config';
import { createCloudflareClient } from '../../shared/cloudflare-ai';
import {
  buildlearnerContextPrompt,
  parseTopic,
  sanitizeLearnerContext,
  systemPromptFor,
} from '../lib/counselling-prompts';

const MAX_MESSAGE = 2000;
const MAX_HISTORY = 10;

function asHistory(value: unknown): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is { role: string; content: string } =>
        typeof m === 'object' &&
        m !== null &&
        ((m as { role: string }).role === 'user' ||
          (m as { role: string }).role === 'assistant' ||
          (m as { role: string }).role === 'system') &&
        typeof (m as { content: string }).content === 'string',
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content.slice(0, MAX_MESSAGE),
    }));
}

export async function handleCounsellingChat(env: unknown, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const op = body.op as string;
  if (op !== 'chat' && op !== 'chat-stream' && op !== 'summarize') {
    return apiError(400, 'VALIDATION_ERROR', 'op must be chat, chat-stream or summarize', request);
  }

  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    return apiError(500, 'INTERNAL_ERROR', 'Cloudflare AI binding not configured', request);
  }

  if (op === 'summarize') {
    const conversation = asHistory(body.messages)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n')
      .slice(0, 8000);
    if (!conversation.trim()) return apiError(400, 'VALIDATION_ERROR', 'messages are required', request);
    try {
      const topic = parseTopic(body.topic);
      const text = await callCloudflareWithRetry(
        env,
        [
          {
            role: 'system',
            content: `You are an assistant that creates concise summaries of counselling sessions.
          Create a brief summary (3-4 sentences) highlighting key topics discussed, advice given, and any action items.`,
          },
          { role: 'user', content: `Summarize this ${topic} counselling session:\n\n${conversation}` },
        ],
        { maxTokens: 200, temperature: 0.5 },
      );
      return apiSuccess({ summary: text }, request);
    } catch (error) {
      return apiError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        error instanceof Error ? error.message.slice(0, 200) : 'Summary failed',
        request,
      );
    }
  }

  const topic = parseTopic(body.topic);
  const message = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE) : '';
  if (!message.trim()) return apiError(400, 'VALIDATION_ERROR', 'message is required', request);
  const contextPrompt = buildlearnerContextPrompt(sanitizeLearnerContext(body.learner_context));
  const messages = [
    { role: 'system' as const, content: systemPromptFor(topic) + contextPrompt },
    ...asHistory(body.history),
    { role: 'user' as const, content: message },
  ];

  if (op === 'chat') {
    try {
      const text = await callCloudflareWithRetry(env, messages, { maxTokens: 1000, temperature: 0.7 });
      return apiSuccess({ message: text || '' }, request);
    } catch (error) {
      return apiError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        error instanceof Error ? error.message.slice(0, 200) : 'Generation failed',
        request,
      );
    }
  }

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
              maxTokens: 1000,
              temperature: 0.7,
              timeoutMs: 60000,
            })) {
              if (chunk.text) {
                emittedText = true;
                send(JSON.stringify({ text: chunk.text }));
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
