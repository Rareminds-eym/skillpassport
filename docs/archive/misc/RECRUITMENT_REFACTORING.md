# Recruitment Section Refactoring - Using Relational Tables

## Overview
This document describes the refactoring of the recruitment/recruiter section to use proper relational database tables instead of the `students.profile` JSONB field.

## Changes Made

### 1. Database Schema
The application now uses the following relational tables instead of storing data in `students.profile`:

- **skills** table - stores student skills with attributes like name, type, level, description, verified status
- **projects** table - stores student projects with title, description, tech stack, dates, links
- **certificates** table - stores certifications with issuer, title, dates, credential IDs
- **experience** table - stores work experience with organization, role, duration, verified status  
- **trainings** table - stores training courses with organization, duration, description

All these tables reference `students(user_id)` via their `student_id` foreign key.

### 2. Updated Files

#### `/src/hooks/useStudents.ts`
**Key Changes:**
- Removed dependency on `profile` JSONB field parsing
- Added proper TypeScript interfaces for each table (Skill, Project, Certificate, Experience, Training)
- Updated `StudentRow` interface to include arrays from joined tables
- Updated database query to use Supabase's nested select syntax:
  ```typescript
  .select(`
    id, user_id, name, email, ...all student fields...,
    skills!skills_student_id_fkey(...),
    projects!projects_student_id_fkey(...),
    certificates!certificates_student_id_fkey(...),
    experience!experience_student_id_fkey(...),
    trainings!trainings_student_id_fkey(...)
  `)
  ```
- Updated `mapToUICandidate` function to:
  - Read data directly from student table columns instead of parsing profile JSONB
  - Filter enabled skills, projects, and certificates
  - Pass through arrays from joined tables

#### `/src/pages/recruiter/TalentPool.tsx`
**Key Changes:**
- Removed all `profile.*` property accesses
- Updated filter options generation (skillOptions, courseOptions, locationOptions) to use direct student properties
- Updated comprehensive search logic to access:
  - `student.skills` instead of `profile.skills`
  - `student.projects` instead of `profile.projects`
  - `student.certificates` instead of `profile.certificates`
  - `student.experience` instead of `profile.experience`
  - `student.trainings` instead of `profile.training`
  - Direct student fields like `student.name`, `student.email`, `student.nm_id`, etc. instead of `profile.name`, etc.
- Updated filter application logic to use direct student properties
- Removed soft skills and technical skills searches (these are now consolidated in the `skills` table)

### 3. Benefits

**Data Integrity:**
- Proper relational structure with foreign keys
- Type safety at database level
- Ability to add constraints and validations

**Performance:**
- No more JSONB parsing overhead
- Ability to index individual columns
- Efficient JOINs using foreign keys
- Can filter/search at database level instead of application level

**Maintainability:**
- Clear schema with explicit columns
- Easier to understand data structure
- Type-safe queries with TypeScript interfaces
- No more nested object traversal

**Scalability:**
- Can easily add new columns to tables
- Better query optimization opportunities  
- Ability to use database-level aggregations

### 4. Migration Notes

**Backward Compatibility:**
- The `students.profile` JSONB field still exists in the database
- Legacy data can be migrated from profile JSONB to relational tables
- Once migration is complete, the profile field can be deprecated

**Foreign Key Relationships:**
All related tables use `students.user_id` as the foreign key reference:
```sql
FOREIGN KEY (student_id) REFERENCES students(user_id)
```

### 5. Testing Checklist

- [ ] Verify students data loads correctly
- [ ] Test skill filtering
- [ ] Test course/department filtering
- [ ] Test location filtering
- [ ] Test comprehensive search across all fields
- [ ] Verify pagination works correctly
- [ ] Test sorting options (relevance, AI score, name, last updated)
- [ ] Verify candidate cards display correct information
- [ ] Test shortlist functionality
- [ ] Test interview scheduling

### 6. Next Steps

1. **Data Migration:** Create migration scripts to move data from `students.profile` JSONB to relational tables
2. **Other Sections:** Apply similar refactoring to other parts of the application (student portal, educator portal, etc.)
3. **API Updates:** Update any API endpoints that still rely on profile JSONB
4. **Deprecation:** Once fully migrated, remove profile JSONB field
5. **Performance Monitoring:** Monitor query performance and add indexes as needed

### 7. Known Limitations

- The education data is not yet moved to a separate table (still might be in profile JSONB if it exists)
- Year filtering still relies on `student.year` which may not exist in new schema
- AI score is currently hardcoded to 0 and needs proper implementation

## Database Query Example

Here's an example of the new query structure:

```typescript
const { data } = await supabase
  .from('students')
  .select(`
    *,
    skills!skills_student_id_fkey(*),
    projects!projects_student_id_fkey(*),
    certificates!certificates_student_id_fkey(*),
    experience!experience_student_id_fkey(*),
    trainings!trainings_student_id_fkey(*)
  `)
  .order('updated_at', { ascending: false })
  .limit(500)
```

This single query fetches the student data along with all related records from the five relational tables, eliminating the need for JSONB parsing.

## Conclusion

This refactoring establishes a solid foundation for the recruitment section by using proper relational database design. The changes improve data integrity, performance, and maintainability while maintaining the same functionality for recruiters.
