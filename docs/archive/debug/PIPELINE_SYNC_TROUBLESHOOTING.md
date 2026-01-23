# Pipeline Sync Troubleshooting Guide

## Issue
You changed the status of applications to "sourced" in the Applicants List, but they're not showing up in the Recruiter Pipeline Management page.

## Root Cause

The **Applicants List** and **Pipeline Management** use **different data sources**:

1. **Applicants List** → Shows data from `applied_jobs` table
2. **Pipeline Management** → Shows data from `pipeline_candidates` table

When you update the status in the Applicants List, it updates the display in that component, but it doesn't automatically create records in the `pipeline_candidates` table that the Pipeline page uses.

## Why This Happens

Looking at the code in `ApplicantsList.tsx` (lines 194-260), when you move a candidate to a stage:

```typescript
const handleMoveToPipelineStage = async (applicant: Applicant, newStage: string) => {
  // If candidate is not in pipeline yet, add them first
  if (!applicant.pipeline_candidate_id) {
    // Creates new record in pipeline_candidates
    const { data: newCandidate, error: insertError } = await supabase
      .from('pipeline_candidates')
      .insert({
        opportunity_id: opportunityId,
        student_id: applicant.student_id,
        // ... other fields
      })
  }
}
```

However, this **only happens when you explicitly move them to a stage**. If you just update their status in the Applicants List, it doesn't trigger the pipeline creation.

## Solution

You have **3 options** to fix this:

---

### Option 1: Use the Debug Script (Quick Fix)

1. Open your browser console (F12) while on the Recruiter Dashboard
2. Copy and paste the content from `debug-pipeline-sync.js`
3. Run the script - it will:
   - Find the HVAC Engineer opportunity
   - Check which applications are missing from pipeline
   - Create a `syncMissingToPipeline()` function
4. Run `await window.syncMissingToPipeline();`
5. Refresh the Pipeline page

---

### Option 2: Run SQL Sync Script (Recommended)

Run this in your Supabase SQL Editor to sync ALL existing applications:

```sql
-- Sync all applications to pipeline_candidates
INSERT INTO pipeline_candidates (
  opportunity_id,
  student_id,
  candidate_name,
  candidate_email,
  candidate_phone,
  stage,
  source,
  status,
  added_at,
  stage_changed_at,
  created_at,
  updated_at
)
SELECT 
  aj.opportunity_id,
  aj.student_id,
  COALESCE(s.profile->>'name', s.name, 'Unknown'),
  COALESCE(s.profile->>'email', s.email, ''),
  COALESCE(s.profile->>'contact_number', ''),
  'sourced', -- Default stage
  'direct_application',
  'active',
  aj.applied_at,
  aj.applied_at,
  aj.applied_at,
  NOW()
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
WHERE NOT EXISTS (
  SELECT 1 
  FROM pipeline_candidates pc 
  WHERE pc.opportunity_id = aj.opportunity_id 
    AND pc.student_id = aj.student_id
)
AND aj.opportunity_id IS NOT NULL
AND aj.application_status NOT IN ('withdrawn', 'rejected');

-- Verify the sync
SELECT 
  COUNT(*) as total_synced,
  stage,
  source
FROM pipeline_candidates
WHERE source = 'direct_application'
GROUP BY stage, source;
```

---

### Option 3: Use the UI (Manual but Safe)

In the Applicants List page:

1. For each candidate you want in the pipeline
2. Click on the "Stage" dropdown
3. Select "Sourced" (or any other stage)
4. This will trigger the `handleMoveToPipelineStage` function
5. The candidate will be added to `pipeline_candidates`
6. They will now appear in Pipeline Management

---

## Verification

After running any of the above solutions, verify:

### 1. Check Pipeline Candidates Count
```sql
SELECT COUNT(*) 
FROM pipeline_candidates 
WHERE opportunity_id = YOUR_HVAC_OPPORTUNITY_ID;
```

### 2. Check Specific Opportunity
```sql
SELECT 
  pc.candidate_name,
  pc.candidate_email,
  pc.stage,
  pc.status,
  o.job_title,
  o.company_name
FROM pipeline_candidates pc
JOIN opportunities o ON pc.opportunity_id = o.id
WHERE o.job_title ILIKE '%HVAC%'
  AND o.location ILIKE '%Mumbai%';
```

### 3. In the UI
1. Go to Pipeline Management
2. Select "HVAC Engineer • Mumbai • Blue Star" from the dropdown
3. Click the "🔄 Refresh" button
4. You should see candidates in the "Sourced" column

---

## Prevention - Make Future Applications Auto-Sync

The code in `src/services/appliedJobsService.js` already tries to auto-sync new applications:

```javascript
// When student applies to job
static async applyToJob(studentId, opportunityId) {
  // Insert into applied_jobs
  const { data, error } = await supabase
    .from('applied_jobs')
    .insert([{ student_id: studentId, opportunity_id: opportunityId }])
    .select()
    .single();

  // Automatically add to pipeline
  await supabase
    .from('pipeline_candidates')
    .insert([{
      opportunity_id: opportunityId,
      student_id: studentId,
      stage: 'sourced',
      source: 'direct_application',
      status: 'active'
    }]);
}
```

However, for **existing** applications that were created before this code was added, you need to run one of the sync options above.

---

## Common Issues

### Issue: "0 candidates in pipeline" even after sync

**Possible causes:**
1. Wrong opportunity selected in dropdown
2. Candidates have `status = 'inactive'` 
3. Candidates are in a different stage than "Sourced"

**Solution:**
```sql
-- Check all candidates for this opportunity
SELECT stage, status, COUNT(*) 
FROM pipeline_candidates 
WHERE opportunity_id = YOUR_OPPORTUNITY_ID
GROUP BY stage, status;
```

---

### Issue: Duplicate candidates after running sync

**Cause:** Running the sync script multiple times

**Solution:** The SQL script has a `WHERE NOT EXISTS` check to prevent duplicates, but if you want to clean up:

```sql
-- Remove duplicates, keeping the most recent one
DELETE FROM pipeline_candidates a
USING pipeline_candidates b
WHERE a.opportunity_id = b.opportunity_id
  AND a.student_id = b.student_id
  AND a.id < b.id; -- Keep the one with higher ID (more recent)
```

---

## Quick Reference

| Page | Data Source | Purpose |
|------|-------------|---------|
| Applicants List | `applied_jobs` | Track all applications |
| Pipeline Management | `pipeline_candidates` | Manage recruitment stages |

**Both tables should be in sync**, and the code tries to maintain this for new applications. For existing applications, run the sync script.

---

## Need Help?

If you're still not seeing candidates after trying all solutions:

1. Run the debug script: `debug-pipeline-sync.js`
2. Check the console output for specific errors
3. Check your Supabase RLS (Row Level Security) policies
4. Verify the opportunity ID matches between both tables
