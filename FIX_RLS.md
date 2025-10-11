# 🔧 FIX: Disable RLS for Demo Mode

## ⚠️ You're Getting 400 Bad Request Error

**The Problem:**
- Your `students` table has Row Level Security (RLS) enabled
- RLS blocks access because there's no authenticated Supabase user
- Data needs to be fetched by email directly (no auth required)

## ✅ QUICK FIX - Run This SQL

**Go to: Supabase Dashboard → SQL Editor**

Paste and run:

```sql
-- Disable RLS on students table for demo mode
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

That's it! 🎉

---

## 🧪 Test It

1. **Run the SQL** above in Supabase
2. **Restart your dev server**: 
   - Stop server (Ctrl+C)
   - Run: `npm run dev`
3. **Login** with: `chinnuu116@gmail.com` (any password works)
4. **Check**: Dashboard should show **"Rakshitha.M"** not "Sarah Johnson"

---

## 🔍 Why This Works

### Before (With RLS):
```
Login → Try to fetch data → RLS blocks → 400 Error → Shows mock data
```

### After (Without RLS):
```
Login → Fetch by email → Success → Shows real data (Rakshitha.M)
```

---

## 📊 Your Current Setup

- **Table**: `students` with direct columns (name, email, etc.)
- **Auth**: Demo mode (login with any email/password)
- **Data Fetch**: By email, not by userId
- **RLS**: Currently blocking access ← **THIS IS THE ISSUE**

---

## 🔒 For Production (Later)

When you're ready for real auth, re-enable RLS:

```sql
-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Add public read policy
CREATE POLICY "Allow public read"
ON students FOR SELECT
USING (true);
```

---

## 🐛 Still Not Working?

Check browser console for errors:
1. Press F12
2. Go to Console tab
3. Look for green ✅ message: "Student data fetched"
4. If you see red ❌ errors, share them

---

## 📝 What We Fixed Today

✅ Dashboard fetches data by email (not userId)  
✅ Supabase auth errors are non-blocking  
✅ Added missing React keys to fix warnings  
✅ Created `studentServiceReal.js` for direct column access  
✅ Mock data fallback works if email not found  

**Last Step**: Disable RLS in Supabase! 👆
