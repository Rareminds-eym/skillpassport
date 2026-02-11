# Project Knowledge

## What This Is
**SkillPassport Portal** — a full-stack education/career assessment platform built with Vite + React 18 + TypeScript frontend, Cloudflare Pages Functions API backend, and Supabase (DB + Auth). Supports multiple user roles: students, school educators, college admins, recruiters, university admins.

## Key Directories
- `src/` — React SPA source
  - `src/features/` — Feature modules: `assessment`, `career-assistant`, `educator-copilot`, `recruiter-copilot`, `university-ai`
  - `src/services/` — Service layer (~150+ files) for Supabase queries, AI APIs, auth, etc.
  - `src/routes/AppRoutes.jsx` — All frontend routing
  - `src/components/` — Shared UI components (shadcn/ui pattern with Radix primitives)
  - `src/pages/` — Page-level components
  - `src/hooks/`, `src/contexts/`, `src/stores/` — State management (Zustand + React Query + Context)
  - `src/lib/`, `src/utils/`, `src/shared/` — Utilities
- `functions/api/` — Cloudflare Pages Functions (serverless API endpoints: `adaptive-session`, `analyze-assessment`, `career`, `course`, `otp`, `question-generation`, `role-overview`, `storage`, `streak`, `user`)
- `cloudflare-workers/` — Standalone Cloudflare Workers microservices:
  - `email-api/` (port 9001) — Email sending + PDF generation
  - `embedding-api/` (port 9002) — Vector embeddings
  - `payments-api/` (port 9003) — Razorpay payments
- `supabase/` — Migrations and config
- `scripts/` — Utility scripts (embedding generation, cleanup)
- `tests/` — E2E tests (Puppeteer)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend dev server (port 3000, development mode) |
| `npm run dev:all` | Full stack: frontend + Pages Functions + Workers + Supabase |
| `npm run build` | Production build (8GB memory for large bundle) |
| `npm run typecheck` | TypeScript checking (`tsc --noEmit -p tsconfig.app.json`) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Puppeteer E2E tests |
| `npm run pages:dev` | Cloudflare Pages Functions locally (port 8788) |
| `npm run workers:dev` | All 3 Cloudflare Workers locally |
| `npm run cleanup` | Kill orphaned port processes |

## Architecture & Data Flow
- Frontend → Vite dev proxy (`/api` → `localhost:8788`) → Cloudflare Pages Functions → Supabase
- Frontend → Supabase JS client directly (for auth, realtime, simple queries)
- Pages Functions → Supabase, OpenAI/Gemini AI APIs, AWS (via aws4fetch)
- Workers handle specialized tasks (email, embeddings, payments) on separate ports

## Conventions
- **Path alias**: `@/` maps to `./src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- **UI components**: Radix UI primitives + shadcn/ui pattern + TailwindCSS + `class-variance-authority` + `clsx`/`tailwind-merge`
- **State**: Zustand stores, TanStack React Query for server state, React Context for auth/theme
- **Styling**: TailwindCSS 3.x — all styling via utility classes
- **TypeScript**: Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- **Forms**: `react-hook-form`
- **Charts**: Recharts + ApexCharts
- **Animation**: Framer Motion + GSAP
- **Package manager**: npm (see `package-lock.json`)
- **Module system**: ESM (`"type": "module"` in package.json)
- **Build target**: ES2020

## Assessment Feature

### 5-Section Career Assessment
The core assessment has 5 sections based on psychometric models:

| # | Section | Model | Questions | Data File |
|---|---------|-------|-----------|----------|
| 1 | Interest | Holland's RIASEC (R/I/A/S/E/C) | 48 Likert | `src/features/assessment/data/questions/riasecQuestions.ts` |
| 2 | Strengths | Big Five OCEAN | 30 Likert | `bigFiveQuestions.ts` |
| 3 | Learning | Work Values (8 types) | 24 Likert | `workValuesQuestions.ts` |
| 4 | Aptitude | Self-rating + SJT | 31 mixed | `employabilityQuestions.ts` |
| 5 | Adaptive | AI-generated MCQs (IRT-based) | 10-30 | Dynamic via API |

### Assessment Flow
```
Student starts → Grade detection → Grade/stream selection → 5 sections answered
→ Answers saved to `personal_assessment_responses` → POST /api/analyze-assessment
→ AI analysis (OpenRouter) → Results saved to `personal_assessment_results`
→ Results displayed (RIASEC chart, Big Five, career clusters, roadmap)
```

### Grade Levels & Prompt Routing
| Grade Level | Prompt File | Key Output |
|-------------|-------------|------------|
| `middle` (6-8) | `prompts/middle-school.ts` | Career exploration |
| `highschool` (9-10) | `prompts/high-school.ts` | Career guidance |
| `higher_secondary` (11-12) | `prompts/higher-secondary.ts` | Career paths |
| `after10` | `prompts/after10.ts` | **Stream recommendation** (Science/Commerce/Arts) |
| `after12` / `college` | `prompts/college.ts` | **Course/degree recommendations** |

### Key Assessment Files
- **Test page**: `src/features/assessment/career-test/AssessmentTestPage.tsx`
- **Flow state machine**: `src/features/assessment/career-test/hooks/useAssessmentFlow.ts`
- **AI question loading**: `src/features/assessment/career-test/hooks/useAIQuestions.ts`
- **Submission + AI analysis**: `src/features/assessment/career-test/hooks/useAssessmentSubmission.ts`
- **Results hook**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`
- **Results page**: `src/features/assessment/assessment-result/AssessmentResult.jsx`
- **Scoring utils**: `src/features/assessment/data/questions/scoringUtils.ts`
- **Stream matching**: `src/features/assessment/assessment-result/utils/streamMatchingEngine.js`
- **Course matching**: `src/features/assessment/assessment-result/utils/courseMatchingEngine.js`

### Adaptive Aptitude Testing (IRT-based)
Separate adaptive testing system with 3 phases:
1. **Diagnostic Screener** — 6 questions at difficulty 3
2. **Adaptive Core** — 8-11 questions, difficulty adjusts based on performance
3. **Stability Confirmation** — 4-6 questions around provisional band

- **API**: `functions/api/adaptive-session/` (initialize, submit-answer, next-question, complete, resume, abandon)
- **Frontend service**: `src/services/adaptiveAptitudeApiService.ts`
- **Engine logic**: `functions/api/adaptive-session/utils/adaptive-engine.ts`
- **DB tables**: `adaptive_aptitude_sessions`, `adaptive_aptitude_responses`, `adaptive_aptitude_results`

### Scoring Algorithms
| Section | Algorithm | Scale | Max |
|---------|-----------|-------|-----|
| RIASEC | Points per rating: 1-2→0, 3→1, 4→2, 5→3. Sum per type (8 Qs each) | 0-24 per type | 24 |
| Big Five | Average of ratings per trait (O/C/E/A/N) | 1.0-5.0 | 5.0 |
| Work Values | Average per dimension (Security, Autonomy, Creativity, Status, Impact, Financial, Leadership, Lifestyle) | 1.0-5.0 | 5.0 |
| Employability | Self-rating: avg per skill domain. SJT: best=2pts, neutral=1pt, worst=0pt → percentage | 0-100% | 100% |
| Aptitude (MCQ) | correct/total per category (verbal, numerical, abstract, spatial, clerical) | 0-100% | 100% |
| Knowledge | correct/total for stream-specific MCQs | 0-100% | 100% |

Scoring code: `src/features/assessment/data/questions/scoringUtils.ts` (`calculateRIASEC`, `calculateBigFive`, `calculateWorkValues`, `calculateEmployability`)
Validation: `src/services/riasecScoreValidator.js` recalculates from raw answers if AI returns scores > 24

### AI Response Schema (from `/api/analyze-assessment`)
The AI returns this JSON structure (validated by `validateAssessmentStructure()` in the backend):
```
{
  profileSnapshot: { aptitudeStrengths: [...], topInterests: [...] },
  riasec: { code: "IRA", scores: {R:0,I:0,A:0,S:0,E:0,C:0}, topThree: [...], maxScore: 24, interpretation: "..." },
  aptitude: { scores: { verbal: {correct,total,percentage}, numerical: {...}, abstract: {...}, spatial: {...}, clerical: {...} }, overall: 75, topStrengths: [...] },
  bigFive: { O:4.2, C:3.8, E:3.5, A:4.0, N:2.1, dominantTraits: [...] },
  workValues: { topThree: [...], scores: {...} },
  employability: { strengthAreas: [...], skillScores: {...} },
  knowledge: { score: 80, strongTopics: [...], weakTopics: [...] },
  careerFit: {
    clusters: [  // Exactly 3 clusters required
      { title: "...", fit: "High", matchScore: 92, description: "...", evidence: {interest,aptitude,personality}, roles: [...], domains: [...], whyItFits: "..." }
    ],
    specificOptions: { highFit: [...], mediumFit: [...], exploreLater: [...] }
  },
  skillGap: { priorityA: [{skill,current,target,gap},...], priorityB: [...] },
  roadmap: { projects: [...], milestones: [...] },
  finalNote: { advantage: "...", encouragement: "..." },
  overallSummary: "3-4 sentence summary",
  streamRecommendation: { recommendedStream, reasoning } // after10 only
}
```

### Grade-Level Section Prefix Mapping
Answer keys in DB use section prefixes that vary by grade level (`getSectionPrefix()` in `geminiAssessmentService.js`):

| Grade Level | RIASEC prefix | Big Five prefix | Aptitude prefix | Knowledge prefix | Values | Employability |
|-------------|---------------|-----------------|-----------------|------------------|--------|---------------|
| `middle` | `middle_interest_explorer` | `middle_strengths_character` | — | `middle_learning_preferences` | — | — |
| `highschool` | `hs_interest_explorer` | `hs_strengths_character` | `hs_aptitude_sampling` | `hs_learning_preferences` | — | — |
| `higher_secondary` | `riasec` | `bigfive` | `aptitude` | `knowledge` | `values` | `employability` |
| `after10`/`after12`/`college` | `riasec` | `bigfive` | `aptitude` | `knowledge` | `values` | `employability` |

### Submission Pipeline (End-to-End)
```
1. useAssessmentSubmission.ts → builds studentContext (program, degreeLevel from branch_field/grade)
2. geminiAssessmentService.js → prepareAssessmentData():
   - Extracts answers by section prefix → structured objects
   - Calculates aptitudeScores (or uses adaptive results)
   - Calculates rule-based stream hint (after10/after12)
   - Bundles: riasecAnswers, bigFiveAnswers, workValuesAnswers, employabilityAnswers, knowledgeAnswers, aptitudeScores, sectionTimings, studentContext, adaptiveAptitudeResults
3. callOpenRouterAssessment() → POST /api/analyze-assessment with auth token
4. Backend analyze.ts:
   - Selects prompt builder by gradeLevel (middle/highschool/higher_secondary/after10/college)
   - Generates deterministic seed from assessment data hash
   - Calls OpenRouter with model fallback: GPT-4o-mini → GPT-4o → Gemini 2.0 Flash → Llama 3.2
   - Repairs JSON → validates structure → retries with next model if invalid
   - Overrides AI aptitude zeros with adaptive results if available
5. Frontend validates response → saves to personal_assessment_results via assessmentService.js
```

### Score Validation & Correction
- **RIASEC validator** (`riasecScoreValidator.js`): If AI returns scores > 24 (max possible), recalculates from raw `riasec_*` answer keys using points formula
- **Aptitude validator** (`aptitudeScoreValidator.js`): Validates aptitude scores against actual answers
- **Backend adaptive fix** (`analyze.ts`): If adaptive aptitude results exist but AI returns all-zero aptitude scores, overrides with converted adaptive scores
- **Overall score fix**: Sets both `aptitude.overall` and `aptitude.overallScore` from adaptive `totalCorrect/totalQuestions`

### Hybrid Stream Recommendation (after10 students)
For `after10` grade level, a **rule-based recommendation** runs alongside AI:
1. `calculateStreamRecommendations()` from `streamMatchingEngine.js` scores RIASEC → stream fit (Science PCMS/PCMB, Commerce, Arts)
2. Flat profile detection: if RIASEC std dev < 2 or range < 4, lowers confidence to max 70%
3. Result sent to AI as `ruleBasedStreamHint` in the prompt for cross-validation
4. After AI responds, `validateStreamRecommendation()` in `assessmentService.js` ensures valid stream

### Adaptive Aptitude → Standard Score Conversion
When adaptive aptitude results exist, subtags are mapped to standard categories:

| Adaptive Subtag | Standard Category |
|----------------|-------------------|
| `verbal_reasoning` | verbal |
| `numerical_reasoning` + `data_interpretation` | numerical (combined) |
| `logical_reasoning` + `pattern_recognition` | abstract (combined) |
| `spatial_reasoning` | spatial |
| _(not tested)_ | clerical (0/0) |

Conversion happens in both `geminiAssessmentService.js` (frontend prep) and `analyze.ts` (backend fix).

### Course Recommendations & Enrichment
- `addCourseRecommendations()` aggregates skill gaps from last 5 assessments, deduplicates, fetches matching platform courses via `courseRecommendationService.js`
- **Enrichment** (`assessmentEnrichmentService.js`): Maps career titles → degree programs (with colleges, salary, duration), skill gaps → learning resources (Coursera, Udemy, edX), generates grade-appropriate roadmaps
- Course generation is **disabled during assessment** for speed — generated on-demand when user clicks a job role

### Database Tables (Assessment)
- `personal_assessment_attempts` — tracks each attempt (grade_level, stream_id, status, section_timings)
- `personal_assessment_results` — AI analysis results (riasec_scores, bigfive_scores, career_fit, skill_gap, roadmap, gemini_results)
- `personal_assessment_responses` — individual question responses
- `personal_assessment_sections` — section definitions by grade
- `personal_assessment_streams` — available streams (cs, bca, bba, dm, animation)

## AI Integration Patterns

### AI Provider Architecture
All backend AI calls go through **OpenRouter** (multi-model gateway). The shared config is in `functions/api/shared/ai-config.ts`.

| Layer | Pattern | Example |
|-------|---------|--------|
| Backend (Pages Functions) | OpenRouter API via `callOpenRouterWithRetry()` | Assessment analysis, question generation, career chat |
| Frontend (direct) | OpenAI JS SDK (client-side) | Career assistant, educator copilot, recruiter copilot, university AI |
| Embeddings | OpenRouter → `openai/text-embedding-3-small` | `cloudflare-workers/embedding-api/` |

### Backend AI (Cloudflare Pages Functions)
- **Shared config**: `functions/api/shared/ai-config.ts` — model lists, retry logic, JSON repair, `callOpenRouterWithRetry()`
- **Model fallback chain**: GPT-4o-mini → GPT-4o → Gemini 2.0 Flash → Llama 3.2 3B (free)
- **Assessment analysis**: `functions/api/analyze-assessment/` — grade-specific prompts, deterministic seed, strict validation
- **Question generation**: `functions/api/question-generation/` — career aptitude, knowledge, adaptive, course questions
- **Career chat**: `functions/api/career/handlers/chat.ts` — streaming responses, conversation memory, intent detection, guardrails
- **Career recommendations**: `functions/api/career/handlers/recommend.ts` — embedding-based job matching
- **AI tutor**: `functions/api/course/handlers/ai-tutor-chat.ts` — streaming chat with conversation phases
- **Video summarizer**: `functions/api/course/handlers/ai-video-summarizer.ts` — transcription, summaries, quizzes

### Frontend AI (Direct OpenAI SDK Calls)
Each feature module has its own `openAIClient.ts` using `VITE_OPENAI_API_KEY`:
- **Career Assistant** (`src/features/career-assistant/`) — intent detection, adaptive learning, code mentoring, technical explainer, industry knowledge, multi-modal learning, problem solver
- **Educator Copilot** (`src/features/educator-copilot/`) — student analysis, analytics, data-driven insights
- **Recruiter Copilot** (`src/features/recruiter-copilot/`) — candidate scoring, semantic search, pipeline intelligence, query parsing, talent analytics
- **University AI** (`src/features/university-ai/`) — counselling service

### AI Feature Module Structure (consistent pattern)
```
src/features/<feature>/
├── components/          # Chat UI, cards, visualizations
├── services/            # AI service + openAIClient.ts
├── prompts/             # System/user prompt templates
├── hooks/               # React hooks for state
├── types/               # TypeScript interfaces
├── config/              # Feature configuration
├── utils/               # Context builders, response formatters
└── index.ts             # Public exports
```

### Key AI Patterns
- **Model fallback**: Backend uses ordered model arrays; tries each until one succeeds
- **JSON repair**: `repairAndParseJSON()` handles markdown blocks, trailing commas, malformed responses
- **Validation-based fallback**: Assessment analysis validates AI response structure; retries with next model if incomplete
- **Deterministic seeding**: Assessment generates hash from input data for consistent results
- **Streaming**: Career chat and AI tutor use SSE (Server-Sent Events) for real-time responses
- **Rate limiting**: Backend endpoints use per-user rate limiting (e.g., 30 req/min)
- **Conversation memory**: Career chat compresses and stores conversation context in Supabase
- **Intent detection**: Career assistant and recruiter copilot classify user intent before routing to specialized handlers
- **Guardrails**: Career chat has safety guardrails for user input validation

### Environment Variables for AI
| Variable | Where Used | Purpose |
|----------|-----------|--------|
| `OPENROUTER_API_KEY` | Backend (`.dev.vars`) | All Pages Functions AI calls (assessment, career, question-gen, adaptive) |
| `VITE_OPENAI_API_KEY` | Frontend (`.env`) | Career assistant, educator copilot, recruiter copilot, university AI, career path drawer |
| `VITE_CLAUDE_API_KEY` | Frontend (`.env`) | Claude service (`claudeService.js`) — optional |
| `CLAUDE_API_KEY` | Backend (`.dev.vars`) | Direct Claude API calls from Pages Functions — optional |
| `GEMINI_API_KEY` | Backend (`.dev.vars`) | Legacy Gemini calls — mostly replaced by OpenRouter |

### Question Generation API (`/api/question-generation`)
| Endpoint | Type | Count | Use |
|----------|------|-------|-----|
| `POST /career-assessment/generate-aptitude` | MCQ | 50 | Career aptitude (6 subtypes: numerical, logical, verbal, spatial, data interpretation, pattern recognition) |
| `POST /career-assessment/generate-aptitude/stream` | SSE streaming | 50 | Same as above with real-time progress |
| `POST /career-assessment/generate-knowledge` | MCQ | 20 | Stream-specific knowledge questions |
| `POST /generate/diagnostic` | MCQ | 6 | Adaptive: diagnostic screener at difficulty 3 |
| `POST /generate/adaptive` | MCQ | 8-11 | Adaptive: core questions with variable difficulty |
| `POST /generate/stability` | MCQ | 4-6 | Adaptive: stability confirmation around provisional band |
| `POST /generate/single` | MCQ | 1 | Adaptive: single question by difficulty/subtag |
| `POST /generate` | MCQ | varies | Course-specific assessment questions |

### Career Chat Architecture (`/api/career`)
- **Streaming**: SSE via `handlers/chat.ts` — sends tokens as they arrive from OpenRouter
- **Conversation Phases** (`ai/conversation-phase.ts`): greeting → exploration → deep-dive → action-planning → follow-up
- **Intent Detection** (`ai/intent-detection.ts`): Classifies user messages into career-related intents before routing
- **Context Building** (`context/*.ts`): Assembles student profile, assessment results, course data, opportunity data into prompt context
- **Memory** (`ai/memory.ts`): Compresses long conversations, stores in Supabase for continuity
- **Guardrails** (`ai/guardrails.ts`): Validates input, blocks off-topic/harmful content
- **Prompt System**: Chain-of-thought (`chain-of-thought.ts`), few-shot examples (`few-shot.ts`), self-verification (`verification.ts`)

## Gotchas
- Build requires `--max-old-space-size=8192` due to large bundle size
- `.dev.vars` holds Cloudflare Workers secrets locally (not committed)
- `.env` / `.env.development` hold frontend env vars
- The `functions/` directory has its own `package.json` with separate dependencies
- Each Cloudflare Worker in `cloudflare-workers/` has its own `package.json` and `wrangler.toml`
- Many service files in `src/services/` are `.js` (not `.ts`) — mixed JS/TS codebase
- Supabase auth is used for authentication; role-based access throughout the app
- Frontend proxies `/api` calls to Pages Functions in dev (see `vite.config.ts` proxy config)
