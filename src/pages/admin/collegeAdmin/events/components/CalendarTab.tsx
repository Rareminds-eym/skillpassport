import React from "react";
import { ChevronLeftIcon, ChevronRightIcon, Squares2X2Icon, ListBulletIcon, CalendarDaysIcon, XMarkIcon, MapPinIcon, ClockIcon, UsersIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { CollegeEvent, CalendarDay, CalendarView, WeekEvent } from "../types";
import { monthNames, dayNamesShort, getEventBarBg, getStatusStyle, getEventTypeColor, getEventTypeIcon, formatDate, formatTime, toDateStr } from "../helpers";

interface Props {
  calendarDate: Date;
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;
  weeks: CalendarDay[][];
  weekDays: Date[];
  getWeekEvents: (week: CalendarDay[]) => WeekEvent[];
  eventRegCounts: Record<string, number>;
  selectedEvent: CollegeEvent | null;
  onSelectEvent: (event: CollegeEvent | null) => void;
  onQuickAdd: (date: Date) => void;
  onEditEvent: (event: CollegeEvent) => void;
  onDragStart: (event: CollegeEvent) => void;
  onDrop: (date: Date) => void;
  draggedEvent: CollegeEvent | null;
  prevMonth: () => void;
  nextMonth: () => void;
  prevWeek: () => void;
  nextWeek: () => void;
  prevDay: () => void;
  nextDay: () => void;
  goToToday: () => void;
  isToday: (date: Date) => boolean;
  events: CollegeEvent[];
}

export const CalendarTab: React.FC<Props> = ({
  calendarDate, calendarView, setCalendarView, weeks, weekDays, getWeekEvents, eventRegCounts,
  selectedEvent, onSelectEvent, onQuickAdd, onEditEvent, onDragStart, onDrop, draggedEvent,
  prevMonth, nextMonth, prevWeek, nextWeek, prevDay, nextDay, goToToday, isToday, events,
}) => {
  const handlePrev = () => calendarView === "month" ? prevMonth() : calendarView === "week" ? prevWeek() : prevDay();
  const handleNext = () => calendarView === "month" ? nextMonth() : calendarView === "week" ? nextWeek() : nextDay();

  const getTitle = () => {
    if (calendarView === "day") return calendarDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (calendarView === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
  };

  // Get events for a specific day (for day view)
  const getDayEvents = () => {
    const dayStr = toDateStr(calendarDate);
    return events.filter((e) => e.start_date.split("T")[0] <= dayStr && e.end_date.split("T")[0] >= dayStr);
  };


  return (
    <div className="flex gap-6">
      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeftIcon className="h-5 w-5" /></button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">{getTitle()}</h2>
            <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRightIcon className="h-5 w-5" /></button>
            <button onClick={goToToday} className="ml-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">Today</button>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setCalendarView("month")} className={`p-2 rounded ${calendarView === "month" ? "bg-white shadow" : "hover:bg-gray-200"}`} title="Month"><Squares2X2Icon className="h-4 w-4" /></button>
            <button onClick={() => setCalendarView("week")} className={`p-2 rounded ${calendarView === "week" ? "bg-white shadow" : "hover:bg-gray-200"}`} title="Week"><ListBulletIcon className="h-4 w-4" /></button>
            <button onClick={() => setCalendarView("day")} className={`p-2 rounded ${calendarView === "day" ? "bg-white shadow" : "hover:bg-gray-200"}`} title="Day"><CalendarDaysIcon className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Month View */}
        {calendarView === "month" && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {dayNamesShort.map((day) => (
                <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">{day}</div>
              ))}
              {weeks.map((week, weekIdx) => {
                const weekEvents = getWeekEvents(week);
                return (
                  <React.Fragment key={weekIdx}>
                    {week.map((dayInfo, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`bg-white min-h-[100px] p-1 relative flex flex-col ${!dayInfo.isCurrentMonth ? "bg-gray-50" : ""} ${draggedEvent ? "cursor-copy" : "cursor-pointer"}`}
                        onClick={() => !draggedEvent && onQuickAdd(dayInfo.date)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(dayInfo.date)}
                      >
                        {/* Date number at top */}
                        <div className="mb-1">
                          {isToday(dayInfo.date) ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-semibold">{dayInfo.day}</span>
                          ) : (
                            <span className={`text-sm ${!dayInfo.isCurrentMonth ? "text-gray-400" : "text-gray-900"}`}>{dayInfo.day}</span>
                          )}
                        </div>
                        {/* Events centered in remaining space */}
                        <div className="flex-1 flex items-center">
                          {dayIdx === 0 && (
                            <div className="absolute left-0 right-0 space-y-0.5 z-10" style={{ top: "50%", transform: "translateY(-50%)" }}>
                              {weekEvents.map(({ event, startCol, span, isEventStart, isEventEnd }) => (
                                startCol === 0 && (
                                  <div
                                    key={event.id}
                                    draggable
                                    onDragStart={() => onDragStart(event)}
                                    onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                                    className={`${getEventBarBg(event.event_type)} ${getStatusStyle(event.status)} text-white text-xs px-2 py-1.5 cursor-pointer hover:opacity-90 flex items-center justify-center ${isEventStart ? "rounded-l-md" : ""} ${isEventEnd ? "rounded-r-md" : ""}`}
                                    style={{ width: `calc(${span * 100}%)` }}
                                  >
                                    <span className="truncate">
                                      {isEventStart && event.title}
                                      {eventRegCounts[event.id] > 0 && isEventStart && <span className="ml-1 opacity-75">({eventRegCounts[event.id]}{event.capacity ? `/${event.capacity}` : ""})</span>}
                                    </span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          {dayIdx > 0 && (
                            <div className="absolute left-0 right-0 space-y-0.5 z-10" style={{ top: "50%", transform: "translateY(-50%)" }}>
                              {weekEvents.filter(({ startCol }) => startCol === dayIdx).map(({ event, span, isEventStart, isEventEnd }) => (
                                <div
                                  key={event.id}
                                  draggable
                                  onDragStart={() => onDragStart(event)}
                                  onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                                  className={`${getEventBarBg(event.event_type)} ${getStatusStyle(event.status)} text-white text-xs px-2 py-1.5 cursor-pointer hover:opacity-90 flex items-center justify-center ${isEventStart ? "rounded-l-md" : ""} ${isEventEnd ? "rounded-r-md" : ""}`}
                                  style={{ width: `calc(${span * 100}%)` }}
                                >
                                  <span className="truncate">
                                    {isEventStart && event.title}
                                    {eventRegCounts[event.id] > 0 && isEventStart && <span className="ml-1 opacity-75">({eventRegCounts[event.id]})</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}


        {/* Week View */}
        {calendarView === "week" && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {weekDays.map((date, idx) => (
                <div key={idx} className="bg-gray-50 p-2 text-center">
                  <div className="text-xs font-medium text-gray-500">{dayNamesShort[idx]}</div>
                  {isToday(date) ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-lg font-semibold mx-auto">{date.getDate()}</span>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">{date.getDate()}</div>
                  )}
                </div>
              ))}
              {weekDays.map((date, idx) => {
                const dayStr = toDateStr(date);
                const dayEvents = events.filter((e) => e.start_date.split("T")[0] <= dayStr && e.end_date.split("T")[0] >= dayStr);
                return (
                  <div
                    key={idx}
                    className={`bg-white min-h-[200px] p-2 ${isToday(date) ? "ring-2 ring-blue-500 ring-inset" : ""} ${draggedEvent ? "cursor-copy" : "cursor-pointer"}`}
                    onClick={() => !draggedEvent && onQuickAdd(date)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(date)}
                  >
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          draggable
                          onDragStart={() => onDragStart(event)}
                          onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                          className={`${getEventBarBg(event.event_type)} ${getStatusStyle(event.status)} text-white text-xs p-1.5 rounded cursor-pointer hover:opacity-90`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-75">{formatTime(event.start_date)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {calendarView === "day" && (
          <div className="p-4">
            <div className="space-y-2">
              {getDayEvents().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No events scheduled for this day</p>
                  <button onClick={() => onQuickAdd(calendarDate)} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add Event</button>
                </div>
              ) : (
                getDayEvents().map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition ${getEventTypeColor(event.event_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">{getEventTypeIcon(event.event_type)}</div>
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm opacity-75">{formatTime(event.start_date)} - {formatTime(event.end_date)}</p>
                        </div>
                      </div>
                      {eventRegCounts[event.id] > 0 && (
                        <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">{eventRegCounts[event.id]} registered</span>
                      )}
                    </div>
                    {event.venue && <p className="mt-2 text-sm flex items-center gap-1"><MapPinIcon className="h-4 w-4" />{event.venue}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>


      {/* Event Detail Panel */}
      {selectedEvent && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Event Details</h3>
            <button onClick={() => onSelectEvent(null)} className="p-1 hover:bg-gray-100 rounded"><XMarkIcon className="h-5 w-5" /></button>
          </div>
          <div className={`p-3 rounded-lg mb-4 ${getEventTypeColor(selectedEvent.event_type)}`}>
            <div className="flex items-center gap-2">
              {getEventTypeIcon(selectedEvent.event_type)}
              <span className="font-medium capitalize">{selectedEvent.event_type.replace("_", " ")}</span>
            </div>
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedEvent.title}</h4>
          {selectedEvent.description && <p className="text-sm text-gray-600 mb-4">{selectedEvent.description}</p>}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>{formatDate(selectedEvent.start_date)} - {formatDate(selectedEvent.end_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>{formatTime(selectedEvent.start_date)} - {formatTime(selectedEvent.end_date)}</span>
            </div>
            {selectedEvent.venue && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="h-4 w-4" />
                <span>{selectedEvent.venue}</span>
              </div>
            )}
            {selectedEvent.capacity && (
              <div className="flex items-center gap-2 text-gray-600">
                <UsersIcon className="h-4 w-4" />
                <span>{eventRegCounts[selectedEvent.id] || 0} / {selectedEvent.capacity} registered</span>
              </div>
            )}
          </div>
          <button onClick={() => onEditEvent(selectedEvent)} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <PencilSquareIcon className="h-4 w-4" />Edit Event
          </button>
        </div>
      )}
    </div>
  );
};
