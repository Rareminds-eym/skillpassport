/**
 * High School (Grades 9-12) Assessment Prompt Builder
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): {
  section: string;
  isHighAptitude: boolean;
  topStrengths: string[];
} {
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

  // Career mapping for high school (more specific)
  const careerMapping: Record<string, string[]> = {
    'numerical reasoning': ['Data Scientist', 'Quantitative Analyst', 'Actuary', 'Financial Engineer', 'ISRO Scientist', 'CA'],
    'logical reasoning': ['Software Architect', 'AI/ML Engineer', 'Corporate Lawyer', 'IAS Officer', 'Management Consultant'],
    'verbal reasoning': ['Journalist', 'Diplomat (IFS)', 'Content Strategist', 'Professor', 'Supreme Court Advocate'],
    'spatial reasoning': ['Architect', 'Surgeon', 'Game Developer', 'Aerospace Engineer', 'VR/AR Designer'],
    'pattern recognition': ['Cybersecurity Expert', 'Research Scientist', 'Algorithmic Trader', 'Cryptographer', 'Data Engineer'],
    'data interpretation': ['Business Analyst', 'Economist', 'Market Research Director', 'Policy Advisor', 'Statistician']
  };

  const recommendedCareers = new Set<string>();
  sortedSubtags.slice(0, 2).forEach(s => {
    const careers = careerMapping[s.name.toLowerCase()] || [];
    careers.forEach(c => recommendedCareers.add(c));
  });

  const section = `
## ADAPTIVE APTITUDE TEST RESULTS (Pre-Analyzed):
- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS** (prioritize careers matching these):
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- Balanced across all areas'}

**AREAS FOR DEVELOPMENT**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant gaps'}

**RECOMMENDED CAREER DIRECTIONS**:
${Array.from(recommendedCareers).slice(0, 6).map(c => `- ${c}`).join('\n')}

${isHighAptitude ? `
**⭐ HIGH-APTITUDE STUDENT** (Level ${level}, ${Math.round(accuracy)}% accuracy)
MUST include competitive/prestigious paths:
- UPSC: IAS, IPS, IFS, IRS (start preparation in 11th-12th)
- Defence: NDA, CDS, AFCAT pathways
- Medical Elite: AIIMS, top medical colleges (NEET)
- Engineering Elite: IIT (JEE Advanced), ISRO, DRDO
- Legal: NLSIU, top NLUs (CLAT)
- Finance: CA, CFA, Investment Banking
- Research: PhD at IISc, IITs, international universities
` : ''}`;

  return { section, isHighAptitude, topStrengths };
}

export function buildHighSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';

  // Extract actual grade from student context
  const studentGrade = assessmentData.studentContext?.rawGrade || assessmentData.studentContext?.grade;
  const gradeInfo = studentGrade ? ` The student is currently in grade ${studentGrade}.` : '';

  return `You are a career counselor for high school and higher secondary students (grades 9-12). Analyze this student's career exploration assessment and provide guidance appropriate for their age and academic level.${gradeInfo}

**IMPORTANT - AGE-APPROPRIATE GUIDANCE:**
- For grades 9-10: Focus on stream selection (Science/Commerce/Arts), foundational skills, and exploration. Avoid specific college programs.
- For grades 11-12: Include specific college programs, entrance exams (JEE, NEET, CLAT), and detailed career paths.

## 🔥 CRITICAL: USE REAL-TIME JOB MARKET DATA
If real-time Indian job market data is provided above (marked with "REAL-TIME INDIAN JOB MARKET DATA"), you MUST:
1. ✅ Use ONLY the salary ranges from that data (NOT the hardcoded examples below)
2. ✅ Use ONLY the job roles listed in that data
3. ✅ Use ONLY the career categories provided in the real-time data
4. ✅ Copy the "Why Better" descriptions exactly as provided
5. ✅ Use the exact salary format: "₹X-YL entry, ₹X-YL mid, ₹X-YL senior"
6. ✅ Prioritize HIGH demand roles over medium/low demand
7. ✅ Consider growth rates when ranking career recommendations
8. ✅ Match student's RIASEC profile to the provided categories

**DYNAMIC CATEGORY MATCHING:**
The real-time data includes categories specifically selected for this student's RIASEC profile.
- If student is "ASR" (Artistic, Social, Realistic), the data will include Creative Industries, Event Management, etc.
- If student is "IRE" (Investigative, Realistic, Enterprising), the data will include Technology, Engineering, Business, etc.
- Use the provided categories as your TRACK 1, TRACK 2, and TRACK 3 recommendations
- DO NOT ignore the provided categories and use hardcoded examples instead

**EXAMPLE:**
If real-time data shows:
"Creative Industries & Media (BEST for A+S combinations)
- Why Better: Orange economy creating 10-20M jobs by 2026. Remote work opportunities.
- Hot Roles:
  * UX/UI Designer (₹5-15L entry, ₹15-45L mid, ₹45-100L senior)"

You MUST use this as one of the career tracks, NOT the hardcoded examples below.

If NO real-time data is provided, use the fallback career clusters below.

---

## FALLBACK CAREER CLUSTERS (Use ONLY if no real-time data above):

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

## ⚠️ CRITICAL: ARTISTIC (A) RIASEC CAREER MATCHING ⚠️
**IF the student's RIASEC scores show 'A' (Artistic) in their top 3 types, you MUST include at least ONE career cluster from these categories:**

**MANDATORY for High Artistic (A) Students:**
- Music & Entertainment: Music Producer, Sound Designer, DJ, Film Score Composer, Concert Manager
- Visual Arts: Digital Artist, Animator, Art Director, Fashion Designer, Art Gallery Curator
- Performing Arts: Actor, Dancer, Choreographer, Theatre Director, Voice Actor
- Media & Content: YouTuber, Content Creator, Podcast Host, Film Director, Screenwriter
- Design: Graphic Designer, UX/UI Designer, Game Designer, Interior Designer, Brand Designer

**DO NOT default to only Technology/Science careers for Artistic students!**
**The student's creative interests MUST be reflected in their career recommendations.**

## Strengths & Character Responses (1-4 scale):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**STRENGTHS SCORING**: These are VIA character strengths (Curiosity, Perseverance, Honesty, Creativity, Resilience, Kindness, Self-Discipline, Responsibility, Leadership, Self-Awareness).
- Rating 1 = Not me, 2 = A bit, 3 = Mostly, 4 = Strongly me
- Identify top 3-4 strengths (ratings 3-4)
- Note text responses about challenges overcome and what others appreciate

## Aptitude Sampling (Self-Assessment of Task Types):
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}
Pre-calculated scores: ${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**APTITUDE SAMPLING SCORING**:
Students rated EASE (1-4) and ENJOYMENT (1-4) for 4 task types:
- Analytical (data interpretation, logic, stats)
- Creative (design, storytelling, media)
- Technical (coding, building, prototyping)
- Social (leadership, conflict resolution, mentoring)
Higher ratings = stronger aptitude and interest in that area
${adaptiveSection}

## Learning & Work Preferences:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**LEARNING PREFERENCES**: Reveals how they learn best, task preferences, work style, and team contribution.
- Use to personalize career recommendations and development roadmap

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this structure for HIGH SCHOOL (9-10):

**CRITICAL DATABASE COMPATIBILITY REQUIREMENTS:**
1. riasec.code MUST be a 3-letter string (e.g., "RES"), NOT an array
2. aptitude.scores MUST exist with standard categories (verbal, numerical, abstract, spatial, clerical)
3. aptitude.overallScore MUST be a number (0-100)
4. bigFive MUST be a flat object with O, C, E, A, N keys (NO nested "scores" wrapper)

{
  "riasec": {
    "code": "ABC",
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for stream selection and career paths",
    "topThree": ["Top 3 RIASEC codes (for reference only)"]
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
      "data_interpretation": {"accuracy": 0},
      "pattern_recognition": {"accuracy": 0}
    },
    "topStrengths": ["2-3 strengths combining self-assessment AND adaptive test results"],
    "cognitiveProfile": "How they think and solve problems based on both assessments",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "characterStrengths": {
    "topStrengths": ["Top 3-4 character strengths (Curiosity, Creativity, Perseverance, Leadership, etc.)"],
    "strengthDescriptions": [
      {"name": "Strength 1", "rating": 4, "description": "How this shows in their responses"},
      {"name": "Strength 2", "rating": 4, "description": "Evidence from assessment"}
    ],
    "challengeOvercome": "Summary of challenge they described and strengths used",
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
      {"value": "Inferred from interests, strengths, and preferences", "score": 4.0},
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
        {"name": "Career title 1 (e.g., Software Developer)", "salary": {"min": 5, "max": 12}},
        {"name": "Career title 2 (e.g., Graphic Designer)", "salary": {"min": 4, "max": 10}},
        {"name": "Career title 3 (e.g., Marketing Manager)", "salary": {"min": 6, "max": 15}},
        {"name": "Career title 4 (e.g., Teacher)", "salary": {"min": 3, "max": 8}}
      ],
      "mediumFit": [
        {"name": "Career title 1 (e.g., Content Writer)", "salary": {"min": 3, "max": 7}},
        {"name": "Career title 2 (e.g., Sales Executive)", "salary": {"min": 4, "max": 10}},
        {"name": "Career title 3 (e.g., HR Manager)", "salary": {"min": 5, "max": 12}}
      ],
      "exploreLater": [
        {"name": "Career title 1 (e.g., Social Worker)", "salary": {"min": 3, "max": 6}},
        {"name": "Career title 2 (e.g., Photographer)", "salary": {"min": 3, "max": 8}}
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

**CAREER CLUSTER GUIDELINES FOR HIGH SCHOOL (Market-Aligned 2025-2030):**

**CRITICAL: Career clusters MUST be personalized based on student's RIASEC + Aptitude + Personality profile.**

**TRACK 1 (HIGH FIT) - Top Career Clusters by Market Demand & Student Profile:**

**🚀 TECHNOLOGY & DIGITAL INNOVATION** (For I+R+E types, high numerical/logical aptitude)
- **Hot Roles**: AI/ML Engineer (₹8-25L entry, ₹25-80L mid), Full Stack Developer (₹6-18L entry, ₹18-50L mid), Data Scientist (₹7-20L entry, ₹20-60L mid), Cloud Architect (₹10-25L entry, ₹25-70L mid), Cybersecurity Analyst (₹6-15L entry, ₹15-45L mid)
- **Education Path**: BTech CS/IT from Tier 1-2 colleges, Online certifications (AWS, Google Cloud, Azure), Bootcamps (Scaler, Masai School), Self-taught + portfolio
- **Market Reality**: 70% of tech jobs don't require IIT degree. Portfolio + skills > college brand. Remote work = global salaries (₹30-80L for 3-5 years exp)
- **Growth Sectors**: AI/ML (40% YoY growth), Cloud Computing (35% growth), Cybersecurity (30% growth), DevOps (28% growth)

**💼 BUSINESS, FINANCE & CONSULTING** (For E+C+I types, high numerical/analytical aptitude)
- **Best for profiles combining**: Analysis (I) + Leadership (E) + Organization (C), or Analysis (I) + Leadership (E) + People Skills (S)
- **Hot Roles**: 
  * Business Analyst (₹6-15L entry, ₹15-40L mid, ₹40-80L senior) - Great for I+E combinations
  * Management Consultant (₹8-20L entry, ₹20-60L mid, ₹60-150L senior) - Great for I+E+S combinations
  * Product Manager (₹10-25L entry, ₹25-80L mid, ₹80-200L senior) - Great for I+E combinations
  * HR Analytics Manager (₹7-18L entry, ₹18-45L mid, ₹45-100L senior) - Great for I+E+S combinations
  * Market Research Director (₹8-20L entry, ₹20-55L mid, ₹55-120L senior) - Great for I+E combinations
  * Financial Analyst (₹5-12L entry, ₹12-35L mid, ₹35-80L senior) - Great for I+C combinations
  * Investment Banking Analyst (₹10-25L entry, ₹25-1Cr mid) - Great for I+E+C combinations
- **Education Path**: BCom/BBA + MBA from Tier 1 B-schools (IIM, ISB, XLRI), CA (5 years), CFA (3-4 years), Economics/Finance degree, Data Analytics certifications
- **Market Reality**: MBA from top 20 B-schools = ₹20-35L starting. CA = stable ₹8-15L start, ₹30-80L after 8-10 years. Consulting = high stress, high reward. Business Analytics = fastest growing (35% YoY)
- **Growth Sectors**: Fintech (45% growth), Management Consulting (25% growth), Investment Banking (20% growth), Private Equity (30% growth), Business Analytics (35% growth)

**🏥 HEALTHCARE & LIFE SCIENCES** (For I+S types, high verbal/analytical aptitude, PCB stream)
- **Hot Roles**: Doctor/MBBS (₹6-15L entry, ₹15-80L mid), Dentist (₹5-12L entry, ₹12-50L mid), Pharmacist (₹3-8L entry, ₹8-25L mid), Biotech Researcher (₹4-10L entry, ₹10-35L mid), Medical Device Engineer (₹5-12L entry, ₹12-40L mid)
- **Education Path**: NEET → MBBS (5.5 years) → MD/MS (3 years), BDS (5 years), BPharm (4 years) → MPharm (2 years), BTech Biomedical
- **Market Reality**: MBBS = 10-year commitment (5.5 + 3 + 1 internship). Private practice = ₹50L-2Cr after 10-15 years. Government jobs = stable ₹10-25L
- **Growth Sectors**: Telemedicine (50% growth), Medical Devices (35% growth), Biotechnology (30% growth), Healthcare IT (40% growth)

**🎨 CREATIVE INDUSTRIES & MEDIA** (For A+E types, high creative/verbal aptitude)
- **Hot Roles**: UX/UI Designer (₹5-15L entry, ₹15-45L mid), Content Creator/YouTuber (₹2-10L entry, ₹10L-2Cr mid), Graphic Designer (₹3-8L entry, ₹8-25L mid), Video Editor (₹4-10L entry, ₹10-35L mid), Digital Marketing Manager (₹5-12L entry, ₹12-40L mid)
- **Education Path**: BDes from NID/NIFT/Srishti, Mass Comm/Journalism, Self-taught + portfolio (most important), Online courses (Coursera, Udemy)
- **Market Reality**: Portfolio > degree. Freelancing = ₹50K-5L/month. Agency jobs = stable but lower pay. In-house at tech companies = best pay (₹15-50L)
- **Growth Sectors**: OTT Content (60% growth), Digital Marketing (45% growth), Gaming (40% growth), Animation/VFX (35% growth)

**⚖️ LAW & GOVERNANCE** (For I+E+S types, high verbal/logical aptitude)
- **Hot Roles**: Corporate Lawyer (₹6-18L entry, ₹18-80L mid), Legal Consultant (₹5-15L entry, ₹15-50L mid), Compliance Officer (₹5-12L entry, ₹12-35L mid), Patent Attorney (₹6-15L entry, ₹15-45L mid)
- **Education Path**: CLAT → 5-year BA LLB from NLU, 3-year LLB after graduation, LLM for specialization
- **Market Reality**: Top law firms (AZB, Cyril Amarchand) = ₹15-25L start. Tier 2 firms = ₹8-15L. Corporate in-house = ₹10-30L after 5 years
- **Growth Sectors**: Corporate Law (25% growth), IP/Patent Law (35% growth), Cyber Law (40% growth), Legal Tech (50% growth)

**🏛️ CIVIL SERVICES & GOVERNMENT** (For high aptitude students, I+S+C types, disciplined personality)
- **Hot Roles**: IAS Officer (₹56K-2.5L/month + perks), IPS Officer (₹56K-2L/month + perks), IFS Diplomat (₹56K-2L/month + perks), IRS Officer (₹56K-2L/month + perks), Defence Officer (₹56K-2L/month + perks)
- **Education Path**: Any graduation + UPSC CSE (2-3 years prep), NDA for defence (after 12th), State PSC exams
- **Market Reality**: UPSC success rate = 0.1% (1000 selected from 10L candidates). Requires 2-3 years dedicated preparation. Lifetime job security + prestige
- **Growth Sectors**: Administrative Services (stable), Defence (growing), Foreign Service (competitive), Revenue Services (stable)

**TRACK 2 (MEDIUM FIT) - Emerging & Specialized Career Clusters:**

**🔬 RESEARCH & ACADEMIA** (For I+C types, very high analytical aptitude, patient personality)
- **Hot Roles**: Research Scientist (₹5-12L entry, ₹12-40L mid), PhD Scholar (₹31K-35K/month stipend), Professor (₹6-15L entry, ₹15-50L mid), Data Analyst (₹4-10L entry, ₹10-30L mid)
- **Education Path**: BSc → MSc → PhD (8-10 years total), BTech → MTech → PhD, Research fellowships (CSIR, UGC, DBT)
- **Market Reality**: Long education path (8-10 years). Academic jobs = stable but lower pay. Industry research (Google, Microsoft Research) = ₹15-60L
- **Growth Sectors**: AI Research (50% growth), Biotech Research (35% growth), Climate Science (40% growth), Quantum Computing (60% growth)

**🏗️ ENGINEERING & INFRASTRUCTURE** (For R+I types, high spatial/numerical aptitude, PCM stream)
- **Hot Roles**: Civil Engineer (₹3-8L entry, ₹8-25L mid), Mechanical Engineer (₹4-10L entry, ₹10-30L mid), Electrical Engineer (₹4-10L entry, ₹10-35L mid), Aerospace Engineer (₹6-15L entry, ₹15-50L mid)
- **Education Path**: BTech from Tier 1-2 colleges, Diploma (3 years) + BTech lateral entry, MTech for specialization
- **Market Reality**: Core engineering = lower pay than software (₹3-8L start). PSUs (ONGC, NTPC, BHEL) = stable ₹8-15L. Private = project-based
- **Growth Sectors**: Renewable Energy (40% growth), Smart Cities (30% growth), Aerospace (25% growth), Robotics (35% growth)

**🎓 EDUCATION & TRAINING** (For S+I types, high verbal aptitude, patient personality)
- **Hot Roles**: Teacher (₹3-8L entry, ₹8-20L mid), Corporate Trainer (₹5-12L entry, ₹12-35L mid), EdTech Content Creator (₹4-10L entry, ₹10-30L mid), Curriculum Designer (₹5-12L entry, ₹12-30L mid)
- **Education Path**: BEd (2 years after graduation), MEd, Subject degree + teaching certification, Online course creation
- **Market Reality**: Government school teacher = ₹3-8L (stable, pension). Private school = ₹3-6L. EdTech = ₹8-25L (Byju's, Unacademy). Freelance tutoring = ₹50K-3L/month
- **Growth Sectors**: EdTech (55% growth), Online Tutoring (45% growth), Corporate Training (30% growth), Skill Development (40% growth)

**🌍 SOCIAL IMPACT & NGO** (For S+A types, high empathy, mission-driven personality)
- **Hot Roles**: Social Worker (₹3-7L entry, ₹7-18L mid), NGO Program Manager (₹4-10L entry, ₹10-25L mid), CSR Manager (₹6-15L entry, ₹15-40L mid), Development Consultant (₹5-12L entry, ₹12-35L mid)
- **Education Path**: BA/BSW in Social Work, MA in Development Studies, MBA with CSR specialization
- **Market Reality**: NGO sector = lower pay but high satisfaction. Corporate CSR roles = better pay (₹10-30L). International NGOs (UN, WHO) = ₹15-50L
- **Growth Sectors**: CSR (35% growth), Social Entrepreneurship (40% growth), Impact Investing (45% growth), Sustainability Consulting (50% growth)

**TRACK 3 (EXPLORE) - Niche & Unconventional Career Clusters:**

**🎮 GAMING & ESPORTS** (For A+R types, high pattern recognition, tech-savvy)
- **Hot Roles**: Game Developer (₹4-12L entry, ₹12-40L mid), Game Designer (₹4-10L entry, ₹10-35L mid), Professional Gamer (₹2-10L entry, ₹10L-2Cr mid), Esports Manager (₹3-8L entry, ₹8-25L mid)
- **Education Path**: BTech CS + game dev courses, BDes in Game Design, Self-taught + portfolio, Online courses (Unity, Unreal Engine)
- **Market Reality**: Indian gaming industry = ₹135B (2024), growing 30% YoY. Mobile gaming = biggest opportunity. Esports = high risk, high reward
- **Growth Sectors**: Mobile Gaming (40% growth), Esports (50% growth), Game Streaming (45% growth), VR/AR Gaming (60% growth)

**🌱 AGRICULTURE & FOOD TECH** (For R+I types, high numerical aptitude, rural background advantage)
- **Hot Roles**: Agricultural Scientist (₹4-10L entry, ₹10-30L mid), Food Technologist (₹3-8L entry, ₹8-25L mid), Agri-Business Manager (₹5-12L entry, ₹12-35L mid), Precision Farming Specialist (₹4-10L entry, ₹10-30L mid)
- **Education Path**: BSc Agriculture, BTech Food Technology, MBA Agribusiness, Online courses in AgriTech
- **Market Reality**: Traditional agriculture = lower pay. AgriTech startups (Ninjacart, DeHaat) = ₹8-25L. Food processing = stable ₹5-15L
- **Growth Sectors**: AgriTech (45% growth), Food Processing (30% growth), Organic Farming (40% growth), Precision Agriculture (50% growth)

**✈️ HOSPITALITY & TOURISM** (For E+S types, high social aptitude, extroverted personality)
- **Hot Roles**: Hotel Manager (₹4-10L entry, ₹10-30L mid), Event Manager (₹3-8L entry, ₹8-25L mid), Travel Consultant (₹3-7L entry, ₹7-20L mid), Chef (₹3-8L entry, ₹8-30L mid)
- **Education Path**: BHM (Hotel Management), Culinary Arts degree, Event Management certification, Tourism Management degree
- **Market Reality**: Hospitality = long hours, moderate pay. 5-star hotels = ₹5-15L. Own restaurant/hotel = ₹10L-1Cr (high risk). Travel industry recovering post-COVID
- **Growth Sectors**: Luxury Tourism (35% growth), Event Management (30% growth), Culinary Arts (25% growth), Eco-Tourism (40% growth)

**🎭 PERFORMING ARTS & ENTERTAINMENT** (For A+E types, very high creative aptitude, risk-tolerant)
- **Hot Roles**: Actor (₹2-10L entry, ₹10L-10Cr mid), Musician (₹2-8L entry, ₹8L-5Cr mid), Dancer/Choreographer (₹2-6L entry, ₹6-50L mid), Theatre Director (₹3-8L entry, ₹8-30L mid)
- **Education Path**: NSD (National School of Drama), Film schools (FTII, Whistling Woods), Music conservatories, Self-taught + auditions
- **Market Reality**: Extremely competitive. 95% struggle initially (₹10K-50K/month). Top 5% earn ₹50L-10Cr. Side hustles essential. OTT = more opportunities
- **Growth Sectors**: OTT Content (60% growth), Music Streaming (40% growth), Live Events (35% growth post-COVID), Digital Theatre (45% growth)

**GUIDELINES FOR CAREER CLUSTER SELECTION:**
1. **TRACK 1 (High Fit)**: Choose clusters where student's RIASEC top 3 + aptitude strengths + personality traits align strongly. Match score 75-95.
2. **TRACK 2 (Medium Fit)**: Choose clusters where 2 out of 3 factors align (interests OR aptitude OR personality). Match score 60-75.
3. **TRACK 3 (Explore)**: Choose clusters that could become high fit with skill development, or represent growth areas. Match score 50-65.
4. **Salary Ranges**: All figures are realistic for India (2025-2030). Entry = 0-3 years, Mid = 3-8 years experience.
5. **Education Paths**: Include specific colleges, entrance exams, and alternative paths (self-taught, bootcamps, online).
6. **Market Reality**: Be honest about competition, work-life balance, job security, and growth potential.
7. **For HIGH APTITUDE students (level 4-5)**: Prioritize Track 1 clusters with competitive exam pathways (UPSC, JEE, NEET, CLAT, CAT).
8. **For CREATIVE students (high A in RIASEC)**: MUST include at least one cluster from Creative Industries, Media, Gaming, or Performing Arts.
9. **For SOCIAL students (high S in RIASEC)**: Prioritize Healthcare, Education, Social Impact, or roles with high human interaction.
10. **Personalization is KEY**: Don't just copy-paste. Explain WHY each cluster fits THIS specific student's profile.

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!

**⚠️ IMPROVED 3RD TRACK CAREER RECOMMENDATIONS (CRITICAL UPDATE 2026):**

**FOR STUDENTS WITH 'S' (SOCIAL) IN TOP 3 RIASEC TYPES:**

The 3rd career track (Explore fit, 60-70% match) should prioritize ASPIRATIONAL careers that combine social impact with strong earning potential. **DO NOT default to NGO/Social Work unless student has very low aptitude (<30% accuracy) or explicitly expresses NGO interest.**

**TIER 1 - EVENT & EXPERIENCE MANAGEMENT** (BEST for A+S or E+S combinations, low-moderate aptitude)
- **Why Better**: India's experience economy booming (₹10,000+ crore wedding industry, 15-20% YoY growth). Entrepreneurial potential. Low cognitive demand, high people skills.
- **Hot Roles**: 
  * Wedding Planner (₹4-7L entry + ₹50K-2L per event, ₹10-25L mid, ₹25L-1Cr senior/own business)
  * Event Coordinator (₹4-8L entry, ₹8-15L mid, ₹15-30L senior)
  * Hospitality Manager (₹4-7L entry, ₹7-14L mid, ₹14-25L senior)
  * Experience Designer (₹5-9L entry, ₹9-18L mid, ₹18-35L senior)
  * Guest Relations Manager (₹4-8L entry, ₹8-16L mid, ₹16-28L senior)
- **Education Path**: Hotel Management diploma/degree, Event Management certification, or start with internships (no degree required for entrepreneurial path)
- **Market Reality**: Wedding packages ₹2L-5L+. Corporate events ₹5L-50L. Own event company after 5-7 years = ₹20L-1Cr revenue
- **Evidence Template**: "Your creativity and people skills make you perfect for creating memorable experiences. India's events industry is booming with strong entrepreneurial potential."

**TIER 2 - HEALTHCARE & WELLNESS COORDINATION** (BEST for S+I combinations, moderate aptitude)
- **Why Better**: Healthcare sector added 7.5M jobs (62% YoY growth). Entry-level roles growing 25% annually. Stable, recession-proof.
- **Hot Roles**:
  * Patient Care Coordinator (₹4-7L entry, ₹7-13L mid, ₹13-22L senior)
  * Healthcare Customer Support (₹3.5-6L entry, ₹6-11L mid, ₹11-18L senior)
  * Medical Representative (₹4-8L entry + incentives, ₹8-18L mid, ₹18-35L senior)
  * Wellness Program Coordinator (₹4-7L entry, ₹7-14L mid, ₹14-25L senior)
  * Clinical Assistant (₹3-5L entry, ₹5-10L mid, ₹10-18L senior)
  * Health Coach (₹4-7L entry, ₹7-15L mid, ₹15-28L senior)
- **Education Path**: Healthcare administration diploma, Medical representative training, Wellness coaching certification, or entry-level hospital roles
- **Market Reality**: Telemedicine creating 8,000+ opportunities. Healthcare IT roles ₹8-25L. Hospital administration ₹10-30L after 5-8 years
- **Evidence Template**: "Your empathy and desire to help others align perfectly with healthcare coordination roles. The sector is experiencing explosive growth with strong career progression."

**TIER 3 - DIGITAL CONTENT & COMMUNITY MANAGEMENT** (BEST for A+S combinations, creative aptitude)
- **Why Better**: Orange economy creating 10-20M jobs by 2026. Remote work opportunities. Creative expression + audience engagement.
- **Hot Roles**:
  * Social Media Manager (₹3-6L entry, ₹6-13L mid, ₹13-25L senior)
  * Community Manager (₹4-7L entry, ₹7-15L mid, ₹15-30L senior)
  * Content Coordinator (₹3-6L entry, ₹6-12L mid, ₹12-22L senior)
  * Customer Success Manager (₹4-8L entry, ₹8-16L mid, ₹16-32L senior)
  * Brand Ambassador (₹3-6L entry, ₹6-12L mid, ₹12-25L senior)
  * Content Creator (₹3-8L entry + brand deals, ₹8-20L mid, ₹20L-1Cr senior/influencer)
- **Education Path**: Digital marketing certification, Content creation courses, Social media management training, or build portfolio through personal projects
- **Market Reality**: Remote work = global opportunities. Freelancing ₹50K-5L/month. Agency jobs stable. In-house at tech companies = ₹15-50L
- **Evidence Template**: "Your creativity and social skills are perfect for building online communities and creating engaging content in India's booming digital economy."

**TIER 4 - SALES & ACCOUNT MANAGEMENT** (BEST for E+S combinations, extroverted personality)
- **Why Better**: Every company needs sales. High earning potential with commissions. Clear progression path.
- **Hot Roles**:
  * Account Executive (₹4-8L entry + commission, ₹8-18L mid, ₹18-40L senior)
  * Customer Success Manager (₹4-8L entry, ₹8-16L mid, ₹16-35L senior)
  * Business Development Associate (₹4-9L entry + incentives, ₹9-20L mid, ₹20-50L senior)
  * Sales Coordinator (₹3-6L entry, ₹6-13L mid, ₹13-25L senior)
  * Relationship Manager (₹4-8L entry, ₹8-18L mid, ₹18-40L senior)
- **Education Path**: Any degree + sales training, MBA for faster growth, or start in entry-level sales roles
- **Market Reality**: Top performers earn 2-3x base salary with commissions. B2B SaaS sales = ₹15-50L after 3-5 years. Enterprise sales = ₹30-80L
- **Evidence Template**: "Your social skills and persuasive abilities make you well-suited for client-facing roles with unlimited earning potential through performance."

**TIER 5 - SOCIAL IMPACT & NGO** (ONLY USE IF: aptitude <30% accuracy OR student explicitly mentions NGO interest OR all other options exhausted)
- **When to Use**: Student has very low aptitude (Level 1, <30% accuracy) AND strong social mission AND limited career options
- **Hot Roles**:
  * NGO Program Manager (₹4-10L entry, ₹10-20L mid, ₹20-35L senior)
  * Social Worker (₹3-6L entry, ₹6-12L mid, ₹12-20L senior)
  * CSR Manager (₹6-15L entry, ₹15-30L mid, ₹30-50L senior)
  * Development Consultant (₹5-12L entry, ₹12-25L mid, ₹25-45L senior)
  * Community Development Officer (₹4-8L entry, ₹8-16L mid, ₹16-28L senior)
- **Education Path**: BA/BSW in Social Work, MA in Development Studies, MBA with CSR specialization
- **Market Reality**: NGO sector = lower pay but high satisfaction. Corporate CSR roles = better pay (₹10-30L). International NGOs (UN, WHO) = ₹15-50L
- **Evidence Template**: "Your empathy and desire to make a difference align with social impact roles. Consider corporate CSR positions for better earning potential while maintaining social mission."

**SELECTION ALGORITHM FOR 3RD TRACK (SOCIAL STUDENTS):**

\`\`\`
IF student has 'S' in top 3 RIASEC:
  IF aptitude_level >= 2 OR accuracy >= 30%:
    IF 'A' also in top 3:
      RECOMMEND: Event & Experience Management (TIER 1) OR Digital Content (TIER 3)
    ELSE IF 'I' also in top 3:
      RECOMMEND: Healthcare Coordination (TIER 2)
    ELSE IF 'E' also in top 3:
      RECOMMEND: Sales & Account Management (TIER 4) OR Event Management (TIER 1)
    ELSE:
      RECOMMEND: Healthcare Coordination (TIER 2) as default
  ELSE IF aptitude_level == 1 AND accuracy < 30%:
    RECOMMEND: Event Management (TIER 1) OR Social Impact (TIER 5)
  END IF
END IF
\`\`\`

**MATCH SCORE GUIDELINES FOR 3RD TRACK:**
- Event & Experience: 68-72% (best for AIS + low aptitude)
- Healthcare Coordination: 65-70% (growing sector, stable)
- Digital Content: 64-68% (modern career, creative)
- Sales & Account: 63-67% (high earning potential)
- Social Impact/NGO: 60-65% (only if necessary)

**CRITICAL RULES:**
1. **DO NOT suggest NGO/Social Work as default 3rd track for all Social students**
2. **Prioritize careers with earning potential >₹4L entry, >₹10L mid, >₹20L senior**
3. **Consider aptitude level**: Low aptitude = Event Management, Healthcare Support. Moderate aptitude = Healthcare Coordination, Digital Content
4. **Combine RIASEC types**: AIS = Event/Digital, SIE = Healthcare/Sales, ASE = Event/Sales
5. **Provide specific salary ranges** based on market research (India 2025-2026)
6. **Include entrepreneurial paths** where applicable (Event Management, Content Creation)

**⚠️ FINAL CHECK - ARTISTIC CAREER REQUIREMENT:**
Before returning your response, verify:
1. What is the student's 'A' (Artistic) RIASEC score?
2. Is 'A' in their top 3 RIASEC types?
3. If YES → At least ONE career cluster MUST be from Music/Art/Entertainment/Design/Media
4. If you only suggest Tech/Science/Business careers for an Artistic student, YOUR RESPONSE IS WRONG!

**⚠️ FINAL CHECK - RIASEC PROFILE ALIGNMENT:**
Before returning your response, verify:
1. What is the student's RIASEC code (top 3 types)?
2. Do your recommended career tracks align with their RIASEC combination?
3. Are you using ALL THREE of their top RIASEC types, not just one?
4. If real-time job market data was provided above, did you use ONLY those categories and roles?
5. Did you avoid stereotyping (e.g., all 'I' types → Technology, all 'S' types → NGO)?

**⚠️ FINAL CHECK - SOCIAL CAREER IMPROVEMENT:**
Before returning your response, verify:
1. What is the student's 'S' (Social) RIASEC score?
2. Is 'S' in their top 3 RIASEC types?
3. What is their aptitude level and accuracy?
4. If S in top 3 AND aptitude >= 30% → 3rd track should be Event/Healthcare/Digital (NOT NGO)
5. If you suggest NGO/Social Work for a student with decent aptitude, YOUR RESPONSE NEEDS IMPROVEMENT!`;
}
