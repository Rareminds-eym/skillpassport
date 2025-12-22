# Assessment Database Setup

## Changes Made

### 1. ✅ Increased Question Difficulty
- **Easy (Q1-5):** Conceptual understanding, not just recall (45-60s each)
- **Medium (Q6-10):** Multi-step problem-solving, code analysis (75-90s each)
- **Hard (Q11-15):** Advanced optimization, edge cases (100-120s each)

### 2. ✅ Created Database Table
**File:** `database/create_assessment_attempts_table.sql`

## Database Table Structure

```sql
assessment_attempts
├── id (UUID, Primary Key)
├── student_id (UUID, Foreign Key → students)
├── course_name (TEXT) - e.g., "React Development"
├── course_id (UUID, nullable)
├── assessment_level (TEXT) - Beginner/Intermediate/Advanced
├── total_questions (INTEGER) - Default 15
├── questions (JSONB) - All questions with answers
├── student_answers (JSONB) - Student's submitted answers
├── score (INTEGER) - Percentage 0-100
├── correct_answers (INTEGER) - Number correct
├── time_taken (INTEGER) - Total seconds
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
└── difficulty_breakdown (JSONB) - Performance by level
```

## Setup Instructions

### Step 1: Run the Migration

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `database/create_assessment_attempts_table.sql`
4. Run the SQL

**Option B: Using Supabase CLI**
```bash
supabase db push
```

### Step 2: Verify Table Created
```sql
SELECT * FROM assessment_attempts LIMIT 1;
```

## Data Structure Examples

### Questions JSONB Format:
```json
[
  {
    "id": 1,
    "text": "What is the purpose of useEffect in React?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "B",
    "difficulty": "easy",
    "skill_tag": "React Hooks",
    "estimated_time": 50
  }
]
```

### Student Answers JSONB Format:
```json
[
  {
    "question_id": 1,
    "selected_answer": "B",
    "is_correct": true,
    "time_taken": 45
  }
]
```

### Difficulty Breakdown JSONB Format:
```json
{
  "easy": {
    "total": 5,
    "correct": 4,
    "percentage": 80
  },
  "medium": {
    "total": 5,
    "correct": 3,
    "percentage": 60
  },
  "hard": {
    "total": 5,
    "correct": 2,
    "percentage": 40
  }
}
```

## Security (RLS Policies)

✅ **Students:** Can only view/insert their own attempts
✅ **Educators:** Can view attempts of their students
✅ **Admins:** Can view all attempts

## Indexes Created

- `student_id` - Fast lookup by student
- `course_name` - Fast lookup by course
- `completed_at` - Fast sorting by date
- `score` - Fast filtering by score

## Query Examples

### Get Student's Assessment History
```sql
SELECT 
  course_name,
  score,
  correct_answers,
  total_questions,
  completed_at
FROM assessment_attempts
WHERE student_id = 'student-uuid'
ORDER BY completed_at DESC;
```

### Get Average Score by Course
```sql
SELECT 
  course_name,
  AVG(score) as avg_score,
  COUNT(*) as attempts
FROM assessment_attempts
GROUP BY course_name
ORDER BY avg_score DESC;
```

### Get Performance by Difficulty
```sql
SELECT 
  course_name,
  difficulty_breakdown
FROM assessment_attempts
WHERE student_id = 'student-uuid'
ORDER BY completed_at DESC
LIMIT 1;
```

## Next Steps

### 1. Update Frontend to Save Results
After assessment completion, save to database:
```javascript
const saveAssessmentAttempt = async (attemptData) => {
  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      student_id: studentId,
      course_name: courseName,
      questions: questions,
      student_answers: answers,
      score: scorePercentage,
      correct_answers: correctCount,
      time_taken: totalTime,
      difficulty_breakdown: breakdown
    });
};
```

### 2. Create Assessment History Page
Show students their past attempts:
- List of all attempts
- Score trends
- Performance by difficulty
- Time to complete

### 3. Create Analytics Dashboard
For educators/admins:
- Average scores by course
- Most difficult questions
- Student performance trends
- Time analysis

## Benefits

✅ **Track Progress:** See improvement over time
✅ **Identify Weaknesses:** Know which topics need work
✅ **Prevent Cheating:** Store questions and answers
✅ **Analytics:** Rich data for insights
✅ **Audit Trail:** Complete history of attempts

## Summary

- ✅ Questions are now more challenging
- ✅ Database table created for storing attempts
- ✅ Secure with RLS policies
- ✅ Optimized with indexes
- ✅ Ready for frontend integration

**Next:** Run the SQL migration and integrate with frontend!
