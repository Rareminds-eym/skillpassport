# Curriculum Builder - Data Flow & School-Specific Configuration

## 🎯 Yes, Each School Can Have Different Data!

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRICULUM BUILDER UI                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Subject    │  │    Class     │  │ Academic Year│     │
│  │   Dropdown   │  │   Dropdown   │  │   Dropdown   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CURRICULUM SERVICE (curriculumService.ts)       │
│                                                              │
│  getSubjects()  →  Load school-specific OR global          │
│  getClasses()   →  Load school-specific OR global          │
│  getAcademicYears() → Load school-specific OR global       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  curriculum_subjects                                │    │
│  │  ┌──────────────────┬──────────────────────────┐  │    │
│  │  │ school_id = NULL │ school_id = 'school-xyz' │  │    │
│  │  │ (GLOBAL)         │ (SCHOOL-SPECIFIC)        │  │    │
│  │  ├──────────────────┼──────────────────────────┤  │    │
│  │  │ Mathematics      │ Robotics                 │  │    │
│  │  │ Physics          │ AI & ML                  │  │    │
│  │  │ Chemistry        │ Data Science             │  │    │
│  │  │ Biology          │                          │  │    │
│  │  │ English          │                          │  │    │
│  │  │ ...              │                          │  │    │
│  │  └──────────────────┴──────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  curriculum_classes                                 │    │
│  │  ┌──────────────────┬──────────────────────────┐  │    │
│  │  │ school_id = NULL │ school_id = 'school-abc' │  │    │
│  │  │ (GLOBAL)         │ (SCHOOL-SPECIFIC)        │  │    │
│  │  ├──────────────────┼──────────────────────────┤  │    │
│  │  │ 1                │ Pre-K                    │  │    │
│  │  │ 2                │ Kindergarten             │  │    │
│  │  │ 3                │ Grade 1                  │  │    │
│  │  │ ...              │ Grade 2                  │  │    │
│  │  │ 12               │ ...                      │  │    │
│  │  └──────────────────┴──────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  curriculum_academic_years                          │    │
│  │  ┌──────────────────┬──────────────────────────┐  │    │
│  │  │ school_id = NULL │ school_id = 'school-def' │  │    │
│  │  │ (GLOBAL)         │ (SCHOOL-SPECIFIC)        │  │    │
│  │  ├──────────────────┼──────────────────────────┤  │    │
│  │  │ 2024-2025 ★      │ 2024-2025 ★              │  │    │
│  │  │ 2025-2026        │ 2025-2026                │  │    │
│  │  │ 2026-2027        │ 2026-2027                │  │    │
│  │  └──────────────────┴──────────────────────────┘  │    │
│  │  ★ = is_current = TRUE                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Loading Logic

```javascript
// For School XYZ (has custom subjects)
getSubjects() {
  1. Query: SELECT * FROM curriculum_subjects 
             WHERE school_id = 'school-xyz-id' AND is_active = TRUE
  
  2. Result: Found 3 subjects (Robotics, AI & ML, Data Science)
  
  3. Return: ['Robotics', 'AI & ML', 'Data Science']
}

// For School ABC (no custom subjects)
getSubjects() {
  1. Query: SELECT * FROM curriculum_subjects 
             WHERE school_id = 'school-abc-id' AND is_active = TRUE
  
  2. Result: No subjects found
  
  3. Fallback Query: SELECT * FROM curriculum_subjects 
                     WHERE school_id IS NULL AND is_active = TRUE
  
  4. Return: ['Mathematics', 'Physics', 'Chemistry', 'Biology', ...]
}
```

## Real-World Examples

### School A: Standard CBSE School
```
Configuration: Uses global defaults
Subjects: Mathematics, Physics, Chemistry, Biology, English, etc.
Classes: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
Academic Years: 2024-2025, 2025-2026, 2026-2027
```

### School B: Tech-Focused School
```
Configuration: Custom subjects added
Subjects: 
  - Robotics
  - AI & Machine Learning
  - Data Science
  - Cybersecurity
  - IoT (Internet of Things)
Classes: 9, 10, 11, 12 (only high school)
Academic Years: 2024-2025, 2025-2026
```

### School C: International School (IB)
```
Configuration: Custom classes and subjects
Subjects:
  - Theory of Knowledge
  - Extended Essay
  - CAS (Creativity, Activity, Service)
  - Mathematics (Analysis & Approaches)
  - Mathematics (Applications & Interpretation)
Classes:
  - Year 1, Year 2, Year 3, ..., Year 11
  - IB Year 1 (Grade 11)
  - IB Year 2 (Grade 12)
Academic Years: 2024-2025, 2025-2026
```

### School D: Vocational Training Institute
```
Configuration: Completely custom
Subjects:
  - Electrical Engineering
  - Plumbing
  - Carpentry
  - Welding
  - Automotive Repair
Classes:
  - Certificate Course
  - Diploma - Year 1
  - Diploma - Year 2
  - Advanced Diploma
Academic Years: 2024-2025, 2025-2026
```

## How to Add School-Specific Data

### Option 1: SQL Insert (Quick)
```sql
-- Get your school ID
SELECT id FROM schools WHERE name = 'Your School Name';

-- Add custom subjects
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('your-school-id', 'Robotics', 1),
  ('your-school-id', 'AI & ML', 2);
```

### Option 2: Supabase Dashboard (Easy)
1. Open Supabase Dashboard
2. Go to Table Editor → curriculum_subjects
3. Click "Insert row"
4. Fill in school_id, name, display_order
5. Save

### Option 3: Admin UI (Future)
- Build an admin page for school admins
- Add/edit/delete subjects, classes, years
- No SQL knowledge required

## Benefits of This Approach

### ✅ Flexibility
- Each school can customize as needed
- No code changes required
- Instant updates

### ✅ Simplicity
- Schools without special needs use global defaults
- No configuration required for standard schools
- Works out of the box

### ✅ Scalability
- Supports any education system
- Supports any number of schools
- Supports any customization level

### ✅ Maintainability
- Configuration in database, not code
- Easy to update
- Easy to audit

## Summary

**Question:** For each school the data will be different?

**Answer:** 
- ✅ **YES** - Each school CAN have different data
- ✅ **OPTIONAL** - Schools can use global defaults if they don't need customization
- ✅ **FLEXIBLE** - Schools can customize subjects, classes, and academic years independently
- ✅ **AUTOMATIC** - System automatically loads school-specific data or falls back to global defaults

**Current Implementation:**
```typescript
// Service automatically handles school-specific vs global
const subjects = await getSubjects(); 
// Returns school-specific if exists, otherwise global

const classes = await getClasses();
// Returns school-specific if exists, otherwise global

const academicYears = await getAcademicYears();
// Returns school-specific if exists, otherwise global
```

**Result:** Each school sees their own configuration, or global defaults if they haven't customized! 🎓
