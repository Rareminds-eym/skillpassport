# Assessment Generation Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT CLICKS                           │
│              "Assessment" Button on Course                  │
│                 (e.g., "React Development")                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ModernLearningCard.jsx                         │
│  navigate("/student/assessment/dynamic", {                 │
│    state: {                                                 │
│      courseName: "React Development",                       │
│      level: "Intermediate",                                 │
│      courseId: 123                                          │
│    }                                                        │
│  })                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DynamicAssessment.jsx                          │
│  - Receives course name from location.state                │
│  - Shows loading screen                                     │
│  - Calls loadAssessment()                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Check Cache First                              │
│  getCachedAssessment("React Development")                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Cache Found       Cache Not Found
                │                 │
                ▼                 ▼
    ┌───────────────────┐  ┌──────────────────────────────┐
    │  Use Cached       │  │  Generate New Assessment     │
    │  Questions        │  │  generateAssessment()        │
    │  (Instant Load)   │  │                              │
    └───────┬───────────┘  └──────────┬───────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────────────┐
            │              │  Build AI Prompt             │
            │              │  - Course: React Development │
            │              │  - Level: Intermediate       │
            │              │  - Questions: 15             │
            │              │  - Emphasis: Course-specific │
            │              └──────────┬───────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────────────┐
            │              │  Call OpenRouter API         │
            │              │  Model: Claude 3.5 Sonnet    │
            │              │  Temperature: 0.7            │
            │              │  Max Tokens: 4000            │
            │              └──────────┬───────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────────────┐
            │              │  AI Generates Questions      │
            │              │  {                           │
            │              │    "course": "React Dev",    │
            │              │    "questions": [            │
            │              │      {                       │
            │              │        "question": "What is  │
            │              │         useEffect in React?" │
            │              │      }                       │
            │              │    ]                         │
            │              │  }                           │
            │              └──────────┬───────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────────────┐
            │              │  Validate Response           │
            │              │  - Check structure           │
            │              │  - Verify question count     │
            │              │  - Validate fields           │
            │              └──────────┬───────────────────┘
            │                         │
            │                         ▼
            │              ┌──────────────────────────────┐
            │              │  Cache for Future Use        │
            │              │  Key: assessment_react_dev   │
            │              │  Expires: 7 days             │
            │              └──────────┬───────────────────┘
            │                         │
            └─────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Display Assessment UI                          │
│  - Show course name                                         │
│  - Display questions one by one                             │
│  - Track progress                                           │
│  - Record answers                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Student Completes Assessment                   │
│  - Calculate score                                          │
│  - Show results                                             │
│  - Offer retake option                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Decision Points

### 1. Cache Check
```
Is assessment cached?
├─ YES → Load instantly (< 1 second)
└─ NO  → Generate new (10-20 seconds)
```

### 2. Course Name Validation
```
Is course name specific?
├─ YES ("React Development") → Generate specific questions
└─ NO  ("Course 1")          → May generate generic questions
```

### 3. API Response
```
Is response valid JSON?
├─ YES → Parse and validate
└─ NO  → Clean up and retry parse
```

### 4. Validation
```
Are all fields present?
├─ YES → Cache and display
└─ NO  → Show error, offer retry
```

---

## Data Flow

### Input (from ModernLearningCard)
```javascript
{
  courseName: "React Development",
  level: "Intermediate",
  courseId: 123
}
```

### AI Prompt (generated)
```
You are an expert assessment creator specializing in React Development.
Generate ONLY valid JSON without any markdown formatting.
Every question must be specifically about React Development.

CRITICAL REQUIREMENTS:
1. ALL questions MUST be directly related to React Development
2. Questions should test practical knowledge of React Development
...
```

### AI Response (expected)
```json
{
  "course": "React Development",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "What is the primary purpose of useEffect in React?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "skill_tag": "React Hooks"
    }
  ]
}
```

### Cached Data (stored)
```json
{
  "course": "React Development",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [...],
  "cachedAt": "2024-01-15T10:30:00.000Z"
}
```

### Output (displayed to user)
```
┌─────────────────────────────────────┐
│  Question 1 of 15                   │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░  7%  │
├─────────────────────────────────────┤
│  🎯 React Development               │
│     Level: Intermediate             │
├─────────────────────────────────────┤
│  [1] What is the primary purpose    │
│      of useEffect in React?         │
│                                     │
│  🏷️ React Hooks                     │
│                                     │
│  ○ To manage component state        │
│  ● To perform side effects          │
│  ○ To create new components         │
│  ○ To handle user events            │
└─────────────────────────────────────┘
```

---

## Error Handling Flow

```
API Call
  │
  ├─ Success → Parse JSON → Validate → Display
  │
  ├─ Network Error → Show error → Offer retry
  │
  ├─ Invalid JSON → Clean up → Retry parse → Display or error
  │
  ├─ Validation Failed → Show specific errors → Offer retry
  │
  └─ API Key Missing → Show setup instructions → Link to docs
```

---

## Cache Management

### Cache Key Format
```
assessment_{course_name_lowercase_with_underscores}

Examples:
- "React Development" → assessment_react_development
- "Python Programming" → assessment_python_programming
- "Digital Marketing" → assessment_digital_marketing
```

### Cache Lifecycle
```
Generate → Cache (7 days) → Expire → Regenerate
           ↓
      Load instantly
      on next visit
```

### Cache Operations
```javascript
// Store
localStorage.setItem('assessment_react_development', JSON.stringify(data));

// Retrieve
const cached = localStorage.getItem('assessment_react_development');

// Clear specific
localStorage.removeItem('assessment_react_development');

// Clear all
localStorage.clear();
```

---

## Performance Metrics

### First Load (No Cache)
```
Click Assessment → 10-20 seconds → Display Questions
                   ↓
                API Call + Generation
```

### Subsequent Loads (Cached)
```
Click Assessment → < 1 second → Display Questions
                   ↓
                Load from Cache
```

### Cache Hit Rate
```
Expected: 90%+ after first generation
- First visit: Cache miss (generate)
- Next 7 days: Cache hit (instant)
- After 7 days: Cache miss (regenerate)
```

---

## Summary

The flow ensures:
1. ✅ Course-specific questions every time
2. ✅ Fast loading with cache
3. ✅ Robust error handling
4. ✅ Clear user feedback
5. ✅ Easy debugging with logs

**Result:** Smooth, fast, course-specific assessments! 🚀
