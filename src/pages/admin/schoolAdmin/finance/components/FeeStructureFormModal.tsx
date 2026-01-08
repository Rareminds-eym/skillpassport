import React, { useState, useEffect } from "react";
import { X, IndianRupee, Calendar, FileText, AlertCircle } from "lucide-react";
import { FeeStructure } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FeeStructure>) => Promise<boolean>;
  structure: FeeStructure | null;
  schoolId: string | null;
}

const feeHeads = [
  { value: "tuition", label: "Tuition Fee" },
  { value: "admission", label: "Admission Fee" },
  { value: "development", label: "Development Fee" },
  { value: "activity", label: "Activity Fee" },
  { value: "transport", label: "Transport Fee" },
  { value: "hostel", label: "Hostel Fee" },
  { value: "library", label: "Library Fee" },
  { value: "laboratory", label: "Laboratory Fee" },
  { value: "sports", label: "Sports Fee" },
  { value: "examination", label: "Examination Fee" },
  { value: "other", label: "Other" },
];

const frequencies = [
  { value: "monthly", label: "Monthly" },
  { value: "term", label: "Per Term" },
  { value: "annual", label: "Annual" },
];

export const FeeStructureFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  structure,
  schoolId,
}) => {
  const [formData, setFormData] = useState({
    class_name: "",
    academic_year: new Date().getFullYear().toString(),
    fee_head: "tuition",
    custom_fee_head: "",
    amount: "",
    frequency: "monthly" as const,
    late_fee_percentage: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (structure) {
        setFormData({
          class_name: structure.class_name || "",
          academic_year: structure.academic_year || new Date().getFullYear().toString(),
          fee_head: structure.fee_head || "tuition",
          custom_fee_head: structure.custom_fee_head || "",
          amount: structure.amount?.toString() || "",
          frequency: structure.frequency || "monthly",
          late_fee_percentage: structure.late_fee_percentage?.toString() || "",
          is_active: structure.is_active ?? true,
        });
      } else {
        setFormData({
          class_name: "",
          academic_year: new Date().getFullYear().toString(),
          fee_head: "tuition",
          custom_fee_head: "",
          amount: "",
          frequency: "monthly",
          late_fee_percentage: "",
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, structure]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.class_name.trim()) {
      newErrors.class_name = "Class name is required";
    }

    if (!formData.academic_year.trim()) {
      newErrors.academic_year = "Academic year is required";
    }

    if (formData.fee_head === "other" && !formData.custom_fee_head.trim()) {
      newErrors.custom_fee_head = "Custom fee head name is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount is required and must be greater than 0";
    }

    if (formData.late_fee_percentage && (parseFloat(formData.late_fee_percentage) < 0 || parseFloat(formData.late_fee_percentage) > 100)) {
      newErrors.late_fee_percentage = "Late fee percentage must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !schoolId) return;

    setLoading(true);
    try {
      const success = await onSave({
        ...formData,
        school_id: schoolId,
        amount: parseFloat(formData.amount),
        late_fee_percentage: formData.late_fee_percentage ? parseFloat(formData.late_fee_percentage) : undefined,
      });
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {structure ? "Edit Fee Structure" : "Create Fee Structure"}
              </h2>
              <p className="text-sm text-gray-600">
                {structure ? "Update existing fee structure" : "Add a new fee structure for your school"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class/Grade *
            </label>
            <input
              type="text"
              value={formData.class_name}
              onChange={(e) => handleInputChange("class_name", e.target.value)}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.class_name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="e.g., Class 10-A, Grade 5, Nursery"
            />
            {errors.class_name && (
              <p className="text-red-600 text-sm mt-1">{errors.class_name}</p>
            )}
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => handleInputChange("academic_year", e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.academic_year ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., 2024-25, 2024"
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.academic_year && (
              <p className="text-red-600 text-sm mt-1">{errors.academic_year}</p>
            )}
          </div>

          {/* Fee Head */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Head *
            </label>
            <select
              value={formData.fee_head}
              onChange={(e) => handleInputChange("fee_head", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {feeHeads.map((head) => (
                <option key={head.value} value={head.value}>
                  {head.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Fee Head */}
          {formData.fee_head === "other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Fee Head Name *
              </label>
              <input
                type="text"
                value={formData.custom_fee_head}
                onChange={(e) => handleInputChange("custom_fee_head", e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.custom_fee_head ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter custom fee head name"
              />
              {errors.custom_fee_head && (
                <p className="text-red-600 text-sm mt-1">{errors.custom_fee_head}</p>
              )}
            </div>
          )}

          {/* Amount and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange("frequency", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Late Fee Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Late Fee Percentage (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.late_fee_percentage}
                onChange={(e) => handleInputChange("late_fee_percentage", e.target.value)}
                className={`w-full pr-8 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.late_fee_percentage ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2.5 text-gray-500">%</span>
            </div>
            {errors.late_fee_percentage && (
              <p className="text-red-600 text-sm mt-1">{errors.late_fee_percentage}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Percentage of late fee to be charged on overdue payments
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange("is_active", e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active Fee Structure
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">Fee Structure Information</h4>
                <p className="text-xs text-blue-700">
                  This fee structure will be applied to all students in the specified class. 
                  You can create multiple fee structures for different fee heads (tuition, transport, etc.) 
                  for the same class.
                </p>
              </div>
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Saving..." : structure ? "Update Structure" : "Create Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};