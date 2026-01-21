import { AttendanceRecord, AttendanceSession, Student } from '@/types/Attendance';
import {
  AcademicCapIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from 'lucide-react';
import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

// ==================== UTILITIES ====================
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusConfig = (status: string) => {
  const configs = {
    present: {
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircleIcon,
      label: 'Present',
    },
    absent: {
      color: 'from-rose-500 to-red-500',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircleIcon,
      label: 'Absent',
    },
    late: {
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: ClockIcon,
      label: 'Late',
    },
    excused: {
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: ShieldCheckIcon,
      label: 'Excused',
    },
    'not-marked': {
      color: 'from-gray-400 to-gray-500',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: ExclamationCircleIcon,
      label: 'Not Marked',
    },
    completed: {
      color: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircleIcon,
      label: 'Completed',
    },
    ongoing: {
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: SparklesIcon,
      label: 'Ongoing',
    },
    scheduled: {
      color: 'from-gray-400 to-gray-500',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: CalendarIcon,
      label: 'Scheduled',
    },
  };
  return configs[status] || configs.scheduled;
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text} border ${config.border} font-medium text-xs shadow-sm`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

// Student History Modal
const StudentHistoryModal = ({
  isOpen,
  onClose,
  student,
  allRecords,
  session,
  onExportHistory,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  allRecords: AttendanceRecord[];
  session: AttendanceSession | null;
  onExportHistory: (
    student: Student,
    session: AttendanceSession,
    allRecords: AttendanceRecord[]
  ) => void;
}) => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  if (!isOpen || !student || !session) return null;

  const studentHistory = allRecords.filter(
    (record) => record.studentId === student.id && record.subject === session.subject
  );

  const stats = {
    present: studentHistory.filter((r) => r.status === 'present').length,
    absent: studentHistory.filter((r) => r.status === 'absent').length,
    late: studentHistory.filter((r) => r.status === 'late').length,
    excused: studentHistory.filter((r) => r.status === 'excused').length,
    total: studentHistory.length,
    percentage:
      studentHistory.length > 0
        ? (
            (studentHistory.filter(
              (r) => r.status === 'present' || r.status === 'late' || r.status === 'excused'
            ).length /
              studentHistory.length) *
            100
          ).toFixed(1)
        : '0',
  };

  const filteredHistory = studentHistory
    .filter((record) => {
      if (!dateRange.from && !dateRange.to) return true;
      if (dateRange.from && record.date < dateRange.from) return false;
      if (dateRange.to && record.date > dateRange.to) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {student.name} - Attendance History
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="h-4 w-4" />
                  {student.rollNumber}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpenIcon className="h-4 w-4" />
                  {session.subject}
                </span>
                <span className="flex items-center gap-1">
                  <AcademicCapIcon className="h-4 w-4" />
                  {student.course} - Sem {student.semester}
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

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-800">{stats.present}</p>
                <p className="text-xs text-green-600 mt-1">Present</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-800">{stats.absent}</p>
                <p className="text-xs text-red-600 mt-1">Absent</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-800">{stats.late}</p>
                <p className="text-xs text-yellow-600 mt-1">Late</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-800">{stats.excused}</p>
                <p className="text-xs text-blue-600 mt-1">Excused</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-xs text-gray-600 mt-1">Total Days</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-2xl font-bold text-indigo-800">{stats.percentage}%</p>
                <p className="text-xs text-indigo-600 mt-1">Attendance Rate</p>
              </div>
            </div>

            {/* Student Trend Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                Attendance Trend
              </h4>
              <ReactApexChart
                options={{
                  chart: { type: 'line' as const, toolbar: { show: false }, height: 200 },
                  stroke: { curve: 'smooth' as const, width: 3 },
                  colors: ['#4f46e5'],
                  dataLabels: { enabled: false },
                  xaxis: {
                    categories: studentHistory.slice(-7).map((r) => formatDate(r.date)),
                    labels: { style: { colors: '#6b7280' }, rotate: -45 },
                  },
                  yaxis: {
                    min: 0,
                    max: 1,
                    labels: {
                      style: { colors: '#6b7280' },
                      formatter: (val) => (val === 1 ? 'Present' : 'Absent'),
                    },
                  },
                  tooltip: { theme: 'light' },
                }}
                series={[
                  {
                    name: 'Attendance',
                    data: studentHistory
                      .slice(-7)
                      .map((r) =>
                        r.status === 'present' || r.status === 'late' || r.status === 'excused'
                          ? 1
                          : 0
                      ),
                  },
                ]}
                type="line"
                height={200}
              />
            </div>
          </div>

          {/* History Table */}
          <div className="px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
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
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {filteredHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {record.timeIn || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {record.timeOut || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {studentHistory.length} records
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onExportHistory(student, session, allRecords)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistoryModal;
