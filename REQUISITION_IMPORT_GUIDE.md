# Job Requisition Import Feature

## Overview
The requisition import feature allows recruiters to bulk import job requisitions using an Excel template.

## How to Use

### Step 1: Access Import
1. Navigate to `/recruitment/requisition`
2. Click the **Import** button in the header (next to "Create Requisition")

### Step 2: Download Template
1. In the import modal, click **Download Template**
2. An Excel file (`requisitions_template.xlsx`) will be downloaded with:
   - Sample data showing the correct format
   - All required and optional fields
   - Two example requisitions

### Step 3: Fill the Template
Open the downloaded Excel file and fill in your requisition data:

#### Required Fields
- `job_title` - Job position title
- `department` - Department name
- `location` - Job location (can include multiple locations)
- `employment_type` - Must be one of: `Full-time`, `Part-time`, `Contract`, `Internship`
- `experience_level` - Must be one of: `Entry`, `Mid`, `Senior`, `Lead`
- `status` - Must be one of: `draft`, `open`, `closed`, `on_hold`

#### Optional Fields
- `company_name` - Company name (defaults to "Not Specified")
- `mode` - Work mode: `Remote`, `On-site`, or `Hybrid`
- `experience_required` - e.g., "3-5 years"
- `salary_range_min` - Minimum salary (number)
- `salary_range_max` - Maximum salary (number)
- `description` - Job description
- `requirements` - Use pipe (|) to separate multiple items
- `responsibilities` - Use pipe (|) to separate multiple items
- `skills_required` - Use pipe (|) to separate multiple items
- `benefits` - Use pipe (|) to separate multiple items
- `deadline` - Application deadline (format: YYYY-MM-DD)
- `recruiter_email` - Email of the assigned recruiter

#### Array Fields Format
For fields that accept multiple values (requirements, responsibilities, skills, benefits), use the pipe character `|` as a separator:

```
React | Node.js | TypeScript | PostgreSQL | AWS
```

This will be converted to an array: `["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]`

### Step 4: Upload and Import
1. Click **Upload a file** or drag and drop your filled Excel file
2. The system will validate all rows before importing
3. Click **Import Requisitions** to start the import process
4. Progress will be shown during import

### Step 5: Review Results
- **Success**: Shows count of successfully imported requisitions
- **Errors**: Lists any validation or import errors with row numbers
- Successfully imported requisitions will appear in the requisitions list

## Validation Rules

### Status Values
- `draft` - Requisition is in draft mode
- `open` - Requisition is active and accepting applications
- `closed` - Requisition is closed
- `on_hold` - Requisition is temporarily on hold

### Employment Type Values
- `Full-time`
- `Part-time`
- `Contract`
- `Internship`

### Experience Level Values
- `Entry` - Entry level position
- `Mid` - Mid-level position
- `Senior` - Senior level position
- `Lead` - Lead/Principal level position

### Work Mode Values (Optional)
- `Remote` - Fully remote position
- `On-site` - Office-based position
- `Hybrid` - Mix of remote and on-site

## Error Handling

### Common Errors
1. **Missing required field** - Ensure all required fields are filled
2. **Invalid status** - Check status is one of the allowed values
3. **Invalid employment_type** - Must match exactly (case-sensitive)
4. **Invalid experience_level** - Must match exactly (case-sensitive)
5. **Invalid mode** - Must match exactly (case-sensitive)
6. **Invalid date format** - Use YYYY-MM-DD format for deadline

### Partial Import
- If some rows have errors, only valid rows will be imported
- Error messages will show which rows failed and why
- You can fix the errors and re-import the failed rows

## Tips

1. **Start Small**: Test with 2-3 requisitions first
2. **Use Template**: Always start from the downloaded template
3. **Check Format**: Ensure employment_type, experience_level, and status match exactly
4. **Array Fields**: Use pipe (|) separator for multiple values
5. **Dates**: Use YYYY-MM-DD format (e.g., 2026-03-31)
6. **Numbers**: Enter salary values as numbers without currency symbols
7. **Recruiter Assignment**: Use valid recruiter email addresses from your system

## Database Schema

Imported requisitions are stored in the `opportunities` table with the following structure:
- Auto-generated: `id`, `created_at`, `updated_at`, `posted_date`
- Counters: `applications_count`, `messages_count`, `views_count` (initialized to 0)
- Active flag: `is_active` (automatically set based on status)
- User tracking: `created_by` (set to current user)

## Technical Details

### Dependencies
- `xlsx` library for Excel file parsing
- Supabase for database operations

### File Format
- Supported formats: `.xlsx`, `.xls`
- Maximum file size: Browser dependent (typically 10-50MB)
- Encoding: UTF-8

### Performance
- Imports are processed sequentially to ensure data integrity
- Progress indicator shows real-time import status
- Large imports (100+ rows) may take a few minutes

## Troubleshooting

### Import Button Not Visible
- Ensure you're logged in as a recruiter
- Check you're on the `/recruitment/requisition` page

### Template Download Not Working
- Check browser download settings
- Ensure pop-ups are not blocked
- Try a different browser

### Upload Fails
- Verify file format is .xlsx or .xls
- Check file is not corrupted
- Ensure file is not password protected

### All Rows Fail Validation
- Compare your file with the template
- Check field names match exactly (case-sensitive)
- Verify required fields are filled

## Support

For issues or questions:
1. Check error messages for specific guidance
2. Review this guide for format requirements
3. Test with the sample template data first
4. Contact your system administrator
