# Supabase Storage Setup - For Later

## Current Status
✅ Document upload functionality is **temporarily disabled** to allow testing with mock data.  
⏳ Storage bucket configuration needed before enabling file uploads.

---

## What's Temporarily Disabled

### TeacherOnboarding Component
- Document uploads return mock URLs instead of uploading to storage
- Validation for documents is relaxed
- Teachers can be created without uploading files

**Modified Code:**
```typescript
// src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx
const uploadFile = async (file: File, path: string): Promise<string> => {
  // TODO: Connect to Supabase Storage bucket later
  console.log('File upload skipped (bucket not configured):', file.name);
  return `https://placeholder.com/${path}/${file.name}`;
};
```

---

## When Ready: Storage Bucket Setup

### Step 1: Create Storage Bucket

1. **Open Supabase Dashboard**
   - Go to your project
   - Click "Storage" in sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Name: `teacher-documents`
   - Public bucket: **No** (keep private)
   - Click "Create bucket"

3. **Create Folders** (optional but recommended)
   - `degrees/`
   - `id-proofs/`
   - `experience-letters/`

### Step 2: Set Up RLS Policies

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teacher-documents');

-- Allow users to view their own school's documents
CREATE POLICY "Allow school admins to view"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'teacher-documents');

-- Allow users to delete their uploads
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'teacher-documents');
```

### Step 3: Update File Size Limits (Optional)

In Supabase Dashboard → Storage → Settings:
- Max file size: 10 MB (recommended)
- Allowed MIME types: 
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/jpg`

### Step 4: Re-enable Upload Functionality

**Restore Original Code:**
```typescript
// src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx
const uploadFile = async (file: File, path: string): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("teacher-documents")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("teacher-documents")
    .getPublicUrl(filePath);
    
  return data.publicUrl;
};
```

**Restore Validation:**
```typescript
// Restore full validation
const validation = validateTeacherOnboarding({
  first_name: formData.first_name,
  last_name: formData.last_name,
  email: formData.email,
  phone: formData.phone,
  subjects: subjects,
  degree_certificate: documents.degree_certificate,
  id_proof: documents.id_proof,
});

if (!validation.isValid) {
  setValidationErrors(validation.errors);
  setMessage({
    type: "error",
    text: "Please fix the validation errors before submitting."
  });
  setLoading(false);
  return;
}
```

---

## Testing Without Storage

### Current Behavior
1. **Teacher Onboarding:**
   - Can create teachers without uploading documents
   - Mock URLs are stored in database
   - No actual files are uploaded
   - Console logs show skipped uploads

2. **Validation:**
   - Only checks required text fields
   - Doesn't require document uploads
   - Subjects still required

3. **Mock Data:**
   - Teachers created without document URLs
   - All other functionality works normally

### What Still Works
✅ Teacher creation and management  
✅ Role-based permissions  
✅ Timetable allocation  
✅ Lesson plan creation  
✅ Approval workflows  
✅ All database operations  

### What Doesn't Work
❌ Actual document uploads  
❌ Document viewing/downloading  
❌ Document validation  

---

## Quick Test (Without Storage)

### Create a Teacher Without Documents

1. **Login as School Admin:**
   ```javascript
   localStorage.setItem('user', JSON.stringify({
     email: 'admin@springfield.edu',
     role: 'school_admin'
   }));
   ```

2. **Navigate to Teacher Onboarding:**
   - Go to `/school-admin/teachers/onboarding`

3. **Fill Form:**
   - First Name: Test
   - Last Name: Teacher
   - Email: test.teacher@school.edu
   - Phone: +1-555-9999
   - Role: Subject Teacher

4. **Add Subject:**
   - Subject: Computer Science
   - Proficiency: Advanced
   - Years: 5

5. **Skip Documents:**
   - Don't upload any files
   - Just click "Create & Approve"

6. **Expected Result:**
   - Teacher created successfully
   - Console shows: "File upload skipped (bucket not configured)"
   - Teacher appears in teacher list
   - Can assign to timetable

---

## When to Enable Storage

Enable storage bucket when:
- [ ] Ready to handle actual document uploads
- [ ] Need to verify teacher credentials
- [ ] Want to store and retrieve documents
- [ ] Moving to production

Until then, the system works perfectly with mock data for:
- Testing lesson plans
- Testing timetables
- Testing approval workflows
- Testing role-based permissions

---

## Summary

**Current State:**
- ✅ All features work except document uploads
- ✅ Can test with mock data
- ✅ No storage bucket needed for testing
- ⏳ Storage setup deferred for later

**To Enable Storage:**
1. Create `teacher-documents` bucket
2. Set up RLS policies
3. Restore original upload code
4. Restore full validation
5. Test document uploads

**Files Modified:**
- `src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx`
- `supabase/migrations/mock_data_lesson_plans_timetable.sql`

**No Impact On:**
- Lesson plans functionality
- Timetable functionality
- Approval workflows
- Role-based permissions
- Mock data testing

---

## Quick Reference

**Check if storage is configured:**
```sql
SELECT * FROM storage.buckets WHERE name = 'teacher-documents';
```

**Check storage policies:**
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'teacher-documents';
```

**Test upload (when ready):**
```javascript
const { data, error } = await supabase.storage
  .from('teacher-documents')
  .upload('test.txt', new Blob(['test']));
console.log(data, error);
```

---

**Status:** ✅ Ready for testing without storage  
**Next Step:** Set up storage bucket when needed  
**Priority:** Low (not needed for current testing)
