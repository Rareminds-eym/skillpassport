import { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import {
  mockSkillSummary,
  mockAttendanceData,
  mockSkillGrowthData,
} from '../../data/educator/mockAnalytics';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<'summary' | 'attendance' | 'growth'>(
    'summary'
  );

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
    colors: ['#1d8ad1', '#10B981'],
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
    colors: ['#10B981', '#e32a18', '#d4af37'],
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
    colors: ['#1d8ad1', '#10B981', '#d4af37', '#5378f1'],
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

  // Skill Distribution Pie Chart
  const skillDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: mockSkillSummary.map((s) => s.category),
    colors: ['#1d8ad1', '#10B981', '#d4af37', '#5378f1', '#e32a18', '#06B6D4'],
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

  const handleExportPDF = () => {
    alert('Exporting report as PDF...');
  };

  const handleExportExcel = () => {
    alert('Exporting report as Excel...');
  };

  const handleExportCSV = () => {
    alert('Exporting report as CSV...');
  };

  const handleDownloadPortfolio = () => {
    alert('Downloading verified portfolios...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Reports & Export</h1>
        <p className="text-gray-600">Generate and export detailed reports</p>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export as PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export as Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transition-all"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export as CSV
          </button>
          <button
            onClick={handleDownloadPortfolio}
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
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Skill Summary Report
          </button>
          <button
            onClick={() => setSelectedReport('attendance')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedReport === 'attendance'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📅 Attendance & Engagement
          </button>
          <button
            onClick={() => setSelectedReport('growth')}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              selectedReport === 'growth'
                ? 'bg-primary text-white shadow-md'
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
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Total Activities
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Verified</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">
                      Participation Rate
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSkillSummary.map((skill, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{skill.category}</td>
                      <td className="py-4 px-4 text-center text-gray-700">
                        {skill.totalActivities}
                      </td>
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
                          <span className="text-sm font-medium text-gray-700">
                            {skill.participationRate}%
                          </span>
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Activity Distribution by Category
            </h2>
            <Chart
              options={skillSummaryOptions}
              series={skillSummarySeries}
              type="bar"
              height={400}
            />
          </div>
        </div>
      )}

      {selectedReport === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Monthly Attendance & Engagement
            </h2>
            <Chart options={attendanceOptions} series={attendanceSeries} type="bar" height={400} />
          </div>
        </div>
      )}

      {selectedReport === 'growth' && (
        <div className="space-y-6">
          {/* Growth Line Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Growth Over Time</h2>
            <Chart
              options={skillGrowthOptions}
              series={skillGrowthSeries}
              type="line"
              height={400}
            />
          </div>

          {/* Skill Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Skill Distribution</h2>
            <Chart
              options={skillDistributionOptions}
              series={skillDistributionSeries}
              type="donut"
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
