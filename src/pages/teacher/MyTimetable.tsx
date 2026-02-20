import {
    Award,
    BookOpen,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Coffee,
    Download,
    Filter,
    MapPin,
    RefreshCw,
    Sun,
    Users
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { XMarkIcon } from '@heroicons/react/24/outline';
import SwapRequestModal from "../../components/teacher/SwapRequestModal";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../rbac/hooks/usePermissions";
import {
    createSwapRequest,
    getAvailableSlotsForSwap,
    getPendingSwapCount,
    getSwapRequests,
} from "../../services/classSwapService";
import type { ClassSwapRequest, CreateSwapRequestPayload, SlotInfo } from "../../types/classSwap";
import SwapRequestsDashboard from "./SwapRequestsDashboard";

// Types
interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  is_hod: boolean;
}

interface TimePeriod {
  id?: string;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_type?: string;
}

interface TimetableSlot {
  id?: string;
  timetable_id: string;
  educator_id: string;
  class_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number: string;
  schedule_date?: string;
  is_recurring: boolean;
  class_name?: string;
}

interface Break {
  id?: string;
  break_type: "lunch" | "short" | "holiday" | "exam" | "event";
  name: string;
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
}

interface SchoolClass {
  id: string;
  name: string;
  grade?: string;
  section?: string;
}

// Constants
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_PERIODS: TimePeriod[] = [
  { period_number: 1, period_name: "Period 1", start_time: "09:00", end_time: "09:50", is_break: false },
  { period_number: 2, period_name: "Period 2", start_time: "09:50", end_time: "10:40", is_break: false },
  { period_number: 3, period_name: "Short Break", start_time: "10:40", end_time: "10:55", is_break: true, break_type: "short" },
  { period_number: 4, period_name: "Period 3", start_time: "10:55", end_time: "11:45", is_break: false },
  { period_number: 5, period_name: "Period 4", start_time: "11:45", end_time: "12:35", is_break: false },
  { period_number: 6, period_name: "Lunch Break", start_time: "12:35", end_time: "13:20", is_break: true, break_type: "lunch" },
  { period_number: 7, period_name: "Period 5", start_time: "13:20", end_time: "14:10", is_break: false },
  { period_number: 8, period_name: "Period 6", start_time: "14:10", end_time: "15:00", is_break: false },
];

const SLOT_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-purple-100 border-purple-300 text-purple-900",
  "bg-green-100 border-green-300 text-green-900",
  "bg-orange-100 border-orange-300 text-orange-900",
  "bg-pink-100 border-pink-300 text-pink-900",
  "bg-cyan-100 border-cyan-300 text-cyan-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-indigo-100 border-indigo-300 text-indigo-900",
];

const BREAK_BG_COLORS: Record<string, string> = {
  holiday: "bg-red-50",
  event: "bg-purple-50",
  exam: "bg-amber-50",
};

const BREAK_TEXT_COLORS: Record<string, string> = {
  holiday: "text-red-600",
  event: "text-purple-600",
  exam: "text-amber-600",
};

// Utility functions
const getWeekStart = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekDates = (weekStart: Date) => {
  return DAYS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isHoliday = (date: Date, breaks: Break[]) => {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.some(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
};

const getBreakInfo = (date: Date, breaks: Break[]) => {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.find(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
};

const getSlotColor = (subjectName: string) => {
  const hash = subjectName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SLOT_COLORS[hash % SLOT_COLORS.length];
};

const MyTimetable: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  
  // Permission controls for Classroom Management module - same as Program Sections
  const canView = usePermission("Classroom Management", "view")
  const canCreate = usePermission("Classroom Management", "create")
  const canEdit = usePermission("Classroom Management", "edit")
  
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [periods, setPeriods] = useState<TimePeriod[]>(DEFAULT_PERIODS);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart());
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("");
  const [educatorId, setEducatorId] = useState<string>("");
  const [educatorName, setEducatorName] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [timetableId, setTimetableId] = useState<string>("");
  const [isCollegeEducator, setIsCollegeEducator] = useState<boolean>(false);
  const [departmentInfo, setDepartmentInfo] = useState<DepartmentInfo | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);

  // Swap Request States
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<TimetableSlot | null>(null);
  const [availableSlotsForSwap, setAvailableSlotsForSwap] = useState<SlotInfo[]>([]);
  const [pendingSwapCount, setPendingSwapCount] = useState(0);
  const [activeSwapRequests, setActiveSwapRequests] = useState<ClassSwapRequest[]>([]);
  const [showSwapDashboard, setShowSwapDashboard] = useState(false);

  // Security check - same as Program Sections
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    
    if (user?.role !== 'educator' && user?.role !== 'college_educator') {
      console.error('Unauthorized access attempt to timetable page')
      navigate('/auth/login')
      return
    }
  }, [isAuthenticated, user, navigate])

  // Permission check - redirect if no view permission - same as Program Sections
  useEffect(() => {
    if (!canView) {
      console.warn('Access denied: No view permission for Classroom Management')
      navigate('/educator/dashboard')
      return
    }
  }, [canView, navigate])

  // Week dates
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Load educator data
  useEffect(() => {
    loadEducatorData();
  }, []);

  // Load timetable data when educator is loaded
  useEffect(() => {
    if (educatorId && schoolId) {
      loadTimetableData();
    }
  }, [educatorId, schoolId, isCollegeEducator]);

  // Load slots when timetable is loaded
  useEffect(() => {
    if (timetableId) {
      loadSlots();
      loadPeriods();
    }
  }, [timetableId, isCollegeEducator]);

  // Load swap-related data when educator is loaded
  useEffect(() => {
    if (educatorId) {
      loadPendingSwapCount();
      loadActiveSwapRequests();
    }
  }, [educatorId]);

  const loadEducatorData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = userData.user.id;
      const userRole = userData.user.user_metadata?.user_role || userData.user.user_metadata?.role;

      // Check if user is a college educator - try college_lecturers table first
      if (userRole === 'college_educator') {
        const { data: collegeLecturerData, error: collegeLecturerError } = await supabase
          .from("college_lecturers")
          .select('id, first_name, last_name, "collegeId"')
          .eq("user_id", userId)
          .single();

        if (!collegeLecturerError && collegeLecturerData) {
          setEducatorId(collegeLecturerData.id);
          setEducatorName(`${collegeLecturerData.first_name} ${collegeLecturerData.last_name}`);
          // For college educators, we use collegeId as the school_id for timetable lookup
          setSchoolId(collegeLecturerData.collegeId);
          setIsCollegeEducator(true);
          
          // Load department info for college educator
          await loadDepartmentInfo(collegeLecturerData.id);
          // Load assigned classes
          await loadAssignedClasses(collegeLecturerData.id);
          return;
        }
        console.log("College lecturer lookup returned no results, trying school_educators...");
      }

      // Try school_educators table (for school educators or fallback)
      const { data: educatorData, error: educatorError } = await supabase
        .from("school_educators")
        .select("id, first_name, last_name, school_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!educatorError && educatorData) {
        setEducatorId(educatorData.id);
        setEducatorName(`${educatorData.first_name} ${educatorData.last_name}`);
        setSchoolId(educatorData.school_id);
        setIsCollegeEducator(false);
        return;
      }

      // If college educator but not found in either table, show helpful message
      if (userRole === 'college_educator') {
        console.error("College educator profile not found in college_lecturers or school_educators");
        throw new Error("Your educator profile has not been set up yet. Please contact your administrator.");
      }

      console.error("Educator lookup error:", educatorError);
      throw new Error("Educator profile not found");
    } catch (error) {
      console.error("Error loading educator data:", error);
      setLoading(false);
    }
  };

  const loadDepartmentInfo = async (lecturerId: string) => {
    try {
      // First get the department assignment
      const { data: assignment } = await supabase
        .from("department_faculty_assignments")
        .select("department_id, is_hod")
        .eq("lecturer_id", lecturerId)
        .eq("is_active", true)
        .maybeSingle();

      if (assignment?.department_id) {
        // Then get department details
        const { data: dept } = await supabase
          .from("departments")
          .select("id, name, code")
          .eq("id", assignment.department_id)
          .single();

        if (dept) {
          setDepartmentInfo({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            is_hod: assignment.is_hod || false
          });
        }
      }
    } catch (error) {
      console.log("No department assignment found for educator");
    }
  };

  const loadAssignedClasses = async (lecturerId: string) => {
    try {
      // First get class IDs assigned to this faculty
      const { data: assignments } = await supabase
        .from("college_faculty_class_assignments")
        .select("class_id")
        .eq("faculty_id", lecturerId);

      if (assignments && assignments.length > 0) {
        const classIds = assignments.map(a => a.class_id);
        
        // Then get class details
        const { data: classData } = await supabase
          .from("college_classes")
          .select("id, name, grade, section")
          .in("id", classIds);

        if (classData) {
          // Set class names for display
          setAssignedClasses(classData.map(c => c.name));
          // Set full class objects for dropdown
          setClasses(classData);
        }
      }
    } catch (error) {
      console.log("No class assignments found for educator");
    }
  };

  const loadTimetableData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      if (isCollegeEducator) {
        // Load college timetable
        const { data: timetable } = await supabase
          .from("college_timetables")
          .select("id, status")
          .eq("college_id", schoolId)
          .eq("academic_year", `${currentYear}-${currentYear + 1}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (timetable) {
          setTimetableId(timetable.id);
          setPublishStatus(timetable.status);
        }

        // Load college breaks
        const { data: breaksData } = await supabase
          .from("college_breaks")
          .select("*")
          .eq("college_id", schoolId)
          .order("start_date");

        if (breaksData) setBreaks(breaksData);

        // Note: For college educators, classes are loaded via loadAssignedClasses()
        // which only shows classes assigned to this educator
      } else {
        // Load school timetable
        const { data: timetable } = await supabase
          .from("timetables")
          .select("id, status")
          .eq("school_id", schoolId)
          .eq("academic_year", `${currentYear}-${currentYear + 1}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (timetable) {
          setTimetableId(timetable.id);
          setPublishStatus(timetable.status);
        }

        // Load school breaks
        const { data: breaksData } = await supabase
          .from("school_breaks")
          .select("*")
          .eq("school_id", schoolId)
          .order("start_date");

        if (breaksData) setBreaks(breaksData);

        // Load school classes
        const { data: classesData } = await supabase
          .from("school_classes")
          .select("id, name, grade, section")
          .eq("school_id", schoolId)
          .eq("account_status", "active")
          .order("grade");

        if (classesData) setClasses(classesData);
      }
    } catch (error) {
      console.error("Error loading timetable data:", error);
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      if (isCollegeEducator) {
        // Load college timetable slots
        const { data, error } = await supabase
          .from("college_timetable_slots")
          .select(`
            *,
            college_classes!college_timetable_slots_class_id_fkey(id, name)
          `)
          .eq("timetable_id", timetableId)
          .eq("educator_id", educatorId)
          .order("day_of_week")
          .order("period_number");

        if (error) throw error;

        const transformedSlots = (data || []).map((slot: any) => ({
          ...slot,
          class_name: slot.college_classes?.name || "N/A",
        }));

        setSlots(transformedSlots);
      } else {
        // Load school timetable slots
        const { data, error } = await supabase
          .from("timetable_slots")
          .select(`
            *,
            school_classes!timetable_slots_class_id_fkey(id, name, grade, section)
          `)
          .eq("timetable_id", timetableId)
          .eq("educator_id", educatorId)
          .order("day_of_week")
          .order("period_number");

        if (error) throw error;

        const transformedSlots = (data || []).map((slot: any) => ({
          ...slot,
          class_name: slot.school_classes?.name || 
            (slot.school_classes?.grade && slot.school_classes?.section 
              ? `${slot.school_classes.grade}-${slot.school_classes.section}` 
              : "N/A"),
        }));

        setSlots(transformedSlots);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    try {
      if (isCollegeEducator) {
        // Load college time periods
        const { data } = await supabase
          .from("college_time_periods")
          .select("*")
          .eq("timetable_id", timetableId)
          .order("period_number");

        if (data && data.length > 0) {
          setPeriods(data);
        }
      } else {
        // Load school time periods
        const { data } = await supabase
          .from("school_time_periods")
          .select("*")
          .eq("timetable_id", timetableId)
          .order("period_number");

        if (data && data.length > 0) {
          setPeriods(data);
        }
      }
    } catch (error) {
      console.error("Error loading periods:", error);
    }
  };

  // Navigation handlers
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart());
  };

  // Swap Request Handlers
  const loadPendingSwapCount = async () => {
    try {
      const count = await getPendingSwapCount(educatorId);
      setPendingSwapCount(count);
    } catch (error) {
      console.error('Error loading pending swap count:', error);
    }
  };

  const loadActiveSwapRequests = async () => {
    try {
      const { data } = await getSwapRequests(educatorId, { 
        status: 'pending' 
      });
      if (data) {
        setActiveSwapRequests(data);
      }
    } catch (error) {
      console.error('Error loading active swap requests:', error);
    }
  };

  const handleInitiateSwap = async (slot: TimetableSlot) => {
    if (!canCreate) {
      console.log('❌ [MyTimetable] Action Blocked: Initiate Swap - No Create Permission');
      alert('❌ Access Denied: You need CREATE permission to send swap requests');
      return;
    }
    
    console.log('📅 [MyTimetable] Action: Initiate Swap Request', {
      userRole: user?.role,
      module: 'Classroom Management',
      action: 'Send Swap Request',
      permissions: {
        canView: canView.allowed,
        canCreate: canCreate.allowed,
        canEdit: canEdit.allowed
      },
      slotId: slot.id,
      timestamp: new Date().toISOString()
    });
    
    setSelectedSlotForSwap(slot);
    
    // Load available slots for swapping
    const { data, error } = await getAvailableSlotsForSwap(
      slot.id!,
      educatorId,
      isCollegeEducator
    );
    
    if (data) {
      setAvailableSlotsForSwap(data);
      setShowSwapModal(true);
    } else {
      alert('Failed to load available slots for swapping. Please try again.');
    }
  };

  const handleSubmitSwapRequest = async (payload: CreateSwapRequestPayload) => {
    const { data, error } = await createSwapRequest(payload);
    
    if (error) {
      throw error;
    }
    
    // Show success message
    alert('Swap request sent successfully! The target educator will be notified.');
    
    // Reload data
    loadPendingSwapCount();
    loadActiveSwapRequests();
    
    // Close modal
    setShowSwapModal(false);
    setSelectedSlotForSwap(null);
  };

  const getSlotSwapStatus = (slotId: string) => {
    const swapRequest = activeSwapRequests.find(
      req => req.requester_slot_id === slotId || req.target_slot_id === slotId
    );
    return swapRequest;
  };

  // Get slot for a specific cell
  const getSlotForCell = (dayIndex: number, periodNum: number, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = dayIndex + 1;

    // Check if this period is a break period - if so, don't show any slots
    const currentPeriod = periods.find(p => p.period_number === periodNum);
    if (currentPeriod && (
      currentPeriod.is_break || 
      currentPeriod.period_name?.toLowerCase().includes('break') ||
      currentPeriod.period_name?.toLowerCase().includes('lunch')
    )) {
      return null; // Never show slots during break periods
    }

    // Filter by class if selected
    const filteredSlots = selectedClassFilter
      ? slots.filter((s) => s.class_id === selectedClassFilter)
      : slots;

    // Check for date-specific slot first
    const dateSpecificSlot = filteredSlots.find(
      (s) => s.period_number === periodNum && !s.is_recurring && s.schedule_date === dateStr
    );
    if (dateSpecificSlot) return dateSpecificSlot;

    // Then check for recurring slot
    const recurringSlot = filteredSlots.find(
      (s) => s.day_of_week === dayOfWeek && s.period_number === periodNum && s.is_recurring !== false
    );
    return recurringSlot || null;
  };

  // Get week range string
  const getWeekRange = () => {
    const start = formatDate(weekDates[0]);
    const end = formatDate(weekDates[5]);
    return `${start} - ${end}, ${weekDates[0].getFullYear()}`;
  };

  // Calculate statistics
  const totalPeriods = slots.length;
  const todayPeriods = slots.filter((s) => s.day_of_week === (new Date().getDay() || 7)).length;
  const uniqueClasses = [...new Set(slots.map((s) => s.class_id))].length;

  if (loading && !educatorId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show access denied if no view permission - same as Program Sections
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XMarkIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Classroom Management module.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/educator/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex overflow-y-auto mb-4 flex-col h-screen">
      {/* Permission Debug Panel - Only in development - same as Program Sections */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                📅 Educator Permission Debug - Classroom Management (Timetable)
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>User Role:</strong> {user?.role}</p>
                <p><strong>Module:</strong> Classroom Management</p>
                <div className="flex gap-4 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canView ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    View: {canView ? '✅' : '❌'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canCreate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Create: {canCreate ? '✅' : '❌'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    canEdit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    Edit: {canEdit ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
      
      <div className="flex h-full bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Educator Info Card - without name */}
        {isCollegeEducator && departmentInfo && (
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span className="text-gray-700">{departmentInfo.name}</span>
              </div>
              {departmentInfo.is_hod && (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Head of Department
                  </span>
                </div>
              )}
              {assignedClasses.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <BookOpen className="h-3 w-3" />
                    <span>Assigned Classes:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {assignedClasses.slice(0, 3).map((cls, idx) => (
                      <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                        {cls}
                      </span>
                    ))}
                    {assignedClasses.length > 3 && (
                      <span className="text-xs text-gray-500">+{assignedClasses.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </h3>

          <div className="space-y-3">

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.grade && c.section ? `(${c.grade}-${c.section})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Breaks & Holidays */}
        <div className="p-4 border-b border-gray-200 flex-1 overflow-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4" /> Breaks & Holidays
          </h3>

          <div className="space-y-2">
            {breaks.filter(b => b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam").map((b) => (
              <div
                key={b.id}
                className={`p-2 border rounded-lg text-xs ${
                  b.break_type === "holiday"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : b.break_type === "event"
                    ? "bg-purple-50 border-purple-200 text-purple-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <div className="font-medium">{b.name}</div>
                <div className="opacity-80 mt-1">
                  {b.start_date} {b.end_date !== b.start_date && `- ${b.end_date}`}
                </div>
              </div>
            ))}
            {breaks.filter(b => b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam").length === 0 && (
              <p className="text-xs text-gray-500 italic">No breaks or holidays added</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">My Schedule</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Periods/Week</span>
              <span className="font-semibold text-gray-900">{totalPeriods}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Today's Classes</span>
              <span className="font-semibold text-indigo-600">{todayPeriods}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Classes Assigned</span>
              <span className="font-semibold text-gray-900">{uniqueClasses}</span>
            </div>
          </div>
        </div>

        {/* Swap Requests Statistics */}
        {activeSwapRequests.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Swap Requests
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending Received</span>
                <span className="font-semibold text-amber-600">{pendingSwapCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Active</span>
                <span className="font-semibold text-gray-900">{activeSwapRequests.length}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (!canView) {
                  console.log('❌ [MyTimetable] Action Blocked: View All Requests - No View Permission');
                  alert('❌ Access Denied: You need VIEW permission to view swap requests');
                  return;
                }
                console.log('📅 [MyTimetable] Action: View All Requests Clicked', {
                  userRole: user?.role,
                  module: 'Classroom Management',
                  action: 'View Swap Requests',
                  permissions: {
                    canView: canView.allowed,
                    canCreate: canCreate.allowed,
                    canEdit: canEdit.allowed
                  },
                  timestamp: new Date().toISOString()
                });
                setShowSwapDashboard(true);
              }}
              disabled={!canView.allowed}
              className={`w-full mt-3 px-3 py-2 text-xs font-medium rounded-lg transition ${
                canView.allowed
                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
                  : 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-50 blur-sm'
              }`}
              title={canView.allowed ? 'View All Requests' : '❌ No VIEW permission'}
            >
              View All Requests
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded"></div>
              <span className="text-gray-600">Scheduled Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 bg-gray-200 rounded"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #ccc, #ccc 2px, transparent 2px, transparent 4px)",
                }}
              ></div>
              <span className="text-gray-600">Break</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-gray-600">Free Period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Timetable Builder</h1>
              <p className="text-sm text-gray-500">Schedule classes by date with break management</p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  publishStatus === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {publishStatus === "published" ? "Published" : "Draft"}
              </span>

              {/* Swap Requests Button with Notification Badge */}
              <button 
                onClick={() => {
                  if (!canView) {
                    console.log('❌ [MyTimetable] Action Blocked: Swap Requests Button - No View Permission');
                    alert('❌ Access Denied: You need VIEW permission to view swap requests');
                    return;
                  }
                  console.log('📅 [MyTimetable] Action: Swap Requests Button Clicked', {
                    userRole: user?.role,
                    module: 'Classroom Management',
                    action: 'View Swap Requests',
                    permissions: {
                      canView: canView.allowed,
                      canCreate: canCreate.allowed,
                      canEdit: canEdit.allowed
                    },
                    timestamp: new Date().toISOString()
                  });
                  setShowSwapDashboard(true);
                }}
                disabled={!canView.allowed}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
                  canView.allowed
                    ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
                    : 'text-gray-400 bg-gray-50 cursor-not-allowed opacity-50 blur-sm'
                }`}
                title={canView.allowed ? 'Swap Requests' : '❌ No VIEW permission'}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Swap Requests</span>
                {pendingSwapCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {pendingSwapCount}
                  </span>
                )}
              </button>

              <button className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => navigateWeek("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span className="text-lg font-semibold text-gray-900">{getWeekRange()}</span>
            </div>

            <button
              onClick={() => navigateWeek("next")}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[900px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200">
                      Time
                    </th>
                    {DAYS.map((day, index) => {
                      const date = weekDates[index];
                      const holiday = isHoliday(date, breaks);
                      const breakInfo = getBreakInfo(date, breaks);
                      const breakType = breakInfo?.break_type || "holiday";
                      const headerBgColor = BREAK_BG_COLORS[breakType] || "bg-red-50";
                      const headerTextColor = BREAK_TEXT_COLORS[breakType] || "text-red-600";

                      return (
                        <th
                          key={day}
                          className={`px-3 py-3 text-center border-b border-r border-gray-200 last:border-r-0 ${
                            holiday ? headerBgColor : ""
                          }`}
                        >
                          <div className="text-xs font-semibold text-gray-900">{day}</div>
                          <div
                            className={`text-xs mt-0.5 ${
                              holiday ? `${headerTextColor} font-medium` : "text-gray-500"
                            }`}
                          >
                            {formatDate(date)}
                            {holiday && breakInfo && (
                              <span className="block text-[10px]">{breakInfo.name}</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.period_number} className={period.is_break ? "bg-gray-100" : ""}>
                      <td className="px-3 py-2 border-b border-r border-gray-200 bg-gray-50">
                        <div className="text-xs font-medium text-gray-900">{period.period_name}</div>
                        <div className="text-[10px] text-gray-500">
                          {period.start_time} - {period.end_time}
                        </div>
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const date = weekDates[dayIndex];
                        const holiday = isHoliday(date, breaks);
                        const breakInfo = getBreakInfo(date, breaks);
                        const breakType = breakInfo?.break_type || "holiday";

                        if (holiday) {
                          const cellBgColor = BREAK_BG_COLORS[breakType] || "bg-red-50";
                          return (
                            <td
                              key={dayIndex}
                              className={`px-2 py-2 border-b border-r border-gray-200 last:border-r-0 ${cellBgColor}`}
                            >
                              <div className="h-14 flex items-center justify-center">
                                <Sun className="h-4 w-4 text-red-400" />
                              </div>
                            </td>
                          );
                        }

                        // Check if this is a break period (by flag or name)
                        const isBreakPeriod = period.is_break || 
                          period.period_name?.toLowerCase().includes('break') ||
                          period.period_name?.toLowerCase().includes('lunch');

                        if (isBreakPeriod) {
                          return (
                            <td
                              key={dayIndex}
                              className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0 bg-gray-100"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 2px, #f3f4f6 2px, #f3f4f6 4px)",
                              }}
                            >
                              <div className="h-14 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-1">
                                  <Coffee className="h-5 w-5 text-gray-500" />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {period.period_name?.toLowerCase().includes('lunch') ? 'Lunch' : 'Break'}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        const slot = getSlotForCell(dayIndex, period.period_number, date);
                        const swapStatus = slot?.id ? getSlotSwapStatus(slot.id) : null;

                        return (
                          <td
                            key={dayIndex}
                            className={`px-2 py-2 border-b border-r border-gray-200 last:border-r-0 ${
                              slot ? "" : "bg-green-50"
                            }`}
                          >
                            {slot ? (
                              <div className="relative group">
                                <div
                                  className={`p-2 rounded-lg border text-xs h-14 overflow-hidden ${getSlotColor(
                                    slot.subject_name
                                  )}`}
                                >
                                  <div className="font-semibold truncate">{slot.subject_name}</div>
                                  <div className="flex items-center gap-1 text-[10px] opacity-80 mt-1">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{slot.class_name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] opacity-70">
                                    <MapPin className="h-3 w-3" />
                                    <span>{slot.room_number}</span>
                                  </div>
                                </div>
                                
                                {/* Swap Button (appears on hover) */}
                                <button
                                  onClick={() => handleInitiateSwap(slot)}
                                  disabled={!canCreate.allowed}
                                  className={`absolute top-1 right-1 p-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity ${
                                    canCreate.allowed
                                      ? 'bg-white hover:bg-indigo-50 cursor-pointer'
                                      : 'bg-gray-100 cursor-not-allowed opacity-50 blur-sm'
                                  }`}
                                  title={canCreate.allowed ? 'Request Class Swap' : '❌ No CREATE permission'}
                                >
                                  <RefreshCw className="h-3 w-3 text-indigo-600" />
                                </button>

                                {/* Swap Status Badge */}
                                {swapStatus && (
                                  <div 
                                    className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
                                      swapStatus.status === 'pending' ? 'bg-yellow-400' :
                                      swapStatus.status === 'accepted' ? 'bg-blue-400' :
                                      swapStatus.admin_approval_status === 'approved' ? 'bg-green-400' :
                                      'bg-gray-400'
                                    }`}
                                    title={`Swap ${swapStatus.status}`}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="h-14 flex items-center justify-center text-green-400">
                                <span className="text-xs">Free</span>
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
          )}
        </div>
      </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && selectedSlotForSwap && (
        <SwapRequestModal
          isOpen={showSwapModal}
          onClose={() => {
            setShowSwapModal(false);
            setSelectedSlotForSwap(null);
          }}
          currentSlot={{
            id: selectedSlotForSwap.id!,
            subject_name: selectedSlotForSwap.subject_name,
            class_name: selectedSlotForSwap.class_name || 'N/A',
            room_number: selectedSlotForSwap.room_number,
            day_of_week: selectedSlotForSwap.day_of_week,
            period_number: selectedSlotForSwap.period_number,
            start_time: selectedSlotForSwap.start_time,
            end_time: selectedSlotForSwap.end_time,
            educator_id: educatorId,
          }}
          availableSlots={availableSlotsForSwap}
          onSubmit={handleSubmitSwapRequest}
          facultyId={educatorId}
        />
      )}

      {/* Swap Requests Dashboard Modal */}
      {showSwapDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-600" />
                Swap Requests Dashboard
              </h2>
              <button
                onClick={() => setShowSwapDashboard(false)}
                className="p-2 hover:bg-white rounded-lg transition"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SwapRequestsDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTimetable;
