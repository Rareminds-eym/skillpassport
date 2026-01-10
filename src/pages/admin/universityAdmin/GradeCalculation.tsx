import React, { useState } from "react";
import {
  Calculator,
  Users,
  CheckCircle,
  Plus,
  Search,
  Download,
  Edit,
  Save,
  Eye,
  BookOpen,
  Award,
  Building2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  RefreshCw,
  Clock,
  Target,
} from "lucide-react";

const GradeCalculation: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Mock data for grade calculations
  const [gradeCalculations] = useState([
    {
      id: 1,
      examination: "End Semester Examination - December 2024",
      college: "ABC Engineering College",
      department: "Computer Science",
      semester: "5th Semester",
      totalStudents: 120,
      calculatedStudents: 0,
      pendingStudents: 120,
      status: "Pending",
      dueDate: "2025-01-15",
      subjects: ["Data Structures", "DBMS", "Computer Networks", "Software Engineering"],
      weightage: {
        internal: 30,
        external: 70,
        practical: 20,
        assignment: 10
      }
    },
    {
      id: 2,
      examination: "Internal Assessment - November 2024",
      college: "XYZ Arts & Science College",
      department: "Mathematics",
      semester: "3rd Semester",
      totalStudents: 85,
      calculatedStudents: 85,
      pendingStudents: 0,
      status: "Completed",
      dueDate: "2024-12-01",
      subjects: ["Calculus", "Linear Algebra", "Statistics", "Discrete Mathematics"],
      weightage: {
        internal: 40,
        external: 60,
        practical: 0,
        assignment: 20
      }
    },
    {
      id: 3,
      examination: "Practical Examination - January 2025",
      college: "PQR Medical College",
      department: "Biochemistry",
      semester: "4th Semester",
      totalStudents: 60,
      calculatedStudents: 30,
      pendingStudents: 30,
      status: "In Progress",
      dueDate: "2025-01-25",
      subjects: ["Clinical Biochemistry", "Molecular Biology", "Enzymology"],
      weightage: {
        internal: 20,
        external: 50,
        practical: 30,
        assignment: 0
      }
    },
  ]);

  const [gradeSettings] = useState({
    gradeScale: "10-point",
    passingGrade: 4.0,
    gradeRanges: [
      { grade: "A+", min: 9.0, max: 10.0, points: 10 },
      { grade: "A", min: 8.0, max: 8.99, points: 9 },
      { grade: "B+", min: 7.0, max: 7.99, points: 8 },
      { grade: "B", min: 6.0, max: 6.99, points: 7 },
      { grade: "C+", min: 5.0, max: 5.99, points: 6 },
      { grade: "C", min: 4.0, max: 4.99, points: 5 },
      { grade: "F", min: 0.0, max: 3.99, points: 0 },
    ]
  });

  // Filter calculations
  const filteredCalculations = gradeCalculations.filter((calc) => {
    if (searchTerm && !calc.examination.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !calc.college.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (collegeFilter && !calc.college.toLowerCase().includes(collegeFilter.toLowerCase())) return false;
    if (semesterFilter && calc.semester !== semesterFilter) return false;
    if (activeTab === "pending" && calc.status !== "Pending") return false;
    if (activeTab === "progress" && calc.status !== "In Progress") return false;
    if (activeTab === "completed" && calc.status !== "Completed") return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700',
      "In Progress": 'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.Pending;
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-600";
      case "In Progress": return "bg-blue-600";
      default: return "bg-gray-300";
    }
  };

  const handleCalculateGrades = (id: number) => {
    alert(`Starting grade calculation for ID: ${id}`);
  };

  const handleBulkCalculate = () => {
    const pendingCalculations = filteredCalculations.filter(calc => calc.status === "Pending");
    if (pendingCalculations.length > 0) {
      alert(`Starting bulk calculation for ${pendingCalculations.length} examinations`);
    } else {
      alert("No pending calculations found");
    }
  };

  const tabs = [
    { id: "pending", label: "Pending Calculations", count: gradeCalculations.filter(c => c.status === "Pending").length },
    { id: "progress", label: "In Progress", count: gradeCalculations.filter(c => c.status === "In Progress").length },
    { id: "completed", label: "Completed", count: gradeCalculations.filter(c => c.status === "Completed").length },
    { id: "settings", label: "Grade Settings", count: 0 },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Grade Calculation System
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Calculate final grades and manage grading workflows across all colleges
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-yellow-100 text-sm mb-1">Pending Calculations</p>
              <p className="text-3xl font-bold">{gradeCalculations.filter(c => c.status === "Pending").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-yellow-100">Awaiting processing</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold">{gradeCalculations.filter(c => c.status === "In Progress").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <RefreshCw className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-blue-100">Currently processing</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold">{gradeCalculations.filter(c => c.status === "Completed").length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <CheckCircle className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-green-100">Ready for publishing</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Students</p>
              <p className="text-3xl font-bold">{gradeCalculations.reduce((sum, calc) => sum + calc.totalStudents, 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Users className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-purple-100">Across all examinations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-white/20" : "bg-gray-300"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "settings" ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Grade Settings & Configuration</h2>
            
            {/* Grade Scale Configuration */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Scale Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grading System
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="10-point">10-Point Scale</option>
                    <option value="4-point">4-Point Scale (GPA)</option>
                    <option value="percentage">Percentage Based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Passing Grade
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={gradeSettings.passingGrade}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Grade Ranges */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Ranges</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Min Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Max Score</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Grade Points</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gradeSettings.gradeRanges.map((range, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            range.grade === 'F' ? 'bg-red-100 text-red-700' :
                            range.grade.includes('A') ? 'bg-green-100 text-green-700' :
                            range.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {range.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{range.min}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{range.max}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{range.points}</td>
                        <td className="px-4 py-3">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weightage Configuration */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Assessment Weightage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Assessment (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External Examination (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="70"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Practical (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="20"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Grade Calculations ({filteredCalculations.length})
              </h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Report
                </button>
                <button 
                  onClick={handleBulkCalculate}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Calculator className="h-4 w-4" />
                  Bulk Calculate
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search examinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <input
                type="text"
                placeholder="Filter by college..."
                value={collegeFilter}
                onChange={(e) => setCollegeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />

              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Semesters</option>
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="3rd Semester">3rd Semester</option>
                <option value="4th Semester">4th Semester</option>
                <option value="5th Semester">5th Semester</option>
                <option value="6th Semester">6th Semester</option>
              </select>
            </div>

            {/* Calculations Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Examination Details
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      College & Department
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCalculations.map((calc) => (
                    <tr key={calc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{calc.examination}</p>
                          <p className="text-sm text-gray-600">{calc.semester}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {calc.subjects.slice(0, 2).map((subject, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {subject}
                              </span>
                            ))}
                            {calc.subjects.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{calc.subjects.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{calc.college}</p>
                          <p className="text-sm text-gray-600">{calc.department}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">Total: {calc.totalStudents}</p>
                          <p className="text-green-600">Calculated: {calc.calculatedStudents}</p>
                          <p className="text-yellow-600">Pending: {calc.pendingStudents}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(calc.status)}`}
                              style={{ width: `${(calc.calculatedStudents / calc.totalStudents) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {Math.round((calc.calculatedStudents / calc.totalStudents) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(calc.status)}`}>
                          {calc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {calc.dueDate}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleCalculateGrades(calc.id)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded" 
                            title="Calculate Grades"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCalculations.length === 0 && (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No grade calculations found</p>
                <p className="text-sm text-gray-400">
                  {activeTab === "pending" ? "All calculations are up to date" :
                   activeTab === "progress" ? "No calculations currently in progress" :
                   "No completed calculations found"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeCalculation;