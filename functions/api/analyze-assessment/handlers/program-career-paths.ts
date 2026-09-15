/**
 * Program Career Paths Handler — RPC cutover.
 *
 * Cut over 2026-09-12: direct OpenRouter call replaced by
 * `seniorEducator({ feature: 'program-paths' })`. Validation and response
 * shape preserved exactly; prompt assembly + retry/fallback deleted (worker owns it).
 * No Supabase writes — pure function of the request.
 */

import { apiSuccess, apiError } from '../../../lib/response';
import type { PagesEnv } from '../../../lib/types';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type ProgramPathsRpcRequest = Extract<EducatorRequest, { feature: 'program-paths' }>;

export interface ProgramCareerPathsPorts {
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    programName: string;
    programCategory: string;
    programStream: string;
    learnerProfile: ProgramPathsRpcRequest['input']['learnerProfile'];
  }) => Promise<
    | { ok: true; careerPaths: Array<{ role: string; salary: { min: number; max: number }; matchScore?: number; whyItFits?: string; requiredSkills?: string[]; growthPotential?: string }> }
    | { ok: false; code: string; message: string }
  >;
}

interface GenerateCareerPathsRequest {
  programName: string;
  programCategory: string;
  programStream: string;
  learnerProfile: {
    riasecScores: {
      R: number;
      I: number;
      A: number;
      S: number;
      E: number;
      C: number;
    };
    aptitudeScores?: {
      verbal?: number;
      numerical?: number;
      abstract?: number;
      spatial?: number;
      clerical?: number;
    };
    topSkills?: string[];
    interests?: string[];
    projects?: Array<{ title: string; description?: string }>;
    experiences?: Array<{ role: string; organization?: string }>;
  };
}

// Keep parsers exported for backward-compat if imported elsewhere (now unused internally)
export function buildCareerPathPrompt(_request: GenerateCareerPathsRequest): string {
  return '';
}

export function parseCareerPaths(_content: string): never[] {
  return [];
}

export async function handleGenerateProgramCareerPaths(
  request: Request,
  env: PagesEnv,
  userIdOrPorts?: string | ProgramCareerPathsPorts,
  maybePorts?: ProgramCareerPathsPorts,
): Promise<Response> {
  const { userId: explicitUserId, ports }: { userId: string | undefined; ports: ProgramCareerPathsPorts } =
    typeof userIdOrPorts === 'string'
      ? { userId: userIdOrPorts, ports: maybePorts ?? {} }
      : { userId: undefined, ports: (userIdOrPorts as ProgramCareerPathsPorts) ?? {} };
  try {
    const body = (await request.json()) as GenerateCareerPathsRequest;

    if (!body.programName || !body.programCategory || !body.learnerProfile?.riasecScores) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: programName, programCategory, learnerProfile.riasecScores', request);
    }

    console.log(`🎓 Generating career paths for: ${body.programName}`);

    // Derive userId for assertion — explicit auth user wins, else best-effort fallback
    const userId =
      explicitUserId ||
      (request.headers.get('x-user-id') as string | null) ||
      ((env as unknown as Record<string, unknown>)._testUserId as string | undefined) ||
      'unknown';

    const result = ports.callWorker
      ? await ports.callWorker({
          env: env as unknown as Record<string, unknown>,
          userId,
          programName: body.programName,
          programCategory: body.programCategory,
          programStream: body.programStream ?? '',
          learnerProfile: body.learnerProfile as ProgramPathsRpcRequest['input']['learnerProfile'],
        })
      : await callProgramPathsWorker(env, userId, body);

    if (!result.ok) {
      const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
      return apiError(status, result.code, result.message.slice(0, 500), request);
    }

    console.log(`✅ Generated ${result.careerPaths.length} career paths`);

    return apiSuccess({ careerPaths: result.careerPaths }, request);
  } catch (error: unknown) {
    console.error('❌ Error generating program career paths:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('binding is not configured') || message.includes('AI_ASSERT_SECRET')) {
      return apiError(503, 'DEPENDENCY_UNAVAILABLE', 'AI service not configured', request);
    }
    return apiError(500, 'INTERNAL_ERROR', message.slice(0, 500), request);
  }
}

async function callProgramPathsWorker(
  env: PagesEnv,
  userId: string,
  body: GenerateCareerPathsRequest,
): Promise<{ ok: true; careerPaths: Array<{ role: string; salary: { min: number; max: number }; matchScore?: number; whyItFits?: string; requiredSkills?: string[]; growthPotential?: string }> } | { ok: false; code: string; message: string }> {
  const secret = (env as unknown as Record<string, string>).AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.program-paths',
    userId: userId === 'unknown' ? 'anonymous' : userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const rpcRequest: ProgramPathsRpcRequest = {
    contractVersion: '1',
    requestId: crypto.randomUUID(),
    operationId: crypto.randomUUID(),
    executionAssertion: assertion,
    actor: {
      actorId: userId === 'unknown' ? 'anonymous' : userId,
      product: 'skillpassport',
      goals: [],
      responsibilities: [],
      permissions: [],
      capabilities: ['career_ai'],
      resourceScope: [],
      relevantContext: [],
    },
    feature: 'program-paths',
    input: {
      programName: body.programName,
      programCategory: body.programCategory,
      programStream: body.programStream ?? '',
      learnerProfile: body.learnerProfile as ProgramPathsRpcRequest['input']['learnerProfile'],
    },
  };
  const result = await worker.seniorEducator(rpcRequest);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for program-paths');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, careerPaths: (result.data as { careerPaths: Array<{ role: string; salary: { min: number; max: number } }> }).careerPaths };
}
