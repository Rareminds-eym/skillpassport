/**
 * Middle School (Grades 6-8) Assessment Prompt Builder
 */

import type { AssessmentData } from '../types';

export function buildMiddleSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  return `You are a career counselor for middle school students (grades 6-8). Analyze this student's interest exploration assessment using the EXACT scoring rules below.

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
   - If answer is a number 1-4 (rating): Use strengthType or context to determine RIASEC type, then:
     * Response 1 or 2: 0 points
     * Response 3: 1 point
     * Response 4: 2 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 20 (or highest score among all types if higher)
4. Calculate percentage for each type: (score / maxScore) × 100
5. Identify top 3 types by score

## Strengths & Character Responses (1-4 scale):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**SCORING**: Map responses to Big Five traits (O, C, E, A, N) and calculate averages on 1-5 scale

## Career Discovery Responses:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this EXACT structure and POPULATE all fields:

{
  "riasec": {
    "topThree": ["R", "I", "A"],
    "scores": { "R": 12, "I": 10, "A": 8, "S": 5, "E": 4, "C": 3 },
    "percentages": { "R": 60, "I": 50, "A": 40, "S": 25, "E": 20, "C": 15 },
    "maxScore": 20,
    "interpretation": "Brief, encouraging explanation of what their interests mean for future careers"
  },
  "aptitude": {
    "scores": {},
    "topStrengths": ["2-3 character strengths like Curiosity, Creativity, Persistence, Problem-solving"],
    "overallScore": 0,
    "cognitiveProfile": "Age-appropriate description of how they think and learn best"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "How they work and learn best based on their personality traits"
  },
  "workValues": {
    "topThree": [
      {"value": "Helping Others / Creativity / Learning / Achievement / Independence", "score": 4.0},
      {"value": "Second most important value", "score": 3.5},
      {"value": "Third value", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["2-3 soft skills they're already showing (e.g., Teamwork, Communication, Curiosity)"],
    "improvementAreas": ["1-2 areas to grow (phrase positively and encouragingly)"]
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "Broad career area #1 (e.g., Creative Arts & Design, Science & Technology, Helping People)",
        "matchScore": 85,
        "fit": "High",
        "description": "2-3 sentences explaining WHY this career area matches their interests and strengths. Make it personal and specific to their assessment results.",
        "examples": ["4-5 specific jobs in this area they can understand (e.g., Video Game Designer, App Developer)"],
        "whatYoullDo": "Brief description of typical activities in this career area",
        "whyItFits": "Connects to their top interests and character strengths",
        "evidence": {
          "interest": "How their RIASEC scores support this path",
          "aptitude": "Which character strengths make them a good fit",
          "personality": "Personality traits that align with success in this field"
        },
        "roles": {
          "entry": ["3-4 jobs they could do right after school or training (e.g., Camp Counselor, Junior Designer)"],
          "mid": ["3-4 jobs they could work towards (e.g., Art Teacher, Game Developer, Graphic Designer)"]
        },
        "domains": ["Related areas like Design, Technology, Education, Entertainment"]
      },
      {
        "title": "Broad career area #2",
        "matchScore": 75,
        "fit": "Medium",
        "description": "Specific explanation of how their assessment connects to this career path",
        "examples": ["3-4 specific jobs"],
        "whatYoullDo": "What work in this area looks like",
        "whyItFits": "How their strengths apply here",
        "evidence": {
          "interest": "Interest alignment",
          "aptitude": "Relevant strengths",
          "personality": "Personality fit"
        },
        "roles": {
          "entry": ["2-3 entry-level jobs"],
          "mid": ["2-3 career-level jobs"]
        },
        "domains": ["Related fields and industries"]
      },
      {
        "title": "Broad career area #3",
        "matchScore": 65,
        "fit": "Explore",
        "description": "Why this could be interesting to explore based on their results",
        "examples": ["3-4 jobs to consider"],
        "whatYoullDo": "Overview of work in this area",
        "whyItFits": "Potential connections to their interests",
        "evidence": {
          "interest": "Interest connections",
          "aptitude": "Transferable strengths",
          "personality": "Personality considerations"
        },
        "roles": {
          "entry": ["2-3 starter jobs"],
          "mid": ["2-3 growth opportunities"]
        },
        "domains": ["Related career areas"]
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Career name 1", "salary": {"min": 3, "max": 6}},
        {"name": "Career name 2", "salary": {"min": 3, "max": 6}},
        {"name": "Career name 3", "salary": {"min": 3, "max": 6}}
      ],
      "mediumFit": [
        {"name": "Career name 1", "salary": {"min": 3, "max": 5}},
        {"name": "Career name 2", "salary": {"min": 3, "max": 5}}
      ],
      "exploreLater": [
        {"name": "Career name 1", "salary": {"min": 2, "max": 5}},
        {"name": "Career name 2", "salary": {"min": 2, "max": 5}}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Key foundational skill #1", "reason": "2-3 sentences explaining WHY this skill matters for their career interests", "targetLevel": "Beginner", "currentLevel": "Starting"},
      {"skill": "Key foundational skill #2", "reason": "Specific explanation of how developing this skill supports their goals", "targetLevel": "Beginner", "currentLevel": "Starting"}
    ],
    "priorityB": [
      {"skill": "Additional skill to explore", "reason": "Clear explanation of why this skill is valuable", "targetLevel": "Beginner"}
    ],
    "currentStrengths": ["2-3 skills they're already showing"],
    "recommendedTrack": "Clear learning path (e.g., Creative Exploration, STEM Discovery, People & Communication)"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Discover & Explore",
        "goals": ["Learn about careers", "Try new activities", "Discover what you enjoy"],
        "activities": ["2-3 specific things to do"],
        "outcome": "What they'll achieve"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Learn & Practice",
        "goals": ["Build basic skills", "Join clubs or groups", "Start small projects"],
        "activities": ["2-3 specific activities"],
        "outcome": "Skills they'll gain"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Create & Share",
        "goals": ["Make something", "Share with others", "Get feedback"],
        "activities": ["2-3 hands-on projects"],
        "outcome": "What they'll create"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "Grow & Reflect",
        "goals": ["Review progress", "Set new goals", "Plan next steps"],
        "activities": ["2-3 reflection activities"],
        "outcome": "Path forward"
      }
    },
    "projects": [
      {
        "title": "Beginner-friendly project #1",
        "description": "What they'll do (2-3 sentences, make it exciting and doable)",
        "skills": ["Skills they'll learn"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "Why this project matters",
        "output": "What they'll have when done",
        "steps": ["Step 1: Start here", "Step 2: Then do this", "Step 3: Finish with this"]
      },
      {
        "title": "Project #2",
        "description": "Another age-appropriate activity",
        "skills": ["Skills to build"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "Learning goal",
        "output": "Final product",
        "steps": ["3-4 simple steps"]
      },
      {
        "title": "Project #3",
        "description": "Third exploration project",
        "skills": ["More skills"],
        "timeline": "3-4 months",
        "difficulty": "Beginner",
        "purpose": "Why it's valuable",
        "output": "What they'll create",
        "steps": ["Clear action steps"]
      }
    ],
    "internship": {
      "types": ["Job shadowing opportunities", "School clubs to join", "Volunteer activities", "Summer camps"],
      "timing": "When to pursue these (school year, summer, etc.)",
      "preparation": {
        "resume": "Not needed yet - focus on exploring",
        "portfolio": "Keep notes about what you try and learn",
        "interview": "Practice talking about what interests you"
      }
    },
    "exposure": {
      "activities": ["Specific clubs, field trips, events to attend"],
      "certifications": ["Age-appropriate certificates to earn (e.g., Online badges, Typing certification, Basic computer skills)"],
      "resources": ["Books to read", "Websites to explore", "Videos to watch"]
    }
  },
  "finalNote": {
    "advantage": "Their standout strength or characteristic based on the assessment",
    "growthFocus": "One clear, encouraging next step"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on interest responses (RIASEC top types)",
      "strength": "Their character strengths from the assessment",
      "workStyle": "How they work and learn best (from personality traits)",
      "motivation": "What motivates them (from work values)"
    },
    "aptitudeStrengths": [
      {"name": "Character strength #1 (e.g., Curiosity, Creativity, Perseverance)", "description": "How this shows up in their responses"},
      {"name": "Character strength #2", "description": "Evidence from assessment"}
    ],
    "interestHighlights": ["Top 2-3 interest areas from RIASEC"],
    "personalityInsights": ["2-3 key personality traits that impact career fit"]
  },
  "overallSummary": "3-4 sentences: Affirm their interests, celebrate their strengths, paint an exciting picture of possible futures, encourage continued exploration"
}

**JOB ROLE GUIDELINES FOR MIDDLE SCHOOL:**
- Suggest EXCITING, RELATABLE career names that middle schoolers can understand
- Focus on MODERN roles they see in media/daily life (e.g., "Video Game Designer" not "Software Engineer")
- Include DIVERSE options: tech, creative, helping, business, science
- Use SIMPLE, engaging job titles (e.g., "App Creator", "Animal Doctor", "YouTuber/Content Creator")
- PERSONALIZE based on their RIASEC interests
- Salary ranges should be aspirational but realistic for future reference

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!`;
}
