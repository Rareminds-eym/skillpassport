# Entity Type Display Fix

## Problem
The `entity_type` column from the `users` table (e.g., "college-student") was not being displayed in the subscription management UI.

## Root Cause
The `getActiveSubscription` function only queried the `subscriptions` table without joining the `users` table to fetch the `entity_type` column.

## Solution

### 1. Updated Subscription Service Query
**File**: `src/services/Subscriptions/subscriptionService.js`

Added a join to the `users` table to fetch `entity_type` and `role`:

```javascript
// Before
const { data, error } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', userId)
  .in('status', ['active', 'paused'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// After
const { data, error } = await supabase
  .from('subscriptions')
  .select(`
    *,
    users!inner(entity_type, role)
  `)
  .eq('user_id', userId)
  .in('status', ['active', 'paused'])
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

### 2. Updated Data Formatting
**File**: `src/hooks/Subscription/useSubscriptionQuery.js`

Added `entityType` and `userTableRole` to the formatted subscription data:

```javascript
return {
  // ... existing fields
  userRole: data.user_role,
  entityType: data.users?.entity_type || null,  // ✅ Added
  userTableRole: data.users?.role || null        // ✅ Added
};
```

### 3. Updated UI Display
**File**: `src/pages/subscription/MySubscription.jsx`

Added a modern badge to display the entity type with proper formatting:

```jsx
{subscriptionData?.entityType && (
  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 capitalize">
    <Circle className="w-2 h-2 mr-1.5 fill-purple-600" />
    {subscriptionData.entityType.replace('-', ' ')}
  </span>
)}
```

## UI Design

The entity type is now displayed as a **purple badge** with:
- ✅ Purple background (`bg-purple-100`)
- ✅ Purple text (`text-purple-700`)
- ✅ Small circle icon
- ✅ Capitalized text
- ✅ Hyphen replaced with space (e.g., "college-student" → "College Student")

## Badge Hierarchy

The badges are now displayed in this order:
1. **Email** - Gray badge with mail icon
2. **Entity Type** - Purple badge (e.g., "College Student")
3. **Role** - Blue badge (e.g., "Student")
4. **User Role** - Green badge (subscription role)

## Example Display

For user `naveen@college.in`:
- Email: `naveen@college.in` (gray)
- Entity Type: `College Student` (purple)
- Role: `student` (blue)
- User Role: `School Student` (green)

## Files Modified

1. `src/services/Subscriptions/subscriptionService.js` - Added users table join
2. `src/hooks/Subscription/useSubscriptionQuery.js` - Added entityType to formatted data
3. `src/pages/subscription/MySubscription.jsx` - Added entity type badge display

## Testing

After this fix:
- ✅ Entity type is fetched from users table
- ✅ Entity type is displayed in subscription management page
- ✅ Hyphenated values are formatted properly (e.g., "college-student" → "College Student")
- ✅ Badge has modern, consistent styling
- ✅ Works for all entity types (school-student, college-student, university-student, etc.)
