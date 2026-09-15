/**
 * Generic Assessment Analysis Handler
 *
 * Handles POST /api/assessment/analyze
 * Routes to grade-level-specific analysis logic based on gradeLevel parameter
 *
 * Supported Grade Levels:
 * - middle: Grades 6-8 (RIASEC + Strengths + Learning Prefs + Adaptive) ✅
 * - highschool: Grades 9-10 (RIASEC + Strengths + Learning Prefs + Adaptive + Career Exploration) ✅
 * - higher_secondary: Grades 11-12 (RIASEC + Strengths + Adaptive + College Prep) ✅
 * - after10: Post 10th std (RIASEC + Strengths + Vocational Focus) ✅
 * - after12: Post 12th std (RIASEC + Strengths + Career Entry/College Decision) ✅
 * - college: College/Higher ed (5-component scoring + Big Five + Values + Knowledge) ✅
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { AnalyzeRequest } from '../types';
import { analyzeHighSchool } from '../services/analyzers/analysis-highschool';
import { analyzeHigherSecondary } from '../services/analyzers/analysis-higher-secondary';
import { analyzeAfter10 } from '../services/analyzers/analysis-after10';
import { analyzeAfter12 } from '../services/analyzers/analysis-after12';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

export async function analyzeHandler(context: AuthenticatedContext) {
  const user = ((context as unknown) as { data: { user: { sub: string } } }).data.user;
  const env = ((context as unknown) as { env: Record<string, string> }).env;
  const request = ((context as unknown) as { request: Request }).request;
  const supabase = getServiceClient(env as unknown as Record<string, string>);

  try {
    const body = (await request.json()) as AnalyzeRequest;
    let { attemptId, gradeLevel } = body;

    if (!attemptId) {
      return Response.json({ error: 'attemptId required' }, { status: 400 });
    }

    // Step 0: Get learner ID and user ID from user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id, user_id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const learnerId = learnerData.id;
    const userId = learnerData.user_id;

    // If gradeLevel not provided, fetch it from attempt
    if (!gradeLevel) {
      const { data: attempt } = await supabase
        .from('personal_assessment_attempts')
        .select('grade_level')
        .eq('id', attemptId)
        .eq('learner_id', learnerId)
        .single();

      if (!attempt) {
        return Response.json({ error: 'Attempt not found' }, { status: 404 });
      }

      gradeLevel = attempt.grade_level;
    }

    // Validate grade level (from database constraints)
    const supportedGradeLevels = ['middle', 'highschool', 'higher_secondary', 'after10', 'after12', 'college'];
    if (!supportedGradeLevels.includes(gradeLevel)) {
      return Response.json(
        {
          error: `Unsupported grade level: ${gradeLevel}`,
          supported: supportedGradeLevels,
        },
        { status: 400 }
      );
    }

    // RPC cutover 2026-09-15: middle + college (with matching) via ai-worker
    // AnalysisWorkflow. Other grades remain legacy (DEPRECATED path). Frontend
    // contract preserved: { success: true } on 200; durable jobs are awaited
    // synchronously up to ~60s, else 202 with job reference for polling.
    if (gradeLevel === 'middle' || gradeLevel === 'college') {
      try {
        const result = await callAnalyzeWorker(env, user.sub, { attemptId, gradeLevel });
        if (!result.ok) {
          const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
          return Response.json({ error: result.message, code: result.code }, { status });
        }
        // Durable job: await until terminal or timeout, preserving 200 success
        if (result.job) {
          const terminal = await pollAnalyzeJob(env, user.sub, result.job.executionId, result.job.operationId, 60000);
          if (terminal.state === 'completed') return Response.json({ success: true }, { status: 200 });
          if (terminal.state === 'failed') {
            return Response.json({ error: terminal.error?.message ?? 'Analysis failed', code: terminal.error?.code ?? 'INTERNAL_ERROR' }, { status: terminal.error?.code === 'INVALID_INPUT' ? 400 : 500 });
          }
          // Still queued/running after timeout → return 202 for frontend polling
          return Response.json({ success: true, job: { executionId: result.job.executionId, workflowId: result.job.workflowId, state: terminal.state } }, { status: 202 });
        }
        // Bounded (unlikely for analyze) → success
        return Response.json({ success: true }, { status: 200 });
      } catch (err) {
        const status = err instanceof Error && 'status' in err ? (err as { status?: number }).status ?? 500 : 500;
        const code = err instanceof Error && 'code' in err ? (err as { code?: string }).code : undefined;
        const message = err instanceof Error ? err.message : 'Analysis failed';
        // Map worker CODE prefix to http status if status was generic 500
        const mapped = status === 500 ? rpcErrorToHttpStatus(err as Error) : status;
        return Response.json({ error: message, ...(code ? { code } : {}) }, { status: mapped });
      }
    }

    // Legacy path for highschool/higher_secondary/after10/after12 (DEPRECATED)
    switch (gradeLevel) {
      case 'highschool':
        return analyzeHighSchool(context, supabase, attemptId, learnerId);

      case 'higher_secondary':
        return analyzeHigherSecondary(context, supabase, attemptId, learnerId);

      case 'after10':
        return analyzeAfter10(context, supabase, attemptId, learnerId);

      case 'after12':
        return analyzeAfter12(context, supabase, attemptId, learnerId);

      default:
        return Response.json(
          { error: `Unknown grade level: ${gradeLevel}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

type AnalyzeRpcRequest = Extract<EducatorRequest, { feature: 'analyze' }>;

async function callAnalyzeWorker(
  env: Record<string, string>,
  userId: string,
  input: { attemptId: string; gradeLevel: string },
): Promise<{ ok: true; job?: { executionId: string; workflowId: string; operationId: string }; data?: unknown } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.analyze',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const operationId = crypto.randomUUID();
  const request: AnalyzeRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId,
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'analyze',
    input: { attemptId: input.attemptId, gradeLevel: input.gradeLevel as 'middle' | 'college' },
  };
  const result = await worker.seniorEducator(request) as unknown as { executionId?: string; workflowId?: string; state?: string; ok?: boolean; error?: { code: string; message: string }; data?: unknown; duplicate?: boolean };
  if (result && typeof result === 'object' && 'duplicate' in result) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result && typeof result === 'object' && 'state' in result && (result as { state: string }).state === 'queued') {
    const job = result as { executionId: string; workflowId: string; state: string };
    return { ok: true, job: { executionId: job.executionId, workflowId: job.workflowId, operationId } };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for analyze');
  if (result && typeof result === 'object' && 'ok' in result) {
    const r = result as { ok: boolean; error?: { code: string; message: string }; data?: unknown };
    if (!r.ok) return { ok: false, code: r.error?.code ?? 'INTERNAL_ERROR', message: r.error?.message ?? 'failed' };
    return { ok: true, data: r.data };
  }
  // Fallback: treat as job
  if (result && typeof result === 'object' && 'executionId' in result) {
    const job = result as { executionId: string; workflowId: string };
    return { ok: true, job: { executionId: job.executionId, workflowId: job.workflowId, operationId } };
  }
  return { ok: false, code: 'INTERNAL_ERROR', message: 'unexpected analyze response' };
}

async function pollAnalyzeJob(
  env: Record<string, string>,
  userId: string,
  executionId: string,
  operationId: string,
  timeoutMs: number,
): Promise<{ state: string; error?: { code: string; message: string } }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const start = Date.now();
  let delay = 1000;
  while (Date.now() - start < timeoutMs) {
    const assertion = await issueExecutionAssertion(secret, {
      issuer: 'skillpassport',
      action: 'execution.status',
      userId,
      product: 'skillpassport',
      entitlements: ['career_ai'],
    });
    const statusResult = await worker.getExecutionStatus({
      contractVersion: '1',
      requestId: crypto.randomUUID(),
      operationId,
      executionAssertion: assertion,
      actor: { actorId: userId, product: 'skillpassport' },
      input: { executionId },
    }) as unknown as { ok: boolean; data?: { state: string; error?: { code: string; message: string } }; error?: { code: string; message: string } };
    if (statusResult.ok && statusResult.data) {
      const state = statusResult.data.state;
      if (state === 'completed' || state === 'failed' || state === 'cancelled') return statusResult.data as { state: string; error?: { code: string; message: string } };
      // queued/running are expected intermediate states; continue polling
    } else if (!statusResult.ok && statusResult.error) {
      const code = statusResult.error.code;
      // Authorization/validation failures are not transient; surface immediately
      if (code === 'UNAUTHORIZED' || code === 'FEATURE_ACCESS_DENIED' || code === 'INVALID_INPUT') {
        return { state: 'failed', error: { code, message: statusResult.error.message } };
      }
      // Other errors (transient) are retried until timeout; log once per poll
      // and continue rather than incorrectly reporting 'running' on auth failure.
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 5000);
  }
  return { state: 'running' };
}