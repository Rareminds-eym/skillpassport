# Assessment Questions Caching System

## Overview
Questions are now cached per certificate to avoid regenerating them for every student. Once generated, all students taking the same certificate assessment will receive the same questions.

## How It Works

### 1. Database Schema
**New Table: `generated_external_assessment`**
- Stores master questions for each certificate
- One row per certificate name
- Questions stored as JSONB array
- Shared across all students

### 2. Backend Flow
When `/api/assessment/generate` is called:

1. **Check Cache First**
   - Query `generated_external_assessment` table for the certificate name
   - If found → Return cached questions immediately
   - If not found → Generate new questions

2. **Generate Questions** (only if not cached)
   - Call Claude AI API to generate course-specific questions
   - Validate and process questions
   - Save to `generated_external_assessment` table
   - Return questions to frontend

3. **Student Attempts**
   - Each student's attempt is stored in `external_assessment_attempts`
   - Contains their answers, progress, and score
   - References the same questions from `generated_external_assessment`

### 3. Benefits
✅ **Cost Savings**: Claude AI API called only once per certificate
✅ **Consistency**: All students get the same questions for fair comparison
✅ **Performance**: Instant question retrieval from database
✅ **Reliability**: No API failures for subsequent students

## Database Setup

Run the migration:
```bash
setup-certificate-questions.bat
```

Or manually:
```bash
psql -h <host> -p <port> -d postgres -U <user> -f database/create_certificate_questions_table.sql
```

## API Response

### Cached Response
```json
{
  "course": "SQL Basic",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [...],
  "cached": true
}
```

### Newly Generated Response
```json
{
  "course": "SQL Basic",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [...]
}
```

## Frontend Changes
No changes needed! The frontend continues to work the same way:
- Calls `/api/assessment/generate`
- Receives questions (cached or new)
- Displays assessment to student

## Monitoring

Check if questions exist for a certificate:
```sql
SELECT certificate_name, generated_at, total_questions 
FROM generated_external_assessment 
WHERE certificate_name = 'SQL Basic';
```

View all cached certificates:
```sql
SELECT certificate_name, assessment_level, total_questions, generated_at 
FROM generated_external_assessment 
ORDER BY generated_at DESC;
```

## Regenerating Questions

To regenerate questions for a certificate (e.g., to update difficulty):
```sql
DELETE FROM generated_external_assessment 
WHERE certificate_name = 'SQL Basic';
```

Next student will trigger fresh generation.

## Notes
- Questions are randomized per student (option order)
- Question IDs remain consistent across students
- First student may experience slight delay (AI generation)
- Subsequent students get instant response
