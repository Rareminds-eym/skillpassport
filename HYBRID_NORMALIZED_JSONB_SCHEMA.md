# Hybrid Normalized + JSONB Schema Design
## Complete New Table Structure for Assessment System Consolidation

**Current State**: 15 tables  
**New State**: 9 tables (40% reduction)  
**Approach**: Keep normalized core, use JSONB for flexible/evolving data

---

## Table 1: `students` (UNCHANGED)

**Purpose**: Core student profile information  
**Status**: Keep as-is (referenced by other systems)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  grade TEXT,
  grade_start_date DATE,
  school_class_id UUID REFERENCES school_classes(id),
  school_id UUID REFERENCES schools(id),
  university_college_id UUID REFERENCES university_colleges(id),
  program_id UUID REFERENCES programs(id),
  course_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_email ON students(email);
```

**Why Unchanged**: 
- Referenced by many other systems (jobs, applications, etc.)
- Core identity table
- No benefit from consolidation

---

## Table 2: `assessment_metadata` (NEW - Consolidates 3 tables)

**Purpose**: Static assessment configuration (streams, sections, scales)  
**Consolidates**: 
- `personal_assessment_streams` 
- `personal_assessment_sections`
- `personal_assessment_response_scales`

```sql
CREATE TABLE assessment_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata_type TEXT NOT NULL, -- 'stream', 'section', 'scale'
  code TEXT NOT NULL, -- Unique identifier (e.g., 'cs', 'riasec', 'likert_5')
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  
  -- Configuration stored as JSONB for flexibility
  config JSONB NOT NULL DEFAULT '{}',
  /* 
    For 'stream': {
      "is_active": true,
      "display_order": 1
    }
    
    For 'section': {
      "grade_level": "college",
      "is_stream_specific": false,
      "is_timed": true,
      "time_limit_seconds": 1800,
      "order_number": 1,
      "is_active": true,
      "question_count": 60
    }
    
    For 'scale': {
      "grade_level": "college",
      "section_code": "riasec",
      "scale_type": "likert_5",
      "scale_values": [
        {"value": 1, "label": "Strongly Disagree"},
        {"value": 2, "label": "Disagree"},
        {"value": 3, "label": "Neutral"},
        {"value": 4, "label": "Agree"},
        {"value": 5, "label": "Strongly Agree"}
      ]
    }
  */
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(metadata_type, code)
);

CREATE INDEX idx_metadata_type ON assessment_metadata(metadata_type);
CREATE INDEX idx_metadata_code ON assessment_metadata(code);
CREATE INDEX idx_metadata_type_code ON assessment_metadata(metadata_type, code);
CREATE INDEX idx_metadata_active ON assessment_metadata(is_active) WHERE is_active = true;
CREATE INDEX idx_metadata_config_gin ON assessment_metadata USING GIN (config);
```

**Why Consolidated**:
- All three are static configuration tables
- Rarely updated
- Similar structure (id, name, description, config)
- JSONB allows flexible configuration per type
- Reduces JOIN complexity

**Migration Strategy**:
```sql
-- Migrate streams
INSERT INTO assessment_metadata (metadata_type, code, name, description, config, is_active)
SELECT 
  'stream',
  id,
  name,
  description,
  jsonb_build_object('display_order', 1),
  is_active
FROM personal_assessment_streams;

-- Migrate sections
INSERT INTO assessment_metadata (metadata_type, code, name, title, description, config, is_active)
SELECT 
  'section',
  name,
  name,
  title,
  description,
  jsonb_build_object(
    'grade_level', grade_level,
    'is_stream_specific', is_stream_specific,
    'is_timed', is_timed,
    'time_limit_seconds', time_limit_seconds,
    'order_number', order_number
  ),
  is_active
FROM personal_assessment_sections;

-- Migrate scales
INSERT INTO assessment_metadata (metadata_type, code, name, config, is_active)
SELECT 
  'scale',
  scale_type || '_' || grade_level,
  scale_type,
  jsonb_build_object(
    'grade_level', grade_level,
    'section_id', section_id,
    'scale_type', scale_type,
    'scale_values', scale_values
  ),
  true
FROM personal_assessment_response_scales;
```

---

## Table 3: `assessment_questions` (NEW - Consolidates 1 table, enhanced)

**Purpose**: Question bank for all assessment types  
**Consolidates**: `personal_assessment_questions`  
**Enhancement**: Better organization with JSONB

```sql
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question classification
  section_code TEXT NOT NULL, -- References assessment_metadata(code) where type='section'
  stream_code TEXT, -- References assessment_metadata(code) where type='stream', NULL for general
  question_type TEXT NOT NULL, -- 'mcq', 'rating', 'sjt', 'text', 'multiselect'
  subtype TEXT, -- 'verbal', 'numerical', 'clerical', 'abstract', etc.
  difficulty_level INTEGER, -- 1-5 for adaptive questions
  
  -- Question content
  question_text TEXT NOT NULL,
  module_title TEXT,
  
  -- Answer configuration stored as JSONB
  answer_config JSONB NOT NULL DEFAULT '{}',
  /*
    For MCQ: {
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this is correct..."
    }
    
    For Rating: {
      "scale_code": "likert_5",
      "dimension": "openness" // For Big Five
    }
    
    For SJT: {
      "scenario": "You are working on a team project...",
      "options": [
        {"text": "Talk to team lead", "score": 5},
        {"text": "Ignore the issue", "score": 1}
      ]
    }
    
    For Multiselect: {
      "options": ["Option A", "Option B", "Option C"],
      "correct_answers": ["Option A", "Option C"],
      "min_selections": 1,
      "max_selections": 3
    }
  */
  
  -- Metadata
  order_number INTEGER,
  estimated_time_seconds INTEGER, -- Expected time to answer
  tags JSONB DEFAULT '[]', -- ["critical_thinking", "problem_solving"]
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_questions_section ON assessment_questions(section_code);
CREATE INDEX idx_questions_stream ON assessment_questions(stream_code);
CREATE INDEX idx_questions_type ON assessment_questions(question_type);
CREATE INDEX idx_questions_subtype ON assessment_questions(subtype);
CREATE INDEX idx_questions_difficulty ON assessment_questions(difficulty_level);
CREATE INDEX idx_questions_section_stream ON assessment_questions(section_code, stream_code);
CREATE INDEX idx_questions_active ON assessment_questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_config_gin ON assessment_questions USING GIN (answer_config);
CREATE INDEX idx_questions_tags_gin ON assessment_questions USING GIN (tags);
```

**Why Enhanced**:
- JSONB `answer_config` allows different question types without schema changes
- `tags` JSONB array enables flexible categorization
- `difficulty_level` supports adaptive testing
- `estimated_time_seconds` helps with time management

**Migration Strategy**:
```sql
INSERT INTO assessment_questions (
  section_code, stream_code, question_type, subtype,
  question_text, module_title, answer_config, order_number, is_active
)
SELECT 
  s.name as section_code,
  q.stream_id as stream_code,
  q.question_type,
  q.subtype,
  q.question_text,
  q.module_title,
  jsonb_build_object(
    'options', q.options,
    'correct_answer', q.correct_answer
  ),
  q.order_number,
  q.is_active
FROM personal_assessment_questions q
JOIN personal_assessment_sections s ON s.id = q.section_id;
```

---

## Table 4: `assessment_sessions` (NEW - Consolidates 2 tables)

**Purpose**: Unified session tracking for all assessment types  
**Consolidates**: 
- `personal_assessment_attempts`
- `adaptive_aptitude_sessions`

```sql
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student reference
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Session type and configuration
  session_type TEXT NOT NULL, -- 'regular', 'adaptive', 'quick'
  grade_level TEXT NOT NULL, -- 'middle', 'highschool', 'higher_secondary', 'after12', 'college'
  stream_code TEXT, -- References assessment_metadata(code) where type='stream'
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Progress state stored as JSONB
  progress_state JSONB NOT NULL DEFAULT '{}',
  /*
    For regular assessment: {
      "current_section_index": 2,
      "current_question_index": 15,
      "sections_completed": ["riasec", "bigfive"],
      "timer_remaining": 1200,
      "elapsed_time": 3600,
      "aptitude_question_timer": 45,
      "section_timings": {
        "riasec": 600,
        "bigfive": 450,
        "aptitude": 2550
      }
    }
    
    For adaptive assessment: {
      "current_phase": "assessment", // 'calibration', 'assessment', 'complete'
      "current_difficulty": 3,
      "questions_answered": 25,
      "current_question_index": 25,
      "estimated_ability": 0.75,
      "confidence_level": 0.85,
      "ability_history": [0.5, 0.6, 0.7, 0.75],
      "difficulty_history": [1, 2, 2, 3, 3, 3]
    }
  */
  
  -- Collected responses (for non-UUID questions like RIASEC, BigFive)
  collected_responses JSONB DEFAULT '{}',
  /*
    {
      "riasec": {
        "q1": 4, "q2": 5, "q3": 2, ...
      },
      "bigfive": {
        "openness_1": 5, "openness_2": 3, ...
      },
      "values": {
        "achievement": 4, "autonomy": 5, ...
      },
      "employability": {
        "communication": 4, "teamwork": 5, ...
      }
    }
  */
  
  -- Calculated scores (stored here for quick access)
  calculated_scores JSONB DEFAULT '{}',
  /*
    {
      "aptitude": {
        "verbal": 75, "numerical": 82, "clerical": 68, "overall": 75
      },
      "knowledge": {
        "domain_specific": 78, "general": 82, "overall": 80
      },
      "adaptive_ability": 0.75
    }
  */
  
  -- Metadata
  user_agent TEXT, -- Browser/device info
  ip_address INET, -- For security/analytics
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON assessment_sessions(student_id);
CREATE INDEX idx_sessions_status ON assessment_sessions(status);
CREATE INDEX idx_sessions_type ON assessment_sessions(session_type);
CREATE INDEX idx_sessions_grade ON assessment_sessions(grade_level);
CREATE INDEX idx_sessions_stream ON assessment_sessions(stream_code);
CREATE INDEX idx_sessions_student_status ON assessment_sessions(student_id, status);
CREATE INDEX idx_sessions_completed ON assessment_sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sessions_progress_gin ON assessment_sessions USING GIN (progress_state);
CREATE INDEX idx_sessions_responses_gin ON assessment_sessions USING GIN (collected_responses);
CREATE INDEX idx_sessions_scores_gin ON assessment_sessions USING GIN (calculated_scores);
```

**Why Consolidated**:
- Both track assessment sessions with similar fields
- JSONB `progress_state` handles different session types
- Eliminates need for separate adaptive session table
- Unified querying for all session types

**Migration Strategy**:
```sql
-- Migrate regular assessment attempts
INSERT INTO assessment_sessions (
  id, student_id, session_type, grade_level, stream_code, status,
  started_at, completed_at, progress_state, collected_responses, calculated_scores
)
SELECT 
  id,
  student_id,
  'regular',
  grade_level,
  stream_id,
  status,
  started_at,
  completed_at,
  jsonb_build_object(
    'current_section_index', current_section_index,
    'current_question_index', current_question_index,
    'timer_remaining', timer_remaining,
    'elapsed_time', elapsed_time,
    'aptitude_question_timer', aptitude_question_timer,
    'section_timings', section_timings
  ),
  all_responses,
  jsonb_build_object(
    'aptitude', aptitude_scores,
    'knowledge', knowledge_scores
  )
FROM personal_assessment_attempts;

-- Migrate adaptive sessions
INSERT INTO assessment_sessions (
  id, student_id, session_type, grade_level, status,
  started_at, completed_at, progress_state
)
SELECT 
  id,
  student_id,
  'adaptive',
  grade_level,
  status,
  started_at,
  completed_at,
  jsonb_build_object(
    'current_phase', current_phase,
    'current_difficulty', current_difficulty,
    'questions_answered', questions_answered,
    'current_question_index', current_question_index,
    'estimated_ability', estimated_ability,
    'confidence_level', confidence_level
  )
FROM adaptive_aptitude_sessions;
```

---

## Table 5: `assessment_responses` (NEW - Consolidates 2 tables)

**Purpose**: Individual question responses for all assessment types  
**Consolidates**: 
- `personal_assessment_responses`
- `adaptive_aptitude_responses`

```sql
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session reference
  session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  
  -- Response type and classification
  response_type TEXT NOT NULL, -- 'mcq', 'adaptive', 'rating', 'text', 'multiselect'
  
  -- Question reference (can be UUID or string identifier)
  question_id UUID REFERENCES assessment_questions(id), -- NULL for AI-generated questions
  question_identifier TEXT, -- For AI-generated or dynamic questions
  question_text TEXT, -- Store question text for AI-generated questions
  
  -- Response data stored as JSONB
  response_data JSONB NOT NULL,
  /*
    For MCQ: {
      "selected_answer": "Option A",
      "correct_answer": "Option A",
      "is_correct": true,
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
    
    For Adaptive: {
      "selected_answer": "Option B",
      "correct_answer": "Option A",
      "is_correct": false,
      "difficulty_level": 3,
      "time_taken_seconds": 45,
      "sequence_number": 12
    }
    
    For Rating: {
      "rating_value": 4,
      "scale_type": "likert_5",
      "dimension": "openness"
    }
    
    For Multiselect: {
      "selected_answers": ["Option A", "Option C"],
      "correct_answers": ["Option A", "Option C"],
      "is_correct": true
    }
    
    For Text: {
      "text_response": "My answer is...",
      "word_count": 25
    }
  */
  
  -- Scoring
  is_correct BOOLEAN, -- NULL for non-scored questions
  points_earned NUMERIC, -- For weighted scoring
  
  -- Timing
  time_taken_seconds INTEGER,
  responded_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  attempt_number INTEGER DEFAULT 1, -- If question can be retried
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_responses_session ON assessment_responses(session_id);
CREATE INDEX idx_responses_type ON assessment_responses(response_type);
CREATE INDEX idx_responses_question ON assessment_responses(question_id);
CREATE INDEX idx_responses_correct ON assessment_responses(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX idx_responses_session_type ON assessment_responses(session_id, response_type);
CREATE INDEX idx_responses_responded ON assessment_responses(responded_at);
CREATE INDEX idx_responses_data_gin ON assessment_responses USING GIN (response_data);
```

**Why Consolidated**:
- Both store individual question responses
- JSONB `response_data` handles all response types
- Unified querying for analytics
- Supports both database questions and AI-generated questions

**Migration Strategy**:
```sql
-- Migrate regular assessment responses
INSERT INTO assessment_responses (
  session_id, response_type, question_id, response_data, is_correct, responded_at
)
SELECT 
  attempt_id,
  'mcq',
  question_id,
  jsonb_build_object(
    'selected_answer', response_value,
    'is_correct', is_correct
  ),
  is_correct,
  responded_at
FROM personal_assessment_responses;

-- Migrate adaptive responses
INSERT INTO assessment_responses (
  session_id, response_type, question_identifier, question_text, response_data, is_correct, time_taken_seconds, responded_at
)
SELECT 
  session_id,
  'adaptive',
  question_id::text,
  question_text,
  jsonb_build_object(
    'selected_answer', selected_answer,
    'correct_answer', correct_answer,
    'is_correct', is_correct,
    'difficulty_level', difficulty_level,
    'sequence_number', sequence_number
  ),
  is_correct,
  time_taken_seconds,
  responded_at
FROM adaptive_aptitude_responses;
```

---

## Table 6: `assessment_results` (NEW - Consolidates 2 tables)

**Purpose**: Final assessment results and AI analysis  
**Consolidates**: 
- `personal_assessment_results`
- `adaptive_aptitude_results`

```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session reference (one-to-one relationship)
  session_id UUID NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Result type
  result_type TEXT NOT NULL, -- 'comprehensive', 'adaptive', 'quick'
  grade_level TEXT NOT NULL,
  stream_code TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'completed',
  
  -- Core assessment scores (normalized columns for fast queries)
  riasec_code TEXT, -- Top 3 RIASEC code (e.g., 'RIA')
  aptitude_overall NUMERIC, -- Overall aptitude percentage
  knowledge_overall NUMERIC, -- Overall knowledge score
  employability_readiness TEXT, -- 'high', 'medium', 'low'
  adaptive_ability_score NUMERIC, -- For adaptive assessments
  adaptive_tier TEXT, -- 'high', 'medium', 'low'
  
  -- Detailed analysis stored as JSONB
  analysis_data JSONB NOT NULL DEFAULT '{}',
  /*
    {
      "riasec": {
        "scores": {"R": 75, "I": 82, "A": 45, "S": 60, "E": 55, "C": 70},
        "code": "RIA",
        "top_traits": ["Investigative", "Realistic", "Artistic"]
      },
      
      "aptitude": {
        "scores": {
          "verbal": 75, "numerical": 82, "clerical": 68,
          "abstract": 78, "spatial": 72, "mechanical": 65
        },
        "overall": 75,
        "strengths": ["numerical", "abstract"],
        "weaknesses": ["mechanical"]
      },
      
      "bigfive": {
        "scores": {
          "openness": 85, "conscientiousness": 78,
          "extraversion": 65, "agreeableness": 72, "neuroticism": 45
        }
      },
      
      "work_values": {
        "scores": {
          "achievement": 80, "autonomy": 75, "recognition": 65,
          "relationships": 70, "support": 68, "working_conditions": 72
        }
      },
      
      "employability": {
        "scores": {
          "communication": 78, "teamwork": 82, "problem_solving": 85,
          "adaptability": 75, "leadership": 70
        },
        "readiness": "high",
        "strengths": ["problem_solving", "teamwork"],
        "areas_for_improvement": ["leadership"]
      },
      
      "knowledge": {
        "score": 78,
        "details": {
          "domain_specific": 80,
          "general": 76,
          "by_topic": {
            "programming": 85,
            "databases": 75,
            "networking": 70
          }
        }
      },
      
      "adaptive": {
        "final_ability_score": 0.75,
        "confidence_level": 0.85,
        "tier": "high",
        "questions_answered": 30,
        "correct_answers": 22,
        "accuracy_percentage": 73.33,
        "category_scores": {
          "verbal": 0.78, "numerical": 0.82, "abstract": 0.70
        },
        "difficulty_progression": [1, 2, 2, 3, 3, 3, 4, 4, 3],
        "response_times": {
          "average": 42,
          "median": 38,
          "min": 15,
          "max": 90
        }
      }
    }
  */
  
  -- Career recommendations
  career_recommendations JSONB DEFAULT '{}',
  /*
    {
      "career_fit": [
        {
          "cluster": "Technology",
          "careers": ["Software Engineer", "Data Scientist"],
          "fit_score": 85,
          "reasoning": "Strong analytical and problem-solving skills..."
        }
      ],
      "top_careers": [
        {"title": "Software Engineer", "fit_score": 90},
        {"title": "Data Scientist", "fit_score": 85}
      ]
    }
  */
  
  -- Skill gap analysis
  skill_gap_analysis JSONB DEFAULT '{}',
  /*
    {
      "skill_gaps": [
        {
          "skill": "Machine Learning",
          "current_level": "beginner",
          "target_level": "intermediate",
          "priority": "high"
        }
      ],
      "recommended_courses": [
        {
          "title": "Introduction to Machine Learning",
          "provider": "Coursera",
          "duration": "6 weeks",
          "skill_addressed": "Machine Learning"
        }
      ],
      "platform_courses": [
        {
          "id": "course-123",
          "title": "ML Fundamentals",
          "type": "video",
          "duration": "4 hours"
        }
      ],
      "courses_by_type": {
        "technical": [...],
        "soft_skills": [...],
        "domain_knowledge": [...]
      }
    }
  */
  
  -- Development roadmap
  roadmap JSONB DEFAULT '{}',
  /*
    {
      "short_term": [
        {
          "goal": "Learn Python basics",
          "timeline": "1-2 months",
          "resources": [...],
          "projects": [...]
        }
      ],
      "medium_term": [...],
      "long_term": [...],
      "milestones": [
        {
          "title": "Complete first project",
          "target_date": "2025-03-31",
          "status": "pending"
        }
      ]
    }
  */
  
  -- AI-generated insights
  ai_insights JSONB DEFAULT '{}',
  /*
    {
      "overall_summary": "Based on your assessment...",
      "final_note": "You show strong potential in...",
      "strengths": ["Analytical thinking", "Problem solving"],
      "areas_for_growth": ["Communication", "Leadership"],
      "personalized_advice": "Focus on developing...",
      "gemini_raw_response": {...} // Full AI response
    }
  */
  
  -- Timing analysis
  timing_analysis JSONB DEFAULT '{}',
  /*
    {
      "total_time_seconds": 3600,
      "section_times": {
        "riasec": 600,
        "bigfive": 450,
        "aptitude": 2550
      },
      "average_question_time": 45,
      "fastest_section": "riasec",
      "slowest_section": "aptitude"
    }
  */
  
  -- Profile snapshot at time of assessment
  profile_snapshot JSONB DEFAULT '{}',
  /*
    {
      "name": "John Doe",
      "email": "john@example.com",
      "grade": "12",
      "program": "Computer Science",
      "school": "ABC High School"
    }
  */
  
  -- Quality metrics
  quality_metrics JSONB DEFAULT '{}',
  /*
    {
      "duplicate_questions_detected": 0,
      "duplicate_question_ids": [],
      "completion_rate": 100,
      "response_consistency": 0.85,
      "time_consistency": 0.78
    }
  */
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_results_session ON assessment_results(session_id);
CREATE INDEX idx_results_student ON assessment_results(student_id);
CREATE INDEX idx_results_type ON assessment_results(result_type);
CREATE INDEX idx_results_riasec ON assessment_results(riasec_code);
CREATE INDEX idx_results_aptitude ON assessment_results(aptitude_overall);
CREATE INDEX idx_results_tier ON assessment_results(adaptive_tier);
CREATE INDEX idx_results_created ON assessment_results(created_at);
CREATE INDEX idx_results_analysis_gin ON assessment_results USING GIN (analysis_data);
CREATE INDEX idx_results_careers_gin ON assessment_results USING GIN (career_recommendations);
CREATE INDEX idx_results_skills_gin ON assessment_results USING GIN (skill_gap_analysis);
CREATE INDEX idx_results_roadmap_gin ON assessment_results USING GIN (roadmap);
CREATE INDEX idx_results_insights_gin ON assessment_results USING GIN (ai_insights);
```

**Why Consolidated**:
- Both store final assessment results
- JSONB allows flexible storage of different result types
- Normalized columns (riasec_code, aptitude_overall) for fast filtering
- All AI analysis in one place

**Migration Strategy**:
```sql
-- Migrate regular assessment results
INSERT INTO assessment_results (
  session_id, student_id, result_type, grade_level, stream_code, status,
  riasec_code, aptitude_overall, knowledge_overall, employability_readiness,
  analysis_data, career_recommendations, skill_gap_analysis, roadmap, ai_insights,
  timing_analysis, profile_snapshot
)
SELECT 
  attempt_id,
  student_id,
  'comprehensive',
  grade_level,
  stream_id,
  status,
  riasec_code,
  aptitude_overall,
  knowledge_score,
  employability_readiness,
  jsonb_build_object(
    'riasec', jsonb_build_object('scores', riasec_scores, 'code', riasec_code),
    'aptitude', jsonb_build_object('scores', aptitude_scores, 'overall', aptitude_overall),
    'bigfive', jsonb_build_object('scores', bigfive_scores),
    'work_values', jsonb_build_object('scores', work_values_scores),
    'employability', jsonb_build_object('scores', employability_scores, 'readiness', employability_readiness),
    'knowledge', jsonb_build_object('score', knowledge_score, 'details', knowledge_details)
  ),
  jsonb_build_object('career_fit', career_fit),
  jsonb_build_object(
    'skill_gaps', skill_gap,
    'recommended_courses', skill_gap_courses,
    'platform_courses', platform_courses,
    'courses_by_type', courses_by_type
  ),
  roadmap,
  jsonb_build_object(
    'overall_summary', overall_summary,
    'final_note', final_note,
    'gemini_raw_response', gemini_results
  ),
  timing_analysis,
  profile_snapshot
FROM personal_assessment_results;

-- Migrate adaptive results
INSERT INTO assessment_results (
  session_id, student_id, result_type, grade_level, status,
  adaptive_ability_score, adaptive_tier,
  analysis_data, quality_metrics
)
SELECT 
  session_id,
  student_id,
  'adaptive',
  grade_level,
  'completed',
  final_ability_score,
  tier,
  jsonb_build_object(
    'adaptive', jsonb_build_object(
      'final_ability_score', final_ability_score,
      'confidence_level', confidence_level,
      'tier', tier,
      'questions_answered', questions_answered,
      'correct_answers', correct_answers,
      'accuracy_percentage', accuracy_percentage,
      'category_scores', category_scores,
      'difficulty_progression', difficulty_progression,
      'response_times', response_times
    )
  ),
  jsonb_build_object(
    'duplicate_questions_detected', duplicate_questions_detected,
    'duplicate_question_ids', duplicate_question_ids
  )
FROM adaptive_aptitude_results;
```

---

## Table 7: `assessment_question_cache` (NEW - Replaces 1 table)

**Purpose**: Cache AI-generated questions per student/stream  
**Replaces**: `career_assessment_ai_questions`  
**Enhancement**: Better organization and versioning

```sql
CREATE TABLE assessment_question_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student and context
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stream_code TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  question_category TEXT NOT NULL, -- 'aptitude', 'knowledge', 'custom'
  
  -- Session reference (optional - for session-specific questions)
  session_id UUID REFERENCES assessment_sessions(id) ON DELETE SET NULL,
  
  -- Cached questions stored as JSONB
  questions JSONB NOT NULL,
  /*
    [
      {
        "id": 1,
        "category": "verbal",
        "type": "mcq",
        "difficulty": "medium",
        "question": "What is the synonym of 'abundant'?",
        "options": ["Scarce", "Plentiful", "Limited", "Rare"],
        "correct_answer": "Plentiful",
        "skill_tag": "vocabulary",
        "estimated_time": 30
      },
      {
        "id": 2,
        "category": "numerical",
        "type": "mcq",
        "difficulty": "hard",
        "question": "If x + 5 = 12, what is x?",
        "options": ["5", "7", "17", "12"],
        "correct_answer": "7",
        "skill_tag": "algebra",
        "estimated_time": 45
      }
    ]
  */
  
  -- Generation metadata
  generation_config JSONB DEFAULT '{}',
  /*
    {
      "model": "gemini-1.5-pro",
      "temperature": 0.7,
      "prompt_version": "v2.1",
      "generation_time_ms": 2500,
      "token_count": 1500
    }
  */
  
  -- Cache management
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP, -- When cache should be invalidated
  version INTEGER DEFAULT 1, -- For versioning question sets
  
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cache_student ON assessment_question_cache(student_id);
CREATE INDEX idx_cache_stream ON assessment_question_cache(stream_code);
CREATE INDEX idx_cache_category ON assessment_question_cache(question_category);
CREATE INDEX idx_cache_session ON assessment_question_cache(session_id);
CREATE INDEX idx_cache_active ON assessment_question_cache(is_active) WHERE is_active = true;
CREATE INDEX idx_cache_expires ON assessment_question_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_cache_student_stream_cat ON assessment_question_cache(student_id, stream_code, question_category);
CREATE INDEX idx_cache_questions_gin ON assessment_question_cache USING GIN (questions);
```

**Why Enhanced**:
- Better cache management with `expires_at` and `version`
- `generation_config` tracks AI model settings
- Can cache questions per session or globally per student
- JSONB allows flexible question structure

**Migration Strategy**:
```sql
INSERT INTO assessment_question_cache (
  student_id, stream_code, grade_level, question_category,
  session_id, questions, is_active, generated_at
)
SELECT 
  student_id,
  stream_id,
  grade_level,
  question_type,
  attempt_id,
  questions,
  is_active,
  generated_at
FROM career_assessment_ai_questions;
```

---

## Table 8: `school_classes` (UNCHANGED)

**Purpose**: School class information  
**Status**: Keep as-is (referenced by students table and other systems)

```sql
CREATE TABLE school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  grade TEXT NOT NULL,
  section TEXT,
  academic_year TEXT NOT NULL,
  class_teacher_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_classes_school ON school_classes(school_id);
CREATE INDEX idx_classes_grade ON school_classes(grade);
```

**Why Unchanged**: Referenced by students and other school management features

---

## Table 9: `programs` (UNCHANGED)

**Purpose**: College/university programs  
**Status**: Keep as-is (referenced by students table and other systems)

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_college_id UUID REFERENCES university_colleges(id),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  degree_type TEXT, -- 'bachelor', 'master', 'diploma'
  duration_years INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_programs_college ON programs(university_college_id);
CREATE INDEX idx_programs_code ON programs(code);
CREATE INDEX idx_programs_active ON programs(is_active) WHERE is_active = true;
```

**Why Unchanged**: Referenced by students and other academic management features

---

## Summary: Table Consolidation

### Before (15 tables):
1. students
2. personal_assessment_streams
3. personal_assessment_sections
4. personal_assessment_questions
5. personal_assessment_response_scales
6. personal_assessment_attempts
7. personal_assessment_responses
8. personal_assessment_results
9. career_assessment_ai_questions
10. adaptive_aptitude_sessions
11. adaptive_aptitude_responses
12. adaptive_aptitude_results
13. school_classes
14. programs
15. notifications

### After (9 tables):
1. **students** (unchanged)
2. **assessment_metadata** (consolidates 3: streams, sections, scales)
3. **assessment_questions** (replaces 1: questions)
4. **assessment_sessions** (consolidates 2: attempts, adaptive_sessions)
5. **assessment_responses** (consolidates 2: responses, adaptive_responses)
6. **assessment_results** (consolidates 2: results, adaptive_results)
7. **assessment_question_cache** (replaces 1: ai_questions)
8. **school_classes** (unchanged)
9. **programs** (unchanged)

**Reduction**: 15 → 9 tables (40% reduction)

**Note**: `notifications` table removed from assessment-specific list as it's a general system table used by many features, not assessment-specific.

---

## Key Benefits of This Design

### 1. Reduced Complexity
- 40% fewer tables to manage
- Fewer JOINs in queries
- Simpler schema to understand

### 2. Flexibility
- JSONB allows schema evolution without migrations
- Easy to add new assessment types
- Supports different question formats

### 3. Performance
- Normalized columns for fast filtering (riasec_code, aptitude_overall)
- GIN indexes on JSONB for flexible queries
- Fewer tables = better cache utilization

### 4. Maintainability
- Unified session management
- Consistent response storage
- Single source of truth for results

### 5. Scalability
- JSONB compression reduces storage
- Partitioning-ready design
- Efficient indexing strategy

---

## Query Examples

### Get student's latest assessment
```sql
SELECT 
  s.*,
  r.riasec_code,
  r.aptitude_overall,
  r.analysis_data->'riasec'->'scores' as riasec_scores
FROM assessment_sessions s
JOIN assessment_results r ON r.session_id = s.id
WHERE s.student_id = $1
  AND s.status = 'completed'
ORDER BY s.completed_at DESC
LIMIT 1;
```

### Get all responses for a session
```sql
SELECT 
  response_type,
  question_text,
  response_data->>'selected_answer' as answer,
  is_correct,
  time_taken_seconds
FROM assessment_responses
WHERE session_id = $1
ORDER BY responded_at;
```

### Get active streams and sections
```sql
-- Get streams
SELECT code, name, description
FROM assessment_metadata
WHERE metadata_type = 'stream'
  AND is_active = true
ORDER BY config->>'display_order';

-- Get sections for a grade level
SELECT code, name, title, config
FROM assessment_metadata
WHERE metadata_type = 'section'
  AND config->>'grade_level' = 'college'
  AND is_active = true
ORDER BY (config->>'order_number')::int;
```

### Get questions for a section
```sql
SELECT 
  id,
  question_text,
  question_type,
  subtype,
  answer_config->>'options' as options,
  answer_config->>'correct_answer' as correct_answer
FROM assessment_questions
WHERE section_code = 'aptitude'
  AND stream_code = 'cs'
  AND is_active = true
ORDER BY order_number;
```

### Get cached AI questions
```sql
SELECT questions
FROM assessment_question_cache
WHERE student_id = $1
  AND stream_code = $2
  AND question_category = 'aptitude'
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY generated_at DESC
LIMIT 1;
```

### Analytics: Average aptitude by stream
```sql
SELECT 
  s.stream_code,
  COUNT(*) as total_assessments,
  AVG(r.aptitude_overall) as avg_aptitude,
  AVG(r.knowledge_overall) as avg_knowledge
FROM assessment_sessions s
JOIN assessment_results r ON r.session_id = s.id
WHERE s.status = 'completed'
  AND s.completed_at > NOW() - INTERVAL '6 months'
GROUP BY s.stream_code
ORDER BY avg_aptitude DESC;
```

---

## Migration Checklist

- [ ] Create new tables with indexes
- [ ] Migrate data from old tables (use provided migration scripts)
- [ ] Verify data integrity (row counts, FK constraints)
- [ ] Update application code (services, hooks, components)
- [ ] Update API endpoints
- [ ] Run comprehensive tests
- [ ] Deploy to staging
- [ ] Monitor performance
- [ ] Deploy to production
- [ ] Keep old tables for 2 weeks (rollback safety)
- [ ] Drop old tables after verification

---

## Rollback Plan

```sql
-- If migration fails, rename tables back
ALTER TABLE assessment_metadata RENAME TO assessment_metadata_failed;
ALTER TABLE personal_assessment_streams_backup RENAME TO personal_assessment_streams;
-- ... repeat for all tables

-- If migration succeeds, after 2 weeks:
DROP TABLE personal_assessment_streams_backup;
DROP TABLE personal_assessment_sections_backup;
-- ... drop all backup tables
```

---

**Document Status**: ✅ COMPLETE  
**Schema Version**: 2.0 (Hybrid Normalized + JSONB)  
**Last Updated**: 2025-01-31  
**Total Tables**: 9 (down from 15)

