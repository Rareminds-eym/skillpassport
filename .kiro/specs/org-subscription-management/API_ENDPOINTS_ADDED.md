# Organization API Endpoints - Implementation Guide

**Date**: January 8, 2026  
**Worker**: `payments-api` (Extended)  
**Status**: Ready for Integration

---

## Overview

Organization subscription management endpoints have been added to the existing `payments-api` Cloudflare Worker. This approach:
- ✅ Reuses existing payment infrastructure
- ✅ Leverages Razorpay integration
- ✅ Maintains consistent authentication
- ✅ Uses existing email and storage services
- ✅ Follows established patterns

---

## New File Created

### `cloudflare-workers/payments-api/src/handlers/organization.ts`

**Size**: ~650 lines  
**Exports**: 10 handler functions

---

## API Endpoints to Add

### Organization Subscription Endpoints

#### 1. Calculate Pricing (Before Purchase)
```
POST /org-subscriptions/calculate-pricing
```

**Purpose**: Calculate pricing with volume discounts before purchase

**Request Body**:
```json
{
  "planId": "premium-plan-id",
  "seatCount": 100
}
```

**Response**:
```json
{
  "success": true,
  "pricing": {
    "basePrice": 1000,
    "seatCount": 100,
    "subtotal": 100000,
    "discountPercentage": 20,
    "discountAmount": 20000,
    "taxAmount": 14400,
    "finalAmount": 94400,
    "pricePerSeat": 944
  }
}
```

---

#### 2. Purchase Organization Subscription
```
POST /org-subscriptions/purchase
```

**Purpose**: Create organization subscription (payment integration pending)

**Request Body**:
```json
{
  "organizationId": "school-123",
  "organizationType": "school",
  "planId": "premium-plan-id",
  "seatCount": 100,
  "targetMemberType": "both",
  "billingCycle": "annual",
  "autoRenew": true
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub-uuid",
    "organizationId": "school-123",
    "totalSeats": 100,
    "availableSeats": 100,
    "discountPercentage": 20,
    "finalAmount": 94400,
    "status": "active"
  },
  "pricing": { /* pricing breakdown */ }
}
```

---

#### 3. Get Organization Subscriptions
```
GET /org-subscriptions?organizationId=school-123&organizationType=school
```

**Purpose**: List all subscriptions for an organization

**Response**:
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "sub-uuid",
      "organizationId": "school-123",
      "totalSeats": 100,
      "assignedSeats": 45,
      "availableSeats": 55,
      "status": "active",
      "endDate": "2027-01-08T00:00:00Z"
    }
  ]
}
```

---

#### 4. Update Seat Count
```
PUT /org-subscriptions/:id/seats
```

**Purpose**: Add or reduce seats (with validation)

**Request Body**:
```json
{
  "newSeatCount": 150
}
```

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub-uuid",
    "totalSeats": 150,
    "availableSeats": 105,
    "discountPercentage": 20,
    "finalAmount": 141600
  }
}
```

---

### License Pool Endpoints

#### 5. Create License Pool
```
POST /license-pools
```

**Purpose**: Create a pool to organize seat allocation

**Request Body**:
```json
{
  "organizationSubscriptionId": "sub-uuid",
  "organizationId": "school-123",
  "organizationType": "school",
  "poolName": "Computer Science Department",
  "memberType": "educator",
  "allocatedSeats": 50,
  "autoAssignNewMembers": true,
  "assignmentCriteria": {
    "department": "CS"
  }
}
```

**Response**:
```json
{
  "success": true,
  "pool": {
    "id": "pool-uuid",
    "poolName": "Computer Science Department",
    "allocatedSeats": 50,
    "assignedSeats": 0,
    "availableSeats": 50,
    "isActive": true
  }
}
```

---

#### 6. Get License Pools
```
GET /license-pools?organizationId=school-123
```

**Purpose**: List all pools for an organization

**Response**:
```json
{
  "success": true,
  "pools": [
    {
      "id": "pool-uuid",
      "poolName": "Computer Science Department",
      "memberType": "educator",
      "allocatedSeats": 50,
      "assignedSeats": 12,
      "availableSeats": 38
    }
  ]
}
```

---

### License Assignment Endpoints

#### 7. Assign License
```
POST /license-assignments
```

**Purpose**: Assign a license to a specific user

**Request Body**:
```json
{
  "poolId": "pool-uuid",
  "userId": "user-456"
}
```

**Response**:
```json
{
  "success": true,
  "assignment": {
    "id": "assignment-uuid",
    "userId": "user-456",
    "status": "active",
    "assignedAt": "2026-01-08T12:00:00Z"
  }
}
```

---

#### 8. Bulk Assign Licenses
```
POST /license-assignments/bulk
```

**Purpose**: Assign licenses to multiple users at once

**Request Body**:
```json
{
  "poolId": "pool-uuid",
  "userIds": ["user-1", "user-2", "user-3"]
}
```

**Response**:
```json
{
  "success": true,
  "successful": [
    { "id": "assignment-1", "userId": "user-1" },
    { "id": "assignment-2", "userId": "user-2" }
  ],
  "failed": [
    { "userId": "user-3", "error": "Already has active assignment" }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

---

#### 9. Unassign License
```
DELETE /license-assignments/:id
```

**Purpose**: Revoke a license from a user

**Request Body**:
```json
{
  "reason": "User left organization"
}
```

**Response**:
```json
{
  "success": true,
  "message": "License revoked successfully"
}
```

---

#### 10. Get User Assignments
```
GET /license-assignments/user/:userId
```

**Purpose**: Get all license assignments for a user

**Response**:
```json
{
  "success": true,
  "assignments": [
    {
      "id": "assignment-uuid",
      "status": "active",
      "assignedAt": "2026-01-08T12:00:00Z",
      "poolId": "pool-uuid"
    }
  ]
}
```

---

## Integration Steps

### Step 1: Import Organization Handlers

Add to `cloudflare-workers/payments-api/src/index.ts` (after existing imports):

```typescript
// Import organization handlers
import {
  handleCalculateOrgPricing,
  handlePurchaseOrgSubscription,
  handleGetOrgSubscriptions,
  handleUpdateSeatCount,
  handleCreateLicensePool,
  handleGetLicensePools,
  handleAssignLicense,
  handleBulkAssignLicenses,
  handleUnassignLicense,
  handleGetUserAssignments
} from './handlers/organization';
```

### Step 2: Add Routes to Switch Statement

Add to the `switch (path)` statement in the main fetch handler:

```typescript
// Organization Subscription endpoints
case '/org-subscriptions/calculate-pricing':
  if (request.method === 'POST') {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
    return await handleCalculateOrgPricing(request, env, auth.supabase, auth.user.id);
  }
  break;

case '/org-subscriptions/purchase':
  if (request.method === 'POST') {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
    return await handlePurchaseOrgSubscription(request, env, auth.supabase, auth.user.id);
  }
  break;

case '/org-subscriptions':
  if (request.method === 'GET') {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
    return await handleGetOrgSubscriptions(request, env, auth.supabase, auth.user.id);
  }
  break;

// License Pool endpoints
case '/license-pools':
  const auth1 = await authenticateUser(request, env);
  if (!auth1) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  if (request.method === 'POST') {
    return await handleCreateLicensePool(request, env, auth1.supabase, auth1.user.id);
  } else if (request.method === 'GET') {
    return await handleGetLicensePools(request, env, auth1.supabase, auth1.user.id);
  }
  break;

// License Assignment endpoints
case '/license-assignments':
  const auth2 = await authenticateUser(request, env);
  if (!auth2) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  if (request.method === 'POST') {
    return await handleAssignLicense(request, env, auth2.supabase, auth2.user.id);
  }
  break;

case '/license-assignments/bulk':
  if (request.method === 'POST') {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
    return await handleBulkAssignLicenses(request, env, auth.supabase, auth.user.id);
  }
  break;
```

### Step 3: Add Dynamic Routes

Add before the `default` case:

```typescript
// Handle dynamic routes
if (path.startsWith('/org-subscriptions/') && path.includes('/seats')) {
  if (request.method === 'PUT') {
    const auth = await authenticateUser(request, env);
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
    const subscriptionId = path.split('/')[2];
    return await handleUpdateSeatCount(request, env, auth.supabase, auth.user.id, subscriptionId);
  }
}

if (path.startsWith('/license-assignments/') && !path.includes('/bulk')) {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
  
  const parts = path.split('/');
  if (parts[2] === 'user' && parts[3]) {
    // GET /license-assignments/user/:userId
    if (request.method === 'GET') {
      return await handleGetUserAssignments(request, env, auth.supabase, auth.user.id, parts[3]);
    }
  } else if (parts[2]) {
    // DELETE /license-assignments/:id
    if (request.method === 'DELETE') {
      return await handleUnassignLicense(request, env, auth.supabase, auth.user.id, parts[2]);
    }
  }
}
```

### Step 4: Update Health Endpoint

Add to the endpoints array in `/health`:

```typescript
endpoints: [
  // ... existing endpoints ...
  // Organization endpoints
  'POST /org-subscriptions/calculate-pricing',
  'POST /org-subscriptions/purchase',
  'GET  /org-subscriptions',
  'PUT  /org-subscriptions/:id/seats',
  'POST /license-pools',
  'GET  /license-pools',
  'POST /license-assignments',
  'POST /license-assignments/bulk',
  'DELETE /license-assignments/:id',
  'GET  /license-assignments/user/:userId',
]
```

---

## Testing

### Test Calculate Pricing

```bash
curl -X POST https://payments-api.your-domain.workers.dev/org-subscriptions/calculate-pricing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium-plan-id",
    "seatCount": 100
  }'
```

### Test Purchase Subscription

```bash
curl -X POST https://payments-api.your-domain.workers.dev/org-subscriptions/purchase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "school-123",
    "organizationType": "school",
    "planId": "premium-plan-id",
    "seatCount": 100,
    "targetMemberType": "both",
    "billingCycle": "annual",
    "autoRenew": true
  }'
```

### Test Create License Pool

```bash
curl -X POST https://payments-api.your-domain.workers.dev/license-pools \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationSubscriptionId": "sub-uuid",
    "organizationId": "school-123",
    "organizationType": "school",
    "poolName": "CS Department",
    "memberType": "educator",
    "allocatedSeats": 50
  }'
```

---

## Frontend Integration

Update the frontend service to use these endpoints:

```typescript
// src/services/organization/organizationSubscriptionService.ts

// Replace Supabase direct calls with API calls
async purchaseSubscription(request: OrgSubscriptionPurchaseRequest) {
  const response = await fetch(
    `${PAYMENTS_API_URL}/org-subscriptions/purchase`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );
  
  const data = await response.json();
  return data.subscription;
}
```

---

## Security

All endpoints require authentication via `Authorization: Bearer <token>` header.

Additional security features:
- ✅ User authentication check
- ✅ Seat availability validation
- ✅ Duplicate assignment prevention
- ✅ Organization membership validation (TODO)
- ✅ Admin-only operations (TODO: add role check)

---

## Next Steps

1. ✅ Create organization handlers file
2. 🚧 Add routes to index.ts
3. 🚧 Test endpoints
4. 🚧 Update frontend services
5. 🚧 Add admin authorization checks
6. 🚧 Integrate Razorpay payment flow
7. 🚧 Add email notifications
8. 🚧 Deploy to production

---

## Deployment

```bash
cd cloudflare-workers/payments-api
wrangler deploy
```

---

**Status**: Handlers created, routing integration pending  
**Next**: Add routes to index.ts and test
