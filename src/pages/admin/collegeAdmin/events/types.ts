// Event Management Types

export interface CollegeEvent {
  id: string;
  college_id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  venue?: string;
  capacity?: number;
  status: EventStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | 'seminar'
  | 'workshop'
  | 'cultural'
  | 'sports'
  | 'placement'
  | 'guest_lecture'
  | 'orientation'
  | 'other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  registered_at: string;
  attended: boolean;
  student?: { name: string; email: string };
}

export interface Student {
  id: string;
  name: string;
  email: string;
  college_id: string;
}

export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

export interface WeekEvent {
  event: CollegeEvent;
  startCol: number;
  span: number;
  isEventStart: boolean;
  isEventEnd: boolean;
}

export type CalendarView = 'month' | 'week' | 'day';
