import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  Award,
  FileText,
  Calendar,
  MapPin,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  placementAnalyticsService,
  PlacementRecord,
  DepartmentAnalytics,
  PlacementStats,
} from '../../../../services/placementAnalyticsService';

const PlacementAnalytics: React.FC = () => {
  const [selectedAnalyticsDepartment, setSelectedAnalyticsDepartment] = useState('');
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState('2024');
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState('all');
  const [showAnalyticsFilter, setShowAnalyticsFilter] = useState(false);

  // State for real data
  const [placementRecords, setPlacementRecords] = useState<PlacementRecord[]>([]);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [placementStats, setPlacementStats] = useState<PlacementStats>({
    totalPlacements: 0,
    totalApplications: 0,
    avgCTC: 0,
    medianCTC: 0,
    highestCTC: 0,
    totalInternships: 0,
    totalFullTime: 0,
    placementRate: 0,
  });
  const [ctcDistribution, setCTCDistribution] = useState({
    above10L: { count: 0, percentage: 0 },
    between5L10L: { count: 0, percentage: 0 },
    below5L: { count: 0, percentage: 0 },
    internships: { count: 0, percentage: 0 },
  });
  const [recentPlacements, setRecentPlacements] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data from database
  const loadData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filters = {
        department: selectedAnalyticsDepartment || undefined,
        year: selectedAnalyticsYear,
        employmentType: selectedAnalyticsType,
      };

      // Load all data in parallel
      const [records, analytics, stats, distribution, recent] = await Promise.all([
        placementAnalyticsService.getPlacementRecords(filters),
        placementAnalyticsService.getDepartmentAnalytics(filters),
        placementAnalyticsService.getPlacementStats(filters),
        placementAnalyticsService.getCTCDistribution(filters),
        placementAnalyticsService.getRecentPlacements(5),
      ]);

      setPlacementRecords(records);
      setDepartmentAnalytics(analytics);
      setPlacementStats(stats);
      setCTCDistribution(distribution);
      setRecentPlacements(recent);
    } catch (error) {
      console.error('Error loading placement data:', error);
      toast.error('Failed to load placement data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadData();
  }, [selectedAnalyticsDepartment, selectedAnalyticsYear, selectedAnalyticsType]);

  // Filter analytics data
  const filteredAnalytics = departmentAnalytics.filter((dept) => {
    return !selectedAnalyticsDepartment || dept.department === selectedAnalyticsDepartment;
  });

  // Calculate overall metrics from real data
  const totalPlacements = placementStats.totalPlacements;
  const totalInternships = placementStats.totalInternships;
  const totalFullTime = placementStats.totalFullTime;
  const internshipToJobRatio =
    totalFullTime > 0 ? (totalInternships / totalFullTime).toFixed(2) : '0';

  // CTC values from real data
  const overallAvgCtc = placementStats.avgCTC;
  const overallMedianCtc = placementStats.medianCTC;
  const overallHighestCtc = placementStats.highestCTC;

  // Enhanced Export functionality
  const handleExportReport = async () => {
    try {
      const filters = {
        department: selectedAnalyticsDepartment || undefined,
        year: selectedAnalyticsYear,
        employmentType: selectedAnalyticsType,
      };

      const csvContent = await placementAnalyticsService.exportPlacementData(filters);

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `placement_analytics_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Placement analytics report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Export error:', error);
    }
  };

  const handleExportRecentPlacements = async () => {
    try {
      const csvData = [
        ['Recent Placements Report'],
        ['Generated on:', new Date().toLocaleDateString()],
        [],
        [
          'Student Name',
          'Student ID',
          'Company',
          'Job Title',
          'Department',
          'Employment Type',
          'CTC (₹)',
          'Location',
          'Placement Date',
          'Status',
        ],
        ...recentPlacements.map((record) => [
          record.student_name,
          record.student_id,
          record.company_name,
          record.job_title,
          record.department,
          record.employment_type,
          record.salary_offered,
          record.location,
          record.placement_date,
          record.status,
        ]),
      ];

      const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `recent_placements_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Recent placements report exported successfully');
    } catch (error) {
      toast.error('Failed to export recent placements');
      console.error('Export error:', error);
    }
  };

  const clearAnalyticsFilters = () => {
    setSelectedAnalyticsDepartment('');
    setSelectedAnalyticsYear('2024');
    setSelectedAnalyticsType('all');
    setShowAnalyticsFilter(false);
  };

  const handleRefresh = () => {
    loadData(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading placement analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Placement Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAnalyticsFilter(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter className="h-4 w-4" />
            Filter
            {(selectedAnalyticsDepartment ||
              selectedAnalyticsYear !== '2024' ||
              selectedAnalyticsType !== 'all') && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {
                  [
                    selectedAnalyticsDepartment,
                    selectedAnalyticsYear !== '2024' ? selectedAnalyticsYear : '',
                    selectedAnalyticsType !== 'all' ? selectedAnalyticsType : '',
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Export Analytics
          </button>
          <button
            onClick={handleExportRecentPlacements}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FileText className="h-4 w-4" />
            Export Placements
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Comprehensive placement statistics, department-wise analytics, and CTC analysis.
      </p>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Placements</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlacements}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg CTC</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(overallAvgCtc / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Median CTC</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(overallMedianCtc / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Highest CTC</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(overallHighestCtc / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Analytics Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Department-wise Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placed Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg CTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Median CTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Highest CTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full-time / Internships
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnalytics.map((dept, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.total_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.placed_students}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {dept.placement_rate.toFixed(1)}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(dept.placement_rate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{dept.avg_ctc > 0 ? (dept.avg_ctc / 100000).toFixed(1) : '0'}L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{dept.median_ctc > 0 ? (dept.median_ctc / 100000).toFixed(1) : '0'}L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{dept.highest_ctc > 0 ? (dept.highest_ctc / 100000).toFixed(1) : '0'}L
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dept.full_time} / {dept.internships}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTC Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CTC Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">CTC Distribution Analysis</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {/* Above 10L */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-green-800">Above ₹10L</div>
                <div className="text-xs text-green-600">
                  {ctcDistribution.above10L.count} students
                </div>
              </div>
              <div className="text-lg font-bold text-green-800">
                {ctcDistribution.above10L.percentage.toFixed(1)}%
              </div>
            </div>

            {/* 5L - 10L */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-800">₹5L - ₹10L</div>
                <div className="text-xs text-blue-600">
                  {ctcDistribution.between5L10L.count} students
                </div>
              </div>
              <div className="text-lg font-bold text-blue-800">
                {ctcDistribution.between5L10L.percentage.toFixed(1)}%
              </div>
            </div>

            {/* Below 5L */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-orange-800">Below ₹5L</div>
                <div className="text-xs text-orange-600">
                  {ctcDistribution.below5L.count} students
                </div>
              </div>
              <div className="text-lg font-bold text-orange-800">
                {ctcDistribution.below5L.percentage.toFixed(1)}%
              </div>
            </div>

            {/* Internships */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-purple-800">Internships</div>
                <div className="text-xs text-purple-600">
                  {ctcDistribution.internships.count} students
                </div>
              </div>
              <div className="text-lg font-bold text-purple-800">
                {ctcDistribution.internships.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Placements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Placements</h3>
            <button
              onClick={handleExportRecentPlacements}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentPlacements.length > 0 ? (
              recentPlacements.slice(0, 5).map((placement) => (
                <div
                  key={placement.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-gray-900">
                        {placement.student_name}
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          placement.employment_type === 'Full-time'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {placement.employment_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {placement.student_id} • {placement.department}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">
                      {placement.company_name}
                    </div>
                    <div className="text-xs text-gray-600">{placement.job_title}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />₹
                        {placement.salary_offered > 0
                          ? (placement.salary_offered / 100000).toFixed(1)
                          : '0'}
                        L
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {placement.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(placement.placement_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 text-xs rounded-full ${
                      placement.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : placement.status === 'offer_received'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {placement.status.replace('_', ' ')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No recent placements found</p>
              </div>
            )}
          </div>

          {recentPlacements.length > 5 && (
            <div className="mt-3 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {recentPlacements.length} placements →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showAnalyticsFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Analytics</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={selectedAnalyticsDepartment}
                  onChange={(e) => setSelectedAnalyticsDepartment(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departmentAnalytics.map((dept) => (
                    <option key={dept.department} value={dept.department}>
                      {dept.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={selectedAnalyticsYear}
                  onChange={(e) => setSelectedAnalyticsYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={selectedAnalyticsType}
                  onChange={(e) => setSelectedAnalyticsType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time Only</option>
                  <option value="internship">Internships Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={clearAnalyticsFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowAnalyticsFilter(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementAnalytics;
