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
  BookOpen,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

const Dashboard: React.FC = () => {
  // ===== KPI Cards (Real Data from RM Programs Excel) =====
  const kpiData = [
    {
      title: "Total Programs",
      value: "48",
      change: 89.6,
      changeLabel: "completion rate",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Learners",
      value: "48,793",
      change: 0,
      changeLabel: "students & faculty",
      icon: <Users className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Faculty Trained",
      value: "878",
      change: 0,
      changeLabel: "through FDP programs",
      icon: <Award className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Colleges Reached",
      value: "1,658",
      change: 0,
      changeLabel: "institutions covered",
      icon: <Building2 className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data - Program Growth Trend =====
  const programGrowthTrend = {
    series: [{ name: "Completed Programs", data: [8, 12, 18, 25, 34, 40, 43] }],
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

  // ===== Top Courses by Learners (Real Data) =====
  const topCoursesStats = {
    series: [
      { name: "Learners", data: [14290, 5560, 5034, 3881, 3829] },
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 8 } },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: [
          "EV Battery Mgmt",
          "FSQM",
          "GMP",
          "Medical Coding",
          "MC",
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
          formatter: (val: number) => `${val.toLocaleString()} learners`
        }
      },
    },
  };

  // ===== Program Overview (Real Data) =====
  const programOverview = [
    { name: "Naan Mudhalvan", programs: 29, learners: 45346, status: "Active" },
    { name: "TNSDC", programs: 2, learners: 2487, status: "Active" },
    { name: "Acharya Programs", programs: 9, learners: 674, status: "Active" },
  ];

  // ===== Recent Activities (Real Data from Excel) =====
  const recentActivities = [
    {
      id: 1,
      title: "GMP Program Completed",
      description: "5,034 students trained in Good Manufacturing Practice",
      time: "Recently completed",
      type: "success",
      icon: Award,
    },
    {
      id: 2,
      title: "FSQM Training Finished",
      description: "5,560 learners completed Food Safety & Quality Management",
      time: "Recently completed",
      type: "success",
      icon: BookOpen,
    },
    {
      id: 3,
      title: "Medical Coding Program",
      description: "3,829 students trained across multiple colleges",
      time: "Recently completed",
      type: "success",
      icon: GraduationCap,
    },
    {
      id: 4,
      title: "EV Battery Management",
      description: "14,290 learners trained in Electric Vehicle technology",
      time: "Ongoing",
      type: "info",
      icon: Briefcase,
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
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          College Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Overview of institutional performance and program analytics
        </p>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Bottom Quick Stats (Real Data) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Student Programs</p>
              <p className="text-3xl font-bold">27</p>
            </div>
            <TrendingUp className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            47,629 students trained
          </p>
        </div>

        <div className="bg-purple-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Faculty Programs</p>
              <p className="text-3xl font-bold">15</p>
            </div>
            <Award className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3">878 faculty members trained</p>
        </div>

        <div className="bg-green-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">District Coverage</p>
              <p className="text-3xl font-bold">354</p>
            </div>
            <Building2 className="h-7 w-7 opacity-90" />
          </div>
          <p className="text-sm mt-3 flex items-center gap-1">
            Across Tamil Nadu & Karnataka
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Program Growth Trend
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
            Top Courses by Learners
          </h2>
          <ReactApexChart
            options={topCoursesStats.options}
            series={topCoursesStats.series}
            type="bar"
            height={300}
          />
        </div>
      </div>

      {/* Redesigned Activities + Program Overview */}
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

        {/* Program Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Program Overview
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View Details <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {programOverview.map((prog, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{prog.name}</p>
                  <p className="text-xs text-gray-500">
                    {prog.programs} programs • {prog.learners.toLocaleString()} learners
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {prog.status}
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