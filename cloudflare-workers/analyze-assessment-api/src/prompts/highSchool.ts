/**
 * High School (Grades 9-12) Assessment Prompt Builder
 */

import type { AssessmentData } from '../types';

export function buildHighSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  const adaptiveSection = assessmentData.adaptiveAptitudeResults ? `
## ADAPTIVE APTITUDE TEST RESULTS (AI-Powered Assessment):
This student completed an adaptive aptitude test that dynamically adjusted difficulty based on their performance.
${JSON.stringify(assessmentData.adaptiveAptitudeResults, null, 2)}

**ADAPTIVE APTITUDE INTERPRETATION:**
- aptitudeLevel (1-5): Final assessed aptitude level (1=Basic, 2=Developing, 3=Proficient, 4=Advanced, 5=Expert)
- confidenceTag: How confident we are in this assessment (high/medium/low)
- tier: Performance tier classification
- overallAccuracy: Percentage of questions answered correctly
- accuracyBySubtag: Breakdown by reasoning type (numerical, logical, verbal, spatial, data interpretation, pattern recognition)
- pathClassification: How their difficulty path evolved (ascending=improving, stable=consistent, descending=struggling)

**USE THIS DATA TO:**
1. Enhance aptitude scores with objective test performance
2. Identify specific cognitive strengths from accuracyBySubtag
3. Provide more accurate career recommendations based on demonstrated (not self-reported) abilities
4. Note if there's a gap between self-assessment and actual performance
` : '';

  return `You are a career counselor for high school and higher secondary students (grades 9-12). Analyze this student's career exploration assessment and provide guidance appropriate for their age and academic level.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## Interest Explorer Responses:
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**CRITICAL RIASEC SCORING INSTRUCTIONS:**
Each question includes a "categoryMapping" field that maps answer options to RIASEC types (R, I, A, S, E, C).
You MUST use this mapping to calculate scores precisely:

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, puzzles, experiments, figuring things out, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, working with groups, caring, making friends
- **E (Enterprising)**: Leading, organizing, persuading, selling, being in charge, starting projects
- **C (Conventional)**: Organizing, following rules, keeping things neat, detailed work, lists

**EXACT SCORING ALGORITHM:**
1. For each question with categoryMapping:
   - If answer is an array (multiselect): For each selected option, look up its RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a single string (singleselect): Look up the RIASEC type in categoryMapping and add 2 points to that type
   - If answer is a number 1-5 (rating): Use strengthType or context to determine RIASEC type, then:
     * Response 1-3: 0 points
     * Response 4: 1 point
     * Response 5: 2 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 20 (or highest score among all types if higher)
4. Calculate percentage for each type: (score / maxScore) × 100
5. Identify top 3 types by score

## Strengths & Character Responses:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

## Aptitude Sampling (Rating-Based Self-Assessment):
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}
Pre-calculated scores: ${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**APTITUDE SCORING FOR HIGH SCHOOL:**
High school aptitude is based on self-assessment ratings (1-4 scale) for ease and enjoyment of tasks:
- Each task type (verbal, numerical, abstract) has multiple rating questions
- Scores show averageRating (1-4 scale) and percentage (0-100%)
- Higher ratings indicate stronger aptitude in that area
- Use these ratings to identify top cognitive strengths for the aptitudeStrengths field
- For the "scores" field in the response, convert ratings to a percentage format
${adaptiveSection}

## Career Pathways Responses:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this structure and POPULATE all fields with specific, actionable content for high school students:

{
  "riasec": {
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for college majors and career paths"
  },
  "aptitude": {
    "scores": {
      "Verbal": {"averageRating": 0, "total": 0, "percentage": 0},
      "Numerical": {"averageRating": 0, "total": 0, "percentage": 0},
      "Abstract": {"averageRating": 0, "total": 0, "percentage": 0}
    },
    "topStrengths": ["2-3 cognitive strengths based on highest ratings AND adaptive test performance"],
    "overallScore": 0,
    "cognitiveProfile": "How they think, learn, and solve problems based on self-assessment AND adaptive test results",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "Their work style, team dynamics, and how to leverage their personality in school and future careers"
  },
  "workValues": {
    "topThree": [
      {"value": "Top motivator (Achievement, Helping, Innovation, Security, etc.)", "score": 4.0},
      {"value": "Second value", "score": 3.5},
      {"value": "Third value", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["Soft skills they're demonstrating (e.g., Leadership, Communication, Critical Thinking)"],
    "improvementAreas": ["Skills to develop - phrase constructively"],
    "overallReadiness": "Their current career readiness level with specific context"
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "Career cluster #1 (e.g., Healthcare & Medicine, Technology & Engineering, Business & Entrepreneurship)",
        "matchScore": 85,
        "fit": "High",
        "description": "3-4 sentences explaining WHY this fits based on their assessment. Be specific about how their interests, aptitudes, and personality align with this career path.",
        "examples": ["5-6 specific careers with brief role descriptions"],
        "educationPath": "Specific college majors and degree programs",
        "whatYoullDo": "Day-to-day activities and responsibilities in this field",
        "whyItFits": "Detailed connection between their assessment results and this career area",
        "evidence": {
          "interest": "How their RIASEC scores support this path",
          "aptitude": "Which cognitive strengths make them a good fit",
          "personality": "Personality traits that align with success in this field"
        },
        "roles": {
          "entry": ["4-5 entry-level jobs (e.g., Junior Developer, Lab Assistant, Marketing Intern)"],
          "mid": ["4-5 mid-career jobs (e.g., Senior Engineer, Research Scientist, Marketing Manager)"]
        },
        "domains": ["Related fields (e.g., Software, Hardware, AI, Cybersecurity)"]
      },
      {
        "title": "Career cluster #2",
        "matchScore": 75,
        "fit": "Medium",
        "description": "Specific explanation connecting their profile to this career area",
        "examples": ["4-5 career options"],
        "educationPath": "Relevant majors and programs",
        "whatYoullDo": "Overview of work in this field",
        "whyItFits": "How their strengths translate here",
        "evidence": {
          "interest": "Interest alignment",
          "aptitude": "Relevant cognitive skills",
          "personality": "Personality fit"
        },
        "roles": {
          "entry": ["3-4 entry-level positions"],
          "mid": ["3-4 mid-level careers"]
        },
        "domains": ["Related industries and specializations"]
      },
      {
        "title": "Career cluster #3",
        "matchScore": 65,
        "fit": "Explore",
        "description": "Why this is worth exploring despite lower match score",
        "examples": ["3-4 careers to consider"],
        "educationPath": "Potential degree paths",
        "whatYoullDo": "What professionals in this area do",
        "whyItFits": "Potential growth areas that could make this a fit",
        "evidence": {
          "interest": "Interest connections",
          "aptitude": "Transferable skills",
          "personality": "Personality considerations"
        },
        "roles": {
          "entry": ["2-3 starting positions"],
          "mid": ["2-3 advanced roles"]
        },
        "domains": ["Related career paths"]
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Career title 1", "salary": {"min": 4, "max": 10}},
        {"name": "Career title 2", "salary": {"min": 4, "max": 10}},
        {"name": "Career title 3", "salary": {"min": 4, "max": 10}},
        {"name": "Career title 4", "salary": {"min": 4, "max": 10}}
      ],
      "mediumFit": [
        {"name": "Career title 1", "salary": {"min": 3, "max": 8}},
        {"name": "Career title 2", "salary": {"min": 3, "max": 8}},
        {"name": "Career title 3", "salary": {"min": 3, "max": 8}}
      ],
      "exploreLater": [
        {"name": "Career title 1", "salary": {"min": 3, "max": 7}},
        {"name": "Career title 2", "salary": {"min": 3, "max": 7}}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Critical skill #1", "reason": "2-3 sentences explaining WHY this skill is essential for their target careers", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Specific action steps"},
      {"skill": "Critical skill #2", "reason": "Detailed explanation of how this skill impacts their career readiness", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Concrete ways to develop this"}
    ],
    "priorityB": [
      {"skill": "Important skill", "reason": "Clear explanation of why this skill matters for their career goals", "targetLevel": "Intermediate", "currentLevel": "Beginner"}
    ],
    "currentStrengths": ["3-4 skills they already demonstrate"],
    "recommendedTrack": "Clear development path with rationale"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Foundation Building",
        "goals": ["Master core skills", "Identify specific career interests", "Build initial portfolio"],
        "activities": ["Specific classes or online courses to take", "Projects to start", "Competitions to enter"],
        "outcome": "Clear career direction and foundational skills"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Skill Development",
        "goals": ["Earn certifications", "Build portfolio projects", "Network with professionals"],
        "activities": ["Specific certifications to pursue", "Portfolio work to complete", "Mentors to connect with"],
        "outcome": "Demonstrable skills and professional network"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Experience & Application",
        "goals": ["Secure internship/shadowing", "Lead school projects", "Apply skills in real contexts"],
        "activities": ["Internship applications", "Leadership opportunities", "Competitions or showcases"],
        "outcome": "Real-world experience and leadership roles"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "College & Career Prep",
        "goals": ["Finalize college plans", "Perfect portfolio", "Interview preparation"],
        "activities": ["College application work", "Portfolio refinement", "Mock interviews"],
        "outcome": "College-ready with strong applications"
      }
    },
    "projects": [
      {
        "title": "Portfolio project #1",
        "description": "Detailed description of the project (3-4 sentences)",
        "skills": ["Specific technical and soft skills they'll develop"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "How this project demonstrates career readiness",
        "output": "What they'll have to show",
        "steps": ["Step 1: Research and planning", "Step 2: Development/creation", "Step 3: Testing and refinement", "Step 4: Presentation"],
        "resources": ["Specific tools, platforms, or courses needed"]
      },
      {
        "title": "Project #2",
        "description": "Another substantive portfolio project",
        "skills": ["Skills to master"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "Career relevance",
        "output": "Deliverable",
        "steps": ["4-5 actionable steps"],
        "resources": ["Tools and learning resources"]
      },
      {
        "title": "Project #3",
        "description": "Advanced or capstone project",
        "skills": ["Advanced skills"],
        "timeline": "4-6 months",
        "difficulty": "Intermediate-Advanced",
        "purpose": "Why it's impressive for college/internships",
        "output": "Portfolio piece",
        "steps": ["Detailed action plan"],
        "resources": ["Required resources"]
      }
    ],
    "internship": {
      "types": ["Specific internship types matching their career interests"],
      "timing": "When and how long",
      "preparation": {
        "resume": "What to include",
        "portfolio": "What to showcase",
        "interview": "How to prepare"
      },
      "whereToApply": ["Specific companies, programs, or platforms to use"]
    },
    "exposure": {
      "activities": ["Specific clubs to join", "Competitions to enter", "Events to attend"],
      "certifications": ["Specific certifications to earn", "Why each certificate matters"],
      "onlineLearning": ["Specific courses on Coursera, edX, Khan Academy"],
      "networking": ["How to connect with professionals in their field"]
    }
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage for college and careers",
    "growthFocus": "One key area to focus development in the next 6-12 months"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on RIASEC interest results",
      "strength": "Their aptitude strengths from the assessment",
      "workStyle": "How they work and collaborate (from personality traits)",
      "motivation": "What drives them (from work values)"
    },
    "aptitudeStrengths": [
      {"name": "Cognitive strength #1", "description": "How this shows in assessment"},
      {"name": "Cognitive strength #2", "description": "Evidence from results"}
    ],
    "interestHighlights": ["Top 2-3 RIASEC interest areas with descriptions"],
    "personalityInsights": ["2-3 key personality traits that shape their career fit"]
  },
  "overallSummary": "3-4 sentences: Acknowledge their readiness level, affirm their direction, highlight unique strengths, and provide clear encouragement for next steps"
}

**SERIOUS CAREER GUIDANCE - JOB ROLES FOR HIGH SCHOOL (After 12th):**

### PROFESSIONAL CAREER PATHS BY STREAM:

**SCIENCE STREAM (PCM/PCB):**
- Engineering: Software Engineer, Mechanical Engineer, Civil Engineer, Electrical Engineer
- Medical: Doctor (MBBS), Dentist (BDS), Physiotherapist, Pharmacist
- Research: Research Scientist, Data Scientist, Biotechnologist
- Technology: AI/ML Engineer, Cybersecurity Analyst, Cloud Architect

**COMMERCE STREAM:**
- Finance: Chartered Accountant, Financial Analyst, Investment Banker
- Business: Business Analyst, Management Consultant, Operations Manager
- Banking: Bank Manager, Credit Analyst, Risk Analyst

**ARTS/HUMANITIES STREAM:**
- Law: Corporate Lawyer, Civil Lawyer, Legal Advisor
- Media: Journalist, News Anchor, Documentary Filmmaker
- Psychology: Clinical Psychologist, Counselor, HR Specialist

### ROLE SELECTION RULES:
1. Show ASPIRATIONAL yet ACHIEVABLE career paths after proper education
2. PERSONALIZE based on RIASEC profile
3. Include EDUCATION PATH for each career (degree requirements)
4. Show realistic SALARY expectations for entry-level in India (2024-2025)

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!`;
}
