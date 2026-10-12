/**
 * Legacy educator invitations cannot be validated or accepted through the recruitment endpoints
 * (AC18): they are the unauthenticated side door to the retired SkillPassport-only educator path.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SingleResult = { data: unknown; error: unknown };
let results: Record<string, SingleResult>;
const { ssoCalls } = vi.hoisted(() => ({ ssoCalls: vi.fn() }));

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
vi.mock('../../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('../../../../lib/permissions', () => ({ PERMISSIONS: {}, verifyOrgAccess: vi.fn() }));
vi.mock('../../../../lib/sso-client', () => {
  const stub = (name: string) => (...args: unknown[]) => { ssoCalls(name, ...args); return Promise.resolve(null); };
  return {
    ssoAssignMembershipRole: stub('ssoAssignMembershipRole'),
    ssoCreateMember: stub('ssoCreateMember'),
    ssoCreateMembership: stub('ssoCreateMembership'),
    ssoGetUserByEmail: stub('ssoGetUserByEmail'),
    ssoGetUserMemberships: stub('ssoGetUserMemberships'),
    ssoListRoles: stub('ssoListRoles'),
    ssoUpdateMembershipStatus: stub('ssoUpdateMembershipStatus'),
  };
});

import { onRequestPost } from '../[[path]]';

const post = (path: 'validate' | 'accept', body: Record<string, unknown>) => onRequestPost({
  env: {},
  request: new Request(`http://localhost:8788/api/recruitment/invitations/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }),
});

const invitation = (role: string) => ({
  id: 'inv-1', organization_id: 'org-1', organization_type: 'college', invitee_email: 'edu@example.com',
  invitee_name: 'Edu Cator', invitee_role: role, invited_by: 'admin-1', status: 'pending',
  expires_at: '2099-01-01T00:00:00Z',
});

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  ssoCalls.mockReset();
  results = {
    organizations: { data: { id: 'org-1', name: 'Test College' }, error: null },
    users: { data: { id: 'admin-1', email: 'admin@example.com', firstName: 'A', lastName: 'B' }, error: null },
  };
});

describe.each(['college_educator', 'school_educator'])('legacy %s invitation', (role) => {
  beforeEach(() => { results.organization_invitations = { data: invitation(role), error: null }; });

  it('validate -> 410 EDUCATOR_INVITE_RETIRED', async () => {
    const res = await post('validate', { token: 'tok' });
    const body = (await res.json()) as any;
    expect(res.status).toBe(410);
    expect(body.code).toBe('EDUCATOR_INVITE_RETIRED');
    expect(body).not.toHaveProperty('valid');
  });

  it('accept -> 410 EDUCATOR_INVITE_RETIRED and no SSO call is made', async () => {
    const res = await post('accept', { token: 'tok', password: 'Str0ng-Passw0rd!' });
    expect(res.status).toBe(410);
    expect(((await res.json()) as any).code).toBe('EDUCATOR_INVITE_RETIRED');
    expect(ssoCalls).not.toHaveBeenCalled();
  });
});

describe('non-educator invitations are unchanged', () => {
  it.each(['learner', 'recruiter', 'company_admin', 'viewer'])('validate still succeeds for %s', async (role) => {
    results.organization_invitations = { data: invitation(role), error: null };
    const res = await post('validate', { token: 'tok' });
    expect(res.status).toBe(200);
    expect((await res.json()) as any).toMatchObject({ valid: true, role });
  });

  it('accept reaches the SSO lookup for a recruiter invitation (not refused)', async () => {
    results.organization_invitations = { data: invitation('recruiter'), error: null };
    await post('accept', { token: 'tok', password: 'Str0ng-Passw0rd!' }).catch(() => undefined);
    expect(ssoCalls).toHaveBeenCalled();
  });
});
