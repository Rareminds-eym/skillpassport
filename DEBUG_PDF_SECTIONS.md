# Debug Guide - PDF Sections Not Showing

## ✅ Fixed! Sections Now Properly Placed

The sections were initially added inside helper components instead of the main component. This has been fixed.

---

## How to Verify Sections Are Working

### Step 1: Check Console for Data

Open browser console and look for these logs when viewing the PDF:

```javascript
// The transformer should log:
console.log('Results:', results);
console.log('Career Fit:', results.careerFit);
console.log('Skill Gap:', results.skillGap);
console.log('Roadmap:', results.roadmap);
```

### Step 2: Add Temporary Debug Logging

If sections still don't show, add this temporarily to PrintViewCollege.jsx (around line 230):

```jsx
{/* Debug: Check if data exists */}
{console.log('DEBUG - Profile Snapshot:', results.profileSnapshot)}
{console.log('DEBUG - Career Fit:', results.careerFit)}
{console.log('DEBUG - Skill Gap:', results.skillGap)}
{console.log('DEBUG - Roadmap:', results.roadmap)}
{console.log('DEBUG - Courses:', {
  skillGap: results.skillGapCourses,
  platform: results.platformCourses,
  byType: results.coursesByType
})}
{console.log('DEBUG - Timing:', results.timingAnalysis)}
{console.log('DEBUG - Final Note:', results.finalNote)}
```

### Step 3: Check If Components Render

The components have built-in null checks. They won't show if data is null/undefined. This is expected behavior.

To test if components work, add a test section with hardcoded data:

```jsx
{/* TEST: Hardcoded data to verify component works */}
<CompleteCareerFitSection careerFit={{
  clusters: [{
    title: "Test Career",
    matchScore: 90,
    description: "Test description",
    roles: ["Role 1", "Role 2"],
    skills: ["Skill 1", "Skill 2"],
    salary: { min: 5, max: 15, currency: "LPA" }
  }]
}} />
```

If this shows up, the component works and the issue is with data.

---

## Common Issues & Solutions

### Issue 1: Sections Don't Appear

**Cause:** Data is null/undefined in database

**Solution:** 
1. Check if your assessment results have data in these columns:
   - `career_fit`
   - `skill_gap`
   - `roadmap`
   - `skill_gap_courses`
   - `platform_courses`
   - `courses_by_type`
   - `profile_snapshot`
   - `timing_analysis`
   - `final_note`

2. Run this SQL to check:
```sql
SELECT 
  id,
  CASE WHEN career_fit IS NOT NULL THEN '✅' ELSE '❌' END as has_career_fit,
  CASE WHEN skill_gap IS NOT NULL THEN '✅' ELSE '❌' END as has_skill_gap,
  CASE WHEN roadmap IS NOT NULL THEN '✅' ELSE '❌' END as has_roadmap,
  CASE WHEN skill_gap_courses IS NOT NULL THEN '✅' ELSE '❌' END as has_courses
FROM personal_assessment_results
ORDER BY created_at DESC
LIMIT 5;
```

### Issue 2: Only Some Sections Show

**Cause:** Some data exists, some doesn't

**Solution:** This is normal! Components only show when data exists. If you see some sections but not others, it means those columns are null in the database.

### Issue 3: Data Exists But Sections Don't Show

**Cause:** Transformer not extracting data correctly

**Solution:**
1. Check transformer is being used in the hook
2. Verify field names match between database and transformer
3. Check console for transformer logs

---

## Quick Test

### Create Test Data

To quickly test if sections work, you can temporarily modify the transformer to add test data:

In `src/services/assessmentResultTransformer.js`, add at the end of `transformAssessmentResults`:

```javascript
// TEMPORARY TEST DATA - REMOVE AFTER TESTING
if (!transformed.careerFit) {
  transformed.careerFit = {
    clusters: [{
      title: "Test Career",
      matchScore: 90,
      description: "This is test data to verify the component works",
      roles: ["Test Role 1", "Test Role 2"],
      skills: ["Test Skill 1", "Test Skill 2"],
      salary: { min: 5, max: 15, currency: "LPA" }
    }]
  };
}

if (!transformed.skillGap) {
  transformed.skillGap = {
    gaps: [{
      skill: "Test Skill",
      importance: "High",
      developmentPath: "This is a test development path",
      resources: [{
        title: "Test Resource",
        type: "course",
        url: "https://example.com",
        provider: "Test Provider"
      }]
    }]
  };
}

if (!transformed.roadmap) {
  transformed.roadmap = {
    steps: [{
      title: "Test Step",
      description: "This is a test step",
      timeline: "Next 3 months",
      priority: "High",
      resources: []
    }]
  };
}
```

If sections show with this test data, the components work and you just need to populate real data in the database.

---

## Expected Behavior

✅ **Sections SHOULD show** when data exists in database
✅ **Sections SHOULD NOT show** when data is null (this is correct behavior)
✅ **Console logs** should show what data is available

---

## Next Steps

1. **Check console** for data availability
2. **Verify database** has data in the columns
3. **Test with hardcoded data** if needed
4. **Populate real data** in database columns

The components are working correctly - they just need data to display!
