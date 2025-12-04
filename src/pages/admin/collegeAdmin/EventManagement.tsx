import React, { useState } from "react";
import {
  Calendar,
  Bell,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
} from "lucide-react";

const EventManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("events");

  const tabs = [
    { id: "events", label: "Event Scheduling" },
    { id: "circulars", label: "Circulars & Notifications" },
    { id: "mentors", label: "Mentor Allocation" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Event Management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage events, circulars, notifications, and mentor allocations
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "events" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Event Scheduling</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </div>
            <p className="text-gray-600 mb-4">Create events, manage calendar, and venue management.</p>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Annual Sports Day</h3>
                    <p className="text-sm text-gray-600 mt-1">December 15, 2025 • Main Ground</p>
                    <span className="inline-block mt-2 text-xs font-medium px-2 py-1 bg-green-100 text-green-600 rounded-full">
                      Upcoming
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Tech Symposium 2025</h3>
                    <p className="text-sm text-gray-600 mt-1">December 20, 2025 • Auditorium</p>
                    <span className="inline-block mt-2 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                      Planned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "circulars" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Circulars & Notifications</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Create Circular
              </button>
            </div>
            <p className="text-gray-600">Manage title, audience, priority, publish/expire dates, attachments, and mark-as-read status.</p>
          </div>
        )}

        {activeTab === "mentors" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mentor Allocation & Results</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="h-4 w-4" />
                Allocate Mentor
              </button>
            </div>
            <p className="text-gray-600">Manage mentor to student mapping, mentor notes, and intervention outcomes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;
