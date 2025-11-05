import React from "react";
import ReactApexChart from "react-apexcharts";
import {
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Clock,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

const Dashboard: React.FC = () => {
  // ===== KPI Cards =====
  const kpiData = [
    {
      title: "Total Students",
      value: "12,456",
      change: 8.5,
      changeLabel: "vs last semester",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Departments",
      value: "24",
      change: 0,
      changeLabel: "active departments",
      icon: <Building2 className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Placement Rate",
      value: "87.5%",
      change: 12.3,
      changeLabel: "vs last year",
      icon: <Briefcase className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Faculty Members",
      value: "842",
      change: 5.2,
      changeLabel: "vs last semester",
      icon: <Users className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data =====
  const placementTrend = {
    series: [{ name: "Placement %", data: [72, 75, 78, 82, 87, 89, 91] }],
    options: {
      chart: { type: "area", toolbar: { show: false }, height: 250 },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
      },
      colors: ["#16a34a"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: { labels: { style: { colors: "#6b7280" } } },
      tooltip: { theme: "light" },
    },
  };

  const departmentStats = {
    series: [
      { name: "Students", data: [2845, 1923, 1654, 1432, 1876] },
      { name: "Placements %", data: [92, 85, 88, 79, 90] },
    ],
    options: {
      chart: { type: "bar", stacked: false, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: false, columnWidth: "45%", borderRadius: 6 } },
      colors: ["#3b82f6", "#22c55e"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ["CSE", "Mechanical", "Electrical", "Civil", "Electronics"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        title: { text: "Count / %" },
        labels: { style: { colors: "#6b7280" } },
      },
      legend: { position: "top", horizontalAlign: "right" },
      grid: { borderColor: "#f1f5f9" },
      tooltip: { theme: "light" },
    },
  };

  const departmentOverview = [
    { name: "Computer Science", students: 2845, faculty: 156, placements: 92 },
    { name: "Mechanical Engg.", students: 1923, faculty: 124, placements: 85 },
    { name: "Electrical Engg.", students: 1654, faculty: 98, placements: 88 },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "New Admission Batch",
      description: "150 students joined Computer Science",
      time: "2 hours ago",
      type: "success",
      icon: GraduationCap,
    },
    {
      id: 2,
      title: "Placement Drive",
      description: "Google recruitment on 20th Nov",
      time: "5 hours ago",
      type: "info",
      icon: Briefcase,
    },
    {
      id: 3,
      title: "Department Meeting",
      description: "HODs meeting scheduled tomorrow",
      time: "1 day ago",
      type: "warning",
      icon: Calendar,
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
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          College Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Overview of institutional performance and analytics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Bottom Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Attendance Today</p>
              <p className="text-3xl font-bold">94.2%</p>
            </div>
            <TrendingUp className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +2.5% from yesterday
          </p>
        </div>

        <div className="bg-purple-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Active Courses</p>
              <p className="text-3xl font-bold">348</p>
            </div>
            <Award className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3">Across all departments</p>
        </div>

        <div className="bg-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Job Offers</p>
              <p className="text-3xl font-bold">2,847</p>
            </div>
            <Briefcase className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +18% this year
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Placement Growth Trend
          </h2>
          <ReactApexChart
            options={placementTrend.options}
            series={placementTrend.series}
            type="area"
            height={300}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Department Comparison
          </h2>
          <ReactApexChart
            options={departmentStats.options}
            series={departmentStats.series}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Redesigned Activities + Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm">
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
                    className={`p-3 rounded-xl shadow-sm border border-transparent hover:border-indigo-200 ${typeColors[activity.type]} transition`}
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

        {/* Department Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Department Overview
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {departmentOverview.map((dept, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{dept.name}</p>
                  <p className="text-xs text-gray-500">
                    {dept.students.toLocaleString()} students • {dept.faculty} faculty
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {dept.placements}% placed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
