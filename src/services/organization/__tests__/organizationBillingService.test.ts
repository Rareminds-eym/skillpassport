/**
 * Unit Tests for OrganizationBillingService
 * 
 * Tests for Task 21.4: Test OrganizationBillingService methods
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    OrganizationBillingService
} from '../organizationBillingService';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    auth: {
      getSession: vi.fn()
    }
  }
}));

// Mock fetch for downloadInvoice
global.fetch = vi.fn();

import { supabase } from '@/lib/supabaseClient';

describe('OrganizationBillingService', () => {
  let service: OrganizationBillingService;

  beforeEach(() => {
    service = new OrganizationBillingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Task 21.4: Test OrganizationBillingService methods
  // ==========================================================================
  describe('getBillingDashboard', () => {
    it('should return comprehensive billing dashboard', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          subscription_plan_id: 'plan-001',
          total_seats: 50,
          assigned_seats: 30,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: true,
          final_amount: '5000',
          subscription_plans: {
            id: 'plan-001',
            name: 'Premium Plan',
            price_monthly: 100,
            price_yearly: 1000
          }
        }
      ];

      const mockPayments = [
        {
          id: 'pay-001',
          razorpay_payment_id: 'rzp_001',
          amount: '5000',
          currency: 'INR',
          status: 'success',
          payment_method: 'card',
          description: 'Subscription payment',
          created_at: new Date().toISOString()
        }
      ];

      const mockAddons = [
        {
          id: 'addon-order-001',
          addon_feature_key: 'premium_support',
          target_member_ids: ['user-1', 'user-2'],
          status: 'completed',
          amount: '100'
        }
      ];

      // Create chainable mock that supports .eq().eq().in() chain and .eq().order().limit() chain
      const createChainableMock = (table: string) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => {
          if (table === 'payment_transactions') {
            // payment_transactions uses .eq().order().limit()
            return {
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockPayments, error: null })
              })
            };
          }
          // Other tables use .eq().eq().in() or .eq().eq()
          return {
            eq: vi.fn().mockImplementation(() => ({
              in: vi.fn().mockResolvedValue(
                table === 'organization_subscriptions' 
                  ? { data: mockSubscriptions, error: null }
                  : { data: [], error: null }
              ),
              eq: vi.fn().mockResolvedValue(
                table === 'addon_pending_orders' 
                  ? { data: mockAddons, error: null }
                  : { data: [], error: null }
              )
            }))
          };
        });
        chainable.in = vi.fn().mockReturnValue(chainable);
        chainable.order = vi.fn().mockReturnValue(chainable);
        chainable.limit = vi.fn();
        
        if (table === 'organization_subscriptions') {
          chainable.in.mockResolvedValue({ data: mockSubscriptions, error: null });
        }
        
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => createChainableMock(table));

      const result = await service.getBillingDashboard('org-123', 'school');

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.subscriptions).toHaveLength(1);
      expect(result.subscriptions[0].planName).toBe('Premium Plan');
      expect(result.subscriptions[0].utilization).toBe(60); // 30/50 * 100
      expect(result.paymentHistory).toHaveLength(1);
      expect(result.totalActiveSeats).toBe(50);
      expect(result.totalAssignedSeats).toBe(30);
    });

    it('should calculate overall utilization correctly', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-001',
          total_seats: 100,
          assigned_seats: 50,
          status: 'active',
          final_amount: '10000',
          subscription_plans: { name: 'Plan A', price_monthly: 100, price_yearly: 1000 }
        },
        {
          id: 'sub-002',
          total_seats: 50,
          assigned_seats: 25,
          status: 'active',
          final_amount: '5000',
          subscription_plans: { name: 'Plan B', price_monthly: 100, price_yearly: 1000 }
        }
      ];

      const createChainableMock = (table: string) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockReturnValue(chainable);
        chainable.in = vi.fn().mockReturnValue(chainable);
        chainable.order = vi.fn().mockReturnValue(chainable);
        chainable.limit = vi.fn();
        
        if (table === 'organization_subscriptions') {
          chainable.in.mockResolvedValue({ data: mockSubscriptions, error: null });
        } else {
          chainable.limit.mockResolvedValue({ data: [], error: null });
        }
        
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => createChainableMock(table));

      const result = await service.getBillingDashboard('org-123', 'school');

      expect(result.totalActiveSeats).toBe(150);
      expect(result.totalAssignedSeats).toBe(75);
      expect(result.overallUtilization).toBe(50); // 75/150 * 100
    });

    it('should identify upcoming renewals within 30 days', async () => {
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 15); // 15 days from now

      const mockSubscriptions = [
        {
          id: 'sub-001',
          total_seats: 50,
          assigned_seats: 30,
          status: 'active',
          end_date: renewalDate.toISOString(),
          auto_renew: true,
          final_amount: '5000',
          subscription_plans: { name: 'Premium Plan', price_monthly: 100, price_yearly: 1000 }
        }
      ];

      const createChainableMock = (table: string) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => {
          if (table === 'payment_transactions') {
            // payment_transactions uses .eq().order().limit()
            return {
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            };
          }
          // Other tables use .eq().eq().in() or .eq().eq()
          return {
            eq: vi.fn().mockImplementation(() => ({
              in: vi.fn().mockResolvedValue(
                table === 'organization_subscriptions' 
                  ? { data: mockSubscriptions, error: null }
                  : { data: [], error: null }
              ),
              eq: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          };
        });
        chainable.in = vi.fn().mockReturnValue(chainable);
        chainable.order = vi.fn().mockReturnValue(chainable);
        chainable.limit = vi.fn();
        
        if (table === 'organization_subscriptions') {
          chainable.in.mockResolvedValue({ data: mockSubscriptions, error: null });
        }
        
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => createChainableMock(table));

      const result = await service.getBillingDashboard('org-123', 'school');

      expect(result.upcomingRenewals).toHaveLength(1);
      expect(result.upcomingRenewals[0].planName).toBe('Premium Plan');
      expect(result.upcomingRenewals[0].autoRenew).toBe(true);
    });

    it('should handle empty data gracefully', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any));

      const result = await service.getBillingDashboard('org-123', 'school');

      expect(result.subscriptions).toHaveLength(0);
      expect(result.paymentHistory).toHaveLength(0);
      expect(result.totalActiveSeats).toBe(0);
      expect(result.overallUtilization).toBe(0);
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice for transaction', async () => {
      const mockTransaction = {
        id: 'tx-001',
        organization_id: 'org-123',
        organization_type: 'school',
        amount: '5900', // Including tax
        currency: 'INR',
        status: 'success',
        description: 'Subscription payment',
        created_at: new Date().toISOString()
      };

      const mockOrgSub = {
        id: 'sub-001',
        total_seats: 50,
        total_amount: '5000',
        discount_percentage: 10,
        price_per_seat: 100,
        subscription_plans: { name: 'Premium Plan' }
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'payment_transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
          } as any;
        }
        if (table === 'organization_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrgSub, error: null })
          } as any;
        }
        return {} as any;
      });

      const result = await service.generateInvoice('tx-001', {
        name: 'Test School',
        gstNumber: 'GST123456'
      });

      expect(result).toBeDefined();
      expect(result.invoiceNumber).toMatch(/^INV-/);
      expect(result.organizationName).toBe('Test School');
      expect(result.gstNumber).toBe('GST123456');
      expect(result.status).toBe('paid');
      expect(result.lineItems.length).toBeGreaterThan(0);
    });

    it('should throw error when transaction not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      } as any));

      await expect(service.generateInvoice('invalid-tx'))
        .rejects.toThrow('Transaction not found');
    });

    it('should include volume discount in line items', async () => {
      const mockTransaction = {
        id: 'tx-001',
        organization_id: 'org-123',
        organization_type: 'school',
        amount: '5310',
        currency: 'INR',
        status: 'success',
        created_at: new Date().toISOString()
      };

      const mockOrgSub = {
        id: 'sub-001',
        total_seats: 50,
        total_amount: '5000',
        discount_percentage: 10, // 10% discount
        price_per_seat: 100,
        subscription_plans: { name: 'Premium Plan' }
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'payment_transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null })
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockOrgSub, error: null })
        } as any;
      });

      const result = await service.generateInvoice('tx-001');

      // Should have discount line item
      const discountItem = result.lineItems.find(item => 
        item.description.includes('Discount')
      );
      expect(discountItem).toBeDefined();
      expect(discountItem?.amount).toBeLessThan(0);
    });
  });

  describe('getInvoiceHistory', () => {
    it('should return invoice history for organization', async () => {
      const mockTransactions = [
        {
          id: 'tx-001',
          invoice_id: 'inv-001',
          amount: '5000',
          currency: 'INR',
          status: 'success',
          seat_count: 50,
          description: 'Subscription payment',
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-002',
          invoice_id: 'inv-002',
          amount: '3000',
          currency: 'INR',
          status: 'success',
          seat_count: 30,
          description: 'Addon purchase',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockTransactions, error: null })
      } as any));

      const result = await service.getInvoiceHistory('org-123');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('paid');
      expect(result[0].invoiceNumber).toMatch(/^INV-/);
    });

    it('should return empty array when no transactions exist', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any));

      const result = await service.getInvoiceHistory('org-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('downloadInvoice', () => {
    it('should download invoice as PDF blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob)
      } as any);

      const result = await service.downloadInvoice('inv-001');

      expect(result).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/org-billing/invoice/inv-001/download'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      } as any);

      await expect(service.downloadInvoice('inv-001'))
        .rejects.toThrow('Not authenticated');
    });

    it('should throw error on API failure', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      } as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Invoice not found' })
      } as any);

      await expect(service.downloadInvoice('invalid-inv'))
        .rejects.toThrow('Invoice not found');
    });
  });

  describe('projectMonthlyCost', () => {
    it('should project monthly cost correctly', async () => {
      const mockSubscriptions = [
        {
          id: 'sub-001',
          final_amount: '12000', // Annual subscription
          subscription_plans: { price_monthly: 100, price_yearly: 1000 }
        },
        {
          id: 'sub-002',
          final_amount: '5000', // Monthly subscription
          subscription_plans: { price_monthly: 100, price_yearly: 1000 }
        }
      ];

      const mockAddons = [
        {
          target_member_ids: ['user-1', 'user-2'],
          amount: '100'
        }
      ];

      const createChainableMock = (table: string) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        
        if (table === 'organization_subscriptions') {
          // Support 3 chained .eq() calls for subscriptions
          chainable.eq = vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockResolvedValue({ data: mockSubscriptions, error: null })
            }))
          }));
        } else if (table === 'addon_pending_orders') {
          // Support 2 chained .eq() calls for addons
          chainable.eq = vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: mockAddons, error: null })
          }));
        }
        
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => createChainableMock(table));

      const result = await service.projectMonthlyCost('org-123', 'school');

      expect(result).toBeDefined();
      expect(result.breakdown.subscriptions).toBeGreaterThan(0);
      expect(result.breakdown.addons).toBe(100); // 2 members * 50
      expect(result.projectedAnnualCost).toBe(result.projectedMonthlyCost * 12);
    });

    it('should return zeros when no subscriptions exist', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      const result = await service.projectMonthlyCost('org-123', 'school');

      expect(result.currentMonthlyCost).toBe(0);
      expect(result.breakdown.subscriptions).toBe(0);
      expect(result.breakdown.addons).toBe(0);
    });
  });

  describe('calculateSeatAdditionCost', () => {
    it('should calculate prorated cost for adding seats', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Started 1 month ago
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Ends in 1 month

      const mockSubscription = {
        id: 'sub-001',
        total_seats: 50,
        price_per_seat: 100,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        subscription_plans: { price_monthly: 100, price_yearly: 1000 }
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null })
      } as any));

      const result = await service.calculateSeatAdditionCost('sub-001', 10);

      expect(result).toBeDefined();
      expect(result.additionalSeats).toBe(10);
      expect(result.pricePerSeat).toBe(100);
      expect(result.subtotal).toBe(1000); // 10 * 100
      expect(result.proratedDays).toBeGreaterThan(0);
      expect(result.proratedCost).toBeLessThanOrEqual(result.totalCost);
    });

    it('should apply volume discount for new total seats', async () => {
      const mockSubscription = {
        id: 'sub-001',
        total_seats: 45, // Adding 10 will make it 55 (10% discount tier)
        price_per_seat: 100,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_plans: { price_monthly: 100, price_yearly: 1000 }
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null })
      } as any));

      const result = await service.calculateSeatAdditionCost('sub-001', 10);

      expect(result.newDiscountPercentage).toBe(10); // 55 seats = 10% discount
    });

    it('should throw error when subscription not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      } as any));

      await expect(service.calculateSeatAdditionCost('invalid-sub', 10))
        .rejects.toThrow('Subscription not found');
    });
  });

  describe('getBillingContacts', () => {
    it('should return billing contacts from organizations table', async () => {
      const mockOrganization = {
        email: 'admin@school.com',
        name: 'Test School',
        phone: '+1234567890'
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrganization, error: null })
      } as any));

      const result = await service.getBillingContacts('org-123');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('admin@school.com');
      expect(result[0].name).toBe('Test School');
      expect(result[0].isPrimary).toBe(true);
    });

    it('should return empty array when organization not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any));

      const result = await service.getBillingContacts('org-123');

      expect(result).toHaveLength(0);
    });
  });
});
