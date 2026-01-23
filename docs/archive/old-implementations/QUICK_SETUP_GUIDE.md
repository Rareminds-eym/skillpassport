# Quick Setup Guide - Student Pipeline Integration

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Database Schema
```sql
-- In Supabase SQL Editor, run:
database/student_notifications_schema.sql
```

This creates:
- ✅ `student_notifications` table
- ✅ Auto-notification triggers
- ✅ Helper functions

### Step 2: Verify Services
Files are already created:
- ✅ `src/services/studentPipelineService.js`
- ✅ `src/services/studentNotificationService.js`

### Step 3: Test the Integration

#### As a Student:
1. Login to student account
2. Go to Applications page (`/student/applications`)
3. You should now see:
   - Pipeline status badges
   - Current recruitment stage
   - Scheduled interviews
   - Rejection feedback (if any)

#### As a Recruiter:
1. Login to recruiter account
2. Go to Pipelines page (`/recruitment/pipelines`)
3. Add a student to pipeline
4. Move them through stages
5. Check if AI scores appear in candidate card
6. Student should receive notifications automatically

---

## 📊 What Changed?

### Student Dashboard (`/student/applications`)
**BEFORE:**
```
Job Application Card:
├─ Job Title
├─ Company
├─ Status: Applied
└─ Applied Date
```

**AFTER:**
```
Job Application Card:
├─ Job Title
├─ Company
├─ Status: Applied
├─ 📊 Pipeline Status:
│   ├─ Current Stage: Interview Round 1
│   ├─ Last Updated: Nov 3, 2025
│   ├─ 🔔 Next Action: Schedule Interview
│   └─ Scheduled: Nov 10, 2025
├─ 🎥 Scheduled Interviews:
│   ├─ Technical - Nov 15, 10:00 AM
│   └─ HR - Nov 20, 2:00 PM
└─ ⚠️ Feedback: (if rejected)
```

### Recruiter Pipeline (`/recruitment/pipelines`)
**BEFORE:**
```
Candidate Card:
├─ Name
├─ Department
└─ Skills
```

**AFTER:**
```
Candidate Card:
├─ Name
├─ Department
├─ ⭐ AI Match Score: 87/100
├─ 📊 Employability: 92/100
└─ Skills
```

---

## 🔔 Notification System

### When are notifications sent?

| Event | Notification | Student Sees |
|-------|-------------|--------------|
| Added to pipeline | ✅ Yes | "You've been added to recruitment pipeline for [Job]" |
| Stage changed | ✅ Yes | "You've moved to [Stage] for [Job]" |
| Interview scheduled | ✅ Yes | "Interview scheduled: [Type] on [Date]" |
| Offer extended | ✅ Yes | "Offer is being prepared!" |
| Hired | ✅ Yes | "Congratulations! You've been hired!" |
| Rejected | ✅ Yes | "Application reviewed" + feedback |

### Notification Triggers (Automatic)
```sql
-- Auto-created when:
1. pipeline_candidates.stage changes → Stage change notification
2. interviews record inserted → Interview notification
3. Recruiter manually creates → Custom notification
```

---

## 🧪 Quick Test Checklist

### Database Setup
- [ ] Run `student_notifications_schema.sql` in Supabase
- [ ] Verify tables created: `student_notifications`
- [ ] Check triggers exist: `trigger_notify_student_stage_change`

### Frontend Integration
- [ ] Student Applications page loads without errors
- [ ] Pipeline status section appears (if student is in pipeline)
- [ ] Interview cards display properly
- [ ] Real-time updates work (try moving a student through pipeline)

### Notifications
- [ ] Add student to pipeline → Check if notification created
- [ ] Move student to different stage → Check notification
- [ ] Schedule interview → Check notification
- [ ] Mark notification as read → Updates correctly

### AI Scores
- [ ] Add student to pipeline
- [ ] Check `pipeline_candidates.recruiter_notes` has AI scores
- [ ] Verify scores visible in recruiter's pipeline view

---

## 🐛 Troubleshooting

### "Pipeline status not showing"
**Fix:** 
1. Check if student is in `pipeline_candidates` table
2. Verify `student_id` matches between `students` and `pipeline_candidates`
3. Check console for errors in `StudentPipelineService`

### "Notifications not appearing"
**Fix:**
1. Ensure `student_notifications_schema.sql` was run
2. Check triggers are enabled: 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify_student%';
   ```
3. Verify real-time subscriptions are active

### "AI scores not showing in pipeline"
**Fix:**
1. Check `students.profile` has `ai_score_overall` field
2. Verify `pipelineService.ts` changes were saved
3. Re-add a student to pipeline to test

---

## 📈 Usage Examples

### Get Student's Pipeline Status
```javascript
import StudentPipelineService from './services/studentPipelineService';

const status = await StudentPipelineService.getStudentPipelineStatus(studentId);
// Returns: Array of pipeline positions across all applications
```

### Subscribe to Notifications
```javascript
import StudentNotificationService from './services/studentNotificationService';

const channel = StudentNotificationService.subscribeToNotifications(
  studentId,
  (notification) => {
    // Show toast
    toast.success(notification.message);
  }
);

// Cleanup
StudentNotificationService.unsubscribeFromNotifications(channel);
```

### Get Combined Application Data
```javascript
const apps = await StudentPipelineService.getStudentApplicationsWithPipeline(
  studentId,
  studentEmail
);

apps.forEach(app => {
  console.log(`${app.jobTitle}: Stage ${app.pipelineStage}`);
  console.log(`Interviews: ${app.interviews.length}`);
  console.log(`Next Action: ${app.nextAction}`);
});
```

---

## 🎯 Key Benefits Delivered

### For Students
✅ **Transparency** - Know exactly where you stand
✅ **Communication** - Get notified of all changes
✅ **Interviews** - See scheduled interviews in one place
✅ **Feedback** - Understand why if rejected
✅ **Real-time** - Instant updates

### For Recruiters
✅ **AI Insights** - Leverage matching scores
✅ **Automation** - No manual notification emails
✅ **Tracking** - Complete candidate history
✅ **Feedback** - Structured rejection reasons
✅ **Efficiency** - Better candidate management

---

## 📞 Support

If you encounter issues:
1. Check the main documentation: `STUDENT_PIPELINE_INTEGRATION_COMPLETE.md`
2. Review database schema: `database/student_notifications_schema.sql`
3. Check service implementations in `src/services/`

---

## ✨ You're All Set!

The integration is complete. Students now have full visibility into their recruitment journey, and recruiters have AI-powered insights to make better decisions.

Happy recruiting! 🎉
