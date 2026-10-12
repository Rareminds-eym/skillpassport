import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnifiedForgotPassword from '../UnifiedForgotPassword';
import TokenPasswordReset from '../TokenPasswordReset';

const client = vi.hoisted(() => ({ forgotPassword: vi.fn(), resetPassword: vi.fn() }));
vi.mock('@/shared/api/authClient', () => ({ authClient: client }));

const token = '12345678-1234-1234-1234-123456789abc';
function mount(reset = false) {
  render(<MemoryRouter initialEntries={[reset ? `/reset-password?token=${token}` : '/forgot-password']}>
    {reset ? <TokenPasswordReset /> : <UnifiedForgotPassword />}
  </MemoryRouter>);
}
function enterPassword(password: string) {
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));
}
beforeEach(() => { cleanup(); vi.resetAllMocks(); });

describe('password recovery with real SSO wrapper', () => {
  it.each(['rate_limited', 'upstream_unavailable', 'network_error'])('does not claim delivery for %s', async code => {
    client.forgotPassword.mockResolvedValue({ status: 'transient_unconfirmed', code });
    mount();
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'person@example.com' } });
    fireEvent.submit(screen.getByLabelText('Email Address').closest('form')!);
    await screen.findByText(code === 'rate_limited' ? /Too many requests/ : /Unable to request/);
    expect(screen.queryByText('Reset link sent!')).not.toBeInTheDocument();
  });
  it('shows expired-link guidance', async () => {
    client.resetPassword.mockResolvedValue({ status: 'rejected', code: 'expired' });
    mount(true); enterPassword('ValidPassword123!');
    await screen.findByText(/expired or already been used/);
  });
  it('rejects weak and overlong passwords before calling SSO', async () => {
    mount(true);
    enterPassword('abcdefghijk');
    expect(client.resetPassword).not.toHaveBeenCalled();
    enterPassword('Ab1!'.repeat(19));
    expect(client.resetPassword).not.toHaveBeenCalled();
  });
  it('shows completed password reset instead of email instructions', async () => {
    client.resetPassword.mockResolvedValue({ status: 'succeeded', data: { reset: true } });
    mount(true); enterPassword('ValidPassword123!');
    await screen.findByRole('heading', { name: 'Password Updated' });
    expect(screen.queryByText('Check Your Email')).not.toBeInTheDocument();
    expect(client.resetPassword).toHaveBeenCalledWith({ resetToken: token, password: 'ValidPassword123!' });
  });
  it('handles email request failures on the reset page', async () => {
    client.forgotPassword.mockResolvedValue({ status: 'transient_unconfirmed', code: 'rate_limited' });
    render(<MemoryRouter><TokenPasswordReset /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'person@example.com' } });
    fireEvent.submit(screen.getByLabelText('Email Address').closest('form')!);
    await screen.findByText(/Too many requests/);
    expect(screen.queryByText('Reset link sent!')).not.toBeInTheDocument();
  });
});
