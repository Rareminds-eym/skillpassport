# Recruitment API Endpoints

Organization-scoped recruitment API endpoints with FDW-based permission checking.

## Architecture

- **Database**: Queries SSO-Worker via Foreign Data Wrapper (FDW)
- **Authentication**: Uses `withAuth` middleware from `@rareminds-eym/auth-core`
- **Authorization**: Permission checking via database functions
- **Org Scoping**: All queries filtered by `organization_id`

## Endpoints

### Organization Context

#### GET `/api/recruitment/org-context`
Get user's organization contexts for recruitment.

**Response:**
```json
{
  "contexts": [
    {
      "orgId": "uuid",
      "orgName": "Company Name",
      "orgSlug": "company-slug",
      "membershipStatus": "active",
      "ssoRoleName": "admin",
      "recruitmentRole": "company_admin",
      "recruitmentEnabled": true,
      "userId": "uuid",
      "userEmail": "user@example.com",
      "isActive": true,
      "isAdmin": true,
      "isRecruiter": false,
      "hasRecruitmentAccess": true
    }
  ],
  "total": 1
}
```

---

### Members Management

#### GET `/api/recruitment/members`
List organization members.

**Query Parameters:**
- `org_id` (optional) - Organization ID (defaults to user's org)
- `role` (optional) - Filter by role
- `isActive` (optional) - Filter by active status
- `search` (optional) - Search query
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Required Permission:** `view_candidates` (any member)

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "userId": "uuid",
      "organizationId": "uuid",
      "email": "user@example.com",
      "ssoRoleName": "admin",
      "membershipStatus": "active",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "hasMore": false
}
```

#### GET `/api/recruitment/members/stats`
Get member statistics.

**Query Parameters:**
- `org_id` (optional) - Organization ID

**Required Permission:** `view_candidates`

**Response:**
```json
{
  "total": 10,
  "active": 8,
  "inactive": 2,
  "admins": 2,
  "recruiters": 8
}
```

---

### Invitations

#### GET `/api/recruitment/invitations`
List organization invitations.

**Query Parameters:**
- `org_id` (optional) - Organization ID

**Required Permission:** `manage_team`

**Response:**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "invitee_email": "newuser@example.com",
      "invitee_role": "recruiter",
      "status": "pending",
      "expires_at": "2024-01-08T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5
}
```

#### POST `/api/recruitment/invitations`
Create a new invitation.

**Required Permission:** `manage_team`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "recruiter",
  "name": "New User",
  "org_id": "uuid"
}
```

**Response:**
```json
{
  "invitation": { ... },
  "invitationUrl": "https://app.skillpassport.com/accept-invitation?token=...",
  "message": "Invitation created successfully"
}
```

---

### Requisitions

#### GET `/api/recruitment/requisitions`
List organization requisitions.

**Query Parameters:**
- `org_id` (optional) - Organization ID
- `status` (optional) - Filter by status
- `department` (optional) - Filter by department
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Required Permission:** `view_candidates`

**Response:**
```json
{
  "requisitions": [
    {
      "id": "req-123",
      "organization_id": "uuid",
      "title": "Senior Software Engineer",
      "department": "Engineering",
      "status": "open",
      "approval_status": "approved",
      "created_by_uuid": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

#### POST `/api/recruitment/requisitions`
Create a new requisition.

**Required Permission:** `create_jobs`

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "location": "Remote",
  "job_type": "Full-time",
  "openings": 2,
  "description": "...",
  "requirements": "...",
  "salary_range": "$120k-$180k"
}
```

#### PUT `/api/recruitment/requisitions/[id]`
Update a requisition.

**Required Permission:** `edit_jobs`

#### DELETE `/api/recruitment/requisitions/[id]`
Delete a requisition.

**Required Permission:** `delete_jobs` (admin only)

---

### Pipeline Candidates

#### GET `/api/recruitment/pipeline`
List pipeline candidates.

**Query Parameters:**
- `org_id` (optional) - Organization ID
- `stage` (optional) - Filter by stage
- `status` (optional) - Filter by status
- `requisition_id` (optional) - Filter by requisition
- `opportunity_id` (optional) - Filter by opportunity
- `assigned_to` (optional) - Filter by assigned recruiter
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Required Permission:** `view_candidates`

**Response:**
```json
{
  "candidates": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "candidate_name": "John Doe",
      "candidate_email": "john@example.com",
      "stage": "interview_1",
      "status": "active",
      "assigned_to_uuid": "uuid",
      "added_by_uuid": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

#### POST `/api/recruitment/pipeline`
Add candidate to pipeline.

**Required Permission:** `manage_candidates`

**Request Body:**
```json
{
  "learner_id": "uuid",
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com",
  "requisition_id": "uuid",
  "opportunity_id": "uuid",
  "stage": "sourced",
  "source": "direct_application"
}
```

#### PUT `/api/recruitment/pipeline/[id]`
Update pipeline candidate.

**Required Permission:** `manage_candidates`

#### PATCH `/api/recruitment/pipeline/[id]/stage`
Move candidate to different stage.

**Required Permission:** `manage_candidates`

**Request Body:**
```json
{
  "stage": "interview_2"
}
```

#### PATCH `/api/recruitment/pipeline/[id]/assign`
Assign candidate to recruiter.

**Required Permission:** `manage_candidates`

**Request Body:**
```json
{
  "assigned_to_uuid": "uuid"
}
```

---

### Opportunities

#### GET `/api/opportunities`
List opportunities (org-scoped).

**Query Parameters:**
- `org_id` (optional) - Organization ID
- `type` (optional) - Filter by type
- `status` (optional) - Filter by status
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Required Permission:** Member of organization

---

### Offers

#### GET `/api/recruiter/offers`
List offers (org-scoped).

**Query Parameters:**
- `org_id` (optional) - Organization ID
- `view_all` (optional) - View all org offers (admin only)
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Required Permission:** Member of organization

#### POST `/api/recruiter/offers`
Create an offer.

**Required Permission:** `manage_candidates`

---

## Permissions

All endpoints use database-level permission checking via FDW:

| Permission | Description | Roles |
|------------|-------------|-------|
| `manage_team` | Invite/manage members | company_admin |
| `create_jobs` | Create requisitions | company_admin, recruiter |
| `edit_jobs` | Edit requisitions | company_admin, recruiter |
| `delete_jobs` | Delete requisitions | company_admin |
| `view_candidates` | View candidates | company_admin, recruiter, viewer |
| `manage_candidates` | Manage candidates | company_admin, recruiter |
| `view_analytics` | View analytics | company_admin, recruiter, viewer |

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common Status Codes:**
- `400` - Bad Request (missing/invalid parameters)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Use the following tools to test endpoints:

1. **Postman/Insomnia**: Import the API collection
2. **cURL**: Example requests in each endpoint section
3. **Frontend**: Use the service layer in `src/entities/recruitment/api/`

## Development

To add a new endpoint:

1. Create file in `functions/api/recruitment/[feature]/index.ts`
2. Use `withAuth` middleware for authentication
3. Use `verifyOrgAccess` for authorization
4. Always filter by `organization_id`
5. Use database functions for permission checks
6. Add documentation to this README
