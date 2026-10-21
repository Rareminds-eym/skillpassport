/**
 * ssoClient.listInvites / resendInvite: success returns the DTO; every non-success outcome throws
 * SsoWorkflowError carrying the SSO code (or the status when no code is present).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listInvitesMock = vi.fn();
const resendInviteMock = vi.fn();
vi.mock('@/shared/api/authClient', () => ({
  authClient: {
    request: vi.fn(),
    initialize: vi.fn(async () => ({ status: 'authenticated' })),
    getState: vi.fn(() => ({ phase: 'authenticated' })),
    subscribe: vi.fn(() => () => {}),
    listInvites: (...args: unknown[]) => listInvitesMock(...args),
    resendInvite: (...args: unknown[]) => resendInviteMock(...args),
  },
}));

import { SsoWorkflowError, ssoClient } from '@/shared/api/ssoClient';

const CODES = [
  'invalid_input', 'invalid_credentials', 'not_authenticated', 'not_authorized', 'conflict', 'not_found',
  'expired', 'blocked', 'timeout', 'network_failure', 'rate_limited', 'upstream_unavailable',
];

beforeEach(() => {
  listInvitesMock.mockReset();
  resendInviteMock.mockReset();
});

describe('ssoClient.listInvites', () => {
  it('returns the list data on success and forwards only organizationId', async () => {
    const data = {
      invites: [{ inviteId: 'i1', email: 'edu@example.com', roles: ['college_educator'], createdAt: '2026-10-07T00:00:00.000Z', expiresAt: '2026-10-14T00:00:00.000Z', status: 'pending' }],
      truncated: false,
    };
    listInvitesMock.mockResolvedValue({ status: 'succeeded', data });

    await expect(ssoClient.listInvites({ organizationId: 'org-1', extra: 'x' } as never)).resolves.toEqual(data);
    expect(listInvitesMock).toHaveBeenCalledWith({ organizationId: 'org-1' });
  });

  it.each(CODES)('rejection code %s throws SsoWorkflowError with that code', async (code) => {
    listInvitesMock.mockResolvedValue({ status: 'rejected', code });
    const error = await ssoClient.listInvites({ organizationId: 'org-1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe(code);
  });

  it('a transient outcome throws with its code', async () => {
    listInvitesMock.mockResolvedValue({ status: 'transient_unconfirmed', code: 'rate_limited' });
    const error = await ssoClient.listInvites({ organizationId: 'org-1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe('rate_limited');
  });

  it('a cancelled outcome throws with code "cancelled"', async () => {
    listInvitesMock.mockResolvedValue({ status: 'cancelled' });
    const error = await ssoClient.listInvites({ organizationId: 'org-1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe('cancelled');
  });
});

describe('ssoClient.resendInvite', () => {
  it.each(['sent', 'failed', undefined] as const)('returns the data (emailStatus %s) and forwards only inviteId', async (emailStatus) => {
    const data = { inviteId: 'i1', email: 'edu@example.com', expiresAt: '2026-10-14T00:00:00.000Z', ...(emailStatus ? { emailStatus } : {}) };
    resendInviteMock.mockResolvedValue({ status: 'succeeded', data });

    await expect(ssoClient.resendInvite({ inviteId: 'i1', redirectUrl: 'https://evil.example' } as never)).resolves.toEqual(data);
    expect(resendInviteMock).toHaveBeenCalledWith({ inviteId: 'i1' });
  });

  it.each(CODES)('rejection code %s throws SsoWorkflowError with that code', async (code) => {
    resendInviteMock.mockResolvedValue({ status: 'rejected', code });
    const error = await ssoClient.resendInvite({ inviteId: 'i1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe(code);
  });

  it('a transient outcome (HTTP 429 from the gateway) throws with code rate_limited', async () => {
    resendInviteMock.mockResolvedValue({ status: 'transient_unconfirmed', code: 'rate_limited' });
    const error = await ssoClient.resendInvite({ inviteId: 'i1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe('rate_limited');
  });

  it('a cancelled outcome throws with code "cancelled"', async () => {
    resendInviteMock.mockResolvedValue({ status: 'cancelled' });
    const error = await ssoClient.resendInvite({ inviteId: 'i1' }).catch((e) => e);
    expect(error).toBeInstanceOf(SsoWorkflowError);
    expect(error.code).toBe('cancelled');
  });
});
