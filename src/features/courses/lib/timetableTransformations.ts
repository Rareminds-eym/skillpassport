/**
 * Timetable data transformation utilities
 */

export interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_number: number;
  subject_name?: string;
  class_name?: string;
  class_id?: string;
  educator_id?: string;
  is_recurring?: boolean;
  schedule_date?: string;
  [key: string]: any;
}

export interface Break {
  break_type: string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SLOT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-red-100 border-red-300 text-red-800',
];

/**
 * Get dates for a week starting from a given date
 */
export function getWeekDates(weekStart: Date): Date[] {
  return DAYS.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Check if a date is a holiday/break
 */
export function isHoliday(date: Date, breaks: Break[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.some(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
}

/**
 * Get break information for a specific date
 */
export function getBreakInfo(date: Date, breaks: Break[]): Break | undefined {
  const dateStr = date.toISOString().split("T")[0];
  return breaks.find(
    (b) =>
      (b.break_type === "holiday" || b.break_type === "event" || b.break_type === "exam") &&
      b.start_date &&
      b.end_date &&
      dateStr >= b.start_date &&
      dateStr <= b.end_date
  );
}

/**
 * Get color for a subject/slot based on name
 */
export function getSlotColor(subjectName: string): string {
  const hash = subjectName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return SLOT_COLORS[hash % SLOT_COLORS.length];
}

/**
 * Transform timetable slots with class names
 */
export function transformSlotsWithClassNames(
  slots: any[],
  classKey: string = 'college_classes'
): TimetableSlot[] {
  return (slots || []).map((slot: any) => ({
    ...slot,
    class_name: slot[classKey]?.name || "N/A",
  }));
}

/**
 * Transform school timetable slots with grade/section
 */
export function transformSchoolSlots(slots: any[]): TimetableSlot[] {
  return (slots || []).map((slot: any) => ({
    ...slot,
    class_name: slot.school_classes?.name || 
      (slot.school_classes?.grade && slot.school_classes?.section 
        ? `${slot.school_classes.grade}-${slot.school_classes.section}` 
        : "N/A"),
  }));
}

/**
 * Filter slots by class
 */
export function filterSlotsByClass(
  slots: TimetableSlot[],
  classId: string | null
): TimetableSlot[] {
  if (!classId) return slots;
  return slots.filter(s => s.class_id === classId);
}

/**
 * Find slot for specific day and period
 */
export function findSlotForDayPeriod(
  slots: TimetableSlot[],
  dayOfWeek: number,
  periodNum: number,
  dateStr?: string
): TimetableSlot | undefined {
  // Check for date-specific slot first
  if (dateStr) {
    const dateSpecificSlot = slots.find(
      s => s.period_number === periodNum && !s.is_recurring && s.schedule_date === dateStr
    );
    if (dateSpecificSlot) return dateSpecificSlot;
  }
  
  // Then check for recurring slot
  return slots.find(
    s => s.day_of_week === dayOfWeek && s.period_number === periodNum && s.is_recurring !== false
  );
}

/**
 * Calculate timetable statistics
 */
export function calculateTimetableStats(slots: TimetableSlot[]): {
  totalPeriods: number;
  todayPeriods: number;
  uniqueClasses: number;
} {
  const today = new Date().getDay() || 7;
  
  return {
    totalPeriods: slots.length,
    todayPeriods: slots.filter(s => s.day_of_week === today).length,
    uniqueClasses: new Set(slots.map(s => s.class_id)).size,
  };
}

/**
 * Extract class IDs from assignments
 */
export function extractClassIds(assignments: Array<{ class_id: string }>): string[] {
  return assignments.map(a => a.class_id);
}

/**
 * Transform class data for display
 */
export function transformClassesForDisplay(
  classData: Array<{ id: string; name: string; grade?: string; section?: string }>
): { names: string[]; classes: typeof classData } {
  return {
    names: classData.map(c => c.name),
    classes: classData,
  };
}
