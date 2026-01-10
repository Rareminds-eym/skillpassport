/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AcademicCapIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    CalendarIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronRightIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    UsersIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// ==================== TYPES ====================
interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number: string;
  class_id: string;
  class_name: string;
  class_grade: string;
  class_section: string;
  total_students: number;
  attendance_marked?: boolean;
  is_locked?: boolean;
}

interface Student {
  id: string;
  name: string;
  roll_number: string;
  grade: string;
  section: string;
  profile_picture?: string;
}

interface AttendanceRecord {
  student_id: string;
  status: "present" | "absent" | "late";
  time_in?: string;
  remarks?: string;
}

interface AttendanceSession {
  slot: TimetableSlot;
  students: Student[];
  records: Map<string, AttendanceRecord>;
  isSubmitted: boolean;
  submittedAt?: string;
}

// ==================== UTILITIES ====================
const getDayName = (dayNumber: number): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayNumber];
};

const formatTime = (time: string): string => {
  return time.slice(0, 5); // HH:MM
};

const isSlotLocked = (slotDate: string): boolean => {
  const slot = new Date(slotDate);
  const now = new Date();
  
  // Set slot date to end of day (23:59:59)
  const slotEOD = new Date(slot);
  slotEOD.setHours(23, 59, 59, 999);
  
  // If current time is past the slot's EOD, it's locked
  return now > slotEOD;
};

// ==================== MAIN COMPONENT ====================
const MarkAttendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [educatorId, setEducatorId] = useState<string | null>(null);
  const [educatorUserId, setEducatorUserId] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"schedule" | "marking">("schedule");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Get current educator and school
  useEffect(() => {
    const fetchEducatorInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: educator } = await supabase
          .from("school_educators")
          .select("id, school_id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (educator) {
          setEducatorId(educator.id);
          setEducatorUserId(educator.user_id);
          setSchoolId(educator.school_id);
        }
      } catch (error) {
        // Silently handle error - user will see no schedule if educator info fails
      }
    };

    fetchEducatorInfo();
  }, []);

  // Load today's schedule
  useEffect(() => {
    if (educatorId && schoolId) {
      loadTodaySchedule();
    }
  }, [educatorId, schoolId, selectedDate]);

  const loadTodaySchedule = async () => {
    if (!educatorId || !schoolId) return;

    setLoading(true);
    try {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();

      const currentYear = new Date().getFullYear();
      const { data: timetables } = await supabase
        .from("timetables")
        .select("id")
        .eq("school_id", schoolId)
        .eq("academic_year", `${currentYear}-${currentYear + 1}`)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1);

      const timetable = timetables?.[0];

      if (!timetable) {
        setTodaySlots([]);
        return;
      }

      const { data: slots, error } = await supabase
        .from("timetable_slots")
        .select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          subject_name,
          room_number,
          class_id,
          school_classes (
            name,
            grade,
            section,
            current_students
          )
        `)
        .eq("timetable_id", timetable.id)
        .eq("educator_id", educatorId)
        .eq("day_of_week", dayOfWeek)
        .order("period_number");

      if (error) throw error;

      // Optimize: Fetch all class IDs at once
      const classIds = slots?.map((slot: any) => slot.class_id) || [];
      
      // Fetch all students for these classes in one query
      const { data: allStudents } = await supabase
        .from("students")
        .select("id, school_class_id")
        .in("school_class_id", classIds)
        .eq("is_deleted", false);

      // Group students by class_id
      const studentsByClass = new Map<string, string[]>();
      allStudents?.forEach(student => {
        const classStudents = studentsByClass.get(student.school_class_id) || [];
        classStudents.push(student.id);
        studentsByClass.set(student.school_class_id, classStudents);
      });

      // Fetch all attendance records for today with valid slot_id
      const allStudentIds = allStudents?.map(s => s.id) || [];
      const { data: attendanceRecords } = allStudentIds.length > 0 ? await supabase
        .from("attendance_records")
        .select("student_id, slot_id")
        .eq("school_id", schoolId)
        .eq("date", selectedDate)
        .in("student_id", allStudentIds)
        .not("slot_id", "is", null) : { data: [] };

      // Create a map of slot_id -> Set of student IDs with attendance marked
      const attendanceBySlot = new Map();
      attendanceRecords?.forEach(record => {
        if (record.slot_id) {
          if (!attendanceBySlot.has(record.slot_id)) {
            attendanceBySlot.set(record.slot_id, new Set());
          }
          attendanceBySlot.get(record.slot_id).add(record.student_id);
        }
      });

      // Check if slot is locked once
      const isDateLocked = isSlotLocked(selectedDate);

      // Format slots with pre-fetched data
      const formattedSlots: TimetableSlot[] = (slots || []).map((slot: any) => {
        const classStudentIds = studentsByClass.get(slot.class_id) || [];
        const slotAttendanceSet = attendanceBySlot.get(slot.id) || new Set();
        const attendanceMarked = classStudentIds.some(id => slotAttendanceSet.has(id));
        const locked = isDateLocked && !attendanceMarked;

        return {
          id: slot.id,
          day_of_week: slot.day_of_week,
          period_number: slot.period_number,
          start_time: slot.start_time,
          end_time: slot.end_time,
          subject_name: slot.subject_name,
          room_number: slot.room_number,
          class_id: slot.class_id,
          class_name: slot.school_classes?.name || "Unknown",
          class_grade: slot.school_classes?.grade || "",
          class_section: slot.school_classes?.section || "",
          total_students: slot.school_classes?.current_students || 0,
          attendance_marked: attendanceMarked,
          is_locked: locked,
        };
      });

      setTodaySlots(formattedSlots);
    } catch (error) {
      setTodaySlots([]);
    } finally {
      setLoading(false);
    }
  };

  const startAttendanceSession = async (slot: TimetableSlot) => {
    if (!slot || !slot.id) {
      alert("Error: Invalid slot information. Please refresh the page and try again.");
      return;
    }
    
    setLoading(true);
    try {
      // First get all students in this class
      const { data: classStudents } = await supabase
        .from("students")
        .select("id")
        .eq("school_class_id", slot.class_id)
        .eq("is_deleted", false);

      const classStudentIds = classStudents?.map(s => s.id) || [];

      // Check if attendance already exists for these students on this date and slot
      const { data: existingRecords } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("school_id", schoolId)
        .eq("date", selectedDate)
        .eq("slot_id", slot.id)
        .in("student_id", classStudentIds);

      const existingForThisSlot = existingRecords || [];
      const isSubmitted = existingForThisSlot.length > 0;

      const { data: students, error } = await supabase
        .from("students")
        .select("id, name, roll_number, grade, section, profilePicture")
        .eq("school_class_id", slot.class_id)
        .eq("is_deleted", false)
        .order("roll_number");

      if (error) throw error;

      const formattedStudents: Student[] = (students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        roll_number: s.roll_number || "N/A",
        grade: s.grade || slot.class_grade,
        section: s.section || slot.class_section,
        profile_picture: s.profilePicture,
      }));

      const recordsMap = new Map<string, AttendanceRecord>();
      
      if (isSubmitted) {
        existingForThisSlot.forEach((record: any) => {
          recordsMap.set(record.student_id, {
            student_id: record.student_id,
            status: record.status,
            time_in: record.time_in,
            remarks: record.remarks,
          });
        });
      } else {
        formattedStudents.forEach((student) => {
          recordsMap.set(student.id, {
            student_id: student.id,
            status: "present",
            time_in: undefined,
            remarks: "",
          });
        });
      }

      setActiveSession({
        slot,
        students: formattedStudents,
        records: recordsMap,
        isSubmitted,
        submittedAt: isSubmitted ? existingForThisSlot[0]?.created_at : undefined,
      });

      setViewMode("marking");
    } catch (error) {
      alert("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceRecord = (
    studentId: string,
    field: keyof AttendanceRecord,
    value: any
  ) => {
    if (!activeSession) return;

    setActiveSession((prevSession) => {
      if (!prevSession) return null;

      // Create a completely new Map to ensure React detects the change
      const updatedRecords = new Map<string, AttendanceRecord>();
      
      // Copy all existing records
      prevSession.records.forEach((record, id) => {
        updatedRecords.set(id, { ...record });
      });

      // Get the current record or create a new one
      const currentRecord = updatedRecords.get(studentId) || {
        student_id: studentId,
        status: "present" as "present" | "absent" | "late",
      };

      // Update the specific field
      updatedRecords.set(studentId, {
        ...currentRecord,
        [field]: value,
      });

      // Return a completely new session object
      return {
        ...prevSession,
        records: updatedRecords,
      };
    });
  };

  const markAllAs = (status: "present" | "absent") => {
    if (!activeSession) return;

    const updatedRecords = new Map(activeSession.records);
    activeSession.students.forEach((student) => {
      const record = updatedRecords.get(student.id) || {
        student_id: student.id,
        status: "present",
      };
      updatedRecords.set(student.id, {
        ...record,
        status,
        time_in: status === "present"
          ? new Date().toTimeString().slice(0, 5) 
          : undefined,
      });
    });

    setActiveSession({
      ...activeSession,
      records: updatedRecords,
    });
  };

  const submitAttendance = async () => {
    if (!activeSession || !educatorUserId || !schoolId) return;

    if (!activeSession.slot.id) {
      alert("Error: Invalid slot information. Please refresh and try again.");
      return;
    }

    if (!confirm("Submit attendance? This will save the records.")) return;

    setSubmitting(true);
    try {
      if (activeSession.isSubmitted) {
        await supabase
          .from("attendance_records")
          .delete()
          .eq("school_id", schoolId)
          .eq("date", selectedDate)
          .eq("slot_id", activeSession.slot.id);
      }

      let slotId = activeSession.slot.id;
      
      // If slot_id is missing, query it from database
      if (!slotId && educatorId && schoolId) {
        try {
          const dayOfWeek = new Date(selectedDate).getDay();
          
          const { data: slotData } = await supabase
            .from("timetable_slots")
            .select("id")
            .eq("educator_id", educatorId)
            .eq("period_number", activeSession.slot.period_number)
            .eq("day_of_week", dayOfWeek)
            .eq("subject_name", activeSession.slot.subject_name)
            .eq("class_id", activeSession.slot.class_id)
            .maybeSingle();
            
          if (slotData?.id) {
            slotId = slotData.id;
          }
        } catch (error) {
          console.error("Failed to retrieve slot_id from database:", error);
        }
      }
      
      // Final fallback: try to find slot from current slots
      if (!slotId) {
        const matchingSlot = todaySlots.find(s => 
          s.period_number === activeSession.slot.period_number &&
          s.subject_name === activeSession.slot.subject_name &&
          s.class_id === activeSession.slot.class_id
        );
        
        if (matchingSlot?.id) {
          slotId = matchingSlot.id;
        } else {
          throw new Error("Unable to determine slot information. Please refresh the page and try again.");
        }
      }

      const recordsToInsert = Array.from(activeSession.records.values()).map((record) => ({
        student_id: record.student_id,
        school_id: schoolId,
        date: selectedDate,
        status: record.status,
        time_in: record.time_in || null,
        time_out: null,
        marked_by: educatorUserId,
        remarks: record.remarks || null,
        mode: "manual",
        otp_verified: false,
        slot_id: slotId,
      }));

      // Validate that all records have slot_id before inserting
      const invalidRecords = recordsToInsert.filter(record => !record.slot_id);
      if (invalidRecords.length > 0) {
        throw new Error("Invalid slot information detected. Please refresh and try again.");
      }

      const { error } = await supabase
        .from("attendance_records")
        .insert(recordsToInsert);

      if (error) throw error;

      alert("Attendance submitted successfully!");
      setActiveSession({
        ...activeSession,
        isSubmitted: true,
        submittedAt: new Date().toISOString(),
      });
      setViewMode("schedule");
      loadTodaySchedule();
    } catch (error) {
      console.error("Attendance submission error:", error);
      alert("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!activeSession) return [];
    if (!searchQuery) return activeSession.students;

    const query = searchQuery.toLowerCase();
    return activeSession.students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.roll_number.toLowerCase().includes(query)
    );
  }, [activeSession, searchQuery]);

  const attendanceStats = useMemo(() => {
    if (!activeSession) return { present: 0, absent: 0, late: 0, total: 0 };

    const stats = { present: 0, absent: 0, late: 0, total: activeSession.students.length };
    activeSession.records.forEach((record) => {
      stats[record.status]++;
    });

    return stats;
  }, [activeSession]);

  const isSlotInFuture = (slot: TimetableSlot): boolean => {
    const now = new Date();
    const slotDate = new Date(selectedDate);
    const [hours, minutes] = slot.start_time.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate > now;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {viewMode === "schedule" ? (
        <ScheduleView
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          todaySlots={todaySlots}
          loading={loading}
          onStartSession={startAttendanceSession}
          isSlotInFuture={isSlotInFuture}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      ) : (
        <MarkingView
          session={activeSession}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredStudents={filteredStudents}
          attendanceStats={attendanceStats}
          updateAttendanceRecord={updateAttendanceRecord}
          markAllAs={markAllAs}
          submitAttendance={submitAttendance}
          submitting={submitting}
          onBack={() => setViewMode("schedule")}
        />
      )}
    </div>
  );
};

export default MarkAttendance;

// ==================== SCHEDULE VIEW COMPONENT ====================
interface ScheduleViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  todaySlots: TimetableSlot[];
  loading: boolean;
  onStartSession: (slot: TimetableSlot) => void;
  isSlotInFuture: (slot: TimetableSlot) => boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  selectedClass: string;
  setSelectedClass: (classId: string) => void;
  selectedSubject: string;
  setSelectedSubject: (subject: string) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  selectedDate,
  setSelectedDate,
  todaySlots,
  loading,
  onStartSession,
  isSlotInFuture,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  selectedClass,
  setSelectedClass,
  selectedSubject,
  setSelectedSubject,
}) => {
  const selectedDateObj = new Date(selectedDate);
  const dayName = getDayName(selectedDateObj.getDay());
  const formattedDate = selectedDateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Get unique classes and subjects for filters
  const uniqueClasses = Array.from(new Set(todaySlots.map(slot => slot.class_name))).sort();
  const uniqueSubjects = Array.from(new Set(todaySlots.map(slot => slot.subject_name))).sort();

  // Filter slots based on search and filters
  const filteredSlots = todaySlots.filter((slot) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        slot.subject_name.toLowerCase().includes(query) ||
        slot.class_name.toLowerCase().includes(query) ||
        slot.room_number.toLowerCase().includes(query) ||
        `period ${slot.period_number}`.includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Class filter
    if (selectedClass !== "all" && slot.class_name !== selectedClass) {
      return false;
    }

    // Subject filter
    if (selectedSubject !== "all" && slot.subject_name !== selectedSubject) {
      return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSlots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSlots = filteredSlots.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching Classes Management Style */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-base md:text-lg mt-2 text-gray-600">Mark attendance for your classes and track student presence.</p>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by subject, class, room, or period..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-3">
            {/* Date Picker */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Class Filter */}
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="all">All Classes</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <ChevronRightIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
            </div>

            {/* Clear Filters Button */}
            {(selectedClass !== "all" || selectedSubject !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedClass("all");
                  setSelectedSubject("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Date Display and Deadline Notice */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>Showing schedule for</span>
            <span className="font-semibold text-gray-900">{dayName}, {formattedDate}</span>
          </div>
          
          {/* Deadline Notice - Only show for current/future dates */}
          {!isSlotLocked(selectedDate) && selectedDate !== new Date().toISOString().split("T")[0] && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <ClockIcon className="h-4 w-4 text-amber-600" />
              <span>
                <strong>Reminder:</strong> Attendance must be marked by end of day (11:59 PM) or slots will be locked.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Active Filters Summary */}
        {(selectedClass !== "all" || selectedSubject !== "all") && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedClass !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Class: {selectedClass}
                <button
                  onClick={() => {
                    setSelectedClass("all");
                    setCurrentPage(1);
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedSubject !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Subject: {selectedSubject}
                <button
                  onClick={() => {
                    setSelectedSubject("all");
                    setCurrentPage(1);
                  }}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading your schedule...</p>
            </div>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchQuery ? (
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
              ) : (
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No Results Found" : "No Classes Today"}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              {searchQuery 
                ? "Try adjusting your search terms or clear the search to see all classes."
                : `You don't have any classes scheduled for ${dayName}. Try selecting a different date.`
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {paginatedSlots.map((slot) => {
                const isFuture = isSlotInFuture(slot);
                return (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    isFuture={isFuture}
                    onStartSession={onStartSession}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredSlots.length)} of {filteredSlots.length} classes
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  {/* Mobile page indicator */}
                  <div className="sm:hidden px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ==================== SLOT CARD COMPONENT ====================
interface SlotCardProps {
  slot: TimetableSlot;
  isFuture: boolean;
  onStartSession: (slot: TimetableSlot) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, isFuture, onStartSession }) => {
  // Calculate duration
  const startTime = new Date(`2000-01-01T${slot.start_time}`);
  const endTime = new Date(`2000-01-01T${slot.end_time}`);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all overflow-hidden">
      {/* Card Header with Period Badge */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">{slot.period_number}</span>
            </div>
            <div>
              <div className="text-white/80 text-xs font-medium">Period {slot.period_number}</div>
              <div className="text-white text-sm font-semibold">
                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/80 text-xs font-medium">Duration</div>
            <div className="text-white text-sm font-semibold">{durationMinutes} min</div>
          </div>
        </div>

        {/* Status Badge */}
        {slot.is_locked ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 backdrop-blur-sm rounded-full border border-red-300/30">
            <XCircleIcon className="h-3.5 w-3.5 text-red-200" />
            <span className="text-xs font-semibold text-white">Locked</span>
          </div>
        ) : isFuture ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-300/30">
            <ClockIcon className="h-3.5 w-3.5 text-amber-200" />
            <span className="text-xs font-semibold text-white">Upcoming</span>
          </div>
        ) : slot.attendance_marked ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full border border-green-300/30">
            <CheckCircleIcon className="h-3.5 w-3.5 text-green-200" />
            <span className="text-xs font-semibold text-white">Marked</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-300/30">
            <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-200" />
            <span className="text-xs font-semibold text-white">Ready to Mark</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6">
        {/* Subject Name */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 font-medium mb-1">Subject</div>
          <h3 className="text-xl font-bold text-gray-900">{slot.subject_name}</h3>
        </div>

        {/* Info Grid */}
        <div className="space-y-3 mb-6">
          {/* Class Info - Full Width */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-blue-600 font-medium mb-0.5">Class</div>
              <div className="text-sm font-bold text-gray-900">{slot.class_name}</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Grade {slot.class_grade} • Section {slot.class_section}
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Students Count */}
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UsersIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-emerald-600 font-medium">Students</div>
                <div className="text-lg font-bold text-gray-900">{slot.total_students}</div>
              </div>
            </div>

            {/* Room Number */}
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-purple-600 font-medium">Room</div>
                <div className="text-lg font-bold text-gray-900">{slot.room_number}</div>
              </div>
            </div>
          </div>

          {/* Additional Info Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">{getDayName(slot.day_of_week)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span className="font-medium">{durationMinutes} minutes</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onStartSession(slot)}
          disabled={isFuture || slot.is_locked}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            slot.is_locked
              ? "bg-red-100 text-red-700 cursor-not-allowed border-2 border-red-200"
              : isFuture
              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
              : slot.attendance_marked
              ? "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md"
          }`}
        >
          {slot.is_locked ? (
            <>
              <XCircleIcon className="h-5 w-5" />
              Locked - Deadline Passed
            </>
          ) : isFuture ? (
            <>
              <ClockIcon className="h-5 w-5" />
              Starts at {formatTime(slot.start_time)}
            </>
          ) : slot.attendance_marked ? (
            <>
              View/Edit Attendance
              <ChevronRightIcon className="h-5 w-5" />
            </>
          ) : (
            <>
              Mark Attendance
              <ChevronRightIcon className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ==================== MARKING VIEW COMPONENT ====================
interface MarkingViewProps {
  session: AttendanceSession | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredStudents: Student[];
  attendanceStats: { present: number; absent: number; late: number; total: number };
  updateAttendanceRecord: (studentId: string, field: keyof AttendanceRecord, value: any) => void;
  markAllAs: (status: "present" | "absent") => void;
  submitAttendance: () => void;
  submitting: boolean;
  onBack: () => void;
}

const MarkingView: React.FC<MarkingViewProps> = ({
  session,
  searchQuery,
  setSearchQuery,
  filteredStudents,
  attendanceStats,
  updateAttendanceRecord,
  markAllAs,
  submitAttendance,
  submitting,
  onBack,
}) => {
  if (!session) return null;

  const attendancePercentage = session.students.length > 0
    ? ((attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100).toFixed(0)
    : "0";

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Schedule
        </button>

        {/* Class Info Card */}
        <div className="bg-indigo-600 rounded-lg p-6 text-white mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg text-sm font-bold">
                  {session.slot.period_number}
                </span>
                <span className="text-sm text-white/80">
                  {formatTime(session.slot.start_time)} - {formatTime(session.slot.end_time)}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-3">{session.slot.subject_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <span className="flex items-center gap-1.5">
                  <AcademicCapIcon className="h-4 w-4" />
                  {session.slot.class_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4" />
                  Room {session.slot.room_number}
                </span>
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="h-4 w-4" />
                  {session.students.length} Students
                </span>
              </div>
            </div>

            {/* Attendance Badge */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 text-center border border-white/20">
              <div className="text-3xl font-bold">{attendancePercentage}%</div>
              <div className="text-xs text-white/80 mt-1">Attendance</div>
            </div>
          </div>

          {/* Status Badge */}
          {session.isSubmitted && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500 rounded-lg text-sm font-semibold">
              <CheckCircleIcon className="h-4 w-4" />
              Submitted
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{attendanceStats.present}</div>
            <div className="text-xs text-emerald-600 font-medium">Present</div>
          </div>
          <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
            <div className="text-2xl font-bold text-rose-700">{attendanceStats.absent}</div>
            <div className="text-xs text-rose-600 font-medium">Absent</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{attendanceStats.late}</div>
            <div className="text-xs text-amber-600 font-medium">Late</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Quick Actions */}
          {!session.isSubmitted && (
            <div className="flex gap-2">
              <button
                onClick={() => markAllAs("present")}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                All Present
              </button>
              <button
                onClick={() => markAllAs("absent")}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header - Hidden on Mobile */}
          <div className="hidden lg:block bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase">
              <div className="col-span-2">Roll</div>
              <div className="col-span-3">Student</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2">Time In</div>
              <div className="col-span-2">Remarks</div>
            </div>
          </div>

          {/* Student Rows */}
          <div className="divide-y divide-gray-200">
            {filteredStudents.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const record = session.records.get(student.id);
                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    record={record}
                    isDisabled={session.isSubmitted}
                    onUpdate={updateAttendanceRecord}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Submit Button */}
        {!session.isSubmitted && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={submitAttendance}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Submit Attendance
                </>
              )}
            </button>
          </div>
        )}

        {session.isSubmitted && session.submittedAt && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-sm text-emerald-800 font-medium">
              Submitted on {new Date(session.submittedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== STUDENT ROW COMPONENT ====================
interface StudentRowProps {
  student: Student;
  record?: AttendanceRecord;
  isDisabled: boolean;
  onUpdate: (studentId: string, field: keyof AttendanceRecord, value: any) => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ student, record, isDisabled, onUpdate }) => {
  const statusButtons = [
    { value: "present", label: "Present", icon: CheckCircleIcon, color: "emerald" },
    { value: "absent", label: "Absent", icon: XCircleIcon, color: "rose" },
    { value: "late", label: "Late", icon: ClockIcon, color: "amber" },
  ];

  const getButtonClasses = (status: string) => {
    const isActive = record?.status === status;
    const baseClasses = "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border";
    
    if (isActive) {
      const activeColors = {
        present: "bg-emerald-100 text-emerald-700 border-emerald-300",
        absent: "bg-rose-100 text-rose-700 border-rose-300",
        late: "bg-amber-100 text-amber-700 border-amber-300",
      };
      return `${baseClasses} ${activeColors[status as keyof typeof activeColors]}`;
    }
    
    return `${baseClasses} bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
  };

  return (
    <>
      {/* Desktop View - Table Layout */}
      <div className="hidden lg:block px-6 py-4 hover:bg-gray-50 transition-colors">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Roll Number */}
          <div className="col-span-2">
            <div className="flex items-left justify-left min-w-0">
              <span className="inline-flex items-center justify-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs whitespace-nowrap">
                {student.roll_number}
              </span>
            </div>
          </div>

          {/* Student Name */}
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              {student.profile_picture ? (
                <img
                  src={student.profile_picture}
                  alt={student.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{student.name}</div>
                <div className="text-xs text-gray-500">
                  {student.grade} - {student.section}
                </div>
              </div>
            </div>
          </div>

          {/* Status Buttons */}
          <div className="col-span-3">
            <div className="flex gap-2">
              {statusButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.value}
                    onClick={() => {
                      if (!isDisabled) {
                        onUpdate(student.id, "status", btn.value);
                        if (btn.value === "present" || btn.value === "late") {
                          onUpdate(student.id, "time_in", new Date().toTimeString().slice(0, 5));
                        } else if (btn.value === "absent") {
                          onUpdate(student.id, "time_in", undefined);
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={getButtonClasses(btn.value)}
                    title={btn.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time In */}
          <div className="col-span-2">
            <input
              type="time"
              value={record?.time_in || ""}
              onChange={(e) => onUpdate(student.id, "time_in", e.target.value)}
              disabled={isDisabled || record?.status === "absent"}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Remarks */}
          <div className="col-span-2">
            <input
              type="text"
              value={record?.remarks || ""}
              onChange={(e) => onUpdate(student.id, "remarks", e.target.value)}
              disabled={isDisabled}
              placeholder="Note..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="lg:hidden p-4 hover:bg-gray-50 transition-colors">
        <div className="space-y-3">
          {/* Student Info Header */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm flex-shrink-0">
              {student.roll_number}
            </span>
            {student.profile_picture ? (
              <img
                src={student.profile_picture}
                alt={student.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{student.name}</div>
              <div className="text-xs text-gray-500">
                Grade {student.grade} • Section {student.section}
              </div>
            </div>
          </div>

          {/* Status Buttons */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {statusButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.value}
                    onClick={() => {
                      if (!isDisabled) {
                        onUpdate(student.id, "status", btn.value);
                        if (btn.value === "present" || btn.value === "late") {
                          onUpdate(student.id, "time_in", new Date().toTimeString().slice(0, 5));
                        } else if (btn.value === "absent") {
                          onUpdate(student.id, "time_in", undefined);
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={getButtonClasses(btn.value) + " justify-center"}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{btn.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time In */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Time In</label>
            <input
              type="time"
              value={record?.time_in || ""}
              onChange={(e) => onUpdate(student.id, "time_in", e.target.value)}
              disabled={isDisabled || record?.status === "absent"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Remarks</label>
            <input
              type="text"
              value={record?.remarks || ""}
              onChange={(e) => onUpdate(student.id, "remarks", e.target.value)}
              disabled={isDisabled}
              placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </>
  );
};
