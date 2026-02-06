import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';
import { opportunitiesService } from '../../../../services/opportunitiesService';
import { 
  placementAnalyticsService, 
  PlacementRecord, 
  DepartmentAnalytics,
  PlacementStats 
} from '../../../../services/placementAnalyticsService';

const PlacementAnalytics: React.FC = () => {
  const [selectedAnalyticsDepartment, setSelectedAnalyticsDepartment] = useState("");
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState("2024");
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState("all");
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
    placementRate: 0
  });
  const [ctcDistribution, setCTCDistribution] = useState({
    above10L: { count: 0, percentage: 0 },
    between5L10L: { count: 0, percentage: 0 },
    below5L: { count: 0, percentage: 0 },
    internships: { count: 0, percentage: 0 }
  });
  const [recentPlacements, setRecentPlacements] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data from database using the same service as main placement stats
  const loadData = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Use the same service as main placement stats for consistency
      const stats = await opportunitiesService.getPlacementStats();
      
      // Get recent placements using the same logic
      const { data: recentPlacementsData, error: recentError } = await supabase
        .from('applied_jobs')
        .select(`
          id,
          application_status,
          applied_at,
          students!fk_applied_jobs_student (
            name,
            student_id,
            branch_field,
            course_name
          ),
          opportunities!fk_applied_jobs_opportunity (
            title,
            company_name,
            employment_type,
            location,
            salary_range_min,
            salary_range_max
          )
        `)
        .eq('application_status', 'accepted')
        .order('applied_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Error fetching recent placements:', recentError);
      }

      // Transform recent placements data
      const transformedRecentPlacements = (recentPlacementsData || []).map(record => ({
        id: record.id.toString(),
        student_name: record.students?.name || 'Unknown Student',
        student_id: record.students?.student_id || '',
        company_name: record.opportunities?.company_name || '',
        job_title: record.opportunities?.title || '',
        department: record.students?.branch_field || record.students?.course_name || '',
        employment_type: record.opportunities?.employment_type as 'Full-time' | 'Internship',
        salary_offered: record.opportunities?.salary_range_max || record.opportunities?.salary_range_min || 0,
        placement_date: record.applied_at,
        status: record.application_status as any,
        location: record.opportunities?.location || ''
      }));

      // Get all students by department for department analytics
      const { data: allStudentsData, error: studentsError } = await supabase
        .from('students')
        .select('branch_field, course_name, id');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      // Get all placements for department analytics
      const { data: allPlacementsData, error: placementsError } = await supabase
        .from('applied_jobs')
        .select(`
          id,
          student_id,
          students!fk_applied_jobs_student (
            branch_field,
            course_name
          ),
          opportunities!fk_applied_jobs_opportunity (
            employment_type,
            salary_range_min,
            salary_range_max
          )
        `)
        .eq('application_status', 'accepted');

      if (placementsError) {
        console.error('Error fetching all placements:', placementsError);
      }

      // Calculate department-wise analytics
      const departmentStats: { [key: string]: any } = {};
      
      // Count total students by department
      (allStudentsData || []).forEach(student => {
        const dept = student.branch_field || student.course_name || 'Unknown';
        if (!departmentStats[dept]) {
          departmentStats[dept] = {
            department: dept,
            total_students: 0,
            placed_students: 0,
            placements: [],
            full_time: 0,
            internships: 0
          };
        }
        departmentStats[dept].total_students++;
      });

      // Count placements by department (count unique students, not total offers)
      const uniqueStudentsByDept: { [key: string]: Set<number> } = {};
      
      (allPlacementsData || []).forEach(placement => {
        const dept = placement.students?.branch_field || placement.students?.course_name || 'Unknown';
        if (departmentStats[dept]) {
          // Use Set to track unique student IDs
          if (!uniqueStudentsByDept[dept]) {
            uniqueStudentsByDept[dept] = new Set();
          }
          uniqueStudentsByDept[dept].add(placement.student_id);
          
          // Still track all placements for salary calculations
          departmentStats[dept].placements.push(placement);
          
          if (placement.opportunities?.employment_type === 'Full-time') {
            departmentStats[dept].full_time++;
          } else if (placement.opportunities?.employment_type === 'Internship') {
            departmentStats[dept].internships++;
          }
        }
      });

      // Update placed_students count with unique students
      Object.keys(departmentStats).forEach(dept => {
        departmentStats[dept].placed_students = uniqueStudentsByDept[dept]?.size || 0;
      });

      // Calculate analytics for each department
      const departmentAnalytics = Object.values(departmentStats).map((dept: any) => {
        const salaries = dept.placements
          .map((p: any) => p.opportunities?.salary_range_max || p.opportunities?.salary_range_min || 0)
          .filter((salary: number) => salary > 0)
          .sort((a: number, b: number) => a - b);

        const avgCtc = salaries.length > 0 
          ? salaries.reduce((sum: number, salary: number) => sum + salary, 0) / salaries.length 
          : 0;

        const medianCtc = salaries.length > 0 
          ? salaries.length % 2 === 0
            ? (salaries[salaries.length / 2 - 1] + salaries[salaries.length / 2]) / 2
            : salaries[Math.floor(salaries.length / 2)]
          : 0;

        const highestCtc = salaries.length > 0 ? Math.max(...salaries) : 0;

        return {
          department: dept.department,
          total_students: dept.total_students,
          placed_students: dept.placed_students, // This is now unique students
          placement_rate: dept.total_students > 0 ? (dept.placed_students / dept.total_students) * 100 : 0,
          avg_ctc: avgCtc,
          median_ctc: medianCtc,
          highest_ctc: highestCtc,
          total_offers: dept.placements.length, // Total offers (can be > placed_students)
          internships: dept.internships,
          full_time: dept.full_time,
        };
      }).sort((a, b) => b.placed_students - a.placed_students);

      // Set the stats using the same data source
      setPlacementStats({
        totalPlacements: stats.studentsPlaced,
        totalApplications: 0, // We'll calculate this separately if needed
        avgCTC: stats.avgCTC,
        medianCTC: stats.medianCTC,
        highestCTC: stats.highestCTC,
        totalInternships: transformedRecentPlacements.filter(p => p.employment_type === 'Internship').length,
        totalFullTime: transformedRecentPlacements.filter(p => p.employment_type === 'Full-time').length,
        placementRate: stats.placementRate
      });

      // Set recent placements
      setRecentPlacements(transformedRecentPlacements);

      // Set department analytics
      setDepartmentAnalytics(departmentAnalytics);

      // Calculate CTC distribution
      const fullTimePlacements = transformedRecentPlacements.filter(p => p.employment_type === 'Full-time');
      const internships = transformedRecentPlacements.filter(p => p.employment_type === 'Internship');
      const totalPlacements = transformedRecentPlacements.length;

      const above10L = fullTimePlacements.filter(p => p.salary_offered >= 1000000).length;
      const between5L10L = fullTimePlacements.filter(p => p.salary_offered >= 500000 && p.salary_offered < 1000000).length;
      const below5L = fullTimePlacements.filter(p => p.salary_offered > 0 && p.salary_offered < 500000).length;

      setCTCDistribution({
        above10L: {
          count: above10L,
          percentage: totalPlacements > 0 ? (above10L / totalPlacements) * 100 : 0
        },
        between5L10L: {
          count: between5L10L,
          percentage: totalPlacements > 0 ? (between5L10L / totalPlacements) * 100 : 0
        },
        below5L: {
          count: below5L,
          percentage: totalPlacements > 0 ? (below5L / totalPlacements) * 100 : 0
        },
        internships: {
          count: internships.length,
          percentage: totalPlacements > 0 ? (internships.length / totalPlacements) * 100 : 0
        }
      });

      // Set placement records
      setPlacementRecords(transformedRecentPlacements);

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
  const filteredAnalytics = departmentAnalytics.filter(dept => {
    return !selectedAnalyticsDepartment || dept.department === selectedAnalyticsDepartment;
  });

  // Calculate overall metrics from real data
  const totalPlacements = placementStats.totalPlacements;
  const totalInternships = placementStats.totalInternships;
  const totalFullTime = placementStats.totalFullTime;
  const internshipToJobRatio = totalFullTime > 0 ? (totalInternships / totalFullTime).toFixed(2) : "0";
  
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
        employmentType: selectedAnalyticsType
      };

      const csvContent = await placementAnalyticsService.exportPlacementData(filters);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `placement_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Placement analytics report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
      console.error("Export error:", error);
    }
  };

  const handleExportRecentPlacements = async () => {
    try {
      const csvData = [
        ["Recent Placements Report"],
        ["Generated on:", new Date().toLocaleDateString()],
        [],
        ["Student Name", "Student ID", "Company", "Job Title", "Department", "Employment Type", "CTC (₹)", "Location", "Placement Date", "Status"],
        ...recentPlacements.map(record => [
          record.student_name,
          record.student_id,
          record.company_name,
          record.job_title,
          record.department,
          record.employment_type,
          record.salary_offered,
          record.location,
          record.placement_date,
          record.status
        ])
      ];
      
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(",")
      ).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `recent_placements_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Recent placements report exported successfully");
    } catch (error) {
      toast.error("Failed to export recent placements");
      console.error("Export error:", error);
    }
  };

  const clearAnalyticsFilters = () => {
    setSelectedAnalyticsDepartment("");
    setSelectedAnalyticsYear("2024");
    setSelectedAnalyticsType("all");
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
            {(selectedAnalyticsDepartment || selectedAnalyticsYear !== "2024" || selectedAnalyticsType !== "all") && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                {[selectedAnalyticsDepartment, selectedAnalyticsYear !== "2024" ? selectedAnalyticsYear : "", selectedAnalyticsType !== "all" ? selectedAnalyticsType : ""].filter(Boolean).length}
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
      
      <p className="text-gray-600 mb-6">Comprehensive placement statistics, department-wise analytics, and CTC analysis.</p>

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
              <p className="text-2xl font-bold text-gray-900">₹{(overallAvgCtc / 100000).toFixed(1)}L</p>
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
              <p className="text-2xl font-bold text-gray-900">₹{(overallMedianCtc / 100000).toFixed(1)}L</p>
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
              <p className="text-2xl font-bold text-gray-900">₹{(overallHighestCtc / 100000).toFixed(1)}L</p>
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
                      <div className="text-sm font-medium text-gray-900">{dept.placement_rate.toFixed(1)}%</div>
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
                <div className="text-xs text-green-600">{ctcDistribution.above10L.count} students</div>
              </div>
              <div className="text-lg font-bold text-green-800">{ctcDistribution.above10L.percentage.toFixed(1)}%</div>
            </div>
            
            {/* 5L - 10L */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-800">₹5L - ₹10L</div>
                <div className="text-xs text-blue-600">{ctcDistribution.between5L10L.count} students</div>
              </div>
              <div className="text-lg font-bold text-blue-800">{ctcDistribution.between5L10L.percentage.toFixed(1)}%</div>
            </div>
            
            {/* Below 5L */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-orange-800">Below ₹5L</div>
                <div className="text-xs text-orange-600">{ctcDistribution.below5L.count} students</div>
              </div>
              <div className="text-lg font-bold text-orange-800">{ctcDistribution.below5L.percentage.toFixed(1)}%</div>
            </div>
            
            {/* Internships */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-purple-800">Internships</div>
                <div className="text-xs text-purple-600">{ctcDistribution.internships.count} students</div>
              </div>
              <div className="text-lg font-bold text-purple-800">{ctcDistribution.internships.percentage.toFixed(1)}%</div>
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
                <div key={placement.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-gray-900">{placement.student_name}</div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        placement.employment_type === 'Full-time' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {placement.employment_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{placement.student_id} • {placement.department}</div>
                    <div className="text-sm text-gray-800 font-medium">{placement.company_name}</div>
                    <div className="text-xs text-gray-600">{placement.job_title}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ₹{placement.salary_offered > 0 ? (placement.salary_offered / 100000).toFixed(1) : '0'}L
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
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    placement.status === 'accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : placement.status === 'offer_received'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
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
                  {departmentAnalytics.map(dept => (
                    <option key={dept.department} value={dept.department}>
                      {dept.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
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