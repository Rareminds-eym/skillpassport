# How to Import the 50 Learning Internships

## Quick Summary
✅ Generated SQL file: `import-all-internships.sql`  
✅ Total internships: 50 (INT001 to INT050)  
✅ Recruiter ID: `902d03ef-71c0-4781-8e09-c2ef46511cbb`  
✅ All fields mapped from Excel to database

## Step-by-Step Import Instructions

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click "New query" button

3. **Copy & Paste SQL**
   - Open the file `import-all-internships.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor

4. **Execute**
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (should take a few seconds)

5. **Verify**
   - Run this verification query:
   ```sql
   SELECT COUNT(*) as total_imported
   FROM opportunities 
   WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb';
   ```
   - Should return: **50**

### Method 2: Using psql Command Line

```bash
# If you have direct database access
psql "your-connection-string" -f import-all-internships.sql
```

### Method 3: Split into Smaller Batches

If the file is too large, I can split it into 5 files of 10 internships each. Let me know if you need this.

## Verification Queries

After import, run these to verify:

### 1. Count Total Internships
```sql
SELECT COUNT(*) as total
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb';
```
Expected: **50**

### 2. View All Titles
```sql
SELECT title, sector, exposure_type, total_hours, cost_inr
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
ORDER BY title;
```

### 3. Group by Sector
```sql
SELECT sector, COUNT(*) as count
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
GROUP BY sector
ORDER BY count DESC;
```

### 4. Group by Exposure Type
```sql
SELECT exposure_type, COUNT(*) as count
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
GROUP BY exposure_type
ORDER BY count DESC;
```

### 5. Check Free vs Paid
```sql
SELECT 
  CASE WHEN cost_inr = 0 THEN 'Free' ELSE 'Paid' END as cost_type,
  COUNT(*) as count
FROM opportunities 
WHERE recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'
GROUP BY cost_type;
```

## What's Included in Each Internship

Every internship record includes:
- ✅ Title & Job Title
- ✅ Company Name (Sector + "Program")
- ✅ Department & Sector
- ✅ Exposure Type (Shadow & See, Try a Task, Mini Problem, Community Impact)
- ✅ Total Hours
- ✅ Duration (weeks/days)
- ✅ Schedule Notes
- ✅ What You'll Learn
- ✅ What You'll Do
- ✅ Final Artifact Type & Description
- ✅ Mentor Bio
- ✅ Prerequisites (in requirements field as JSONB)
- ✅ Safety Notes
- ✅ Parent Role
- ✅ Cost (INR) & Cost Notes
- ✅ Employment Type: "Internship"
- ✅ Location: On-site/Remote/Hybrid
- ✅ Mode: In-person/Remote/Flexible
- ✅ Status: published
- ✅ Is Active: true
- ✅ Posted Date: NOW()

## Troubleshooting

### If you get an error about duration_weeks
Some entries have values like "1–2" which might cause issues. The Python script handles this, but if you see errors, let me know.

### If the file is too large
The SQL file is about 54KB with 1,900 lines. Most SQL editors can handle this, but if yours can't, I can split it into smaller files.

### If you want to test with just a few first
You can copy just the first 5-10 INSERT statements and test those first before running all 50.

## Next Steps After Import

1. **View in your app**: Navigate to the Opportunities page
2. **Filter by sector**: Test the sector filters
3. **Check details**: Click on an internship to see all fields
4. **Test search**: Search for keywords like "health", "tech", "environment"

## Need Help?

If you encounter any issues:
1. Check the error message
2. Verify your recruiter_id exists in the recruiters table
3. Make sure all required fields in opportunities table match
4. Let me know the specific error and I'll help fix it
