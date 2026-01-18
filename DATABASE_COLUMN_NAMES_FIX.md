# Database Column Names Fix - COMPLETE ✅

## Problem
Grade and school information not displaying on assessment results page. Console showed database errors.

## Error Messages (Chronological)
1. **First error**: `column students.enrollment_number does not exist` - Perhaps you meant "students.enrollmentNumber"
2. **After first fix attempt**: `column students.admissionNumber does not exist` - Perhaps you meant "students.admission_number"

## Root Cause Discovery
The database uses a **MIX of camelCase AND snake_case** column names:
- **camelCase**: `enrollmentNumber`, `schoolClassId`, `contactNumber`, `dateOfBirth`
- **snake_case**: `school_id`, `college_id`, `roll_number`, `admission_number`, `grade_start_date`, `user_id`, `branch_field`, `college_school_name`, `course_name`

**The issue**: The SELECT query was inconsistent with the actual database schema.

## Final Solution ✅

Updated the SELECT query and ALL field references to match the **actual database schema** (mix of both naming conventions).

**File**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`

### Changes Made:

#### 1. SELECT Query - Using Actual Column Names ✅
```javascript
.select(`
    id, 
    name,
    enrollmentNumber,       // ✅ camelCase (actual column name)
    admission_number,       // ✅ snake_case (actual column name)
    roll_number,           // ✅ snake_case (actual column name)
    grade,
    semester,
    college_id,            // ✅ snake_case (actual column name)
    school_id,             // ✅ snake_case (actual column name)
    schoolClassId,         // ✅ camelCase (actual column name)
    branch_field,          // ✅ snake_case (actual column name)
    course_name,           // ✅ snake_case (actual column name)
    college_school_name,   // ✅ snake_case (actual column name)
    grade_start_date       // ✅ snake_case (actual column name)
`)
.eq('user_id', user.id)  // ✅ snake_case (actual column name)
```

#### 2. Updated Field References ✅
All references throughout the function were updated to match actual database columns:

| Field | Actual Column Name | Type |
|-------|-------------------|------|
| Enrollment Number | `enrollmentNumber` | camelCase |
| Admission Number | `admission_number` | snake_case |
| Roll Number | `roll_number` | snake_case |
| College ID | `college_id` | snake_case |
| School ID | `school_id` | snake_case |
| School Class ID | `schoolClassId` | camelCase |
| Branch Field | `branch_field` | snake_case |
| Course Name | `course_name` | snake_case |
| College School Name | `college_school_name` | snake_case |
| Grade Start Date | `grade_start_date` | snake_case |
| User ID | `user_id` | snake_case |

#### 3. Updated Conditional Checks ✅
```javascript
// Using actual column names:
if (studentData.college_id) { ... }        // snake_case
if (studentData.school_id) { ... }         // snake_case
if (studentData.schoolClassId) { ... }     // camelCase
if (studentData.enrollmentNumber) { ... }  // camelCase
if (studentData.admission_number) { ... }  // snake_case
if (studentData.roll_number) { ... }       // snake_case
```

#### 4. Updated Organization Fetching ✅
```javascript
if (studentData.college_id) {  // snake_case
    const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', studentData.college_id)
        .maybeSingle();
}

if (studentData.schoolClassId) {  // camelCase
    const { data: classData } = await supabase
        .from('school_classes')
        .select('grade')
        .eq('id', studentData.schoolClassId)
        .maybeSingle();
}
```

## Database Schema (Actual)

The `students` table uses **MIXED naming conventions**:

```sql
CREATE TABLE students (
    -- camelCase columns:
    enrollmentNumber VARCHAR,
    schoolClassId UUID,
    contactNumber VARCHAR,
    dateOfBirth DATE,
    
    -- snake_case columns:
    school_id UUID,
    college_id UUID,
    roll_number VARCHAR,
    admission_number VARCHAR,
    grade_start_date DATE,
    user_id UUID,
    branch_field VARCHAR,
    college_school_name VARCHAR,
    course_name VARCHAR,
    
    -- Other columns...
);
```

## Expected Behavior After Fix

### Database Query:
- ✅ Query executes successfully without errors
- ✅ Student data is fetched correctly
- ✅ All fields are accessible with correct naming

### Results Page Display:
- ✅ Grade shows correct value (e.g., "11", "Year 2", "Semester 4")
- ✅ School/College shows correct institution name
- ✅ Roll number shows correct value
- ✅ Programme/Stream shows correct value
- ✅ Complete student information in report header

## Testing

### Before Fix:
- ❌ Database error: "column students.enrollment_number does not exist"
- ❌ Student data query failed
- ❌ Grade shows "—"
- ❌ School shows "—"
- ❌ Roll number shows "—"

### After Fix:
- ✅ Database query succeeds
- ✅ Student data fetched successfully
- ✅ All fields accessible with correct names
- ✅ Grade displays correctly
- ✅ School/College displays correctly
- ✅ Roll number displays correctly
- ✅ All student information visible

## Related Issues

This fix resolves:
1. ✅ Grade not showing
2. ✅ School not showing
3. ✅ Roll number not showing
4. ✅ Programme/Stream not showing
5. ✅ Database query errors

## Lessons Learned

1. **Database has mixed naming conventions**: Some columns use camelCase, others use snake_case
2. **Error messages can be misleading**: First error suggested one thing, but the actual schema was different
3. **Always check actual schema**: Use `information_schema.columns` to verify actual column names
4. **Consistency matters**: Both the SELECT query AND field references must match the actual database

## Prevention

To prevent similar issues in the future:

1. **Document the actual naming convention** for each table
2. **Use TypeScript types** generated from the actual database schema
3. **Add database query tests** to catch naming mismatches early
4. **Consider standardizing** to one naming convention (preferably snake_case for PostgreSQL)

---

**Fix Date**: January 18, 2026
**Issue**: Database column name mismatch (query vs actual schema)
**Status**: ✅ COMPLETE - All column names corrected to match actual database
**Branch**: `fix/Assigment-Evaluation`
**Files Modified**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`
