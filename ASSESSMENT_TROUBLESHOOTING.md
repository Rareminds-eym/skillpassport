# Assessment Troubleshooting Guide

## Issue: Questions Not Course-Specific

### Problem
The assessment generates 15 questions, but they're generic instead of being specific to the course name (e.g., "React Development", "Python Programming", etc.)

### Solution Steps

#### 1. Check Browser Console
Open browser DevTools (F12) and look for these logs:
```
🎓 Assessment Page Loaded: { courseName: "React Development", ... }
🎯 Generating assessment for: React Development Level: Intermediate
📡 Calling AI API to generate questions...
📝 Raw AI response: ...
✅ Generated assessment: { course: "React Development", ... }
```

#### 2. Verify Course Name is Passed
Check the console log shows the correct course name:
- ✅ Good: `courseName: "React Development"`
- ❌ Bad: `courseName: "General Skills"` or `courseName: undefined`

If the course name is wrong, check `ModernLearningCard.jsx`:
```javascript
state: {
  courseName: item.course || item.title,  // Make sure this exists
  level: item.level || 'Intermediate',
  courseId: item.id
}
```

#### 3. Clear Cache and Regenerate
Old cached questions might be showing. To clear:

**Option A: Use Regenerate Button (Dev Mode)**
- Look for the 🔄 Regenerate button in the top-right
- Click it to clear cache and reload

**Option B: Manual Cache Clear**
1. Open browser console (F12)
2. Run: `localStorage.clear()`
3. Refresh the page
4. Try the assessment again

**Option C: Clear Specific Course Cache**
```javascript
// In browser console
const courseName = "React Development"; // Replace with your course
const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
localStorage.removeItem(cacheKey);
```

#### 4. Check API Response
Look for this in console:
```
✅ Generated assessment: {
  course: "React Development",
  questionCount: 15,
  firstQuestion: "What is the purpose of useEffect hook in React..."
}
```

If the first question doesn't mention the course, the AI didn't follow instructions.

#### 5. Verify API Key
Make sure your `.env` has:
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

Test the key works:
1. Check console for: `📡 Calling AI API to generate questions...`
2. Should NOT see: `❌ OpenRouter API key not configured`

#### 6. Test with Different Course Names
Try these to verify it's working:
- "React Development" → Should ask about React hooks, components, JSX
- "Python Programming" → Should ask about Python syntax, data types, functions
- "Digital Marketing" → Should ask about SEO, social media, analytics

#### 7. Check AI Model Response
The improved prompt now:
- ✅ Repeats course name multiple times
- ✅ Emphasizes course-specific questions
- ✅ Uses `response_format: { type: "json_object" }`
- ✅ Better system message with course name

---

## Common Issues & Fixes

### Issue 1: Generic Questions
**Symptom:** Questions like "What is a variable?" instead of "What is a React hook?"

**Fix:**
1. Clear cache: `localStorage.clear()`
2. Regenerate assessment
3. Check console logs for course name
4. Verify API is using the new prompt

### Issue 2: Same Questions for All Courses
**Symptom:** Every course shows identical questions

**Fix:**
1. Cache is being reused incorrectly
2. Clear all cache: `localStorage.clear()`
3. Check cache key format in console
4. Each course should have unique cache key

### Issue 3: Questions Don't Load
**Symptom:** Stuck on loading screen

**Fix:**
1. Check API key is valid
2. Check network tab for API errors
3. Look for error messages in console
4. Try with different course name

### Issue 4: Wrong Course Name Displayed
**Symptom:** Assessment shows different course than clicked

**Fix:**
1. Check `ModernLearningCard.jsx` passes correct data
2. Verify `item.course` or `item.title` exists
3. Add console.log in card component:
```javascript
console.log('Course data:', {
  course: item.course,
  title: item.title,
  id: item.id
});
```

---

## Debug Checklist

Use this checklist to debug:

- [ ] Browser console open (F12)
- [ ] See "🎓 Assessment Page Loaded" log
- [ ] Course name is correct in log
- [ ] See "🎯 Generating assessment for: [CourseName]"
- [ ] See "📡 Calling AI API"
- [ ] See "✅ Generated assessment"
- [ ] First question mentions the course
- [ ] Cache cleared if testing multiple times
- [ ] API key is configured
- [ ] Network tab shows successful API call

---

## Testing the Fix

### Test 1: React Course
1. Click assessment on "React Development" course
2. Check console: `courseName: "React Development"`
3. Wait for generation
4. Verify questions mention React, hooks, components, JSX

### Test 2: Python Course
1. Click assessment on "Python Programming" course
2. Check console: `courseName: "Python Programming"`
3. Wait for generation
4. Verify questions mention Python, syntax, data types

### Test 3: Cache Works
1. Take assessment for "React Development"
2. Exit and click assessment again
3. Should load instantly from cache
4. Questions should be identical

### Test 4: Different Courses
1. Take assessment for Course A
2. Take assessment for Course B
3. Questions should be completely different
4. Each should be specific to its course

---

## Expected Console Output

```
🎓 Assessment Page Loaded: {
  courseName: "React Development",
  courseLevel: "Intermediate",
  locationState: { courseName: "React Development", level: "Intermediate", courseId: 123 }
}

🔄 No cache found. Generating new assessment for: React Development

🎯 Generating assessment for: React Development Level: Intermediate

📡 Calling AI API to generate questions...

📝 Raw AI response: {"course":"React Development","level":"Intermediate"...

✅ Generated assessment: {
  course: "React Development",
  level: "Intermediate",
  questionCount: 15,
  firstQuestion: "What is the primary purpose of the useEffect hook..."
}

✅ Assessment validated successfully
```

---

## Still Not Working?

If questions are still generic after trying all fixes:

1. **Check the actual API response:**
   - Open Network tab in DevTools
   - Find the OpenRouter API call
   - Check the response body
   - See if AI is returning course-specific questions

2. **Try a different AI model:**
   Edit `assessmentGenerationService.js`:
   ```javascript
   model: 'openai/gpt-4-turbo', // Instead of claude
   ```

3. **Increase temperature for more variety:**
   ```javascript
   temperature: 0.9, // Instead of 0.7
   ```

4. **Add more emphasis in prompt:**
   The prompt already emphasizes course name 10+ times, but you can add more if needed.

5. **Check if course name is too generic:**
   - ❌ "Course 1" → Too generic
   - ✅ "React Development" → Specific
   - ✅ "Python for Data Science" → Very specific

---

## Success Indicators

You'll know it's working when:
- ✅ Console shows correct course name
- ✅ Questions mention course-specific concepts
- ✅ Different courses have different questions
- ✅ Questions are relevant to the course topic
- ✅ Skill tags match the course domain

Example for "React Development":
- Question: "What is the purpose of useEffect hook in React?"
- Skill tag: "React Hooks"
- Options mention React concepts

Example for "Python Programming":
- Question: "Which Python data structure is ordered and mutable?"
- Skill tag: "Python Data Structures"
- Options mention Python types (list, tuple, set, dict)
