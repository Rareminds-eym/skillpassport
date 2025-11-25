import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, CheckCircle, Plus, Trash2, Shield, Eye } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { useUserRole } from "../../../../hooks/useUserRole";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
}

interface TimetableSlot {
  id?: string;
  teacher_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_number: string;
}

interface Conflict {
  conflict_type: string;
  teacher_id: string;
  conflict_details: any;
}

const TimetableAllocationPage: React.FC = () => {
  const { canEditTimetable, canViewTimetable, roleLabel, loading: roleLoading } = useUserRole();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [timetableId, setTimetableId] = useState<string>("");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    loadTeachers();
    loadOrCreateTimetable();
  }, []);

  useEffect(() => {
    if (selectedTeacher && timetableId) {
      loadTeacherSlots();
      loadTeacherWorkload();
    }
  }, [selectedTeacher, timetableId]);

  const loadTeachers = async () => {
    const { data } = await supabase
      .from("school_educators")
      .select("id, teacher_id, email")
      .eq("onboarding_status", "active")
      .order("email");
    
    if (data) setTeachers(data);
  };

  const loadOrCreateTimetable = async () => {
    // Get or create current academic year timetable
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from("timetables")
      .select("id")
      .eq("academic_year", `${currentYear}-${currentYear + 1}`)
      .eq("status", "draft")
      .single();

    if (existing) {
      setTimetableId(existing.id);
    } else {
      const { data: newTimetable } = await supabase
        .from("timetables")
        .insert({
          academic_year: `${currentYear}-${currentYear + 1}`,
          term: "Term 1",
          start_date: `${currentYear}-06-01`,
          end_date: `${currentYear}-12-31`,
          status: "draft",
        })
        .select("id")
        .single();
      
      if (newTimetable) setTimetableId(newTimetable.id);
    }
  };

  const loadTeacherSlots = async () => {
    const { data } = await supabase
      .from("timetable_slots")
      .select("*")
      .eq("timetable_id", timetableId)
      .eq("teacher_id", selectedTeacher)
      .order("day_of_week")
      .order("period_number");
    
    if (data) setSlots(data);
  };

  const loadTeacherWorkload = async () => {
    const { data } = await supabase.rpc("calculate_teacher_workload", {
      p_teacher_id: selectedTeacher,
      p_timetable_id: timetableId,
    });
    
    if (data && data.length > 0) setWorkload(data[0]);

    // Load conflicts
    const { data: conflictData } = await supabase
      .from("timetable_conflicts")
      .select("*")
      .eq("timetable_id", timetableId)
      .eq("teacher_id", selectedTeacher)
      .eq("resolved", false);
    
    if (conflictData) setConflicts(conflictData);
  };

  const addSlot = async (newSlot: TimetableSlot) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("timetable_slots").insert({
        ...newSlot,
        timetable_id: timetableId,
      });

      if (error) throw error;
      
      await loadTeacherSlots();
      await loadTeacherWorkload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;
      
      await loadTeacherSlots();
      await loadTeacherWorkload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [newSlot, setNewSlot] = useState<TimetableSlot>({
    teacher_id: "",
    day_of_week: 1,
    period_number: 1,
    start_time: "09:00",
    end_time: "10:00",
    class_name: "",
    subject_name: "",
    room_number: "",
  });

  const handleAddSlot = () => {
    if (!selectedTeacher || !newSlot.class_name || !newSlot.subject_name) {
      alert("Please fill all required fields");
      return;
    }

    addSlot({ ...newSlot, teacher_id: selectedTeacher });
    setNewSlot({
      teacher_id: "",
      day_of_week: 1,
      period_number: 1,
      start_time: "09:00",
      end_time: "10:00",
      class_name: "",
      subject_name: "",
      room_number: "",
    });
  };

  const canEdit = canEditTimetable();
  const canView = canViewTimetable();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h3>
          <p className="text-red-700">
            You don't have permission to view timetables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Timetable Allocation
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage teacher schedules with automatic conflict detection
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" />
              <span className="text-sm text-indigo-600 font-medium">
                Your Role: {roleLabel} 
                {canEdit ? ' (Can Edit)' : ' (View Only)'}
              </span>
            </div>
          </div>
          {!canEdit && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Eye className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">View Only Mode</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">

      {/* Teacher Selection */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select a teacher --</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.teacher_id} - {teacher.first_name} {teacher.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedTeacher && (
        <>
          {/* Workload Summary */}
          {workload && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-xl border-2 ${
                  workload.exceeds_limit
                    ? "bg-red-50 border-red-300"
                    : "bg-green-50 border-green-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Periods/Week</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workload.total_periods}/30
                    </p>
                  </div>
                  {workload.exceeds_limit ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 ${
                  workload.consecutive_violation
                    ? "bg-red-50 border-red-300"
                    : "bg-green-50 border-green-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Max Consecutive Classes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workload.max_consecutive}/3
                    </p>
                  </div>
                  {workload.consecutive_violation ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conflicts Detected</p>
                    <p className="text-2xl font-bold text-gray-900">{conflicts.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Timetable Conflicts
              </h3>
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                    <p className="font-medium text-gray-900">
                      {conflict.conflict_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {JSON.stringify(conflict.conflict_details)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Slot */}
          {canEdit && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Time Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {days.map((day, index) => (
                    <option key={index} value={index + 1}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select
                  value={newSlot.period_number}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, period_number: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      Period {period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <input
                  type="text"
                  value={newSlot.class_name}
                  onChange={(e) => setNewSlot({ ...newSlot, class_name: e.target.value })}
                  placeholder="e.g., 10-A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={newSlot.subject_name}
                  onChange={(e) => setNewSlot({ ...newSlot, subject_name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
                <input
                  type="text"
                  value={newSlot.room_number}
                  onChange={(e) => setNewSlot({ ...newSlot, room_number: e.target.value })}
                  placeholder="e.g., 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddSlot}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Slot
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Timetable Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {days[slot.day_of_week - 1]}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{slot.period_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{slot.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{slot.subject_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{slot.room_number}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <button
                          onClick={() => slot.id && deleteSlot(slot.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default TimetableAllocationPage;
