# Assessment System - Quick Reference

> **Quick lookup guide for common tasks and information**

## 🚀 Quick Start

### For Developers
1. Navigate to `/student/assessment/test`
2. Enable test mode (automatic on localhost)
3. Use debug controls to skip sections
4. Check console for detailed logs

### For Testing
```bash
# Test resume flow
1. Start assessment, answer 5 questions
2. Close browser
3. Reopen and verify resume prompt

# Test restriction
1. Complete assessment
2. Try starting new one immediately
3. Verify 6-month restriction message
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/features/assessment/career-test/AssessmentTestPage.tsx` | Main implementation |
| `src/features/assessment/career-test/hooks/useAssessmentFlow.ts` | State machine |
| `src/hooks/useAssessment.js` | Database operations |
| `src/hooks/useAdaptiveAptitude.js` | Adaptive testing |
| `src/features/assessment/constants/config.ts` | All configuration |

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `personal_assessment_attempts` | Tracks attempts & progress |
| `personal_assessment_responses` | UUID-based answers |
| `personal_assessment_questions` | Cached AI questions |
| `personal_assessment_results` | Final analysis |
| `adaptive_aptitude_sessions` | Adaptive test sessions |

## 🎯 Assessment Sections by Grade

### Middle School (6-8)
- Interest Explorer
- Strengths & Character
- Learning Preferences

### High School (9-10)
- Interest Explorer
- Strengths & Character
- Learning Preferences
- Aptitude Sampling

### After 10th/12th/College
- RIASEC (Interests)
- Big Five (Personality)
- Work Values
- Employability Skills
- Aptitude (AI-generated)
- Adaptive Aptitude (IRT-based)

## ⏱️ Timers

| Type | Duration | Sections |
|------|----------|----------|
| Adaptive Question | 90s | Adaptive Aptitude |
| Aptitude Question | 60s | Aptitude (individual) |
| Aptitude Shared | 15 min | Aptitude (shared) |
| Knowledge | 30 min | Knowledge |
| Auto-save | 30s | All |

## 🔒 Restrictions

- **6-month waiting period** between attempts
- Cannot skip questions
- Must answer all questions to proceed
- SJT requires both best AND worst selection

## 🧪 Test Mode Controls

Available on localhost:
- **Auto-Fill All** - Fills all questions
- **Skip to Aptitude** - Jumps to aptitude section
- **Skip to Adaptive** - Jumps to adaptive section
- **Submit** - Auto-fills and submits

## 🎨 Response Scales

| Scale | Range | Used In |
|-------|-------|---------|
| RIASEC | 1-5 (Strongly Dislike → Strongly Like) | Interests |
| Big Five | 1-5 (Very Inaccurate → Very Accurate) | Personality |
| Work Values | 1-5 (Not Important → Extremely Important) | Values |
| Employability | 1-5 (Not Like Me → Very Much Like Me) | Skills |
| High School | 1-4 (Not me → Strongly me) | HS sections |

## 🤖 AI Analysis Stages

1. **Preparing** (0-10%) - Organizing data
2. **Sending** (10-20%) - Connecting to AI
3. **Analyzing** (20-70%) - AI processing
4. **Processing** (70-85%) - Generating matches
5. **Courses** (85-95%) - Finding courses
6. **Saving** (95-100%) - Storing report
7. **Complete** (100%) - Done

## 🔄 Resume Process

**What gets saved**:
- ✅ All answers (immediately)
- ✅ Current position (immediately)
- ✅ Timer state (every 10s)
- ✅ Section timings (on complete)

**What gets restored**:
- ✅ Exact section/question position
- ✅ All previous answers
- ✅ Timer state
- ✅ Adaptive session (if exists)

## 🌐 Environment Behavior

| Environment | Grade Options | Test Mode | Logging |
|-------------|---------------|-----------|---------|
| localhost | All visible | Enabled | Verbose |
| skillpassport.pages.dev | All visible | Disabled | Standard |
| skilldevelopment.rareminds.in | Filtered | Disabled | Minimal |

## 🐛 Common Issues

### Resume prompt shows after "Start Section"
**Fix**: Check `initialCheckDoneRef` is preventing re-runs

### Answers not restored
**Fix**: Load from both `restoredResponses` AND `all_responses`

### Timer not restored
**Fix**: Verify timer state saved every 10 seconds

### Progress bar inaccurate
**Fix**: Count actual answers, not just position

## 📊 Key Metrics

- **Total Questions**: 41-120 (varies by grade)
- **Average Time**: 20-40 minutes
- **Sections**: 3-6 (varies by grade)
- **AI Analysis Time**: 10-30 seconds
- **Database Saves**: Real-time + every 10s

## 🔗 Related Documentation

- Full Guide: `ASSESSMENT_SYSTEM_COMPLETE_GUIDE.md`
- API Docs: `src/services/assessmentService.js`
- Config: `src/features/assessment/constants/config.ts`

---

**Quick Tip**: Always check console logs on localhost for detailed debugging information!
