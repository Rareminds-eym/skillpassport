# Phone Field Fix Documentation

## Issue
Student registration was failing with error:
```
❌ Error creating student record: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'phone' column of 'students' in the schema cache"
}
```

## Root Cause
The `createStudent()` function in `src/services/studentService.js` was trying to insert data using a column named `phone`, but the actual database column is named `contact_number`.

## Database Schema

### students table - Phone-related columns:
- ✅ `contact_number` (snake_case) - Main phone field
- ✅ `contactNumber` (camelCase) - Alternative accessor
- ✅ `guardianPhone` - Guardian's phone
- ✅ `contact_dial_code` - Country code
- ❌ `phone` - **Does NOT exist**

## Solution

### File: `src/services/studentService.js`

**Before (Line ~70):**
```javascript
const student = {
  user_id: userId,
  name: name,
  email: email,
  phone: phone || null,  // ❌ WRONG - column doesn't exist
  student_type: studentType || 'school',
  school_id: schoolId || null,
  college_id: collegeId || null,
  // ...
};
```

**After (Line ~70):**
```javascript
const student = {
  user_id: userId,
  name: name,
  email: email,
  contact_number: phone || null,  // ✅ CORRECT - using actual column name
  student_type: studentType || 'school',
  school_id: schoolId || null,
  college_id: collegeId || null,
  // ...
};
```

## Field Mapping

| Input Parameter | Database Column | Status |
|----------------|-----------------|--------|
| `phone` | `contact_number` | ✅ Fixed |
| `name` | `name` | ✅ Correct |
| `email` | `email` | ✅ Correct |
| `studentType` | `student_type` | ✅ Correct |
| `schoolId` | `school_id` | ✅ Correct |
| `collegeId` | `college_id` | ✅ Correct |

## Testing

### Automated Test
```bash
node test-student-phone-fix.js
```

**Expected Output:**
```
✅ PASS: Column name is correct
✅ All tests passed!
```

### Manual Test
1. Navigate to `/subscription/plans/college`
2. Click "Select Plan"
3. Fill in signup form with phone number
4. Submit form
5. **Expected**: Student record created successfully
6. **Before fix**: Error about 'phone' column not found

## Verification

### Check Database Record
```javascript
const { data } = await supabase
  .from('students')
  .select('contact_number, name, email')
  .eq('email', 'test@example.com')
  .single();

console.log(data);
// Should show: { contact_number: '9876543210', name: '...', email: '...' }
```

### Check Console Logs
**Before fix:**
```
❌ Error creating student record: Could not find the 'phone' column
```

**After fix:**
```
✅ Student record created successfully: <student_id>
```

## Impact

### Fixed
- ✅ Student registration now works
- ✅ Phone numbers are properly saved
- ✅ No more column not found errors

### Unaffected
- ✅ User record creation (uses different table)
- ✅ College selection (different field)
- ✅ Other student fields (already correct)

## Related Files

1. **src/services/studentService.js** - Fixed phone field mapping
2. **src/components/Subscription/SignupModal.jsx** - Collects phone input
3. **test-student-phone-fix.js** - Verification test

## Database Column Reference

### All phone-related columns in students table:
```sql
-- Main contact
contact_number TEXT          -- ✅ Use this for student phone
contactNumber TEXT            -- Alternative accessor (same data)

-- Guardian contact
guardianPhone TEXT            -- For guardian's phone

-- International
contact_dial_code TEXT        -- Country code (e.g., '+91')
```

## Code Pattern

### Correct Pattern ✅
```javascript
// When inserting student data
const student = {
  contact_number: phoneInput,  // Map phone input to contact_number column
  // ... other fields
};

await supabase.from('students').insert([student]);
```

### Incorrect Pattern ❌
```javascript
// DON'T DO THIS
const student = {
  phone: phoneInput,  // ❌ Column doesn't exist
  // ... other fields
};

await supabase.from('students').insert([student]);
```

## Future Considerations

### Option 1: Database Migration (Not Recommended)
Add a `phone` column as an alias:
```sql
ALTER TABLE students ADD COLUMN phone TEXT;
UPDATE students SET phone = contact_number;
```
**Pros**: Code doesn't need to change
**Cons**: Duplicate data, maintenance overhead

### Option 2: Keep Current Fix (Recommended) ✅
Use `contact_number` in code:
```javascript
contact_number: phone || null
```
**Pros**: No database changes, clear mapping
**Cons**: Need to remember column name difference

## Troubleshooting

### Issue: Still getting phone column error

**Check 1**: Verify the fix is applied
```bash
grep "contact_number" src/services/studentService.js
```
Should show: `contact_number: phone || null`

**Check 2**: Clear any caches
```bash
# Restart dev server
npm run dev
```

**Check 3**: Check for other files using 'phone'
```bash
grep -r "phone.*students" src/
```

### Issue: Phone number not saving

**Check**: Verify input is being passed
```javascript
console.log('Phone input:', formData.phone);
// Should show the phone number
```

## Success Criteria

- [x] No "phone column not found" errors
- [x] Student records created successfully
- [x] Phone numbers saved to database
- [x] Test script passes
- [x] Manual testing successful

## Status

**Status**: ✅ **FIXED AND TESTED**
**Date**: November 25, 2025
**Impact**: Critical - Blocks student registration
**Risk**: Low - Simple field name fix

## Summary

Changed `phone` to `contact_number` in the student record creation to match the actual database column name. This fixes the student registration error and allows phone numbers to be properly saved.

**One-line fix:**
```javascript
phone: phone || null  →  contact_number: phone || null
```

Simple but critical! 🎯
