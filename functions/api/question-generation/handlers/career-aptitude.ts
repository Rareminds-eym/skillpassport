import { createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import { generateUUID } from '../../shared/ai-config';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type AptitudeRpcRequest = Extract<EducatorRequest, { feature: 'generate-aptitude' }>;

export interface AptitudePorts {
  supabase?: ReturnType<typeof createSupabaseAdminClient>;
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
 * Aptitude question generation handler — RPC cutover.
 *
 * Cut over 2026-09-12: 2-batch OpenRouter prompt, Levenshtein dedupe,
 * image filtering, refill logic deleted (worker owns categories,
 * STREAM_CONTEXTS, isAfter10 quirks, batch split, validation, refill).
 * Canonical-set pre-check + UUID stamping + get_or_create_shared_questions
 * RPC stay in Pages (DB-owned). Single deliberate difference: generation via
 * `seniorEducator({ feature: 'generate-aptitude' })`.
 */
export async function generateAptitudeQuestions(
    env: PagesEnv,
    streamId: string,
    questionsPerCategory: number = 5,
    learnerId?: string,
    attemptId?: string,
    gradeLevel?: string,
    userIdOrPorts?: string | AptitudePorts,
    maybePorts?: AptitudePorts,
) {
    let userId: string | undefined;
    let ports: AptitudePorts | undefined;
    if (typeof userIdOrPorts === 'string') {
        userId = userIdOrPorts;
        ports = maybePorts;
    } else if (userIdOrPorts && typeof userIdOrPorts === 'object') {
        ports = userIdOrPorts as AptitudePorts;
    }
    const p = ports ?? {};
    const effectiveUserId = userId ?? 'unknown';

    console.log('🧠 ============================================');
    console.log('🧠 APTITUDE QUESTION GENERATION STARTED');
    console.log('🧠 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Questions Per Category: ${questionsPerCategory}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Learner ID: ${learnerId || 'not specified'}`);
    console.log(`📋 Attempt ID: ${attemptId || 'not specified'}`);

    const supabase = p.supabase ?? createSupabaseAdminClient(env);

    // Canonical-set pre-check — preserved exactly
    if (gradeLevel) {
        const { data: existing } = await supabase
            .from('career_assessment_ai_questions')
            .select('questions')
            .eq('stream_id', streamId)
            .eq('grade_level', gradeLevel)
            .eq('question_type', 'aptitude')
            .eq('is_active', true)
            .is('learner_id', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if ((existing as { questions?: unknown[] } | null)?.questions) {
            console.log('♻️ Reusing existing canonical aptitude set - skipping AI generation');
            return (existing as { questions: unknown[] }).questions;
        }
    }

    const isAfter10 = gradeLevel === 'after10';
    console.log(`📚 Grade level detection: streamId=${streamId}, gradeLevel=${gradeLevel}, isAfter10=${isAfter10}`);

    // Worker generation (the single deliberate difference)
    const workerGradeLevel = gradeLevel ?? '';
    const result = p.callWorker
        ? await p.callWorker({ env: env as unknown as Record<string, unknown>, userId: effectiveUserId, streamId, gradeLevel: workerGradeLevel })
        : await callAptitudeWorker(env as unknown as Record<string, string>, effectiveUserId, { streamId, gradeLevel: workerGradeLevel });

    if (!result.ok) {
        const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
        const err: Error & { status?: number; code?: string } = new Error(`${result.code}: ${result.message}`);
        (err as { status?: number }).status = status;
        (err as { code?: string }).code = result.code;
        throw err;
    }

    const uniqueQuestions: unknown[] = (result.data as { questions: unknown[] }).questions;

    console.log('🧠 ============================================');

    // Use UUIDs for all question IDs (required for database consistency) — preserved
    const processedQuestions = (uniqueQuestions as Array<Record<string, unknown>>).map((q) => {
        const questionUuid = generateUUID();
        return {
            ...q,
            id: questionUuid,
            uuid: questionUuid,
            stream_id: streamId,
            grade_level: gradeLevel || 'general',
            created_at: new Date().toISOString()
        };
    });

    let questionsToReturn: unknown[] = processedQuestions;

    if (!gradeLevel) {
        console.warn('⚠️ No gradeLevel provided — skipping shared question set save');
    } else {
        const { data, error } = await supabase.rpc('get_or_create_shared_questions', {
            p_stream_id: streamId,
            p_grade_level: gradeLevel,
            p_question_type: 'aptitude',
            p_questions: processedQuestions,
            p_learner_id: learnerId || null
        });

        if (error) {
            console.error('❌ Database error saving shared aptitude questions:', error);
        } else if ((data as { questions?: unknown[] } | null)?.questions) {
            questionsToReturn = (data as { questions: unknown[] }).questions;
            console.log((data as { is_new?: boolean }).is_new
                ? '✅ New canonical aptitude set created'
                : '♻️ Reusing existing canonical aptitude set');
        }
    }

    console.log(`📦 Returning ${questionsToReturn.length} questions`);
    return questionsToReturn;
}

async function callAptitudeWorker(
  env: Record<string, string>,
  userId: string,
  input: { streamId: string; gradeLevel: string },
): Promise<{ ok: true; data: { streamId: string; gradeLevel: string; total_questions: number; questions: unknown[] } } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.generate-aptitude',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: AptitudeRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'generate-aptitude',
    input: {
      streamId: input.streamId,
      gradeLevel: input.gradeLevel,
    },
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for generate-aptitude');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as { streamId: string; gradeLevel: string; total_questions: number; questions: unknown[] } };
}
