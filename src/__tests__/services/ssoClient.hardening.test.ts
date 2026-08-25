/**
 * Tests for ssoClient hardening: getMe single-flight and per-endpoint
 * request-budget circuit breaker (runaway-loop protection).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMeMock = vi.fn();

vi.mock('@/shared/api/authClient', () => ({
  authClient: {
    request: vi.fn(),
    initialize: vi.fn(async () => ({ status: 'authenticated' })),
    getState: vi.fn(() => ({ phase: 'authenticated' })),
    subscribe: vi.fn(() => () => {}),
    getMe: (...args: unknown[]) => getMeMock(...args),
  },
}));

import { __resetRequestBudgetsForTests, AuthRequestBudgetError, ssoClient } from '@/shared/api/ssoClient';

beforeEach(() => {
  __resetRequestBudgetsForTests();
  getMeMock.mockReset();
});

describe('getMe single-flight', () => {
  it('shares one network request across concurrent callers', async () => {
    getMeMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 'succeeded',
                data: {
                  subject: 'u1',
                  email: 'a@b.test',
                  organizationId: 'org-1',
                  roles: ['learner'],
                  products: [],
                  membershipStatus: 'active',
                  emailVerified: true,
                },
              }),
            20,
          ),
        ),
    );

    const [a, b, c] = await Promise.all([ssoClient.getMe(), ssoClient.getMe(), ssoClient.getMe()]);

    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('fetches again after the in-flight call settles', async () => {
    getMeMock.mockResolvedValue({
      status: 'succeeded',
      data: { subject: 'u1', email: 'a@b.test', organizationId: 'o', roles: [], products: [], membershipStatus: 'active', emailVerified: true },
    });
    await ssoClient.getMe();
    await ssoClient.getMe();
    expect(getMeMock).toHaveBeenCalledTimes(2);
  });
});

describe('request budget circuit breaker', () => {
  it('throws once the /me budget is exceeded instead of spamming the backend', async () => {
    getMeMock.mockResolvedValue({
      status: 'succeeded',
      data: { subject: 'u1', email: 'a@b.test', organizationId: 'o', roles: [], products: [], membershipStatus: 'active', emailVerified: true },
    });

    // Budget max is 20; call 25 times sequentially.
    let budgetErrorSeen = false;
    for (let i = 0; i < 25; i += 1) {
      try {
        await ssoClient.getMe();
      } catch (err) {
        expect(err).toBeInstanceOf(AuthRequestBudgetError);
        budgetErrorSeen = true;
        break;
      }
    }
    expect(budgetErrorSeen).toBe(true);
    // Hard cap: no request beyond the budget window went out.
    expect(getMeMock.mock.calls.length).toBeLessThanOrEqual(21);
  });

  it('opens the session circuit after excessive initSession/refresh calls', async () => {
    let sessionErrorSeen = false;
    for (let i = 0; i < 25; i += 1) {
      try {
        await ssoClient.refresh();
      } catch (err) {
        expect(err).toBeInstanceOf(AuthRequestBudgetError);
        sessionErrorSeen = true;
        break;
      }
    }
    expect(sessionErrorSeen).toBe(true);
  });
});
