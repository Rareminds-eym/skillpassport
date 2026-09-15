/**
 * AI execution status/cancel handlers (dormant — no callers yet).
 *
 * Ownership-protected adapters over the worker `getExecutionStatus` /
 * `cancelExecution` RPCs. Pages authenticates (route wrapper), checks the
 * `career_ai` entitlement BEFORE minting, then mints a short-lived
 * action-bound assertion (`execution.status` / `execution.cancel`). The
 * worker re-enforces owner + entitlement; a Pages 403 here simply avoids
 * a doomed worker call.
 *
 * First caller (analysis polling UI) is a separately gated cutover.
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';
import { hasFeatureEntitlement } from '../../../lib/entitlements';
import type { ExecutionStatus } from '@rareminds-eym/ai-protocol';
import {
  getAiWorker,
  rpcErrorToHttpStatus,
  type AiServiceEnv,
} from '../lib/aiBinding';
import { issueExecutionAssertion } from '../lib/assertion';

const EXECUTION_ID_MAX = 128;

export interface ExecutionPorts {
  /** Fail-closed entitlement predicate. Defaults to the live `career_ai` check. */
  checkEntitlement?: (userId: string) => Promise<boolean>;
}

interface ExecutionEnv extends AiServiceEnv {
  AI_ASSERT_SECRET?: string;
  [key: string]: unknown;
}

function invalidId(request: Request): Response {
  return apiError(400, 'VALIDATION_ERROR', 'Valid execution id is required', request);
}

async function entitled(
  env: ExecutionEnv,
  userId: string,
  ports: ExecutionPorts,
): Promise<boolean> {
  if (ports.checkEntitlement) return ports.checkEntitlement(userId);
  const supabase = getServiceClient(env as never);
  return hasFeatureEntitlement(supabase, userId, 'career_ai');
}

async function mint(
  env: ExecutionEnv,
  action: 'execution.status' | 'execution.cancel',
  userId: string,
): Promise<string> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  return issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action,
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
}

function failure(request: Request, error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('binding is not configured')) {
    return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'AI service not configured', request);
  }
  if (message.includes('AI_ASSERT_SECRET')) {
    return apiError(500, 'INTERNAL_ERROR', 'AI service not configured', request);
  }
  const status = rpcErrorToHttpStatus(error);
  const code = message.split(':')[0] || 'INTERNAL_ERROR';
  return apiError(status, code, message.slice(0, 500), request);
}

async function callWorker(
  request: Request,
  env: ExecutionEnv,
  userId: string,
  executionId: string,
  mode: 'status' | 'cancel',
  ports: ExecutionPorts,
): Promise<Response> {
  if (!executionId || typeof executionId !== 'string' || executionId.length > EXECUTION_ID_MAX) {
    return invalidId(request);
  }
  try {
    if (!(await entitled(env, userId, ports))) {
      return apiError(403, 'FEATURE_ACCESS_DENIED', 'Career AI requires an active subscription or Career AI add-on.', request);
    }
    // Binding check first: an unwired environment reports 503 even when the
    // secret is also absent (deterministic local-dev diagnosis).
    const worker = getAiWorker(env);
    const assertion = await mint(env, mode === 'status' ? 'execution.status' : 'execution.cancel', userId);
    const call =
      mode === 'status' ? worker.getExecutionStatus : worker.cancelExecution;
    const result = await call({
      contractVersion: '1',
      requestId: crypto.randomUUID(),
      operationId: `${mode === 'status' ? 'st' : 'cx'}-${executionId}`,
      executionAssertion: assertion,
      actor: { actorId: userId, product: 'skillpassport' },
      input: { executionId },
    });
    if (!result.ok) return failure(request, new Error(`${result.error.code}: ${result.error.message}`));
    const data = result.data as ExecutionStatus;
    return apiSuccess(data, request);
  } catch (error) {
    return failure(request, error);
  }
}

export async function handleGetExecutionStatus(
  request: Request,
  env: ExecutionEnv,
  userId: string,
  executionId: string,
  ports: ExecutionPorts = {},
): Promise<Response> {
  return callWorker(request, env, userId, executionId, 'status', ports);
}

export async function handleCancelExecution(
  request: Request,
  env: ExecutionEnv,
  userId: string,
  executionId: string,
  ports: ExecutionPorts = {},
): Promise<Response> {
  return callWorker(request, env, userId, executionId, 'cancel', ports);
}
