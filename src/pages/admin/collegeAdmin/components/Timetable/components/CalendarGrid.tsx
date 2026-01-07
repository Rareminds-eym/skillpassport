import React from "react";
import { Coffee, Sun, Plus, Users, MapPin, UserCheck } from "lucide-react";
import { Faculty, CollegeClass, ScheduleSlot, Break, TimePeriod, Substitution } from "../types";
import { DAYS, BREAK_BG_COLORS, BREAK_TEXT_COLORS, BREAK_ICON_COLORS } from "../constants";
import {
  formatDate,
  isHoliday,
  getBreakType,
  getHolidayName,
  getSlotForCell,
  getFacultyColor,
  getFacultyName,
  getClassName,
} from "../utils";

interface CalendarGridProps {
  weekDates: Date[];
  periods: TimePeriod[];
  slots: ScheduleSlot[];
  breaks: Break[];
  substitutions: Substitution[];
  faculty: Faculty[];
  classes: CollegeClass[];
  selectedFacultyFilter: string;
  selectedClassFilter: string;
  onCellClick: (dayIndex: number, period: TimePeriod, date: Date) => void;
}

// Helper to find substitution for a specific date and period
const getSubstitutionForCell = (
  date: Date,
  periodNumber: number,
  classId: string,
  substitutions: Substitution[]
): Substitution | null => {
  const dateStr = date.toISOString().split('T')[0];
  return substitutions.find(
    s => s.substitution_date === dateStr && 
         s.period_number === periodNumber && 
         s.class_id === classId &&
         s.substitute_faculty_id // Only show if substitute is assigned
  ) || null;
};

const CalendarGrid: React.FC<CalendarGridProps> = ({
  weekDates,
  periods,
  slots,
  breaks,
  substitutions,
  faculty,
  classes,
  selectedFacultyFilter,
  selectedClassFilter,
  onCellClick,
}) => {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-w-[900px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 border-b border-r border-gray-200">
                Time
              </th>
              {DAYS.map((day, index) => {
                const date = weekDates[index];
                const holiday = isHoliday(date, breaks);
                const breakType = getBreakType(date, breaks);
                const headerBgColor = BREAK_BG_COLORS[breakType] || "bg-red-50";
                const headerTextColor = BREAK_TEXT_COLORS[breakType] || "text-red-600";
                return (
                  <th
                    key={day}
                    className={`px-3 py-3 text-center border-b border-r border-gray-200 last:border-r-0 ${
                      holiday ? headerBgColor : ""
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-900">{day}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        holiday ? `${headerTextColor} font-medium` : "text-gray-500"
                      }`}
                    >
                      {formatDate(date)}
                      {holiday && (
                        <span className="block text-[10px]">{getHolidayName(date, breaks)}</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.period_number} className={period.is_break ? "bg-gray-100" : ""}>
                <td className="px-3 py-2 border-b border-r border-gray-200 bg-gray-50">
                  <div className="text-xs font-medium text-gray-900">{period.period_name}</div>
                  <div className="text-[10px] text-gray-500">
                    {period.start_time} - {period.end_time}
                  </div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const date = weekDates[dayIndex];
                  const holiday = isHoliday(date, breaks);
                  const breakType = getBreakType(date, breaks);

                  if (holiday) {
                    const cellBgColor = BREAK_BG_COLORS[breakType] || "bg-red-50";
                    const iconColor = BREAK_ICON_COLORS[breakType] || "text-red-400";
                    return (
                      <td
                        key={dayIndex}
                        className={`px-2 py-2 border-b border-r border-gray-200 last:border-r-0 ${cellBgColor}`}
                      >
                        <div className="h-14 flex items-center justify-center">
                          <Sun className={`h-4 w-4 ${iconColor}`} />
                        </div>
                      </td>
                    );
                  }

                  if (period.is_break) {
                    return (
                      <td
                        key={dayIndex}
                        className="px-2 py-2 border-b border-r border-gray-200 last:border-r-0"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 2px, #f3f4f6 2px, #f3f4f6 4px)",
                        }}
                      >
                        <div className="h-10 flex items-center justify-center">
                          <Coffee className="h-4 w-4 text-gray-400" />
                        </div>
                      </td>
                    );
                  }

                  // Get slot considering recurring vs date-specific
                  const slot = getSlotForCell(
                    dayIndex,
                    period.period_number,
                    date,
                    slots,
                    selectedClassFilter,
                    selectedFacultyFilter
                  );
                  // Apply filters
                  const filteredSlot =
                    slot &&
                    (!selectedFacultyFilter || slot.educator_id === selectedFacultyFilter) &&
                    (!selectedClassFilter || slot.class_id === selectedClassFilter)
                      ? slot
                      : null;

                  // Check for substitution on this date/period/class
                  const substitution = filteredSlot 
                    ? getSubstitutionForCell(date, period.period_number, filteredSlot.class_id, substitutions)
                    : null;

                  // Check if this is a substitution
                  const isSubstitute = !!substitution;

                  return (
                    <td
                      key={dayIndex}
                      className={`px-2 py-2 border-b border-r border-gray-200 last:border-r-0 cursor-pointer transition ${
                        filteredSlot ? "" : "bg-green-50 hover:bg-green-100"
                      }`}
                      onClick={() => onCellClick(dayIndex, period, date)}
                    >
                      {filteredSlot ? (
                        <div
                          className={`p-2 rounded-lg border text-xs h-14 overflow-hidden relative ${
                            isSubstitute 
                              ? 'bg-amber-50 border-amber-300' 
                              : getFacultyColor(filteredSlot.educator_id, faculty)
                          }`}
                        >
                          {isSubstitute && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] px-1 rounded-full flex items-center gap-0.5">
                              <UserCheck className="h-2 w-2" />
                              Sub
                            </div>
                          )}
                          <div className="font-semibold truncate">{filteredSlot.subject_name}</div>
                          <div className={`truncate ${isSubstitute ? 'text-amber-700' : 'opacity-80'}`}>
                            {isSubstitute 
                              ? substitution.substitute_faculty_name
                              : getFacultyName(filteredSlot.educator_id, faculty)
                            }
                          </div>
                          {isSubstitute && (
                            <div className="text-[9px] text-amber-600 truncate">
                              (for {substitution.original_faculty_name?.split(' ')[0]})
                            </div>
                          )}
                          {!isSubstitute && (
                            <div className="flex items-center gap-1 text-[10px] opacity-70">
                              <Users className="h-3 w-3" />
                              {getClassName(filteredSlot.class_id, classes)}
                              <MapPin className="h-3 w-3 ml-1" />
                              {filteredSlot.room_number}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-14 flex items-center justify-center text-green-500 hover:text-green-600">
                          <Plus className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalendarGrid;
