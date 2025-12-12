// College Dashboard Module Types

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================
export interface User {
  id: string;
  email: string;
  name: string;
  employee_id?: string;
  student_id?: string;
  roles: string[];
  department_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// ============================================================================
// ACADEMIC MANAGEMENT TYPES
// ============================================================================
export interface Department {
  id: string;
  name: string;
  code: string;
  hod_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_semesters: number;
  total_credits_required: number;
  created_at: string;
  updated_at: string;
}

export interface CourseMapping {
  id: string;
  program_id: string;
  semester: number;
  course_code: string;
  course_name: string;
  credits: number;
  type: 'core' | 'dept_elective' | 'open_elective';
  faculty_id?: string;
  capacity?: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  title: string;
  sequence: number;
  credits?: number;
  estimated_hours?: number;
}

export interface LearningOutcome {
  id: string;
  text: string;
  bloom_level?: string;
  unit_ids: string[];
}

export interface AssessmentMapping {
  outcome_id: string;
  assessment_types: ('IA' | 'end_semester' | 'practical' | 'viva' | 'arrears')[];
  weightage?: number;
}

export interface Curriculum {
  id: string;
  academic_year: string;
  department_id: string;
  program_id: string;
  semester: number;
  course_id: string;
  units: Unit[];
  outcomes: LearningOutcome[];
  assessment_mappings: AssessmentMapping[];
  status: 'draft' | 'submitted' | 'approved' | 'published';
  version: number;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalDetails {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

export interface Document {
  id: string;
  type: string;
  file_url: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
}

export interface StudentAdmission {
  id: string;
  application_number: string;
  user_id?: string;
  program_id: string;
  department_id: string;
  personal_details: PersonalDetails;
  category: string;
  quota: string;
  documents: Document[];
  status: 'applied' | 'verified' | 'approved' | 'enrolled' | 'active' | 'graduated' | 'alumni';
  roll_number?: string;
  current_semester?: number;
  cgpa?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkloadSummary {
  faculty_id: string;
  total_credits: number;
  courses: Array<{
    course_code: string;
    course_name: string;
    credits: number;
  }>;
}

// ============================================================================
// EXAMINATION MANAGEMENT TYPES
// ============================================================================
export interface Assessment {
  id: string;
  type: 'IA' | 'end_semester' | 'practical' | 'viva' | 'arrears';
  academic_year: string;
  department_id: string;
  program_id: string;
  semester: number;
  course_id: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  instructions?: string;
  syllabus_coverage: string[];
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed';
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSlot {
  id: string;
  assessment_id: string;
  course_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room?: string;
  batch_section?: string;
  invigilators: string[];
  created_at: string;
  updated_at: string;
}

export interface Conflict {
  type: 'room' | 'student_batch' | 'faculty';
  slot1: ExamSlot;
  slot2: ExamSlot;
  message: string;
}

export interface MarkEntry {
  id: string;
  assessment_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  is_exempt: boolean;
  remarks?: string;
  grade?: string;
  entered_by: string;
  entered_at: string;
  moderated_by?: string;
  moderation_reason?: string;
  moderated_at?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface GradingScale {
  grade: string;
  min_marks: number;
  max_marks: number;
  grade_points: number;
}

export interface Transcript {
  id: string;
  student_id: string;
  type: 'provisional' | 'final';
  template_id?: string;
  semester_from: number;
  semester_to: number;
  include_qr: boolean;
  verification_id?: string;
  status: 'draft' | 'approved' | 'published';
  file_url?: string;
  generated_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TranscriptData {
  student: {
    name: string;
    roll_number: string;
    program: string;
  };
  semesters: Array<{
    semester: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      grade: string;
      grade_points: number;
    }>;
    sgpa: number;
  }>;
  cgpa: number;
}

// ============================================================================
// FINANCE & ACCOUNTS TYPES
// ============================================================================
export interface FeeHead {
  id: string;
  name: string;
  amount: number;
}

export interface DueSchedule {
  due_date: string;
  percentage: number;
}

export interface FeeStructure {
  id: string;
  program_id: string;
  semester: number;
  category: string;
  academic_year: string;
  fee_heads: FeeHead[];
  due_schedule: DueSchedule[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  amount: number;
  mode: 'cash' | 'upi' | 'card' | 'cheque' | 'bank_transfer';
  reference_number?: string;
  receipt_number: string;
  paid_at: string;
  recorded_by: string;
  created_at: string;
}

export interface Scholarship {
  id: string;
  amount: number;
  reason: string;
  applied_at: string;
  applied_by: string;
}

export interface StudentLedger {
  id: string;
  student_id: string;
  fee_structure_id: string;
  fee_head_id: string;
  due_amount: number;
  paid_amount: number;
  balance: number;
  payments: Payment[];
  scholarships: Scholarship[];
  created_at: string;
  updated_at: string;
}

export interface DefaulterReport {
  students: Array<{
    student_id: string;
    name: string;
    roll_number: string;
    program: string;
    balance: number;
    due_date: string;
  }>;
  total_pending: number;
}

export interface BudgetHead {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  remaining: number;
}

export interface DepartmentBudget {
  id: string;
  department_id: string;
  period_from: string;
  period_to: string;
  budget_heads: BudgetHead[];
  status: 'draft' | 'submitted' | 'approved';
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Expenditure {
  id: string;
  department_id: string;
  budget_id: string;
  budget_head_id: string;
  vendor_name: string;
  amount: number;
  category: string;
  invoice_file_id?: string;
  expenditure_date: string;
  description?: string;
  override_reason?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetReport {
  department_id: string;
  department_name: string;
  period: { from: string; to: string };
  budget_heads: Array<{
    name: string;
    planned: number;
    actual: number;
    variance: number;
    utilization_percentage: number;
  }>;
  total_planned: number;
  total_actual: number;
  total_variance: number;
}

// ============================================================================
// COMMON TYPES
// ============================================================================
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  search?: string;
  department_id?: string;
  program_id?: string;
  semester?: number;
  status?: string;
  academic_year?: string;
}
