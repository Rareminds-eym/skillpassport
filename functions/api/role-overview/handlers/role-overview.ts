/**
 * Role Overview Handler - Pages Function (RPC cutover).
 *
 * Cut over 2026-09-12: the direct-provider implementation was replaced by
 * `careerTalentStrategist({ feature: 'role-overview' })`. Request/response
 * shape follows the LIVE inline endpoint contract from `[[path]].ts`
 * (industryDemand object, source openrouter, 500-on-failure) — not the
 * older file-local draft this module previously held.
 *
 * The static fallback (`utils/fallback.ts`) stays: the worker input schema
 * requires it, and it feeds per-section merging worker-side.
 */

import { apiSuccess, apiError } from '../../../lib/response';
import type { RoleOverviewOutput } from '@rareminds-eym/ai-protocol';
import { getAiWorker } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import { getFallbackRoleOverview } from '../utils/fallback';

export interface RoleOverviewRequest {
  roleName: string;
  clusterTitle: string;
}

export interface RoleOverviewPorts {
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    roleName: string;
    clusterTitle: string;
    fallback: RoleOverviewOutput;
  }) => Promise<
    | { ok: true; data: Record<string, unknown> }
    | { ok: false; code: string; message: string }
  >;
}

export async function handleRoleOverviewRpc(
  request: Request,
  env: Record<string, string>,
  userId: string,
  ports: RoleOverviewPorts = {},
): Promise<Response> {
  let body: RoleOverviewRequest;
  try {
    body = (await request.json()) as RoleOverviewRequest;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', request);
  }

  const { roleName, clusterTitle } = body;

  if (!roleName || !clusterTitle) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required fields: roleName and clusterTitle', request);
  }

  const cleanRoleName = roleName.trim();
  const cleanClusterTitle = clusterTitle.trim();

  console.log(`[RoleOverview] Request for: ${cleanRoleName} in ${cleanClusterTitle}`);

  try {
    const fallback = getFallbackRoleOverview(cleanRoleName);

    const result = ports.callWorker
      ? await ports.callWorker({ env: env as unknown as Record<string, unknown>, userId, roleName: cleanRoleName, clusterTitle: cleanClusterTitle, fallback })
      : await callRoleOverviewWorker(env, userId, cleanRoleName, cleanClusterTitle, fallback);

    if (!result.ok) {
      console.error('[RoleOverview] Worker failed:', result.code);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to generate role overview', request);
    }

    const out = result.data;
    console.log(`[RoleOverview] Success via worker for: ${cleanRoleName}`);
    return apiSuccess(
      {
        data: {
          responsibilities: ((out.responsibilities as unknown[]) ?? []).slice(0, 3),
          industryDemand: {
            description: (out.demandDescription as string) || `${cleanRoleName} roles show steady market demand.`,
            demandLevel: (out.demandLevel as string) || 'Medium',
            demandPercentage: (out.demandPercentage as number) || 65,
          },
          careerProgression: out.careerProgression || [],
          learningRoadmap: out.learningRoadmap || [],
          recommendedCourses: out.recommendedCourses || [],
          freeResources: out.freeResources || [],
          actionItems: out.actionItems || [],
          suggestedProjects: out.suggestedProjects || [],
        },
        source: 'openrouter',
      },
      request,
    );
  } catch (error) {
    console.error('[RoleOverview] Worker failed:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to generate role overview', request);
  }
}

async function callRoleOverviewWorker(
  env: Record<string, string>,
  userId: string,
  roleName: string,
  clusterTitle: string,
  fallback: RoleOverviewOutput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'careerTalentStrategist.role-overview',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const result = await worker.careerTalentStrategist({
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
    feature: 'role-overview',
    input: { roleName, clusterTitle, fallback },
  });
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for role-overview');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as unknown as Record<string, unknown> };
}
