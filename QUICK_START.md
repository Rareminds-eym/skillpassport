# 🚀 Quick Start - Deploy in 3 Steps!

## What You're Deploying

A complete student creation system that inserts into **3 tables**:
- ✅ `auth.users` - Login credentials
- ✅ `public.users` - Application user (role='student')
- ✅ `public.students` - Student profile data

---

## 3-Step Deployment

### Step 1: Install Supabase CLI (if needed)

```bash
npm install -g supabase
```

### Step 2: Login & Link Project

```bash
# Login
supabase login

# Link your project (find YOUR_PROJECT_REF in Supabase dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Deploy

**Option A - Use the script:**
```bash
# Double-click this file:
deploy-create-student.bat
```

**Option B - Manual:**
```bash
supabase functions deploy create-student
```

---

## ✅ Done! Now Test It

1. Go to: `http://localhost:3000/school-admin/students/admissions`
2. Click **"Add Student"** button
3. Fill in student details
4. Click **Submit**
5. 🎉 See the generated password!
6. Copy credentials and share with student

---

## What You'll See

### Success Screen:
```
✅ Student "John Doe" added successfully!

🔑 Login Credentials:
┌─────────────────────────────────────┐
│ Email: john@example.com             │  ← Click to copy
├─────────────────────────────────────┤
│ Password: Abc123XyZ!@#              │  ← Click to copy
└─────────────────────────────────────┘

⚠️ Save these credentials before closing!
```

---

## Verify It Worked

### Check 1: Student appears in list
- Refresh the admissions page
- Student should be visible

### Check 2: Student can login
- Logout from admin
- Login as student with generated credentials
- Should see student dashboard

### Check 3: Database has all records
```sql
-- All 3 tables should have the student
SELECT * FROM auth.users WHERE email = 'john@example.com';
SELECT * FROM public.users WHERE email = 'john@example.com';
SELECT * FROM public.students WHERE email = 'john@example.com';
```

---

## Troubleshooting

### "Function not found"
```bash
supabase functions deploy create-student
```

### "Unauthorized"
- Make sure you're logged in as school admin

### "Email already exists"
- Use a different email

---

## 🎉 That's It!

Your student creation system is now fully functional!

**Files Created:**
- ✅ `supabase/functions/create-student/index.ts` - Edge Function
- ✅ `src/components/educator/modals/Addstudentmodal.tsx` - Updated modal
- ✅ `deploy-create-student.bat` - Deployment script

**What It Does:**
- Creates login account (auth.users)
- Creates user record (public.users)
- Creates student profile (public.students)
- Generates secure password
- Links to your school
- Shows credentials to admin

**Ready to use!** 🚀
