# Profile Column Migration Guide

## Problem
The code was fetching student data from the JSONB `profile` column (`displayData.name` from `realStudentData?.profile`) instead of using the individual columns that already exist in the students table.

## Solution
Updated the code to prioritize individual columns over the JSONB profile column for better performance and data consistency.

## Changes Made

### 1. Database Migration (`migrate_profile_to_columns.sql`)
- Migrates existing data from `profile` JSONB to individual columns
- Adds indexes for better performance
- Adds verification queries

### 2. ProfileHeroEdit Component
**Before:**
```javascript
const displayData = realStudentData?.profile;
// Used: displayData.name, displayData.department, etc.
```

**After:**
```javascript
const displayData = realStudentData ? {
  name: realStudentData.name,                    // Individual column
  email: realStudentData.email,                  // Individual column
  department: realStudentData.branch_field,      // Individual column
  university: realStudentData.university,        // Individual column
  github_link: realStudentData.github_link,      // Individual column
  // ... other individual columns
  // Fallback to profile JSONB for any missing data
  ...realStudentData.profile
} : null;
```

### 3. Student Service (`studentServiceProfile.js`)
Updated `transformProfileData()` function to:
- Accept the full student record as a parameter
- Prioritize individual columns over profile JSONB data
- Use fallback to profile JSONB when individual columns are empty

**Key Changes:**
```javascript
// Before
name: profile.name || 'Student'

// After  
name: data.name || profileData.name || 'Student'
```

### 4. Dashboard Component
Updated institution info logic to use individual columns as fallback when foreign key relationships are missing.

## Column Mapping

| UI Field | Individual Column | Profile JSONB | Notes |
|----------|------------------|---------------|-------|
| Name | `name` | `profile.name` | ✅ Migrated |
| Email | `email` | `profile.email` | ✅ Migrated |
| Department | `branch_field` | `profile.department` | ✅ Migrated |
| University | `university` | `profile.university` | ✅ Migrated |
| Phone | `contact_number` | `profile.phone` | ✅ Migrated |
| GitHub | `github_link` | `profile.github_link` | ✅ Migrated |
| LinkedIn | `linkedin_link` | `profile.linkedin_link` | ✅ Migrated |
| Portfolio | `portfolio_link` | `profile.portfolio_link` | ✅ Migrated |
| Registration | `registration_number` | `profile.registrationNumber` | ✅ Migrated |
| College | `college_school_name` | `profile.college` | ✅ Migrated |
| District | `district_name` | `profile.district` | ✅ Migrated |
| Age | `age` | `profile.age` | ✅ Migrated |
| Date of Birth | `date_of_birth` | `profile.dateOfBirth` | ✅ Migrated |

## Benefits

1. **Performance**: Direct column access is faster than JSONB queries
2. **Indexing**: Individual columns can be properly indexed
3. **Data Integrity**: Better type checking and constraints
4. **Query Optimization**: Database can optimize queries better
5. **Backward Compatibility**: Still falls back to profile JSONB if individual columns are empty

## How to Apply

1. **Run the migration script** in Supabase SQL Editor:
   ```sql
   -- Copy and paste the contents of migrate_profile_to_columns.sql
   ```

2. **Test the changes**:
   - Verify that `{displayData.name || "Student Name"}` now shows the correct name
   - Check that all profile fields are displaying correctly
   - Ensure social media links work properly

3. **Monitor performance**:
   - Individual column queries should be faster
   - Profile page should load quicker

## Rollback Plan
If issues occur, the profile JSONB column still contains all the original data and can be used as a fallback. The code is designed to gracefully fall back to profile JSONB when individual columns are empty.

## Complex Data (Using Separate Tables) ✅

You already have separate tables for complex data - **no JSONB columns needed**:

### **Existing Separate Tables**
```sql
-- ✅ Already implemented as separate tables
certificates              -- Certificates table
education                -- Education history table  
training                 -- Training courses table
experience               -- Work experience table
skills                   -- Skills table (with type: 'technical'/'soft')
projects                 -- Projects table
skill_passports          -- Skill passport data table
```

### **Benefits of Separate Tables**
- ✅ Better performance than JSONB arrays
- ✅ Proper foreign key relationships  
- ✅ Individual record tracking and approval
- ✅ Better querying and filtering capabilities
- ✅ Easier to maintain and update individual records

## Next Steps
- Run the migration script to add missing columns (class_year, verified, employability_score)
- Verify separate tables are being used instead of profile JSONB arrays
- Consider removing redundant data from profile JSONB after confirming migration success
- Add database constraints to ensure data consistency