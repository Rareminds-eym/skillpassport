# Unified Login with Multi-Role Support

## Overview

The unified login system now supports users who have multiple roles associated with the same email address. When a user with multiple roles logs in, they are presented with a role selection screen to choose which role they want to use for that session.

## How It Works

### 1. Authentication Flow

```
User enters credentials
    ↓
Supabase Auth validates
    ↓
System checks all role tables
    ↓
┌─────────────────────────────┐
│ Single Role Found           │ → Direct login to dashboard
├─────────────────────────────┤
│ Multiple Roles Found        │ → Show role selection screen
├─────────────────────────────┤
│ No Role Found               │ → Show error message
└─────────────────────────────┘
```

### 2. Role Detection

The system checks the following tables in order:
1. `students` table → Student role
2. `recruiters` table → Recruiter role
3. `school_educators` table → Educator role
4. `educators` table → Educator role (fallback)
5. `users` table → Admin roles (school_admin, college_admin, university_admin)

All matching roles are collected and returned to the user.

### 3. Role Selection UI

When multiple roles are detected:
- User sees a clean selection screen
- Each role is displayed as a card with:
  - Role name (e.g., "Student", "Educator", "School Administrator")
  - User's name (if available)
  - Additional context (e.g., school_id)
- User clicks on their desired role
- System logs them in with that role and redirects to the appropriate dashboard

## Example Scenarios

### Scenario 1: Teacher who is also a Student
A user might be:
- A teacher (educator role) at a school
- A student (student role) taking professional development courses

When they log in, they see:
```
┌─────────────────────────────────┐
│ Select Your Role                │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Educator                    │ │
│ │ John Smith                  │ │
│ │ School ID: school-123       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Student                     │ │
│ │ John Smith                  │ │
│ │ School ID: school-456       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Scenario 2: School Admin who is also an Educator
A principal might have:
- School admin role (administrative access)
- Educator role (teaching responsibilities)

They can switch between administrative and teaching views by logging in with different roles.

### Scenario 3: Recruiter who is also a Student
A company recruiter who is also pursuing education:
- Recruiter role (for hiring activities)
- Student role (for their own learning)

## Technical Implementation

### RoleLookupService

The `getUserRole` function now returns:

```typescript
interface RoleLookupResult {
  role: UserRole | null;        // Single role (if only one found)
  roles?: UserRole[];           // Multiple roles (if more than one found)
  userData: UserData | null;    // Data for single role
  allUserData?: UserData[];     // Data for all roles
  error?: string;
}
```

### UnifiedLogin Component

The login component handles three states:
1. **Login Form**: Initial state for entering credentials
2. **Role Selection**: Shown when multiple roles are detected
3. **Loading/Error**: Feedback during authentication

### State Management

```typescript
interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string;
  showRoleSelection: boolean;           // NEW
  availableRoles: Array<{               // NEW
    role: UserRole;
    userData: any;
  }>;
  selectedRole: UserRole | null;        // NEW
}
```

## Benefits

1. **Flexibility**: Users can have multiple roles without needing separate accounts
2. **Context Switching**: Easy to switch between different organizational roles
3. **Single Email**: One email address for all roles
4. **Clear UX**: Intuitive role selection when needed
5. **Backward Compatible**: Single-role users see no change in experience

## Security Considerations

- Each role is verified against the database
- User must authenticate before seeing available roles
- Role selection doesn't bypass authentication
- Each role has its own permissions and access controls
- Session is tied to the selected role

## Future Enhancements

Potential improvements:
1. **Role Switching**: Allow users to switch roles without logging out
2. **Default Role**: Remember user's preferred role
3. **Role Icons**: Visual icons for each role type
4. **Recent Role**: Auto-select the most recently used role
5. **Role Descriptions**: Add descriptions to help users choose

## Testing

The implementation includes tests for:
- Single role detection
- Multiple role detection
- Role selection flow
- Error handling
- UI rendering for role selection

Run tests with:
```bash
npm test src/services/__tests__/roleLookupService.test.ts
npm test src/utils/__tests__/roleBasedRouter.test.ts
```

## Migration Notes

This feature is backward compatible. Existing users with single roles will experience no change in their login flow. The role selection screen only appears when multiple roles are detected.

No database migrations are required as the feature works with existing table structures.
