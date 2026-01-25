# Training Course & Certificate Assessment Feature

## Overview

This feature allows students to add training courses from various providers. When adding certificates from external/unknown organizations, students must complete a skill assessment to determine their proficiency level. The certificate level is dynamically assigned based on the assessment score.

## Key Features

### 1. **Training Course Management**
- Add training courses with detailed information
- Track progress (modules completed, hours spent)
- Link certificates to training courses
- Support for both ongoing and completed courses

### 2. **Smart Organization Detection**
- Automatically detects known training providers (Coursera, Udemy, edX, etc.)
- Flags external/unknown organizations for assessment
- No assessment required for recognized platforms

### 3. **Skill Assessment System**
- Dynamic question generation based on skills covered
- Proficiency rating scale (Beginner, Intermediate, Advanced, Expert)
- Automatic score calculation
- Certificate level assignment based on performance

### 4. **Certificate Level Assignment**
Score-based level determination:
- **Expert**: 85-100% (Exceptional proficiency)
- **Advanced**: 70-84% (Strong proficiency)
- **Intermediate**: 50-69% (Moderate proficiency)
- **Beginner**: 0-49% (Basic proficiency)

## Database Schema

### Tables Used

#### `trainings` table
```sql
- id (uuid, primary key)
- student_id (uuid, foreign key to students)
- title (varchar)
- organization (varchar)
- start_date (date)
- end_date (date)
- status (text: 'ongoing' | 'completed')
- completed_modules (integer)
- total_modules (integer)
- hours_spent (integer)
- description (text)
- approval_status (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `certificates` table
```sql
- id (uuid, primary key)
- student_id (uuid, foreign key to students)
- training_id (uuid, foreign key to trainings) -- Links certificate to training
- title (varchar)
- issuer (varchar)
- level (varchar) -- Dynamically assigned: Beginner/Intermediate/Advanced/Expert
- issued_on (date)
- link (text) -- Certificate URL
- description (text)
- approval_status (varchar)
- enabled (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `skills` table
```sql
- id (uuid, primary key)
- student_id (uuid, foreign key to students)
- training_id (uuid, foreign key to trainings) -- Links skill to training
- name (varchar)
- type (varchar: 'technical' | 'soft')
- level (integer: 1-5) -- Calculated from assessment score
- approval_status (varchar)
- enabled (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

## Component Architecture

### 1. **AddTrainingCourseModal.jsx**
Main modal component for adding training courses.

**Props:**
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Callback when modal closes
- `studentId` (uuid): Current student's ID
- `onSuccess` (function): Callback after successful submission

**Key Functions:**
- `handleInputChange()`: Manages form state and detects external organizations
- `generateAssessmentQuestions()`: Creates skill-based assessment questions
- `calculateScore()`: Computes assessment score and assigns certificate level
- `handleSubmit()`: Saves training, certificate, and skills to database

**State Management:**
```javascript
- formData: Training course details
- isExternal: Boolean flag for external organization
- showAssessment: Toggle assessment view
- assessmentQuestions: Generated questions array
- currentAnswers: User's assessment responses
- assessmentScore: Calculated score (0-100)
- certificateLevel: Assigned level (Beginner/Intermediate/Advanced/Expert)
```

### 2. **TrainingCoursesSection.jsx**
Display component for listing all training courses.

**Props:**
- `studentId` (uuid): Current student's ID

**Features:**
- Lists all training courses with progress tracking
- Shows certificate badges with levels
- Progress bars for ongoing courses
- Links to view certificates
- Empty state with call-to-action

## User Flow

### Adding a Training Course

1. **Student clicks "Add Training" button**
   - Modal opens with form

2. **Student fills in course details:**
   - Course name (required)
   - Provider/Organization
   - Start/End dates
   - Status (Ongoing/Completed)
   - Modules completed/total
   - Hours spent
   - Certificate URL (optional)
   - Skills covered (comma-separated)
   - Description

3. **System checks organization:**
   - If known provider (Coursera, Udemy, etc.): Proceed to save
   - If external/unknown: Trigger assessment flow

4. **Assessment Flow (for external certificates):**
   - System generates questions based on skills covered
   - Student rates proficiency for each skill
   - Student clicks "Calculate Score"
   - System displays score and assigned certificate level
   - Student confirms and saves

5. **Data saved to database:**
   - Training record created
   - Certificate record created (if URL provided) with level
   - Skills records created with calculated proficiency levels

## Integration Guide

### Step 1: Import Components

```javascript
import TrainingCoursesSection from './components/Students/components/TrainingCoursesSection';
```

### Step 2: Add to Student Profile/Activities Page

```javascript
function StudentActivities() {
  const { studentId } = useAuth(); // Get current student ID

  return (
    <div className="space-y-6">
      {/* Other sections */}
      <TrainingCoursesSection studentId={studentId} />
    </div>
  );
}
```

### Step 3: Ensure Supabase Client is Configured

```javascript
// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

## Customization Options

### 1. **Add More Known Organizations**

In `AddTrainingCourseModal.jsx`, update the `knownOrganizations` array:

```javascript
const knownOrganizations = [
  'Coursera', 'Udemy', 'edX', 'LinkedIn Learning', 'Pluralsight',
  'Udacity', 'Khan Academy', 'FreeCodeCamp', 'Codecademy',
  // Add more here
  'Your Organization Name'
];
```

### 2. **Customize Assessment Questions**

Modify the `generateAssessmentQuestions()` function to:
- Add more question types (multiple choice, true/false)
- Integrate with AI for dynamic question generation
- Pull questions from a question bank API

### 3. **Adjust Level Thresholds**

In `calculateScore()` function, modify the score ranges:

```javascript
if (avgScore >= 90) level = 'Expert';      // Changed from 85
else if (avgScore >= 75) level = 'Advanced'; // Changed from 70
else if (avgScore >= 55) level = 'Intermediate'; // Changed from 50
else level = 'Beginner';
```

### 4. **Add More Assessment Metrics**

Extend the assessment to include:
- Time-based questions
- Practical coding challenges
- Portfolio review
- Peer validation

## API Endpoints (Future Enhancement)

Consider creating Edge Functions for:

### 1. **AI-Powered Question Generation**
```javascript
// supabase/functions/generate-assessment/index.ts
export async function generateAssessment(skills: string[]) {
  // Use OpenAI/Claude to generate relevant questions
  // Return structured question array
}
```

### 2. **Certificate Verification**
```javascript
// supabase/functions/verify-certificate/index.ts
export async function verifyCertificate(url: string) {
  // Scrape certificate page
  // Verify authenticity
  // Return verification status
}
```

### 3. **Skill Level Recommendation**
```javascript
// supabase/functions/recommend-level/index.ts
export async function recommendLevel(answers: object, skills: string[]) {
  // Advanced ML-based level recommendation
  // Consider multiple factors
  // Return recommended level with confidence score
}
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Ensure students can only add/edit their own trainings
   - Implement proper RLS policies on all tables

2. **Input Validation**
   - Validate URLs before saving
   - Sanitize text inputs
   - Limit file upload sizes

3. **Assessment Integrity**
   - Consider time limits for assessments
   - Randomize question order
   - Implement anti-cheating measures

## Testing Checklist

- [ ] Add training with known organization (no assessment)
- [ ] Add training with external organization (triggers assessment)
- [ ] Complete assessment and verify level assignment
- [ ] Add training without certificate URL
- [ ] Add multiple skills and verify all are saved
- [ ] Check progress calculation accuracy
- [ ] Verify certificate links open correctly
- [ ] Test empty state display
- [ ] Test loading states
- [ ] Test error handling

## Future Enhancements

1. **Gamification**
   - Badges for completing assessments
   - Leaderboards for skill levels
   - Achievement system

2. **Social Features**
   - Share certificates on social media
   - Peer endorsements
   - Skill verification by mentors

3. **Analytics**
   - Track learning patterns
   - Recommend courses based on career goals
   - Skill gap analysis

4. **Integration**
   - Auto-import from LinkedIn Learning
   - Sync with Coursera/Udemy accounts
   - Export to resume builders

## Support & Troubleshooting

### Common Issues

**Issue**: Assessment not triggering for external organization
- **Solution**: Check if organization name matches known providers list

**Issue**: Certificate level not saving
- **Solution**: Ensure assessment is completed before final submission

**Issue**: Skills not appearing
- **Solution**: Verify skills are comma-separated and not empty

**Issue**: Progress bar not updating
- **Solution**: Check that total_modules > 0

## Conclusion

This feature provides a comprehensive solution for tracking training courses with intelligent assessment for external certifications. The dynamic level assignment ensures that certificates accurately reflect the student's proficiency, adding credibility to their profile.

For questions or contributions, please refer to the project documentation or contact the development team.
