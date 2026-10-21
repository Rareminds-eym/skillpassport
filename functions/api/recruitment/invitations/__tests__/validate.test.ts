/**
 * Recruitment invitation `validate`: distinguishes "no row" (404 + INVITATION_NOT_FOUND) from a
 * lookup failure (500, no code) so the accept page never treats a transient DB error as an
 * unknown token (AC14, AC30).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SingleResult = { data: unknown; error: unknown };
let results: Record<string, SingleResult>;

vi.mock('../../../../lib/supabase', () => ({
  getServiceClient: () => ({
    from: (table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        single: async () => results[table] ?? { data: null, error: null },
      };
      return chain;
    },
  }),
}));
// Importing the route pulls the auth stack in; only the unauthenticated POST /validate path is exercised.
vi.mock('../../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('../../../../lib/sso-client', () => ({}));
vi.mock('../../../../lib/permissions', () => ({ PERMISSIONS: {}, verifyOrgAccess: vi.fn() }));

import { onRequestPost } from '../[[path]]';

const validate = (token: unknown = 'tok') => onRequestPost({
  env: {},
  request: new Request('http://localhost:8788/api/recruitment/invitations/validate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
  }),
});

const invitation = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1', organization_id: 'org-1', organization_type: 'company', invitee_email: 'r@example.com',
  invitee_role: 'recruiter', status: 'pending', expires_at: '2099-01-01T00:00:00Z', ...overrides,
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  results = {};
});

describe('POST /api/recruitment/invitations/validate', () => {
  it('no row (PGRST116) -> 404 with code INVITATION_NOT_FOUND', async () => {
    results.organization_invitations = { data: null, error: { code: 'PGRST116' } };
    const res = await validate();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Invalid invitation token', code: 'INVITATION_NOT_FOUND' });
  });

  it('any other lookup error -> 500 without the not-found code (AC30)', async () => {
    results.organization_invitations = { data: null, error: { code: '08006', message: 'connection failure' } };
    const res = await validate();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to validate invitation' });
    expect(body).not.toHaveProperty('code');
  });

  it('a valid pending row is unchanged (200)', async () => {
    results.organization_invitations = { data: invitation(), error: null };
    results.organizations = { data: { id: 'org-1', name: 'Acme' }, error: null };
    const res = await validate();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ valid: true, inviteeEmail: 'r@example.com', organizationName: 'Acme', role: 'recruiter' });
  });

  it.each([
    ['accepted', 409],
    ['cancelled', 410],
  ])('status %s keeps %s', async (status, httpStatus) => {
    results.organization_invitations = { data: invitation({ status }), error: null };
    expect((await validate()).status).toBe(httpStatus);
  });

  it('an expired row keeps 410', async () => {
    results.organization_invitations = { data: invitation({ expires_at: '2000-01-01T00:00:00Z' }), error: null };
    expect((await validate()).status).toBe(410);
  });

  it('a missing token keeps 400', async () => {
    expect((await validate('')).status).toBe(400);
  });
});
