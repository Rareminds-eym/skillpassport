# College Dashboard - Complete Database Schema

## 📊 Overview
- **Total Tables**: 60
- **Created**: 14 tables ✅
- **Needed**: 46 tables ❌

---

## ✅ SECTION 1: CREATED TABLES (14)

### 1. departments ✅
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Academic departments  
**Foreign Keys**: users(hod_id)  
**Indexes**: idx_departments_hod

---

### 
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  duration_semesters INTEGER NOT NULL,
  total_credits_required INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Academic programs (B.Tech, M.Tech, etc.)  
**Foreign Keys**: departments(department_id)  
**Indexes**: idx_programs_department

---

### 3. course_mappings ✅
```sql
CREATE TABLE course_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  type TEXT CHECK (type IN ('core', 'dept_elective', 'open_elective')),
  faculty_id UUID REFERENCES users(id),
  capacity INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, course_code)
);
```
**Purpose**: Course-to-program mappings  
**Foreign Keys**: programs(program_id), users(faculty_id)  
**Indexes**: idx_course_mappings_program, idx_course_mappings_faculty

---

### 4. curriculum ✅
```sql
CREATE TABLE curriculum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  units JSONB NOT NULL DEFAULT '[]',
  outcomes JSONB NOT NULL DEFAULT '[]',
  assessment_mappings JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Detailed curriculum with units and outcomes  
**Foreign Keys**: departments, programs, course_mappings, users  
**Indexes**: idx_curriculum_course, idx_curriculum_status  
**JSONB Fields**: units, outcomes, assessment_mappings

---

### 5. student_admissions ✅
```sql
CREATE TABLE student_admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  program_id UUID REFERENCES programs(id) NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  personal_details JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  quota TEXT NOT NULL,
  documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'verified', 'approved', 'enrolled', 'active', 'graduated', 'alumni')),
  roll_number TEXT UNIQUE,
  current_semester INTEGER,
  cgpa DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Purpose**: Student admission and lifecycle  
**Foreign Keys**: users, programs, departments  
**Indexes**: idx_student_admissions_program, idx_student_admissions_status  
**JSONB Fields**: personal_details, documents

---

