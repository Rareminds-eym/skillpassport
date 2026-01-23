# Pipeline Sync Fix - Applicants Not Showing in Pipeline

## Problem
Applicants appearing in the "Applicants List" page were not showing up in the "Pipelines" page, even though they showed a "Sourced" status.

## Root Cause
When students applied to jobs:
1. A record was created in `applied_jobs` table ✅
2. BUT no corresponding record was created in `pipeline_candidates` table ❌

The Pipelines page only shows candidates from the `pipeline_candidates` table, so applications weren't visible there.

## Solution - Two Parts

### Part 1: Fix for Future Applications
**File:** `src/services/appliedJobsService.js`

Updated the `applyToJob()` function to automatically create a pipeline candidate record when a student applies:

```javascript
// After inserting into applied_jobs, also insert into pipeline_candidates
await supabase
  .from('pipeline_candidates')
  .insert([{
    opportunity_id: opportunityId,
    student_id: studentId,
    candidate_name: profile.name || 'Unknown',
    candidate_email: profile.email || '',
    candidate_phone: profile.contact_number || '',
    stage: 'sourced',
    source: 'direct_application',
    status: 'active'
  }]);
```

### Part 2: Fix for Existing Applications
**File:** `sync-applications-to-pipeline.sql`

Run this SQL script in Supabase SQL Editor to sync all existing applications:

```sql
INSERT INTO pipeline_candidates (
  opportunity_id,
  student_id,
  candidate_name,
  candidate_email,
  stage,
  source,
  status
)
SELECT 
  aj.opportunity_id,
  aj.student_id,
  COALESCE(s.profile->>'name', 'Unknown'),
  COALESCE(s.profile->>'email', ''),
  'sourced',
  'direct_application',
  'active'
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM pipeline_candidates pc 
  WHERE pc.opportunity_id = aj.opportunity_id 
    AND pc.student_id = aj.student_id
);
```

## Steps to Fix

### Step 1: Run Database Migration
First, ensure the `opportunity_id` column exists:
```bash
# Run in Supabase SQL Editor
migrate-to-opportunities.sql
```

### Step 2: Sync Existing Applications
```bash
# Run in Supabase SQL Editor
sync-applications-to-pipeline.sql
```

### Step 3: Restart Application
```bash
npm run dev
```

## Expected Result

After these fixes:

### Applicants List Page
- Shows all applications from `applied_jobs` table
- Displays pipeline stage if exists in `pipeline_candidates`
- Shows "Unknown" status if not in pipeline

### Pipelines Page
- Shows all candidates from `pipeline_candidates` table
- Filtered by `opportunity_id` (selected from dropdown)
- Candidates appear in correct stage columns

### Data Flow
```
Student applies to job
       ↓
1. Record created in applied_jobs ✅
2. Record created in pipeline_candidates ✅ (NEW!)
       ↓
Visible in both:
- Applicants List (from applied_jobs)
- Pipelines (from pipeline_candidates)
```

## Verification

After running the fixes, verify:

1. **Check existing applications synced:**
```sql
SELECT COUNT(*) FROM pipeline_candidates 
WHERE source = 'direct_application';
```

2. **Check specific candidate (P.DURKADEVID):**
```sql
SELECT 
  pc.*,
  o.job_title,
  o.company_name
FROM pipeline_candidates pc
JOIN opportunities o ON pc.opportunity_id = o.id
WHERE pc.candidate_email LIKE '%durkadevi%';
```

3. **Test new application:**
   - Apply to a job as a student
   - Check Applicants List - should appear immediately
   - Check Pipelines - should appear in "Sourced" column

## Files Modified

1. ✅ `src/services/appliedJobsService.js` - Auto-create pipeline candidates
2. ✅ `src/pages/recruiter/ApplicantsList.tsx` - Use opportunity_id
3. ✅ `src/pages/recruiter/Pipelines.tsx` - Filter by opportunity_id
4. ✅ `src/services/studentPipelineService.js` - Use opportunity_id
5. ✅ `migrate-to-opportunities.sql` - Add opportunity_id column
6. ✅ `sync-applications-to-pipeline.sql` - Sync existing data

## Testing Checklist

- [ ] Run migration: `migrate-to-opportunities.sql`
- [ ] Run sync: `sync-applications-to-pipeline.sql`
- [ ] Restart dev server: `npm run dev`
- [ ] Check Applicants List shows candidates
- [ ] Check Pipelines shows same candidates
- [ ] Apply to new job and verify it appears in both places
- [ ] Move candidate between stages works
- [ ] Filter by opportunity in Applicants List works
- [ ] Select opportunity in Pipelines dropdown works
