# Program Management UI - Quick Guide

## What Was Created

I've created a complete **Program Management** UI page that allows you to create, view, edit, and delete academic programs through the interface.

## How to Access

1. Log in as College Admin
2. Go to sidebar → **Academics** section
3. Click on **"Programs"** (new menu item)

OR

Navigate directly to: `/college-admin/academics/programs`

## Features

### 1. **View All Programs**
- See all programs in a table format
- Shows: Program Name, Code, Department, Degree Level, Status
- Filter by Department, Degree Level, or Status
- Search by program name, code, or department

### 2. **Create New Program**
- Click "Add Program" button
- Fill in the form:
  - **Program Name** (e.g., "Bachelor of Technology in Computer Science")
  - **Program Code** (e.g., "BTECH-CSE")
  - **Department** (select from dropdown)
  - **Degree Level** (Undergraduate/Postgraduate/Diploma/Certificate)
  - **Description** (optional)
  - **Status** (Active/Inactive)
- Click "Create Program"

### 3. **Edit Existing Program**
- Click the edit icon (pencil) next to any program
- Modify the details
- Click "Update Program"

### 4. **Delete Program**
- Click the delete icon (trash) next to any program
- Confirm deletion
- **Warning**: This will also delete all associated sections

### 5. **Statistics Dashboard**
- Total Programs
- Active Programs
- Undergraduate Programs
- Postgraduate Programs

## Navigation Flow

```
College Admin Dashboard
  └── Academics (Sidebar)
      ├── Programs (NEW!) ← Create/manage programs here
      └── Program & Sections ← Create sections under programs
```

## Workflow

### Step 1: Create Department
1. Go to Department Management
2. Create department (e.g., "Computer Science & Engineering")

### Step 2: Create Program (NEW!)
1. Go to **Programs** (new page)
2. Click "Add Program"
3. Fill in:
   - Name: "Bachelor of Technology in Computer Science"
   - Code: "BTECH-CSE"
   - Department: Select "Computer Science & Engineering"
   - Degree Level: "Undergraduate"
4. Click "Create Program"

### Step 3: Create Sections
1. Go to Program & Sections
2. Click "Add Section"
3. Select:
   - Department: "Computer Science & Engineering"
   - Program: "Bachelor of Technology in Computer Science" (now appears!)
   - Semester: 1
   - Section: A
   - Max Students: 60
4. Click "Create Section"

## Your Current Setup

### Departments:
- Bachelor of Technology (BTEC)
- Computer Science & Engineering (CSE)
- Electronics & Communication Engineering (ECE)
- Mechanical Engineering (MECH)
- And others...

### Programs Created:
1. **B.Tech Program** (under Bachelor of Technology) - Created via SQL
2. Bachelor of Technology in Computer Science (under CSE)
3. Master of Technology in Computer Science (under CSE)
4. Bachelor of Technology in Electronics (under ECE)
5. Bachelor of Technology in Mechanical (under MECH)

## Next Steps

1. **Refresh your browser** to see the new "Programs" menu item
2. Go to **Academics → Programs**
3. You'll see the existing programs
4. Create new programs as needed
5. Then go to **Program & Sections** to create sections

## Technical Details

### Files Created:
- `src/pages/admin/collegeAdmin/ProgramManagement.tsx` - Main UI component

### Files Modified:
- `src/routes/AppRoutes.jsx` - Added route
- `src/components/admin/Sidebar.tsx` - Added menu item

### Database Table:
- `programs` table (already exists)
- Required fields: name, code, degree_level, department_id
- Optional fields: description, status

## Troubleshooting

### Issue: "Programs" menu item not showing
**Solution**: Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Can't see programs in dropdown
**Solution**: 
1. Go to Programs page
2. Click "Refresh" button
3. Check if programs exist for the selected department

### Issue: Error creating program
**Solution**: Make sure all required fields are filled:
- Program Name
- Program Code
- Department
- Degree Level

## Benefits

✅ No more manual SQL queries to create programs
✅ Easy to manage all programs in one place
✅ Visual interface with filters and search
✅ Edit and delete programs easily
✅ See statistics at a glance
✅ Proper validation and error handling
