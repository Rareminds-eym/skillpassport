import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ authenticated: true, execute: vi.fn() }));
vi.mock('../../auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (request: Request, auth: unknown) => Promise<Response>) =>
  (request: Request) => io.authenticated ? handler(request, { user: { sub: 'a0000000-0000-4000-8000-000000000001',
    is_email_verified: true, membership_status: 'active' } }) : Response.json({}, { status: 401 }) }) }));
import { onRequestPost } from '../../../api/subscriptions/lifecycle';
import type { PagesFunction } from '../../types';
const actor = 'a0000000-0000-4000-8000-000000000001', id = 'b0000000-0000-4000-8000-000000000001';
const plan = 'c0000000-0000-4000-8000-000000000001', revision = 'd0000000-0000-4000-8000-000000000001';
const product = 'e0000000-0000-4000-8000-000000000001', operationId = 'f0000000-0000-4000-8000-000000000001';
const command = () => ({ operationId, request: { operation: 'cancel', subscriptionId: id, subject: { kind: 'user', id: actor },
  expectedVersion: 1, expectedRevisionId: revision, reason: 'Synthetic cancellation' } });
const receipt = () => ({ operationId, committedAt: '2026-11-19T10:00:00Z', decision: { expectedVersion: 1, expectedRevisionId: revision,
  next: { id, planId: plan, revisionId: revision, productId: product, version: 2, subject: { kind: 'user', id: actor }, status: 'cancelled',
    periodStartsAt: 100, periodEndsAt: 1000, trialEndsAt: null, renewalEnabled: false, cancelledAt: 500, paymentFailedAt: null, scheduledChange: null },
  access: 'full', retryAt: [], audit: { operation: 'cancel', actorId: actor, reason: 'Synthetic cancellation', at: 500, policyId: plan, policyVersion: 1 } } });
const run = (body: unknown, bearer = true) => onRequestPost({ request: new Request('https://owner.invalid/api/subscriptions/lifecycle', {
  method: 'POST', headers: { ...(bearer ? { authorization: 'Bearer synthetic-token' } : {}), 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  env: { SKILLPASSPORT_PRODUCT_ID: product, SSO_SERVICE: { executeSubscriptionLifecycle: io.execute } },
  params: {}, data: {}, next: vi.fn(), waitUntil: vi.fn(),
} as unknown as Parameters<PagesFunction>[0]);
beforeEach(() => { vi.resetAllMocks(); io.authenticated = true; io.execute.mockResolvedValue(receipt()); });
describe('lifecycle HTTP owner consumer', () => {
  it('forwards references once and binds the committed actor, subject, version and revision', async () => {
    const response = await run(command()); expect(response.status).toBe(200);
    expect(io.execute).toHaveBeenCalledExactlyOnceWith('synthetic-token', product, operationId, command().request);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('denies anonymous and invalid tokens before SSO', async () => {
    expect((await run(command(), false)).status).toBe(401); io.authenticated = false;
    expect((await run(command())).status).toBe(401); expect(io.execute).not.toHaveBeenCalled();
  });
  it.each(['actorId', 'policy', 'quote', 'settlement', 'ready'])('rejects caller-provided %s authority', async field => {
    const input = command();
    expect((await run({ ...input, request: { ...input.request, [field]: {} } })).status).toBe(400); expect(io.execute).not.toHaveBeenCalled();
  });
  it.each(['actor', 'subscription', 'product', 'version', 'revision', 'operation', 'reason'])('rejects altered acknowledgement %s', async defect => {
    const value = receipt();
    if (defect === 'actor') value.decision.audit.actorId = plan;
    if (defect === 'subscription') value.decision.next.id = plan;
    if (defect === 'product') value.decision.next.productId = plan;
    if (defect === 'version') value.decision.next.version = 5;
    if (defect === 'revision') value.decision.expectedRevisionId = plan;
    if (defect === 'operation') value.decision.audit.operation = 'suspend';
    if (defect === 'reason') value.decision.audit.reason = 'Altered';
    io.execute.mockResolvedValue(value);
    expect((await run(command())).status).toBe(503); expect(io.execute).toHaveBeenCalledTimes(1);
  });
  it('retains owner denial', async () => {
    io.execute.mockResolvedValue({ kind: 'forbidden' }); expect((await run(command())).status).toBe(403);
  });
  it('surfaces an uncertain commit without retry or fabricated receipt', async () => {
    io.execute.mockRejectedValue(new Error('uncertain')); expect((await run(command())).status).toBe(503);
    expect(io.execute).toHaveBeenCalledTimes(1);
  });
});
