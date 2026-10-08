/**
 * AcceptInvitationPage (legacy learner invitations): sends no userId and shows the server's
 * 403 / 409 messages. The server is the control; the page's own email check is UX only.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiPost, apiGet, toastError, toastSuccess, ApiError } = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(readonly status: number, message: string, readonly code?: string) { super(message); this.name = 'ApiError'; }
  }
  return { apiPost: vi.fn(), apiGet: vi.fn(), toastError: vi.fn(), toastSuccess: vi.fn(), ApiError };
});

vi.mock('@/shared/api/apiClient', () => ({
  apiPost: (...a: unknown[]) => apiPost(...a),
  apiGet: (...a: unknown[]) => apiGet(...a),
  ApiError,
}));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: vi.fn(), getAccessToken: () => null } }));
vi.mock('react-hot-toast', () => ({
  default: { error: (...a: unknown[]) => toastError(...a), success: (...a: unknown[]) => toastSuccess(...a) },
}));
vi.mock('@/entities/organization', async () => ({
  memberInvitationService: (await import('@/entities/organization/api/memberInvitationService')).memberInvitationService,
}));

import { useAuthStore } from '@/shared/model/authStore';
import AcceptInvitationPage from '../AcceptInvitationPage';

const invitationRow = {
  id: 'inv-1', organization_id: 'org-1', organization_type: 'college', invitee_email: 'learner@example.com',
  invitee_role: 'learner', invited_by: 'admin-1', status: 'pending', invitation_token: 'tok-1',
  expires_at: '2099-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/accept-invitation?token=tok-1']}>
      <Routes>
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route path="*" element={<div>NAVIGATED AWAY</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function clickAccept() {
  const button = await screen.findByRole('button', { name: 'Accept' });
  fireEvent.click(button);
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: { id: 'user-1', email: 'learner@example.com', roles: ['learner'] },
    isAuthenticated: true,
  } as never);
  apiGet.mockImplementation(async (url: string) => {
    if (url.includes('getInvitationByToken')) return { data: invitationRow };
    return { data: 'Test College' };
  });
});

describe('AcceptInvitationPage accept', () => {
  it('posts the token only: no userId in the request body', async () => {
    apiPost.mockResolvedValue({ data: { ...invitationRow, status: 'accepted', organization_name: 'Test College' } });
    renderPage();
    await clickAccept();

    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(apiPost).toHaveBeenCalledWith('/organization', { action: 'acceptInvitation', token: 'tok-1' });
    expect(JSON.stringify(apiPost.mock.calls[0])).not.toContain('userId');
  });

  it('shows the server 403 (different email) message and does not navigate', async () => {
    const message = 'This invitation was sent to a different email address';
    apiPost.mockRejectedValue(new ApiError(403, message, 'FORBIDDEN'));
    renderPage();
    await clickAccept();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(screen.queryByText('NAVIGATED AWAY')).not.toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('shows the server 409 (already accepted) message and does not navigate', async () => {
    const message = 'This invitation has already been accepted';
    apiPost.mockRejectedValue(new ApiError(409, message, 'ALREADY_ACCEPTED'));
    renderPage();
    await clickAccept();

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(message));
    expect(screen.queryByText('NAVIGATED AWAY')).not.toBeInTheDocument();
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
