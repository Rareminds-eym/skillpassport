# External Course Assessment Flow

## Overview
When students add courses from external platforms (non-recognized organizations), they must complete a skill assessment to verify their proficiency and receive an appropriate certificate level.

## Flow Steps

### 1. Add External Course
- User clicks "Add External Course" button in SelectCourseModal
- AddLearningCourseModal opens with external course form

### 2. Fill Course Details
User provides:
- Course Name (required)
- Provider (e.g., Coursera, Udemy)
- Organization (issuing organization)
- Start/End dates
- Status (Ongoing/Completed)
- Modules completed/total
- Hours spent
- Certificate URL (optional)
- **Skills Covered** (comma-separated, triggers assessment)
- Description

### 3. External Platform Detection
The system automatically detects if the course is from an external platform by checking:
- If organization/provider is NOT in the known organizations list:
  - Coursera, Udemy, edX, LinkedIn Learning, Pluralsight, Udacity, Khan Academy, FreeCodeCamp, Codecademy

### 4. Assessment Trigger
When user clicks submit:
- **IF** course is from external platform
- **AND** skills are provided
- **AND** no assessment has been completed yet
- **THEN** show assessment UI instead of saving

### 5. Assessment UI
- Shows skill-based questions (up to 5 skills)
- Each question asks user to rate proficiency: Beginner, Intermediate, Advanced, Expert
- User selects proficiency level for each skill
- Click "Calculate Score" to get results

### 6. Score Calculation
- Beginner = 25 points
- Intermediate = 50 points
- Advanced = 75 points
- Expert = 100 points
- Average score determines certificate level:
  - 85%+ = Expert
  - 70-84% = Advanced
  - 50-69% = Intermediate
  - Below 50% = Beginner

### 7. Save with Certificate Level
- After assessment, user clicks "Complete & Save"
- System creates:
  - Training record in `trainings` table
  - Certificate record in `certificates` table (with level)
  - Skill records in `skills` table (with proficiency level)

## UI Indicators

### Warning Message
When external course with skills is detected:
```
⚠️ Assessment Required
Since this is from an external platform, you'll need to complete a skill 
assessment to verify your proficiency. Click "Continue to Assessment" to proceed.
```

### Button States
- Before assessment: "Continue to Assessment"
- During assessment: "Calculate Score" → "Complete & Save"
- Normal save: "Add Learning"

## Database Integration

### Tables Updated
1. **trainings** - Main course record
2. **certificates** - Certificate with level (if URL provided)
3. **skills** - Individual skills with proficiency levels

### Automatic Skill Mapping
The database migration includes triggers that automatically:
- Create skill records when training is added
- Map skills to student profile
- Update proficiency levels based on assessment

## Known Organizations (No Assessment Required)
These platforms are trusted and don't require assessment:
- Coursera
- Udemy
- edX
- LinkedIn Learning
- Pluralsight
- Udacity
- Khan Academy
- FreeCodeCamp
- Codecademy

## Testing the Flow

1. Click "Add Learning" → "Add External Course"
2. Fill in course name: "Advanced React Patterns"
3. Provider: "Random Online Academy" (not in known list)
4. Skills: "React, Hooks, Context API, Performance"
5. Click submit → Assessment UI should appear
6. Rate each skill proficiency
7. Click "Calculate Score" → See score and level
8. Click "Complete & Save" → Course added with certificate level
