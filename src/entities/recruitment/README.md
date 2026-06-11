# Recruitment Entity

Organization-level recruitment management system with multi-tenancy support.

## Overview

This entity provides the foundation for organization-scoped recruitment features including:
- Organization context management
- Member invitation system
- Role-based access control
- Permission management

## Architecture

```
recruitment/
├── api/              # API services
│   ├── orgContextService.ts
│   ├── invitationService.ts
│   ├── memberService.ts
│   └── index.ts
├── model/            # Data models and hooks
│   ├── types.ts
│   ├── useOrgContext.ts
│   ├── useRecruitmentInvitations.ts
│   ├── useRecruitmentMembers.ts
│   └── index.ts
├── lib/              # Utilities
│   ├── permissions.ts
│   ├── emailTemplates.ts
│   └── index.ts
├── ui/               # UI components
│   └── OrgContextProvider.tsx
└── index.ts          # Public API
```

## Quick Start

### 1. Organization Context

Get current user's organization context:

```typescript
import { useOrgContext } from '@/entities/recruitment';

function MyComponent() {
  const {
    orgContext,
    isLoading,
    isAdmin,
    isRecruiter,
    organizationId,
    organizationName,
  } = useOrgContext();

  if (isLoading) return <div>Loading...</div>;
  if (!orgContext) return <div>No organization access</div>;

  return (
    <div>
      <h1>{organizationName}</h1>
      <p>Role: {isAdmin ? 'Admin' : 'Recruiter'}</p>
    </div>
  );
}
```

### 2. Check Permissions

```typescript
import { useHasPermission } from '@/entities/recruitment';
import { canManageMembers } from '@/entities/recruitment';

function AdminPanel() {
  const hasPermission = useHasPermission('manage_members');
  const { orgContext } = useOrgContext();

  // Using hook
  if (!hasPermission) {
    return <div>Access denied</div>;
  }

  // Using utility function
  if (!canManageMembers(orgContext)) {
    return <div>Access denied</div>;
  }

  return <div>Admin Panel</div>;
}
```

### 3. Invite Members

```typescript
import { useCreateInvitation } from '@/entities/recruitment';

function InviteForm() {
  const createInvitation = useCreateInvitation();

  const handleSubmit = async (email: string, role: 'admin' | 'recruiter') => {
    try {
      const result = await createInvitation.mutateAsync({
        email,
        role,
        name: 'John Doe', // optional
      });

      console.log('Invitation sent:', result.invitationUrl);
    } catch (error) {
      console.error('Failed to send invitation:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit('user@example.com', 'recruiter');
    }}>
      {/* form fields */}
    </form>
  );
}
```

### 4. Manage Members

```typescript
import {
  useRecruitmentMembers,
  useUpdateMemberRole,
  useUpdateMemberStatus,
} from '@/entities/recruitment';

function MemberList() {
  const { data, isLoading } = useRecruitmentMembers({
    role: 'all',
    isActive: true,
  });

  const updateRole = useUpdateMemberRole();
  const updateStatus = useUpdateMemberStatus();

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'recruiter') => {
    await updateRole.mutateAsync({ userId, newRole });
  };

  const handleDeactivate = async (userId: string) => {
    await updateStatus.mutateAsync({ userId, isActive: false });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.members.map(member => (
        <div key={member.id}>
          <span>{member.name} - {member.role}</span>
          <button onClick={() => handleRoleChange(member.userId, 'admin')}>
            Make Admin
          </button>
          <button onClick={() => handleDeactivate(member.userId)}>
            Deactivate
          </button>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### Organization Context

#### `useOrgContext()`
Hook to get current user's organization context.

**Returns:**
```typescript
{
  orgContext: OrgContext | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isAdmin: boolean;
  isRecruiter: boolean;
  hasOrgAccess: boolean;
  organizationId?: string;
  organizationName?: string;
}
```

#### `getOrgContext()`
Service function to fetch organization context.

**Returns:** `Promise<OrgContext | null>`

### Invitations

#### `useCreateInvitation()`
Mutation hook to create and send invitations.

**Request:**
```typescript
{
  email: string;
  role: 'admin' | 'recruiter';
  name?: string;
}
```

**Response:**
```typescript
{
  invitation: RecruitmentInvitation;
  invitationUrl: string;
}
```

#### `useRecruitmentInvitations()`
Query hook to list all invitations for current organization.

**Returns:** `RecruitmentInvitation[]`

#### `useVerifyInvitation(token: string)`
Query hook to verify invitation token.

**Returns:**
```typescript
{
  valid: boolean;
  invitation?: RecruitmentInvitation;
  error?: string;
}
```

#### `useAcceptInvitation()`
Mutation hook to accept invitation.

**Request:**
```typescript
{
  token: string;
  userId: string;
}
```

### Members

#### `useRecruitmentMembers(options?)`
Query hook to list organization members.

**Options:**
```typescript
{
  role?: 'admin' | 'recruiter' | 'all';
  isActive?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}
```

**Returns:**
```typescript
{
  members: RecruitmentMember[];
  total: number;
  hasMore: boolean;
}
```

#### `useUpdateMemberRole()`
Mutation hook to update member role.

**Request:**
```typescript
{
  userId: string;
  newRole: 'admin' | 'recruiter';
}
```

#### `useUpdateMemberStatus()`
Mutation hook to activate/deactivate member.

**Request:**
```typescript
{
  userId: string;
  isActive: boolean;
}
```

#### `useMemberStats()`
Query hook to get member statistics.

**Returns:**
```typescript
{
  total: number;
  admins: number;
  recruiters: number;
  active: number;
  inactive: number;
}
```

### Permissions

#### Permission Utilities

```typescript
// Check if role has permission
hasPermission(role: 'admin' | 'recruiter', permission: RecruitmentPermission): boolean

// Check if org context has permission
hasOrgPermission(orgContext: OrgContext | null, permission: RecruitmentPermission): boolean

// Convenience functions
canManageMembers(orgContext: OrgContext | null): boolean
canInviteMembers(orgContext: OrgContext | null): boolean
canUpdateRoles(orgContext: OrgContext | null): boolean
canDeactivateMembers(orgContext: OrgContext | null): boolean
canManageOrgSettings(orgContext: OrgContext | null): boolean
canCreateJobs(orgContext: OrgContext | null): boolean
canDeleteJobs(orgContext: OrgContext | null): boolean
canManageCandidates(orgContext: OrgContext | null): boolean
canAssignCandidates(orgContext: OrgContext | null): boolean
canViewAnalytics(orgContext: OrgContext | null): boolean
canExportData(orgContext: OrgContext | null): boolean
```

#### Available Permissions

**Admin Permissions:**
- `manage_members` - Manage team members
- `invite_members` - Invite new members
- `update_roles` - Change member roles
- `deactivate_members` - Deactivate members
- `view_org_settings` - View organization settings
- `update_org_settings` - Update organization settings
- `create_jobs` - Create job postings
- `edit_jobs` - Edit job postings
- `delete_jobs` - Delete job postings
- `view_candidates` - View candidates
- `manage_candidates` - Manage candidates
- `assign_candidates` - Assign candidates to recruiters
- `view_analytics` - View analytics
- `export_data` - Export data

**Recruiter Permissions:**
- `create_jobs` - Create job postings
- `edit_jobs` - Edit job postings
- `view_candidates` - View candidates
- `manage_candidates` - Manage candidates
- `assign_candidates` - Assign candidates
- `view_analytics` - View analytics

## Backend API Endpoints

The frontend expects these backend endpoints:

### Organization Context
```
GET /api/recruitment/org-context
```

### Invitations
```
GET  /api/recruitment/invitations
POST /api/recruitment/invitations
GET  /api/recruitment/invitations/:id
GET  /api/recruitment/invitations/verify/:token
POST /api/recruitment/invitations/accept
PUT  /api/recruitment/invitations/:id/cancel
POST /api/recruitment/invitations/:id/resend
```

### Members
```
GET    /api/recruitment/members
GET    /api/recruitment/members/:userId
PUT    /api/recruitment/members/:userId/role
PUT    /api/recruitment/members/:userId/status
DELETE /api/recruitment/members/:userId
GET    /api/recruitment/members/stats
```

## Email Templates

The invitation system includes beautiful HTML email templates:

```typescript
import {
  generateInvitationEmail,
  generateInvitationEmailText,
} from '@/entities/recruitment';

const htmlEmail = generateInvitationEmail({
  recipientEmail: 'user@example.com',
  recipientName: 'John Doe',
  organizationName: 'Acme Corp',
  inviterName: 'Jane Smith',
  inviterEmail: 'jane@acme.com',
  role: 'recruiter',
  invitationUrl: 'https://app.example.com/invite/abc123',
  expiresAt: '2024-12-31T23:59:59Z',
});

const textEmail = generateInvitationEmailText({
  // same data
});
```

## Type Definitions

### OrgContext
```typescript
interface OrgContext {
  organizationId: string;
  organizationName: string;
  organizationType: 'school' | 'college' | 'university' | 'company';
  userRole: 'admin' | 'recruiter';
  isAdmin: boolean;
  isActive: boolean;
  userId: string;
  userEmail: string;
  userName?: string;
}
```

### RecruitmentInvitation
```typescript
interface RecruitmentInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  invitedByEmail: string;
  invitedByName?: string;
  inviteeEmail: string;
  inviteeName?: string;
  inviteeRole: 'admin' | 'recruiter';
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### RecruitmentMember
```typescript
interface RecruitmentMember {
  id: string;
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter';
  isActive: boolean;
  invitedBy?: string;
  invitedAt?: string;
  joinedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Testing

All TypeScript files compile without errors. Run diagnostics:

```bash
npm run build:dev
```

## Next Steps

1. Implement backend API endpoints
2. Add database schema changes (Phase 1)
3. Build UI components (Phase 4)
4. Integration testing (Phase 6)
