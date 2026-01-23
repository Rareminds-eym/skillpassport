# Teacher Documents Made Optional (Temporary)

## Changes Made

### 1. Validation Logic Updated
**File:** `src/utils/teacherValidation.ts`

Changed document validation from required to optional:
- **Degree Certificate**: `required: true` → `required: false`
- **ID Proof**: `required: true` → `required: false`
- **Experience Letters**: Already optional (no change needed)

### 2. UI Labels Updated
**File:** `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx`

- Section heading: "Required Documents" → "Documents (Optional)"
- Removed asterisk (*) from "Degree Certificate"
- Removed asterisk (*) from "ID Proof"
- "Experience Letters" already had no asterisk

### 3. Fixed Table Reference & User Creation
**File:** `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx`

- Changed from `teachers` table → `school_educators` table
- Added proper user creation flow:
  1. Gets school_id from current user's `school_educators` record (or fallback to user_metadata)
  2. Creates auth user with `signUp()` (sends confirmation email)
  3. Creates user record in `users` table
  4. Creates educator record in `school_educators` table with `user_id` and `school_id`
- Added rollback logic if user or educator creation fails
- Added debug logging and UI display to troubleshoot school_id issues
- Displays temporary password in success message for admin to share with teacher

### 4. School ID Resolution
The component now retrieves school_id by:
1. First checking `school_educators` table for current user's `school_id`
2. Fallback to `user_metadata.school_id` if not found
3. Shows debug info if school_id cannot be found

**Important**: Ensure your school admin user has a record in `school_educators` table with their `school_id` set.

## Impact

Teachers can now be onboarded without uploading:
- Degree Certificate
- ID Proof
- Experience Letters

The form will still validate file format (PDF/JPG/PNG) and size (max 5MB) if documents are uploaded, but won't block submission if they're missing.

## Database Schema

No database changes needed. The `school_educators` table already has these fields as nullable:
- `degree_certificate_url` (text null)
- `id_proof_url` (text null)
- `experience_letters_url` (text[] null)

## To Revert (Make Mandatory Again)

When you want to make these documents required again:

1. In `src/utils/teacherValidation.ts`, change back to:
   ```typescript
   const degreeResult = validateDocument(data.degree_certificate, true);
   const idProofResult = validateDocument(data.id_proof, true);
   ```

2. In `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx`:
   - Change "Documents (Optional)" → "Required Documents"
   - Add asterisk to "Degree Certificate *"
   - Add asterisk to "ID Proof *"

## Testing

Test the teacher onboarding flow:
1. Navigate to School Admin → Teacher Management
2. Click "Add New Teacher"
3. Fill in personal information and at least one subject
4. Try submitting WITHOUT uploading documents
5. Should succeed and create teacher record
