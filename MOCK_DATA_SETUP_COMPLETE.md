# Mock Data Setup - Complete Guide

## 📦 Files Created

### 1. Mock Data SQL
**File:** `supabase/migrations/mock_data_lesson_plans_timetable.sql`

**Contains:**
- 2 Schools (Springfield High School, Riverside Academy)
- 6 Teachers with different roles
- 1 Published timetable (2024-2025 Term 1)
- 20+ Timetable slots across 3 teachers
- 7 Lesson plans (all statuses: draft, submitted, approved, rejected, revision)
- 2 Teacher journal entries
- Automatic workload calculations
- Conflict detection

### 2. Testing Guide
**File:** `TESTING_GUIDE_LESSON_PLANS.md`

**Contains:**
- Detailed test scenarios
- Step-by-step instructions
- Expected results for each test
- Verification queries
- Troubleshooting tips

### 3. Setup Scripts
**Files:** 
- `setup-mock-data.sh` (Linux/Mac)
- `setup-mock-data.bat` (Windows)

**Features:**
- Automated migration application
- Mock data insertion
- Connection validation
- Success confirmation

---

## 🚀 Quick Setup

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project
   - Click "SQL Editor" in sidebar

2. **Run Migrations in Order:**
   
   **a) Teacher Management Schema**
   ```sql
   -- Copy and paste content from:
   supabase/migrations/teacher_management_schema.sql
   -- Click "Run"
   ```

   **b) Role-Based Permissions**
   ```sql
   -- Copy and paste content from:
   supabase/migrations/role_based_permissions.sql
   -- Click "Run"
   ```

   **c) Lesson Plans Schema**
   ```sql
   -- Copy and paste content from:
   supabase/migrations/lesson_plans_schema.sql
   -- Click "Run"
   ```

   **d) Mock Data**
   ```sql
   -- Copy and paste content from:
   supabase/migrations/mock_data_lesson_plans_timetable.sql
   -- Click "Run"
   ```

3. **Verify Installation**
   ```sql
   -- Check teachers
   SELECT COUNT(*) FROM teachers;
   -- Should return: 6

   -- Check lesson plans
   SELECT COUNT(*) FROM lesson_plans;
   -- Should return: 7

   -- Check timetable slots
   SELECT COUNT(*) FROM timetable_slots;
   -- Should return: 20+
   ```

### Option 2: Using Command Line

**Linux/Mac:**
```bash
chmod +x setup-mock-data.sh
./setup-mock-data.sh
```

**Windows:**
```cmd
setup-mock-data.bat
```

---

## 👥 Mock Users

### 1. School Admin
```javascript
{
  email: "admin@springfield.edu",
  name: "John Admin",
  role: "school_admin"
}
```
**Can:**
- Add teachers
- Approve lesson plans
- Manage timetables
- Full access to all features

### 2. Principal
```javascript
{
  email: "principal@springfield.edu",
  name: "Sarah Principal",
  role: "principal"
}
```
**Can:**
- Approve lesson plans
- Full administrative access
- Same as School Admin

### 3. Mathematics Teacher
```javascript
{
  email: "robert.smith@springfield.edu",
  name: "Robert Smith",
  role: "subject_teacher"
}
```
**Has:**
- 10 periods per week
- Teaches: Math (10-A, 10-B, 10-C), Physics (11-A, 11-B)
- 3 lesson plans (1 draft, 1 submitted, 1 approved)
- Timetable: Mon-Wed

### 4. English Teacher
```javascript
{
  email: "emily.johnson@springfield.edu",
  name: "Emily Johnson",
  role: "subject_teacher"
}
```
**Has:**
- 6 periods per week
- Teaches: English (10-A, 10-C), Literature (11-A, 11-B)
- 2 lesson plans (1 submitted, 1 approved)
- Timetable: Mon-Tue

### 5. Chemistry Teacher
```javascript
{
  email: "michael.brown@springfield.edu",
  name: "Michael Brown",
  role: "subject_teacher"
}
```
**Has:**
- 4 periods per week
- Teaches: Chemistry (11-A, 11-B), Biology (11-A, 11-B)
- 2 lesson plans (1 rejected, 1 revision required)
- Timetable: Mon, Wed

### 6. History Teacher
```javascript
{
  email: "lisa.davis@springfield.edu",
  name: "Lisa Davis",
  role: "class_teacher"
}
```
**Has:**
- No timetable yet
- Can view timetables only
- No lesson plans yet

---

## 🧪 Testing in Browser

### Step 1: Set User in localStorage

Open browser console (F12) and run:

**For Teacher (Robert Smith):**
```javascript
localStorage.setItem('user', JSON.stringify({
  email: 'robert.smith@springfield.edu',
  name: 'Robert Smith',
  role: 'subject_teacher'
}));
localStorage.setItem('userEmail', 'robert.smith@springfield.edu');
location.reload();
```

**For School Admin:**
```javascript
localStorage.setItem('user', JSON.stringify({
  email: 'admin@springfield.edu',
  name: 'John Admin',
  role: 'school_admin'
}));
localStorage.setItem('userEmail', 'admin@springfield.edu');
location.reload();
```

**For Principal:**
```javascript
localStorage.setItem('user', JSON.stringify({
  email: 'principal@springfield.edu',
  name: 'Sarah Principal',
  role: 'principal'
}));
localStorage.setItem('userEmail', 'principal@springfield.edu');
location.reload();
```

### Step 2: Navigate to Pages

**Teacher Pages:**
- `/educator/my-timetable` - View weekly schedule
- `/educator/lesson-plans` - View all lesson plans
- `/educator/lesson-plans/create` - Create new lesson plan

**Admin Pages:**
- `/school-admin/lesson-plans/approvals` - Approve lesson plans
- `/school-admin/teachers/timetable` - Manage timetables
- `/school-admin/teachers/list` - View all teachers

---

## 📊 Mock Data Details

### Lesson Plans (7 total)

#### 1. Draft
- **Title:** Introduction to Quadratic Equations
- **Teacher:** Robert Smith
- **Subject:** Mathematics
- **Class:** 10-A
- **Status:** draft
- **Can:** Edit, Delete, Submit

#### 2. Submitted (Pending Approval)
- **Title:** Newton's Laws of Motion
- **Teacher:** Robert Smith
- **Subject:** Physics
- **Class:** 11-A
- **Status:** submitted
- **Can:** View, Approve/Reject (by coordinator)

#### 3. Submitted (Pending Approval)
- **Title:** Shakespeare's Romeo and Juliet - Act 1
- **Teacher:** Emily Johnson
- **Subject:** English
- **Class:** 10-A
- **Status:** submitted
- **Can:** View, Approve/Reject (by coordinator)

#### 4. Approved
- **Title:** Algebraic Expressions and Simplification
- **Teacher:** Robert Smith
- **Subject:** Mathematics
- **Class:** 10-B
- **Status:** approved
- **Has:** Journal entry, Review comments

#### 5. Approved
- **Title:** Essay Writing: Introduction and Thesis Statements
- **Teacher:** Emily Johnson
- **Subject:** English
- **Class:** 10-C
- **Status:** approved
- **Has:** Journal entry, Review comments

#### 6. Rejected
- **Title:** Basic Chemistry Concepts
- **Teacher:** Michael Brown
- **Subject:** Chemistry
- **Class:** 11-A
- **Status:** rejected
- **Has:** Detailed feedback on why rejected

#### 7. Revision Required
- **Title:** Chemical Reactions and Equations
- **Teacher:** Michael Brown
- **Subject:** Chemistry
- **Class:** 11-B
- **Status:** revision_required
- **Has:** Feedback on what needs improvement

### Timetable Slots

**Robert Smith (Math Teacher):**
- Monday: 4 periods (Math 10-A, Math 10-B, Physics 11-A, Physics 11-B)
- Tuesday: 3 periods (Math 10-C, Math 10-A, Physics 11-A)
- Wednesday: 3 periods (Math 10-B, Math 10-C, Physics 11-B)
- **Total:** 10 periods/week

**Emily Johnson (English Teacher):**
- Monday: 3 periods (English 10-A, English 10-B, Literature 11-A)
- Tuesday: 3 periods (English 10-C, English 10-A, Literature 11-B)
- **Total:** 6 periods/week

**Michael Brown (Chemistry Teacher):**
- Monday: 2 periods (Chemistry 11-A, Chemistry 11-B)
- Wednesday: 2 periods (Biology 11-A, Biology 11-B)
- **Total:** 4 periods/week

---

## ✅ Verification Checklist

After setup, verify:

### Database
- [ ] 6 teachers exist
- [ ] 20+ timetable slots exist
- [ ] 7 lesson plans exist
- [ ] 2 journal entries exist
- [ ] Workload calculated for 3 teachers
- [ ] No conflicts detected

### Teacher Features
- [ ] Can view timetable
- [ ] Can see lesson plan status
- [ ] Can create lesson plan
- [ ] Can submit for approval
- [ ] Can edit draft plans
- [ ] Can see feedback

### Coordinator Features
- [ ] Can see pending approvals (2 plans)
- [ ] Can view lesson plan details
- [ ] Can approve plans
- [ ] Can reject plans
- [ ] Can request revisions
- [ ] Comments are saved

### Integration
- [ ] Approved plans appear in journal
- [ ] Timetable shows lesson plan status
- [ ] Workload calculates correctly
- [ ] Conflicts detected automatically

---

## 🔍 Verification Queries

### Check All Data
```sql
-- Teachers
SELECT teacher_id, first_name, last_name, role, email FROM teachers;

-- Lesson Plans
SELECT title, status, submitted_at FROM lesson_plans ORDER BY status;

-- Timetable Slots
SELECT 
  t.teacher_id,
  t.first_name || ' ' || t.last_name as teacher,
  COUNT(ts.id) as periods
FROM teachers t
LEFT JOIN timetable_slots ts ON t.id = ts.teacher_id
GROUP BY t.id, t.teacher_id, t.first_name, t.last_name;

-- Workload
SELECT 
  t.teacher_id,
  tw.total_periods_per_week,
  tw.max_consecutive_classes
FROM teachers t
JOIN teacher_workload tw ON t.id = tw.teacher_id;
```

### Check Specific Teacher
```sql
-- Robert Smith's timetable
SELECT * FROM teacher_weekly_timetable
WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
ORDER BY day_of_week, period_number;

-- Robert Smith's lesson plans
SELECT title, status, date FROM lesson_plans
WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## 🐛 Troubleshooting

### Issue: No data showing in UI

**Check 1: Verify data exists**
```sql
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM lesson_plans;
SELECT COUNT(*) FROM timetable_slots;
```

**Check 2: Verify user email matches**
```sql
SELECT id, email FROM teachers WHERE email = 'robert.smith@springfield.edu';
```

**Check 3: Check localStorage**
```javascript
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('userEmail'));
```

### Issue: Cannot approve lesson plans

**Check role:**
```sql
SELECT role FROM teachers WHERE email = 'principal@springfield.edu';
```

**Set correct role in localStorage:**
```javascript
localStorage.setItem('user', JSON.stringify({
  email: 'principal@springfield.edu',
  role: 'principal'
}));
```

### Issue: Timetable not showing

**Check timetable status:**
```sql
SELECT * FROM timetables WHERE status = 'published';
```

**Check slots exist:**
```sql
SELECT COUNT(*) FROM timetable_slots WHERE teacher_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
```

---

## 📝 Summary

✅ **Mock Data Includes:**
- 6 Teachers (various roles)
- 20+ Timetable slots
- 7 Lesson plans (all statuses)
- 2 Journal entries
- Workload calculations
- Conflict detection

✅ **Ready to Test:**
- Lesson plan creation
- Lesson plan approval workflow
- Timetable viewing
- Conflict detection
- Journal integration
- Role-based permissions

✅ **Test Scenarios:**
- Teacher creates lesson plan
- Teacher views timetable
- Coordinator approves plan
- Coordinator rejects plan
- Coordinator requests revision
- Workload calculation
- Conflict detection

**Everything is ready for comprehensive testing!** 🎉

See `TESTING_GUIDE_LESSON_PLANS.md` for detailed test scenarios and step-by-step instructions.
