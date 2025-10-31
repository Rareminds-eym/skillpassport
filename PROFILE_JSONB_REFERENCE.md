# Profile JSONB Structure Reference

## Overview
The `students` table uses a `profile` JSONB field to store student information. This guide explains how to query and use this data.

## Profile JSONB Structure

Based on your actual data:

```json
{
  "_": 576,
  "age": null,
  "name": "HARRISH P",
  "email": "harrishhari2006@gmail.com",
  "nm_id": "asper130c23ug130che007",
  "skill": "Standard Operating Procedures (SOPs) and Documentation Control",
  "course": "Good Manufacturing Practices",
  "university": "Periyar University",
  "imported_at": "2025-10-15T08:20:28.910242",
  "branch_field": "B.Sc Chemistry",
  "trainer_name": null,
  "date_of_birth": "-",
  "district_name": "NAMAKKAL",
  "contact_number": 9788990383,
  "alternate_number": null,
  "college_school_name": "THIRUVALLUVAR GOVT. ARTS COLLEGE, RASIPURAM.",
  "registration_number": 62111,
  "contact_number_dial_code": 91
}
```

## Field Mapping

| Profile JSONB Key | Description | Used In Assignment System |
|------------------|-------------|---------------------------|
| `name` | Student's full name | ✅ Display name |
| `email` | Student's email | ✅ Contact & search |
| `university` | University name | ✅ Filter |
| `branch_field` | Department/Major | ✅ Filter (as "Department") |
| `college_school_name` | College name | ✅ Display |
| `registration_number` | Student reg number | ✅ Display & search |
| `nm_id` | Unique student ID | ℹ️ Reference |
| `district_name` | District | ℹ️ Additional info |
| `contact_number` | Phone number | ℹ️ Contact |
| `skill` | Primary skill | ℹ️ Additional info |
| `course` | Enrolled course | ℹ️ Additional info |
| `date_of_birth` | Date of birth | ℹ️ Personal info |

## SQL Queries for JSONB

### Query Students by Branch
```sql
SELECT id, name, email, profile
FROM students
WHERE profile->>'branch_field' = 'B.Sc Chemistry'
  AND approval_status = 'approved';
```

### Query Students by University
```sql
SELECT id, name, email, profile
FROM students
WHERE profile->>'university' = 'Periyar University'
  AND approval_status = 'approved';
```

### Search Students by Name (in JSONB)
```sql
SELECT id, name, email, profile
FROM students
WHERE profile->>'name' ILIKE '%HARRISH%'
  AND approval_status = 'approved';
```

### Search by Registration Number
```sql
SELECT id, name, email, profile
FROM students
WHERE profile->>'registration_number' ILIKE '%62111%'
  AND approval_status = 'approved';
```

### Get All Unique Departments
```sql
SELECT DISTINCT profile->>'branch_field' as branch_field
FROM students
WHERE profile->>'branch_field' IS NOT NULL
  AND approval_status = 'approved'
ORDER BY branch_field;
```

### Get All Unique Universities
```sql
SELECT DISTINCT profile->>'university' as university
FROM students
WHERE profile->>'university' IS NOT NULL
  AND approval_status = 'approved'
ORDER BY university;
```

## JavaScript/TypeScript Access

### Extracting Profile Data

```typescript
// From Supabase query result
const { data: students } = await supabase
    .from('students')
    .select('id, name, email, profile')
    .eq('approval_status', 'approved');

// Extract profile data
students.forEach(student => {
    const profile = student.profile || {};
    
    const studentData = {
        id: student.id,
        name: student.name || profile.name,
        email: student.email || profile.email,
        university: profile.university,
        branch: profile.branch_field,
        college: profile.college_school_name,
        regNumber: profile.registration_number,
        district: profile.district_name,
        phone: profile.contact_number
    };
    
    console.log(studentData);
});
```

### Supabase JSONB Query Operators

```typescript
// Filter by JSONB field
const { data } = await supabase
    .from('students')
    .select('*')
    .eq('profile->>branch_field', 'B.Sc Chemistry');

// Search in JSONB field (case-insensitive)
const { data } = await supabase
    .from('students')
    .select('*')
    .ilike('profile->>name', '%harrish%');

// Multiple OR conditions
const { data } = await supabase
    .from('students')
    .select('*')
    .or(
        `name.ilike.%${search}%,` +
        `email.ilike.%${search}%,` +
        `profile->>name.ilike.%${search}%,` +
        `profile->>email.ilike.%${search}%`
    );
```

## StudentSelectionModal Implementation

The modal has been updated to:

1. **Query both direct fields and profile JSONB:**
   ```typescript
   .select('id, name, email, profile, approval_status')
   ```

2. **Transform the data:**
   ```typescript
   const transformedStudents = data.map(student => {
       const profile = student.profile || {};
       return {
           id: student.id,
           name: student.name || profile.name,
           email: student.email || profile.email,
           university: profile.university,
           branch_field: profile.branch_field,
           college_school_name: profile.college_school_name,
           registration_number: profile.registration_number
       };
   });
   ```

3. **Filter using JSONB operators:**
   ```typescript
   // Filter by department/branch
   query = query.or(
       `branch_field.eq.${dept},` +
       `profile->>branch_field.eq.${dept}`
   );
   
   // Filter by university
   query = query.or(
       `university.eq.${univ},` +
       `profile->>university.eq.${univ}`
   );
   ```

## Data Fallback Strategy

The system uses a **fallback strategy** to handle data in both locations:

```typescript
// Priority order:
1. Direct column (e.g., student.name)
2. Profile JSONB (e.g., student.profile.name)
3. Default value (e.g., 'Unknown')

// Implementation
name: student.name || profile.name || 'Unknown'
email: student.email || profile.email || ''
university: student.university || profile.university || ''
```

This ensures the system works whether data is stored in:
- Direct columns
- Profile JSONB field
- Both (with direct column taking priority)

## Example Data Transformations

### From Database:
```json
{
  "id": "abc-123-def",
  "name": null,
  "email": null,
  "profile": {
    "name": "HARRISH P",
    "email": "harrishhari2006@gmail.com",
    "university": "Periyar University",
    "branch_field": "B.Sc Chemistry",
    "registration_number": 62111
  }
}
```

### After Transformation:
```json
{
  "id": "abc-123-def",
  "name": "HARRISH P",
  "email": "harrishhari2006@gmail.com",
  "university": "Periyar University",
  "branch_field": "B.Sc Chemistry",
  "college_school_name": "THIRUVALLUVAR GOVT. ARTS COLLEGE, RASIPURAM.",
  "registration_number": "62111"
}
```

## UI Display Example

In the StudentSelectionModal, data appears as:

```
☑  HARRISH P                                              abc-123
    harrishhari2006@gmail.com • 62111 • B.Sc Chemistry • Periyar University
```

## Benefits of JSONB Approach

✅ **Flexible schema** - Can add fields without migration
✅ **Backward compatible** - Works with both direct and JSONB storage
✅ **Fast querying** - PostgreSQL JSONB is indexed and efficient
✅ **Import-friendly** - Easy to store imported data as-is
✅ **No data loss** - Preserves all original fields

## Performance Considerations

### Indexed JSONB Queries
```sql
-- Create GIN index for better JSONB query performance
CREATE INDEX idx_students_profile_gin ON students USING gin (profile);

-- Create specific indexes for frequently queried fields
CREATE INDEX idx_students_profile_branch 
ON students ((profile->>'branch_field'));

CREATE INDEX idx_students_profile_university 
ON students ((profile->>'university'));
```

### Query Optimization
- ✅ Use `->>` for text extraction
- ✅ Use `->` for JSON object extraction
- ✅ Use GIN indexes for JSONB columns
- ✅ Filter by approval_status first (more selective)

## Troubleshooting

### No students showing up?
```sql
-- Check if students exist
SELECT COUNT(*) FROM students;

-- Check approval status
SELECT approval_status, COUNT(*) 
FROM students 
GROUP BY approval_status;

-- Check if profile exists
SELECT COUNT(*) 
FROM students 
WHERE profile IS NOT NULL;

-- Check specific fields
SELECT 
    id,
    name,
    email,
    profile->>'name' as profile_name,
    profile->>'email' as profile_email
FROM students
LIMIT 5;
```

### Filters not working?
- Check if `branch_field` exists in profile
- Verify university names match exactly
- Check for trailing spaces or case sensitivity

### Search not working?
- Ensure ILIKE is used (case-insensitive)
- Check if fields are null
- Verify the search query syntax

## Migration Notes

If you want to migrate profile data to direct columns:

```sql
-- Update direct columns from profile JSONB
UPDATE students
SET 
    name = profile->>'name',
    email = profile->>'email',
    university = profile->>'university',
    branch_field = profile->>'branch_field',
    college_school_name = profile->>'college_school_name',
    registration_number = profile->>'registration_number'
WHERE profile IS NOT NULL
  AND (name IS NULL OR email IS NULL);
```

**Note:** The current system works with data in either location, so migration is optional.

