# Learning Internships Import Guide

## Overview
Successfully generated SQL script to import all 50 learning internships from `school_student_learning_internships.xlsx` into the opportunities table.

## Files Generated
- `import-all-internships.sql` - Complete SQL script with all 50 internships
- `generate_internships_sql.py` - Python script used to generate the SQL

## Internship Details
- **Total Internships**: 50 (INT001 to INT050)
- **Recruiter ID**: `902d03ef-71c0-4781-8e09-c2ef46511cbb`
- **Status**: All set to `published`
- **Active**: All set to `true`

## Fields Mapped
Each internship includes:
- ✅ title, job_title
- ✅ company_name (based on sector + "Program")
- ✅ department, sector
- ✅ exposure_type (Shadow & See, Try a Task, Mini Problem, Community Impact)
- ✅ total_hours
- ✅ duration_weeks, duration_days
- ✅ schedule_note
- ✅ what_youll_learn
- ✅ what_youll_do
- ✅ final_artifact_type, final_artifact_description
- ✅ mentor_bio
- ✅ requirements (as JSONB array with prerequisites)
- ✅ safety_note
- ✅ parent_role
- ✅ cost_inr, cost_note
- ✅ employment_type (all set to "Internship")
- ✅ location (On-site/Remote/Hybrid based on content)
- ✅ mode (In-person/Remote/Flexible based on content)
- ✅ is_active, recruiter_id, status, posted_date

## How to Execute

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `import-all-internships.sql`
4. Paste and run the script

### Option 2: Using Supabase CLI
```bash
supabase db execute -f import-all-internships.sql
```

### Option 3: Using psql
```bash
psql -h your-db-host -U postgres -d postgres -f import-all-internships.sql
```

## Verification Query
After importing, verify the data:

```sql
-- Count imported internships
SELECT COUNT(*) FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb';

-- View all imported internships
SELECT id, title, sector, exposure_type, total_hours, cost_inr 
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
ORDER BY title;

-- Check by sector
SELECT sector, COUNT(*) as count
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
GROUP BY sector
ORDER BY count DESC;
```

## Internship Categories
The 50 internships cover these sectors:
- Health & Life Sciences
- Environment & Sustainability
- Science & STEM
- Technology & Making
- Media & Arts
- Design & Creative
- Business & Entrepreneurship
- Education & Community
- Public Service & Civic Engagement

## Notes
- All internships are set to active and published status
- Cost ranges from ₹0 (free) to minimal costs for materials
- Duration ranges from 1 visit to 3 weeks
- Total hours range from 3 to 12 hours
- All include safety notes and parent role requirements
- Each has a defined final artifact (poster, video, report, etc.)
