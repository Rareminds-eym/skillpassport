import React from "react";
import { ChartBarIcon, UsersIcon, CalendarDaysIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { EventAnalytics } from "../hooks/useEventAnalytics";

interface Props {
  analytics: EventAnalytics;
}

export const AnalyticsTab: React.FC<Props> = ({ analytics }) => {
  const maxMonthCount = Math.max(...analytics.eventsByMonth.map((m) => m.count), 1);
  const maxRegCount = Math.max(...analytics.registrationStats.map((r) => r.registered), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
              <p className="text-sm text-gray-500">Total Events</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRegistrations}</p>
              <p className="text-sm text-gray-500">Total Registrations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.avgRegistrationsPerEvent}</p>
              <p className="text-sm text-gray-500">Avg per Event</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics.eventsByStatus.find(s => s.status === "completed")?.count || 0}</p>
              <p className="text-sm text-gray-500">Completed Events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Month Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Events by Month (Last 6 Months)</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {analytics.eventsByMonth.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <span className="text-sm font-medium text-gray-700 mb-1">{item.count}</span>
                  <div
                    className="w-full max-w-[40px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all"
                    style={{ height: `${(item.count / maxMonthCount) * 100}%`, minHeight: item.count > 0 ? "8px" : "0" }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events by Type - Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Events by Type</h3>
          {analytics.eventsByType.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">No data</div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Simple Pie representation */}
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = analytics.eventsByType.reduce((sum, t) => sum + t.count, 0);
                    let cumulative = 0;
                    return analytics.eventsByType.map((item, idx) => {
                      const percentage = (item.count / total) * 100;
                      const dashArray = `${percentage} ${100 - percentage}`;
                      const dashOffset = -cumulative;
                      cumulative += percentage;
                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="20"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          className="transition-all"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{analytics.totalEvents}</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {analytics.eventsByType.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Events by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Events by Status</h3>
          <div className="space-y-3">
            {analytics.eventsByStatus.map((item, idx) => {
              const percentage = analytics.totalEvents > 0 ? (item.count / analytics.totalEvents) * 100 : 0;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 capitalize">{item.status}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Events by Registration */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Events by Registration</h3>
          {analytics.registrationStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">No registrations yet</div>
          ) : (
            <div className="space-y-3">
              {analytics.registrationStats.slice(0, 5).map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{item.eventTitle}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.registered}{item.capacity > 0 && `/${item.capacity}`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${(item.registered / maxRegCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
