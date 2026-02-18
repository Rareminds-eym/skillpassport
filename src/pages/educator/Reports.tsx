import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { ComponentType } from 'react';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useEducatorSchool } from '../../hooks/useEducatorSchool';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  color: string;
  trend?: { value: number; label: string };
  subtitle?: string;
}

const StatCard = React.memo(({ title, value, icon: Icon, color, trend, subtitle }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-xs text-gray-500 mt-2">
              <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {' '}{trend.label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'attendance' | 'growth'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  const {
    loading,
    kpiData,
    skillSummary,
    attendanceData,
    skillGrowthData,
    leaderboard,
    certificateStats,
    assignmentStats,
    assignmentDetails,
    topSkills,
    exportAsCSV,
    exportAsPDF,
  } = useAnalytics({ 
    schoolId: educatorSchool?.id,
    collegeId: educatorCollege?.id,
    educatorType,
    educatorRole,
    assignedClassIds
  });

  useEffect(() => {
    setTotalPages(Math.ceil(leaderboard.length / itemsPerPage));
    setCurrentPage(1);
  }, [leaderboard.length, itemsPerPage]);

  const kpiCards = useMemo(() => [
    {
      title: 'Active Students',
      value: kpiData.activeStudents,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      subtitle: 'Students with activities',
    },
    {
      title: 'Verified Activities',
      value: kpiData.totalVerifiedActivities,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      subtitle: 'Completed verifications',
    },
    {
      title: 'Pending Verifications',
      value: kpiData.pendingVerifications,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      subtitle: 'Awaiting review',
    },
    {
      title: 'Avg Skills/Student',
      value: kpiData.avgSkillsPerStudent.toFixed(1),
      icon: BookOpenIcon,
      color: 'bg-purple-500',
      subtitle: 'Average per student',
    },
    {
      title: 'Attendance Rate',
      value: `${kpiData.attendanceRate}%`,
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      subtitle: 'Last 7 days (demo)',
    },
    {
      title: 'Engagement Rate',
      value: `${kpiData.engagementRate}%`,
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      subtitle: 'Overall engagement',
    },
  ], [kpiData]);

  const skillSummaryOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: ['#3B82F6', '#10B981'],
    xaxis: {
      categories: skillSummary.map((s) => s.category),
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: '#1F2937',
          fontWeight: 500,
        },
      },
    },
    legend: {
      position: 'top',
      fontSize: '14px',
      horizontalAlign: 'right',
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600,
      },
    },
  };

  const skillSummarySeries = [
    {
      name: 'Total Activities',
      data: skillSummary.map((s) => s.totalActivities),
    },
    {
      name: 'Verified',
      data: skillSummary.map((s) => s.verifiedActivities),
    },
  ];

  const attendanceOptions: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 8,
        columnWidth: '60%',
      },
    },
    colors: ['#10B981', '#EF4444', '#F59E0B'],
    xaxis: {
      categories: attendanceData.map((d) => d.month),
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Students',
        style: {
          fontSize: '14px',
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    legend: {
      position: 'top',
      fontSize: '14px',
      horizontalAlign: 'right',
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: false,
    },
  };

  const attendanceSeries = [
    {
      name: 'Present',
      data: attendanceData.map((d) => d.present),
    },
    {
      name: 'Absent',
      data: attendanceData.map((d) => d.absent),
    },
    {
      name: 'Late',
      data: attendanceData.map((d) => d.late),
    },
  ];

  const skillGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
        offsetY: -10,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round',
    },
    colors: ['#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B'],
    xaxis: {
      categories: skillGrowthData.map((d) => d.month),
      labels: {
        style: {
          fontSize: '11px',
          colors: '#9CA3AF',
        },
      },
      axisBorder: {
        show: true,
        color: '#E5E7EB',
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: 'Skill Level',
        style: {
          fontSize: '11px',
          fontWeight: 400,
          color: '#9CA3AF',
        },
        offsetX: 0,
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#9CA3AF',
        },
      },
      min: 0,
      max: 100,
      tickAmount: 5,
    },
    legend: {
      position: 'top',
      fontSize: '13px',
      horizontalAlign: 'right',
      offsetY: 0,
    },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}`,
      },
    },
    markers: {
      size: 0,
    },
  };

  const skillGrowthSeries = [
    {
      name: 'Technical',
      data: skillGrowthData.map((d) => d.technical),
    },
    {
      name: 'Communication',
      data: skillGrowthData.map((d) => d.communication),
    },
    {
      name: 'Leadership',
      data: skillGrowthData.map((d) => d.leadership),
    },
    {
      name: 'Creativity',
      data: skillGrowthData.map((d) => d.creativity),
    },
  ];

  const skillDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: skillSummary.map((s) => s.category),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1'],
    legend: {
      position: 'bottom',
      fontSize: '14px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#1F2937',
            },
            total: {
              show: true,
              label: 'Total Skills',
              fontSize: '14px',
              color: '#6B7280',
              formatter: () => {
                const total = skillSummary.reduce((sum, s) => sum + s.totalActivities, 0);
                return total.toString();
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} skills`,
      },
    },
  };

  const skillDistributionSeries = skillSummary.map((s) => s.totalActivities);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  const handleExportCSV = () => {
    exportAsCSV();
  };

  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading reports data...</p>
        </div>
      </div>
    );
  }

  if (educatorType === 'college' && !educatorCollege) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-4">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">College Not Assigned</h2>
            <p className="text-gray-600 mb-4">
              Your account is not associated with a college. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (educatorType === 'school' && !educatorSchool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-4">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">School Not Assigned</h2>
            <p className="text-gray-600 mb-4">
              Your account is not associated with a school. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaderboardItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: document.getElementById('leaderboard-table')?.offsetTop || 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Reports & Export</h1>
        <p className="text-gray-600">Generate and export detailed reports</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpiCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => exportAsPDF()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export as PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export as CSV
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download Portfolios
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedReport('summary')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedReport === 'summary'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Skill Summary Report
          </button>
          <button
            onClick={() => setSelectedReport('attendance')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedReport === 'attendance'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Attendance & Engagement
          </button>
          <button
            onClick={() => setSelectedReport('growth')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedReport === 'growth'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📈 Skill Growth Charts
          </button>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'summary' && skillSummary.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No skill data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet.'
              : 'No student skill activities found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'summary' && skillSummary.length > 0 && (
        <div className="space-y-6">
          {/* Skill Summary Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Category Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Activities</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Verified</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Participation Rate</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {skillSummary.map((skill, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{skill.category}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{skill.totalActivities}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {skill.verifiedActivities}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${skill.participationRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{skill.participationRate}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                          ⭐ {skill.avgScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Summary Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Distribution by Category</h2>
            <Chart options={skillSummaryOptions} series={skillSummarySeries} type="bar" height={400} />
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && attendanceData.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No attendance data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet.'
              : 'No attendance records found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && attendanceData.length > 0 && (
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Attendance & Engagement</h2>
            <Chart options={attendanceOptions} series={attendanceSeries} type="bar" height={400} />
          </div>

          {/* Certificate Status and Assignment Completion - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certificate Status (Monthly) */}
            {certificateStats.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Certificate Status (Monthly)</h2>
                <Chart
                  options={{
                    chart: {
                      type: 'bar',
                      stacked: true,
                      fontFamily: 'Inter, sans-serif',
                      toolbar: { show: false },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        borderRadius: 8,
                        columnWidth: '60%',
                      },
                    },
                    colors: ['#10B981', '#F59E0B', '#EF4444'],
                    xaxis: {
                      categories: certificateStats.map((d) => d.month),
                      labels: {
                        style: {
                          fontSize: '12px',
                          colors: '#6B7280',
                        },
                      },
                    },
                    yaxis: {
                      title: {
                        text: 'Certificates',
                        style: {
                          fontSize: '14px',
                          fontWeight: 500,
                        },
                      },
                      labels: {
                        style: {
                          fontSize: '12px',
                          colors: '#6B7280',
                        },
                      },
                    },
                    legend: {
                      position: 'top',
                      fontSize: '14px',
                      horizontalAlign: 'right',
                    },
                    grid: {
                      borderColor: '#E5E7EB',
                      strokeDashArray: 4,
                    },
                    dataLabels: {
                      enabled: false,
                    },
                  }}
                  series={[
                    {
                      name: 'Issued',
                      data: certificateStats.map((d) => d.issued),
                    },
                    {
                      name: 'Pending',
                      data: certificateStats.map((d) => d.pending),
                    },
                    {
                      name: 'Rejected',
                      data: certificateStats.map((d) => d.rejected),
                    },
                  ]}
                  type="bar"
                  height={350}
                />
              </div>
            )}

            {/* Assignment Completion Status */}
            {assignmentStats.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Assignment Completion Status</h2>
              <Chart
                options={{
                  chart: {
                    type: 'bar',
                    stacked: true,
                    fontFamily: 'Inter, sans-serif',
                    toolbar: { show: false },
                  },
                  plotOptions: {
                    bar: {
                      horizontal: false,
                      borderRadius: 8,
                      columnWidth: '60%',
                    },
                  },
                  colors: ['#F59E0B', '#3B82F6', '#10B981'],
                  xaxis: {
                    categories: assignmentStats.map((d) => d.month),
                    labels: {
                      style: {
                        fontSize: '12px',
                        colors: '#6B7280',
                      },
                    },
                  },
                  yaxis: {
                    title: {
                      text: 'Assignments',
                      style: {
                        fontSize: '14px',
                        fontWeight: 500,
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '12px',
                        colors: '#6B7280',
                      },
                    },
                  },
                  legend: {
                    position: 'top',
                    fontSize: '14px',
                    horizontalAlign: 'right',
                  },
                  grid: {
                    borderColor: '#E5E7EB',
                    strokeDashArray: 4,
                  },
                  dataLabels: {
                    enabled: false,
                  },
                }}
                series={[
                  {
                    name: 'Pending',
                    data: assignmentStats.map((d) => d.pending),
                  },
                  {
                    name: 'Submitted',
                    data: assignmentStats.map((d) => d.submitted),
                  },
                  {
                    name: 'Graded',
                    data: assignmentStats.map((d) => d.graded),
                  },
                ]}
                type="bar"
                height={350}
              />
            </div>
          )}
          </div>

          {/* Assignment Details Table */}
          {assignmentDetails.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assignment Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Assignment Title</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Submitted</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Graded</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Pending</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentDetails.map((assignment, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{assignment.title}</td>
                        <td className="py-4 px-4 text-center text-gray-700">{assignment.total}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {assignment.submitted}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {assignment.graded}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {assignment.pending}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-purple-600 font-semibold">
                            {assignment.averageGrade > 0 ? `${assignment.averageGrade}%` : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Skills Table */}
          {topSkills.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Skills</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Skill Name</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Student Count</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Average Level</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Popularity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSkills.map((skill, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{skill.skillName}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill.studentCount}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                            ⭐ {skill.averageLevel.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                style={{ width: `${Math.min(100, (skill.studentCount / (topSkills[0]?.studentCount || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {Math.round((skill.studentCount / (topSkills[0]?.studentCount || 1)) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedReport === 'growth' && skillGrowthData.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No growth data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet.'
              : 'No skill growth data found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'growth' && skillGrowthData.length > 0 && (
        <div className="space-y-6">
          {/* Growth Line Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Skill Growth Over Time</h2>
            <Chart options={skillGrowthOptions} series={skillGrowthSeries} type="line" height={400} />
          </div>

          {/* Top Skills Assessment and Top Performers - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Skills Assessment */}
            {topSkills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Skills Assessment</h2>
                <Chart
                  options={{
                    chart: {
                      type: 'radar',
                      fontFamily: 'Inter, sans-serif',
                      toolbar: {
                        show: false,
                      },
                      dropShadow: {
                        enabled: false,
                      },
                    },
                    xaxis: {
                      categories: topSkills.slice(0, 8).map(s => s.skillName),
                      labels: {
                        style: {
                          fontSize: '11px',
                          colors: '#6B7280',
                        },
                      },
                    },
                    yaxis: {
                      show: true,
                      min: 0,
                      max: 5,
                      tickAmount: 5,
                      labels: {
                        style: {
                          fontSize: '10px',
                          colors: '#9CA3AF',
                        },
                      },
                    },
                    colors: ['#3B82F6'],
                    fill: {
                      opacity: 0.25,
                    },
                    stroke: {
                      width: 2,
                    },
                    markers: {
                      size: 4,
                      colors: ['#3B82F6'],
                      strokeColors: '#fff',
                      strokeWidth: 2,
                    },
                    legend: {
                      show: false,
                    },
                    plotOptions: {
                      radar: {
                        polygons: {
                          strokeColors: ['#E5E7EB'],
                          connectorColors: ['#E5E7EB'],
                        },
                      },
                    },
                  }}
                  series={[
                    {
                      name: 'Skill Level',
                      data: topSkills.slice(0, 8).map(s => s.averageLevel),
                    },
                  ]}
                  type="radar"
                  height={350}
                />
              </div>
            )}

            {/* Top Performers */}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🏆 Top Performers
                </h2>
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {leaderboard.slice(0, 5).map((student) => (
                    <div
                      key={student.rank}
                      className="flex items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg hover:from-blue-50 transition-all"
                    >
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full font-bold text-white text-sm flex-shrink-0 ${
                          student.rank === 1
                            ? 'bg-yellow-500'
                            : student.rank === 2
                            ? 'bg-gray-400'
                            : student.rank === 3
                            ? 'bg-amber-600'
                            : 'bg-blue-500'
                        }`}
                      >
                        {student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{student.studentName}</p>
                        <p className="text-xs text-gray-500">{student.verifiedActivities} verified</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-700">{student.awards} 🏆</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 min-w-[25px]">{student.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Distribution</h2>
            <Chart options={skillDistributionOptions} series={skillDistributionSeries} type="donut" height={400} />
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      {leaderboard.length > 0 && (
        <div id="leaderboard-table" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Complete Leaderboard</h2>
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm text-gray-600 font-medium">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">per page</span>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700">Student</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden sm:table-cell">Total</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Verified</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden md:table-cell">Awards</th>
                  <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Progress</th>
                </tr>
              </thead>
              <tbody>
                {currentLeaderboardItems.map((student) => (
                  <tr key={student.rank} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4">
                      <span className={`inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full font-bold text-white text-xs sm:text-sm ${
                        student.rank === 1 ? 'bg-yellow-500' : student.rank === 2 ? 'bg-gray-400' : student.rank === 3 ? 'bg-amber-600' : 'bg-blue-500'
                      }`}>
                        {student.rank}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{student.studentName}</p>
                        <p className="text-xs text-gray-500 truncate">{student.studentId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-center text-gray-700 font-medium hidden sm:table-cell">{student.totalActivities}</td>
                    <td className="py-3 px-2 sm:px-4 text-center">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {student.verifiedActivities}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-center text-gray-700 font-medium hidden md:table-cell">{student.awards} 🏆</td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <div className="w-12 sm:w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" style={{ width: `${student.progress}%` }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[28px]">{student.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 sm:mt-6 pt-4 sm:border-t sm:border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, leaderboard.length)}</span> of{' '}
                <span className="font-medium">{leaderboard.length}</span> students
              </div>
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400 text-xs sm:text-base">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-base ${
                          currentPage === page ? 'bg-blue-500 text-white shadow-md' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
