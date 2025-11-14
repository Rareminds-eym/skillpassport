import React from "react";
import ReactApexChart from "react-apexcharts";
import {
  Building2,
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  Clock,
  CheckCircle,
  Calendar,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";

const UniversityDashboard: React.FC = () => {
  // ===== KPI Cards (Real Data from RM Programs Excel) =====
  const kpiData = [
    {
      title: "Total Programs",
      value: "48",
      change: 89.6,
      changeLabel: "completion rate",
      icon: <Building2 className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Total Learners",
      value: "48,593",
      change: 0,
      changeLabel: "across all programs",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Universities Reached",
      value: "188",
      change: 0,
      changeLabel: "institutions covered",
      icon: <Building2 className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Faculty Trained",
      value: "878",
      change: 0,
      changeLabel: "through FDP programs",
      icon: <Users className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data - Learner Distribution: FDP vs SDP =====
  const learnerDistribution = {
    series: [878, 47429],
    options: {
      chart: { type: "donut" },
      labels: ["Faculty (FDP)", "Students (SDP)"],
      colors: ["#8b5cf6", "#3b82f6"],
      dataLabels: { enabled: true },
      legend: { position: "bottom" },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toLocaleString()} learners`
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: { show: true },
              value: {
                show: true,
                formatter: (val: string) => parseInt(val).toLocaleString()
              },
              total: {
                show: true,
                label: "Total Learners",
                formatter: () => "48,307"
              }
            }
          }
        }
      }
    },
  };

  // ===== Top Programs by Learner Count (Real Data) =====
 const topProgramsComparison = {
  series: [
    { 
      name: "Learners", 
      data: [45146, 2487, 674, 286]  // ← PES added 
    },
    { 
      name: "Programs", 
      data: [29, 2, 9, 2]  // ← PES added 
    }
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
        "Naan Mudhalvan",
        "TNSDC",
        "Acharya Programs",
        "PES Programs"   // ← Added
      ],
      labels: {
        style: { colors: "#6b7280", fontSize: "11px" },
      },
    },
    yaxis: [
      {
        title: { text: "Learners", style: { color: "#6b7280" } },
        labels: {
          style: { colors: "#6b7280" },
          formatter: (val: number) => `${(val / 1000).toFixed(0)}K`,
        },
      },
      {
        opposite: true,
        title: { text: "Programs", style: { color: "#6b7280" } },
        labels: {
          style: { colors: "#6b7280" },
        },
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
          formatter: (val: number) => `${val.toLocaleString()} learners`,
        },
        {
          formatter: (val: number) => `${val} programs`,
        },
      ],
    },
  },
};


  // ===== Top Performing Courses (Real Data from Excel) =====
  const topPerformingCourses = [
    {
      name: "Electric Vehicle Battery Management",
      learners: 14290,
      colleges: 308,
      programs: 2,
      rank: 1,
    },
    {
      name: "Food Safety & Quality Management (FSQM)",
      learners: 5560,
      colleges: 172,
      programs: 2,
      rank: 2,
    },
    {
      name: "Good Manufacturing Practice (GMP)",
      learners: 5034,
      colleges: 199,
      programs: 2,
      rank: 3,
    },
    {
      name: "Medical Coding",
      learners: 3881,
      colleges: 69,
      programs: 2,
      rank: 4,
    },
  ];

  // ===== Recent Activities (Real Data) =====
  const recentActivities = [
    {
      id: 1,
      title: "GMP Program Completed",
      description: "5,034 students trained across 199 colleges",
      time: "Recently completed",
      type: "success",
      icon: Award,
    },
    {
      id: 2,
      title: "FSQM Training Concluded",
      description: "5,560 learners completed across 172 institutions",
      time: "Recently completed",
      type: "success",
      icon: CheckCircle,
    },
    {
      id: 3,
      title: "Medical Coding Programs Active",
      description: "7,710 learners trained in Medical Coding courses",
      time: "Ongoing",
      type: "info",
      icon: Calendar,
    },
    {
      id: 4,
      title: "Naan Mudhalvan Initiative",
      description: "29 programs serving 45,346 learners",
      time: "Active",
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
  const getPerformanceBadgeColor = (learners: number): string => {
    if (learners >= 10000) return "bg-green-100 text-green-700";
    if (learners >= 5000) return "bg-blue-100 text-blue-700";
    if (learners >= 3000) return "bg-yellow-100 text-yellow-700";
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
          Centralized insights across all training programs and institutions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Stats Cards (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-indigo-100 text-sm mb-1">Student Programs</p>
              <p className="text-3xl font-bold">27</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <GraduationCap className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-indigo-100">47,629 students trained</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-purple-100 text-sm mb-1">Faculty Programs</p>
              <p className="text-3xl font-bold">15</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Award className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-purple-100 flex items-center gap-1">
            878 faculty members trained
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Colleges</p>
              <p className="text-3xl font-bold">1,658</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
          <p className="text-sm text-green-100 flex items-center gap-1">
            Across 354 districts
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Learner Distribution: Faculty vs Students
          </h2>
          <ReactApexChart
            options={learnerDistribution.options}
            series={learnerDistribution.series}
            type="donut"
            height={320}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Top Programs Comparison
          </h2>
          <ReactApexChart
            options={topProgramsComparison.options}
            series={topProgramsComparison.series}
            type="bar"
            height={320}
          />
        </div>
      </div>

      {/* Activities + Top Performing Courses */}
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

        {/* Top Performing Courses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Top Performing Courses
            </h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
              View All <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {topPerformingCourses.map((course) => (
              <div
                key={course.rank}
                className="bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm text-white shadow-md flex-shrink-0 ${
                        course.rank === 1
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                          : course.rank === 2
                          ? "bg-gradient-to-br from-gray-400 to-gray-600"
                          : course.rank === 3
                          ? "bg-gradient-to-br from-orange-400 to-orange-600"
                          : "bg-gradient-to-br from-blue-400 to-blue-600"
                      }`}
                    >
                      #{course.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm">
                        {course.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {course.programs} programs • {course.colleges} colleges
                      </p>
                    </div>
                  </div>
                  <Trophy className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-2" />
                </div>

                <div className="space-y-2">
                  {/* Learner Count */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-600">
                        Total Learners
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getPerformanceBadgeColor(
                          course.learners
                        )}`}
                      >
                        {course.learners.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((course.learners / 15000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics Section (Real Data) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">89.6%</p>
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-xl mb-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">188</p>
            <p className="text-sm font-medium text-gray-600">Universities Reached</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">354</p>
            <p className="text-sm font-medium text-gray-600">Districts Covered</p>
          </div>
          <div className="text-center p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-600 rounded-xl mb-3">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">43</p>
            <p className="text-sm font-medium text-gray-600">Completed Programs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityDashboard;