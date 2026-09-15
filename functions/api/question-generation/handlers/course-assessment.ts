import { createSupabaseClient } from '../../../lib/supabase';
import type { PagesEnv } from '../../../lib/types';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type CourseRpcRequest = Extract<EducatorRequest, { feature: 'generate-course' }>;

export interface CourseAssessmentPorts {
  supabase?: ReturnType<typeof createSupabaseClient>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    courseName: string;
    level: string;
    questionCount: number;
  }) => Promise<
    | { ok: true; data: { course: string; level: string; total_questions: number; questions: unknown[] } }
    | { ok: false; code: string; message: string }
  >;
}

/**
 * Course assessment generation handler with database caching — RPC cutover.
 *
 * Cut over 2026-09-12: OpenRouter prompt/retry + repair/parse + strict
 * validation + shuffle deleted (worker owns prompt, scaled maxTokens, filter,
 * repair, shuffle, sequential IDs). Cache check + insert stay in Pages
 * (DB-owned). Single deliberate difference: generation via
 * `seniorEducator({ feature: 'generate-course' })`.
 */
export async function generateAssessment(
    env: PagesEnv,
    courseName: string,
    level: string,
    questionCount: number = 10,
    userIdOrPorts?: string | CourseAssessmentPorts,
    maybePorts?: CourseAssessmentPorts,
) {
    let userId: string | undefined;
    let ports: CourseAssessmentPorts | undefined;
    if (typeof userIdOrPorts === 'string') {
        userId = userIdOrPorts;
        ports = maybePorts;
    } else if (userIdOrPorts && typeof userIdOrPorts === 'object') {
        ports = userIdOrPorts as CourseAssessmentPorts;
    }
    const p = ports ?? {};
    const supabase = p.supabase ?? createSupabaseClient(env);

    // Check cache first — preserved exactly
    try {
        const { data: existing, error: cacheError } = await supabase
            .from('generated_external_assessment')
            .select('*')
            .eq('certificate_name', courseName)
            .eq('assessment_level', level)
            .single();

        if (!cacheError && existing) {
            const cachedQuestions = Array.isArray((existing as { questions?: unknown[] }).questions) ? (existing as { questions: unknown[] }).questions : [];
            console.log(`✅ Returning cached questions for: ${courseName} (${level})`);
            return {
                course: courseName,
                level: (existing as { assessment_level: string }).assessment_level,
                total_questions: cachedQuestions.length,
                questions: cachedQuestions,
                cached: true
            };
        }
    } catch (dbError: unknown) {
        console.warn('⚠️ Database cache check failed, will generate new questions:', (dbError as Error).message);
    }

    console.log(`📝 Generating new questions for: ${courseName} (${level})`);

    const effectiveUserId = userId ?? 'unknown';

    // Worker call (the single deliberate difference)
    const result = p.callWorker
        ? await p.callWorker({ env: env as unknown as Record<string, unknown>, userId: effectiveUserId, courseName, level, questionCount })
        : await callCourseWorker(env as unknown as Record<string, string>, effectiveUserId, { courseName, level, questionCount });

    if (!result.ok) {
        // Preserve router's 500 mapping but surface correct code for tests
        const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
        const err: Error & { status?: number; code?: string } = new Error(`${result.code}: ${result.message}`);
        (err as { status?: number }).status = status;
        (err as { code?: string }).code = result.code;
        throw err;
    }

    const data = result.data as { questions: unknown[]; course: string; level: string };
    let questions: unknown[] = data.questions as unknown[];

    // Worker already validated, repaired, and shuffled. Pages only adds
    // DB-level enrichment (uuid, course_name, level, created_at) before insert
    // to keep DB row shape identical to legacy.
    const { generateUUID } = await import('../../shared/ai-config');
    questions = (questions as Array<Record<string, unknown>>).map((q, idx) => ({
        ...q,
        id: (q as { id?: number }).id ?? idx + 1,
        uuid: (q as { uuid?: string }).uuid ?? generateUUID(),
        course_name: courseName,
        level,
        created_at: (q as { created_at?: string }).created_at ?? new Date().toISOString()
    }));

    // Cache to database — preserved exactly
    try {
        const { error: insertError } = await supabase
            .from('generated_external_assessment')
            .insert({
                certificate_name: courseName,
                assessment_level: level,
                total_questions: questions.length,
                questions: questions,
                generated_by: 'openrouter-ai'
            });

        if (insertError) {
            console.warn('⚠️ Could not cache assessment to database:', (insertError as { message?: string }).message);
        }
    } catch (cacheError: unknown) {
        console.warn('⚠️ Database insert exception:', (cacheError as Error).message);
    }

    return {
        course: courseName,
        level: level,
        total_questions: questions.length,
        questions: questions,
        cached: false
    };
}

async function callCourseWorker(
  env: Record<string, string>,
  userId: string,
  input: { courseName: string; level: string; questionCount: number },
): Promise<{ ok: true; data: { course: string; level: string; total_questions: number; questions: unknown[] } } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.generate-course',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: CourseRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: { actorId: userId, product: 'skillpassport', goals: [], responsibilities: [], permissions: [], capabilities: ['career_ai'], resourceScope: [], relevantContext: [] },
    feature: 'generate-course',
    input: {
      courseName: input.courseName,
      level: input.level,
      questionCount: input.questionCount,
    },
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for generate-course');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as { course: string; level: string; total_questions: number; questions: unknown[] } };
}
