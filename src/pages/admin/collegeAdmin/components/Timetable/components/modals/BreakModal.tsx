import React from "react";
import { X, Save } from "lucide-react";
import { Break, BreakFormData } from "../../types";

interface BreakModalProps {
  isOpen: boolean;
  editingBreakId: string | null;
  breakForm: BreakFormData;
  overlapWarning: string;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: BreakFormData) => void;
  onDateChange: (startDate: string, endDate: string) => void;
}

const BreakModal: React.FC<BreakModalProps> = ({
  isOpen,
  editingBreakId,
  breakForm,
  overlapWarning,
  loading,
  onClose,
  onSave,
  onFormChange,
  onDateChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {editingBreakId ? "Edit Break / Holiday" : "Add Break / Holiday"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={breakForm.break_type}
              onChange={(e) =>
                onFormChange({ ...breakForm, break_type: e.target.value as Break["break_type"] })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="holiday">Holiday</option>
              <option value="exam">Exam Period</option>
              <option value="event">Special Event</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={breakForm.name}
              onChange={(e) => onFormChange({ ...breakForm, name: e.target.value })}
              placeholder="e.g., Diwali Holiday"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={breakForm.start_date}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  onFormChange({ ...breakForm, start_date: newStartDate });
                  onDateChange(newStartDate, breakForm.end_date || "");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={breakForm.end_date}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  onFormChange({ ...breakForm, end_date: newEndDate });
                  onDateChange(breakForm.start_date || "", newEndDate);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Overlap Warning */}
          {overlapWarning && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">⚠️ Date Conflict</p>
              <p className="text-xs text-red-600 mt-1">{overlapWarning}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={breakForm.description || ""}
              onChange={(e) => onFormChange({ ...breakForm, description: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading || !!overlapWarning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : editingBreakId ? "Save Changes" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakModal;
