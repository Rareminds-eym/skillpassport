# Requirements Document

## Introduction

This document outlines the requirements for enhancing the College Dashboard with four core management modules: User Management, Academic Management, Examination Management, and Finance & Accounts. These modules will follow the same design patterns as the existing School Dashboard while adding college-specific functionalities including department management, course mapping, placement tracking, skill development, and advanced financial operations.

## Glossary

- **College Admin**: Administrator with full access to all college management functions
- **HoD**: Head of Department responsible for department-specific operations
- **Faculty**: Teaching staff member assigned to courses and departments
- **Department**: Academic division within the college (e.g., Computer Science, Mechanical Engineering)
- **Program**: Degree program offered by a department (e.g., B.Sc Computer Science, M.Tech)
- **Semester**: Academic term within a program (e.g., Semester 1, Semester 2)
- **Course**: Subject or module within a program with assigned credits
- **IA**: Internal Assessment conducted during the semester
- **End-Semester Exam**: Final examination at the end of a semester
- **CGPA**: Cumulative Grade Point Average calculated across all semesters
- **SGPA**: Semester Grade Point Average for a specific semester
- **CO-PO Mapping**: Course Outcome to Program Outcome mapping matrix
- **Transcript**: Official academic record showing all courses and grades
- **Fee Head**: Category of fee (e.g., Tuition, Lab, Library)
- **Ledger**: Financial record of student fee transactions
- **Budget Head**: Category of departmental expenditure
- **Placement Cell**: Team managing campus recruitment and placements
- **Skill Course**: Additional training or certification program for students

## Requirements

### Requirement 1: User & Profile Management

**User Story:** As a College Admin, I want to manage staff and student profiles with role-based permissions, so that I can control access and maintain accurate institutional records.

#### Acceptance Criteria

1. WHEN a College Admin creates a new user THEN the system SHALL validate unique email and employee/student ID before creation
2. WHEN a College Admin assigns roles to a user THEN the system SHALL enforce role-based access permissions for all modules
3. WHEN a College Admin performs bulk import via CSV THEN the system SHALL validate all records and provide error logs for invalid entries
4. WHEN a Faculty member is created THEN the system SHALL link the Faculty to departments, courses, and calculate workload based on credit assignments
5. WHEN a user account is deactivated THEN the system SHALL revoke all access permissions while preserving historical data
6. WHEN a College Admin resets a user password THEN the system SHALL send a secure reset link to the user's registered email
7. WHEN viewing user lists THEN the system SHALL filter users by role, department, and status (active/inactive)

### Requirement 2: Academic Management - Department & Course Structure

**User Story:** As a College Admin or HoD, I want to manage departments, programs, and course mappings, so that I can maintain the academic structure of the institution.

#### Acceptance Criteria

1. WHEN a College Admin creates a department THEN the system SHALL validate unique department code and assign one HoD
2. WHEN a HoD maps courses to a program semester THEN the system SHALL validate course codes, assign credits, and categorize as Core/Dept Elective/Open Elective
3. WHEN a Faculty is allocated to a course THEN the system SHALL calculate and display Faculty workload based on total credits assigned
4. WHEN setting up elective courses THEN the system SHALL enforce student capacity limits for each elective basket
5. WHEN a semester structure is cloned THEN the system SHALL copy all course mappings while allowing modifications before activation
6. WHEN a semester starts THEN the system SHALL lock course mappings to prevent unauthorized changes
7. WHEN viewing department dashboard THEN the system SHALL display programs offered, enrolled students, and Faculty allocation summary

### Requirement 3: Academic Management - Curriculum & Syllabus Builder

**User Story:** As a Faculty member or Academic Head, I want to define curriculum structure with learning outcomes and assessment mappings, so that I can align teaching with institutional standards.

#### Acceptance Criteria

1. WHEN creating curriculum for a course THEN the system SHALL require selection of academic year, department, program, semester, and course
2. WHEN adding units or modules THEN the system SHALL allow Faculty to specify unit title, credits, estimated hours, and sequence order
3. WHEN defining learning outcomes THEN the system SHALL allow tagging with Bloom's taxonomy levels and enable reuse from outcome library
4. WHEN mapping assessments to outcomes THEN the system SHALL ensure every outcome maps to at least one assessment type (IA/End-Semester/Practical/Viva)
5. WHEN curriculum is submitted for approval THEN the system SHALL change status to "Submitted" and notify the approver
6. WHEN curriculum is approved THEN the system SHALL allow publishing and prevent further edits without version control
7. WHEN exporting curriculum THEN the system SHALL generate PDF with all units, outcomes, and assessment mappings

### Requirement 4: Academic Management - Student Admission & Lifecycle

**User Story:** As a College Admin or Department Office staff, I want to manage student admissions and semester progression, so that I can track student academic journey from admission to graduation.

#### Acceptance Criteria

1. WHEN a student application is received THEN the system SHALL capture personal details, program selection, category/quota, and required documents
2. WHEN verifying student documents THEN the system SHALL allow Admin to mark documents as verified or request resubmission
3. WHEN approving student admission THEN the system SHALL generate unique roll number based on institutional rules and enroll student in Semester 1
4. WHEN promoting students to next semester THEN the system SHALL validate credit requirements and backlog status before allowing promotion
5. WHEN a student completes all semesters THEN the system SHALL calculate final CGPA and mark student as eligible for graduation
6. WHEN marking student as graduated THEN the system SHALL move student record to alumni status and trigger transcript generation
7. WHEN bulk importing student data THEN the system SHALL validate all mandatory fields and provide detailed error report for failed records

### Requirement 5: Examination Management - Assessment Pipeline

**User Story:** As an Exam Cell member or Faculty, I want to manage the complete assessment workflow from creation to result publication, so that I can ensure transparent and efficient examination processes.

#### Acceptance Criteria

1. WHEN creating an assessment THEN the system SHALL require assessment type, academic year, department, program, semester, subject, duration, total marks, and pass marks
2. WHEN scheduling exam timetable THEN the system SHALL detect room conflicts and student batch overlaps before confirming schedule
3. WHEN assigning invigilators THEN the system SHALL check Faculty availability and prevent double assignments for the same time slot
4. WHEN entering marks THEN the system SHALL validate marks are within 0 to maximum range and flag absent/exempt students
5. WHEN Faculty submits marks THEN the system SHALL lock mark entry and send for moderation approval
6. WHEN moderator reviews marks THEN the system SHALL require reason for any mark changes and maintain audit log
7. WHEN publishing results THEN the system SHALL convert marks to grades based on grading scale and update student SGPA/CGPA

### Requirement 6: Examination Management - Transcript Generation

**User Story:** As an Exam Cell member, I want to generate official transcripts for students, so that I can provide verified academic records for employment or further education.

#### Acceptance Criteria

1. WHEN generating a transcript THEN the system SHALL include all semester courses, grades, credits, SGPA, and cumulative CGPA
2. WHEN selecting transcript type THEN the system SHALL differentiate between Provisional (for current students) and Final (for graduates)
3. WHEN generating transcript PDF THEN the system SHALL apply institutional template with logo, seal, and authorized signatures
4. WHEN adding QR verification THEN the system SHALL embed unique verification ID that links to online verification portal
5. WHEN batch generating transcripts THEN the system SHALL allow filtering by department, batch, and graduation year
6. WHEN transcript is approved THEN the system SHALL mark as official and prevent further modifications
7. WHEN student requests transcript THEN the system SHALL log request and track approval workflow

### Requirement 7: Finance & Accounts - Fee Management

**User Story:** As a Finance Admin, I want to manage fee structures and track student payments, so that I can maintain accurate financial records and identify defaulters.

#### Acceptance Criteria

1. WHEN setting up fee structure THEN the system SHALL define fee heads, amounts per program/semester/category, and due schedule
2. WHEN recording student payment THEN the system SHALL update ledger, generate receipt with unique number, and send confirmation email
3. WHEN viewing student ledger THEN the system SHALL display fee head wise due amounts, paid amounts, balance, and payment history
4. WHEN applying scholarship or waiver THEN the system SHALL adjust due amount and record reason for audit purposes
5. WHEN generating defaulter report THEN the system SHALL list students with pending fees beyond due date, sorted by amount
6. WHEN exporting fee reports THEN the system SHALL provide Excel/PDF format with filters for program, semester, and payment status
7. WHEN payment exceeds due amount THEN the system SHALL prevent transaction unless override is authorized with reason

### Requirement 8: Finance & Accounts - Department Budget Management

**User Story:** As a Finance Admin or HoD, I want to manage department budgets and track expenditures, so that I can ensure financial accountability and prevent budget overruns.

#### Acceptance Criteria

1. WHEN allocating department budget THEN the system SHALL define budget heads, allocation amounts, and budget period
2. WHEN HoD submits budget request THEN the system SHALL route to Finance Admin for approval with justification
3. WHEN recording expenditure THEN the system SHALL capture department, vendor details, amount, category, invoice upload, and date
4. WHEN expenditure exceeds allocated budget THEN the system SHALL block transaction unless override is provided with reason
5. WHEN viewing budget reports THEN the system SHALL display planned vs actual expenditure with variance analysis
6. WHEN exporting expenditure report THEN the system SHALL generate detailed breakdown by budget head and time period
7. WHEN budget period ends THEN the system SHALL archive budget data and allow rollover of unused amounts if configured

### Requirement 9: Skill Development & Training Management

**User Story:** As a College Admin or Skill Development Coordinator, I want to manage skill courses and track student progress, so that I can enhance student employability through additional certifications.

#### Acceptance Criteria

1. WHEN creating skill course THEN the system SHALL capture course name, provider, duration, certification type, and optional credits
2. WHEN allocating skill course to students THEN the system SHALL allow batch allocation by department/program/semester with mandatory/elective flag
3. WHEN tracking skill progress THEN the system SHALL record student completion percentage, assessment scores, and attendance
4. WHEN student completes skill course THEN the system SHALL generate certificate from template and mark course as completed
5. WHEN collecting feedback THEN the system SHALL allow students to rate course content, trainer, and overall experience
6. WHEN viewing skill analytics THEN the system SHALL display completion rates, average scores, and certification status by department
7. WHEN exporting skill reports THEN the system SHALL provide student-wise and course-wise completion data

### Requirement 10: Placement Management

**User Story:** As a Placement Officer, I want to manage company registrations, job postings, and track placement outcomes, so that I can facilitate campus recruitment and improve placement rates.

#### Acceptance Criteria

1. WHEN registering a company THEN the system SHALL capture company name, industry, contact details, eligibility criteria templates, and MoU/JD documents
2. WHEN creating job post THEN the system SHALL define role, package, eligibility filters (CGPA, department, skills), interview rounds, and intake capacity
3. WHEN publishing job post THEN the system SHALL auto-generate list of eligible students based on filters and notify them
4. WHEN tracking application stages THEN the system SHALL allow updating student status through rounds (Applied → Shortlisted → Interview → Offered → Joined)
5. WHEN generating placement analytics THEN the system SHALL calculate placement percentage, offers per department, median/average CTC, and internship conversions
6. WHEN company is blacklisted THEN the system SHALL prevent future job postings and hide from active company list
7. WHEN exporting placement reports THEN the system SHALL provide department-wise, batch-wise, and company-wise placement data

### Requirement 11: Mentor Allocation & Tracking

**User Story:** As a HoD or Faculty Mentor, I want to allocate mentors to student groups and track interventions, so that I can provide personalized academic and career guidance.

#### Acceptance Criteria

1. WHEN allocating mentor THEN the system SHALL assign Faculty to student group/batch with allocation period
2. WHEN viewing mentor dashboard THEN the system SHALL display allocated students with at-risk flags based on attendance and performance
3. WHEN logging mentoring session THEN the system SHALL allow Faculty to add private notes, intervention type, and outcome
4. WHEN student is flagged at-risk THEN the system SHALL notify assigned mentor and suggest intervention actions
5. WHEN reassigning mentor THEN the system SHALL transfer student group to new mentor while preserving historical notes
6. WHEN enforcing mentor capacity THEN the system SHALL limit number of students per mentor based on institutional policy
7. WHEN generating mentor reports THEN the system SHALL show intervention frequency, student improvement metrics, and mentor effectiveness

### Requirement 12: Reports & Analytics Hub

**User Story:** As a College Admin, HoD, or Department Head, I want unified access to institutional reports and analytics, so that I can make data-driven decisions and monitor performance.

#### Acceptance Criteria

1. WHEN accessing reports hub THEN the system SHALL display categories: Attendance, Performance/Grades, Exam Progress, Placement, Skill Analytics, and Budget Usage
2. WHEN applying filters THEN the system SHALL restrict data visibility based on user role (HoD sees only own department)
3. WHEN viewing attendance reports THEN the system SHALL show course-wise, student-wise, and department-wise attendance with trend analysis
4. WHEN viewing performance reports THEN the system SHALL display grade distribution, pass/fail rates, and CGPA trends
5. WHEN exporting reports THEN the system SHALL provide PDF and Excel formats with applied filters and date range
6. WHEN viewing placement analytics THEN the system SHALL show placement percentage, top recruiters, package distribution, and year-over-year comparison
7. WHEN viewing budget reports THEN the system SHALL display department-wise expenditure, variance analysis, and budget utilization percentage

### Requirement 13: Graduation Eligibility & Alumni Management

**User Story:** As an Exam Cell member or College Admin, I want to certify graduation eligibility and manage alumni records, so that I can ensure students meet degree requirements and maintain alumni network.

#### Acceptance Criteria

1. WHEN evaluating graduation eligibility THEN the system SHALL verify required credits earned, backlog clearance, and minimum CGPA threshold
2. WHEN generating eligibility list THEN the system SHALL display eligible students with completion status and pending requirements
3. WHEN overriding eligibility THEN the system SHALL require authorized approval with documented reason
4. WHEN marking student as graduated THEN the system SHALL update status, trigger final transcript generation, and move to alumni database
5. WHEN viewing alumni records THEN the system SHALL display graduation year, program, current employment status, and contact information
6. WHEN alumni updates profile THEN the system SHALL allow self-service updates to employment, location, and achievements
7. WHEN exporting alumni data THEN the system SHALL provide batch-wise, program-wise, and year-wise alumni lists

### Requirement 14: Academic Calendar & Settings

**User Story:** As a College Admin, I want to configure academic calendar and system settings, so that I can align system operations with institutional schedules and policies.

#### Acceptance Criteria

1. WHEN setting up academic calendar THEN the system SHALL define academic year, semester windows, holidays, exam windows, and IA windows
2. WHEN publishing calendar THEN the system SHALL make dates visible to all users and send notifications for upcoming events
3. WHEN locking calendar THEN the system SHALL prevent modifications to published dates without admin override
4. WHEN configuring grading system THEN the system SHALL define grade labels, min/max marks, grade points, and pass/fail thresholds
5. WHEN setting attendance policy THEN the system SHALL specify minimum attendance percentage per course and separate thresholds for lab/practical
6. WHEN defining assessment types THEN the system SHALL create categories (IA, End-Semester, Practical, Viva, Arrears) with active/inactive status
7. WHEN configuring role permissions THEN the system SHALL define module access matrix (view/create/edit/approve/publish) with scope rules per role
