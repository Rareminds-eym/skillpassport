/* eslint-disable @typescript-eslint/no-explicit-any */
import AddAttendanceSessionModal from "@/components/admin/modals/AddAttendanceSessionModal";
import AttendanceDetailsModal from "@/components/admin/modals/AttendanceDetailsModal";
import StudentHistoryModal from "@/components/admin/modals/StudentHistoryModal";
import { supabase } from "@/lib/supabaseClient";
import { AttendanceRecord, AttendanceSession, SubjectGroup, Student as AttendanceStudent } from "@/types/Attendance";
import { Student as ProfileStudent } from "@/types/student";
import { curriculumService } from "@/services/college/curriculumService";
import toast from "react-hot-toast";
import {
    ArrowDownTrayIcon,
    BellAlertIcon,
    BookOpenIcon,
    CalendarIcon,
    ChartBarIcon,
    ChartPieIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationCircleIcon,
    FunnelIcon,
    PlusCircleIcon,
    ShieldCheckIcon,
    SparklesIcon,
    Squares2X2Icon,
    TableCellsIcon,
    UserGroupIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import KPICard from "../../../components/admin/KPICard";
import Pagination from "../../../components/admin/Pagination";
import SearchBar from "../../../components/common/SearchBar";



// ==================== UTILITIES ====================
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusConfig = (status: string) => {
  const configs = {
    present: {
      color: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: CheckCircleIcon,
      label: "Present",
    },
    absent: {
      color: "from-rose-500 to-red-500",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      icon: XCircleIcon,
      label: "Absent",
    },
    late: {
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: ClockIcon,
      label: "Late",
    },
    excused: {
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: ShieldCheckIcon,
      label: "Excused",
    },
    "not-marked": {
      color: "from-gray-400 to-gray-500",
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: ExclamationCircleIcon,
      label: "Not Marked",
    },
    completed: {
      color: "from-emerald-500 to-green-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: CheckCircleIcon,
      label: "Completed",
    },
    ongoing: {
      color: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: SparklesIcon,
      label: "Ongoing",
    },
    scheduled: {
      color: "from-gray-400 to-gray-500",
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: CalendarIcon,
      label: "Scheduled",
    },
  };
  return configs[status as keyof typeof configs] || configs.scheduled;
};

// ==================== SUB-COMPONENTS ====================

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        type="button"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => (
  <>
    {options.map((opt: any) => (
      <label
        key={opt.value}
        className="flex items-center text-sm text-gray-700"
      >
        <input
          type="checkbox"
          checked={selectedValues.includes(opt.value)}
          onChange={(e) => {
            if (e.target.checked) onChange([...selectedValues, opt.value]);
            else onChange(selectedValues.filter((v: string) => v !== opt.value));
          }}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span className="ml-2">{opt.label}</span>
        {opt.count !== undefined && (
          <span className="ml-auto text-xs text-gray-500">({opt.count})</span>
        )}
      </label>
    ))}
  </>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text} border ${config.border} font-medium text-xs shadow-sm`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

const EnhancedSubjectCard = ({ subjectGroup, onView }: any) => {
  const attendanceColor =
    subjectGroup.avgAttendancePercentage >= 75 ? 'from-emerald-500 to-green-500' :
    subjectGroup.avgAttendancePercentage >= 50 ? 'from-amber-500 to-orange-500' :
    'from-rose-500 to-red-500';

  return (
    <div
      onClick={() => onView(subjectGroup)}
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 cursor-pointer"
    >
      <div className={`h-1.5 bg-gradient-to-r ${attendanceColor}`} />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${attendanceColor} shadow-md`}>
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate text-lg">
                  {subjectGroup.subject}
                </h3>
                <p className="text-sm text-gray-600 truncate">{subjectGroup.faculty}</p>
              </div>
            </div>
          </div>
          <StatusBadge status={subjectGroup.latestStatus} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <CalendarIcon className="h-4 w-4" />
            <span className="text-xs">
              {subjectGroup.totalSessions === 1 
                ? formatDate(subjectGroup.dateRange.first)
                : `${formatDate(subjectGroup.dateRange.first)} - ${formatDate(subjectGroup.dateRange.last)}`
              }
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span>{subjectGroup.totalSessions} Session{subjectGroup.totalSessions !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="relative mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Average Attendance</span>
            <span className={`text-2xl font-bold bg-gradient-to-r ${attendanceColor} bg-clip-text text-transparent`}>
              {subjectGroup.avgAttendancePercentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${attendanceColor} rounded-full transition-all duration-500 shadow-lg`}
              style={{ width: `${subjectGroup.avgAttendancePercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
            <p className="text-lg font-bold text-emerald-700">{subjectGroup.totalPresentCount}</p>
            <p className="text-xs text-emerald-600 font-medium">Present</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl border border-rose-100">
            <p className="text-lg font-bold text-rose-700">{subjectGroup.totalAbsentCount}</p>
            <p className="text-xs text-rose-600 font-medium">Absent</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
            <p className="text-lg font-bold text-amber-700">{subjectGroup.totalLateCount}</p>
            <p className="text-xs text-amber-600 font-medium">Late</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-lg font-bold text-blue-700">{subjectGroup.totalExcusedCount}</p>
            <p className="text-xs text-blue-600 font-medium">Excused</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
            {subjectGroup.department}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-xs font-medium text-indigo-700">
            {subjectGroup.course}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-xs font-medium text-purple-700">
            Sem {subjectGroup.semester} - {subjectGroup.section}
          </span>
        </div>

        <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const AttendanceTracking: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedSubjectGroup, setSelectedSubjectGroup] =
    useState<SubjectGroup | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceStudent | null>(null);
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    department: "",
    course: "",
    semester: "",
    section: "",
    subject: "",
    faculty: "",
    date: "",
    startTime: "",
    endTime: "",
    roomNumber: "",
    remarks: "",
    totalStudents: 0,
  });

  // Dynamic data states
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    completedSessions: 0,
    avgAttendance: "0",
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    lowAttendanceSessions: 0,
  });

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState({
    departments: [] as any[],
    courses: [] as any[],
    semesters: [] as any[],
    sections: [] as any[],
    faculty: [] as any[],
    subjects: [] as any[],
  });

  // Cascading dropdown states (similar to curriculum builder)
  const [departmentsData, setDepartmentsData] = useState<any[]>([]);
  const [programsData, setProgramsData] = useState<any[]>([]);
  const [semestersData, setSemestersData] = useState<number[]>([]);
  const [coursesData, setCoursesData] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    departments: [] as string[],
    courses: [] as string[],
    semesters: [] as number[],
    sections: [] as string[],
    statuses: [] as string[],
    faculty: [] as string[],
  });

  // Supabase Functions
  const fetchSubjectGroups = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('college_subject_attendance_summary')
        .select('*');

      // Add search filter
      if (searchQuery) {
        query = query.or(`subject.ilike.%${searchQuery}%,faculty.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`);
      }

      // Add filters
      if (filters.departments.length > 0) {
        query = query.in('department', filters.departments);
      }
      if (filters.courses.length > 0) {
        query = query.in('course', filters.courses);
      }
      if (filters.semesters.length > 0) {
        query = query.in('semester', filters.semesters);
      }
      if (filters.sections.length > 0) {
        query = query.in('section', filters.sections);
      }
      if (filters.statuses.length > 0) {
        query = query.in('latest_status', filters.statuses);
      }
      if (filters.faculty.length > 0) {
        query = query.in('faculty', filters.faculty);
      }

      // Add date range filter
      if (dateRange.from || dateRange.to) {
        if (dateRange.from && dateRange.to) {
          query = query.gte('first_date', dateRange.from).lte('last_date', dateRange.to);
        } else if (dateRange.from) {
          query = query.gte('first_date', dateRange.from);
        } else if (dateRange.to) {
          query = query.lte('last_date', dateRange.to);
        }
      }

      // Add pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      query = query.range(startIndex, startIndex + itemsPerPage - 1);

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform Supabase data to match component structure
      const transformedGroups = (data || []).map((item: any) => ({
        subject: item.subject,
        department: item.department,
        course: item.course,
        semester: item.semester,
        section: item.section,
        faculty: item.faculty,
        sessions: [], // Will be populated when needed
        totalSessions: item.total_sessions,
        avgAttendancePercentage: item.avg_attendance_percentage,
        totalStudents: item.total_students,
        totalPresentCount: item.total_present_count,
        totalAbsentCount: item.total_absent_count,
        totalLateCount: item.total_late_count,
        totalExcusedCount: item.total_excused_count,
        dateRange: {
          first: item.first_date,
          last: item.last_date,
        },
        latestStatus: item.latest_status,
      }));

      setSubjectGroups(transformedGroups);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('college_attendance_sessions')
        .select(`
          id,
          status,
          attendance_percentage,
          total_students,
          present_count,
          absent_count
        `)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 30 days

      if (error) throw error;

      const sessions = data || [];
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const avgAttendance = sessions.length > 0 
        ? (sessions.reduce((acc, s) => acc + (s.attendance_percentage || 0), 0) / sessions.length).toFixed(1)
        : "0";
      const totalStudents = sessions.reduce((acc, s) => acc + (s.total_students || 0), 0);
      const totalPresent = sessions.reduce((acc, s) => acc + (s.present_count || 0), 0);
      const totalAbsent = sessions.reduce((acc, s) => acc + (s.absent_count || 0), 0);
      const lowAttendanceSessions = sessions.filter(s => (s.attendance_percentage || 0) < 75).length;

      setAnalytics({
        totalSessions,
        completedSessions,
        avgAttendance,
        totalStudents,
        totalPresent,
        totalAbsent,
        lowAttendanceSessions,
      });
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get current user's college_id first
      const { data: { user } } = await supabase.auth.getUser();
      let currentCollegeId = null;
      
      if (user) {
        // Try to get college_id from user metadata or users table
        if (user.user_metadata?.college_id) {
          currentCollegeId = user.user_metadata.college_id;
        } else {
          const { data: userProfile } = await supabase
            .from('users')
            .select('college_id')
            .eq('id', user.id)
            .single();
          currentCollegeId = userProfile?.college_id;
        }
      }

      console.log('Current user college_id:', currentCollegeId);

      // Get departments from program_sections_view (filtered by college if available)
      let departmentsQuery = supabase
        .from('program_sections_view')
        .select('department_name')
        .eq('status', 'active')
        .not('department_name', 'is', null);
      
      if (currentCollegeId) {
        // Add college filter if we have college_id
        departmentsQuery = departmentsQuery.eq('college_id', currentCollegeId);
      }

      const { data: departmentsData } = await departmentsQuery;

      // Get programs/courses from program_sections_view (filtered by college)
      let programsQuery = supabase
        .from('program_sections_view')
        .select('program_name')
        .eq('status', 'active')
        .not('program_name', 'is', null);
      
      if (currentCollegeId) {
        programsQuery = programsQuery.eq('college_id', currentCollegeId);
      }

      const { data: programsData } = await programsQuery;

      // Get semesters from program_sections_view (filtered by college)
      let semestersQuery = supabase
        .from('program_sections_view')
        .select('semester')
        .eq('status', 'active')
        .not('semester', 'is', null);
      
      if (currentCollegeId) {
        semestersQuery = semestersQuery.eq('college_id', currentCollegeId);
      }

      const { data: semestersData } = await semestersQuery;

      // Get sections from program_sections_view (filtered by college)
      let sectionsQuery = supabase
        .from('program_sections_view')
        .select('section')
        .eq('status', 'active')
        .not('section', 'is', null);
      
      if (currentCollegeId) {
        sectionsQuery = sectionsQuery.eq('college_id', currentCollegeId);
      }

      const { data: sectionsData } = await sectionsQuery;

      // Get faculty from college_lecturers table (filtered by college)
      // Note: colleges table doesn't exist - fetch college name from organizations separately
      let facultyQuery = supabase
        .from('college_lecturers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          department,
          "collegeId"
        `)
        .eq('"accountStatus"', 'active');

      if (currentCollegeId) {
        facultyQuery = facultyQuery.eq('"collegeId"', currentCollegeId);
      }

      const { data: facultyData, error: facultyError } = await facultyQuery;

      console.log('Faculty query result:', { data: facultyData, error: facultyError });

      // Get subjects from college_courses (filtered by college)
      let subjectsQuery = supabase
        .from('college_courses')
        .select('course_name, course_code, id, college_id')
        .eq('is_active', true);

      if (currentCollegeId) {
        subjectsQuery = subjectsQuery.eq('college_id', currentCollegeId);
      }

      const { data: subjectsData } = await subjectsQuery;

      // Remove duplicates and format data
      const uniqueDepartments = [...new Set((departmentsData || []).map(d => d.department_name))];
      const uniquePrograms = [...new Set((programsData || []).map(p => p.program_name))];
      const uniqueSemesters = [...new Set((semestersData || []).map(s => s.semester))].sort((a, b) => a - b);
      const uniqueSections = [...new Set((sectionsData || []).map(s => s.section))].sort();

      // Format faculty for dropdown (simple format expected by modal)
      const facultyOptions = (facultyData || []).map(f => {
        const displayName = f.first_name && f.last_name 
          ? `${f.first_name} ${f.last_name}` 
          : f.email;
        
        const collegeName = f.collegeId || 'Unknown College';
        
        console.log(`Faculty: ${displayName} belongs to college: ${collegeName} (ID: ${f.collegeId})`);
        
        return {
          value: f.id, // Use actual faculty UUID
          label: `${displayName} (${f.department || 'No Dept'})`, // Show name and department
        };
      });

      console.log('Filter Options Loaded:', {
        currentCollegeId,
        departments: uniqueDepartments.length,
        programs: uniquePrograms.length,
        semesters: uniqueSemesters.length,
        sections: uniqueSections.length,
        faculty: facultyOptions.length,
        subjects: (subjectsData || []).length
      });

      console.log('Faculty list with colleges:', facultyOptions);

      setFilterOptions({
        departments: uniqueDepartments,
        courses: uniquePrograms,
        semesters: uniqueSemesters,
        sections: uniqueSections,
        faculty: facultyOptions,
        subjects: subjectsData || [],
      });
    } catch (err: any) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchAttendanceRecords = async (subjectName: string) => {
    try {
      const { data, error } = await supabase
        .from('college_attendance_records')
        .select('*')
        .eq('subject_name', subjectName);

      if (error) throw error;
      
      // Transform Supabase data to match component structure
      const transformedRecords = (data || []).map((record: any) => ({
        id: record.id,
        studentId: record.student_id,
        studentName: record.student_name,
        rollNumber: record.roll_number,
        department: record.department_name,
        course: record.program_name,
        semester: record.semester,
        section: record.section,
        date: record.date,
        status: record.status,
        timeIn: record.time_in,
        timeOut: record.time_out,
        subject: record.subject_name,
        facultyId: record.faculty_id,
        facultyName: record.faculty_name,
        location: record.location,
        remarks: record.remarks,
      }));

      setAttendanceRecords(transformedRecords);
    } catch (err: any) {
      console.error('Failed to fetch attendance records:', err);
    }
  };

  const fetchStudentCount = async (department: string, course: string, semester: string, section: string) => {
    try {
      console.log('Fetching student count for:', { department, course, semester, section });
      
      const { data, error } = await supabase
        .from('program_sections_view')
        .select('max_students, department_name, program_name, semester, section, status')
        .eq('department_name', department)
        .eq('program_name', course)
        .eq('semester', parseInt(semester))
        .eq('section', section)
        .eq('status', 'active');

      console.log('Student count query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('Found matching record:', data[0]);
        return data[0].max_students || 0;
      } else {
        console.log('No matching records found');
        return 0;
      }
    } catch (err: any) {
      console.error('Failed to fetch student count:', err);
      return 0;
    }
  };

  // Cascading dropdown load functions (similar to curriculum builder)
  const loadDepartments = async () => {
    try {
      const result = await curriculumService.getDepartments();
      if (result.success) {
        setDepartmentsData(result.data || []);
      } else {
        toast.error('Failed to load departments');
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const result = await curriculumService.getPrograms(departmentId);
      if (result.success) {
        setProgramsData(result.data || []);
      } else {
        toast.error('Failed to load programs');
        setProgramsData([]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
      setProgramsData([]);
    }
  };

  const loadSemesters = async (programId: string) => {
    try {
      const result = await curriculumService.getSemesters(programId);
      if (result.success) {
        setSemestersData(result.data || []);
      } else {
        toast.error('Failed to load semesters');
        setSemestersData([]);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
      setSemestersData([]);
    }
  };

  const loadCourses = async (programId: string, semester: number) => {
    try {
      const result = await curriculumService.getCourses(programId, semester);
      if (result.success) {
        setCoursesData(result.data || []);
      } else {
        toast.error('Failed to load courses');
        setCoursesData([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
      setCoursesData([]);
    }
  };

  // useEffect hooks
  useEffect(() => {
    fetchSubjectGroups();
  }, [searchQuery, filters, dateRange, currentPage]);

  useEffect(() => {
    fetchAnalytics();
    fetchFilterOptions();
    loadDepartments(); // Load departments on mount
  }, []);

  // Cascading dropdown effects (similar to curriculum builder)
  useEffect(() => {
    if (sessionFormData.department) {
      loadPrograms(sessionFormData.department);
    } else {
      setProgramsData([]);
      setSessionFormData(prev => ({ ...prev, course: '' }));
    }
  }, [sessionFormData.department]);

  useEffect(() => {
    if (sessionFormData.course) {
      loadSemesters(sessionFormData.course);
    } else {
      setSemestersData([]);
      setSessionFormData(prev => ({ ...prev, semester: '' }));
    }
  }, [sessionFormData.course]);

  useEffect(() => {
    if (sessionFormData.course && sessionFormData.semester) {
      loadCourses(sessionFormData.course, parseInt(sessionFormData.semester));
    } else {
      setCoursesData([]);
      setSessionFormData(prev => ({ ...prev, subject: '' }));
    }
  }, [sessionFormData.course, sessionFormData.semester]);

  // Transform filter options for component use
  const departmentOptions = useMemo(() => {
    return filterOptions.departments.map(dept => ({
      value: dept,
      label: dept,
      count: subjectGroups.filter(g => g.department === dept).length,
    }));
  }, [filterOptions.departments, subjectGroups]);

  const courseOptions = useMemo(() => {
    return filterOptions.courses.map(course => ({
      value: course,
      label: course,
      count: subjectGroups.filter(g => g.course === course).length,
    }));
  }, [filterOptions.courses, subjectGroups]);

  const semesterOptions = useMemo(() => {
    return filterOptions.semesters.map(sem => ({
      value: sem,
      label: `Semester ${sem}`,
      count: subjectGroups.filter(g => g.semester === sem).length,
    }));
  }, [filterOptions.semesters, subjectGroups]);

  const sectionOptions = useMemo(() => {
    return filterOptions.sections.map(sec => ({
      value: sec,
      label: `Section ${sec}`,
      count: subjectGroups.filter(g => g.section === sec).length,
    }));
  }, [filterOptions.sections, subjectGroups]);

  const statusOptions = [
    { value: "completed", label: "Completed", count: subjectGroups.filter(g => g.latestStatus === "completed").length },
    { value: "ongoing", label: "Ongoing", count: subjectGroups.filter(g => g.latestStatus === "ongoing").length },
    { value: "scheduled", label: "Scheduled", count: subjectGroups.filter(g => g.latestStatus === "scheduled").length },
  ];

  const facultyFilterOptions = useMemo(() => {
    return filterOptions.faculty.map(fac => ({
      value: fac.value, // Use the faculty ID
      label: fac.label, // Use the formatted name
      count: subjectGroups.filter(g => g.faculty === fac.label).length,
    }));
  }, [filterOptions.faculty, subjectGroups]);

  const subjectOptions = useMemo(() => {
    return filterOptions.subjects.map(subj => ({
      value: subj.course_name,
      label: subj.course_name,
    }));
  }, [filterOptions.subjects]);

  // Filtered subject groups (now using API data)
  const filteredSubjectGroups = useMemo(() => {
    return subjectGroups; // Filtering is now done on the server side
  }, [subjectGroups]);

  const totalItems = filteredSubjectGroups.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubjectGroups = filteredSubjectGroups.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters({
      departments: [],
      courses: [],
      semesters: [],
      sections: [],
      statuses: [],
      faculty: [],
    });
    setDateRange({ from: "", to: "" });
  };

  const handleViewDetails = async (subjectGroup: SubjectGroup) => {
    try {
      // Fetch actual sessions for this subject group
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('college_attendance_sessions')
        .select('*')
        .eq('subject_name', subjectGroup.subject)
        .eq('department_name', subjectGroup.department)
        .eq('program_name', subjectGroup.course)
        .eq('semester', subjectGroup.semester)
        .eq('section', subjectGroup.section)
        .order('date', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        alert('Error loading session details');
        return;
      }

      // Transform sessions data to match expected format
      const transformedSessions = (sessionsData || []).map((session: any) => ({
        id: session.id,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        subject: session.subject_name,
        faculty: session.faculty_name,
        department: session.department_name,
        course: session.program_name,
        semester: session.semester,
        section: session.section,
        totalStudents: session.total_students,
        presentCount: session.present_count,
        absentCount: session.absent_count,
        lateCount: session.late_count,
        excusedCount: session.excused_count,
        attendancePercentage: session.attendance_percentage,
        status: session.status,
      }));

      // Update the subject group with actual sessions data
      const updatedSubjectGroup = {
        ...subjectGroup,
        sessions: transformedSessions,
      };

      setSelectedSubjectGroup(updatedSubjectGroup);
      
      // Fetch attendance records for this subject
      await fetchAttendanceRecords(subjectGroup.subject);
      
      setShowDetailsModal(true);
    } catch (err: any) {
      console.error('Error in handleViewDetails:', err);
      alert('Error loading details');
    }
  };

  const handleEdit = (subjectGroup: SubjectGroup) => {
    console.log("Edit subject group:", subjectGroup);
    // Implement edit logic
  };

  const handleDelete = async (subjectGroup: SubjectGroup) => {
    if (confirm(`Are you sure you want to delete all ${subjectGroup.totalSessions} sessions for ${subjectGroup.subject}?`)) {
      try {
        const { error } = await supabase
          .from('college_attendance_sessions')
          .delete()
          .eq('subject_name', subjectGroup.subject)
          .eq('department_name', subjectGroup.department)
          .eq('program_name', subjectGroup.course)
          .eq('semester', subjectGroup.semester)
          .eq('section', subjectGroup.section);

        if (error) throw error;
        
        alert('Sessions deleted successfully!');
        // Refresh the data
        fetchSubjectGroups();
      } catch (err: any) {
        alert(`Error deleting sessions: ${err.message}`);
      }
    }
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSession = (session: AttendanceSession, records: AttendanceRecord[]) => {
    const exportData = records.map(record => ({
      'Roll Number': record.rollNumber,
      'Student Name': record.studentName,
      'Status': record.status,
      'Time In': record.timeIn || '',
      'Time Out': record.timeOut || '',
      'Remarks': record.remarks || '',
      'Date': record.date,
      'Subject': record.subject,
      'Faculty': record.facultyName,
    }));

    exportToCSV(exportData, `${session.subject}_${formatDate(session.date).replace(/\//g, '-')}_attendance.csv`);
  };

  const handleExportMonthly = (session: AttendanceSession, students: ProfileStudent[], allRecords: AttendanceRecord[]) => {
    // Since ProfileStudent doesn't have the same structure as AttendanceStudent,
    // we'll create a simplified export with available data
    const exportData = students.map(student => {
      const studentRecords = allRecords.filter(r => r.studentId === student.id && r.subject === session.subject);
      const stats = {
        present: studentRecords.filter((r) => r.status === "present").length,
        absent: studentRecords.filter((r) => r.status === "absent").length,
        late: studentRecords.filter((r) => r.status === "late").length,
        excused: studentRecords.filter((r) => r.status === "excused").length,
        total: studentRecords.length,
        percentage: studentRecords.length > 0 ? ((studentRecords.filter((r) => r.status === "present" || r.status === "late" || r.status === "excused").length / studentRecords.length) * 100).toFixed(1) : "0",
      };

      return {
        'Student ID': student.id,
        'Student Name': student.name,
        'Present': stats.present,
        'Absent': stats.absent,
        'Late': stats.late,
        'Excused': stats.excused,
        'Total Days': stats.total,
        'Attendance Percentage': `${stats.percentage}%`,
      };
    });

    exportToCSV(exportData, `${session.subject}_monthly_summary.csv`);
  };

  const handleExportStudentHistory = (student: AttendanceStudent, session: AttendanceSession, allRecords: AttendanceRecord[]) => {
    const studentHistory = allRecords.filter((record) => record.studentId === student.id && record.subject === session.subject);

    const exportData = studentHistory.map(record => ({
      'Date': record.date,
      'Status': record.status,
      'Time In': record.timeIn || '',
      'Time Out': record.timeOut || '',
      'Remarks': record.remarks || '',
      'Subject': record.subject,
      'Faculty': record.facultyName,
    }));

    exportToCSV(exportData, `${student.name}_${student.id}_attendance_history.csv`);
  };

  // Add session handlers
  const handleFormChange = async (field: string, value: any) => {
    setSessionFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-update total students when class details change
    if (field === 'department' || field === 'course' || field === 'semester' || field === 'section') {
      const department = field === 'department' ? value : sessionFormData.department;
      const course = field === 'course' ? value : sessionFormData.course;
      const semester = field === 'semester' ? value : sessionFormData.semester;
      const section = field === 'section' ? value : sessionFormData.section;

      if (department && course && semester && section) {
        const studentCount = await fetchStudentCount(department, course, semester, section);
        setSessionFormData(prev => ({
          ...prev,
          totalStudents: studentCount,
        }));
      }
    }
  };

  const handleCreateSession = async () => {
    // Basic validation
    if (!sessionFormData.department || !sessionFormData.course || !sessionFormData.semester ||
        !sessionFormData.section || !sessionFormData.subject || !sessionFormData.faculty ||
        !sessionFormData.date || !sessionFormData.startTime || !sessionFormData.endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Date and time validation
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if date is in the past
    if (sessionFormData.date < currentDate) {
      alert("Cannot schedule attendance for past dates.");
      return;
    }
    
    // Check if time is in the past (for today's date)
    if (sessionFormData.date === currentDate) {
      if (sessionFormData.startTime < currentTime) {
        alert("Cannot schedule attendance for past time.");
        return;
      }
      if (sessionFormData.endTime < currentTime) {
        alert("End time cannot be in the past.");
        return;
      }
    }
    
    // Check if end time is after start time
    if (sessionFormData.startTime && sessionFormData.endTime) {
      const start = new Date(`2000-01-01T${sessionFormData.startTime}`);
      const end = new Date(`2000-01-01T${sessionFormData.endTime}`);
      if (end <= start) {
        alert("End time must be after start time.");
        return;
      }
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to create a session.");
        return;
      }

      // ✅ CORRECT: Get college_id from the FACULTY MEMBER using faculty_id
      const { data: facultyData, error: facultyError } = await supabase
        .from('college_lecturers')
        .select('collegeId, first_name, last_name')
        .eq('id', sessionFormData.faculty)  // Use faculty_id from form
        .single();

      if (facultyError || !facultyData) {
        console.error('Faculty lookup error:', facultyError);
        alert("Unable to find faculty member. Please try again.");
        return;
      }

      const collegeId = facultyData.collegeId;  // ✅ Faculty's college_id
      const facultyName = `${facultyData.first_name} ${facultyData.last_name}`;

      console.log('Creating session with CORRECT logic:', {
        facultyId: sessionFormData.faculty,
        facultyName: facultyName,
        collegeId: collegeId,  // ✅ This is now the faculty's college_id
        createdBy: user.id     // ✅ Admin who created it
      });

      const { error } = await supabase
        .from('college_attendance_sessions')
        .insert({
          date: sessionFormData.date,
          start_time: sessionFormData.startTime,
          end_time: sessionFormData.endTime,
          subject_name: sessionFormData.subject,
          faculty_id: sessionFormData.faculty, // Faculty member's ID
          faculty_name: facultyName, // Faculty member's actual name from database
          department_name: sessionFormData.department,
          program_name: sessionFormData.course,
          semester: parseInt(sessionFormData.semester),
          section: sessionFormData.section,
          room_number: sessionFormData.roomNumber,
          remarks: sessionFormData.remarks,
          status: 'scheduled',
          college_id: collegeId, // ✅ Faculty member's college_id (not admin's)
          created_by: user.id, // Admin who created the session
        })
        .select()
        .single();

      if (error) throw error;
      
      alert('Session created successfully!');
      
      // Refresh the data
      fetchSubjectGroups();
      setShowAddSessionModal(false);
      
      // Reset form
      setSessionFormData({
        department: "",
        course: "",
        semester: "",
        section: "",
        subject: "",
        faculty: "",
        date: "",
        startTime: "",
        endTime: "",
        roomNumber: "",
        remarks: "",
        totalStudents: 0,
      });
    } catch (err: any) {
      alert(`Error creating session: ${err.message}`);
    }
  };

  const handleCreateAndStart = async () => {
    // Same validation as create session
    if (!sessionFormData.department || !sessionFormData.course || !sessionFormData.semester ||
        !sessionFormData.section || !sessionFormData.subject || !sessionFormData.faculty ||
        !sessionFormData.date || !sessionFormData.startTime || !sessionFormData.endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Date and time validation
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if date is in the past
    if (sessionFormData.date < currentDate) {
      alert("Cannot schedule attendance for past dates.");
      return;
    }
    
    // Check if time is in the past (for today's date)
    if (sessionFormData.date === currentDate) {
      if (sessionFormData.startTime < currentTime) {
        alert("Cannot schedule attendance for past time.");
        return;
      }
      if (sessionFormData.endTime < currentTime) {
        alert("End time cannot be in the past.");
        return;
      }
    }
    
    // Check if end time is after start time
    if (sessionFormData.startTime && sessionFormData.endTime) {
      const start = new Date(`2000-01-01T${sessionFormData.startTime}`);
      const end = new Date(`2000-01-01T${sessionFormData.endTime}`);
      if (end <= start) {
        alert("End time must be after start time.");
        return;
      }
    }

    try {
      // Create session first
      await handleCreateSession();
      
      // In a real app, this would navigate to the attendance marking page
      alert("Session created and attendance marking started!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Chart data
  const attendanceTrendData = {
    series: [
      {
        name: "Attendance %",
        data: [85, 82, 87, 83, 86, 84, 88],
      },
    ],
    options: {
      chart: { type: "area" as const, toolbar: { show: false }, height: 300 },
      stroke: { curve: "smooth" as const, width: 3 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
      },
      colors: ["#4f46e5"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: { style: { colors: "#6b7280" } },
      },
      tooltip: { theme: "light" },
    },
  };

  const departmentComparisonData = {
    series: [
      {
        name: "Attendance %",
        data: [88, 82, 85, 79, 86],
      },
    ],
    options: {
      chart: { type: "bar" as const, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 8 } },
      colors: ["#4f46e5"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["CSE", "ECE", "MECH", "CIVIL", "EEE"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: { labels: { style: { colors: "#6b7280" } } },
      grid: { borderColor: "#f1f5f9" },
      tooltip: { theme: "light" },
    },
  };

  const totalFilters =
    filters.departments.length +
    filters.courses.length +
    filters.semesters.length +
    filters.sections.length +
    filters.statuses.length +
    filters.faculty.length +
    (dateRange.from ? 1 : 0) +
    (dateRange.to ? 1 : 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-indigo-600" />
              Attendance Tracking
            </h1>
            <p className="text-sm sm:text-base mt-2 text-gray-600">
              Monitor and manage student attendance across all subjects
            </p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setShowAddSessionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Sessions"
            value={analytics.totalSessions}
            icon={<CalendarIcon className="h-6 w-6" />}
            color="blue"
            change={12.5}
            changeLabel="vs last week"
          />
          <KPICard
            title="Average Attendance"
            value={`${analytics.avgAttendance}%`}
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
            change={3.2}
            changeLabel="vs last week"
          />
          <KPICard
            title="Total Students"
            value={analytics.totalStudents}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="purple"
          />
          <KPICard
            title="Low Attendance"
            value={analytics.lowAttendanceSessions}
            icon={<BellAlertIcon className="h-6 w-6" />}
            color="red"
            change={-5.0}
            changeLabel="vs last week"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-indigo-600" />
              Weekly Attendance Trend
            </h3>
            <ReactApexChart
              options={attendanceTrendData.options}
              series={attendanceTrendData.series}
              type="area"
              height={300}
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartPieIcon className="h-5 w-5 text-indigo-600" />
              Department-wise Comparison
            </h3>
            <ReactApexChart
              options={departmentComparisonData.options}
              series={departmentComparisonData.series}
              type="bar"
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Desktop Header Bar */}
      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h2 className="text-xl font-semibold text-gray-900">
              Subjects
            </h2>
            <span className="ml-2 text-sm text-gray-500">
              ({totalItems} subjects)
            </span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by subject, faculty, department..."
              size="md"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h2 className="text-xl font-semibold text-gray-900">Subjects</h2>
          <span className="text-sm text-gray-500">{totalItems} results</span>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search subjects..."
          size="md"
        />

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-xl lg:static lg:z-auto lg:shadow-none">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-gray-900">Filters</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="lg:hidden text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-0">
                  {/* Date Range */}
                  <FilterSection title="Date Range" defaultOpen>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, from: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, to: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  <FilterSection title="Department">
                    <CheckboxGroup
                      options={departmentOptions}
                      selectedValues={filters.departments}
                      onChange={(values: string[]) =>
                        setFilters({ ...filters, departments: values })
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Course">
                    <CheckboxGroup
                      options={courseOptions}
                      selectedValues={filters.courses}
                      onChange={(values: string[]) =>
                        setFilters({ ...filters, courses: values })
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Semester">
                    <CheckboxGroup
                      options={semesterOptions}
                      selectedValues={filters.semesters}
                      onChange={(values: number[]) =>
                        setFilters({ ...filters, semesters: values })
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Section">
                    <CheckboxGroup
                      options={sectionOptions}
                      selectedValues={filters.sections}
                      onChange={(values: string[]) =>
                        setFilters({ ...filters, sections: values })
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Status">
                    <CheckboxGroup
                      options={statusOptions}
                      selectedValues={filters.statuses}
                      onChange={(values: string[]) =>
                        setFilters({ ...filters, statuses: values })
                      }
                    />
                  </FilterSection>

                  <FilterSection title="Faculty">
                    <CheckboxGroup
                      options={facultyFilterOptions}
                      selectedValues={filters.faculty}
                      onChange={(values: string[]) =>
                        setFilters({ ...filters, faculty: values })
                      }
                    />
                  </FilterSection>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {startIndex + 1}-{Math.min(endIndex, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> subject
              {totalItems !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Loading attendance data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-2">Error loading data</div>
                <p className="text-gray-500">{error}</p>
                <button 
                  onClick={() => fetchSubjectGroups()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedSubjectGroups.map((subjectGroup) => (
                  <EnhancedSubjectCard
                    key={`${subjectGroup.subject}-${subjectGroup.department}-${subjectGroup.course}-${subjectGroup.semester}-${subjectGroup.section}`}
                    subjectGroup={subjectGroup}
                    onView={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sessions
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Range
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Attendance
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedSubjectGroups.map((subjectGroup) => (
                        <tr key={`${subjectGroup.subject}-${subjectGroup.department}-${subjectGroup.course}-${subjectGroup.semester}-${subjectGroup.section}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {subjectGroup.subject}
                            </div>
                            <div className="text-xs text-gray-500">
                              {subjectGroup.course} - Sem {subjectGroup.semester} ({subjectGroup.section})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {subjectGroup.faculty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {subjectGroup.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-indigo-700 font-medium">
                            {subjectGroup.totalSessions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                            {subjectGroup.totalSessions === 1 
                              ? formatDate(subjectGroup.dateRange.first)
                              : `${formatDate(subjectGroup.dateRange.first)} - ${formatDate(subjectGroup.dateRange.last)}`
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`text-sm font-bold ${
                                subjectGroup.avgAttendancePercentage >= 75
                                  ? "text-green-600"
                                  : subjectGroup.avgAttendancePercentage >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {subjectGroup.avgAttendancePercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <StatusBadge status={subjectGroup.latestStatus} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                            <button
                              onClick={() => handleViewDetails(subjectGroup)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(subjectGroup)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subjectGroup)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {paginatedSubjectGroups.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No subjects found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Attendance Details Modal - Now receives subject group */}
      <AttendanceDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        subjectGroup={selectedSubjectGroup}
        records={attendanceRecords.filter(
          (r) => r.subject === selectedSubjectGroup?.subject
        )}
        students={[]}
        allRecords={attendanceRecords}
        onViewStudentHistory={(student) => {
          // Convert ProfileStudent to AttendanceStudent
          const attendanceStudent: AttendanceStudent = {
            id: student.id,
            rollNumber: student.registration_number || student.id,
            name: student.name || 'Unknown',
            department: student.branch_field || 'Unknown',
            course: student.branch_field || 'Unknown',
            semester: student.semester || 1,
            section: student.section || 'A',
            email: student.email,
          };
          setSelectedStudent(attendanceStudent);
          setShowStudentHistoryModal(true);
        }}
        onExportSession={handleExportSession}
        onExportMonthly={handleExportMonthly}
      />

      {/* Student History Modal */}
      <StudentHistoryModal
        isOpen={showStudentHistoryModal}
        onClose={() => setShowStudentHistoryModal(false)}
        student={selectedStudent}
        allRecords={attendanceRecords}
        session={selectedSubjectGroup?.sessions[0] || null}
        onExportHistory={handleExportStudentHistory}
      />

      {/* Add Attendance Session Modal */}
      <AddAttendanceSessionModal
        isOpen={showAddSessionModal}
        onClose={() => setShowAddSessionModal(false)}
        onCreateSession={handleCreateSession}
        onCreateAndStart={handleCreateAndStart}
        formData={sessionFormData}
        onFormChange={handleFormChange}
        departments={departmentsData.map(dept => ({ value: dept.id, label: dept.name }))}
        courses={programsData.map(prog => ({ value: prog.id, label: prog.name }))}
        semesters={semestersData.map(sem => ({ value: sem.toString(), label: `Semester ${sem}` }))}
        sections={sectionOptions}
        subjects={coursesData.map(course => ({ value: course.id, label: `${course.course_code} - ${course.course_name}` }))}
        faculty={filterOptions.faculty}
        students={[]}
      />
    </div>
  );
};

export default AttendanceTracking;