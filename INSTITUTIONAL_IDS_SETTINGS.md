# Institutional IDs Added to Student Settings

## Summary
Added institutional ID fields (university_college_id, school_id, school_class_id, college_id, program_id) to the student settings page. These fields are displayed as read-only since they are system-managed.

## Changes Made

### 1. Settings Page (`src/pages/student/Settings.jsx`)

#### Added to Profile State
```javascript
universityCollegeId: "",
schoolId: "",
schoolClassId: "",
collegeId: "",
programId: "",
```

#### Added New Section: "Institutional IDs"
Created a new section after Academic Information with 5 fields:
- **School ID** - Links student to a school
- **School Class ID** - Links student to a specific class within a school
- **College ID** - Links student to a college
- **University College ID** - Links student to a university college
- **Program ID** - Links student to an academic program

All fields are:
- Displayed as text inputs
- **Disabled** (read-only) - marked with `disabled` attribute
- Show tooltip: "This field is managed by the system"
- Display UUID values from the database

### 2. Service Layer (`src/services/studentSettingsService.js`)

#### Added to SELECT Query
```sql
university_college_id,
school_id,
school_class_id,
college_id,
program_id
```

#### Added Field Mappings
```javascript
universityCollegeId: 'university_college_id',
schoolId: 'school_id',
schoolClassId: 'school_class_id',
collegeId: 'college_id',
programId: 'program_id',
```

#### Added to Data Transformation
Maps database UUID fields to form fields for display.

## Database Fields

All fields are UUID type in the `students` table:
- `university_college_id` (uuid)
- `school_id` (uuid)
- `school_class_id` (uuid)
- `college_id` (uuid)
- `program_id` (uuid)

## UI Location

```
Settings Page
└── Profile Tab
    └── Academic Information Section
        ├── University
        ├── College/School
        ├── Branch/Field
        ├── Registration Number
        ├── Enrollment Number
        ├── Current CGPA
        ├── Grade/Class
        └── Grade Start Date
    └── Institutional IDs Section ⭐ NEW
        ├── School ID (Read-only)
        ├── School Class ID (Read-only)
        ├── College ID (Read-only)
        ├── University College ID (Read-only)
        └── Program ID (Read-only)
```

## Field Behavior

### Read-Only Fields
All institutional ID fields are **disabled** because:
1. They are system-managed relationships
2. Should be set by administrators, not students
3. Changing them could break institutional relationships
4. They are UUIDs that reference other tables

### Display
- Shows current UUID values if set
- Shows empty if not assigned
- Placeholder text indicates they are UUID fields
- Tooltip explains they are system-managed

## Purpose

These fields allow students to:
1. **View** their institutional associations
2. **Verify** they are linked to the correct institution
3. **Reference** these IDs when contacting support

Administrators can use these fields to:
1. Verify student-institution relationships
2. Debug assignment issues
3. Understand the student's institutional context

## Testing

1. Login as a student
2. Go to `/student/settings`
3. Navigate to "Profile" tab
4. Scroll to "Institutional IDs" section
5. Verify fields show current UUID values (if assigned)
6. Verify fields are disabled (cannot be edited)
7. Hover over fields to see tooltip

## Related Tables

These IDs reference:
- `schools` table (school_id)
- `school_classes` table (school_class_id)
- `colleges` table (college_id)
- `university_colleges` table (university_college_id)
- `programs` table (program_id)
