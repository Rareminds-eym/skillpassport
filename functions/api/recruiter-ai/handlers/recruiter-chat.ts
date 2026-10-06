/**
 * Recruiter copilot LLM ops handler (server-side model calls only).
 *
 * Scoped ops mirroring the browser engine's provider touchpoints:
 * - classify-llm: layer-3 semantic classification (layers 1-2 + enrichment
 *   stay browser-side; unchanged orchestration).
 * - parse: structured query parsing; raw text returned so the browser keeps
 *   its JSON-merge/defaults/fallback behavior byte-identical.
 * - analyze: hiring-recommendations / hiring-decision analysis over
 *   application-assembled candidate text (fixed 1000-token allowance).
 * - respond / respond-stream: general prompts (500 / 800 allowances).
 *
 * Models and budgets are server-fixed (GLM → Nemotron). Data fetching,
 * RLS, orchestration and enrichment stay browser-side untouched.
 */
import { apiError, apiSuccess } from '../../../lib/response';
import { callCloudflareWithRetry, getCloudflareConfig } from '../../shared/ai-config';
import { createCloudflareClient } from '../../shared/cloudflare-ai';
import { buildLayer3ClassifyPrompt, buildParsePrompt, parseLayer3Result } from '../lib/recruiter-prompts';

const MAX_QUERY = 2000;
const MAX_PROMPT = 12000;
const MAX_HISTORY_ITEMS = 6;

type AnalyzeKind = 'hiring-recommendations' | 'hiring-decision';

function asHistory(value: unknown): Array<{ query?: string; intent?: string }> {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_HISTORY_ITEMS).filter(
    (h): h is { query?: string; intent?: string } => typeof h === 'object' && h !== null,
  );
}

export async function handleRecruiterCopilotChat(env: unknown, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const op = body.op as string;
  const validOps = ['classify-llm', 'parse', 'analyze', 'respond', 'respond-stream'];
  if (!validOps.includes(op)) {
    return apiError(400, 'VALIDATION_ERROR', 'op must be classify-llm, parse, analyze, respond or respond-stream', request);
  }

  const cfConfig = getCloudflareConfig(env);
  if (!cfConfig) {
    return apiError(500, 'INTERNAL_ERROR', 'Cloudflare AI binding not configured', request);
  }

  if (op === 'classify-llm') {
    const query = typeof body.query === 'string' ? body.query.slice(0, MAX_QUERY) : '';
    if (!query.trim()) return apiError(400, 'VALIDATION_ERROR', 'query is required', request);
    try {
      const { system, user } = buildLayer3ClassifyPrompt(query, asHistory(body.history));
      const raw = await callCloudflareWithRetry(
        env,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { maxTokens: 150, temperature: 0.2 },
      );
      const result = parseLayer3Result(raw);
      return apiSuccess({ primary: result.primary, confidence: result.confidence, secondaryIntents: [] }, request);
    } catch (error) {
      return apiError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        error instanceof Error ? error.message.slice(0, 200) : 'Classification failed',
        request,
      );
    }
  }

  if (op === 'parse') {
    const query = typeof body.query === 'string' ? body.query.slice(0, MAX_QUERY) : '';
    if (!query.trim()) return apiError(400, 'VALIDATION_ERROR', 'query is required', request);
    try {
      const { system, user } = buildParsePrompt(query);
      const text = await callCloudflareWithRetry(
        env,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        { maxTokens: 800, temperature: 0.2 },
      );
      return apiSuccess({ text }, request);
    } catch (error) {
      return apiError(
        502,
        'DEPENDENCY_UNAVAILABLE',
        error instanceof Error ? error.message.slice(0, 200) : 'Parse failed',
        request,
      );
    }
  }

  // analyze / respond / respond-stream: application-assembled prompts, bounded.
  const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, MAX_PROMPT) : '';
  if (!prompt.trim()) return apiError(400, 'VALIDATION_ERROR', 'prompt is required', request);
  if (op === 'analyze') {
    const kind = body.kind as AnalyzeKind;
    if (kind !== 'hiring-recommendations' && kind !== 'hiring-decision') {
      return apiError(400, 'VALIDATION_ERROR', 'kind must be hiring-recommendations or hiring-decision', request);
    }
  }

  const allowance = op === 'analyze' ? 1000 : op === 'respond' ? 500 : 800;
  const messages = [{ role: 'user' as const, content: prompt }];

  if (op !== 'respond-stream') {
    try {
      const text = await callCloudflareWithRetry(env, messages, { maxTokens: allowance, temperature: 0.7 });
      return apiSuccess({ message: text }, request);
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
              maxTokens: allowance,
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
