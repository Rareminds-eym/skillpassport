Combined School + College Dashboard — Screen-wise Master FRD
A. Shared Core Screens (School + College)

A1. Login & Role Selection
Purpose: Secure access; route user to relevant dashboard based on role.
Users: All roles.
Sections
Login form
Role context (if user has multiple roles)
Fields
Email / User ID
Password
OTP (optional)
Role selector (Admin / Teacher / HoD / Exam cell / Placement / Finance etc.)
Actions
Login
Forgot password
Switch role
Validations
Mandatory credentials
Lockout after N failed attempts
OTP timeout
Outputs/States
Success → route to Dashboard
Error → message + retry
First login → password reset flow

A2. Home Dashboard (Role-based)
Purpose: Snapshot of academic + admin KPIs.
Users: Admin, Academic Head, HoD, Teacher, Exam Cell, Finance, Skill/Placement teams.
Shared Widgets
Total students (active)
Attendance summary
Academic progress (coverage / lesson plans / syllabus completion)
Assessment/Exam status
Recent circulars
Quick actions
School Variant Adds
Curriculum coverage per class/subject
Lesson plan completion
Exam pipeline (PT/Term/Skill/Practical)
College Variant Adds
Department/program summary
Placement pipeline KPIs
Skill course progress
Fee outstanding + dept budgets
Filters
Academic year
Grade/Class (School)
Department/Program/Semester (College)
Subject/Course
Actions
Drill-down to module
Export snapshot (PDF)
Validations
Role-based widget visibility

A3. Notifications & Circulars Inbox
Purpose: Central place to view institutional communication.
Users: All roles.
Sections
Circular list
Notification list
Filters
Fields (Circular Creation)
Title
Audience (All / Grade / Dept / Batch / Section)
Priority (Normal/High)
Message body (rich text)
Attachment(s)
Publish date
Expiry date
Actions
Create/Edit/Delete (Admin)
Publish/Unpublish
Mark as read
Search/filter
Download attachments
Validations
Title + audience mandatory
Expiry ≥ publish date
Outputs
Visible to targeted users
Archived after expiry

A4. User & Profile Management
Purpose: Manage staff/student profiles with role permissions.
Users: Admin, HoD (college), Academic head.
Shared Fields
Name
ID (Employee/Student)
Email, phone
Role(s)
Status (active/inactive)
Documents (optional)
School Variant
Teacher linked to subjects + class sections
College Variant
Faculty linked to departments + course credits + workload
Actions
Add / Edit / Deactivate
Bulk import (CSV)
Reset password
Assign roles
Validations
Unique ID/email
Role must exist in master

A5. Reports & Analytics Hub
Purpose: Unified access to reports.
Users: Admin, Academic head, HoD, Exam cell, Placement/Skill/Finance teams.
Shared Report Categories
Attendance
Performance/Grades
Exam progress
Export center
College Adds
Placement overview
Skill course analytics
Dept budget usage
Actions
Filter
View chart/table
Export PDF/Excel
Validations
Filters aligned to role scope (e.g., HoD only own dept)

B. Shared Academic Screens (School + College with variants)

B1. Curriculum / Syllabus Builder
Purpose: Define academic structure, outcomes, assessment mapping.
Users: Admin/Academic head; Teachers/Faculty (if enabled).
Shared Sections
1.Context selector
2.Subject/Course structure
3.Outcomes
4.Assessment mapping
5.Versioning & approval
Context Selector Fields
Academic year
School: Grade/Class + Section
College: Department + Program + Semester
Subject/Course dropdown
Structure Fields
School: Chapter list
oChapter title
oSequence order
oEstimated duration
College: Unit/Module list
oUnit title
oCredits / hours (optional)
Outcomes Fields
Outcome text
Tags (Bloom level optional)
Library reuse toggle
College Optional Extra
CO-PO/PSO mapping matrix (phase-2)
Assessment Mapping Fields
Outcome → Assessment type(s)
Assessment types:
oSchool: PT / Term / Skill / Practical
oCollege: IA / End-Semester / Practical / Viva / Arrears
Weightage % (optional)
Actions
Add/edit/reorder chapters/units
Add outcomes
Map assessments
Save draft
Submit for approval
Approve/Reject
Publish
Clone from another year/grade/semester
Export
Validations
Subject/Course mandatory
≥1 chapter/unit required
Every chapter/unit must map to ≥1 outcome
Every outcome must map to ≥1 assessment type
No publish without approval
Outputs/States
Draft / Submitted / Approved / Published / Archived

B2. Lesson Plan / Teaching Plan Screen
Purpose: Plan instruction aligned to curriculum.
Users: Teachers (School), Faculty (College optional).
Shared Fields
Linked chapter/unit
Learning outcomes (auto-pulled)
Objectives
Methodology
Materials
Evaluation criteria
Duration/date/period
School Differences
Mandatory weekly/period-wise lesson plans
Calendar linked to class timetable
College Differences
Often course-session plan, not daily mandatory
Can be optional per institution
Actions
Create/edit
Save draft
Publish/share
Reuse from library
Attach resources
Validations
Objectives + linked chapter/unit mandatory
Evaluation criteria mandatory

B3. Assessment / Exam Management (Master Pipeline)
Purpose: End-to-end assessment workflows.
Users: Admin, Exam cell, Teachers/Faculty.
Shared Pipeline Stages
1.Create assessment/exam
2.Timetable/schedule
3.Invigilation/assessor assignment
4.Mark entry
5.Moderation
6.Publish results

B3.1 Create Assessment Screen
Fields
Assessment type
Academic year
School: Grade/Class + Section
College: Dept + Program + Semester
Subject/Course(s)
Duration
Total marks + pass marks
Instructions
Syllabus coverage (chapter/unit picker)
Actions
Save draft
Submit to exam cell/admin
Approve
Validations
Type + class/semester + subject mandatory
No duplicate exam for same type/date window

B3.2 Timetable / Schedule Screen
Fields
Subject/Course
Date
Start/end time
Room/venue (optional)
Batch/section
Practical lab slot (college)
Actions
Add/edit slots
Auto-generate (optional)
Detect conflicts
Publish timetable
Validations
No overlaps for class/semester
Room conflict warnings

B3.3 Invigilation / Assessor Assignment Screen
Fields
Exam session
Invigilator/assessor name
Room
Duty time
Actions
Auto suggest
Manual assign
Swap/replace
Export duty list
Validations
Faculty/teacher availability check (if enabled)

B3.4 Mark Entry Screen
Shared Fields
Student list (auto)
Marks obtained
Absent/exempt flags
Remarks (optional)
School Differences
Per subject per class
College Differences
Marks → grade conversion
Credit effects
IA lock dates
Actions
Save
Submit
Bulk upload
Lock after submission
Validations
Marks 0–max
All students accounted before submit

B3.5 Moderation / Review Screen
Fields
Distribution analytics
Student-wise edits
Reason for change
Revaluation/grace (college)
Actions
Approve marks
Return to teacher/faculty
Apply moderation
Audit log view
Validations
Any change requires reason
Role-restricted moderation rights

B3.6 Publish Results Screen
Shared Fields
Exam selector
Publish scope (class/semester/subject)
Publish date
Outputs
Result sheets
Student report cards (school)
Grade cards (college)
Validations
Cannot publish before moderation done

C. School-Only Screens

C1. Class & Section Management
Purpose: Setup school’s grade/section structure.
Users: Admin.
Fields
Grade
Section labels
Class teacher assignment
Student capacity
Actions
Add/edit/merge sections
Assign class teachers
Validations
Unique grade-section

C2. Academic Coverage Tracker
Purpose: Monitor curriculum vs lesson plan progress.
Users: Admin, Academic head.
Sections
Subject progress bars
Chapter completion
Outcome coverage
Upcoming backlog
Actions
Filter by grade/subject
Export coverage report

D. College-Only Screens

D1. Department Management Screen
Purpose: Create/manage departments.
Users: College admin, Registrar.
Fields
Department name/code
Programs offered
HoD assignment
Status
Actions
Add/edit
Activate/deactivate
View dept dashboard
Validations
Unique code
One HoD per active dept

D2. Course Mapping & Credit Setup
Purpose: Map courses to programs/semesters with credits.
Users: Admin, HoD.
Fields
Department
Program
Semester
Course code/title
Credits
Type: Core / Dept elective / Open elective
Faculty allocation
Capacity (for electives)
Actions
Add/edit
Clone semester structure
Elective basket setup
Lock mapping after semester start
Validations
Credits mandatory
Faculty workload limit check

D3. Student Admission & Semester Lifecycle
Purpose: Manage college admissions + progression.
Users: Admin, Dept office.
Pipeline Status
Applied → Verified → Approved → Enrolled → Active → Graduated → Alumni
Fields
Personal+contact
Program/department
Category/quota
Documents upload
Roll number rules
Semester history auto-generated
Actions
Approve/reject
Bulk import
Promote to next semester
Mark graduation
Validations
Mandatory docs before approval
Promotion blocked if rules fail (credits/backlogs)

D4. Graduation Eligibility Screen
Purpose: Certify graduation readiness.
Users: Admin, Exam cell, HoD.
Fields
Credits required vs earned
Backlog list
CGPA
Eligibility flag
Actions
Generate eligibility list
Override with reason
Mark graduated
Push to alumni
Validations
Only eligible students can be marked graduated

D5. Transcript Generation Screen
Purpose: Produce official transcripts.
Users: Exam cell/admin.
Fields
Student selector
Transcript type: Provisional / Final
Template selection
Semester inclusion range
QR/verification id toggle
Actions
Generate PDF
Review
Approve
Publish/download
Batch generation per dept/batch
Validations
Only after final results published
Template mandatory

D6. Training & Skill Development
D6.1 Skill Course Master
Fields
Course name
Provider
Duration
Certification type
Credits (optional)
Actions
Add/edit
Activate/deactivate

D6.2 Skill Allocation Screen
Fields
Dept/program/semester
Batch or student list
Mandatory/elective flag
Actions
Allocate
Reassign
Export allocations
Validations
No double allocation unless allowed

D6.3 Skill Progress Tracker
Fields/Views
Student completion %
Assessment scores
Attendance (if required)
Incomplete list
Actions
Update progress
Bulk upload
Export

D6.4 Feedback & Certification
Fields
Student feedback form
Trainer feedback
Certificate template
Actions
Collect feedback
Generate certificates
Batch download

D7. Placement Management
D7.1 Company Registration
Fields
Company name, industry
Contacts
Eligibility criteria templates
MoU/JD upload
Status
Actions
Approve company
Activate/deactivate/blacklist
View history

D7.2 Job Post & Application Tracker
Fields
Role, package
Eligibility filters (CGPA, dept, skills)
Rounds schedule
Intake
Actions
Publish job post
Auto-list eligible students
Track stage changes
Export shortlist
Validations
Eligibility mandatory
Round dates within placement window

D7.3 Placement Analytics
Views
Placement %
Offers per dept
Median/avg CTC
Internship conversions
Actions
Filter, export

D8. Mentor Allocation Screen
Purpose: Assign mentors and track interventions.
Users: HoD/Admin, Faculty mentors.
Fields
Mentor faculty
Student group/batch
Allocation period
Mentor View
At-risk flagged students
Notes (private)
Intervention outcomes
Actions
Allocate / reassign mentors
Log mentoring result
Validations
Mentor capacity limit (optional)

D9. Finance & Accounts
D9.1 Fee Structure Setup
Fields
Program
Semester/year
Category/quota
Fee heads
Due schedule
Actions
Add/edit
Bulk upload

D9.2 Student Fee Ledger
Fields
Student
Fee head wise due/paid
Scholarship/waiver
Receipt no.
Actions
Record payment
Generate receipt
Export defaulter list
Validations
Payment cannot exceed due for head

D9.3 Department Budget Setup
Fields
Dept
Budget head
Allocation amount
Period
Actions
Allocate
Approve dept request

D9.4 Expenditure Entry & Reports
Fields
Dept
Vendor
Amount
Category
Invoice upload
Date
Actions
Add/edit
Export planned vs actual
Validations
Cannot exceed budget unless override with reason

E. Settings / Masters (Shared + Variants)

E1. Academic Calendar Settings (Shared)
Fields
Academic year
Term/Semester windows
Holidays
Exam windows
IA windows (college)
PT windows (school)
Actions
Add/edit
Publish calendar
Lock

E2. Subject/Course Master
Shared Fields
Name
Code
Status
Category
School Variant
Subject mapped to grade
College Variant
Course mapped to dept/program + credits

E3. Assessment Type Master
Shared Fields
Type name
Category (internal/external/practical)
Active flag
School default list
Periodic test, Term, Skill, Practical
College default list
IA, Semester exam, Practical, Viva, Arrears

E4. Grading System Master
School
Marks → Grade bands optional
College
Mandatory grade points + SGPA/CGPA rules
Fields
Grade label
Min/max marks
Grade point (college)
Pass flag

E5. Attendance Policy Settings
School
Daily/period attendance
Class-level rules
College
Course-level attendance
Minimum % per course
Lab/practical separate thresholds

E6. Role & Permission Settings
Fields
Role name
Module access matrix (view/create/edit/approve/publish)
Scope rules:
oSchool: grade/section
oCollege: department/program
Actions
Create role
Edit permissions
Assign to users

Shared Components Library (for UI/Dev reuse)
You can define these once and reuse across both products:
1.Context Selector
oAcademic year + Grade/Semester + Subject/Course
2.Approval Workflow Widget
oDraft → Submitted → Approved → Published
3.Bulk Upload / Download
oStandard CSV template with error log export
4.Audit Log Drawer
o“changed by / when / reason / old vs new”
5.Filter Bar + Export Button
oStandard across reports & lists


uditorium" }
POST /api/v1/mentors/allocate

json
Copy code
{ "mentorUserId":"U7","studentIds":["ST1","ST2"],"period":{"from":"2025-06-01","to":"2026-03-31"} }
POST /api/v1/mentors/{mentorId}/notes

json
Copy code
{ "studentId":"ST1","note":"Attendance risk discussed","visibility":"PRIVATE" }
Rules
Mentor notes private by default.

Test Cases
Mentor sees only allocated students.

Non-mentor tries to read notes → 403.

SCR-COL-FIN-01 Finance & Accounts
Users: Finance Admin/College Admin.

APIs
POST /api/v1/finance/fee-structures

json
Copy code
{
  "programId":"BSC-CS",
  "semesterId":"S3",
  "category":"REGULAR",
  "feeHeads":[{"name":"Tuition","amount":25000},{"name":"Lab","amount":5000}],
  "dueSchedule":[{"dueDate":"2025-12-20","percent":50},{"dueDate":"2026-02-20","percent":50}]
}
GET /api/v1/finance/ledger?studentId=ST1

POST /api/v1/finance/payments

json
Copy code
{ "studentId":"ST1","feeHeadId":"FH1","amount":12500,"mode":"UPI","refNo":"TXN1" }
POST /api/v1/finance/department-budgets

json
Copy code
{ "departmentId":"CSE","period":"AY2025","amount":500000 }
POST /api/v1/finance/expenditures

json
Copy code
{ "departmentId":"CSE","category":"LAB_EQUIP","amount":80000,"invoiceFileId":"F9","date":"2025-12-01" }
Rules
Payment cannot exceed due.

Expenditure cannot exceed budget unless override with reason.

Test Cases
Overpay fee head → 422.

Expense beyond budget without override → 422.

Budget report shows planned vs actual correctly.

8. Settings / Masters
SCR-SET-01 Academic Calendar
Users: Admin.

APIs
POST /api/v1/settings/academic-calendars

json
Copy code
{
  "academicYearId":"AY2025",
  "type":"COLLEGE",
  "terms":[{"id":"S3","from":"2025-11-01","to":"2026-03-31"}],
  "examWindows":[{"type":"END_SEM","from":"2025-12-10","to":"2025-12-20"}]
}
Test Cases
Add overlapping semesters → 409.

Exam window outside term → 422.

SCR-SET-02 Assessment Type Master
Users: Admin.

APIs
POST /api/v1/settings/assessment-types

json
Copy code
{ "name":"Periodic Test","code":"PT","category":"INTERNAL","active":true }
Test Cases
Disable type in use → warning + block if published exams exist.

SCR-SET-03 Grading System
Users: Admin/Exam Cell.

APIs
POST /api/v1/settings/grading-scales

json
Copy code
{
  "type":"COLLEGE",
  "grades":[{"label":"A","min":80,"max":100,"point":9},{"label":"B","min":70,"max":79,"point":8}]
}
Test Cases
Gaps/overlaps in bands → 400.

CGPA computed per grade points.

9. End-to-End Regression Suite (Must Pass)
Curriculum → Lesson Plan → Exam → Results

Create Curriculum (DRAFT → APPROVED → PUBLISHED)

Create Lesson Plan linked to chapters

Create Exam mapped to outcomes

Enter marks → moderation → publish

Verify results visible in student report.

College Semester Flow

Admit student → enroll → attendance + IA marks

End-sem exams → publish grades

SGPA/CGPA computed

Graduation eligibility evaluates correctly

Transcript PDF generated.

Placement Flow

Register company → create job → allocate eligible students

Track rounds → offer stage

Analytics updated.

Finance Flow

Setup fee structure → post payment

Ledger updates → defaulter report accurate

Dept budget → expenditure → planned vs actual report.
