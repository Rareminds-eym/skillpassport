/**
 * BillingDashboard Component
 * 
 * Displays billing information for organization subscriptions including:
 * - Cost breakdown
 * - Payment history
 * - Downloadable invoices
 * - Upcoming renewals
 */

import {
    Calendar,
    Download,
    FileText
} from 'lucide-react';
import { memo, useMemo } from 'react';

interface BillingPeriod {
  startDate: string;
  endDate: string;
  totalCost: number;
  subscriptionCosts: number;
  addonCosts: number;
}

interface SubscriptionCost {
  planName: string;
  seatCount: number;
  utilization: number;
  monthlyCost: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl?: string;
}

interface UpcomingRenewal {
  subscriptionId: string;
  planName: string;
  renewalDate: string;
  estimatedCost: number;
  autoRenew: boolean;
}

interface BillingDashboardProps {
  currentPeriod: BillingPeriod;
  subscriptionCosts: SubscriptionCost[];
  invoices: Invoice[];
  upcomingRenewals: UpcomingRenewal[];
  onDownloadInvoice: (invoiceId: string) => void;
  onManageRenewal: (subscriptionId: string) => void;
  onViewAllInvoices: () => void;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function BillingDashboard({
  currentPeriod,
  subscriptionCosts,
  invoices,
  upcomingRenewals,
  onDownloadInvoice,
  onManageRenewal,
  onViewAllInvoices,
  isLoading = false,
}: BillingDashboardProps) {
  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Period Summary */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Billing Period</h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {formatDate(currentPeriod.startDate)} - {formatDate(currentPeriod.endDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(currentPeriod.totalCost)}</div>
            <div className="text-blue-100 text-sm">Total this period</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <div className="text-2xl font-bold">{formatCurrency(currentPeriod.subscriptionCosts)}</div>
            <div className="text-blue-100 text-sm">Subscriptions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(currentPeriod.addonCosts)}</div>
            <div className="text-blue-100 text-sm">Add-ons</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Cost Breakdown</h3>
          </div>
          <div className="p-5">
            {subscriptionCosts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No active subscriptions
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptionCosts.map((sub, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{sub.planName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.seatCount} seats • {sub.utilization}% utilized
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(sub.monthlyCost)}
                      </div>
                      <div className="text-xs text-gray-500">/month</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Upcoming Renewals</h3>
          </div>
          <div className="p-5">
            {upcomingRenewals.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No upcoming renewals
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingRenewals.map((renewal) => (
                  <div
                    key={renewal.subscriptionId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{renewal.planName}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(renewal.renewalDate)}
                        {renewal.autoRenew && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Auto-renew
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(renewal.estimatedCost)}
                      </div>
                      <button
                        onClick={() => onManageRenewal(renewal.subscriptionId)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
          <button
            onClick={onViewAllInvoices}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </button>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">{formatDate(invoice.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => onDownloadInvoice(invoice.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BillingDashboard);
