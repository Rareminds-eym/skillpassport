# Quick Test Guide - Requisition Import

## Step 1: Fix the Database Error

Copy and run this entire SQL block in Supabase SQL Editor:

```sql
-- Remove all embedding triggers from opportunities table
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'opportunities' 
          AND trigger_name LIKE '%embedding%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON opportunities', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;
```

**Or simply run**: `ULTIMATE_SIMPLE_FIX.sql` from the project root

## Step 2: Start Your App

```bash
npm run dev
```

## Step 3: Navigate to Requisitions

Open: `http://localhost:3000/recruitment/requisition`

## Step 4: Test Import

1. **Click "Import" button** (next to "Create Requisition")
2. **Click "Download Template"** - saves `requisitions_template.xlsx`
3. **Click "Upload a file"** - select the downloaded template
4. **Click "Import Requisitions"**

## Expected Result

✅ Progress bar shows 100%
✅ Success message: "Successfully imported 2 requisitions!"
✅ Modal closes automatically
✅ 2 new requisitions appear in the list:
   - Senior Full Stack Developer
   - Data Analyst

## Test Custom Data

Edit the downloaded Excel file:
- Change job titles
- Modify departments
- Update locations
- Add more rows

Then upload and import again!

## Common Issues

### Issue: "Missing required field"
**Fix**: Ensure all required columns are filled:
- job_title
- department
- location
- employment_type (must be: Full-time, Part-time, Contract, or Internship)
- experience_level (must be: Entry, Mid, Senior, or Lead)
- status (must be: draft, open, closed, or on_hold)

### Issue: "Invalid employment_type"
**Fix**: Check spelling and capitalization:
- ✅ "Full-time"
- ❌ "Fulltime"
- ❌ "full-time"

### Issue: Database error
**Fix**: Run the SQL fix from Step 1 above

## Template Format Example

```
job_title: Backend Developer
company_name: Tech Solutions Inc.
department: Engineering
location: Mumbai, Hybrid
mode: Hybrid
employment_type: Full-time
experience_level: Mid
experience_required: 3-5 years
salary_range_min: 1000000
salary_range_max: 1500000
status: open
description: Looking for a skilled backend developer
requirements: Node.js experience | Database knowledge | API design
responsibilities: Build APIs | Write tests | Code reviews
skills_required: Node.js | PostgreSQL | Docker | AWS
benefits: Health Insurance | Remote Work | Learning Budget
deadline: 2026-06-30
recruiter_email: recruiter@example.com
```

## Success Indicators

- ✅ No console errors
- ✅ Progress bar completes
- ✅ Success message appears
- ✅ Requisitions list refreshes
- ✅ New requisitions visible in grid/list view

## Next Steps

After successful import:
- Click on a requisition to view details
- Edit imported requisitions
- Change status (draft → open)
- View in grid or list mode
- Use filters and search

---

**Need Help?**
- Check `REQUISITION_IMPORT_GUIDE.md` for detailed documentation
- Check `FIX_IMPORT_EMBEDDING_ERROR.md` if you see database errors
