import type { Assessment, ExamSlot } from '../../types/college';

// Mock Assessments Data
export const mockAssessments: Assessment[] = [
  {
    id: '1',
    type: 'IA',
    academic_year: '2024-25',
    department_id: 'dept-cs',
    program_id: 'prog-btcs',
    semester: 3,
    course_id: 'course-ds',
    duration_minutes: 90,
    total_marks: 50,
    pass_marks: 20,
    instructions: 'Answer all questions. Use of calculators is not permitted.',
    syllabus_coverage: ['Unit 1', 'Unit 2'],
    status: 'draft',
    created_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'end_semester',
    academic_year: '2024-25',
    department_id: 'dept-cs',
    program_id: 'prog-btcs',
    semester: 3,
    course_id: 'course-dbms',
    duration_minutes: 180,
    total_marks: 100,
    pass_marks: 40,
    instructions: 'Answer any 5 questions out of 8. All questions carry equal marks.',
    syllabus_coverage: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'],
    status: 'scheduled',
    created_by: 'user-1',
    approved_by: 'user-2',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: '3',
    type: 'practical',
    academic_year: '2024-25',
    department_id: 'dept-cs',
    program_id: 'prog-btcs',
    semester: 3,
    course_id: 'course-ds',
    duration_minutes: 120,
    total_marks: 50,
    pass_marks: 20,
    instructions: 'Implement the given data structure and demonstrate its operations.',
    syllabus_coverage: ['Practical 1', 'Practical 2', 'Practical 3'],
    status: 'ongoing',
    created_by: 'user-1',
    approved_by: 'user-2',
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-25T10:00:00Z',
  },
  {
    id: '4',
    type: 'viva',
    academic_year: '2024-25',
    department_id: 'dept-cs',
    program_id: 'prog-btcs',
    semester: 3,
    course_id: 'course-os',
    duration_minutes: 30,
    total_marks: 25,
    pass_marks: 10,
    instructions: 'Oral examination on operating system concepts.',
    syllabus_coverage: ['All Units'],
    status: 'completed',
    created_by: 'user-1',
    approved_by: 'user-2',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-30T10:00:00Z',
  },
  {
    id: '5',
    type: 'IA',
    academic_year: '2024-25',
    department_id: 'dept-me',
    program_id: 'prog-btme',
    semester: 5,
    course_id: 'course-thermo',
    duration_minutes: 90,
    total_marks: 50,
    pass_marks: 20,
    instructions: 'Closed book examination. Answer all questions.',
    syllabus_coverage: ['Unit 1', 'Unit 2'],
    status: 'draft',
    created_by: 'user-3',
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
  },
  {
    id: '6',
    type: 'arrears',
    academic_year: '2023-24',
    department_id: 'dept-cs',
    program_id: 'prog-btcs',
    semester: 2,
    course_id: 'course-math',
    duration_minutes: 180,
    total_marks: 100,
    pass_marks: 40,
    instructions: 'Arrears examination for failed students. Answer all questions.',
    syllabus_coverage: ['All Units'],
    status: 'scheduled',
    created_by: 'user-1',
    approved_by: 'user-2',
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
  },
];

// Mock Exam Slots Data
export const mockExamSlots: ExamSlot[] = [
  {
    id: 'slot-1',
    assessment_id: '2',
    course_id: 'course-dbms',
    exam_date: '2024-02-15',
    start_time: '09:00',
    end_time: '12:00',
    room: 'Room 101',
    batch_section: 'A',
    invigilators: ['faculty-1', 'faculty-2'],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'slot-2',
    assessment_id: '2',
    course_id: 'course-dbms',
    exam_date: '2024-02-15',
    start_time: '09:00',
    end_time: '12:00',
    room: 'Room 102',
    batch_section: 'B',
    invigilators: ['faculty-3', 'faculty-4'],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'slot-3',
    assessment_id: '6',
    course_id: 'course-math',
    exam_date: '2024-02-20',
    start_time: '14:00',
    end_time: '17:00',
    room: 'Room 201',
    batch_section: 'All',
    invigilators: ['faculty-5'],
    created_at: '2024-01-22T10:00:00Z',
    updated_at: '2024-01-22T10:00:00Z',
  },
];

// Mock Departments
export const mockDepartments = [
  { id: 'dept-cs', name: 'Computer Science' },
  { id: 'dept-me', name: 'Mechanical Engineering' },
  { id: 'dept-ec', name: 'Electronics & Communication' },
  { id: 'dept-ee', name: 'Electrical Engineering' },
];

// Mock Programs
export const mockPrograms = [
  { id: 'prog-btcs', name: 'B.Tech Computer Science', department_id: 'dept-cs' },
  { id: 'prog-mtcs', name: 'M.Tech Computer Science', department_id: 'dept-cs' },
  { id: 'prog-btme', name: 'B.Tech Mechanical Engineering', department_id: 'dept-me' },
  { id: 'prog-btec', name: 'B.Tech Electronics', department_id: 'dept-ec' },
  { id: 'prog-btee', name: 'B.Tech Electrical', department_id: 'dept-ee' },
];

// Mock Courses
export const mockCourses = [
  { id: 'course-ds', course_code: 'CS301', course_name: 'Data Structures' },
  { id: 'course-dbms', course_code: 'CS302', course_name: 'Database Management Systems' },
  { id: 'course-os', course_code: 'CS303', course_name: 'Operating Systems' },
  { id: 'course-cn', course_code: 'CS304', course_name: 'Computer Networks' },
  { id: 'course-math', course_code: 'MA201', course_name: 'Engineering Mathematics' },
  { id: 'course-thermo', course_code: 'ME501', course_name: 'Thermodynamics' },
];

// Helper function to filter assessments
export const filterAssessments = (
  assessments: Assessment[],
  filters: {
    type?: string;
    status?: string;
    search?: string;
  }
): Assessment[] => {
  let filtered = [...assessments];

  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  if (filters.status) {
    filtered = filtered.filter((a) => a.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.academic_year.toLowerCase().includes(searchLower) ||
        a.type.toLowerCase().includes(searchLower) ||
        a.status.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};

// Helper function to get course name by ID
export const getCourseById = (courseId: string) => {
  return mockCourses.find((c) => c.id === courseId);
};

// Helper function to get department name by ID
export const getDepartmentById = (deptId: string) => {
  return mockDepartments.find((d) => d.id === deptId);
};

// Helper function to get program name by ID
export const getProgramById = (progId: string) => {
  return mockPrograms.find((p) => p.id === progId);
};
