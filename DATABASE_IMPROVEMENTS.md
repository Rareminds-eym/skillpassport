# Database Improvements for Entity Type Display

## Current Situation

- **subscriptions table**: Has `user_role` column with generic values like "School Student"
- **users table**: Has `entity_type` column with specific values like "college-student", "school-student", "university-student"
- **Problem**: The `user_role` in subscriptions is redundant and less accurate than `entity_type` in users table

## Recommended Changes

### Option 1: Remove `user_role` column (Simplest)

**Pros:**
- Removes redundancy
- Single source of truth (users.entity_type)
- Cleaner schema

**Cons:**
- Need to update existing queries that reference user_role

**Migration:**
```sql
-- Remove the constraint
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS check_school_role_valid;

-- Remove the column
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS user_role;
```

**Code Changes Needed:**
- Remove `user_role` from subscription creation in `subscriptionActivationService.js`
- Remove `userRole` from `useSubscriptionQuery.js` formatting
- Already done: Removed from UI display

---

### Option 2: Add Foreign Key to public.users (Recommended)

**Pros:**
- Enables automatic joins in Supabase
- Better data integrity
- Improved query performance
- Can still use Option 1 after this

**Cons:**
- Requires all user_ids in subscriptions to exist in public.users

**Migration:**
```sql
-- Add foreign key to public.users
ALTER TABLE public.subscriptions
ADD CONSTRAINT fk_subscriptions_public_users
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON public.subscriptions(user_id);
```

**Benefits:**
- After this, you can use: `subscriptions.select('*, users(entity_type, role)')`
- Supabase will automatically detect the relationship
- No need for separate queries

---

### Option 3: Update user_role to match entity_type

**Pros:**
- Keeps the column but makes it accurate
- No schema changes needed

**Cons:**
- Still redundant
- Need to update existing records
- Need to update mapping function

**Migration:**
```sql
-- Update existing records to match entity_type pattern
UPDATE public.subscriptions s
SET user_role = CASE 
  WHEN u.entity_type = 'college-student' THEN 'College Student'
  WHEN u.entity_type = 'school-student' THEN 'School Student'
  WHEN u.entity_type = 'university-student' THEN 'University Student'
  WHEN u.entity_type = 'educator' THEN 'Educator'
  ELSE 'School Student'
END
FROM public.users u
WHERE s.user_id = u.id;
```

---

## Recommended Approach

**Best Solution: Combine Option 1 + Option 2**

1. **First**: Add foreign key to public.users (Option 2)
   - This enables proper joins
   - Improves data integrity

2. **Then**: Remove user_role column (Option 1)
   - Eliminates redundancy
   - Uses entity_type as single source of truth

3. **Update Code**:
   - Modify `getActiveSubscription()` to use the new foreign key relationship
   - Remove user_role from subscription creation
   - Keep fetching entity_type from users table

### Complete Migration Script

```sql
-- Step 1: Add foreign key to public.users
ALTER TABLE public.subscriptions
ADD CONSTRAINT fk_subscriptions_public_users
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON public.subscriptions(user_id);

-- Step 3: Remove old constraint
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS check_school_role_valid;

-- Step 4: Remove redundant column
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS user_role;
```

### Code Changes After Migration

**In `subscriptionActivationService.js`:**
```javascript
// Remove this line from subscription object:
// user_role: userRole,

// Remove the mapStudentTypeToRole function call
```

**In `getActiveSubscription()`:**
```javascript
// After adding foreign key, you can use:
const { data, error } = await supabase
  .from('subscriptions')
  .select(`
    *,
    users!fk_subscriptions_public_users(entity_type, role)
  `)
  .eq('user_id', userId)
  .in('status', ['active', 'paused'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

---

## Migration Files Created

1. `database/migrations/remove_user_role_from_subscriptions.sql` - Option 1
2. `database/migrations/add_public_users_fk_to_subscriptions.sql` - Option 2

## How to Apply

### Using Supabase CLI:
```bash
# Apply the foreign key migration first
supabase db push database/migrations/add_public_users_fk_to_subscriptions.sql

# Then optionally remove user_role column
supabase db push database/migrations/remove_user_role_from_subscriptions.sql
```

### Using Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste the migration script
3. Run the query

---

## Testing After Migration

1. ✅ Verify foreign key exists:
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_subscriptions_public_users';
```

2. ✅ Test the join:
```sql
SELECT s.*, u.entity_type, u.role
FROM subscriptions s
JOIN users u ON s.user_id = u.id
LIMIT 5;
```

3. ✅ Verify UI displays entity_type correctly
4. ✅ Test subscription creation flow
5. ✅ Test subscription management page

---

## Rollback Plan

If something goes wrong:

```sql
-- Rollback: Remove foreign key
ALTER TABLE public.subscriptions
DROP CONSTRAINT IF EXISTS fk_subscriptions_public_users;

-- Rollback: Re-add user_role column if removed
ALTER TABLE public.subscriptions
ADD COLUMN user_role VARCHAR(20);

-- Rollback: Re-add constraint
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_school_role_valid 
CHECK (user_role IN ('Educator', 'School Student', 'Admin'));
```
