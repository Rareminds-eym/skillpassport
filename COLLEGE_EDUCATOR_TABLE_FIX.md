# College Educator Table Fix

## Problem
The application was trying to insert college educator profiles into the `school_educators` table with a `college_id` column that doesn't exist in the schema cache, causing the error:
```
Could not find the 'college_id' column of 'school_educators' in the schema cache
```

## Solution
Separated college educators and school educators into different tables:
- **School educators** → `school_educators` table (existing)
- **College educators** → `college_lecturers` table (new)

## Changes Made

### 1. Database Migration
Created `database/migrations/005_create_college_lecturers.sql`:
- New `college_lecturers` table with camelCase column names
- Foreign keys to `users` and `colleges` tables
- Indexes for performance
- RLS policies for security
- Metadata JSONB field for flexible data storage (firstName, lastName, email, phone, designation)

### 2. Service Layer Updates
Updated `src/services/educatorAuthService.js`:

#### `createEducatorProfile()`
- Routes to `college_lecturers` table for college educators
- Routes to `school_educators` table for school educators
- Maps field names correctly for each table (camelCase vs snake_case)
- Stores personal info in metadata JSONB for college educators

#### `getEducatorByEmail()`
- Checks both `school_educators` and `college_lecturers` tables
- Returns entity type to identify which table the educator is in
- Queries metadata JSONB for college educator email lookup

#### `getEducatorProfile()`
- Queries `users` table first to determine entity type
- Routes to appropriate table based on entity type
- Normalizes response format for consistency
- Includes related college/school data via foreign key joins

#### `updateEducatorProfile()`
- Determines entity type from `users` table
- Routes updates to correct table
- Maps field names appropriately (camelCase for college, snake_case for school)
- Handles metadata updates for college educators

## Table Schema Comparison

### school_educators (existing)
```sql
- user_id (UUID)
- school_id (UUID)
- first_name, last_name, email, phone_number (columns)
- employee_id, department, designation, etc.
- entity_type (column)
```

### college_lecturers (new)
```sql
- user_id (UUID)
- userId (UUID) - duplicate for compatibility
- collegeId (UUID)
- employeeId, department, specialization, qualification
- experienceYears, dateOfJoining
- accountStatus, createdAt, updatedAt
- metadata (JSONB) - stores firstName, lastName, email, phone, designation
```

## Migration Steps

1. **Run the migration**:
   ```bash
   # Execute the SQL migration in your Supabase dashboard or via CLI
   psql -f database/migrations/005_create_college_lecturers.sql
   ```

2. **Test college educator signup**:
   - Try creating a college educator account
   - Verify data is inserted into `college_lecturers` table
   - Check that metadata JSONB contains personal information

3. **Test school educator signup**:
   - Verify school educators still work correctly
   - Confirm data goes to `school_educators` table

4. **Test profile retrieval**:
   - Login as college educator and verify profile loads
   - Login as school educator and verify profile loads

## Benefits

1. **Proper separation of concerns**: College and school educators have different data requirements
2. **Schema flexibility**: Metadata JSONB allows easy extension without schema changes
3. **Type safety**: Entity type routing prevents data corruption
4. **Backward compatibility**: School educators continue working without changes
5. **Performance**: Separate tables with appropriate indexes

## Notes

- The `userId` field is duplicated as both camelCase and snake_case for compatibility
- Personal information (name, email, phone) is stored in metadata JSONB for college educators
- The service layer handles all the routing logic transparently
- RLS policies ensure proper data access control
