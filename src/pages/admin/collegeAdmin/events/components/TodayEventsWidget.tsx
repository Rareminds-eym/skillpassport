import React from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { CollegeEvent } from "../types";
import { formatTime, getEventTypeColor, getEventTypeIcon } from "../helpers";

interface Props {
  events: CollegeEvent[];
  onEventClick: (event: CollegeEvent) => void;
}

export const TodayEventsWidget: React.FC<Props> = ({ events, onEventClick }) => {
  if (events.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-amber-900">Today's Events ({events.length})</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="flex-shrink-0 bg-white rounded-lg border border-amber-200 p-3 cursor-pointer hover:shadow-md transition min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded ${getEventTypeColor(event.event_type)}`}>
                {getEventTypeIcon(event.event_type)}
              </div>
              <span className="font-medium text-gray-900 truncate">{event.title}</span>
            </div>
            <p className="text-xs text-gray-500">
              {formatTime(event.start_date)} - {formatTime(event.end_date)}
            </p>
            {event.venue && <p className="text-xs text-gray-400 truncate">{event.venue}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
