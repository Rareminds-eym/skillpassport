import { createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import { generateUUID } from '../../shared/ai-config';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type KnowledgeRpcRequest = Extract<EducatorRequest, { feature: 'generate-knowledge' }>;

const STREAM_KNOWLEDGE_QUESTION_COUNT = 20;

export interface KnowledgePorts {
  supabase?: ReturnType<typeof createSupabaseAdminClient>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    streamId: string;
    streamName: string;
    topics: unknown;
    gradeLevel: string;
    isCollegeLearner: boolean;
  }) => Promise<
    | { ok: true; data: { streamId: string; streamName: string; gradeLevel: string; total_questions: number; questions: unknown[] } }
    | { ok: false; code: string; message: string }
  >;
}

/**
 * Knowledge question generation handler — RPC cutover.
 *
 * Cut over 2026-09-12: dynamic/static prompts (including marketDemandBlock
 * yearly logic), 1-vs-2 batch split, Levenshtein/image/refill deleted — worker
 * owns STREAM_KNOWLEDGE_QUESTION_COUNT=20 force, topics branch quirk (topics
 * never interpolated, [] static), yearly 40% market block, 2×10 vs 1×20
 * split, validation/refill. Canonical pre-check + UUID stamping +
 * get_or_create_shared_questions stay in Pages. Single difference: generation
 * via `seniorEducator({ feature: 'generate-knowledge' })`.
 */
export async function generateKnowledgeQuestions(
    env: PagesEnv,
    streamId: string,
    streamName: string,
    topics: string[] | string | null,
    questionCount: number = STREAM_KNOWLEDGE_QUESTION_COUNT,
    learnerId?: string,
    attemptId?: string,
    gradeLevel?: string,
    isCollegeLearner?: boolean,
    userIdOrPorts?: string | KnowledgePorts,
    maybePorts?: KnowledgePorts,
) {
    let userId: string | undefined;
    let ports: KnowledgePorts | undefined;
    if (typeof userIdOrPorts === 'string') {
        userId = userIdOrPorts;
        ports = maybePorts;
    } else if (userIdOrPorts && typeof userIdOrPorts === 'object') {
        ports = userIdOrPorts as KnowledgePorts;
    }
    const p = ports ?? {};
    const effectiveUserId = userId ?? 'unknown';

    const requestedQuestionCount = questionCount;
    questionCount = STREAM_KNOWLEDGE_QUESTION_COUNT;
    if (requestedQuestionCount !== questionCount) {
        console.log(`[Knowledge] Requested question count ignored: ${requestedQuestionCount}; using ${questionCount}`);
    }

    console.log('🎓 ============================================');
    console.log('🎓 KNOWLEDGE QUESTION GENERATION STARTED');
    console.log('🎓 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Stream Name: ${streamName}`);
    console.log(`📋 Topics: ${topics ? (Array.isArray(topics) ? topics.join(', ') : topics) : 'AI will determine dynamically'}`);
    console.log(`📋 Question Count: ${questionCount}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Is College Learner: ${isCollegeLearner || false}`);
    console.log(`📋 Learner ID: ${learnerId || 'not specified'}`);
    console.log(`📋 Attempt ID: ${attemptId || 'not specified'}`);

    const supabase = p.supabase ?? createSupabaseAdminClient(env);

    if (gradeLevel) {
        const { data: existing } = await supabase
            .from('career_assessment_ai_questions')
            .select('questions')
            .eq('stream_id', streamId)
            .eq('grade_level', gradeLevel)
            .eq('question_type', 'knowledge')
            .eq('is_active', true)
            .is('learner_id', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if ((existing as { questions?: unknown[] } | null)?.questions) {
            console.log('♻️ Reusing existing canonical knowledge set - skipping AI generation');
            return (existing as { questions: unknown[] }).questions;
        }
    }

    const usesDynamicTopics = isCollegeLearner || gradeLevel === 'higher_secondary';
    console.log(`📝 Knowledge usesDynamicTopics: ${usesDynamicTopics}`);

    const workerIsCollegeLearner = Boolean(isCollegeLearner);
    const workerTopics = topics ?? null;
    const workerGradeLevel = gradeLevel ?? '';

    const result = p.callWorker
        ? await p.callWorker({ env: env as unknown as Record<string, unknown>, userId: effectiveUserId, streamId, streamName, topics: workerTopics, gradeLevel: workerGradeLevel, isCollegeLearner: workerIsCollegeLearner })
        : await callKnowledgeWorker(env as unknown as Record<string, string>, effectiveUserId, { streamId, streamName, topics: workerTopics, gradeLevel: workerGradeLevel, isCollegeLearner: workerIsCollegeLearner });

    if (!result.ok) {
        const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
        const err: Error & { status?: number; code?: string } = new Error(`${result.code}: ${result.message}`);
        (err as { status?: number }).status = status;
        (err as { code?: string }).code = result.code;
        throw err;
    }

    const uniqueQuestions: unknown[] = (result.data as { questions: unknown[] }).questions;

    console.log('🎓 ============================================');

    const processedQuestions = (uniqueQuestions as Array<Record<string, unknown>>).map((q) => {
        const questionUuid = generateUUID();
        return {
            ...q,
            id: questionUuid,
            uuid: questionUuid,
            stream_id: streamId,
            stream_name: streamName,
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
            p_question_type: 'knowledge',
            p_questions: processedQuestions,
            p_learner_id: learnerId || null
        });

        if (error) {
            console.error('❌ Database error saving shared knowledge questions:', error);
        } else if ((data as { questions?: unknown[] } | null)?.questions) {
            questionsToReturn = (data as { questions: unknown[] }).questions;
            console.log((data as { is_new?: boolean }).is_new
                ? '✅ New canonical knowledge set created'
                : '♻️ Reusing existing canonical knowledge set');
        }
    }

    console.log(`📦 Returning ${questionsToReturn.length} questions`);
    return questionsToReturn;
}

async function callKnowledgeWorker(
  env: Record<string, string>,
  userId: string,
  input: { streamId: string; streamName: string; topics: unknown; gradeLevel: string; isCollegeLearner: boolean },
): Promise<{ ok: true; data: { streamId: string; streamName: string; gradeLevel: string; total_questions: number; questions: unknown[] } } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.generate-knowledge',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: KnowledgeRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'generate-knowledge',
    input: {
      streamId: input.streamId,
      streamName: input.streamName,
      topics: input.topics as KnowledgeRpcRequest['input']['topics'],
      gradeLevel: input.gradeLevel,
      isCollegeLearner: input.isCollegeLearner,
    },
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for generate-knowledge');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as { streamId: string; streamName: string; gradeLevel: string; total_questions: number; questions: unknown[] } };
}
