import React from "react";
import { CalendarIcon, ClockIcon, CheckCircleIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

interface Props {
  total: number;
  upcoming: number;
  completed: number;
  today: number;
}

export const EventStatsCards: React.FC<Props> = ({ total, upcoming, completed, today }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
          <CalendarIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Upcoming</p>
          <p className="text-2xl font-bold text-gray-900">{upcoming}</p>
        </div>
        <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
          <ClockIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</p>
          <p className="text-2xl font-bold text-gray-900">{completed}</p>
        </div>
        <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
          <CheckCircleIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Today</p>
          <p className="text-2xl font-bold text-gray-900">{today}</p>
        </div>
        <div className="p-3 rounded-xl border bg-orange-50 text-orange-600 border-orange-200">
          <CalendarDaysIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  </div>
);
