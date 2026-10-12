/**
 * ssoClient.createInvite: success returns the DTO; every non-success outcome throws
 * SsoWorkflowError carrying the SSO code (or the status when no code is present).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createInviteMock = vi.fn();
vi.mock('@/shared/api/authClient', () => ({
  authClient: {
    request: vi.fn(),
    initialize: vi.fn(async () => ({ status: 'authenticated' })),
    getState: vi.fn(() => ({ phase: 'authenticated' })),
    subscribe: vi.fn(() => () => { }),
    createInvite: (...args: unknown[]) => createInviteMock(...args),
  },
}));

import { SsoWorkflowError, ssoClient } from '@/shared/api/ssoClient';

const input = { email: 'edu@example.com', organizationId: 'org-1', roles: ['college_educator'] as const };

beforeEach(() => createInviteMock.mockReset());

describe('ssoClient.createInvite', () => {
  it('returns the invite data on success and forwards only email, organizationId and roles', async () => {
    const data = { inviteId: 'i1', email: 'edu@example.com', expiresAt: '2026-10-13T00:00:00.000Z' };
    createInviteMock.mockResolvedValue({ status: 'succeeded', data });

    await expect(ssoClient.createInvite({ ...input, redirectUrl: 'https://evil.example' } as never)).resolves.toEqual(data);
    expect(createInviteMock).toHaveBeenCalledWith({ email: 'edu@example.com', organizationId: 'org-1', roles: ['college_educator'] });
  });

  it.each(['sent', 'failed'] as const)('passes emailStatus "%s" through unchanged', async (emailStatus) => {
    const data = { inviteId: 'i1', email: 'edu@example.com', expiresAt: '2026-10-13T00:00:00.000Z', emailStatus };
    createInviteMock.mockResolvedValue({ status: 'succeeded', data });

    await expect(ssoClient.createInvite(input)).resolves.toEqual(data);
  });

  it('leaves emailStatus absent when SSO did not report it', async () => {
    const data = { inviteId: 'i1', email: 'edu@example.com', expiresAt: '2026-10-13T00:00:00.000Z' };
    createInviteMock.mockResolvedValue({ status: 'succeeded', data });

    const result = await ssoClient.createInvite(input);
    expect(result).not.toHaveProperty('emailStatus');
  });

  it.each([
    'invalid_input', 'invalid_credentials', 'not_authenticated', 'not_authorized', 'conflict', 'not_found',
    'expired', 'blocked', 'timeout', 'network_failure', 'rate_limited', 'upstream_unavailable',
  ])('rejection code %s throws SsoWorkflowError with that code', async (code) => {
    createInviteMock.mockResolvedValue({ status: 'rejected', code });
    const error = await ssoClient.createInvite(input).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe(code);
  });

  it('a cancelled outcome throws with code "cancelled"', async () => {
    createInviteMock.mockResolvedValue({ status: 'cancelled' });
    const error = await ssoClient.createInvite(input).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe('cancelled');
  });
});
