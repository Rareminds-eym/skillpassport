import React, { useState, useEffect, useMemo } from "react";
import { ArrowDownTrayIcon, UserPlusIcon, TrashIcon, CheckCircleIcon, XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { CollegeEvent, EventRegistration } from "../types";
import { formatDate, formatDateTime, getEventTypeColor, getEventTypeIcon } from "../helpers";
import { useStudentSearch } from "../hooks/useStudentSearch";

interface Props {
  events: CollegeEvent[];
  registrations: EventRegistration[];
  loading: boolean;
  collegeId: string | null;
  selectedEvent: CollegeEvent | null;
  eventRegCounts: Record<string, number>;
  onSelectEvent: (event: CollegeEvent) => void;
  onAddRegistration: (eventId: string, studentId: string) => void;
  onRemoveRegistration: (regId: string, eventId: string) => void;
  onMarkAttendance: (regId: string, attended: boolean) => void;
  onExportCSV: (event: CollegeEvent) => void;
}

export const RegistrationsTab: React.FC<Props> = ({
  events, registrations, loading, collegeId, selectedEvent, eventRegCounts,
  onSelectEvent, onAddRegistration, onRemoveRegistration, onMarkAttendance, onExportCSV,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get registered student IDs to exclude from search
  const registeredIds = useMemo(() => new Set(registrations.map((r) => r.student_id)), [registrations]);

  // Use the search hook
  const { students, loading: searchLoading, hasSearched, totalCount, searchStudents, clearSearch } = useStudentSearch(collegeId, registeredIds);

  // Trigger search when query changes
  useEffect(() => {
    searchStudents(searchQuery);
  }, [searchQuery, searchStudents]);

  // Clear search when modal closes
  const handleCloseModal = () => {
    setShowAddModal(false);
    setSearchQuery("");
    clearSearch();
  };

  const handleAddStudent = (studentId: string) => {
    if (selectedEvent) {
      onAddRegistration(selectedEvent.id, studentId);
      handleCloseModal();
    }
  };

  return (
    <div className="flex gap-6">
      {/* Events List */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Select Event</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {events.filter((e) => e.status === "published").length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No published events</div>
          ) : (
            events.filter((e) => e.status === "published").map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition ${selectedEvent?.id === event.id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${getEventTypeColor(event.event_type)}`}>{getEventTypeIcon(event.event_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                    <p className="text-xs text-gray-500">{formatDate(event.start_date)}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{eventRegCounts[event.id] || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Registrations Panel */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!selectedEvent ? (
          <div className="p-8 text-center text-gray-500">Select an event to view registrations</div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500">{registrations.length} registrations {selectedEvent.capacity && `/ ${selectedEvent.capacity} capacity`}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onExportCSV(selectedEvent)} disabled={registrations.length === 0} className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm">
                  <ArrowDownTrayIcon className="h-4 w-4" />Export CSV
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <UserPlusIcon className="h-4 w-4" />Add Student
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : registrations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No registrations yet</div>
              ) : (
                registrations.map((reg) => (
                  <div key={reg.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {reg.student?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{reg.student?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{reg.student?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDateTime(reg.registered_at)}</span>
                      <button
                        onClick={() => onMarkAttendance(reg.id, !reg.attended)}
                        className={`p-2 rounded-lg transition ${reg.attended ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                        title={reg.attended ? "Mark as not attended" : "Mark as attended"}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => onRemoveRegistration(reg.id, selectedEvent.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Student Modal - Modern Search */}
      {showAddModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Student to Event</h2>
                <p className="text-sm text-gray-500">{selectedEvent.title}</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-white/50 rounded-lg transition">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="p-4 border-b">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[350px] overflow-y-auto">
              {searchLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-gray-500 text-sm">Searching...</p>
                </div>
              ) : !hasSearched ? (
                <div className="p-8 text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Type to search students</p>
                  <p className="text-gray-400 text-sm mt-1">Search by name or email</p>
                </div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No students found</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleAddStudent(student.id)}
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {student.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{student.name || "Unknown"}</p>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      </div>
                      <UserPlusIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{totalCount}</span> students
              </p>
              <p className="text-xs text-gray-400">
                {hasSearched && students.length > 0 ? `${students.length} found` : "Max 30 results"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
