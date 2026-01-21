import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, Save, Coffee, GripVertical } from 'lucide-react';
import { TimePeriod } from '../../types';

interface PeriodsModalProps {
  isOpen: boolean;
  periods: TimePeriod[];
  loading: boolean;
  onClose: () => void;
  onSave: (periods: TimePeriod[]) => void;
}

const PeriodsModal: React.FC<PeriodsModalProps> = ({
  isOpen,
  periods: initialPeriods,
  loading,
  onClose,
  onSave,
}) => {
  const [editablePeriods, setEditablePeriods] = useState<TimePeriod[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize editable periods when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditablePeriods([...initialPeriods]);
      setHasChanges(false);
    }
  }, [isOpen, initialPeriods]);

  if (!isOpen) return null;

  const updatePeriod = (index: number, field: keyof TimePeriod, value: any) => {
    const updated = [...editablePeriods];
    updated[index] = { ...updated[index], [field]: value };

    // If toggling is_break off, clear break_type
    if (field === 'is_break' && !value) {
      updated[index].break_type = undefined;
    }
    // If toggling is_break on, set default break_type
    if (field === 'is_break' && value) {
      updated[index].break_type = 'short';
    }

    setEditablePeriods(updated);
    setHasChanges(true);
  };

  const addPeriod = (isBreak: boolean = false) => {
    const lastPeriod = editablePeriods[editablePeriods.length - 1];
    const newPeriodNumber = editablePeriods.length + 1;

    // Calculate next start time (end time of last period)
    const startTime = lastPeriod?.end_time || '09:00';

    // Calculate end time (50 min for period, 15 min for break)
    const [hours, mins] = startTime.split(':').map(Number);
    const duration = isBreak ? 15 : 50;
    const endMins = mins + duration;
    const endHours = hours + Math.floor(endMins / 60);
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    const newPeriod: TimePeriod = {
      period_number: newPeriodNumber,
      period_name: isBreak ? 'Break' : `Period ${newPeriodNumber}`,
      start_time: startTime,
      end_time: endTime,
      is_break: isBreak,
      break_type: isBreak ? 'short' : undefined,
    };

    setEditablePeriods([...editablePeriods, newPeriod]);
    setHasChanges(true);
  };

  const deletePeriod = (index: number) => {
    if (editablePeriods.length <= 1) {
      alert('Cannot delete the last period');
      return;
    }

    const updated = editablePeriods.filter((_, i) => i !== index);
    // Renumber periods
    const renumbered = updated.map((p, i) => ({ ...p, period_number: i + 1 }));
    setEditablePeriods(renumbered);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate periods
    for (let i = 0; i < editablePeriods.length; i++) {
      const p = editablePeriods[i];
      if (!p.period_name.trim()) {
        alert(`Period ${i + 1} name is required`);
        return;
      }
      if (!p.start_time || !p.end_time) {
        alert(`Period ${i + 1} times are required`);
        return;
      }
      if (p.start_time >= p.end_time) {
        alert(`Period ${i + 1}: End time must be after start time`);
        return;
      }
    }

    onSave(editablePeriods);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Configure Time Periods</h3>
            <p className="text-sm text-gray-500 mt-1">
              Define the daily schedule structure including classes and breaks
            </p>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Period List */}
        <div className="flex-1 overflow-auto space-y-2 mb-4">
          {editablePeriods.map((period, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                period.is_break
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Drag Handle (visual only for now) */}
              <div className="text-gray-400 cursor-grab">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Period Number */}
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                {period.period_number}
              </div>

              {/* Period Name */}
              <input
                type="text"
                value={period.period_name}
                onChange={(e) => updatePeriod(index, 'period_name', e.target.value)}
                className={`flex-1 px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  period.is_break ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                }`}
                placeholder="Period name"
              />

              {/* Time Inputs */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  value={period.start_time}
                  onChange={(e) => updatePeriod(index, 'start_time', e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-24"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="time"
                  value={period.end_time}
                  onChange={(e) => updatePeriod(index, 'end_time', e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-24"
                />
              </div>

              {/* Break Toggle */}
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={period.is_break}
                    onChange={(e) => updatePeriod(index, 'is_break', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
                <Coffee
                  className={`h-4 w-4 ${period.is_break ? 'text-amber-600' : 'text-gray-300'}`}
                />
              </div>

              {/* Break Type (if is_break) */}
              {period.is_break && (
                <select
                  value={period.break_type || 'short'}
                  onChange={(e) => updatePeriod(index, 'break_type', e.target.value)}
                  className="px-2 py-1.5 text-sm border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="short">Short</option>
                  <option value="lunch">Lunch</option>
                </select>
              )}

              {/* Delete Button */}
              <button
                onClick={() => deletePeriod(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete period"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => addPeriod(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
          >
            <Plus className="h-4 w-4" />
            Add Period
          </button>
          <button
            onClick={() => addPeriod(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
          >
            <Coffee className="h-4 w-4" />
            Add Break
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {editablePeriods.length} periods • {editablePeriods.filter((p) => p.is_break).length}{' '}
            breaks
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodsModal;
