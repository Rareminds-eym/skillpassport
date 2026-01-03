import React, { useState, useEffect } from "react";
import { Sparkles, Save, Send, AlertTriangle } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface Faculty {
  id: string;
  employeeId?: string;
  first_name?: string;
  last_name?: string;
  // Keep metadata for backward compatibility
  metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface CollegeClass {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface TimetableSlot {
  id?: string;
  educator_id: string;
  faculty_name?: string;
  class_id?: string;
  class_name: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number: string;
}

interface FacultyTimetableProps {
  collegeId: string | null;
}

const FacultyTimetable: React.FC<FacultyTimetableProps> = ({ collegeId }) => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [timetableId, setTimetableId] = useState<string>("");
  const [allSlots, setAllSlots] = useState<TimetableSlot[]>([]);
  const [draggedSlot, setDraggedSlot] = useState<TimetableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number } | null>(null);
  const [newSlot, setNewSlot] = useState({
    faculty_id: "",
    class_id: "",
    subject_name: "",
    room_number: "",
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const periods = Array.from({ length: 10 }, (_, i) => i + 1);
  const timeSlots = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
    "17:00-18:00", "18:00-19:00"
  ];

  useEffect(() => {
    if (collegeId) {
      loadFaculty();
      loadClasses();
      loadOrCreateTimetable();
    }
  }, [collegeId]);

  useEffect(() => {
    if (timetableId) {
      loadAllSlots();
    }
  }, [timetableId]);

  const loadFaculty = async () => {
    if (!collegeId) return;

    const { data } = await supabase
      .from("college_lecturers")
      .select("id, employeeId, first_name, last_name")
      .eq("collegeId", collegeId)
      .eq("accountStatus", "active")
      .order("first_name");
    
    if (data) setFaculty(data);
  };

  const loadClasses = async () => {
    if (!collegeId) return;

    const { data } = await supabase
      .from("college_classes")
      .select("id, name, grade, section")
      .eq("college_id", collegeId)
      .eq("status", "active")
      .order("grade")
      .order("section");
    
    if (data) setClasses(data);
  };

  const loadOrCreateTimetable = async () => {
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from("college_timetables")
      .select("id, status")
      .eq("academic_year", `${currentYear}-${currentYear + 1}`)
      .eq("college_id", collegeId)
      .single();

    if (existing) {
      setTimetableId(existing.id);
      setPublishStatus(existing.status);
    } else {
      const { data: newTimetable } = await supabase
        .from("college_timetables")
        .insert({
          college_id: collegeId,
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
      .from("college_timetable_slots")
      .select("*")
      .eq("timetable_id", timetableId)
      .order("day_of_week")
      .order("period_number");
    
    if (data) {
      const slotsWithNames = data.map(slot => ({
        ...slot,
        faculty_name: getFacultyName(slot.educator_id),
        class_name: getClassName(slot.class_id)
      }));
      setAllSlots(slotsWithNames);
    }
  };

  const getFacultyName = (facultyId: string) => {
    const f = faculty.find(f => f.id === facultyId);
    return f ? `${f.first_name || f.metadata?.first_name || ''} ${f.last_name || f.metadata?.last_name || ''}`.trim() : '';
  };

  const getClassName = (classId: string) => {
    const c = classes.find(c => c.id === classId);
    return c ? c.name : '';
  };

  const getSlotForCell = (day: number, period: number) => {
    return allSlots.find(s => s.day_of_week === day && s.period_number === period);
  };

  const getFacultyLoad = (facultyId: string) => {
    return allSlots.filter(s => s.educator_id === facultyId).length;
  };

  const handleCellClick = (day: number, period: number) => {
    const existingSlot = getSlotForCell(day, period);
    if (existingSlot) return;
    
    if (!newSlot.faculty_id || !newSlot.class_id) {
      alert("Please select a Faculty and Class from the dropdowns above first.");
      return;
    }
    
    setSelectedCell({ day, period });
    setNewSlot({
      ...newSlot,
      subject_name: "",
      room_number: "",
    });
    setShowAddModal(true);
  };

  const handleAddSlot = async () => {
    if (!selectedCell || !newSlot.faculty_id || !newSlot.class_id || !newSlot.subject_name) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const [startTime, endTime] = timeSlots[selectedCell.period - 1].split("-");
      
      const { error } = await supabase
        .from("college_timetable_slots")
        .insert({
          timetable_id: timetableId,
          educator_id: newSlot.faculty_id,
          class_id: newSlot.class_id,
          day_of_week: selectedCell.day,
          period_number: selectedCell.period,
          start_time: startTime,
          end_time: endTime,
          subject_name: newSlot.subject_name,
          room_number: newSlot.room_number || `R${selectedCell.period}`,
        });

      if (error) throw error;
      
      await loadAllSlots();
      setShowAddModal(false);
      setSelectedCell(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this slot?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("college_timetable_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;
      
      await loadAllSlots();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const publishTimetable = async () => {
    if (!confirm("Publish this timetable? It will be visible to all faculty.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("college_timetables")
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Timetable Builder
            </h1>
            <p className="text-gray-600 text-sm">
              Drag & drop to build timetable with automatic conflict detection
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-lg font-medium text-sm ${
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
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3">
        <button
          onClick={() => loadAllSlots()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition text-sm"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={publishTimetable}
          disabled={loading || publishStatus === "published"}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm"
        >
          <Send className="h-4 w-4" />
          Publish
        </button>
      </div>

      {/* Faculty Load and Class Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Faculty Load</h3>
          <select
            value={newSlot.faculty_id}
            onChange={(e) => setNewSlot({ ...newSlot, faculty_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 mb-3"
          >
            <option value="">-- Select Faculty --</option>
            {faculty.map((f) => {
              const load = getFacultyLoad(f.id);
              return (
                <option key={f.id} value={f.id}>
                  {f.first_name || f.metadata?.first_name || ''} {f.last_name || f.metadata?.last_name || ''} ({load}/30 periods)
                </option>
              );
            })}
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Classes in College</h3>
          <select
            value={newSlot.class_id}
            onChange={(e) => setNewSlot({ ...newSlot, class_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 mb-3"
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.grade}{cls.section ? `-${cls.section}` : ''} ({cls.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                Period / Day
              </th>
              {days.map((day) => (
                <th key={day} className="border border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-900 min-w-[150px]">
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
                        isFree ? "bg-green-50 cursor-pointer hover:bg-green-100" : "bg-white"
                      }`}
                      onClick={() => isFree && handleCellClick(dayIndex + 1, period)}
                    >
                      {slot ? (
                        <div className="p-2 border rounded cursor-move transition relative group bg-indigo-100 border-indigo-300 hover:bg-indigo-200">
                          {slot.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlot(slot.id!);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition"
                            >
                              ×
                            </button>
                          )}
                          <div className="font-medium text-xs truncate text-indigo-900">
                            {slot.faculty_name}
                          </div>
                          <div className="text-xs truncate text-indigo-700">
                            {slot.subject_name}
                          </div>
                          <div className="text-xs text-indigo-600">
                            {slot.class_name} • {slot.room_number}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 text-center text-xs text-green-600 font-medium hover:text-green-700">
                          + Add Slot
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

      {/* Add Slot Modal */}
      {showAddModal && selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Add Slot - {days[selectedCell.day - 1]} Period {selectedCell.period}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Time: {timeSlots[selectedCell.period - 1]}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newSlot.subject_name}
                  onChange={(e) => setNewSlot({ ...newSlot, subject_name: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                <input
                  type="text"
                  value={newSlot.room_number}
                  onChange={(e) => setNewSlot({ ...newSlot, room_number: e.target.value })}
                  placeholder="e.g., R101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedCell(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
              >
                {loading ? "Adding..." : "Add Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetable;
