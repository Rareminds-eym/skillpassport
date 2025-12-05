import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Download,
  Filter,
  Calendar,
} from "lucide-react";

const ReportsAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState("attendance");

  const tabs = [
    { id: "attendance", label: "Attendance Dashboard" },
    { id: "grades", label: "Grades & Performance" },
    { id: "placement", label: "Placement Overview" },
  ];

  // Sample chart data
  const attendanceChart = {
    series: [{
      name: "Attendance %",
      data: [92, 88, 95, 90, 87, 93, 91]
    }],
    options: {
      chart: { type: "line", toolbar: { show: false } },
      stroke: { curve: "smooth", width: 3 },
      colors: ["#3b82f6"],
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      yaxis: {
        min: 80,
        max: 100,
      },
    },
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          View comprehensive reports on attendance, grades, and placements
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attendance Dashboard</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-blue-600 text-sm font-medium mb-1">Overall Attendance</p>
                <p className="text-3xl font-bold text-blue-900">92.4%</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-green-600 text-sm font-medium mb-1">Present Today</p>
                <p className="text-3xl font-bold text-green-900">45,087</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-red-600 text-sm font-medium mb-1">Below Threshold</p>
                <p className="text-3xl font-bold text-red-900">127</p>
              </div>
            </div>

            <ReactApexChart
              options={attendanceChart.options}
              series={attendanceChart.series}
              type="line"
              height={300}
            />
          </div>
        </div>
      )}

      {activeTab === "grades" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Grades & Performance</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
          <p className="text-gray-600">View subject/course-wise performance, term/IA/final grades, and progress charts.</p>
        </div>
      )}

      {activeTab === "placement" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Placement Overview</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
          <p className="text-gray-600">View placed students, offers, industry trends, and export data.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
