# User Role Fix for Subscriptions

## Problem
The `user_role` column in the subscriptions table was being set to a generic "School Student" for all student types (school, college, university) instead of using the actual role and entity_type from the users table.

## Root Cause
The `mapStudentTypeToRole` function was mapping all student types to "School Student":

```javascript
// OLD - INCORRECT
const mapStudentTypeToRole = (studentType) => {
  const roleMap = {
    'educator': 'Educator',
    'admin': 'Admin',
    'school': 'School Student',
    'university': 'School Student',  // ❌ Generic
    'college': 'School Student',      // ❌ Generic
    'student': 'School Student'       // ❌ Generic
  };
  return roleMap[studentType] || 'School Student';
};
```

## Solution

### 1. Created New Function to Fetch Actual User Data
**File**: `src/services/Subscriptions/subscriptionActivationService.js`

```javascript
/**
 * Get user role and entity type from users table
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User role and entity type
 */
const getUserRoleAndEntityType = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, entity_type')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.warn('⚠️ Could not fetch user role and entity_type:', error);
      return { role: 'student', entity_type: null };
    }

    return {
      role: data.role,
      entity_type: data.entity_type
    };
  } catch (error) {
    console.error('❌ Error fetching user role:', error);
    return { role: 'student', entity_type: null };
  }
};
```

### 2. Updated Subscription Creation to Use Actual Data

```javascript
// Fetch actual user role and entity_type from users table
const { role: userRole, entity_type: entityType } = await getUserRoleAndEntityType(userId);

// Format user_role for display (capitalize first letter)
const formattedUserRole = entityType 
  ? entityType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  : userRole.charAt(0).toUpperCase() + userRole.slice(1);

const subscription = {
  // ... other fields
  user_role: formattedUserRole, // ✅ Use actual role from users table
};
```

## How It Works

1. **Fetch User Data**: When creating a subscription, fetch the actual `role` and `entity_type` from the `users` table
2. **Prioritize entity_type**: If `entity_type` exists, use it (more specific)
3. **Fallback to role**: If no `entity_type`, use the `role` field
4. **Format for Display**: Convert "college-student" → "College Student"

## Examples

### Before Fix
- User: `naveen@college.in`
- users.role: `student`
- users.entity_type: `college-student`
- subscriptions.user_role: `School Student` ❌ (generic, incorrect)

### After Fix
- User: `naveen@college.in`
- users.role: `student`
- users.entity_type: `college-student`
- subscriptions.user_role: `College Student` ✅ (specific, correct)

## Benefits

✅ **Accurate Role Display**: Shows the actual entity type (College Student, School Student, University Student)  
✅ **Consistent with Users Table**: Uses the same data source as the rest of the application  
✅ **Better User Experience**: Users see their correct student type  
✅ **Future-Proof**: Automatically works with new entity types added to the users table  

## UI Display

Now the subscription management page shows:
1. **Email** (gray badge) - `naveen@college.in`
2. **Entity Type** (purple badge) - `College Student` (from users.entity_type)
3. **Role** (blue badge) - `student` (from auth metadata)

The redundant "School Student" badge has been removed from the UI.

## Files Modified

1. `src/services/Subscriptions/subscriptionActivationService.js`
   - Removed `mapStudentTypeToRole` function
   - Added `getUserRoleAndEntityType` function
   - Updated `createSubscriptionRecord` to fetch and use actual user data

2. `src/pages/subscription/MySubscription.jsx`
   - Removed the redundant `userRole` badge display

## Database Schema

### users table
```sql
- role: user_role (enum: student, educator, recruiter, etc.)
- entity_type: varchar(50) (e.g., 'college-student', 'school-student')
```

### subscriptions table
```sql
- user_role: varchar(20) (now stores formatted entity_type or role)
```

## Testing

After this fix:
- ✅ New subscriptions will have correct user_role based on entity_type
- ✅ College students will show "College Student" instead of "School Student"
- ✅ School students will show "School Student"
- ✅ University students will show "University Student"
- ✅ Educators will show "Educator"
