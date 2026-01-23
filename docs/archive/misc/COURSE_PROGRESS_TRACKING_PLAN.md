# Technical Design Document
## Course Progress Tracking & Session Restoration System

| Document Info | |
|---------------|---|
| **Version** | 1.0 |
| **Status** | Draft |
| **Author** | Engineering Team |
| **Created** | December 23, 2025 |
| **Last Updated** | December 23, 2025 |
| **Reviewers** | Product, Backend, Frontend |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [Current State Analysis](#3-current-state-analysis)
4. [Proposed Solution](#4-proposed-solution)
5. [Technical Architecture](#5-technical-architecture)
6. [Database Design](#6-database-design)
7. [API Specifications](#7-api-specifications)
8. [Frontend Implementation](#8-frontend-implementation)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Security Considerations](#10-security-considerations)
11. [Performance Considerations](#11-performance-considerations)
12. [Testing Strategy](#12-testing-strategy)
13. [Rollout Plan](#13-rollout-plan)
14. [Risk Assessment](#14-risk-assessment)
15. [Success Metrics](#15-success-metrics)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

### 1.1 Purpose
This document defines the technical design for implementing comprehensive course progress tracking with session restoration capabilities in the learning management platform.

### 1.2 Scope
- Track granular learning progress at video, lesson, module, and course levels
- Enable seamless session restoration when students return to courses
- Support cross-device progress synchronization
- Provide analytics-ready progress data for reporting

### 1.3 Goals
| Goal | Description | Success Criteria |
|------|-------------|------------------|
| **Continuity** | Students resume exactly where they left off | < 2 seconds to restore position |
| **Accuracy** | Track progress with high precision | 99.9% data accuracy |
| **Performance** | Minimal impact on user experience | < 100ms for progress saves |
| **Reliability** | No progress data loss | Zero data loss incidents |


---

## 2. Business Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR-001 | Track video playback position | P0 | As a student, I want to resume videos from where I stopped |
| FR-002 | Track lesson completion status | P0 | As a student, I want to see which lessons I've completed |
| FR-003 | Auto-restore last session | P0 | As a student, I want to continue from my last position automatically |
| FR-004 | Track time spent per lesson | P1 | As an educator, I want to see how long students spend on each lesson |
| FR-005 | Track quiz/assessment progress | P1 | As a student, I want to resume incomplete quizzes |
| FR-006 | Cross-device synchronization | P1 | As a student, I want my progress synced across devices |
| FR-007 | Offline progress caching | P2 | As a student, I want progress saved even when offline |
| FR-008 | Progress analytics dashboard | P2 | As an admin, I want to view aggregate progress metrics |

### 2.2 Non-Functional Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-001 | Progress save latency | < 100ms | P95 response time |
| NFR-002 | Session restore time | < 2s | Time to playback position |
| NFR-003 | Data consistency | 99.99% | Audit comparison |
| NFR-004 | System availability | 99.9% | Uptime monitoring |
| NFR-005 | Concurrent users | 10,000+ | Load testing |
| NFR-006 | Data retention | 2 years | Policy compliance |

### 2.3 User Personas

**Primary: Student**
- Needs seamless learning experience
- Expects progress to persist across sessions
- Uses multiple devices (desktop, mobile, tablet)

**Secondary: Educator**
- Needs visibility into student progress
- Requires engagement metrics for course improvement
- Wants to identify struggling students

**Tertiary: Administrator**
- Needs aggregate analytics
- Requires compliance reporting
- Monitors system health

---

## 3. Current State Analysis

### 3.1 Existing Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CURRENT SCHEMA                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐                  │
│  │  course_enrollments  │         │ student_course_progress│                 │
│  ├──────────────────────┤         ├──────────────────────┤                  │
│  │ id (PK)              │         │ id (PK)              │                  │
│  │ student_id (FK)      │         │ student_id (FK)      │                  │
│  │ course_id (FK)       │         │ course_id (FK)       │                  │
│  │ progress (int 0-100) │         │ lesson_id (FK)       │                  │
│  │ completed_lessons[]  │         │ status (varchar)     │                  │
│  │ total_lessons (int)  │         │ time_spent_seconds   │                  │
│  │ status (text)        │         │ last_accessed        │                  │
│  │ last_accessed        │         │ completed_at         │                  │
│  │ completed_at         │         │ created_at           │                  │
│  │ enrolled_at          │         │ updated_at           │                  │
│  └──────────────────────┘         └──────────────────────┘                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Existing Service Layer

**File:** `src/services/courseEnrollmentService.js`

| Method | Purpose | Limitations |
|--------|---------|-------------|
| `enrollStudent()` | Creates enrollment record | No progress initialization |
| `updateProgress()` | Updates completed_lessons array | Coarse-grained tracking only |
| `getEnrollment()` | Retrieves enrollment data | No restore point data |
| `getStudentEnrollments()` | Lists all enrollments | No detailed progress |

### 3.3 Existing Frontend Implementation

**File:** `src/pages/student/CoursePlayer.jsx`

| Feature | Status | Gap |
|---------|--------|-----|
| Lesson completion tracking | ✅ Implemented | Uses string keys, not UUIDs |
| Time spent tracking | ✅ Implemented | Saves every 30s, no video position |
| Progress persistence | ✅ Implemented | No session restore on entry |
| Video position tracking | ❌ Missing | Cannot resume video playback |
| Last position restore | ❌ Missing | No auto-navigation to last lesson |

### 3.4 Gap Analysis Summary

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              GAP ANALYSIS                                   │
├────────────────────┬───────────────┬───────────────┬───────────────────────┤
│ Capability         │ Current State │ Target State  │ Gap                   │
├────────────────────┼───────────────┼───────────────┼───────────────────────┤
│ Video Position     │ Not tracked   │ Second-level  │ Schema + Logic needed │
│ Session Restore    │ Manual        │ Automatic     │ UI + Service needed   │
│ Quiz Progress      │ Not tracked   │ Per-question  │ New table + Logic     │
│ Cross-device Sync  │ Eventual      │ Near real-time│ Optimization needed   │
│ Offline Support    │ None          │ Full support  │ Service Worker needed │
│ Analytics          │ Basic         │ Comprehensive │ New queries needed    │
└────────────────────┴───────────────┴───────────────┴───────────────────────┘
```


---

## 4. Proposed Solution

### 4.1 Solution Overview

Implement a multi-layered progress tracking system that captures learning activity at granular levels and enables instant session restoration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOLUTION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌────────────┐ │
│    │   Course    │    │   Module    │    │   Lesson    │    │   Media    │ │
│    │  Progress   │───▶│  Progress   │───▶│  Progress   │───▶│  Progress  │ │
│    │   (100%)    │    │   (per)     │    │   (per)     │    │  (video)   │ │
│    └─────────────┘    └─────────────┘    └─────────────┘    └────────────┘ │
│          │                  │                  │                  │         │
│          ▼                  ▼                  ▼                  ▼         │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │                    PROGRESS TRACKING SERVICE                        │ │
│    │  • Real-time saves (debounced)                                      │ │
│    │  • Batch synchronization                                            │ │
│    │  • Conflict resolution                                              │ │
│    │  • Offline queue                                                    │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│                                      ▼                                      │
│    ┌─────────────────────────────────────────────────────────────────────┐ │
│    │                         SUPABASE DATABASE                           │ │
│    │  • course_enrollments (enhanced)                                    │ │
│    │  • student_course_progress (enhanced)                               │ │
│    │  • student_quiz_progress (new)                                      │ │
│    │  • progress_sync_queue (new - for offline)                          │ │
│    └─────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Progress save frequency | Debounced 5s for video, 30s for time | Balance between accuracy and performance |
| Storage strategy | Server-first with local cache | Ensures data persistence, enables offline |
| Conflict resolution | Last-write-wins with timestamp | Simple, predictable behavior |
| Restore UX | Modal prompt with options | Gives user control, prevents confusion |
| Video position granularity | Second-level | Sufficient precision for user experience |

### 4.3 Feature Breakdown

#### 4.3.1 Video Position Tracking
- Capture current playback position every 5 seconds (debounced)
- Save on pause, seek, and tab/window blur events
- Restore position on video load with 2-second buffer (avoid exact position issues)

#### 4.3.2 Session Restoration
- Store last active module/lesson indices in enrollment record
- On course entry, check for existing progress
- Display restoration modal with options: "Continue" or "Start Fresh"
- Auto-seek video to saved position after restoration

#### 4.3.3 Quiz Progress Tracking
- Save answers as user progresses through questions
- Track current question index for resume
- Calculate and store partial scores
- Support multiple attempts with attempt tracking

#### 4.3.4 Progress Synchronization
- Immediate save for critical events (completion, quiz submit)
- Batched save for frequent events (video position, scroll)
- Offline queue with automatic sync on reconnection
- Conflict detection and resolution for multi-device scenarios


---

## 5. Technical Architecture

### 5.1 System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND (React)                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │CoursePlayer │  │ProgressBar │  │RestoreModal │  │QuizTracker │  │    │
│  │  │   .jsx      │  │   .jsx      │  │   .jsx      │  │   .jsx     │  │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │    │
│  │         │                │                │               │          │    │
│  │         └────────────────┴────────────────┴───────────────┘          │    │
│  │                                   │                                   │    │
│  │                    ┌──────────────▼──────────────┐                   │    │
│  │                    │   courseProgressService.js  │                   │    │
│  │                    │   • saveVideoPosition()     │                   │    │
│  │                    │   • getRestorePoint()       │                   │    │
│  │                    │   • saveQuizProgress()      │                   │    │
│  │                    │   • batchSync()             │                   │    │
│  │                    └──────────────┬──────────────┘                   │    │
│  │                                   │                                   │    │
│  │                    ┌──────────────▼──────────────┐                   │    │
│  │                    │   progressSyncManager.js    │                   │    │
│  │                    │   • Debouncing              │                   │    │
│  │                    │   • Offline queue           │                   │    │
│  │                    │   • Retry logic             │                   │    │
│  │                    └──────────────┬──────────────┘                   │    │
│  └───────────────────────────────────┼──────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SUPABASE                                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │  Database   │  │  Real-time  │  │    Auth     │  │  Storage   │  │    │
│  │  │ (Postgres)  │  │ (WebSocket) │  │   (JWT)     │  │   (R2)     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Service Layer Design

```javascript
// Service Architecture

src/services/
├── courseProgressService.js      // Main progress tracking service
│   ├── VideoProgress             // Video position methods
│   ├── LessonProgress            // Lesson completion methods
│   ├── QuizProgress              // Quiz tracking methods
│   └── SessionRestore            // Restore point methods
│
├── progressSyncManager.js        // Sync orchestration
│   ├── DebounceManager           // Debounce frequent saves
│   ├── OfflineQueue              // Queue for offline saves
│   └── ConflictResolver          // Handle sync conflicts
│
└── courseEnrollmentService.js    // Existing (enhanced)
    └── + getRestorePoint()       // New method
```

### 5.3 State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE FLOW DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Action          Local State           Sync Manager         Database  │
│       │                    │                      │                   │     │
│       │  Play Video        │                      │                   │     │
│       │───────────────────▶│                      │                   │     │
│       │                    │                      │                   │     │
│       │                    │  Update Position     │                   │     │
│       │                    │─────────────────────▶│                   │     │
│       │                    │                      │                   │     │
│       │                    │                      │  Debounce (5s)    │     │
│       │                    │                      │──────────────────▶│     │
│       │                    │                      │                   │     │
│       │  Pause Video       │                      │                   │     │
│       │───────────────────▶│                      │                   │     │
│       │                    │                      │                   │     │
│       │                    │  Immediate Save      │                   │     │
│       │                    │─────────────────────▶│                   │     │
│       │                    │                      │                   │     │
│       │                    │                      │  Flush Queue      │     │
│       │                    │                      │──────────────────▶│     │
│       │                    │                      │                   │     │
│       │  Close Tab         │                      │                   │     │
│       │───────────────────▶│                      │                   │     │
│       │                    │                      │                   │     │
│       │                    │  beforeunload Save   │                   │     │
│       │                    │─────────────────────▶│                   │     │
│       │                    │                      │                   │     │
│       │                    │                      │  sendBeacon()     │     │
│       │                    │                      │──────────────────▶│     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 6. Database Design

### 6.1 Schema Changes

#### 6.1.1 Enhanced `student_course_progress` Table

```sql
-- Migration: 20251223_001_enhance_student_course_progress.sql

ALTER TABLE student_course_progress 
ADD COLUMN IF NOT EXISTS video_position_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scroll_position_percent DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS bookmarked BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN student_course_progress.video_position_seconds IS 'Last video playback position in seconds';
COMMENT ON COLUMN student_course_progress.video_duration_seconds IS 'Total video duration for percentage calculation';
COMMENT ON COLUMN student_course_progress.video_completed IS 'True if video watched >= 90%';
```

#### 6.1.2 Enhanced `course_enrollments` Table

```sql
-- Migration: 20251223_002_enhance_course_enrollments.sql

ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS last_module_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_lesson_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_lesson_id UUID,
ADD COLUMN IF NOT EXISTS last_video_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS average_session_duration INTEGER DEFAULT 0;

COMMENT ON COLUMN course_enrollments.last_module_index IS 'Index of last accessed module for restore';
COMMENT ON COLUMN course_enrollments.last_lesson_index IS 'Index of last accessed lesson within module';
COMMENT ON COLUMN course_enrollments.last_lesson_id IS 'UUID of last accessed lesson for validation';
```

#### 6.1.3 New `student_quiz_progress` Table

```sql
-- Migration: 20251223_003_create_student_quiz_progress.sql

CREATE TABLE IF NOT EXISTS student_quiz_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    lesson_id UUID NOT NULL,
    quiz_id UUID NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    
    -- Progress tracking
    answers JSONB DEFAULT '{}',
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    
    -- Scoring
    correct_answers INTEGER DEFAULT 0,
    score_percentage DECIMAL(5,2),
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    passed BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' 
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned', 'timed_out')),
    
    -- Timing
    time_limit_seconds INTEGER,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id, course_id, lesson_id, quiz_id, attempt_number)
);

-- Indexes for performance
CREATE INDEX idx_quiz_progress_student_course ON student_quiz_progress(student_id, course_id);
CREATE INDEX idx_quiz_progress_status ON student_quiz_progress(status) WHERE status = 'in_progress';
CREATE INDEX idx_quiz_progress_lookup ON student_quiz_progress(student_id, quiz_id, attempt_number);
```

#### 6.1.4 New `progress_sync_queue` Table (Offline Support)

```sql
-- Migration: 20251223_004_create_progress_sync_queue.sql

CREATE TABLE IF NOT EXISTS progress_sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sync data
    operation_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    
    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Ordering
    sequence_number BIGSERIAL
);

CREATE INDEX idx_sync_queue_pending ON progress_sync_queue(student_id, status, sequence_number) 
    WHERE status = 'pending';
```

### 6.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ERD - PROGRESS TRACKING                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐       ┌──────────────────────┐       ┌──────────────┐     │
│  │   students   │       │  course_enrollments  │       │   courses    │     │
│  ├──────────────┤       ├──────────────────────┤       ├──────────────┤     │
│  │ id (PK)      │──┐    │ id (PK)              │    ┌──│ course_id(PK)│     │
│  │ email        │  │    │ student_id (FK)      │────┘  │ title        │     │
│  │ name         │  └───▶│ course_id (FK)       │───────│ modules      │     │
│  └──────────────┘       │ progress             │       └──────────────┘     │
│         │               │ last_module_index    │              │             │
│         │               │ last_lesson_index    │              │             │
│         │               │ last_lesson_id       │              ▼             │
│         │               │ total_time_spent     │       ┌──────────────┐     │
│         │               └──────────────────────┘       │course_modules│     │
│         │                                              ├──────────────┤     │
│         │                                              │ module_id(PK)│     │
│         │                                              │ course_id(FK)│     │
│         │                                              │ title        │     │
│         │                                              └──────────────┘     │
│         │                                                     │             │
│         │                                                     ▼             │
│         │               ┌──────────────────────┐       ┌──────────────┐     │
│         │               │student_course_progress│       │   lessons    │     │
│         │               ├──────────────────────┤       ├──────────────┤     │
│         └──────────────▶│ id (PK)              │       │ lesson_id(PK)│     │
│                         │ student_id (FK)      │       │ module_id(FK)│     │
│                         │ course_id (FK)       │───────│ title        │     │
│                         │ lesson_id (FK)       │───────│ content      │     │
│                         │ video_position_secs  │       └──────────────┘     │
│                         │ video_duration_secs  │                            │
│                         │ time_spent_seconds   │                            │
│                         │ status               │                            │
│                         └──────────────────────┘                            │
│                                                                              │
│         │               ┌──────────────────────┐                            │
│         │               │ student_quiz_progress │                            │
│         │               ├──────────────────────┤                            │
│         └──────────────▶│ id (PK)              │                            │
│                         │ student_id (FK)      │                            │
│                         │ course_id (FK)       │                            │
│                         │ quiz_id (FK)         │                            │
│                         │ answers (JSONB)      │                            │
│                         │ current_question_idx │                            │
│                         │ score_percentage     │                            │
│                         │ status               │                            │
│                         └──────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Indexes Strategy

```sql
-- Performance indexes for common queries

-- Fast lookup for restore point
CREATE INDEX CONCURRENTLY idx_enrollments_restore 
ON course_enrollments(student_id, course_id, last_accessed DESC);

-- Fast lookup for lesson progress
CREATE INDEX CONCURRENTLY idx_progress_lesson_lookup 
ON student_course_progress(student_id, course_id, lesson_id);

-- Partial index for in-progress items only
CREATE INDEX CONCURRENTLY idx_progress_active 
ON student_course_progress(student_id, course_id) 
WHERE status = 'in_progress';

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY idx_progress_analytics 
ON student_course_progress(course_id, status, completed_at);
```


---

## 7. API Specifications

### 7.1 Service Interface Definition

```typescript
// Type definitions for courseProgressService

interface VideoProgress {
  lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastUpdated: Date;
}

interface LessonProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  videoProgress: VideoProgress | null;
  timeSpentSeconds: number;
  scrollPositionPercent: number;
  completedAt: Date | null;
}

interface RestorePoint {
  courseId: string;
  lastModuleIndex: number;
  lastLessonIndex: number;
  lastLessonId: string;
  lastVideoPosition: number;
  progress: number;
  lastAccessed: Date;
}

interface QuizProgress {
  quizId: string;
  attemptNumber: number;
  answers: Record<string, any>;
  currentQuestionIndex: number;
  timeSpentSeconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface CourseProgressSummary {
  courseId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  totalTimeSpent: number;
  lastAccessed: Date;
  restorePoint: RestorePoint;
  lessonProgress: LessonProgress[];
}
```

### 7.2 Service Methods

```javascript
// courseProgressService.js - Method Signatures

export const courseProgressService = {
  
  // ═══════════════════════════════════════════════════════════════════════
  // VIDEO PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Save video playback position
   * @param {string} studentId - Student UUID
   * @param {string} courseId - Course UUID
   * @param {string} lessonId - Lesson UUID
   * @param {number} positionSeconds - Current playback position
   * @param {number} durationSeconds - Total video duration
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async saveVideoPosition(studentId, courseId, lessonId, positionSeconds, durationSeconds) {},
  
  /**
   * Get saved video position for resume
   * @returns {Promise<{positionSeconds: number, durationSeconds: number} | null>}
   */
  async getVideoPosition(studentId, courseId, lessonId) {},
  
  /**
   * Mark video as completed (watched >= 90%)
   * @returns {Promise<{success: boolean}>}
   */
  async markVideoCompleted(studentId, courseId, lessonId) {},

  // ═══════════════════════════════════════════════════════════════════════
  // SESSION RESTORE METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Save current position for session restore
   * @param {number} moduleIndex - Current module index
   * @param {number} lessonIndex - Current lesson index within module
   * @param {string} lessonId - Lesson UUID for validation
   * @param {number} videoPosition - Current video position (optional)
   * @returns {Promise<{success: boolean}>}
   */
  async saveRestorePoint(studentId, courseId, moduleIndex, lessonIndex, lessonId, videoPosition = 0) {},
  
  /**
   * Get restore point for course re-entry
   * @returns {Promise<RestorePoint | null>}
   */
  async getRestorePoint(studentId, courseId) {},
  
  /**
   * Clear restore point (when user chooses "Start Fresh")
   * @returns {Promise<{success: boolean}>}
   */
  async clearRestorePoint(studentId, courseId) {},

  // ═══════════════════════════════════════════════════════════════════════
  // LESSON PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get detailed progress for a specific lesson
   * @returns {Promise<LessonProgress | null>}
   */
  async getLessonProgress(studentId, courseId, lessonId) {},
  
  /**
   * Update lesson status
   * @param {string} status - 'not_started' | 'in_progress' | 'completed'
   * @returns {Promise<{success: boolean}>}
   */
  async updateLessonStatus(studentId, courseId, lessonId, status) {},
  
  /**
   * Save scroll position in lesson content
   * @param {number} scrollPercent - Scroll position as percentage (0-100)
   * @returns {Promise<{success: boolean}>}
   */
  async saveScrollPosition(studentId, courseId, lessonId, scrollPercent) {},

  // ═══════════════════════════════════════════════════════════════════════
  // QUIZ PROGRESS METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Start or resume a quiz attempt
   * @returns {Promise<QuizProgress>}
   */
  async startQuizAttempt(studentId, courseId, lessonId, quizId, totalQuestions) {},
  
  /**
   * Save quiz answer (called on each answer)
   * @param {string} questionId - Question identifier
   * @param {any} answer - User's answer
   * @returns {Promise<{success: boolean}>}
   */
  async saveQuizAnswer(studentId, quizId, attemptNumber, questionId, answer) {},
  
  /**
   * Get in-progress quiz for resume
   * @returns {Promise<QuizProgress | null>}
   */
  async getQuizProgress(studentId, quizId) {},
  
  /**
   * Submit quiz and calculate score
   * @returns {Promise<{score: number, passed: boolean, correctAnswers: number}>}
   */
  async submitQuiz(studentId, quizId, attemptNumber) {},

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY & ANALYTICS METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get comprehensive course progress summary
   * @returns {Promise<CourseProgressSummary>}
   */
  async getCourseProgressSummary(studentId, courseId) {},
  
  /**
   * Get progress for all enrolled courses
   * @returns {Promise<CourseProgressSummary[]>}
   */
  async getAllCoursesProgress(studentId) {},

  // ═══════════════════════════════════════════════════════════════════════
  // SYNC METHODS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Batch sync multiple progress updates (for offline scenarios)
   * @param {Array} updates - Array of progress update objects
   * @returns {Promise<{synced: number, failed: number, errors: string[]}>}
   */
  async batchSyncProgress(studentId, updates) {},
  
  /**
   * Get all progress data for offline caching
   * @returns {Promise<{enrollments: any[], lessonProgress: any[], quizProgress: any[]}>}
   */
  async getProgressForOfflineCache(studentId, courseId) {}
};
```

### 7.3 Database Query Examples

```sql
-- Get restore point for a student's course
SELECT 
    ce.course_id,
    ce.last_module_index,
    ce.last_lesson_index,
    ce.last_lesson_id,
    ce.last_video_position,
    ce.progress,
    ce.last_accessed,
    c.title as course_title,
    l.title as lesson_title
FROM course_enrollments ce
JOIN courses c ON c.course_id = ce.course_id
LEFT JOIN lessons l ON l.lesson_id = ce.last_lesson_id
WHERE ce.student_id = $1 
  AND ce.course_id = $2
  AND ce.status = 'active';

-- Get detailed lesson progress with video position
SELECT 
    scp.lesson_id,
    scp.status,
    scp.video_position_seconds,
    scp.video_duration_seconds,
    scp.video_completed,
    scp.time_spent_seconds,
    scp.scroll_position_percent,
    scp.last_accessed,
    scp.completed_at,
    l.title as lesson_title,
    l.order_index
FROM student_course_progress scp
JOIN lessons l ON l.lesson_id = scp.lesson_id
WHERE scp.student_id = $1 
  AND scp.course_id = $2
ORDER BY l.order_index;

-- Get in-progress quiz for resume
SELECT 
    sqp.*,
    q.title as quiz_title,
    q.questions
FROM student_quiz_progress sqp
JOIN quizzes q ON q.quiz_id = sqp.quiz_id
WHERE sqp.student_id = $1 
  AND sqp.quiz_id = $2
  AND sqp.status = 'in_progress'
ORDER BY sqp.attempt_number DESC
LIMIT 1;
```


---

## 8. Frontend Implementation

### 8.1 Component Architecture

```
src/
├── components/
│   └── student/
│       └── courses/
│           ├── RestoreProgressModal.jsx      # Session restore prompt
│           ├── CourseProgressBar.jsx         # Enhanced progress visualization
│           ├── LessonProgressIndicator.jsx   # Per-lesson progress display
│           ├── VideoProgressTracker.jsx      # Video position tracking HOC
│           └── QuizProgressTracker.jsx       # Quiz state management
│
├── hooks/
│   ├── useVideoProgress.js                   # Video tracking hook
│   ├── useLessonProgress.js                  # Lesson tracking hook
│   ├── useSessionRestore.js                  # Restore logic hook
│   └── useProgressSync.js                    # Sync management hook
│
├── services/
│   ├── courseProgressService.js              # Main progress service
│   └── progressSyncManager.js                # Sync orchestration
│
└── pages/
    └── student/
        └── CoursePlayer.jsx                  # Enhanced with tracking
```

### 8.2 Key Component Specifications

#### 8.2.1 RestoreProgressModal.jsx

```jsx
/**
 * Modal displayed when student returns to a course with existing progress
 * 
 * Props:
 * - isOpen: boolean
 * - restorePoint: RestorePoint object
 * - courseName: string
 * - onRestore: () => void - Navigate to last position
 * - onStartFresh: () => void - Start from beginning
 * - onClose: () => void
 * 
 * Features:
 * - Shows last accessed date/time
 * - Shows progress percentage
 * - Shows last lesson name
 * - Animated entrance
 * - Keyboard accessible (Escape to close)
 */
```

#### 8.2.2 useVideoProgress Hook

```javascript
/**
 * Custom hook for video progress tracking
 * 
 * Usage:
 * const { 
 *   videoRef,
 *   currentPosition,
 *   duration,
 *   isCompleted,
 *   seekTo 
 * } = useVideoProgress(studentId, courseId, lessonId);
 * 
 * Features:
 * - Auto-loads saved position on mount
 * - Debounced position saves (5 second intervals)
 * - Saves on pause, seek, blur events
 * - Saves on unmount via beforeunload
 * - Marks complete at 90% watched
 */

const useVideoProgress = (studentId, courseId, lessonId) => {
  const videoRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const saveTimeoutRef = useRef(null);
  
  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      const saved = await courseProgressService.getVideoPosition(
        studentId, courseId, lessonId
      );
      if (saved && videoRef.current) {
        videoRef.current.currentTime = Math.max(0, saved.positionSeconds - 2);
        setIsCompleted(saved.completed);
      }
    };
    loadPosition();
  }, [lessonId]);
  
  // Debounced save during playback
  useEffect(() => {
    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (!video) return;
      
      setCurrentPosition(video.currentTime);
      
      // Debounce saves
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        courseProgressService.saveVideoPosition(
          studentId, courseId, lessonId,
          Math.floor(video.currentTime),
          Math.floor(video.duration)
        );
      }, 5000);
      
      // Check for completion (90%)
      if (video.currentTime / video.duration >= 0.9 && !isCompleted) {
        setIsCompleted(true);
        courseProgressService.markVideoCompleted(studentId, courseId, lessonId);
      }
    };
    
    const video = videoRef.current;
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('pause', handleImmediateSave);
      video.addEventListener('ended', handleImmediateSave);
    }
    
    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('pause', handleImmediateSave);
        video.removeEventListener('ended', handleImmediateSave);
      }
      clearTimeout(saveTimeoutRef.current);
    };
  }, [lessonId, isCompleted]);
  
  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current) {
        navigator.sendBeacon('/api/progress/video', JSON.stringify({
          studentId, courseId, lessonId,
          position: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration)
        }));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lessonId]);
  
  const seekTo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };
  
  return { videoRef, currentPosition, duration, isCompleted, seekTo };
};
```

#### 8.2.3 useSessionRestore Hook

```javascript
/**
 * Custom hook for session restoration logic
 * 
 * Usage:
 * const {
 *   restorePoint,
 *   showRestoreModal,
 *   handleRestore,
 *   handleStartFresh,
 *   isLoading
 * } = useSessionRestore(studentId, courseId, course);
 */

const useSessionRestore = (studentId, courseId, course) => {
  const [restorePoint, setRestorePoint] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkRestorePoint = async () => {
      if (!studentId || !courseId) return;
      
      setIsLoading(true);
      const point = await courseProgressService.getRestorePoint(studentId, courseId);
      
      if (point && point.progress > 0 && point.progress < 100) {
        setRestorePoint(point);
        setShowRestoreModal(true);
      }
      setIsLoading(false);
    };
    
    checkRestorePoint();
  }, [studentId, courseId]);
  
  const handleRestore = useCallback(() => {
    setShowRestoreModal(false);
    // Return restore point for parent to navigate
    return restorePoint;
  }, [restorePoint]);
  
  const handleStartFresh = useCallback(async () => {
    await courseProgressService.clearRestorePoint(studentId, courseId);
    setShowRestoreModal(false);
    setRestorePoint(null);
  }, [studentId, courseId]);
  
  return {
    restorePoint,
    showRestoreModal,
    handleRestore,
    handleStartFresh,
    isLoading
  };
};
```

### 8.3 CoursePlayer.jsx Integration Points

```jsx
// Key additions to CoursePlayer.jsx

// 1. Import hooks
import { useVideoProgress } from '../../hooks/useVideoProgress';
import { useSessionRestore } from '../../hooks/useSessionRestore';
import RestoreProgressModal from '../../components/student/courses/RestoreProgressModal';

// 2. Initialize hooks
const {
  restorePoint,
  showRestoreModal,
  handleRestore,
  handleStartFresh
} = useSessionRestore(user?.id, courseId, course);

const {
  videoRef,
  currentPosition,
  isCompleted: videoCompleted
} = useVideoProgress(user?.id, courseId, currentLesson?.id);

// 3. Handle restore navigation
const onRestoreConfirm = () => {
  const point = handleRestore();
  if (point) {
    setCurrentModuleIndex(point.lastModuleIndex);
    setCurrentLessonIndex(point.lastLessonIndex);
    // Video position will auto-restore via useVideoProgress
  }
};

// 4. Save position on lesson change
useEffect(() => {
  if (currentLesson && user?.id) {
    courseProgressService.saveRestorePoint(
      user.id,
      courseId,
      currentModuleIndex,
      currentLessonIndex,
      currentLesson.id,
      currentPosition
    );
  }
}, [currentModuleIndex, currentLessonIndex]);

// 5. Render restore modal
{showRestoreModal && (
  <RestoreProgressModal
    isOpen={showRestoreModal}
    restorePoint={restorePoint}
    courseName={course?.title}
    onRestore={onRestoreConfirm}
    onStartFresh={handleStartFresh}
  />
)}

// 6. Use videoRef on video element
<video
  ref={videoRef}
  src={lessonVideoUrl}
  controls
  // ... other props
/>
```


---

## 9. Data Flow Diagrams

### 9.1 Video Progress Save Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VIDEO PROGRESS SAVE FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │  Video   │     │  Hook    │     │ Debounce │     │ Service  │           │
│  │ Element  │     │          │     │ Manager  │     │          │           │
│  └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘           │
│       │                │                │                │                  │
│       │ timeupdate     │                │                │                  │
│       │───────────────▶│                │                │                  │
│       │                │                │                │                  │
│       │                │ queue save     │                │                  │
│       │                │───────────────▶│                │                  │
│       │                │                │                │                  │
│       │                │                │ wait 5s        │                  │
│       │                │                │────────┐       │                  │
│       │                │                │        │       │                  │
│       │                │                │◀───────┘       │                  │
│       │                │                │                │                  │
│       │                │                │ flush          │                  │
│       │                │                │───────────────▶│                  │
│       │                │                │                │                  │
│       │                │                │                │  ┌────────────┐  │
│       │                │                │                │  │  Supabase  │  │
│       │                │                │                │──▶│  Database  │  │
│       │                │                │                │  └────────────┘  │
│       │                │                │                │                  │
│       │ pause          │                │                │                  │
│       │───────────────▶│                │                │                  │
│       │                │                │                │                  │
│       │                │ immediate save │                │                  │
│       │                │────────────────────────────────▶│                  │
│       │                │                │                │                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Session Restore Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SESSION RESTORE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Student enters course                                                       │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Check for restore point                           │    │
│  │                    courseProgressService.getRestorePoint()           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐                                                        │
│  │ Has progress?   │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│    Yes          No                                                          │
│     │           │                                                           │
│     ▼           ▼                                                           │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐    │
│  │  Show    │  │              Start from beginning                    │    │
│  │  Modal   │  │              Module 0, Lesson 0                      │    │
│  └────┬─────┘  └──────────────────────────────────────────────────────┘    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     User Choice                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                      │
│     ┌─┴─────────────────────┐                                               │
│     │                       │                                               │
│  "Continue"            "Start Fresh"                                        │
│     │                       │                                               │
│     ▼                       ▼                                               │
│  ┌──────────────────┐   ┌──────────────────────────────────────────────┐   │
│  │ Navigate to:     │   │ Clear restore point                          │   │
│  │ - lastModuleIdx  │   │ courseProgressService.clearRestorePoint()    │   │
│  │ - lastLessonIdx  │   │                                              │   │
│  │ - videoPosition  │   │ Navigate to Module 0, Lesson 0               │   │
│  └──────────────────┘   └──────────────────────────────────────────────┘   │
│       │                       │                                             │
│       ▼                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Load lesson content                               │    │
│  │                    Auto-seek video to saved position                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Quiz Progress Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        QUIZ PROGRESS FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Student starts quiz                                                         │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              Check for existing in-progress attempt                  │    │
│  │              courseProgressService.getQuizProgress()                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐                                                        │
│  │ Has in-progress │                                                        │
│  │    attempt?     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│    Yes          No                                                          │
│     │           │                                                           │
│     ▼           ▼                                                           │
│  ┌──────────┐  ┌──────────────────────────────────────────────────────┐    │
│  │ Resume   │  │           Create new attempt                         │    │
│  │ from     │  │           startQuizAttempt()                         │    │
│  │ saved    │  │           attempt_number = 1                         │    │
│  │ question │  └──────────────────────────────────────────────────────┘    │
│  └──────────┘                                                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Display question                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    User answers question                             │    │
│  │                    saveQuizAnswer() - immediate save                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────┐                                                        │
│  │  More questions │                                                        │
│  │   remaining?    │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│    Yes          No                                                          │
│     │           │                                                           │
│     │           ▼                                                           │
│     │      ┌──────────────────────────────────────────────────────────┐    │
│     │      │                Submit quiz                                │    │
│     │      │                submitQuiz()                               │    │
│     │      │                Calculate score                            │    │
│     │      │                Update status = 'completed'                │    │
│     │      └──────────────────────────────────────────────────────────┘    │
│     │                                                                       │
│     └──────────────────────────────────────────────────────────────────┐    │
│                                                                        │    │
│                                                                        ▼    │
│                                                              [Next Question] │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 10. Security Considerations

### 10.1 Authentication & Authorization

| Concern | Mitigation |
|---------|------------|
| Unauthorized progress access | All queries filtered by authenticated user's student_id |
| Progress manipulation | Server-side validation of progress values |
| Cross-student data access | RLS policies enforce student_id = auth.uid() |
| Session hijacking | JWT token validation on all requests |

### 10.2 Row Level Security Policies

```sql
-- RLS for student_course_progress
ALTER TABLE student_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own progress"
ON student_course_progress FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own progress"
ON student_course_progress FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own progress"
ON student_course_progress FOR UPDATE
USING (student_id = auth.uid());

-- RLS for student_quiz_progress
ALTER TABLE student_quiz_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own quiz progress"
ON student_quiz_progress FOR ALL
USING (student_id = auth.uid());

-- Educator read access for analytics
CREATE POLICY "Educators can view course progress"
ON student_course_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.course_id = student_course_progress.course_id
    AND c.educator_id = auth.uid()
  )
);
```

### 10.3 Data Validation

```javascript
// Input validation for progress saves
const validateVideoPosition = (position, duration) => {
  if (typeof position !== 'number' || position < 0) return false;
  if (typeof duration !== 'number' || duration <= 0) return false;
  if (position > duration) return false;
  return true;
};

const validateProgressPercentage = (progress) => {
  return typeof progress === 'number' && progress >= 0 && progress <= 100;
};

const validateQuizAnswer = (answer, questionType) => {
  // Type-specific validation
  switch (questionType) {
    case 'multiple_choice':
      return typeof answer === 'string' && answer.length > 0;
    case 'multiple_select':
      return Array.isArray(answer) && answer.length > 0;
    case 'text':
      return typeof answer === 'string';
    default:
      return false;
  }
};
```

---

## 11. Performance Considerations

### 11.1 Optimization Strategies

| Strategy | Implementation | Impact |
|----------|----------------|--------|
| Debounced saves | 5s for video, 30s for time | Reduces DB writes by ~90% |
| Batch operations | Group multiple updates | Reduces network calls |
| Partial indexes | Index only active records | Faster queries |
| Connection pooling | Supabase built-in | Handles concurrent users |
| Optimistic updates | Update UI before server confirm | Better perceived performance |

### 11.2 Caching Strategy

```javascript
// Local cache for frequently accessed data
const progressCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedProgress = async (studentId, courseId) => {
  const cacheKey = `${studentId}:${courseId}`;
  const cached = progressCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchProgressFromDB(studentId, courseId);
  progressCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

const invalidateCache = (studentId, courseId) => {
  progressCache.delete(`${studentId}:${courseId}`);
};
```

### 11.3 Database Query Optimization

```sql
-- Use EXPLAIN ANALYZE to verify query performance
EXPLAIN ANALYZE
SELECT * FROM student_course_progress
WHERE student_id = $1 AND course_id = $2;

-- Expected: Index Scan using idx_progress_lesson_lookup
-- Target: < 5ms execution time

-- Materialized view for analytics (refresh periodically)
CREATE MATERIALIZED VIEW course_progress_stats AS
SELECT 
  course_id,
  COUNT(DISTINCT student_id) as total_students,
  AVG(progress) as avg_progress,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  AVG(time_spent_seconds) as avg_time_spent
FROM course_enrollments
GROUP BY course_id;

CREATE UNIQUE INDEX ON course_progress_stats(course_id);

-- Refresh every hour
-- REFRESH MATERIALIZED VIEW CONCURRENTLY course_progress_stats;
```

### 11.4 Load Testing Targets

| Metric | Target | Test Scenario |
|--------|--------|---------------|
| Concurrent users | 10,000 | Simulated video playback |
| Progress saves/sec | 1,000 | Peak usage simulation |
| Restore point fetch | < 100ms | P99 latency |
| Quiz answer save | < 50ms | P99 latency |
| Batch sync | < 500ms | 50 updates per batch |

---

## 12. Testing Strategy

### 12.1 Unit Tests

```javascript
// courseProgressService.test.js

describe('courseProgressService', () => {
  describe('saveVideoPosition', () => {
    it('should save valid video position', async () => {
      const result = await courseProgressService.saveVideoPosition(
        'student-123', 'course-456', 'lesson-789', 120, 600
      );
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid position (negative)', async () => {
      const result = await courseProgressService.saveVideoPosition(
        'student-123', 'course-456', 'lesson-789', -10, 600
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('invalid position');
    });
    
    it('should reject position > duration', async () => {
      const result = await courseProgressService.saveVideoPosition(
        'student-123', 'course-456', 'lesson-789', 700, 600
      );
      expect(result.success).toBe(false);
    });
  });
  
  describe('getRestorePoint', () => {
    it('should return null for new enrollment', async () => {
      const result = await courseProgressService.getRestorePoint(
        'new-student', 'course-456'
      );
      expect(result).toBeNull();
    });
    
    it('should return restore point for existing progress', async () => {
      // Setup: Create enrollment with progress
      await setupTestEnrollment();
      
      const result = await courseProgressService.getRestorePoint(
        'studen

---

## 12. Testing Strategy

### 12.1 Unit Tests

| Test Suite | Coverage Target | Key Test Cases |
|------------|-----------------|----------------|
| courseProgressService | 90% | Save/load video position, restore points, quiz progress |
| useVideoProgress hook | 85% | Debouncing, event handlers, cleanup |
| useSessionRestore hook | 85% | Modal logic, navigation, clear functionality |
| RestoreProgressModal | 80% | Render states, user interactions, accessibility |

### 12.2 Integration Tests

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Video resume | 1. Play video to 2:30<br>2. Close tab<br>3. Reopen course | Video resumes at ~2:28 |
| Quiz resume | 1. Answer 3/10 questions<br>2. Navigate away<br>3. Return to quiz | Resume at question 4 with answers saved |
| Cross-device sync | 1. Progress on Device A<br>2. Open on Device B | Same progress displayed |
| Offline recovery | 1. Go offline<br>2. Make progress<br>3. Reconnect | Progress synced to server |

### 12.3 E2E Test Scenarios

```javascript
// Cypress E2E test example
describe('Course Progress Tracking', () => {
  beforeEach(() => {
    cy.login('student@test.com');
    cy.visit('/student/courses/test-course-id/learn');
  });
  
  it('should show restore modal on return visit', () => {
    // Make progress
    cy.get('[data-testid="lesson-1"]').click();
    cy.get('video').then($video => {
      $video[0].currentTime = 120;
    });
    cy.get('[data-testid="next-lesson"]').click();
    
    // Leave and return
    cy.visit('/student/courses');
    cy.visit('/student/courses/test-course-id/learn');
    
    // Verify restore modal
    cy.get('[data-testid="restore-modal"]').should('be.visible');
    cy.contains('Continue Where I Left Off').click();
    
    // Verify position restored
    cy.get('[data-testid="current-lesson"]').should('contain', 'Lesson 2');
  });
});
```

---

## 13. Rollout Plan

### 13.1 Phase Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLLOUT TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Week 1          Week 2          Week 3          Week 4          Week 5     │
│    │               │               │               │               │        │
│    ▼               ▼               ▼               ▼               ▼        │
│  ┌─────┐        ┌─────┐        ┌─────┐        ┌─────┐        ┌─────┐       │
│  │ DB  │        │ Svc │        │ UI  │        │ QA  │        │ GA  │       │
│  │Migr.│───────▶│Layer│───────▶│Comp.│───────▶│Test │───────▶│Roll │       │
│  └─────┘        └─────┘        └─────┘        └─────┘        └─────┘       │
│                                                                              │
│  Deliverables:                                                               │
│  • Schema changes    • courseProgressService    • Hooks        • Bug fixes  │
│  • Indexes           • progressSyncManager      • Components   • Monitoring │
│  • RLS policies      • API integration          • Integration  • Launch     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Feature Flags

```javascript
// Feature flag configuration
const FEATURE_FLAGS = {
  VIDEO_POSITION_TRACKING: 'progress_video_position',
  SESSION_RESTORE_MODAL: 'progress_session_restore',
  QUIZ_PROGRESS_TRACKING: 'progress_quiz_tracking',
  OFFLINE_SYNC: 'progress_offline_sync'
};

// Usage in code
if (featureFlags.isEnabled(FEATURE_FLAGS.SESSION_RESTORE_MODAL)) {
  // Show restore modal
}
```

### 13.3 Rollout Stages

| Stage | Audience | Duration | Success Criteria |
|-------|----------|----------|------------------|
| Alpha | Internal team | 3 days | No critical bugs |
| Beta | 5% of users | 1 week | Error rate < 0.1% |
| Staged | 25% → 50% → 75% | 2 weeks | Metrics stable |
| GA | 100% | Ongoing | All KPIs met |

### 13.4 Rollback Plan

| Trigger | Action | Recovery Time |
|---------|--------|---------------|
| Error rate > 1% | Disable feature flag | < 5 minutes |
| Data corruption | Restore from backup | < 1 hour |
| Performance degradation | Scale down features | < 15 minutes |

---

## 14. Risk Assessment

### 14.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during save | Low | High | Retry logic, local backup |
| Performance degradation | Medium | Medium | Debouncing, caching |
| Cross-device conflicts | Medium | Low | Last-write-wins, timestamps |
| Browser compatibility | Low | Medium | Feature detection, fallbacks |
| Offline sync failures | Medium | Medium | Queue persistence, retry |

### 14.2 Contingency Plans

**Scenario: High database load from progress saves**
- Immediate: Increase debounce interval to 30s
- Short-term: Enable read replicas
- Long-term: Implement write batching

**Scenario: Video position not restoring correctly**
- Immediate: Add 5-second buffer to restore position
- Short-term: Implement position validation
- Long-term: Add user-adjustable restore offset

---

## 15. Success Metrics

### 15.1 Key Performance Indicators

| KPI | Baseline | Target | Measurement |
|-----|----------|--------|-------------|
| Course completion rate | 35% | 50% | Completed / Enrolled |
| Session resume rate | 0% | 80% | Restores / Return visits |
| Average session duration | 12 min | 18 min | Time tracking |
| Video completion rate | 45% | 70% | Videos watched ≥90% |
| Student satisfaction | N/A | 4.2/5 | Survey feedback |

### 15.2 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROGRESS TRACKING DASHBOARD                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Progress Saves   │  │ Restore Success  │  │ Error Rate       │          │
│  │     /minute      │  │      Rate        │  │                  │          │
│  │                  │  │                  │  │                  │          │
│  │     1,247        │  │      94.2%       │  │      0.03%       │          │
│  │     ▲ 12%        │  │      ▲ 2.1%      │  │      ▼ 0.01%     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Save Latency (P95)                                 │   │
│  │  100ms ─────────────────────────────────────────────────────────────  │   │
│  │   75ms ─────────────────────────────────────────────────────────────  │   │
│  │   50ms ─────────────────────────────────────────────────────────────  │   │
│  │   25ms ─────────────────────────────────────────────────────────────  │   │
│  │    0ms ─────────────────────────────────────────────────────────────  │   │
│  │        00:00   04:00   08:00   12:00   16:00   20:00   24:00         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| Restore Point | Saved position (module, lesson, video time) for session resume |
| Debouncing | Delaying saves to batch frequent updates |
| RLS | Row Level Security - Postgres feature for data access control |
| Optimistic Update | Updating UI before server confirmation |

### 16.2 References

- Supabase Documentation: https://supabase.com/docs
- React Hooks Best Practices: https://react.dev/reference/react
- Video.js Events: https://videojs.com/guides/events/

### 16.3 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-23 | Engineering | Initial document |

### 16.4 Approval Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| QA Lead | | | |
| Security | | | |

---

*End of Document*
