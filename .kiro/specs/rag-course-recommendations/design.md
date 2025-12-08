# Design Document: RAG-Based Course Recommendations

## Overview

This feature implements a Retrieval-Augmented Generation (RAG) system to recommend platform courses based on student assessment results. The system generates vector embeddings for courses and student profiles, performs semantic similarity searches, and integrates recommendations into the assessment results UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Assessment Flow                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Student    │───▶│   Gemini     │───▶│  Assessment Results  │  │
│  │  Assessment  │    │   Analysis   │    │  (skill gaps, etc.)  │  │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                      │              │
│                                                      ▼              │
│                                          ┌──────────────────────┐  │
│                                          │  Profile Embedding   │  │
│                                          │     Generation       │  │
│                                          └──────────┬───────────┘  │
│                                                      │              │
│                                                      ▼              │
│  ┌──────────────┐                        ┌──────────────────────┐  │
│  │   Courses    │◀──────────────────────▶│   Vector Similarity  │  │
│  │  (embedded)  │                        │       Search         │  │
│  └──────────────┘                        └──────────┬───────────┘  │
│                                                      │              │
│                                                      ▼              │
│                                          ┌──────────────────────┐  │
│                                          │  Ranked Course       │  │
│                                          │  Recommendations     │  │
│                                          └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Embedding Service (`src/services/embeddingService.js`)

```javascript
interface EmbeddingService {
  // Generate embedding for a single text
  generateEmbedding(text: string): Promise<number[]>;
  
  // Generate embeddings for multiple texts (batch)
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  
  // Calculate cosine similarity between two embeddings
  cosineSimilarity(embedding1: number[], embedding2: number[]): number;
}
```

### 2. Course Recommendation Service (`src/services/courseRecommendationService.js`)

```javascript
interface CourseRecommendationService {
  // Get recommended courses for assessment results
  getRecommendedCourses(assessmentResults: AssessmentResults): Promise<RecommendedCourse[]>;
  
  // Get courses for a specific skill gap
  getCoursesForSkillGap(skillGap: SkillGap): Promise<RecommendedCourse[]>;
  
  // Build student profile text from assessment results
  buildProfileText(assessmentResults: AssessmentResults): string;
  
  // Fetch courses with embeddings from database
  fetchCoursesWithEmbeddings(): Promise<Course[]>;
}
```

### 3. Course Embedding Manager (`src/services/courseEmbeddingManager.js`)

```javascript
interface CourseEmbeddingManager {
  // Generate and store embedding for a single course
  embedCourse(courseId: string): Promise<void>;
  
  // Batch embed all courses without embeddings
  embedAllCourses(): Promise<{ success: number, failed: number }>;
  
  // Build embeddable text from course data
  buildCourseText(course: Course): string;
}
```

### 4. UI Components

- `RecommendedCoursesSection.jsx` - Main section in roadmap
- `CourseRecommendationCard.jsx` - Individual course card
- `SkillGapCourses.jsx` - Courses grouped by skill gap

## Data Models

### Course Embedding Schema (Database Update)

```sql
-- Add embedding column to courses table if not exists
ALTER TABLE courses ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS courses_embedding_idx 
ON courses USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### RecommendedCourse Interface

```typescript
interface RecommendedCourse {
  course_id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  category: string;
  skills: string[];
  target_outcomes: string[];
  relevance_score: number;      // 0-100
  match_reasons: string[];      // Why this course matches
  skill_gaps_addressed: string[]; // Which skill gaps it helps
}
```

### StudentProfile Interface

```typescript
interface StudentProfile {
  skill_gaps: {
    priorityA: Array<{ skill: string; currentLevel: number; targetLevel: number }>;
    priorityB: Array<{ skill: string }>;
  };
  career_clusters: Array<{
    title: string;
    fit: string;
    domains: string[];
  }>;
  employability: {
    improvementAreas: string[];
    strengthAreas: string[];
  };
  riasec_code: string;
  stream: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Embedding Generation Consistency
*For any* course with title, description, and skills, generating an embedding twice with the same input SHALL produce identical vectors.
**Validates: Requirements 1.1, 1.2**

### Property 2: Embedding Persistence
*For any* course that undergoes embedding generation, the embedding SHALL be retrievable from the database with the correct dimension (768).
**Validates: Requirements 1.3**

### Property 3: Profile Text Completeness
*For any* valid assessment result containing skill gaps and career clusters, the generated profile text SHALL contain all priority skill gap names and at least the top career cluster title.
**Validates: Requirements 2.1, 2.2**

### Property 4: Similarity Search Result Limit
*For any* student profile embedding, the vector similarity search SHALL return at most 10 courses.
**Validates: Requirements 3.2**

### Property 5: Active Course Filter
*For any* similarity search result set, all returned courses SHALL have status equal to 'Active'.
**Validates: Requirements 3.3**

### Property 6: Relevance Score Bounds
*For any* recommended course, the relevance_score SHALL be a number between 0 and 100 inclusive.
**Validates: Requirements 3.4**

### Property 7: Skill Gap Course Limit
*For any* skill gap displayed in the UI, the number of associated courses SHALL be between 0 and 3 inclusive.
**Validates: Requirements 5.1**

### Property 8: Course Card Data Completeness
*For any* recommended course displayed, the rendered output SHALL contain the course title, duration, at least one skill, and a numeric match percentage.
**Validates: Requirements 4.2**

### Property 9: Batch Processing Resilience
*For any* batch of courses being embedded where some fail, the successful embeddings SHALL still be persisted and the failure count SHALL equal the number of actual failures.
**Validates: Requirements 1.5**

### Property 10: Rate Limit Retry
*For any* embedding request that receives a rate limit response, the system SHALL retry with exponential backoff and eventually succeed or fail gracefully after max retries.
**Validates: Requirements 6.1**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Embedding API rate limit | Exponential backoff (1s, 2s, 4s, 8s), max 4 retries |
| Embedding API unavailable | Fall back to keyword-based matching using course_skills table |
| No matching courses found | Return empty array with `noMatchesMessage` field |
| Invalid assessment results | Return empty recommendations, log warning |
| Database connection error | Throw error, let UI show error state |
| Embedding dimension mismatch | Log error, skip course, continue processing |

## Testing Strategy

### Unit Tests
- Embedding service: mock API responses, test retry logic
- Profile text builder: verify all required fields included
- Similarity calculation: test with known vectors
- Course filtering: verify active-only filter

### Property-Based Tests (using fast-check)
- **Property 1**: Generate embeddings for random course data, verify consistency
- **Property 4**: Generate random profiles, verify result count ≤ 10
- **Property 5**: Insert mix of active/inactive courses, verify filter
- **Property 6**: Generate recommendations, verify score bounds
- **Property 7**: Generate skill gaps, verify course count per gap

### Integration Tests
- End-to-end: assessment completion → course recommendations displayed
- Database: embedding storage and retrieval
- Fallback: API failure → keyword matching

### Test Framework
- **Property-based testing**: `fast-check` library for JavaScript
- **Unit testing**: `vitest`
- **Minimum iterations**: 100 per property test
