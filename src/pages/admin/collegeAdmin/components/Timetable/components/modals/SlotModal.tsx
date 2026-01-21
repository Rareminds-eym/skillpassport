import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, User, DoorOpen } from 'lucide-react';
import { Faculty, CollegeClass, ScheduleSlot, TimePeriod, SlotFormData } from '../../types';
import { DAYS } from '../../constants';
import { formatDate, getSubjectsForFaculty, getClassName } from '../../utils';

interface ConflictInfo {
  type: 'faculty' | 'room';
  message: string;
  className: string;
  facultyName?: string;
}

interface SlotModalProps {
  isOpen: boolean;
  selectedCell: { day: number; period: TimePeriod } | null;
  weekDates: Date[];
  editingSlot: ScheduleSlot | null;
  slotForm: SlotFormData;
  faculty: Faculty[];
  classes: CollegeClass[];
  slots: ScheduleSlot[];
  selectedClassFilter: string;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onFormChange: (form: SlotFormData) => void;
}

const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  selectedCell,
  weekDates,
  editingSlot,
  slotForm,
  faculty,
  classes,
  slots,
  selectedClassFilter,
  loading,
  onClose,
  onSave,
  onDelete,
  onFormChange,
}) => {
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  // Check for conflicts when form changes
  useEffect(() => {
    if (!isOpen || !selectedCell) {
      setConflicts([]);
      return;
    }

    const newConflicts: ConflictInfo[] = [];
    const currentClassId = editingSlot?.class_id || selectedClassFilter;

    // Check faculty conflict
    if (slotForm.faculty_id) {
      const facultyConflict = slots.find((slot) => {
        // Skip the slot being edited
        if (editingSlot?.id && slot.id === editingSlot.id) return false;

        // Check same faculty, same day, same period, different class
        return (
          slot.educator_id === slotForm.faculty_id &&
          slot.day_of_week === selectedCell.day + 1 &&
          slot.period_number === selectedCell.period.period_number &&
          slot.class_id !== currentClassId &&
          // Check recurring/date overlap
          (slotForm.is_recurring ||
            slot.is_recurring ||
            slot.schedule_date === weekDates[selectedCell.day].toISOString().split('T')[0])
        );
      });

      if (facultyConflict) {
        const conflictClass = classes.find((c) => c.id === facultyConflict.class_id);
        const conflictFaculty = faculty.find((f) => f.id === facultyConflict.educator_id);
        newConflicts.push({
          type: 'faculty',
          message: `${conflictFaculty?.first_name} ${conflictFaculty?.last_name} is already teaching`,
          className: conflictClass
            ? `${conflictClass.name} (${conflictClass.grade}-${conflictClass.section})`
            : 'another class',
          facultyName: `${conflictFaculty?.first_name} ${conflictFaculty?.last_name}`,
        });
      }
    }

    // Check room conflict
    if (slotForm.room_number && slotForm.room_number.trim()) {
      const roomConflict = slots.find((slot) => {
        // Skip the slot being edited
        if (editingSlot?.id && slot.id === editingSlot.id) return false;

        // Check same room, same day, same period
        return (
          slot.room_number?.toLowerCase() === slotForm.room_number.toLowerCase() &&
          slot.day_of_week === selectedCell.day + 1 &&
          slot.period_number === selectedCell.period.period_number &&
          slot.class_id !== currentClassId &&
          (slotForm.is_recurring ||
            slot.is_recurring ||
            slot.schedule_date === weekDates[selectedCell.day].toISOString().split('T')[0])
        );
      });

      if (roomConflict) {
        const conflictClass = classes.find((c) => c.id === roomConflict.class_id);
        const conflictFaculty = faculty.find((f) => f.id === roomConflict.educator_id);
        newConflicts.push({
          type: 'room',
          message: `Room ${slotForm.room_number} is already booked by`,
          className: conflictClass
            ? `${conflictClass.name} (${conflictClass.grade}-${conflictClass.section})`
            : 'another class',
          facultyName: conflictFaculty
            ? `${conflictFaculty.first_name} ${conflictFaculty.last_name}`
            : undefined,
        });
      }
    }

    setConflicts(newConflicts);
  }, [
    isOpen,
    selectedCell,
    slotForm,
    slots,
    editingSlot,
    selectedClassFilter,
    classes,
    faculty,
    weekDates,
  ]);

  if (!isOpen || !selectedCell) return null;

  const subjects = getSubjectsForFaculty(slotForm.faculty_id, faculty);
  const hasConflicts = conflicts.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {editingSlot ? 'Edit Schedule' : 'Add Schedule'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="bg-indigo-50 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-indigo-900">
            {DAYS[selectedCell.day]} • {selectedCell.period.period_name}
          </div>
          <div className="text-xs text-indigo-700">
            {formatDate(weekDates[selectedCell.day])} | {selectedCell.period.start_time} -{' '}
            {selectedCell.period.end_time}
          </div>
          {(selectedClassFilter || editingSlot?.class_id) && (
            <div className="text-xs text-indigo-600 mt-1 font-medium">
              Class:{' '}
              {classes.find((c) => c.id === (editingSlot?.class_id || selectedClassFilter))?.name} (
              {getClassName(editingSlot?.class_id || selectedClassFilter, classes)})
            </div>
          )}
        </div>

        {/* Conflict Warnings */}
        {hasConflicts && (
          <div className="mb-4 space-y-2">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 border ${
                  conflict.type === 'faculty'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      conflict.type === 'faculty' ? 'text-red-500' : 'text-amber-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-sm font-medium ${
                        conflict.type === 'faculty' ? 'text-red-800' : 'text-amber-800'
                      }`}
                    >
                      {conflict.type === 'faculty' ? 'Faculty Conflict' : 'Room Conflict'}
                    </div>
                    <div
                      className={`text-sm ${
                        conflict.type === 'faculty' ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {conflict.message}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {conflict.type === 'faculty' ? (
                        <User className="h-3.5 w-3.5 text-gray-500" />
                      ) : (
                        <DoorOpen className="h-3.5 w-3.5 text-gray-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          conflict.type === 'faculty' ? 'text-red-900' : 'text-amber-900'
                        }`}
                      >
                        {conflict.className}
                        {conflict.type === 'room' && conflict.facultyName && (
                          <span className="font-normal"> with {conflict.facultyName}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!selectedClassFilter && !editingSlot && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              Please select a Class from the sidebar filter before adding a schedule.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Faculty <span className="text-red-500">*</span>
            </label>
            <select
              value={slotForm.faculty_id}
              onChange={(e) =>
                onFormChange({ ...slotForm, faculty_id: e.target.value, subject_name: '' })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                conflicts.some((c) => c.type === 'faculty')
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select Faculty</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.first_name} {f.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={slotForm.subject_name}
              onChange={(e) => onFormChange({ ...slotForm, subject_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              disabled={!slotForm.faculty_id}
            >
              <option value="">
                {slotForm.faculty_id
                  ? subjects.length > 0
                    ? 'Select Subject'
                    : 'No subjects assigned'
                  : 'Select Faculty First'}
              </option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {slotForm.faculty_id && subjects.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No subjects assigned to this faculty.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              value={slotForm.room_number}
              onChange={(e) => onFormChange({ ...slotForm, room_number: e.target.value })}
              placeholder="e.g., Lab 101"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                conflicts.some((c) => c.type === 'room')
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-gray-300'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={slotForm.is_recurring}
              onChange={(e) => onFormChange({ ...slotForm, is_recurring: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700">
              Repeat every week
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {editingSlot && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
              hasConflicts
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } disabled:bg-gray-400`}
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : hasConflicts ? 'Save Anyway' : 'Save'}
          </button>
        </div>

        {hasConflicts && (
          <p className="text-xs text-center text-gray-500 mt-3">
            ⚠️ Saving with conflicts may cause scheduling issues
          </p>
        )}
      </div>
    </div>
  );
};

export default SlotModal;
