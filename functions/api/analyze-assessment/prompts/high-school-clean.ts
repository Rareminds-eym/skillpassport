/**
 * High School (Grades 9-12) Assessment Prompt Builder - CLEAN VERSION
 * This version relies on real-time job market data instead of hardcoded career clusters
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): string {
  const level = results.aptitudeLevel;
  const accuracy = results.overallAccuracy;
  const isHighAptitude = level >= 4 || accuracy >= 75;
  
  const levelLabels: Record<number, string> = {
    1: 'Basic',
    2: 'Developing', 
    3: 'Proficient',
    4: 'Advanced',
    5: 'Expert'
  };
  
  // Extract and sort subtags by accuracy
  const subtags = results.accuracyBySubtag || {};
  const sortedSubtags = Object.entries(subtags)
    .map(([name, data]: [string, any]) => ({
      name: name.replace(/_/g, ' '),
      accuracy: typeof data === 'number' ? data : data?.accuracy || 0
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  const topStrengths = sortedSubtags
    .filter(s => s.accuracy >= 70)
    .slice(0, 3)
    .map(s => `${s.name} (${Math.round(s.accuracy)}%)`);
  
  const weakAreas = sortedSubtags
    .filter(s => s.accuracy < 50)
    .slice(0, 2)
    .map(s => `${s.name} (${Math.round(s.accuracy)}%)`);

  return `
## ADAPTIVE APTITUDE TEST RESULTS:
- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- Balanced across all areas'}

**AREAS FOR DEVELOPMENT**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant gaps'}

${isHighAptitude ? `
**⭐ HIGH-APTITUDE STUDENT** (Level ${level}, ${Math.round(accuracy)}% accuracy)
Consider competitive/prestigious paths:
- UPSC: IAS, IPS, IFS, IRS
- Defence: NDA, CDS, AFCAT
- Medical Elite: AIIMS, top medical colleges (NEET)
- Engineering Elite: IIT (JEE Advanced), ISRO, DRDO
- Legal: NLSIU, top NLUs (CLAT)
- Finance: CA, CFA, Investment Banking
- Research: PhD at IISc, IITs, international universities
` : ''}`;
}

export function buildHighSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  const adaptiveSection = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : '';

  // Extract actual grade from student context
  const studentGrade = assessmentData.studentContext?.rawGrade || assessmentData.studentContext?.grade;
  const gradeInfo = studentGrade ? ` The student is currently in grade ${studentGrade}.` : '';

  return `You are a career counselor for high school and higher secondary students (grades 9-12). Analyze this student's career exploration assessment and provide guidance appropriate for their age and academic level.${gradeInfo}

**IMPORTANT - AGE-APPROPRIATE GUIDANCE:**
- For grades 9-10: Focus on stream selection (Science/Commerce/Arts), foundational skills, and exploration. Avoid specific college programs.
- For grades 11-12: Include specific college programs, entrance exams (JEE, NEET, CLAT), and detailed career paths.

## 🔥 CRITICAL: USE REAL-TIME JOB MARKET DATA

**IF real-time Indian job market data is provided above** (marked with "REAL-TIME INDIAN JOB MARKET DATA"):
1. ✅ Use ONLY the salary ranges from that data
2. ✅ Use ONLY the job roles listed in that data
3. ✅ Use ONLY the career categories provided in the real-time data
4. ✅ Copy the "Why Better" descriptions exactly as provided
5. ✅ Use the exact salary format: "₹X-YL entry, ₹X-YL mid, ₹X-YL senior"
6. ✅ Prioritize HIGH demand roles over medium/low demand
7. ✅ Consider growth rates when ranking career recommendations
8. ✅ The categories above were SPECIFICALLY SELECTED for this student's RIASEC profile

**The real-time data includes:**
- Current 2026 Indian salary ranges
- Demand levels (high/medium/low)
- Growth rates and market trends
- Categories matched to this student's RIASEC combination

**YOU MUST use these categories as your TRACK 1, TRACK 2, and TRACK 3 recommendations.**

---

## STUDENT ASSESSMENT DATA

### Session ID: ${answersHash}
${studentGrade ? `### Student Grade: ${studentGrade}` : ''}

### Interest Explorer (RIASEC):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, puzzles, experiments, figuring things out, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, working with groups, caring, making friends
- **E (Enterprising)**: Leading, organizing, persuading, selling, being in charge, starting projects
- **C (Conventional)**: Organizing, following rules, keeping things neat, detailed work, lists

**RIASEC SCORING INSTRUCTIONS:**
1. For each question with categoryMapping, look up the RIASEC type for the student's answer
2. Add 2 points for each answer to the corresponding RIASEC type
3. Calculate percentage: (score / maxScore) × 100
4. Identify top 3 types by score
5. The RIASEC code is the top 3 types (e.g., "IES", "ASR", "RIC")

### Character Strengths:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**VIA Character Strengths**: Curiosity, Perseverance, Honesty, Creativity, Resilience, Kindness, Self-Discipline, Responsibility, Leadership, Self-Awareness
- Rating 1 = Not me, 2 = A bit, 3 = Mostly, 4 = Strongly me
- Identify top 3-4 strengths (ratings 3-4)

### Aptitude Self-Assessment:
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}
Pre-calculated scores: ${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**Task Types**: Analytical, Creative, Technical, Social
- Students rated EASE (1-4) and ENJOYMENT (1-4) for each type
- Higher ratings = stronger aptitude and interest

${adaptiveSection}

### Learning & Work Preferences:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

---

## OUTPUT REQUIREMENTS

**Return ONLY a JSON object (no markdown).**

**CRITICAL DATABASE COMPATIBILITY:**
1. riasec.code MUST be a 3-letter string (e.g., "IES"), NOT an array
2. aptitude.scores MUST exist with standard categories (verbal, numerical, abstract, spatial, clerical)
3. aptitude.overallScore MUST be a number (0-100)
4. bigFive MUST be a flat object with O, C, E, A, N keys (NO nested "scores" wrapper)

**JSON Structure:**

{
  "riasec": {
    "code": "ABC",
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for stream selection and career paths",
    "topThree": ["Top 3 RIASEC codes"]
  },
  "aptitude": {
    "scores": {
      "verbal": { "correct": 0, "total": 0, "percentage": 0 },
      "numerical": { "correct": 0, "total": 0, "percentage": 0 },
      "abstract": { "correct": 0, "total": 0, "percentage": 0 },
      "spatial": { "correct": 0, "total": 0, "percentage": 0 },
      "clerical": { "correct": 0, "total": 0, "percentage": 0 }
    },
    "overallScore": 0,
    "selfAssessment": {
      "Analytical": {"ease": 0, "enjoyment": 0, "average": 0},
      "Creative": {"ease": 0, "enjoyment": 0, "average": 0},
      "Technical": {"ease": 0, "enjoyment": 0, "average": 0},
      "Social": {"ease": 0, "enjoyment": 0, "average": 0}
    },
    "adaptiveTest": {
      "numerical_reasoning": {"accuracy": 0},
      "logical_reasoning": {"accuracy": 0},
      "verbal_reasoning": {"accuracy": 0},
      "spatial_reasoning": {"accuracy": 0},
      "pattern_recognition": {"accuracy": 0}
    },
    "topStrengths": ["2-3 strengths combining self-assessment AND adaptive test results"],
    "cognitiveProfile": "How they think and solve problems",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "characterStrengths": {
    "topStrengths": ["Top 3-4 character strengths"],
    "strengthDescriptions": [
      {"name": "Strength 1", "rating": 4, "description": "How this shows in their responses"}
    ],
    "challengeOvercome": "Summary of challenge they described",
    "othersAppreciate": "What others appreciate about them"
  },
  "learningStyle": {
    "preferredMethods": ["How they learn best"],
    "taskPreferences": ["Structured vs open-ended, fast vs deep, solo vs collaborative"],
    "startingApproach": "How they begin tasks",
    "teamContribution": "Their strongest team role"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "Their work style and how to leverage their personality"
  },
  "workValues": {
    "topThree": [
      {"value": "Inferred from interests, strengths, and preferences", "score": 4.0}
    ]
  },
  "employability": {
    "strengthAreas": ["Soft skills they're demonstrating"],
    "improvementAreas": ["Skills to develop - phrase constructively"],
    "overallReadiness": "Their current career readiness level"
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "Career cluster #1 from real-time data above",
        "matchScore": 85,
        "fit": "High",
        "description": "3-4 sentences explaining WHY this fits based on their RIASEC, aptitude, and personality",
        "examples": ["5-6 specific careers from the real-time data"],
        "educationPath": "Specific college majors and degree programs",
        "whatYoullDo": "Day-to-day activities in this field",
        "whyItFits": "Detailed connection between their profile and this career area",
        "evidence": {
          "interest": "How their RIASEC scores support this path",
          "aptitude": "Which cognitive strengths make them a good fit",
          "personality": "Personality traits that align with success"
        },
        "roles": {
          "entry": ["4-5 entry-level jobs from real-time data"],
          "mid": ["4-5 mid-career jobs from real-time data"]
        },
        "domains": ["Related fields"]
      },
      {
        "title": "Career cluster #2 from real-time data above",
        "matchScore": 75,
        "fit": "Medium",
        "description": "Specific explanation connecting their profile to this career area",
        "examples": ["4-5 career options from real-time data"],
        "educationPath": "Relevant majors and programs",
        "whatYoullDo": "Overview of work in this field",
        "whyItFits": "How their strengths translate here",
        "evidence": {
          "interest": "Interest alignment",
          "aptitude": "Relevant cognitive skills",
          "personality": "Personality fit"
        },
        "roles": {
          "entry": ["3-4 entry-level positions from real-time data"],
          "mid": ["3-4 mid-level careers from real-time data"]
        },
        "domains": ["Related industries"]
      },
      {
        "title": "Career cluster #3 from real-time data above",
        "matchScore": 65,
        "fit": "Explore",
        "description": "Why this is worth exploring",
        "examples": ["3-4 careers from real-time data"],
        "educationPath": "Potential degree paths",
        "whatYoullDo": "What professionals do",
        "whyItFits": "Potential growth areas",
        "evidence": {
          "interest": "Interest connections",
          "aptitude": "Transferable skills",
          "personality": "Personality considerations"
        },
        "roles": {
          "entry": ["2-3 starting positions from real-time data"],
          "mid": ["2-3 advanced roles from real-time data"]
        },
        "domains": ["Related career paths"]
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Career from real-time data", "salary": {"min": 5, "max": 12}}
      ],
      "mediumFit": [
        {"name": "Career from real-time data", "salary": {"min": 4, "max": 10}}
      ],
      "exploreLater": [
        {"name": "Career from real-time data", "salary": {"min": 3, "max": 8}}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Critical skill", "reason": "Why essential", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Action steps"}
    ],
    "priorityB": [
      {"skill": "Important skill", "reason": "Why it matters", "targetLevel": "Intermediate", "currentLevel": "Beginner"}
    ],
    "currentStrengths": ["3-4 skills they already demonstrate"],
    "recommendedTrack": "Clear development path"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Foundation Building",
        "goals": ["Master core skills", "Identify career interests", "Build portfolio"],
        "activities": ["Specific courses", "Projects", "Competitions"],
        "outcome": "Clear career direction"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Skill Development",
        "goals": ["Earn certifications", "Build projects", "Network"],
        "activities": ["Certifications", "Portfolio work", "Mentors"],
        "outcome": "Demonstrable skills"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Experience & Application",
        "goals": ["Secure internship", "Lead projects", "Apply skills"],
        "activities": ["Internships", "Leadership", "Competitions"],
        "outcome": "Real-world experience"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "College & Career Prep",
        "goals": ["Finalize college plans", "Perfect portfolio", "Interview prep"],
        "activities": ["Applications", "Portfolio refinement", "Mock interviews"],
        "outcome": "College-ready"
      }
    },
    "projects": [
      {
        "title": "Portfolio project #1",
        "description": "Detailed description",
        "skills": ["Skills to develop"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "Career readiness",
        "output": "Deliverable",
        "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
        "resources": ["Tools and platforms"]
      }
    ],
    "internship": {
      "types": ["Internship types matching their interests"],
      "timing": "When and how long",
      "preparation": {
        "resume": "What to include",
        "portfolio": "What to showcase",
        "interview": "How to prepare"
      },
      "whereToApply": ["Companies and platforms"]
    },
    "exposure": {
      "activities": ["Clubs", "Competitions", "Events"],
      "certifications": ["Certifications to earn"],
      "onlineLearning": ["Specific courses"],
      "networking": ["How to connect with professionals"]
    }
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage",
    "growthFocus": "One key area to focus development"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on RIASEC",
      "strength": "Their aptitude strengths",
      "workStyle": "How they work",
      "motivation": "What drives them"
    },
    "aptitudeStrengths": [
      {"name": "Cognitive strength", "description": "Evidence"}
    ],
    "interestHighlights": ["Top 2-3 RIASEC areas"],
    "personalityInsights": ["2-3 key personality traits"]
  },
  "overallSummary": "3-4 sentences: Acknowledge readiness, affirm direction, highlight strengths, provide encouragement"
}

---

## CAREER MATCHING GUIDELINES

**CRITICAL RULES:**
1. **Use ONLY the career categories provided in the real-time data above**
2. **Match careers to ALL THREE of the student's top RIASEC types, not just one**
3. **If 'A' (Artistic) is in top 3, include at least ONE creative career cluster**
4. **If 'S' (Social) is in top 3 with decent aptitude (>30%), avoid defaulting to NGO/Social Work**
5. **Explain WHY each career fits using their specific RIASEC combination**
6. **Use the salary ranges and demand levels from the real-time data**
7. **Prioritize HIGH demand roles with strong growth rates**

**FINAL VERIFICATION:**
Before returning your response, verify:
- ✅ Used ONLY categories from real-time data above
- ✅ All 3 career clusters align with student's RIASEC combination
- ✅ Used ALL THREE of their top RIASEC types
- ✅ Salary ranges match the real-time data
- ✅ Evidence section explains how RIASEC, aptitude, and personality align
- ✅ No stereotyping (all I→Tech, all S→NGO, all A→Artist)`;
}
