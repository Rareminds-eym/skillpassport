// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PagesEnv } from '../lib/types';
import type { Env as SsoEnv } from '../../../sso-worker/src/types';
// @ts-expect-error Native ESM fixture intentionally has no generated declaration file.
import { createCandidateTwoDatabaseFixture } from '../../scripts/checks/zoho-candidate-e2e-fixtures.mjs';
const bridge = vi.hoisted(() => ({ rpc: vi.fn(), appDb: vi.fn() }));
vi.mock('../../../sso-worker/src/lib/db', () => ({ db: () => ({ rpc: bridge.rpc }) }));
vi.mock('../lib/db', () => ({ createDb: bridge.appDb }));
import { recoverCandidateDeliveries, candidateProjectionSnapshot, confirmCandidateProjection } from '../../../sso-worker/src/lib/zoho-candidate-delivery';
import { deliverCandidateProjection } from '../../../auth-sync-consumer/src/lib/zoho-candidate-delivery';
import { handleCandidateProjection } from '../lib/zoho-candidate-projection';
import { SyncService } from '../lib/sync-service';
import { candidateSubjectSyncPolicy } from '../../../sso-worker/src/lib/zoho-candidate-sync-policy';
import { candidateCapabilities } from '../../../sso-worker/src/lib/zoho-candidate-capabilities';
// @ts-expect-error Dashboard JavaScript module is intentionally shared through its narrow probe.
import { candidateProjectionCapabilities } from '../../../sp-dash/lib/zoho/execution-authority';

type Reference = { operationId: string; sourceHash: string; emailPolicy: 'forbidden' };
type ProjectionProof = Reference & { projectionHash: string; projectionReceiptId: string };
const enabled = process.env.ZOHO_LOCAL_TWO_DB_TEST === '1';
const suite = enabled ? describe : describe.skip;

/** Real SQL in separate disposable databases; in-process transport and service-binding adapters. */
suite('opt-in canonical SSO → existing auth-sync → Pages → independent SQL readback', () => {
  let fixture: ReturnType<typeof createCandidateTwoDatabaseFixture>;
  const events: Array<{ type: string; payload: Reference }> = [];
  const emailTrap = vi.fn(() => { throw new Error('Email is forbidden in candidate import'); });
  const externalFetchTrap = vi.fn(() => { throw new Error('Unexpected external network call'); });
  const secret = 'synthetic-two-database-fixture-secret';
  let failConfirmation = false;
  let canonicalEnv: SsoEnv;
  let applicationEnv: PagesEnv;
  const readback = vi.fn(async (proof: ProjectionProof) => {
    // Independent application authority rechecks actual projection postconditions.
    const allowed = await fixture.application.rpc('zoho_check_candidate_projection', {
      p_operation: proof.operationId, p_source_hash: proof.sourceHash,
      p_projection_hash: proof.projectionHash, p_receipt: proof.projectionReceiptId,
    });
    return { allowed: allowed === true && !failConfirmation };
  });
  const applicationDb = () => ({ rpc: async (fn: string, args: Record<string, unknown>) => {
    try { return { data: await fixture.application.rpc(fn, args), error: null }; }
    catch (error) { return { data: null, error }; }
  } });
  const transport: typeof fetch = async (input, init) => {
    const request = new Request(String(input), init);
    expect(new URL(request.url).pathname).toBe('/sync/zoho-candidate');
    return handleCandidateProjection({ request, env: applicationEnv }, applicationDb as never);
  };
  async function referenceFor(email: string, externalId: string): Promise<Reference> {
    const grant = fixture.grant(email, externalId);
    const receipt = await fixture.canonical.rpc('zoho_provision_candidate', { p_grant: grant });
    expect(receipt).toMatchObject({ state: 'projection_pending', identityOutcome: 'created', activationState: 'activation_pending', emailPolicy: 'forbidden' });
    return { operationId: grant.operationId, sourceHash: grant.sourceHash, emailPolicy: 'forbidden' };
  }
  const receipt = (reference: Reference) => fixture.canonical.rpc('zoho_find_candidate_receipt', { p_operation: reference.operationId, p_source_hash: reference.sourceHash });
  const applicationRows = (reference: Reference) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference.operationId)) throw new Error('Invalid synthetic operation ID');
    return fixture.application.json(`SELECT jsonb_build_object(
    'projections',(SELECT count(*) FROM public.zoho_candidate_projections WHERE operation_id='${reference.operationId}'::uuid),
    'learners',(SELECT count(*) FROM public.learners l JOIN public.zoho_candidate_projections p ON p.learner_id=l.id WHERE p.operation_id='${reference.operationId}'::uuid),
    'private',(SELECT bool_and(private_profile) FROM public.zoho_candidate_projections WHERE operation_id='${reference.operationId}'::uuid),
    'plans',(SELECT jsonb_agg(s.plan_code) FROM public.subscription_cache s JOIN public.zoho_candidate_projections p ON s.id=ANY(p.subscription_ids) WHERE p.operation_id='${reference.operationId}'::uuid)
  )::text;`);
  };

  beforeAll(() => {
    fixture = createCandidateTwoDatabaseFixture();
    bridge.rpc.mockImplementation((fn, args = {}) => fixture.canonical.rpc(fn, args));
    bridge.appDb.mockImplementation(applicationDb);
    canonicalEnv = {
      ENVIRONMENT:'development', SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SERVICE_ROLE_KEY: 'synthetic',
      SYNC_QUEUE: { send: async (event: { type: string; payload: Reference }) => { events.push(event); } },
      ZOHO_CONTROL_PLANE: { validateProjectionReceipt: readback, validateOperation: async () => ({ allowed: true }),
        candidateProjectionCapabilities: () => candidateProjectionCapabilities({ ENVIRONMENT:'development',
          SUPABASE_URL: 'http://127.0.0.1:1', SUPABASE_SERVICE_ROLE_KEY: 'synthetic' }, applicationDb) },
      EMAIL_QUEUE: { send: emailTrap }, EMAIL_SERVICE: { sendEmail: emailTrap }, EMAIL_WORKER: { fetch: emailTrap },
    } as unknown as SsoEnv;
    applicationEnv = {
      ENVIRONMENT:'development',SUPABASE_URL:'http://127.0.0.1:1', INTERNAL_WEBHOOK_SECRET: secret,
      ZOHO_CANDIDATE_SOURCE: {
        getSubjectSyncPolicy: (input: unknown) => candidateSubjectSyncPolicy(canonicalEnv, input),
        getProjectionSnapshot: (reference: Reference) => candidateProjectionSnapshot(canonicalEnv, reference),
        confirmProjection: (proof: ProjectionProof) => confirmCandidateProjection(canonicalEnv, proof),
      },
      EMAIL_QUEUE: { send: emailTrap }, EMAIL_SERVICE: { sendEmail: emailTrap }, EMAIL_WORKER: { fetch: emailTrap },
    } as unknown as PagesEnv;
    vi.stubGlobal('fetch', externalFetchTrap);
  }, 120000);
  afterAll(() => {
    vi.unstubAllGlobals();
    try {
      expect(emailTrap).not.toHaveBeenCalled();
      expect(externalFetchTrap).not.toHaveBeenCalled();
    } finally { fixture?.close(); }
  }, 120000);

  it('creates Discover once, publishes only a reference, projects privately and confirms from independent readback', async () => {
    const reference = await referenceFor('two-db-create@fixture.example', '99001');
    const before = events.length;
    expect(await recoverCandidateDeliveries(canonicalEnv)).toEqual({ published: 1 });
    expect(events).toHaveLength(before + 1);
    const event = events.at(-1)!;
    expect(event.type).toBe('zoho.candidate.canonical_committed');
    expect(event.payload).toEqual(reference);
    expect(Object.keys(event.payload).sort()).toEqual(['emailPolicy', 'operationId', 'sourceHash']);
    await deliverCandidateProjection('https://application.fixture.example', secret, event.payload, transport);
    expect(await receipt(reference)).toMatchObject({ state: 'completed', ...reference });
    expect(applicationRows(reference)).toEqual({ projections: 1, learners: 1, private: true, plans: ['freemium'] });
    expect(readback).toHaveBeenCalled();
    expect(fixture.application.json("SELECT jsonb_build_object('anonymousBaseRead',has_table_privilege('anon','public.learners','SELECT'),'recruiterVisible',(SELECT count(*) FROM public.zoho_recruiter_learners))::text;")).toEqual({ anonymousBaseRead: false, recruiterVisible: 0 });
    // Replayed queue delivery converges on the same account, profile and projection receipt.
    const original = await receipt(reference);
    await deliverCandidateProjection('https://application.fixture.example', secret, event.payload, transport);
    expect(await receipt(reference)).toEqual(original);
    expect(applicationRows(reference)).toEqual({ projections: 1, learners: 1, private: true, plans: ['freemium'] });
    expect(await recoverCandidateDeliveries(canonicalEnv)).toEqual({ published: 0 });
  }, 120000);

  it('keeps an applied but unconfirmed operation pending and completes the same projection after retry', async () => {
    const reference = await referenceFor('two-db-retry@fixture.example', '99002');
    expect(await recoverCandidateDeliveries(canonicalEnv)).toEqual({ published: 1 });
    const event = events.at(-1)!;
    expect(event.payload).toEqual(reference);
    failConfirmation = true;
    try {
      await expect(deliverCandidateProjection('https://application.fixture.example', secret, reference, transport)).rejects.toThrow('not confirmed');
      expect(await receipt(reference)).toMatchObject({ state: 'projection_pending' });
      expect(applicationRows(reference)).toEqual({ projections: 1, learners: 1, private: true, plans: ['freemium'] });
    } finally { failConfirmation = false; }
    await deliverCandidateProjection('https://application.fixture.example', secret, reference, transport);
    expect(await receipt(reference)).toMatchObject({ state: 'completed' });
    expect(applicationRows(reference)).toEqual({ projections: 1, learners: 1, private: true, plans: ['freemium'] });
    expect(emailTrap).not.toHaveBeenCalled();
    expect(externalFetchTrap).not.toHaveBeenCalled();
  }, 120000);

  it('advertises readiness only with both actual database grant boundaries intact', async () => {
    expect(await candidateCapabilities(canonicalEnv)).toMatchObject({ ready: true, modules: ['Candidates'], emailPolicy: 'forbidden' });
    fixture.application.sql('GRANT SELECT(email) ON public.learners TO anon;');
    try { expect(await candidateCapabilities(canonicalEnv)).toMatchObject({ ready: false }); }
    finally { fixture.application.sql('REVOKE SELECT(email) ON public.learners FROM anon;'); }
    fixture.canonical.sql('GRANT SELECT ON public.oauth_accounts TO authenticated;');
    try { expect(await candidateCapabilities(canonicalEnv)).toMatchObject({ ready: false }); }
    finally { fixture.canonical.sql('REVOKE SELECT ON public.oauth_accounts FROM authenticated;'); }
    expect(await candidateCapabilities(canonicalEnv)).toMatchObject({ ready: true });
  }, 120000);

  it('projects the same Discover identity after provider-owned no-email activation', async () => {
    const reference = await referenceFor('two-db-oauth@fixture.example', '99003');
    const original = await receipt(reference);
    const target = original.targetId;
    expect(target).toMatch(/^[0-9a-f-]{36}$/);
    fixture.canonical.sql(`INSERT INTO public.oauth_accounts(user_id,provider,provider_user_id) VALUES('${target}','google','synthetic-google-subject');`);
    expect(await fixture.canonical.rpc('zoho_activate_candidate_oauth', {
      p_user: target, p_provider_subject: 'synthetic-google-subject', p_email: 'two-db-oauth@fixture.example',
    })).toMatchObject({ activated: true });
    expect(await receipt(reference)).toMatchObject({ activationState: 'existing_sign_in_preserved', targetId: target });
    const snapshot = await candidateProjectionSnapshot(canonicalEnv, reference) as { snapshot: string };
    expect(JSON.parse(snapshot.snapshot).user.isEmailVerified).toBe(true);
    await deliverCandidateProjection('https://application.fixture.example', secret, reference, transport);
    expect(await receipt(reference)).toMatchObject({ state: 'completed', targetId: target });
    expect(applicationRows(reference)).toEqual({ projections: 1, learners: 1, private: true, plans: ['freemium'] });
    expect(emailTrap).not.toHaveBeenCalled();
  }, 120000);

  it('denies generic replay before projection, after projection and after learner deletion', async () => {
    const reference = await referenceFor('two-db-generic-guard@fixture.example', '99005');
    const target = (await receipt(reference)).targetId;
    expect(target).toMatch(/^[0-9a-f-]{36}$/);
    const service = new SyncService(applicationEnv);
    const replay = async () => {
      expect(await service.syncUser({ id: target, email: 'two-db-generic-guard@fixture.example', user_metadata: { role: 'learner' } })).toEqual({ success: true });
      expect(await service.syncMembership({ user_id: target, organization_id: '00000000-0000-0000-0000-000000000001', roles: ['learner'] })).toEqual({ success: true });
    };
    await replay(); // Application DB adapter has no generic .from writer at all.
    expect(fixture.application.json(`SELECT count(*) FROM public.users WHERE id='${target}';`)).toBe(0);
    await deliverCandidateProjection('https://application.fixture.example', secret, reference, transport);
    await replay();
    expect(fixture.application.json(`SELECT count(*) FROM public.zoho_recruiter_learners WHERE user_id='${target}';`)).toBe(0);
    fixture.application.sql(`DELETE FROM public.learners WHERE user_id='${target}';`);
    await replay();
    expect(fixture.application.json(`SELECT count(*) FROM public.learners WHERE user_id='${target}';`)).toBe(0);
  }, 120000);


});

suite('opt-in candidate mirror and version readiness', () => {
  let fixture: ReturnType<typeof createCandidateTwoDatabaseFixture>;
  const actor = '10000000-0000-4000-8000-000000000001';
  beforeEach(() => { fixture = createCandidateTwoDatabaseFixture(); }, 120000);
  afterEach(() => { fixture?.close(); }, 120000);
  const context = (grant: Record<string, unknown>) => Object.fromEntries(
    ['connectionId', 'sourceOrgId', 'recordId', 'revision', 'configRevision', 'sourceHash', 'externalId', 'data', 'targetId', 'emailPolicy']
      .map(key => [key, grant[key]])
  );
  async function preview(grant: Record<string, unknown>) {
    return fixture.canonical.rpc('zoho_preview_candidate_review', { p_actor: actor, p_context: context(grant) });
  }
  it.each([false, true])('repairs a missing learner mirror while preserving the supported canonical account (partial app user: %s)', async partial => {
    const initial = fixture.grant('missing-mirror@fixture.example', '99201');
    const first = await fixture.canonical.rpc('zoho_provision_candidate', { p_grant: initial });
    const target = first.targetId;
    expect(target).toMatch(/^[0-9a-f-]{36}$/);
    const canonicalBefore = fixture.canonical.json(`SELECT to_jsonb(u)::text FROM public.users u WHERE id='${target}';`);
    if (partial) fixture.application.sql(`INSERT INTO public.users(id,email,role,metadata) VALUES('${target}','missing-mirror@fixture.example','learner','{"theme":"dark"}');`);
    const appBefore = partial ? fixture.application.json(`SELECT to_jsonb(u)::text FROM public.users u WHERE id='${target}';`) : null;
    const grant = fixture.grant('missing-mirror@fixture.example', '99202');
    const reviewed = await preview(grant);
    expect(reviewed).toMatchObject({ decision: 'preserve_existing' });
    const preserved = await fixture.canonical.rpc('zoho_provision_candidate', { p_grant: grant });
    expect(preserved).toMatchObject({ targetId: target, identityOutcome: 'existing_access_preserved' });
    const envelope = await fixture.canonical.rpc('zoho_get_candidate_projection', { p_operation: grant.operationId, p_source_hash: grant.sourceHash });
    const result = await fixture.application.rpc('zoho_apply_candidate_projection', { p_snapshot: envelope.snapshot, p_projection_hash: envelope.projectionHash });
    expect(result).toMatchObject({ operationId: grant.operationId, sourceHash: grant.sourceHash });
    expect(fixture.canonical.json(`SELECT to_jsonb(u)::text FROM public.users u WHERE id='${target}';`)).toEqual(canonicalBefore);
    expect(fixture.canonical.json(`SELECT count(*) FROM public.subscriptions WHERE user_id='${target}';`)).toBe(1);
    expect(fixture.application.json(`SELECT count(*) FROM public.learners WHERE user_id='${target}';`)).toBe(1);
    expect(fixture.application.json(`SELECT to_jsonb(bool_and(private_profile))::text FROM public.zoho_candidate_projections WHERE target_id='${target}';`)).toBe(true);
    if (partial) expect(fixture.application.json(`SELECT to_jsonb(u)::text FROM public.users u WHERE id='${target}';`)).toEqual(appBefore);
  }, 120000);
  it('blocks an eligible Discover plan inserted with a NULL version before creating either account', async () => {
    fixture.canonical.sql(`DELETE FROM public.plans WHERE plan_code='freemium';
      INSERT INTO public.plans(id,plan_code,name,business_type,applicable_entities,pricing_matrix,base_features,product_id,updated_at)
      VALUES('10000000-0000-4000-8000-000000000006','freemium','Discover','b2c','{all}',
      '{"all":{"monthly":0,"yearly":0}}','["learner_profile_creation","basic_opportunity_view"]',
      '10000000-0000-4000-8000-000000000002',NULL);`);
    const grant = fixture.grant('null-discover-version@fixture.example', '99101');
    expect(await preview(grant)).toMatchObject({decision:'blocked', blockers:expect.arrayContaining(['discover_plan_version_unavailable'])});
    await expect(fixture.canonical.rpc('zoho_provision_candidate', { p_grant: grant })).rejects.toThrow();
    expect(fixture.canonical.json('SELECT count(*) FROM public.zoho_candidate_receipts;')).toBe(0);
    expect(fixture.application.json('SELECT count(*) FROM public.learners;')).toBe(0);
    expect(fixture.canonical.json("SELECT to_jsonb(updated_at IS NULL)::text FROM public.plans WHERE plan_code='freemium';")).toBe(true);
  }, 120000);
  it('blocks preservation with a NULL-version cancelled subscription without changing the existing account', async () => {
    const original = fixture.grant('history-version@fixture.example', '99102');
    const receipt = await fixture.canonical.rpc('zoho_provision_candidate', { p_grant: original });
    const envelope = await fixture.canonical.rpc('zoho_get_candidate_projection', { p_operation:original.operationId,p_source_hash:original.sourceHash });
    await fixture.application.rpc('zoho_apply_candidate_projection', {p_snapshot:envelope.snapshot,p_projection_hash:envelope.projectionHash});
    // Insertion is permitted by the actual schema; UPDATE timestamp triggers do not repair it.
    fixture.canonical.sql(`INSERT INTO public.subscriptions(user_id,plan_id,plan_code,plan_type,plan_amount,billing_cycle,features,status,is_organization_subscription,is_bulk_purchase,product_id,updated_at)
      SELECT user_id,plan_id,plan_code,plan_type,plan_amount,billing_cycle,features,'cancelled',false,false,product_id,NULL
      FROM public.subscriptions LIMIT 1;`);
    const grant = fixture.grant('history-version@fixture.example', '99103');
    expect(await preview(grant)).toMatchObject({decision:'blocked',blockers:expect.arrayContaining(['projection_versions_unavailable'])});
    await expect(fixture.canonical.rpc('zoho_provision_candidate',{p_grant:grant})).rejects.toThrow();
    expect(fixture.canonical.json('SELECT count(*) FROM public.zoho_candidate_receipts;')).toBe(1);
    expect(fixture.application.json('SELECT count(*) FROM public.learners;')).toBe(1);
    expect(receipt.identityOutcome).toBe('created');
    expect(fixture.canonical.json("SELECT count(*) FROM public.subscriptions WHERE status='cancelled' AND updated_at IS NULL;")).toBe(1);
  }, 120000);
});
