import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ClockIcon as ClockSolidIcon } from '@heroicons/react/24/solid';
import { apiPost } from '@/shared/api/apiClient';
import ReactApexChart from 'react-apexcharts';
import EducatorHistoryModal from './EducatorHistoryModal';

interface EducatorSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  facultyId: string;
  facultyName: string;
  department: string;
  subject: string;
  roomNumber: string;
  status: 'completed' | 'scheduled';
  remarks: string;
  createdAt: string;
}

interface Analytics {
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  totalFaculty: number;
  attendanceRate: string;
  departmentStats: Array<{
    department: string;
    total: number;
    completed: number;
    rate: string;
  }>;
}

interface WeeklyTrend {
  date: string;
  dayName: string;
  count: number;
}

interface DepartmentBreakdown {
  department: string;
  count: number;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export default function EducatorAttendanceTracking() {
  const [sessions, setSessions] = useState<EducatorSession[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DepartmentBreakdown[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedFacultyForHistory, setSelectedFacultyForHistory] = useState<Faculty | null>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const departments = [...new Set(facultyList.map(f => f.department))].filter(Boolean);

  useEffect(() => {
    fetchCollegeId();
  }, []);

  useEffect(() => {
    if (collegeId) {
      fetchData();
    }
  }, [collegeId, searchQuery, selectedDepartment, selectedFaculty, selectedStatus, dateRange, currentPage]);

  const fetchCollegeId = async () => {
    try {
      const result = await apiPost('/college-admin/attendance', {
        action: 'resolve-college-id',
      });
      setCollegeId(result.data?.collegeId || null);
    } catch (error) {
      console.error('Error fetching college ID:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedDepartment) filters.departments = [selectedDepartment];
      if (selectedFaculty) filters.faculty = [selectedFaculty];
      if (selectedStatus) filters.statuses = [selectedStatus];

      const dateRangeParam = dateRange.from || dateRange.to ? dateRange : null;

      const [sessionsResult, analyticsResult, trendResult, facultyResult] = await Promise.all([
        apiPost('/college-admin/attendance', {
          action: 'get-educator-sessions',
          collegeId,
          searchQuery,
          filters,
          dateRange: dateRangeParam,
          currentPage,
          itemsPerPage,
        }),
        apiPost('/college-admin/attendance', {
          action: 'get-educator-analytics',
          collegeId,
          filters,
          dateRange: dateRangeParam,
        }),
        apiPost('/college-admin/attendance', {
          action: 'get-educator-weekly-trend',
          collegeId,
          filters,
          dateRange: dateRangeParam,
        }),
        apiPost('/college-admin/attendance', {
          action: 'get-all-faculty',
          collegeId,
        }),
      ]);

      setSessions(sessionsResult.data?.sessions || []);
      setTotalCount(sessionsResult.data?.totalCount || 0);
      setAnalytics(analyticsResult.data || null);
      setWeeklyTrend(trendResult.data?.weeklyTrend || []);
      setDepartmentBreakdown(trendResult.data?.departmentBreakdown || []);
      setFacultyList(facultyResult.data?.faculty || []);
      
      // Debug: Check what data we received
      console.log('[FRONTEND DEBUG] Weekly trend data:', trendResult.data?.weeklyTrend);
      console.log('[FRONTEND DEBUG] Department breakdown:', trendResult.data?.departmentBreakdown);
    } catch (error) {
      console.error('Error fetching educator attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (faculty: Faculty) => {
    setSelectedFacultyForHistory(faculty);
    setShowHistoryModal(true);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
    setSelectedFaculty('');
    setSelectedStatus('');
    setDateRange({ from: '', to: '' });
    setCurrentPage(1);
  };

  const handleExportReport = () => {
    // Prepare CSV data
    const csvHeaders = ['Date', 'Faculty Name', 'Department', 'Time', 'Subject', 'Room', 'Status', 'Remarks'];
    const csvRows = sessions.map(session => [
      formatDate(session.date),
      session.facultyName,
      session.department,
      `${formatTime(session.startTime)} - ${formatTime(session.endTime)}`,
      session.subject || '-',
      session.roomNumber || '-',
      session.status.charAt(0).toUpperCase() + session.status.slice(1),
      session.remarks || '-'
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `educator-attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // ApexCharts configuration for Weekly Attendance Trend
  const attendanceTrendData = useMemo(() => ({
    series: [{
      name: "Sessions Completed",
      data: weeklyTrend.length === 7 ? weeklyTrend.map(d => d.count) : [0, 0, 0, 0, 0, 0, 0],
    }],
    options: {
      chart: {
        type: "area" as const,
        toolbar: { show: false },
        height: 300,
      },
      stroke: {
        curve: "smooth" as const,
        width: 3,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
        },
      },
      colors: ["#3b82f6"], // Blue color
      dataLabels: { enabled: false },
      xaxis: {
        categories: weeklyTrend.length === 7 
          ? weeklyTrend.map(d => d.dayName || 'N/A') 
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        labels: {
          style: { colors: "#6b7280" },
        },
      },
      yaxis: {
        min: 0,
        labels: {
          style: { colors: "#6b7280" },
          formatter: (value: number) => Math.floor(value).toString(),
        },
      },
      tooltip: {
        theme: "light",
        custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
          const count = series[seriesIndex][dataPointIndex];
          const dayName = w.globals.labels[dataPointIndex];
          
          // Build department breakdown text
          let departmentText = '';
          if (departmentBreakdown.length > 0) {
            departmentText = '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">' +
              '<div style="font-size: 11px; font-weight: 600; color: #6b7280; margin-bottom: 4px;">Departments:</div>';
            
            departmentBreakdown.forEach(dept => {
              departmentText += `<div style="font-size: 11px; color: #374151; margin-bottom: 2px;">• ${dept.department}: ${dept.count} session${dept.count !== 1 ? 's' : ''}</div>`;
            });
            
            departmentText += '</div>';
          }
          
          return '<div style="padding: 10px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">' +
            '<div style="font-weight: 600; color: #111827; margin-bottom: 4px;">' + dayName + '</div>' +
            '<div style="color: #3b82f6; font-weight: 500;">Sessions Completed: ' + count + '</div>' +
            departmentText +
            '</div>';
        },
      },
      grid: {
        borderColor: '#e5e7eb',
      },
    },
  }), [weeklyTrend, departmentBreakdown]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.totalSessions || 0}
              </p>
            </div>
            <CalendarIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {analytics?.completedSessions || 0}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Faculty</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.totalFaculty || 0}
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {analytics?.attendanceRate || 0}%
              </p>
            </div>
            <ChartBarIcon className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5" />
          Weekly Attendance Trend
        </h3>
        <ReactApexChart
          options={attendanceTrendData.options}
          series={attendanceTrendData.series}
          type="area"
          height={300}
        />
      </div>

      {/* Department Stats */}
      {analytics?.departmentStats && analytics.departmentStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Department-wise Attendance
          </h3>
          <div className="space-y-3">
            {analytics.departmentStats.slice(0, 5).map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{dept.department}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {dept.completed}/{dept.total} ({dept.rate}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${dept.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, Filters, and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by faculty name or department..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={sessions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export Report
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Faculty
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => {
                    setSelectedFaculty(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Faculty</option>
                  {facultyList.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, from: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => {
                      setDateRange({ ...dateRange, to: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(session.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.facultyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {session.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {session.subject || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          }`}
                      >
                        {session.status === 'completed' ? (
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ClockSolidIcon className="h-4 w-4 mr-1" />
                        )}
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleViewHistory(facultyList.find(f => f.id === session.facultyId)!)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EducatorHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedFacultyForHistory(null);
        }}
        faculty={selectedFacultyForHistory}
      />
    </div>
  );
}
