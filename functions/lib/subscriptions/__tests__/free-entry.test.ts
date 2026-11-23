import { describe, expect, it } from 'vitest';
import { currentSubscriptionSchema, subscriptionStateSchema } from '../current-subscription';
import { subscriptionActionContextSchema, subscriptionActionAuthorization, SubscriptionActionDenied } from '../action';

const id = '00000000-0000-4000-8000-000000000001';
const current = () => ({ schemaVersion: 1, actorId: id, audience: 'synthetic', activatedAt: 100, subscriptionEndsAt: null,
  access: 'full', pools: [], state: { id, planId: id, revisionId: id, productId: id, version: 1,
    subject: { kind: 'user', id }, status: 'active', periodStartsAt: 100, periodEndsAt: null, validity: 'perpetual',
    trialEndsAt: null, renewalEnabled: false, cancelledAt: null, paymentFailedAt: null, scheduledChange: null, downgradedAt: null } });

describe('perpetual subscription application contracts', () => {
  it('accepts the owner perpetual current state without inventing an expiry', () => {
    expect(currentSubscriptionSchema.parse(current()).state.periodEndsAt).toBeNull();
  });
  it.each([{ validity: undefined }, { periodEndsAt: 500 }, { renewalEnabled: true }, { trialEndsAt: 500 },
    { scheduledChange: { planId: id, revisionId: id, productId: id, effectiveAt: 500 } }, { status: 'expired' }])(
    'rejects conflicting perpetual state', patch => {
      expect(subscriptionStateSchema.safeParse({ ...current().state, ...patch }).success).toBe(false);
    });
  it('does not permit a finite commercial end to masquerade as perpetual', () => {
    expect(currentSubscriptionSchema.safeParse({ ...current(), subscriptionEndsAt: 500 }).success).toBe(false);
  });
  it('accepts action contexts for explicit perpetual state and preserves finite-window resource denial', () => {
    const { pools: _, ...raw } = current();
    const context = subscriptionActionContextSchema.parse({ ...raw, actions: { schemaVersion: 1,
      bindings: [{ actionKey: 'synthetic.read', featureKey: 'synthetic', mode: 'read' }] } });
    // Resource authorization has a separate finite-window persistence contract;
    // perpetual state must not silently turn that contract into unlimited access.
    expect(() => subscriptionActionAuthorization({ context, binding: context.actions.bindings[0],
      grant: { key: 'synthetic', type: 'boolean', enabled: true }, projection: {} as never })).toThrow(SubscriptionActionDenied);
  });
});
