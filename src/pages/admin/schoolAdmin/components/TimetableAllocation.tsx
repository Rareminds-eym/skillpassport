import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    Eye,
    Plus,
    Shield,
    Trash2,
    X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useUserRole } from "../../../../hooks/useUserRole";
import { supabase } from "../../../../lib/supabaseClient";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
}

interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  section: string | null;
  academic_year: string;
}

interface TimetableSlot {
  id?: string;
  educator_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_id: string;
  class_name?: string;
  subject_name: string;
  room_number: string;
  teacher_name?: string;
}

interface Conflict {
  conflict_type: string;
  teacher_id: string;
  conflict_details: any;
}

// Period time mappings
const periodTimes: { [key: number]: { start: string; end: string } } = {
  1: { start: "09:00", end: "10:00" },
  2: { start: "10:00", end: "11:00" },
  3: { start: "11:00", end: "12:00" },
  4: { start: "12:00", end: "13:00" },
  5: { start: "13:00", end: "14:00" },
  6: { start: "14:00", end: "15:00" },
  7: { start: "15:00", end: "16:00" },
  8: { start: "16:00", end: "17:00" },
  9: { start: "17:00", end: "18:00" },
  10: { start: "18:00", end: "19:00" },
};

const TimetableAllocationPage: React.FC = () => {
  const {
    canEditTimetable,
    canViewTimetable,
    roleLabel,
    loading: roleLoading,
  } = useUserRole();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [timetableId, setTimetableId] = useState<string>("");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [workload, setWorkload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string>("");

  // For adding slot inline
  const [addingSlot, setAddingSlot] = useState<{
    day: number;
    period: number;
  } | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newRoom, setNewRoom] = useState("");

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    loadSchoolId();
    loadOrCreateTimetable();
  }, []);

  useEffect(() => {
    if (schoolId) {
      loadClasses();
      loadTeachers();
    }
  }, [schoolId]);

  useEffect(() => {
    if (timetableId && selectedTeacher && selectedClass) {
      loadSlots();
      loadTeacherWorkload();
    } else {
      setSlots([]);
      setWorkload(null);
      setConflicts([]);
    }
  }, [selectedTeacher, selectedClass, timetableId]);

  const loadSchoolId = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role === "school_admin") {
        const { data: schoolData } = await supabase
          .from("organizations")
          .select("id")
          .eq("organization_type", "school")
          .eq("admin_id", user.id)
          .maybeSingle();

        if (schoolData?.id) {
          setSchoolId(schoolData.id);
          return;
        }
      }

      if (userData?.role === "school_educator") {
        const { data: educatorData } = await supabase
          .from("school_educators")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (educatorData?.school_id) {
          setSchoolId(educatorData.school_id);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching school ID:", error);
    }
  };

  const loadTeachers = async () => {
    if (!schoolId) return;

    const { data } = await supabase
      .from("school_educators")
      .select("id, teacher_id, first_name, last_name")
      .eq("school_id", schoolId)
      .eq("account_status", "active")
      .order("first_name");

    if (data) setTeachers(data);
  };

  const loadClasses = async () => {
    if (!schoolId) return;

    const { data } = await supabase
      .from("school_classes")
      .select("id, name, grade, section, academic_year")
      .eq("school_id", schoolId)
      .eq("account_status", "active")
      .order("grade")
      .order("section");

    if (data) setClasses(data);
  };

  const loadOrCreateTimetable = async () => {
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

  const loadSlots = async () => {
    // Load slots for selected teacher AND class combination
    const { data } = await supabase
      .from("timetable_slots")
      .select(
        `
        *,
        school_classes:class_id (
          id,
          name,
          grade,
          section
        ),
        school_educators:educator_id (
          id,
          teacher_id,
          first_name,
          last_name
        )
      `
      )
      .eq("timetable_id", timetableId)
      .eq("educator_id", selectedTeacher)
      .eq("class_id", selectedClass)
      .order("day_of_week")
      .order("period_number");

    if (data) {
      const mappedSlots = data.map((slot: any) => ({
        ...slot,
        class_name: slot.school_classes
          ? `${slot.school_classes.grade}${slot.school_classes.section ? `-${slot.school_classes.section}` : ""}`
          : "N/A",
        teacher_name: slot.school_educators
          ? `${slot.school_educators.first_name} ${slot.school_educators.last_name}`
          : "N/A",
      }));
      setSlots(mappedSlots);
    }
  };

  const loadTeacherWorkload = async () => {
    if (!selectedTeacher) return;

    const { data } = await supabase.rpc("calculate_teacher_workload", {
      p_teacher_id: selectedTeacher,
      p_timetable_id: timetableId,
    });

    if (data && data.length > 0) setWorkload(data[0]);

    const { data: conflictData } = await supabase
      .from("timetable_conflicts")
      .select("*")
      .eq("timetable_id", timetableId)
      .eq("teacher_id", selectedTeacher)
      .eq("resolved", false);

    if (conflictData) setConflicts(conflictData);
  };

  const getSlotForCell = (dayIndex: number, periodNum: number) => {
    return slots.find(
      (s) => s.day_of_week === dayIndex + 1 && s.period_number === periodNum
    );
  };

  const handleAddSlotClick = (dayIndex: number, periodNum: number) => {
    if (!selectedTeacher || !selectedClass) {
      alert("Please select both Teacher and Class first");
      return;
    }
    setAddingSlot({ day: dayIndex + 1, period: periodNum });
    setNewSubject("");
    setNewRoom("");
  };

  const handleSaveSlot = async () => {
    if (!addingSlot || !newSubject.trim()) {
      alert("Please enter a subject name");
      return;
    }

    setLoading(true);
    try {
      const times = periodTimes[addingSlot.period];
      const { error } = await supabase.from("timetable_slots").insert({
        timetable_id: timetableId,
        educator_id: selectedTeacher,
        class_id: selectedClass,
        day_of_week: addingSlot.day,
        period_number: addingSlot.period,
        start_time: times.start,
        end_time: times.end,
        subject_name: newSubject.trim(),
        room_number: newRoom.trim(),
      });

      if (error) throw error;

      await loadSlots();
      await loadTeacherWorkload();
      setAddingSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      await loadSlots();
      await loadTeacherWorkload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = canEditTimetable();
  const canView = canViewTimetable();

  // Get selected teacher and class names for display
  const selectedTeacherObj = teachers.find((t) => t.id === selectedTeacher);
  const selectedClassObj = classes.find((c) => c.id === selectedClass);

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
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Access Denied
          </h3>
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
                {canEdit ? " (Can Edit)" : " (View Only)"}
              </span>
            </div>
          </div>
          {!canEdit && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Eye className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                View Only Mode
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Teacher Load Section - Select Teacher and Class */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Teacher Load
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Teacher *
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select a teacher --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.teacher_id} - {teacher.first_name}{" "}
                    {teacher.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes in School *
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select a class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.grade}
                    {cls.section ? `-${cls.section}` : ""} ({cls.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show selected info */}
          {selectedTeacher && selectedClass && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-800">
                <span className="font-medium">Viewing timetable for:</span>{" "}
                {selectedTeacherObj?.first_name} {selectedTeacherObj?.last_name}{" "}
                → {selectedClassObj?.grade}
                {selectedClassObj?.section
                  ? `-${selectedClassObj.section}`
                  : ""}{" "}
                ({selectedClassObj?.name})
              </p>
            </div>
          )}
        </div>

        {/* Workload Summary */}
        {selectedTeacher && workload && (
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
                  <p className="text-sm text-gray-600">Max Consecutive</p>
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
                  <p className="text-sm text-gray-600">Conflicts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {conflicts.length}
                  </p>
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
                <div
                  key={index}
                  className="bg-white p-3 rounded-lg border border-red-200"
                >
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

        {/* Timetable Grid */}
        {selectedTeacher && selectedClass ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-r border-gray-200 min-w-[120px]">
                    Period / Day
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b border-r border-gray-200 min-w-[130px]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b border-r border-gray-200 bg-gray-50">
                      <div className="font-medium text-gray-900">
                        Period {period}
                      </div>
                      <div className="text-xs text-gray-500">
                        {periodTimes[period].start}-{periodTimes[period].end}
                      </div>
                    </td>
                    {days.map((day, dayIndex) => {
                      const slot = getSlotForCell(dayIndex, period);
                      const isAdding =
                        addingSlot?.day === dayIndex + 1 &&
                        addingSlot?.period === period;

                      return (
                        <td
                          key={day}
                          className="px-2 py-2 border-b border-r border-gray-200 align-top"
                        >
                          {slot ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 relative group">
                              <div className="font-medium text-indigo-900 text-sm">
                                {slot.subject_name}
                              </div>
                              {slot.room_number && (
                                <div className="text-xs text-indigo-600">
                                  Room: {slot.room_number}
                                </div>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => slot.id && deleteSlot(slot.id)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ) : isAdding ? (
                            <div className="bg-green-50 border border-green-300 rounded-lg p-2 space-y-2">
                              <input
                                type="text"
                                placeholder="Subject *"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="Room"
                                value={newRoom}
                                onChange={(e) => setNewRoom(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={handleSaveSlot}
                                  disabled={loading}
                                  className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setAddingSlot(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : canEdit ? (
                            <button
                              onClick={() =>
                                handleAddSlotClick(dayIndex, period)
                              }
                              className="w-full py-2 text-green-600 hover:bg-green-50 rounded-lg transition flex items-center justify-center gap-1 text-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Add Slot
                            </button>
                          ) : (
                            <div className="text-center text-gray-400 text-xs py-2">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Select Teacher and Class
            </h3>
            <p className="text-gray-500">
              Please select both a teacher and a class above to view and manage
              the timetable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableAllocationPage;
