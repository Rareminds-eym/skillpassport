/**
 * Live /invite/accept page (AcceptInvite.tsx): hands unknown UUID tokens to the SSO accept flow
 * (AC14, AC27, AC28, AC30). Imports the page with the SAME specifier the router uses
 * ('@/pages/auth/AcceptInvite'), so these tests also prove which file is mounted.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const acceptInvite = vi.fn();
const getMe = vi.fn();

vi.mock('@/shared/api/ssoClient', () => {
  class SsoWorkflowError extends Error {
    constructor(readonly code: string, operation: string) { super(`${operation} failed (${code})`); this.name = 'SsoWorkflowError'; }
  }
  return {
    SsoWorkflowError,
    ssoClient: {
      acceptInvite: (...a: unknown[]) => acceptInvite(...a),
      getMe: (...a: unknown[]) => getMe(...a),
      login: vi.fn(),
      logout: vi.fn(),
    },
  };
});

import AcceptInvite from '@/pages/auth/AcceptInvite';
import { SsoWorkflowError } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';

const SSO_UUID = '5b1d9a8e-3c4f-4a6b-8d2e-9f0a1b2c3d4e';
const LEGACY_TOKEN = 'a'.repeat(64);
const PASSWORD = 'Str0ng-Passw0rd!';

type FetchReply = { status: number; body: Record<string, unknown> };
let fetchMock: ReturnType<typeof vi.fn>;

function replyToValidate(reply: FetchReply) {
  fetchMock.mockImplementation(async () => ({
    ok: reply.status >= 200 && reply.status < 300,
    status: reply.status,
    json: async () => reply.body,
  }));
}

function renderPage(token: string) {
  render(
    <MemoryRouter initialEntries={[`/invite/accept?token=${token}`]}>
      <Routes>
        <Route path="/invite/accept" element={<AcceptInvite />} />
        <Route path="/educator/dashboard" element={<div>EDUCATOR DASHBOARD</div>} />
        <Route path="/recruitment/overview" element={<div>RECRUITMENT OVERVIEW</div>} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/" element={<div>HOME PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const NOT_FOUND = { status: 404, body: { error: 'Invalid invitation token', code: 'INVITATION_NOT_FOUND' } };
const passwordInput = () => screen.getByLabelText(/^Password \(required/);
const confirmInput = () => screen.getByLabelText('Confirm password');
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Accept Invitation' }));

async function openSsoForm(token = SSO_UUID) {
  replyToValidate(NOT_FOUND);
  renderPage(token);
  await screen.findByLabelText('Confirm password');
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  useAuthStore.setState({ user: null, isAuthenticated: false, role: null } as never);
  getMe.mockResolvedValue({
    sub: 'u1', email: 'test.educator@example.com', roles: ['college_educator'], org_id: 'org-1',
    products: [], membership_status: 'active', is_email_verified: true,
  });
  acceptInvite.mockResolvedValue(undefined);
});

describe('unknown UUID token is handed to SSO (AC14)', () => {
  it('renders the SSO form, accepts via ssoClient and lands educators on /educator/dashboard', async () => {
    await openSsoForm();
    fireEvent.change(passwordInput(), { target: { value: PASSWORD } });
    fireEvent.change(confirmInput(), { target: { value: PASSWORD } });
    submit();

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith({ token: SSO_UUID, password: PASSWORD }));
    fireEvent.click(await screen.findByRole('button', { name: 'Go to Dashboard' }));
    expect(await screen.findByText('EDUCATOR DASHBOARD')).toBeInTheDocument();
    // only the validate call was made against SkillPassport; no recruitment accept
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/recruitment/invitations/validate');
  });

  it('an existing account can leave both password fields empty', async () => {
    await openSsoForm();
    submit();
    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith({ token: SSO_UUID, password: undefined }));
  });

  it('a non-UUID (64 character legacy) token keeps the immediate error and no SSO form', async () => {
    replyToValidate(NOT_FOUND);
    renderPage(LEGACY_TOKEN);
    expect(await screen.findByText('Invalid invitation token')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('404 without the INVITATION_NOT_FOUND code keeps its error', async () => {
    replyToValidate({ status: 404, body: { error: 'Invalid invitation token' } });
    renderPage(SSO_UUID);
    expect(await screen.findByText('Invalid invitation token')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
  });

  it.each([
    [409, 'Invitation already accepted', undefined],
    [410, 'Invitation has been cancelled', undefined],
    [410, 'Educator invitations are now sent through the central sign-in service. Ask your administrator for a new invitation.', 'EDUCATOR_INVITE_RETIRED'],
  ])('%s shows its own error and never calls SSO', async (status, message, code) => {
    replyToValidate({ status, body: { error: message, ...(code ? { code } : {}) } });
    renderPage(SSO_UUID);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('500 (lookup failure) shows the generic error, not the SSO form (AC30)', async () => {
    replyToValidate({ status: 500, body: { error: 'Failed to validate invitation' } });
    renderPage(SSO_UUID);
    expect(await screen.findByText('Failed to validate invitation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('the "Request new invitation" button is not offered for SSO tokens', async () => {
    await openSsoForm();
    acceptInvite.mockRejectedValue(new SsoWorkflowError('not_found', 'Invite acceptance'));
    submit();
    expect(await screen.findByText('This invitation link is invalid or was already used.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /request new invitation/i })).not.toBeInTheDocument();
  });
});

describe('unknown recruitment-shaped UUID (AC28)', () => {
  it('renders the SSO form; after submit SSO not_found shows the invalid-or-used message', async () => {
    const deletedRecruitmentToken = crypto.randomUUID();
    await openSsoForm(deletedRecruitmentToken);
    acceptInvite.mockRejectedValue(new SsoWorkflowError('not_found', 'Invite acceptance'));
    submit();
    expect(await screen.findByText('This invitation link is invalid or was already used.')).toBeInTheDocument();
  });
});

describe('password confirmation (AC27)', () => {
  it.each([
    ['password set, confirmation different', PASSWORD, 'Different-Passw0rd!'],
    ['password set, confirmation empty', PASSWORD, ''],
    ['password empty, confirmation set', '', PASSWORD],
  ])('%s blocks submit without calling SSO', async (_label, password, confirm) => {
    await openSsoForm();
    fireEvent.change(passwordInput(), { target: { value: password } });
    fireEvent.change(confirmInput(), { target: { value: confirm } });
    submit();

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it('a weak matching password is rejected locally with the SSO rules', async () => {
    await openSsoForm();
    fireEvent.change(passwordInput(), { target: { value: 'alllowercaseletters' } });
    fireEvent.change(confirmInput(), { target: { value: 'alllowercaseletters' } });
    submit();
    expect(await screen.findByText(/at least 3 of/)).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
  });
});

describe('SSO failures map by code (never raw SSO text)', () => {
  const hint = /If this is your first time, choose a password of at least 10 characters/;
  const cases: Array<[string, RegExp | string | null, 'form' | 'error']> = [
    ['not_authorized', hint, 'form'],
    ['invalid_input', hint, 'form'],
    ['not_found', 'This invitation link is invalid or was already used.', 'error'],
    ['expired', 'This invitation has expired. Ask your administrator to send a new one.', 'error'],
    ['blocked', 'This account is blocked. Contact your administrator.', 'error'],
    ['rate_limited', 'Too many attempts. Wait a minute and try again.', 'form'],
    ['timeout', /We could not confirm the result/, 'form'],
    ['network_failure', /We could not confirm the result/, 'form'],
    ['upstream_unavailable', /We could not confirm the result/, 'form'],
    ['cancelled', null, 'form'],
    ['conflict', 'Failed to accept invitation.', 'error'],
  ];

  it.each(cases)('%s', async (code, message, where) => {
    await openSsoForm();
    acceptInvite.mockRejectedValue(new SsoWorkflowError(code, 'Invite acceptance'));
    submit();

    if (message) expect(await screen.findByText(message)).toBeInTheDocument();
    await waitFor(() => expect(acceptInvite).toHaveBeenCalled());
    expect(screen.queryByText(/Invite acceptance failed/)).not.toBeInTheDocument();
    if (where === 'form') expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    else expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
  });
});

describe('existing session', () => {
  it('is not auto-accepted: shows a banner and waits for an explicit click', async () => {
    useAuthStore.setState({ user: { id: 'me', email: 'someone@example.com' }, isAuthenticated: true } as never);
    await openSsoForm();

    expect(screen.getByText(/You are signed in as someone@example.com/)).toBeInTheDocument();
    expect(acceptInvite).not.toHaveBeenCalled();
    // no recruitment auto-accept call either
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/recruitment/invitations/validate']);
  });
});

describe('other invitation kinds are unchanged', () => {
  it('a valid learner token uses the standard form and still navigates to /', async () => {
    replyToValidate({
      status: 200, body: {
        valid: true, inviteeEmail: 'l@example.com', organizationId: 'org-1', organizationName: 'School',
        organizationType: 'school', role: 'learner', expiresAt: '2099-01-01T00:00:00Z',
      }
    });
    getMe.mockResolvedValue({
      sub: 'u2', email: 'l@example.com', roles: ['learner'], org_id: 'org-1', products: [],
      membership_status: 'active', is_email_verified: true,
    });
    renderPage(SSO_UUID);
    await screen.findByText(/New user\?/);
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();

    submit();
    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith({ token: SSO_UUID, password: undefined }));
    fireEvent.click(await screen.findByRole('button', { name: 'Go to Dashboard' }));
    expect(await screen.findByText('HOME PAGE')).toBeInTheDocument();
  });

  it('a valid company token still renders the recruitment form', async () => {
    replyToValidate({
      status: 200, body: {
        valid: true, inviteeEmail: 'r@example.com', organizationId: 'org-9', organizationName: 'Acme',
        organizationType: 'company', role: 'recruiter', expiresAt: '2099-01-01T00:00:00Z',
      }
    });
    renderPage(SSO_UUID);
    expect(await screen.findByRole('button', { name: 'Accept invitation and continue' })).toBeInTheDocument();
  });
});
