# My Class Conditional Display Implementation

## Summary
The "My Class" navigation item in the student header now only displays when the student is part of a school or college.

## Changes Made

### File: `src/components/Students/components/Header.jsx`

1. **Added Import**: Imported `useStudentDataByEmail` hook to fetch student data
   ```javascript
   import { useStudentDataByEmail } from "../../../hooks/useStudentDataByEmail";
   ```

2. **Fetch Student Data**: Added logic to fetch student data and check school/college association
   ```javascript
   // Fetch student data to check school/college association
   const { studentData } = useStudentDataByEmail(userEmail);
   
   // Check if student is part of a school or college
   const isPartOfSchoolOrCollege = studentData?.school_id || studentData?.university_college_id;
   ```

3. **Conditional Tab Display**: Modified the tabs array to conditionally include "My Class"
   ```javascript
   const tabs = [
     { id: "training", label: "My Learning", icon: AcademicCapIcon },
     { id: "courses", label: "Courses", icon: BookOpenIcon },
     { id: "digital-portfolio", label: "Digital Portfolio", icon: BriefcaseIcon },
     { id: "opportunities", label: "Opportunities", icon: RocketLaunchIcon },
     { id: "career-ai", label: "Career AI", icon: SparklesIcon },
     // Only show "My Class" if student is part of a school or college
     ...(isPartOfSchoolOrCollege ? [{ id: "assignments", label: "My Class", icon: ClipboardDocumentListIcon }] : []),
     { id: "messages", label: "Messages", icon: EnvelopeIcon },
   ];
   ```

## How It Works

- The component fetches the student's data using their email
- It checks if the student has either a `school_id` or `university_college_id` field populated
- If either field exists, the "My Class" tab is included in the navigation
- If neither field exists, the "My Class" tab is hidden from the navigation

## Database Fields Checked

- `school_id`: Indicates the student is part of a school
- `university_college_id`: Indicates the student is part of a college/university

## User Experience

- **Students with school/college**: See the "My Class" navigation item and can access assignments
- **Independent students**: Don't see the "My Class" navigation item, keeping their interface clean and relevant
- The change applies to all navigation views: desktop, tablet, and mobile

## Testing

To test this feature:
1. Login as a student with a `school_id` or `university_college_id` → "My Class" should appear
2. Login as a student without either field → "My Class" should be hidden
3. Check on desktop, tablet, and mobile views to ensure consistency
