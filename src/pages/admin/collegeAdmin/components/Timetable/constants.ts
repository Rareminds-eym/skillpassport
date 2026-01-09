import { TimePeriod } from "./types";

// Faculty colors for visual distinction
export const FACULTY_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-900",
  "bg-purple-100 border-purple-300 text-purple-900",
  "bg-green-100 border-green-300 text-green-900",
  "bg-orange-100 border-orange-300 text-orange-900",
  "bg-pink-100 border-pink-300 text-pink-900",
  "bg-cyan-100 border-cyan-300 text-cyan-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-indigo-100 border-indigo-300 text-indigo-900",
];

// Default time periods
export const DEFAULT_PERIODS: TimePeriod[] = [
  { period_number: 1, period_name: "Period 1", start_time: "09:00", end_time: "09:50", is_break: false },
  { period_number: 2, period_name: "Period 2", start_time: "09:50", end_time: "10:40", is_break: false },
  { period_number: 3, period_name: "Short Break", start_time: "10:40", end_time: "10:55", is_break: true, break_type: "short" },
  { period_number: 4, period_name: "Period 3", start_time: "10:55", end_time: "11:45", is_break: false },
  { period_number: 5, period_name: "Period 4", start_time: "11:45", end_time: "12:35", is_break: false },
  { period_number: 6, period_name: "Lunch Break", start_time: "12:35", end_time: "13:20", is_break: true, break_type: "lunch" },
  { period_number: 7, period_name: "Period 5", start_time: "13:20", end_time: "14:10", is_break: false },
  { period_number: 8, period_name: "Period 6", start_time: "14:10", end_time: "15:00", is_break: false },
  { period_number: 9, period_name: "Period 7", start_time: "15:00", end_time: "15:50", is_break: false },
  { period_number: 10, period_name: "Period 8", start_time: "15:50", end_time: "16:40", is_break: false },
];

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Color mappings for break types
export const BREAK_BG_COLORS: Record<string, string> = {
  holiday: "bg-red-50",
  event: "bg-purple-50",
  exam: "bg-amber-50",
};

export const BREAK_TEXT_COLORS: Record<string, string> = {
  holiday: "text-red-600",
  event: "text-purple-600",
  exam: "text-amber-600",
};

export const BREAK_ICON_COLORS: Record<string, string> = {
  holiday: "text-red-400",
  event: "text-purple-400",
  exam: "text-amber-400",
};

export const BREAK_CARD_COLORS: Record<string, string> = {
  holiday: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  event: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
  exam: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
  lunch: "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100",
  short: "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100",
};

export const BREAK_TYPE_LABELS: Record<string, string> = {
  holiday: "Holiday",
  event: "Event",
  exam: "Exam",
  lunch: "Lunch",
  short: "Break",
};
