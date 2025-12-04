import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
} from "lucide-react";

const SkillDevelopment: React.FC = () => {
  const [activeTab, setActiveTab] = useState("courses");

  const tabs = [
    { id: "courses", label: "Skill Course Master" },
    { id: "allocation", label: "Skill Allocation" },
    { id: "progress", label: "Progress Tracker" },
    { id: "feedback", label: "Feedback & Certification" },
  ];

  // Sample data
  const skillStats = [
    { label: "Active Courses", value: "156", icon: BookOpen, color: "bg-blue-500" },
    { label: "Enrolled Students", value: "12,450", icon: Users, color: "bg-purple-500" },
    { label: "Completion Rate", value: "78.5%", icon: TrendingUp, color: "bg-green-500" },
    { label: "Certificates Issued", value: "9,780", icon: Award, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Training & Skill Development
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage skill courses, allocations, progress tracking, and certifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {skillStats.map((stat, index) => {
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
        {activeTab === "courses" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Skill Course Master</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Add Skill Course
              </button>
            </div>
            <p className="text-gray-600 mb-4">Manage skill course names, providers, and certification types.</p>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search skill courses..."
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

        {activeTab === "allocation" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Skill Allocation</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Allocate Course
              </button>
            </div>
            <p className="text-gray-600">Allocate courses to departments/programs, set as mandatory/elective, and manage student-wise allocation.</p>
          </div>
        )}

        {activeTab === "progress" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Progress Tracker</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
            <p className="text-gray-600">Track completion percentage, assessment scores, and attendance integration.</p>
          </div>
        )}

        {activeTab === "feedback" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Feedback & Certification</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Award className="h-4 w-4" />
                Generate Certificates
              </button>
            </div>
            <p className="text-gray-600">Collect student and trainer feedback, generate certificates, and batch downloads.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillDevelopment;
