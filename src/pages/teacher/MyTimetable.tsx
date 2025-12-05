import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, BookOpen, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

interface TimetableSlot {
  slot_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_number: string;
  lesson_plan_id: string | null;
  lesson_plan_title: string | null;
  lesson_plan_status: string | null;
}

const MyTimetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);

  useEffect(() => {
    loadTimetable();
    checkConflicts();
  }, []);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      // Get current educator
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { data: educatorData, error: educatorError } = await supabase
        .from("school_educators")
        .select("id, user_id")
        .eq("user_id", userData.user.id)
        .single();

      if (educatorError || !educatorData) {
        console.error("Educator lookup error:", educatorError);
        throw new Error("Educator profile not found");
      }

      // Get timetable slots assigned to this educator
      const { data, error } = await supabase
        .from("timetable_slots")
        .select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          room_number,
          subject_name,
          classes:class_id (
            id,
            name
          )
        `)
        .eq("educator_id", educatorData.id)
        .order("day_of_week")
        .order("period_number");

      if (error) {
        console.error("Timetable fetch error:", error);
        throw error;
      }

      // Transform data to match expected format
      const transformedData = (data || []).map((slot: any) => ({
        slot_id: slot.id,
        day_of_week: slot.day_of_week,
        period_number: slot.period_number,
        start_time: slot.start_time,
        end_time: slot.end_time,
        class_name: slot.classes?.name || "N/A",
        subject_name: slot.subject_name || "N/A",
        room_number: slot.room_number || "N/A",
        lesson_plan_id: null,
        lesson_plan_title: null,
        lesson_plan_status: null,
      }));

      setTimetable(transformedData);
    } catch (error: any) {
      console.error("Error loading timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("id")
        .eq("email", userData?.user?.email)
        .single();

      if (!teacherData) return;

      // Get current timetable
      const { data: timetableData } = await supabase
        .from("timetables")
        .select("id")
        .eq("status", "published")
        .single();

      if (!timetableData) return;

      // Check for conflicts
      const { data, error } = await supabase.rpc("check_teacher_timetable_conflicts", {
        p_teacher_id: teacherData.id,
        p_timetable_id: timetableData.id,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setConflicts(data[0]);
      }
    } catch (error: any) {
      console.error("Error checking conflicts:", error);
    }
  };

  const getSlotForCell = (day: number, period: number) => {
    return timetable.find((s) => s.day_of_week === day && s.period_number === period);
  };

  const getSlotsForDay = (day: number) => {
    return timetable.filter((s) => s.day_of_week === day).sort((a, b) => a.period_number - b.period_number);
  };

  const getTotalPeriodsPerDay = (day: number) => {
    return timetable.filter((s) => s.day_of_week === day).length;
  };

  const getTotalPeriodsPerWeek = () => {
    return timetable.length;
  };

  const getLessonPlanStatus = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
      revision_required: { color: "bg-yellow-100 text-yellow-800", label: "Needs Revision" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Timetable</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          View your weekly class schedule and lesson plans
        </p>
      </div>

      {/* Conflicts Alert */}
      {conflicts && conflicts.has_conflicts && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Timetable Conflicts Detected</h3>
            <p className="text-sm text-red-700 mt-1">
              There are scheduling conflicts in your timetable. Please contact the administrator.
            </p>
            <div className="mt-2 text-xs text-red-600">
              {JSON.stringify(conflicts.conflict_details)}
            </div>
          </div>
        </div>
      )}

      {/* No Conflicts */}
      {conflicts && !conflicts.has_conflicts && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800 font-medium">
            No conflicts detected. Your timetable is valid.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Periods/Week</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalPeriodsPerWeek()}/30</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lesson Plans</p>
              <p className="text-2xl font-bold text-gray-900">
                {timetable.filter((s) => s.lesson_plan_id).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalPeriodsPerDay(selectedDay)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {days.map((day, index) => (
            <button
              key={day}
              onClick={() => setSelectedDay(index + 1)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedDay === index + 1
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {day}
              <span className="ml-2 text-xs">({getTotalPeriodsPerDay(index + 1)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {days[selectedDay - 1]}'s Schedule
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {getSlotsForDay(selectedDay).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No classes scheduled for this day</p>
            </div>
          ) : (
            getSlotsForDay(selectedDay).map((slot) => (
              <div key={slot.slot_id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        Period {slot.period_number}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {slot.subject_name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        Class {slot.class_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Room {slot.room_number}
                      </span>
                    </div>

                    {slot.lesson_plan_id && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {slot.lesson_plan_title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Lesson Plan</p>
                          </div>
                          {getLessonPlanStatus(slot.lesson_plan_status)}
                        </div>
                      </div>
                    )}

                    {!slot.lesson_plan_id && (
                      <div className="mt-3">
                        <a
                          href="/teacher/lesson-plans/create"
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          + Create Lesson Plan
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Grid View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Overview</h2>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                Period
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[150px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                  Period {period}
                </td>
                {days.map((day, dayIndex) => {
                  const slot = getSlotForCell(dayIndex + 1, period);
                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`border border-gray-200 px-2 py-2 text-sm ${
                        slot ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {slot ? (
                        <div className="p-2 bg-indigo-50 border border-indigo-200 rounded">
                          <div className="font-medium text-indigo-900 text-xs truncate">
                            {slot.subject_name}
                          </div>
                          <div className="text-xs text-indigo-700 truncate">
                            {slot.class_name}
                          </div>
                          <div className="text-xs text-indigo-600">{slot.room_number}</div>
                          {slot.lesson_plan_id && (
                            <div className="mt-1">
                              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                                LP
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400">Free</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyTimetable;
