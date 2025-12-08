# Assessment Report Flow - Complete Guide

## Overview
This document explains how the assessment test completion flows into the report display, including the 6-month restriction feature.

## Complete User Journey

### 1. Starting the Assessment

**URL:** `/student/assessment/test`

**Flow:**
1. User navigates to assessment page
2. System checks authentication
3. **NEW:** System checks if user can take assessment (6-month restriction)
   - If NO: Shows restriction message with dates
   - If YES: Continues to step 4
4. System checks for in-progress attempts
   - If found: Shows resume prompt
   - If not found: Shows stream selection

### 2. Taking the Assessment

**Sections (in order):**
1. Career Interests (RIASEC) - ~48 questions
2. Big Five Personality - ~50 questions
3. Work Values & Motivators - ~21 questions
4. Employability Skills - ~31 questions (self-rating + SJT)
5. Multi-Aptitude - ~50 questions (timed: 10 minutes)
6. Stream Knowledge - ~30 questions (timed: 30 minutes)

**Features:**
- Progress auto-saves to database
- Can resume if interrupted
- Timer for timed sections
- Elapsed time tracking for non-timed sections

### 3. Completing the Assessment

**When user clicks "Submit":**

```javascript
// 1. Collect all answers and timings
const answers = { /* all responses */ };
const sectionTimings = { /* time spent per section */ };

// 2. Analyze with Gemini AI
const geminiResults = await analyzeAssessmentWithGemini(
    answers,
    studentStream,
    questionBanks,
    sectionTimings
);

// 3. Save to database
const dbResults = await completeAssessment(geminiResults, sectionTimings);

// 4. Navigate to report with attemptId
navigate(`/student/assessment/result?attemptId=${currentAttempt.id}`);
```

**Database Operations:**
1. Updates `personal_assessment_attempts` status to 'completed'
2. Inserts record into `personal_assessment_results` with:
   - All scores (RIASEC, aptitude, personality, etc.)
   - Career fit analysis
   - Skill gap analysis
   - Personalized roadmap
   - Full Gemini AI results in `gemini_results` JSONB field

### 4. Viewing the Report

**URL:** `/student/assessment/result?attemptId={uuid}`

**Data Loading Priority:**
1. **From URL parameter:** If `attemptId` is present, loads that specific result
2. **From database:** Loads latest completed result for current user
3. **From localStorage:** Fallback for legacy/offline mode

**Report Sections:**
- **Profile Snapshot:** Interests, aptitudes, personality traits
- **Career Fit:** Best-matching career clusters and specific roles
- **Skill Gap Analysis:** Priority skills to develop
- **Action Roadmap:** Projects, courses, and internship recommendations

**Features:**
- Interactive modal dialogs for detailed views
- PDF download/print functionality
- Regenerate report option (re-runs AI analysis)
- Course recommendations saved to database

## 6-Month Restriction Feature

### How It Works

**Check Function:**
```javascript
const eligibility = await assessmentService.canTakeAssessment(studentId);
// Returns: { canTake, lastAttemptDate, nextAvailableDate }
```

**Database Query:**
```sql
SELECT created_at
FROM personal_assessment_results
WHERE student_id = $1 
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

**Logic:**
- If no previous assessment: `canTake = true`
- If previous assessment exists:
  - Calculate: `nextAvailableDate = lastAttemptDate + 6 months`
  - Compare: `canTake = (now >= nextAvailableDate)`

### User Experience

**Scenario 1: First-Time User**
- No restriction
- Can start assessment immediately

**Scenario 2: Recent Assessment (< 6 months)**
- Sees restriction screen with:
  - Last assessment date
  - Next available date
  - Days remaining
  - Button to view last report
  - Explanation of policy

**Scenario 3: Eligible for Retake (> 6 months)**
- Can start new assessment
- Previous results remain accessible
- New results will replace as "latest"

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Assessment Test Page                      │
│                 /student/assessment/test                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Check Authentication │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Check 6-Month Rule   │◄─── NEW FEATURE
              │ canTakeAssessment()  │
              └──────────┬───────────┘
                         │
                    ┌────┴────┐
                    │         │
              Can Take?    Cannot Take
                    │         │
                    │         ▼
                    │    Show Restriction
                    │    Message + Dates
                    │         │
                    ▼         ▼
         ┌──────────────────────┐
         │ Check In-Progress    │
         │ Attempts             │
         └──────────┬───────────┘
                    │
               ┌────┴────┐
               │         │
          Resume?    New Start
               │         │
               ▼         ▼
         ┌──────────────────────┐
         │ Load Questions       │
         │ (from database)      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Take Assessment      │
         │ (6 sections)         │
         │ - Auto-save progress │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Submit & Analyze     │
         │ - Gemini AI          │
         │ - Save to DB         │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Navigate to Report   │
         │ ?attemptId={uuid}    │
         └──────────┬───────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Assessment Result Page                    │
│                 /student/assessment/result                   │
│                                                              │
│  - Load results from database                               │
│  - Display comprehensive report                             │
│  - Save course recommendations                              │
│  - Enable PDF download                                      │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Key Tables

**personal_assessment_attempts**
- Tracks each assessment attempt
- Stores progress (section/question index)
- Stores timer state
- Status: 'in_progress', 'completed', 'abandoned'

**personal_assessment_results**
- Stores completed assessment results
- One record per completed attempt
- Contains all scores and AI analysis
- **Used for 6-month restriction check**

**personal_assessment_responses**
- Individual question responses
- Links to attempt and question
- Stores answer and correctness

## API Endpoints (Service Functions)

### Assessment Service (`src/services/assessmentService.js`)

```javascript
// Restriction check (NEW)
canTakeAssessment(studentId)

// Attempt management
createAttempt(studentId, streamId)
getInProgressAttempt(studentId)
abandonAttempt(attemptId)
updateAttemptProgress(attemptId, progress)

// Response handling
saveResponse(attemptId, questionId, responseValue, isCorrect)
getAttemptResponses(attemptId)

// Completion
completeAttempt(attemptId, studentId, streamId, geminiResults, sectionTimings)

// Retrieval
getStudentAttempts(studentId)
getAttemptWithResults(attemptId)
getLatestResult(studentId)
```

## Testing Checklist

### Manual Testing Steps

1. **First-Time User**
   - [ ] Can access assessment page
   - [ ] Can select stream
   - [ ] Can complete assessment
   - [ ] Redirects to report page
   - [ ] Report displays correctly

2. **6-Month Restriction**
   - [ ] Complete an assessment
   - [ ] Try to access test page again
   - [ ] Should see restriction message
   - [ ] Message shows correct dates
   - [ ] Can view previous report
   - [ ] Can return to dashboard

3. **Resume Functionality**
   - [ ] Start assessment
   - [ ] Answer some questions
   - [ ] Close browser/navigate away
   - [ ] Return to test page
   - [ ] Should see resume prompt
   - [ ] Can resume from where left off

4. **Report Display**
   - [ ] Report loads from database
   - [ ] All sections display correctly
   - [ ] Modal dialogs work
   - [ ] PDF download works
   - [ ] Regenerate report works

### SQL Testing Queries

See `verify-assessment-restriction.sql` for comprehensive database checks.

### JavaScript Testing

See `test-assessment-restriction.js` for automated testing functions.

## Troubleshooting

### Issue: Restriction not working
**Check:**
1. Is `canTakeAssessment()` being called?
2. Is the query returning correct data?
3. Are dates being compared correctly?

### Issue: Report not displaying
**Check:**
1. Is `attemptId` in URL?
2. Does the result exist in database?
3. Is `gemini_results` field populated?
4. Check browser console for errors

### Issue: Can't retake after 6 months
**Check:**
1. Verify `created_at` date in database
2. Check timezone handling
3. Verify status is 'completed'

## Future Enhancements

1. **Email Notifications**
   - Send email when eligible to retake
   - Weekly reminders to complete in-progress assessments

2. **Dashboard Integration**
   - Show countdown to next assessment
   - Display assessment history timeline

3. **Admin Features**
   - Override restriction for specific students
   - Bulk reset restrictions
   - Analytics on assessment completion rates

4. **Comparison Reports**
   - Compare current vs previous assessment
   - Show growth over time
   - Highlight improvements

5. **Configurable Restrictions**
   - Make 6-month period configurable
   - Different periods for different streams
   - Grace period for early retakes
