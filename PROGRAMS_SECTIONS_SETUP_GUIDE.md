# Programs & Sections Management - Setup Guide

## Overview
This guide explains how to connect the Programs & Sections Management UI to the database using the new `programs` and `program_sections` tables.

## Database Schema

### Programs Table
```sql
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  degree_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(department_id, code)
);
```

### Program Sections Table
```sql
CREATE TABLE public.program_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
  section VARCHAR(10) NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 60,
  current_students INTEGER NOT NULL DEFAULT 0,
  faculty_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  academic_year VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(program_id, semester, section, academic_year)
);
```

## Setup Steps

### 1. Apply the Migration

Run the migration to create/update the tables:

```bash
# Using Supabase CLI
supabase db push --file database/migrations/06_programs_sections_enhancement.sql

# Or use the batch script
setup-programs-sections.bat
```

### 2. Verify Tables Created

Check in Supabase Dashboard:
- Go to Table Editor
- Verify `programs` table exists with correct schema
- Verify `program_sections` table exists
- Verify `program_sections_view` view exists

### 3. Add Sample Data (Optional)

```sql
-- Insert a sample program
INSERT INTO programs (department_id, name, code, description, degree_level, status)
SELECT 
  d.id,
  'Bachelor of Technology in Computer Science',
  'BTECHCSE',
  'Four-year undergraduate program in Computer Science and Engineering',
  'Undergraduate',
  'active'
FROM departments d
WHERE d.code = 'CSE'
LIMIT 1;

-- Insert a sample section
INSERT INTO program_sections (
  department_id, 
  program_id, 
  semester, 
  section, 
  max_students, 
  academic_year, 
  status
)
SELECT 
  p.department_id,
  p.id,
  1,
  'A',
  60,
  '2024-25',
  'active'
FROM programs p
WHERE p.code = 'BTECHCSE'
LIMIT 1;
```

## Features

### What's Connected

✅ **Programs Table**
- Stores academic programs (B.Tech, M.Tech, etc.)
- Links to departments
- Tracks degree level and status

✅ **Program Sections Table**
- Organizes students by program, semester, and section
- Tracks capacity (max_students vs current_students)
- Assigns faculty to sections
- Manages academic year

✅ **Program Sections View**
- Joins all related data for easy querying
- Shows department, program, and faculty details
- Used by the UI for display

### UI Features

1. **Dashboard Stats**
   - Total Sections
   - Active Sections
   - Total Capacity
   - Enrolled Students

2. **Filters**
   - Search by section/program/department
   - Filter by department
   - Filter by program
   - Filter by semester
   - Filter by status

3. **Section Management**
   - Create new sections
   - Edit existing sections
   - Assign faculty
   - Set capacity
   - Track enrollment

## Data Flow

```
User Action → Component → Supabase Client → Database
                ↓
         program_sections_view
                ↓
    Display in UI with formatted data
```

### Create Section Flow
1. User fills form with department, program, semester, section
2. Component validates data
3. Inserts into `program_sections` table
4. Reloads data from `program_sections_view`
5. UI updates with new section

### Update Section Flow
1. User clicks edit on existing section
2. Modal pre-fills with current data
3. User modifies fields
4. Component updates `program_sections` table
5. Reloads and displays updated data

## Key Fields

### Programs
- `degree_level`: Undergraduate, Postgraduate, Diploma, Certificate
- `status`: active, inactive
- `code`: Unique program code (e.g., BTECHCSE)

### Program Sections
- `semester`: 1-12 (supports up to 12 semesters)
- `section`: A, B, C, etc.
- `academic_year`: Format YYYY-YY (e.g., 2024-25)
- `status`: active, inactive, archived
- `current_students`: Auto-updated when students enroll
- `max_students`: Maximum capacity

## RLS Policies

Row Level Security is enabled with these policies:

```sql
-- Read access for all authenticated users
CREATE POLICY "Allow read access" ON programs FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON program_sections FOR SELECT USING (true);

-- Write access for authenticated users
CREATE POLICY "Allow insert" ON programs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow update" ON programs FOR UPDATE USING (auth.uid() IS NOT NULL);
```

## Troubleshooting

### Issue: Sections not loading
**Solution**: Check if `program_sections_view` exists:
```sql
SELECT * FROM program_sections_view LIMIT 1;
```

### Issue: Cannot create section
**Solution**: Verify foreign keys exist:
```sql
-- Check department exists
SELECT * FROM departments WHERE id = 'your-department-id';

-- Check program exists
SELECT * FROM programs WHERE id = 'your-program-id';
```

### Issue: Faculty not showing
**Solution**: Ensure users have faculty role:
```sql
SELECT id, name, email, roles 
FROM auth.users 
WHERE roles @> '["faculty"]';
```

## Next Steps

1. ✅ Migration applied
2. ✅ UI connected to database
3. 🔄 Add student enrollment tracking
4. 🔄 Add section capacity alerts
5. 🔄 Add bulk section creation
6. 🔄 Add section history/audit log

## Files Modified

- `database/migrations/06_programs_sections_enhancement.sql` - New migration
- `src/pages/admin/collegeAdmin/ProgramSectionManagement.tsx` - Updated component
- `setup-programs-sections.bat` - Setup script

## Testing

1. Navigate to Program & Sections Management
2. Click "Add Section"
3. Fill in all required fields
4. Save and verify section appears in table
5. Edit section and verify changes persist
6. Check filters work correctly
