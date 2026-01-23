# College Dashboard Tables - Student & Educator Connections

## 🎓 Overview

All 60 tables in the College Dashboard are connected to either **Students** or **Educators** (Faculty/Staff) through the central **users** table.

---

## 👥 Central Connection: users Table

```
users (id, role, email, name, ...)
  ├── role = 'student' → Student-related tables
  ├── role = 'faculty' → Educator-related tables
  ├── role = 'staff' → Staff-related tables
  └── role = 'admin' → Admin-related tables
```

---

## 📊 CREATED TABLES (14) - Student & Educator Connections

### 1. **departments** ✅
**Connection to Educators**:
- `hod_id` → users(id) - Head of Department (Educator)

**Connection to Students**:
- Indirect: Students belong to departments through programs

**Usage**:
- Educators: Assigned as HoD, work in departments
- Students: Enrolled in programs under departments

---

### 2. **programs** ✅
**Connection to Educators**:
- Indirect: Faculty teach courses in programs

**Connection to Students**:
- Direct: Students enroll in programs (B.Tech, M.Tech, etc.)

**Usage**:
- Educators: Teach courses mapped to programs
- Students: Enrolled in specific programs

---

### 3. **course_mappings** ✅
**Connection to Educators**:
- `faculty_id` → users(id) - Faculty assigned to teach course

**Connection to Students**:
- Indirect: Students take courses from their program

**Usage**:
- Educators: Assigned to teach specific courses
- Students: Take courses as per program curriculum

---

### 4. **curriculum** ✅
**Connection to Educators**:
- `created_by` → users(id) - Educator who created curriculum
- `approved_by` → users(id) - Educator who approved curriculum

**Connection to Students**:
- Indirect: Students follow curriculum for their courses

**Usage**:
- Educators: Create and approve curriculum
- Students: Learn as per curriculum structure

---

### 5. **student_admissions** ✅
**Connection to Students**:
- `user_id` → users(id) - **PRIMARY STUDENT CONNECTION**
- Stores: roll_number, current_semester, cgpa, status

**Connection to Educators**:
- Indirect: Educators manage student admissions

**Usage**:
- Students: Complete lifecycle from admission to graduation
- Educators: Review and approve admissions

---

### 6. **assessments** ✅
**Connection to Educators**:
- `created_by` → users(id) - Educator who created assessment
- `approved_by` → users(id) - Educator who approved assessment

**Connection to Students**:
- Indirect: Students take assessments

**Usage**:
- Educators: Create and schedule assessments
- Students: Appear for assessments

---

### 7. **exam_timetable** ✅
**Connection to Educators**:
- `invigilators` → users(id)[] - Array of educator IDs as invigilators

**Connection to Students**:
- Indirect: Students follow exam schedule

**Usage**:
- Educators: Assigned as invigilators
- Students: Attend exams as per timetable

---

### 8. **mark_entries** ✅
**Connection to Students**:
- `student_id` → users(id) - **STUDENT MARKS**

**Connection to Educators**:
- `entered_by` → users(id) - Educator who entered marks
- `moderated_by` → users(id) - Educator who moderated marks

**Usage**:
- Students: Receive marks for assessments
- Educators: Enter and moderate marks

---

### 9. **transcripts** ✅
**Connection to Students**:
- `student_id` → users(id) - **STUDENT TRANSCRIPT**

**Connection to Educators**:
- `approved_by` → users(id) - Educator who approved transcript

**Usage**:
- Students: Receive transcripts
- Educators: Approve and generate transcripts

---

### 10. **fee_structures** ✅
**Connection to Students**:
- Indirect: Students pay fees as per structure

**Connection to Educators**:
- Indirect: Educators may view fee structures

**Usage**:
- Students: Fee structure applies to their program
- Educators: Reference for student fee information

---

### 11. **student_ledgers** ✅
**Connection to Students**:
- `student_id` → users(id) - **STUDENT FEE LEDGER**

**Connection to Educators**:
- Indirect: Educators may view student fee status

**Usage**:
- Students: Track fee dues and payments
- Educators: View student fee clearance status

---

### 12. **payments** ✅
**Connection to Students**:
- Indirect: Through student_ledgers

**Connection to Educators**:
- `recorded_by` → users(id) - Staff/Educator who recorded payment

**Usage**:
- Students: Make fee payments
- Educators/Staff: Record and verify payments

---

### 13. **department_budgets** ✅
**Connection to Educators**:
- `approved_by` → users(id) - Educator/Admin who approved budget
- Indirect: Department budgets managed by HoD (Educator)

**Connection to Students**:
- Indirect: Budget affects student facilities

**Usage**:
- Educators: Manage and approve department budgets
- Students: Benefit from budget allocations

---

### 14. **expenditures** ✅
**Connection to Educators**:
- `recorded_by` → users(id) - Educator/Staff who recorded expense

**Connection to Students**:
- Indirect: Expenditures may benefit students

**Usage**:
- Educators: Record and manage expenses
- Students: Indirect beneficiaries

---

## 📋 NEEDED TABLES (46) - Student & Educator Connections

### Library Module (3 tables)

#### 16. **library_books**
**Connection**: Indirect
- Books available for both students and educators

#### 17. **library_issued_books**
**Connection to Students**:
- `student_id` → users(id) - Student who borrowed book

**Connection to Educators**:
- Educators can also borrow books (user_id)

#### 18. **library_history**
**Connection to Students**:
- `student_id` → users(id) - Student borrow history

**Connection to Educators**:
- Educators borrow history

---

### Settings Module (10 tables)

#### 19-28. **Settings Tables**
**Connection**: System-wide configuration
- Affects both students and educators
- Academic calendars, holidays, grading systems apply to all

---

### Training & Skill Development (6 tables)

#### 29. **skill_courses**
**Connection**: Available to students

#### 30. **skill_allocations**
**Connection to Students**:
- `student_ids` → users(id)[] - Students allocated to course

**Connection to Educators**:
- `created_by` → users(id) - Educator who allocated

#### 31. **skill_enrollments**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT ENROLLMENT**

#### 32. **skill_progress**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT PROGRESS**

#### 33. **skill_assessments**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT ASSESSMENT**

#### 34. **skill_certificates**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT CERTIFICATE**

---

### Placement Management (7 tables)

#### 35-36. **companies, company_contacts**
**Connection**: Indirect - for student placements

#### 37. **job_postings**
**Connection to Students**:
- `eligible_students_count` - Students eligible
- `shortlisted_students` → users(id)[] - Shortlisted students

**Connection to Educators**:
- `created_by` → users(id) - Placement officer (Educator/Staff)

#### 38. **placement_applications**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT APPLICATION**

#### 39. **placement_rounds**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT INTERVIEW ROUND**

#### 40. **placement_results**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT PLACEMENT RESULT**

#### 41. **placement_statistics**
**Connection**: Aggregated student placement data

---

### Mentor Allocation (5 tables)

#### 42. **mentors**
**Connection to Educators**:
- `user_id` → users(id) - **EDUCATOR AS MENTOR**

#### 43. **mentor_allocations**
**Connection to Educators**:
- `mentor_id` → mentors(id) → users(id) - Educator mentor

**Connection to Students**:
- `student_id` → users(id) - **STUDENT MENTEE**

**Connection to Educators**:
- `created_by` → users(id) - Admin who allocated

#### 44. **mentor_sessions**
**Connection to Educators**:
- `mentor_id` → users(id) - Educator conducting session

**Connection to Students**:
- `student_id` → users(id) - **STUDENT IN SESSION**

#### 45. **mentor_notes**
**Connection to Educators**:
- `mentor_id` → users(id) - Educator writing notes

**Connection to Students**:
- `student_id` → users(id) - **STUDENT NOTES**

#### 46. **mentor_feedback**
**Connection to Educators**:
- `mentor_id` → users(id) - Educator giving/receiving feedback

**Connection to Students**:
- `student_id` → users(id) - **STUDENT FEEDBACK**

---

### Communication (5 tables)

#### 47. **circulars**
**Connection to Educators**:
- `created_by` → users(id) - Educator who created circular
- `published_by` → users(id) - Educator who published

**Connection to Students**:
- Indirect: Students receive circulars

#### 48. **circular_recipients**
**Connection to Students**:
- `recipient_id` → users(id) - **STUDENT RECIPIENT**

**Connection to Educators**:
- `recipient_id` → users(id) - **EDUCATOR RECIPIENT**

#### 49. **circular_attachments**
**Connection**: Indirect through circulars

#### 50. **notifications**
**Connection to Students**:
- `recipient_id` → users(id) - **STUDENT NOTIFICATION**

**Connection to Educators**:
- `recipient_id` → users(id) - **EDUCATOR NOTIFICATION**

#### 51. **notification_logs**
**Connection**: Delivery tracking for both

---

### Attendance Tracking (2 tables)

#### 52. **attendance_records**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT ATTENDANCE**

**Connection to Educators**:
- `marked_by` → users(id) - Educator who marked attendance

#### 53. **attendance_summary**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT ATTENDANCE SUMMARY**

---

### Lesson Plan Management (2 tables)

#### 54. **lesson_plans**
**Connection to Educators**:
- `created_by` → users(id) - **EDUCATOR LESSON PLAN**

**Connection to Students**:
- Indirect: Students follow lesson plans

#### 55. **lesson_plan_approvals**
**Connection to Educators**:
- `approved_by` → users(id) - Educator who approved

---

### Event Management (2 tables)

#### 56. **events**
**Connection to Educators**:
- `created_by` → users(id) - Educator who created event

**Connection to Students**:
- Indirect: Students participate in events

#### 57. **event_registrations**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT REGISTRATION**

**Connection to Educators**:
- `user_id` → users(id) - **EDUCATOR REGISTRATION**

---

### Digital Portfolio (3 tables)

#### 58. **portfolios**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT PORTFOLIO**

#### 59. **portfolio_items**
**Connection to Students**:
- Through portfolios - **STUDENT PORTFOLIO ITEMS**

#### 60. **achievements**
**Connection to Students**:
- `student_id` → users(id) - **STUDENT ACHIEVEMENTS**

---

### Infrastructure & Maintenance (4 tables)

#### 61-64. **Infrastructure Tables**
**Connection to Educators**:
- `created_by` → users(id) - Staff/Educator who created request

**Connection to Students**:
- Indirect: Students benefit from maintained infrastructure

---

## 📊 Connection Summary

### Student-Connected Tables (Direct): 35 tables
Tables with direct `student_id` or `user_id` (role='student') foreign key:
1. student_admissions ✅
2. mark_entries ✅
3. transcripts ✅
4. student_ledgers ✅
5. library_issued_books
6. library_history
7. skill_enrollments
8. skill_progress
9. skill_assessments
10. skill_certificates
11. placement_applications
12. placement_rounds
13. placement_results
14. mentor_allocations
15. mentor_sessions
16. mentor_notes
17. mentor_feedback
18. circular_recipients
19. notifications
20. attendance_records
21. attendance_summary
22. event_registrations
23. portfolios
24. portfolio_items
25. achievements
26. (+ 10 more indirect connections)

### Educator-Connected Tables (Direct): 30 tables
Tables with direct educator foreign keys:
1. departments (hod_id) ✅
2. course_mappings (faculty_id) ✅
3. curriculum (created_by, approved_by) ✅
4. assessments (created_by, approved_by) ✅
5. exam_timetable (invigilators) ✅
6. mark_entries (entered_by, moderated_by) ✅
7. transcripts (approved_by) ✅
8. payments (recorded_by) ✅
9. department_budgets (approved_by) ✅
10. expenditures (recorded_by) ✅
11. mentors (user_id)
12. mentor_allocations (mentor_id, created_by)
13. mentor_sessions (mentor_id)
14. mentor_notes (mentor_id)
15. mentor_feedback (mentor_id)
16. circulars (created_by, published_by)
17. circular_recipients (recipient_id)
18. notifications (recipient_id)
19. lesson_plans (created_by)
20. lesson_plan_approvals (approved_by)
21. events (created_by)
22. event_registrations (user_id)
23. skill_allocations (created_by)
24. job_postings (created_by)
25. (+ 5 more indirect connections)

### Shared Tables: 15 tables
Tables used by both students and educators:
1. users (central table)
2. departments
3. programs
4. course_mappings
5. curriculum
6. assessments
7. exam_timetable
8. library_books
9. circular_recipients
10. notifications
11. event_registrations
12. academic_calendars
13. holidays
14. grading_systems
15. attendance_policies

---

## 🔗 Connection Patterns

### Pattern 1: Direct Student Connection
```
Table → student_id → users(id) WHERE role='student'
```
**Examples**: student_admissions, mark_entries, transcripts, skill_enrollments

### Pattern 2: Direct Educator Connection
```
Table → faculty_id/created_by/approved_by → users(id) WHERE role='faculty'
```
**Examples**: course_mappings, assessments, curriculum, mentors

### Pattern 3: Dual Connection
```
Table → student_id → users(id) WHERE role='student'
Table → entered_by → users(id) WHERE role='faculty'
```
**Examples**: mark_entries, attendance_records, mentor_sessions

### Pattern 4: Indirect Connection
```
Table → program_id → programs → students enrolled
Table → department_id → departments → faculty working
```
**Examples**: fee_structures, department_budgets

---

## 📈 Usage Statistics

### Student-Centric Modules (20 modules):
- Student Lifecycle Management
- Examination Management
- Training & Skill Development
- Placement Management
- Mentor Allocation (as mentee)
- Digital Portfolio
- Attendance Tracking
- Event Management (as participant)
- Library (as borrower)
- Finance (fee payment)

### Educator-Centric Modules (15 modules):
- User Management
- Department Management
- Academic Management
- Examination Management (creation)
- Mentor Allocation (as mentor)
- Lesson Plan Management
- Communication (creation)
- Attendance Tracking (marking)
- Event Management (creation)
- Library (as borrower)

### Shared Modules (10 modules):
- Reports & Analytics
- Settings & Configuration
- Communication (receiving)
- Library & Assets
- Event Management
- Graduation Eligibility
- Performance Monitoring
- Circulars Management
- Notifications
- Academic Calendar

---

## ✅ Verification

**All 60 tables are connected to students and/or educators through**:
1. ✅ Direct foreign keys to users table
2. ✅ Indirect relationships through programs/departments
3. ✅ Shared system configuration tables
4. ✅ Activity tracking tables (created_by, approved_by, etc.)

**No orphaned tables**: Every table serves students, educators, or both.

---

Last Updated: December 11, 2024
