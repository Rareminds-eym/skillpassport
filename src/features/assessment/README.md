# Assessment Feature

This feature module contains all assessment-related functionality for the SkillPassport application.

## Structure

```
src/features/assessment/
├── index.ts                    # Main exports
├── README.md                   # This file
│
├── types/
│   └── assessment.types.ts     # TypeScript type definitions
│
├── constants/
│   └── config.ts               # Configuration constants (timers, grade levels)
│
├── data/
│   ├── index.ts
│   └── questions/              # Question banks for career assessment
│       ├── aptitudeQuestions.ts
│       ├── bigFiveQuestions.ts
│       ├── riasecQuestions.ts
│       ├── workValuesQuestions.ts
│       ├── employabilityQuestions.ts
│       ├── middleSchoolQuestions.ts
│       ├── streamKnowledgeQuestions.ts
│       └── scoringUtils.ts
│
├── hooks/                      # Shared assessment hooks
│   ├── useAssessmentTimer.ts
│   ├── useQuestionNavigation.ts
│   ├── useAutoSave.ts
│   └── useTabVisibility.ts
│
├── services/
│   └── index.ts                # Re-exports from src/services/
│
├── results/
│   └── index.ts                # Re-exports from assessment-result page
│
├── components/                 # Shared screen components
│   ├── GradeSelectionScreen.jsx
│   ├── CategorySelectionScreen.jsx
│   ├── StreamSelectionScreen.jsx
│   ├── ResumePromptScreen.jsx
│   └── RestrictionScreen.jsx
│
├── utils/                      # Utility functions
│   ├── gradeUtils.ts
│   ├── timeUtils.ts
│   ├── answerUtils.ts
│   └── ...
│
└── career-test/                # ✅ NEW: Modular Career Test (replaces AssessmentTest.jsx)
    ├── index.ts                # Module exports
    ├── AssessmentTestPage.tsx  # Main orchestrator component
    │
    ├── config/
    │   ├── index.ts
    │   ├── sections.ts         # Section definitions by grade level
    │   └── streams.ts          # Stream/category configurations
    │
    ├── context/
    │   ├── index.ts
    │   └── AssessmentContext.tsx  # Shared state context
    │
    ├── hooks/
    │   ├── index.ts
    │   ├── useStudentGrade.ts     # Student grade fetching
    │   ├── useAIQuestions.ts      # AI question loading
    │   ├── useAssessmentProgress.ts
    │   ├── useAssessmentFlow.ts   # Main state machine
    │   └── useAssessmentSubmission.ts  # Submission with Gemini AI
    │
    ├── components/
    │   ├── index.ts
    │   ├── QuestionNavigation.tsx
    │   │
    │   ├── questions/          # Question type components
    │   │   ├── index.ts
    │   │   ├── QuestionRenderer.tsx
    │   │   ├── LikertQuestion.tsx
    │   │   ├── MCQQuestion.tsx
    │   │   ├── SJTQuestion.tsx
    │   │   └── AdaptiveQuestion.tsx
    │   │
    │   ├── screens/            # Full-screen components
    │   │   ├── index.ts
    │   │   ├── SectionIntroScreen.tsx
    │   │   ├── SectionCompleteScreen.tsx
    │   │   └── LoadingScreen.tsx
    │   │
    │   └── layout/             # Layout components
    │       ├── index.ts
    │       ├── ProgressHeader.tsx
    │       └── TestModeControls.tsx
    │
    └── utils/
        └── courseRecommendations.ts
```

## Career Test Module (Refactored Architecture)

The `career-test/` module provides a modular, maintainable architecture that **replaces the monolithic `AssessmentTest.jsx` (3324 lines)**.

### Key Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Testability**: Individual components can be unit tested
3. **Maintainability**: Changes are isolated to specific files
4. **Reusability**: Components can be reused across different assessment types
5. **Type Safety**: Full TypeScript support with proper interfaces

### Main Entry Point

```typescript
// The new modular component
import { AssessmentTestPage } from '@/features/assessment';

// Or import from the page wrapper
import AssessmentTestPage from '@/pages/student/AssessmentTestPage';
```

### Flow State Machine

The `useAssessmentFlow` hook manages the entire assessment flow:

```typescript
import { useAssessmentFlow } from '@/features/assessment';

const flow = useAssessmentFlow({
  sections,
  onSectionComplete: (sectionId, timeSpent) => {
    /* ... */
  },
  onAnswerChange: (questionId, answer) => {
    /* ... */
  },
});

// Flow screens: loading → grade_selection → category_selection →
//               section_intro → question → section_complete → submitting
```

### Configuration-Driven Sections

```typescript
import { getSectionsForGrade, RESPONSE_SCALES } from '@/features/assessment';

// Get sections for a specific grade level
const sections = getSectionsForGrade('after12');
// Returns: [riasec, bigfive, values, employability, aptitude, knowledge]

const middleSections = getSectionsForGrade('middle');
// Returns: [interest_explorer, strengths_character, learning_preferences, adaptive_aptitude]
```

### Question Components

```typescript
import {
  QuestionRenderer,
  LikertQuestion,
  MCQQuestion,
  SJTQuestion,
  AdaptiveQuestion
} from '@/features/assessment';

// QuestionRenderer automatically selects the right component
<QuestionRenderer
  question={currentQuestion}
  questionId={questionId}
  answer={answers[questionId]}
  onAnswerChange={handleAnswer}
  responseScale={section.responseScale}
  isAdaptive={section.isAdaptive}
/>
```

### Custom Hooks

```typescript
import {
  useStudentGrade,
  useAIQuestions,
  useAssessmentProgress,
  useAssessmentFlow,
  useAssessmentSubmission,
} from '@/features/assessment';

// Fetch student grade information
const { studentId, studentGrade, isCollegeStudent, monthsInGrade } = useStudentGrade();

// Load AI-generated questions
const { questions, loading, error, loadQuestions } = useAIQuestions();

// Calculate progress
const { progress, answeredCount } = useAssessmentProgress({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  answers,
});

// Handle submission with Gemini AI
const { isSubmitting, error, submit } = useAssessmentSubmission();
```

## Assessment Types

The system supports three main assessment types:

### 1. Career Assessment (Personal Assessment)

- **Purpose**: Career guidance through personality and interest profiling
- **Components**: RIASEC, Big Five, Work Values, Employability, Aptitude
- **Main File**: `src/features/assessment/career-test/AssessmentTestPage.tsx` ✅ (NEW)
- **Legacy File**: `src/pages/student/AssessmentTest.jsx` (deprecated, kept for reference)
- **Results**: `src/pages/student/assessment-result/`
- **Services**: `assessmentService`, `assessmentGenerationService`, `careerAssessmentAIService`

### 2. External Course Assessment

- **Purpose**: Course-specific skill tests for certificates
- **Main Files**:
  - `src/pages/student/DynamicAssessment.jsx`
- **Results**: `src/pages/student/AssessmentResults.tsx`
- **Services**: `externalAssessmentService`

### 3. Adaptive Aptitude Assessment

- **Purpose**: IRT-based adaptive testing for aptitude measurement
- **Main File**: `src/pages/student/AdaptiveAptitudeTest.tsx`
- **Services**: `adaptiveEngine.ts`, `adaptiveAptitudeService.ts`
- **Types**: `src/types/adaptiveAptitude.ts` (re-exported in feature types)

## Usage

### Import from the feature module:

```typescript
import {
  // Types
  type AssessmentResults,
  type GradeLevel,
  type TestSession, // Adaptive testing types
  type TestResults,

  // Constants
  GRADE_LEVELS,
  TIMERS,
  DEFAULT_ADAPTIVE_TEST_CONFIG,

  // Hooks
  useAssessmentFlow,
  useAssessmentTimer,
  useQuestionNavigation,
  useAutoSave,
  useTabVisibility,

  // Data
  riasecQuestions,
  bigFiveQuestions,
  calculateRIASEC,

  // Components
  GradeSelectionScreen,
  StreamSelectionScreen,

  // Result Components
  ProgressRing,
  SummaryCard,
  CareerSection,

  // Services
  checkAssessmentStatus, // External assessment
  createAssessmentAttempt,
  AdaptiveEngine, // Adaptive testing

  // Utilities
  formatTime,
  getGradeLevelFromGrade,
} from '@/features/assessment';
```

### Using the Timer Hook:

```typescript
const { timeRemaining, elapsedTime, isRunning, start, pause, formatTime } = useAssessmentTimer({
  initialTime: 900, // 15 minutes
  onTimeUp: () => handleSubmit(),
  warningThresholds: [300, 60], // Warn at 5 min and 1 min
  onWarning: (threshold) => showWarning(threshold),
});
```

### Using the Navigation Hook:

```typescript
const {
  currentQuestionIndex,
  currentQuestion,
  hasNext,
  hasPrevious,
  goToNext,
  goToPrevious,
  goToQuestion,
} = useQuestionNavigation({
  questions: assessmentQuestions,
  onQuestionChange: (index) => saveProgress(index),
});
```

### Using Auto-Save:

```typescript
const { isSaving, lastSaved, saveNow } = useAutoSave({
  data: { answers, currentQuestionIndex, timeRemaining },
  onSave: async (data) => await saveToDatabase(data),
  debounceMs: 2000,
  periodicSaveMs: 30000,
});
```

## Migration Notes

**Migration Status: COMPLETE** ✅

The assessment data files have been fully migrated from `src/pages/student/assessment-data/` to `src/features/assessment/data/questions/`. The original folder has been deleted.

**What was migrated:**

- `aptitudeQuestions.js` → `aptitudeQuestions.ts`
- `bigFiveQuestions.js` → `bigFiveQuestions.ts`
- `riasecQuestions.js` → `riasecQuestions.ts`
- `workValuesQuestions.js` → `workValuesQuestions.ts`
- `employabilityQuestions.js` → `employabilityQuestions.ts`
- `middleSchoolQuestions.js` → `middleSchoolQuestions.ts`
- `streamKnowledgeQuestions.js` → `streamKnowledgeQuestions.ts`
- `scoringUtils.js` → `scoringUtils.ts`

**Files updated to use new imports:**

- `src/pages/student/AssessmentTest.jsx`
- `src/pages/student/assessment-result/hooks/useAssessmentResults.js`

**New code should always import from the feature module:**

```typescript
import { riasecQuestions, bigFiveQuestions } from '@/features/assessment';
// or
import { riasecQuestions, bigFiveQuestions } from '../../features/assessment';
```

## Related Services

Assessment services are located in `src/services/` and re-exported through `src/features/assessment/services/`:

### Career Assessment (Personal Assessment)

- `assessmentService.js` - Career assessment database operations (attempts, responses, results)
- `assessmentGenerationService.js` - AI question generation for assessments
- `careerAssessmentAIService.js` - AI-powered question loading for aptitude & knowledge sections
- `geminiAssessmentService.js` - Gemini AI analysis for assessment results

### Adaptive Testing

- `adaptiveEngine.ts` - IRT-based adaptive testing logic (difficulty adjustment, ability estimation)
- `adaptiveAptitudeService.ts` - Adaptive aptitude test session management

### External Course Assessment

- `externalAssessmentService.js` - External course skill tests and certificates
- `certificateAssessmentService.js` - Certificate-based assessment questions

### AI & Recommendations

- `aiCareerPathService.ts` - AI-powered career path recommendations
- `streamRecommendationService.js` - Stream/course recommendations based on assessment results
- `courseRecommendationService.js` - Course recommendations based on assessment scores
