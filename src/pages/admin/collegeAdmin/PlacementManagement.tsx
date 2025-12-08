import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle,
} from "lucide-react";

const PlacementManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("companies");

  const tabs = [
    { id: "companies", label: "Company Registration" },
    { id: "jobs", label: "Job Postings" },
    { id: "analytics", label: "Placement Analytics" },
  ];

  // Sample data
  const placementStats = [
    { label: "Total Companies", value: "87", icon: Building2, color: "bg-blue-500" },
    { label: "Active Job Postings", value: "34", icon: Briefcase, color: "bg-purple-500" },
    { label: "Students Placed", value: "1,245", icon: Users, color: "bg-green-500" },
    { label: "Placement Rate", value: "87.3%", icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Placement Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage company registrations, job postings, and placement analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placementStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "companies" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Company Registration</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Add Company
              </button>
            </div>
            <p className="text-gray-600 mb-4">Manage company profiles, MoU/JD uploads, and status management.</p>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Job Posting & Application Tracking</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create Job Posting
              </button>
            </div>
            <p className="text-gray-600">Manage job roles, eligibility rules, rounds scheduling, student allocation, and application stage updates.</p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Placement Analytics</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
            <p className="text-gray-600">View offers per department, CTC analysis, internship to job ratio, and apply filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacementManagement;
