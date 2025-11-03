export interface Class {
  id: string;
  name: string;
  section: string;
  grade: string;
  teacher: string;
  studentCount: number;
  schedule: string;
  room: string;
  subject?: string;
}

export const mockClasses: Class[] = [
  {
    id: 'cls-001',
    name: 'Grade 10',
    section: 'A',
    grade: '10',
    teacher: 'Mrs. Anderson',
    studentCount: 28,
    schedule: 'Mon, Wed, Fri 9:00-10:30',
    room: 'Room 205',
    subject: 'General'
  },
  {
    id: 'cls-002',
    name: 'Grade 10',
    section: 'B',
    grade: '10',
    teacher: 'Mr. Williams',
    studentCount: 25,
    schedule: 'Tue, Thu 9:00-10:30',
    room: 'Room 206',
    subject: 'General'
  },
  {
    id: 'cls-003',
    name: 'Grade 9',
    section: 'A',
    grade: '9',
    teacher: 'Ms. Davis',
    studentCount: 30,
    schedule: 'Mon, Wed, Fri 11:00-12:30',
    room: 'Room 101',
    subject: 'General'
  },
  {
    id: 'cls-004',
    name: 'Grade 11',
    section: 'A',
    grade: '11',
    teacher: 'Dr. Thompson',
    studentCount: 22,
    schedule: 'Tue, Thu 13:00-14:30',
    room: 'Room 301',
    subject: 'General'
  },
  {
    id: 'cls-005',
    name: 'Grade 11',
    section: 'B',
    grade: '11',
    teacher: 'Mrs. Brown',
    studentCount: 24,
    schedule: 'Mon, Wed 13:00-14:30',
    room: 'Room 302',
    subject: 'General'
  }
];
