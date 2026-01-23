# 🔧 Fix Report Stream Display (B.Tech → M.Tech)

## 🐛 Problem

The assessment report shows "BTECH_CSE" instead of "MTECH_CSE" because:
1. The stream is stored in `localStorage` when you start the assessment
2. You took the assessment before M.Tech support was added
3. The old value `'btech_cse'` is still in localStorage

## ✅ Quick Fix (Browser Console)

### **Option 1: Clear and Retake (Recommended)**
```javascript
// Clear the old stream value
localStorage.removeItem('assessment_stream');

// Then retake the assessment - it will use the new M.Tech normalization
```

### **Option 2: Update localStorage Directly**
```javascript
// Update to M.Tech
localStorage.setItem('assessment_stream', 'mtech_cse');

// Refresh the page to see the change
location.reload();
```

---

## 🗄️ Database Fix (If Needed)

If the report still shows B.Tech after clearing localStorage, update the database:

```sql
-- Update assessment results
UPDATE personal_assessment_results
SET 
    stream_id = 'mtech_cse',
    profile_snapshot = jsonb_set(
        profile_snapshot,
        '{stream}',
        '"mtech_cse"'::jsonb
    ),
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND stream_id = 'btech_cse';

-- Update assessment attempts
UPDATE personal_assessment_attempts
SET 
    stream_id = 'mtech_cse',
    updated_at = NOW()
WHERE student_id = 'afaa9e81-1552-4c1d-a76d-551134295567'
  AND stream_id = 'btech_cse';
```

---

## 📝 Where Stream is Stored

### **1. localStorage:**
```javascript
Key: 'assessment_stream'
Value: 'btech_cse' (old) → 'mtech_cse' (new)
```

### **2. Database Tables:**
- `personal_assessment_results.stream_id`
- `personal_assessment_results.profile_snapshot->>'stream'`
- `personal_assessment_attempts.stream_id`

### **3. Report Display:**
The report reads from:
```javascript
// src/features/assessment/assessment-result/hooks/useAssessmentResults.js:294
stream: (localStorage.getItem('assessment_stream') || '—').toUpperCase()
```

---

## 🎯 Permanent Solution

To prevent this issue in the future, the system should:
1. ✅ Use the normalized stream ID from the database (not localStorage)
2. ✅ Update localStorage when stream changes
3. ✅ Clear localStorage when starting a new assessment

---

## 🧪 Test the Fix

1. Open browser console (F12)
2. Run: `localStorage.getItem('assessment_stream')`
3. If it shows `'btech_cse'`, run: `localStorage.setItem('assessment_stream', 'mtech_cse')`
4. Refresh the page
5. Check the report - should now show "MTECH_CSE"

---

## 💡 Quick Steps

1. **Open browser console** (F12)
2. **Paste this:**
   ```javascript
   localStorage.setItem('assessment_stream', 'mtech_cse');
   location.reload();
   ```
3. **Done!** Report should now show M.Tech

---

**Last Updated:** January 13, 2026
