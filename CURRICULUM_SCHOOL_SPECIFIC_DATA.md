# Curriculum Builder - School-Specific Configuration

## How It Works

The system uses a **two-tier configuration approach**:

1. **Global Defaults** (school_id = NULL)
   - Available to ALL schools
   - Used when school doesn't have custom configuration
   - Pre-populated with standard subjects, classes, and years

2. **School-Specific** (school_id = specific UUID)
   - Custom configuration for individual schools
   - Overrides global defaults
   - Each school can have unique subjects, classes, and years

## Data Loading Logic

```
For Each School:
  1. Try to load school-specific data (WHERE school_id = 'school-uuid')
  2. If no school-specific data found, load global defaults (WHERE school_id IS NULL)
  3. Display in UI
```

### Example Scenarios

#### Scenario 1: School Uses Global Defaults
```sql
-- School ABC has no custom configuration
-- System loads global defaults:
SELECT * FROM curriculum_subjects WHERE school_id IS NULL;
-- Returns: Mathematics, Physics, Chemistry, Biology, etc.
```

#### Scenario 2: School Has Custom Subjects
```sql
-- School XYZ added custom subjects
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('school-xyz-uuid', 'Robotics', 1),
  ('school-xyz-uuid', 'AI & Machine Learning', 2),
  ('school-xyz-uuid', 'Environmental Science', 3);

-- System loads school-specific data:
SELECT * FROM curriculum_subjects WHERE school_id = 'school-xyz-uuid';
-- Returns: Robotics, AI & Machine Learning, Environmental Science
```

#### Scenario 3: School Has Custom Classes
```sql
-- International School with different grade naming
INSERT INTO curriculum_classes (school_id, name, display_order) VALUES
  ('school-intl-uuid', 'Pre-K', 1),
  ('school-intl-uuid', 'Kindergarten', 2),
  ('school-intl-uuid', 'Grade 1', 3),
  ('school-intl-uuid', 'Grade 2', 4);

-- System loads school-specific classes
SELECT * FROM curriculum_classes WHERE school_id = 'school-intl-uuid';
-- Returns: Pre-K, Kindergarten, Grade 1, Grade 2
```

## Adding School-Specific Data

### Method 1: Direct SQL Insert

#### Add Custom Subjects
```sql
-- Get your school_id first
SELECT id, name FROM schools WHERE name = 'Your School Name';

-- Add custom subjects
INSERT INTO curriculum_subjects (school_id, name, description, display_order) VALUES
  ('your-school-id', 'Robotics', 'Introduction to Robotics and Automation', 1),
  ('your-school-id', 'Data Science', 'Data Analysis and Visualization', 2),
  ('your-school-id', 'Digital Marketing', 'Modern Marketing Strategies', 3);
```

#### Add Custom Classes
```sql
-- Add custom class names
INSERT INTO curriculum_classes (school_id, name, description, display_order) VALUES
  ('your-school-id', 'Nursery', 'Pre-primary education', 1),
  ('your-school-id', 'LKG', 'Lower Kindergarten', 2),
  ('your-school-id', 'UKG', 'Upper Kindergarten', 3);
```

#### Add Custom Academic Years
```sql
-- Add school-specific academic years
INSERT INTO curriculum_academic_years (school_id, year, start_date, end_date, is_current) VALUES
  ('your-school-id', '2024-2025', '2024-06-01', '2025-05-31', TRUE),
  ('your-school-id', '2025-2026', '2025-06-01', '2026-05-31', FALSE);
```

### Method 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Select the table (`curriculum_subjects`, `curriculum_classes`, or `curriculum_academic_years`)
3. Click "Insert row"
4. Fill in:
   - `school_id`: Your school's UUID
   - `name`: Subject/Class/Year name
   - `display_order`: Order in dropdown
   - `is_active`: TRUE
5. Click "Save"

### Method 3: Admin UI (Future Enhancement)

Create an admin page where school admins can:
- Add/edit/delete subjects
- Add/edit/delete classes
- Add/edit/delete academic years
- Set current academic year

## Examples by School Type

### Example 1: Traditional Indian School
```sql
-- Uses global defaults (1-12)
-- No custom configuration needed
```

### Example 2: CBSE School with Vocational Subjects
```sql
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('cbse-school-id', 'Artificial Intelligence', 18),
  ('cbse-school-id', 'Financial Literacy', 19),
  ('cbse-school-id', 'Entrepreneurship', 20);
```

### Example 3: International School (IB/IGCSE)
```sql
-- Custom classes
INSERT INTO curriculum_classes (school_id, name, display_order) VALUES
  ('ib-school-id', 'Year 1', 1),
  ('ib-school-id', 'Year 2', 2),
  ('ib-school-id', 'Year 3', 3),
  ('ib-school-id', 'IB Year 1', 11),
  ('ib-school-id', 'IB Year 2', 12);

-- Custom subjects
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('ib-school-id', 'Theory of Knowledge', 1),
  ('ib-school-id', 'Extended Essay', 2),
  ('ib-school-id', 'CAS (Creativity, Activity, Service)', 3);
```

### Example 4: Vocational Training Institute
```sql
-- Custom classes (courses)
INSERT INTO curriculum_classes (school_id, name, display_order) VALUES
  ('vocational-id', 'Certificate Course', 1),
  ('vocational-id', 'Diploma - Year 1', 2),
  ('vocational-id', 'Diploma - Year 2', 3),
  ('vocational-id', 'Advanced Diploma', 4);

-- Custom subjects (trades)
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('vocational-id', 'Electrical Engineering', 1),
  ('vocational-id', 'Plumbing', 2),
  ('vocational-id', 'Carpentry', 3),
  ('vocational-id', 'Welding', 4),
  ('vocational-id', 'Automotive Repair', 5);
```

### Example 5: Montessori School
```sql
-- Custom classes
INSERT INTO curriculum_classes (school_id, name, display_order) VALUES
  ('montessori-id', 'Toddler (18-36 months)', 1),
  ('montessori-id', 'Primary (3-6 years)', 2),
  ('montessori-id', 'Elementary I (6-9 years)', 3),
  ('montessori-id', 'Elementary II (9-12 years)', 4);

-- Custom subjects
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('montessori-id', 'Practical Life', 1),
  ('montessori-id', 'Sensorial', 2),
  ('montessori-id', 'Language', 3),
  ('montessori-id', 'Mathematics', 4),
  ('montessori-id', 'Cultural Studies', 5);
```

## Managing School-Specific Data

### View Current Configuration
```sql
-- View your school's subjects
SELECT * FROM curriculum_subjects 
WHERE school_id = 'your-school-id' 
ORDER BY display_order;

-- View your school's classes
SELECT * FROM curriculum_classes 
WHERE school_id = 'your-school-id' 
ORDER BY display_order;

-- View your school's academic years
SELECT * FROM curriculum_academic_years 
WHERE school_id = 'your-school-id' 
ORDER BY year DESC;
```

### Update Configuration
```sql
-- Update subject name
UPDATE curriculum_subjects 
SET name = 'New Subject Name' 
WHERE school_id = 'your-school-id' AND name = 'Old Subject Name';

-- Deactivate a subject
UPDATE curriculum_subjects 
SET is_active = FALSE 
WHERE school_id = 'your-school-id' AND name = 'Subject to Remove';

-- Change display order
UPDATE curriculum_subjects 
SET display_order = 1 
WHERE school_id = 'your-school-id' AND name = 'Most Important Subject';
```

### Delete Configuration
```sql
-- Delete a subject
DELETE FROM curriculum_subjects 
WHERE school_id = 'your-school-id' AND name = 'Subject to Delete';

-- Delete all school-specific configuration (revert to global)
DELETE FROM curriculum_subjects WHERE school_id = 'your-school-id';
DELETE FROM curriculum_classes WHERE school_id = 'your-school-id';
DELETE FROM curriculum_academic_years WHERE school_id = 'your-school-id';
```

## Best Practices

### 1. Start with Global Defaults
- Don't add custom configuration unless needed
- Global defaults work for most schools
- Only customize when you have unique requirements

### 2. Use Meaningful Display Orders
```sql
-- Good: Logical grouping
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('school-id', 'Mathematics', 10),
  ('school-id', 'Physics', 20),
  ('school-id', 'Chemistry', 30);
-- Allows inserting between subjects later

-- Bad: Sequential numbering
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('school-id', 'Mathematics', 1),
  ('school-id', 'Physics', 2),
  ('school-id', 'Chemistry', 3);
-- Hard to insert between subjects
```

### 3. Keep Descriptions Clear
```sql
INSERT INTO curriculum_subjects (school_id, name, description, display_order) VALUES
  ('school-id', 'AI & ML', 'Artificial Intelligence and Machine Learning fundamentals', 1);
```

### 4. Set Current Academic Year
```sql
-- Only ONE academic year should have is_current = TRUE
UPDATE curriculum_academic_years 
SET is_current = FALSE 
WHERE school_id = 'your-school-id';

UPDATE curriculum_academic_years 
SET is_current = TRUE 
WHERE school_id = 'your-school-id' AND year = '2024-2025';
```

## Migration Strategy

### Migrating from Global to School-Specific

If you want to customize global defaults:

```sql
-- Step 1: Copy global subjects to your school
INSERT INTO curriculum_subjects (school_id, name, description, display_order, is_active)
SELECT 'your-school-id', name, description, display_order, is_active
FROM curriculum_subjects
WHERE school_id IS NULL;

-- Step 2: Modify as needed
UPDATE curriculum_subjects 
SET name = 'Custom Name' 
WHERE school_id = 'your-school-id' AND name = 'Original Name';

-- Step 3: Add new subjects
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  ('your-school-id', 'New Subject', 100);
```

## Testing School-Specific Configuration

### Test Query
```sql
-- This mimics what the application does
WITH school_data AS (
  SELECT name FROM curriculum_subjects 
  WHERE school_id = 'your-school-id' AND is_active = TRUE
),
global_data AS (
  SELECT name FROM curriculum_subjects 
  WHERE school_id IS NULL AND is_active = TRUE
)
SELECT * FROM school_data
UNION ALL
SELECT * FROM global_data WHERE NOT EXISTS (SELECT 1 FROM school_data);
```

## Summary

✅ **Each school can have different data**
- School-specific subjects
- School-specific classes
- School-specific academic years

✅ **Automatic fallback to global defaults**
- No configuration needed for standard schools
- Global defaults work out of the box

✅ **Easy to customize**
- Add custom subjects for specialized programs
- Customize class names for different education systems
- Set school-specific academic year dates

✅ **Flexible and scalable**
- Supports any education system (CBSE, ICSE, IB, IGCSE, State Boards)
- Supports vocational training institutes
- Supports alternative education systems (Montessori, Waldorf, etc.)

The system is designed to be **flexible enough for any school** while being **simple enough to use without configuration**! 🎓
