/**
 * Generate Strengths & Growth Plan Handler — RPC cutover.
 *
 * Cut over 2026-09-12: direct OpenRouter call replaced by
 * `seniorEducator({ feature: 'growth-plan' })`. Every pre/post step is
 * preserved exactly (validation, occupations/capabilities reads, per-role
 * gemini_results cache, store merge). The single deliberate difference:
 * reasoning executes in ai-worker over the typed contract instead of direct
 * provider calls from Pages.
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getAiWorker, rpcErrorToHttpStatus } from '../../ai/lib/aiBinding';
import { issueExecutionAssertion } from '../../ai/lib/assertion';
import type { EducatorRequest } from '@rareminds-eym/ai-protocol';

type GrowthPlanRpcRequest = Extract<EducatorRequest, { feature: 'growth-plan' }>;

export interface GrowthPlanPorts {
  supabase?: {
    from(table: string): {
      select(cols: string): {
        eq(col: string, val: unknown): {
          maybeSingle(): Promise<{ data: unknown; error: unknown }>;
          single(): Promise<{ data: unknown; error: unknown }>;
        };
        in(col: string, vals: unknown[]): {
          order(col: string, opts: unknown): {
            limit(n: number): Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
      update(values: unknown): {
        eq(col: string, val: unknown): {
          select(): Promise<{ data: unknown; error: unknown }>;
        };
      };
      insert(values: unknown): {
        select(): Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
  callWorker?: (args: {
    env: Record<string, unknown>;
    userId: string;
    roleName: string;
    capabilities: string[];
    learnerRiasec: Record<string, number>;
  }) => Promise<
    | { ok: true; data: { strengths: Array<{ title: string; reason: string }>; growthAreas: Array<{ title: string; reason: string }>; immediateActions: Array<{ title: string }>; timeline: Array<{ month: string; capability: string }> } }
    | { ok: false; code: string; message: string }
  >;
}

export async function generateStrengthsGrowthPlanHandler(
  context: AuthenticatedContext,
  ports: GrowthPlanPorts = {},
): Promise<Response> {
  const env = context.env as Record<string, string>;
  const supabase = (ports.supabase as unknown as ReturnType<typeof getServiceClient>) ?? getServiceClient(env as any);
  const userId =
    ((context.data as unknown as { user?: { sub?: string; id?: string } })?.user?.sub ??
      (context.data as unknown as { user?: { sub?: string; id?: string } })?.user?.id ??
      'unknown') as string;

  try {
    const requestData = (await context.request.json()) as unknown as Record<string, unknown>;
    const roleName = requestData.roleName as string | undefined;
    const learnerProfile = requestData.learnerProfile as { riasec?: Record<string, number> } | undefined;

    if (!roleName || !learnerProfile) {
      return Response.json(
        { error: 'roleName and learnerProfile are required' },
        { status: 400 },
      );
    }

    // Get role's required capabilities.
    const { data: occupations } = await supabase
      .from('occupations')
      .select('id')
      .eq('name', roleName);

    if (!occupations || (occupations as unknown[]).length === 0) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    const occupationIds = (occupations as Array<{ id: string }>).map((o) => o.id);

    const { data: capabilitySequence } = await supabase
      .from('role_capability_sequence')
      .select(`
        sequence_step,
        capability_priority,
        required_level,
        primary_riasec_context,
        secondary_riasec_context,
        capability_master(id, name, description)
      `)
      .in('occupation_id', occupationIds)
      .order('sequence_step', { ascending: true })
      .limit(6);

    if (!capabilitySequence || (capabilitySequence as unknown[]).length === 0) {
      return Response.json({ error: 'No capabilities found for role' }, { status: 404 });
    }

    const capabilities = (capabilitySequence as Array<{ capability_master?: { name: string; description: string } }>).map(
      (item: unknown) => {
        const row = item as {
          capability_master?: { name: string; description: string };
          capability_priority?: string;
          required_level?: number;
          primary_riasec_context?: string;
          secondary_riasec_context?: string;
        };
        return {
          name: row.capability_master?.name,
          description: row.capability_master?.description,
          priority: row.capability_priority,
          level: row.required_level,
          primaryRiasec: row.primary_riasec_context,
          secondaryRiasec: row.secondary_riasec_context,
        };
      },
    );

    const assessmentResultId = requestData.assessmentResultId as string | undefined;
    console.log('[Strengths-Growth-Plan] Starting... assessmentResultId:', assessmentResultId, 'roleName:', roleName);

    if (assessmentResultId) {
      const { data: existing, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('id', assessmentResultId)
        .maybeSingle();

      if (fetchError) {
        console.log('[Strengths-Growth-Plan] ⚠️  Fetch error:', (fetchError as { message?: string }).message);
      } else {
        console.log('[Strengths-Growth-Plan] 📊 Fetched data:', {
          hasGeminiResults: !!((existing as { gemini_results?: unknown })?.gemini_results),
          geminiResultsKeys: Object.keys(((existing as { gemini_results?: Record<string, unknown> })?.gemini_results as Record<string, unknown>) || {}),
        });
      }

      const cachedForRole = (existing as { gemini_results?: { strengthsGrowthPlan?: Record<string, unknown> } })?.gemini_results
        ?.strengthsGrowthPlan?.[roleName];
      if (cachedForRole) {
        console.log('[Strengths-Growth-Plan] ✅ USING CACHED DATA for role:', roleName);
        const cached = cachedForRole as Record<string, unknown>;
        return Response.json(
          {
            strengths: (cached.strengths as unknown[]) || [],
            growthAreas: (cached.growthAreas as unknown[]) || [],
            immediateActions: (cached.immediateActions as unknown[]) || [],
            timeline: (cached.timeline as unknown[]) || [],
            cached: true,
          },
          { status: 200 },
        );
      }
    }

    // Worker call (the single deliberate difference)
    const learnerRiasec = (learnerProfile as { riasec?: Record<string, number> }).riasec || {};
    const capabilityNames = capabilities.map((c: { name?: string }) => c.name as string).filter(Boolean);

    const result = ports.callWorker
      ? await ports.callWorker({ env: env as unknown as Record<string, unknown>, userId, roleName, capabilities: capabilityNames, learnerRiasec })
      : await callGrowthPlanWorker(env, userId, { roleName, capabilities: capabilityNames, learnerRiasec });

    if (!result.ok) {
      const status = rpcErrorToHttpStatus(new Error(`${result.code}: ${result.message}`));
      // Preserve original 500 shape for internal failures; map known codes precisely
      if (status === 403 || status === 429 || status === 400) {
        return Response.json({ error: result.message.slice(0, 500) }, { status });
      }
      return Response.json(
        { error: 'Failed to generate plan', details: result.message.slice(0, 500) },
        { status: status === 503 ? 500 : status },
      );
    }

    const parsed = result.data;

    // Store in gemini_results for future use (preserved exactly)
    if (assessmentResultId) {
      console.log('[Strengths-Growth-Plan] 💾 Storing cache for role:', roleName);

      const { data: current, error: fetchError } = await supabase
        .from('personal_assessment_results')
        .select('gemini_results')
        .eq('id', assessmentResultId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Strengths-Growth-Plan] ❌ Failed to fetch current record:', (fetchError as { message?: string }).message);
      } else {
        console.log('[Strengths-Growth-Plan] ✓ Fetched current record for update');
      }

      const updatedGeminiResults = {
        ...(((current as { gemini_results?: Record<string, unknown> })?.gemini_results as Record<string, unknown>) || {}),
        strengthsGrowthPlan: {
          ...((((current as { gemini_results?: { strengthsGrowthPlan?: Record<string, unknown> } })?.gemini_results as { strengthsGrowthPlan?: Record<string, unknown> })?.strengthsGrowthPlan as Record<string, unknown>) || {}),
          [roleName]: {
            strengths: parsed.strengths || [],
            growthAreas: parsed.growthAreas || [],
            immediateActions: parsed.immediateActions || [],
            timeline: parsed.timeline || [],
          },
        },
      };

      console.log('[Strengths-Growth-Plan] 📦 Data to store:', {
        assessmentId: assessmentResultId,
        roleName,
        dataStructure: JSON.stringify(updatedGeminiResults).substring(0, 100),
      });

      const { error: updateError, data: updateData } = await supabase
        .from('personal_assessment_results')
        .update({ gemini_results: updatedGeminiResults })
        .eq('id', assessmentResultId)
        .select();

      if (updateError) {
        console.error('[Strengths-Growth-Plan] ❌ Failed to store in DB:', (updateError as { message?: string }).message);
        console.error('[Strengths-Growth-Plan] Error details:', updateError);
      } else {
        console.log('[Strengths-Growth-Plan] Updated record count:', (updateData as unknown[] | undefined)?.length);

        if (!updateData || (updateData as unknown[]).length === 0) {
          console.log('[Strengths-Growth-Plan] ⚠️  No rows updated, attempting INSERT instead');

          const { error: insertError } = await supabase
            .from('personal_assessment_results')
            .insert({
              id: assessmentResultId,
              gemini_results: updatedGeminiResults,
            })
            .select();

          if (insertError) {
            console.error('[Strengths-Growth-Plan] ❌ Failed to INSERT in DB:', (insertError as { message?: string }).message);
          } else {
            console.log('[Strengths-Growth-Plan] ✅ Successfully INSERTED cache in DB');
          }
        } else {
          console.log('[Strengths-Growth-Plan] ✅ Successfully updated cache in DB');
        }
      }
    } else {
      console.log('[Strengths-Growth-Plan] ⚠️  No assessmentResultId provided, cache not stored');
    }

    return Response.json(
      {
        strengths: parsed.strengths || [],
        growthAreas: parsed.growthAreas || [],
        immediateActions: parsed.immediateActions || [],
        timeline: parsed.timeline || [],
        cached: false,
      },
      { status: 200 },
    );
  } catch (error) {
    // Preserve original error shape for transport/binding failures
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('binding is not configured') || message.includes('AI_ASSERT_SECRET')) {
      console.error('[Strengths-Growth-Plan] transport error:', message);
      return Response.json({ error: 'Failed to generate plan', details: 'AI service not configured' }, { status: 500 });
    }
    console.error('Generate strengths & growth plan error:', error);
    return Response.json(
      { error: 'Failed to generate plan', details: (error as { message?: string }).message },
      { status: 500 },
    );
  }
}

async function callGrowthPlanWorker(
  env: Record<string, string>,
  userId: string,
  input: { roleName: string; capabilities: string[]; learnerRiasec: Record<string, number> },
): Promise<{ ok: true; data: GrowthPlanRpcRequest['input'] extends infer _ ? { strengths: Array<{ title: string; reason: string }>; growthAreas: Array<{ title: string; reason: string }>; immediateActions: Array<{ title: string }>; timeline: Array<{ month: string; capability: string }> } : never } | { ok: false; code: string; message: string }> {
  const secret = env.AI_ASSERT_SECRET;
  if (!secret) throw new Error('AI_ASSERT_SECRET is not configured');
  const worker = getAiWorker(env as unknown as Parameters<typeof getAiWorker>[0]);
  const assertion = await issueExecutionAssertion(secret, {
    issuer: 'skillpassport',
    action: 'seniorEducator.growth-plan',
    userId,
    product: 'skillpassport',
    entitlements: ['career_ai'],
  });
  const request: GrowthPlanRpcRequest = {
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
    feature: 'growth-plan',
    input,
  };
  const result = await worker.seniorEducator(request);
  if (result && typeof result === 'object' && 'duplicate' in (result as Record<string, unknown>)) {
    return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'duplicate execution' };
  }
  if (result instanceof Response) throw new Error('INTERNAL_ERROR: unexpected stream for growth-plan');
  if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
  return { ok: true, data: result.data as unknown as { strengths: Array<{ title: string; reason: string }>; growthAreas: Array<{ title: string; reason: string }>; immediateActions: Array<{ title: string }>; timeline: Array<{ month: string; capability: string }> } };
}
