# Student Management System Setup Guide

## Tables to Create

The following tables need to be created in your Supabase database:

1. ✅ **admission_applications** - Student admission workflow
2. ✅ **student_management_records** - School-specific student records
3. ✅ **attendance_records** - Daily attendance tracking
4. ✅ **attendance_alerts** - Automated attendance alerts
5. ✅ **student_reports** - Generated reports
6. ✅ **skill_assessments** - Student assessments

## Setup Steps

### Step 1: Check Existing Students Table

First, verify your existing students table structure:

```bash
node scripts/check-students-structure.js
```

This will show you:
- Current fields in the students table
- Sample student records
- Total number of students

### Step 2: Create New Tables

Run the migration SQL in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/create_student_management_tables.sql`
3. Paste and run the SQL

This will create:
- All 6 new tables
- Indexes for performance
- RLS policies for security
- Database functions (`generate_enrollment_number`, `check_attendance_alerts`)
- Storage bucket for admission documents
- Triggers for auto-updating timestamps

### Step 3: Populate Extended Profiles

After creating tables, populate the extended profiles from existing students:

```bash
node scripts/populate-student-profiles.js
```

This will:
- Fetch all existing students
- Create extended profile records
- Generate enrollment numbers if missing
- Map existing fields to new structure

### Step 4: Verify Setup

Check that everything is working:

```sql
-- Check table counts
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'student_management_records', COUNT(*) FROM student_management_records
UNION ALL
SELECT 'admission_applications', COUNT(*) FROM admission_applications
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'attendance_alerts', COUNT(*) FROM attendance_alerts
UNION ALL
SELECT 'student_reports', COUNT(*) FROM student_reports
UNION ALL
SELECT 'skill_assessments', COUNT(*) FROM skill_assessments;
```

## Field Mapping

The script will map existing student fields to the new structure:

| Existing Field | New Field (student_management_records) |
|----------------|--------------------------------------|
| id | student_id |
| school_id | school_id |
| enrollment_number | enrollment_number |
| class / current_class | class |
| section | section |
| roll_number | roll_number |
| admission_date | admission_date |
| blood_group | blood_group |
| parent_name / father_name | emergency_contact |
| parent_phone / phone | emergency_phone |
| status | status |
| photo_url / profile_photo | photo_url |

## Database Functions

### generate_enrollment_number
Generates unique enrollment numbers in format: `YEAR-SCHOOLID-SEQUENCE`

```sql
SELECT generate_enrollment_number(
  'school-uuid-here'::uuid,
  '2024'
);
```

### check_attendance_alerts
Automatically checks attendance and creates alerts for:
- Students below 75% attendance
- 3+ consecutive absences

```sql
SELECT check_attendance_alerts();
```

## Storage Bucket

**admission-documents** bucket is created for storing:
- Birth certificates
- Transfer certificates
- Aadhar cards
- Photos
- Medical records

## RLS Policies

All tables have Row Level Security enabled:
- School staff can only access their school's data
- Based on `school_educators` table membership
- Authenticated users only

## Troubleshooting

### If migration fails:
1. Check if `schools` table exists
2. Check if `school_educators` table exists
3. Verify foreign key references

### If population script fails:
1. Run `check-students-structure.js` first
2. Check field names match your schema
3. Update the mapping in `populate-student-profiles.js`

### If RLS blocks access:
1. Verify user is in `school_educators` table
2. Check `school_id` matches
3. Temporarily disable RLS for testing (not recommended for production)

## Next Steps

After setup:
1. Start your dev server: `npm run dev`
2. Test the admission workflow
3. Add sample attendance records
4. Generate test reports

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify table structure matches migration
3. Check RLS policies are not blocking access
