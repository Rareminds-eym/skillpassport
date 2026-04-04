// Timetable Types

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface SubjectExpertise {
  name: string;
  proficiency?: string;
  years_experience?: number;
}

export interface Faculty {
  id: string;
  first_name: string;
  last_name: string;
  employeeId?: string;
  subject_expertise?: SubjectExpertise[];
  department_id?: string | null;
  is_hod?: boolean;
}

export interface CollegeClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  department_id?: string | null;
}

export interface ScheduleSlot {
  id?: string;
  timetable_id: string;
  educator_id: string;
  class_id: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_number: string;
  schedule_date?: string;
  is_recurring: boolean;
  color?: string;
}

export interface Substitution {
  id: string;
  substitution_date: string;
  period_number: number;
  class_id: string;
  subject_name: string;
  original_faculty_id: string;
  original_faculty_name: string;
  substitute_faculty_id: string | null;
  substitute_faculty_name: string | null;
  status: 'pending' | 'assigned' | 'confirmed' | 'completed';
}

export interface Break {
  id?: string;
  college_id: string;
  timetable_id?: string;
  break_type: "lunch" | "short" | "holiday" | "exam" | "event";
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  start_date?: string;
  end_date?: string;
  is_recurring: boolean;
  recurring_days?: number[];
}

export interface TimePeriod {
  id?: string;
  period_number: number;
  period_name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  break_type?: string;
}

export interface SlotFormData {
  faculty_id: string;
  subject_name: string;
  room_number: string;
  is_recurring: boolean;
}

export interface BreakFormData extends Partial<Break> {}

export interface SelectedCell {
  day: number;
  period: TimePeriod;
}
