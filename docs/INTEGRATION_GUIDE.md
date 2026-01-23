# Integration Guide - Skill Ecosystem

## Overview

This guide helps you integrate Skill Ecosystem with your existing systems, whether you're an educational institution, HR platform, or learning management system.

## Integration Methods

### 1. REST API Integration
Direct API calls for full control and customization.

### 2. Webhooks
Real-time event notifications for automated workflows.

### 3. OAuth 2.0
Secure user authentication and authorization.

### 4. Bulk Import/Export
CSV/Excel-based data synchronization.

## Common Integration Scenarios

### Scenario 1: LMS Integration

**Goal:** Sync courses and student progress between your LMS and Skill Passport.

**Steps:**

1. **Authentication Setup**
```javascript
const skillpassport = require('@skillpassport/sdk');

const client = new skillpassport.Client({
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret'
});
```

2. **Sync Courses**
```javascript
// Export courses from your LMS
const lmsCourses = await yourLMS.getCourses();

// Import to Skill Passport
for (const course of lmsCourses) {
  await client.courses.create({
    title: course.name,
    description: course.description,
    type: 'internal',
    duration: course.duration,
    skills: course.learningOutcomes,
    external_id: course.id // Track LMS course ID
  });
}
```

3. **Sync Enrollments**
```javascript
// Listen for enrollment events
client.webhooks.on('student.enrolled', async (event) => {
  const { student_id, course_id } = event.data;
  
  // Get course external_id
  const course = await client.courses.get(course_id);
  
  // Enroll in your LMS
  await yourLMS.enrollStudent(student_id, course.external_id);
});
```

4. **Sync Progress**
```javascript
// Update progress from LMS to Skill Passport
const progress = await yourLMS.getStudentProgress(studentId, courseId);

await client.enrollments.updateProgress({
  student_id: studentId,
  course_id: courseId,
  progress_percentage: progress.completion,
  last_accessed: progress.lastAccess
});
```

### Scenario 2: HR System Integration

**Goal:** Post jobs from your ATS and receive applications.

**Steps:**

1. **Post Job Opportunities**
```javascript
const opportunity = await client.opportunities.create({
  title: 'Software Engineer',
  type: 'job',
  company: 'Your Company',
  description: 'Job description...',
  required_skills: ['JavaScript', 'React', 'Node.js'],
  grade_level: 'college',
  location: 'Bangalore',
  external_id: 'ATS-JOB-123' // Your ATS job ID
});
```

2. **Receive Applications via Webhook**
```javascript
// Configure webhook endpoint
app.post('/webhooks/skillpassport', async (req, res) => {
  const event = req.body;
  
  if (event.event === 'application.submitted') {
    const { application_id, student_id, opportunity_id } = event.data;
    
    // Get full application details
    const application = await client.applications.get(application_id);
    const student = await client.students.get(student_id);
    
    // Create candidate in your ATS
    await yourATS.createCandidate({
      name: student.name,
      email: student.email,
      resume_url: application.resume_url,
      job_id: opportunity.external_id
    });
  }
  
  res.status(200).send('OK');
});
```

3. **Sync Application Status**
```javascript
// Update status when changed in ATS
await client.applications.updateStage(applicationId, {
  stage: 'interview',
  notes: 'Scheduled for technical interview'
});
```

### Scenario 3: Student Information System (SIS) Integration

**Goal:** Sync student records, attendance, and grades.

**Steps:**

1. **Bulk Import Students**
```javascript
const fs = require('fs');
const csv = require('csv-parser');

const students = [];
fs.createReadStream('students.csv')
  .pipe(csv())
  .on('data', (row) => students.push(row))
  .on('end', async () => {
    // Batch create students
    const result = await client.students.bulkCreate(students.map(s => ({
      name: s.name,
      email: s.email,
      grade: s.grade,
      program: s.program,
      school_id: s.school_id,
      external_id: s.sis_id
    })));
    
    console.log(`Imported ${result.created} students`);
  });
```

2. **Sync Attendance**
```javascript
// Daily attendance sync
const attendanceRecords = await yourSIS.getAttendance(date);

await client.attendance.bulkCreate(attendanceRecords.map(record => ({
  student_id: record.student_id,
  date: record.date,
  status: record.status, // present, absent, late
  class_id: record.class_id
})));
```

3. **Sync Grades**
```javascript
// End of term grade sync
const grades = await yourSIS.getGrades(term);

await client.grades.bulkUpdate(grades.map(grade => ({
  student_id: grade.student_id,
  subject_id: grade.subject_id,
  score: grade.score,
  grade: grade.letter_grade,
  term: grade.term
})));
```

## Webhook Configuration

### Setting Up Webhooks

1. **Create Webhook Endpoint**
```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

app.post('/webhooks/skillpassport', express.raw({type: 'application/json'}), (req, res) => {
  // Verify signature
  const signature = req.headers['x-skillpassport-signature'];
  const payload = req.body;
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process event
  const event = JSON.parse(payload);
  handleEvent(event);
  
  res.status(200).send('OK');
});
```

2. **Register Webhook in Dashboard**
- Go to Settings → Webhooks
- Add endpoint URL: `https://yourapp.com/webhooks/skillpassport`
- Select events to subscribe
- Copy webhook secret

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `student.created` | New student registered | `{student_id, name, email}` |
| `student.enrolled` | Student enrolled in course | `{student_id, course_id}` |
| `assessment.completed` | Assessment submitted | `{student_id, assessment_id, result_id}` |
| `application.submitted` | Job application submitted | `{application_id, student_id, opportunity_id}` |
| `application.stage.changed` | Application stage updated | `{application_id, old_stage, new_stage}` |
| `payment.completed` | Payment successful | `{payment_id, amount, student_id}` |
| `course.completed` | Course finished | `{student_id, course_id, certificate_url}` |

## OAuth 2.0 Integration

### Allow Users to Login with Skill Passport

1. **Register Your Application**
- Go to Developer Settings
- Create OAuth App
- Set redirect URI: `https://yourapp.com/auth/callback`
- Get Client ID and Secret

2. **Authorization Flow**
```javascript
// Step 1: Redirect to authorization
const authUrl = `https://skillpassport.rareminds.in/oauth/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=profile email courses`;

res.redirect(authUrl);

// Step 2: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  // Exchange code for token
  const tokenResponse = await fetch('https://skillpassport.rareminds.in/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    })
  });
  
  const { access_token, refresh_token } = await tokenResponse.json();
  
  // Get user info
  const userResponse = await fetch('https://api.skillpassport.rareminds.in/v1/me', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const user = await userResponse.json();
  
  // Create session in your app
  req.session.user = user;
  res.redirect('/dashboard');
});
```

## Data Export

### Export Student Data

```javascript
// Export all students
const students = await client.students.list({
  page: 1,
  limit: 1000,
  include: ['courses', 'assessments', 'applications']
});

// Convert to CSV
const csv = students.map(s => ({
  'Student ID': s.id,
  'Name': s.name,
  'Email': s.email,
  'Grade': s.grade,
  'Program': s.program,
  'Skills': s.skills.join(', '),
  'Courses Enrolled': s.courses.length,
  'Assessments Completed': s.assessments.length
}));

// Save to file
fs.writeFileSync('students_export.csv', csvStringify(csv));
```

### Export Analytics Data

```javascript
// Get placement analytics
const analytics = await client.analytics.placement({
  start_date: '2025-01-01',
  end_date: '2026-01-01',
  group_by: 'month'
});

// Export to JSON
fs.writeFileSync('placement_analytics.json', JSON.stringify(analytics, null, 2));
```

## Best Practices

### 1. Error Handling
```javascript
try {
  await client.students.create(studentData);
} catch (error) {
  if (error.code === 'DUPLICATE_EMAIL') {
    // Handle duplicate
    console.log('Student already exists');
  } else if (error.code === 'VALIDATION_ERROR') {
    // Handle validation
    console.log('Invalid data:', error.details);
  } else {
    // Log and retry
    console.error('Unexpected error:', error);
    await retryWithBackoff(() => client.students.create(studentData));
  }
}
```

### 2. Rate Limiting
```javascript
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 100 // 100ms between requests
});

const createStudent = limiter.wrap(async (data) => {
  return await client.students.create(data);
});
```

### 3. Idempotency
```javascript
// Use idempotency keys for critical operations
await client.applications.create({
  student_id: studentId,
  opportunity_id: opportunityId
}, {
  idempotency_key: `app-${studentId}-${opportunityId}-${Date.now()}`
});
```

### 4. Caching
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getStudent(studentId) {
  const cached = cache.get(`student-${studentId}`);
  if (cached) return cached;
  
  const student = await client.students.get(studentId);
  cache.set(`student-${studentId}`, student);
  return student;
}
```

## Testing

### Sandbox Environment

Use sandbox credentials for testing:
```javascript
const client = new skillpassport.Client({
  apiKey: 'test_key',
  apiSecret: 'test_secret',
  environment: 'sandbox'
});
```

### Mock Webhooks

Test webhook handling:
```bash
curl -X POST https://yourapp.com/webhooks/skillpassport \
  -H "Content-Type: application/json" \
  -H "X-SkillPassport-Signature: test_signature" \
  -d '{
    "event": "application.submitted",
    "timestamp": "2026-01-23T12:00:00Z",
    "data": {
      "application_id": "test-uuid",
      "student_id": "test-student",
      "opportunity_id": "test-job"
    }
  }'
```

## Support

- Integration Support: integrations@skillpassport.rareminds.in
- Documentation: https://docs.skillpassport.rareminds.in
- Community Forum: https://community.skillpassport.rareminds.in
- Status Page: https://status.skillpassport.rareminds.in
