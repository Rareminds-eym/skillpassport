# Complete Table to PDF Mapping - ALL Columns

## All Columns in personal_assessment_results Table

Based on your table schema, here are ALL columns and how they should be displayed in the PDF:

---

## ✅ Columns Currently Being Used in PDF

| Column Name | Data Type | PDF Usage | Status |
|-------------|-----------|-----------|--------|
| `id` | uuid | Internal ID | ✅ Used |
| `attempt_id` | uuid | Link to attempt | ✅ Used |
| `student_id` | uuid | Student identification | ✅ Used |
| `stream_id` | varchar(50) | Stream identification | ✅ Used |
| `riasec_scores` | jsonb | Interest Profile Section | ✅ Used |
| `riasec_code` | varchar(10) | RIASEC Code Display | ✅ Used |
| `aptitude_scores` | jsonb | Aptitude Section | ✅ Used |
| `aptitude_overall` | numeric(5,2) | Overall Aptitude Score | ✅ Used |
| `bigfive_scores` | jsonb | Big Five Personality Section | ✅ Used |
| `work_values_scores` | jsonb | Work Values Section | ✅ Used |
| `employability_scores` | jsonb | Employability Section | ✅ Used |
| `employability_readiness` | varchar(20) | Readiness Level | ✅ Used |
| `knowledge_score` | numeric(5,2) | Knowledge Test Score | ✅ Used |
| `knowledge_details` | jsonb | Knowledge Breakdown | ✅ Used |
| `created_at` | timestamp | Report Date | ✅ Used |
| `updated_at` | timestamp | Last Updated | ✅ Used |
| `status` | assessment_status | Assessment Status | ✅ Used |
| `grade_level` | text | Student Grade Level | ✅ Used |

---

## ⚠️ Columns NOT Being Displayed in PDF (Need to Add)

| Column Name | Data Type | What It Contains | Where to Display in PDF |
|-------------|-----------|------------------|------------------------|
| `career_fit` | jsonb | Career recommendations with details | **Career Fit Section** |
| `skill_gap` | jsonb | Skills to develop | **Skill Gap Section** |
| `roadmap` | jsonb | Action steps and next steps | **Roadmap Section** |
| `profile_snapshot` | jsonb | Complete profile summary | **Profile Overview Section** |
| `timing_analysis` | jsonb | Time spent on sections | **Assessment Insights Section** |
| `final_note` | jsonb | Counselor notes and recommendations | **Final Recommendations Section** |
| `overall_summary` | text | AI-generated summary | **Summary Banner** |
| `gemini_results` | jsonb | Complete AI analysis | **Various sections** |
| `skill_gap_courses` | jsonb | Recommended courses for skill gaps | **Course Recommendations Section** |
| `platform_courses` | jsonb | Platform-specific courses | **Course Recommendations Section** |
| `courses_by_type` | jsonb | Courses organized by type | **Course Recommendations Section** |

---

## 📋 Detailed Column Mapping for PDF

### 1. career_fit (jsonb)

**What's in it:**
```json
{
  "clusters": [
    {
      "title": "Software Engineer",
      "matchScore": 92,
      "description": "...",
      "roles": ["Backend Developer", "Frontend Developer"],
      "skills": ["JavaScript", "Python"],
      "salary": {"min": 8, "max": 25, "currency": "LPA"}
    }
  ],
  "degreePrograms": [
    {
      "programName": "B.Tech Computer Science",
      "matchScore": 95,
      "topColleges": ["IIT Delhi", "IIT Bombay"],
      "careerPaths": ["Software Engineer", "Data Scientist"],
      "averageSalary": {"min": 8, "max": 25, "currency": "LPA"},
      "skills": ["Programming", "Algorithms"],
      "duration": "4 years"
    }
  ]
}
```

**Display in PDF:**
- Section: "Career Fit & Recommendations"
- Show each career cluster with match score
- Display degree programs with colleges
- Show salary ranges
- List required skills

---

### 2. skill_gap (jsonb)

**What's in it:**
```json
{
  "gaps": [
    {
      "skill": "Communication Skills",
      "importance": "High",
      "developmentPath": "Focus on public speaking...",
      "resources": [
        {
          "title": "Effective Communication",
          "type": "course",
          "url": "https://...",
          "provider": "Coursera"
        }
      ]
    }
  ]
}
```

**Display in PDF:**
- Section: "Skills to Develop"
- Show each skill with importance level
- Display development path
- List learning resources with links

---

### 3. roadmap (jsonb)

**What's in it:**
```json
{
  "steps": [
    {
      "title": "Explore Internships",
      "description": "Apply to 5-10 internships...",
      "timeline": "Next 3 months",
      "priority": "High",
      "resources": [
        {
          "title": "LinkedIn Jobs",
          "type": "platform",
          "url": "https://linkedin.com/jobs"
        }
      ]
    }
  ]
}
```

**Display in PDF:**
- Section: "Your Action Roadmap"
- Show steps in timeline order
- Display priority levels
- List resources for each step

---

### 4. profile_snapshot (jsonb)

**What's in it:**
```json
{
  "topInterests": ["Investigative", "Realistic"],
  "topStrengths": ["Curiosity", "Creativity"],
  "personalityType": "INTJ",
  "learningStyle": "Visual",
  "workStyle": "Independent",
  "careerReadiness": "High"
}
```

**Display in PDF:**
- Section: "Your Profile at a Glance"
- Show top interests and strengths
- Display personality type
- Show learning and work styles

---

### 5. timing_analysis (jsonb)

**What's in it:**
```json
{
  "totalTime": 3600,
  "sectionTimes": {
    "interests": 900,
    "aptitude": 1200,
    "personality": 1500
  },
  "averageTimePerQuestion": 45,
  "completionRate": 100
}
```

**Display in PDF:**
- Section: "Assessment Insights"
- Show total time taken
- Display time per section
- Show completion rate

---

### 6. final_note (jsonb)

**What's in it:**
```json
{
  "counselorNote": "Strong analytical skills...",
  "recommendations": [
    "Consider STEM fields",
    "Develop communication skills"
  ],
  "nextSteps": [
    "Schedule career counseling",
    "Explore internship opportunities"
  ]
}
```

**Display in PDF:**
- Section: "Counselor's Recommendations"
- Show counselor note
- List recommendations
- Display next steps

---

### 7. overall_summary (text)

**What's in it:**
```
"You show strong investigative and realistic interests, indicating a preference for analytical and hands-on work. Your high curiosity and creativity scores suggest you thrive in problem-solving environments..."
```

**Display in PDF:**
- Section: Top of PDF as banner or summary box
- Large, prominent text
- Highlighted or in special styling

---

### 8. gemini_results (jsonb)

**What's in it:**
```json
{
  "analysis": {
    "interest_summary": "...",
    "strength_summary": "...",
    "personality_insights": "...",
    "learning_style": "..."
  },
  "career_recommendations": [...],
  "skill_development": [...],
  "next_steps": [...],
  "degree_programs": [...]
}
```

**Display in PDF:**
- Extract and display in various sections
- Use `analysis` for summary sections
- Use `career_recommendations` for career section
- Use `skill_development` for skill gap section
- Use `next_steps` for roadmap section

---

### 9. skill_gap_courses (jsonb)

**What's in it:**
```json
[
  {
    "title": "Python for Data Science",
    "provider": "Coursera",
    "duration": "30 hours",
    "level": "Intermediate",
    "url": "https://...",
    "rating": 4.8,
    "skills": ["Python", "Data Analysis"],
    "price": "Free"
  }
]
```

**Display in PDF:**
- Section: "Recommended Courses for Skill Development"
- Show course cards with title, provider, duration
- Display rating and level
- Show skills covered
- Include price and link

---

### 10. platform_courses (jsonb)

**What's in it:**
```json
[
  {
    "title": "Full Stack Development",
    "provider": "Udemy",
    "duration": "40 hours",
    "level": "Beginner",
    "url": "https://...",
    "rating": 4.7,
    "price": {"amount": 499, "currency": "INR"}
  }
]
```

**Display in PDF:**
- Section: "Platform Course Recommendations"
- Similar to skill_gap_courses
- Group by platform if needed

---

### 11. courses_by_type (jsonb)

**What's in it:**
```json
{
  "technical": [
    {"title": "JavaScript Basics", "provider": "Codecademy"}
  ],
  "soft_skills": [
    {"title": "Communication Skills", "provider": "LinkedIn Learning"}
  ],
  "domain_specific": [
    {"title": "Data Science Fundamentals", "provider": "edX"}
  ]
}
```

**Display in PDF:**
- Section: "Courses by Category"
- Group courses by type
- Show each category separately

---

## 🎨 PDF Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ COVER PAGE                                                   │
│ - Student Name (from students table)                        │
│ - Assessment Date (created_at)                              │
│ - Grade Level (grade_level)                                 │
│ - RIASEC Code (riasec_code)                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OVERALL SUMMARY (overall_summary)                           │
│ - Large banner with AI-generated summary                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROFILE SNAPSHOT (profile_snapshot)                         │
│ - Top interests, strengths, personality type                │
│ - Learning style, work style                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ INTEREST PROFILE (riasec_scores)                            │
│ - Radar chart with RIASEC scores                            │
│ - Top 3 interests highlighted                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ APTITUDE ANALYSIS (aptitude_scores, aptitude_overall)       │
│ - Bar chart with aptitude scores                            │
│ - Overall aptitude score                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PERSONALITY (bigfive_scores)                                │
│ - Big Five personality traits                               │
│ - Personality insights                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WORK VALUES (work_values_scores)                            │
│ - Work values chart                                         │
│ - Top work values                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ KNOWLEDGE TEST (knowledge_score, knowledge_details)         │
│ - Overall score and percentage                              │
│ - Breakdown by topic                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ EMPLOYABILITY (employability_scores, employability_readiness)│
│ - Employability score                                       │
│ - Readiness level                                           │
│ - Skills breakdown                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CAREER FIT (career_fit)                                     │
│ - Career clusters with match scores                         │
│ - Degree programs with colleges                             │
│ - Salary ranges and required skills                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SKILL GAP ANALYSIS (skill_gap)                              │
│ - Skills to develop with importance                         │
│ - Development paths                                         │
│ - Learning resources                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ COURSE RECOMMENDATIONS                                       │
│ - Skill Gap Courses (skill_gap_courses)                     │
│ - Platform Courses (platform_courses)                       │
│ - Courses by Type (courses_by_type)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ACTION ROADMAP (roadmap)                                    │
│ - Timeline with steps                                       │
│ - Priorities and resources                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ASSESSMENT INSIGHTS (timing_analysis)                        │
│ - Time taken per section                                    │
│ - Completion rate                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FINAL RECOMMENDATIONS (final_note)                          │
│ - Counselor's note                                          │
│ - Recommendations and next steps                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Action Required

To display ALL columns in the PDF, you need to:

1. **Update transformer** to extract ALL fields from database
2. **Update PDF components** to display the missing sections:
   - Profile Snapshot
   - Timing Analysis
   - Final Note
   - Complete Career Fit (with degree programs)
   - Complete Skill Gap (with resources)
   - Complete Roadmap (with timelines)
   - All Course Recommendations

3. **No database changes needed** - all columns already exist!

---

## 🚀 Next Steps

1. I'll update the transformer to extract ALL fields
2. I'll show you which PDF components need new sections
3. You can then add those sections to display the complete data

**Ready to proceed?**
