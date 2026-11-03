/**
 * InvitationManager: educator invites go through SSO createInvite (AC11-AC13, AC31);
 * learner invites keep using /api/organization inviteMember.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createInvite = vi.fn();
const listInvites = vi.fn();
const resendInvite = vi.fn();
const apiPost = vi.fn();
const apiGet = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock('@/shared/api/ssoClient', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api/ssoClient')>('@/shared/api/ssoClient').catch(() => null);
  class SsoWorkflowError extends Error {
    constructor(readonly code: string, operation: string) { super(`${operation} failed (${code})`); this.name = 'SsoWorkflowError'; }
  }
  return { ...(actual ?? {}), SsoWorkflowError, ssoClient: {
      createInvite: (...a: unknown[]) => createInvite(...a),
      listInvites: (...a: unknown[]) => listInvites(...a),
      resendInvite: (...a: unknown[]) => resendInvite(...a),
    },
  };
});
vi.mock('@/shared/api/apiClient', () => ({
  apiPost: (...a: unknown[]) => apiPost(...a),
  apiGet: (...a: unknown[]) => apiGet(...a),
}));
vi.mock('@/shared/model/authStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'admin-1' } }) },
}));
vi.mock('react-hot-toast', () => ({
  default: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));
// The barrel pulls in the whole entity; expose only the real service.
vi.mock('@/entities/organization', async () => ({
  memberInvitationService: (await import('@/entities/organization/api/memberInvitationService')).memberInvitationService,
}));

import { SsoWorkflowError } from '@/shared/api/ssoClient';
import InvitationManager from '../InvitationManager';

type OrgType = 'school' | 'college' | 'university';

const row = (overrides: Record<string, unknown>) => ({
  id: 'inv-1', organization_id: 'org-1', organization_type: 'college', invitee_email: 'legacy@example.com',
  invitee_role: 'educator', invited_by: 'admin-1', status: 'pending', invitation_token: 't',
  expires_at: '2099-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', ...overrides,
});

function mockApi(invitations: Array<Record<string, unknown>> = []) {
  apiGet.mockImplementation(async (url: string) => {
    if (url.includes('getInvitationStats')) {
      return { data: { total: 0, pending: 0, accepted: 0, expired: 0, cancelled: 0, acceptanceRate: 0 } };
    }
    return { data: invitations };
  });
  apiPost.mockResolvedValue({ data: row({ id: 'new', invitee_role: 'learner', invitee_email: 'l@example.com' }) });
}

async function renderManager(organizationType: OrgType = 'college', invitations: Array<Record<string, unknown>> = []) {
  mockApi(invitations);
  render(<InvitationManager organizationId="org-1" organizationType={organizationType} licensePools={[]} />);
  await screen.findByRole('button', { name: /invite member/i });
}

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: /invite member/i }));
}
function fillEmail(value = 'test.educator@example.com') {
  fireEvent.change(screen.getByPlaceholderText('member@example.com'), { target: { value } });
}
function chooseEducator() {
  fireEvent.click(screen.getByRole('button', { name: 'Educator' }));
}
async function send() {
  fireEvent.click(screen.getByRole('button', { name: /^send invitation$/i }));
  await waitFor(() => expect(screen.queryByText('Sending...')).not.toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  createInvite.mockResolvedValue({ inviteId: 'i1', email: 'test.educator@example.com', expiresAt: '2026-10-13T00:00:00Z', emailStatus: 'sent' });
  listInvites.mockResolvedValue({ invites: [], truncated: false });
});

describe('educator invites through SSO (AC11)', () => {
  it.each([
    ['college', 'college_educator'],
    ['school', 'school_educator'],
  ] as const)('%s org sends roles [%s] via SSO and never calls inviteMember', async (orgType, role) => {
    await renderManager(orgType);
    openModal();
    fillEmail();
    chooseEducator();
    await send();

    expect(createInvite).toHaveBeenCalledWith({ email: 'test.educator@example.com', organizationId: 'org-1', roles: [role] });
    expect(apiPost).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith('Invitation sent to test.educator@example.com');
  });

  it('educator form hides auto-assign subscription and personal message', async () => {
    await renderManager('college');
    openModal();
    expect(screen.getByText('Auto-assign subscription')).toBeInTheDocument();
    chooseEducator();
    expect(screen.queryByText('Auto-assign subscription')).not.toBeInTheDocument();
    expect(screen.queryByText(/Personal Message/)).not.toBeInTheDocument();
    expect(screen.getByText(/central sign-in service\. They have no subscription/)).toBeInTheDocument();
  });

  it('university: the educator toggle is disabled, an explicit message shows, nothing is sent', async () => {
    await renderManager('university');
    openModal();
    expect(screen.getByRole('button', { name: 'Educator' })).toBeDisabled();
    expect(screen.getByText('Educator invitations are not supported for university organizations.')).toBeInTheDocument();
    // clicking the disabled toggle does nothing: the form stays on the learner type
    fireEvent.click(screen.getByRole('button', { name: 'Educator' }));
    expect(screen.getByText('Auto-assign subscription')).toBeInTheDocument();
    expect(createInvite).not.toHaveBeenCalled();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('learner invites still call /organization inviteMember and not SSO', async () => {
    await renderManager('college');
    openModal();
    fillEmail('learner@example.com');
    await send();

    expect(createInvite).not.toHaveBeenCalled();
    expect(apiPost).toHaveBeenCalledWith('/organization', expect.objectContaining({
      action: 'inviteMember', memberType: 'learner', email: 'learner@example.com',
    }));
  });
});

describe('educator create reports email delivery', () => {
  async function createEducator() {
    await renderManager('college');
    openModal();
    fillEmail();
    chooseEducator();
    await send();
  }

  it('failed: shows the exact alert, no success toast, and refreshes the SSO list', async () => {
    createInvite.mockResolvedValue({ inviteId: 'i1', email: 'test.educator@example.com', expiresAt: '2026-10-13T00:00:00Z', emailStatus: 'failed' });
    await createEducator();

    expect(await screen.findByRole('alert')).toHaveTextContent('Invite created, but the email could not be delivered. Use Resend.');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(listInvites).toHaveBeenCalledTimes(2);
  });

  it('sent: shows the success toast and no banner', async () => {
    await createEducator();

    expect(toastSuccess).toHaveBeenCalledWith('Invitation sent to test.educator@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-unconfirmed-notice')).not.toBeInTheDocument();
  });

  it('absent: shows the neutral unconfirmed notice and NOT the success toast', async () => {
    createInvite.mockResolvedValue({ inviteId: 'i1', email: 'test.educator@example.com', expiresAt: '2026-10-13T00:00:00Z' });
    await createEducator();

    const notice = await screen.findByTestId('email-unconfirmed-notice');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent('Invitation created. Delivery could not be confirmed. Use Resend if the invitee did not receive it.');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('SSO error messages (AC12)', () => {
  const cases: Array<[string, string | null]> = [
    ['not_authorized', 'Only organization administrators can invite educators, and this organization must be your active organization. Switch to it or ask an administrator.'],
    ['conflict', 'An invitation is already pending for this email. Use Resend in the Pending invitations list.'],
    ['invalid_input', 'Enter a valid email address.'],
    ['not_authenticated', 'Your session has ended. Sign in again.'],
    ['rate_limited', 'Too many invitations sent. Try again later.'],
    ['timeout', 'Could not reach the sign-in service. Try again.'],
    ['network_failure', 'Could not reach the sign-in service. Try again.'],
    ['upstream_unavailable', 'Could not reach the sign-in service. Try again.'],
    ['cancelled', null],
    ['blocked', 'Could not send the invitation.'],
  ];

  it.each(cases)('%s', async (code, message) => {
    createInvite.mockRejectedValue(new SsoWorkflowError(code, 'Invite creation'));
    await renderManager('college');
    openModal();
    fillEmail();
    chooseEducator();
    await send();

    if (message === null) expect(toastError).not.toHaveBeenCalled();
    else expect(toastError).toHaveBeenCalledWith(message);
    // the modal stays open so the admin can retry; raw SSO text is never shown
    expect(screen.getByRole('button', { name: /^send invitation$/i })).toBeInTheDocument();
    expect(JSON.stringify(toastError.mock.calls)).not.toContain('Invite creation failed');
  });
});

describe('invitations tab (AC13, AC31)', () => {
  it('no longer says educator invitations are not listed; the Pending invitations card replaces the note', async () => {
    await renderManager('college');
    expect(screen.queryByTestId('educator-invite-note')).not.toBeInTheDocument();
    expect(screen.queryByText(/not listed here/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId('sso-invites')).toHaveTextContent('Pending invitations');
  });

  it('legacy educator rows get a Legacy badge, no Resend, and keep Cancel', async () => {
    await renderManager('college', [row({})]);
    const legacyRow = (await screen.findByText('legacy@example.com')).closest('div.p-4') as HTMLElement;

    expect(within(legacyRow).getByLabelText('Legacy educator invitation')).toHaveTextContent('Legacy');
    expect(within(legacyRow).queryByTitle('Resend Invitation')).not.toBeInTheDocument();
    expect(within(legacyRow).getByTitle('Cancel Invitation')).toBeInTheDocument();
  });

  it('learner pending rows still have Resend and no Legacy badge', async () => {
    await renderManager('college', [row({ id: 'inv-2', invitee_email: 'learner@example.com', invitee_role: 'learner' })]);
    const learnerRow = (await screen.findByText('learner@example.com')).closest('div.p-4') as HTMLElement;

    expect(within(learnerRow).getByTitle('Resend Invitation')).toBeInTheDocument();
    expect(within(learnerRow).queryByText('Legacy')).not.toBeInTheDocument();
  });
});
