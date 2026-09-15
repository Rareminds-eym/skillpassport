/**
 * Streaming Aptitude Question Generation Handler — RPC cutover.
 *
 * Cut over 2026-09-12: 2-batch OpenRouter prompt, image/duplicate
 * validation, per-question UUID stamping deleted (worker owns categories,
 * STREAM_CONTEXTS, batch split, filter, sequential IDs). Stream
 * validation via `personal_assessment_streams` + grade reconcile + SSE
 * framing (`progress`/`question`/`complete`/`warning`/`error`) +
 * get_or_create_shared_questions race warning preserved exactly.
 */

import { createSupabaseClient, createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import { apiError } from '../../../lib/response';
import { generateUUID } from '../../shared/ai-config';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type StreamRpcRequest = Extract<EducatorRequest, { feature: 'generate-aptitude-stream' }>;

export interface StreamingPorts {
  adminSupabase?: ReturnType<typeof createSupabaseAdminClient>;
  supabase?: ReturnType<typeof createSupabaseClient>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    streamId: string;
    gradeLevel: string;
  }) => Promise<
    | { ok: true; data: { streamId: string; gradeLevel: string; total_questions: number; questions: unknown[] } }
    | { ok: false; code: string; message: string }
  >;
}

/**
 * Handle streaming aptitude question generation
 * Sends questions via Server-Sent Events as they're generated
 */
export async function handleStreamingAptitude(
    request: Request,
    env: PagesEnv,
    context?: AuthenticatedContext,
    ports: StreamingPorts = {},
): Promise<Response> {
    if (request.method !== 'POST') {
        return apiError(405, 'ERROR', 'Method not allowed', request);
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
    }

    const { streamId, learnerId, gradeLevel: requestedGradeLevel } = body as { streamId?: string; learnerId?: string; gradeLevel?: string; attemptId?: unknown };

    if (!streamId) {
        return apiError(400, 'VALIDATION_ERROR', 'Stream ID is required', request);
    }

    // Stream validation via personal_assessment_streams — preserved
    const adminSupabase = ports.adminSupabase ?? createSupabaseAdminClient(env);
    const { data: streamRow } = await adminSupabase
        .from('personal_assessment_streams')
        .select('id, grade_level')
        .eq('id', streamId)
        .eq('is_active', true)
        .maybeSingle();

    if (!streamRow) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid streamId', request);
    }
    const gradeLevel = (streamRow as { grade_level: string }).grade_level;
    if (requestedGradeLevel !== gradeLevel) {
        console.log(`ℹ️ gradeLevel reconciled to stream catalog value: requested=${requestedGradeLevel}, effective=${gradeLevel}`);
    }

    // Derive userId for assertion
    let userId = 'unknown';
    if (context) {
        try {
            userId = getContextUser(context).id;
        } catch {
            userId = 'unknown';
        }
    }
    if (userId === 'unknown') {
        userId = request.headers.get('x-user-id') || 'unknown';
    }

    const supabase = ports.supabase ?? createSupabaseClient(env);
    const totalQuestions = 50;

    console.log(`📡 Starting streaming generation: streamId=${streamId}, gradeLevel=${gradeLevel}, total=${totalQuestions}`);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'progress',
                    message: 'Starting question generation...',
                    count: 0,
                    total: totalQuestions
                })}\n\n`));

                // Worker generation (the single deliberate difference)
                const result = ports.callWorker
                    ? await ports.callWorker({ env: env as unknown as Record<string, unknown>, userId, streamId, gradeLevel })
                    : await callStreamWorker(env as unknown as Record<string, string>, userId, { streamId, gradeLevel });

                if (!result.ok) {
                    const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
                    // Map entitlement/rate denials to client errors; transient worker errors to stream error event
                    if (status === 403 || status === 401 || status === 429 || status === 409) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'error',
                            message: result.message.slice(0, 500)
                        })}\n\n`));
                        controller.close();
                        return;
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        message: result.message.slice(0, 500)
                    })}\n\n`));
                    controller.close();
                    return;
                }

                const workerQuestions = (result.data as { questions: unknown[] }).questions;

                // Stamp UUIDs (DB-uniqueness shape preserved) + grade context
                const allGeneratedQuestions: Array<Record<string, unknown>> = (workerQuestions as Array<Record<string, unknown>>).map((q) => ({
                    id: generateUUID(),
                    ...(q as Record<string, unknown>),
                    stream_id: streamId,
                    grade_level: gradeLevel || 'general',
                    created_at: new Date().toISOString()
                }));

                // Stream each question individually — preserved
                let count = 0;
                for (const processedQuestion of allGeneratedQuestions) {
                    count += 1;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'question',
                        data: processedQuestion,
                        count,
                        total: totalQuestions
                    })}\n\n`));
                }

                console.log(`✅ Generation complete: ${allGeneratedQuestions.length} questions streamed`);

                // Shared canonical save — preserved
                if (gradeLevel) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        message: 'Saving questions to database...',
                        count: allGeneratedQuestions.length,
                        total: totalQuestions
                    })}\n\n`));

                    const { data, error } = await supabase.rpc('get_or_create_shared_questions', {
                        p_stream_id: streamId,
                        p_grade_level: gradeLevel,
                        p_question_type: 'aptitude',
                        p_questions: allGeneratedQuestions,
                        p_learner_id: learnerId || null
                    });

                    if (error) {
                        console.error('❌ Database error:', error);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'warning',
                            message: 'Questions generated but not saved to database'
                        })}\n\n`));
                    } else if (data && (data as { is_new?: boolean }).is_new === false) {
                        console.log('♻️ Another request already created the canonical aptitude set for this combination - streamed questions were not persisted');
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'warning',
                            message: 'A shared question set for this stream and grade already exists — the questions just streamed were not saved as canonical. Please refresh to load the existing set.'
                        })}\n\n`));
                    } else {
                        console.log('✅ New canonical aptitude set created');
                    }
                } else {
                    console.warn('⚠️ No gradeLevel provided — skipping shared question set save');
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'complete',
                    message: 'All questions generated successfully',
                    count: allGeneratedQuestions.length,
                    total: totalQuestions
                })}\n\n`));

                console.log(`✅ Streaming complete: ${allGeneratedQuestions.length} questions sent`);
                controller.close();

            } catch (error: unknown) {
                console.error('❌ Streaming error:', error);
                const message = error instanceof Error ? error.message : 'Failed to generate questions';
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    message
                })}\n\n`));
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
}

async function callStreamWorker(
  env: Record<string, string>,
  userId: string,
  input: { streamId: string; gradeLevel: string },
): Promise<{ ok: true; data: { streamId: string; gradeLevel: string; total_questions: number; questions: unknown[] } } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.generate-aptitude-stream',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: StreamRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'generate-aptitude-stream',
    input: {
      streamId: input.streamId,
      gradeLevel: input.gradeLevel,
    },
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for generate-aptitude-stream');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as { streamId: string; gradeLevel: string; total_questions: number; questions: unknown[] } };
}
