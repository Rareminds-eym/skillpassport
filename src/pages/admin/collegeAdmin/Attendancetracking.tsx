/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  BellAlertIcon,
  PlusCircleIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import Pagination from "../../../components/admin/Pagination";
import KPICard from "../../../components/admin/KPICard";
import ReactApexChart from "react-apexcharts";
import AddAttendanceSessionModal from "@/components/admin/modals/AddAttendanceSessionModal";
import StudentHistoryModal from "@/components/admin/modals/StudentHistoryModal";
import AttendanceDetailsModal from "@/components/admin/modals/AttendanceDetailsModal";
import { AttendanceRecord, AttendanceSession, Student, SubjectGroup } from "@/types/Attendance";



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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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

  // Sample data
  const [sessions, setSessions] = useState<AttendanceSession[]>([
    {
      id: "1",
      date: "2025-01-15",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Data Structures",
      faculty: "Dr. Anil Kumar",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      totalStudents: 10,
      presentCount: 5,
      absentCount: 1,
      lateCount: 2,
      excusedCount: 1,
      attendancePercentage: 70.0,
      status: "completed",
    },
    {
      id: "2",
      date: "2025-01-15",
      startTime: "10:15",
      endTime: "11:15",
      subject: "Operating Systems",
      faculty: "Prof. Priya Sharma",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "B",
      totalStudents: 58,
      presentCount: 45,
      absentCount: 10,
      lateCount: 3,
      excusedCount: 0,
      attendancePercentage: 77.6,
      status: "completed",
    },
    {
      id: "3",
      date: "2025-01-15",
      startTime: "11:30",
      endTime: "12:30",
      subject: "Database Management",
      faculty: "Dr. Rajesh Nair",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 4,
      section: "A",
      totalStudents: 55,
      presentCount: 48,
      absentCount: 4,
      lateCount: 2,
      excusedCount: 1,
      attendancePercentage: 87.3,
      status: "ongoing",
    },
    {
      id: "4",
      date: "2025-01-16",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Computer Networks",
      faculty: "Dr. Meera Reddy",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 5,
      section: "A",
      totalStudents: 50,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendancePercentage: 0,
      status: "scheduled",
    },
    {
      id: "5",
      date: "2025-01-15",
      startTime: "14:00",
      endTime: "15:00",
      subject: "Digital Electronics",
      faculty: "Prof. Suresh Kumar",
      department: "Electronics",
      course: "B.Tech ECE",
      semester: 2,
      section: "A",
      totalStudents: 62,
      presentCount: 38,
      absentCount: 18,
      lateCount: 4,
      excusedCount: 2,
      attendancePercentage: 61.3,
      status: "completed",
    },
    {
      id: "6",
      date: "2025-01-15",
      startTime: "15:15",
      endTime: "16:15",
      subject: "Signal Processing",
      faculty: "Dr. Kavita Iyer",
      department: "Electronics",
      course: "B.Tech ECE",
      semester: 4,
      section: "B",
      totalStudents: 48,
      presentCount: 44,
      absentCount: 2,
      lateCount: 1,
      excusedCount: 1,
      attendancePercentage: 91.7,
      status: "completed",
    },
    // Additional sessions for the same subject to demonstrate grouping
    {
      id: "7",
      date: "2025-01-08",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Data Structures",
      faculty: "Dr. Anil Kumar",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      totalStudents: 10,
      presentCount: 8,
      absentCount: 1,
      lateCount: 1,
      excusedCount: 0,
      attendancePercentage: 90.0,
      status: "completed",
    },
    {
      id: "8",
      date: "2025-01-22",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Data Structures",
      faculty: "Dr. Anil Kumar",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      totalStudents: 10,
      presentCount: 6,
      absentCount: 2,
      lateCount: 2,
      excusedCount: 0,
      attendancePercentage: 80.0,
      status: "completed",
    },
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    // Data Structures - 2025-01-15
    {
      id: "1",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "21CSE001",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "present",
      timeIn: "08:55",
      timeOut: "10:05",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "2",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "21CSE002",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "late",
      timeIn: "09:12",
      timeOut: "10:03",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      remarks: "Traffic delay",
      location: "Room 301",
    },
    {
      id: "3",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "21CSE003",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "absent",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "4",
      studentId: "STU004",
      studentName: "Sneha Gupta",
      rollNumber: "21CSE004",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "present",
      timeIn: "08:50",
      timeOut: "10:02",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "5",
      studentId: "STU005",
      studentName: "Vikram Kumar",
      rollNumber: "21CSE005",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "present",
      timeIn: "08:58",
      timeOut: "10:01",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "6",
      studentId: "STU006",
      studentName: "Anjali Sharma",
      rollNumber: "21CSE006",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "excused",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      remarks: "Medical leave",
      location: "Room 301",
    },
    {
      id: "7",
      studentId: "STU007",
      studentName: "Rohit Jain",
      rollNumber: "21CSE007",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "present",
      timeIn: "09:05",
      timeOut: "10:04",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "8",
      studentId: "STU008",
      studentName: "Kavita Reddy",
      rollNumber: "21CSE008",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-15",
      status: "late",
      timeIn: "09:15",
      timeOut: "10:03",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      remarks: "Bus delay",
      location: "Room 301",
    },
    // Historical data for student attendance trends
    // Data Structures - 2025-01-08
    {
      id: "9",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "21CSE001",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-08",
      status: "present",
      timeIn: "08:52",
      timeOut: "10:08",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "10",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "21CSE002",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-08",
      status: "present",
      timeIn: "08:55",
      timeOut: "10:05",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "11",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "21CSE003",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-08",
      status: "absent",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    // Data Structures - 2025-01-01
    {
      id: "12",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "21CSE001",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-01",
      status: "present",
      timeIn: "08:50",
      timeOut: "10:10",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "13",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "21CSE002",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-01",
      status: "late",
      timeIn: "09:10",
      timeOut: "10:02",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      remarks: "Weather delay",
      location: "Room 301",
    },
    {
      id: "14",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "21CSE003",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-01-01",
      status: "present",
      timeIn: "08:55",
      timeOut: "10:05",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    // Additional records for November 2025 (current month)
    {
      id: "15",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "21CSE001",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-11-01",
      status: "present",
      timeIn: "08:45",
      timeOut: "10:05",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "16",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "21CSE002",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-11-01",
      status: "present",
      timeIn: "08:50",
      timeOut: "10:08",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "17",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "21CSE003",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-11-08",
      status: "absent",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "18",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "21CSE001",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-11-08",
      status: "present",
      timeIn: "08:48",
      timeOut: "10:12",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      location: "Room 301",
    },
    {
      id: "19",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "21CSE002",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      date: "2025-11-08",
      status: "late",
      timeIn: "09:05",
      timeOut: "10:06",
      subject: "Data Structures",
      facultyId: "FAC001",
      facultyName: "Dr. Anil Kumar",
      remarks: "Traffic",
      location: "Room 301",
    },
  ]);

  const [students] = useState<Student[]>([
    {
      id: "STU001",
      rollNumber: "21CSE001",
      name: "Arjun Patel",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "arjun.patel@college.edu",
      phone: "+91-9876543210",
    },
    {
      id: "STU002",
      rollNumber: "21CSE002",
      name: "Priya Singh",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "priya.singh@college.edu",
      phone: "+91-9876543211",
    },
    {
      id: "STU003",
      rollNumber: "21CSE003",
      name: "Rahul Verma",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "rahul.verma@college.edu",
      phone: "+91-9876543212",
    },
    {
      id: "STU004",
      rollNumber: "21CSE004",
      name: "Sneha Gupta",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "sneha.gupta@college.edu",
      phone: "+91-9876543213",
    },
    {
      id: "STU005",
      rollNumber: "21CSE005",
      name: "Vikram Kumar",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "vikram.kumar@college.edu",
      phone: "+91-9876543214",
    },
    {
      id: "STU006",
      rollNumber: "21CSE006",
      name: "Anjali Sharma",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "anjali.sharma@college.edu",
      phone: "+91-9876543215",
    },
    {
      id: "STU007",
      rollNumber: "21CSE007",
      name: "Rohit Jain",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "rohit.jain@college.edu",
      phone: "+91-9876543216",
    },
    {
      id: "STU008",
      rollNumber: "21CSE008",
      name: "Kavita Reddy",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "kavita.reddy@college.edu",
      phone: "+91-9876543217",
    },
    {
      id: "STU009",
      rollNumber: "21CSE009",
      name: "Amit Singh",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "amit.singh@college.edu",
      phone: "+91-9876543218",
    },
    {
      id: "STU010",
      rollNumber: "21CSE010",
      name: "Meera Patel",
      department: "Computer Science",
      course: "B.Tech CSE",
      semester: 3,
      section: "A",
      email: "meera.patel@college.edu",
      phone: "+91-9876543219",
    },
  ]);

  const [filters, setFilters] = useState({
    departments: [] as string[],
    courses: [] as string[],
    semesters: [] as number[],
    sections: [] as string[],
    statuses: [] as string[],
    faculty: [] as string[],
  });

  // Group sessions by subject
  const subjectGroups = useMemo(() => {
    const groups = new Map<string, SubjectGroup>();

    sessions.forEach((session) => {
      // Create unique key based on subject, department, course, semester, section
      const key = `${session.subject}-${session.department}-${session.course}-${session.semester}-${session.section}`;

      if (!groups.has(key)) {
        groups.set(key, {
          subject: session.subject,
          department: session.department,
          course: session.course,
          semester: session.semester,
          section: session.section,
          faculty: session.faculty,
          sessions: [],
          totalSessions: 0,
          avgAttendancePercentage: 0,
          totalStudents: session.totalStudents,
          totalPresentCount: 0,
          totalAbsentCount: 0,
          totalLateCount: 0,
          totalExcusedCount: 0,
          dateRange: {
            first: session.date,
            last: session.date,
          },
          latestStatus: session.status,
        });
      }

      const group = groups.get(key)!;
      group.sessions.push(session);
      group.totalSessions++;
      group.totalPresentCount += session.presentCount;
      group.totalAbsentCount += session.absentCount;
      group.totalLateCount += session.lateCount;
      group.totalExcusedCount += session.excusedCount;

      // Update date range
      if (session.date < group.dateRange.first) {
        group.dateRange.first = session.date;
      }
      if (session.date > group.dateRange.last) {
        group.dateRange.last = session.date;
        group.latestStatus = session.status;
      }
    });

    // Calculate average attendance percentage for each group
    groups.forEach((group) => {
      const totalPercentage = group.sessions.reduce(
        (sum, session) => sum + session.attendancePercentage,
        0
      );
      group.avgAttendancePercentage = totalPercentage / group.totalSessions;
      
      // Sort sessions by date (newest first)
      group.sessions.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.startTime.localeCompare(a.startTime);
      });
    });

    return Array.from(groups.values());
  }, [sessions]);

  // Analytics calculations (now based on total sessions)
  const analytics = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const avgAttendance =
      sessions.reduce((acc, s) => acc + s.attendancePercentage, 0) /
      totalSessions;
    const totalStudents = sessions.reduce((acc, s) => acc + s.totalStudents, 0);
    const totalPresent = sessions.reduce((acc, s) => acc + s.presentCount, 0);
    const totalAbsent = sessions.reduce((acc, s) => acc + s.absentCount, 0);
    const lowAttendanceSessions = sessions.filter(
      (s) => s.attendancePercentage < 75
    ).length;

    return {
      totalSessions,
      completedSessions,
      avgAttendance: avgAttendance.toFixed(1),
      totalStudents,
      totalPresent,
      totalAbsent,
      lowAttendanceSessions,
    };
  }, [sessions]);

  // Filter options (based on subject groups)
  const departmentOptions = useMemo(() => {
    const deptCounts: any = {};
    subjectGroups.forEach((g) => {
      deptCounts[g.department] = (deptCounts[g.department] || 0) + 1;
    });
    return Object.entries(deptCounts).map(([dept, count]) => ({
      value: dept,
      label: dept,
      count,
    }));
  }, [subjectGroups]);

  const courseOptions = useMemo(() => {
    const courseCounts: any = {};
    subjectGroups.forEach((g) => {
      courseCounts[g.course] = (courseCounts[g.course] || 0) + 1;
    });
    return Object.entries(courseCounts).map(([course, count]) => ({
      value: course,
      label: course,
      count,
    }));
  }, [subjectGroups]);

  const semesterOptions = useMemo(() => {
    const semCounts: any = {};
    subjectGroups.forEach((g) => {
      semCounts[g.semester] = (semCounts[g.semester] || 0) + 1;
    });
    return Object.entries(semCounts).map(([sem, count]) => ({
      value: Number(sem),
      label: `Semester ${sem}`,
      count,
    }));
  }, [subjectGroups]);

  const sectionOptions = useMemo(() => {
    const secCounts: any = {};
    subjectGroups.forEach((g) => {
      secCounts[g.section] = (secCounts[g.section] || 0) + 1;
    });
    return Object.entries(secCounts).map(([sec, count]) => ({
      value: sec,
      label: `Section ${sec}`,
      count,
    }));
  }, [subjectGroups]);

  const statusOptions = [
    { value: "completed", label: "Completed", count: subjectGroups.filter(g => g.latestStatus === "completed").length },
    { value: "ongoing", label: "Ongoing", count: subjectGroups.filter(g => g.latestStatus === "ongoing").length },
    { value: "scheduled", label: "Scheduled", count: subjectGroups.filter(g => g.latestStatus === "scheduled").length },
  ];

  const facultyOptions = useMemo(() => {
    const facCounts: any = {};
    subjectGroups.forEach((g) => {
      facCounts[g.faculty] = (facCounts[g.faculty] || 0) + 1;
    });
    return Object.entries(facCounts).map(([fac, count]) => ({
      value: fac,
      label: fac,
      count,
    }));
  }, [subjectGroups]);

  // Subject options (sample data - in real app, this would come from API)
  const subjectOptions = [
    { value: "Data Structures", label: "Data Structures" },
    { value: "Operating Systems", label: "Operating Systems" },
    { value: "Database Management", label: "Database Management" },
    { value: "Computer Networks", label: "Computer Networks" },
    { value: "Digital Electronics", label: "Digital Electronics" },
    { value: "Signal Processing", label: "Signal Processing" },
    { value: "Algorithms", label: "Algorithms" },
    { value: "Software Engineering", label: "Software Engineering" },
    { value: "Web Development", label: "Web Development" },
    { value: "Machine Learning", label: "Machine Learning" },
  ];

  // Filtered subject groups
  const filteredSubjectGroups = useMemo(() => {
    return subjectGroups.filter((group) => {
      const matchesSearch =
        searchQuery === "" ||
        group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.faculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.course.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        filters.departments.length === 0 ||
        filters.departments.includes(group.department);
      const matchesCourse =
        filters.courses.length === 0 || filters.courses.includes(group.course);
      const matchesSem =
        filters.semesters.length === 0 ||
        filters.semesters.includes(group.semester);
      const matchesSec =
        filters.sections.length === 0 ||
        filters.sections.includes(group.section);
      const matchesStatus =
        filters.statuses.length === 0 ||
        filters.statuses.includes(group.latestStatus);
      const matchesFac =
        filters.faculty.length === 0 || filters.faculty.includes(group.faculty);

      // Check if ANY session in the group matches the date range
      const matchesDateRange =
        group.sessions.some((session) => {
          return (
            (!dateRange.from || session.date >= dateRange.from) &&
            (!dateRange.to || session.date <= dateRange.to)
          );
        });

      return (
        matchesSearch &&
        matchesDept &&
        matchesCourse &&
        matchesSem &&
        matchesSec &&
        matchesStatus &&
        matchesFac &&
        matchesDateRange
      );
    });
  }, [subjectGroups, searchQuery, filters, dateRange]);

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

  const handleViewDetails = (subjectGroup: SubjectGroup) => {
    setSelectedSubjectGroup(subjectGroup);
    setShowDetailsModal(true);
  };

  const handleEdit = (subjectGroup: SubjectGroup) => {
    console.log("Edit subject group:", subjectGroup);
    // Implement edit logic
  };

  const handleDelete = (subjectGroup: SubjectGroup) => {
    if (confirm(`Are you sure you want to delete all ${subjectGroup.totalSessions} sessions for ${subjectGroup.subject}?`)) {
      console.log("Delete subject group:", subjectGroup);
      // Implement delete logic
      const sessionIdsToDelete = subjectGroup.sessions.map(s => s.id);
      setSessions(prevSessions => prevSessions.filter(s => !sessionIdsToDelete.includes(s.id)));
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

  const handleExportMonthly = (session: AttendanceSession, students: Student[], allRecords: AttendanceRecord[]) => {
    const classStudents = students.filter(
      (student) =>
        student.department === session.department &&
        student.course === session.course &&
        student.semester === session.semester &&
        student.section === session.section
    );

    const exportData = classStudents.map(student => {
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
        'Roll Number': student.rollNumber,
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

  const handleExportStudentHistory = (student: Student, session: AttendanceSession, allRecords: AttendanceRecord[]) => {
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

    exportToCSV(exportData, `${student.name}_${student.rollNumber}_attendance_history.csv`);
  };

  // Add session handlers
  const handleFormChange = (field: string, value: any) => {
    setSessionFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-update total students when class details change
      ...(field === 'department' || field === 'course' || field === 'semester' || field === 'section' ? {
        totalStudents: students.filter(
          (student) =>
            (field === 'department' ? value : prev.department) === student.department &&
            (field === 'course' ? value : prev.course) === student.course &&
            (field === 'semester' ? parseInt(value) : prev.semester ? parseInt(prev.semester) : 0) === student.semester &&
            (field === 'section' ? value : prev.section) === student.section
        ).length
      } : {})
    }));
  };

  const handleCreateSession = () => {
    // Basic validation
    if (!sessionFormData.department || !sessionFormData.course || !sessionFormData.semester ||
        !sessionFormData.section || !sessionFormData.subject || !sessionFormData.faculty ||
        !sessionFormData.date || !sessionFormData.startTime || !sessionFormData.endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Create new session
    const newSession: AttendanceSession = {
      id: `session_${Date.now()}`,
      date: sessionFormData.date,
      startTime: sessionFormData.startTime,
      endTime: sessionFormData.endTime,
      subject: sessionFormData.subject,
      faculty: sessionFormData.faculty,
      department: sessionFormData.department,
      course: sessionFormData.course,
      semester: parseInt(sessionFormData.semester),
      section: sessionFormData.section,
      totalStudents: sessionFormData.totalStudents || students.filter(
        (student) =>
          student.department === sessionFormData.department &&
          student.course === sessionFormData.course &&
          student.semester === parseInt(sessionFormData.semester) &&
          student.section === sessionFormData.section
      ).length,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendancePercentage: 0,
      status: "scheduled",
    };

    // Add to sessions state - this will automatically update the subject group
    setSessions(prevSessions => [...prevSessions, newSession]);
    alert("Session created successfully! It has been added to the existing subject or created a new subject card.");

    // Reset form and close modal
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
    setShowAddSessionModal(false);
  };

  const handleCreateAndStart = () => {
    // Same validation as create session
    if (!sessionFormData.department || !sessionFormData.course || !sessionFormData.semester ||
        !sessionFormData.section || !sessionFormData.subject || !sessionFormData.faculty ||
        !sessionFormData.date || !sessionFormData.startTime || !sessionFormData.endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    // Create session first
    handleCreateSession();

    // In a real app, this would navigate to the attendance marking page
    alert("Session created and attendance marking started!");
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
                      options={facultyOptions}
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
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedSubjectGroups.map((subjectGroup, index) => (
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
        students={students}
        allRecords={attendanceRecords}
        onViewStudentHistory={(student) => {
          setSelectedStudent(student);
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
        departments={departmentOptions}
        courses={courseOptions}
        semesters={semesterOptions}
        sections={sectionOptions}
        subjects={subjectOptions}
        faculty={facultyOptions}
        students={students}
      />
    </div>
  );
};

export default AttendanceTracking;