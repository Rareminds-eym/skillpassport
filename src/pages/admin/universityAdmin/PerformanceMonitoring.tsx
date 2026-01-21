import React, { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  ClockIcon,
  DocumentChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMetric {
  id: string;
  college: string;
  avgCGPA: number;
  passRate: number;
  atRiskStudents: number;
  totalStudents: number;
  placementRate: number;
  attendanceRate: number;
  lastUpdated: string;
}

interface CollegePerformance {
  collegeId: string;
  collegeName: string;
  overallGrade: string;
  metrics: {
    academic: number;
    placement: number;
    attendance: number;
    engagement: number;
  };
  trends: {
    academic: 'up' | 'down' | 'stable';
    placement: 'up' | 'down' | 'stable';
    attendance: 'up' | 'down' | 'stable';
  };
}

const PerformanceMonitoring: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('semester');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollegeData, setSelectedCollegeData] = useState<PerformanceMetric | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState<PerformanceMetric | null>(null);
  const [selectedChart, setSelectedChart] = useState<'academic' | 'placement' | 'attendance'>(
    'academic'
  );

  // Mock data - replace with actual API calls
  const performanceData: PerformanceMetric[] = [
    {
      id: '1',
      college: 'Engineering College',
      avgCGPA: 7.8,
      passRate: 92,
      atRiskStudents: 45,
      totalStudents: 500,
      placementRate: 85,
      attendanceRate: 88,
      lastUpdated: '2024-01-10',
    },
    {
      id: '2',
      college: 'Arts & Science College',
      avgCGPA: 8.2,
      passRate: 95,
      atRiskStudents: 23,
      totalStudents: 350,
      placementRate: 78,
      attendanceRate: 92,
      lastUpdated: '2024-01-10',
    },
    {
      id: '3',
      college: 'Business School',
      avgCGPA: 7.9,
      passRate: 89,
      atRiskStudents: 67,
      totalStudents: 450,
      placementRate: 91,
      attendanceRate: 85,
      lastUpdated: '2024-01-10',
    },
  ];

  const collegePerformance: CollegePerformance[] = [
    {
      collegeId: '1',
      collegeName: 'Engineering College',
      overallGrade: 'B+',
      metrics: { academic: 78, placement: 85, attendance: 88, engagement: 82 },
      trends: { academic: 'up', placement: 'up', attendance: 'stable' },
    },
    {
      collegeId: '2',
      collegeName: 'Arts & Science College',
      overallGrade: 'A-',
      metrics: { academic: 82, placement: 78, attendance: 92, engagement: 85 },
      trends: { academic: 'stable', placement: 'down', attendance: 'up' },
    },
    {
      collegeId: '3',
      collegeName: 'Business School',
      overallGrade: 'B',
      metrics: { academic: 79, placement: 91, attendance: 85, engagement: 88 },
      trends: { academic: 'up', placement: 'up', attendance: 'down' },
    },
  ];

  const handleRefreshData = () => {
    // Simulate data refresh
    console.log('Refreshing performance data...');
    alert('Performance data refreshed successfully!');
  };

  const handleExportReport = () => {
    // Simulate export functionality
    console.log('Exporting performance report...');
    alert('Performance report exported successfully!');
  };

  const handleGenerateRankings = () => {
    console.log('Generating college rankings...');
    alert('College rankings generated successfully!');
  };

  const handleGeneratePerformanceReport = () => {
    console.log('Generating detailed performance report...');
    alert('Detailed performance report generated successfully!');
  };

  const handleRiskAssessment = () => {
    console.log('Running risk assessment...');
    alert('Risk assessment completed successfully!');
  };

  const handleScheduleReview = () => {
    console.log('Scheduling performance review...');
    alert('Performance review scheduled successfully!');
  };

  const handleViewDetails = (collegeId: string) => {
    const college = performanceData.find((item) => item.id === collegeId);
    if (college) {
      setSelectedCollegeData(college);
      setShowViewModal(true);
    }
  };

  const handleEditMetrics = (collegeId: string) => {
    const college = performanceData.find((item) => item.id === collegeId);
    if (college) {
      setEditFormData({ ...college });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      // Here you would typically make an API call to save the data
      console.log('Saving edited data:', editFormData);
      setShowEditModal(false);
      setEditFormData(null);
      // Show success message
      alert('Performance metrics updated successfully!');
    }
  };

  const handleDeleteRecord = (collegeId: string) => {
    if (window.confirm('Are you sure you want to delete this performance record?')) {
      console.log('Deleting record for college:', collegeId);
      // Here you would typically make an API call to delete the record
      alert('Performance record deleted successfully!');
    }
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedCollegeData(null);
    setEditFormData(null);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
      case 'B-':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  const filteredData = performanceData.filter(
    (item) =>
      item.college.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCollege === 'all' || item.college === selectedCollege)
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              College Performance Monitoring
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Track and analyze performance metrics across all affiliated colleges
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={handleRefreshData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={handleExportReport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search colleges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Timeframe Selector */}
            <div className="relative">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="semester">Current Semester</option>
                <option value="year">Academic Year</option>
                <option value="quarter">Quarter</option>
                <option value="month">Monthly</option>
              </select>
              <ChevronDownIcon className="h-5 w-5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* College Filter */}
            <div className="relative">
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Colleges</option>
                <option value="Engineering College">Engineering College</option>
                <option value="Arts & Science College">Arts & Science College</option>
                <option value="Business School">Business School</option>
              </select>
              <ChevronDownIcon className="h-5 w-5 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CGPA Range</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Ranges</option>
                  <option>8.0 - 10.0</option>
                  <option>7.0 - 8.0</option>
                  <option>6.0 - 7.0</option>
                  <option>Below 6.0</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pass Rate</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Rates</option>
                  <option>90% and above</option>
                  <option>80% - 90%</option>
                  <option>70% - 80%</option>
                  <option>Below 70%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placement Rate
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Rates</option>
                  <option>85% and above</option>
                  <option>70% - 85%</option>
                  <option>50% - 70%</option>
                  <option>Below 50%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Levels</option>
                  <option>Low Risk</option>
                  <option>Medium Risk</option>
                  <option>High Risk</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Colleges</p>
              <p className="text-3xl font-bold text-gray-900">{performanceData.length}</p>
              <p className="text-xs text-green-600 mt-1">+2 this semester</p>
            </div>
            <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Average CGPA</p>
              <p className="text-3xl font-bold text-gray-900">
                {(
                  performanceData.reduce((sum, item) => sum + item.avgCGPA, 0) /
                  performanceData.length
                ).toFixed(1)}
              </p>
              <p className="text-xs text-green-600 mt-1">+0.2 from last semester</p>
            </div>
            <AcademicCapIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Overall Pass Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(
                  performanceData.reduce((sum, item) => sum + item.passRate, 0) /
                    performanceData.length
                )}
                %
              </p>
              <p className="text-xs text-green-600 mt-1">+3% improvement</p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">At-Risk Students</p>
              <p className="text-3xl font-bold text-gray-900">
                {performanceData.reduce((sum, item) => sum + item.atRiskStudents, 0)}
              </p>
              <p className="text-xs text-red-600 mt-1">Needs attention</p>
            </div>
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Performance Table/Cards */}
      {viewMode === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {collegePerformance.map((college) => (
            <div
              key={college.collegeId}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{college.collegeName}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(college.overallGrade)}`}
                >
                  {college.overallGrade}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Academic Performance</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${college.metrics.academic}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{college.metrics.academic}%</span>
                    {getTrendIcon(college.trends.academic)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Placement Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${college.metrics.placement}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{college.metrics.placement}%</span>
                    {getTrendIcon(college.trends.placement)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attendance Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${college.metrics.attendance}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{college.metrics.attendance}%</span>
                    {getTrendIcon(college.trends.attendance)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Student Engagement</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${college.metrics.engagement}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{college.metrics.engagement}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewDetails(college.collegeId)}
                  className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditMetrics(college.collegeId)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(college.collegeId)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Performance Metrics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg CGPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placement Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    At Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{item.college}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.avgCGPA}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.passRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.placementRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.attendanceRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.atRiskStudents > 50
                            ? 'bg-red-100 text-red-800'
                            : item.atRiskStudents > 25
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {item.atRiskStudents}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.totalStudents}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.lastUpdated}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(item.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditMetrics(item.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Analytics Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Performance Trends</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedChart('academic')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedChart === 'academic'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Academic
            </button>
            <button
              onClick={() => setSelectedChart('placement')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedChart === 'placement'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Placement
            </button>
            <button
              onClick={() => setSelectedChart('attendance')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedChart === 'attendance'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Attendance
            </button>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              {selectedChart === 'academic' &&
                'Academic performance trend charts will be displayed here'}
              {selectedChart === 'placement' &&
                'Placement rate trend charts will be displayed here'}
              {selectedChart === 'attendance' && 'Attendance trend charts will be displayed here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Integration with charting library required</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleGenerateRankings}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <TrophyIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Generate Rankings</span>
            </div>
          </button>
          <button
            onClick={handleGeneratePerformanceReport}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <DocumentChartBarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Performance Report</span>
            </div>
          </button>
          <button
            onClick={handleRiskAssessment}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Risk Assessment</span>
            </div>
          </button>
          <button
            onClick={handleScheduleReview}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
          >
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Schedule Review</span>
            </div>
          </button>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedCollegeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Performance Details - {selectedCollegeData.college}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Average CGPA</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {selectedCollegeData.avgCGPA}
                      </p>
                    </div>
                    <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Pass Rate</p>
                      <p className="text-2xl font-bold text-green-900">
                        {selectedCollegeData.passRate}%
                      </p>
                    </div>
                    <CheckIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Placement Rate</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {selectedCollegeData.placementRate}%
                      </p>
                    </div>
                    <TrophyIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Attendance Rate</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {selectedCollegeData.attendanceRate}%
                      </p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Students:</span>
                      <span className="font-medium">{selectedCollegeData.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">At-Risk Students:</span>
                      <span className="font-medium text-red-600">
                        {selectedCollegeData.atRiskStudents}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Percentage:</span>
                      <span className="font-medium">
                        {(
                          (selectedCollegeData.atRiskStudents / selectedCollegeData.totalStudents) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{selectedCollegeData.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Academic Performance:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedCollegeData.avgCGPA * 10}%` }}
                          ></div>
                        </div>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Placement Trend:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${selectedCollegeData.placementRate}%` }}
                          ></div>
                        </div>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Attendance Trend:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${selectedCollegeData.attendanceRate}%` }}
                          ></div>
                        </div>
                        <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeModals();
                    if (selectedCollegeData) {
                      handleEditMetrics(selectedCollegeData.id);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Metrics
                </button>
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Performance Metrics - {editFormData.college}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average CGPA
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={editFormData.avgCGPA}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          avgCGPA: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pass Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.passRate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          passRate: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placement Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.placementRate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          placementRate: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attendance Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.attendanceRate}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          attendanceRate: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      At-Risk Students
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.atRiskStudents}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          atRiskStudents: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Students
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editFormData.totalStudents}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          totalStudents: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.college}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        college: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Performance Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Risk Percentage:</span>
                      <span className="ml-2 font-medium">
                        {editFormData.totalStudents > 0
                          ? (
                              (editFormData.atRiskStudents / editFormData.totalStudents) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(
                          (editFormData.passRate +
                            editFormData.placementRate +
                            editFormData.attendanceRate) /
                            3
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitoring;
