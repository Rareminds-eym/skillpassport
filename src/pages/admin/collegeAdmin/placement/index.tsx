import React, { useState } from "react";
import { Building2, Briefcase, Users, TrendingUp } from "lucide-react";
import CompanyRegistration from "./CompanyRegistration";
import JobPostings from "./JobPostings";
import ApplicationTracking from "./ApplicationTracking";
import PlacementAnalytics from "./PlacementAnalytics";

const PlacementManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("companies");

  const tabs = [
    { id: "companies", label: "Company Registration" },
    { id: "jobs", label: "Job Postings" },
    { id: "applications", label: "Application Tracking" },
    { id: "analytics", label: "Placement Analytics" },
  ];

  const placementStats = [
    { label: "Total Companies", value: "87", icon: Building2, color: "bg-blue-500" },
    { label: "Active Job Postings", value: "34", icon: Briefcase, color: "bg-purple-500" },
    { label: "Students Placed", value: "1,245", icon: Users, color: "bg-green-500" },
    { label: "Placement Rate", value: "87.3%", icon: TrendingUp, color: "bg-orange-500" },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case "companies":
        return <CompanyRegistration />;
      case "jobs":
        return <JobPostings />;
      case "applications":
        return <ApplicationTracking />;
      case "analytics":
        return <PlacementAnalytics />;
      default:
        return <CompanyRegistration />;
    }
  };

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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default PlacementManagement;