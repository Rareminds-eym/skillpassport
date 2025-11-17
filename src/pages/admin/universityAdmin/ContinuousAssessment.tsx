import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  ClipboardCheck,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  BarChart3,
  Calendar,
  BookOpen,
  Award,
  Target,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

// TypeScript Interfaces
interface AssessmentCriteria {
  id: string;
  name: string;
  type: "Quiz" | "Assignment" | "Project" | "Mid-term" | "Final" | "Lab" | "Attendance";
  weightage: number;
  totalMarks: number;
  deadline?: string;
  status: "upcoming" | "ongoing" | "completed";
}

interface StudentProgress {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  overallScore: number;
  quizScore: number;
  assignmentScore: number;
  projectScore: number;
  midtermScore: number;
  attendance: number;
  status: "excellent" | "good" | "average" | "at-risk";
  trend: "up" | "down" | "stable";
}

const ContinuousAssessment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "configure" | "students" | "analytics">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // ===== Mock Data: Assessment Criteria =====
  const assessmentCriteria: AssessmentCriteria[] = [
    { id: "1", name: "Weekly Quizzes", type: "Quiz", weightage: 15, totalMarks: 100, status: "ongoing" },
    { id: "2", name: "Assignments", type: "Assignment", weightage: 20, totalMarks: 100, status: "ongoing" },
    { id: "3", name: "Class Projects", type: "Project", weightage: 25, totalMarks: 100, deadline: "2025-12-15", status: "ongoing" },
    { id: "4", name: "Mid-term Exam", type: "Mid-term", weightage: 20, totalMarks: 100, deadline: "2025-11-30", status: "upcoming" },
    { id: "5", name: "Lab Work", type: "Lab", weightage: 10, totalMarks: 100, status: "ongoing" },
    { id: "6", name: "Attendance", type: "Attendance", weightage: 10, totalMarks: 100, status: "ongoing" },
  ];

  // ===== Mock Data: Student Progress =====
  const studentProgress: StudentProgress[] = [
    {
      id: "1",
      name: "Priya Sharma",
      rollNumber: "CS2021001",
      email: "priya.sharma@university.edu",
      overallScore: 89,
      quizScore: 92,
      assignmentScore: 88,
      projectScore: 90,
      midtermScore: 85,
      attendance: 95,
      status: "excellent",
      trend: "up",
    },
    {
      id: "2",
      name: "Rahul Kumar",
      rollNumber: "CS2021002",
      email: "rahul.kumar@university.edu",
      overallScore: 76,
      quizScore: 78,
      assignmentScore: 75,
      projectScore: 80,
      midtermScore: 72,
      attendance: 88,
      status: "good",
      trend: "stable",
    },
    {
      id: "3",
      name: "Anjali Patel",
      rollNumber: "CS2021003",
      email: "anjali.patel@university.edu",
      overallScore: 65,
      quizScore: 68,
      assignmentScore: 62,
      projectScore: 70,
      midtermScore: 60,
      attendance: 82,
      status: "average",
      trend: "up",
    },
    {
      id: "4",
      name: "Vikram Singh",
      rollNumber: "CS2021004",
      email: "vikram.singh@university.edu",
      overallScore: 52,
      quizScore: 55,
      assignmentScore: 50,
      projectScore: 58,
      midtermScore: 48,
      attendance: 70,
      status: "at-risk",
      trend: "down",
    },
    {
      id: "5",
      name: "Meera Reddy",
      rollNumber: "CS2021005",
      email: "meera.reddy@university.edu",
      overallScore: 82,
      quizScore: 85,
      assignmentScore: 80,
      projectScore: 84,
      midtermScore: 78,
      attendance: 92,
      status: "good",
      trend: "up",
    },
  ];

  // ===== KPI Data =====
  const kpiData = [
    {
      title: "Average Score",
      value: "72.8%",
      change: 5.2,
      changeLabel: "from last month",
      icon: <Target className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Students",
      value: "248",
      change: 0,
      changeLabel: "enrolled students",
      icon: <Users className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Completion Rate",
      value: "86.5%",
      change: 3.8,
      changeLabel: "assessment completion",
      icon: <ClipboardCheck className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "At-Risk Students",
      value: "18",
      change: -2.1,
      changeLabel: "fewer than last month",
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Charts Data =====
  const performanceTrendChart = {
    series: [
      {
        name: "Average Score",
        data: [68, 70, 69, 72, 74, 71, 73, 72.8],
      },
    ],
    options: {
      chart: { type: "area", toolbar: { show: false }, height: 300 },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1 },
      },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: number) => `${val}%`,
        },
        min: 0,
        max: 100,
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (val: number) => `${val}%`,
        },
      },
      grid: { borderColor: "#f1f5f9" },
    },
  };

  const assessmentDistributionChart = {
    series: [15, 20, 25, 20, 10, 10],
    options: {
      chart: { type: "donut" },
      labels: ["Quizzes", "Assignments", "Projects", "Mid-term", "Lab", "Attendance"],
      colors: ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ec4899"],
      dataLabels: { enabled: true },
      legend: { position: "bottom" },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: { show: true },
              value: { show: true, formatter: (val: string) => `${val}%` },
              total: {
                show: true,
                label: "Total Weightage",
                formatter: () => "100%",
              },
            },
          },
        },
      },
    },
  };

  const performanceDistributionChart = {
    series: [
      {
        name: "Students",
        data: [8, 15, 28, 35, 42],
      },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 8,
          distributed: true,
        },
      },
      colors: ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280" },
        },
        title: {
          text: "Number of Students",
          style: { color: "#6b7280" },
        },
      },
      legend: { show: false },
      grid: { borderColor: "#f1f5f9" },
    },
  };

  // ===== Helper Functions =====
  const getStatusColor = (status: StudentProgress["status"]) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "average":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "at-risk":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (trend: StudentProgress["trend"]) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case "stable":
        return <div className="h-4 w-4 flex items-center"><div className="h-0.5 w-4 bg-gray-400" /></div>;
    }
  };

  const getStatusBadgeColor = (status: AssessmentCriteria["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-700";
      case "ongoing":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredStudents = studentProgress.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || student.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Continuous Assessment Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Track student progress through ongoing evaluation, not just final exams
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "configure", label: "Configure Assessment", icon: ClipboardCheck },
            { key: "students", label: "Student Progress", icon: Users },
            { key: "analytics", label: "Analytics", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                activeTab === key
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Performance Trend Over Time
              </h2>
              <ReactApexChart
                options={performanceTrendChart.options}
                series={performanceTrendChart.series}
                type="area"
                height={300}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Assessment Weightage Distribution
              </h2>
              <ReactApexChart
                options={assessmentDistributionChart.options}
                series={assessmentDistributionChart.series}
                type="donut"
                height={300}
              />
            </div>
          </div>

          {/* Performance Distribution Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Student Performance Distribution
            </h2>
            <ReactApexChart
              options={performanceDistributionChart.options}
              series={performanceDistributionChart.series}
              type="bar"
              height={300}
            />
          </div>

          {/* At-Risk Students Alert */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  At-Risk Students Detected
                </h3>
                <p className="text-gray-700 mb-4">
                  18 students are currently scoring below 60% and may need additional support.
                  Early intervention can help them improve.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                  View At-Risk Students
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "configure" && (
        <div className="space-y-6">
          {/* Add New Assessment Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Assessment Configuration</h2>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium">
              <Plus className="h-5 w-5" />
              Add Assessment
            </button>
          </div>

          {/* Assessment Criteria Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessmentCriteria.map((criteria) => (
              <div
                key={criteria.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2">{criteria.name}</h3>
                <p className="text-sm text-gray-600 mb-4">Type: {criteria.type}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weightage:</span>
                    <span className="font-semibold text-indigo-600 text-lg">{criteria.weightage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Marks:</span>
                    <span className="font-semibold text-gray-900">{criteria.totalMarks}</span>
                  </div>
                  {criteria.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Deadline:</span>
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(criteria.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(criteria.status)}`}>
                    {criteria.status === "ongoing" && <Clock className="h-3 w-3 mr-1" />}
                    {criteria.status === "upcoming" && <Calendar className="h-3 w-3 mr-1" />}
                    {criteria.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {criteria.status.charAt(0).toUpperCase() + criteria.status.slice(1)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Contribution to Final</span>
                    <span className="text-xs font-semibold text-gray-900">{criteria.weightage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${criteria.weightage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Weightage Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Total Weightage</h3>
                <p className="text-sm text-gray-600">Sum of all assessment criteria</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-indigo-600">
                  {assessmentCriteria.reduce((sum, c) => sum + c.weightage, 0)}%
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {assessmentCriteria.reduce((sum, c) => sum + c.weightage, 0) === 100 ? (
                    <span className="text-green-600 flex items-center gap-1 justify-end">
                      <CheckCircle className="h-4 w-4" /> Balanced
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1 justify-end">
                      <XCircle className="h-4 w-4" /> Unbalanced
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="all">All Students</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="at-risk">At-Risk</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                  <Filter className="h-5 w-5" />
                  <span className="hidden sm:inline">More Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Progress Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Student</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Roll Number</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Overall</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Quizzes</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Assignments</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Projects</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Attendance</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-center p-4 font-semibold text-gray-700 text-sm">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-700">{student.rollNumber}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-bold text-lg text-gray-900">{student.overallScore}%</span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                student.overallScore >= 80
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : student.overallScore >= 60
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : "bg-gradient-to-r from-red-500 to-red-600"
                              }`}
                              style={{ width: `${student.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.quizScore}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.assignmentScore}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.projectScore}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-gray-900">{student.attendance}%</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.status)}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1).replace("-", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          {getTrendIcon(student.trend)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No students found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Top Performer</p>
                  <p className="text-2xl font-bold">Priya S.</p>
                </div>
                <Award className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-blue-100">89% overall score</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Avg. Attendance</p>
                  <p className="text-2xl font-bold">85.4%</p>
                </div>
                <Clock className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-purple-100">Across all students</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-green-100 text-sm mb-1">Pass Rate</p>
                  <p className="text-2xl font-bold">92.7%</p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-green-100">Students above 60%</p>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Improvement</p>
                  <p className="text-2xl font-bold">+5.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 opacity-90" />
              </div>
              <p className="text-sm text-orange-100">From last assessment</p>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Assessment Type Performance</h3>
              <div className="space-y-4">
                {[
                  { name: "Quizzes", avg: 78, color: "bg-blue-500" },
                  { name: "Assignments", avg: 72, color: "bg-purple-500" },
                  { name: "Projects", avg: 82, color: "bg-cyan-500" },
                  { name: "Mid-terms", avg: 68, color: "bg-orange-500" },
                  { name: "Lab Work", avg: 85, color: "bg-green-500" },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900">{item.avg}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${item.avg}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Strong Lab Performance</p>
                    <p className="text-sm text-gray-600">Students showing 85% average in practical work</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Mid-term Scores Need Attention</p>
                    <p className="text-sm text-gray-600">68% average suggests need for additional support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Positive Trend</p>
                    <p className="text-sm text-gray-600">Overall scores improving by 5.2% over 8 weeks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousAssessment;

