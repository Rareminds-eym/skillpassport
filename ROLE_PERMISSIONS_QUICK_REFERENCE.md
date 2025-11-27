# Role-Based Permissions - Quick Reference

## Permission Matrix (Extended from Reference Image)

| Feature | School Admin | Principal | IT Admin | Class Teacher | Subject Teacher |
|---------|--------------|-----------|----------|---------------|-----------------|
| **Add Teacher** | C/A | C/A | C | N/A | N/A |
| **Assign Classes** | A | A | C | N/A | N/A |
| **Timetable Editing** | A | A | U | V | V |

**Legend:** C = Create, A = Approve, U = Update, V = View, N/A = No Access

**Note:** School Admin has the same full permissions as Principal for backward compatibility with existing school admin users.

---

## Quick Setup

### 1. Run Migration
```bash
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/role_based_permissions.sql
```

### 2. Assign Roles to Users
```sql
-- Make someone a Principal
UPDATE teachers SET role = 'principal' WHERE email = 'principal@school.edu';

-- Make someone an IT Admin
UPDATE teachers SET role = 'it_admin' WHERE email = 'admin@school.edu';

-- Make someone a Class Teacher
UPDATE teachers SET role = 'class_teacher' WHERE email = 'teacher1@school.edu';

-- Default is Subject Teacher
UPDATE teachers SET role = 'subject_teacher' WHERE role IS NULL;
```

### 3. Test in UI
- Login as each role type
- Verify access levels match the matrix

---

## Role Capabilities

### 🏫 School Admin (Full Access)
- ✅ Add teachers (immediate approval)
- ✅ Approve class assignments
- ✅ Approve timetable changes
- ✅ Can assign any role to new teachers
- ✅ Delete teachers and timetable slots
- ✅ Same permissions as Principal

### 👑 Principal (Full Access)
- ✅ Add teachers (immediate approval)
- ✅ Approve class assignments
- ✅ Approve timetable changes
- ✅ Can assign any role to new teachers
- ✅ Delete teachers and timetable slots

### 💻 IT Admin (Administrative)
- ✅ Add teachers (needs Principal approval)
- ✅ Create class assignments (needs Principal approval)
- ✅ Update timetables
- ❌ Cannot assign Principal/IT Admin roles
- ✅ Delete timetable slots

### 📚 Class Teacher (View Only)
- ❌ Cannot add teachers
- ❌ Cannot assign classes
- ✅ View timetables only
- ❌ Cannot edit or delete

### 📖 Subject Teacher (View Only)
- ❌ Cannot add teachers
- ❌ Cannot assign classes
- ✅ View timetables only
- ❌ Cannot edit or delete

---

## Using in Code

### Check Permissions
```typescript
import { useUserRole } from '../hooks/useUserRole';

function MyComponent() {
  const {
    role,              // Current user role
    canAddTeacher,     // Can create teachers?
    canApproveTeacher, // Can approve immediately?
    canEditTimetable,  // Can edit timetables?
    canViewTimetable,  // Can view timetables?
    isPrincipal,       // Is Principal?
    isITAdmin,         // Is IT Admin?
  } = useUserRole();

  // Show/hide features based on permissions
  if (!canAddTeacher()) {
    return <AccessDenied />;
  }

  return <TeacherForm />;
}
```

### Conditional Rendering
```typescript
{canEditTimetable() && (
  <button onClick={handleEdit}>Edit Timetable</button>
)}

{canViewTimetable() && !canEditTimetable() && (
  <div className="badge">View Only</div>
)}
```

---

## UI Indicators

### Teacher Onboarding
- **Principal:** Shows "Create & Approve" button
- **IT Admin:** Shows "Submit for Approval" button
- **Others:** Access Denied screen

### Timetable Allocation
- **Principal/IT Admin:** Full edit mode with add/delete buttons
- **Class/Subject Teacher:** "View Only Mode" badge, no edit buttons

### Teacher List
- Shows role badges with color coding:
  - 🟣 Principal (Purple)
  - 🔵 IT Admin (Blue)
  - 🟢 Class Teacher (Green)
  - ⚪ Subject Teacher (Gray)

---

## Common Scenarios

### Scenario 1: Principal Adds Teacher
1. Principal logs in
2. Goes to Teacher Onboarding
3. Fills form and selects role
4. Clicks "Create & Approve"
5. Teacher is immediately active ✅

### Scenario 2: IT Admin Adds Teacher
1. IT Admin logs in
2. Goes to Teacher Onboarding
3. Fills form (cannot select Principal/IT Admin roles)
4. Clicks "Submit for Approval"
5. Teacher status = "pending" ⏳
6. Principal reviews and approves
7. Teacher becomes active ✅

### Scenario 3: Class Teacher Views Timetable
1. Class Teacher logs in
2. Goes to Timetable Allocation
3. Sees "View Only Mode" badge
4. Can view all timetable slots
5. Cannot add or delete slots ❌

### Scenario 4: IT Admin Edits Timetable
1. IT Admin logs in
2. Goes to Timetable Allocation
3. Can add new time slots ✅
4. Can delete existing slots ✅
5. Changes are saved immediately

---

## Database Functions

### Check Permission
```sql
-- Returns: 'C/A', 'C', 'U', 'V', or 'N/A'
SELECT check_user_permission('user-uuid', 'add_teacher');
```

### Check Action
```sql
-- Returns: true or false
SELECT can_user_perform_action('user-uuid', 'timetable_editing', 'U');
```

### Get Role
```sql
-- Returns: 'principal', 'it_admin', 'class_teacher', or 'subject_teacher'
SELECT get_user_role('user-uuid');
```

---

## Troubleshooting

### Problem: Access Denied for Principal
**Solution:** Check role is set correctly
```sql
SELECT role FROM teachers WHERE email = 'principal@school.edu';
-- Should return: 'principal'
```

### Problem: IT Admin can't add teachers
**Solution:** Check RLS policies are enabled
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'teachers';
-- rowsecurity should be 't' (true)
```

### Problem: Wrong permissions showing
**Solution:** Clear browser cache and re-login

---

## Files Modified

1. ✅ `supabase/migrations/role_based_permissions.sql` - Database schema
2. ✅ `src/hooks/useUserRole.ts` - Permission hook
3. ✅ `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx` - Role-based onboarding
4. ✅ `src/pages/admin/schoolAdmin/components/TimetableAllocation.tsx` - Role-based timetable
5. ✅ `src/pages/admin/schoolAdmin/components/TeacherList.tsx` - Role display

---

## Testing Checklist

- [ ] Principal can add and approve teachers immediately
- [ ] IT Admin can add teachers (pending approval)
- [ ] Class Teacher sees "Access Denied" on Teacher Onboarding
- [ ] Subject Teacher sees "Access Denied" on Teacher Onboarding
- [ ] Principal can edit timetables
- [ ] IT Admin can edit timetables
- [ ] Class Teacher sees "View Only Mode" on timetables
- [ ] Subject Teacher sees "View Only Mode" on timetables
- [ ] Role badges show correctly in Teacher List
- [ ] Role dropdown shows correct options based on user role

---

**Implementation Status:** ✅ Complete  
**Version:** 1.0  
**Last Updated:** November 2024
