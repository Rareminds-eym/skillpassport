/**
 * BillingDashboard Component
 *
 * Displays billing information, payment history, and cost projections
 * for organization subscriptions.
 */

import {
  BillingDashboard as BillingData,
  organizationBillingService,
  PaymentRecord,
} from '@/services/organization/organizationBillingService';
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Download,
  FileText,
  IndianRupee,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface BillingDashboardProps {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  isLoading?: boolean;
}

function BillingDashboard({
  organizationId,
  organizationType,
  isLoading: externalLoading = false,
}: BillingDashboardProps) {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const fetchBillingData = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await organizationBillingService.getBillingDashboard(
        organizationId,
        organizationType
      );
      setBillingData(data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, organizationType]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleDownloadInvoice = useCallback(async (payment: PaymentRecord) => {
    setDownloadingInvoice(payment.id);
    try {
      // Generate invoice for this transaction
      const invoice = await organizationBillingService.generateInvoice(payment.id);

      // Create a simple text-based invoice for download
      const invoiceContent = `
INVOICE
=======
Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.issueDate).toLocaleDateString()}

Organization: ${invoice.organizationName}
${invoice.gstNumber ? `GST Number: ${invoice.gstNumber}` : ''}

ITEMS
-----
${invoice.lineItems
  .map(
    (item) =>
      `${item.description}
   Qty: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.amount.toFixed(2)}`
  )
  .join('\n\n')}

SUMMARY
-------
Subtotal: ₹${invoice.amount.toFixed(2)}
Tax (18% GST): ₹${invoice.taxAmount.toFixed(2)}
Total: ₹${invoice.totalAmount.toFixed(2)}

Status: ${invoice.status.toUpperCase()}
${invoice.paidDate ? `Paid on: ${new Date(invoice.paidDate).toLocaleDateString()}` : ''}

Thank you for your business!
      `.trim();

      // Download as text file
      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Invoice downloaded');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading || externalLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton loaders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="font-semibold text-red-800 mb-2">Error Loading Billing Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBillingData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">No Billing Data</h3>
        <p className="text-gray-500">No billing information available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Current Period Cost</span>
          </div>
          <div className="text-3xl font-bold">
            {formatCurrency(billingData.currentPeriod.totalCost)}
          </div>
          <div className="text-sm opacity-80 mt-1">
            {formatDate(billingData.currentPeriod.startDate)} -{' '}
            {formatDate(billingData.currentPeriod.endDate)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Seat Utilization</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{billingData.overallUtilization}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {billingData.totalAssignedSeats} / {billingData.totalActiveSeats} seats used
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${billingData.overallUtilization}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">Upcoming Renewals</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {billingData.upcomingRenewals.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {billingData.upcomingRenewals.length > 0
              ? `Next: ${formatDate(billingData.upcomingRenewals[0].renewalDate)}`
              : 'No upcoming renewals'}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Subscriptions</h4>
            {billingData.subscriptions.length > 0 ? (
              <div className="space-y-3">
                {billingData.subscriptions.map((sub) => (
                  <div
                    key={sub.subscriptionId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{sub.planName}</div>
                      <div className="text-sm text-gray-500">
                        {sub.seatCount} seats • {sub.utilization}% used
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
            ) : (
              <p className="text-gray-500 text-sm">No active subscriptions</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Add-ons</h4>
            {billingData.addons.length > 0 ? (
              <div className="space-y-3">
                {billingData.addons.map((addon) => (
                  <div
                    key={addon.addonId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{addon.addonName}</div>
                      <div className="text-sm text-gray-500">{addon.memberCount} members</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(addon.monthlyCost)}
                      </div>
                      <div className="text-xs text-gray-500">/month</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active add-ons</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Renewals */}
      {billingData.upcomingRenewals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Renewals
          </h3>
          <div className="space-y-3">
            {billingData.upcomingRenewals.map((renewal) => (
              <div
                key={renewal.subscriptionId}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100"
              >
                <div>
                  <div className="font-medium text-gray-900">{renewal.planName}</div>
                  <div className="text-sm text-gray-500">
                    {renewal.seatCount} seats • Renews {formatDate(renewal.renewalDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(renewal.estimatedCost)}
                  </div>
                  <div
                    className={`text-xs ${renewal.autoRenew ? 'text-green-600' : 'text-amber-600'}`}
                  >
                    {renewal.autoRenew ? 'Auto-renew ON' : 'Auto-renew OFF'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Payment History</h3>
          <button
            onClick={fetchBillingData}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {billingData.paymentHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Method</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {billingData.paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{payment.description}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {payment.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : payment.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : payment.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDownloadInvoice(payment)}
                        disabled={downloadingInvoice === payment.id}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Download Invoice"
                      >
                        {downloadingInvoice === payment.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(BillingDashboard);
