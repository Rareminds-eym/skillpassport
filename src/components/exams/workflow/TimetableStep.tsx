/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  PlusCircleIcon,
  TrashIcon,
  CalendarIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { UIExam } from '../../../hooks/useExams';
import { WorkflowStage } from '../types';

interface TimetableStepProps {
  exam: UIExam;
  updateExam: (updates: Partial<UIExam>) => void;
  setActiveStep: (step: WorkflowStage) => void;
  createTimetableEntry: (examId: string, entry: any) => Promise<any>;
  deleteTimetableEntry: (examId: string, entryId: string) => Promise<void>;
  allSchoolRooms: any[];
  rooms: any[];
  getClassRoom: (grade: string, section?: string) => Promise<string | null>;
}

const TimetableStep: React.FC<TimetableStepProps> = ({
  exam,
  updateExam,
  setActiveStep,
  createTimetableEntry,
  deleteTimetableEntry,
  allSchoolRooms,
  rooms,
  getClassRoom,
}) => {
  const [ttEntry, setTtEntry] = useState({ subjectId: "", date: "", startTime: "", endTime: "", room: "" });
  const [manualRoom, setManualRoom] = useState("");
  const [classRoom, setClassRoom] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Load class room when component loads
  useEffect(() => {
    const loadClassRoom = async () => {
      if (exam.grade) {
        try {
          const room = await getClassRoom(exam.grade, exam.section);
          setClassRoom(room);
        } catch (error) {
          console.error('Error loading class room:', error);
        }
      }
    };

    loadClassRoom();
  }, [exam.grade, exam.section, getClassRoom]);

  // Helper function to get available subjects (not yet scheduled)
  const getAvailableSubjects = () => {
    return exam.subjects.filter(subject => 
      !exam.timetable.some(tt => tt.subjectName === subject.name)
    );
  };

  // Check for conflicts
  const checkConflicts = (entry: typeof ttEntry) => {
    const conflictList: string[] = [];
    
    exam.timetable.forEach(existing => {
      // Check if same date and overlapping time
      if (existing.date === entry.date) {
        const existingStart = existing.startTime;
        const existingEnd = existing.endTime;
        const newStart = entry.startTime;
        const newEnd = entry.endTime;
        
        // Check time overlap
        if ((newStart >= existingStart && newStart < existingEnd) ||
            (newEnd > existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)) {
          
          // Room conflict
          if (entry.room && existing.room === entry.room) {
            conflictList.push(`⚠️ Room conflict: ${entry.room} is already booked for ${existing.subjectName} at ${existingStart}-${existingEnd}`);
          }
          
          // Class conflict (same exam, same time)
          conflictList.push(`⚠️ Class conflict: Students already have ${existing.subjectName} exam at ${existingStart}-${existingEnd}`);
        }
      }
    });

    return conflictList;
  };

  const addTimetable = async () => {
    if (!ttEntry.subjectId || !ttEntry.date || !ttEntry.startTime || !ttEntry.endTime) {
      alert('Please fill in all required fields (Subject, Date, Start Time, End Time).');
      return;
    }

    // Validate date range - ensure exam date is within the assessment period
    if (ttEntry.date < exam.startDate || ttEntry.date > exam.endDate) {
      alert(`Exam date must be between ${new Date(exam.startDate).toLocaleDateString()} and ${new Date(exam.endDate).toLocaleDateString()}.`);
      return;
    }

    // Validate time range
    const startTime = ttEntry.startTime;
    const endTime = ttEntry.endTime;
    
    if (startTime >= endTime) {
      alert('End time must be after start time. Please check your time entries.');
      return;
    }

    // Handle manual room entry
    let finalRoom = ttEntry.room;
    if (ttEntry.room === "__MANUAL__") {
      if (!manualRoom.trim()) {
        alert('Please enter a room name or select from the dropdown.');
        return;
      }
      finalRoom = manualRoom.trim();
    }

    // Create entry with final room value for conflict checking
    const entryForConflictCheck = { ...ttEntry, room: finalRoom };
    
    // Check for conflicts
    const detectedConflicts = checkConflicts(entryForConflictCheck);
    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts);
      // Still allow adding but show warning
    } else {
      setConflicts([]);
    }

    try {
      const subject = exam.subjects.find(s => s.id === ttEntry.subjectId);
      const newEntry = {
        subjectId: ttEntry.subjectId,
        subjectName: subject?.name || "",
        date: ttEntry.date,
        startTime: startTime,
        endTime: endTime,
        room: finalRoom,
      };
      
      const createdEntry = await createTimetableEntry(exam.id, newEntry);
      
      // Update local exam state immediately to show the new timetable entry
      if (createdEntry) {
        const updatedExam = {
          ...exam,
          timetable: [...exam.timetable, createdEntry]
        };
        updateExam(updatedExam);
      }
      
      // Reset form
      setTtEntry({ subjectId: "", date: "", startTime: "", endTime: "", room: "" });
      setManualRoom("");
    } catch (error: any) {
      console.error('Error adding timetable entry:', error);
      alert(`❌ Failed to add timetable entry: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Create Exam Timetable</h3>
          <p className="text-sm text-gray-500 mt-1">Schedule exam sessions for each subject</p>
        </div>
        <span className="text-sm font-medium text-gray-600">{exam.timetable.length} / {exam.subjects.length} scheduled</span>
      </div>

      {/* Conflict Warnings */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Scheduling Conflicts Detected</h4>
              <ul className="space-y-1">
                {conflicts.map((conflict, idx) => (
                  <li key={idx} className="text-sm text-amber-800">{conflict}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-700 mt-2">Entry was added but please review and resolve conflicts.</p>
            </div>
          </div>
        </div>
      )}

      {exam.status !== "published" && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Add Timetable Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
              <select value={ttEntry.subjectId} onChange={(e) => setTtEntry({ ...ttEntry, subjectId: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select Subject</option>
                {getAvailableSubjects().map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {getAvailableSubjects().length === 0 && (
                <p className="text-xs text-amber-600 mt-1">✅ All subjects have been scheduled</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input 
                type="date" 
                value={ttEntry.date} 
                onChange={(e) => setTtEntry({ ...ttEntry, date: e.target.value })} 
                min={exam.startDate}
                max={exam.endDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time *</label>
              <input 
                type="time" 
                value={ttEntry.startTime} 
                onChange={(e) => setTtEntry({ ...ttEntry, startTime: e.target.value })} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                step="300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time *</label>
              <input 
                type="time" 
                value={ttEntry.endTime} 
                onChange={(e) => setTtEntry({ ...ttEntry, endTime: e.target.value })} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                step="300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
              <select 
                value={ttEntry.room === "__MANUAL__" ? "__MANUAL__" : ttEntry.room} 
                onChange={(e) => {
                  if (e.target.value === "__MANUAL__") {
                    setTtEntry({ ...ttEntry, room: "__MANUAL__" });
                    setManualRoom("");
                  } else {
                    setTtEntry({ ...ttEntry, room: e.target.value });
                    setManualRoom("");
                  }
                }} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select Room</option>
                
                {/* Class default room option */}
                {classRoom && (
                  <option value={classRoom}>
                    📍 {classRoom} (Class Default)
                  </option>
                )}
                
                {/* All school rooms */}
                {allSchoolRooms && allSchoolRooms.length > 0 && (
                  <>
                    {allSchoolRooms.filter(room => room.type === 'class_room').map(room => (
                      <option key={room.id} value={room.name}>
                        🏫 {room.name}
                      </option>
                    ))}
                    {allSchoolRooms.filter(room => room.type === 'exam_room').map(room => (
                      <option key={room.id} value={room.name}>
                        📝 {room.name}
                      </option>
                    ))}
                  </>
                )}
                
                <option value="__MANUAL__">✏️ Enter Room Manually</option>
              </select>
              
              {ttEntry.room === "__MANUAL__" && (
                <input
                  type="text"
                  value={manualRoom}
                  placeholder="Enter room name..."
                  className="w-full mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  onChange={(e) => setManualRoom(e.target.value)}
                />
              )}
            </div>
          </div>
          <button 
            onClick={addTimetable} 
            disabled={getAvailableSubjects().length === 0}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium inline-flex items-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {getAvailableSubjects().length === 0 ? 'All Subjects Scheduled' : 'Add Entry'}
          </button>
        </div>
      )}

      {exam.status === "published" && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <EyeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Read-Only Mode - Exam is Published</span>
          </div>
        </div>
      )}

      {exam.timetable.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exam.timetable.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.subjectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.startTime} - {entry.endTime}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.room || "-"}</td>
                  <td className="px-4 py-3">
                    {exam.status !== "published" ? (
                      <button 
                        onClick={async () => {
                          try {
                            await deleteTimetableEntry(exam.id, entry.id);
                            const updatedExam = {
                              ...exam,
                              timetable: exam.timetable.filter(t => t.id !== entry.id)
                            };
                            updateExam(updatedExam);
                          } catch (error: any) {
                            console.error('Error deleting timetable entry:', error);
                            alert(`Failed to delete timetable entry: ${error?.message || 'Unknown error'}`);
                          }
                        }} 
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No timetable entries yet. Add entries above.</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button onClick={() => setActiveStep("invigilation")} disabled={exam.timetable.length === 0} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2">
          Next: Assign Invigilation
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TimetableStep;