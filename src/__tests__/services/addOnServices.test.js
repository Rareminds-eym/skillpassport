/**
 * Unit Tests for Add-On Services
 * 
 * Tests for AddOnCatalogService, EntitlementService, PaymentService, and MigrationService
 * 
 * @requirement Task 8.3 - Unit tests for services
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseChain = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
  };
  return chain;
};

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseChain()),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    }
  }
}));

// Import services after mocking
import { supabase } from '../../lib/supabaseClient';
import addOnCatalogService from '../../services/addOnCatalogService';
import addOnPaymentService from '../../services/addOnPaymentService';
import entitlementService from '../../services/entitlementService';
import migrationService from '../../services/migrationService';

describe('AddOnCatalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAddOns', () => {
    it('should fetch all add-ons when no filters provided', async () => {
      const mockAddOns = [
        { id: '1', feature_key: 'career_ai', name: 'Career AI', is_addon: true },
        { id: '2', feature_key: 'educator_ai', name: 'Educator AI', is_addon: true }
      ];

      const chain = mockSupabaseChain();
      chain.order.mockResolvedValue({ data: mockAddOns, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getAddOns();
      
      expect(supabase.from).toHaveBeenCalledWith('subscription_plan_features');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAddOns);
    });

    it('should filter add-ons by role', async () => {
      const mockAddOns = [
        { id: '1', feature_key: 'career_ai', name: 'Career AI', target_roles: ['student'] },
        { id: '2', feature_key: 'educator_ai', name: 'Educator AI', target_roles: ['educator'] }
      ];

      const chain = mockSupabaseChain();
      chain.order.mockResolvedValue({ data: mockAddOns, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getAddOns({ role: 'student' });
      
      expect(result.success).toBe(true);
      // Should filter to only student role
      expect(result.data).toHaveLength(1);
      expect(result.data[0].feature_key).toBe('career_ai');
    });

    it('should handle errors gracefully', async () => {
      const chain = mockSupabaseChain();
      chain.order.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getAddOns();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getAddOnByFeatureKey', () => {
    it('should fetch a specific add-on by feature key', async () => {
      const mockAddOn = { id: '1', feature_key: 'career_ai', name: 'Career AI' };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: mockAddOn, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getAddOnByFeatureKey('career_ai');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAddOn);
    });

    it('should return error for missing feature key', async () => {
      const result = await addOnCatalogService.getAddOnByFeatureKey('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Feature key is required');
    });

    it('should handle not found error', async () => {
      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getAddOnByFeatureKey('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('ADD_ON_NOT_FOUND');
    });
  });

  describe('getBundles', () => {
    it('should fetch all bundles', async () => {
      const mockBundles = [
        { id: '1', name: 'Career Starter', discount_percentage: 20 }
      ];

      const chain = mockSupabaseChain();
      chain.order.mockResolvedValue({ data: mockBundles, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnCatalogService.getBundles();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBundles);
    });
  });

  describe('calculateBundleSavings', () => {
    it('should calculate savings correctly', async () => {
      const mockBundle = {
        id: '1',
        monthly_price: 278.4,
        bundle_features: [
          { feature_key: 'career_ai' },
          { feature_key: 'video_portfolio' }
        ]
      };

      const mockAddOns = [
        { feature_key: 'career_ai', addon_price_monthly: 199 },
        { feature_key: 'video_portfolio', addon_price_monthly: 149 }
      ];

      // First call for bundle
      const bundleChain = mockSupabaseChain();
      bundleChain.single.mockResolvedValue({ data: mockBundle, error: null });
      
      // Second call for add-ons
      const addOnsChain = mockSupabaseChain();
      addOnsChain.in.mockResolvedValue({ data: mockAddOns, error: null });

      supabase.from
        .mockReturnValueOnce(bundleChain)
        .mockReturnValueOnce(addOnsChain);

      const result = await addOnCatalogService.calculateBundleSavings('1');
      
      expect(result.success).toBe(true);
      expect(result.data.totalIndividual).toBe(348); // 199 + 149
      expect(result.data.bundlePrice).toBe(278.4);
      expect(result.data.savings).toBeCloseTo(69.6, 1); // 348 - 278.4 (use toBeCloseTo for floating point)
    });

    it('should return error for missing bundle ID', async () => {
      const result = await addOnCatalogService.calculateBundleSavings('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bundle ID is required');
    });
  });
});

describe('EntitlementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserEntitlements', () => {
    it('should fetch user entitlements', async () => {
      const mockEntitlements = [
        { id: '1', user_id: 'user-1', feature_key: 'career_ai', status: 'active' }
      ];

      const chain = mockSupabaseChain();
      chain.order.mockResolvedValue({ data: mockEntitlements, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await entitlementService.getUserEntitlements('user-1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntitlements);
    });

    it('should return error for missing user ID', async () => {
      const result = await entitlementService.getUserEntitlements('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return access via plan when feature is included', async () => {
      // Mock subscription query
      const subChain = mockSupabaseChain();
      subChain.single.mockResolvedValue({ 
        data: { plan_id: 'plan-1', status: 'active' }, 
        error: null 
      });

      // Mock plan feature query
      const featureChain = mockSupabaseChain();
      featureChain.single.mockResolvedValue({ 
        data: { is_included: true }, 
        error: null 
      });

      supabase.from
        .mockReturnValueOnce(subChain)
        .mockReturnValueOnce(featureChain);

      const result = await entitlementService.hasFeatureAccess('user-1', 'career_ai');
      
      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(true);
      expect(result.data.accessSource).toBe('plan');
    });

    it('should return access via entitlement when user has active add-on', async () => {
      // Mock subscription query - no plan includes feature
      const subChain = mockSupabaseChain();
      subChain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock entitlement query
      const entChain = mockSupabaseChain();
      entChain.single.mockResolvedValue({ 
        data: { id: '1', bundle_id: null, status: 'active' }, 
        error: null 
      });

      supabase.from
        .mockReturnValueOnce(subChain)
        .mockReturnValueOnce(entChain);

      const result = await entitlementService.hasFeatureAccess('user-1', 'career_ai');
      
      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(true);
      expect(result.data.accessSource).toBe('addon');
    });

    it('should return no access when user has no entitlement', async () => {
      // Mock subscription query - no active subscription
      const subChain = mockSupabaseChain();
      subChain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock entitlement query - no entitlement
      const entChain = mockSupabaseChain();
      entChain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      supabase.from
        .mockReturnValueOnce(subChain)
        .mockReturnValueOnce(entChain);

      const result = await entitlementService.hasFeatureAccess('user-1', 'career_ai');
      
      expect(result.success).toBe(true);
      expect(result.data.hasAccess).toBe(false);
      expect(result.data.accessSource).toBe(null);
    });
  });

  describe('activateAddOn', () => {
    it('should create a new entitlement', async () => {
      const mockAddOn = {
        feature_key: 'career_ai',
        addon_price_monthly: 199,
        addon_price_annual: 1990
      };

      const mockEntitlement = {
        id: '1',
        user_id: 'user-1',
        feature_key: 'career_ai',
        status: 'active'
      };

      // Mock add-on lookup
      const addOnChain = mockSupabaseChain();
      addOnChain.single.mockResolvedValue({ data: mockAddOn, error: null });

      // Mock entitlement insert
      const insertChain = mockSupabaseChain();
      insertChain.single.mockResolvedValue({ data: mockEntitlement, error: null });

      supabase.from
        .mockReturnValueOnce(addOnChain)
        .mockReturnValueOnce(insertChain);

      const result = await entitlementService.activateAddOn('user-1', 'career_ai', 'monthly');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntitlement);
    });

    it('should return error for invalid billing period', async () => {
      const result = await entitlementService.activateAddOn('user-1', 'career_ai', 'weekly');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Billing period must be "monthly" or "annual"');
    });
  });

  describe('cancelAddOn', () => {
    it('should update entitlement status to cancelled', async () => {
      const mockEntitlement = { id: '1', status: 'cancelled', auto_renew: false };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: mockEntitlement, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await entitlementService.cancelAddOn('1');
      
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('cancelled');
    });

    it('should return error for missing entitlement ID', async () => {
      const result = await entitlementService.cancelAddOn('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Entitlement ID is required');
    });
  });

  describe('toggleAutoRenew', () => {
    it('should toggle auto-renew setting', async () => {
      const mockEntitlement = { id: '1', auto_renew: false };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: mockEntitlement, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await entitlementService.toggleAutoRenew('1', false);
      
      expect(result.success).toBe(true);
      expect(result.data.auto_renew).toBe(false);
    });

    it('should return error for non-boolean auto_renew', async () => {
      const result = await entitlementService.toggleAutoRenew('1', 'false');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-renew must be a boolean value');
    });
  });
});

describe('AddOnPaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
  });

  describe('applyDiscountCode', () => {
    it('should apply valid percentage discount code', async () => {
      const mockDiscount = {
        id: 'disc-1',
        code: 'SAVE20',
        discount_type: 'percentage',
        discount_value: 20,
        is_active: true,
        valid_from: null,
        valid_until: null,
        max_uses: null,
        current_uses: 0,
        min_purchase_amount: null,
        applicable_feature_keys: null,
        description: '20% off'
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: mockDiscount, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnPaymentService.applyDiscountCode('SAVE20', [
        { featureKey: 'career_ai', price: 199, billingPeriod: 'monthly' }
      ]);

      expect(result.success).toBe(true);
      expect(result.data.totalDiscount).toBe(39); // floor(199 * 0.2) = 39
    });

    it('should reject invalid discount code', async () => {
      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      supabase.from.mockReturnValue(chain);

      const result = await addOnPaymentService.applyDiscountCode('INVALID', [
        { featureKey: 'career_ai', price: 199, billingPeriod: 'monthly' }
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid discount code');
    });

    it('should reject expired discount code', async () => {
      const mockDiscount = {
        code: 'EXPIRED',
        discount_type: 'percentage',
        discount_value: 20,
        is_active: true,
        valid_until: '2020-01-01T00:00:00Z' // Past date
      };

      const chain = mockSupabaseChain();
      chain.single.mockResolvedValue({ data: mockDiscount, error: null });
      supabase.from.mockReturnValue(chain);

      const result = await addOnPaymentService.applyDiscountCode('EXPIRED', [
        { featureKey: 'career_ai', price: 199, billingPeriod: 'monthly' }
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Discount code has expired');
    });

    it('should return error for missing discount code', async () => {
      const result = await addOnPaymentService.applyDiscountCode('', []);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Discount code is required');
    });
  });
});

describe('MigrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMigrationMapping', () => {
    it('should return error for missing plan code', async () => {
      const result = await migrationService.getMigrationMapping('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Plan code is required');
    });

    it('should handle plan not found error', async () => {
      // Create a proper chain that returns PGRST116 error
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };
      supabase.from.mockReturnValue(chain);

      const result = await migrationService.getMigrationMapping('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('PLAN_NOT_FOUND');
    });
  });

  describe('calculatePriceProtection', () => {
    it('should return error for missing user ID', async () => {
      const result = await migrationService.calculatePriceProtection('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should handle no active subscription', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };
      supabase.from.mockReturnValue(chain);

      const result = await migrationService.calculatePriceProtection('user-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('NO_ACTIVE_SUBSCRIPTION');
    });
  });

  describe('getMigrationStatus', () => {
    it('should return error for missing user ID', async () => {
      const result = await migrationService.getMigrationStatus('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return no migration for user without migration', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };
      supabase.from.mockReturnValue(chain);

      const result = await migrationService.getMigrationStatus('user-1');

      expect(result.success).toBe(true);
      expect(result.data.hasMigration).toBe(false);
    });

    it('should return migration status for user with migration', async () => {
      const mockMigration = {
        id: 'mig-1',
        user_id: 'user-1',
        migration_status: 'completed',
        migration_date: '2024-06-01T00:00:00Z',
        original_price: 300,
        new_price: 500,
        migrated_feature_keys: ['career_ai'],
        notification_sent_at: null,
        price_protected_until: null
      };

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMigration, error: null })
      };
      supabase.from.mockReturnValue(chain);

      const result = await migrationService.getMigrationStatus('user-1');

      expect(result.success).toBe(true);
      expect(result.data.hasMigration).toBe(true);
      expect(result.data.status).toBe('completed');
    });
  });
});
