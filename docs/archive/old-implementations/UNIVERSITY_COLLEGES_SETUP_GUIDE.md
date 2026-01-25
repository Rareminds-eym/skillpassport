# University Colleges Setup Guide

This guide explains how to set up the university-college relationship system that allows universities to manage their affiliated colleges.

## Overview

The system creates a new `university_colleges` table that maps colleges from the `organizations` table to universities, allowing for proper university-college hierarchy management.

## Database Changes

### New Table: `university_colleges`
- Maps colleges to universities with proper foreign key relationships
- Stores college-specific information (dean details, codes, etc.)
- References original organization data via `college_id` field
- Includes RLS policies for security

### Key Features
- University admins can add colleges from existing organizations
- Direct reference to original college organization via `college_id`
- Unique college codes within each university
- Dean information management
- Status tracking (active, pending, inactive)
- Metadata storage for additional college information

## Setup Steps

### 1. Run Database Migration
```bash
# Execute the SQL migration
psql -h your-supabase-host -p 5432 -U postgres -d postgres -f create-university-colleges-table.sql

# Or use the batch file (Windows)
setup-university-colleges.bat
```

### 2. Update University IDs
After running the migration, you need to update the university_id values to match actual universities:

```sql
-- Example: Update colleges to belong to a specific university
UPDATE university_colleges 
SET university_id = 'your-university-org-id'
WHERE university_id = (SELECT id FROM organizations WHERE organization_type = 'university' LIMIT 1);
```

### 3. Test the System
1. Navigate to: `http://localhost:3000/university-admin/colleges/registration`
2. Click "Add College" button
3. Select a college from the dropdown (colleges from organizations table)
4. Fill in college details (code, dean info, etc.)
5. Save and verify the college appears in the list

## File Changes

### New Files
- `src/services/universityCollegeService.js` - Service for university-college operations
- `create-university-colleges-table.sql` - Database migration
- `setup-university-colleges.bat` - Setup script

### Modified Files
- `src/pages/admin/universityAdmin/CollegeRegistration.tsx` - Updated to use new table and add college functionality

## API Functions

### universityCollegeService.js
- `getCollegesByUniversity(universityId)` - Get all colleges for a university
- `addCollegeToUniversity(universityId, organizationId, additionalData)` - Add college to university
- `getAvailableColleges(universityId)` - Get colleges that can be added
- `updateUniversityCollege(collegeId, updateData)` - Update college information
- `removeCollegeFromUniversity(collegeId)` - Remove/deactivate college
- `checkCollegeCodeUnique(universityId, code)` - Check code uniqueness
- `getUniversityCollegeStats(universityId)` - Get college statistics

## Usage Flow

1. **University Admin Login**: University admin logs into the system
2. **View Colleges**: Navigate to College Registration page to see affiliated colleges
3. **Add College**: Click "Add College" to select from available organizations
4. **Configure Details**: Set college code, dean information, established year
5. **Manage Colleges**: View, edit, or deactivate colleges as needed

## Data Mapping

### From organizations table to university_colleges:
- `id` → `college_id` (foreign key reference)
- `name` → `name`
- `email` → `dean_email`
- `phone` → `dean_phone`
- `code` → `code` (or auto-generated)
- `city`, `state`, `address`, `website`, `description` → stored in `metadata`
- `admin_id` → stored in `metadata.admin_id`

### Enhanced Data Access:
With the `college_id` foreign key, you can now:
- Join with organizations table to get real-time college data
- Access original college information without duplication
- Maintain data consistency between university_colleges and organizations
- Query college admin details, contact info, and organizational data

## Security

- RLS policies ensure university admins only see their colleges
- Foreign key constraints maintain data integrity
- Unique constraints prevent duplicate college codes within universities

## Troubleshooting

### Common Issues
1. **No colleges in dropdown**: Check if colleges exist in organizations table with `organization_type = 'college'`
2. **Permission errors**: Verify RLS policies and user's organizationId
3. **Duplicate code error**: College codes must be unique within each university

### Debug Queries
```sql
-- Check available colleges
SELECT * FROM organizations WHERE organization_type = 'college' AND approval_status = 'approved';

-- Check university colleges with organization data
SELECT uc.*, o.name as org_name, o.city, o.state 
FROM university_colleges uc 
LEFT JOIN organizations o ON uc.college_id = o.id 
WHERE uc.university_id = 'your-university-id';

-- Check user's organization
SELECT organizationId FROM users WHERE id = 'user-id';

-- Check colleges already linked to a university
SELECT college_id FROM university_colleges WHERE university_id = 'your-university-id';
```

## Next Steps

After setup, you can extend the system with:
- Student enrollment tracking per college
- Faculty management per college
- Course offerings per college
- Performance analytics per college
- Inter-college communication systems

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Verify database connections and RLS policies
3. Ensure user has proper organizationId set
4. Check that organizations table has college data