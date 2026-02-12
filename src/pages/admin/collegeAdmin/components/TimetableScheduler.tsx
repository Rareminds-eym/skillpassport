import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Calendar, Clock, MapPin, Users, AlertCircle } from 'lucide-react';
import type { ExamSlot, Conflict } from '../../../../types/college';

interface TimetableSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onSchedule: (slots: Partial<ExamSlot>[]) => Promise<{ success: boolean; error?: string; conflicts?: Conflict[] }>;
  existingSlots?: ExamSlot[];
}

const TimetableScheduler: React.FC<TimetableSchedulerProps> = ({
  isOpen,
  onClose,
  assessmentId,
  onSchedule,
  existingSlots = [],
}) => {
  const [slots, setSlots] = useState<Partial<ExamSlot>[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingSlots.length > 0) {
      setSlots(existingSlots);
    } else {
      // Initialize with one empty slot
      setSlots([{
        assessment_id: assessmentId,
        exam_date: '',
        start_time: '09:00',
        end_time: '12:00',
        room: '',
        batch_section: '',
        invigilators: [],
      }]);
    }
  }, [existingSlots, assessmentId]);

  const addSlot = () => {
    setSlots([...slots, {
      assessment_id: assessmentId,
      exam_date: '',
      start_time: '09:00',
      end_time: '12:00',
      room: '',
      batch_section: '',
      invigilators: [],
    }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof ExamSlot, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflicts([]);

    // Validate all slots
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.exam_date || !slot.start_time || !slot.end_time) {
        setError(`Slot ${i + 1}: Date and time are required`);
        setLoading(false);
        return;
      }
    }

    const result = await onSchedule(slots);

    if (result.success) {
      onClose();
    } else {
      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        setError('Conflicts detected! Please resolve them before scheduling.');
      } else {
        setError(result.error || 'Failed to schedule exam');
      }
    }

    setLoading(false);
  };

  const autoGenerateSlots = () => {
    // Simple auto-generation logic
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 7); // Start from next week
    
    const generatedSlots: Partial<ExamSlot>[] = [
      {
        assessment_id: assessmentId,
        exam_date: baseDate.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '12:00',
        room: 'Room 101',
        batch_section: 'A',
        invigilators: [],
      },
      {
        assessment_id: assessmentId,
        exam_date: baseDate.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '12:00',
        room: 'Room 102',
        batch_section: 'B',
        invigilators: [],
      },
    ];

    setSlots(generatedSlots);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Schedule Exam Timetable</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">Conflicts Detected</h3>
                  <ul className="mt-2 space-y-1">
                    {conflicts.map((conflict, idx) => (
                      <li key={idx} className="text-sm text-yellow-700">
                        • {conflict.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Exam Slots</h3>
            <button
              type="button"
              onClick={autoGenerateSlots}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Auto-Generate
            </button>
          </div>

          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900">Slot {index + 1}</h4>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Exam Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={slot.exam_date || ''}
                      onChange={(e) => updateSlot(index, 'exam_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Users className="inline h-4 w-4 mr-1" />
                      Batch/Section
                    </label>
                    <input
                      type="text"
                      value={slot.batch_section || ''}
                      onChange={(e) => updateSlot(index, 'batch_section', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., A, B, All"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={slot.start_time || ''}
                      onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="inline h-4 w-4 mr-1" />
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={slot.end_time || ''}
                      onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Room/Venue
                    </label>
                    <input
                      type="text"
                      value={slot.room || ''}
                      onChange={(e) => updateSlot(index, 'room', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Room 101"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSlot}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
          >
            + Add Another Slot
          </button>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimetableScheduler;
