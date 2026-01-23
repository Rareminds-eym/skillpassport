# Internal vs External Course Fields Collection

## Internal Platform Courses (e.g., BlockChain Basics)

### User Action
- Student clicks "Enroll in Course" button
- **NO FORM IS SHOWN** - enrollment happens immediately

### Fields Automatically Collected
These fields are taken from the `courses` table automatically:

| Field | Source | Example Value |
|-------|--------|---------------|
| Course Name | `course.title` | "BlockChain Basics" |
| Organization | `course.university` or "Internal Platform" | "Internal Platform" |
| Description | `course.description` | "This course provides..." |
| Duration | `course.duration` | "8 weeks" |
| Educator | `course.educator_name` | "jishnu" |
| Status | Auto-set | "ongoing" |
| Start Date | Auto-set | Current date (enrollment date) |
| End Date | Not set | null |
| Modules Completed | Auto-set | 0 |
| Total Modules | Auto-set | 0 |
| Hours Spent | Auto-set | 0 |
| Certificate URL | Not collected | null |
| Skills | Not collected initially | null |
| Provider | Not applicable | - |
| Source | Auto-set | "internal_course" |

### What Gets Created
1. **course_enrollments** record - tracks enrollment
2. **trainings** record - shows in My Learning

---

## External Courses (e.g., Coursera, Udemy)

### User Action
- Student clicks "Add External Course" button
- **FORM IS SHOWN** - user must fill in details

### Fields User Must Provide
These fields are collected via the form:

| Field | Required | User Input | Example |
|-------|----------|------------|---------|
| Course Name | ✅ Yes | Text input | "Advanced React Development" |
| Provider | ❌ No | Text input | "Coursera" |
| Organization | ❌ No | Text input | "Meta" |
| Start Date | ❌ No | Date picker | "2024-01-15" |
| End Date | ❌ No | Date picker | "2024-03-15" |
| Status | ✅ Yes | Dropdown | "Ongoing" or "Completed" |
| Modules Completed | ❌ No | Number input | 5 |
| Total Modules | ❌ No | Number input | 10 |
| Hours Spent | ❌ No | Number input | 40 |
| Certificate URL | ❌ No | URL input | "https://coursera.org/cert/..." |
| Skills Covered | ❌ No | Comma-separated | "React, Hooks, Redux" |
| Description | ❌ No | Textarea | "Learned advanced patterns..." |

### What Gets Created
1. **trainings** record only (no enrollment record)
2. **certificates** record (if certificate URL provided)
3. **skills** records (if skills provided)
4. **Assessment** (if external platform and skills provided)

---

## Key Differences

### Internal Courses
- ✅ One-click enrollment
- ✅ Data comes from course catalog
- ✅ No user input needed
- ✅ Automatic approval
- ✅ Linked to course_id
- ❌ No assessment required

### External Courses
- ❌ Requires form submission
- ❌ User provides all data
- ❌ Manual input required
- ✅ Automatic approval (after assessment if needed)
- ❌ No course_id link
- ✅ Assessment required for unknown platforms

---

## Flow Diagram

```
Add Learning Button Clicked
    ↓
SelectCourseModal Opens
    ↓
    ├─→ Internal Course Selected
    │       ↓
    │   Click "Enroll in Course"
    │       ↓
    │   Auto-populate from courses table
    │       ↓
    │   Create enrollment + training records
    │       ↓
    │   Show in My Learning ✓
    │
    └─→ "Add External Course" Clicked
            ↓
        AddLearningCourseModal Opens
            ↓
        User fills form manually
            ↓
        Check if assessment needed
            ↓
        Create training record
            ↓
        Show in My Learning ✓
```

---

## Summary

**Internal courses**: All data is already in the system, so we just copy it from the `courses` table when the student enrolls. No form needed.

**External courses**: Data doesn't exist in our system, so the student must provide it via a form.
