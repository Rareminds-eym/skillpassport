/**
 * InvitationManager: Pending invitations card (SSO list) with Resend, persistent email-delivery notices,
 * and resend error copy. No Cancel and no copy-link for SSO invites.
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
  class SsoWorkflowError extends Error {
    constructor(readonly code: string, operation: string) { super(`${operation} failed (${code})`); this.name = 'SsoWorkflowError'; }
  }
  return {
    SsoWorkflowError,
    ssoClient: {
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
vi.mock('@/entities/organization', async () => ({
  memberInvitationService: (await import('@/entities/organization/api/memberInvitationService')).memberInvitationService,
}));

import { SsoWorkflowError } from '@/shared/api/ssoClient';
import InvitationManager from '../InvitationManager';

const pendingInvite = {
  inviteId: 'inv-sso-1',
  email: 'pending.educator@example.com',
  roles: ['college_educator'],
  createdAt: '2026-10-07T10:30:00.000Z',
  expiresAt: '2026-10-14T10:30:00.000Z',
  status: 'pending' as const,
};
const expiredInvite = {
  inviteId: 'inv-sso-2',
  email: 'expired.learner@example.com',
  roles: ['learner'],
  createdAt: '2026-09-01T10:30:00.000Z',
  expiresAt: '2026-09-08T10:30:00.000Z',
  status: 'expired' as const,
};

function mockLegacyApi(invitations: Array<Record<string, unknown>> = []) {
  apiGet.mockImplementation(async (url: string) => {
    if (url.includes('getInvitationStats')) {
      return { data: { total: 0, pending: 0, accepted: 0, expired: 0, cancelled: 0, acceptanceRate: 0 } };
    }
    return { data: invitations };
  });
  apiPost.mockResolvedValue({ data: {} });
}

async function renderManager(legacy: Array<Record<string, unknown>> = []) {
  mockLegacyApi(legacy);
  render(<InvitationManager organizationId="org-1" organizationType="college" licensePools={[]} />);
  await screen.findByRole('button', { name: /invite member/i });
}

const card = () => screen.getByTestId('sso-invites');

async function createEducator() {
  fireEvent.click(screen.getByRole('button', { name: /invite member/i }));
  fireEvent.change(screen.getByPlaceholderText('member@example.com'), { target: { value: 'new.educator@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Educator' }));
  fireEvent.click(screen.getByRole('button', { name: /^send invitation$/i }));
  await waitFor(() => expect(screen.queryByText('Sending...')).not.toBeInTheDocument());
}

beforeEach(() => {
  vi.clearAllMocks();
  listInvites.mockResolvedValue({ invites: [pendingInvite, expiredInvite], truncated: false });
  createInvite.mockResolvedValue({ inviteId: 'i1', email: 'new.educator@example.com', expiresAt: '2026-10-14T00:00:00Z', emailStatus: 'sent' });
  resendInvite.mockResolvedValue({ inviteId: 'inv-sso-1', email: pendingInvite.email, expiresAt: '2026-10-14T00:00:00Z', emailStatus: 'sent' });
});

describe('Pending invitations card', () => {
  it('lists email, role, exact Sent and Expires dates, status badge and a Resend button', async () => {
    await renderManager();
    const row = (await within(card()).findByText(pendingInvite.email)).closest('li') as HTMLElement;

    expect(within(row).getByText('Educator')).toBeInTheDocument();
    expect(within(row).getByText('Sent Oct 7, 2026')).toBeInTheDocument();
    expect(within(row).getByText('Expires Oct 14, 2026')).toBeInTheDocument();
    expect(within(row).getByText('Pending')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: `Resend invitation to ${pendingInvite.email}` })).toBeEnabled();
    expect(listInvites).toHaveBeenCalledWith({ organizationId: 'org-1' });
  });

  it('shows an expired row with the Expired badge and a Resend button, and a humanized role', async () => {
    await renderManager();
    const row = (await within(card()).findByText(expiredInvite.email)).closest('li') as HTMLElement;

    expect(within(row).getByText('Expired')).toBeInTheDocument();
    expect(within(row).getByText('Learner')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: `Resend invitation to ${expiredInvite.email}` })).toBeInTheDocument();
  });

  it('omits "Sent" when createdAt is null', async () => {
    listInvites.mockResolvedValue({ invites: [{ ...pendingInvite, createdAt: null }], truncated: false });
    await renderManager();
    const row = (await within(card()).findByText(pendingInvite.email)).closest('li') as HTMLElement;

    expect(within(row).queryByText(/^Sent /)).not.toBeInTheDocument();
    expect(within(row).getByText('Expires Oct 14, 2026')).toBeInTheDocument();
  });

  it('has no Cancel or copy-link control and the old "not listed here" note is gone', async () => {
    await renderManager();
    await within(card()).findByText(pendingInvite.email);

    expect(within(card()).queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(within(card()).queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    expect(within(card()).queryByText(/link/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('educator-invite-note')).not.toBeInTheDocument();
    expect(screen.queryByText(/not listed here/i)).not.toBeInTheDocument();
  });

  it('uses a list and never renders a token or hash', async () => {
    await renderManager();
    await within(card()).findByText(pendingInvite.email);

    expect(within(card()).getByRole('list')).toBeInTheDocument();
    expect(card().textContent ?? '').not.toMatch(/token|hash/i);
  });

  it('shows the empty state', async () => {
    listInvites.mockResolvedValue({ invites: [], truncated: false });
    await renderManager();
    expect(await within(card()).findByText('No pending invitations.')).toBeInTheDocument();
  });

  it('shows the truncated line when SSO reports more rows', async () => {
    listInvites.mockResolvedValue({ invites: [pendingInvite], truncated: true });
    await renderManager();
    expect(await within(card()).findByText('Showing the 100 most recent pending invitations.')).toBeInTheDocument();
  });

  it('a list error shows Retry inside the card while the legacy list still renders', async () => {
    listInvites.mockRejectedValueOnce(new SsoWorkflowError('upstream_unavailable', 'Invite list'));
    await renderManager([{
      id: 'inv-1', organization_id: 'org-1', organization_type: 'college', invitee_email: 'legacy@example.com',
      invitee_role: 'learner', invited_by: 'admin-1', status: 'pending', invitation_token: 't',
      expires_at: '2099-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }]);

    expect(await within(card()).findByText('Could not load pending invitations.')).toBeInTheDocument();
    expect(screen.getByText('legacy@example.com')).toBeInTheDocument();
    expect(JSON.stringify(card().textContent)).not.toContain('Invite list failed');

    fireEvent.click(within(card()).getByRole('button', { name: /retry/i }));
    expect(await within(card()).findByText(pendingInvite.email)).toBeInTheDocument();
    expect(listInvites).toHaveBeenCalledTimes(2);
  });

  it('a not_authorized list error shows the administrators-only message', async () => {
    listInvites.mockRejectedValue(new SsoWorkflowError('not_authorized', 'Invite list'));
    await renderManager();
    expect(await within(card()).findByText('Only organization administrators can view pending invitations.')).toBeInTheDocument();
  });
});

describe('Resend from the Pending invitations card', () => {
  async function clickResend(email = pendingInvite.email) {
    await within(card()).findByText(email);
    fireEvent.click(within(card()).getByRole('button', { name: `Resend invitation to ${email}` }));
  }

  it('sent: calls resend with only the invite id, shows the toast, and refreshes the list', async () => {
    await renderManager();
    await clickResend();

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(`Invitation resent to ${pendingInvite.email}. The previous link no longer works.`));
    expect(resendInvite).toHaveBeenCalledWith({ inviteId: 'inv-sso-1' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(listInvites).toHaveBeenCalledTimes(2));
  });

  it('failed: shows the persistent alert and no success toast', async () => {
    resendInvite.mockResolvedValue({ inviteId: 'inv-sso-1', email: pendingInvite.email, expiresAt: '2026-10-14T00:00:00Z', emailStatus: 'failed' });
    await renderManager();
    await clickResend();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The invitation was renewed, but the email could not be delivered. The previous link no longer works. Use Resend to try again.',
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('absent emailStatus: shows the neutral renewed notice and no success toast', async () => {
    resendInvite.mockResolvedValue({ inviteId: 'inv-sso-1', email: pendingInvite.email, expiresAt: '2026-10-14T00:00:00Z' });
    await renderManager();
    await clickResend();

    const notice = await screen.findByTestId('email-unconfirmed-notice');
    expect(notice).toHaveTextContent('Invitation renewed. Delivery could not be confirmed. Use Resend if the invitee did not receive it.');
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the row button and ignores extra clicks while in flight', async () => {
    let release: (v: unknown) => void = () => {};
    resendInvite.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    await renderManager();
    await clickResend();

    const button = within(card()).getByRole('button', { name: `Resend invitation to ${pendingInvite.email}` });
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);
    expect(resendInvite).toHaveBeenCalledTimes(1);

    release({ inviteId: 'inv-sso-1', email: pendingInvite.email, expiresAt: '2026-10-14T00:00:00Z', emailStatus: 'sent' });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    await waitFor(() => expect(within(card()).getByRole('button', { name: `Resend invitation to ${pendingInvite.email}` })).toBeEnabled());
  });

  const cases: Array<[string, string | null]> = [
    ['rate_limited', 'Too many invitations sent. Try again later.'],
    ['not_authorized', 'Only organization administrators can resend invitations, and this organization must be your active organization.'],
    ['conflict', 'This invitation was already accepted.'],
    ['not_found', 'This invitation no longer exists.'],
    ['not_authenticated', 'Your session has ended. Sign in again.'],
    ['timeout', 'Could not reach the sign-in service. Try again.'],
    ['network_failure', 'Could not reach the sign-in service. Try again.'],
    ['upstream_unavailable', 'Could not reach the sign-in service. Try again.'],
    ['cancelled', null],
    ['invalid_input', 'Could not resend the invitation.'],
    ['blocked', 'Could not resend the invitation.'],
  ];

  it.each(cases)('error code %s', async (code, message) => {
    resendInvite.mockRejectedValue(new SsoWorkflowError(code, 'Invite resend'));
    await renderManager();
    await clickResend();

    if (message === null) {
      await waitFor(() => expect(resendInvite).toHaveBeenCalled());
      expect(toastError).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    }
    expect(JSON.stringify(toastError.mock.calls)).not.toContain('Invite resend failed');
    expect(toastSuccess).not.toHaveBeenCalled();
    await waitFor(() => expect(within(card()).getByRole('button', { name: `Resend invitation to ${pendingInvite.email}` })).toBeEnabled());
  });

  it('refreshes the list when the invite was already accepted', async () => {
    resendInvite.mockRejectedValue(new SsoWorkflowError('conflict', 'Invite resend'));
    await renderManager();
    await clickResend();

    await waitFor(() => expect(listInvites).toHaveBeenCalledTimes(2));
  });
});

describe('create flow and other invite types', () => {
  it('a dismissible failure banner can be closed', async () => {
    createInvite.mockResolvedValue({ inviteId: 'i1', email: 'new.educator@example.com', expiresAt: '2026-10-14T00:00:00Z', emailStatus: 'failed' });
    await renderManager();
    await createEducator();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invite created, but the email could not be delivered. Use Resend.');
    fireEvent.click(within(alert).getByRole('button', { name: /dismiss notice/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('creating with "sent" shows the toast, no banner, and refreshes the list', async () => {
    await renderManager();
    await createEducator();

    expect(toastSuccess).toHaveBeenCalledWith('Invitation sent to new.educator@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await waitFor(() => expect(listInvites).toHaveBeenCalledTimes(2));
  });

  it('learner invites still use inviteMember and do not touch SSO create or the notice', async () => {
    await renderManager();
    fireEvent.click(screen.getByRole('button', { name: /invite member/i }));
    fireEvent.change(screen.getByPlaceholderText('member@example.com'), { target: { value: 'learner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^send invitation$/i }));
    await waitFor(() => expect(screen.queryByText('Sending...')).not.toBeInTheDocument());

    expect(createInvite).not.toHaveBeenCalled();
    expect(apiPost).toHaveBeenCalledWith('/organization', expect.objectContaining({ action: 'inviteMember', memberType: 'learner' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-unconfirmed-notice')).not.toBeInTheDocument();
  });
});
