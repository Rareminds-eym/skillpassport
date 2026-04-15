export interface Department {
    id: string;
    name: string;
    code: string;
    college_id: string;
}

export interface Program {
    id: string;
    name: string;
    code: string;
    department_id: string;
    college_id: string;
}

export interface ProgramSection {
    id: string;
    department_id: string;
    program_id: string;
    semester: number;
    section: string;
    academic_year: string;
    max_students: number;
    current_students: number;
    faculty_id: string;
    status: string;
    program?: Program;
    department?: Department;
}

export interface Course {
    id: string;
    course_name: string;
    course_code: string;
    college_id: string;
}

export interface CollegeStudent {
    id: string;
    user_id: string;
    name: string;
    email: string;
    program_id: string;
    section: string;
    semester: number;
    roll_number: string;
}

export interface CollegeAssignment {
    assignment_id: string;
    title: string;
    description: string;
    instructions: string;
    course_name: string;
    course_code: string;
    college_educator_id: string;
    educator_name: string;
    college_id: string;
    program_section_id: string;
    department_id: string;
    program_id: string;
    total_points: number;
    assignment_type: string;
    skill_outcomes: string[];
    due_date: string;
    available_from: string;
    allow_late_submission: boolean;
    document_pdf?: string;
    instruction_files?: Array<{
        name: string;
        url: string;
        size: number;
        type: string;
    }>;
    created_date: string;
    status: string;
    program_name?: string;
    department_name?: string;
    semester?: number;
    section?: string;
    academic_year?: string;
    student_count?: number;
}

export interface CreateAssignmentData {
    title: string;
    description?: string;
    instructions?: string;
    course_name: string;
    course_code?: string;
    college_id: string;
    program_section_id: string;
    department_id: string;
    program_id: string;
    total_points: number;
    assignment_type: string;
    skill_outcomes: string[];
    due_date: string;
    available_from?: string;
    allow_late_submission: boolean;
    document_pdf?: string;
}

export interface CollegeStudentAssignment {
    assignment_id: string;
    student_assignment_id: string;
    title: string;
    description: string;
    instructions: string;
    course_name: string;
    course_code: string;
    educator_name: string;
    total_points: number;
    assignment_type: string;
    skill_outcomes: string[];
    due_date: string;
    available_from: string;
    allow_late_submission: boolean;
    document_pdf?: string;
    instruction_files?: Array<{
        name: string;
        url: string;
        size: number;
        type: string;
    }>;
    created_date: string;
    status: string;
    priority: string;
    grade_received?: number;
    grade_percentage?: number;
    instructor_feedback?: string;
    submission_date?: string;
    submission_content?: string;
    submission_url?: string;
    submission_files?: any;
    is_late: boolean;
    program_name?: string;
    department_name?: string;
    semester?: number;
    section?: string;
    academic_year?: string;
}

export interface CollegeAssignmentStats {
    total: number;
    todo: number;
    inProgress: number;
    submitted: number;
    graded: number;
    averageGrade: number;
}

export type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string };
