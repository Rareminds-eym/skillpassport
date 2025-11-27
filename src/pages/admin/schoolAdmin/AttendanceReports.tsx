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
  ArrowDownTrayIcon,
  ChartBarIcon,
  BellAlertIcon,
  DocumentChartBarIcon,
  UserIcon,
  AcademicCapIcon,
  TableCellsIcon,
  XMarkIcon,
  PrinterIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import SearchBar from "../../../components/common/SearchBar";
import Pagination from "../../../components/admin/Pagination";
import KPICard from "../../../components/admin/KPICard";
import ReactApexChart from "react-apexcharts";

// ==================== TYPES ====================
interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  class: string;
  section: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
  teacher: string;
  source?: "manual" | "rfid" | "biometric";
  deviceId?: string;
}

interface Student {
  id: string;
  rollNumber: string;
  name: string;
  class: string;
  section: string;
  email: string;
  phone: string;
}

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
  };
  return configs[status as keyof typeof configs] || configs.present;
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

// ==================== MAIN COMPONENT ====================
const AttendanceReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"daily" | "student" | "chronic" | "classwise" | "rawlogs">("daily");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [filters, setFilters] = useState({
    classes: [] as string[],
    sections: [] as string[],
    teachers: [] as string[],
    statuses: [] as string[],
    sources: [] as string[],
  });

  // Sample data - In production, this would come from API
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: "1",
      studentId: "STU001",
      studentName: "Arjun Patel",
      rollNumber: "10A001",
      class: "10",
      section: "A",
      date: "2025-11-26",
      status: "present",
      timeIn: "08:55",
      timeOut: "15:05",
      teacher: "Mrs. Sharma",
      source: "rfid",
      deviceId: "RFID-001",
    },
    {
      id: "2",
      studentId: "STU002",
      studentName: "Priya Singh",
      rollNumber: "10A002",
      class: "10",
      section: "A",
      date: "2025-11-26",
      status: "late",
      timeIn: "09:15",
      timeOut: "15:03",
      remarks: "Traffic delay",
      teacher: "Mrs. Sharma",
      source: "manual",
    },
    {
      id: "3",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-26",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
    {
      id: "4",
      studentId: "STU004",
      studentName: "Sneha Gupta",
      rollNumber: "10A004",
      class: "10",
      section: "A",
      date: "2025-11-26",
      status: "present",
      timeIn: "08:50",
      timeOut: "15:02",
      teacher: "Mrs. Sharma",
      source: "biometric",
      deviceId: "BIO-002",
    },
    {
      id: "5",
      studentId: "STU005",
      studentName: "Vikram Kumar",
      rollNumber: "10B001",
      class: "10",
      section: "B",
      date: "2025-11-26",
      status: "present",
      timeIn: "08:58",
      timeOut: "15:01",
      teacher: "Mr. Reddy",
      source: "rfid",
      deviceId: "RFID-002",
    },
    // Historical data for chronic absentee detection
    {
      id: "6",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-25",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
    {
      id: "7",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-24",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
    {
      id: "8",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-23",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
    {
      id: "9",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-22",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
    {
      id: "10",
      studentId: "STU003",
      studentName: "Rahul Verma",
      rollNumber: "10A003",
      class: "10",
      section: "A",
      date: "2025-11-21",
      status: "absent",
      teacher: "Mrs. Sharma",
    },
  ]);

  const [students] = useState<Student[]>([
    {
      id: "STU001",
      rollNumber: "10A001",
      name: "Arjun Patel",
      class: "10",
      section: "A",
      email: "arjun.patel@school.edu",
      phone: "+91-9876543210",
    },
    {
      id: "STU002",
      rollNumber: "10A002",
      name: "Priya Singh",
      class: "10",
      section: "A",
      email: "priya.singh@school.edu",
      phone: "+91-9876543211",
    },
    {
      id: "STU003",
      rollNumber: "10A003",
      name: "Rahul Verma",
      class: "10",
      section: "A",
      email: "rahul.verma@school.edu",
      phone: "+91-9876543212",
    },
    {
      id: "STU004",
      rollNumber: "10A004",
      name: "Sneha Gupta",
      class: "10",
      section: "A",
      email: "sneha.gupta@school.edu",
      phone: "+91-9876543213",
    },
    {
      id: "STU005",
      rollNumber: "10B001",
      name: "Vikram Kumar",
      class: "10",
      section: "B",
      email: "vikram.kumar@school.edu",
      phone: "+91-9876543214",
    },
  ]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const todayRecords = attendanceRecords.filter(r => r.date === selectedDate);
    const totalStudents = new Set(todayRecords.map(r => r.studentId)).size;
    const presentCount = todayRecords.filter(r => r.status === "present" || r.status === "late" || r.status === "excused").length;
    const absentCount = todayRecords.filter(r => r.status === "absent").length;
    const attendancePercentage = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    // Calculate chronic absentees (attendance < 75% in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentRecords = attendanceRecords.filter(r => new Date(r.date) >= thirtyDaysAgo);
    
    const studentAttendance = new Map<string, { present: number; total: number }>();
    recentRecords.forEach(record => {
      const current = studentAttendance.get(record.studentId) || { present: 0, total: 0 };
      current.total++;
      if (record.status === "present" || record.status === "late" || record.status === "excused") {
        current.present++;
      }
      studentAttendance.set(record.studentId, current);
    });

    const chronicAbsentees = Array.from(studentAttendance.entries()).filter(
      ([, stats]) => (stats.present / stats.total) * 100 < 75
    ).length;

    // Students below 75% attendance
    const below75Count = Array.from(studentAttendance.entries()).filter(
      ([, stats]) => (stats.present / stats.total) * 100 < 75
    ).length;

    return {
      todayAttendance: attendancePercentage.toFixed(1),
      studentsAbsentToday: absentCount,
      studentsBelow75: below75Count,
      chronicAbsentees,
    };
  }, [attendanceRecords, selectedDate]);

  // Filter options
  const classOptions = useMemo(() => {
    const classes = new Set(attendanceRecords.map(r => r.class));
    return Array.from(classes).map(c => ({ value: c, label: `Class ${c}`, count: attendanceRecords.filter(r => r.class === c).length }));
  }, [attendanceRecords]);

  const sectionOptions = useMemo(() => {
    const sections = new Set(attendanceRecords.map(r => r.section));
    return Array.from(sections).map(s => ({ value: s, label: `Section ${s}`, count: attendanceRecords.filter(r => r.section === s).length }));
  }, [attendanceRecords]);

  const teacherOptions = useMemo(() => {
    const teachers = new Set(attendanceRecords.map(r => r.teacher));
    return Array.from(teachers).map(t => ({ value: t, label: t, count: attendanceRecords.filter(r => r.teacher === t).length }));
  }, [attendanceRecords]);

  const statusOptions = [
    { value: "present", label: "Present", count: attendanceRecords.filter(r => r.status === "present").length },
    { value: "absent", label: "Absent", count: attendanceRecords.filter(r => r.status === "absent").length },
    { value: "late", label: "Late", count: attendanceRecords.filter(r => r.status === "late").length },
    { value: "excused", label: "Excused", count: attendanceRecords.filter(r => r.status === "excused").length },
  ];

  const sourceOptions = [
    { value: "manual", label: "Manual", count: attendanceRecords.filter(r => r.source === "manual").length },
    { value: "rfid", label: "RFID", count: attendanceRecords.filter(r => r.source === "rfid").length },
    { value: "biometric", label: "Biometric", count: attendanceRecords.filter(r => r.source === "biometric").length },
  ];

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const matchesSearch =
        searchQuery === "" ||
        record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.class.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass = filters.classes.length === 0 || filters.classes.includes(record.class);
      const matchesSection = filters.sections.length === 0 || filters.sections.includes(record.section);
      const matchesTeacher = filters.teachers.length === 0 || filters.teachers.includes(record.teacher);
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(record.status);
      const matchesSource = filters.sources.length === 0 || (record.source && filters.sources.includes(record.source));

      const matchesDateRange =
        (!dateRange.from || record.date >= dateRange.from) &&
        (!dateRange.to || record.date <= dateRange.to);

      return matchesSearch && matchesClass && matchesSection && matchesTeacher && matchesStatus && matchesSource && matchesDateRange;
    });
  }, [attendanceRecords, searchQuery, filters, dateRange]);

  const handleClearFilters = () => {
    setFilters({
      classes: [],
      sections: [],
      teachers: [],
      statuses: [],
      sources: [],
    });
    setDateRange({ from: "", to: "" });
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

  const exportToPDF = () => {
    alert("PDF export functionality would be implemented here");
  };

  const printReport = () => {
    window.print();
  };

  const totalFilters =
    filters.classes.length +
    filters.sections.length +
    filters.teachers.length +
    filters.statuses.length +
    filters.sources.length +
    (dateRange.from ? 1 : 0) +
    (dateRange.to ? 1 : 0);

  // Tab configurations
  const tabs = [
    { id: "daily", label: "Daily Summary", icon: CalendarIcon },
    { id: "student", label: "Student Trend", icon: UserIcon },
    { id: "chronic", label: "Chronic Absentee", icon: BellAlertIcon },
    { id: "classwise", label: "Class-wise Analysis", icon: AcademicCapIcon },
    { id: "rawlogs", label: "Raw Logs", icon: TableCellsIcon },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DocumentChartBarIcon className="h-8 w-8 text-indigo-600" />
              Attendance Reports
            </h1>
            <p className="text-sm sm:text-base mt-2 text-gray-600">
              Comprehensive attendance analytics and reporting
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={printReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => exportToCSV(filteredRecords.map(r => ({
                Date: r.date,
                'Roll Number': r.rollNumber,
                'Student Name': r.studentName,
                Class: r.class,
                Section: r.section,
                Status: r.status,
                'Time In': r.timeIn || '',
                'Time Out': r.timeOut || '',
                Teacher: r.teacher,
                Source: r.source || '',
                Remarks: r.remarks || '',
              })), `attendance_report_${new Date().toISOString().split('T')[0]}.csv`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Today's Attendance"
            value={`${analytics.todayAttendance}%`}
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
            change={2.5}
            changeLabel="vs yesterday"
          />
          <KPICard
            title="Absent Today"
            value={analytics.studentsAbsentToday}
            icon={<XCircleIcon className="h-6 w-6" />}
            color="red"
          />
          <KPICard
            title="Below 75% Attendance"
            value={analytics.studentsBelow75}
            icon={<ExclamationCircleIcon className="h-6 w-6" />}
            color="yellow"
          />
          <KPICard
            title="Chronic Absentees"
            value={analytics.chronicAbsentees}
            icon={<BellAlertIcon className="h-6 w-6" />}
            color="red"
            change={-1}
            changeLabel="vs last month"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Daily Summary Tab */}
            {activeTab === "daily" && (
              <DailySummaryTab
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                attendanceRecords={attendanceRecords}
                filters={filters}
                searchQuery={searchQuery}
                exportToCSV={exportToCSV}
              />
            )}

            {/* Student Trend Tab */}
            {activeTab === "student" && (
              <StudentTrendTab
                students={students}
                attendanceRecords={attendanceRecords}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}
                exportToCSV={exportToCSV}
              />
            )}

            {/* Chronic Absentee Tab */}
            {activeTab === "chronic" && (
              <ChronicAbsenteeTab
                attendanceRecords={attendanceRecords}
                students={students}
                filters={filters}
                searchQuery={searchQuery}
                exportToCSV={exportToCSV}
              />
            )}

            {/* Class-wise Tab */}
            {activeTab === "classwise" && (
              <ClasswiseTab
                attendanceRecords={attendanceRecords}
                dateRange={dateRange}
                setDateRange={setDateRange}
                filters={filters}
                exportToCSV={exportToCSV}
              />
            )}

            {/* Raw Logs Tab */}
            {activeTab === "rawlogs" && (
              <RawLogsTab
                attendanceRecords={attendanceRecords}
                filteredRecords={filteredRecords}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                exportToCSV={exportToCSV}
              />
            )}
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-xl lg:static lg:z-auto lg:shadow-none">
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

                <FilterSection title="Class">
                  <CheckboxGroup
                    options={classOptions}
                    selectedValues={filters.classes}
                    onChange={(values: string[]) =>
                      setFilters({ ...filters, classes: values })
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

                <FilterSection title="Teacher">
                  <CheckboxGroup
                    options={teacherOptions}
                    selectedValues={filters.teachers}
                    onChange={(values: string[]) =>
                      setFilters({ ...filters, teachers: values })
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

                <FilterSection title="Source">
                  <CheckboxGroup
                    options={sourceOptions}
                    selectedValues={filters.sources}
                    onChange={(values: string[]) =>
                      setFilters({ ...filters, sources: values })
                    }
                  />
                </FilterSection>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl"
      >
        <FunnelIcon className="h-5 w-5" />
        <span className="font-medium">Filters</span>
        {totalFilters > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none bg-white text-indigo-600 rounded-full">
            {totalFilters}
          </span>
        )}
      </button>
    </div>
  );
};

// ==================== TAB COMPONENTS ====================

// Daily Summary Tab
const DailySummaryTab = ({ selectedDate, setSelectedDate, attendanceRecords, filters, searchQuery, exportToCSV }: any) => {
  const dailyData = useMemo(() => {
    const records = attendanceRecords.filter((r: AttendanceRecord) => r.date === selectedDate);
    
    // Group by class and section
    const grouped = new Map<string, any>();
    records.forEach((record: AttendanceRecord) => {
      const key = `${record.class}-${record.section}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          class: record.class,
          section: record.section,
          teacher: record.teacher,
          totalStudents: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }
      const group = grouped.get(key)!;
      group.totalStudents++;
      if (record.status === "present") group.present++;
      if (record.status === "absent") group.absent++;
      if (record.status === "late") group.late++;
      if (record.status === "excused") group.excused++;
    });

    return Array.from(grouped.values()).map(g => ({
      ...g,
      percentage: ((g.present + g.late + g.excused) / g.totalStudents * 100).toFixed(1),
    }));
  }, [attendanceRecords, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => exportToCSV(dailyData.map((d: any) => ({
            Class: d.class,
            Section: d.section,
            'Total Students': d.totalStudents,
            Present: d.present,
            Absent: d.absent,
            Late: d.late,
            Excused: d.excused,
            'Attendance %': d.percentage,
            Teacher: d.teacher,
          })), `daily_summary_${selectedDate}.csv`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Absent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Late
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Excused
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dailyData.map((row: any, idx: number) => (
              <tr key={idx} className={parseFloat(row.percentage) < 75 ? "bg-rose-50" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.class}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.totalStudents}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                  {row.present}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-medium">
                  {row.absent}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">
                  {row.late}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {row.excused}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    parseFloat(row.percentage) >= 75 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {row.percentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.teacher}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dailyData.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance records found for the selected date.
          </p>
        </div>
      )}
    </div>
  );
};

// Student Trend Tab
const StudentTrendTab = ({ students, attendanceRecords, selectedStudent, setSelectedStudent, exportToCSV }: any) => {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");

  // Get unique classes and sections
  const { classes, sections } = useMemo(() => {
    const classSet = new Set<string>();
    const sectionSet = new Set<string>();
    students.forEach((student: Student) => {
      classSet.add(student.class);
      sectionSet.add(student.section);
    });
    return {
      classes: Array.from(classSet).sort(),
      sections: Array.from(sectionSet).sort(),
    };
  }, [students]);

  // Calculate stats for all students
  const allStudentStats = useMemo(() => {
    return students.map((student: Student) => {
      const records = attendanceRecords.filter((r: AttendanceRecord) => r.studentId === student.id);
      const present = records.filter((r: AttendanceRecord) => r.status === "present").length;
      const absent = records.filter((r: AttendanceRecord) => r.status === "absent").length;
      const late = records.filter((r: AttendanceRecord) => r.status === "late").length;
      const excused = records.filter((r: AttendanceRecord) => r.status === "excused").length;
      const total = records.length;
      const percentage = total > 0 ? ((present + late + excused) / total * 100) : 0;

      return {
        ...student,
        present,
        absent,
        late,
        excused,
        total,
        percentage: percentage.toFixed(1),
        records,
      };
    }).sort((a: any, b: any) => parseFloat(b.percentage) - parseFloat(a.percentage));
  }, [students, attendanceRecords]);

  // Filter students based on search, class, and section
  const filteredStudents = useMemo(() => {
    let filtered = allStudentStats;

    // Apply class filter
    if (selectedClass !== "all") {
      filtered = filtered.filter((s: any) => s.class === selectedClass);
    }

    // Apply section filter
    if (selectedSection !== "all") {
      filtered = filtered.filter((s: any) => s.section === selectedSection);
    }

    // Apply search filter
    if (studentSearch) {
      const query = studentSearch.toLowerCase();
      filtered = filtered.filter((s: any) => 
        s.name.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allStudentStats, studentSearch, selectedClass, selectedSection]);

  const selectedStudentStats = useMemo(() => {
    if (!selectedStudent) return null;
    return allStudentStats.find((s: any) => s.id === selectedStudent.id);
  }, [selectedStudent, allStudentStats]);

  const chartData = useMemo(() => {
    if (!selectedStudentStats) return null;

    // Group by month
    const monthlyData = new Map<string, { present: number; absent: number; total: number }>();
    selectedStudentStats.records.forEach((record: AttendanceRecord) => {
      const month = record.date.slice(0, 7);
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { present: 0, absent: 0, total: 0 });
      }
      const data = monthlyData.get(month)!;
      data.total++;
      if (record.status === "present" || record.status === "late" || record.status === "excused") {
        data.present++;
      } else {
        data.absent++;
      }
    });

    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const percentages = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return (data.present / data.total * 100).toFixed(1);
    });

    return {
      series: [{
        name: "Attendance %",
        data: percentages.map(p => parseFloat(p)),
      }],
      options: {
        chart: { type: "line" as const, toolbar: { show: false }, height: 300 },
        stroke: { curve: "smooth" as const, width: 3 },
        colors: ["#4f46e5"],
        dataLabels: { enabled: false },
        xaxis: {
          categories: sortedMonths.map(m => new Date(m + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })),
          labels: { style: { colors: "#6b7280" } },
        },
        yaxis: {
          min: 0,
          max: 100,
          labels: { style: { colors: "#6b7280" } },
        },
        tooltip: { theme: "light" },
        grid: { borderColor: "#f1f5f9" },
      },
    };
  }, [selectedStudentStats]);

  if (selectedStudent && selectedStudentStats) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedStudent(null)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to student list
        </button>

        {/* Student Info Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                <p className="text-indigo-100 mt-1">Roll No: {selectedStudent.rollNumber}</p>
                <p className="text-indigo-100">Class {selectedStudent.class} - Section {selectedStudent.section}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{selectedStudentStats.percentage}%</div>
              <p className="text-indigo-100 text-sm mt-1">Overall Attendance</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{selectedStudentStats.total}</div>
            <div className="text-sm text-gray-600">Total Days</div>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-700">{selectedStudentStats.present}</div>
            <div className="text-sm text-emerald-600">Present</div>
          </div>
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-rose-700">{selectedStudentStats.absent}</div>
            <div className="text-sm text-rose-600">Absent</div>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-amber-700">{selectedStudentStats.late}</div>
            <div className="text-sm text-amber-600">Late</div>
          </div>
        </div>

        {/* Chart */}
        {chartData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Attendance Trend</h3>
              <button
                onClick={() => exportToCSV(selectedStudentStats.records.map((r: AttendanceRecord) => ({
                  Date: r.date,
                  Status: r.status,
                  'Time In': r.timeIn || '',
                  'Time Out': r.timeOut || '',
                  Teacher: r.teacher,
                  Remarks: r.remarks || '',
                })), `${selectedStudent.name}_attendance_history.csv`)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export
              </button>
            </div>
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="line"
              height={300}
            />
          </div>
        )}

        {/* Recent Records */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Attendance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedStudentStats.records.slice(0, 15).map((record: AttendanceRecord) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeIn || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.timeOut || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {record.remarks || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or roll number..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Class Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection("all"); // Reset section when class changes
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Sections</option>
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count and Clear Filters */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredStudents.length}</span> of <span className="font-semibold text-gray-900">{allStudentStats.length}</span> students
            {(selectedClass !== "all" || selectedSection !== "all" || studentSearch) && (
              <span className="ml-2 text-indigo-600">
                (filtered)
              </span>
            )}
          </div>
          {(selectedClass !== "all" || selectedSection !== "all" || studentSearch) && (
            <button
              onClick={() => {
                setSelectedClass("all");
                setSelectedSection("all");
                setStudentSearch("");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student: any) => (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  parseFloat(student.percentage) >= 75 
                    ? "bg-emerald-100 group-hover:bg-emerald-200" 
                    : "bg-rose-100 group-hover:bg-rose-200"
                }`}>
                  <UserIcon className={`h-6 w-6 ${
                    parseFloat(student.percentage) >= 75 ? "text-emerald-600" : "text-rose-600"
                  }`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600">
                    {student.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-medium whitespace-nowrap">
                    {student.class}-{student.section}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {student.rollNumber}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`text-2xl font-bold ${
                    parseFloat(student.percentage) >= 75 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {student.percentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>{student.present}P • {student.absent}A • {student.late}L</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    parseFloat(student.percentage) >= 75 
                      ? "bg-gradient-to-r from-emerald-500 to-green-500" 
                      : "bg-gradient-to-r from-rose-500 to-red-500"
                  }`}
                  style={{ width: `${student.percentage}%` }}
                />
              </div>
            </div>

            {/* Warning Badge */}
            {parseFloat(student.percentage) < 75 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">
                <ExclamationCircleIcon className="h-3.5 w-3.5" />
                Below 75%
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search query.
          </p>
        </div>
      )}
    </div>
  );
};

// Chronic Absentee Tab
const ChronicAbsenteeTab = ({ attendanceRecords, students, filters, searchQuery, exportToCSV }: any) => {
  const [duration, setDuration] = useState(30);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCounselorModal, setShowCounselorModal] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<any>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");

  const chronicData = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - duration);

    const recentRecords = attendanceRecords.filter((r: AttendanceRecord) => new Date(r.date) >= cutoffDate);
    
    const studentMap = new Map<string, any>();
    recentRecords.forEach((record: AttendanceRecord) => {
      if (!studentMap.has(record.studentId)) {
        const student = students.find((s: Student) => s.id === record.studentId);
        studentMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: record.studentName,
          rollNumber: record.rollNumber,
          class: record.class,
          section: record.section,
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          consecutiveAbsences: 0,
          lastAbsentDate: null,
        });
      }
      const data = studentMap.get(record.studentId)!;
      data.totalDays++;
      if (record.status === "present") data.present++;
      if (record.status === "absent") {
        data.absent++;
        if (!data.lastAbsentDate || new Date(record.date) > new Date(data.lastAbsentDate)) {
          data.lastAbsentDate = record.date;
        }
      }
      if (record.status === "late") data.late++;
      if (record.status === "excused") data.excused++;
    });

    // Calculate consecutive absences
    studentMap.forEach((data, studentId) => {
      const studentRecords = recentRecords
        .filter((r: AttendanceRecord) => r.studentId === studentId)
        .sort((a: AttendanceRecord, b: AttendanceRecord) => b.date.localeCompare(a.date));
      
      let consecutive = 0;
      for (const record of studentRecords) {
        if (record.status === "absent") {
          consecutive++;
        } else {
          break;
        }
      }
      data.consecutiveAbsences = consecutive;
    });

    // Filter chronic absentees (< 75% or 5+ consecutive absences)
    return Array.from(studentMap.values())
      .map(d => ({
        ...d,
        percentage: ((d.present + d.late + d.excused) / d.totalDays * 100).toFixed(1),
      }))
      .filter(d => parseFloat(d.percentage) < 75 || d.consecutiveAbsences >= 5)
      .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));
  }, [attendanceRecords, students, duration]);

  const handleScheduleMeeting = (student: any) => {
    setSelectedStudentForAction(student);
    setShowMeetingModal(true);
  };

  const handleAssignCounselor = (student: any) => {
    setSelectedStudentForAction(student);
    setShowCounselorModal(true);
  };

  const submitMeeting = () => {
    // In production, this would call an API
    console.log("Scheduling meeting:", {
      student: selectedStudentForAction,
      date: meetingDate,
      time: meetingTime,
      notes: meetingNotes,
    });
    alert(`Parent meeting scheduled for ${selectedStudentForAction.studentName} on ${meetingDate} at ${meetingTime}`);
    setShowMeetingModal(false);
    setMeetingDate("");
    setMeetingTime("");
    setMeetingNotes("");
  };

  const submitCounselor = () => {
    // In production, this would call an API
    console.log("Assigning counselor:", {
      student: selectedStudentForAction,
      counselor: selectedCounselor,
    });
    alert(`Counselor ${selectedCounselor} assigned to ${selectedStudentForAction.studentName}`);
    setShowCounselorModal(false);
    setSelectedCounselor("");
  };

  const counselors = [
    "Dr. Sarah Johnson",
    "Mr. Michael Chen",
    "Ms. Emily Rodriguez",
    "Dr. David Kumar",
    "Ms. Lisa Anderson",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={15}>Last 15 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
        <button
          onClick={() => exportToCSV(chronicData.map((d: any) => ({
            'Roll Number': d.rollNumber,
            'Student Name': d.studentName,
            Class: d.class,
            Section: d.section,
            'Attendance %': d.percentage,
            'Total Days': d.totalDays,
            Present: d.present,
            Absent: d.absent,
            Late: d.late,
            Excused: d.excused,
            'Consecutive Absences': d.consecutiveAbsences,
          })), `chronic_absentee_report_${duration}days.csv`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {chronicData.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <BellAlertIcon className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-medium text-rose-800">
              {chronicData.length} student{chronicData.length !== 1 ? 's' : ''} requiring intervention
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consecutive Absences</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {chronicData.map((row: any) => (
              <tr key={row.studentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{row.studentName}</div>
                  <div className="text-sm text-gray-500">{row.rollNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row.class}-{row.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    parseFloat(row.percentage) < 50 
                      ? "bg-rose-100 text-rose-800" 
                      : parseFloat(row.percentage) < 75
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {row.percentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalDays}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">{row.present}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-medium">{row.absent}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">{row.late}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {row.consecutiveAbsences >= 5 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      {row.consecutiveAbsences} days
                    </span>
                  ) : (
                    <span className="text-sm text-gray-900">{row.consecutiveAbsences}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleScheduleMeeting(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                      title="Schedule parent meeting"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Meeting
                    </button>
                    <button 
                      onClick={() => handleAssignCounselor(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                      title="Assign counselor"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Counselor
                    </button>
                    <button 
                      className="inline-flex items-center justify-center h-8 w-8 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Send notification to parent"
                      onClick={() => alert(`Notification sent to parent of ${row.studentName}`)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chronicData.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No chronic absentees</h3>
          <p className="mt-1 text-sm text-gray-500">
            All students have good attendance records.
          </p>
        </div>
      )}

      {/* Parent Meeting Modal */}
      {showMeetingModal && selectedStudentForAction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowMeetingModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Schedule Parent Meeting
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Student: <span className="font-semibold text-gray-900">{selectedStudentForAction.studentName}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Class: <span className="font-semibold text-gray-900">{selectedStudentForAction.class}-{selectedStudentForAction.section}</span>
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting Date
                        </label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting Time
                        </label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={meetingNotes}
                          onChange={(e) => setMeetingNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Add any notes about the meeting..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={submitMeeting}
                  disabled={!meetingDate || !meetingTime}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Counselor Modal */}
      {showCounselorModal && selectedStudentForAction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCounselorModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Assign Counselor
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          Student: <span className="font-semibold text-gray-900">{selectedStudentForAction.studentName}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Class: <span className="font-semibold text-gray-900">{selectedStudentForAction.class}-{selectedStudentForAction.section}</span>
                        </p>
                        <p className="text-sm text-rose-600 mt-2">
                          Attendance: <span className="font-semibold">{selectedStudentForAction.percentage}%</span>
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Counselor
                        </label>
                        <select
                          value={selectedCounselor}
                          onChange={(e) => setSelectedCounselor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="">-- Select a counselor --</option>
                          {counselors.map((counselor) => (
                            <option key={counselor} value={counselor}>
                              {counselor}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                          <strong>Note:</strong> The assigned counselor will be notified and will receive the student's attendance history.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={submitCounselor}
                  disabled={!selectedCounselor}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Counselor
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounselorModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Class-wise Analysis Tab
const ClasswiseTab = ({ attendanceRecords, dateRange, setDateRange, filters, exportToCSV }: any) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const classwiseData = useMemo(() => {
    const filtered = attendanceRecords.filter((r: AttendanceRecord) => {
      return (
        (!dateRange.from || r.date >= dateRange.from) &&
        (!dateRange.to || r.date <= dateRange.to)
      );
    });

    const grouped = new Map<string, any>();
    filtered.forEach((record: AttendanceRecord) => {
      const key = `${record.class}-${record.section}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          class: record.class,
          section: record.section,
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }
      const group = grouped.get(key)!;
      group.totalDays++;
      if (record.status === "present") group.present++;
      if (record.status === "absent") group.absent++;
      if (record.status === "late") group.late++;
      if (record.status === "excused") group.excused++;
    });

    return Array.from(grouped.values()).map(g => ({
      ...g,
      percentage: ((g.present + g.late + g.excused) / g.totalDays * 100).toFixed(1),
    }));
  }, [attendanceRecords, dateRange]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const filtered = attendanceRecords.filter((r: AttendanceRecord) => r.date.startsWith(selectedMonth));
    
    const grouped = new Map<string, any>();
    filtered.forEach((record: AttendanceRecord) => {
      const key = `${record.class}-${record.section}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          class: record.class,
          section: record.section,
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }
      const group = grouped.get(key)!;
      group.totalDays++;
      if (record.status === "present") group.present++;
      if (record.status === "absent") group.absent++;
      if (record.status === "late") group.late++;
      if (record.status === "excused") group.excused++;
    });

    return Array.from(grouped.values()).map(g => ({
      ...g,
      percentage: ((g.present + g.late + g.excused) / g.totalDays * 100).toFixed(1),
    }));
  }, [attendanceRecords, selectedMonth]);

  const chartData = useMemo(() => {
    if (monthlyData.length === 0) return null;

    return {
      series: [{
        name: "Attendance %",
        data: monthlyData.map((d: any) => parseFloat(d.percentage)),
      }],
      options: {
        chart: { type: "bar" as const, toolbar: { show: false }, height: 350 },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            borderRadius: 4,
          },
        },
        dataLabels: { enabled: false },
        colors: ["#4f46e5"],
        xaxis: {
          categories: monthlyData.map((d: any) => `${d.class}-${d.section}`),
          labels: { style: { colors: "#6b7280" } },
        },
        yaxis: {
          min: 0,
          max: 100,
          labels: { style: { colors: "#6b7280" } },
        },
        tooltip: { theme: "light" },
        grid: { borderColor: "#f1f5f9" },
      },
    };
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <button
          onClick={() => exportToCSV(classwiseData.map((d: any) => ({
            Class: d.class,
            Section: d.section,
            'Total Days': d.totalDays,
            Present: d.present,
            Absent: d.absent,
            Late: d.late,
            Excused: d.excused,
            'Attendance %': d.percentage,
          })), `classwise_report_${dateRange.from}_${dateRange.to}.csv`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Attendance Overview</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        {chartData ? (
          <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={350}
          />
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No data available for selected month</p>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Class-wise Attendance Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Excused</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classwiseData.map((row: any, idx: number) => (
                <tr key={idx} className={parseFloat(row.percentage) < 75 ? "bg-rose-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">{row.present}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-medium">{row.absent}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-medium">{row.late}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{row.excused}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      parseFloat(row.percentage) >= 75 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {classwiseData.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance records found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
};

// Raw Logs Tab
const RawLogsTab = ({ attendanceRecords, filteredRecords, searchQuery, setSearchQuery, currentPage, setCurrentPage, itemsPerPage, exportToCSV }: any) => {
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by student name, roll number, or class..."
        />
        <button
          onClick={() => exportToCSV(filteredRecords.map((r: AttendanceRecord) => ({
            Date: r.date,
            'Roll Number': r.rollNumber,
            'Student Name': r.studentName,
            Class: r.class,
            Section: r.section,
            Status: r.status,
            'Time In': r.timeIn || '',
            'Time Out': r.timeOut || '',
            Teacher: r.teacher,
            Source: r.source || '',
            'Device ID': r.deviceId || '',
            Remarks: r.remarks || '',
          })), `raw_attendance_logs_${new Date().toISOString().split('T')[0]}.csv`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRecords.map((record: AttendanceRecord) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                  <div className="text-sm text-gray-500">{record.rollNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.class}-{record.section}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.timeIn || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.timeOut || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {record.source && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {record.source}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.teacher}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {record.remarks || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {filteredRecords.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRecords.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default AttendanceReports;
