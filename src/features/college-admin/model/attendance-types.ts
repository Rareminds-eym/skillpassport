// ==================== TYPES ====================
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  course: string;
  semester: number;
  section: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  timeIn?: string;
  timeOut?: string;
  subject?: string;
  facultyId?: string;
  facultyName?: string;
  remarks?: string;
  location?: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
  department: string;
  course: string;
  semester: number;
  section: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  status: "completed" | "ongoing" | "scheduled";
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  department: string;
  course: string;
  semester: number;
  section: string;
  email?: string;
  phone?: string;
}

export interface SubjectGroup {
  subject: string;
  department: string;
  course: string;
  semester: number;
  section: string;
  faculty: string;
  sessions: AttendanceSession[];
  totalSessions: number;
  avgAttendancePercentage: number;
  totalStudents: number;
  totalPresentCount: number;
  totalAbsentCount: number;
  totalLateCount: number;
  totalExcusedCount: number;
  dateRange: {
    first: string;
    last: string;
  };
  latestStatus: string;
}
