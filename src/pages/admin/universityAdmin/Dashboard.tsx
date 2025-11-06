import React from "react";
import ReactApexChart from "react-apexcharts";
import {
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  Clock,
  CheckCircle,
  Calendar,
  Trophy,
  Target,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

const UniversityDashboard: React.FC = () => {
  // ===== KPI Cards =====
  const kpiData = [
    {
      title: "Total Colleges",
      value: "28",
      change: 0,
      changeLabel: "affiliated colleges",
      icon: <Building2 className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Students",
      value: "42,356",
      change: 7.8,
      changeLabel: "vs last year",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Placement Rate",
      value: "84.6%",
      change: 6.1,
      changeLabel: "YoY growth",
      icon: <Briefcase className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Faculty Members",
      value: "2,345",
      change: 3.2,
      changeLabel: "vs last year",
      icon: <Users className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data =====
  const placementGrowthTrend = {
    series: [{ name: "Placement %", data: [68, 72, 76, 79, 82, 84, 84.6] }],
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
      yaxis: {
        min: 60,
        max: 100,
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: number) => `${val}%`,
        },
      },
      tooltip: {
        theme: "light",
        y: { formatter: (val: number) => `${val}%` },
      },
      grid: { borderColor: "#f1f5f9" },
    },
  };

  const collegeComparison = {
    series: [
      { name: "Students", data: [5432, 4823, 4156, 3987, 3645] },
      { name: "Placement %", data: [91, 88, 86, 83, 79] },
    ],
    options: {
      chart: { type: "bar", stacked: false, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "60%",
          borderRadius: 6,
        },
      },
      colors: ["#3b82f6", "#22c55e"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: [
          "TechVille",
          "Innovation",
          "Global Tech",
          "Future Leaders",
          "Premier Eng.",
        ],
        labels: {
          style: { colors: "#6b7280", fontSize: "11px" },
          rotate: -45,
          rotateAlways: false,
        },
      },
      yaxis: [
        {
          title: { text: "Students", style: { color: "#6b7280" } },
          labels: {
            style: { colors: "#6b7280" },
            formatter: (val: number) => `${(val / 1000).toFixed(1)}K`,
          },
        },
        {
          opposite: true,
          title: { text: "Placement %", style: { color: "#6b7280" } },
          labels: {
            style: { colors: "#6b7280" },
            formatter: (val: number) => `${val}%`,
          },
          min: 70,
          max: 100,
        },
      ],
      legend: {
        position: "top",
        horizontalAlign: "right",
        markers: { radius: 4 },
        fontSize: "12px",
      },
      grid: { borderColor: "#f1f5f9" },
      tooltip: {
        theme: "light",
        y: [
          {
            formatter: (val: number) => `${val.toLocaleString()} students`,
          },
          {
            formatter: (val: number) => `${val}% placed`,
          },
        ],
      },
    },
  };

  const topPerformingColleges = [
    {
      name: "TechVille College",
      students: 5432,
      placement: 91,
      certification: 88,
      rank: 1,
    },
    {
      name: "Innovation Institute",
      students: 4823,
      placement: 88,
      certification: 85,
      rank: 2,
    },
    {
      name: "Global Tech Campus",
      students: 4156,
      placement: 86,
      certification: 82,
      rank: 3,
    },
    {
      name: "Future Leaders College",
      students: 3987,
      placement: 83,
      certification: 79,
      rank: 4,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "TechVille College Accredited",
      description: "Received NAAC A++ grade accreditation",
      time: "3 hours ago",
      type: "success",
      icon: Award,
    },
    {
      id: 2,
      title: "Placement Drive Announced",
      description: "Multi-college placement event scheduled for 15th Dec",
      time: "6 hours ago",
      type: "info",
      icon: Calendar,
    },
    {
      id: 3,
      title: "Training Program Completed",
      description: "Digital Skills training completed across 12 colleges",
      time: "1 day ago",
      type: "success",
      icon: CheckCircle,
    },
    {
      id: 4,
      title: "New College Affiliation",
      description: "Premier Engineering College joined the network",
      time: "2 days ago",
      type: "info",
      icon: Building2,
    },
  ];

  // ===== Activity Type Colors =====
  const typeColors: Record<string, string> = {
    success: "bg-green-100 text-green-600",
    info: "bg-blue-100 text-blue-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
  };

  // ===== Helper to get performance badge color =====
  const getPerformanceBadgeColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-green-100 text-green-700";
    if (percentage >= 85) return "bg-blue-100 text-blue-700";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };

  // ===== Render =====
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          University Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Centralized insights across all affiliated colleges
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Active Courses</p>
              <p className="text-3xl font-bold">1,284</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Award className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-indigo-100">Across all colleges</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm mb-1">Certifications</p>
              <p className="text-3xl font-bold">34,892</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Trophy className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-purple-100 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +15.4% this year
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-sm mb-1">Job Offers</p>
              <p className="text-3xl font-bold">28,547</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Briefcase className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-green-100 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> +12.8% this year
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            University-Wide Placement Growth Trend
          </h2>
          <ReactApexChart
            options={placementGrowthTrend.options}
            series={placementGrowthTrend.series}
            type="area"
            height={320}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Top Colleges Comparison
          </h2>
          <ReactApexChart
            options={collegeComparison.options}
            series={collegeComparison.series}
            type="bar"
            height={320}
          />
        </div>
      </div>

      {/* Activities + Top Performing Colleges */}
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

        {/* Top Performing Colleges */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Top Performing Colleges
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View Rankings <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {topPerformingColleges.map((college) => (
              <div
                key={college.rank}
                className="bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm text-white shadow-md flex-shrink-0 ${
                        college.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                          : college.rank === 2
                          ? "bg-gradient-to-br from-gray-400 to-gray-600"
                          : college.rank === 3
                          ? "bg-gradient-to-br from-orange-400 to-orange-600"
                          : "bg-gradient-to-br from-blue-400 to-blue-600"
                      }`}
                    >
                      #{college.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">
                        {college.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {college.students.toLocaleString()} students
                      </p>
                    </div>
                  </div>
                  <Trophy className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-2" />
                </div>

                <div className="space-y-2.5">
                  {/* Placement Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-600">
                        Placements
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPerformanceBadgeColor(
                          college.placement
                        )}`}
                      >
                        {college.placement}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${college.placement}%` }}
                      />
                    </div>
                  </div>

                  {/* Certification Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-600">
                        Certifications
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPerformanceBadgeColor(
                          college.certification
                        )}`}
                      >
                        {college.certification}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${college.certification}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">96.3%</p>
            <p className="text-sm font-medium text-gray-600">Pass Rate</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl mb-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">18:1</p>
            <p className="text-sm font-medium text-gray-600">Student-Faculty Ratio</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-3">
              <Award className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">142</p>
            <p className="text-sm font-medium text-gray-600">Research Papers</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-600 rounded-xl mb-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">23</p>
            <p className="text-sm font-medium text-gray-600">Accreditations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityDashboard;