# Testing Assessment Navigation

## Issue
You're seeing the old assessment system (`/student/assessment/start`) instead of the new dynamic assessment (`/student/assessment/dynamic`).

## How to Test Properly

### Step 1: Go to My Learning
Navigate to: `http://localhost:3000/student/my-learning`

### Step 2: Open Browser Console
Press `F12` to open DevTools

### Step 3: Check Your Courses
Look for courses in the list. You should see:
- Course cards with "Assessment" button
- Only **EXTERNAL** courses show the Assessment button
- Internal platform courses do NOT show Assessment button

### Step 4: Click Assessment Button
Click the "Assessment" button on an external course

### Step 5: Check Console Logs
You should see:
```
🎓 Assessment Page Loaded: {
  courseName: "Your Course Name",
  courseLevel: "Intermediate",
  locationState: {...}
}
```

### Step 6: Check URL
The URL should be:
```
http://localhost:3000/student/assessment/dynamic
```

NOT:
```
http://localhost:3000/student/assessment/start  ❌ (Old system)
http://localhost:3000/student/assessment/platform  ❌ (Old system)
```

---

## Troubleshooting

### If you see `/student/assessment/start`:
This means you clicked on the **old assessment system**, not the new one.

**Possible causes:**
1. You clicked a different assessment link (not from My Learning page)
2. The course is marked as "internal" instead of "external"
3. You navigated from a bookmark or old link

**Solution:**
1. Go back to My Learning page
2. Make sure you're clicking the Assessment button on an **external course**
3. Check console to verify course type

### If you see "User not found":
This is from the old assessment system trying to load user data.

**Solution:**
- Don't use `/student/assessment/start` route
- Use the new `/student/assessment/dynamic` route instead

---

## How to Identify External vs Internal Courses

### External Course (Shows Assessment Button):
```javascript
{
  course: "React Development",
  source: "external_course",  // or "manual" or no source
  course_id: null  // or undefined
}
```

### Internal Course (No Assessment Button):
```javascript
{
  course: "Platform Course",
  source: "internal_course",
  course_id: 123  // Has course_id linking to courses table
}
```

---

## Quick Test

### Test 1: Check Course Type
In browser console on My Learning page:
```javascript
// This will show all your courses and their types
console.log('Courses:', 
  document.querySelectorAll('[data-course-type]')
);
```

### Test 2: Manual Navigation
Try navigating directly:
```
http://localhost:3000/student/assessment/dynamic
```

You should see an error or "General Skills" assessment (because no course name was passed).

### Test 3: With Course Data
Navigate with state:
```javascript
// In browser console
window.history.pushState(
  { 
    courseName: "Test Course",
    level: "Intermediate",
    courseId: 1
  },
  '',
  '/student/assessment/dynamic'
);
window.location.reload();
```

---

## Expected Flow

```
My Learning Page
    ↓
Click "Assessment" on External Course
    ↓
Navigate to /student/assessment/dynamic
    ↓
See loading screen with course name
    ↓
Questions generated
    ↓
Take assessment
```

---

## If Still Not Working

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files
   - Reload page

2. **Check if you have external courses:**
   - Go to My Learning
   - Look for courses without "course_id"
   - These should show Assessment button

3. **Add a test external course:**
   - Click "Add Learning"
   - Add an external course
   - Try assessment on that course

4. **Check browser console for errors:**
   - Look for red error messages
   - Check Network tab for failed requests
   - Verify API key is configured

---

## Debug Commands

Run these in browser console:

```javascript
// Check localStorage for cached assessments
Object.keys(localStorage).filter(k => k.startsWith('assessment_'));

// Check current route
console.log('Current route:', window.location.pathname);

// Check if API key is configured
console.log('API Key configured:', !!import.meta.env.OPENROUTER_API_KEY);

// Force navigate to dynamic assessment
window.location.href = '/student/assessment/dynamic';
```

---

## Summary

- ✅ Use `/student/assessment/dynamic` for new system
- ❌ Avoid `/student/assessment/start` (old system)
- ✅ Only external courses show Assessment button
- ✅ Check console logs for debugging
- ✅ Verify course name is passed correctly
