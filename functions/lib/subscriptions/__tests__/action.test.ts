import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readRecruiterContactPermissions, readRecruiterInterviewViews, recruiterCandidateView, requireSubscriptionAccess, unlockRecruiterCandidateContact } from '../../../shared/lib/subscription-access';
import { createOwnedAttempt, readAttemptStart } from '../../assessment-start';
import type { AuthenticatedPagesContext, PagesEnv } from '../../types';
import { authorizeSubscriptionAction, reserveSubscriptionQuota, SubscriptionActionDenied, type ActionScope, type QuotaCommand } from '../action';
import type { ApplicationPlanProjection } from '../publication';
const io = vi.hoisted(() => ({ current: vi.fn(), discover: vi.fn(), action: vi.fn(), projection: vi.fn(), database: vi.fn(), service: vi.fn(), prepare: vi.fn(), inventory: vi.fn(), retake: vi.fn() }));
vi.mock('../publication', () => ({ readApplicationPlanProjection: io.projection }));
vi.mock('../catalog-inventory', () => ({
  catalogInventoryDatabase: io.database, readApplicationFeatureInventory: io.inventory,
  applicationFeatureDefinition: (value: unknown) => value
}));
vi.mock('../../supabase', async importOriginal => ({ ...await importOriginal<typeof import('../../supabase')>(), getServiceClient: io.service }));

const actor = 'a0000000-0000-4000-8000-000000000001', subscription = 'b0000000-0000-4000-8000-000000000001';
const plan = 'c0000000-0000-4000-8000-000000000001', revision = 'd0000000-0000-4000-8000-000000000001';
const product = 'e0000000-0000-4000-8000-000000000001', other = 'f0000000-0000-4000-8000-000000000001';
const state = () => ({
  id: subscription, planId: plan, revisionId: revision, productId: product, version: 1,
  subject: { kind: 'user' as const, id: actor }, status: 'active' as const, periodStartsAt: 100, periodEndsAt: 1000,
  trialEndsAt: null, renewalEnabled: true, cancelledAt: null, paymentFailedAt: null, scheduledChange: null
});
const snapshot = () => ({
  schemaVersion: 1 as const, actorId: actor, state: state(), access: 'full' as const,
  audience: 'synthetic', activatedAt: 100, subscriptionEndsAt: 2000,
  actions: { schemaVersion: 1 as const, bindings: [{ actionKey: 'synthetic.write', featureKey: 'synthetic_feature', mode: 'write' as const }] }
});
const projection = (): ApplicationPlanProjection => ({
  schemaVersion: 1, entitlements: [], bundle: {
    schemaVersion: 1,
    draft: {
      schemaVersion: 2, id: revision, plan: { id: plan, code: 'pln_' + 'a'.repeat(32), productId: product },
      revisionNumber: 1, name: 'Synthetic', audiences: ['synthetic'], purchaseMode: 'self_service', prices: [],
      features: [{ key: 'synthetic_feature', type: 'boolean', enabled: true }]
    },
    includedCredits: { schemaVersion: 1, id: other, revisionId: revision, funding: 'included', rules: [] }
  }
});
const operation = (): ActionScope => ({ actorId: actor, productId: product, subject: { kind: 'user', id: actor }, actionKey: 'synthetic.write', mode: 'write' });
const env = (): PagesEnv => ({
  SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: {
    getCurrentSubscriptionExecution: io.current, listSubscriptionExecutions: io.discover, getSubscriptionActionContext: io.action, prepareSubscriptionCreditExecution: io.prepare,
    prepareSubscriptionRetakeSettlement: io.retake,
  } as unknown as NonNullable<PagesEnv['SSO_SERVICE']>
});
const request = () => new Request('https://synthetic.invalid/api/assessment/start', { method: 'POST', headers: { authorization: 'Bearer synthetic' } });
const discovery = () => ({
  schemaVersion: 1, actorId: actor, productId: product,
  items: [{ id: subscription, subject: state().subject, productId: product, kind: 'initialized' }], nextCursor: subscription
});
const access = (mode: 'read' | 'write' = 'write', actionKey?: string) => requireSubscriptionAccess({
  env: env(), request: request(), actorId: actor,
  subject: state().subject, mode, ...(actionKey === undefined ? {} : { actionKey })
});
beforeEach(() => {
  vi.resetAllMocks();
  io.discover.mockResolvedValueOnce(discovery()).mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
  const { actions: _actions, ...current } = snapshot();
  io.current.mockResolvedValue({ ...current, pools: [] }); io.action.mockResolvedValue(snapshot());
  io.database.mockReturnValue({}); io.projection.mockResolvedValue({ projection: projection() });
});
describe('immutable action decisions', () => {
  it.each(['activatedAt', 'subscriptionEndsAt'])('rejects unsafe %s values', field => {
    expect(() => authorizeSubscriptionAction({ ...snapshot(), [field]: Number.MAX_SAFE_INTEGER + 1 }, projection(), operation())).toThrow();
  });
  it('binds the signed actor, subject, revision and configured action', () => {
    expect(authorizeSubscriptionAction(snapshot(), projection(), operation()).binding.featureKey).toBe('synthetic_feature');
  });
  it.each(['actor', 'product', 'subject', 'revision', 'audience'])('rejects mismatched %s', defect => {
    const input = snapshot(), terms = projection();
    if (defect === 'actor') input.actorId = other;
    if (defect === 'product') input.state.productId = other;
    if (defect === 'subject') input.state.subject.id = other;
    if (defect === 'revision') terms.bundle.draft.id = other;
    if (defect === 'audience') input.audience = 'foreign';
    expect(() => authorizeSubscriptionAction(input, terms, operation())).toThrow(SubscriptionActionDenied);
  });
  it.each(['restricted', 'read_only', 'suspended'])('rejects %s writes', access => {
    expect(() => authorizeSubscriptionAction({ ...snapshot(), access }, projection(), operation())).toThrow('access');
  });
  it('permits configured retained reads but suspends domain reads', () => {
    const input = snapshot(), op = { ...operation(), mode: 'read' as const };
    const raw = { ...input, access: 'read_only', actions: { schemaVersion: 1, bindings: [{ ...input.actions.bindings[0], mode: 'read' }] } };
    expect(authorizeSubscriptionAction(raw, projection(), op).context.access).toBe('read_only');
    expect(() => authorizeSubscriptionAction({ ...raw, access: 'suspended' }, projection(), op)).toThrow('access');
  });
  it('does not infer missing or disabled grants from plan names', () => {
    const terms = projection(); terms.bundle.draft.name = 'Enterprise Unlimited'; terms.bundle.draft.features = [];
    expect(() => authorizeSubscriptionAction(snapshot(), terms, operation())).toThrow('feature');
    terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'boolean', enabled: false }];
    expect(() => authorizeSubscriptionAction(snapshot(), terms, operation())).toThrow('feature');
  });
  it('requires exact configured categories and rejects duplicate action/category bindings', () => {
    const input = snapshot(), binding = { ...input.actions.bindings[0], assessmentCategory: 'synthetic_category' };
    const raw = { ...input, actions: { schemaVersion: 1, bindings: [binding] } };
    expect(() => authorizeSubscriptionAction(raw, projection(), operation())).toThrow('configuration');
    expect(authorizeSubscriptionAction(raw, projection(), { ...operation(), assessmentCategory: binding.assessmentCategory }).binding).toEqual(binding);
    expect(() => authorizeSubscriptionAction({ ...raw, actions: { schemaVersion: 1, bindings: [binding, binding] } }, projection(), operation())).toThrow();
  });
  it('requires explicit quota semantics for numeric terms and preserves finite quantities', () => {
    const terms = projection(), input = snapshot();
    terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 7 } }];
    expect(() => authorizeSubscriptionAction(input, terms, operation())).toThrow('configuration');
    const raw = { ...input, actions: { schemaVersion: 1, bindings: [{ ...input.actions.bindings[0], quota: { period: 'billing_period', countingEvent: 'synthetic_create' } }] } };
    expect(authorizeSubscriptionAction(raw, terms, operation()).grant).toMatchObject({ limit: { value: 7 } });
    terms.bundle.draft.features[0] = { key: 'synthetic_feature', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 0 } };
    expect(() => authorizeSubscriptionAction(raw, terms, operation())).toThrow('quota');
    // Negotiated (display-only) limits must never become an unlimited NULL quota.
    terms.bundle.draft.features[0] = { key: 'synthetic_feature', type: 'numeric_limit', enabled: true, limit: { kind: 'contract_required' } };
    expect(() => authorizeSubscriptionAction(raw, terms, operation())).toThrow('quota');
  });
  it('rejects enum values outside the action accepted domain', () => {
    const terms = projection(); terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'enum', enabled: true, value: 'included' }];
    expect(() => authorizeSubscriptionAction(snapshot(), terms, operation())).toThrow('feature');
    const input = snapshot();
    expect(authorizeSubscriptionAction({ ...input, actions: { schemaVersion: 1, bindings: [{ ...input.actions.bindings[0], acceptedValues: ['included'] }] } }, terms, operation()).grant.enabled).toBe(true);
  });
});
describe('signed owner adapter used by assessment routes', () => {
  it('uses signed discovery and exact owner revision, never a client-selected plan', async () => {
    const result = await access('write', 'synthetic.write');
    expect(result).not.toBeInstanceOf(Response);
    expect(io.action).toHaveBeenCalledExactlyOnceWith('synthetic', subscription, product);
    expect(io.projection).toHaveBeenCalledExactlyOnceWith({}, plan, revision, product);
  });
  it.each(['read_only', 'restricted', 'suspended'])('rejects %s domain mutations before domain writes', async status => {
    const { actions: _actions, ...current } = snapshot(); io.current.mockResolvedValue({ ...current, access: status, pools: [] });
    expect(await access()).toMatchObject({ status: 403 });
  });
  it('preserves read-only domain reads', async () => {
    const { actions: _actions, ...current } = snapshot(); io.current.mockResolvedValue({ ...current, access: 'read_only', pools: [] });
    expect(await access('read')).not.toBeInstanceOf(Response);
  });
  it('rejects suspended reads', async () => {
    const { actions: _actions, ...current } = snapshot(); io.current.mockResolvedValue({ ...current, access: 'suspended', pools: [] });
    expect(await access('read')).toMatchObject({ status: 403 });
  });
  it('rejects missing and ambiguous initialized executions', async () => {
    io.discover.mockReset().mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
    expect(await access()).toMatchObject({ status: 403 });
    io.discover.mockReset().mockResolvedValueOnce({ ...discovery(), items: [...discovery().items, { ...discovery().items[0], id: other }], nextCursor: other })
      .mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
    const review = await access() as Response;
    expect(review.status).toBe(409); expect(await review.json()).toMatchObject({ error: { code: 'SUBSCRIPTION_REVIEW_REQUIRED' } });
    expect(io.current).not.toHaveBeenCalled();
  });
  it('denies an uninitialized legacy cohort without substituting a legacy plan', async () => {
    io.discover.mockReset().mockResolvedValueOnce({ ...discovery(), items: [{ ...discovery().items[0], kind: 'uninitialized' }] })
      .mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
    const setup = await access() as Response;
    expect(setup.status).toBe(409); expect(await setup.json()).toMatchObject({ error: { code: 'SUBSCRIPTION_SETUP_REQUIRED' } });
    expect(io.current).not.toHaveBeenCalled(); expect(io.action).not.toHaveBeenCalled(); expect(io.projection).not.toHaveBeenCalled();
  });
  it('rejects crossed actor and broken pagination without a legacy substitution', async () => {
    io.discover.mockReset().mockResolvedValue({ ...discovery(), actorId: other });
    expect(await access()).toMatchObject({ status: 503 }); expect(io.current).not.toHaveBeenCalled();
  });
  it('surfaces owner transport failures as unavailable', async () => {
    io.discover.mockReset().mockRejectedValue(new Error('synthetic unavailable'));
    expect(await access()).toMatchObject({ status: 503 });
  });
});
describe('period-event atomic persistence contract', () => {
  const command = (): QuotaCommand => ({
    operationId: other, actorId: actor, subject: state().subject, subscriptionId: subscription,
    productId: product, revisionId: revision, version: 1, actionKey: 'synthetic.write', countingEvent: 'synthetic_create',
    resourceId: other, periodStartsAt: 100, periodEndsAt: 1000, limit: 7
  });
  it('sends one complete immutable command to the transactional owner', async () => {
    const abortSignal = vi.fn().mockResolvedValue({ data: { command: command(), used: 1 }, error: null });
    const rpc = vi.fn().mockReturnValue({ abortSignal });
    expect(await reserveSubscriptionQuota({ rpc }, command())).toMatchObject({ used: 1 });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('reserve_subscription_action_quota', { p_command: command() });
  });
  it('accepts structurally equal PostgreSQL jsonb receipts with reordered keys', async () => {
    const saved = Object.fromEntries(Object.entries(command()).reverse());
    saved.subject = { id: actor, kind: 'user' };
    const rpc = vi.fn().mockReturnValue({ abortSignal: vi.fn().mockResolvedValue({ data: { command: saved, used: 1 }, error: null }) });
    expect(await reserveSubscriptionQuota({ rpc }, command())).toMatchObject({ used: 1 });
  });
  it.each(['version', 'periodStartsAt', 'periodEndsAt'])('rejects unsafe quota %s before persistence', async field => {
    const rpc = vi.fn();
    await expect(reserveSubscriptionQuota({ rpc }, { ...command(), [field]: Number.MAX_SAFE_INTEGER + 1 })).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(['foreign_scope', 'over_capacity', 'persistence'])('rejects %s receipts', async defect => {
    const saved = command(); if (defect === 'foreign_scope') saved.subject.id = other;
    const rpc = vi.fn().mockReturnValue({
      abortSignal: vi.fn().mockResolvedValue({
        data: { command: saved, used: defect === 'over_capacity' ? 8 : 1 }, error: defect === 'persistence' ? {} : null,
      })
    });
    await expect(reserveSubscriptionQuota({ rpc }, command())).rejects.toThrow();
  });
});
describe('actual assessment creation owner', () => {
  const context = () => ({ env: env(), request: request(), data: { user: { sub: actor } } } as unknown as AuthenticatedPagesContext);
  beforeEach(() => {
    const input = snapshot();
    io.action.mockResolvedValue({
      ...input, actions: {
        schemaVersion: 1, bindings: [{
          actionKey: 'assessment.start', featureKey: 'synthetic_feature', mode: 'write',
          quota: { period: 'billing_period', countingEvent: 'assessment_start' }
        }]
      }
    });
    const terms = projection(); terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 7 } }];
    io.projection.mockResolvedValue({ projection: terms });
  });
  it('blocks a read-only subscriber before the domain creation RPC', async () => {
    const current = await io.action();
    io.action.mockResolvedValue({ ...current, access: 'read_only' });
    const result = await createOwnedAttempt(context(), { gradeLevel: 'college', streamId: null });
    expect(result.status).toBe(403); expect(io.service).not.toHaveBeenCalled();
  });
  it('sends exact numeric terms and actual resource creation to one atomic owner RPC', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { created: true, attempt: { id: other, learner_id: actor, status: 'in_progress', grade_level: 'college', stream_id: null } }, error: null });
    io.service.mockReturnValue({ rpc });
    const result = await createOwnedAttempt(context(), { gradeLevel: 'college', streamId: null, operationId: other });
    expect(result.status).toBe(201);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('start_subscription_assessment', {
      p_owner: actor, p_stream: null, p_grade: 'college', p_reference: null, p_context: null, p_reuse: false,
      p_operation: other, p_authorization: {
        actorId: actor, subject: state().subject, subscriptionId: subscription, productId: product, revisionId: revision,
        version: 1, actionKey: 'assessment.start', validUntil: 1000
      },
      p_quota: {
        operationId: other, actorId: actor, subject: state().subject, subscriptionId: subscription, productId: product, revisionId: revision,
        version: 1, actionKey: 'assessment.start', countingEvent: 'assessment_start', periodStartsAt: 100, periodEndsAt: 1000, limit: 7
      },
      p_source_attempt: null, p_retake_proof: null
    });
  });
  it.each([{ streamId: 'synthetic-stream-a', gradeLevel: 'college' }, { streamId: 'synthetic-stream-b', gradeLevel: 'college' },
  { streamId: null, gradeLevel: 'highschool' }])('preserves distinct authoritative assessment stream/grade input without category inference: %j', async input => {
    const rpc = vi.fn().mockResolvedValue({ data: { created: true, attempt: { id: other, learner_id: actor, status: 'in_progress', grade_level: input.gradeLevel, stream_id: input.streamId } }, error: null });
    io.service.mockReturnValue({ rpc });
    expect((await createOwnedAttempt(context(), input)).status).toBe(201);
    expect(rpc).toHaveBeenCalledWith('start_subscription_assessment', expect.objectContaining({
      p_stream: input.streamId, p_grade: input.gradeLevel,
      p_source_attempt: null, p_retake_proof: null
    }));
  });
  const proof = () => ({
    schemaVersion: 1, actorId: actor, subscriptionId: subscription, productId: product, subject: state().subject, stateVersion: 1, validUntil: 1000,
    settlement: {
      id: plan, quoteId: revision, subscriptionId: subscription, productId: product, subject: state().subject, purpose: 'retake',
      referenceId: other, providerPaymentId: 'pay_synthetic', amountMinor: 9900, currency: 'INR', settledAt: 200
    }
  });
  const configureRetake = () => {
    io.action.mockResolvedValue({ ...snapshot(), actions: { schemaVersion: 1, bindings: [{ actionKey: 'assessment.retake', featureKey: 'synthetic_feature', mode: 'write', paymentRequired: true }] } });
    io.retake.mockResolvedValue(proof()); io.projection.mockResolvedValue({ projection: projection() });
  };
  const retake = () => createOwnedAttempt(context(), { gradeLevel: 'college', streamId: null, operationId: revision, sourceAttemptId: other, settlementId: plan });
  it('passes real owner-settled retake evidence to the same transaction without inferring a first-attempt quota', async () => {
    configureRetake();
    const rpc = vi.fn().mockResolvedValue({ data: { created: true, attempt: { id: plan, learner_id: actor, status: 'in_progress', grade_level: 'college', stream_id: null } }, error: null });
    io.service.mockReturnValue({ rpc });
    expect((await retake()).status).toBe(201);
    expect(io.retake).toHaveBeenCalledExactlyOnceWith('synthetic', product, { subscriptionId: subscription, settlementId: plan, referenceId: other });
    expect(rpc).toHaveBeenCalledWith('start_subscription_assessment', expect.objectContaining({ p_source_attempt: other, p_retake_proof: proof(), p_quota: null, p_operation: revision }));
  });
  it.each(['actor', 'version', 'source', 'payment', 'expiry', 'subscription'])('rejects mismatched retake %s evidence before any resource write', async defect => {
    configureRetake(); const value = proof();
    if (defect === 'actor') value.actorId = other;
    if (defect === 'version') value.stateVersion = 2;
    if (defect === 'source') value.settlement.referenceId = revision;
    if (defect === 'payment') value.settlement.id = revision;
    if (defect === 'expiry') value.validUntil = 1001;
    if (defect === 'subscription') value.subscriptionId = other;
    io.retake.mockResolvedValue(value);
    expect((await retake()).status).toBe(403); expect(io.service).not.toHaveBeenCalled();
  });
  it('requires explicit stable retake references and surfaces missing owner evidence', async () => {
    configureRetake();
    expect((await createOwnedAttempt(context(), { gradeLevel: 'college', streamId: null, sourceAttemptId: other })).status).toBe(400);
    io.retake.mockResolvedValue({ kind: 'forbidden' });
    expect((await retake()).status).toBe(403); expect(io.service).not.toHaveBeenCalled();
  });
  it('accepts explicit retake references without reinterpreting the legacy learner reference', async () => {
    const parsed = await readAttemptStart(new Request('https://synthetic.invalid/api/assessment/start', {
      method: 'POST',
      body: JSON.stringify({ gradeLevel: 'college', streamId: null, reference: actor, operationId: revision, sourceAttemptId: other, settlementId: plan })
    }), true);
    expect(parsed).toEqual({ gradeLevel: 'college', streamId: null, reference: actor, operationId: revision, sourceAttemptId: other, settlementId: plan });
  });
  it.each([{ sourceAttemptId: other }, { settlementId: plan }, { sourceAttemptId: other, settlementId: plan },
  { sourceAttemptId: other, settlementId: plan, operationId: 'forged' }])('rejects incomplete or invalid retake input before authorization', async references => {
    const parsed = await readAttemptStart(new Request('https://synthetic.invalid/api/assessment/start', {
      method: 'POST',
      body: JSON.stringify({ gradeLevel: 'college', streamId: null, ...references })
    }));
    expect(parsed).toMatchObject({ status: 400 }); expect(io.service).not.toHaveBeenCalled();
  });
  it.each([['54000', 402], ['P0002', 402], ['42501', 403], ['P0001', 409]])('preserves atomic owner denial %s', async (code, status) => {
    io.service.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: { code } }) });
    expect((await createOwnedAttempt(context(), { gradeLevel: 'college', streamId: null })).status).toBe(status);
  });
});
describe('authoritative recruiter contact consent', () => {
  const candidate = {
    id: plan, user_id: revision, name: 'Synthetic learner', email: 'private@synthetic.invalid', contact_number: 'synthetic-phone',
    alternate_number: 'never-disclose', profile: { email: 'nested@synthetic.invalid', guardianPhone: 'never-disclose' }, resumeUrl: 'https://synthetic.invalid/private-resume'
  };
  let verification: string | null, settings: Record<string, unknown> | null, unlocked: boolean, unavailable: boolean;
  const database = () => ({
    from: (table: string) => {
      const query: Record<string, unknown> = {};
      for (const name of ['select', 'eq', 'in']) query[name] = vi.fn(() => query);
      const result = () => ({
        error: unavailable ? { code: 'synthetic' } : null,
        data: table === 'organization_recruitment_verification' ? verification === null ? null : { organization_id: other, verification_status: verification }
          : table === 'zoho_recruiter_learners' ? [candidate]
            : table === 'user_settings' ? settings === null ? [] : [{ user_id: revision, privacy_settings: settings }]
              : unlocked ? [{ candidate_id: plan }] : []
      });
      query.maybeSingle = vi.fn(async () => result());
      query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject);
      return query;
    }
  } as unknown as SupabaseClient);
  const read = (purpose: 'discovery' | 'profile' = 'profile') => readRecruiterContactPermissions({ env: env(), request: request(), actorId: actor, organizationId: other, database: database() }, [candidate], purpose);
  beforeEach(() => {
    verification = 'approved'; unavailable = false; unlocked = true;
    settings = { profileVisibility: 'recruiters', allowRecruiterContact: true, showEmail: true, showPhone: false, showLocation: false };
    io.discover.mockReset().mockResolvedValueOnce({ ...discovery(), items: [{ ...discovery().items[0], subject: { kind: 'organization', id: other } }] })
      .mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
    const input = snapshot();
    io.action.mockResolvedValue({
      ...input, state: { ...state(), subject: { kind: 'organization', id: other } },
      actions: { schemaVersion: 1, bindings: [{ actionKey: 'recruiter.contact.read', featureKey: 'synthetic_feature', mode: 'read' }] }
    });
    const terms = projection(); terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'metered', enabled: true, limit: { kind: 'allocation_policy' } }];
    io.projection.mockResolvedValue({ projection: terms });
  });
  it('reveals only explicitly consented fields after a paid unlock and verification', async () => {
    const permissions = await read(); expect(permissions).toBeInstanceOf(Map);
    if (permissions instanceof Response) throw new Error('Unexpected denial');
    const view = recruiterCandidateView(candidate, permissions.get(plan)!);
    expect(view).toMatchObject({ name: candidate.name, email: candidate.email, contact_number: null });
    expect(JSON.stringify(view)).not.toContain('never-disclose'); expect(view).not.toHaveProperty('profile'); expect(view).not.toHaveProperty('resumeUrl');
  });
  it.each(['pending', 'rejected', null])('denies unverified organization state %s', async status => {
    verification = status; expect(await read()).toMatchObject({ status: 403 });
  });
  it.each(['missing', 'private', 'contact_revoked', 'malformed'])('does not infer consent from %s settings', async defect => {
    if (defect === 'missing') settings = null;
    if (defect === 'private') settings!.profileVisibility = 'private';
    if (defect === 'contact_revoked') settings!.allowRecruiterContact = false;
    if (defect === 'malformed') settings!.showEmail = 'true';
    const permissions = await read();
    if (permissions instanceof Response) throw new Error('Unexpected transport denial');
    const view = recruiterCandidateView(candidate, permissions.get(plan)!);
    expect(view.email).toBeNull(); expect(view.contact_number).toBeNull();
  });
  it('never substitutes a prior unlock for revoked consent', async () => {
    settings!.allowRecruiterContact = false;
    const permissions = await read();
    if (permissions instanceof Response) throw new Error('Unexpected transport denial');
    expect(permissions.get(plan)).toMatchObject({ unlocked: false, email: false, phone: false });
  });
  it('withholds contact for candidates without purchased unlocks', async () => {
    unlocked = false;
    const permissions = await read();
    if (permissions instanceof Response) throw new Error('Unexpected transport denial');
    expect(permissions.get(plan)).toMatchObject({ visible: true, unlocked: false, email: false, phone: false });
  });
  it('does not turn profile visibility into consent for talent-pool discovery', async () => {
    settings!.showInTalentPool = false;
    const permissions = await read('discovery');
    if (permissions instanceof Response) throw new Error('Unexpected transport denial');
    expect(permissions.get(plan)?.visible).toBe(false);
  });
  it('denies failed consent and verification reads', async () => {
    unavailable = true; expect(await read()).toMatchObject({ status: 503 });
  });
  it('permits previously paid contact reads during owner read-only retention', async () => {
    const raw = await io.action(); io.action.mockResolvedValue({ ...raw, access: 'read_only' });
    const permissions = await read();
    if (permissions instanceof Response) throw new Error('Unexpected retention denial');
    expect(permissions.get(plan)?.email).toBe(true);
  });
  const interviews = () => readRecruiterInterviewViews({ env: env(), request: request(), actorId: actor, organizationId: other, database: database() },
    [{
      id: 'interview-synthetic', learner_id: revision, candidate_name: 'Synthetic learner', candidate_email: 'stale@synthetic.invalid', candidate_phone: 'stale-phone',
      profile: { guardianPhone: 'never-disclose' }, resumeUrl: 'never-disclose', date: 'synthetic-date', job_title: 'Synthetic job'
    }]);
  it('projects interview contacts from current paid consent and strips embedded private fields', async () => {
    const views = await interviews(); expect(views).not.toBeInstanceOf(Response);
    expect(views).toEqual([expect.objectContaining({ id: 'interview-synthetic', candidate_email: candidate.email, candidate_phone: null })]);
    expect(JSON.stringify(views)).not.toContain('stale'); expect(JSON.stringify(views)).not.toContain('never-disclose');
  });
  it.each(['private', 'revoked'])('withholds cached interview contacts after %s consent changes', async defect => {
    if (defect === 'private') settings!.profileVisibility = 'private'; else settings!.allowRecruiterContact = false;
    const views = await interviews(); expect(views).not.toBeInstanceOf(Response);
    if (defect === 'private') expect(views).toEqual([]); else expect(views).toEqual([expect.objectContaining({ candidate_email: null, candidate_phone: null })]);
    expect(JSON.stringify(views)).not.toContain('stale');
  });
});
describe('scoped recruiter debit and resource transaction adapter', () => {
  const command = () => ({
    productId: product, subscriptionId: subscription, recipient: { kind: 'organization', id: other },
    featureKey: 'synthetic_feature', poolKey: 'synthetic_pool', operationId: revision,
    actionKey: 'recruiter.contact.unlock', amount: 2, spendingOrder: 'expires_first'
  });
  let rpc: ReturnType<typeof vi.fn>;
  const unlock = () => unlockRecruiterCandidateContact({
    env: env(), request: request(), actorId: actor, organizationId: other,
    database: { rpc } as unknown as SupabaseClient
  }, plan, revision);
  beforeEach(() => {
    io.discover.mockReset().mockResolvedValueOnce({ ...discovery(), items: [{ ...discovery().items[0], subject: { kind: 'organization', id: other } }] })
      .mockResolvedValue({ ...discovery(), items: [], nextCursor: null });
    io.action.mockResolvedValue({
      ...snapshot(), state: { ...state(), subject: { kind: 'organization', id: other } },
      actions: { schemaVersion: 1, bindings: [{ actionKey: 'recruiter.contact.unlock', featureKey: 'synthetic_feature', mode: 'write' }] }
    });
    const terms = projection(); terms.bundle.draft.features = [{ key: 'synthetic_feature', type: 'metered', enabled: true, limit: { kind: 'allocation_policy' } }];
    terms.bundle.includedCredits.rules = [{
      id: plan, featureKey: 'synthetic_feature', poolKey: 'synthetic_pool', recipient: 'organization', audiences: ['synthetic'],
      quantity: { kind: 'finite', value: 7 }, cadence: { kind: 'subscription_period' }, expiry: { kind: 'subscription_end' }, rollover: { kind: 'none' }
    }];
    io.projection.mockResolvedValue({ projection: terms }); io.inventory.mockResolvedValue([{ key: 'synthetic_feature', type: 'metered' }]);
    io.prepare.mockResolvedValue({ kind: 'consume', actorId: actor, command: command() });
    rpc = vi.fn().mockResolvedValue({ data: { candidate: { id: plan, name: 'Synthetic learner', email: null, phone: null }, alreadyUnlocked: false }, error: null });
  });
  it('preserves the owner tariff and invokes one combined debit/unlock RPC', async () => {
    expect(await unlock()).toMatchObject({ candidate: { id: plan } });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('unlock_subscription_candidate_contact', {
      p_actor_id: actor, p_organization_id: other,
      p_candidate_id: plan, p_credit_command: command(), p_authorization: {
        actorId: actor, subject: { kind: 'organization', id: other }, subscriptionId: subscription, productId: product,
        revisionId: revision, version: 1, actionKey: 'recruiter.contact.unlock', validUntil: 1000,
      }
    });
    expect(io.projection).toHaveBeenCalledTimes(1);
  });
  it.each(['recipient', 'operation', 'feature', 'actor'])('rejects owner-prepared %s scope mismatch before any debit', async defect => {
    const prepared = command(); if (defect === 'recipient') prepared.recipient.id = actor;
    if (defect === 'operation') prepared.operationId = other;
    if (defect === 'feature') prepared.featureKey = 'foreign_feature';
    io.prepare.mockResolvedValue({ kind: 'consume', actorId: defect === 'actor' ? other : actor, command: prepared });
    expect(await unlock()).toMatchObject({ status: 503 }); expect(rpc).not.toHaveBeenCalled();
  });
  it('denies a read-only lifecycle before preparing a new contact debit', async () => {
    const raw = await io.action(); io.action.mockResolvedValue({ ...raw, access: 'read_only' });
    expect(await unlock()).toMatchObject({ status: 403 }); expect(io.prepare).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
  });
  it('keeps insufficient credits and revoked transactional consent as explicit denials', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'INSUFFICIENT_SUBSCRIPTION_CREDITS' } });
    expect(await unlock()).toMatchObject({ status: 402 });
  });
});
