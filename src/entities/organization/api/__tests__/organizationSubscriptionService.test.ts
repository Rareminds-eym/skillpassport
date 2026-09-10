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
    type OrgSubscriptionPurchaseRequest
} from '../organizationSubscriptionService';

// Mock SSO client
vi.mock('@/shared/api/ssoClient', () => ({
  ssoClient: {
    fetch: vi.fn(),
    getAccessToken: vi.fn(() => 'test-token')
  }
}));

import { ssoClient } from '@/shared/api/ssoClient';

function createMockResponse<T>(data: T, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () { return this; },
    body: null,
    bodyUsed: false,
    type: 'basic',
    url: '',
  } as Response;
}

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
    });
  });

  // ==========================================================================
  // Test calculateBulkPricing
  // ==========================================================================
  describe('calculateBulkPricing', () => {
    it('should calculate correct pricing with no discount', () => {
      const result = calculateBulkPricing(100, 10);
      expect(result.basePrice).toBe(100);
      expect(result.seatCount).toBe(10);
      expect(result.subtotal).toBe(1000);
      expect(result.discountPercentage).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.taxAmount).toBe(180); // 18% GST
      expect(result.finalAmount).toBe(1180);
      expect(result.pricePerSeat).toBe(118);
    });

    it('should calculate correct pricing with 10% volume discount', () => {
      const result = calculateBulkPricing(100, 50);
      expect(result.subtotal).toBe(5000);
      expect(result.discountPercentage).toBe(10);
      expect(result.discountAmount).toBe(500); // 10% of 5000
      const discountedSubtotal = 4500;
      expect(result.taxAmount).toBe(810); // 18% of 4500
      expect(result.finalAmount).toBe(5310);
    });

    it('should calculate correct pricing with 20% volume discount', () => {
      const result = calculateBulkPricing(100, 100);
      expect(result.subtotal).toBe(10000);
      expect(result.discountPercentage).toBe(20);
      expect(result.discountAmount).toBe(2000);
      expect(result.taxAmount).toBe(1440); // 18% of 8000
      expect(result.finalAmount).toBe(9440);
    });

    // Restored: these edge-case tests were dropped in commit 256f0fce
    // ("clean up and streamline unit test suites") without documented rationale.
    // They cover the 30% discount tier and boundary seat counts, so they are
    // reinstated to keep pricing regressions detectable.
    it('should calculate correct pricing with 30% volume discount (500 seats)', () => {
      const result = calculateBulkPricing(100, 500);
      expect(result.subtotal).toBe(50000);
      expect(result.discountPercentage).toBe(30);
      expect(result.discountAmount).toBe(15000);
      expect(result.taxAmount).toBe(6300); // 18% of 35000
      expect(result.finalAmount).toBe(41300);
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
      expect(result.finalAmount).toBe(590); // 500 * 1.18
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
      paymentMethod: 'razorpay'
    };

    const mockPlan = {
      id: 'plan-456',
      plan_code: 'PREMIUM',
      name: 'Premium Plan',
      pricing_matrix: { monthly: 100 }
    };

    it('should create subscription successfully', async () => {
      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string) => {
        if (url.includes('getPlansCache')) {
          return createMockResponse({ data: mockPlan });
        }
        return createMockResponse({ orderId: 'order-123', key: 'key-123', amount: 531000 });
      });

      const result = await service.purchaseSubscription(mockPurchaseRequest);

      expect(result).toBeDefined();
      expect(result.orderId).toBe('order-123');
      expect(result.amount).toBe(531000);
      expect(ssoClient.fetch).toHaveBeenCalled();
    });

    it('should throw error when plan not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: null }));

      await expect(service.purchaseSubscription(mockPurchaseRequest))
        .rejects.toThrow('Subscription plan not found');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string) => {
        if (url.includes('getPlansCache')) {
          return createMockResponse({ data: mockPlan });
        }
        return createMockResponse({ error: { message: 'User not authenticated' } }, 401, false);
      });

      await expect(service.purchaseSubscription(mockPurchaseRequest))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('getOrganizationSubscriptions', () => {
    it('should return subscriptions for organization', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          plan_id: 'plan-456',
          user_id: 'user-789',
          seat_count: 50,
          assigned_seats: 25,
          target_member_type: 'educator',
          status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date().toISOString(),
          auto_renew: true,
          price_per_seat: '100',
          total_amount: '5000',
          discount_percentage: 10,
          final_amount: '5310',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockSubscriptions }));

      const result = await service.getOrganizationSubscriptions('org-123', 'school');

      expect(result).toHaveLength(1);
      expect(result[0].organizationId).toBe('org-123');
      expect(result[0].totalSeats).toBe(50);
      expect(result[0].assignedSeats).toBe(25);
    });

    it('should return empty array when no subscriptions found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: [] }));

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
        plan_id: 'plan-456',
        user_id: 'user-789',
        seat_count: 50,
        assigned_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockUpdatedSub = { ...mockCurrentSub, seat_count: 75 };

      let callCount = 0;
      vi.mocked(ssoClient.fetch).mockImplementation(async () => {
        callCount++;
        const subData = callCount > 1 ? mockUpdatedSub : mockCurrentSub;
        return createMockResponse({ data: subData });
      });

      const result = await service.updateSeatCount('sub-001', 75);

      expect(result.totalSeats).toBe(75);
    });

    it('should throw error when reducing below assigned seats', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        plan_id: 'plan-456',
        user_id: 'user-789',
        seat_count: 50,
        assigned_seats: 30,
        target_member_type: 'educator',
        status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockCurrentSub }));

      await expect(service.updateSeatCount('sub-001', 20))
        .rejects.toThrow('Cannot reduce seats below assigned count (30)');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ success: true }));

      await expect(service.cancelSubscription('sub-001', 'No longer needed'))
        .resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ error: { message: 'Database error' } }, 500, false));

      await expect(service.cancelSubscription('sub-001', 'Test'))
        .rejects.toThrow('Database error');
    });
  });

  describe('renewSubscription', () => {
    it('should renew subscription with same seat count', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        plan_id: 'plan-456',
        user_id: 'user-789',
        seat_count: 50,
        assigned_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockCurrentSub }));

      const result = await service.renewSubscription('sub-001');

      expect(result).toBeDefined();
      expect(result.totalSeats).toBe(50);
    });

    it('should renew subscription with new seat count', async () => {
      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        plan_id: 'plan-456',
        user_id: 'user-789',
        seat_count: 50,
        assigned_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockUpdatedSub = { ...mockCurrentSub, seat_count: 100 };

      let callCount = 0;
      vi.mocked(ssoClient.fetch).mockImplementation(async () => {
        callCount++;
        const subData = callCount > 1 ? mockUpdatedSub : mockCurrentSub;
        return createMockResponse({ data: subData });
      });

      const result = await service.renewSubscription('sub-001', { seatCount: 100 });

      expect(result.totalSeats).toBe(100);
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade to new plan successfully', async () => {
      const mockNewPlan = {
        id: 'plan-premium',
        plan_code: 'PREMIUM',
        name: 'Premium Plan',
        pricing_matrix: { monthly: 200 }
      };

      const mockCurrentSub = {
        id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        plan_id: 'plan-456',
        user_id: 'user-789',
        seat_count: 50,
        assigned_seats: 25,
        target_member_type: 'educator',
        status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date().toISOString(),
        auto_renew: true,
        price_per_seat: '100',
        total_amount: '5000',
        discount_percentage: 10,
        final_amount: '5310',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockUpdatedSub = {
        ...mockCurrentSub,
        plan_id: 'plan-premium',
        price_per_seat: '200'
      };

      let callCount = 0;
      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string) => {
        if (url.includes('getPlansCache')) {
          return createMockResponse({ data: mockNewPlan });
        }
        callCount++;
        const subData = callCount > 1 ? mockUpdatedSub : mockCurrentSub;
        return createMockResponse({ data: subData });
      });

      const result = await service.upgradeSubscription('sub-001', 'plan-premium');

      expect(result).toBeDefined();
    });

    it('should throw error when new plan not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'New subscription plan not found' } }, 400, false)
      );

      await expect(service.upgradeSubscription('sub-001', 'invalid-plan'))
        .rejects.toThrow('New subscription plan not found');
    });
  });
});
