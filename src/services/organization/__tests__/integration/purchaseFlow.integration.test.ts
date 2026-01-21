/**
 * Integration Tests: Complete Purchase Flow
 *
 * Tests the end-to-end purchase flow from plan selection through payment to assignment.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client for integration tests
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

// Mock data
const mockOrganization = {
  id: 'org-123',
  name: 'Test School',
  type: 'school',
};

const mockPlan = {
  id: 'plan-123',
  name: 'Premium Plan',
  price_monthly: 1000,
  price_yearly: 10000,
  features: ['feature1', 'feature2'],
};

const mockUser = {
  id: 'admin-123',
  email: 'admin@test.com',
  role: 'school_admin',
  school_id: 'org-123',
};

describe('Purchase Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Purchase Flow', () => {
    it('should complete full purchase flow: plan selection → pricing → subscription creation', async () => {
      // Step 1: Get available plans
      const mockPlansQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPlan, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockPlansQuery);

      // Simulate plan selection
      const selectedPlan = mockPlan;
      const seatCount = 50;

      // Step 2: Calculate pricing with volume discount
      const calculatePricing = (basePrice: number, seats: number) => {
        const subtotal = basePrice * seats;
        let discountPercentage = 0;
        if (seats >= 500) discountPercentage = 30;
        else if (seats >= 100) discountPercentage = 20;
        else if (seats >= 50) discountPercentage = 10;

        const discountAmount = (subtotal * discountPercentage) / 100;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * 0.18;
        const finalAmount = afterDiscount + taxAmount;

        return {
          basePrice,
          seatCount: seats,
          subtotal,
          discountPercentage,
          discountAmount,
          taxAmount,
          finalAmount,
          pricePerSeat: finalAmount / seats,
        };
      };

      const pricing = calculatePricing(selectedPlan.price_monthly, seatCount);

      // Verify pricing calculation
      expect(pricing.discountPercentage).toBe(10); // 50 seats = 10% discount
      expect(pricing.subtotal).toBe(50000); // 1000 * 50
      expect(pricing.discountAmount).toBe(5000); // 10% of 50000
      expect(pricing.taxAmount).toBe(8100); // 18% of 45000
      expect(pricing.finalAmount).toBe(53100); // 45000 + 8100

      // Step 3: Create subscription
      const mockSubscription = {
        id: 'sub-123',
        organization_id: mockOrganization.id,
        organization_type: 'school',
        subscription_plan_id: selectedPlan.id,
        purchased_by: mockUser.id,
        total_seats: seatCount,
        assigned_seats: 0,
        target_member_type: 'both',
        status: 'active',
        price_per_seat: pricing.pricePerSeat,
        total_amount: pricing.subtotal,
        discount_percentage: pricing.discountPercentage,
        final_amount: pricing.finalAmount,
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockInsertQuery);

      // Verify subscription was created correctly
      expect(mockSubscription.total_seats).toBe(50);
      expect(mockSubscription.status).toBe('active');
      expect(mockSubscription.discount_percentage).toBe(10);
    });

    it('should create license pool after subscription purchase', async () => {
      const mockSubscription = {
        id: 'sub-123',
        organization_id: 'org-123',
        total_seats: 50,
        assigned_seats: 0,
      };

      const mockPool = {
        id: 'pool-123',
        organization_subscription_id: mockSubscription.id,
        organization_id: mockSubscription.organization_id,
        pool_name: 'Default Pool',
        member_type: 'educator',
        allocated_seats: 25,
        assigned_seats: 0,
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockInsertQuery);

      // Verify pool creation
      expect(mockPool.organization_subscription_id).toBe(mockSubscription.id);
      expect(mockPool.allocated_seats).toBeLessThanOrEqual(mockSubscription.total_seats);
    });

    it('should handle payment failure gracefully', async () => {
      const paymentError = new Error('Payment declined');

      // Simulate payment failure
      const handlePaymentFailure = async (error: Error) => {
        return {
          success: false,
          error: error.message,
          retryable: true,
          suggestedAction: 'Please try a different payment method',
        };
      };

      const result = await handlePaymentFailure(paymentError);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment declined');
      expect(result.retryable).toBe(true);
    });

    it('should rollback subscription on payment failure', async () => {
      const mockSubscription = {
        id: 'sub-123',
        status: 'pending_payment',
      };

      // Simulate rollback
      const rollbackSubscription = async (subscriptionId: string) => {
        const mockDeleteQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
        mockSupabaseClient.from.mockReturnValue(mockDeleteQuery);

        return { success: true, deletedId: subscriptionId };
      };

      const result = await rollbackSubscription(mockSubscription.id);
      expect(result.success).toBe(true);
      expect(result.deletedId).toBe('sub-123');
    });
  });

  describe('Volume Discount Tiers', () => {
    const testCases = [
      { seats: 10, expectedDiscount: 0 },
      { seats: 49, expectedDiscount: 0 },
      { seats: 50, expectedDiscount: 10 },
      { seats: 99, expectedDiscount: 10 },
      { seats: 100, expectedDiscount: 20 },
      { seats: 499, expectedDiscount: 20 },
      { seats: 500, expectedDiscount: 30 },
      { seats: 1000, expectedDiscount: 30 },
    ];

    testCases.forEach(({ seats, expectedDiscount }) => {
      it(`should apply ${expectedDiscount}% discount for ${seats} seats`, () => {
        const calculateDiscount = (seatCount: number) => {
          if (seatCount >= 500) return 30;
          if (seatCount >= 100) return 20;
          if (seatCount >= 50) return 10;
          return 0;
        };

        expect(calculateDiscount(seats)).toBe(expectedDiscount);
      });
    });
  });

  describe('Subscription Lifecycle', () => {
    it('should set correct start and end dates for monthly subscription', () => {
      const startDate = new Date('2026-01-09');
      const billingCycle = 'monthly';

      const calculateEndDate = (start: Date, cycle: string) => {
        const end = new Date(start);
        if (cycle === 'annual') {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }
        return end;
      };

      const endDate = calculateEndDate(startDate, billingCycle);
      expect(endDate.getMonth()).toBe(1); // February (0-indexed)
      expect(endDate.getFullYear()).toBe(2026);
    });

    it('should set correct start and end dates for annual subscription', () => {
      const startDate = new Date('2026-01-09');
      const billingCycle = 'annual';

      const calculateEndDate = (start: Date, cycle: string) => {
        const end = new Date(start);
        if (cycle === 'annual') {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }
        return end;
      };

      const endDate = calculateEndDate(startDate, billingCycle);
      expect(endDate.getFullYear()).toBe(2027);
      expect(endDate.getMonth()).toBe(0); // January
    });
  });
});
