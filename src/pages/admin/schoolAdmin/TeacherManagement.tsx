import React, { useState } from "react";
import { Users, UserPlus, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import TeacherOnboarding from "./components/TeacherOnboarding";
import TimetableAllocation from "./components/TimetableAllocation";
import TeacherList from "./components/TeacherList";

const TeacherManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"list" | "onboarding" | "timetable">("list");

  const tabs = [
    { id: "list", label: "Teachers", icon: Users },
    { id: "onboarding", label: "Onboarding", icon: UserPlus },
    { id: "timetable", label: "Timetable", icon: Calendar },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Teacher Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage teacher onboarding, subject mappings, and timetable allocation
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {activeTab === "list" && <TeacherList />}
        {activeTab === "onboarding" && <TeacherOnboarding />}
        {activeTab === "timetable" && <TimetableAllocation />}
      </div>
    </div>
  );
};

export default TeacherManagement;
