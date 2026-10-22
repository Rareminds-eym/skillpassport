import { describe, expect, it } from 'vitest';
import { meetsMinimumPlan } from '../subscriptionPlans';
import { checkFeatureAccess } from '@/features/subscription/lib/featureGating';

describe('merged subscription plan families', () => {
  it.each([
    ['premium', 'professional', true],
    ['basic', 'premium', false],
    ['recruiter_pro', 'recruiter_growth', true],
    ['recruiter_free', 'recruiter_lite', false],
    ['unknown', 'freemium', false],
    ['premium', 'unknown', false],
    ['constructor', 'freemium', false],
  ])('checks %s against %s', (current, required, allowed) => {
    expect(meetsMinimumPlan(current, required)).toBe(allowed);
  });
  it.each(['freemium', 'discover', 'recruiter_free'])('keeps free-tier application restrictions for %s', plan => {
    expect(checkFeatureAccess(plan, 'opportunities_access').hasAccess).toBe(false);
  });
});
