import { AttendanceRecord, AttendanceSession } from '@/types/Attendance';
import { Student } from '@/types/student';
import { BuildingOfficeIcon, ChartBarIcon, ChartPieIcon, ClipboardDocumentCheckIcon, DocumentArrowDownIcon, ExclamationCircleIcon, TableCellsIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ShieldCheckIcon, SparklesIcon, XCircleIcon } from 'lucide-react';
import React, { useState } from 'react'
import ReactApexChart from 'react-apexcharts';

// SubjectGroup interface
interface SubjectGroup {
    subject: string;
    department: string;
    course: string;
    semester: number;
    section: string;
    faculty: string;
    sessions: AttendanceSession[];
    totalSessions: number;
    avgAttendancePercentage: number;
    totalStudents: number;
    totalPresentCount: number;
    totalAbsentCount: number;
    totalLateCount: number;
    totalExcusedCount: number;
    dateRange: {
        first: string;
        last: string;
    };
    latestStatus: string;
}

// ==================== UTILITIES ====================
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
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
    return configs[status] || configs.scheduled;
};

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


// Attendance Details Modal
const AttendanceDetailsModal = ({
    isOpen,
    onClose,
    subjectGroup,
    records,
    students,
    allRecords,
    onViewStudentHistory,
    onExportSession,
    onExportMonthly,
}: {
    isOpen: boolean;
    onClose: () => void;
    subjectGroup: SubjectGroup | null;
    records: AttendanceRecord[];
    students: Student[];
    allRecords: AttendanceRecord[];
    onViewStudentHistory: (student: Student) => void;
    onExportSession: (session: AttendanceSession, records: AttendanceRecord[]) => void;
    onExportMonthly: (session: AttendanceSession, students: Student[], allRecords: AttendanceRecord[]) => void;
}) => {
    // Default to first session
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"today" | "monthly" | "history">("today");
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Set default selected session when modal opens
    React.useEffect(() => {
        if (isOpen && subjectGroup && subjectGroup.sessions.length > 0 && !selectedSessionId) {
            setSelectedSessionId(subjectGroup.sessions[0].id);
        }
    }, [isOpen, subjectGroup, selectedSessionId]);

    // Local export function for modal
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

    if (!isOpen || !subjectGroup) return null;

    // Get the selected session
    const session = subjectGroup.sessions.find(s => s.id === selectedSessionId) || subjectGroup.sessions[0];

    // Get class students for this subject
    const classStudents = students.filter(
        (student) =>
            student.department === subjectGroup.department &&
            student.course === subjectGroup.course &&
            student.semester === subjectGroup.semester &&
            student.section === subjectGroup.section
    );

    // Get today's records (for selected session) with full student list
    const sessionRecords = allRecords.filter(r => r.date === session.date && r.subject === subjectGroup.subject);
    const todaysRecords = classStudents.map((student) => {
        const record = sessionRecords.find((r) => r.studentId === student.id);
        return record || {
            id: `not-marked-${student.id}`,
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            department: student.department,
            course: student.course,
            semester: student.semester,
            section: student.section,
            date: session.date,
            status: "not-marked" as const,
            subject: session.subject,
            facultyId: session.faculty,
            facultyName: session.faculty,
        };
    });

    // Student history data
    const getStudentHistory = (studentId: string) => {
        return allRecords.filter((record) => record.studentId === studentId && record.subject === subjectGroup.subject);
    };

    const getStudentStats = (studentId: string, monthFilter?: string) => {
        const history = getStudentHistory(studentId);
        const filteredHistory = monthFilter
            ? history.filter((r) => r.date.startsWith(monthFilter))
            : history;

        const present = filteredHistory.filter((r) => r.status === "present").length;
        const absent = filteredHistory.filter((r) => r.status === "absent").length;
        const late = filteredHistory.filter((r) => r.status === "late").length;
        const excused = filteredHistory.filter((r) => r.status === "excused").length;
        const total = filteredHistory.length;
        const percentage = total > 0 ? ((present + late + excused) / total * 100).toFixed(1) : "0";

        return { present, absent, late, excused, total, percentage };
    };

    const getMonthlyData = (month: string) => {
        const monthRecords = allRecords.filter((record) =>
            record.subject === subjectGroup.subject && record.date.startsWith(month)
        );

        // Group by date for trend chart
        const dateGroups: { [key: string]: AttendanceRecord[] } = {};
        monthRecords.forEach((record) => {
            if (!dateGroups[record.date]) {
                dateGroups[record.date] = [];
            }
            dateGroups[record.date].push(record);
        });

        // Calculate attendance percentage for each date
        const trendData = Object.entries(dateGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, records]) => {
                const present = records.filter(r => r.status === "present" || r.status === "late" || r.status === "excused").length;
                const total = records.length;
                const percentage = total > 0 ? (present / total) * 100 : 0;
                return {
                    date: formatDate(date),
                    percentage: Math.round(percentage)
                };
            });

        // Overall monthly stats
        const totalPresent = monthRecords.filter(r => r.status === "present").length;
        const totalAbsent = monthRecords.filter(r => r.status === "absent").length;
        const totalLate = monthRecords.filter(r => r.status === "late").length;
        const totalExcused = monthRecords.filter(r => r.status === "excused").length;

        return {
            trendData,
            monthlyStats: {
                present: totalPresent,
                absent: totalAbsent,
                late: totalLate,
                excused: totalExcused,
                total: monthRecords.length
            }
        };
    };

    const tabs = [
        { id: "today" as const, label: "Session Attendance", icon: CalendarIcon },
        { id: "monthly" as const, label: "Monthly Overview", icon: ChartBarIcon },
        { id: "history" as const, label: "Detailed History", icon: TableCellsIcon },
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {subjectGroup.subject} - Attendance Details
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <UserGroupIcon className="h-4 w-4" />
                                    {subjectGroup.faculty}
                                </span>
                                <span className="flex items-center gap-1">
                                    <BuildingOfficeIcon className="h-4 w-4" />
                                    {subjectGroup.department}
                                </span>
                                <span className="flex items-center gap-1">
                                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                    {subjectGroup.totalSessions} Total Session{subjectGroup.totalSessions !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Session Selector */}
                    {subjectGroup.sessions.length > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">Select Session:</label>
                                <select
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                >
                                    {subjectGroup.sessions.map((sess, index) => (
                                        <option key={sess.id} value={sess.id}>
                                            Session {subjectGroup.sessions.length - index} - {formatDate(sess.date)} ({formatTime(sess.startTime)} - {formatTime(sess.endTime)}) - {sess.attendancePercentage.toFixed(1)}% attendance
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Session Info */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDate(session.date)}
                            </span>
                            <span className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4" />
                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </span>
                            <StatusBadge status={session.status} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-2xl font-bold text-gray-900">
                                    {session.totalStudents}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Total Students</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-2xl font-bold text-green-800">
                                    {session.presentCount}
                                </p>
                                <p className="text-xs text-green-600 mt-1">Present</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                <p className="text-2xl font-bold text-red-800">
                                    {session.absentCount}
                                </p>
                                <p className="text-xs text-red-600 mt-1">Absent</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-2xl font-bold text-yellow-800">
                                    {session.lateCount}
                                </p>
                                <p className="text-xs text-yellow-600 mt-1">Late</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-2xl font-bold text-blue-800">
                                    {session.excusedCount}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">Excused</p>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                <p className="text-2xl font-bold text-indigo-800">
                                    {session.attendancePercentage.toFixed(1)}%
                                </p>
                                <p className="text-xs text-indigo-600 mt-1">Attendance Rate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div><strong>Course:</strong> {subjectGroup.course} - Sem {subjectGroup.semester} ({subjectGroup.section})</div>
                            <div><strong>Duration:</strong> {(() => {
                                const start = new Date(`2000-01-01T${session.startTime}`);
                                const end = new Date(`2000-01-01T${session.endTime}`);
                                const diff = Math.abs(end.getTime() - start.getTime());
                                const minutes = Math.floor(diff / 1000 / 60);
                                return `${minutes} minutes`;
                            })()}</div>
                            <div><strong>Total Sessions:</strong> {subjectGroup.totalSessions}</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {activeTab === "today" && (
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Session Attendance Records
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Roll No
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time In
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time Out
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Remarks
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {todaysRecords.map((record) => (
                                                <tr key={record.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {record.rollNumber}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {record.studentName}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <StatusBadge status={record.status} />
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {record.timeIn || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {record.timeOut || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {record.remarks || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => {
                                                                const student = classStudents.find(s => s.id === record.studentId);
                                                                if (student) onViewStudentHistory(student);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            View History
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "monthly" && (
                            <div className="p-6">
                                {/* Month Selector */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Monthly Attendance Overview
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-gray-700">Select Month:</label>
                                            <input
                                                type="month"
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Attendance Trend Chart */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                                                Class Attendance Trend ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                                            </h4>
                                            {(() => {
                                                const monthlyData = getMonthlyData(selectedMonth);
                                                return (
                                                    <ReactApexChart
                                                        options={{
                                                            chart: { type: "area" as const, toolbar: { show: false }, height: 250 },
                                                            stroke: { curve: "smooth" as const, width: 3 },
                                                            fill: {
                                                                type: "gradient",
                                                                gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
                                                            },
                                                            colors: ["#4f46e5"],
                                                            dataLabels: { enabled: false },
                                                            xaxis: {
                                                                categories: monthlyData.trendData.map(d => d.date),
                                                                labels: { style: { colors: "#6b7280" }, rotate: -45 },
                                                            },
                                                            yaxis: {
                                                                min: 0,
                                                                max: 100,
                                                                labels: { style: { colors: "#6b7280" } },
                                                            },
                                                            tooltip: { theme: "light" },
                                                        }}
                                                        series={[
                                                            {
                                                                name: "Attendance %",
                                                                data: monthlyData.trendData.map(d => d.percentage),
                                                            },
                                                        ]}
                                                        type="area"
                                                        height={250}
                                                    />
                                                );
                                            })()}
                                        </div>

                                        {/* Attendance Breakdown Pie Chart */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <ChartPieIcon className="h-5 w-5 text-indigo-600" />
                                                Monthly Breakdown ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short' })})
                                            </h4>
                                            {(() => {
                                                const monthlyData = getMonthlyData(selectedMonth);
                                                const { monthlyStats } = monthlyData;
                                                return (
                                                    <ReactApexChart
                                                        options={{
                                                            chart: { type: "pie" as const, toolbar: { show: false } },
                                                            colors: ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"],
                                                            labels: ["Present", "Absent", "Late", "Excused"],
                                                            legend: { position: "bottom" },
                                                            tooltip: { theme: "light" },
                                                        }}
                                                        series={[monthlyStats.present, monthlyStats.absent, monthlyStats.late, monthlyStats.excused]}
                                                        type="pie"
                                                        height={250}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Student-wise Monthly Summary */}
                                <div className="mt-6">
                                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                                        Student-wise Monthly Summary ({new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Roll No
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student Name
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Present
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Absent
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Late
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Excused
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Days
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Percentage
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {classStudents.map((student) => {
                                                    const stats = getStudentStats(student.id, selectedMonth);
                                                    return (
                                                        <tr key={student.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {student.rollNumber}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {student.name}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                                                                {stats.present}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                                                                {stats.absent}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-yellow-600 font-medium">
                                                                {stats.late}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                                                                {stats.excused}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                                                                {stats.total}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-indigo-600">
                                                                {stats.percentage}%
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Detailed Attendance History (All Sessions)
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="From date"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="To date"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Roll No
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Student Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time In
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time Out
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Remarks
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {allRecords
                                                .filter((record) => record.subject === subjectGroup.subject)
                                                .filter((record) => {
                                                    if (!dateRange.from && !dateRange.to) return true;
                                                    if (dateRange.from && record.date < dateRange.from) return false;
                                                    if (dateRange.to && record.date > dateRange.to) return false;
                                                    return true;
                                                })
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                .map((record) => (
                                                    <tr key={record.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(record.date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {record.rollNumber}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {record.studentName}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <StatusBadge status={record.status} />
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {record.timeIn || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {record.timeOut || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {record.remarks || "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {activeTab === "today" ? "selected session's" : activeTab === "monthly" ? "monthly" : "all sessions'"} attendance data
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    if (activeTab === "today") {
                                        // Export selected session data
                                        onExportSession(session, todaysRecords);
                                    } else if (activeTab === "monthly") {
                                        // Export monthly summary for selected month
                                        const monthlyStudents = students.filter(
                                            (student) =>
                                                student.department === subjectGroup.department &&
                                                student.course === subjectGroup.course &&
                                                student.semester === subjectGroup.semester &&
                                                student.section === subjectGroup.section
                                        );

                                        const monthlyExportData = monthlyStudents.map(student => {
                                            const studentRecords = allRecords.filter(r =>
                                                r.studentId === student.id &&
                                                r.subject === subjectGroup.subject &&
                                                r.date.startsWith(selectedMonth)
                                            );
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
                                                'Month': new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                                            };
                                        });

                                        const filename = `${subjectGroup.subject}_${selectedMonth.replace('-', '_')}_monthly_summary.csv`;
                                        exportToCSV(monthlyExportData, filename);
                                    } else {
                                        // Export all sessions for the subject
                                        const subjectRecords = allRecords.filter(r => r.subject === subjectGroup.subject);
                                        onExportSession(session, subjectRecords);
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                                Export {activeTab === "today" ? "Session" : activeTab === "monthly" ? "Monthly" : "All"} Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceDetailsModal