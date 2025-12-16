import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { FeeStructure, FeeHead, DueSchedule, Program, FEE_CATEGORIES, FEE_QUOTAS, DEFAULT_FEE_HEADS, PU_STREAMS, PU_YEARS } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FeeStructure>) => Promise<boolean>;
  structure?: FeeStructure | null;
  programs: Program[];
}

const getDefaultFormData = (): Partial<FeeStructure> => ({
  program_id: "",
  program_name: "",
  semester: 1,
  academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  category: "General",
  quota: "Merit",
  fee_heads: [{ name: "Tuition Fee", amount: 0, is_mandatory: true }],
  due_schedule: [{ installment: 1, due_date: "", amount: 0 }],
  scholarship_applicable: false,
  scholarship_amount: 0,
  discount_percentage: 0,
  is_active: true,
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
});

export const FeeStructureFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, structure, programs }) => {
  const [formData, setFormData] = useState<Partial<FeeStructure>>(getDefaultFormData());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (structure) {
      setFormData({
        ...structure,
        effective_from: structure.effective_from?.split("T")[0] || "",
        effective_to: structure.effective_to?.split("T")[0] || "",
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [structure, isOpen]);

  const totalAmount = (formData.fee_heads || []).reduce((sum, h) => sum + (h.amount || 0), 0);

  const handleProgramChange = (programId: string) => {
    const program = programs.find((p) => p.id === programId);
    setFormData({ ...formData, program_id: programId, program_name: program?.name || "" });
  };

  const addFeeHead = () => {
    setFormData({
      ...formData,
      fee_heads: [...(formData.fee_heads || []), { name: "", amount: 0, is_mandatory: false }],
    });
  };

  const updateFeeHead = (index: number, field: keyof FeeHead, value: string | number | boolean) => {
    const heads = [...(formData.fee_heads || [])];
    heads[index] = { ...heads[index], [field]: value };
    setFormData({ ...formData, fee_heads: heads });
  };

  const removeFeeHead = (index: number) => {
    const heads = (formData.fee_heads || []).filter((_, i) => i !== index);
    setFormData({ ...formData, fee_heads: heads });
  };


  const addDueSchedule = () => {
    const schedules = formData.due_schedule || [];
    setFormData({
      ...formData,
      due_schedule: [...schedules, { installment: schedules.length + 1, due_date: "", amount: 0 }],
    });
  };

  const updateDueSchedule = (index: number, field: keyof DueSchedule, value: string | number) => {
    const schedules = [...(formData.due_schedule || [])];
    schedules[index] = { ...schedules[index], [field]: value };
    setFormData({ ...formData, due_schedule: schedules });
  };

  const removeDueSchedule = (index: number) => {
    const schedules = (formData.due_schedule || []).filter((_, i) => i !== index);
    setFormData({ ...formData, due_schedule: schedules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.program_name) {
      alert("Please select a program");
      return;
    }
    setSaving(true);
    const success = await onSave(formData);
    setSaving(false);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white flex items-center justify-between border-b border-gray-200 px-6 py-4 z-10">
            <h3 className="text-lg font-semibold text-gray-900">
              {structure ? "Edit Fee Structure" : "Add Fee Structure"}
            </h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream *</label>
                {programs.length > 0 ? (
                  <select
                    value={formData.program_id || ""}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Stream</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.program_name || ""}
                    onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Stream</option>
                    {PU_STREAMS.map((stream) => (
                      <option key={stream} value={stream}>{stream}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <select
                  value={formData.semester || 1}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {PU_YEARS.map((year) => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={formData.academic_year || ""}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category || "General"}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {FEE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quota *</label>
                <select
                  value={formData.quota || "Merit"}
                  onChange={(e) => setFormData({ ...formData, quota: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {FEE_QUOTAS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>


            {/* Fee Heads Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Fee Heads</h4>
                <button type="button" onClick={addFeeHead} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="h-4 w-4" /> Add Fee Head
                </button>
              </div>
              <div className="space-y-3">
                {(formData.fee_heads || []).map((head, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={head.name}
                      onChange={(e) => updateFeeHead(index, "name", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select Fee Head</option>
                      {DEFAULT_FEE_HEADS.map((fh) => (
                        <option key={fh} value={fh}>{fh}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={head.amount || ""}
                      onChange={(e) => updateFeeHead(index, "amount", parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Amount"
                      min="0"
                    />
                    <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={head.is_mandatory}
                        onChange={(e) => updateFeeHead(index, "is_mandatory", e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      Mandatory
                    </label>
                    <button type="button" onClick={() => removeFeeHead(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                <span className="font-medium text-blue-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-600">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Due Schedule Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Due Schedule (Installments)</h4>
                <button type="button" onClick={addDueSchedule} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="h-4 w-4" /> Add Installment
                </button>
              </div>
              <div className="space-y-3">
                {(formData.due_schedule || []).map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 w-24">Installment {schedule.installment}</span>
                    <input
                      type="date"
                      value={schedule.due_date}
                      onChange={(e) => updateDueSchedule(index, "due_date", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={schedule.amount || ""}
                      onChange={(e) => updateDueSchedule(index, "amount", parseFloat(e.target.value) || 0)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Amount"
                      min="0"
                    />
                    <button type="button" onClick={() => removeDueSchedule(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Scholarship & Discount */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Scholarship & Discount</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="scholarship_applicable"
                    checked={formData.scholarship_applicable || false}
                    onChange={(e) => setFormData({ ...formData, scholarship_applicable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="scholarship_applicable" className="text-sm text-gray-700">Scholarship Applicable</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Amount</label>
                  <input
                    type="number"
                    value={formData.scholarship_amount || ""}
                    onChange={(e) => setFormData({ ...formData, scholarship_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                    min="0"
                    disabled={!formData.scholarship_applicable}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={formData.discount_percentage || ""}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Effective Dates */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Effective Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective From *</label>
                  <input
                    type="date"
                    value={formData.effective_from || ""}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective To</label>
                  <input
                    type="date"
                    value={formData.effective_to || ""}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? "Saving..." : structure ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
