import React, { useState } from "react";
import { CalendarIcon, PlusCircleIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface CalendarEvent {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
}

const AcademicCalendar: React.FC = () => {
  const [events] = useState<CalendarEvent[]>([
    { id: 1, title: "Semester 1", type: "Term", startDate: "2025-01-01", endDate: "2025-05-31" },
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Academic Calendar</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage academic year, terms, holidays, and exam windows</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Calendar Events</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <PlusCircleIcon className="h-5 w-5" />
            Add Event
          </button>
        </div>

        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.type}</p>
                  <p className="text-sm text-gray-500">{event.startDate} to {event.endDate}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
