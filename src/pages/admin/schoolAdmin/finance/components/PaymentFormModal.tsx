import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, FileText, AlertCircle } from 'lucide-react';
import { StudentFeeSummary, PaymentMode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ledgerId: string, studentId: string, data: any) => Promise<boolean>;
  student: StudentFeeSummary | null;
}

const paymentModes: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'dd', label: 'Demand Draft' },
  { value: 'online', label: 'Online Transfer' },
  { value: 'card', label: 'Card Payment' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

export const PaymentFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, student }) => {
  const [formData, setFormData] = useState({
    amount: '',
    mode: 'cash' as PaymentMode,
    reference_number: '',
    transaction_id: '',
    bank_name: '',
    cheque_number: '',
    cheque_date: '',
    dd_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && student) {
      setFormData({
        amount: student.balance.toString(),
        mode: 'cash',
        reference_number: '',
        transaction_id: '',
        bank_name: '',
        cheque_number: '',
        cheque_date: '',
        dd_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setErrors({});
    }
  }, [isOpen, student]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (parseFloat(formData.amount) > (student?.balance || 0)) {
      newErrors.amount = 'Amount cannot exceed outstanding balance';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    // Mode-specific validations
    if (formData.mode === 'cheque') {
      if (!formData.cheque_number) {
        newErrors.cheque_number = 'Cheque number is required';
      }
      if (!formData.cheque_date) {
        newErrors.cheque_date = 'Cheque date is required';
      }
      if (!formData.bank_name) {
        newErrors.bank_name = 'Bank name is required';
      }
    }

    if (formData.mode === 'dd') {
      if (!formData.dd_number) {
        newErrors.dd_number = 'DD number is required';
      }
      if (!formData.bank_name) {
        newErrors.bank_name = 'Bank name is required';
      }
    }

    if (['online', 'card', 'upi'].includes(formData.mode)) {
      if (!formData.transaction_id) {
        newErrors.transaction_id = 'Transaction ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !student) return;

    setLoading(true);
    try {
      // Use the first ledger entry for payment recording
      const ledgerId = student.ledger_entries[0]?.id || 'mock-ledger';
      const success = await onSave(ledgerId, student.student_id, {
        ...formData,
        amount: parseFloat(formData.amount),
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Payment submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-600">
                {student.student_name} ({student.roll_number})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Outstanding Balance Info */}
        <div className="p-6 bg-red-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Outstanding Balance</span>
          </div>
          <p className="text-2xl font-bold text-red-900">₹{student.balance.toLocaleString()}</p>
          <p className="text-sm text-red-700 mt-1">
            Total Due: ₹{student.total_due.toLocaleString()} | Paid: ₹
            {student.total_paid.toLocaleString()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={student.balance}
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
            <select
              value={formData.mode}
              onChange={(e) => handleInputChange('mode', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {paymentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
            <div className="relative">
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.payment_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.payment_date && (
              <p className="text-red-600 text-sm mt-1">{errors.payment_date}</p>
            )}
          </div>

          {/* Mode-specific fields */}
          {formData.mode === 'cheque' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cheque Number *
                  </label>
                  <input
                    type="text"
                    value={formData.cheque_number}
                    onChange={(e) => handleInputChange('cheque_number', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cheque_number ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter cheque number"
                  />
                  {errors.cheque_number && (
                    <p className="text-red-600 text-sm mt-1">{errors.cheque_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cheque Date *
                  </label>
                  <input
                    type="date"
                    value={formData.cheque_date}
                    onChange={(e) => handleInputChange('cheque_date', e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cheque_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.cheque_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.cheque_date}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm foxt-gray-700 mb-2">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bank_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter bank name"
                />
                {errors.bank_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.bank_name}</p>
                )}
              </div>
            </>
          )}

          {formData.mode === 'dd' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DD Number *</label>
                <input
                  type="text"
                  value={formData.dd_number}
                  onChange={(e) => handleInputChange('dd_number', e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dd_number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter DD number"
                />
                {errors.dd_number && (
                  <p className="text-red-600 text-sm mt-1">{errors.dd_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bank_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter bank name"
                />
                {errors.bank_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.bank_name}</p>
                )}
              </div>
            </>
          )}

          {['online', 'card', 'upi'].includes(formData.mode) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID *
              </label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.transaction_id ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter transaction ID"
              />
              {errors.transaction_id && (
                <p className="text-red-600 text-sm mt-1">{errors.transaction_id}</p>
              )}
            </div>
          )}

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reference number (optional)"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 m2">Remarks</label>
            <div className="relative">
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes..."
              />
              <FileText className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
