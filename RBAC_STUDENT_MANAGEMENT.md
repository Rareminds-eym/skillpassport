# Student Management RBAC (Role-Based Access Control)

## 8.2.1 Roles Overview

| Role | Description |
|------|-------------|
| **Principal** | Full control over academics + admin |
| **Vice Principal** | Academic authority, limited admin |
| **IT Admin** | Manages access and settings |
| **Class Teacher** | Attendance & academic management |
| **Subject Teacher** | Subject teaching & assessments |
| **Accountant** | Finance & fee workflows |
| **Librarian** | Library operations |
| **Parent** | Child-specific access |
| **Career Counselor** | Access to career module |

## 8.2.2 Student Management RBAC Matrix

**Legend:**
- **V** = View
- **C** = Create
- **U** = Update
- **D** = Delete
- **A** = Approve
- **N/A** = No Access

### A. Student Management Permissions

| Feature | Principal | IT Admin | Class Teacher | Subject Teacher | Parent |
|---------|-----------|----------|---------------|-----------------|--------|
| **Add Student** | C/U/D | C | N/A | N/A | N/A |
| **Edit Student Profile** | U | U | V | V | V (limited) |
| **Attendance Entry** | A | N/A | C/U | N/A | V |
| **Attendance Edit** | A | N/A | U (24 hrs) | N/A | N/A |
| **Student Transfer** | A | U | N/A | N/A | N/A |
| **Generate Student Report** | V | V | V | V | V |

## Implementation

### 1. Backend - Permission Service

```typescript
import { permissionService } from '@/services/permissionService';

// Check if user can add student
const { allowed, reason } = await permissionService.canAddStudent();

if (!allowed) {
  return res.status(403).json({ error: reason });
}

// Proceed with operation
```

### 2. Frontend - React Hooks

```typescript
import { useFeatureAccess, useUserRole } from '@/hooks/usePermissions';

function StudentManagement() {
  const { role } = useUserRole();
  const { access, loading } = useFeatureAccess();

  if (loading) return <Loading />;

  return (
    <div>
      {access.canAddStudent && (
        <button onClick={handleAddStudent}>Add Student</button>
      )}
      
      {access.canMarkAttendance && (
        <AttendanceForm />
      )}
      
      {role === 'principal' && (
        <AdminPanel />
      )}
    </div>
  );
}
```

### 3. Conditional Rendering

```typescript
import { usePermission } from '@/hooks/usePermissions';

function EditStudentButton({ studentId }) {
  const { allowed, reason } = usePermission('edit_student_profile', 'update');

  if (!allowed) {
    return <Tooltip content={reason}><Button disabled>Edit</Button></Tooltip>;
  }

  return <Button onClick={() => editStudent(studentId)}>Edit</Button>;
}
```

### 4. Parent-Specific Access

```typescript
import { useStudentAccess } from '@/hooks/usePermissions';

function StudentProfile({ studentId }) {
  const { allowed, reason, loading } = useStudentAccess(studentId);

  if (loading) return <Loading />;

  if (!allowed) {
    return <AccessDenied message={reason} />;
  }

  return <StudentDetails studentId={studentId} />;
}
```

### 5. Attendance Edit with Time Check

```typescript
import { useAttendanceEditPermission } from '@/hooks/usePermissions';

function AttendanceRow({ record }) {
  const { allowed, reason } = useAttendanceEditPermission(record.date);

  return (
    <tr>
      <td>{record.studentName}</td>
      <td>{record.status}</td>
      <td>
        {allowed ? (
          <button onClick={() => editAttendance(record.id)}>Edit</button>
        ) : (
          <Tooltip content={reason}>
            <button disabled>Edit</button>
          </Tooltip>
        )}
      </td>
    </tr>
  );
}
```

## Permission Rules

### Add Student
- **Principal**: Full CRUD access
- **IT Admin**: Can create students
- **Others**: No access

### Edit Student Profile
- **Principal**: Can update all fields
- **IT Admin**: Can update all fields
- **Vice Principal**: Can update all fields
- **Class Teacher**: View only
- **Subject Teacher**: View only
- **Parent**: View only (limited to own child)

### Attendance Entry
- **Principal**: Approval access
- **Class Teacher**: Can create and update
- **Parent**: View only (own child)
- **Others**: No access

### Attendance Edit
- **Principal**: Can approve edits anytime
- **Class Teacher**: Can edit within 24 hours
- **Others**: No access

**Special Rule**: After 24 hours, Class Teacher must request Principal approval

### Student Transfer
- **Principal**: Can approve transfers
- **Vice Principal**: Can initiate (requires Principal approval)
- **IT Admin**: Can initiate (requires Principal approval)
- **Others**: No access

### Generate Reports
- **All roles except Accountant and Librarian**: Can view reports
- **Parent**: Can view own child's reports only

### Change Class/Section
- **Principal only**: Can change class or section
- **Others**: No access (as per validation rules)

## Database-Level RLS Policies

The RLS policies in the migration file enforce these permissions at the database level:

```sql
-- Example: Only school staff can view student records
CREATE POLICY "School staff can view their school's student records"
  ON student_management_records FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );
```

## API Endpoint Protection

```typescript
// Example: Protected route
app.post('/api/students', async (req, res) => {
  // Check permission
  const { allowed, reason } = await permissionService.canAddStudent();
  
  if (!allowed) {
    return res.status(403).json({ error: reason });
  }

  // Proceed with student creation
  const student = await studentService.createStudent(req.body);
  res.json(student);
});
```

## Testing Permissions

```typescript
// Test file: permissionService.test.ts
describe('Permission Service', () => {
  it('should allow Principal to add students', async () => {
    // Mock user role as Principal
    const { allowed } = await permissionService.canAddStudent();
    expect(allowed).toBe(true);
  });

  it('should not allow Subject Teacher to mark attendance', async () => {
    // Mock user role as Subject Teacher
    const { allowed } = await permissionService.canMarkAttendance();
    expect(allowed).toBe(false);
  });

  it('should allow Class Teacher to edit attendance within 24 hours', async () => {
    const today = new Date().toISOString();
    const { allowed } = await permissionService.canEditAttendance(today);
    expect(allowed).toBe(true);
  });

  it('should not allow Class Teacher to edit attendance after 24 hours', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const { allowed } = await permissionService.canEditAttendance(twoDaysAgo);
    expect(allowed).toBe(false);
  });
});
```

## UI Components

### Permission-Based Button

```typescript
function PermissionButton({ 
  feature, 
  permission, 
  onClick, 
  children 
}: {
  feature: string;
  permission: Permission;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { allowed, reason, loading } = usePermission(feature, permission);

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <Tooltip content={!allowed ? reason : undefined}>
      <Button 
        onClick={onClick} 
        disabled={!allowed}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

// Usage
<PermissionButton 
  feature="add_student" 
  permission="create"
  onClick={handleAddStudent}
>
  Add Student
</PermissionButton>
```

### Role-Based Navigation

```typescript
function Navigation() {
  const { role } = useUserRole();

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      
      {(role === 'principal' || role === 'it_admin') && (
        <Link to="/students/add">Add Student</Link>
      )}
      
      {role === 'class_teacher' && (
        <Link to="/attendance">Mark Attendance</Link>
      )}
      
      {role === 'parent' && (
        <Link to="/my-children">My Children</Link>
      )}
    </nav>
  );
}
```

## Best Practices

1. **Always check permissions on both frontend and backend**
   - Frontend: For UI/UX
   - Backend: For security

2. **Use RLS policies in Supabase**
   - Provides database-level security
   - Prevents unauthorized data access

3. **Cache permission checks**
   - Avoid repeated database queries
   - Use React hooks for caching

4. **Provide clear error messages**
   - Tell users why they can't perform an action
   - Suggest alternatives (e.g., "Request Principal approval")

5. **Log permission denials**
   - Track unauthorized access attempts
   - Audit trail for security

6. **Test all permission scenarios**
   - Unit tests for each role
   - Integration tests for workflows
   - E2E tests for user journeys
