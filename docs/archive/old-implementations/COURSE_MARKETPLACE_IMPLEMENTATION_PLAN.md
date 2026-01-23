# Course Marketplace Implementation Plan

## Current State

### Student Dashboard
- **Route**: `/student/courses`
- **View**: Browse & Buy Courses (Marketplace view)
- **Features**: 
  - Grid/List view toggle
  - Search and filters
  - Course cards with enrollment
  - Course detail modal
  - "Start Course" action

### Educator/School/College/University Dashboards
- **Route**: `/educator/courses`, `/school-admin/academics/courses`, etc.
- **View**: Course Management (Create/Edit/Manage)
- **Features**:
  - Create new courses
  - Edit existing courses
  - Manage modules and lessons
  - View analytics

## Required Changes

### Goal
Add a **"Browse & Buy Courses"** section for:
1. Educators
2. School Admins
3. College Admins
4. University Admins

### Implementation Options

#### Option 1: Separate Routes (Recommended)
- Keep existing course management at current routes
- Add new marketplace routes:
  - `/educator/browse-courses` - Browse & buy courses
  - `/educator/courses` - Manage my courses (existing)
  - `/school-admin/browse-courses` - Browse & buy courses
  - `/school-admin/academics/courses` - Manage school courses (existing)
  - `/college-admin/browse-courses` - Browse & buy courses
  - `/college-admin/academics/courses` - Manage college courses (existing)
  - `/university-admin/browse-courses` - Browse & buy courses
  - `/university-admin/courses` - Manage university courses (existing)

#### Option 2: Tab-Based View
- Add tabs to existing course pages:
  - Tab 1: "My Courses" (current management view)
  - Tab 2: "Browse Courses" (marketplace view)

## Recommended Approach

**Option 1** is recommended because:
- Clear separation of concerns
- Easier to maintain
- Better UX (dedicated pages)
- Can add to sidebar menu

## Implementation Steps

1. **Create Reusable Course Marketplace Component**
   - Extract student courses view into shared component
   - Make it role-agnostic
   - Add purchase/enrollment logic

2. **Add Sidebar Menu Items**
   - Add "Browse Courses" to each dashboard sidebar

3. **Create Route Pages**
   - `/educator/browse-courses`
   - `/school-admin/browse-courses`
   - `/college-admin/browse-courses`
   - `/university-admin/browse-courses`

4. **Add Purchase/Enrollment Logic**
   - Integrate with payment system
   - Handle course access permissions

## Next Steps

Please confirm:
1. Do you want Option 1 (separate routes) or Option 2 (tabs)?
2. Should institutions be able to purchase courses for their students?
3. What payment integration should be used?
