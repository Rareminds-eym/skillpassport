# Organization Subscription Management - Database Schema

## Overview

This document describes the database schema for the Organization Subscription Management feature. The schema enables B2B subscription management for schools, colleges, and universities.

## Design Principles

1. **Reuse Existing Infrastructure**: Leverages existing `subscriptions`, `user_entitlements`, `subscription_plans`, and payment tables
2. **Minimal Schema Changes**: Adds only essential new tables for organization management
3. **Backward Compatibility**: Individual B2C subscriptions continue to work alongside B2B organization subscriptions
4. **Scalability**: Supports from small schools (10 users) to large universities (10,000+ users)
5. **Audit Trail**: Complete tracking of all subscription assignments and changes

## Entity Relationship Diagram

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   subscription_plans    │     │         users           │
│─────────────────────────│     │─────────────────────────│
│ id (PK)                 │     │ id (PK)                 │
│ name                    │     │ email                   │
│ price                   │     │ school_id (FK)          │
│ plan_type (B2B/B2C)     │     │ college_id (FK)         │
│ max_users               │     │ role                    │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────┐
│              organization_subscriptions                  │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ organization_id                                         │
│ organization_type (school/college/university)           │
│ subscription_plan_id (FK) ──────────────────────────────┤
│ purchased_by (FK) ──────────────────────────────────────┤
│ total_seats, assigned_seats, available_seats            │
│ target_member_type (educator/student/both)              │
│ status, start_date, end_date, auto_renew                │
│ price_per_seat, total_amount, discount_percentage       │
└───────────┬─────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────┐
│                    license_pools                         │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ organization_subscription_id (FK) ──────────────────────┤
│ organization_id, organization_type                      │
│ pool_name (e.g., "CS Department", "Grade 10")           │
│ member_type (educator/student)                          │
│ allocated_seats, assigned_seats, available_seats        │
│ auto_assign_new_members, assignment_criteria (JSONB)    │
└───────────┬─────────────────────────────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────────────────────────────────────────────────┐
│                  license_assignments                     │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ license_pool_id (FK) ───────────────────────────────────┤
│ organization_subscription_id (FK)                       │
│ user_id (FK) ───────────────────────────────────────────┤
│ member_type, status (active/suspended/revoked/expired)  │
│ assigned_at, assigned_by, expires_at                    │
│ revoked_at, revoked_by, revocation_reason               │
│ transferred_from, transferred_to                        │
└───────────┬─────────────────────────────────────────────┘
            │
            │ Triggers entitlement creation
            ▼
┌─────────────────────────────────────────────────────────┐
│                   user_entitlements                      │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ user_id (FK)                                            │
│ feature_key                                             │
│ granted_by_organization (BOOLEAN) ← Extended            │
│ organization_subscription_id (FK) ← Extended            │
│ granted_by (FK) ← Extended                              │
│ is_active, expires_at                                   │
└─────────────────────────────────────────────────────────┘
```

## New Tables

### 1. organization_subscriptions

Tracks subscriptions purchased by organization administrators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| organization_id | UUID | NOT NULL | References schools.id, colleges.id, or universities.id |
| organization_type | VARCHAR(20) | NOT NULL, CHECK IN ('school', 'college', 'university') | Type of organization |
| subscription_plan_id | UUID | NOT NULL, FK → subscription_plans(id) | Selected subscription plan |
| purchased_by | UUID | NOT NULL, FK → users(id) | Admin who made the purchase |
| total_seats | INTEGER | NOT NULL, CHECK > 0 | Total purchased seats |
| assigned_seats | INTEGER | DEFAULT 0, CHECK >= 0 | Currently assigned seats |
| available_seats | INTEGER | GENERATED ALWAYS AS (total_seats - assigned_seats) STORED | Computed available seats |
| target_member_type | VARCHAR(20) | NOT NULL, CHECK IN ('educator', 'student', 'both') | Who can receive licenses |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'paused', 'cancelled', 'expired', 'grace_period') | Subscription status |
| start_date | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Subscription start |
| end_date | TIMESTAMPTZ | NOT NULL | Subscription expiration |
| auto_renew | BOOLEAN | DEFAULT true | Auto-renewal flag |
| price_per_seat | DECIMAL(10,2) | NOT NULL | Price per seat after discounts |
| total_amount | DECIMAL(10,2) | NOT NULL | Subtotal before tax |
| discount_percentage | INTEGER | DEFAULT 0 | Volume discount applied |
| final_amount | DECIMAL(10,2) | NOT NULL | Final amount including tax |
| razorpay_subscription_id | VARCHAR(100) | | Razorpay subscription reference |
| razorpay_order_id | VARCHAR(100) | | Razorpay order reference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| cancelled_at | TIMESTAMPTZ | | Cancellation timestamp |
| cancellation_reason | TEXT | | Reason for cancellation |

**Indexes:**
- `idx_org_subs_org_id` ON (organization_id)
- `idx_org_subs_status` ON (status)
- `idx_org_subs_end_date` ON (end_date)
- `idx_org_subs_purchased_by` ON (purchased_by)

**Constraints:**
- `valid_seat_count`: CHECK (assigned_seats <= total_seats)

### 2. license_pools

Manages available subscription seats for organizations, allowing segmentation by department, grade, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| organization_subscription_id | UUID | NOT NULL, FK → organization_subscriptions(id) ON DELETE CASCADE | Parent subscription |
| organization_id | UUID | NOT NULL | Organization reference |
| organization_type | VARCHAR(20) | NOT NULL | Type of organization |
| pool_name | VARCHAR(100) | | Descriptive name (e.g., "CS Department") |
| member_type | VARCHAR(20) | NOT NULL, CHECK IN ('educator', 'student') | Target member type |
| allocated_seats | INTEGER | NOT NULL, CHECK > 0 | Seats allocated to this pool |
| assigned_seats | INTEGER | DEFAULT 0, CHECK >= 0 | Currently assigned seats |
| available_seats | INTEGER | GENERATED ALWAYS AS (allocated_seats - assigned_seats) STORED | Computed available |
| auto_assign_new_members | BOOLEAN | DEFAULT false | Auto-assign to new members |
| assignment_criteria | JSONB | DEFAULT '{}' | Criteria for auto-assignment |
| is_active | BOOLEAN | DEFAULT true | Pool active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FK → users(id) | Admin who created the pool |

**Indexes:**
- `idx_license_pools_org_sub` ON (organization_subscription_id)
- `idx_license_pools_org_id` ON (organization_id)
- `idx_license_pools_member_type` ON (member_type)

**Constraints:**
- `valid_pool_seats`: CHECK (assigned_seats <= allocated_seats)


### 3. license_assignments

Tracks which members have been assigned subscription seats.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| license_pool_id | UUID | NOT NULL, FK → license_pools(id) ON DELETE CASCADE | Parent pool |
| organization_subscription_id | UUID | NOT NULL, FK → organization_subscriptions(id) ON DELETE CASCADE | Parent subscription |
| user_id | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE | Assigned member |
| member_type | VARCHAR(20) | NOT NULL, CHECK IN ('educator', 'student') | Member type |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'suspended', 'revoked', 'expired') | Assignment status |
| assigned_at | TIMESTAMPTZ | DEFAULT NOW() | Assignment timestamp |
| assigned_by | UUID | NOT NULL, FK → users(id) | Admin who assigned |
| expires_at | TIMESTAMPTZ | | Assignment expiration |
| revoked_at | TIMESTAMPTZ | | Revocation timestamp |
| revoked_by | UUID | FK → users(id) | Admin who revoked |
| revocation_reason | TEXT | | Reason for revocation |
| transferred_from | UUID | FK → license_assignments(id) | Source of transfer |
| transferred_to | UUID | FK → license_assignments(id) | Target of transfer |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_license_assign_user` ON (user_id)
- `idx_license_assign_pool` ON (license_pool_id)
- `idx_license_assign_status` ON (status)
- `idx_license_assign_org_sub` ON (organization_subscription_id)

**Constraints:**
- `unique_active_assignment`: UNIQUE (user_id, organization_subscription_id, status) WHERE status = 'active'

### 4. organization_invitations

Tracks member invitations with auto-subscription assignment capability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| organization_id | UUID | NOT NULL | Organization reference |
| organization_type | VARCHAR(20) | NOT NULL | Type of organization |
| email | VARCHAR(255) | NOT NULL | Invitee email address |
| member_type | VARCHAR(20) | NOT NULL, CHECK IN ('educator', 'student') | Invited as type |
| invited_by | UUID | NOT NULL, FK → users(id) | Admin who sent invitation |
| auto_assign_subscription | BOOLEAN | DEFAULT false | Auto-assign license on accept |
| target_license_pool_id | UUID | FK → license_pools(id) | Pool for auto-assignment |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending', CHECK IN ('pending', 'accepted', 'expired', 'cancelled') | Invitation status |
| invitation_token | VARCHAR(100) | UNIQUE, NOT NULL | Secure acceptance token |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration (7 days) |
| accepted_at | TIMESTAMPTZ | | Acceptance timestamp |
| accepted_by | UUID | FK → users(id) | User who accepted |
| invitation_message | TEXT | | Custom message to invitee |
| metadata | JSONB | DEFAULT '{}' | Additional metadata |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_org_inv_org_id` ON (organization_id)
- `idx_org_inv_email` ON (email)
- `idx_org_inv_token` ON (invitation_token)
- `idx_org_inv_status` ON (status)

**Constraints:**
- `unique_pending_invitation`: UNIQUE (organization_id, email, status) WHERE status = 'pending'

## Extended Existing Tables

### subscriptions (Extended)

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| organization_id | UUID | | Organization reference for B2B |
| organization_type | VARCHAR(20) | | Type of organization |
| purchased_by | UUID | FK → users(id) | Admin who purchased |
| seat_count | INTEGER | DEFAULT 1 | Number of seats |
| is_organization_subscription | BOOLEAN | DEFAULT false | B2B subscription flag |

**New Index:**
- `idx_subscriptions_org_id` ON (organization_id) WHERE organization_id IS NOT NULL


### user_entitlements (Extended)

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| granted_by_organization | BOOLEAN | DEFAULT false | Organization-provided flag |
| organization_subscription_id | UUID | FK → organization_subscriptions(id) ON DELETE CASCADE | Source subscription |
| granted_by | UUID | FK → users(id) | Admin who granted |

**New Index:**
- `idx_entitlements_org_sub` ON (organization_subscription_id) WHERE organization_subscription_id IS NOT NULL

### payment_transactions (Extended)

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| organization_id | UUID | | Organization reference |
| organization_type | VARCHAR(20) | | Type of organization |
| seat_count | INTEGER | | Seats in transaction |
| is_bulk_purchase | BOOLEAN | DEFAULT false | Bulk purchase flag |

**New Index:**
- `idx_payments_org_id` ON (organization_id) WHERE organization_id IS NOT NULL

### addon_pending_orders (Extended)

| New Column | Type | Constraints | Description |
|------------|------|-------------|-------------|
| organization_id | UUID | | Organization reference |
| target_member_type | VARCHAR(20) | | Target member type |
| target_member_ids | UUID[] | | Specific target members |
| is_bulk_order | BOOLEAN | DEFAULT false | Bulk order flag |

## Row-Level Security (RLS) Policies

### organization_subscriptions

```sql
-- Admin can view their organization's subscriptions
CREATE POLICY "org_subs_select_policy" ON organization_subscriptions
  FOR SELECT USING (
    purchased_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('school_admin', 'college_admin', 'university_admin')
      AND (school_id = organization_id OR college_id = organization_id)
    )
  );

-- Only admins can insert
CREATE POLICY "org_subs_insert_policy" ON organization_subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('school_admin', 'college_admin', 'university_admin')
    )
  );

-- Only admins can update their organization's subscriptions
CREATE POLICY "org_subs_update_policy" ON organization_subscriptions
  FOR UPDATE USING (
    purchased_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('school_admin', 'college_admin', 'university_admin')
      AND (school_id = organization_id OR college_id = organization_id)
    )
  );
```

### license_assignments

```sql
-- Users can view their own assignments, admins can view all in their org
CREATE POLICY "license_assign_select_policy" ON license_assignments
  FOR SELECT USING (
    user_id = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_subscriptions os
      JOIN users u ON u.id = auth.uid()
      WHERE os.id = organization_subscription_id
      AND u.role IN ('school_admin', 'college_admin', 'university_admin')
      AND (u.school_id = os.organization_id OR u.college_id = os.organization_id)
    )
  );
```

## Database Functions

### check_seat_availability

```sql
CREATE OR REPLACE FUNCTION check_seat_availability(
  p_pool_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT available_seats INTO v_available
  FROM license_pools
  WHERE id = p_pool_id;
  
  RETURN COALESCE(v_available, 0) > 0;
END;
$$ LANGUAGE plpgsql;
```

### update_pool_seat_counts (Trigger Function)

```sql
CREATE OR REPLACE FUNCTION update_pool_seat_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE license_pools
    SET assigned_seats = assigned_seats + 1,
        updated_at = NOW()
    WHERE id = NEW.license_pool_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE license_pools
      SET assigned_seats = assigned_seats - 1,
          updated_at = NOW()
      WHERE id = NEW.license_pool_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE license_pools
      SET assigned_seats = assigned_seats + 1,
          updated_at = NOW()
      WHERE id = NEW.license_pool_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_pool_seats
AFTER INSERT OR UPDATE ON license_assignments
FOR EACH ROW EXECUTE FUNCTION update_pool_seat_counts();
```

## Volume Discount Tiers

| Seat Count | Discount |
|------------|----------|
| 1-49 | 0% |
| 50-99 | 10% |
| 100-499 | 20% |
| 500+ | 30% |

## Migration Notes

1. Run new table creation scripts first
2. Add columns to existing tables with ALTER TABLE
3. Create indexes after data migration
4. Enable RLS policies last
5. Test with small dataset before production deployment
