import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface FeeStructure {
  id: string;
  college_id: string;
  college_name: string;
  program_id: string;
  program_name: string;
  fee_type:
    | 'tuition'
    | 'admission'
    | 'examination'
    | 'library'
    | 'laboratory'
    | 'hostel'
    | 'transport'
    | 'development'
    | 'sports'
    | 'other';
  fee_name: string;
  amount: number;
  currency: string;
  academic_year: string;
  semester: number;
  due_date: string;
  late_fee_amount: number;
  late_fee_percentage: number;
  grace_period_days: number;
  is_mandatory: boolean;
  is_refundable: boolean;
  installment_allowed: boolean;
  max_installments: number;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  created_at: string;
  updated_at: string;
}

interface FeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FeeStructure>) => Promise<boolean>;
  editingStructure?: FeeStructure | null;
  colleges: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string; college_id: string }>;
}

const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStructure,
  colleges,
  programs,
}) => {
  const [formData, setFormData] = useState<Partial<FeeStructure>>({
    college_id: '',
    program_id: '',
    fee_type: 'tuition',
    fee_name: '',
    amount: 0,
    currency: 'INR',
    academic_year: '2024-25',
    semester: 1,
    due_date: '',
    late_fee_amount: 0,
    late_fee_percentage: 0,
    grace_period_days: 0,
    is_mandatory: true,
    is_refundable: false,
    installment_allowed: false,
    max_installments: 1,
    status: 'active',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [filteredPrograms, setFilteredPrograms] = useState(programs);

  useEffect(() => {
    if (editingStructure) {
      setFormData({
        ...editingStructure,
        due_date: editingStructure.due_date.split('T')[0], // Format date for input
      });
    } else {
      // Reset form for new structure
      setFormData({
        college_id: '',
        program_id: '',
        fee_type: 'tuition',
        fee_name: '',
        amount: 0,
        currency: 'INR',
        academic_year: '2024-25',
        semester: 1,
        due_date: '',
        late_fee_amount: 0,
        late_fee_percentage: 0,
        grace_period_days: 0,
        is_mandatory: true,
        is_refundable: false,
        installment_allowed: false,
        max_installments: 1,
        status: 'active',
        description: '',
      });
    }
    setErrors({});
  }, [editingStructure, isOpen]);

  useEffect(() => {
    // Filter programs based on selected college
    if (formData.college_id) {
      setFilteredPrograms(programs.filter((p) => p.college_id === formData.college_id));
    } else {
      setFilteredPrograms(programs);
    }
  }, [formData.college_id, programs]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.college_id) newErrors.college_id = 'College is required';
    if (!formData.fee_name?.trim()) newErrors.fee_name = 'Fee name is required';
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Amount must be greater than 0';
    if (!formData.due_date) newErrors.due_date = 'Due date is required';
    if (!formData.academic_year) newErrors.academic_year = 'Academic year is required';

    // Validate late fee
    if (formData.late_fee_percentage && formData.late_fee_amount) {
      newErrors.late_fee = 'Specify either percentage or fixed amount, not both';
    }

    // Validate installments
    if (
      formData.installment_allowed &&
      (!formData.max_installments || formData.max_installments < 2)
    ) {
      newErrors.max_installments =
        'Max installments must be at least 2 when installments are allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving fee structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FeeStructure, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">College *</label>
              <select
                value={formData.college_id || ''}
                onChange={(e) => handleInputChange('college_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.college_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select College</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
              {errors.college_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.college_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program</label>
              <select
                value={formData.program_id || ''}
                onChange={(e) => handleInputChange('program_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.college_id}
              >
                <option value="">All Programs</option>
                {filteredPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type *</label>
              <select
                value={formData.fee_type || 'tuition'}
                onChange={(e) => handleInputChange('fee_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tuition">Tuition</option>
                <option value="admission">Admission</option>
                <option value="examination">Examination</option>
                <option value="library">Library</option>
                <option value="laboratory">Laboratory</option>
                <option value="hostel">Hostel</option>
                <option value="transport">Transport</option>
                <option value="development">Development</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee Name *</label>
              <input
                type="text"
                value={formData.fee_name || ''}
                onChange={(e) => handleInputChange('fee_name', e.target.value)}
                placeholder="e.g., Semester Tuition Fee"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fee_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.fee_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.fee_name}
                </p>
              )}
            </div>
          </div>

          {/* Amount and Academic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.amount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                value={formData.academic_year || '2024-25'}
                onChange={(e) => handleInputChange('academic_year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2025-26">2025-26</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={formData.semester || 1}
                onChange={(e) => handleInputChange('semester', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date and Late Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.due_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.due_date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.late_fee_percentage || ''}
                onChange={(e) =>
                  handleInputChange('late_fee_percentage', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.late_fee_amount || ''}
                onChange={(e) =>
                  handleInputChange('late_fee_amount', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {errors.late_fee && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.late_fee}
            </p>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_mandatory"
                  checked={formData.is_mandatory || false}
                  onChange={(e) => handleInputChange('is_mandatory', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_mandatory" className="ml-2 text-sm text-gray-700">
                  Mandatory Fee
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_refundable"
                  checked={formData.is_refundable || false}
                  onChange={(e) => handleInputChange('is_refundable', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_refundable" className="ml-2 text-sm text-gray-700">
                  Refundable
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="installment_allowed"
                  checked={formData.installment_allowed || false}
                  onChange={(e) => handleInputChange('installment_allowed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="installment_allowed" className="ml-2 text-sm text-gray-700">
                  Allow Installments
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.grace_period_days || 0}
                  onChange={(e) =>
                    handleInputChange('grace_period_days', parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.installment_allowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Installments
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="12"
                    value={formData.max_installments || 1}
                    onChange={(e) =>
                      handleInputChange('max_installments', parseInt(e.target.value) || 1)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.max_installments ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_installments && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.max_installments}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Optional description for this fee structure..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Fee Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeeStructureModal;
