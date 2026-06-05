import { apiGet, apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationBilling');

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
  utilization: number;
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
  breakdown: { subscriptions: number; addons: number; taxes: number };
}

export class OrganizationBillingService {
  async getBillingDashboard(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<BillingDashboard> {
    try {
      const subscriptions = await apiGet<any[]>(`/organization?action=getSubscriptions&orgId=${encodeURIComponent(organizationId)}&orgType=${organizationType}`);

      let payments: any[] = [];
      try {
        const origin = window.location.origin;
        const res = await ssoClient.fetch(`${origin}/api/payments/get-user-payments?organization_id=${organizationId}&limit=20`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          const inner = json.data || json;
          payments = inner.transactions || inner.data || [];
        }
      } catch (payErr) {
        logger.error('Error fetching payment history', payErr as Error);
      }

      const addons = payments.filter(p => p.transaction_type === 'addon' && p.status === 'success');
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      let subscriptionCosts = 0;
      let totalActiveSeats = 0;
      let totalAssignedSeats = 0;

      const subscriptionSummaries: SubscriptionSummary[] = (subscriptions?.data || []).map((sub: any) => {
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
          utilization: sub.seat_count > 0 ? Math.round((sub.assigned_seats / sub.seat_count) * 100) : 0,
          monthlyCost,
          status: sub.status,
          endDate: sub.subscription_end_date,
        };
      });

      let addonCosts = 0;
      const addonSummaries: AddonSummary[] = [];
      const addonMap = new Map<string, AddonSummary>();
      (addons || []).forEach((addon: any) => {
        const addonKey = addon.metadata?.feature_key || 'unknown';
        const existing = addonMap.get(addonKey);
        const memberCount = addon.metadata?.target_member_ids?.length || addon.seat_count || 1;
        const cost = parseFloat(addon.amount ?? 0);
        if (existing) {
          existing.memberCount += memberCount;
          existing.monthlyCost += cost;
        } else {
          addonMap.set(addonKey, {
            addonId: addonKey,
            addonName: addonKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            memberCount,
            monthlyCost: cost,
          });
        }
        addonCosts += cost;
      });
      addonMap.forEach(addon => addonSummaries.push(addon));

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const upcomingRenewals: UpcomingRenewal[] = (subscriptions?.data || [])
        .filter((sub: any) => new Date(sub.subscription_end_date) <= thirtyDaysFromNow && sub.status === 'active')
        .map((sub: any) => ({
          subscriptionId: sub.id,
          planName: sub.plan_name || 'Unknown Plan',
          renewalDate: sub.subscription_end_date,
          estimatedCost: parseFloat(sub.final_amount) || 0,
          seatCount: sub.seat_count,
          autoRenew: sub.auto_renew,
        }));

      const paymentHistory: PaymentRecord[] = (payments || []).map((p: any) => ({
        id: p.id,
        transactionId: p.razorpay_payment_id || p.id,
        amount: parseFloat(p.amount),
        currency: p.currency || 'INR',
        status: p.status,
        paymentMethod: p.payment_method || 'unknown',
        description: p.description || 'Subscription payment',
        createdAt: p.created_at,
        invoiceId: p.invoice_id,
      }));

      const overallUtilization = totalActiveSeats > 0 ? Math.round((totalAssignedSeats / totalActiveSeats) * 100) : 0;

      return {
        organizationId,
        organizationType,
        currentPeriod: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
          totalCost: subscriptionCosts + addonCosts,
          subscriptionCosts,
          addonCosts,
        },
        subscriptions: subscriptionSummaries,
        addons: addonSummaries,
        upcomingRenewals,
        paymentHistory,
        totalActiveSeats,
        totalAssignedSeats,
        overallUtilization,
      };
    } catch (error) {
      logger.error('Error fetching billing dashboard', error as Error);
      throw error;
    }
  }

  async generateInvoice(
    transactionId: string,
    organizationDetails?: { name: string; gstNumber?: string; billingAddress?: BillingAddress }
  ): Promise<Invoice> {
    try {
      let transaction: any = null;
      try {
        const origin = window.location.origin;
        const res = await ssoClient.fetch(`${origin}/api/payments/get-user-payments?transaction_id=${transactionId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          const inner = json.data || json;
          const transactions = inner.transactions || inner.data || [];
          transaction = transactions.find((t: any) => t.id === transactionId) || transactions[0];
        }
      } catch (fetchErr) {
        logger.error('Error fetching transaction from API', fetchErr as Error);
      }

      if (!transaction) throw new Error('Transaction not found');

      let lineItems: InvoiceLineItem[] = [];
      if (transaction.organization_id) {
        const subscriptionsRes = await apiGet<any[]>(`/organization?action=getSubscriptions&orgId=${encodeURIComponent(transaction.organization_id)}`);
        const orgSub = subscriptionsRes?.data?.[0];
        if (orgSub) {
          const baseAmount = parseFloat(orgSub.total_amount);
          const discountAmount = (baseAmount * orgSub.discount_percentage) / 100;
          const afterDiscount = baseAmount - discountAmount;
          const taxAmount = afterDiscount * 0.18;
          lineItems = [
            { description: `${orgSub.plan_name || 'Subscription'} - ${orgSub.seat_count} seats`, quantity: orgSub.seat_count, unitPrice: orgSub.price_per_seat, amount: baseAmount, taxRate: 0, taxAmount: 0 },
          ];
          if (discountAmount > 0) {
            lineItems.push({ description: `Volume Discount (${orgSub.discount_percentage}%)`, quantity: 1, unitPrice: -discountAmount, amount: -discountAmount, taxRate: 0, taxAmount: 0 });
          }
          lineItems.push({ description: 'GST (18%)', quantity: 1, unitPrice: taxAmount, amount: taxAmount, taxRate: 18, taxAmount });
        }
      }

      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
      const amount = parseFloat(transaction.amount);
      const taxAmount = amount * 0.18 / 1.18;
      const baseAmount = amount - taxAmount;

      return {
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
        lineItems: lineItems.length > 0 ? lineItems : [{ description: transaction.description || 'Subscription Payment', quantity: 1, unitPrice: baseAmount, amount: baseAmount, taxRate: 18, taxAmount }],
        billingAddress: organizationDetails?.billingAddress,
        gstNumber: organizationDetails?.gstNumber,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error generating invoice', error as Error);
      throw error;
    }
  }

  async getInvoiceHistory(organizationId: string, limit: number = 50): Promise<Invoice[]> {
    try {
      let transactions: any[] = [];
      try {
        const origin = window.location.origin;
        const res = await ssoClient.fetch(`${origin}/api/payments/get-user-payments?organization_id=${organizationId}&status=success&limit=${limit}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          const inner = json.data || json;
          transactions = inner.transactions || inner.data || [];
        }
      } catch (fetchErr) {
        logger.error('Error fetching transactions from API', fetchErr as Error);
      }

      return (transactions || []).map((tx: any, index: number) => {
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
          lineItems: [{ description: tx.description || 'Subscription Payment', quantity: tx.seat_count || 1, unitPrice: baseAmount / (tx.seat_count || 1), amount: baseAmount, taxRate: 18, taxAmount }],
          createdAt: tx.created_at,
        };
      });
    } catch (error) {
      logger.error('Error fetching invoice history', error as Error);
      throw error;
    }
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      const origin = window.location.origin;
      const response = await ssoClient.fetch(`${origin}/api/payments/org-billing/invoice/${invoiceId}/download`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to download invoice: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      logger.error('Error downloading invoice', error as Error);
      throw error;
    }
  }

  async projectMonthlyCost(organizationId: string, organizationType: 'school' | 'college' | 'university'): Promise<CostProjection> {
    try {
      const subscriptionsRes = await apiGet<any[]>(`/organization?action=getSubscriptions&orgId=${encodeURIComponent(organizationId)}&orgType=${organizationType}`);
      const subscriptions = subscriptionsRes?.data || [];
      let subscriptionCost = 0;
      (subscriptions || []).forEach((sub: any) => { subscriptionCost += this.calculateMonthlyCost(sub); });

      let addonCost = 0;
      try {
        const origin = window.location.origin;
        const res = await ssoClient.fetch(`${origin}/api/payments/get-user-payments?organization_id=${organizationId}&limit=50`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          const inner = json.data || json;
          const payments = inner.transactions || inner.data || [];
          payments.filter((p: any) => p.transaction_type === 'addon' && p.status === 'success')
            .forEach((addon: any) => { addonCost += parseFloat(addon.amount ?? 0); });
        }
      } catch (addonError) {
        logger.error('Error fetching addons for projection', addonError as Error);
      }

      const totalBeforeTax = subscriptionCost + addonCost;
      const taxes = totalBeforeTax * 0.18;
      const totalWithTax = totalBeforeTax + taxes;

      return {
        currentMonthlyCost: totalWithTax,
        projectedMonthlyCost: totalWithTax,
        projectedAnnualCost: totalWithTax * 12,
        breakdown: { subscriptions: subscriptionCost, addons: addonCost, taxes },
      };
    } catch (error) {
      logger.error('Error projecting monthly cost', error as Error);
      throw error;
    }
  }

  async calculateSeatAdditionCost(subscriptionId: string, additionalSeats: number): Promise<{
    additionalSeats: number; pricePerSeat: number; subtotal: number; newDiscountPercentage: number;
    discountAmount: number; taxAmount: number; totalCost: number; proratedDays: number; proratedCost: number;
  }> {
    try {
      const subscriptionsRes = await apiGet<any[]>(`/organization?action=getSubscriptions&subId=${encodeURIComponent(subscriptionId)}`);
      const subscriptions = subscriptionsRes?.data || [];
      const subscription = Array.isArray(subscriptions) ? subscriptions[0] : subscriptions;
      if (!subscription) throw new Error('Subscription not found');

      const newTotalSeats = (subscription.seat_count || 0) + additionalSeats;
      const pricePerSeat = parseFloat(subscription.price_per_seat ?? subscription.plan_amount ?? '0');
      const newDiscountPercentage = this.calculateVolumeDiscount(newTotalSeats);
      const subtotal = pricePerSeat * additionalSeats;
      const discountAmount = (subtotal * newDiscountPercentage) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * 0.18;
      const totalCost = afterDiscount + taxAmount;
      const endDate = new Date(subscription.subscription_end_date);
      const now = new Date();
      const totalDays = Math.ceil((endDate.getTime() - new Date(subscription.subscription_start_date).getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const proratedCost = (totalCost / totalDays) * remainingDays;

      return { additionalSeats, pricePerSeat, subtotal, newDiscountPercentage, discountAmount, taxAmount, totalCost, proratedDays: remainingDays, proratedCost: Math.round(proratedCost * 100) / 100 };
    } catch (error) {
      logger.error('Error calculating seat addition cost', error as Error);
      throw error;
    }
  }

  async getBillingContacts(organizationId: string): Promise<BillingContact[]> {
    try {
      const dataRes = await apiGet<any>(`/organization?action=getOrganizationById&id=${encodeURIComponent(organizationId)}`);
      const d = dataRes?.data;
      return d ? [{ name: d.name || 'Admin', email: d.email || '', phone: d.phone, isPrimary: true }] : [];
    } catch (error) {
      logger.error('Error fetching billing contacts', error as Error);
      return [];
    }
  }

  async addBillingContact(organizationId: string, contact: BillingContact): Promise<void> {
    logger.info('Updating organization admin contact');
  }

  async updatePaymentMethod(organizationId: string, paymentMethod: PaymentMethod): Promise<void> {
    // Placeholder - would integrate with Razorpay
  }

  private calculateMonthlyCost(subscription: any): number {
    const finalAmount = parseFloat(subscription.final_amount ?? subscription.plan_amount ?? '0');
    const startDate = new Date(subscription.subscription_start_date || subscription.start_date);
    const endDate = new Date(subscription.subscription_end_date || subscription.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return durationDays > 60 ? finalAmount / 12 : finalAmount;
  }

  private calculateVolumeDiscount(seatCount: number): number {
    if (seatCount >= 500) return 30;
    if (seatCount >= 100) return 20;
    if (seatCount >= 50) return 10;
    return 0;
  }
}

export const organizationBillingService = new OrganizationBillingService();
