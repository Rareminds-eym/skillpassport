/**
 * Unit Tests for OrganizationSubscriptionService
 *
 * Tests for Task 21.1: Test OrganizationSubscriptionService methods
 * Tests for Task 21.6: Test volume discount calculations
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OrganizationSubscriptionService,
  calculateBulkPricing,
  calculateVolumeDiscount,
  type OrgSubscriptionPurchaseRequest,
} from '../organizationSubscriptionService';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabaseClient';

describe('OrganizationSubscriptionService', () => {
  let service: OrganizationSubscriptionService;

  beforeEach(() => {
    service = new OrganizationSubscriptionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Task 21.6: Test volume discount calculations
  // ==========================================================================
  describe('calculateVolumeDiscount', () => {
    it('should return 0% discount for less than 50 seats', () => {
      expect(calculateVolumeDiscount(1)).toBe(0);
      expect(calculateVolumeDiscount(10)).toBe(0);
      expect(calculateVolumeDiscount(49)).toBe(0);
    });

    it('should return 10% discount for 50-99 seats', () => {
      expect(calculateVolumeDiscount(50)).toBe(10);
      expect(calculateVolumeDiscount(75)).toBe(10);
      expect(calculateVolumeDiscount(99)).toBe(10);
    });

    it('should return 20% discount for 100-499 seats', () => {
      expect(calculateVolumeDiscount(100)).toBe(20);
      expect(calculateVolumeDiscount(250)).toBe(20);
      expect(calculateVolumeDiscount(499)).toBe(20);
    });

    it('should return 30% discount for 500+ seats', () => {
      expect(calculateVolumeDiscount(500)).toBe(30);
      expect(calculateVolumeDiscount(1000)).toBe(30);
      expect(calculateVolumeDiscount(10000)).toBe(30);
    });
  });

  describe('calculateBulkPricing', () => {
    it('should calculate pricing correctly without discount', () => {
      const result = calculateBulkPricing(100, 10);

      expect(result.basePrice).toBe(100);
      expect(result.seatCount).toBe(10);
      expect(result.subtotal).toBe(1000);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.taxAmount).toBe(180); // 18% of 1000
      expect(result.finalAmount).toBe(1180);
      expect(result.pricePerSeat).toBe(118);
    });

    it('should calculate pricing with 10% discount (50 seats)', () => {
      const result = calculateBulkPricing(100, 50);

      expect(result.subtotal).toBe(5000);
      expect(result.discountPercentage).toBe(10);
      expect(result.discountAmount).toBe(500);
      const afterDiscount = 4500;
      expect(result.taxAmount).toBe(afterDiscount * 0.18);
      expect(result.finalAmount).toBe(afterDiscount + afterDiscount * 0.18);
    });

    it('should calculate pricing with 20% discount (100 seats)', () => {
      const result = calculateBulkPricing(100, 100);

      expect(result.subtotal).toBe(10000);
      expect(result.discountPercentage).toBe(20);
      expect(result.discountAmount).toBe(2000);
      const afterDiscount = 8000;
      expect(result.taxAmount).toBe(afterDiscount * 0.18);
      expect(result.finalAmount).toBe(afterDiscount + afterDiscount * 0.18);
    });

    it('should calculate pricing with 30% discount (500 seats)', () => {
      const result = calculateBulkPricing(100, 500);

      expect(result.subtotal).toBe(50000);
      expect(result.discountPercentage).toBe(30);
      expect(result.discountAmount).toBe(15000);
      const afterDiscount = 35000;
      expect(result.taxAmount).toBe(afterDiscount * 0.18);
      expect(result.finalAmount).toBe(afterDiscount + afterDiscount * 0.18);
    });

    it('should calculate correct price per seat', () => {
      const result = calculateBulkPricing(100, 100);
      expect(result.pricePerSeat).toBe(result.finalAmount / result.seatCount);
    });

    it('should handle edge case of 1 seat', () => {
      const result = calculateBulkPricing(500, 1);

      expect(result.seatCount).toBe(1);
      expect(result.subtotal).toBe(500);
      expect(result.discountPercentage).toBe(0);
      expect(result.finalAmount).toBe(500 * 1.18);
    });
  });

  // ==========================================================================
  // Task 21.1: Test OrganizationSubscriptionService methods
  // ==========================================================================
  describe('purchaseSubscription', () => {
    const mockPurchaseRequest: OrgSubscriptionPurchaseRequest = {
      organizationId: 'org-123',
      organizationType: 'school',
      planId: 'plan-456',
      seatCount: 50,
      targetMemberType: 'educator',
      billingCycle: 'monthly',
      autoRenew: true,
      paymentMethod: 'razorpay',
    };

    const mockPlan = {
      id: 'plan-456',
      name: 'Premium Plan',
      price: 100,
    };

    const mockUser = {
      id: 'user-789',
    };

    it('should create subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        subscription_plan_id: 'plan-456',
        purchased_by: 'user-789',
        total_seats: 50,
        assigned_seats: 0,
        available_seats: 50,
        target_member_type: 'educator',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        price_per_seat: '106.20',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock plan lookup
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'subscription_plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPlan, error: null }),
          } as any;
        }
        if (table === 'organization_subscriptions') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
          } as any;
        }
        return {} as any;
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await service.purchaseSubscription(mockPurchaseRequest);

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.totalSeats).toBe(50);
      expect(result.status).toBe('active');
    });

    it('should throw error when plan not found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }) as any
      );

      await expect(service.purchaseSubscription(mockPurchaseRequest)).rejects.toThrow(
        'Subscription plan not found'
      );
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPlan, error: null }),
          }) as any
      );

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(service.purchaseSubscription(mockPurchaseRequest)).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('getOrganizationSubscriptions', () => {
    it('should return subscriptions for organization', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          subscription_plan_id: 'plan-456',
          purchased_by: 'user-789',
          total_seats: 50,
          assigned_seats: 25,
          available_seats: 25,
          target_member_type: 'educator',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          auto_renew: true,
          price_per_seat: '100',
          total_amount: '5000',
          discount_percentage: 10,
          final_amount: '5310',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
          }) as any
      );

      const result = await service.getOrganizationSubscriptions('org-123', 'school');

      expect(result).toHaveLength(1);
      expect(result[0].organizationId).toBe('org-123');
      expect(result[0].totalSeats).toBe(50);
      expect(result[0].assignedSeats).toBe(25);
    });

    it('should return empty array when no subscriptions found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }) as any
      );

      const result = await service.getOrganizationSubscriptions('org-123', 'school');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateSeatCount', () => {
    it('should update seat count successfully', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        subscription_plan_id: 'plan-456',
        purchased_by: 'user-789',
        total_seats: 50,
        assigned_seats: 25,
        available_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdatedSub = { ...mockCurrentSub, total_seats: 75 };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: getSubscriptionById
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
          } as any;
        }
        // Second call: update
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedSub, error: null }),
        } as any;
      });

      const result = await service.updateSeatCount('sub-001', 75);

      expect(result.totalSeats).toBe(75);
    });

    it('should throw error when reducing below assigned seats', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        total_seats: 50,
        assigned_seats: 30,
        price_per_seat: '100',
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
          }) as any
      );

      await expect(service.updateSeatCount('sub-001', 20)).rejects.toThrow(
        'Cannot reduce seats below assigned count (30)'
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          }) as any
      );

      await expect(
        service.cancelSubscription('sub-001', 'No longer needed')
      ).resolves.not.toThrow();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
          }) as any
      );

      await expect(service.cancelSubscription('sub-001', 'Test')).rejects.toThrow();
    });
  });

  describe('renewSubscription', () => {
    it('should renew subscription with same seat count', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        subscription_plan_id: 'plan-456',
        purchased_by: 'user-789',
        total_seats: 50,
        assigned_seats: 25,
        available_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
        } as any;
      });

      const result = await service.renewSubscription('sub-001');

      expect(result).toBeDefined();
      expect(result.totalSeats).toBe(50);
    });

    it('should renew subscription with new seat count', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        total_seats: 50,
        assigned_seats: 25,
        price_per_seat: '100',
        auto_renew: true,
        end_date: new Date().toISOString(),
      };

      const mockUpdatedSub = { ...mockCurrentSub, total_seats: 100 };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedSub, error: null }),
        } as any;
      });

      const result = await service.renewSubscription('sub-001', { seatCount: 100 });

      expect(result.totalSeats).toBe(100);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade to new plan successfully', async () => {
      const mockNewPlan = {
        id: 'plan-premium',
        name: 'Premium Plan',
        price: 200,
      };

      const mockCurrentSub = {
        id: 'sub-001',
        total_seats: 50,
        price_per_seat: '100',
      };

      const mockUpdatedSub = {
        ...mockCurrentSub,
        subscription_plan_id: 'plan-premium',
        price_per_seat: '200',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'subscription_plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockNewPlan, error: null }),
          } as any;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentSub, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedSub, error: null }),
        } as any;
      });

      const result = await service.upgradeSubscription('sub-001', 'plan-premium');

      expect(result).toBeDefined();
    });

    it('should throw error when new plan not found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }) as any
      );

      await expect(service.upgradeSubscription('sub-001', 'invalid-plan')).rejects.toThrow(
        'New subscription plan not found'
      );
    });
  });
});
