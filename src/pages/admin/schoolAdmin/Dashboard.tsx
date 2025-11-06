import React from "react";
import ReactApexChart from "react-apexcharts";
import {
  Users,
  GraduationCap,
  Calendar,
  TrendingUp,
  ChevronRight,
  Clock,
  UserPlus,
  Bell,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";
import { BanknotesIcon } from "@heroicons/react/24/outline";

const SchoolDashboard: React.FC = () => {
  // ===== KPI Cards =====
  const kpiData = [
    {
      title: "Total Students",
      value: "1,200",
      change: 5.2,
      changeLabel: "vs last month",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Teachers",
      value: "65",
      change: 3.2,
      changeLabel: "+2 new this term",
      icon: <Users className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Average Attendance",
      value: "93.5%",
      change: 1.8,
      changeLabel: "vs yesterday",
      icon: <Calendar className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Fee Collection",
      value: "₹12.8L",
      change: 10.3,
      changeLabel: "vs last quarter",
      icon: <BanknotesIcon className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data =====
  const attendanceTrend = {
    series: [{ name: "Attendance %", data: [89, 91, 92, 90, 93, 94, 93.5] }],
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
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        min: 85,
        max: 100,
        labels: { style: { colors: "#6b7280" } },
      },
      tooltip: { theme: "light" },
      grid: { borderColor: "#f1f5f9" },
    },
  };

  const feeCollection = {
    series: [
      { name: "Fee Collected (₹L)", data: [8.5, 9.2, 10.8, 11.5, 12.8] },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 8,
          dataLabels: { position: "top" },
        },
      },
      colors: ["#8b5cf6"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `₹${val}L`,
        offsetY: -20,
        style: { fontSize: "11px", colors: ["#6b7280"] },
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May"],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        title: { text: "Amount (₹ Lakhs)" },
        labels: { style: { colors: "#6b7280" } },
      },
      legend: { show: false },
      grid: { borderColor: "#f1f5f9" },
      tooltip: { theme: "light" },
    },
  };

  const classOverview = [
    { grade: "Grade 10", students: 45, attendance: 96 },
    { grade: "Grade 9", students: 52, attendance: 92 },
    { grade: "Grade 8", students: 48, attendance: 89 },
    { grade: "Grade 7", students: 55, attendance: 94 },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "New Admissions Started",
      description: "25 new students enrolled for next academic year",
      time: "2 hours ago",
      type: "success",
      icon: UserPlus,
    },
    {
      id: 2,
      title: "Parent-Teacher Meeting",
      description: "Scheduled for Grade 10 on 15th Nov",
      time: "5 hours ago",
      type: "info",
      icon: Calendar,
    },
    {
      id: 3,
      title: "Fee Reminder Sent",
      description: "Payment reminders sent to 120 parents",
      time: "1 day ago",
      type: "warning",
      icon: Bell,
    },
    {
      id: 4,
      title: "Low Attendance Alert",
      description: "Grade 7 attendance dropped below 90%",
      time: "2 days ago",
      type: "error",
      icon: AlertCircle,
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
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          School Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Overview of school activities and academic performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Today's Attendance</p>
              <p className="text-3xl font-bold">94.2%</p>
            </div>
            <TrendingUp className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +2.1% from yesterday
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Active Classes</p>
              <p className="text-3xl font-bold">28</p>
            </div>
            <BookOpen className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3">Across all grades</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Fee Collection Rate</p>
              <p className="text-3xl font-bold">88.5%</p>
            </div>
            <BanknotesIcon className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +5.2% this month
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Student Attendance Trend
          </h2>
          <ReactApexChart
            options={attendanceTrend.options}
            series={attendanceTrend.series}
            type="area"
            height={300}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Fee Collection Overview
          </h2>
          <ReactApexChart
            options={feeCollection.options}
            series={feeCollection.series}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Activities + Class Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
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
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition-all duration-200"
                >
                  <div
                    className={`p-3 rounded-xl shadow-sm border border-transparent hover:border-indigo-200 ${typeColors[activity.type]} transition`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-800">
                        {activity.title}
                      </p>
                      <span className="flex items-center text-xs text-gray-400 whitespace-nowrap ml-2">
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

        {/* Class Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Class Overview
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {classOverview.map((cls, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl p-4 transition-all duration-200 border border-gray-100 hover:border-indigo-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{cls.grade}</p>
                    <p className="text-xs text-gray-500">
                      {cls.students} students
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      cls.attendance >= 95
                        ? "text-green-600 bg-green-100"
                        : cls.attendance >= 90
                        ? "text-blue-600 bg-blue-100"
                        : "text-yellow-600 bg-yellow-100"
                    }`}
                  >
                    {cls.attendance}% attendance
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

export default SchoolDashboard;