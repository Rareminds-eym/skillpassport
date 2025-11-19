import React from "react";
import ReactApexChart from "react-apexcharts";
import {
  GraduationCap,
  TrendingUp,
  ChevronRight,
  Clock,
  UserPlus,
  BookOpen,
} from "lucide-react";
import KPICard from "../../../components/admin/KPICard";
import { BanknotesIcon, BuildingOfficeIcon, MapPinIcon } from "@heroicons/react/24/outline";

const SchoolDashboard: React.FC = () => {
  // ===== KPI Cards Based on School Programs Data =====
  const kpiData = [
    {
      title: "Total Students",
      value: "4,670",
      change: 15.3,
      changeLabel: "school programs",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Schools Covered",
      value: "240",
      change: 8.2,
      changeLabel: "active schools",
      icon: <BuildingOfficeIcon className="h-6 w-6" />,
      color: "purple" as const,
    },
    {
      title: "Districts Reached",
      value: "66",
      change: 22.1,
      changeLabel: "coverage growth",
      icon: <MapPinIcon className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Training Hours",
      value: "180",
      change: 12.5,
      changeLabel: "total delivered",
      icon: <Clock className="h-6 w-6" />,
      color: "yellow" as const,
    },
  ];

  // ===== Chart Data - School Programs Distribution =====
  const programDistribution = {
    series: [
      {
        name: "Students",
        data: [1570, 76, 2840, 184]
      }
    ],
    options: {
      chart: { type: "bar", toolbar: { show: false }, height: 250 },
      plotOptions: {
        bar: { horizontal: true, borderRadius: 6, dataLabels: { position: "center" } },
      },
      colors: ["#3b82f6"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toLocaleString(),
        style: { fontSize: "11px", colors: ["#fff"] },
      },
      xaxis: {
        categories: [
          "Agri & Food (Batch 1 - June)",
          "Cloud Kitchen (Batch 1 - June)",
          "Agri & Food (Batch 2 - June 21–28)",
          "Cloud Kitchen SDP (Batch 2 - June 21–28)",
        ],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        labels: {
          style: { colors: "#6b7280", fontSize: "11px" },
        },
      },
      tooltip: { theme: "light" },
      grid: { borderColor: "#f1f5f9" },
    },
  };


  const districtsProgress = {
    series: [
      {
        name: "Districts Coverage",
        data: [31, 1, 33, 1],
      },
    ],
    options: {
      chart: { type: "area", toolbar: { show: false }, height: 250 },
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 },
      },
      colors: ["#8b5cf6"],
      dataLabels: { enabled: false },
      xaxis: {
        categories: [
          "Agri & Food (Batch 1)",
          "Cloud Kitchen (Batch 1)",
          "Agri & Food (Batch 2)",
          "Cloud Kitchen SDP (Batch 2)",
        ],
        labels: { style: { colors: "#6b7280" } },
      },
      yaxis: {
        title: { text: "Districts", style: { color: "#6b7280" } },
        labels: { style: { colors: "#6b7280" } },
      },
      tooltip: {
        theme: "light",
        y: { formatter: (val: number) => `${val} Districts` },
      },
      grid: { borderColor: "#f1f5f9" },
    },
  };


  const programOverview = [
    { program: "Agri & Food Processing", schools: 233, students: 4410, duration: "45 hours" },
    { program: "Cloud Kitchen", schools: 7, students: 260, duration: "45 hours" },
  ];


  const recentActivities = [
    {
      id: 1,
      title: "Agri & Food Processing – Completed",
      description: "233 schools completed training across 64 districts",
      time: "June 2024",
      type: "success",
      icon: GraduationCap,
    },
    {
      id: 2,
      title: "Cloud Kitchen – Completed",
      description: "7 schools trained across 2 districts",
      time: "June 2024",
      type: "info",
      icon: UserPlus,
    },
    {
      id: 3,
      title: "Students Trained",
      description: "4,670 school-level learners completed courses",
      time: "June 2024",
      type: "success",
      icon: BookOpen,
    },
    {
      id: 4,
      title: "District Coverage",
      description: "Training delivered across 66 districts",
      time: "June 2024",
      type: "warning",
      icon: MapPinIcon,
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

  {/* Agri & Food Processing */}
  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-100 text-sm mb-1">Agri & Food Processing</p>
        <p className="text-3xl font-bold">4,410</p>
      </div>
      <TrendingUp className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Students trained across 233 schools</p>
  </div>

  {/* Cloud Kitchen */}
  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-green-100 text-sm mb-1">Cloud Kitchen</p>
        <p className="text-3xl font-bold">260</p>
      </div>
      <BanknotesIcon className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Students trained across 7 schools</p>
  </div>

  {/* Overall District Coverage */}
  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-purple-100 text-sm mb-1">District Coverage</p>
        <p className="text-3xl font-bold">66</p>
      </div>
      <MapPinIcon className="h-7 w-7 opacity-90" />
    </div>
    <p className="text-sm mt-3">Programs delivered across Tamil Nadu</p>
  </div>

</div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            School Program Distribution
          </h2>
          <ReactApexChart
            options={programDistribution.options}
            series={programDistribution.series}
            type="bar"
            height={300}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            District Coverage by Program
          </h2>
          <ReactApexChart
            options={districtsProgress.options}
            series={districtsProgress.series}
            type="area"
            height={300}
          />
        </div>
      </div>

      {/* Activities + Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Program Status</h2>
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

        {/* Program Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
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
                className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl p-4 transition-all duration-200 border border-gray-100 hover:border-indigo-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{prog.program}</p>
                    <p className="text-xs text-gray-500">
                      {prog.schools} schools • {prog.students.toLocaleString()} students
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold px-3 py-1 rounded-full text-green-600 bg-green-100">
                    {prog.duration}
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