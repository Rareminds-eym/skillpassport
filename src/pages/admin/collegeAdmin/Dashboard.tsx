import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Award,
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  DollarSign,
  Download,
  Filter,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  // ===== KPI Cards =====
  const kpiData = [
    {
      title: "Total Students",
      value: "48,793",
      change: 12.5,
      changeLabel: "vs last semester",
      icon: <Users className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Faculty",
      value: "878",
      change: 5.2,
      changeLabel: "active members",
      icon: <Award className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Departments",
      value: "24",
      change: 0,
      changeLabel: "across programs",
      icon: <Building2 className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Placement Rate",
      value: "87.3%",
      change: 8.4,
      changeLabel: "this academic year",
      icon: <Briefcase className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Quick Actions =====
  const quickActions = [
    {
      title: "Department Management",
      description: "Manage departments & faculty",
      icon: Building2,
      color: "bg-blue-500",
      route: "/college-admin/departments/management",
    },
    {
      title: "Student Admissions",
      description: "Process new admissions",
      icon: Users,
      color: "bg-purple-500",
      route: "/college-admin/students/data-management",
    },
    {
      title: "Attendance Tracking",
      description: "View attendance reports",
      icon: CheckCircle,
      color: "bg-green-500",
      route: "/college-admin/students/attendance",
    },
    {
      title: "Course Mapping",
      description: "Map courses to programs",
      icon: BookOpen,
      color: "bg-orange-500",
      route: "/college-admin/departments/mapping",
    },
    {
      title: "Exam Management",
      description: "Schedule & manage exams",
      icon: FileText,
      color: "bg-red-500",
      route: "/college-admin/examinations",
    },
    {
      title: "Placement Dashboard",
      description: "Track placement activities",
      icon: Briefcase,
      color: "bg-indigo-500",
      route: "/college-admin/placements",
    },
  ];

  // ===== Chart Data - Program Growth Trend =====
  const programGrowthTrend = {
    series: [{ name: "Student Enrollment", data: [42000, 43500, 45000, 46200, 47000, 47800, 48793] }],
    options: {
      chart: { type: "area", toolbar: { show: false }, height: 250 },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
      },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: { labels: { style: { colors: "#6b7280" } } },
      tooltip: { theme: "light" },
    },
  };

  // ===== Top Departments by Students =====
  const topDepartmentsStats = {
    series: [
      { name: "Students", data: [8500, 7200, 6800, 5900, 5400] },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 8 } },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: [
          "Computer Science",
          "Mechanical Eng",
          "Electronics",
          "Civil Eng",
          "Business Admin",
        ],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        labels: { 
          style: { colors: "#6b7280" },
        },
      },
      grid: { borderColor: "#f1f5f9" },
      tooltip: { 
        theme: "light",
        y: {
          formatter: (val: number) => `${val.toLocaleString()} students`
        }
      },
    },
  };

  // ===== Department Overview =====
  const departmentOverview = [
    { name: "Engineering", programs: 12, students: 28500, status: "Active" },
    { name: "Arts & Science", programs: 8, students: 12300, status: "Active" },
    { name: "Management", programs: 4, students: 7993, status: "Active" },
  ];

  // ===== Recent Activities =====
  const recentActivities = [
    {
      id: 1,
      title: "New Admission Batch",
      description: "234 students admitted for Fall 2025 semester",
      time: "2 hours ago",
      type: "success",
      icon: Users,
    },
    {
      id: 2,
      title: "Attendance Alert",
      description: "45 students below 75% attendance threshold",
      time: "5 hours ago",
      type: "warning",
      icon: AlertCircle,
    },
    {
      id: 3,
      title: "Exam Schedule Published",
      description: "Mid-semester exams scheduled for next week",
      time: "1 day ago",
      type: "info",
      icon: FileText,
    },
    {
      id: 4,
      title: "Placement Drive",
      description: "TCS campus recruitment completed - 87 offers",
      time: "2 days ago",
      type: "success",
      icon: Briefcase,
    },
  ];

  // ===== Circulars & Notifications =====
  const circulars = [
    {
      id: 1,
      title: "Academic Calendar Update",
      date: "Dec 3, 2025",
      priority: "high",
      status: "new",
    },
    {
      id: 2,
      title: "Faculty Development Program",
      date: "Dec 2, 2025",
      priority: "medium",
      status: "read",
    },
    {
      id: 3,
      title: "Sports Day Announcement",
      date: "Dec 1, 2025",
      priority: "low",
      status: "read",
    },
  ];

  // ===== Activity Type Colors =====
  const typeColors: Record<string, string> = {
    success: "bg-green-100 text-green-600",
    info: "bg-blue-100 text-blue-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
  };

  // ===== Render =====
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              College Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Overview of institutional performance and program analytics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.route)}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition group"
              >
                <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    {action.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Attendance Today</p>
              <p className="text-3xl font-bold">92.4%</p>
            </div>
            <CheckCircle className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +2.3% from yesterday
          </p>
        </div>

        <div className="bg-purple-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Syllabus Progress</p>
              <p className="text-3xl font-bold">78%</p>
            </div>
            <BookOpen className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3">On track for semester completion</p>
        </div>

        <div className="bg-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Fee Collection</p>
              <p className="text-3xl font-bold">₹2.4Cr</p>
            </div>
            <DollarSign className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            85% collected this semester
          </p>
        </div>

        <div className="bg-orange-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Skill Courses</p>
              <p className="text-3xl font-bold">156</p>
            </div>
            <Award className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3">Active skill development programs</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Student Enrollment Trend
          </h2>
          <ReactApexChart
            options={programGrowthTrend.options}
            series={programGrowthTrend.series}
            type="area"
            height={300}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Top Departments
          </h2>
          <ReactApexChart
            options={topDepartmentsStats.options}
            series={topDepartmentsStats.series}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Activities + Circulars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Activities</h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition"
                >
                  <div
                    className={`p-3 rounded-xl shadow-sm ${typeColors[activity.type]}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-semibold text-gray-800">
                        {activity.title}
                      </p>
                      <span className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circulars & Notifications */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Circulars & Notifications
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {circulars.map((circular) => (
              <div
                key={circular.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${circular.status === 'new' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className={`font-semibold ${circular.status === 'new' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {circular.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{circular.date}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    circular.priority === 'high'
                      ? 'bg-red-100 text-red-600'
                      : circular.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {circular.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Department Overview
          </h2>
          <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
            View Details <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departmentOverview.map((dept, i) => (
            <div
              key={i}
              className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl p-5 transition border border-gray-200 hover:border-indigo-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  {dept.status}
                </span>
              </div>
              <p className="font-bold text-gray-800 text-lg mb-1">{dept.name}</p>
              <p className="text-sm text-gray-600">
                {dept.programs} programs • {dept.students.toLocaleString()} students
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
