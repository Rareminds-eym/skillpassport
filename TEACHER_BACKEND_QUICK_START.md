# Teacher Management Backend - Quick Start

## ✅ Your UI is Already Connected!

All three components are fully integrated with Supabase:
- **Teachers List** → Reads from `teachers` table
- **Teacher Onboarding** → Creates teachers + uploads documents
- **Timetable Allocation** → Manages `timetables` and `timetable_slots`

---

## 🚀 3-Step Setup

### Step 1: Run Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: In Supabase Dashboard
# Go to SQL Editor > New Query
# Copy/paste: supabase/migrations/teacher_management_schema.sql
# Click Run
```

### Step 2: Create Storage Bucket
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-documents', 'teacher-documents', true);

-- Add policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teacher-documents');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'teacher-documents');
```

### Step 3: Verify Setup
```bash
node verify-teacher-backend.js
```

---

## 🧪 Test It

1. **Go to:** School Admin > Teacher Management
2. **Click:** Onboarding tab
3. **Add a teacher:**
   - Fill name, email, phone
   - Upload documents (PDF/JPG/PNG)
   - Add subjects
   - Click "Create & Approve"
4. **Check:** Teachers tab to see the new teacher
5. **Assign timetable:**
   - Go to Timetable tab
   - Select the teacher
   - Add time slots

---

## 🔑 Key Features

| Feature | Backend Connection |
|---------|-------------------|
| Auto Teacher ID | ✅ Database trigger |
| Document Upload | ✅ Supabase Storage |
| Subject Mapping | ✅ Auto-synced JSONB |
| Workload Calc | ✅ Auto-calculated |
| Conflict Detection | ✅ Real-time triggers |
| Role Permissions | ✅ useUserRole hook |

---

## 🐛 Common Issues

**"Teachers table does not exist"**
→ Run the migration (Step 1)

**"Storage bucket not found"**
→ Create the bucket (Step 2)

**"Permission denied"**
→ Check your role in `teachers` or `school_educators` table

**"Teacher ID not generated"**
→ Ensure trigger is created (included in migration)

---

## 📞 Need Help?

Run the verification script:
```bash
node verify-teacher-backend.js
```

It will tell you exactly what's missing!

---

**That's it! Your backend is ready to go. 🎉**
