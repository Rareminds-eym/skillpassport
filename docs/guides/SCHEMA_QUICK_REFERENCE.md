# College Database Schema - Quick Reference

## 📊 Complete Schema Structure (60 Tables)

---

## ✅ CREATED TABLES (14)

### Core & Academic (5 tables)
| Table | Key Columns | Foreign Keys | Purpose |
|-------|-------------|--------------|---------|
| **departments** | id, name, code, hod_id, status | users(hod_id) | Academic departments |
| **programs** | id, department_id, name, code, duration_semesters | departments | Academic programs |
| **course_mappings** | id, program_id, semester, course_code, faculty_id | programs, users | Course assignments |
| **curriculum** | id, course_id, units(JSONB), outcomes(JSONB), status | course_mappings, users | Curriculum details |
| **student_admissions** | id, user_id, program_id, roll_number, cgpa, status | users, programs, departments | Student lifecycle |

### Examination (4 tables)
| Table | Key Columns | Foreign Keys | Purpose |
|-------|-------------|--------------|---------|
| **assessments** | id, type, course_id, total_marks, status | course_mappings, users | Exams/assessments |
| **exam_timetable** | id, assessment_id, exam_date, invigilators(UUID[]) | assessments, course_mappings | Exam scheduling |
| **mark_entries** | id, assessment_id, student_id, marks_obtained, grade | assessments, users | Student marks |
| **transcripts** | id, student_id, type, verification_id, status | users | Student transcripts |

### Finance (5 tables)
| Table | Key Columns | Foreign Keys | Purpose |
|-------|-------------|--------------|---------|
| **fee_structures** | id, program_id, semester, fee_heads(JSONB) | programs | Fee definitions |
| **student_ledgers** | id, student_id, due_amount, paid_amount, balance | users, fee_structures | Fee tracking |
| **payments** | id, ledger_id, amount, mode, receipt_number | student_ledgers, users | Payment records |
| **department_budgets** | id, department_id, budget_heads(JSONB), status | departments, users | Budget allocation |
| **expenditures** | id, department_id, budget_id, amount, category | departments, department_budgets, users | Expenses |

---

## ❌ NEEDED TABLES (46)

### Library Module (3 tables)
```sql
library_books (id, title, author, isbn, total_copies, available_copies)
library_issued_books (id, book_id, student_id, issue_date, due_date, status)
library_history (id, book_id, student_id, issue_date, return_date, fine_amount)
```

### Settings Module (10 tables)
```sql
academic_calendars (id, academic_year, start_date, end_date, is_active)
term_windows (id, calendar_id, name, type, start_date, end_date)
holidays (id, calendar_id, name, date, type)
exam_windows (id, term_id, name, type, start_date, end_date)
subjects_master (id, name, code, category, credits, status)
assessment_types_master (id, type_name, category, max_marks, weightage)
grading_systems (id, grade_label, min_marks, max_marks, grade_point)
attendance_policies (id, policy_name, min_attendance_percentage)
notification_templates (id, template_name, event_type, subject, body)
role_permissions (id, role_name, module, permissions(JSONB))
```

### Training & Skills (6 tables)
```sql
skill_courses (id, course_name, provider, duration, certification_type)
skill_allocations (id, course_id, target_group(JSONB), student_ids(UUID[]))
skill_enrollments (id, student_id, course_id, enrollment_date, status)
skill_progress (id, enrollment_id, completion_percentage, modules_completed(JSONB))
skill_assessments (id, enrollment_id, assessment_type, score, pass_status)
skill_certificates (id, enrollment_id, certificate_number, issue_date)
```

### Placements (7 tables)
```sql
companies (id, name, code, industry, account_status, approval_status)
company_contacts (id, company_id, contact_person_name, email, phone)
job_postings (id, company_id, title, eligibility_criteria(JSONB), status)
placement_applications (id, job_posting_id, student_id, status)
placement_rounds (id, job_posting_id, student_id, round_type, status)
placement_results (id, job_posting_id, student_id, package_offered)
placement_statistics (id, academic_year, department_id, placement_percentage)
```

### Mentor Allocation (5 tables)
```sql
mentors (id, user_id, department_id, capacity, current_load)
mentor_allocations (id, mentor_id, student_id, allocation_date, status)
mentor_sessions (id, allocation_id, session_date, session_type, status)
mentor_notes (id, allocation_id, note_text, intervention_type)
mentor_feedback (id, allocation_id, feedback_by, rating, feedback_text)
```

### Communication (5 tables)
```sql
circulars (id, title, content, category, priority, audience_type, status)
circular_recipients (id, circular_id, recipient_id, is_read, is_acknowledged)
circular_attachments (id, circular_id, file_name, file_url)
notifications (id, title, message, recipient_id, notification_type, is_read)
notification_logs (id, notification_id, delivery_method, delivery_status)
```

### Attendance (2 tables)
```sql
attendance_records (id, student_id, course_id, date, status, marked_by)
attendance_summary (id, student_id, course_id, total_classes, present_count)
```

### Lesson Plans (2 tables)
```sql
lesson_plans (id, course_id, created_by, lesson_date, topics, status)
lesson_plan_approvals (id, lesson_plan_id, approved_by, approval_date)
```

### Events (2 tables)
```sql
events (id, title, event_date, event_type, created_by, status)
event_registrations (id, event_id, user_id, registration_date, status)
```

### Portfolio (3 tables)
```sql
portfolios (id, student_id, created_at, last_updated)
portfolio_items (id, portfolio_id, item_type, title, description, file_url)
achievements (id, student_id, achievement_type, title, date, certificate_url)
```

### Infrastructure (4 tables)
```sql
infrastructure_assets (id, asset_name, asset_type, location, status)
maintenance_requests (id, asset_id, request_type, priority, status)
maintenance_schedules (id, asset_id, schedule_date, maintenance_type)
vendors (id, vendor_name, contact_person, phone, email, services)
```

---

## 🔗 Key Relationships

### Student-Centric Flow
```
users (student) 
  → student_admissions (enrollment)
    → mark_entries (grades)
      → transcripts (academic record)
  → student_ledgers (fees)
    → payments (fee payments)
```

### Educator-Centric Flow
```
users (faculty)
  → departments (hod_id)
  → course_mappings (faculty_id)
    → assessments (created_by)
      → mark_entries (entered_by)
```

### Academic Flow
```
departments
  → programs
    → course_mappings
      → curriculum
        → assessments
          → exam_timetable
```

---

## 📈 Data Types Used

### UUID
- All primary keys
- All foreign key references

### TEXT
- Names, codes, descriptions
- Status fields with CHECK constraints

### JSONB
- curriculum: units, outcomes, assessment_mappings
- student_admissions: personal_details, documents
- fee_structures: fee_heads, due_schedule
- department_budgets: budget_heads

### DECIMAL
- mark_entries: marks_obtained (5,2)
- student_admissions: cgpa (4,2)
- payments: amount (10,2)
- expenditures: amount (10,2)

### TIMESTAMPTZ
- created_at, updated_at (all tables)
- paid_at, approved_at, generated_at

### Arrays
- exam_timetable: invigilators UUID[]
- skill_allocations: student_ids UUID[]

---

## 🎯 Indexes (18 total)

### Foreign Key Indexes
- idx_departments_hod
- idx_programs_department
- idx_course_mappings_program
- idx_course_mappings_faculty
- idx_curriculum_course
- idx_student_admissions_program
- idx_assessments_course
- idx_exam_timetable_assessment
- idx_mark_entries_assessment
- idx_mark_entries_student
- idx_transcripts_student
- idx_student_ledgers_student
- idx_payments_ledger
- idx_expenditures_department
- idx_expenditures_budget

### Status Indexes
- idx_curriculum_status
- idx_student_admissions_status
- idx_assessments_status

---

## 🔒 Constraints

### CHECK Constraints
- Status fields (active/inactive, draft/published, etc.)
- Type fields (core/elective, IA/end_semester, etc.)
- Payment modes (cash/upi/card/cheque/bank_transfer)

### UNIQUE Constraints
- departments.code
- programs.code
- course_mappings(program_id, semester, course_code)
- student_admissions.application_number
- student_admissions.roll_number
- transcripts.verification_id
- payments.receipt_number
- fee_structures(program_id, semester, category, academic_year)
- mark_entries(assessment_id, student_id)

### GENERATED Columns
- student_ledgers.balance (due_amount - paid_amount)

---

## 🔄 Triggers

All tables have `updated_at` triggers:
```sql
CREATE TRIGGER update_{table}_updated_at 
BEFORE UPDATE ON {table}
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 Migration Files

### Existing
1. ✅ `college_dashboard_modules.sql` (14 tables)

### Needed
2. ❌ `library_module.sql` (3 tables)
3. ❌ `settings_module.sql` (10 tables)
4. ❌ `skills_module.sql` (6 tables)
5. ❌ `placements_module.sql` (7 tables)
6. ❌ `mentor_module.sql` (5 tables)
7. ❌ `communication_module.sql` (5 tables)
8. ❌ `supporting_modules.sql` (6 tables)
9. ❌ `additional_modules.sql` (7 tables)

---

Last Updated: December 11, 2024
