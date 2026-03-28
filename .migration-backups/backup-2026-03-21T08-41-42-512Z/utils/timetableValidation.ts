// Timetable Assignment Validation Rules

export interface TimetableSlot {
  id?: string;
  educator_id: string;
  teacher_id: string;
  class_id?: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_number: string;
  teacher_name?: string;
}

export interface ValidationConflict {
  type: 'max_periods_per_day' | 'max_consecutive' | 'teacher_double_booking' | 'room_collision';
  message: string;
  severity: 'error' | 'warning';
  affectedSlots?: string[];
}

/**
 * Rule 1: Max 6 periods per day per teacher
 */
export const validateMaxPeriodsPerDay = (
  slots: TimetableSlot[],
  teacherId: string,
  day: number
): ValidationConflict | null => {
  const daySlots = slots.filter(
    // Fix: Check both educator_id and teacher_id for compatibility
    s => (s.teacher_id === teacherId || s.educator_id === teacherId) && s.day_of_week === day
  );
  
  if (daySlots.length > 6) {
    return {
      type: 'max_periods_per_day',
      message: `Teacher has ${daySlots.length} periods on this day. Maximum 6 allowed.`,
      severity: 'error',
      affectedSlots: daySlots.map(s => s.id).filter(Boolean) as string[]
    };
  }
  
  return null;
};

/**
 * Rule 2: Max 3 consecutive periods
 */
export const validateMaxConsecutivePeriods = (
  slots: TimetableSlot[],
  teacherId: string,
  day: number
): ValidationConflict | null => {
  const daySlots = slots
    // Fix: Check both educator_id and teacher_id for compatibility
    .filter(s => (s.teacher_id === teacherId || s.educator_id === teacherId) && s.day_of_week === day)
    .sort((a, b) => a.period_number - b.period_number);
  
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  for (let i = 1; i < daySlots.length; i++) {
    if (daySlots[i].period_number === daySlots[i - 1].period_number + 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  if (maxConsecutive > 3) {
    return {
      type: 'max_consecutive',
      message: `Teacher has ${maxConsecutive} consecutive periods. Maximum 3 allowed.`,
      severity: 'error'
    };
  }
  
  return null;
};

/**
 * Rule 3: No teacher double-booking (same teacher, same time)
 * This also prevents duplicate constraint violations in the database
 */
export const validateTeacherAvailability = (
  slots: TimetableSlot[],
  newSlot: TimetableSlot
): ValidationConflict | null => {
  const conflict = slots.find(
    s => s.id !== newSlot.id &&
         // Fix: Check both educator_id and teacher_id for compatibility
         (s.educator_id === newSlot.educator_id || s.teacher_id === newSlot.teacher_id) &&
         s.day_of_week === newSlot.day_of_week &&
         s.period_number === newSlot.period_number
  );
  
  if (conflict) {
    return {
      type: 'teacher_double_booking',
      message: `This teacher is already assigned to ${conflict.class_name} (${conflict.subject_name}) at this time slot. Please choose a different time or teacher.`,
      severity: 'error',
      affectedSlots: [conflict.id].filter(Boolean) as string[]
    };
  }
  
  return null;
};

/**
 * Rule 4: No room collision (same room, same time)
 */
export const validateRoomAvailability = (
  slots: TimetableSlot[],
  newSlot: TimetableSlot
): ValidationConflict | null => {
  if (!newSlot.room_number) return null; // Skip if no room assigned
  
  const conflict = slots.find(
    s => s.id !== newSlot.id &&
         s.room_number === newSlot.room_number &&
         s.day_of_week === newSlot.day_of_week &&
         s.period_number === newSlot.period_number
  );
  
  if (conflict) {
    return {
      type: 'room_collision',
      message: `Room ${newSlot.room_number} is already occupied by ${conflict.class_name} (${conflict.subject_name}) at this time.`,
      severity: 'error',
      affectedSlots: [conflict.id].filter(Boolean) as string[]
    };
  }
  
  return null;
};

/**
 * Comprehensive validation for a new/updated slot
 */
export const validateTimetableSlot = (
  allSlots: TimetableSlot[],
  newSlot: TimetableSlot
): ValidationConflict[] => {
  const conflicts: ValidationConflict[] = [];
  
  // Filter out the current slot if updating
  const otherSlots = allSlots.filter(s => s.id !== newSlot.id);
  
  // Add the new slot to check all rules
  const slotsWithNew = [...otherSlots, newSlot];
  
  // Get the teacher ID (prefer educator_id, fallback to teacher_id)
  const teacherId = newSlot.educator_id || newSlot.teacher_id;
  
  if (!teacherId) {
    conflicts.push({
      type: 'teacher_double_booking',
      message: 'Teacher ID is missing',
      severity: 'error'
    });
    return conflicts;
  }
  
  // Rule 1: Max 6 periods per day
  const maxPeriodsConflict = validateMaxPeriodsPerDay(
    slotsWithNew,
    teacherId,
    newSlot.day_of_week
  );
  if (maxPeriodsConflict) conflicts.push(maxPeriodsConflict);
  
  // Rule 2: Max 3 consecutive periods
  const consecutiveConflict = validateMaxConsecutivePeriods(
    slotsWithNew,
    teacherId,
    newSlot.day_of_week
  );
  if (consecutiveConflict) conflicts.push(consecutiveConflict);
  
  // Rule 3: Teacher availability
  const teacherConflict = validateTeacherAvailability(otherSlots, newSlot);
  if (teacherConflict) conflicts.push(teacherConflict);
  
  // Rule 4: Room availability
  const roomConflict = validateRoomAvailability(otherSlots, newSlot);
  if (roomConflict) conflicts.push(roomConflict);
  
  return conflicts;
};

/**
 * Get all conflicts for entire timetable
 */
export const getAllTimetableConflicts = (
  slots: TimetableSlot[]
): Map<string, ValidationConflict[]> => {
  const conflictMap = new Map<string, ValidationConflict[]>();
  
  slots.forEach(slot => {
    if (!slot.id) return;
    
    const conflicts = validateTimetableSlot(slots, slot);
    if (conflicts.length > 0) {
      conflictMap.set(slot.id, conflicts);
    }
  });
  
  return conflictMap;
};

/**
 * Check if a slot can be added without conflicts
 */
export const canAddSlot = (
  allSlots: TimetableSlot[],
  newSlot: TimetableSlot
): { canAdd: boolean; conflicts: ValidationConflict[] } => {
  const conflicts = validateTimetableSlot(allSlots, newSlot);
  const hasErrors = conflicts.some(c => c.severity === 'error');
  
  return {
    canAdd: !hasErrors,
    conflicts
  };
};
