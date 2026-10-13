import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ user: {} as any, update: vi.fn(), logout: vi.fn(), navigate: vi.fn(), error: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/entities/user', () => ({ updatePassword: mocks.update }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => mocks.user, useAuthStore: { getState: () => ({ logout: mocks.logout }) } }));
vi.mock('@/shared/ui', () => ({ toast: { error: mocks.error, success: vi.fn() } }));
import FirstLoginPasswordGate from '../FirstLoginPasswordGate';
beforeEach(() => { vi.clearAllMocks(); mocks.user = { user_metadata: { must_change_password: true } }; mocks.update.mockResolvedValue(undefined); mocks.logout.mockResolvedValue(undefined); });
describe('first educator password', () => {
  it('does not render teaching/subscription content until password is changed', () => {
    render(<FirstLoginPasswordGate><div>Teaching portal</div></FirstLoginPasswordGate>);
    expect(screen.queryByText('Teaching portal')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Set your educator password' })).toBeInTheDocument();
  });
  it('uses authenticated password change, clears credentials and signs out for fresh claims', async () => {
    render(<FirstLoginPasswordGate><div>Teaching portal</div></FirstLoginPasswordGate>);
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'Temporary123!' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Different123!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Different123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('Different123!', 'Temporary123!'));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true }));
    expect(screen.getByLabelText('Temporary password')).toHaveValue('');
  });
  it('preserves normal educators without the authoritative flag', () => {
    mocks.user = { user_metadata: {} };
    render(<FirstLoginPasswordGate><div>Teaching portal</div></FirstLoginPasswordGate>);
    expect(screen.getByText('Teaching portal')).toBeInTheDocument();
  });
});
