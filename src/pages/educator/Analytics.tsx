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
  TrophyIcon,
  ArrowDownTrayIcon,
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

const Analytics = () => {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'attendance' | 'growth'>('summary');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Get educator's school information with class assignments
  const { school: educatorSchool, college: educatorCollege, educatorType, educatorRole, assignedClassIds, loading: schoolLoading } = useEducatorSchool();

  // Get analytics data from hook - filtered by school and class assignments
  const {
    loading,
    refreshing,
    kpiData,
    skillSummary,
    attendanceData,
    skillGrowthData,
    leaderboard,
    activityHeatmap,
    certificateStats,
    assignmentStats,
    assignmentDetails,
    topSkills,
    fetchAnalyticsData,
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

  // Chart Options
  const skillDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: skillSummary.map((s) => s.category),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
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
              label: 'Total Activities',
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
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} activities`,
      },
    },
  };

  const skillDistributionSeries = skillSummary.map((s) => s.totalActivities);

  const skillGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
    xaxis: {
      categories: skillGrowthData.map((d) => d.month),
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Skill Level',
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
      min: 0,
      max: 100,
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}/100`,
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '14px',
      horizontalAlign: 'center',
      offsetY: 10,
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

  const certificateOptions: ApexOptions = {
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
  };

  const certificateSeries = [
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
  ];

  const assignmentOptions: ApexOptions = {
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
  };

  const assignmentSeries = [
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
  ];

  const topSkillsOptions: ApexOptions = {
    chart: {
      type: 'radar',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    colors: ['#3B82F6'],
    xaxis: {
      categories: topSkills.map((s) => s.skillName),
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    yaxis: {
      min: 0,
      max: 5,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
      },
    },
    plotOptions: {
      radar: {
        size: 140,
        polygons: {
          strokeColors: '#E5E7EB',
          fill: {
            colors: ['#F9FAFB', '#FFFFFF'],
          },
        },
      },
    },
    legend: {
      position: 'top',
      fontSize: '14px',
      horizontalAlign: 'right',
    },
  };

  const topSkillsSeries = [
    {
      name: 'Average Level',
      data: topSkills.map((s) => s.averageLevel),
    },
  ];

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

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 3) return 'bg-green-200';
    if (count <= 6) return 'bg-green-300';
    if (count <= 9) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getGradeBadgeClass = (grade: number): string => {
    if (grade >= 80) return 'bg-green-100 text-green-800';
    if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
  };

  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Pagination helpers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaderboardItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of leaderboard table
    window.scrollTo({ top: document.getElementById('leaderboard-table')?.offsetTop || 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Track student performance, engagement, and skill development</p>
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

      {/* Report Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-1.5 sm:p-2">
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          <button
            onClick={() => setSelectedReport('summary')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${selectedReport === 'summary'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
          >
            Skill Summary Report
          </button>
          <button
            onClick={() => setSelectedReport('attendance')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${selectedReport === 'attendance'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
          >
            Attendance & Engagement
          </button>
          <button
            onClick={() => setSelectedReport('growth')}
            className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${selectedReport === 'growth'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
          >
            Skill Growth Charts
          </button>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'summary' && skillSummary.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No skill data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet. Please contact your school administrator to assign you to classes.'
              : 'No student skill activities found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && attendanceData.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No attendance data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet. Please contact your school administrator to assign you to classes.'
              : 'No attendance records found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'growth' && skillGrowthData.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 mb-2">No growth data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet. Please contact your school administrator to assign you to classes.'
              : 'No skill growth data found for your assigned classes.'}
          </div>
        </div>
      )}

      {selectedReport === 'summary' && skillSummary.length > 0 && (
        <div className="space-y-6">
          {/* Skill Summary Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Skill Category Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Verified</th>
                    <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden sm:table-cell">Rate</th>
                    <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {skillSummary.map((skill, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm">{skill.category}</td>
                      <td className="py-3 px-2 sm:px-4 text-center text-gray-700">{skill.totalActivities}</td>
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {skill.verifiedActivities}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${skill.participationRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 min-w-[35px]">{skill.participationRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold text-xs sm:text-sm">
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Activity Distribution by Category</h2>
            <Chart options={skillSummaryOptions} series={skillSummarySeries} type="bar" height={350} />
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && attendanceData.length > 0 && (
        <div className="space-y-6">
          {/* Attendance Chart */}
          {attendanceData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Monthly Attendance & Engagement</h2>
              <Chart options={attendanceOptions} series={attendanceSeries} type="bar" height={350} />
            </div>
          )}

          {/* Certificate Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificateStats.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Certificates Status (Monthly)</h2>
                <Chart options={certificateOptions} series={certificateSeries} type="bar" height={350} />
              </div>
            )}

            {/* Assignment Completion Status */}
            {assignmentStats.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Assignment Completion Status</h2>
                <Chart options={assignmentOptions} series={assignmentSeries} type="bar" height={350} />
              </div>
            )}
          </div>

          {/* Assignment Details Table */}
          {assignmentDetails.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Assignment Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-700">Assignment</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden sm:table-cell">Total</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Submitted</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden md:table-cell">Graded</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700 hidden lg:table-cell">Pending</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Avg Grade</th>
                      <th className="text-center py-3 px-2 sm:px-4 font-semibold text-gray-700">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentDetails.map((assignment) => {
                      const completionPercentage = assignment.total > 0
                        ? Math.round(((assignment.submitted + assignment.graded) / assignment.total) * 100)
                        : 0;
                      return (
                        <tr key={assignment.assignmentId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm truncate">{assignment.title}</td>
                          <td className="py-3 px-2 sm:px-4 text-center text-gray-700 hidden sm:table-cell">{assignment.total}</td>
                          <td className="py-3 px-2 sm:px-4 text-center text-gray-700">{assignment.submitted}</td>
                          <td className="py-3 px-2 sm:px-4 text-center text-gray-700 hidden md:table-cell">{assignment.graded}</td>
                          <td className="py-3 px-2 sm:px-4 text-center text-gray-700 hidden lg:table-cell">{assignment.pending}</td>
                          <td className="py-3 px-2 sm:px-4 text-center">
                            {assignment.averageGrade > 0 ? (
                              <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getGradeBadgeClass(assignment.averageGrade)}`}>
                                {assignment.averageGrade}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs sm:text-sm">—</span>
                            )}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-center">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <div className="w-16 sm:w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 min-w-[28px]">{completionPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Skills Details Table */}
          {skillSummary.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Skills Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Skill Category</th>
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
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${skill.participationRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 min-w-[45px]">{skill.participationRate}%</span>
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
          )}
        </div>
      )}

      {selectedReport === 'growth' && skillGrowthData.length > 0 && (
        <div className="space-y-6">
          {/* Growth Line Chart */}
          {skillGrowthData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Skill Growth Over Time</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Monthly progression of skill levels across different categories</p>
              </div>
              <div className="p-4 sm:p-6">
                <Chart options={skillGrowthOptions} series={skillGrowthSeries} type="line" height={380} />
              </div>
            </div>
          )}

          {/* Top Skills Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topSkills.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Top Skills Assessment</h2>
                <Chart options={topSkillsOptions} series={topSkillsSeries} type="radar" height={380} />
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-gray-500 mb-2">No leaderboard data available</div>
                <div className="text-sm text-gray-400">
                  {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
                    ? 'You have not been assigned to any classes yet.'
                    : 'No student performance data found for your assigned classes.'}
                </div>
              </div>
            )}
            {leaderboard.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                    Top Performers
                  </h2>
                </div>
                <div className="space-y-2 sm:space-y-3 max-h-[380px] overflow-y-auto">
                  {leaderboard.slice(0, 5).map((student) => (
                    <div
                      key={student.rank}
                      className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg hover:from-blue-50 transition-all"
                    >
                      <div
                        className={`flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full font-bold text-white text-sm sm:text-base flex-shrink-0 ${student.rank === 1
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
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{student.studentName}</p>
                        <p className="text-xs text-gray-500">{student.verifiedActivities} verified</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">{student.awards} 🏆</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
        </div>
      )}

      {/* Full Leaderboard */}
      {leaderboard.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center mt-6">
          <div className="text-gray-500 mb-2">No student performance data available</div>
          <div className="text-sm text-gray-400">
            {educatorType === 'school' && educatorRole !== 'admin' && assignedClassIds.length === 0
              ? 'You have not been assigned to any classes yet. Please contact your school administrator to assign you to classes.'
              : 'No student activities or performance data found for your assigned classes.'}
          </div>
        </div>
      )}
      {leaderboard.length > 0 && (
        <div id="leaderboard-table" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Complete Leaderboard</h2>

            {/* Items per page selector */}
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
                      <span
                        className={`inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full font-bold text-white text-xs sm:text-sm ${student.rank === 1
                            ? 'bg-yellow-500'
                            : student.rank === 2
                              ? 'bg-gray-400'
                              : student.rank === 3
                                ? 'bg-amber-600'
                                : 'bg-blue-500'
                          }`}
                      >
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
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[28px]">{student.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 sm:mt-6 pt-4 sm:border-t sm:border-gray-200">
              {/* Results info */}
              <div className="text-xs sm:text-sm text-gray-600">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, leaderboard.length)}</span> of{' '}
                <span className="font-medium">{leaderboard.length}</span> students
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400 text-xs sm:text-base">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-base ${currentPage === page
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button
          onClick={exportAsPDF}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm sm:text-base"
        >
          <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          Export as PDF
        </button>
        <button
          onClick={exportAsCSV}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm sm:text-base"
        >
          <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          Download CSV
        </button>
      </div>
    </div>
  );
};

export default Analytics;