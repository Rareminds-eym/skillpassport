# 🤖 Recruiter Copilot - Intelligent AI System for Recruiters

> **Enterprise-grade AI-powered recruitment intelligence system** designed with senior-level prompt engineering and advanced database optimization.

---

## 🎯 Overview

The Recruiter Copilot is an sophisticated AI agent that helps recruiters make data-driven hiring decisions by intelligently understanding natural language queries, performing semantic candidate searches, and providing actionable insights.

### Key Features

- **🧠 Natural Language Understanding**: Parse complex recruiter queries using LLM-based intent classification
- **🔍 Semantic Search**: Vector embedding-based candidate matching beyond keyword search
- **📊 Multi-Factor Scoring**: Comprehensive candidate assessment considering skills, training, certifications, and academics
- **🚀 Pipeline Intelligence**: Track candidate journey, identify bottlenecks, and predict hiring outcomes
- **💡 Proactive Recommendations**: Context-aware suggestions and alternative strategies

---

## 🏗️ Architecture

### System Components

```
recruiter-copilot/
├── services/
│   ├── queryParser.ts              # NLP-powered query understanding
│   ├── semanticSearch.ts           # Vector embedding search & hybrid search
│   ├── recruiterInsights.ts        # Candidate discovery & matching
│   ├── talentAnalytics.ts          # Pool-wide analytics
│   ├── pipelineIntelligence.ts     # Pipeline analysis & tracking
│   └── recruiterIntelligenceEngine.ts  # Main orchestration
├── prompts/
│   ├── intelligentPrompt.ts        # Base prompt templates
│   └── advancedPrompts.ts          # Senior-level prompt engineering
├── types/
│   ├── index.ts                    # Core type definitions
│   └── database.ts                 # Database schema types
├── utils/
│   └── contextBuilder.ts           # Recruiter context aggregation
└── components/
    └── RecruiterCopilot.tsx        # UI component
```

---

## 🧠 Core Services

### 1. Query Parser (`queryParser.ts`)

**Purpose**: Convert natural language queries into structured search criteria

**Capabilities**:
- Extracts required vs. preferred skills
- Identifies experience level, location, CGPA requirements
- Detects query intent (search, match, analyze, recommend)
- Determines urgency level
- Handles fallback with pattern matching

**Example**:
```typescript
Input: "Find React developers with 2+ years experience in Bangalore"

Parsed Output:
{
  required_skills: ['React'],
  experience_level: 'junior',
  experience_years_min: 2,
  locations: ['Bangalore'],
  intent: 'search',
  urgency: 'medium',
  confidence_score: 0.9
}
```

### 2. Semantic Search (`semanticSearch.ts`)

**Purpose**: Find candidates using semantic understanding, not just keywords

**Features**:
- **Vector Similarity Search**: Uses pgvector for embedding-based matching
- **Hybrid Search**: Combines semantic search with structured filters
- **Opportunity Matching**: Finds candidates similar to job descriptions
- **Multi-Factor Ranking**: Considers profile completeness, training, certifications

**Key Methods**:
```typescript
// Find candidates by semantic similarity to opportunity
await semanticSearch.findCandidatesForOpportunity(opportunityId, limit)

// Hybrid search with filters
await semanticSearch.hybridCandidateSearch(parsedQuery, limit)
```

### 3. Recruiter Insights (`recruiterInsights.ts`)

**Purpose**: Intelligent candidate discovery and job matching

**Scoring Algorithm**:
```
Match Score = 
  (Skill Match × 60%) + 
  (Profile Quality × 20%) + 
  (Training × 15%) + 
  (Certifications × 10%)
```

**Profile Quality Scoring**:
- Skills: up to 35 points (4 points per skill)
- Training: up to 25 points (8 points per training)
- Certifications: up to 15 points (5 points per cert)
- CGPA: 10 points
- Resume: 8 points
- Location: 2 points

**Match Recommendations**:
- 85-100%: 🌟 Excellent - Fast-track to interview
- 70-84%: ✅ Strong - Screening call recommended
- 55-69%: 💡 Good potential - Trainable gaps
- 40-54%: ⚡ Moderate - Consider for junior roles
- <40%: ❌ Low - Alternative roles

### 4. Pipeline Intelligence (`pipelineIntelligence.ts`)

**Purpose**: Analyze recruitment pipeline and identify optimization opportunities

**Capabilities**:
- **Stage Metrics**: Conversion rates, time in stage, drop-off rates
- **Bottleneck Detection**: Identifies slow stages and low conversion points
- **At-Risk Candidates**: Flags candidates stuck or with overdue actions
- **Success Pattern Recognition**: Learns from hired candidates

**Risk Assessment**:
- 🔴 **High Risk**: 14+ days in stage OR overdue action
- 🟡 **Medium Risk**: 7-14 days in stage
- 🟢 **Low Risk**: <7 days, on track

**Example Insights**:
```
Bottleneck Detected:
Stage: Interview
Issue: Candidates spending average 12 days in interview
Impact: HIGH
Recommendation: Streamline interview scheduling process
```

### 5. Talent Analytics (`talentAnalytics.ts`)

**Purpose**: Provide pool-wide insights and market intelligence

**Metrics**:
- Skill distribution across talent pool
- Location demographics
- Experience level breakdown
- Emerging skills identification
- Top institutions
- Market demand analysis

---

## 🎨 Advanced Prompt Engineering

### Prompt Design Philosophy

Built using senior-level prompt engineering principles:

1. **Context-Aware**: Dynamic prompts based on recruiter profile and activity
2. **Explainable**: Clear reasoning for every recommendation
3. **Actionable**: Always provide 2-3 specific next steps
4. **Balanced**: Show both strengths AND gaps honestly
5. **Prioritized**: Rank by impact and urgency

### Master System Prompt Structure

```
# ROLE & IDENTITY
- Who the AI is and its expertise

# RECRUITER CONTEXT
- Current recruiter profile, active jobs, candidate pool

# CORE CAPABILITIES
1. Intelligent Candidate Discovery
2. Precision Matching
3. Actionable Insights  
4. Proactive Intelligence

# COMMUNICATION PRINCIPLES
- Clarity & Directness
- Explainability
- Prioritization
- Honesty & Balance
- Actionability

# RESPONSE STRUCTURE
1. Executive Summary
2. Key Findings
3. Detailed Breakdown
4. Recommendations
5. Context Notes

# ETHICAL STANDARDS
- Merit-based evaluation only
- No demographic bias
- Promote diversity
- Human-in-the-loop decision making
```

### Example Prompts

**Candidate Search**:
```typescript
buildCandidateSearchPrompt(parsedQuery, candidates, context)
// Returns structured prompt with:
// - Original query + extracted criteria
// - Candidate list with match scores
// - Task: Provide executive summary, top 5, skill gaps, next actions
```

**Opportunity Matching**:
```typescript
buildOpportunityMatchingPrompt(opportunity, candidates)
// Returns structured prompt with:
// - Job requirements breakdown
// - Candidate pool overview
// - Task: Match scoring, hiring strategy, next steps
```

**Pipeline Analysis**:
```typescript
buildPipelineAnalysisPrompt(pipelineData)
// Returns structured prompt with:
// - Stage metrics and conversion rates
// - Identified bottlenecks
// - At-risk candidates
// - Task: Health assessment, critical issues, optimization
```

---

## 💾 Database Integration

### Tables Used

#### `students`
- Core candidate information
- Skills, training, certifications (via relations)
- **Embedding field**: Vector representation for semantic search

#### `opportunities`
- Job postings with requirements
- **Embedding field**: Vector representation of job description
- Skills stored as JSONB array

#### `pipeline_candidates`
- Candidate journey through recruitment stages
- Tracks stage changes, actions, ratings
- Links students to opportunities

#### `skills`, `trainings`, `certificates`
- Detailed candidate qualifications
- Used for multi-factor scoring

### Vector Search Setup (Required)

The system uses PostgreSQL pgvector extension for semantic search:

```sql
-- Create extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (if not exists)
ALTER TABLE students ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create RPC functions for vector search
CREATE OR REPLACE FUNCTION search_candidates_by_embedding(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  user_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    students.user_id,
    1 - (students.embedding <=> query_embedding) as similarity
  FROM students
  WHERE students.embedding IS NOT NULL
    AND 1 - (students.embedding <=> query_embedding) > match_threshold
  ORDER BY students.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_candidates_to_opportunity(
  opportunity_embedding vector(1536),
  match_count int,
  min_similarity float
)
RETURNS TABLE (
  user_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    students.user_id,
    1 - (students.embedding <=> opportunity_embedding) as similarity
  FROM students
  WHERE students.embedding IS NOT NULL
    AND 1 - (students.embedding <=> opportunity_embedding) > min_similarity
  ORDER BY students.embedding <=> opportunity_embedding
  LIMIT match_count;
END;
$$;
```

---

## 🚀 Usage Examples

### Basic Candidate Search

```typescript
import { recruiterIntelligenceEngine } from './services/recruiterIntelligenceEngine';

// Process natural language query
const response = await recruiterIntelligenceEngine.processQuery(
  "Find React developers with good CGPA",
  recruiterId,
  conversationId
);

// Response includes:
// - Parsed intent
// - Matched candidates
// - Interactive cards for UI
// - Suggested next actions
```

### Match Candidates to Opportunity

```typescript
import { recruiterInsights } from './services/recruiterInsights';

const matches = await recruiterInsights.matchCandidatesToOpportunity(
  opportunityId,
  limit: 15
);

// Returns sorted list with:
// - Match scores
// - Matched/missing skills
// - Recommendations
```

### Get Pipeline Insights

```typescript
import { pipelineIntelligence } from './services/pipelineIntelligence';

const insights = await pipelineIntelligence.getPipelineInsights(recruiterId);

// Returns:
// - Overview metrics (time-to-hire, conversion rate)
// - Stage metrics
// - Bottlenecks with recommendations
// - At-risk candidates
// - Success patterns
```

### Hybrid Search with Filters

```typescript
import { queryParser } from './services/queryParser';
import { semanticSearch } from './services/semanticSearch';

// Parse query
const parsed = await queryParser.parseQuery(
  "Find Python developers in Bangalore with 8+ CGPA"
);

// Execute hybrid search
const candidates = await semanticSearch.hybridCandidateSearch(parsed, 25);
```

---

## 📊 Scoring & Ranking Algorithms

### Candidate Match Score

```typescript
function calculateMatchScore(candidate, jobRequirements) {
  // Skill matching (60% weight)
  const skillMatchPercent = (matchedSkills / requiredSkills) * 100;
  const skillScore = Math.min(skillMatchPercent * 0.6, 60);
  
  // Profile quality (20% weight)
  const profileBonus = profileCompleteness * 0.2;
  
  // Training (15% weight)  
  const trainingBonus = Math.min(trainingCount * 3, 15);
  
  // Certifications (10% weight)
  const certBonus = Math.min(certCount * 2, 10);
  
  return Math.min(
    Math.round(skillScore + profileBonus + trainingBonus + certBonus),
    100
  );
}
```

### Profile Completeness Score

```typescript
function calculateProfileScore(profile) {
  let score = 0;
  
  if (profile.hasName) score += 5;
  score += Math.min(profile.skillCount * 4, 35);      // Max 35
  score += Math.min(profile.trainingCount * 8, 25);   // Max 25
  score += Math.min(profile.certCount * 5, 15);       // Max 15
  if (profile.hasCGPA) score += 10;
  if (profile.hasResume) score += 8;
  if (profile.hasLocation) score += 2;
  
  return Math.min(score, 100);
}
```

### Skill Match Logic

```typescript
// Fuzzy matching with substring comparison
function matchesSkill(candidateSkill, requiredSkill) {
  const cs = candidateSkill.toLowerCase();
  const rs = requiredSkill.toLowerCase();
  
  return cs.includes(rs) || rs.includes(cs);
  // Examples:
  // "React.js" matches "React"
  // "JavaScript" matches "JS"
  // "Machine Learning" matches "ML"
}
```

---

## 🎯 Intent Classification

The system classifies recruiter queries into specific intents:

| Intent | Description | Example Query |
|--------|-------------|---------------|
| `candidate-search` | Finding/searching for candidates | "Show me React developers" |
| `talent-pool-analytics` | Analytics about talent pool | "What skills do we have?" |
| `job-matching` | Matching candidates to specific job | "Match candidates to Software Engineer role" |
| `hiring-recommendations` | Get hiring-ready candidates | "Who should I interview first?" |
| `skill-insights` | Understanding skill distribution | "What are the most common skills?" |
| `market-trends` | Market intelligence | "What skills are in demand?" |
| `interview-guidance` | Interview tips and questions | "How should I assess this candidate?" |
| `candidate-assessment` | Evaluating specific candidates | "Compare these three candidates" |
| `pipeline-review` | Pipeline status and progress | "Show pipeline bottlenecks" |
| `general` | General questions | "Help me with hiring" |

---

## 🔒 Ethical AI Principles

The system is designed with ethical hiring practices:

1. **Merit-Based Only**: Evaluate candidates on skills, experience, and potential
2. **No Demographic Bias**: Never consider age, gender, or other protected attributes
3. **Transparency**: Always explain reasoning behind recommendations
4. **Diversity Promotion**: Highlight candidates from varied backgrounds
5. **Human-in-the-Loop**: AI recommends, humans decide
6. **Sample Size Awareness**: Flag when data is insufficient for reliable insights
7. **Broadening Suggestions**: Recommend expanding criteria if search is too narrow

---

## 🛠️ Configuration

### Environment Variables

```env
# OpenAI/OpenRouter API Key
VITE_OPENAI_API_KEY=sk-or-v1-...

# Supabase Configuration (inherited from main config)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Model Configuration

Default model: `openrouter/polaris-alpha` (fast, cost-effective)

Can be changed in `recruiterIntelligenceEngine.ts`:

```typescript
const DEFAULT_MODEL = 'openrouter/polaris-alpha';
// Or use: 'openai/gpt-4', 'anthropic/claude-3-sonnet', etc.
```

---

## 📈 Performance Optimizations

### Database Query Optimization

1. **Batch Fetching**: Fetch related data (skills, training, certs) in batches
2. **Selective Fields**: Only query needed columns
3. **Count Optimizations**: Use `count: 'exact', head: true` for count queries
4. **Index Requirements**:
   ```sql
   -- Recommended indexes
   CREATE INDEX idx_skills_student_enabled ON skills(student_id, enabled);
   CREATE INDEX idx_trainings_student ON trainings(student_id);
   CREATE INDEX idx_certificates_student_enabled ON certificates(student_id, enabled);
   CREATE INDEX idx_pipeline_opportunity_stage ON pipeline_candidates(opportunity_id, stage);
   CREATE INDEX idx_opportunities_recruiter_active ON opportunities(recruiter_id, is_active);
   
   -- Vector search index (for pgvector)
   CREATE INDEX idx_students_embedding ON students USING ivfflat (embedding vector_cosine_ops);
   CREATE INDEX idx_opportunities_embedding ON opportunities USING ivfflat (embedding vector_cosine_ops);
   ```

### Caching Strategy

```typescript
// In RecruiterIntelligenceEngine
private conversationHistory: Map<string, any[]> = new Map();
// Caches last 10 exchanges per conversation
```

### Prompt Token Optimization

- Use concise prompts with clear structure
- Limit candidate lists to top 15 in prompts
- Cache system prompts per recruiter session

---

## 🧪 Testing Scenarios

### Test Queries

```typescript
// Skill-based search
"Find React and Node.js developers"
"Show me Python experts with machine learning experience"

// Experience-based search
"Find freshers with good CGPA"
"Show senior developers with 5+ years"

// Location-based search
"React developers in Bangalore"
"Remote Python developers"

// Complex queries
"Find React developers in Mumbai with 7+ CGPA and certifications"
"Show candidates with AWS experience ready for immediate hire"

// Analytics queries
"What skills are most common in my talent pool?"
"Show me pipeline bottlenecks"
"Analyze hiring trends"

// Opportunity matching
"Match candidates to Software Engineer position #123"
"Who are the best fits for this Data Scientist role?"
```

---

## 🔄 Future Enhancements

### Planned Features

1. **Auto-Generated Job Descriptions**: Use LLM to create JDs from requirements
2. **Email Draft Generation**: Auto-draft outreach emails to candidates
3. **Interview Question Generator**: Custom questions based on candidate profile
4. **Salary Benchmarking**: Market rate suggestions based on skills and location
5. **Diversity Analytics**: Track and improve diversity metrics
6. **Automated Candidate Outreach**: Schedule and track communications
7. **Chrome Extension**: Source candidates from LinkedIn with AI analysis
8. **Slack/Teams Integration**: Get candidate recommendations in chat

### Technical Improvements

1. **Real-time Embeddings**: Generate embeddings on profile update
2. **Collaborative Filtering**: "Candidates hired by similar recruiters"
3. **A/B Testing Framework**: Test different matching algorithms
4. **Feedback Loop**: Learn from recruiter actions to improve recommendations
5. **Multi-language Support**: Analyze candidates in multiple languages

---

## 📚 API Reference

### Core Services API

#### Query Parser

```typescript
interface ParsedRecruiterQuery {
  required_skills: string[];
  preferred_skills: string[];
  experience_level: 'fresher' | 'junior' | 'mid' | 'senior' | 'any';
  locations: string[];
  min_cgpa?: number;
  intent: 'search' | 'match_to_job' | 'analyze_pool' | 'compare' | 'recommend';
  urgency: 'high' | 'medium' | 'low';
  confidence_score: number;
}

queryParser.parseQuery(query: string): Promise<ParsedRecruiterQuery>
```

#### Semantic Search

```typescript
semanticSearch.hybridCandidateSearch(
  parsedQuery: ParsedRecruiterQuery,
  limit?: number
): Promise<CandidateSummary[]>

semanticSearch.findCandidatesForOpportunity(
  opportunityId: number,
  limit?: number
): Promise<Array<CandidateSummary & { similarity_score: number }>>
```

#### Recruiter Insights

```typescript
recruiterInsights.getTopCandidates(limit?: number): Promise<CandidateSummary[]>

recruiterInsights.findCandidatesBySkills(
  skillNames: string[],
  limit?: number
): Promise<CandidateSummary[]>

recruiterInsights.matchCandidatesToOpportunity(
  opportunityId: number,
  limit?: number
): Promise<CandidateMatchResult[]>
```

#### Pipeline Intelligence

```typescript
pipelineIntelligence.getPipelineInsights(
  recruiterId?: string
): Promise<PipelineInsights>

pipelineIntelligence.getPipelineForOpportunity(
  opportunityId: number
): Promise<CandidatePipelineStatus[]>

pipelineIntelligence.getStuckCandidates(
  stage: string,
  daysThreshold?: number
): Promise<CandidatePipelineStatus[]>

pipelineIntelligence.getCandidatesNeedingAction(): Promise<CandidatePipelineStatus[]>
```

---

## 🤝 Contributing

### Code Style

- TypeScript strict mode enabled
- Async/await for all database calls
- Comprehensive error handling with fallbacks
- Clear commenting for complex algorithms
- Type safety throughout

### Adding New Features

1. **New Intent**: Add to `RecruiterIntent` type and handle in `recruiterIntelligenceEngine.ts`
2. **New Prompt**: Add to `advancedPrompts.ts` with clear structure
3. **New Metric**: Add to analytics service with database optimization
4. **New Filter**: Update `ParsedRecruiterQuery` interface and query parser

---

## 📄 License

Proprietary - SkillPassport © 2025

---

## 👥 Authors

Built with ❤️ by the SkillPassport Engineering Team

**Lead AI Engineer**: Designed with senior-level prompt engineering and database optimization
**Focus**: Enterprise-grade recruitment intelligence with ethical AI principles

---

## 📞 Support

For questions or issues:
- Technical Documentation: This README
- Database Schema: `types/database.ts`
- Prompt Templates: `prompts/advancedPrompts.ts`

---

**Last Updated**: November 2025
**Version**: 1.0.0
