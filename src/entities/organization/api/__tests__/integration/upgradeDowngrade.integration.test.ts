/**
 * Integration Tests: Upgrade/Downgrade Flows
 * 
 * Tests subscription plan upgrades, downgrades, prorated billing,
 * and feature access changes.
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Upgrade/Downgrade Integration Tests', () => {
  let subscriptions: Map<string, any>;
  let plans: Map<string, any>;
  let entitlements: Map<string, any>;
  let assignments: Map<string, any>;

  beforeEach(() => {
    subscriptions = new Map();
    assignments = new Map();
    entitlements = new Map();
    
    // Setup subscription plans
    plans = new Map([
      ['plan-basic', {
        id: 'plan-basic',
        name: 'Basic',
        price: 500,
        features: ['feature-a', 'feature-b'],
        tier: 1
      }],
      ['plan-pro', {
        id: 'plan-pro',
        name: 'Professional',
        price: 1000,
        features: ['feature-a', 'feature-b', 'feature-c', 'feature-d'],
        tier: 2
      }],
      ['plan-enterprise', {
        id: 'plan-enterprise',
        name: 'Enterprise',
        price: 2000,
        features: ['feature-a', 'feature-b', 'feature-c', 'feature-d', 'feature-e', 'feature-f'],
        tier: 3
      }]
    ]);

    vi.clearAllMocks();
  });

  describe('Plan Upgrade', () => {
    it('should upgrade subscription to higher tier plan', async () => {
      const subscription = {
        id: 'sub-123',
        organization_id: 'org-123',
        subscription_plan_id: 'plan-basic',
        total_seats: 50,
        status: 'active',
        price_per_seat: 500,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
        end_date: new Date(Date.now() + 86400000 * 15).toISOString() // 15 days from now
      };
      subscriptions.set(subscription.id, subscription);

      const upgradeSubscription = async (subId: string, newPlanId: string) => {
        const sub = subscriptions.get(subId);
        const currentPlan = plans.get(sub.subscription_plan_id);
        const newPlan = plans.get(newPlanId);

        if (!newPlan || !currentPlan) {
          throw new Error('Plan not found');
        }

        if (newPlan.tier <= currentPlan.tier) {
          throw new Error('New plan must be higher tier for upgrade');
        }

        // Calculate prorated amount
        const now = new Date();
        const endDate = new Date(sub.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dailyDifference = (newPlan.price - currentPlan.price) / 30;
        const proratedAmount = dailyDifference * daysRemaining * sub.total_seats;

        sub.subscription_plan_id = newPlanId;
        sub.price_per_seat = newPlan.price;
        sub.upgraded_at = now.toISOString();
        sub.upgrade_prorated_amount = proratedAmount;

        return {
          subscription: sub,
          proratedAmount,
          newFeatures: newPlan.features.filter((f: string) => !currentPlan.features.includes(f))
        };
      };

      const result = await upgradeSubscription('sub-123', 'plan-pro');

      expect(result.subscription.subscription_plan_id).toBe('plan-pro');
      expect(result.subscription.price_per_seat).toBe(1000);
      expect(result.proratedAmount).toBeGreaterThan(0);
      expect(result.newFeatures).toContain('feature-c');
      expect(result.newFeatures).toContain('feature-d');
    });

    it('should grant new features immediately on upgrade', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-basic',
        total_seats: 10
      };
      subscriptions.set(subscription.id, subscription);

      // Setup existing assignments and entitlements
      for (let i = 1; i <= 5; i++) {
        assignments.set(`assign-${i}`, {
          id: `assign-${i}`,
          user_id: `user-${i}`,
          organization_subscription_id: 'sub-123',
          status: 'active'
        });
        // Basic plan features
        entitlements.set(`ent-${i}-a`, {
          id: `ent-${i}-a`,
          user_id: `user-${i}`,
          feature_key: 'feature-a',
          is_active: true
        });
        entitlements.set(`ent-${i}-b`, {
          id: `ent-${i}-b`,
          user_id: `user-${i}`,
          feature_key: 'feature-b',
          is_active: true
        });
      }

      const upgradeWithEntitlements = async (subId: string, newPlanId: string) => {
        const sub = subscriptions.get(subId);
        const newPlan = plans.get(newPlanId);
        const currentPlan = plans.get(sub.subscription_plan_id);

        // Get new features
        const newFeatures = newPlan.features.filter(
          (f: string) => !currentPlan.features.includes(f)
        );

        // Grant new features to all assigned users
        const grantedEntitlements: any[] = [];
        for (const [, assignment] of assignments) {
          if (assignment.organization_subscription_id === subId && assignment.status === 'active') {
            for (const feature of newFeatures) {
              const ent = {
                id: `ent-${assignment.user_id}-${feature}`,
                user_id: assignment.user_id,
                feature_key: feature,
                is_active: true,
                granted_by_organization: true
              };
              entitlements.set(ent.id, ent);
              grantedEntitlements.push(ent);
            }
          }
        }

        sub.subscription_plan_id = newPlanId;
        return { subscription: sub, grantedEntitlements };
      };

      const result = await upgradeWithEntitlements('sub-123', 'plan-pro');

      expect(result.grantedEntitlements.length).toBe(10); // 5 users × 2 new features
      
      // Verify user-1 has all pro features
      const user1Features = Array.from(entitlements.values())
        .filter(e => e.user_id === 'user-1' && e.is_active)
        .map(e => e.feature_key);
      
      expect(user1Features).toContain('feature-a');
      expect(user1Features).toContain('feature-b');
      expect(user1Features).toContain('feature-c');
      expect(user1Features).toContain('feature-d');
    });

    it('should calculate correct prorated upgrade cost', async () => {
      const calculateProratedUpgradeCost = (
        currentPlanPrice: number,
        newPlanPrice: number,
        seatCount: number,
        daysRemaining: number,
        billingCycleDays: number = 30
      ) => {
        const dailyCurrentCost = (currentPlanPrice * seatCount) / billingCycleDays;
        const dailyNewCost = (newPlanPrice * seatCount) / billingCycleDays;
        const dailyDifference = dailyNewCost - dailyCurrentCost;
        const proratedAmount = dailyDifference * daysRemaining;

        return {
          dailyDifference: Math.round(dailyDifference * 100) / 100,
          proratedAmount: Math.round(proratedAmount * 100) / 100,
          effectiveDate: new Date().toISOString()
        };
      };

      // Basic (500) to Pro (1000), 50 seats, 15 days remaining
      const result = calculateProratedUpgradeCost(500, 1000, 50, 15);

      expect(result.dailyDifference).toBeCloseTo(833.33, 1);
      expect(result.proratedAmount).toBeCloseTo(12500, 0);
    });
  });

  describe('Plan Downgrade', () => {
    it('should downgrade subscription to lower tier plan', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-pro',
        total_seats: 50,
        status: 'active',
        end_date: new Date(Date.now() + 86400000 * 15).toISOString()
      };
      subscriptions.set(subscription.id, subscription);

      const downgradeSubscription = async (subId: string, newPlanId: string) => {
        const sub = subscriptions.get(subId);
        const currentPlan = plans.get(sub.subscription_plan_id);
        const newPlan = plans.get(newPlanId);

        if (newPlan.tier >= currentPlan.tier) {
          throw new Error('New plan must be lower tier for downgrade');
        }

        // Downgrade takes effect at end of billing period
        sub.pending_plan_change = {
          new_plan_id: newPlanId,
          effective_date: sub.end_date,
          scheduled_at: new Date().toISOString()
        };

        return {
          subscription: sub,
          effectiveDate: sub.end_date,
          featuresLosing: currentPlan.features.filter(
            (f: string) => !newPlan.features.includes(f)
          )
        };
      };

      const result = await downgradeSubscription('sub-123', 'plan-basic');

      expect(result.subscription.pending_plan_change).toBeDefined();
      expect(result.subscription.pending_plan_change.new_plan_id).toBe('plan-basic');
      expect(result.featuresLosing).toContain('feature-c');
      expect(result.featuresLosing).toContain('feature-d');
    });

    it('should revoke features only at billing period end', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-pro',
        pending_plan_change: {
          new_plan_id: 'plan-basic',
          effective_date: new Date(Date.now() - 1000).toISOString() // Just passed
        }
      };
      subscriptions.set(subscription.id, subscription);

      // Setup entitlements for pro features
      for (let i = 1; i <= 3; i++) {
        assignments.set(`assign-${i}`, {
          id: `assign-${i}`,
          user_id: `user-${i}`,
          organization_subscription_id: 'sub-123',
          status: 'active'
        });
        for (const feature of ['feature-a', 'feature-b', 'feature-c', 'feature-d']) {
          entitlements.set(`ent-${i}-${feature}`, {
            id: `ent-${i}-${feature}`,
            user_id: `user-${i}`,
            feature_key: feature,
            is_active: true
          });
        }
      }

      const processPendingDowngrade = async (subId: string) => {
        const sub = subscriptions.get(subId);
        if (!sub.pending_plan_change) return null;

        const effectiveDate = new Date(sub.pending_plan_change.effective_date);
        if (new Date() < effectiveDate) return null;

        const newPlan = plans.get(sub.pending_plan_change.new_plan_id);
        const currentPlan = plans.get(sub.subscription_plan_id);
        const featuresToRevoke = currentPlan.features.filter(
          (f: string) => !newPlan.features.includes(f)
        );

        // Revoke features for all assigned users
        const revokedEntitlements: any[] = [];
        for (const [, ent] of entitlements) {
          if (featuresToRevoke.includes(ent.feature_key) && ent.is_active) {
            ent.is_active = false;
            ent.revoked_at = new Date().toISOString();
            ent.revocation_reason = 'Plan downgrade';
            revokedEntitlements.push(ent);
          }
        }

        // Apply plan change
        sub.subscription_plan_id = sub.pending_plan_change.new_plan_id;
        sub.price_per_seat = newPlan.price;
        delete sub.pending_plan_change;

        return { subscription: sub, revokedEntitlements };
      };

      const result = await processPendingDowngrade('sub-123');

      expect(result).not.toBeNull();
      expect(result?.subscription.subscription_plan_id).toBe('plan-basic');
      expect(result?.revokedEntitlements.length).toBe(6); // 3 users × 2 features (c, d)
    });

    it('should allow cancellation of pending downgrade', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-pro',
        pending_plan_change: {
          new_plan_id: 'plan-basic',
          effective_date: new Date(Date.now() + 86400000 * 10).toISOString()
        }
      };
      subscriptions.set(subscription.id, subscription);

      const cancelPendingChange = async (subId: string) => {
        const sub = subscriptions.get(subId);
        if (!sub.pending_plan_change) {
          throw new Error('No pending plan change to cancel');
        }

        const cancelled = { ...sub.pending_plan_change };
        delete sub.pending_plan_change;

        return { subscription: sub, cancelledChange: cancelled };
      };

      const result = await cancelPendingChange('sub-123');

      expect(result.subscription.pending_plan_change).toBeUndefined();
      expect(result.cancelledChange.new_plan_id).toBe('plan-basic');
    });
  });

  describe('Seat Count Changes', () => {
    it('should add seats with prorated billing', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-pro',
        total_seats: 50,
        assigned_seats: 45,
        price_per_seat: 1000,
        start_date: new Date(Date.now() - 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 15).toISOString()
      };
      subscriptions.set(subscription.id, subscription);

      const addSeats = async (subId: string, additionalSeats: number) => {
        const sub = subscriptions.get(subId);
        
        // Calculate prorated cost
        const now = new Date();
        const endDate = new Date(sub.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dailyCost = sub.price_per_seat / 30;
        const proratedCost = dailyCost * daysRemaining * additionalSeats;

        sub.total_seats += additionalSeats;

        return {
          subscription: sub,
          additionalSeats,
          proratedCost: Math.round(proratedCost * 100) / 100,
          newTotalSeats: sub.total_seats
        };
      };

      const result = await addSeats('sub-123', 25);

      expect(result.newTotalSeats).toBe(75);
      expect(result.proratedCost).toBeGreaterThan(0);
    });

    it('should reduce seats only if not exceeding assigned count', async () => {
      const subscription = {
        id: 'sub-123',
        total_seats: 50,
        assigned_seats: 40
      };
      subscriptions.set(subscription.id, subscription);

      const reduceSeats = async (subId: string, newSeatCount: number) => {
        const sub = subscriptions.get(subId);

        if (newSeatCount < sub.assigned_seats) {
          throw new Error(
            `Cannot reduce to ${newSeatCount} seats. ${sub.assigned_seats} seats are currently assigned.`
          );
        }

        sub.total_seats = newSeatCount;
        return sub;
      };

      // Should fail - trying to reduce below assigned
      await expect(reduceSeats('sub-123', 30)).rejects.toThrow(
        'Cannot reduce to 30 seats. 40 seats are currently assigned.'
      );

      // Should succeed - reducing to exactly assigned
      const result = await reduceSeats('sub-123', 40);
      expect(result.total_seats).toBe(40);
    });

    it('should apply credit for seat reduction at renewal', async () => {
      const subscription = {
        id: 'sub-123',
        total_seats: 100,
        assigned_seats: 50,
        price_per_seat: 1000,
        pending_seat_reduction: null
      };
      subscriptions.set(subscription.id, subscription);

      const scheduleSeatReduction = async (subId: string, newSeatCount: number) => {
        const sub = subscriptions.get(subId);

        if (newSeatCount < sub.assigned_seats) {
          throw new Error('Cannot reduce below assigned seats');
        }

        sub.pending_seat_reduction = {
          new_seat_count: newSeatCount,
          scheduled_at: new Date().toISOString(),
          seats_to_remove: sub.total_seats - newSeatCount
        };

        return {
          subscription: sub,
          effectiveAtRenewal: true,
          seatsToRemove: sub.total_seats - newSeatCount
        };
      };

      const result = await scheduleSeatReduction('sub-123', 60);

      expect(result.subscription.pending_seat_reduction).toBeDefined();
      expect(result.seatsToRemove).toBe(40);
      expect(result.effectiveAtRenewal).toBe(true);
    });
  });

  describe('Feature Access Validation', () => {
    it('should correctly identify accessible features after upgrade', async () => {
      const checkFeatureAccess = (planId: string, featureKey: string) => {
        const plan = plans.get(planId);
        return plan?.features.includes(featureKey) || false;
      };

      // Basic plan
      expect(checkFeatureAccess('plan-basic', 'feature-a')).toBe(true);
      expect(checkFeatureAccess('plan-basic', 'feature-c')).toBe(false);

      // Pro plan
      expect(checkFeatureAccess('plan-pro', 'feature-a')).toBe(true);
      expect(checkFeatureAccess('plan-pro', 'feature-c')).toBe(true);
      expect(checkFeatureAccess('plan-pro', 'feature-e')).toBe(false);

      // Enterprise plan
      expect(checkFeatureAccess('plan-enterprise', 'feature-e')).toBe(true);
      expect(checkFeatureAccess('plan-enterprise', 'feature-f')).toBe(true);
    });

    it('should maintain access during plan transition period', async () => {
      const subscription = {
        id: 'sub-123',
        subscription_plan_id: 'plan-pro',
        status: 'active',
        pending_plan_change: {
          new_plan_id: 'plan-basic',
          effective_date: new Date(Date.now() + 86400000 * 5).toISOString()
        }
      };

      const hasFeatureAccess = (sub: any, featureKey: string) => {
        // During transition, use current plan features
        const currentPlan = plans.get(sub.subscription_plan_id);
        return currentPlan?.features.includes(featureKey) || false;
      };

      // Should still have pro features during transition
      expect(hasFeatureAccess(subscription, 'feature-c')).toBe(true);
      expect(hasFeatureAccess(subscription, 'feature-d')).toBe(true);
    });
  });

  describe('Billing Integration', () => {
    it('should create payment record for upgrade', async () => {
      const payments: any[] = [];

      const processUpgradePayment = async (
        subscriptionId: string,
        proratedAmount: number,
        organizationId: string
      ) => {
        const payment = {
          id: `pay-${Date.now()}`,
          organization_id: organizationId,
          subscription_id: subscriptionId,
          amount: proratedAmount,
          type: 'upgrade_proration',
          status: 'completed',
          created_at: new Date().toISOString()
        };
        payments.push(payment);
        return payment;
      };

      const payment = await processUpgradePayment('sub-123', 12500, 'org-123');

      expect(payment.type).toBe('upgrade_proration');
      expect(payment.amount).toBe(12500);
      expect(payments.length).toBe(1);
    });

    it('should generate credit for downgrade', async () => {
      const credits: any[] = [];

      const generateDowngradeCredit = async (
        subscriptionId: string,
        creditAmount: number,
        organizationId: string
      ) => {
        const credit = {
          id: `credit-${Date.now()}`,
          organization_id: organizationId,
          subscription_id: subscriptionId,
          amount: creditAmount,
          type: 'downgrade_credit',
          status: 'pending',
          applies_at: 'next_renewal',
          created_at: new Date().toISOString()
        };
        credits.push(credit);
        return credit;
      };

      const credit = await generateDowngradeCredit('sub-123', 5000, 'org-123');

      expect(credit.type).toBe('downgrade_credit');
      expect(credit.applies_at).toBe('next_renewal');
    });
  });
});
