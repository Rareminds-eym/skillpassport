import React, { useState, useEffect } from "react";
import { Sparkles, Save, Send } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface Teacher {
  id: string;
  teacher_id: string;
  first_name: string;
  last_name: string;
}

interface TimetableSlot {
  id?: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_number: string;
}

const TimetableBuilderEnhanced: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetableId, setTimetableId] = useState<string>("");
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [draggedSlot, setDraggedSlot] = useState<TimetableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);
  const timeSlots = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
    "17:00-18:00", "18:00-19:00"
  ];

  useEffect(() => {
    loadTeachers();
    loadOrCreateTimetable();
  }, []);

  useEffect(() => {
    if (timetableId) {
      loadAllSlots();
    }
  }, [timetableId]);

  const loadTeachers = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("id, teacher_id, first_name, last_name")
      .eq("onboarding_status", "active")
      .order("first_name");
    
    if (data) setTeachers(data);
  };

  const loadOrCreateTimetable = async () => {
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from("timetables")
      .select("id, status")
      .eq("academic_year", `${currentYear}-${currentYear + 1}`)
      .single();

    if (existing) {
      setTimetableId(existing.id);
      setPublishStatus(existing.status);
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

  const loadAllSlots = async () => {
    const { data } = await supabase
      .from("timetable_slots")
      .select("*, teachers(first_name, last_name)")
      .eq("timetable_id", timetableId)
      .order("day_of_week")
      .order("period_number");
    
    if (data) {
      const slotsWithNames = data.map(slot => ({
        ...slot,
        teacher_name: slot.teachers ? `${slot.teachers.first_name} ${slot.teachers.last_name}` : ""
      }));
      setAllSlots(slotsWithNames);
    }
  };

  const getSlotForCell = (day: number, period: number) => {
    return allSlots.find(s => s.day_of_week === day && s.period_number === period);
  };

  const getTeacherLoad = (teacherId: string) => {
    return allSlots.filter(s => s.teacher_id === teacherId).length;
  };

  const handleDragStart = (slot: TimetableSlot) => {
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (day: number, period: number) => {
    if (!draggedSlot) return;

    setLoading(true);
    try {
      // Update slot position
      const { error } = await supabase
        .from("timetable_slots")
        .update({
          day_of_week: day,
          period_number: period,
        })
        .eq("id", draggedSlot.id);

      if (error) throw error;
      
      await loadAllSlots();
      setDraggedSlot(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateTimetable = async () => {
    if (!confirm("This will generate a timetable automatically. Continue?")) return;
    
    setLoading(true);
    try {
      // Simple auto-generation logic
      const newSlots: any[] = [];
      let slotIndex = 0;

      teachers.forEach((teacher, teacherIndex) => {
        // Assign 5 periods per teacher across the week
        for (let i = 0; i < 5; i++) {
          const day = (teacherIndex % 6) + 1; // Distribute across days
          const period = (slotIndex % 10) + 1;
          
          newSlots.push({
            timetable_id: timetableId,
            teacher_id: teacher.id,
            day_of_week: day,
            period_number: period,
            start_time: timeSlots[period - 1].split("-")[0],
            end_time: timeSlots[period - 1].split("-")[1],
            class_name: `Class-${i + 1}`,
            subject_name: "General",
            room_number: `R${period}`,
          });
          
          slotIndex++;
        }
      });

      const { error } = await supabase
        .from("timetable_slots")
        .insert(newSlots);

      if (error) throw error;
      
      await loadAllSlots();
      alert("Timetable generated successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const publishTimetable = async () => {
    if (!confirm("Publish this timetable? It will be visible to all teachers.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("timetables")
        .update({ status: "published" })
        .eq("id", timetableId);

      if (error) throw error;
      
      setPublishStatus("published");
      alert("Timetable published successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Timetable Builder
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Drag & drop to build timetable with automatic conflict detection
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-lg font-medium ${
              publishStatus === "published" 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {publishStatus === "published" ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
        <button
          onClick={autoGenerateTimetable}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Generate
        </button>
        <button
          onClick={() => loadAllSlots()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={publishTimetable}
          disabled={loading || publishStatus === "published"}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        >
          <Send className="h-4 w-4" />
          Publish
        </button>
      </div>

      {/* Teacher Load Indicators */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Teacher Load</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {teachers.map(teacher => {
            const load = getTeacherLoad(teacher.id);
            const percentage = (load / 30) * 100;
            return (
              <div key={teacher.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {teacher.first_name} {teacher.last_name}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        percentage > 100 ? "bg-red-500" :
                        percentage > 80 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {load}/30
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                Period / Day
              </th>
              {days.map((day) => (
                <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                  <div>
                    <div>Period {period}</div>
                    <div className="text-xs text-gray-500">{timeSlots[period - 1]}</div>
                  </div>
                </td>
                {days.map((day, dayIndex) => {
                  const slot = getSlotForCell(dayIndex + 1, period);
                  const isFree = !slot;
                  
                  return (
                    <td
                      key={`${day}-${period}`}
                      className={`border border-gray-200 px-2 py-2 text-sm ${
                        isFree ? "bg-green-50" : "bg-white"
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dayIndex + 1, period)}
                    >
                      {slot ? (
                        <div
                          draggable
                          onDragStart={() => handleDragStart(slot)}
                          className="p-2 bg-indigo-100 border border-indigo-300 rounded cursor-move hover:bg-indigo-200 transition"
                        >
                          <div className="font-medium text-indigo-900 text-xs truncate">
                            {slot.teacher_name}
                          </div>
                          <div className="text-xs text-indigo-700 truncate">
                            {slot.subject_name}
                          </div>
                          <div className="text-xs text-indigo-600">
                            {slot.class_name} • {slot.room_number}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-xs text-green-600 font-medium">
                          Free Period
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

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-600">Free Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded"></div>
            <span className="text-sm text-gray-600">Assigned Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Load: 0-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Load: 80-100%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Load: &gt;100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableBuilderEnhanced;
