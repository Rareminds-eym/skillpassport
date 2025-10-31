import { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  mockSkillSummary,
  mockAttendanceData,
  mockSkillGrowthData,
  mockLeaderboard,
  mockActivityHeatmap,
  mockAnalyticsKPIs,
} from '../../data/educator/mockAnalytics';

const Analytics = () => {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'attendance' | 'growth'>('summary');

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Active Students',
      value: mockAnalyticsKPIs.activeStudents,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Verified Activities',
      value: mockAnalyticsKPIs.totalVerifiedActivities,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Pending Verifications',
      value: mockAnalyticsKPIs.pendingVerifications,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Avg Skills/Student',
      value: mockAnalyticsKPIs.avgSkillsPerStudent.toFixed(1),
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Attendance Rate',
      value: `${mockAnalyticsKPIs.attendanceRate}%`,
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Engagement Rate',
      value: `${mockAnalyticsKPIs.engagementRate}%`,
      icon: ChartBarIcon,
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
  ];

  // Skill Distribution Pie Chart
  const skillDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: mockSkillSummary.map((s) => s.category),
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
                const total = mockSkillSummary.reduce((sum, s) => sum + s.totalActivities, 0);
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

  const skillDistributionSeries = mockSkillSummary.map((s) => s.totalActivities);

  // Skill Growth Line Chart
  const skillGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
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
      categories: mockSkillGrowthData.map((d) => d.month),
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
    legend: {
      position: 'top',
      fontSize: '14px',
      horizontalAlign: 'right',
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
  };

  const skillGrowthSeries = [
    {
      name: 'Technical',
      data: mockSkillGrowthData.map((d) => d.technical),
    },
    {
      name: 'Communication',
      data: mockSkillGrowthData.map((d) => d.communication),
    },
    {
      name: 'Leadership',
      data: mockSkillGrowthData.map((d) => d.leadership),
    },
    {
      name: 'Creativity',
      data: mockSkillGrowthData.map((d) => d.creativity),
    },
  ];

  // Attendance Bar Chart
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
      categories: mockAttendanceData.map((d) => d.month),
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
      data: mockAttendanceData.map((d) => d.present),
    },
    {
      name: 'Absent',
      data: mockAttendanceData.map((d) => d.absent),
    },
    {
      name: 'Late',
      data: mockAttendanceData.map((d) => d.late),
    },
  ];

  // Skill Summary Bar Chart
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
      categories: mockSkillSummary.map((s) => s.category),
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
      data: mockSkillSummary.map((s) => s.totalActivities),
    },
    {
      name: 'Verified',
      data: mockSkillSummary.map((s) => s.verifiedActivities),
    },
  ];

  // Activity Heatmap (simplified calendar view)
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 3) return 'bg-green-200';
    if (count <= 6) return 'bg-green-300';
    if (count <= 9) return 'bg-green-400';
    return 'bg-green-500';
  };

  const handleExportPDF = () => {
    alert('Exporting as PDF...');
  };

  const handleDownloadData = () => {
    alert('Downloading data...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics & Insights</h1>
        <p className="text-gray-600">Track student performance, engagement, and skill development</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${kpi.lightColor} p-3 rounded-xl`}>
                <kpi.icon className={`h-6 w-6 ${kpi.textColor}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
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
      {selectedReport === 'summary' && (
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
                  {mockSkillSummary.map((skill, idx) => (
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
            <Chart options={skillSummaryOptions} series={skillSummarySeries} type="bar" height={350} />
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Attendance & Engagement</h2>
            <Chart options={attendanceOptions} series={attendanceSeries} type="bar" height={350} />
          </div>

          {/* Activity Heatmap */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Heatmap (Last 90 Days)</h2>
            <p className="text-sm text-gray-600 mb-4">Darker colors indicate more student activities</p>
            <div className="grid grid-cols-10 gap-1">
              {mockActivityHeatmap.map((day, idx) => (
                <div
                  key={idx}
                  className={`h-8 rounded ${getHeatmapColor(day.count)} hover:ring-2 hover:ring-blue-400 cursor-pointer transition-all`}
                  title={`${day.date}: ${day.count} activities`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-4 w-4 bg-gray-100 rounded"></div>
                <div className="h-4 w-4 bg-green-200 rounded"></div>
                <div className="h-4 w-4 bg-green-300 rounded"></div>
                <div className="h-4 w-4 bg-green-400 rounded"></div>
                <div className="h-4 w-4 bg-green-500 rounded"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'growth' && (
        <div className="space-y-6">
          {/* Growth Line Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Growth Over Time</h2>
            <Chart options={skillGrowthOptions} series={skillGrowthSeries} type="line" height={350} />
          </div>

          {/* Skill Distribution Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Distribution</h2>
              <Chart options={skillDistributionOptions} series={skillDistributionSeries} type="donut" height={350} />
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrophyIcon className="h-6 w-6 text-yellow-500" />
                  Top Performers
                </h2>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {mockLeaderboard.slice(0, 5).map((student) => (
                  <div
                    key={student.rank}
                    className="flex items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-xl hover:from-blue-50 transition-all"
                  >
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-full font-bold text-white ${
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
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{student.studentName}</p>
                      <p className="text-xs text-gray-500">{student.verifiedActivities} verified activities</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">{student.awards} 🏆</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{student.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Activities</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Verified</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Awards</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Progress</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((student) => (
                <tr key={student.rank} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-white text-sm ${
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
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-gray-900">{student.studentName}</p>
                      <p className="text-sm text-gray-500">{student.studentId}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700 font-medium">{student.totalActivities}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {student.verifiedActivities}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700 font-medium">{student.awards} 🏆</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{student.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export as PDF
        </button>
        <button
          onClick={handleDownloadData}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Download Data
        </button>
      </div>
    </div>
  );
};

export default Analytics;
