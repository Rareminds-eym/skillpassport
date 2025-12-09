# Career AI Prompt Engineering System

## Overview

The Career AI Chat is a comprehensive career guidance assistant for students. It uses advanced prompt engineering techniques to provide personalized, data-driven career advice.

## Architecture

### 1. Context Layers

The system builds context from multiple database sources:

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT                             │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: AI Identity & Personality                         │
│  - Expert Career Counselor role                             │
│  - Warm, supportive, data-driven personality                │
│  - Indian job market expertise                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Student Profile (from students, skills, etc.)     │
│  - Name, department, university, CGPA                       │
│  - Technical & soft skills with levels                      │
│  - Education, experience, projects                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Assessment Results (from personal_assessment_*)   │
│  - RIASEC code & interpretation                             │
│  - Big Five personality traits                              │
│  - Aptitude scores                                          │
│  - AI-recommended careers & skill gaps                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Career Progress (from applied_jobs, etc.)         │
│  - Applied jobs with status                                 │
│  - Saved jobs                                               │
│  - Course enrollments & recommendations                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Available Opportunities (from opportunities)      │
│  - Real job listings from database                          │
│  - Anti-hallucination guardrails                            │
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Intent-Specific Instructions                      │
│  - Task definition & steps                                  │
│  - Output format                                            │
│  - Special case handling                                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 7: Phase Constraints                                 │
│  - Response length limits                                   │
│  - Depth of detail                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Intent Detection System

The system detects 10 different intents:

| Intent | Description | Trigger Keywords |
|--------|-------------|------------------|
| `find-jobs` | Job search & matching | job, opportunity, vacancy, hiring |
| `skill-gap` | Skill gap analysis | skill gap, missing skill, upskill |
| `interview-prep` | Interview preparation | interview, mock, HR round |
| `resume-review` | Profile/resume review | resume, CV, profile review |
| `learning-path` | Learning roadmap | roadmap, course, certification |
| `career-guidance` | Career path advice | career path, career switch |
| `assessment-insights` | Assessment interpretation | RIASEC, personality, assessment |
| `application-status` | Application tracking | my applications, status |
| `networking` | Networking advice | LinkedIn, network, connect |
| `general` | General assistance | hi, hello, help |

**Scoring System:**
- Chip selection: +50 points
- Strong keyword match: +20 points
- Weak keyword match: +10 points
- Conversation context: +15 points
- Confidence: High (≥50), Medium (≥20), Low (<20)

### 3. Conversation Phases

| Phase | Message Count | Max Tokens | Temperature | Purpose |
|-------|---------------|------------|-------------|---------|
| Opening | 0 | 500 | 0.8 | Brief, warm greeting |
| Exploring | 1-4 | 1800 | 0.7 | Understanding needs |
| Deep Dive | 5-10 | 3500 | 0.6 | Comprehensive guidance |
| Follow Up | 11+ | 2500 | 0.65 | Ongoing support |

### 4. Data Sources

```sql
-- Student Profile
students (name, email, department, university, cgpa, bio, hobbies, interests)
skills (name, type, level, verified)
education (degree, department, university, cgpa, year_of_passing)
experience (role, organization, duration)
projects (title, tech_stack, description)
trainings (title, organization, status)
certificates (title, issuer, issued_on)

-- Assessment Results
personal_assessment_results (
  riasec_code, riasec_scores,
  bigfive_scores, aptitude_scores,
  employability_scores, employability_readiness,
  career_fit, skill_gap, roadmap
)

-- Career Progress
applied_jobs (opportunity_id, application_status, applied_at)
saved_jobs (opportunity_id)
course_enrollments (course_id, progress, status)
student_course_recommendations (course_id, relevance_score, match_reasons)

-- Opportunities
opportunities (title, company_name, employment_type, location, skills_required)
```

## Key Features

### 1. Anti-Hallucination System

The prompt includes strict guardrails to prevent the AI from inventing jobs:

```xml
<CRITICAL_NOTICE>
  ⚠️ These are the ONLY real job opportunities available.
  ⚠️ NEVER invent, fabricate, or hallucinate job titles or companies.
  ⚠️ If asked to list all jobs, show ALL jobs from this list.
</CRITICAL_NOTICE>
```

### 2. RIASEC Interpretation

The system interprets RIASEC codes into practical career guidance:

- **R (Realistic)**: Hands-on, technical roles
- **I (Investigative)**: Research, data science
- **A (Artistic)**: Creative, design roles
- **S (Social)**: Teaching, HR, customer-facing
- **E (Enterprising)**: Sales, management, leadership
- **C (Conventional)**: Finance, administration

### 3. Personalization

Every response uses actual student data:
- References specific skills by name
- Mentions their projects and experience
- Uses assessment results for recommendations
- Avoids recommending already-applied jobs

### 4. Direct Database Responses

For "list all jobs" requests, the system bypasses AI and returns real database data directly, ensuring accuracy.

## Intent-Specific Prompts

### Find Jobs
- Matches student profile against real opportunities
- Calculates match scores (field 40%, skills 30%, experience 15%, location 15%)
- Checks for already-applied jobs
- Provides specific reasoning for each match

### Skill Gap Analysis
- Compares current skills vs market requirements
- Uses assessment-identified gaps if available
- Prioritizes by market demand
- Links to recommended courses

### Interview Prep
- Tailored to student's field and experience
- Uses STAR method for behavioral questions
- References their specific projects
- Considers personality profile for communication style

### Career Guidance
- Uses RIASEC code for career alignment
- Considers Big Five personality traits
- Provides multiple path options
- Includes growth trajectories

## Usage

The edge function is called via:

```typescript
POST /functions/v1/career-ai-chat
Authorization: Bearer <user_token>

{
  "conversationId": "optional-uuid",
  "message": "user message",
  "selectedChips": ["optional", "quick", "actions"]
}
```

Response is Server-Sent Events (SSE) stream:
```
event: token
data: {"content": "partial response..."}

event: done
data: {"conversationId": "uuid", "intent": "find-jobs", "phase": "exploring"}
```

## Best Practices

1. **Always fetch fresh context** - Student data may change between conversations
2. **Limit conversation history** - Only send last 10 messages to avoid token limits
3. **Use phase-appropriate responses** - Short in opening, detailed in deep dive
4. **Validate job recommendations** - Only recommend jobs from the database
5. **Leverage assessment data** - When available, use RIASEC and personality for better guidance
