# AI Candidate Recommendations System

## Overview

The AI Candidate Recommendations system is an intelligent feature that automatically analyzes job applicants and recommends the best candidates for each position based on skills match, academic performance, training, certifications, and profile quality.

**Location**: `/recruitment/requisition/applicants`

**Purpose**: Help recruiters quickly identify top talent and make data-driven hiring decisions.

---

## How It Works

### 1. **Data Collection**

When the applicants page loads, the system:
- Fetches all applicants with their student and opportunity data
- Retrieves job requirements (skills_required) from opportunities table
- For each applicant, queries:
  - **Skills** (from `skills` table) - verified technical/professional skills
  - **Training Programs** (from `trainings` table) - completed courses
  - **Certifications** (from `certificates` table) - professional credentials
  - **Academic Data** - CGPA, university, graduation year

### 2. **Intelligent Scoring Algorithm**

Each applicant receives a **match score (0-100%)** calculated as:

```
Match Score = Skills Match (60%) + Profile Quality (20%) + Training Bonus (15%) + Certifications Bonus (10%)
```

#### **A. Skills Match (60% weight)**

```javascript
// Calculate percentage of required skills matched
skillMatchPercent = (matchedSkills.length / requiredSkills.length) * 100
skillScore = min(skillMatchPercent * 0.6, 60)
```

**Smart Matching Features:**
- **Fuzzy matching**: "JavaScript" matches "JS", "React" matches "ReactJS"
- **Suffix normalization**: "Testing" and "Test" count as one skill (removes -ing, -ed)
- **Case-insensitive**: Handles "python", "Python", "PYTHON" equally
- **Deduplication**: Prevents counting similar skills multiple times

**Example:**
- Job requires: `["JavaScript", "React", "TypeScript", "Node.js", "MongoDB", "Git"]` (6 skills)
- Candidate has: `["JavaScript", "React", "HTML", "CSS"]` (2/6 matched)
- Skill match = 33.3%, Skill score = 33.3 * 0.6 = **20 points**

#### **B. Profile Quality Bonus (20% weight)**

```javascript
profileScore = calculateProfileScore({
  hasName: 5 points,
  skillCount: up to 35 points (4 points per skill),
  trainingCount: up to 25 points (8 points per training),
  certCount: up to 15 points (5 points per cert),
  hasCGPA: 10 points,
  hasResume: 8 points,
  hasLocation: 2 points
})

profileBonus = profileScore * 0.2  // Max 20 points
```

**Example:**
- Profile score = 75/100
- Profile bonus = 75 * 0.2 = **15 points**

#### **C. Training Bonus (15% weight)**

```javascript
trainingBonus = min(trainingCount * 3, 15)  // 3 points per training, max 15
```

**Example:**
- Candidate has 6 training programs
- Training bonus = min(6 * 3, 15) = **15 points**

#### **D. Certifications Bonus (10% weight)**

```javascript
certBonus = min(certCount * 2, 10)  // 2 points per cert, max 10
```

**Example:**
- Candidate has 3 certifications
- Cert bonus = min(3 * 2, 10) = **6 points**

#### **Final Match Score**

```javascript
matchScore = min(skillScore + profileBonus + trainingBonus + certBonus, 100)
```

**Full Example:**
```
Skills: 20 + Profile: 15 + Training: 15 + Certs: 6 = 56% match
```

---

### 3. **Confidence Classification**

Based on match score, candidates are classified into confidence levels:

| Match Score | Confidence | Meaning |
|------------|-----------|---------|
| ≥ 75% | **HIGH** 🎯 | Strong alignment with requirements - ready for interview |
| 55-74% | **MEDIUM** ⭐ | Good potential with trainable skill gaps |
| 31-54% | **LOW** 📋 | Some alignment, needs skill development |
| ≤ 30% | N/A | Not recommended (filtered out) |

---

### 4. **Recommendation Generation**

For each candidate, the system generates:

#### **A. Why Recommend (Top 4 Reasons)**
```javascript
reasons = []
if (matchedSkills.length > 0) 
  → "2/6 required skills matched"
if (trainingCount >= 2) 
  → "5 training programs completed"
if (certCount >= 1) 
  → "3 professional certifications"
if (cgpa >= 7.5) 
  → "Strong academic performance (8.5 CGPA)"
if (profileScore >= 70) 
  → "Complete profile (85% completeness)"
if (hasValidUniversity) 
  → "From Stanford University"
```

#### **B. Next Action Suggestions**

Based on confidence:
- **HIGH**: "🚀 Move to Interview - Strong alignment with requirements"
- **MEDIUM**: "📞 Screen Candidate - Good potential with trainable gaps"
- **LOW**: "👀 Review Profile - Consider skill development needs"

#### **C. Suggested Pipeline Stage**

```javascript
if (matchScore >= 75 && currentStage === 'sourced') 
  → Move to 'screened'
else if (matchScore >= 75) 
  → Move to 'interview_1'
else if (matchScore >= 55) 
  → Move to 'screened'
else 
  → Move to 'screened' (for review)
```

---

## Architecture

### **Backend Service**

**File**: `src/features/recruiter-copilot/services/recruiterInsights.ts`

**Method**: `analyzeApplicantsForRecommendation()`

```typescript
async analyzeApplicantsForRecommendation(applicants: Applicant[]): Promise<{
  topRecommendations: RecommendationResult[];
  summary: {
    totalAnalyzed: number;
    highPotential: number;
    mediumPotential: number;
    lowPotential: number;
  };
}>
```

**Process Flow:**
1. Validate input applicants
2. For each applicant in parallel:
   - Fetch skills, training, certificates from database
   - Extract job requirements
   - Calculate match score using algorithm
   - Generate reasons and recommendations
3. Filter candidates with score > 30%
4. Sort by match score (descending)
5. Generate summary statistics
6. Return top recommendations

### **Frontend Component**

**File**: `src/pages/recruiter/ApplicantsList.tsx`

**Key Features:**
- Fetches recommendations on page load
- Displays top 3 candidates with visual hierarchy
- Color-coded confidence levels (green/amber/gray)
- One-click actions to move candidates through pipeline
- Collapsible UI to reduce clutter
- Empty state when no matches found

**State Management:**
```typescript
const [aiRecommendations, setAiRecommendations] = useState<RecommendationsResult | null>(null);
const [loadingRecommendations, setLoadingRecommendations] = useState(false);
const [showRecommendations, setShowRecommendations] = useState(true);
```

---

## Database Schema

### **Tables Used**

#### `students`
```sql
- user_id (primary key)
- name
- email
- university
- currentCgpa
- branch_field (department)
- expectedGraduationDate
```

#### `skills`
```sql
- id
- student_id (foreign key)
- name
- level
- enabled (boolean)
```

#### `trainings`
```sql
- id
- student_id (foreign key)
- [other training details]
```

#### `certificates`
```sql
- id
- student_id (foreign key)
- enabled (boolean)
- [other certificate details]
```

#### `opportunities`
```sql
- id
- job_title
- skills_required (JSONB array)
- company_name
- location
```

#### `applied_jobs`
```sql
- id
- student_id
- opportunity_id
- application_status
- applied_at
```

---

## UI/UX Design Principles

### **Visual Hierarchy**
1. **Match Score** - Largest element (2xl font, bold)
2. **Candidate Name & Position** - Secondary (base/lg font)
3. **Key Strengths** - Tertiary (xs/sm font, chip style)
4. **Skills** - Supporting (xs font, badges)
5. **Actions** - Call-to-action buttons

### **Color Coding**
- **Green** (bg-green-50, border-green-200) - High confidence
- **Amber** (bg-amber-50, border-amber-200) - Medium confidence
- **Gray** (bg-gray-50, border-gray-200) - Low confidence

### **Progressive Disclosure**
- Show top 3 recommendations by default
- "Show X more" button for additional candidates
- Collapsible panel to hide/show all recommendations

### **Scanability**
- Horizontal card layout (avatar | content | score)
- Max 3 reasons shown (prevents overload)
- Max 4 skills visible (+ count badge)
- Icons for quick recognition (🎯⭐📋🚀📞👀)

### **Empty State**
- Centered icon and message
- Clear explanation of threshold
- Actionable suggestions for next steps

---

## Performance Optimization

### **Parallel Processing**
```javascript
const recommendations = await Promise.all(
  applicants.map(async (applicant) => {
    // Each applicant analyzed in parallel
  })
);
```

### **Database Optimization**
- Uses `.select('id', { count: 'exact', head: true })` for counting (faster than fetching all)
- Fetches opportunities once and reuses data
- Only queries enabled skills and certificates

### **Filtering**
- Applies 30% threshold before sorting (reduces processing)
- Returns only top recommendations (not all analyzed)

---

## Configuration

### **Adjustable Parameters**

**Match Score Weights** (`recruiterInsights.ts`, lines 480-488):
```javascript
const skillScore = Math.min(skillMatchPercent * 0.6, 60);    // 60% weight
const profileBonus = profileScore * 0.2;                      // 20% weight
const trainingBonus = Math.min(trainingCount * 3, 15);        // 15% weight (3 pts each)
const certBonus = Math.min(certCount * 2, 10);                // 10% weight (2 pts each)
```

**Confidence Thresholds** (`recruiterInsights.ts`, lines 517-529):
```javascript
if (matchScore >= 75) confidence = 'high';
else if (matchScore >= 55) confidence = 'medium';
else confidence = 'low';
```

**Minimum Match Threshold** (`recruiterInsights.ts`, line 581):
```javascript
.filter(r => r !== null && r!.matchScore > 30)  // Must score above 30%
```

**Display Limit** (`ApplicantsList.tsx`, line 758):
```javascript
aiRecommendations.topRecommendations.slice(0, 3)  // Show top 3
```

---

## Example Scenarios

### **Scenario 1: Perfect Match**

**Job Requirements:**
- Skills: JavaScript, React, TypeScript, Node.js, MongoDB

**Candidate Profile:**
- Skills: JavaScript, React, TypeScript, Node.js, MongoDB, Docker (6 skills, 5 matched)
- Training: 8 programs
- Certifications: 5
- CGPA: 8.9

**Calculation:**
```
Skill Match: 5/5 = 100% → 60 points
Profile: 95/100 → 19 points
Training: min(8*3, 15) → 15 points
Certs: min(5*2, 10) → 10 points
---
Total: 60 + 19 + 15 + 10 = 104 → capped at 100%
```

**Result:** ✅ **HIGH confidence** - Move to Interview

---

### **Scenario 2: Trainable Candidate**

**Job Requirements:**
- Skills: Python, Django, PostgreSQL, Docker, AWS, Git

**Candidate Profile:**
- Skills: Python, Django, PostgreSQL (3 skills, 3 matched)
- Training: 4 programs
- Certifications: 2
- CGPA: 7.8

**Calculation:**
```
Skill Match: 3/6 = 50% → 30 points
Profile: 70/100 → 14 points
Training: min(4*3, 15) → 12 points
Certs: min(2*2, 10) → 4 points
---
Total: 30 + 14 + 12 + 4 = 60%
```

**Result:** ⭐ **MEDIUM confidence** - Schedule screening call

---

### **Scenario 3: Low Match (Below Threshold)**

**Job Requirements:**
- Skills: Java, Spring Boot, Microservices, Kubernetes, Jenkins

**Candidate Profile:**
- Skills: Python, HTML, CSS (0 skills matched)
- Training: 1 program
- Certifications: 0
- CGPA: 6.5

**Calculation:**
```
Skill Match: 0/5 = 0% → 0 points
Profile: 35/100 → 7 points
Training: min(1*3, 15) → 3 points
Certs: 0 → 0 points
---
Total: 0 + 7 + 3 + 0 = 10%
```

**Result:** ❌ **Filtered out** (below 30% threshold)

---

## Testing & Validation

### **Manual Testing Checklist**

- [ ] Candidates with >75% match show HIGH confidence
- [ ] Candidates with 55-74% show MEDIUM confidence
- [ ] Candidates with 31-54% show LOW confidence
- [ ] Candidates ≤30% are not displayed
- [ ] Skills like "Test" and "Testing" count as one
- [ ] Empty state appears when no matches found
- [ ] Top 3 recommendations display correctly
- [ ] Match score percentage is accurate
- [ ] Action buttons move candidates to correct stage
- [ ] UI collapses/expands properly

### **Edge Cases Handled**

✅ No applicants → Returns empty recommendations  
✅ No skills in job → Defaults to 50% skill match  
✅ Invalid university data → Filters out "Botany", "Zoology" etc.  
✅ Duplicate skills → Normalized and deduplicated  
✅ Missing student data → Gracefully skips with null check  
✅ Database errors → Logs error, returns empty array

---

## Future Enhancements

### **Potential Improvements**

1. **Machine Learning Integration**
   - Train model on historical hiring decisions
   - Predict success rate based on past hires
   - Personalized recommendations per recruiter

2. **Advanced Matching**
   - Natural Language Processing for skill synonyms
   - Experience level matching (junior/senior)
   - Location preference scoring
   - Salary expectation alignment

3. **Real-time Updates**
   - WebSocket notifications for new high-match applicants
   - Auto-refresh when candidates update profiles
   - Live pipeline movement tracking

4. **Analytics Dashboard**
   - Recommendation accuracy tracking
   - Time-to-hire for AI-recommended vs manual
   - Success rate by confidence level
   - A/B testing different algorithms

5. **Customization**
   - Per-job custom weights
   - Department-specific scoring models
   - Recruiter preference learning

---

## Troubleshooting

### **No Recommendations Shown**

**Check:**
1. Are there applicants in the system?
2. Do job postings have `skills_required` defined?
3. Do students have skills in their profiles?
4. Is the match threshold too high? (current: >30%)
5. Check browser console for errors

### **Incorrect Match Scores**

**Verify:**
1. Skills are enabled (`enabled = true`) in database
2. Job requirements are stored as JSONB array
3. Student CGPA is numeric, not string
4. Training/certificate counts are correct

### **Performance Issues**

**Solutions:**
1. Add database indexes on `student_id`, `opportunity_id`
2. Reduce number of parallel queries
3. Implement caching for frequently accessed data
4. Use database views for complex joins

---

## API Reference

### `analyzeApplicantsForRecommendation()`

**Input:**
```typescript
applicants: Array<{
  id: number;
  student_id: string;
  opportunity_id: number;
  pipeline_stage?: string;
  student: {
    id: string;
    name: string;
    email: string;
    university?: string;
    cgpa?: string;
    branch_field?: string;
  };
  opportunity: {
    id: number;
    job_title: string;
    skills_required?: string[];
  };
}>
```

**Output:**
```typescript
{
  topRecommendations: Array<{
    applicantId: number;
    studentName: string;
    positionTitle: string;
    matchScore: number;              // 0-100
    confidence: 'high' | 'medium' | 'low';
    reasons: string[];               // Up to 4 reasons
    nextAction: string;              // Suggested action
    suggestedStage: string;          // Pipeline stage
    matchedSkills: string[];
    missingSkills: string[];
  }>;
  summary: {
    totalAnalyzed: number;
    highPotential: number;           // count
    mediumPotential: number;         // count
    lowPotential: number;            // count
  };
}
```

---

## Support

For questions or issues with the AI Recommendations system:
- **Developer**: Check code in `src/features/recruiter-copilot/services/recruiterInsights.ts`
- **Database**: Verify schema in Supabase dashboard
- **Algorithm**: See "Intelligent Scoring Algorithm" section above

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Maintainer**: SkillPassport Team

