import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
/**
 * Organization Billing Service
 * 
 * Handles billing dashboard, invoicing, cost projections, and payment management
 * for organization-level subscriptions.
 */

import { supabase } from '@/shared/api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationBilling');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BillingPeriod {
  startDate: string;
  endDate: string;
  totalCost: number;
  subscriptionCosts: number;
  addonCosts: number;
}

export interface SubscriptionSummary {
  subscriptionId: string;
  planId: string;
  planName: string;
  seatCount: number;
  assignedSeats: number;
  utilization: number; // percentage
  monthlyCost: number;
  status: string;
  endDate: string;
}

export interface AddonSummary {
  addonId: string;
  addonName: string;
  memberCount: number;
  monthlyCost: number;
}

export interface UpcomingRenewal {
  subscriptionId: string;
  planName: string;
  renewalDate: string;
  estimatedCost: number;
  seatCount: number;
  autoRenew: boolean;
}

export interface PaymentRecord {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  description: string;
  createdAt: string;
  invoiceId?: string;
}

export interface BillingDashboard {
  organizationId: string;
  organizationType: string;
  currentPeriod: BillingPeriod;
  subscriptions: SubscriptionSummary[];
  addons: AddonSummary[];
  upcomingRenewals: UpcomingRenewal[];
  paymentHistory: PaymentRecord[];
  totalActiveSeats: number;
  totalAssignedSeats: number;
  overallUtilization: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  transactionId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: InvoiceLineItem[];
  billingAddress?: BillingAddress;
  gstNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface BillingAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingContact {
  name: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer' | 'upi' | 'netbanking';
  details: Record<string, any>;
  isDefault: boolean;
}

export interface CostProjection {
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  projectedAnnualCost: number;
  breakdown: {
    subscriptions: number;
    addons: number;
    taxes: number;
  };
}

// ============================================================================
// Service Class
// ============================================================================

export class OrganizationBillingService {
  /**
   * Get comprehensive billing dashboard for an organization
   */
  async getBillingDashboard(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<BillingDashboard> {
    try {
      // 1. Get all active subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('organization_type', organizationType)
        .eq('is_org_subscription', true)
        .in('status', ['active', 'grace_period']);

      if (subError) throw subError;

      // 2. Get payment history from auth DB via API
      let payments: any[] = [];
      try {
        const { data: { session } } = await getCurrentSession();
        if (session?.access_token) {
          const origin = window.location.origin;
          const res = await fetch(
            `${origin}/api/payments/get-user-payments?organization_id=${organizationId}&limit=20`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (res.ok) {
            const json = await res.json();
            payments = json.transactions || json.data || [];
          }
        }
      } catch (payErr) {
        logger.error('Error fetching payment history', payErr as Error);
      }

      // 3. Get addon purchases for organization
      // Note: addon_pending_orders uses addon_feature_key (text), not a foreign key to subscription_addons
      const { data: addons, error: addonError } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'completed');

      if (addonError) throw addonError;

      // 4. Calculate current period
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // 5. Calculate costs
      let subscriptionCosts = 0;
      let totalActiveSeats = 0;
      let totalAssignedSeats = 0;

      const subscriptionSummaries: SubscriptionSummary[] = (subscriptions || []).map(sub => {
        const monthlyCost = this.calculateMonthlyCost(sub);
        subscriptionCosts += monthlyCost;
        totalActiveSeats += sub.seat_count;
        totalAssignedSeats += sub.assigned_seats;

        return {
          subscriptionId: sub.id,
          planId: sub.plan_id,
          planName: sub.plan_name || 'Unknown Plan',
          seatCount: sub.seat_count,
          assignedSeats: sub.assigned_seats,
          utilization: sub.seat_count > 0
            ? Math.round((sub.assigned_seats / sub.seat_count) * 100)
            : 0,
          monthlyCost,
          status: sub.status,
          endDate: sub.subscription_end_date
        };
      });

      // 6. Calculate addon costs
      let addonCosts = 0;
      const addonSummaries: AddonSummary[] = [];
      const addonMap = new Map<string, AddonSummary>();

      (addons || []).forEach(addon => {
        const addonKey = addon.addon_feature_key;
        const existing = addonMap.get(addonKey);
        const memberCount = addon.target_member_ids?.length || 1;
        // Use the amount from the order itself since there's no subscription_addons table
        const cost = parseFloat(addon.amount || 0);

        if (existing) {
          existing.memberCount += memberCount;
          existing.monthlyCost += cost;
        } else {
          addonMap.set(addonKey, {
            addonId: addonKey,
            addonName: addonKey?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Addon',
            memberCount,
            monthlyCost: cost
          });
        }
        addonCosts += cost;
      });

      addonMap.forEach(addon => addonSummaries.push(addon));

      // 7. Get upcoming renewals (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingRenewals: UpcomingRenewal[] = (subscriptions || [])
        .filter(sub => {
          const endDate = new Date(sub.subscription_end_date);
          return endDate <= thirtyDaysFromNow && sub.status === 'active';
        })
        .map(sub => ({
          subscriptionId: sub.id,
          planName: sub.plan_name || 'Unknown Plan',
          renewalDate: sub.subscription_end_date,
          estimatedCost: parseFloat(sub.final_amount),
          seatCount: sub.seat_count,
          autoRenew: sub.auto_renew
        }));

      // 8. Map payment history
      const paymentHistory: PaymentRecord[] = (payments || []).map(p => ({
        id: p.id,
        transactionId: p.razorpay_payment_id || p.id,
        amount: parseFloat(p.amount),
        currency: p.currency || 'INR',
        status: p.status,
        paymentMethod: p.payment_method || 'unknown',
        description: p.description || 'Subscription payment',
        createdAt: p.created_at,
        invoiceId: p.invoice_id
      }));

      // 9. Calculate overall utilization
      const overallUtilization = totalActiveSeats > 0
        ? Math.round((totalAssignedSeats / totalActiveSeats) * 100)
        : 0;

      return {
        organizationId,
        organizationType,
        currentPeriod: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
          totalCost: subscriptionCosts + addonCosts,
          subscriptionCosts,
          addonCosts
        },
        subscriptions: subscriptionSummaries,
        addons: addonSummaries,
        upcomingRenewals,
        paymentHistory,
        totalActiveSeats,
        totalAssignedSeats,
        overallUtilization
      };
    } catch (error) {
      logger.error('Error fetching billing dashboard', error as Error);
      throw error;
    }
  }

  /**
   * Generate an invoice for a transaction
   */
  async generateInvoice(
    transactionId: string,
    organizationDetails?: {
      name: string;
      gstNumber?: string;
      billingAddress?: BillingAddress;
    }
  ): Promise<Invoice> {
    try {
      // 1. Get transaction details from auth DB via API
      let transaction: any = null;
      try {
        const { data: { session } } = await getCurrentSession();
        if (!session?.access_token) throw new Error('Not authenticated');

        const origin = window.location.origin;
        const res = await fetch(
          `${origin}/api/payments/get-user-payments?transaction_id=${transactionId}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const json = await res.json();
          const transactions = json.transactions || json.data || [];
          transaction = transactions.find((t: any) => t.id === transactionId) || transactions[0];
        }
      } catch (fetchErr) {
        logger.error('Error fetching transaction from API', fetchErr as Error);
      }

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // 2. Get organization subscription details if applicable
      let lineItems: InvoiceLineItem[] = [];

      if (transaction.organization_id) {
        const { data: orgSub } = await supabase
          .from('subscription_cache')
          .select('*')
          .eq('organization_id', transaction.organization_id)
          .eq('is_org_subscription', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (orgSub) {
          const baseAmount = parseFloat(orgSub.total_amount);
          const discountAmount = (baseAmount * orgSub.discount_percentage) / 100;
          const afterDiscount = baseAmount - discountAmount;
          const taxAmount = afterDiscount * 0.18;

          lineItems = [
            {
              description: `${orgSub.plan_name || 'Subscription'} - ${orgSub.seat_count} seats`,
              quantity: orgSub.seat_count,
              unitPrice: orgSub.price_per_seat,
              amount: baseAmount,
              taxRate: 0,
              taxAmount: 0
            }
          ];

          if (discountAmount > 0) {
            lineItems.push({
              description: `Volume Discount (${orgSub.discount_percentage}%)`,
              quantity: 1,
              unitPrice: -discountAmount,
              amount: -discountAmount,
              taxRate: 0,
              taxAmount: 0
            });
          }

          lineItems.push({
            description: 'GST (18%)',
            quantity: 1,
            unitPrice: taxAmount,
            amount: taxAmount,
            taxRate: 18,
            taxAmount: taxAmount
          });
        }
      }

      // 3. Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;

      // 4. Calculate totals
      const amount = parseFloat(transaction.amount);
      const taxAmount = amount * 0.18 / 1.18; // Extract tax from total
      const baseAmount = amount - taxAmount;

      // 5. Create invoice record
      const invoice: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber,
        organizationId: transaction.organization_id,
        organizationName: organizationDetails?.name || 'Organization',
        organizationType: transaction.organization_type || 'school',
        transactionId,
        amount: baseAmount,
        taxAmount,
        totalAmount: amount,
        currency: transaction.currency || 'INR',
        status: transaction.status === 'success' ? 'paid' : 'issued',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidDate: transaction.status === 'success' ? transaction.created_at : undefined,
        lineItems: lineItems.length > 0 ? lineItems : [{
          description: transaction.description || 'Subscription Payment',
          quantity: 1,
          unitPrice: baseAmount,
          amount: baseAmount,
          taxRate: 18,
          taxAmount
        }],
        billingAddress: organizationDetails?.billingAddress,
        gstNumber: organizationDetails?.gstNumber,
        createdAt: new Date().toISOString()
      };

      // 6. Store invoice in database (if invoices table exists)
      // For now, we return the generated invoice
      // In production, this would be stored in an invoices table

      return invoice;
    } catch (error) {
      logger.error('Error generating invoice', error as Error);
      throw error;
    }
  }

  /**
   * Get invoice history for an organization
   */
  async getInvoiceHistory(
    organizationId: string,
    limit: number = 50
  ): Promise<Invoice[]> {
    try {
      // Get all successful payment transactions from auth DB via API
      let transactions: any[] = [];
      try {
        const { data: { session } } = await getCurrentSession();
        if (session?.access_token) {
          const origin = window.location.origin;
          const res = await fetch(
            `${origin}/api/payments/get-user-payments?organization_id=${organizationId}&status=success&limit=${limit}`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          if (res.ok) {
            const json = await res.json();
            transactions = json.transactions || json.data || [];
          }
        }
      } catch (fetchErr) {
        logger.error('Error fetching transactions from API', fetchErr as Error);
      }

      // Generate invoice objects for each transaction
      const invoices: Invoice[] = (transactions || []).map((tx, index) => {
        const amount = parseFloat(tx.amount);
        const taxAmount = amount * 0.18 / 1.18;
        const baseAmount = amount - taxAmount;

        return {
          id: tx.invoice_id || `inv_${tx.id}`,
          invoiceNumber: `INV-${new Date(tx.created_at).getFullYear()}-${String(index + 1).padStart(5, '0')}`,
          organizationId: tx.organization_id,
          organizationName: 'Organization',
          organizationType: tx.organization_type || 'school',
          transactionId: tx.id,
          amount: baseAmount,
          taxAmount,
          totalAmount: amount,
          currency: tx.currency || 'INR',
          status: 'paid',
          issueDate: tx.created_at,
          dueDate: tx.created_at,
          paidDate: tx.created_at,
          lineItems: [{
            description: tx.description || 'Subscription Payment',
            quantity: tx.seat_count || 1,
            unitPrice: baseAmount / (tx.seat_count || 1),
            amount: baseAmount,
            taxRate: 18,
            taxAmount
          }],
          createdAt: tx.created_at
        };
      });

      return invoices;
    } catch (error) {
      logger.error('Error fetching invoice history', error as Error);
      throw error;
    }
  }

  /**
   * Download invoice as PDF
   * Calls the backend API to generate and return a PDF blob
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const { data: { session } } = await getCurrentSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const origin = window.location.origin;
      const response = await fetch(
        `${origin}/api/payments/org-billing/invoice/${invoiceId}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download invoice: ${response.status}`);
      }

      // Return the PDF blob
      return await response.blob();
    } catch (error) {
      logger.error('Error downloading invoice', error as Error);
      throw error;
    }
  }

  /**
   * Project monthly cost for an organization
   */
  async projectMonthlyCost(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<CostProjection> {
    try {
      // Get active subscriptions from subscription_cache
      const { data: subscriptions, error: subError } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('organization_type', organizationType)
        .eq('is_organization_subscription', true)
        .eq('status', 'active');

      if (subError) throw subError;

      // Get addon costs
      // Note: addon_pending_orders uses addon_feature_key (text), not a foreign key to subscription_addons
      const { data: addons, error: addonError } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'completed');

      if (addonError) throw addonError;

      // Calculate subscription costs
      let subscriptionCost = 0;
      (subscriptions || []).forEach(sub => {
        subscriptionCost += this.calculateMonthlyCost(sub);
      });

      // Calculate addon costs
      let addonCost = 0;
      (addons || []).forEach(addon => {
        // Use the amount from the order itself
        addonCost += parseFloat(addon.amount || 0);
      });

      const totalBeforeTax = subscriptionCost + addonCost;
      const taxes = totalBeforeTax * 0.18;
      const totalWithTax = totalBeforeTax + taxes;

      return {
        currentMonthlyCost: totalWithTax,
        projectedMonthlyCost: totalWithTax,
        projectedAnnualCost: totalWithTax * 12,
        breakdown: {
          subscriptions: subscriptionCost,
          addons: addonCost,
          taxes
        }
      };
    } catch (error) {
      logger.error('Error projecting monthly cost', error as Error);
      throw error;
    }
  }

  /**
   * Calculate cost for adding seats to a subscription
   */
  async calculateSeatAdditionCost(
    subscriptionId: string,
    additionalSeats: number
  ): Promise<{
    additionalSeats: number;
    pricePerSeat: number;
    subtotal: number;
    newDiscountPercentage: number;
    discountAmount: number;
    taxAmount: number;
    totalCost: number;
    proratedDays: number;
    proratedCost: number;
  }> {
    try {
      // Get current subscription from subscription_cache
      const { data: subscription, error } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error || !subscription) {
        throw new Error('Subscription not found');
      }

      const newTotalSeats = (subscription.seat_count || 0) + additionalSeats;
      const pricePerSeat = parseFloat(subscription.price_per_seat || subscription.plan_amount || '0');

      // Calculate new volume discount
      const newDiscountPercentage = this.calculateVolumeDiscount(newTotalSeats);
      
      // Calculate costs for additional seats
      const subtotal = pricePerSeat * additionalSeats;
      const discountAmount = (subtotal * newDiscountPercentage) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * 0.18;
      const totalCost = afterDiscount + taxAmount;

      // Calculate proration
      const endDate = new Date(subscription.subscription_end_date);
      const now = new Date();
      const totalDays = Math.ceil((endDate.getTime() - new Date(subscription.subscription_start_date).getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const proratedCost = (totalCost / totalDays) * remainingDays;

      return {
        additionalSeats,
        pricePerSeat,
        subtotal,
        newDiscountPercentage,
        discountAmount,
        taxAmount,
        totalCost,
        proratedDays: remainingDays,
        proratedCost: Math.round(proratedCost * 100) / 100
      };
    } catch (error) {
      logger.error('Error calculating seat addition cost', error as Error);
      throw error;
    }
  }

  /**
   * Get billing contacts for an organization
   */
  async getBillingContacts(organizationId: string): Promise<BillingContact[]> {
    try {
      // For now, return from organization metadata
      // Get billing contact from unified organizations table
      const { data, error } = await supabase
        .from('organizations')
        .select('email, phone, name')
        .eq('id', organizationId)
        .single();

      if (error) {
        logger.error('Error fetching organization for billing', error as Error);
        return [];
      }

      return data ? [{
        name: data.name || 'Admin',
        email: data.email || '',
        phone: data.phone,
        isPrimary: true
      }] : [];
    } catch (error) {
      logger.error('Error fetching billing contacts', error as Error);
      return [];
    }
  }

  /**
   * Add or update billing contact
   */
  async addBillingContact(
    organizationId: string,
    contact: BillingContact
  ): Promise<void> {
    try {
      // In production, this would insert into a billing_contacts table
      // For now, we update the organization's admin contact
      logger.info('Updating organization admin contact');
      // This is a placeholder - actual implementation would depend on
      // having a dedicated billing_contacts table
    } catch (error) {
      logger.error('Error adding billing contact', error as Error);
      throw error;
    }
  }

  /**
   * Update payment method for organization
   */
  async updatePaymentMethod(
    organizationId: string,
    paymentMethod: PaymentMethod
  ): Promise<void> {
    try {
      // In production, this would integrate with Razorpay to store
      // payment method tokens securely
      
      // This is a placeholder - actual implementation would integrate
      // with Razorpay's saved payment methods API
    } catch (error) {
      logger.error('Error updating payment method', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate monthly cost from subscription
   */
  private calculateMonthlyCost(subscription: any): number {
    const finalAmount = parseFloat(subscription.final_amount || subscription.plan_amount || '0');
    const startDate = new Date(subscription.subscription_start_date || subscription.start_date);
    const endDate = new Date(subscription.subscription_end_date || subscription.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const isAnnual = durationDays > 60; // More than 2 months = annual
    
    if (isAnnual) {
      return finalAmount / 12;
    }
    return finalAmount;
  }

  /**
   * Calculate volume discount based on seat count
   */
  private calculateVolumeDiscount(seatCount: number): number {
    if (seatCount >= 500) return 30;
    if (seatCount >= 100) return 20;
    if (seatCount >= 50) return 10;
    return 0;
  }
}

// Export singleton instance
export const organizationBillingService = new OrganizationBillingService();
