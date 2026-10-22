/**
 * Tutor suggestions: product prompt assembly, lesson/module reads and static
 * defaults remain in SkillPassport. Worker RPC supplies model transport and
 * strict 3-5 question validation. Legacy response/degradation behavior is preserved.
 */

import { createSupabaseClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesFunction, PagesEnv } from '../../../lib/types';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import { buildTutorSuggestionsPrompt } from '../prompts/tutor-suggestions';
import type { OrchestratorRequest } from '@rareminds-eym/ai-protocol';
import { readOrchestratorResult } from '../../ai/lib/orchestrator-result';


/**
 * Default questions to use when AI is unavailable or fails â€” preserved verbatim.
 */
function getDefaultQuestions(lessonTitle: string): string[] {
  return [
    `What are the key concepts in "${lessonTitle}"?`,
    `Can you explain the main points of this lesson?`,
    `How does this lesson connect to the rest of the course?`
  ];
}

/**
 * Kept for backward compat if imported elsewhere (now unused internally).
 * Worker owns parsing/validation; Pages only falls back to defaults.
 */
export function parseQuestionsFromResponse(content: string): string[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter((q: unknown) => typeof q === 'string' && (q as string).trim().length > 0) as string[];
      }
    }
  } catch {
    // Fall through
  }
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.endsWith('?'))
    .slice(0, 5);
}

export interface TutorSuggestionsPorts {
  supabase?: ReturnType<typeof createSupabaseClient>;
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    lessonTitle: string;
    moduleTitle: string;
    lessonContent: string;
  }) => Promise<
    | { ok: true; questions: string[] }
    | { ok: false; code: string; message: string }
  >;
}

export const handleAiTutorSuggestions: PagesFunction<PagesEnv> = async (context, ports?: TutorSuggestionsPorts) => {
  const { request, env } = context;
  const p = ports ?? {};

  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  try {
    const identity = (context as unknown as { data?: { user?: { sub?: string; id?: string } } }).data?.user;
    const userId = identity?.sub ?? identity?.id;
    if (!userId) return apiError(401, 'UNAUTHORIZED', 'Authentication is required', request);
    const supabase = p.supabase ?? createSupabaseClient(env);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
    }

    const { lessonId } = body as { lessonId?: string };

    if (!lessonId || typeof lessonId !== 'string' || lessonId.length > 256) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required field: lessonId', request);
    }

    // Fetch lesson with module info â€” preserved
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('lesson_id, title, content, module_id')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (lessonError) {
      console.error('âŒ Lesson fetch error:', lessonError);
      return apiError(500, 'INTERNAL_ERROR', 'Database error fetching lesson', request);
    }

    if (!lesson) {
      console.warn(`âš ï¸ Lesson not found: ${lessonId}, returning default questions`);
      return apiSuccess({
        questions: [
          "What are the key concepts in this lesson?",
          "Can you explain the main points?",
          "How does this connect to the rest of the course?"
        ],
        lessonId,
        lessonTitle: 'Unknown Lesson'
      }, request);
    }

    const lessonRow = lesson as { lesson_id: string; title: string; content?: string | null; module_id: string };
    const { data: module } = await supabase
      .from('course_modules')
      .select('title, course_id')
      .eq('module_id', lessonRow.module_id)
      .maybeSingle();

    const moduleTitle = (module as { title?: string } | null)?.title || 'Unknown Module';

    // Worker call (the single deliberate difference)
    const lessonContent = (lessonRow.content || 'No content available').slice(0, 8000);

    const result = p.callWorker
      ? await p.callWorker({ env: env as unknown as Record<string, unknown>, userId, lessonTitle: lessonRow.title, moduleTitle, lessonContent })
      : await callSuggestWorker(env as unknown as Record<string, string>, userId, { lessonTitle: lessonRow.title, moduleTitle, lessonContent, lessonId: lessonRow.lesson_id, courseId: (module as { course_id?: string } | null)?.course_id ?? '' });

    if (result.ok) {
      return apiSuccess({
        questions: result.questions,
        lessonId,
        lessonTitle: lessonRow.title
      }, request);
    }

    // Typed failure <3 questions => fallback to defaults (role-overview precedent: Pages owns fallback)
    if (result.code === 'INVALID_MODEL_OUTPUT') {
      console.warn('âš ï¸ Worker returned fewer than 3 questions, using defaults');
      return apiSuccess({
        questions: getDefaultQuestions(lessonRow.title),
        lessonId,
        lessonTitle: lessonRow.title
      }, request);
    }

    // Other worker errors map to HTTP status
    const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
    // For suggest, transient downstream errors should also degrade to defaults per original catch fallback
    // But entitlement/rate/budget errors should surface as errors (cutover tightening)
    if (status === 403 || status === 429 || status === 401) {
      return apiError(status, result.code, result.message.slice(0, 500), request);
    }
    console.error('âŒ Worker suggest error:', result.message);
    return apiSuccess({
      questions: getDefaultQuestions(lessonRow.title),
      lessonId,
      lessonTitle: lessonRow.title
    }, request);

  } catch (error: unknown) {
    console.error('âŒ AI Tutor Suggestions error:', error);
    const message = error instanceof Error ? error.message : String(error);
    const status = rpcErrorToHttpStatus(error);
    if (status === 401 || status === 403 || status === 429 || status === 409) {
      return apiError(status, /^([A-Z_]+):/.exec(message)?.[1] ?? 'INTERNAL_ERROR', message.slice(0, 500), request);
    }
    if (message.includes('binding is not configured') || message.includes('AI_ASSERT_SECRET')) {
      // Graceful degradation as before: return generic defaults even if wiring missing
      return apiSuccess({
        questions: [
          "What are the key concepts in this lesson?",
          "Can you explain the main points?",
          "How does this connect to the rest of the course?"
        ],
        lessonId: 'unknown',
        lessonTitle: 'Unknown Lesson'
      }, request);
    }
    return apiSuccess({
      questions: [
        "What are the key concepts in this lesson?",
        "Can you explain the main points?",
        "How does this connect to the rest of the course?"
      ],
      lessonId: 'unknown',
      lessonTitle: 'Unknown Lesson'
    }, request);
  }
};

async function callSuggestWorker(
  env: Record<string, string>,
  userId: string,
  input: { lessonTitle: string; moduleTitle: string; lessonContent: string; courseId: string; lessonId: string },
): Promise<{ ok: true; questions: string[] } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const prompt = buildTutorSuggestionsPrompt(input);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'orchestration.assist',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
    promptPayload: { prompt },
  });
  const request: OrchestratorRequest = {
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
    input: { kind: 'task', task: { action: 'seniorEducator.suggest', input: { ...input, prompt } } },
  };
  const result = await readOrchestratorResult(await worker.orchestrator(request));
  if (result.kind !== 'tutor-suggestions') throw new Error('INVALID_MODEL_OUTPUT: Expected tutor suggestion result');
  return { ok: true, questions: result.data.questions };
}
