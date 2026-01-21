/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  PlusCircleIcon,
  TrashIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { UIExam } from '../../../hooks/useExams';
import { WorkflowStage } from '../types';

interface InvigilationStepProps {
  exam: UIExam;
  updateExam: (updates: Partial<UIExam>) => void;
  setActiveStep: (step: WorkflowStage) => void;
  createInvigilationAssignment: (examId: string, assignment: any) => Promise<any>;
  deleteInvigilationAssignment: (examId: string, assignmentId: string) => Promise<void>;
  teachers: any[];
}

const InvigilationStep: React.FC<InvigilationStepProps> = ({
  exam,
  updateExam,
  setActiveStep,
  createInvigilationAssignment,
  deleteInvigilationAssignment,
  teachers,
}) => {
  const [invEntry, setInvEntry] = useState({ timetableEntryId: '', teacherId: '', room: '' });

  // Handler for exam session selection with auto room population
  const handleExamSessionChange = (timetableEntryId: string) => {
    if (timetableEntryId) {
      const selectedTimetableEntry = exam.timetable.find((t) => t.id === timetableEntryId);
      setInvEntry({
        ...invEntry,
        timetableEntryId: timetableEntryId,
        room: selectedTimetableEntry?.room || '',
      });
    } else {
      setInvEntry({ ...invEntry, timetableEntryId: '', room: '' });
    }
  };

  // Check if all exam sessions have at least one invigilator assigned
  const areAllSessionsCovered = () => {
    if (exam.timetable.length === 0) return false;

    return exam.timetable.every((timetableEntry) =>
      exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
    );
  };

  // Get uncovered sessions for display
  const getUncoveredSessions = () => {
    return exam.timetable.filter(
      (timetableEntry) =>
        !exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
    );
  };

  // Get count of unique sessions that have at least one invigilator
  const getCoveredSessionsCount = () => {
    return exam.timetable.filter((timetableEntry) =>
      exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
    ).length;
  };

  // Get coverage percentage based on unique sessions covered
  const getCoveragePercentage = () => {
    if (exam.timetable.length === 0) return 0;
    return Math.round((getCoveredSessionsCount() / exam.timetable.length) * 100);
  };

  const addInvigilation = async () => {
    if (!invEntry.timetableEntryId || !invEntry.teacherId) {
      alert('Please select both an exam session and a teacher.');
      return;
    }

    const ttEntry = exam.timetable.find((t) => t.id === invEntry.timetableEntryId);
    const teacher = teachers.find((t) => t.id === invEntry.teacherId);

    if (!ttEntry || !teacher) {
      alert('Invalid selection. Please try again.');
      return;
    }

    // Check if teacher is already assigned to another exam at the same time
    const teacherConflict = exam.invigilation.some(
      (duty) =>
        duty.teacherId === invEntry.teacherId &&
        duty.date === ttEntry.date &&
        duty.timetableEntryId !== invEntry.timetableEntryId
    );

    if (teacherConflict) {
      alert(
        `⚠️ ${teacher.name} is already assigned to another exam session on this date. Please choose a different teacher or time.`
      );
      return;
    }

    try {
      const createdDuty = await createInvigilationAssignment(exam.id, {
        timetableEntryId: invEntry.timetableEntryId,
        teacherId: invEntry.teacherId,
        teacherName: teacher.name,
        room: invEntry.room || ttEntry.room,
      });

      // Update local exam state immediately to show the new invigilation duty
      if (createdDuty) {
        const updatedExam = {
          ...exam,
          invigilation: [...exam.invigilation, createdDuty],
        };
        updateExam(updatedExam);
      }

      // Reset form
      setInvEntry({ timetableEntryId: '', teacherId: '', room: '' });
    } catch (error: any) {
      console.error('Error adding invigilation assignment:', error);
      alert(
        `❌ Failed to assign invigilation duty: ${error?.message || 'Unknown error'}. Please try again.`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assign Invigilation Duties</h3>
          <p className="text-sm text-gray-500 mt-1">Assign teachers to supervise exam sessions</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-600">
            {getCoveredSessionsCount()} / {exam.timetable.length} sessions covered
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {exam.timetable.length === 0 && (
              <span className="text-amber-600">⚠️ No timetable entries</span>
            )}
            {exam.timetable.length > 0 && getCoveredSessionsCount() === 0 && (
              <span className="text-amber-600">⚠️ No sessions covered</span>
            )}
            {exam.timetable.length > 0 &&
              getCoveredSessionsCount() > 0 &&
              getCoveredSessionsCount() < exam.timetable.length && (
                <span className="text-amber-600">
                  ⚠️ {getUncoveredSessions().length} sessions need coverage
                </span>
              )}
            {exam.timetable.length > 0 && getCoveredSessionsCount() === exam.timetable.length && (
              <span className="text-green-600">✅ All sessions covered</span>
            )}
            {exam.invigilation.length > getCoveredSessionsCount() && (
              <span className="text-blue-600">
                ℹ️ {exam.invigilation.length - getCoveredSessionsCount()} additional duties assigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Exam Sessions</p>
              <p className="text-2xl font-bold text-blue-700">{exam.timetable.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Total Duties</p>
              <p className="text-2xl font-bold text-purple-700">{exam.invigilation.length}</p>
              <p className="text-xs text-purple-600 mt-1">
                {getCoveredSessionsCount()} sessions covered
              </p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-lg p-4 border ${
            areAllSessionsCovered()
              ? 'bg-green-50 border-green-100'
              : 'bg-amber-50 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                areAllSessionsCovered() ? 'bg-green-100' : 'bg-amber-100'
              }`}
            >
              {areAllSessionsCovered() ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  areAllSessionsCovered() ? 'text-green-900' : 'text-amber-900'
                }`}
              >
                Coverage Status
              </p>
              <p
                className={`text-lg font-bold ${
                  areAllSessionsCovered() ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {exam.timetable.length === 0
                  ? 'No Sessions'
                  : areAllSessionsCovered()
                    ? 'Complete'
                    : `${getCoveragePercentage()}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for uncovered sessions */}
      {!areAllSessionsCovered() && getUncoveredSessions().length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-2">
                ⚠️ {getUncoveredSessions().length} exam session(s) need invigilators
              </h4>
              <div className="space-y-1">
                {getUncoveredSessions().map((session) => (
                  <div
                    key={session.id}
                    className="text-sm text-amber-800 bg-amber-100 rounded px-2 py-1"
                  >
                    📅 {session.subjectName} - {new Date(session.date).toLocaleDateString()} (
                    {session.startTime}-{session.endTime}) - {session.room || 'No room'}
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-2">
                💡 Assign at least one teacher to each session to proceed to marks entry
              </p>
            </div>
          </div>
        </div>
      )}

      {exam.status !== 'published' && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <h4 className="text-sm font-medium text-purple-900 mb-3">Assign Invigilator</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Exam Session *
                {exam.timetable.length > 0 && (
                  <span className="text-green-600">
                    ({exam.timetable.length} sessions available)
                  </span>
                )}
              </label>
              <select
                value={invEntry.timetableEntryId}
                onChange={(e) => handleExamSessionChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={exam.timetable.length === 0}
              >
                <option value="">
                  {exam.timetable.length === 0
                    ? 'No timetable sessions available'
                    : 'Select Session'}
                </option>
                {exam.timetable.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    📅 {entry.subjectName} - {new Date(entry.date).toLocaleDateString()} (
                    {entry.startTime}-{entry.endTime}) - {entry.room || 'No room'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Teacher *
                {teachers.length > 0 && (
                  <span className="text-green-600">({teachers.length} teachers available)</span>
                )}
              </label>
              <select
                value={invEntry.teacherId}
                onChange={(e) => setInvEntry({ ...invEntry, teacherId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={teachers.length === 0}
              >
                <option value="">
                  {teachers.length === 0 ? 'No teachers available' : 'Select Teacher'}
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    👨‍🏫 {teacher.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
              <select
                value={invEntry.room}
                onChange={(e) => setInvEntry({ ...invEntry, room: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {(() => {
                  const timetableRooms = [
                    ...new Set(
                      exam.timetable.map((t) => t.room).filter((room) => room && room.trim())
                    ),
                  ];

                  if (timetableRooms.length > 0) {
                    return (
                      <>
                        {timetableRooms.map((roomName) => (
                          <option key={roomName} value={roomName}>
                            🏛️ {roomName}
                          </option>
                        ))}
                      </>
                    );
                  } else {
                    return <option value="">No rooms assigned in timetable yet</option>;
                  }
                })()}
              </select>
            </div>
          </div>
          <button
            onClick={addInvigilation}
            disabled={
              !invEntry.timetableEntryId ||
              !invEntry.teacherId ||
              exam.timetable.length === 0 ||
              teachers.length === 0
            }
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium inline-flex items-center gap-2"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {exam.timetable.length === 0
              ? 'No Sessions Available'
              : teachers.length === 0
                ? 'No Teachers Available'
                : 'Assign Duty'}
          </button>
        </div>
      )}

      {exam.status === 'published' && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <EyeIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Read-Only Mode - Exam is Published</span>
          </div>
        </div>
      )}

      {exam.invigilation.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exam.invigilation.map((duty) => {
                const timetableEntry = exam.timetable.find((t) => t.id === duty.timetableEntryId);
                return (
                  <tr key={duty.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      👨‍🏫 {duty.teacherName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      📚 {timetableEntry?.subjectName || 'Unknown Subject'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      📅 {new Date(duty.date).toLocaleDateString()}
                      <br />
                      🕐 {duty.startTime} - {duty.endTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      🏠 {duty.room || timetableEntry?.room || 'No room assigned'}
                    </td>
                    <td className="px-4 py-3">
                      {exam.status !== 'published' ? (
                        <button
                          onClick={async () => {
                            try {
                              await deleteInvigilationAssignment(exam.id, duty.id);
                              const updatedExam = {
                                ...exam,
                                invigilation: exam.invigilation.filter((i) => i.id !== duty.id),
                              };
                              updateExam(updatedExam);
                            } catch (error: any) {
                              console.error('Error deleting invigilation assignment:', error);
                              alert(
                                `Failed to remove invigilation duty: ${error?.message || 'Unknown error'}`
                              );
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <UserGroupIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700 mb-2">
            No invigilation duties assigned yet
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {exam.timetable.length === 0
              ? 'Create timetable entries first, then assign teachers to supervise exam sessions'
              : `${exam.timetable.length} exam sessions are waiting for invigilator assignment`}
          </p>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => setActiveStep('timetable')}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => {
            if (areAllSessionsCovered()) {
              setActiveStep('marks');
            } else {
              const uncoveredSessions = getUncoveredSessions();
              const sessionsList = uncoveredSessions
                .map(
                  (session) =>
                    `• ${session.subjectName} - ${new Date(session.date).toLocaleDateString()} (${session.startTime}-${session.endTime})`
                )
                .join('\n');

              alert(
                `⚠️ Cannot proceed to marks entry!\n\nThe following exam sessions need at least one invigilator:\n\n${sessionsList}\n\nPlease assign invigilators to all sessions before proceeding.`
              );
            }
          }}
          disabled={!areAllSessionsCovered()}
          className={`px-5 py-2.5 rounded-lg inline-flex items-center gap-2 ${
            areAllSessionsCovered()
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Enter Marks
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InvigilationStep;
