# 🚀 Quick Fix - Run This Now!

## The Problem
Two errors when moving candidates:
1. ❌ `column students.profile does not exist`
2. ❌ `invalid input syntax for type integer: "0993cdbb-b300-4bb7-ac89-fe51a14426c8"`

## The Solution (2 Steps)

### Step 1: Run SQL Fix ⚡
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste this file: **`FIX_MOVE_TO_STAGE_COMPLETE.sql`**
3. Click **Run**
4. Wait for: `✅ FIX COMPLETED SUCCESSFULLY!`

### Step 2: Refresh Browser 🔄
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Go to: http://localhost:3000/recruitment/requisition/applicants
3. Try moving a candidate

## Expected Result ✅
- No more errors in console
- Candidate moves to new stage
- Alert: "Successfully moved [Name] to [stage] stage"
- Page refreshes with updated data

## What I Fixed
✅ Removed non-existent `profile` column from students query
✅ Updated `pipeline_candidates_detailed` view to support UUID
✅ Added detailed logging to track issues

## Files Changed
- `src/services/appliedJobsService.js` - Fixed profile column
- `FIX_MOVE_TO_STAGE_COMPLETE.sql` - Database view fix

---

**Just run the SQL script and refresh your browser!** 🎉
