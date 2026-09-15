/**
 * Generate Field Keywords Handler - domain keywords via the AI worker (RPC cutover).
 *
 * Cut over 2026-09-12: the direct-OpenRouter implementation was replaced by
 * `careerTalentStrategist({ feature: 'keywords' })`. Guards, rate limiting
 * and the response shape are preserved exactly; the worker returns a typed
 * `string[]` which this adapter rejoins to the legacy comma string.
 *
 * Migrated from: cloudflare-workers/career-api/src/index.ts (handleGenerateFieldKeywords)
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { getModelForUseCase } from '../../shared/ai-config';
import { checkRateLimit } from '../utils/rate-limit';
import type { CareerRequest } from '@rareminds-eym/ai-protocol';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';

type KeywordsRpcRequest = Extract<CareerRequest, { feature: 'keywords' }>;
import { issueExecutionAssertion } from '../../ai/lib/assertion';

export interface KeywordsPorts {
  checkRateLimit?: (userId: string, env: Record<string, string>) => Promise<boolean>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    field: string;
  }) => Promise<{ ok: true; keywords: string[] } | { ok: false; code: string; message: string }>;
}

export async function handleGenerateFieldKeywords(
  request: Request,
  env: Record<string, string>,
  userId: string,
  ports: KeywordsPorts = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  // Security: Rate limiting to prevent API abuse
  const allowed = ports.checkRateLimit
    ? await ports.checkRateLimit(userId, env)
    : await checkRateLimit(userId, env);
  if (!allowed) {
    return apiError(429, 'ERROR', 'Rate limit exceeded. Please try again later.', request);
  }

  let body: { field: string };
  try {
    body = (await request.json()) as { field: string };
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
  }

  const { field } = body;

  if (!field || typeof field !== 'string' || field.trim().length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'Field is required', request);
  }

  const fieldTrimmed = field.trim();

  try {
    console.log(`[Field Keywords] Generating for: "${fieldTrimmed}"`);

    const result = ports.callWorker
      ? await ports.callWorker({ env: env as unknown as Record<string, unknown>, userId, field: fieldTrimmed })
      : await callKeywordsWorker(env, userId, fieldTrimmed);

    if (!result.ok) {
      const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
      return apiError(status, result.code, result.message.slice(0, 500), request);
    }

    const keywords = result.keywords.join(', ');
    console.log(`[Field Keywords] ✓ Generated for "${fieldTrimmed}": ${keywords}`);

    return apiSuccess(
      {
        field: fieldTrimmed,
        keywords,
        source: 'ai',
        model: getModelForUseCase('keyword_generation'),
      },
      request,
    );
  } catch (error) {
    console.error(`[Field Keywords] Error for "${fieldTrimmed}":`, error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('binding is not configured') || message.includes('AI_ASSERT_SECRET')) {
      return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'AI service not configured', request);
    }
    return apiError(500, 'INTERNAL_ERROR', message.slice(0, 500), request);
  }
}

async function callKeywordsWorker(
  env: Record<string, string>,
  userId: string,
  field: string,
): Promise<{ ok: true; keywords: string[] } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'careerTalentStrategist.keywords',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: KeywordsRpcRequest = {
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
    feature: 'keywords',
    input: { field },
  };
  const result = await worker.careerTalentStrategist(request);
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for keywords');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, keywords: result.data.keywords };
}
