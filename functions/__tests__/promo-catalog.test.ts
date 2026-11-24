// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({ verified: true, role: 'learner', redeem: vi.fn(), accepted: vi.fn(), rows: [] as Record<string, unknown>[] }));
vi.mock('../lib/auth', () => ({ getAuthInstance: () => ({ authenticate: (handler: (req: Request, context: { user: { sub: string; email: string; is_email_verified: boolean } }) => Response) => (req: Request) => handler(req, {
  user: { sub: 'buyer', email: 'buyer@example.invalid', is_email_verified: f.verified },
}) }) }));
vi.mock('../api/payments/lib/promoCode', async (original) => ({ ...await original(), confirmPromoRedemption: f.redeem, getAcceptedOfferSnapshot: f.accepted }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from(table: string) {
  const q = {
    select: () => q, eq: () => q, order: () => q, overlaps: () => q, in: () => q,
    maybeSingle: async () => ({ data: { role: f.role, metadata: { referralCode: 'DYNAMIC2026' } } }),
    then: <T,>(resolve: (result: { data: Record<string, unknown>[]; error: null }) => T) => Promise.resolve({ data: table === 'plans_cache' ? f.rows : [], error: null }).then(resolve),
  };
  return q;
} }) }));
import { handleSubscriptionPlans } from '../api/payments/handlers/subscription-plans';

function request() {
  return handleSubscriptionPlans({ env: { SSO_SERVICE: {} }, request: new Request('https://example.test/api/payments/subscription-plans', { headers: { Authorization: 'Bearer synthetic' } }) });
}
beforeEach(() => {
  vi.clearAllMocks(); f.verified = true; f.role = 'learner';
  f.accepted.mockResolvedValue({ promoCodeId: 'promo', priceAdjustment: 237, offer: { planId: 'starter', amountMinor: 173600, minorUnit: 2 } });
});

it.each(['learner', 'school_admin', 'college_admin'])('adjusts the eligible plan once for %s', async (role) => {
  f.role = role;
  const prefix = role === 'learner' ? 'skill' : role.split('_')[0];
  f.rows = ['starter', 'advanced'].map((tier) => ({ id: tier, name: `${prefix} ${tier}`, plan_code: `${prefix}_${tier}`, pricing_matrix: { all: { yearly: 1499 } } }));
  const response = await request();
  const { data: { plans } } = await response.json();
  expect(plans[0]).toMatchObject({ price: 1736, yearlyPrice: 1736, isDisabled: false, hidePrice: false });
  expect(plans[1]).toMatchObject({ isDisabled: true, hidePrice: true });
  expect(f.accepted).toHaveBeenCalledWith(expect.anything(), 'buyer', role, 'DYNAMIC2026');
  expect(f.redeem).not.toHaveBeenCalled();
});

it('leaves ordinary pricing available when redemption is rejected', async () => {
  f.accepted.mockResolvedValue(null);
  f.rows = [{ id: 'starter', name: 'Skill Starter', plan_code: 'skill_starter', pricing_matrix: { all: { yearly: 1499 } } }];
  const { data: { plans } } = await (await request()).json();
  expect(plans[0].price).toBe(1499);
  expect(plans[0].isDisabled).toBeUndefined();
});

it('does not consume promo quota for an unverified account', async () => {
  f.verified = false;
  expect((await request()).status).toBe(200);
  expect(f.redeem).not.toHaveBeenCalled();
});
