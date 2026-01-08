# Add-on Subscription API Documentation

This document describes the API endpoints for the Feature Add-on Subscription System.

## Base URL

```
https://payments-api.dark-mode-d021.workers.dev
```

## Authentication

All endpoints (except `/addon-catalog`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Get Add-on Catalog

Retrieve available add-ons and bundles.

**Endpoint:** `GET /addon-catalog`

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (e.g., "ai_features", "analytics") |
| role | string | Filter by target role (e.g., "student", "educator", "recruiter") |

**Response:**
```json
{
  "success": true,
  "addons": [
    {
      "id": "uuid",
      "feature_key": "ai_job_matching",
      "name": "AI Job Matching",
      "description": "Smart job recommendations powered by AI",
      "category": "ai_features",
      "price_monthly": 199,
      "price_annual": 1990,
      "target_roles": ["student"],
      "icon_url": "https://..."
    }
  ],
  "bundles": [
    {
      "id": "uuid",
      "name": "Student Pro Bundle",
      "slug": "student-pro",
      "description": "All premium features for students",
      "price_monthly": 499,
      "price_annual": 4990,
      "discount_percentage": 20,
      "target_roles": ["student"],
      "feature_keys": ["ai_job_matching", "career_ai", "video_portfolio"]
    }
  ]
}
```

---

### 2. Get User Entitlements

Retrieve active entitlements for the authenticated user.

**Endpoint:** `GET /user-entitlements`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "entitlements": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "feature_key": "ai_job_matching",
      "status": "active",
      "start_date": "2025-01-06T00:00:00Z",
      "end_date": "2025-02-06T00:00:00Z",
      "billing_period": "monthly",
      "auto_renew": true,
      "bundle_id": null,
      "price_at_purchase": 199
    }
  ]
}
```

---

### 3. Create Add-on Order

Create a Razorpay order for purchasing an add-on.

**Endpoint:** `POST /create-addon-order`

**Authentication:** Required

**Request Body:**
```json
{
  "feature_key": "ai_job_matching",
  "billing_period": "monthly"  // or "annual"
}
```

**Response:**
```json
{
  "success": true,
  "razorpay_order_id": "order_xxx",
  "order_id": "uuid",
  "amount": 19900,  // in paise
  "currency": "INR",
  "addon_name": "AI Job Matching",
  "key": "rzp_xxx"  // Razorpay key ID
}
```

**Error Responses:**
- `400` - Missing feature_key or user already has active subscription
- `404` - Add-on not found
- `500` - Failed to create payment order

---

### 4. Verify Add-on Payment

Verify Razorpay payment and activate the entitlement.

**Endpoint:** `POST /verify-addon-payment`

**Authentication:** Required

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "entitlement_id": "uuid",
  "feature_key": "ai_job_matching",
  "end_date": "2025-02-06T00:00:00Z",
  "message": "Payment verified and add-on activated successfully"
}
```

**Error Responses:**
- `400` - Missing required fields or invalid signature
- `404` - Order not found

---

### 5. Cancel Add-on

Cancel an add-on subscription (access continues until end_date).

**Endpoint:** `POST /cancel-addon`

**Authentication:** Required

**Request Body:**
```json
{
  "entitlement_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Add-on cancelled successfully. Access continues until 2025-02-06",
  "entitlement": {
    "id": "uuid",
    "status": "cancelled",
    "auto_renew": false,
    "cancelled_at": "2025-01-06T12:00:00Z"
  }
}
```

---

### 6. Check Add-on Access

Check if user has access to a specific feature.

**Endpoint:** `GET /check-addon-access?feature_key=ai_job_matching`

**Authentication:** Required

**Response (has access):**
```json
{
  "success": true,
  "hasAccess": true,
  "accessSource": "addon",  // or "bundle" or "plan"
  "entitlement": {
    "id": "uuid",
    "feature_key": "ai_job_matching",
    "status": "active",
    "end_date": "2025-02-06T00:00:00Z"
  }
}
```

**Response (no access):**
```json
{
  "success": true,
  "hasAccess": false,
  "accessSource": null
}
```

---

### 7. Create Bundle Order

Create a Razorpay order for purchasing a bundle.

**Endpoint:** `POST /create-bundle-order`

**Authentication:** Required

**Request Body:**
```json
{
  "bundle_id": "uuid",
  "billing_period": "annual"
}
```

**Response:**
```json
{
  "success": true,
  "razorpay_order_id": "order_xxx",
  "amount": 499000,
  "currency": "INR",
  "bundle_name": "Student Pro Bundle",
  "feature_keys": ["ai_job_matching", "career_ai", "video_portfolio"],
  "key": "rzp_xxx"
}
```

---

### 8. Verify Bundle Payment

Verify bundle payment and activate all included entitlements.

**Endpoint:** `POST /verify-bundle-payment`

**Authentication:** Required

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "bundle_id": "uuid",
  "billing_period": "annual"
}
```

**Response:**
```json
{
  "success": true,
  "entitlements": [...],
  "bundle_name": "Student Pro Bundle",
  "end_date": "2026-01-06T00:00:00Z",
  "message": "Payment verified and bundle activated successfully"
}
```

---

## Lifecycle Management Endpoints

These endpoints are typically called by scheduled cron jobs.

### 9. Check Expiring Entitlements

**Endpoint:** `POST /check-expiring-entitlements`

**Request Body:**
```json
{
  "daysAhead": 7
}
```

**Response:**
```json
{
  "success": true,
  "expiringCount": 5,
  "notificationsSent": 5,
  "entitlements": [...]
}
```

### 10. Check Usage Limits

**Endpoint:** `POST /check-usage-limits`

**Response:**
```json
{
  "success": true,
  "checkedCount": 10,
  "warningsSent": 2,
  "limitReached": [...]
}
```

### 11. Get Entitlement Stats

**Endpoint:** `GET /entitlement-stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalActive": 150,
    "expiringThisWeek": 12,
    "expiringThisMonth": 45,
    "byFeature": {
      "ai_job_matching": 50,
      "career_ai": 35
    },
    "recentPurchases": 8
  }
}
```

### 12. Create Renewal Order

**Endpoint:** `POST /create-renewal-order`

**Request Body:**
```json
{
  "entitlementId": "uuid",
  "dryRun": false
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing JWT token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Rate Limits

- Standard endpoints: 100 requests/minute per user
- Catalog endpoint: 1000 requests/minute (public)

## Webhook Events

The system sends the following webhook events (if configured):

- `addon.purchased` - When an add-on is successfully purchased
- `addon.cancelled` - When an add-on is cancelled
- `addon.expired` - When an add-on expires
- `addon.renewed` - When an add-on is auto-renewed
