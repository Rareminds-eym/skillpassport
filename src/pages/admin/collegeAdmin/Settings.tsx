import React, { useState } from "react";
import { CogIcon, BellIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: CogIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "security", label: "Security", icon: ShieldCheckIcon },
    { id: "profile", label: "Profile", icon: UserCircleIcon },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your college admin settings</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "general" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option>2024-25</option>
                  <option>2025-26</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                <span className="ml-2 text-sm text-gray-700">SMS notifications</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Change Password
            </button>
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
