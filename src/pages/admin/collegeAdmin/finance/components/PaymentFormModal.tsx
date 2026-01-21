import React, { useState } from 'react';
import { X } from 'lucide-react';
import { StudentFeeSummary, FeePayment, PaymentMode, PAYMENT_MODES } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ledgerId: string, studentId: string, data: Partial<FeePayment>) => Promise<boolean>;
  student: StudentFeeSummary | null;
}

export const PaymentFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, student }) => {
  const [formData, setFormData] = useState<Partial<FeePayment>>({
    amount: 0,
    mode: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>('');

  if (!isOpen || !student) return null;

  const pendingLedgers = student.ledger_entries.filter((l) => (l.balance || 0) > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLedgerId) {
      alert('Please select a fee head to pay');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSaving(true);
    const success = await onSave(selectedLedgerId, student.student_id, formData);
    setSaving(false);
    if (success) {
      onClose();
      setFormData({
        amount: 0,
        mode: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setSelectedLedgerId('');
    }
  };

  const selectedLedger = pendingLedgers.find((l) => l.id === selectedLedgerId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="font-semibold text-blue-900">{student.student_name}</p>
              <p className="text-sm text-blue-700">Roll No: {student.roll_number}</p>
              <p className="text-sm text-blue-700">Balance: ₹{student.balance.toLocaleString()}</p>
            </div>

            {/* Select Fee Head */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Head *</label>
              <select
                value={selectedLedgerId}
                onChange={(e) => setSelectedLedgerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Fee Head</option>
                {pendingLedgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.fee_head_name} - Balance: ₹{(ledger.balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedLedger && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Amount:</span>
                  <span className="font-medium">₹{selectedLedger.due_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-medium text-green-600">
                    ₹{(selectedLedger.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-medium text-red-600">
                    ₹{(selectedLedger.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="1"
                max={selectedLedger?.balance || undefined}
                required
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
              <select
                value={formData.mode || 'Cash'}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as PaymentMode })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Fields based on Payment Mode */}
            {(formData.mode === 'Cheque' || formData.mode === 'DD') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                  />
                </div>
                {formData.mode === 'Cheque' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cheque No
                        </label>
                        <input
                          type="text"
                          value={formData.cheque_number || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, cheque_number: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cheque Date
                        </label>
                        <input
                          type="date"
                          value={formData.cheque_date || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, cheque_date: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
                {formData.mode === 'DD' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DD Number
                    </label>
                    <input
                      type="text"
                      value={formData.dd_number || ''}
                      onChange={(e) => setFormData({ ...formData, dd_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            )}

            {(formData.mode === 'Online' ||
              formData.mode === 'UPI' ||
              formData.mode === 'Bank Transfer') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_id || ''}
                    onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference No
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number || ''}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={formData.payment_date || ''}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Optional remarks..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
