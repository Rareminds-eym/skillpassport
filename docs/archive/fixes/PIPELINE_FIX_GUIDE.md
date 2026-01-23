# Pipeline Data Not Showing - Complete Fix Guide

## 🔍 **Problem Identified**

The reason students aren't showing up in the recruiter pipeline under "sourced" status is because:

1. **Missing Database Integration**: The `pipeline_candidates` table is empty
2. **No Trigger Setup**: When students apply for jobs, they're not automatically added to the recruitment pipeline
3. **Missing Data Sync**: Existing applications haven't been migrated to the pipeline system

## 🛠️ **Solution Overview**

The pipeline system works like this:
```
Student applies for job → Applied to applied_jobs table → Trigger adds to pipeline_candidates → Shows in recruiter pipeline
```

Currently, the trigger and data sync are missing, so the pipeline_candidates table is empty.

## ⚡ **Quick Fix Instructions**

### Option 1: Run the Automated Fix Script (Recommended)

1. **Open your browser console** (F12) while on the SkillPassport app
2. **Copy and paste** the contents of `fix-pipeline-integration.js` into the console
3. **Press Enter** to run the script
4. **Wait for completion** - it will show progress and results

### Option 2: Run the Complete Database Fix (For Admin)

1. **Open Supabase SQL Editor**
2. **Copy and paste** the entire `database/fix_pipeline_integration_corrected.sql` file
3. **Execute the script**
4. **Verify the results**

## 📊 **What the Fix Does**

### 1. Creates Missing Infrastructure
- Adds `requisition_id` column to opportunities table
- Creates requisitions for each opportunity
- Links opportunities to requisitions

### 2. Sets Up Automation
- Creates trigger function `auto_add_applicant_to_pipeline()`
- Sets up trigger on `applied_jobs` table
- Future applications will automatically appear in pipeline

### 3. Syncs Existing Data
- Finds all existing applications
- Adds them to `pipeline_candidates` table with "sourced" stage
- Preserves original application dates

## 🔍 **Verification Steps**

After running the fix:

1. **Check Pipeline Data**:
   ```javascript
   // Run in browser console
   import { supabase } from './src/lib/supabaseClient.js';
   
   const { data } = await supabase
     .from('pipeline_candidates')
     .select('*')
     .limit(10);
   
   console.log('Pipeline candidates:', data);
   ```

2. **Check Recruiter Dashboard**:
   - Go to recruiter pipeline view
   - Look for students in "Sourced" column
   - Should see all applied students

3. **Test New Applications**:
   - Have a student apply for a new job
   - Check if they appear in pipeline immediately

## 📈 **Expected Results**

After the fix:

- ✅ **Existing applications** will appear in recruiter pipeline with "sourced" status
- ✅ **New applications** will automatically be added to pipeline
- ✅ **Pipeline progression** will work (sourced → screened → interview → offer → hired)
- ✅ **Student view** will show pipeline status and progress

## 🚨 **Important Notes**

1. **Data Safety**: The fix script only adds missing data, it doesn't modify existing records
2. **Backup Recommended**: Consider backing up your database before running the complete SQL fix
3. **One-Time Fix**: This only needs to be run once to fix the missing integration
4. **Future Applications**: Once fixed, all future applications will automatically appear in pipeline

## 🐛 **Troubleshooting**

### If Students Still Don't Appear:

1. **Check RLS Policies**:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pipeline_candidates WHERE status = 'active' LIMIT 5;
   ```

2. **Verify Requisition IDs**:
   ```sql
   -- Check if opportunities have requisition_id
   SELECT id, job_title, requisition_id FROM opportunities LIMIT 10;
   ```

3. **Check Trigger Status**:
   ```sql
   -- Verify trigger exists
   SELECT trigger_name FROM information_schema.triggers 
   WHERE event_object_table = 'applied_jobs';
   ```

### If Browser Console Shows Errors:

1. **Network Issues**: Check if Supabase is accessible
2. **Permissions**: Ensure your user has access to the tables
3. **Rate Limits**: Wait a moment and try again

## 📞 **Next Steps**

1. **Run the fix** using Option 1 (browser console method)
2. **Verify results** by checking recruiter pipeline
3. **Test with new application** to ensure trigger works
4. **Contact support** if issues persist

---

## 📄 **Files Created for This Fix**

- `fix-pipeline-integration.js` - Automated browser fix script
- `check-database-state-browser.js` - Database state checker
- `check-pipeline-data.js` - Pipeline data verification
- `database/fix_pipeline_integration_corrected.sql` - Complete SQL fix

**Choose the browser console method for quick results!**