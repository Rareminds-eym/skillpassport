import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { Users, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import type { ExamSlot } from '../../../../types/college';

interface Faculty {
  id: string;
  name: string;
  department: string;
  assigned_slots: number;
}

interface InvigilatorAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  examSlots: ExamSlot[];
  availableFaculty: Faculty[];
  onAssign: (slotId: string, facultyId: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (slotId: string, facultyId: string) => Promise<{ success: boolean; error?: string }>;
}

const InvigilatorAssignment: React.FC<InvigilatorAssignmentProps> = ({
  isOpen,
  onClose,
  examSlots,
  availableFaculty,
  onAssign,
  onRemove,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<ExamSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAssign = async (slotId: string, facultyId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await onAssign(slotId, facultyId);

    if (result.success) {
      setSuccess('Invigilator assigned successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to assign invigilator');
    }

    setLoading(false);
  };

  const handleRemove = async (slotId: string, facultyId: string) => {
    if (!confirm('Remove this invigilator from the exam slot?')) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await onRemove(slotId, facultyId);

    if (result.success) {
      setSuccess('Invigilator removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to remove invigilator');
    }

    setLoading(false);
  };

  const getFacultyById = (facultyId: string) => {
    return availableFaculty.find(f => f.id === facultyId);
  };

  const getAvailableFacultyForSlot = (slot: ExamSlot) => {
    // Filter out faculty already assigned to this slot
    return availableFaculty.filter(f => !slot.invigilators?.includes(f.id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invigilator Assignment</h2>
              <p className="text-sm text-gray-600 mt-1">
                Assign faculty to exam slots • {examSlots.length} slots
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Faculty Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-900 mb-2">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Available Faculty</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {availableFaculty.slice(0, 4).map(faculty => (
                <div key={faculty.id} className="text-sm">
                  <p className="font-medium text-blue-900">{faculty.name}</p>
                  <p className="text-blue-700">{faculty.assigned_slots} slots assigned</p>
                </div>
              ))}
              {availableFaculty.length > 4 && (
                <div className="text-sm text-blue-700">
                  +{availableFaculty.length - 4} more
                </div>
              )}
            </div>
          </div>

          {/* Exam Slots */}
          <div className="space-y-4">
            {examSlots.map((slot) => {
              const assignedFaculty = slot.invigilators?.map(id => getFacultyById(id)).filter(Boolean) || [];
              const availableFaculty = getAvailableFacultyForSlot(slot);

              return (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(slot.exam_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {slot.start_time} - {slot.end_time}
                        </div>
                        {slot.room && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {slot.room}
                          </div>
                        )}
                        {slot.batch_section && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Batch {slot.batch_section}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Assigned Invigilators */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Assigned Invigilators ({assignedFaculty.length})
                      </h4>
                      {assignedFaculty.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No invigilators assigned yet</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedFaculty.map((faculty) => (
                            <div
                              key={faculty!.id}
                              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-green-900">{faculty!.name}</p>
                                <p className="text-xs text-green-700">{faculty!.department}</p>
                              </div>
                              <button
                                onClick={() => handleRemove(slot.id, faculty!.id)}
                                disabled={loading}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                title="Remove invigilator"
                              >
                                <UserMinusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available Faculty */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Available Faculty ({availableFaculty.length})
                      </h4>
                      {availableFaculty.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">All faculty assigned</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableFaculty.map((faculty) => (
                            <div
                              key={faculty.id}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                                <p className="text-xs text-gray-600">
                                  {faculty.department} • {faculty.assigned_slots} slots
                                </p>
                              </div>
                              <button
                                onClick={() => handleAssign(slot.id, faculty.id)}
                                disabled={loading}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                title="Assign invigilator"
                              >
                                <UserPlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              onClick={() => alert('Duty roster will be exported as PDF')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Export Duty Roster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvigilatorAssignment;
