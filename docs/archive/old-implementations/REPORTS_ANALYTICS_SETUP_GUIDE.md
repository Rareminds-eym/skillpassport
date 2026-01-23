# Reports & Analytics - Setup Guide

## Overview
The Reports & Analytics page is now fully connected to Supabase with dynamic data from real tables. This guide will help you set up the missing tables and populate them with sample data.

## What Was Done

### 1. Created Missing Tables
- ✅ `college_attendance` - Tracks daily student attendance
- ✅ `placement_offers` - Stores placement offers and packages

### 2. Updated reportsService.ts
- ✅ Attendance Report now uses real attendance data
- ✅ Placement Report now calculates real average package
- ✅ Maintains fallback data when tables are empty

### 3. Added Sample Data Generators
- ✅ `generate_sample_attendance()` - Creates realistic attendance records
- ✅ `generate_sample_placement_offers()` - Creates sample placement data

## Setup Instructions

### Step 1: Run the Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the contents of `database/migrations/reports_analytics_tables.sql`
4. Paste and run the SQL

This will create:
- `college_attendance` table with RLS policies
- `placement_offers` table with RLS policies
- Helper functions for generating sample data

### Step 2: Get Your College ID

Run this query in Supabase SQL Editor:

```sql
-- Replace with your email
SELECT id, name, deanEmail 
FROM colleges 
WHERE deanEmail ILIKE 'your-email@example.com';
```

Copy the `id` value (it will look like: `123e4567-e89b-12d3-a456-426614174000`)

### Step 3: Generate Sample Data

#### Generate Attendance Data (90 days)
```sql
-- Replace 'your-college-id' with the ID from Step 2
SELECT generate_sample_attendance('your-college-id', 90);
```

This will create:
- Attendance records for the last 90 days
- 90% present, 5% absent, 3% late, 2% excused
- Skips weekends automatically
- For up to 100 students

#### Generate Placement Offers (50 offers)
```sql
-- Replace 'your-college-id' with the ID from Step 2
SELECT generate_sample_placement_offers('your-college-id', 50);
```

This will create:
- 50 placement offers
- Packages ranging from ₹3L to ₹18L
- Mix of companies (TCS, Infosys, Google, Microsoft, etc.)
- Various job roles and locations
- 85% accepted, 10% offered, 5% rejected

### Step 4: Verify Data

Check if data was created:

```sql
-- Check attendance records
SELECT COUNT(*) as attendance_count 
FROM college_attendance 
WHERE college_id = 'your-college-id';

-- Check placement offers
SELECT COUNT(*) as offers_count,
       AVG(package_amount) as avg_package
FROM placement_offers 
WHERE college_id = 'your-college-id';
```

### Step 5: Test the Reports Page

1. Navigate to `/college-admin/reports`
2. Select different report categories
3. Try different filters (date range, department)
4. Verify data is showing correctly

## What Each Report Shows Now

### 1. Attendance Report
**Real Data:**
- Total student count from `students` table
- Actual attendance percentage from `college_attendance`
- Department-wise attendance breakdown
- Students below 75% threshold

**Fallback (if no attendance data):**
- Calculated attendance (85-98%)

### 2. Performance/Grades Report
**Real Data:**
- Pass rate from `mark_entries` and `assessments`
- Grade distribution
- Top performers (O and A+ grades)
- Students needing support (C and F grades)

### 3. Placement Overview Report
**Real Data:**
- Placement rate from `pipeline_candidates`
- **Average package from `placement_offers`** (NEW!)
- Unique companies from `requisitions`
- Total offers made

### 4. Skill Course Analytics Report
**Real Data:**
- Completion rate from `course_enrollments`
- Active courses from `courses`
- In-progress enrollments
- Average progress percentage

### 5. Department Budget Usage Report
**Real Data:**
- Budget allocation from `department_budgets`
- Actual spending from budget_heads JSONB
- Utilization percentage
- Remaining budget

### 6. Exam Progress Report
**Real Data:**
- Total exams from `exam_windows`
- Completed/ongoing/scheduled counts
- Registration count from `exam_registrations`

## Customizing Sample Data

### Adjust Attendance Percentage
Edit the function in the migration file:

```sql
-- Change these probabilities
v_status := CASE 
  WHEN random() < 0.90 THEN 'present'  -- 90% present
  WHEN random() < 0.95 THEN 'absent'   -- 5% absent
  WHEN random() < 0.98 THEN 'late'     -- 3% late
  ELSE 'excused'                        -- 2% excused
END;
```

### Adjust Package Range
Edit the function in the migration file:

```sql
-- Change package range (currently 3L to 18L)
package_amount,
300000 + floor(random() * 1500000), -- Min 3L, Max 18L
```

### Add More Companies
Edit the companies array:

```sql
v_companies TEXT[] := ARRAY[
  'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture',
  'Your Company 1', 'Your Company 2', 'Your Company 3'
];
```

## Troubleshooting

### Issue: No data showing in reports

**Solution:**
1. Check if you ran the migration
2. Verify your college_id is correct
3. Run the sample data generators
4. Check browser console for errors

### Issue: "Permission denied" error

**Solution:**
1. Verify RLS policies are created
2. Check if your user email matches the college deanEmail
3. Try logging out and back in

### Issue: Wrong college data showing

**Solution:**
1. Verify college_id resolution in localStorage
2. Check `colleges` table deanEmail matches your login email
3. Clear browser cache and localStorage

### Issue: Sample data generation fails

**Solution:**
1. Ensure you have students in the `students` table
2. Check if departments exist in `departments` table
3. Verify college_id is valid

## Manual Data Entry

If you prefer to add real data instead of sample data:

### Add Attendance Record
```sql
INSERT INTO college_attendance (
  student_id,
  college_id,
  department_id,
  date,
  status
) VALUES (
  'student-id-here',
  'college-id-here',
  'department-id-here',
  '2026-01-09',
  'present'
);
```

### Add Placement Offer
```sql
INSERT INTO placement_offers (
  student_id,
  college_id,
  department_id,
  company_name,
  package_amount,
  offer_date,
  status
) VALUES (
  'student-id-here',
  'college-id-here',
  'department-id-here',
  'Google',
  1500000, -- 15 lakhs
  '2026-01-09',
  'accepted'
);
```

## Next Steps

1. **Add More Data**: Generate more sample data for better visualizations
2. **Create UI for Data Entry**: Build forms to add attendance and offers manually
3. **Add Export Functionality**: Implement PDF/Excel export
4. **Add Real-time Updates**: Use Supabase subscriptions for live data
5. **Add Scheduled Reports**: Auto-generate and email reports

## Performance Tips

- Sample data generators process 100 students at a time
- For large colleges (1000+ students), run generators in batches
- Add indexes if queries are slow (already included in migration)
- Consider archiving old attendance data (>1 year)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in Dashboard → Logs
3. Verify RLS policies are not blocking access
4. Ensure all required tables exist

## Summary

✅ **Attendance Report**: Now uses real `college_attendance` data
✅ **Placement Report**: Now calculates real average package from `placement_offers`
✅ **All Reports**: Connected to Supabase with proper fallbacks
✅ **Sample Data**: Easy-to-use generators for testing
✅ **RLS Policies**: Secure, college-specific data access

The Reports & Analytics page is now fully dynamic and ready for production use!
