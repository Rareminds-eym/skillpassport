import React, { useEffect, useState } from "react";
import { X, CheckCircle, Clock } from "lucide-react";
import { StudentFeeSummary, FeePayment, PaymentStatus } from "../types";
import { supabase } from "../../../../../lib/supabaseClient";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentFeeSummary | null;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "text-green-700", bg: "bg-green-100" },
  partial: { label: "Partial", color: "text-yellow-700", bg: "bg-yellow-100" },
  pending: { label: "Pending", color: "text-gray-700", bg: "bg-gray-100" },
  overdue: { label: "Overdue", color: "text-red-700", bg: "bg-red-100" },
  waived: { label: "Waived", color: "text-blue-700", bg: "bg-blue-100" },
};

export const StudentLedgerModal: React.FC<Props> = ({ isOpen, onClose, student }) => {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      loadPayments();
    }
  }, [isOpen, student]);

  const loadPayments = async () => {
    if (!student) return;
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", student.student_id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  if (!isOpen || !student) return null;

  const config = statusConfig[student.status] || statusConfig.pending;


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between border-b border-gray-200 px-6 py-4 z-10">
            <h3 className="text-lg font-semibold text-gray-900">Student Fee Ledger</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Info Header */}
            <div className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{student.student_name}</h4>
                <p className="text-gray-600">Roll No: {student.roll_number}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">Total Due</p>
                <p className="text-xl font-bold text-gray-900">₹{student.total_due.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-sm text-green-600 mb-1">Total Paid</p>
                <p className="text-xl font-bold text-green-700">₹{student.total_paid.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-sm text-red-600 mb-1">Balance</p>
                <p className="text-xl font-bold text-red-700">₹{student.balance.toLocaleString()}</p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Fee Breakdown</h5>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Fee Head</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Due</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Paid</th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Balance</th>
                      <th className="text-center py-2 px-4 text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.ledger_entries.map((entry) => {
                      const entryConfig = statusConfig[entry.payment_status as PaymentStatus] || statusConfig.pending;
                      return (
                        <tr key={entry.id} className="border-t">
                          <td className="py-2 px-4 text-sm">{entry.fee_head_name}</td>
                          <td className="py-2 px-4 text-sm text-right">₹{entry.due_amount.toLocaleString()}</td>
                          <td className="py-2 px-4 text-sm text-right text-green-600">₹{(entry.paid_amount || 0).toLocaleString()}</td>
                          <td className="py-2 px-4 text-sm text-right text-red-600">₹{(entry.balance || 0).toLocaleString()}</td>
                          <td className="py-2 px-4 text-center">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${entryConfig.bg} ${entryConfig.color}`}>
                              {entryConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>


            {/* Payment History */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Payment History</h5>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No payments recorded yet</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Date</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Receipt No</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Mode</th>
                        <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">Amount</th>
                        <th className="text-center py-2 px-4 text-sm font-medium text-gray-700">Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-t">
                          <td className="py-2 px-4 text-sm">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 text-sm font-mono text-blue-600">{payment.receipt_number}</td>
                          <td className="py-2 px-4 text-sm">{payment.mode}</td>
                          <td className="py-2 px-4 text-sm text-right font-medium text-green-600">
                            ₹{payment.amount.toLocaleString()}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {payment.is_verified ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
