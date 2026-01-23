# Teacher Management System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCHOOL ADMIN PORTAL                          │
│                  /school-admin/teachers/management               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TEACHER MANAGEMENT PAGE                        │
│                  (TeacherManagement.tsx)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Teachers   │  │  Onboarding  │  │  Timetable   │          │
│  │     List     │  │              │  │  Allocation  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  TeacherList    │  │ TeacherOnboard  │  │   Timetable     │
│  Component      │  │   Component     │  │   Allocation    │
│                 │  │                 │  │   Component     │
│ • Search        │  │ • Form Input    │  │ • Slot Mgmt     │
│ • Filter        │  │ • File Upload   │  │ • Workload      │
│ • View Details  │  │ • Subject Add   │  │ • Conflicts     │
│ • Update Status │  │ • Submit        │  │ • Validation    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Supabase Client │
                    │  (supabaseClient)│
                    └──────────────────┘
                              │
         ┏━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┓
         ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│  Supabase        │                      │  Supabase        │
│  Database        │                      │  Storage         │
│                  │                      │                  │
│ • teachers       │                      │ • teacher-docs/  │
│ • mappings       │                      │   - degrees/     │
│ • timetables     │                      │   - id-proofs/   │
│ • slots          │                      │   - experience/  │
│ • workload       │                      │                  │
│ • conflicts      │                      └──────────────────┘
└──────────────────┘
```

---

## Data Flow Diagrams

### 1. Teacher Onboarding Flow

```
┌──────────────┐
│ School Admin │
│ Fills Form   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Personal Info + Documents + Subjects │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Upload Documents │──────┐
│ to Storage       │      │
└──────┬───────────┘      │
       │                  │
       ▼                  ▼
┌──────────────────┐  ┌──────────────┐
│ Insert Teacher   │  │ Get Document │
│ Record           │  │ URLs         │
└──────┬───────────┘  └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  ▼
       ┌──────────────────────┐
       │ TRIGGER: Generate    │
       │ Teacher ID           │
       │ (ABC-T-0001)         │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │ TRIGGER: Create      │
       │ Subject Mappings     │
       │ (from JSONB array)   │
       └──────────┬───────────┘
                  ▼
       ┌──────────────────────┐
       │ Teacher Created      │
       │ Status: documents_   │
       │         uploaded     │
       └──────────────────────┘
```

### 2. Timetable Allocation Flow

```
┌──────────────┐
│ Select       │
│ Teacher      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Load Existing    │
│ Slots & Workload │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Add New Slot                     │
│ • Day, Period, Time              │
│ • Class, Subject, Room           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────┐
│ Insert Slot      │
│ to Database      │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────────┐
│ TRIGGER: Calculate Workload      │
│ • Count total periods            │
│ • Find max consecutive           │
│ • Update workload table          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ TRIGGER: Detect Conflicts        │
│ • Check >30 periods              │
│ • Check >3 consecutive           │
│ • Check double booking           │
│ • Log conflicts                  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return Results                   │
│ • Updated workload               │
│ • Conflict alerts                │
│ • Visual indicators              │
└──────────────────────────────────┘
```

### 3. Conflict Detection Logic

```
┌─────────────────────────────────────┐
│ Slot Added/Updated/Deleted          │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Calculate Teacher Workload          │
│                                     │
│ 1. Count all slots for teacher      │
│    SELECT COUNT(*) FROM slots       │
│    WHERE teacher_id = ?             │
│                                     │
│ 2. Find consecutive sequences       │
│    GROUP BY day, consecutive_group  │
│    ORDER BY period_number           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Check Business Rules                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Rule 1: Max 30 Periods/Week     │ │
│ │ IF total_periods > 30           │ │
│ │ THEN log conflict               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Rule 2: Max 3 Consecutive       │ │
│ │ IF max_consecutive > 3          │ │
│ │ THEN log conflict               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Rule 3: No Double Booking       │ │
│ │ IF same day+period+teacher      │ │
│ │ THEN log conflict               │ │
│ └─────────────────────────────────┘ │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Update UI                           │
│ • Show red indicators               │
│ • Display conflict details          │
│ • Suggest resolutions               │
└─────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                         schools                               │
│  • id (PK)                                                    │
│  • name                                                       │
│  • address, city, state                                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 1:N
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                        teachers                               │
│  • id (PK)                                                    │
│  • teacher_id (UNIQUE) ◄─── AUTO-GENERATED                   │
│  • school_id (FK) ──────────┘                                │
│  • first_name, last_name, email                              │
│  • degree_certificate_url                                    │
│  • id_proof_url                                              │
│  • experience_letters_url[]                                  │
│  • subject_expertise (JSONB) ◄─── TRIGGERS MAPPING           │
│  • onboarding_status                                         │
└────────────┬────────────────────────┬──────────────────────┬─┘
             │                        │                      │
             │ 1:N                    │ 1:N                  │ 1:N
             │                        │                      │
┌────────────▼──────────┐  ┌──────────▼────────┐  ┌──────────▼────────┐
│ teacher_subject_      │  │  timetable_slots  │  │  teacher_workload │
│ mappings              │  │                   │  │                   │
│  • id (PK)            │  │  • id (PK)        │  │  • id (PK)        │
│  • teacher_id (FK)    │  │  • teacher_id (FK)│  │  • teacher_id (FK)│
│  • subject_name       │  │  • timetable_id   │  │  • timetable_id   │
│  • proficiency_level  │  │  • day_of_week    │  │  • total_periods  │
│  • years_experience   │  │  • period_number  │  │  • max_consecutive│
│                       │  │  • start_time     │  │                   │
│ ◄─ AUTO-CREATED      │  │  • end_time       │  │ ◄─ AUTO-CALCULATED│
│    FROM JSONB         │  │  • class_name     │  │    ON SLOT CHANGE │
└───────────────────────┘  │  • subject_name   │  └───────────────────┘
                           │  • room_number    │
                           └──────────┬────────┘
                                      │
                                      │ TRIGGERS
                                      │
                           ┌──────────▼────────┐
                           │ timetable_        │
                           │ conflicts         │
                           │  • id (PK)        │
                           │  • timetable_id   │
                           │  • conflict_type  │
                           │  • teacher_id     │
                           │  • conflict_details│
                           │  • resolved       │
                           │                   │
                           │ ◄─ AUTO-DETECTED  │
                           │    ON VIOLATIONS  │
                           └───────────────────┘
```

---

## Component Hierarchy

```
TeacherManagement (Main Container)
│
├── Tab Navigation
│   ├── Teachers List
│   ├── Onboarding
│   └── Timetable
│
├── TeacherList Component
│   ├── Search Bar
│   ├── Status Filter
│   ├── Stats Cards (5)
│   ├── Teachers Table
│   │   ├── Teacher Row (multiple)
│   │   └── View Button → Modal
│   └── Teacher Detail Modal
│       ├── Contact Info
│       ├── Subject Expertise List
│       └── Status Update Buttons
│
├── TeacherOnboarding Component
│   ├── Success/Error Message
│   ├── Personal Information Form
│   │   ├── First Name Input
│   │   ├── Last Name Input
│   │   ├── Email Input
│   │   └── Phone Input
│   ├── Document Upload Section
│   │   ├── Degree Certificate Upload
│   │   ├── ID Proof Upload
│   │   └── Experience Letters Upload (Multiple)
│   ├── Subject Expertise Section
│   │   ├── Subject Input Form
│   │   │   ├── Subject Name
│   │   │   ├── Proficiency Select
│   │   │   ├── Years Input
│   │   │   └── Add Button
│   │   └── Subject List (with Remove)
│   └── Submit Button
│
└── TimetableAllocation Component
    ├── Teacher Selection Dropdown
    ├── Workload Summary Cards (3)
    │   ├── Total Periods Card (Green/Red)
    │   ├── Consecutive Classes Card (Green/Red)
    │   └── Conflicts Card (Blue)
    ├── Conflicts Alert Box
    │   └── Conflict Items (multiple)
    ├── Add Slot Form
    │   ├── Day Select
    │   ├── Period Select
    │   ├── Start Time Input
    │   ├── End Time Input
    │   ├── Class Name Input
    │   ├── Subject Name Input
    │   ├── Room Number Input
    │   └── Add Slot Button
    └── Timetable Grid Table
        ├── Table Header
        └── Slot Rows (multiple)
            ├── Day Column
            ├── Period Column
            ├── Time Column
            ├── Class Column
            ├── Subject Column
            ├── Room Column
            └── Delete Button
```

---

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                           │
└─────────────────────────────────────────────────────────────┘

TeacherManagement
├── activeTab: "list" | "onboarding" | "timetable"

TeacherList
├── teachers: Teacher[]
├── filteredTeachers: Teacher[]
├── searchTerm: string
├── statusFilter: string
├── loading: boolean
└── selectedTeacher: Teacher | null

TeacherOnboarding
├── formData: { first_name, last_name, email, phone }
├── documents: { degree_certificate, id_proof, experience_letters[] }
├── subjects: SubjectExpertise[]
├── currentSubject: SubjectExpertise
├── loading: boolean
└── message: { type, text } | null

TimetableAllocation
├── teachers: Teacher[]
├── selectedTeacher: string
├── timetableId: string
├── slots: TimetableSlot[]
├── conflicts: Conflict[]
├── workload: { total_periods, max_consecutive, ... }
├── newSlot: TimetableSlot
└── loading: boolean
```

---

## API Endpoints (Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Operations                       │
└─────────────────────────────────────────────────────────────┘

Teachers
├── GET    /teachers (list all)
├── GET    /teachers?id=eq.{id} (get one)
├── POST   /teachers (create)
├── PATCH  /teachers?id=eq.{id} (update)
└── DELETE /teachers?id=eq.{id} (delete)

Teacher Subject Mappings
├── GET    /teacher_subject_mappings?teacher_id=eq.{id}
└── (Auto-managed by trigger)

Timetables
├── GET    /timetables (list all)
├── GET    /timetables?id=eq.{id} (get one)
├── POST   /timetables (create)
└── PATCH  /timetables?id=eq.{id} (update)

Timetable Slots
├── GET    /timetable_slots?timetable_id=eq.{id}&teacher_id=eq.{id}
├── POST   /timetable_slots (create)
└── DELETE /timetable_slots?id=eq.{id} (delete)

Teacher Workload
├── GET    /teacher_workload?teacher_id=eq.{id}&timetable_id=eq.{id}
└── RPC    calculate_teacher_workload(teacher_id, timetable_id)

Timetable Conflicts
├── GET    /timetable_conflicts?timetable_id=eq.{id}&resolved=eq.false
└── RPC    detect_timetable_conflicts(timetable_id)

Storage
├── POST   /storage/v1/object/teacher-documents/degrees/{file}
├── POST   /storage/v1/object/teacher-documents/id-proofs/{file}
└── POST   /storage/v1/object/teacher-documents/experience-letters/{file}
```

---

## Security & Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                    Row Level Security (RLS)                  │
└─────────────────────────────────────────────────────────────┘

Teachers Table
├── SELECT: School admins can view teachers in their school
│   WHERE school_id = auth.user().school_id
├── INSERT: School admins can add teachers to their school
│   WHERE school_id = auth.user().school_id
├── UPDATE: School admins can update teachers in their school
│   WHERE school_id = auth.user().school_id
└── DELETE: School admins can delete teachers in their school
    WHERE school_id = auth.user().school_id

Storage Bucket: teacher-documents
├── SELECT: School admins can view documents for their school
├── INSERT: School admins can upload documents
└── DELETE: School admins can delete documents

Timetables & Slots
├── SELECT: School admins can view timetables for their school
├── INSERT: School admins can create timetables
├── UPDATE: School admins can modify timetables
└── DELETE: School admins can delete timetables
```

---

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Indexes                          │
└─────────────────────────────────────────────────────────────┘

CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_teachers_status ON teachers(onboarding_status);
CREATE INDEX idx_teacher_mappings_teacher ON teacher_subject_mappings(teacher_id);
CREATE INDEX idx_timetable_slots_teacher ON timetable_slots(teacher_id);
CREATE INDEX idx_timetable_slots_schedule ON timetable_slots(timetable_id, day_of_week, period_number);
CREATE INDEX idx_teacher_workload_teacher ON teacher_workload(teacher_id);
CREATE INDEX idx_conflicts_unresolved ON timetable_conflicts(timetable_id, resolved) WHERE resolved = FALSE;

┌─────────────────────────────────────────────────────────────┐
│                    Frontend Optimizations                    │
└─────────────────────────────────────────────────────────────┘

├── Lazy Loading: Component loaded only when route accessed
├── Memoization: useMemo for computed values
├── Debouncing: Search input debounced
├── Pagination: Large lists paginated (future)
└── Caching: Supabase client caches queries
```

---

## Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Scenarios                           │
└─────────────────────────────────────────────────────────────┘

Document Upload Failures
├── File too large → Show error message
├── Invalid format → Show error message
├── Network error → Retry mechanism
└── Storage full → Contact admin

Database Errors
├── Duplicate email → Show "Email already exists"
├── Foreign key violation → Show "Invalid school"
├── Unique constraint → Show "Teacher ID conflict"
└── Connection error → Show "Please try again"

Validation Errors
├── Missing required fields → Highlight fields
├── Invalid email format → Show format error
├── Negative years → Show validation error
└── Empty subject name → Prevent submission

Business Rule Violations
├── >30 periods → Red indicator + conflict log
├── >3 consecutive → Red indicator + conflict log
├── Double booking → Prevent insertion + alert
└── Time overlap → Conflict detection + alert
```

---

## Deployment Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                    Pre-Deployment                            │
└─────────────────────────────────────────────────────────────┘

Database
├── ✅ Run migration: teacher_management_schema.sql
├── ✅ Verify all tables created
├── ✅ Verify all triggers active
├── ✅ Verify all indexes created
└── ✅ Test sample data insertion

Storage
├── ✅ Create bucket: teacher-documents
├── ✅ Create folders: degrees/, id-proofs/, experience-letters/
├── ✅ Set RLS policies
└── ✅ Test file upload

Frontend
├── ✅ Build production bundle
├── ✅ Test all routes
├── ✅ Verify no TypeScript errors
├── ✅ Test mobile responsiveness
└── ✅ Test all workflows

Environment
├── ✅ Set VITE_SUPABASE_URL
├── ✅ Set VITE_SUPABASE_ANON_KEY
├── ✅ Verify user metadata includes school_id
└── ✅ Test authentication flow

┌─────────────────────────────────────────────────────────────┐
│                    Post-Deployment                           │
└─────────────────────────────────────────────────────────────┘

├── ✅ Monitor error logs
├── ✅ Check database performance
├── ✅ Verify storage usage
├── ✅ Test with real users
└── ✅ Collect feedback
```

---

**Architecture Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Production Ready
