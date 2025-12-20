# AI Analyzer - Data Flow & Tables Used

## Overview
The AI Analyzer (Job Matching System) uses Claude AI to match student profiles with job opportunities. Here's the complete data flow and tables involved.

---

## 📊 Database Tables Used

### 1. **students** (Primary Source)
**Purpose**: Student profile data for AI matching

**Fields Used**:
```sql
- id / user_id (UUID) - Student identifier
- name (TEXT) - Student name
- email (TEXT) - Student email
- department / branch_field (TEXT) - Field of study
- university (TEXT) - University name
- year_of_passing (TEXT) - Graduation year
- cgpa (NUMERIC) - Academic performance
- bio (TEXT) - Student bio/summary
- resume_text (TEXT) - Parsed resume content
- experience_level (TEXT) - Experience level
- skills (JSONB) - Technical skills array
- interests (JSONB) - Student interests
- preferred_departments (JSONB) - Preferred job departments
- preferred_employment_types (JSONB) - Preferred job types
```

**Example Data**:
```json
{
  "id": "uuid-123",
  "name": "John Doe",
  "department": "Computer Science",
  "university": "MIT",
  "cgpa": 8.5,
  "skills": ["JavaScript", "React", "Python"],
  "interests": ["Web Development", "AI"]
}
```

---

### 2. **skills** (Student Skills)
**Purpose**: Detailed technical and soft skills

**Fields Used**:
```sql
- id (UUID) - Skill ID
- student_id (UUID) - Foreign key to students
- name (TEXT) - Skill name
- type (TEXT) - 'technical' or 'soft'
- level (INTEGER) - Proficiency level (1-5)
- category (TEXT) - Skill category
- verified (BOOLEAN) - Verification status
```

**Example Data**:
```json
{
  "name": "React",
  "type": "technical",
  "level": 4,
  "category": "Frontend Development"
}
```

---

### 3. **education** (Educational Background)
**Purpose**: Student's educational qualifications

**Fields Used**:
```sql
- id (UUID) - Education record ID
- student_id (UUID) - Foreign key to students
- degree (TEXT) - Degree name
- department (TEXT) - Department/specialization
- university (TEXT) - University name
- year_of_passing (TEXT) - Graduation year
- cgpa (TEXT) - CGPA/percentage
- level (TEXT) - Education level
- status (TEXT) - Current/completed
```

---

### 4. **trainings** (Courses & Training)
**Purpose**: Completed or ongoing training/courses

**Fields Used**:
```sql
- id (UUID) - Training ID
- student_id (UUID) - Foreign key to students
- title (TEXT) - Course/training name
- organization (TEXT) - Training provider
- start_date (DATE) - Start date
- end_date (DATE) - End date
- duration (TEXT) - Duration
- status (TEXT) - 'ongoing' or 'completed'
- completed_modules (INTEGER) - Progress
- total_modules (INTEGER) - Total modules
```

---

### 5. **experience** (Work Experience)
**Purpose**: Student's work experience and internships

**Fields Used**:
```sql
- id (UUID) - Experience ID
- student_id (UUID) - Foreign key to students
- role (TEXT) - Job role/title
- organization (TEXT) - Company name
- start_date (DATE) - Start date
- end_date (DATE) - End date
- duration (TEXT) - Duration
- verified (BOOLEAN) - Verification status
```

---

### 6. **projects** (Student Projects)
**Purpose**: Academic and personal projects

**Fields Used**:
```sql
- id (UUID) - Project ID
- student_id (UUID) - Foreign key to students
- title (TEXT) - Project name
- description (TEXT) - Project description
- tech_stack (ARRAY) - Technologies used
- demo_link (TEXT) - Demo URL
- github_link (TEXT) - GitHub URL
```

---

### 7. **certificates** (Certifications)
**Purpose**: Professional certifications

**Fields Used**:
```sql
- id (UUID) - Certificate ID
- student_id (UUID) - Foreign key to students
- title (TEXT) - Certificate name
- issuer (TEXT) - Issuing organization
- issued_on (DATE) - Issue date
- credential_id (TEXT) - Credential ID
- link (TEXT) - Verification link
```

---

### 8. **opportunities** (Job Opportunities)
**Purpose**: Available job/internship opportunities

**Fields Used**:
```sql
- id (INTEGER) - Opportunity ID
- title / job_title (TEXT) - Job title
- company_name (TEXT) - Company name
- department (TEXT) - Department/field
- employment_type (TEXT) - Full-time/Internship/Part-time
- location (TEXT) - Job location
- mode (TEXT) - Remote/Onsite/Hybrid
- experience_level (TEXT) - Experience required
- experience_required (TEXT) - Experience description
- skills_required (JSONB) - Required skills array
- requirements (JSONB) - Job requirements array
- responsibilities (JSONB) - Job responsibilities array
- description (TEXT) - Job description
- stipend_or_salary (TEXT) - Compensation
- deadline (TIMESTAMP) - Application deadline
- is_active (BOOLEAN) - Active status
```

**Example Data**:
```json
{
  "id": 1,
  "job_title": "Frontend Developer",
  "company_name": "Tech Corp",
  "department": "Engineering",
  "employment_type": "Full-time",
  "skills_required": ["React", "JavaScript", "CSS"],
  "requirements": ["2+ years experience", "Bachelor's degree"],
  "responsibilities": ["Build UI components", "Collaborate with team"]
}
```

---

### 9. **recommendation_cache** (NEW - Caching Layer)
**Purpose**: Cache AI-generated recommendations

**Fields Used**:
```sql
- id (UUID) - Cache ID
- student_id (UUID) - Foreign key to students.user_id
- recommendations (JSONB) - Cached recommendations array
- cached_at (TIMESTAMP) - Cache creation time
- expires_at (TIMESTAMP) - Cache expiration (24 hours)
- opportunities_count (INTEGER) - Opportunities count at cache time
- student_profile_hash (TEXT) - Profile hash for change detection
```

---

## 🔄 Complete Data Flow

### Step 1: User Visits Opportunities Page
```
User → /student/opportunities → Opportunities.jsx
```

### Step 2: Component Loads Student Data
```javascript
// From useStudentDataByEmail hook
const { studentData } = useStudentDataByEmail(userEmail);

// Fetches from:
- students table (main profile)
- skills table (technical & soft skills)
- education table (degrees)
- trainings table (courses)
- experience table (work history)
- projects table (projects)
- certificates table (certifications)
```

### Step 3: Component Loads Opportunities
```javascript
// From useOpportunities hook
const { opportunities } = useOpportunities({
  fetchOnMount: true,
  activeOnly: true
});

// Fetches from:
- opportunities table (all active jobs)
```

### Step 4: AI Recommendation Check (NEW - With Caching)
```javascript
// RecommendedJobs component calls:
const matches = await matchJobsWithAI(studentProfile, opportunities, 3);

// Flow:
1. Check recommendation_cache table
   - If valid cache exists → Return cached recommendations (FAST!)
   - If no cache or expired → Continue to Step 5

2. If cache miss, generate fresh recommendations (Step 5-7)
```

### Step 5: Data Extraction
```javascript
// aiJobMatchingService.js - extractStudentData()
const studentData = {
  name: "John Doe",
  department: "Computer Science",
  university: "MIT",
  technical_skills: [
    { name: "React", level: 4, category: "Frontend" },
    { name: "Python", level: 3, category: "Backend" }
  ],
  soft_skills: [
    { name: "Communication", level: 4 }
  ],
  education: [...],
  training: [...],
  experience: [...],
  projects: [...],
  certificates: [...]
};
```

### Step 6: AI Prompt Creation
```javascript
// Creates detailed prompt with:
- Student profile (all fields)
- All available opportunities (with JSONB fields parsed)
- Matching instructions
- Scoring criteria
- Output format (JSON)
```

### Step 7: Claude AI Analysis
```javascript
// Sends to Claude AI via claudeService.js
const aiResponse = await callClaude(prompt, {
  systemPrompt: "You are an expert career counselor...",
  maxTokens: 2000,
  temperature: 0.7
});

// Claude analyzes:
1. Student's field/department
2. Student's skills vs job requirements
3. Experience level match
4. Industry alignment
5. Growth potential

// Returns JSON:
[
  {
    "job_id": 1,
    "job_title": "Frontend Developer",
    "company_name": "Tech Corp",
    "match_score": 85,
    "match_reason": "Strong match - Your React and JavaScript skills...",
    "key_matching_skills": ["React", "JavaScript", "CSS"],
    "skills_gap": ["TypeScript", "Testing"],
    "recommendation": "Excellent opportunity to apply your skills..."
  }
]
```

### Step 8: Cache Storage (NEW)
```javascript
// Store in recommendation_cache table
await cacheRecommendations(studentId, recommendations);

// Stores:
- recommendations (JSONB array)
- cached_at (now)
- expires_at (now + 24 hours)
- opportunities_count (current count)
- student_profile_hash (profile snapshot)
```

### Step 9: Display to User
```javascript
// RecommendedJobs.jsx displays:
- AI-powered carousel with top 3 matches
- Match score with color coding
- Match reason explanation
- Matching skills (green badges)
- Skills gap (amber badges)
- AI recommendation text
- Apply/View Details buttons
```

---

## 📈 AI Matching Criteria

### Scoring Breakdown (0-100%)

**1. Field & Department Match (60% weight)**
- Same field: 60 points
- Related field: 40 points
- Different field: 0-20 points

**2. Skills Match (25% weight)**
- 80%+ skills match: 25 points
- 60-79% skills match: 20 points
- 40-59% skills match: 15 points
- <40% skills match: 5-10 points

**3. Industry Alignment (10% weight)**
- Same industry: 10 points
- Related industry: 5 points
- Different industry: 0 points

**4. Experience Level (5% weight)**
- Perfect match: 5 points
- Close match: 3 points
- Mismatch: 0 points

### Score Ranges

- **90-100%**: Perfect Match (Same field + 80%+ skills)
- **75-89%**: Strong Match (Same field + 60-79% skills)
- **60-74%**: Good Match (Related field OR 40-59% skills)
- **40-59%**: Fair Match (Transferable skills)
- **20-39%**: Entry Level (Learning opportunity)
- **<20%**: Not Recommended

---

## 🎨 UI Display Components

### RecommendedJobs.jsx
**Location**: `src/components/Students/components/RecommendedJobs.jsx`

**Features**:
1. **Loading Animation**: Wavy background with AI brain icon (5 seconds minimum)
2. **Carousel Display**: Shows top 3 matches one at a time
3. **Match Score Badge**: Color-coded (green/blue/amber/gray)
4. **Match Reason**: AI explanation of why it matches
5. **Matching Skills**: Green badges for skills student has
6. **Skills Gap**: Amber badges for skills to learn
7. **Recommendation**: AI advice text
8. **Action Buttons**: View Details, Apply Now
9. **Dismiss Option**: User can hide recommendations

**Visual States**:
- Loading: Animated wavy background
- Success: Carousel with recommendations
- Error: User-friendly error message
- Dismissed: Small "Show AI Recommendations" button

---

## 🔧 Service Files

### 1. aiJobMatchingService.js
**Location**: `src/services/aiJobMatchingService.js`

**Functions**:
- `matchJobsWithAI()` - Main matching function
- `extractStudentData()` - Extract student profile
- `createMatchingPrompt()` - Build AI prompt
- `parseAIResponse()` - Parse AI JSON response
- `formatJSONBField()` - Format JSONB fields for prompt

### 2. aiRecommendationService.js
**Location**: `src/services/aiRecommendationService.js`

**Functions**:
- `getRecommendations()` - Get recommendations (with caching)
- `getCachedRecommendations()` - Check cache
- `cacheRecommendations()` - Store in cache
- `invalidateCache()` - Clear cache
- `trackInteraction()` - Track user actions
- `generateStudentEmbedding()` - Generate embeddings

### 3. claudeService.js
**Location**: `src/services/claudeService.js`

**Functions**:
- `callClaude()` - Call Claude AI API
- `isClaudeConfigured()` - Check API key

---

## 🔍 Example Complete Flow

### Scenario: Student "Sarah" visits opportunities page

**1. Student Profile Loaded**:
```json
{
  "name": "Sarah Johnson",
  "department": "Computer Science",
  "university": "Stanford",
  "cgpa": 8.7,
  "skills": ["React", "Node.js", "MongoDB", "Python"],
  "experience": [
    {
      "role": "Frontend Intern",
      "organization": "StartupXYZ",
      "duration": "3 months"
    }
  ],
  "projects": [
    {
      "title": "E-commerce Platform",
      "tech_stack": ["React", "Node.js", "MongoDB"]
    }
  ]
}
```

**2. Opportunities Loaded**: 50 active jobs

**3. Cache Check**:
- Check `recommendation_cache` for Sarah's ID
- Cache found, expires_at > now → **Return cached data (instant!)**
- OR Cache not found → Continue to AI generation

**4. AI Analysis** (if cache miss):
- Extracts Sarah's data
- Compares with all 50 opportunities
- Identifies top 3 matches

**5. AI Returns**:
```json
[
  {
    "job_id": 15,
    "job_title": "React Developer",
    "company_name": "TechCorp",
    "match_score": 92,
    "match_reason": "Excellent match! Your React and Node.js skills align perfectly with this role. Your e-commerce project demonstrates relevant experience.",
    "key_matching_skills": ["React", "Node.js", "MongoDB"],
    "skills_gap": ["TypeScript", "Redux"],
    "recommendation": "This is an ideal opportunity to leverage your existing skills. Consider learning TypeScript before applying to stand out."
  },
  {
    "job_id": 23,
    "job_title": "Full Stack Developer",
    "company_name": "InnovateLabs",
    "match_score": 85,
    "match_reason": "Strong match with your full-stack experience. Your internship and project work show you can handle both frontend and backend.",
    "key_matching_skills": ["React", "Node.js", "Python"],
    "skills_gap": ["Docker", "AWS"],
    "recommendation": "Great growth opportunity. The role requires cloud knowledge, which you can learn on the job."
  },
  {
    "job_id": 8,
    "job_title": "Frontend Engineer",
    "company_name": "DesignHub",
    "match_score": 78,
    "match_reason": "Good match for your React expertise. This role focuses on UI/UX which complements your technical skills.",
    "key_matching_skills": ["React", "JavaScript"],
    "skills_gap": ["CSS-in-JS", "Figma"],
    "recommendation": "Solid opportunity to specialize in frontend. Consider building your design skills."
  }
]
```

**6. Cache Storage** (if generated):
- Store recommendations in `recommendation_cache`
- Set expires_at to 24 hours from now
- Next visit will use cache (instant load!)

**7. Display**:
- Shows carousel with 3 recommendations
- Sarah can navigate between them
- Each shows match score, reason, skills, and actions

---

## 🚀 Performance Optimization

### With Caching (NEW):
- **First Visit**: 3-5 seconds (AI generation)
- **Subsequent Visits**: <100ms (cached)
- **After Profile Update**: 3-5 seconds (regenerate)
- **After New Opportunity Added**: 3-5 seconds (regenerate for all)

### Without Caching (OLD):
- **Every Visit**: 3-5 seconds (AI generation)

**Improvement**: 30-50x faster for cached requests!

---

## 📝 Summary

The AI Analyzer uses **9 database tables** to create intelligent job recommendations:

**Student Data** (7 tables):
1. students - Main profile
2. skills - Technical & soft skills
3. education - Degrees
4. trainings - Courses
5. experience - Work history
6. projects - Projects
7. certificates - Certifications

**Job Data** (1 table):
8. opportunities - Available jobs

**Caching** (1 table):
9. recommendation_cache - Cached recommendations

The system combines all this data, sends it to Claude AI for analysis, caches the results, and displays personalized recommendations with match scores, reasons, and actionable advice.
