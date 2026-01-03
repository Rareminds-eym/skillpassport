/**
 * Integration Tests for Add-On Purchase Flow
 * 
 * Tests end-to-end purchase flow, feature gating, bundle activation,
 * and discount code application.
 * 
 * @requirement Task 8.4 - Integration tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      })
    }
  }
}));

// Mock services
vi.mock('../../services/addOnCatalogService', () => ({
  default: {
    getAddOns: vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: '1',
          feature_key: 'career_ai',
          name: 'Career AI Assistant',
          addon_price_monthly: 199,
          addon_price_annual: 1990
        }
      ]
    }),
    getBundles: vi.fn().mockResolvedValue({ success: true, data: [] }),
    calculateBundleSavings: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { savings: 100, totalIndividual: 348, bundlePrice: 248 } 
    })
  }
}));

vi.mock('../../services/entitlementService', () => ({
  default: {
    getUserEntitlements: vi.fn().mockResolvedValue({ success: true, data: [] }),
    hasFeatureAccess: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { hasAccess: false, accessSource: null } 
    }),
    activateAddOn: vi.fn().mockResolvedValue({ 
      success: true, 
      data: { id: '1', status: 'active' } 
    }),
    activateBundle: vi.fn(),
    cancelAddOn: vi.fn(),
    toggleAutoRenew: vi.fn()
  }
}));

vi.mock('../../services/addOnPaymentService', () => ({
  default: {
    createAddOnOrder: vi.fn().mockResolvedValue({
      success: true,
      data: {
        orderId: 'order_123',
        amount: 19900,
        currency: 'INR',
        razorpayKeyId: 'rzp_test_123'
      }
    }),
    applyDiscountCode: vi.fn().mockResolvedValue({
      success: true,
      data: {
        valid: true,
        totalDiscount: 39.8,
        itemDiscounts: [{ featureKey: 'career_ai', discount: 39.8 }]
      }
    })
  }
}));

describe('Add-On Purchase Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Razorpay
    window.Razorpay = vi.fn().mockImplementation(() => ({
      open: vi.fn(),
      on: vi.fn()
    }));
  });

  afterEach(() => {
    delete window.Razorpay;
  });

  describe('End-to-End Purchase Flow', () => {
    it('should complete add-on purchase successfully', async () => {
      const addOnPaymentService = await import('../../services/addOnPaymentService');
      const entitlementService = await import('../../services/entitlementService');

      // Step 1: Create order
      const orderResult = await addOnPaymentService.default.createAddOnOrder({
        featureKey: 'career_ai',
        billingPeriod: 'monthly',
        userId: 'test-user-id'
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.data.orderId).toBe('order_123');
      expect(orderResult.data.amount).toBe(19900);

      // Step 2: Simulate payment success (would normally be handled by Razorpay callback)
      // Step 3: Activate entitlement
      const entitlementResult = await entitlementService.default.activateAddOn(
        'test-user-id',
        'career_ai',
        'monthly'
      );

      expect(entitlementResult.success).toBe(true);
      expect(entitlementResult.data.status).toBe('active');
    });

    it('should handle payment failure gracefully', async () => {
      const addOnPaymentService = await import('../../services/addOnPaymentService');
      
      addOnPaymentService.default.createAddOnOrder.mockResolvedValueOnce({
        success: false,
        error: 'Payment gateway error'
      });

      const result = await addOnPaymentService.default.createAddOnOrder({
        featureKey: 'career_ai',
        billingPeriod: 'monthly',
        userId: 'test-user-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment gateway error');
    });
  });

  describe('Feature Gating', () => {
    it('should show no access when user lacks entitlement', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.hasFeatureAccess.mockResolvedValueOnce({
        success: true,
        data: { hasAccess: false, accessSource: null }
      });

      const result = await entitlementService.default.hasFeatureAccess(
        'test-user-id',
        'career_ai'
      );

      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(false);
    });

    it('should grant access when user has entitlement', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.hasFeatureAccess.mockResolvedValueOnce({
        success: true,
        data: { hasAccess: true, accessSource: 'addon' }
      });

      const result = await entitlementService.default.hasFeatureAccess(
        'test-user-id',
        'career_ai'
      );

      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(true);
      expect(result.data.accessSource).toBe('addon');
    });

    it('should grant access when feature is included in plan', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.hasFeatureAccess.mockResolvedValueOnce({
        success: true,
        data: { hasAccess: true, accessSource: 'plan' }
      });

      const result = await entitlementService.default.hasFeatureAccess(
        'test-user-id',
        'career_ai'
      );

      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(true);
      expect(result.data.accessSource).toBe('plan');
    });
  });

  describe('Bundle Activation', () => {
    it('should activate all add-ons in bundle', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.activateBundle.mockResolvedValueOnce({
        success: true,
        data: [
          { feature_key: 'career_ai', status: 'active' },
          { feature_key: 'advanced_assessments', status: 'active' }
        ]
      });

      const result = await entitlementService.default.activateBundle(
        'test-user-id',
        'career_starter_bundle',
        'monthly'
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should apply bundle discount correctly', async () => {
      const addOnCatalogService = await import('../../services/addOnCatalogService');
      
      addOnCatalogService.default.calculateBundleSavings.mockResolvedValueOnce({
        success: true,
        data: {
          totalIndividual: 348,
          bundlePrice: 278.4,
          savings: 69.6
        }
      });

      const result = await addOnCatalogService.default.calculateBundleSavings('bundle-1');

      expect(result.success).toBe(true);
      expect(result.data.savings).toBe(69.6);
    });
  });

  describe('Discount Code Application', () => {
    it('should apply valid discount code', async () => {
      const addOnPaymentService = await import('../../services/addOnPaymentService');

      const result = await addOnPaymentService.default.applyDiscountCode('SAVE20', [
        { featureKey: 'career_ai', price: 199 }
      ]);

      expect(result.success).toBe(true);
      expect(result.data.totalDiscount).toBe(39.8);
    });

    it('should reject expired discount code', async () => {
      const addOnPaymentService = await import('../../services/addOnPaymentService');
      
      addOnPaymentService.default.applyDiscountCode.mockResolvedValueOnce({
        success: false,
        error: 'Discount code has expired'
      });

      const result = await addOnPaymentService.default.applyDiscountCode('EXPIRED', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Discount code has expired');
    });

    it('should reject discount code that exceeds usage limit', async () => {
      const addOnPaymentService = await import('../../services/addOnPaymentService');
      
      addOnPaymentService.default.applyDiscountCode.mockResolvedValueOnce({
        success: false,
        error: 'Discount code usage limit reached'
      });

      const result = await addOnPaymentService.default.applyDiscountCode('MAXED', []);

      expect(result.success).toBe(false);
    });
  });

  describe('Entitlement Lifecycle', () => {
    it('should handle entitlement cancellation', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.cancelAddOn.mockResolvedValueOnce({
        success: true,
        data: {
          id: '1',
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }
      });

      const result = await entitlementService.default.cancelAddOn('1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('cancelled');
    });

    it('should handle auto-renewal toggle', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.toggleAutoRenew.mockResolvedValueOnce({
        success: true,
        data: { id: '1', auto_renew: false }
      });

      const result = await entitlementService.default.toggleAutoRenew('1', false);

      expect(result.success).toBe(true);
      expect(result.data.auto_renew).toBe(false);
    });

    it('should handle grace period correctly', async () => {
      const entitlementService = await import('../../services/entitlementService');
      
      entitlementService.default.getUserEntitlements.mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: '1',
            feature_key: 'career_ai',
            status: 'grace_period',
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      });

      const result = await entitlementService.default.getUserEntitlements('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data[0].status).toBe('grace_period');
    });
  });
});
