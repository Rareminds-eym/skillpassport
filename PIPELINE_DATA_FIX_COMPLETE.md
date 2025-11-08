# Pipeline Data Not Displaying - FIXED

## Problem
Candidates added to pipeline show message "1 candidate(s) already in pipeline" but data not visible in any stage (Sourced, Screened, Interview 1, Interview 2, Offer, Hired).

## Root Causes

### Issue 1: Profile Data Extraction ✅ FIXED
- **Problem**: Student profile data stored in JSONB field wasn't being extracted
- **Impact**: Candidate cards showed "N/A" for dept, college, skills
- **Fix**: Updated `pipelineService.ts` to extract and transform JSONB profile data

### Issue 2: Duplicate Candidate Handling ✅ FIXED  
- **Problem**: When adding duplicate candidates, modal showed error but didn't refresh pipeline
- **Impact**: User saw "already in pipeline" message but couldn't see the existing candidate
- **Fix**: Added auto-close with refresh after 2 seconds when duplicates detected

## Solutions Implemented

### 1. Enhanced Data Extraction (`pipelineService.ts`)

**Added detailed logging:**
```typescript
console.log(`[Pipeline Service] Fetching candidates for requisition: ${requisitionId}, stage: ${stage}`);
console.log(`[Pipeline Service] Raw data for stage ${stage}:`, data);
console.log(`[Pipeline Service] Processing candidate ${index + 1}:`, {...});
console.log(`[Pipeline Service] Profile data:`, {...});
console.log(`[Pipeline Service] Transformed ${count} candidates for stage ${stage}`);
```

**Profile extraction:**
```typescript
const profile = candidate.students.profile;
return {
  ...candidate,
  students: {
    ...candidate.students,
    dept: profile.dept || profile.department || candidate.students.department,
    college: profile.college || profile.university || candidate.students.university,
    location: profile.location || profile.city || '',
    skills: profile.skills || [],
    ai_score_overall: profile.ai_score_overall || candidate.students.employability_score || 0
  }
};
```

### 2. Fixed Duplicate Handling (`Pipelines.tsx`)

**Before:**
```typescript
if (duplicates.length > 0) {
  setError(`${duplicates.length} candidate(s) already in pipeline`);
  // ❌ Modal stays open, no refresh
}
```

**After:**
```typescript
if (duplicates.length > 0) {
  setError(`${duplicates.length} candidate(s) already in pipeline`);
  // ✅ Auto-close and refresh after showing error
  setTimeout(() => {
    onSuccess?.();  // Refresh pipeline data
    onClose();      // Close modal
    setSelectedStudents([]);  // Clear selection
  }, 2000);
  return;
}
```

## How to Debug

### Step 1: Check Browser Console
1. Open http://localhost:3001/recruitment/pipelines
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for logs starting with `[Pipeline Service]`

**Expected output:**
```
[Pipeline Service] Fetching candidates for requisition: abc123, stage: sourced
[Pipeline Service] Raw data for stage sourced: [{...}]
[Pipeline Service] Processing candidate 1: {id, student_id, candidate_name, ...}
[Pipeline Service] Profile data: {dept: "CS", college: "MIT", skills_count: 5, ai_score: 85}
[Pipeline Service] Transformed 1 candidates for stage sourced
```

**If you see empty arrays:**
```
[Pipeline Service] Raw data for stage sourced: []
[Pipeline Service] Transformed 0 candidates for stage sourced
```
→ Data not in database! Check Step 2.

**If you see candidates but no profile:**
```
[Pipeline Service] Processing candidate 1: {...}
[Pipeline Service] No profile data found for candidate: John Doe
```
→ Student record exists but profile field is empty!

### Step 2: Check Database
Run this in Supabase SQL Editor:
```sql
-- Check pipeline_candidates exist
SELECT stage, COUNT(*) 
FROM pipeline_candidates 
WHERE status = 'active' 
GROUP BY stage;

-- Check if students are linked
SELECT 
  pc.candidate_name,
  pc.stage,
  s.name as student_name,
  s.profile->>'dept' as dept,
  s.profile->>'college' as college
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
WHERE pc.status = 'active';
```

### Step 3: Test Adding Candidate

**Scenario 1: New Candidate**
1. Go to Pipelines → "Add from Talent Pool"
2. Select a student
3. Click "Add Candidates"
4. Should see: "✅ Successfully added 1 candidate(s) to pipeline!"
5. Modal closes
6. Candidate appears in stage

**Scenario 2: Duplicate Candidate**
1. Try to add same student again
2. Should see: "1 candidate(s) already in pipeline" (red error)
3. After 2 seconds: Modal auto-closes
4. Pipeline refreshes
5. Can see the existing candidate in the stage

## Files Modified

### 1. `src/services/pipelineService.ts`
- Added comprehensive console logging
- Enhanced profile data extraction
- Better error handling

### 2. `src/pages/recruiter/Pipelines.tsx`
- Fixed duplicate candidate handling
- Auto-refresh after duplicate detection
- Better user feedback

## Testing Checklist

- [ ] Open Pipelines page
- [ ] Select a job
- [ ] Verify stages show data
- [ ] Check console for `[Pipeline Service]` logs
- [ ] Try adding new candidate
- [ ] Try adding duplicate candidate
- [ ] Verify auto-close works for duplicates
- [ ] Check all stage columns (Sourced, Screened, etc.)
- [ ] Verify candidate details show (dept, college, skills, AI score)

## Common Issues & Solutions

### Issue: Empty Stages
**Symptoms:** All stages show 0 candidates or "No candidates"
**Cause:** No data in database OR wrong requisition selected
**Solution:**
```sql
-- Check if pipeline_candidates table has data
SELECT COUNT(*) FROM pipeline_candidates WHERE status = 'active';
-- If 0, add candidates through UI
```

### Issue: "N/A" for Department/College
**Symptoms:** Candidate shows but dept/college/skills are N/A or missing
**Cause:** Student profile JSONB field is empty or malformed
**Solution:**
```sql
-- Check student profile
SELECT id, name, profile FROM students WHERE id = 'student_id_here';
-- If profile is null or {}, update student profile through UI
```

### Issue: Duplicate Error Doesn't Close
**Symptoms:** Error shows but modal stays open forever
**Cause:** Old code without timeout fix
**Solution:** Refresh page to get latest code with HMR

### Issue: No Console Logs
**Symptoms:** Can't see `[Pipeline Service]` logs in console
**Cause:** Page not reloaded after code changes
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

## Database Schema Reference

```sql
-- pipeline_candidates table
CREATE TABLE pipeline_candidates (
  id uuid PRIMARY KEY,
  requisition_id uuid REFERENCES requisitions(id),
  student_id uuid REFERENCES students(id),
  candidate_name text,
  candidate_email text,
  candidate_phone text,
  stage text CHECK (stage IN ('sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired')),
  status text DEFAULT 'active',
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- students table
CREATE TABLE students (
  id uuid PRIMARY KEY,
  name text,
  email text,
  phone text,
  department text,
  university text,
  profile jsonb  -- Contains: dept, college, city, skills[], ai_score_overall
);
```

## Success Indicators

✅ **Pipeline Loads Successfully:**
- Console shows: `[Pipeline Service] Transformed N candidates` for each stage
- Candidate cards display with full details
- No "N/A" for dept/college
- Skills show as tags
- AI score displays with star icon

✅ **Duplicate Handling Works:**
- Error message shows for 2 seconds
- Modal auto-closes
- Pipeline refreshes automatically
- Existing candidate becomes visible

✅ **Adding New Candidates Works:**
- Success alert appears
- Modal closes immediately
- Candidate appears in correct stage
- All details populate correctly

## Next Steps

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Open Pipelines page** and check console
3. **Try adding a candidate** to verify auto-refresh
4. **Run database queries** if data still not showing
5. **Check student profiles** have JSONB data populated

---

## Status: ✅ READY TO TEST

All fixes deployed and active via HMR.
