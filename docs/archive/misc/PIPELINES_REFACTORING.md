# Pipelines Route Refactoring

## Overview
Refactored the `/recruitment/pipelines` route to eliminate dependency on the `students.profile` JSONB field and use proper relational database tables instead.

## Changes Made

### 1. pipelineService.ts
**File**: `/src/services/pipelineService.ts`

#### Students Table Column Mapping
The students table doesn't have `dept`, `college`, or `location` as direct columns. These are derived from:
- `dept` = `branch_field` OR `course_name`
- `college` = `college_school_name` OR `university`
- `location` = `district_name`

#### getPipelineCandidatesByStage (Lines 138-181)
- **Before**: Fetched `students.profile` JSONB field and parsed it
- **After**: 
  - Query fetches actual DB columns: `college_school_name`, `university`, `branch_field`, `course_name`, `district_name`
  - Maps these to UI-friendly names in JavaScript: `dept`, `college`, `location`
  - Fetches related skills with foreign key: `skills!skills_student_id_fkey`
  - Skills are filtered to only show `enabled=true` AND `approval_status IN ('approved', 'verified')`
  - Skills are mapped to array of strings (skill names) for consistency

```typescript
// New query structure
const { data: students, error: studentsError } = await supabase
  .from('students')
  .select(`
    user_id, id, name, email, contact_number, 
    college_school_name, university, branch_field, course_name, district_name,
    cgpa, employability_score, verified, ai_score_overall,
    skills!skills_student_id_fkey(id, name, enabled, approval_status)
  `)
  .in('user_id', studentIds);

// Then map to UI-friendly names
studentsMap.set(student.user_id, {
  ...student,
  dept: student.branch_field || student.course_name,
  college: student.college_school_name || student.university,
  location: student.district_name,
  skills: approvedSkills
});
```

#### getPipelineCandidatesWithFilters (Lines 302-365)
- **Before**: Fetched `students.profile` JSONB and parsed nested data
- **After**: 
  - Same relational query structure as above
  - Removed all profile field parsing logic
  - Skills filtering now works on the relational skills table data
  - AI score and location filtering work on direct student columns

#### addCandidateToPipeline (Lines 489-506)
- **Before**: Fetched `students.profile` to extract AI scores
- **After**: 
  - Query changed from `.eq('id', pipelineData.student_id)` to `.eq('user_id', pipelineData.student_id)`
  - Directly selects `ai_score_overall` and `employability_score` columns
  - Removed profile JSONB parsing

### 2. Data Structure Changes

#### Student Object Structure
**Before (JSONB)**:
```typescript
{
  students: {
    id: number,
    user_id: string,
    profile: {  // JSONB field
      dept: string,
      college: string,
      location: string,
      skills: string[],
      ai_score_overall: number
    }
  }
}
```

**After (Relational)**:
```typescript
{
  students: {
    id: number,
    user_id: string,
    dept: string,           // Direct column
    college: string,        // Direct column
    location: string,       // Direct column
    ai_score_overall: number, // Direct column
    skills: string[],       // Computed from skills table
    // skills table structure:
    // - id, name, enabled, approval_status
    // - Only approved/verified + enabled skills included
  }
}
```

### 3. Foreign Key Relationships

**Key Constraint**: All related tables use `student_id` that references `students(user_id)`, NOT `students(id)`

```sql
-- Skills table
ALTER TABLE skills ADD CONSTRAINT skills_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES students(user_id);

-- Similar constraints for:
-- - projects_student_id_fkey
-- - certificates_student_id_fkey  
-- - experience_student_id_fkey
-- - trainings_student_id_fkey
```

## Query Patterns

### Fetching Pipeline Candidates with Student Data
```typescript
// Step 1: Fetch pipeline candidates
const { data: pipelineCandidates } = await supabase
  .from('pipeline_candidates')
  .select('*')
  .eq('opportunity_id', opportunityId)
  .eq('stage', stage);

// Step 2: Extract unique student IDs
const studentIds = [...new Set(pipelineCandidates.map(pc => pc.student_id))];

// Step 3: Fetch students with relational data
const { data: students } = await supabase
  .from('students')
  .select(`
    user_id, name, email, department as dept, university as college,
    location, ai_score_overall,
    skills!skills_student_id_fkey(name, enabled, approval_status)
  `)
  .in('user_id', studentIds);

// Step 4: Filter and transform skills
const approvedSkills = student.skills
  .filter(s => s.enabled && ['approved', 'verified'].includes(s.approval_status))
  .map(s => s.name);
```

### Skill Filtering in Pipeline Filters
```typescript
// Client-side filtering for skills
if (filters.skills && filters.skills.length > 0) {
  filteredData = filteredData.filter(candidate => {
    const studentSkills = candidate.students?.skills || [];
    return filters.skills.some(skill => 
      studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
  });
}
```

## Benefits

1. **Data Integrity**: Relational constraints ensure data consistency
2. **Query Performance**: Can leverage database indexes on relational tables
3. **Scalability**: Easier to add new fields to related tables
4. **Maintainability**: Type-safe queries with explicit column references
5. **Approval Workflow**: Skills are filtered by approval_status at query time

## Performance Optimizations

### Recommended Database Indexes
```sql
-- For pipeline queries
CREATE INDEX idx_pipeline_candidates_opportunity_stage 
  ON pipeline_candidates(opportunity_id, stage, status);

-- For skills filtering
CREATE INDEX idx_skills_student_enabled_approved 
  ON skills(student_id, enabled, approval_status) 
  WHERE enabled = true AND approval_status IN ('approved', 'verified');

-- For student lookups
CREATE INDEX idx_students_user_id ON students(user_id);
```

## Testing Checklist

- [ ] Pipeline candidates load correctly for each stage
- [ ] Skills display properly in candidate cards
- [ ] Advanced filters work (skills, department, location, AI score)
- [ ] Sorting works for all fields
- [ ] Adding candidates from talent pool works
- [ ] Moving candidates between stages works
- [ ] Next action modal updates candidates correctly
- [ ] Bulk operations work (email, WhatsApp, assign, reject)
- [ ] Export pipeline to CSV includes all data
- [ ] Global search finds candidates by skills

## Migration Notes

### For Existing Data
If you have existing data in the `students.profile` JSONB field:

1. **Skills Migration**:
```sql
-- Example migration query (adjust based on your JSONB structure)
INSERT INTO skills (student_id, name, enabled, approval_status)
SELECT 
  s.user_id,
  jsonb_array_elements_text(s.profile->'skills'),
  true,
  'approved'
FROM students s
WHERE s.profile->'skills' IS NOT NULL;
```

2. **AI Score Migration**:
```sql
UPDATE students s
SET ai_score_overall = (s.profile->>'ai_score_overall')::numeric
WHERE s.profile->'ai_score_overall' IS NOT NULL;
```

### Deployment Steps
1. Run migrations to populate relational tables from JSONB
2. Add database indexes for performance
3. Deploy updated code
4. Monitor for any issues
5. After verification, consider deprecating profile JSONB field

## Files Modified

- `/src/services/pipelineService.ts` - Core pipeline data fetching logic
- No changes needed to `/src/pages/recruiter/Pipelines.tsx` - Component already compatible

## Related Documentation

- [Recruitment Refactoring](./RECRUITMENT_REFACTORING.md)
- [Certificates Fix](./CERTIFICATES_FIX.md)
- [Data Fetching Optimization Guide](./DATA_FETCHING_OPTIMIZATION_GUIDE.md)
