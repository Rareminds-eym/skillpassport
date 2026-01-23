# Course Display UX Change - Role-Specific Courses

## Summary
Courses are now shown **ONLY when a specific job role is clicked**, not in the default Roadmap tab. This provides a more focused, role-aligned learning experience.

## What Changed

### Before
- Courses were displayed in the Roadmap tab by default
- All recommended courses shown together (technical + soft skills)
- Not aligned with specific job roles

### After
- Courses are **hidden from the Roadmap tab**
- Courses appear **only when clicking a job role card**
- Each role shows **4 AI-matched courses** specific to that role
- Better alignment between career path and learning recommendations

## User Flow

1. **View Career Recommendations**
   - Student completes assessment
   - Sees 3 career cluster cards (Track 1, 2, 3)

2. **Click on a Job Role Card**
   - Student clicks on any career cluster card
   - Modal opens showing role selection

3. **Select Specific Role**
   - Student selects a specific role (e.g., "Software Developer")
   - Multi-step wizard opens

4. **View Role-Specific Courses**
   - Navigate to "Courses" page (Page 3 of wizard)
   - See 4 AI-matched courses specific to that role
   - Courses are filtered by relevance to the role and career cluster
   - Click any course to start learning

## Technical Implementation

### Files Modified

1. **`src/features/assessment/assessment-result/components/sections/RoadmapSection.jsx`**
   - Removed `<RecommendedCoursesSection>` component
   - Added comment explaining courses are now role-specific

### Files Using Existing Implementation

1. **`src/features/assessment/assessment-result/components/CareerTrackModal.jsx`**
   - Already has AI-powered course matching per role
   - Shows 4 courses matched to the selected role
   - Uses `matchCoursesForRole()` from `aiCareerPathService`
   - Includes loading states and error handling

2. **`src/features/assessment/assessment-result/AssessmentResult.jsx`**
   - Already has `handleTrackClick()` to open modal
   - Already passes `onCardClick={handleTrackClick}` to CareerCard
   - No changes needed

## AI Course Matching

The system uses AI to match courses to roles:

```javascript
// From CareerTrackModal.jsx
const matchResult = await matchCoursesForRole(
    roleName,           // e.g., "Software Developer"
    clusterTitle,       // e.g., "Information Technology"
    coursesForMatching  // All available platform courses
);
```

### Matching Logic
1. **AI Analysis**: Uses OpenRouter API to analyze role requirements
2. **Keyword Matching**: Matches role keywords with course content
3. **Domain Relevance**: Prioritizes courses in the same domain
4. **Skill Level**: Considers entry-level vs advanced roles
5. **Soft Skills**: Boosts soft skill courses for interns/entry roles

### Fallback System
- If AI matching fails, uses keyword-based scoring
- Always ensures exactly 4 courses are shown
- Prioritizes most relevant courses by score

## Benefits

1. **Better Context**: Courses are shown in the context of a specific career path
2. **Reduced Overwhelm**: Students see focused recommendations, not all courses at once
3. **Higher Relevance**: AI matches courses to the specific role requirements
4. **Clearer Path**: Students understand why each course matters for their chosen role
5. **Improved Engagement**: More likely to enroll when courses are role-specific

## Testing

To test the new flow:

1. Complete an assessment (any grade level)
2. View assessment results
3. Navigate to Career section
4. Click on any career cluster card (Track 1, 2, or 3)
5. Select a specific role from the list
6. Navigate through the wizard to "Courses" (Page 3)
7. Verify 4 role-specific courses are displayed
8. Click a course to verify navigation to course player

## Future Enhancements

Potential improvements:
- Add "View All Courses" button in modal for exploration
- Show course completion status if student already enrolled
- Add "Save for Later" functionality for courses
- Track which courses students view per role
- A/B test course enrollment rates with this UX vs old UX

## Related Files

- `src/services/aiCareerPathService.js` - AI course matching logic
- `src/features/assessment/assessment-result/components/CareerCard.jsx` - Career cluster cards
- `src/hooks/useRoleOverview.js` - Fetches role details from API
- `src/features/assessment/assessment-result/hooks/useAssessmentResults.js` - Loads assessment data

## Notes

- The `RecommendedCoursesSection` component still exists but is no longer used
- Can be removed in future cleanup if not needed elsewhere
- All course data is still fetched and stored in assessment results
- Only the display location changed, not the data structure
