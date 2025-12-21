# Quick Fix - Course-Specific Questions

## Problem
Questions not matching the course name? Here's the quick fix!

## 3-Step Fix

### 1️⃣ Clear Cache
Open browser console (F12) and run:
```javascript
localStorage.clear();
```

### 2️⃣ Reload Page
Press `Ctrl+R` (or `Cmd+R` on Mac)

### 3️⃣ Try Assessment Again
Click the Assessment button on your course

---

## What Changed?

The AI prompt now **emphasizes the course name 10+ times** to ensure questions are course-specific.

**Before:**
> "Generate questions for this course"

**After:**
> "Generate questions SPECIFICALLY for {{COURSE_NAME}}. ALL questions MUST be about {{COURSE_NAME}}. Use {{COURSE_NAME}} terminology..."

---

## Quick Test

### Test 1: React Course
Click assessment → Should see questions like:
- "What is the useEffect hook in React?"
- "How does React handle state?"
- "Explain React components"

### Test 2: Python Course
Click assessment → Should see questions like:
- "What is a Python decorator?"
- "How do Python lists work?"
- "Explain Python data types"

---

## Dev Tools

### Regenerate Button (Dev Mode Only)
Look for 🔄 button in top-right of assessment page
- Clears cache
- Generates fresh questions
- Only visible in development mode

### Console Logs
Watch for these in console:
```
🎓 Assessment Page Loaded: { courseName: "React Development" }
🎯 Generating assessment for: React Development
✅ Generated assessment: { course: "React Development", ... }
```

---

## Still Not Working?

1. Check `.env` has API key:
   ```
   VITE_OPENROUTER_API_KEY=sk-or-v1-...
   ```

2. Check course has a proper name:
   - ✅ "React Development"
   - ✅ "Python Programming"
   - ❌ "Course 1"
   - ❌ undefined

3. Check console for errors:
   - Open DevTools (F12)
   - Look for red error messages
   - Check Network tab for API failures

---

## Expected Result

✅ Questions specific to the course
✅ Different courses = different questions
✅ Relevant skill tags
✅ Course name in questions

**Example for "React Development":**
- Question: "What is JSX in React?"
- Skill: "React Fundamentals"
- Options: All about React

---

## Need More Help?

See detailed guides:
- `ASSESSMENT_TROUBLESHOOTING.md` - Full troubleshooting
- `ASSESSMENT_FIX_SUMMARY.md` - What was changed
- `DYNAMIC_ASSESSMENT_SETUP.md` - Complete setup

---

## Quick Commands

```javascript
// Clear all cache
localStorage.clear();

// Clear specific course cache
localStorage.removeItem('assessment_react_development');

// Check what's cached
Object.keys(localStorage).filter(k => k.startsWith('assessment_'));

// See cache contents
console.log(localStorage.getItem('assessment_react_development'));
```

---

That's it! Your assessments should now be course-specific. 🎉
