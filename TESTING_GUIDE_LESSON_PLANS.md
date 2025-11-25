# Testing Guide - Lesson Plans & Timetable

## Setup Mock Data

### Step 1: Apply Migrations
```bash
# Apply the schema first
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/lesson_plans_schema.sql

# Then apply mock data
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/mock_data_lesson_plans_timetable.sql
```

Or using Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `lesson_plans_schema.sql` → Run
3. Copy and paste `mock_data_lesson_plans_timetable.sql` → Run

---

## Mock Users Created

### 1. School Admin
- **Email:** `admin@springfield.edu`
- **Name:** John Admin
- **Role:** school_admin
- **Can:** Add teachers, approve lesson plans, manage timetables

### 2. Principal
- **Email:** `principal@springfield.edu`
- **Name:** Sarah Principal
- **Role:** principal
- **Can:** Approve lesson plans, full access

### 3. Mathematics Teacher
- **Email:** `robert.smith@springfield.edu`
- **Name:** Robert Smith
- **Role:** subject_teacher
- **Teaches:** Mathematics (10-A, 10-B, 10-C), Physics (11-A, 11-B)
- **Timetable:** 10 periods across Mon-Wed
- **Lesson Plans:** 1 draft, 1 submitted, 1 approved

### 4. English Teacher
- **Email:** `emily.johnson@springfield.edu`
- **Name:** Emily Johnson
- **Role:** subject_teacher
- **Teaches:** English (10-A, 10-C), Literature (11-A, 11-B)
- **Timetable:** 6 periods across Mon-Tue
- **Lesson Plans:** 1 submitted, 1 approved

### 5. Chemistry Teacher
- **Email:** `michael.brown@springfield.edu`
- **Name:** Michael Brown
- **Role:** subject_teacher
- **Teaches:** Chemistry (11-A, 11-B), Biology (11-A, 11-B)
- **Timetable:** 4 periods across Mon-Wed
- **Lesson Plans:** 1 rejected, 1 revision required

### 6. History Teacher
- **Email:** `lisa.davis@springfield.edu`
- **Name:** Lisa Davis
- **Role:** class_teacher
- **Teaches:** History, Geography
- **Timetable:** None yet

---

## Test Scenarios

### Scenario 1: Teacher Views Timetable

**Login as:** `robert.smith@springfield.edu`

**Steps:**
1. Navigate to `/educator/my-timetable`
2. **Expected Results:**
   - See 10 total periods per week
   - Monday: 4 classes (Math 10-A, Math 10-B, Physics 11-A, Physics 11-B)
   - Tuesday: 3 classes
   - Wednesday: 3 classes
   - No conflicts detected (green checkmark)
   - 1 lesson plan created (for Math 10-B)
   - Link to create lesson plans for other classes

**Verify:**
- [ ] Weekly overview grid shows all classes
- [ ] Daily schedule view works
- [ ] Day selector changes view
- [ ] Stats show correct numbers
- [ ] Lesson plan status badges visible

---

### Scenario 2: Teacher Creates Lesson Plan

**Login as:** `robert.smith@springfield.edu`

**Steps:**
1. Navigate to `/educator/lesson-plans`
2. Click "Create New"
3. Fill in form:
   - Title: "Trigonometry Basics"
   - Subject: "Mathematics"
   - Class: "10-A"
   - Date: Tomorrow's date
   - Learning Objectives: "Students will understand sin, cos, tan ratios"
4. Add Activity:
   - Description: "Introduction to trigonometry"
   - Type: "Lecture"
   - Duration: 15 minutes
5. Add Resource:
   - Name: "Trigonometry Textbook"
   - Type: "Textbook"
6. Click "Submit for Approval"

**Expected Results:**
- Success message appears
- Redirected to lesson plans list
- New plan shows with "Submitted" status
- Plan appears in pending approvals for coordinator

**Verify:**
- [ ] Form validation works (try submitting without required fields)
- [ ] Can add multiple activities
- [ ] Can add multiple resources
- [ ] "Save as Draft" works
- [ ] "Submit for Approval" works

---

### Scenario 3: Teacher Views Lesson Plans List

**Login as:** `robert.smith@springfield.edu`

**Steps:**
1. Navigate to `/educator/lesson-plans`
2. View lesson plans list

**Expected Results:**
- See 3 lesson plans:
  - "Introduction to Quadratic Equations" - Draft
  - "Newton's Laws of Motion" - Submitted
  - "Algebraic Expressions and Simplification" - Approved
- Stats show: 3 total, 1 draft, 1 submitted, 1 approved
- Can filter by status
- Can edit draft plan
- Can delete draft plan
- Cannot edit submitted/approved plans

**Verify:**
- [ ] All lesson plans visible
- [ ] Status badges correct
- [ ] Filter works
- [ ] Edit button only on drafts
- [ ] Delete button only on drafts
- [ ] View button works for all

---

### Scenario 4: Coordinator Approves Lesson Plan

**Login as:** `principal@springfield.edu` or `admin@springfield.edu`

**Steps:**
1. Navigate to `/school-admin/lesson-plans/approvals`
2. See pending approvals list
3. Click on "Newton's Laws of Motion" by Robert Smith
4. Review details:
   - Learning objectives
   - Activities (4 activities)
   - Resources (4 resources)
5. Add review comment: "Excellent lesson plan! Well structured."
6. Click "Approve"

**Expected Results:**
- Success message
- Plan removed from pending list
- Plan status changes to "approved"
- Teacher sees approved status in their list
- Plan automatically added to teacher's journal

**Verify:**
- [ ] Pending count decreases
- [ ] Plan details visible
- [ ] Can add comments
- [ ] Approve button works
- [ ] Teacher sees updated status

---

### Scenario 5: Coordinator Requests Revision

**Login as:** `principal@springfield.edu`

**Steps:**
1. Navigate to `/school-admin/lesson-plans/approvals`
2. Click on "Chemical Reactions and Equations" by Michael Brown
3. Add review comment: "Please add safety guidelines and more specific objectives"
4. Click "Request Revision"

**Expected Results:**
- Plan status changes to "revision_required"
- Teacher sees feedback in lesson plans list
- Plan stays in pending approvals with "Revision" badge
- Teacher can edit and resubmit

**Verify:**
- [ ] Status updates correctly
- [ ] Comments visible to teacher
- [ ] Plan remains editable for teacher
- [ ] Can resubmit after editing

---

### Scenario 6: Coordinator Rejects Lesson Plan

**Login as:** `principal@springfield.edu`

**Steps:**
1. Navigate to `/school-admin/lesson-plans/approvals`
2. Click on a submitted plan
3. Add review comment: "Learning objectives are too vague. Please rewrite."
4. Click "Reject"

**Expected Results:**
- Plan status changes to "rejected"
- Plan removed from pending approvals
- Teacher sees rejection with feedback
- Teacher can create new plan

**Verify:**
- [ ] Cannot reject without comments
- [ ] Status updates correctly
- [ ] Feedback visible to teacher
- [ ] Plan removed from pending list

---

### Scenario 7: Check Timetable Conflicts

**Login as:** `admin@springfield.edu`

**Steps:**
1. Navigate to `/school-admin/teachers/timetable`
2. Select Robert Smith
3. Try to add a slot that conflicts:
   - Day: Monday
   - Period: 1 (already has Math 10-A)
   - Class: 10-D
   - Subject: Mathematics

**Expected Results:**
- Conflict detected
- Warning message appears
- Workload calculation updates
- Conflict appears in conflicts table

**Verify:**
- [ ] Conflict detection works
- [ ] Cannot create double bookings
- [ ] Workload updates automatically
- [ ] Conflicts visible in teacher's timetable view

---

### Scenario 8: Teacher Journal Auto-Population

**Login as:** `robert.smith@springfield.edu`

**Steps:**
1. Create and submit a lesson plan
2. Have coordinator approve it
3. Check if it appears in journal

**Expected Results:**
- Approved lesson plan automatically creates journal entry
- Journal entry has lesson plan linked
- Can add reflection, engagement, challenges

**Verify:**
- [ ] Journal entry created automatically
- [ ] Lesson plan linked correctly
- [ ] Can add reflection notes
- [ ] Date matches lesson plan date

---

## Mock Data Summary

### Teachers: 6
- 1 School Admin
- 1 Principal
- 4 Subject/Class Teachers

### Timetable Slots: ~20
- Robert Smith: 10 periods
- Emily Johnson: 6 periods
- Michael Brown: 4 periods

### Lesson Plans: 7
- 1 Draft
- 2 Submitted (pending approval)
- 2 Approved
- 1 Rejected
- 1 Revision Required

### Journal Entries: 2
- For approved lesson plans

---

## Quick Verification Queries

### Check All Teachers
```sql
SELECT teacher_id, first_name, last_name, role, email 
FROM teachers 
ORDER BY teacher_id;
```

### Check Lesson Plans by Status
```sql
SELECT 
  lp.title,
  t.first_name || ' ' || t.last_name as teacher,
  lp.status,
  lp.submitted_at
FROM lesson_plans lp
JOIN teachers t ON lp.teacher_id = t.id
ORDER BY lp.status, lp.submitted_at DESC;
```

### Check Teacher Workload
```sql
SELECT 
  t.teacher_id,
  t.first_name || ' ' || t.last_name as teacher,
  tw.total_periods_per_week,
  tw.max_consecutive_classes
FROM teachers t
LEFT JOIN teacher_workload tw ON t.id = tw.teacher_id
ORDER BY tw.total_periods_per_week DESC NULLS LAST;
```

### Check Timetable View
```sql
SELECT * FROM teacher_weekly_timetable
WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
ORDER BY day_of_week, period_number;
```

---

## Troubleshooting

### Issue: No lesson plans showing
**Solution:** Check if teacher_id matches in lesson_plans table
```sql
SELECT id, email FROM teachers WHERE email = 'robert.smith@springfield.edu';
SELECT * FROM lesson_plans WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

### Issue: Timetable not showing
**Solution:** Check if timetable is published
```sql
SELECT * FROM timetables WHERE status = 'published';
SELECT * FROM timetable_slots WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

### Issue: Cannot approve lesson plans
**Solution:** Check user role and permissions
```sql
SELECT role FROM teachers WHERE email = 'principal@springfield.edu';
```

### Issue: Workload not calculating
**Solution:** Run workload calculation manually
```sql
SELECT calculate_teacher_workload(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'tttttttt-tttt-tttt-tttt-tttttttttttt'
);
```

---

## Test Checklist

### Lesson Plans
- [ ] Create lesson plan (draft)
- [ ] Create lesson plan (submit)
- [ ] View lesson plans list
- [ ] Filter by status
- [ ] Edit draft plan
- [ ] Delete draft plan
- [ ] View submitted plan (read-only)
- [ ] See review feedback

### Approvals
- [ ] View pending approvals
- [ ] Review lesson plan details
- [ ] Approve with comments
- [ ] Reject with comments
- [ ] Request revision with comments
- [ ] See stats update

### Timetable
- [ ] View weekly timetable
- [ ] View daily schedule
- [ ] Switch between days
- [ ] See lesson plan integration
- [ ] Check conflict detection
- [ ] View workload stats

### Integration
- [ ] Approved plans appear in journal
- [ ] Timetable shows lesson plan status
- [ ] Can create plan from timetable
- [ ] Workload calculates correctly
- [ ] Conflicts detected automatically

---

## Success Criteria

✅ All mock data inserted successfully  
✅ Teachers can view their timetables  
✅ Teachers can create and submit lesson plans  
✅ Coordinators can approve/reject lesson plans  
✅ Conflicts are detected automatically  
✅ Workload is calculated correctly  
✅ Journal entries are auto-created  
✅ All acceptance criteria met  

**Ready for testing!** 🚀
