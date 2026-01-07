import React, { useState } from "react";
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
} from "lucide-react";
import toast from 'react-hot-toast';

interface PlacementRecord {
  id: string;
  student_name: string;
  student_id: string;
  company_name: string;
  job_title: string;
  department: string;
  employment_type: 'Full-time' | 'Internship';
  salary_offered: number;
  placement_date: string;
  status: 'placed' | 'offer_received' | 'joined';
  location: string;
}

interface DepartmentAnalytics {
  department: string;
  total_students: number;
  placed_students: number;
  placement_rate: number;
  avg_ctc: number;
  median_ctc: number;
  highest_ctc: number;
  total_offers: number;
  internships: number;
  full_time: number;
}

const PlacementAnalytics: React.FC = () => {
  const [selectedAnalyticsDepartment, setSelectedAnalyticsDepartment] = useState("");
  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState("2024");
  const [selectedAnalyticsType, setSelectedAnalyticsType] = useState("all");
  const [showAnalyticsFilter, setShowAnalyticsFilter] = useState(false);

  // Sample placement records data
  const placementRecords: PlacementRecord[] = [
    {
      id: "1",
      student_name: "Rahul Sharma",
      student_id: "CS2021001",
      company_name: "TechCorp Solutions",
      job_title: "Software Engineer",
      department: "Computer Science",
      employment_type: "Full-time",
      salary_offered: 1200000,
      placement_date: "2024-03-15",
      status: "joined",
      location: "Bangalore"
    },
    {
      id: "2",
      student_name: "Priya Patel",
      student_id: "CS2021002",
      company_name: "HealthPlus Medical",
      job_title: "Data Analyst",
      department: "Computer Science",
      employment_type: "Full-time",
      salary_offered: 900000,
      placement_date: "2024-03-10",
      status: "placed",
      location: "Mumbai"
    },
    {
      id: "3",
      student_name: "Amit Kumar",
      student_id: "ME2021001",
      company_name: "ManufacturePro Industries",
      job_title: "Mechanical Engineer",
      department: "Mechanical Engineering",
      employment_type: "Full-time",
      salary_offered: 800000,
      placement_date: "2024-02-28",
      status: "joined",
      location: "Chennai"
    },
    {
      id: "4",
      student_name: "Sneha Reddy",
      student_id: "EC2021001",
      company_name: "TechCorp Solutions",
      job_title: "Electronics Engineer",
      department: "Electronics",
      employment_type: "Full-time",
      salary_offered: 1000000,
      placement_date: "2024-03-05",
      status: "placed",
      location: "Hyderabad"
    },
    {
      id: "5",
      student_name: "Vikram Singh",
      student_id: "CS2022001",
      company_name: "EduTech Learning",
      job_title: "Software Intern",
      department: "Computer Science",
      employment_type: "Internship",
      salary_offered: 300000,
      placement_date: "2024-01-15",
      status: "joined",
      location: "Pune"
    },
    {
      id: "6",
      student_name: "Anita Verma",
      student_id: "MBA2021001",
      company_name: "FinanceFirst Bank",
      job_title: "Financial Analyst",
      department: "Management",
      employment_type: "Full-time",
      salary_offered: 1100000,
      placement_date: "2024-02-20",
      status: "placed",
      location: "Delhi"
    },
    {
      id: "7",
      student_name: "Ravi Gupta",
      student_id: "ME2022001",
      company_name: "ManufacturePro Industries",
      job_title: "Production Intern",
      department: "Mechanical Engineering",
      employment_type: "Internship",
      salary_offered: 250000,
      placement_date: "2024-01-20",
      status: "joined",
      location: "Chennai"
    },
    {
      id: "8",
      student_name: "Kavya Nair",
      student_id: "EC2022001",
      company_name: "TechCorp Solutions",
      job_title: "Hardware Intern",
      department: "Electronics",
      employment_type: "Internship",
      salary_offered: 280000,
      placement_date: "2024-01-25",
      status: "joined",
      location: "Bangalore"
    }
  ];

  // Calculate department analytics
  const calculateDepartmentAnalytics = (): DepartmentAnalytics[] => {
    const departments = ["Computer Science", "Mechanical Engineering", "Electronics", "Management"];
    
    return departments.map(dept => {
      const deptPlacements = placementRecords.filter(p => p.department === dept);
      const fullTimePlacements = deptPlacements.filter(p => p.employment_type === "Full-time");
      const internships = deptPlacements.filter(p => p.employment_type === "Internship");
      
      const totalStudents = dept === "Computer Science" ? 120 : 
                           dept === "Mechanical Engineering" ? 100 :
                           dept === "Electronics" ? 80 : 60;
      
      // Average CTC calculation
      const avgCtc = fullTimePlacements.length > 0 
        ? fullTimePlacements.reduce((sum, p) => sum + p.salary_offered, 0) / fullTimePlacements.length 
        : 0;
      
      // Median CTC calculation
      const deptSalaries = fullTimePlacements.map(p => p.salary_offered).sort((a, b) => a - b);
      const medianCtc = deptSalaries.length > 0 
        ? deptSalaries.length % 2 === 0
          ? (deptSalaries[deptSalaries.length / 2 - 1] + deptSalaries[deptSalaries.length / 2]) / 2
          : deptSalaries[Math.floor(deptSalaries.length / 2)]
        : 0;
      
      const highestCtc = fullTimePlacements.length > 0 
        ? Math.max(...fullTimePlacements.map(p => p.salary_offered)) 
        : 0;
      
      return {
        department: dept,
        total_students: totalStudents,
        placed_students: deptPlacements.length,
        placement_rate: (deptPlacements.length / totalStudents) * 100,
        avg_ctc: avgCtc,
        median_ctc: medianCtc,
        highest_ctc: highestCtc,
        total_offers: deptPlacements.length,
        internships: internships.length,
        full_time: fullTimePlacements.length,
      };
    });
  };

  const departmentAnalytics = calculateDepartmentAnalytics();

  // Filter analytics data
  const filteredAnalytics = departmentAnalytics.filter(dept => {
    return !selectedAnalyticsDepartment || dept.department === selectedAnalyticsDepartment;
  });

  // Calculate overall metrics
  const totalPlacements = placementRecords.length;
  const totalInternships = placementRecords.filter(p => p.employment_type === "Internship").length;
  const totalFullTime = placementRecords.filter(p => p.employment_type === "Full-time").length;
  const internshipToJobRatio = totalFullTime > 0 ? (totalInternships / totalFullTime).toFixed(2) : "0";
  
  // Enhanced CTC calculations
  const fullTimeSalaries = placementRecords
    .filter(p => p.employment_type === "Full-time")
    .map(p => p.salary_offered)
    .sort((a, b) => a - b);
  
  const overallAvgCtc = fullTimeSalaries.length > 0 
    ? fullTimeSalaries.reduce((sum, salary) => sum + salary, 0) / fullTimeSalaries.length 
    : 0;
  
  // Median CTC calculation
  const overallMedianCtc = fullTimeSalaries.length > 0 
    ? fullTimeSalaries.length % 2 === 0
      ? (fullTimeSalaries[fullTimeSalaries.length / 2 - 1] + fullTimeSalaries[fullTimeSalaries.length / 2]) / 2
      : fullTimeSalaries[Math.floor(fullTimeSalaries.length / 2)]
    : 0;

  const overallHighestCtc = fullTimeSalaries.length > 0 ? Math.max(...fullTimeSalaries) : 0;

  // Enhanced Export functionality
  const handleExportReport = () => {
    try {
      // Department Analytics CSV
      const departmentCsvData = [
        ["Department Analytics Report"],
        ["Generated on:", new Date().toLocaleDateString()],
        [],
        ["Department", "Total Students", "Placed Students", "Placement Rate (%)", "Avg CTC (₹)", "Median CTC (₹)", "Highest CTC (₹)", "Full-time", "Internships"],
        ...filteredAnalytics.map(dept => [
          dept.department,
          dept.total_students,
          dept.placed_students,
          dept.placement_rate.toFixed(1),
          dept.avg_ctc,
          dept.median_ctc,
          dept.highest_ctc,
          dept.full_time,
          dept.internships
        ]),
        [],
        ["OVERALL SUMMARY"],
        ["Total Placements", totalPlacements],
        ["Overall Avg CTC (₹)", overallAvgCtc.toFixed(0)],
        ["Overall Median CTC (₹)", overallMedianCtc.toFixed(0)],
        ["Highest CTC (₹)", overallHighestCtc.toFixed(0)],
        ["Internship:Job Ratio", `${internshipToJobRatio}:1`],
      ];

      // Recent Placements CSV
      const recentPlacementsCsvData = [
        [],
        ["Recent Placements Report"],
        [],
        ["Student Name", "Student ID", "Company", "Job Title", "Department", "Employment Type", "CTC (₹)", "Location", "Placement Date", "Status"],
        ...placementRecords.map(record => [
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

      // Combine both reports
      const combinedCsvData = [...departmentCsvData, ...recentPlacementsCsvData];
      
      // Convert to CSV string
      const csvContent = combinedCsvData.map(row => 
        row.map(cell => `"${cell}"`).join(",")
      ).join("\n");

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

  const handleExportRecentPlacements = () => {
    try {
      const csvData = [
        ["Recent Placements Report"],
        ["Generated on:", new Date().toLocaleDateString()],
        [],
        ["Student Name", "Student ID", "Company", "Job Title", "Department", "Employment Type", "CTC (₹)", "Location", "Placement Date", "Status"],
        ...placementRecords.map(record => [
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Placement Analytics</h2>
        <div className="flex gap-2">
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
                <div className="text-xs text-green-600">3 students</div>
              </div>
              <div className="text-lg font-bold text-green-800">37.5%</div>
            </div>
            
            {/* 5L - 10L */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-blue-800">₹5L - ₹10L</div>
                <div className="text-xs text-blue-600">2 students</div>
              </div>
              <div className="text-lg font-bold text-blue-800">25%</div>
            </div>
            
            {/* Below 5L */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-orange-800">Below ₹5L</div>
                <div className="text-xs text-orange-600">0 students</div>
              </div>
              <div className="text-lg font-bold text-orange-800">0%</div>
            </div>
            
            {/* Internships */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-purple-800">Internships</div>
                <div className="text-xs text-purple-600">3 students</div>
              </div>
              <div className="text-lg font-bold text-purple-800">37.5%</div>
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
            {placementRecords.slice(0, 5).map((placement) => (
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
                      ₹{(placement.salary_offered / 100000).toFixed(1)}L
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
                  placement.status === 'joined' 
                    ? 'bg-green-100 text-green-800' 
                    : placement.status === 'placed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {placement.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
          
          {placementRecords.length > 5 && (
            <div className="mt-3 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {placementRecords.length} placements →
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
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Management">Management</option>
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