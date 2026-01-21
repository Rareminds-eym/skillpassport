import React from 'react';
import {
  X,
  FileText,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { StudentFeeSummary, PaymentStatus } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentFeeSummary | null;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  paid: { label: 'Paid', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  partial: { label: 'Partial', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  pending: { label: 'Pending', color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock },
  overdue: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
  waived: { label: 'Waived', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle },
};

export const StudentLedgerModal: React.FC<Props> = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Student Fee Ledger</h2>
              <p className="text-sm text-gray-600">
                {student.student_name} ({student.roll_number})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Student Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <IndianRupee className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Due</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(student.total_due)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Total Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(student.total_paid)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(student.balance)}</p>
            </div>
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>

          {student.ledger_entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No ledger entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {student.ledger_entries.map((entry, index) => {
                const config = statusConfig[entry.payment_status] || statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={entry.id || index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${config.bg} rounded-lg`}>
                          <StatusIcon
                            className={`h-4 w-4 ${config.color.replace('text-', 'text-')}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{entry.fee_head_name}</h4>
                          <p className="text-sm text-gray-600">Due: {formatDate(entry.due_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Due Amount</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(entry.due_amount)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Paid Amount</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(entry.paid_amount)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Balance</p>
                        <p
                          className={`font-semibold ${entry.balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {formatCurrency(entry.balance)}
                        </p>
                      </div>
                    </div>

                    {entry.is_overdue && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-800 font-medium">Overdue Payment</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History Section */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>

          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Payment history will be displayed here</p>
            <p className="text-xs text-gray-500 mt-1">
              This feature will show detailed payment transactions once payments are recorded
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {formatDate(new Date().toISOString())}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
