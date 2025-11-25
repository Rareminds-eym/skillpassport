# Troubleshooting AI Recommendations Not Showing

## Quick Checklist

### 1. **Check Browser Console**

Open the applicants page and check the browser console (F12 or Right-click > Inspect > Console tab).

Look for these log messages:
```
[AI Recommendations] Starting analysis for X applicants
[AI Recommendations] Fetching skills for opportunity IDs: [...]
[AI Recommendations] Opportunities data: [...]
[RecruiterInsights] analyzeApplicantsForRecommendation called with X applicants
[RecruiterInsights] Analyzing [Name]: {...}
[RecruiterInsights] [Name] match score: {...}
[RecruiterInsights] Before filtering: {...}
[RecruiterInsights] After filtering (>30%): {...}
[AI Recommendations] Results: {...}
```

### 2. **Check the Debug Panel**

A yellow debug panel should appear at the top of the page showing:
- Loading status
- Has Data status
- Recommendations Count
- Total Analyzed
- High/Medium/Low Potential counts

### 3. **Common Issues & Solutions**

#### Issue: "No applicants to analyze"
**Problem**: No applicants in the system
**Solution**: 
1. Make sure students have applied to jobs
2. Check `applied_jobs` table in Supabase
3. Verify applicants are showing in the table below

#### Issue: "Recommendations Count: 0" but "Total Analyzed: X"
**Problem**: All candidates scored ≤30%
**Possible causes**:
1. **Job postings missing skills_required**
   - Check console log: `skills_required: []` or `has_skills: false`
   - Fix: Go to job postings and add required skills

2. **Students missing skills**
   - Check console log: `candidateSkills: 0`
   - Fix: Students need to add skills to their profiles

3. **Skills don't match**
   - Check console log for match scores (all showing < 30%)
   - Example: Job requires "JavaScript, React" but student has "Python, Django"

4. **Check actual scores in console**
   - Look for: `[RecruiterInsights] Before filtering: { scores: [15, 22, 8] }`
   - If all scores are low (< 30%), recommendations will be filtered out

#### Issue: "Has Data: NO"
**Problem**: Recommendations not being fetched
**Check console for errors**:
- Network errors
- Database permission errors
- Supabase connection issues

### 4. **Verify Database Data**

#### Check job postings have skills_required:
```sql
SELECT id, job_title, skills_required 
FROM opportunities 
WHERE id IN (SELECT DISTINCT opportunity_id FROM applied_jobs);
```

Expected result:
```json
{
  "id": 123,
  "job_title": "Software Engineer",
  "skills_required": ["JavaScript", "React", "Node.js"]  // ✅ Should be array
}
```

**NOT** empty:
```json
{
  "id": 123,
  "job_title": "Software Engineer",
  "skills_required": []  // ❌ Empty array
}
```

#### Check students have skills:
```sql
SELECT s.user_id, s.name, COUNT(sk.id) as skill_count
FROM students s
LEFT JOIN skills sk ON sk.student_id = s.user_id AND sk.enabled = true
WHERE s.user_id IN (SELECT DISTINCT student_id FROM applied_jobs)
GROUP BY s.user_id, s.name;
```

Students should have `skill_count > 0`

#### Check applicants exist:
```sql
SELECT COUNT(*) as total_applicants
FROM applied_jobs;
```

Should return `total_applicants > 0`

### 5. **Manual Test with Console**

Run this in browser console to test the service directly:
```javascript
// Get the service
import { recruiterInsights } from './src/features/recruiter-copilot/services/recruiterInsights';

// Test with sample data
const testApplicants = [{
  id: 1,
  student_id: 'student-uuid',
  opportunity_id: 123,
  pipeline_stage: 'sourced',
  student: {
    id: 'student-uuid',
    name: 'Test Student',
    email: 'test@example.com',
    university: 'Test University',
    cgpa: '8.5',
    branch_field: 'Computer Science'
  },
  opportunity: {
    id: 123,
    job_title: 'Software Engineer',
    skills_required: ['JavaScript', 'React', 'Node.js']
  }
}];

const results = await recruiterInsights.analyzeApplicantsForRecommendation(testApplicants);
console.log('Test Results:', results);
```

### 6. **Expected Console Output (Working System)**

```
[AI Recommendations] Starting analysis for 1 applicants
[AI Recommendations] Fetching skills for opportunity IDs: [123]
[AI Recommendations] Opportunities data: [{id: 123, skills_required: ['JavaScript', 'React', 'Node.js']}]
[AI Recommendations] Applicant Test Student for Software Engineer: {
  skills_required: ['JavaScript', 'React', 'Node.js'],
  has_skills: true
}
[RecruiterInsights] analyzeApplicantsForRecommendation called with 1 applicants
[RecruiterInsights] Analyzing Test Student: {
  requiredSkills: 3,
  candidateSkills: 5,
  trainingCount: 2,
  certCount: 1
}
[RecruiterInsights] Test Student match score: {
  skillScore: 40,
  profileBonus: 15,
  trainingBonus: 6,
  certBonus: 2,
  totalScore: 63,
  matchedSkills: 2,
  missingSkills: 1
}
[RecruiterInsights] Before filtering: {
  total: 1,
  scores: [63]
}
[RecruiterInsights] After filtering (>30%): {
  total: 1,
  scores: [63]
}
[AI Recommendations] Results: {
  totalRecommendations: 1,
  summary: {totalAnalyzed: 1, highPotential: 0, mediumPotential: 1, lowPotential: 0},
  topScores: [{name: 'Test Student', score: 63, confidence: 'medium'}]
}
```

## Quick Fixes

### Fix 1: Add Skills to Job Postings

1. Go to Supabase dashboard
2. Open `opportunities` table
3. Find your job posting
4. Edit `skills_required` column
5. Add array of skills: `["JavaScript", "React", "Node.js", "TypeScript"]`
6. Save
7. Refresh applicants page

### Fix 2: Ensure Students Have Skills

1. Have students log in
2. Go to their profile/skills page
3. Add at least 3-5 skills
4. Make sure skills are enabled
5. Refresh applicants page

### Fix 3: Lower the Threshold Temporarily

If you want to see ALL candidates regardless of score:

Edit `src/features/recruiter-copilot/services/recruiterInsights.ts` line 607:
```typescript
// Change from:
.filter(r => r!.matchScore > 30)

// To:
.filter(r => r!.matchScore > 0)  // Show everyone
```

Then rebuild and test.

### Fix 4: Check Network Tab

1. Open DevTools > Network tab
2. Refresh the page
3. Look for failed requests (red)
4. Check for:
   - `/opportunities` request succeeding
   - `/skills` request succeeding
   - `/trainings` request succeeding
   - `/certificates` request succeeding

If any fail with 403/401 - it's a permissions issue in Supabase.

## Still Not Working?

### Share Console Output

Copy the entire console output and share it. Key lines to look for:
- `[AI Recommendations] Results: {...}`
- `[RecruiterInsights] After filtering (>30%): {...}`
- Any error messages in red

### Check Debug Panel Values

Share the values from the yellow debug panel:
- Loading: ?
- Show: ?
- Has Data: ?
- Recommendations Count: ?
- Total Analyzed: ?

### Verify Component Rendering

Check if these conditions are met:
```javascript
showRecommendations === true  // Not hidden
aiRecommendations !== null    // Data loaded
aiRecommendations.topRecommendations.length > 0  // Has recommendations
```

If any is false, that's why it's not showing.

