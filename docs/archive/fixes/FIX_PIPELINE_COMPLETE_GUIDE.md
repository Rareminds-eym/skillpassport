# 🔧 COMPLETE FIX: Student Applications Not Showing in Recruiter Pipeline

## 🐛 Problem
When students apply to jobs:
- ✅ Application is saved to `applied_jobs` table
- ✅ Message shows "Your application is under review"
- ❌ Student does NOT appear in recruiter's pipeline dashboard
- ❌ Application details don't show pipeline status
- ❌ Error: "Data is present" but nothing displays

## 🔍 Root Cause
The database is missing the automatic link between applications and the recruitment pipeline:
1. No `requisition_id` column in `opportunities` table
2. No trigger to auto-add applicants to `pipeline_candidates` table
3. `StudentPipelineService` can't match applications to pipeline data

## ✅ Complete Solution

### Step 1: Run the Database Fix Script

Open your **Supabase SQL Editor** and run this file:

```
database/fix_pipeline_integration_complete.sql
```

**What it does:**
1. ✅ Adds `requisition_id` column to `opportunities`
2. ✅ Creates requisitions for all existing opportunities
3. ✅ Links each opportunity to its requisition
4. ✅ Creates the auto-add trigger function
5. ✅ Creates the trigger on `applied_jobs` table
6. ✅ Syncs all existing applications to pipeline
7. ✅ Creates a helpful view for diagnostics

**Expected output:**
```
Sync complete! Synced: X, Skipped: Y, Errors: 0

Metric                              Count
-----------------------------------  -----
1. Total Opportunities               50
2. Opportunities with Requisition    50
3. Total Applications                25
4. Applications in Pipeline          25
5. Total Pipeline Candidates         30
```

### Step 2: Verify the Fix

Run the diagnostic script:
```
database/check_pipeline_trigger_status.sql
```

You should see:
- ✅ Trigger `trigger_auto_add_to_pipeline` exists
- ✅ Function `auto_add_applicant_to_pipeline` exists
- ✅ All opportunities have `requisition_id`
- ✅ All recent applications appear in pipeline

### Step 3: Test the Integration

#### Option A: Run the Test Script (Recommended)
```bash
node test-pipeline-integration.js
```

This will verify:
- Opportunities are linked to requisitions
- Applications are mapped to pipeline
- StudentPipelineService can fetch data
- The view works correctly

#### Option B: Manual Test
1. **As a Student:**
   - Log in to the student portal
   - Go to Opportunities page
   - Apply to any job
   - Go to Applications page
   - **Check:** Application should show "Sourced" stage in pipeline section

2. **As a Recruiter:**
   - Log in to recruiter dashboard
   - Go to Pipeline page
   - **Check:** The student should appear in "Sourced" column
   - Try moving them to "Screening" stage
   
3. **Back as Student:**
   - Refresh Applications page
   - **Check:** Pipeline stage should update to "Screening"

## 📋 How It Works Now

### When a Student Applies:
```
1. Student clicks "Apply" on opportunity
   ↓
2. INSERT into applied_jobs
   ↓
3. TRIGGER fires → auto_add_applicant_to_pipeline()
   ↓
4. Function checks:
   - Does opportunity have requisition_id? ✅
   - Is student already in pipeline? (No duplicates)
   ↓
5. INSERT into pipeline_candidates
   - stage: 'sourced'
   - source: 'direct_application'
   - status: 'active'
   ↓
6. Student appears in recruiter's pipeline immediately!
```

### When Student Views Applications:
```
1. Applications.jsx loads
   ↓
2. Calls StudentPipelineService.getStudentApplicationsWithPipeline()
   ↓
3. Service JOINs:
   applied_jobs ← opportunities ← pipeline_candidates
   (using requisition_id)
   ↓
4. Returns combined data with pipeline status
   ↓
5. UI shows: Stage, Next Action, Interviews, etc.
```

## 🧪 Verification Queries

### Check a specific student's applications and pipeline status:
```sql
SELECT 
  application_id,
  student_name,
  job_title,
  application_status,
  is_in_pipeline,
  pipeline_stage,
  pipeline_source
FROM student_applications_with_pipeline
WHERE student_email = 'student@example.com'
ORDER BY applied_at DESC;
```

### Check recent pipeline additions from applications:
```sql
SELECT 
  pc.candidate_name,
  pc.stage,
  pc.source,
  r.title as job_title,
  pc.added_at
FROM pipeline_candidates pc
JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.source = 'direct_application'
ORDER BY pc.added_at DESC
LIMIT 20;
```

### Check if trigger is active:
```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_add_to_pipeline'
  AND event_object_table = 'applied_jobs';
```

## 🚨 Troubleshooting

### Problem: Applications still not showing in pipeline

**Solution 1:** Check if opportunities have requisition_id
```sql
SELECT id, job_title, requisition_id
FROM opportunities
WHERE requisition_id IS NULL
LIMIT 10;
```
If you see NULL values, run the fix script again.

**Solution 2:** Check if trigger fired
```sql
-- Check Supabase logs for trigger execution
-- Look for NOTICE messages like:
-- "Successfully added student X to pipeline for requisition Y"
```

**Solution 3:** Manually add to pipeline
```sql
-- For a specific application that didn't auto-add:
INSERT INTO pipeline_candidates (
  requisition_id,
  student_id,
  candidate_name,
  candidate_email,
  stage,
  source,
  status,
  added_at,
  stage_changed_at
)
SELECT
  o.requisition_id,
  aj.student_id,
  s.profile->>'name',
  s.profile->>'email',
  'sourced',
  'direct_application',
  'active',
  aj.applied_at,
  aj.applied_at
FROM applied_jobs aj
JOIN opportunities o ON o.id = aj.opportunity_id
JOIN students s ON s.id = aj.student_id
WHERE aj.id = 123 -- Replace with actual application ID
  AND NOT EXISTS (
    SELECT 1 FROM pipeline_candidates pc
    WHERE pc.requisition_id = o.requisition_id
      AND pc.student_id = aj.student_id
  );
```

### Problem: Duplicate pipeline entries

**Solution:** Remove duplicates
```sql
DELETE FROM pipeline_candidates pc1
WHERE EXISTS (
  SELECT 1 FROM pipeline_candidates pc2
  WHERE pc2.requisition_id = pc1.requisition_id
    AND pc2.student_id = pc1.student_id
    AND pc2.id < pc1.id
);
```

### Problem: "Permission denied" errors

**Solution:** Check RLS policies
```sql
-- Check current policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'pipeline_candidates';

-- If needed, temporarily disable RLS for testing:
ALTER TABLE pipeline_candidates DISABLE ROW LEVEL SECURITY;

-- Or run the RLS fix:
-- database/fix_pipeline_rls_policies.sql
```

## 📁 Files Reference

### Database Scripts:
- `database/fix_pipeline_integration_complete.sql` - **Main fix (RUN THIS)**
- `database/check_pipeline_trigger_status.sql` - Diagnostic queries
- `database/fix_pipeline_rls_policies.sql` - RLS policy fixes (if needed)

### Test Scripts:
- `test-pipeline-integration.js` - Automated test script

### Service Files:
- `src/services/appliedJobsService.js` - Handles applications
- `src/services/studentPipelineService.js` - Fetches pipeline data

### UI Files:
- `src/pages/student/Applications.jsx` - Student application view
- Recruiter pipeline pages - Shows pipeline_candidates

## ✅ Success Checklist

After applying the fix, verify:

- [ ] Ran `fix_pipeline_integration_complete.sql` successfully
- [ ] All opportunities have `requisition_id` (check with query)
- [ ] Trigger `trigger_auto_add_to_pipeline` exists
- [ ] Test application as student → appears in Applications page with pipeline stage
- [ ] Same application appears in recruiter's pipeline dashboard
- [ ] Application details show "Sourced" stage (or current stage)
- [ ] Moving student through pipeline stages reflects in student view
- [ ] No duplicate entries in pipeline_candidates
- [ ] No errors in Supabase logs

## 🎯 Expected Behavior After Fix

### Student Experience:
1. Apply to job → "Application submitted successfully!"
2. Go to Applications page → See application with:
   - Status badge (Applied, Under Review, etc.)
   - Pipeline section showing "Sourced" stage
   - Timeline with application date
3. When recruiter moves them → Stage updates automatically

### Recruiter Experience:
1. Student applies → Immediately appears in Pipeline
2. Shows in "Sourced" column with source: "Direct Application"
3. Can move student through stages (Sourced → Screening → Interview → Offer → Hired)
4. Can schedule interviews, add notes, rate candidates
5. All actions visible to student in their Applications view

## 🆘 Still Having Issues?

If the problem persists after following all steps:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Filter by "postgres" and look for errors
   - Search for "pipeline" or "trigger"

2. **Verify Database Structure:**
   ```sql
   -- Check if requisition_id exists
   \d opportunities
   
   -- Check if trigger exists
   \df auto_add_applicant_to_pipeline
   ```

3. **Manual Sync:**
   Run the sync function manually:
   ```sql
   SELECT * FROM sync_existing_applications_to_pipeline();
   ```

4. **Contact Support:**
   Share the output from:
   - `database/check_pipeline_trigger_status.sql`
   - `test-pipeline-integration.js`
   - Supabase error logs

## 📝 Notes

- The trigger only fires on **new applications** after it's created
- Existing applications are synced by the script automatically
- Students start at "sourced" stage when they apply
- Recruiters can then move them through the pipeline
- The trigger prevents duplicate entries automatically
- RLS policies ensure students only see their own data
- Recruiters see all pipeline candidates

---

**Last Updated:** November 3, 2025
**Status:** Ready to deploy ✅
