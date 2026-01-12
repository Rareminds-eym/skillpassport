# Profile Link Conditional Display

## Summary
The "Edit Profile" option in the profile dropdown and "My Profile" in the sidebar are now conditionally displayed based on whether the student is part of a school or college.

## Logic
- **Show Profile Link**: Only when student is NOT part of a school or college
- **Hide Profile Link**: When student IS part of a school or college (has `school_id` or `university_college_id`)

## Changes Made

### 1. Header Component (`src/components/Students/components/Header.jsx`)
- Added check: `isPartOfSchoolOrCollege = studentData?.school_id || studentData?.university_college_id`
- Wrapped "Edit Profile" dropdown item with conditional rendering:
  ```jsx
  {!isPartOfSchoolOrCollege && (
    <DropdownMenuItem>
      <PencilIcon className="w-4 h-4 mr-2" />
      Edit Profile
    </DropdownMenuItem>
  )}
  ```

### 2. Sidebar Component (`src/components/Sidebar.jsx`)
- Imported `useStudentDataByEmail` hook
- Added check: `isPartOfSchoolOrCollege = studentData?.school_id || studentData?.university_college_id`
- Conditionally added profile link to studentLinks array:
  ```jsx
  const studentLinks = [
    { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(!isPartOfSchoolOrCollege ? [{ path: '/student/profile', label: 'My Profile', icon: User }] : []),
    { path: '/student/applied-jobs', label: 'Applied Jobs', icon: ClipboardList },
    { path: '/student/browse-jobs', label: 'Browse Jobs', icon: FileCheck },
  ];
  ```

## How It Works

### For Independent Students (No School/College)
- `school_id` = null
- `university_college_id` = null
- **Result**: "Edit Profile" appears in dropdown, "My Profile" appears in sidebar

### For School/College Students
- `school_id` = some value OR `university_college_id` = some value
- **Result**: "Edit Profile" hidden from dropdown, "My Profile" hidden from sidebar

## Database Fields Checked
- `students.school_id` - Links student to a school
- `students.university_college_id` - Links student to a college/university

## Testing

1. **Test as Independent Student**:
   - Login as a student with no school_id or university_college_id
   - Click profile icon in header
   - ✅ Should see "Edit Profile" option
   - Check sidebar (if visible)
   - ✅ Should see "My Profile" link

2. **Test as School/College Student**:
   - Login as a student with school_id or university_college_id set
   - Click profile icon in header
   - ✅ Should NOT see "Edit Profile" option
   - Check sidebar (if visible)
   - ✅ Should NOT see "My Profile" link

## UI Locations Updated
1. **Header Dropdown** (Top right profile icon)
   - Path: `src/components/Students/components/Header.jsx`
   - Menu item: "Edit Profile"

2. **Sidebar Navigation** (Left sidebar on some views)
   - Path: `src/components/Sidebar.jsx`
   - Menu item: "My Profile"
