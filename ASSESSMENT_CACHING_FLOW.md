# Assessment Question Caching Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT STARTS ASSESSMENT                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: AssessmentStart.jsx                                   │
│  - Student clicks "Start Assessment"                             │
│  - Calls: POST /api/assessment/generate                          │
│    Body: { courseName, level, questionCount }                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend: assessment.js                                          │
│  Step 1: Check Cache                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SELECT * FROM generated_external_assessment                │ │
│  │ WHERE certificate_name = 'SQL Basic'                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
         Found? │                   │ Not Found?
                ▼                   ▼
    ┌───────────────────┐   ┌──────────────────────┐
    │  CACHE HIT ✅     │   │  CACHE MISS ❌       │
    │  Return cached    │   │  Generate new        │
    │  questions        │   │  questions           │
    │  (~100ms)         │   │                      │
    └─────────┬─────────┘   └──────────┬───────────┘
              │                        │
              │                        ▼
              │             ┌──────────────────────┐
              │             │ Call Claude AI API   │
              │             │ (~2-5 seconds)       │
              │             └──────────┬───────────┘
              │                        │
              │                        ▼
              │             ┌──────────────────────┐
              │             │ Process & Validate   │
              │             │ Questions            │
              │             └──────────┬───────────┘
              │                        │
              │                        ▼
              │             ┌──────────────────────────────┐
              │             │ INSERT INTO                  │
              │             │ generated_external_assessment│
              │             │ (Save for future)            │
              │             └──────────┬───────────────────┘
              │                        │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Return Questions      │
              │  to Frontend           │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Frontend Receives     │
              │  Questions             │
              │  - Navigate to test    │
              │  - Display questions   │
              └────────────────────────┘
```

## Database Tables

### generated_external_assessment (Master Questions)
```
┌──────────────────────────────────────────────────────────┐
│ generated_external_assessment                             │
├──────────────────┬───────────────────────────────────────┤
│ certificate_name │ questions (JSONB)                     │
├──────────────────┼───────────────────────────────────────┤
│ SQL Basic        │ [{id:1, question:"...", ...}, ...]    │
│ Python Basics    │ [{id:1, question:"...", ...}, ...]    │
│ JavaScript       │ [{id:1, question:"...", ...}, ...]    │
└──────────────────┴───────────────────────────────────────┘
         ▲
         │ Shared by all students
         │
```

### external_assessment_attempts (Student Attempts)
```
┌──────────────────────────────────────────────────────────┐
│ external_assessment_attempts                              │
├────────────┬──────────────┬──────────────────────────────┤
│ student_id │ course_name  │ student_answers              │
├────────────┼──────────────┼──────────────────────────────┤
│ student-1  │ SQL Basic    │ [0, 2, 1, ...]               │
│ student-2  │ SQL Basic    │ [1, 2, 3, ...]               │
│ student-3  │ Python Basic │ [2, 0, 1, ...]               │
└────────────┴──────────────┴──────────────────────────────┘
         ▲
         │ Individual student data
         │
```

## Performance Comparison

### Before Caching
```
Student 1: Generate → 3000ms
Student 2: Generate → 3000ms
Student 3: Generate → 3000ms
Total: 9000ms (3 API calls)
```

### After Caching
```
Student 1: Generate → 3000ms (cache miss)
Student 2: Fetch    → 100ms  (cache hit)
Student 3: Fetch    → 100ms  (cache hit)
Total: 3200ms (1 API call)
```

**Savings: 64% faster, 67% fewer API calls**

## Key Points

1. **First Student**: Pays the cost of generation (~3 seconds)
2. **Subsequent Students**: Get instant results (~100ms)
3. **Same Questions**: All students get identical questions for fair comparison
4. **Cost Efficient**: Claude AI API called only once per certificate
5. **Automatic**: No manual intervention needed

## Regenerating Questions

If you need to update questions for a certificate:

```sql
-- Delete cached questions
DELETE FROM generated_external_assessment 
WHERE certificate_name = 'SQL Basic';

-- Next student will trigger fresh generation
```

## Monitoring

```sql
-- View all cached certificates
SELECT 
  certificate_name,
  assessment_level,
  total_questions,
  generated_at,
  generated_by
FROM generated_external_assessment
ORDER BY generated_at DESC;

-- Check if specific certificate is cached
SELECT EXISTS (
  SELECT 1 FROM generated_external_assessment 
  WHERE certificate_name = 'SQL Basic'
) as is_cached;
```
