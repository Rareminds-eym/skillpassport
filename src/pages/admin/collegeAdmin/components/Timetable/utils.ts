import { Faculty, CollegeClass, Break, ScheduleSlot } from "./types";
import { FACULTY_COLORS } from "./constants";

// Get faculty color based on index
export const getFacultyColor = (facultyId: string, faculty: Faculty[]) => {
  const index = faculty.findIndex((f) => f.id === facultyId);
  return FACULTY_COLORS[index % FACULTY_COLORS.length];
};

// Get faculty name by ID
export const getFacultyName = (id: string, faculty: Faculty[]) => {
  const f = faculty.find((f) => f.id === id);
  return f ? `${f.first_name} ${f.last_name}` : "";
};

// Get class name by ID
export const getClassName = (id: string, classes: CollegeClass[]) => {
  const c = classes.find((c) => c.id === id);
  return c ? `${c.grade}-${c.section}` : "";
};

// Get subjects for a faculty
export const getSubjectsForFaculty = (facultyId: string, faculty: Faculty[]): string[] => {
  const f = faculty.find((f) => f.id === facultyId);
  if (f?.subject_expertise && Array.isArray(f.subject_expertise)) {
    return f.subject_expertise.map((s) => s.name).filter(Boolean);
  }
  return [];
};

// Format date for display
export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Check if date is a holiday/event/exam
export const isHoliday = (date: Date, breaks: Break[]) => {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.some(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
};

// Get holiday/event/exam info for a date
export const getBreakInfo = (date: Date, breaks: Break[]) => {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.find(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
};

// Get holiday name
export const getHolidayName = (date: Date, breaks: Break[]) => {
  const breakInfo = getBreakInfo(date, breaks);
  return breakInfo?.name || "";
};

// Get break type for styling
export const getBreakType = (date: Date, breaks: Break[]) => {
  const breakInfo = getBreakInfo(date, breaks);
  return breakInfo?.break_type || "holiday";
};

// Get slot for cell - considers both recurring and date-specific slots
export const getSlotForCell = (
  dayIndex: number,
  periodNum: number,
  date: Date,
  slots: ScheduleSlot[],
  selectedClassFilter: string,
  selectedFacultyFilter: string
) => {
  const dateStr = date.toISOString().split("T")[0];
  const dayOfWeek = dayIndex + 1;

  // Filter slots by class if class filter is applied
  const filteredSlots = selectedClassFilter
    ? slots.filter((s) => s.class_id === selectedClassFilter)
    : slots;

  // Also filter by faculty if faculty filter is applied
  const doubleFilteredSlots = selectedFacultyFilter
    ? filteredSlots.filter((s) => s.educator_id === selectedFacultyFilter)
    : filteredSlots;

  // First, check for a date-specific (non-recurring) slot - higher priority
  const dateSpecificSlot = doubleFilteredSlots.find(
    (s) =>
      s.period_number === periodNum &&
      !s.is_recurring &&
      s.schedule_date === dateStr
  );
  if (dateSpecificSlot) return dateSpecificSlot;

  // Then, check for a recurring slot matching day_of_week
  const recurringSlot = doubleFilteredSlots.find(
    (s) =>
      s.day_of_week === dayOfWeek &&
      s.period_number === periodNum &&
      s.is_recurring === true
  );
  return recurringSlot || null;
};

// Check for overlapping breaks
export const checkDateOverlap = (
  startDate: string,
  endDate: string,
  breaks: Break[],
  editingBreakId: string | null
): string => {
  if (!startDate || !endDate) {
    return "";
  }

  const overlappingBreak = breaks.find((b) => {
    // Skip the break being edited
    if (editingBreakId && b.id === editingBreakId) return false;
    if (!b.start_date || !b.end_date) return false;
    // Check if date ranges overlap: start1 <= end2 AND end1 >= start2
    return startDate <= b.end_date && endDate >= b.start_date;
  });

  if (overlappingBreak) {
    return `Date range overlaps with existing ${overlappingBreak.break_type}: "${overlappingBreak.name}" (${overlappingBreak.start_date} to ${overlappingBreak.end_date})`;
  }
  return "";
};

// Get week start date (Monday)
export const getWeekStart = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Get week dates array
export const getWeekDates = (weekStart: Date, days: string[]) => {
  return days.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
};
