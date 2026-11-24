import { SKILLPASSPORT_PRODUCT_ID } from '../subscription-config';
import { z } from 'zod';
import { getAuthInstance } from '../auth';
import { getAuthToken } from '../supabase';
import type { PagesFunction, PagesEnv } from '../types';
import { catalogInventoryDatabase } from './catalog-inventory';
import { readApplicationPlanProjection } from './publication';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const revision = { planId: reference, revisionId: reference, productId: reference };
export const subscriptionStateSchema = z.object({ ...revision, id: reference,
  subject: z.object({ kind: z.enum(['user', 'organization']), id: reference }).strict(),
  version: time.min(1), status: z.enum(['active', 'pending', 'paused', 'cancelled', 'expired', 'grace_period']),
  periodStartsAt: time, periodEndsAt: time.nullable(), validity: z.literal('perpetual').optional(), trialEndsAt: time.nullable(), renewalEnabled: z.boolean(),
  cancelledAt: time.nullable(), paymentFailedAt: time.nullable(),
  downgradedAt: time.nullable().optional(),
  scheduledChange: z.object({ ...revision, effectiveAt: time }).strict().nullable(),
}).strict().refine(state => (state.periodEndsAt === null) === (state.validity === 'perpetual')
  && (state.periodEndsAt !== null || (!state.renewalEnabled && state.trialEndsAt === null && state.paymentFailedAt === null
    && state.scheduledChange === null && state.status !== 'expired' && state.status !== 'grace_period')), 'Invalid perpetual state');
const pool = z.object({ key: z.string().min(1), featureKey: z.string().min(1),
  recipient: z.enum(['subscriber', 'organization', 'managed_learner']), audiences: z.array(z.string().min(1)).min(1) }).strict();
export const currentSubscriptionSchema = z.object({ schemaVersion: z.literal(1), actorId: reference,
  state: subscriptionStateSchema, access: z.enum(['full', 'restricted', 'read_only', 'suspended']),
  audience: z.string().min(1), activatedAt: time, subscriptionEndsAt: time.nullable(), pools: z.array(pool),
}).strict().superRefine((value, context) => {
  if ((value.state.periodEndsAt !== null && value.state.periodStartsAt >= value.state.periodEndsAt) || value.activatedAt > value.state.periodStartsAt
    || (value.state.downgradedAt != null && value.state.downgradedAt < value.activatedAt)
    || (value.state.periodEndsAt === null ? value.subscriptionEndsAt !== null : value.subscriptionEndsAt === null || value.subscriptionEndsAt < value.state.periodEndsAt) || value.pools.some(p => !p.audiences.includes(value.audience))
    || new Set(value.pools.map(p => p.key)).size !== value.pools.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Inconsistent subscription binding' });
});
export const subscriptionResponseHeaders = { 'Cache-Control': 'private, no-store' };
export const subscriptionFailure = (status: number) => Response.json(
  { error: status === 503 ? 'Subscription service unavailable' : 'Subscription request denied' },
  { status, headers: subscriptionResponseHeaders });

interface ConsumerContext { env: PagesEnv; request: Request; token: string; actorId: string; organizationId: string | null; productId: string }
/** Existing signed authentication, followed by owner authorization in every domain RPC. No self-heal. */
export function subscriptionConsumerEndpoint(method: 'GET' | 'POST',
  handler: (context: ConsumerContext) => Promise<Response>): PagesFunction {
  return async context => {
    try {
      if (context.request.method !== method) return subscriptionFailure(405);
      const token = getAuthToken(context.request);
      if (!token) return subscriptionFailure(401);
      const auth = getAuthInstance(context.env as unknown as Record<string, unknown>);
      const response = await auth.authenticate(async (_request, verified) => {
        const identity = z.object({ sub: reference, is_email_verified: z.literal(true),
          membership_status: z.literal('active'), user_metadata: z.record(z.unknown()).nullish() }).passthrough().safeParse(verified.user);
        if (!identity.success || identity.data.user_metadata?.must_change_password === true) return subscriptionFailure(403);
        try {
          if (!context.env.SSO_SERVICE) return subscriptionFailure(503);
          const organizationId = reference.nullish().parse(identity.data.org_id) ?? null;
          return await handler({ env: context.env, request: context.request, token, actorId: identity.data.sub, organizationId,
            productId: reference.parse(SKILLPASSPORT_PRODUCT_ID) });
        } catch { return subscriptionFailure(503); }
      })(context.request);
      const result = new Response(response.body, response);
      result.headers.set('Cache-Control', 'private, no-store');
      return result;
    } catch { return subscriptionFailure(503); }
  };
}

export const currentSubscriptionEndpoint = subscriptionConsumerEndpoint('GET', async context => {
  const params = [...new URL(context.request.url).searchParams];
  if (params.length !== 1 || params[0][0] !== 'subscriptionId' || !reference.safeParse(params[0][1]).success) return subscriptionFailure(400);
  const subscriptionId = reference.parse(params[0][1]);
  const raw = await context.env.SSO_SERVICE!.getCurrentSubscriptionExecution(context.token, subscriptionId, context.productId);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const current = currentSubscriptionSchema.parse(raw);
  if (current.actorId !== context.actorId || current.state.id !== subscriptionId || current.state.productId !== context.productId) throw new Error('Owner scope differs');
  const stored = await readApplicationPlanProjection(catalogInventoryDatabase(context.env),
    current.state.planId, current.state.revisionId, context.productId);
  const { draft, includedCredits } = stored.projection.bundle;
  if (!draft.audiences.includes(current.audience)
    || current.pools.some(p => !includedCredits.rules.some(r => r.poolKey === p.key && r.featureKey === p.featureKey
      && r.recipient === p.recipient && r.audiences.includes(current.audience)))) throw new Error('Owner projection scope differs');
  return Response.json({ ...current, plan: { ...draft.plan, name: draft.name, revisionNumber: draft.revisionNumber },
    features: draft.features }, { headers: subscriptionResponseHeaders });
});
