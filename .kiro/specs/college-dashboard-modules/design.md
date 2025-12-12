# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing the College Dashboard with four core management modules: User Management, Academic Management, Examination Management, and Finance & Accounts. The design follows the existing School Dashboard patterns while incorporating college-specific features including department management, course credit systems, placement tracking, skill development programs, and advanced financial operations.

### Key Design Principles

1. **Design Consistency**: Reuse existing School Dashboard UI components and patterns
2. **Role-Based Access**: Implement granular permissions for College Admin, HoD, Faculty, Exam Cell, Finance Admin, and Placement Officer
3. **Data Integrity**: Enforce validation rules and maintain audit trails for all critical operations
4. **Scalability**: Support multiple departments, programs, and large student populations
5. **Integration**: Seamlessly integrate with existing authentication, database, and storage systems

## Architecture

### System Architecture

The College Dashboard modules follow a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (React Components - College Admin Pages)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Business Logic Layer                  │
│  (Services, Hooks, State Management)                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Data Access Layer                     │
│  (Supabase Client, API Services)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                        │
│  (PostgreSQL via Supabase)                              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18+ with TypeScript
- **UI Framework**: Tailwind CSS with Heroicons/Lucide icons
- **State Management**: React Hooks (useState, useEffect, custom hooks)
- **Data Fetching**: Supabase Client with React Query
- **Routing**: React Router v6
- **Forms**: Controlled components with validation
- **File Upload**: Cloudflare R2 (existing integration)
- **Authentication**: Supabase Auth (existing)



## Components and Interfaces

### 1. User Management Module

#### Components

**UserManagement.tsx** (Enhanced)
- User list table with search, filter, and pagination
- Add/Edit user modal with role assignment
- Bulk import CSV interface with validation feedback
- Password reset functionality
- User activation/deactivation controls

**UserForm Component**
- Fields: Name, Email, Employee/Student ID, Role(s), Department, Status
- Validation: Unique email/ID, mandatory fields, role selection
- Faculty-specific fields: Course assignments, workload calculation

**BulkImportModal Component**
- CSV upload with template download
- Real-time validation with error highlighting
- Preview before commit
- Error log export

#### Services

**userManagementService.ts**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  student_id?: string;
  roles: string[];
  department_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Core operations
createUser(userData: Partial<User>): Promise<User>
updateUser(userId: string, updates: Partial<User>): Promise<User>
deactivateUser(userId: string): Promise<void>
bulkImportUsers(csvData: any[]): Promise<ImportResult>
resetPassword(userId: string): Promise<void>
getUsersByRole(role: string): Promise<User[]>
```

### 2. Academic Management Module

#### Components

**DepartmentManagement.tsx**
- Department list with HoD assignments
- Add/Edit department modal
- Department dashboard with program summary
- Faculty allocation overview

**CourseMapping.tsx**
- Program-semester course grid
- Course allocation form with credit assignment
- Faculty workload calculator
- Elective basket configuration
- Lock/unlock semester controls

**CurriculumBuilder.tsx** (Enhanced from School version)
- Context selector: Academic Year, Department, Program, Semester, Course
- Unit/Module builder with credits and hours
- Learning outcomes library with Bloom's taxonomy tags
- Assessment mapping matrix (IA, End-Sem, Practical, Viva)
- CO-PO mapping interface (Phase 2)
- Approval workflow: Draft → Submitted → Approved → Published
- Version control and cloning

**StudentAdmission.tsx**
- Application pipeline: Applied → Verified → Approved → Enrolled
- Document upload and verification interface
- Roll number generation rules
- Bulk import with validation
- Semester progression controls
- Graduation eligibility checker

#### Services

**departmentService.ts**
```typescript
interface Department {
  id: string;
  name: string;
  code: string;
  hod_id: string;
  programs: Program[];
  status: 'active' | 'inactive';
}

createDepartment(data: Partial<Department>): Promise<Department>
updateDepartment(id: string, updates: Partial<Department>): Promise<Department>
assignHoD(deptId: string, hodId: string): Promise<void>
getDepartmentDashboard(deptId: string): Promise<DashboardData>
```

**courseMappingService.ts**
```typescript
interface CourseMapping {
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
}

mapCourse(data: Partial<CourseMapping>): Promise<CourseMapping>
allocateFaculty(mappingId: string, facultyId: string): Promise<void>
calculateWorkload(facultyId: string): Promise<WorkloadSummary>
lockSemester(programId: string, semester: number): Promise<void>
cloneSemesterStructure(fromId: string, toId: string): Promise<void>
```



**curriculumService.ts** (Enhanced)
```typescript
interface Curriculum {
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
}

interface Unit {
  id: string;
  title: string;
  sequence: number;
  credits?: number;
  estimated_hours?: number;
}

interface LearningOutcome {
  id: string;
  text: string;
  bloom_level?: string;
  unit_ids: string[];
}

interface AssessmentMapping {
  outcome_id: string;
  assessment_types: ('IA' | 'end_semester' | 'practical' | 'viva' | 'arrears')[];
  weightage?: number;
}

createCurriculum(data: Partial<Curriculum>): Promise<Curriculum>
updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<Curriculum>
submitForApproval(id: string): Promise<void>
approveCurriculum(id: string): Promise<void>
publishCurriculum(id: string): Promise<void>
cloneCurriculum(id: string, targetYear: string): Promise<Curriculum>
exportCurriculum(id: string): Promise<Blob>
```

**studentAdmissionService.ts**
```typescript
interface StudentAdmission {
  id: string;
  application_number: string;
  personal_details: PersonalDetails;
  program_id: string;
  department_id: string;
  category: string;
  quota: string;
  documents: Document[];
  status: 'applied' | 'verified' | 'approved' | 'enrolled' | 'active' | 'graduated' | 'alumni';
  roll_number?: string;
  current_semester?: number;
  cgpa?: number;
}

createApplication(data: Partial<StudentAdmission>): Promise<StudentAdmission>
verifyDocuments(id: string, documentIds: string[]): Promise<void>
approveAdmission(id: string): Promise<void>
generateRollNumber(programId: string, year: number): Promise<string>
promoteToNextSemester(studentIds: string[]): Promise<PromotionResult>
checkGraduationEligibility(studentId: string): Promise<EligibilityStatus>
markAsGraduated(studentIds: string[]): Promise<void>
bulkImportStudents(csvData: any[]): Promise<ImportResult>
```

### 3. Examination Management Module

#### Components

**ExaminationManagement.tsx** (Enhanced)
- Tab navigation: Syllabus, Internal Assessments, Examinations, Transcripts
- Assessment creation wizard
- Timetable scheduler with conflict detection
- Invigilation assignment interface
- Mark entry grid with validation
- Moderation review panel
- Result publication controls

**AssessmentCreationForm Component**
- Fields: Type, Academic Year, Dept, Program, Semester, Subject, Duration, Marks
- Syllabus coverage picker (unit/chapter selection)
- Instructions and guidelines editor
- Duplicate detection

**TimetableScheduler Component**
- Calendar view with drag-and-drop
- Room/venue allocation
- Batch/section assignment
- Conflict detection and warnings
- Auto-generate option with constraints

**MarkEntryGrid Component**
- Student list with auto-population
- Mark input with range validation
- Absent/Exempt flags
- Bulk upload from Excel
- Submit and lock controls

**ModerationPanel Component**
- Distribution analytics (histogram, statistics)
- Student-wise edit interface
- Reason for change requirement
- Revaluation/grace application (college-specific)
- Audit log viewer

**TranscriptGeneration.tsx**
- Student selector with filters
- Transcript type: Provisional/Final
- Template selection
- Semester range inclusion
- QR verification toggle
- Batch generation by dept/batch
- Preview and approve workflow

#### Services

**assessmentService.ts** (Enhanced)
```typescript
interface Assessment {
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
}

createAssessment(data: Partial<Assessment>): Promise<Assessment>
updateAssessment(id: string, updates: Partial<Assessment>): Promise<Assessment>
submitToExamCell(id: string): Promise<void>
approveAssessment(id: string): Promise<void>
```



**timetableService.ts**
```typescript
interface ExamSlot {
  id: string;
  assessment_id: string;
  course_id: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  batch_section?: string;
  invigilators: string[];
}

createExamSlot(data: Partial<ExamSlot>): Promise<ExamSlot>
detectConflicts(slots: ExamSlot[]): Promise<Conflict[]>
autoGenerateTimetable(assessmentIds: string[], constraints: any): Promise<ExamSlot[]>
assignInvigilator(slotId: string, facultyId: string): Promise<void>
publishTimetable(assessmentId: string): Promise<void>
exportDutyList(assessmentId: string): Promise<Blob>
```

**markEntryService.ts**
```typescript
interface MarkEntry {
  id: string;
  assessment_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  is_exempt: boolean;
  remarks?: string;
  entered_by: string;
  entered_at: string;
  is_locked: boolean;
}

enterMarks(entries: Partial<MarkEntry>[]): Promise<MarkEntry[]>
bulkUploadMarks(assessmentId: string, csvData: any[]): Promise<UploadResult>
submitMarks(assessmentId: string): Promise<void>
lockMarks(assessmentId: string): Promise<void>
moderateMarks(entryId: string, newMarks: number, reason: string): Promise<void>
publishResults(assessmentId: string): Promise<void>
calculateGrades(marks: number, gradingScale: GradingScale): string
updateSGPACGPA(studentId: string): Promise<void>
```

**transcriptService.ts**
```typescript
interface Transcript {
  id: string;
  student_id: string;
  type: 'provisional' | 'final';
  template_id: string;
  semester_range: { from: number; to: number };
  include_qr: boolean;
  verification_id?: string;
  status: 'draft' | 'approved' | 'published';
  generated_at?: string;
  approved_by?: string;
}

generateTranscript(data: Partial<Transcript>): Promise<Transcript>
batchGenerateTranscripts(filters: any): Promise<Transcript[]>
approveTranscript(id: string): Promise<void>
downloadTranscriptPDF(id: string): Promise<Blob>
verifyTranscript(verificationId: string): Promise<TranscriptData>
```

### 4. Finance & Accounts Module

#### Components

**FinanceManagement.tsx** (Enhanced)
- Stats cards: Total Collection, Pending Fees, Dept Budgets, Expenditure
- Tab navigation: Fee Tracking, Department Budgets, Expenditure Reports
- Search and filter controls
- Export functionality

**FeeStructureSetup Component**
- Program/semester/category selector
- Fee head configuration (Tuition, Lab, Library, etc.)
- Amount entry with due schedule
- Bulk upload from template

**StudentFeeLedger Component**
- Student search and selection
- Fee head wise breakdown
- Payment history timeline
- Scholarship/waiver application
- Receipt generation
- Defaulter flag

**PaymentEntry Component**
- Student and fee head selection
- Amount validation
- Payment mode (Cash, UPI, Card, Cheque)
- Reference number capture
- Receipt auto-generation

**DepartmentBudgetSetup Component**
- Department selector
- Budget head allocation
- Period definition
- Approval workflow
- Budget request submission

**ExpenditureEntry Component**
- Department and category selection
- Vendor details
- Amount with budget validation
- Invoice upload
- Date and description
- Override with reason for budget excess

**BudgetReports Component**
- Planned vs Actual comparison
- Variance analysis charts
- Department-wise breakdown
- Export to Excel/PDF

#### Services

**feeManagementService.ts**
```typescript
interface FeeStructure {
  id: string;
  program_id: string;
  semester: number;
  category: string;
  fee_heads: FeeHead[];
  due_schedule: DueSchedule[];
  academic_year: string;
}

interface FeeHead {
  id: string;
  name: string;
  amount: number;
}

interface DueSchedule {
  due_date: string;
  percentage: number;
}

interface StudentLedger {
  student_id: string;
  fee_head_id: string;
  due_amount: number;
  paid_amount: number;
  balance: number;
  payments: Payment[];
  scholarships: Scholarship[];
}

interface Payment {
  id: string;
  amount: number;
  mode: string;
  reference_number: string;
  receipt_number: string;
  paid_at: string;
}

createFeeStructure(data: Partial<FeeStructure>): Promise<FeeStructure>
recordPayment(studentId: string, feeHeadId: string, payment: Partial<Payment>): Promise<Payment>
generateReceipt(paymentId: string): Promise<Blob>
getStudentLedger(studentId: string): Promise<StudentLedger>
applyScholarship(studentId: string, amount: number, reason: string): Promise<void>
getDefaulterReport(filters: any): Promise<DefaulterReport>
exportFeeReports(filters: any, format: 'excel' | 'pdf'): Promise<Blob>
```



**budgetManagementService.ts**
```typescript
interface DepartmentBudget {
  id: string;
  department_id: string;
  budget_heads: BudgetHead[];
  period: { from: string; to: string };
  status: 'draft' | 'submitted' | 'approved';
}

interface BudgetHead {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  remaining: number;
}

interface Expenditure {
  id: string;
  department_id: string;
  budget_head_id: string;
  vendor_name: string;
  amount: number;
  category: string;
  invoice_file_id?: string;
  date: string;
  description?: string;
  override_reason?: string;
}

allocateBudget(data: Partial<DepartmentBudget>): Promise<DepartmentBudget>
submitBudgetRequest(budgetId: string, justification: string): Promise<void>
approveBudget(budgetId: string): Promise<void>
recordExpenditure(data: Partial<Expenditure>): Promise<Expenditure>
validateBudgetLimit(deptId: string, budgetHeadId: string, amount: number): Promise<boolean>
getBudgetReport(deptId: string, period: any): Promise<BudgetReport>
exportExpenditureReport(filters: any): Promise<Blob>
```

## Data Models

### Database Schema

#### Users Table (Enhanced)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  student_id TEXT UNIQUE,
  roles TEXT[] NOT NULL,
  department_id UUID REFERENCES departments(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Departments Table
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Programs Table
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  duration_semesters INTEGER NOT NULL,
  total_credits_required INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Course Mappings Table
```sql
CREATE TABLE course_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  type TEXT CHECK (type IN ('core', 'dept_elective', 'open_elective')),
  faculty_id UUID REFERENCES users(id),
  capacity INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, course_code)
);
```

#### Curriculum Table
```sql
CREATE TABLE curriculum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  units JSONB NOT NULL,
  outcomes JSONB NOT NULL,
  assessment_mappings JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Student Admissions Table
```sql
CREATE TABLE student_admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  program_id UUID REFERENCES programs(id) NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  personal_details JSONB NOT NULL,
  category TEXT NOT NULL,
  quota TEXT NOT NULL,
  documents JSONB,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'verified', 'approved', 'enrolled', 'active', 'graduated', 'alumni')),
  roll_number TEXT UNIQUE,
  current_semester INTEGER,
  cgpa DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Assessments Table
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('IA', 'end_semester', 'practical', 'viva', 'arrears')),
  academic_year TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  pass_marks INTEGER NOT NULL,
  instructions TEXT,
  syllabus_coverage JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed')),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```



#### Exam Timetable Table
```sql
CREATE TABLE exam_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  batch_section TEXT,
  invigilators UUID[] REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Mark Entries Table
```sql
CREATE TABLE mark_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  student_id UUID REFERENCES users(id) NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  is_absent BOOLEAN DEFAULT FALSE,
  is_exempt BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  grade TEXT,
  entered_by UUID REFERENCES users(id) NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  moderated_by UUID REFERENCES users(id),
  moderation_reason TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  UNIQUE(assessment_id, student_id)
);
```

#### Transcripts Table
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) NOT NULL,
  type TEXT CHECK (type IN ('provisional', 'final')),
  template_id UUID,
  semester_from INTEGER NOT NULL,
  semester_to INTEGER NOT NULL,
  include_qr BOOLEAN DEFAULT TRUE,
  verification_id TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  file_url TEXT,
  generated_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Fee Structures Table
```sql
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  category TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  fee_heads JSONB NOT NULL,
  due_schedule JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, category, academic_year)
);
```

#### Student Ledgers Table
```sql
CREATE TABLE student_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) NOT NULL,
  fee_structure_id UUID REFERENCES fee_structures(id) NOT NULL,
  fee_head_id TEXT NOT NULL,
  due_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (due_amount - paid_amount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ledger_id UUID REFERENCES student_ledgers(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cash', 'upi', 'card', 'cheque', 'bank_transfer')),
  reference_number TEXT,
  receipt_number TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id) NOT NULL
);
```

#### Department Budgets Table
```sql
CREATE TABLE department_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  budget_heads JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Expenditures Table
```sql
CREATE TABLE expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  budget_id UUID REFERENCES department_budgets(id) NOT NULL,
  budget_head_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  invoice_file_id TEXT,
  expenditure_date DATE NOT NULL,
  description TEXT,
  override_reason TEXT,
  recorded_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### User Management Properties

**Property 1: User uniqueness enforcement**
*For any* user creation attempt, if the email or employee/student ID already exists in the system, the creation SHALL be rejected with a clear error message.
**Validates: Requirements 1.1**

**Property 2: Role-based access control**
*For any* user with assigned roles, access to modules SHALL be restricted to only those modules permitted by their role assignments.
**Validates: Requirements 1.2**

**Property 3: Bulk import validation completeness**
*For any* CSV bulk import operation, all invalid records SHALL be identified, rejected, and included in the error log with specific validation failure reasons.
**Validates: Requirements 1.3**

**Property 4: Faculty workload calculation accuracy**
*For any* Faculty member, the calculated workload SHALL equal the sum of credits from all assigned courses.
**Validates: Requirements 1.4**

**Property 5: Deactivation preserves data**
*For any* user account deactivation, all access permissions SHALL be revoked while all historical data associated with the user remains accessible for audit purposes.
**Validates: Requirements 1.5**

**Property 6: User filtering correctness**
*For any* filter combination (role, department, status), the returned user list SHALL contain only users matching all specified filter criteria.
**Validates: Requirements 1.7**

### Academic Management Properties

**Property 7: Department code uniqueness**
*For any* department creation attempt, if the department code already exists, the creation SHALL be rejected.
**Validates: Requirements 2.1**

**Property 8: Course mapping validation**
*For any* course mapping to a program semester, the course code SHALL be validated, credits SHALL be assigned, and type SHALL be categorized as one of: Core, Dept Elective, or Open Elective.
**Validates: Requirements 2.2**

**Property 9: Elective capacity enforcement**
*For any* elective course, the number of enrolled students SHALL NOT exceed the defined capacity limit.
**Validates: Requirements 2.4**

**Property 10: Semester lock immutability**
*For any* semester that has been locked, course mappings SHALL NOT be modifiable without proper authorization override.
**Validates: Requirements 2.6**

**Property 11: Curriculum mandatory fields**
*For any* curriculum creation, academic year, department, program, semester, and course SHALL all be specified before the curriculum can be saved.
**Validates: Requirements 3.1**

**Property 12: Outcome assessment mapping completeness**
*For any* curriculum, every learning outcome SHALL be mapped to at least one assessment type (IA, End-Semester, Practical, or Viva).
**Validates: Requirements 3.4**

**Property 13: Approved curriculum immutability**
*For any* curriculum in approved status, modifications SHALL be prevented unless a new version is created through version control.
**Validates: Requirements 3.6**

**Property 14: Roll number uniqueness**
*For any* approved student admission, the generated roll number SHALL be unique across all students in the institution.
**Validates: Requirements 4.3**

**Property 15: Semester promotion validation**
*For any* student promotion attempt, if the student has insufficient credits or uncleared backlogs, the promotion SHALL be blocked.
**Validates: Requirements 4.4**

**Property 16: CGPA calculation accuracy**
*For any* student who completes all semesters, the final CGPA SHALL be calculated as the weighted average of all semester GPAs based on credits.
**Validates: Requirements 4.5**

### Examination Management Properties

**Property 17: Assessment mandatory fields validation**
*For any* assessment creation, all required fields (type, academic year, department, program, semester, subject, duration, total marks, pass marks) SHALL be provided before the assessment can be saved.
**Validates: Requirements 5.1**

**Property 18: Timetable conflict detection**
*For any* exam timetable, if two exams are scheduled in the same room at overlapping times OR the same student batch has overlapping exams, a conflict SHALL be detected and reported.
**Validates: Requirements 5.2**

**Property 19: Invigilator availability check**
*For any* invigilator assignment, if the faculty member is already assigned to another exam at the same time slot, the assignment SHALL be blocked.
**Validates: Requirements 5.3**

**Property 20: Marks range validation**
*For any* mark entry, the marks obtained SHALL be within the range of 0 to the maximum marks defined for that assessment.
**Validates: Requirements 5.4**

**Property 21: Mark submission locks entry**
*For any* assessment where marks have been submitted, further mark entry or modification SHALL be prevented until unlocked by authorized personnel.
**Validates: Requirements 5.5**

**Property 22: Moderation audit trail**
*For any* mark modification during moderation, a reason SHALL be required and an audit log entry SHALL be created recording the change, reason, and moderator.
**Validates: Requirements 5.6**

**Property 23: Grade conversion consistency**
*For any* published result, marks SHALL be converted to grades according to the defined grading scale, and SGPA/CGPA SHALL be updated based on the grade points and credits.
**Validates: Requirements 5.7**

**Property 24: Transcript data completeness**
*For any* generated transcript, it SHALL include all semester courses, grades, credits, SGPA for each semester, and cumulative CGPA.
**Validates: Requirements 6.1**

**Property 25: Transcript verification ID uniqueness**
*For any* transcript generated with QR verification, the verification ID SHALL be unique across all transcripts.
**Validates: Requirements 6.4**

**Property 26: Approved transcript immutability**
*For any* transcript in approved status, modifications SHALL be prevented to maintain document integrity.
**Validates: Requirements 6.6**

### Finance & Accounts Properties

**Property 27: Payment ledger update consistency**
*For any* recorded payment, the student ledger SHALL be updated with the payment amount, a unique receipt number SHALL be generated, and the balance SHALL be recalculated correctly.
**Validates: Requirements 7.2**

**Property 28: Ledger balance calculation**
*For any* student ledger, the balance SHALL equal the due amount minus the paid amount at all times.
**Validates: Requirements 7.3**

**Property 29: Scholarship adjustment audit**
*For any* scholarship or waiver application, the due amount SHALL be adjusted accordingly and the reason SHALL be recorded for audit purposes.
**Validates: Requirements 7.4**

**Property 30: Defaulter identification accuracy**
*For any* defaulter report generation, it SHALL include only students whose fee balance is positive and whose due date has passed, sorted by balance amount in descending order.
**Validates: Requirements 7.5**

**Property 31: Overpayment prevention**
*For any* payment attempt, if the payment amount exceeds the remaining due amount for that fee head, the transaction SHALL be blocked unless an authorized override with reason is provided.
**Validates: Requirements 7.7**

**Property 32: Budget limit enforcement**
*For any* expenditure recording, if the amount would cause the budget head to exceed its allocated amount, the transaction SHALL be blocked unless an authorized override with reason is provided.
**Validates: Requirements 8.4**

**Property 33: Budget variance calculation**
*For any* budget report, the variance SHALL be calculated as (Actual Expenditure - Planned Budget) for each budget head, and the percentage utilization SHALL be (Actual / Planned) × 100.
**Validates: Requirements 8.5**



## Error Handling

### Validation Errors

**Client-Side Validation**
- Form field validation with real-time feedback
- Required field indicators
- Format validation (email, phone, dates)
- Range validation (marks, amounts)
- Unique constraint checking before submission

**Server-Side Validation**
- Duplicate detection (email, IDs, codes)
- Foreign key validation
- Business rule enforcement
- Data integrity checks
- Authorization verification

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}
```

### Common Error Scenarios

1. **Unique Constraint Violations**
   - Error Code: `DUPLICATE_ENTRY`
   - User Message: "A user with this email already exists"
   - Action: Highlight field, suggest correction

2. **Authorization Failures**
   - Error Code: `UNAUTHORIZED`
   - User Message: "You don't have permission to perform this action"
   - Action: Redirect to appropriate page or show access denied message

3. **Validation Failures**
   - Error Code: `VALIDATION_ERROR`
   - User Message: Field-specific error messages
   - Action: Highlight invalid fields with error messages

4. **Conflict Errors**
   - Error Code: `CONFLICT`
   - User Message: "This exam slot conflicts with another exam"
   - Action: Show conflicting items, suggest alternatives

5. **Budget/Capacity Exceeded**
   - Error Code: `LIMIT_EXCEEDED`
   - User Message: "This expenditure exceeds the allocated budget"
   - Action: Show current usage, allow override with reason

6. **State Transition Errors**
   - Error Code: `INVALID_STATE`
   - User Message: "Cannot modify approved curriculum without creating new version"
   - Action: Explain current state, suggest valid actions

### Error Logging

- All errors logged to Supabase with context
- User actions logged for audit trail
- Failed operations tracked for debugging
- Critical errors trigger admin notifications

## Testing Strategy

### Unit Testing

**Component Testing**
- Test individual React components in isolation
- Mock service calls and hooks
- Verify rendering with different props and states
- Test user interactions (clicks, form submissions)
- Validate error state handling

**Service Testing**
- Test service functions with mock Supabase client
- Verify correct API calls are made
- Test error handling and edge cases
- Validate data transformations

**Validation Testing**
- Test form validation rules
- Verify error messages are correct
- Test edge cases (empty, null, invalid formats)

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property-based tests. Each test will run a minimum of 100 iterations.

**Property Test Structure**
```typescript
import fc from 'fast-check';

// Example property test
describe('User Management Properties', () => {
  it('Property 1: User uniqueness enforcement', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          name: fc.string(),
          employee_id: fc.string()
        }),
        async (userData) => {
          // Create user first time - should succeed
          const user1 = await createUser(userData);
          expect(user1).toBeDefined();
          
          // Attempt to create user with same email - should fail
          await expect(createUser(userData)).rejects.toThrow('DUPLICATE_ENTRY');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage**
- Each correctness property will have a corresponding property-based test
- Tests will generate random valid inputs using fast-check arbitraries
- Tests will verify the property holds across all generated inputs
- Failed tests will provide counterexamples for debugging

**Test Tagging Convention**
Each property-based test MUST include a comment tag in this format:
```typescript
// **Feature: college-dashboard-modules, Property 1: User uniqueness enforcement**
```

### Integration Testing

**End-to-End Workflows**
- Complete user creation and role assignment flow
- Curriculum creation, approval, and publishing workflow
- Assessment creation, mark entry, moderation, and result publication
- Fee structure setup, payment recording, and receipt generation
- Budget allocation, expenditure recording, and reporting

**Database Integration**
- Test actual Supabase queries
- Verify RLS policies work correctly
- Test transaction handling
- Validate data consistency

### Manual Testing Checklist

**User Management**
- [ ] Create user with all roles
- [ ] Bulk import CSV with errors
- [ ] Deactivate user and verify access revoked
- [ ] Filter users by multiple criteria

**Academic Management**
- [ ] Create department and assign HoD
- [ ] Map courses to program with credits
- [ ] Create curriculum with outcomes and assessments
- [ ] Approve and publish curriculum
- [ ] Admit student and generate roll number
- [ ] Promote student to next semester

**Examination Management**
- [ ] Create assessment and schedule timetable
- [ ] Assign invigilators with conflict detection
- [ ] Enter marks and submit for moderation
- [ ] Moderate marks with reason
- [ ] Publish results and verify CGPA update
- [ ] Generate transcript with QR code

**Finance & Accounts**
- [ ] Setup fee structure for program
- [ ] Record payment and generate receipt
- [ ] Apply scholarship and verify adjustment
- [ ] Generate defaulter report
- [ ] Allocate department budget
- [ ] Record expenditure with budget validation
- [ ] Generate budget variance report

### Performance Testing

**Load Testing**
- Test with 10,000+ users
- Test with 100+ departments and programs
- Test bulk operations (1000+ records)
- Measure response times for reports

**Optimization Targets**
- Page load time < 2 seconds
- Search/filter results < 500ms
- Report generation < 5 seconds
- Bulk import processing < 10 seconds for 1000 records

