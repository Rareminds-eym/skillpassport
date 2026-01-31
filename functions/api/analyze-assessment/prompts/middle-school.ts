/**
 * Middle School (Grades 6-8) Assessment Prompt Builder
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 * This reduces token usage and gives AI clearer direction
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): {
  section: string;
  isHighAptitude: boolean;
  topStrengths: string[];
  weakAreas: string[];
} {
  const level = results.aptitudeLevel;
  const accuracy = results.overallAccuracy;
  const isHighAptitude = level >= 4 || accuracy >= 75;
  
  // Map aptitude level to label
  const levelLabels: Record<number, string> = {
    1: 'Emerging',
    2: 'Developing', 
    3: 'Capable',
    4: 'Strong',
    5: 'Exceptional'
  };
  
  // Extract top strengths and weak areas from accuracyBySubtag
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

  // Career mapping based on cognitive strengths
  const careerMapping: Record<string, string[]> = {
    'numerical reasoning': ['Data Scientist', 'Financial Analyst', 'Actuary', 'Quantitative Researcher', 'ISRO Scientist', 'Algorithmic Trader'],
    'logical reasoning': ['Software Engineer', 'AI/ML Engineer', 'Lawyer', 'Management Consultant', 'IAS Officer', 'Game Developer'],
    'verbal reasoning': ['Content Creator', 'Journalist', 'Lawyer', 'Diplomat (IFS)', 'Professor', 'Podcast Host', 'Screenwriter'],
    'spatial reasoning': ['Architect', 'Game Designer', 'VR/AR Developer', 'Surgeon', 'Aerospace Engineer', '3D Artist', 'Film Director'],
    'pattern recognition': ['Data Scientist', 'Cybersecurity Expert', 'Researcher', 'Cryptographer', 'Music Producer', 'AI Artist'],
    'data interpretation': ['Business Analyst', 'Market Researcher', 'Economist', 'Policy Analyst', 'Statistician', 'Sports Analyst']
  };

  // Get recommended careers based on top strengths
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
- **Performance Trend**: ${results.pathClassification} (${results.pathClassification === 'ascending' ? 'improving throughout test' : results.pathClassification === 'stable' ? 'consistent performance' : 'needs support'})

**COGNITIVE STRENGTHS** (use these for career matching):
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- No standout strengths identified'}

**AREAS FOR GROWTH**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant weak areas'}

**RECOMMENDED CAREER DIRECTIONS** (based on cognitive profile):
${Array.from(recommendedCareers).slice(0, 6).map(c => `- ${c}`).join('\n')}

${isHighAptitude ? `
**⭐ HIGH-APTITUDE STUDENT DETECTED** (Level ${level}, ${Math.round(accuracy)}% accuracy)
MUST include these prestigious career paths:
- Government: IAS, IPS, IFS, IRS Officers (UPSC pathway)
- Defence: Army/Navy/Air Force Officer, DRDO/ISRO Scientist
- Medical: Surgeon, Specialist Doctor (NEET pathway)
- Engineering Elite: IIT Professor, Research Scientist (JEE Advanced pathway)
- Legal: Supreme Court Advocate, Judge (CLAT pathway)
- Finance: Investment Banker, CA, CFA
` : ''}`;

  return { section, isHighAptitude, topStrengths, weakAreas };
}

export function buildMiddleSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';

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

## ⚠️ CRITICAL: ARTISTIC (A) RIASEC CAREER MATCHING ⚠️
**IF the student's RIASEC scores show 'A' (Artistic) in their top 3 types, you MUST include at least ONE career cluster from these categories:**

**MANDATORY for High Artistic (A) Students:**
- Music & Entertainment: Music Producer, Sound Designer, DJ, Singer, Musician, Concert Manager
- Visual Arts: Digital Artist, Animator, Art Director, Fashion Designer, Art Gallery Curator
- Performing Arts: Actor, Dancer, Choreographer, Theatre Director, Voice Actor
- Media & Content: YouTuber, Content Creator, Podcast Host, Film Director, Screenwriter
- Design: Graphic Designer, Game Designer, Interior Designer, Brand Designer

**DO NOT default to only Technology/Science careers for Artistic students!**
**The student's creative interests MUST be reflected in their career recommendations.**

## Strengths & Character Responses (1-4 scale):
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**STRENGTHS SCORING**: These are VIA character strengths (Curiosity, Perseverance, Kindness, Creativity, Leadership, Love of Learning, Honesty, Helpfulness, Humor, Self-Discipline).
- Rating 1 = Not like me, 2 = Sometimes, 3 = Mostly me, 4 = Very me
- Identify top 3-4 strengths (ratings 3-4)
- Note any text responses for deeper insight
${adaptiveSection}
## Learning & Work Preferences:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

**LEARNING PREFERENCES**: These reveal HOW the student learns best (visual, hands-on, discussion, etc.) and their work style (alone vs group, leader vs supporter).
- Use this to personalize career recommendations and learning roadmap
- NOT a scored test - just preferences

**CRITICAL INSTRUCTIONS - NO FALLBACK VALUES ALLOWED:**
1. You MUST generate COMPLETE, PERSONALIZED information for EVERY field
2. NEVER use placeholder text like "Career name 1", "Brief description", "Example text"
3. NEVER use generic descriptions - make everything specific to THIS student's results
4. ALL role overviews, descriptions, and evidence MUST be fully generated based on their assessment
5. If you cannot generate complete information, the response is INVALID

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this EXACT structure for MIDDLE SCHOOL (6-8):

{
  "riasec": {
    "topThree": ["R", "I", "A"],
    "scores": { "R": 12, "I": 10, "A": 8, "S": 5, "E": 4, "C": 3 },
    "percentages": { "R": 60, "I": 50, "A": 40, "S": 25, "E": 20, "C": 15 },
    "maxScore": 20,
    "interpretation": "MUST BE PERSONALIZED - explain what THEIR specific interests mean for future careers based on their top RIASEC types"
  },
  "aptitude": {
    "scores": {
      "numerical_reasoning": {"accuracy": 0, "description": "MUST BE PERSONALIZED - Describe their math and number skills based on test results"},
      "logical_reasoning": {"accuracy": 0, "description": "MUST BE PERSONALIZED - Describe their problem-solving ability based on test results"},
      "verbal_reasoning": {"accuracy": 0, "description": "MUST BE PERSONALIZED - Describe their language and word skills based on test results"},
      "spatial_reasoning": {"accuracy": 0, "description": "MUST BE PERSONALIZED - Describe their visual thinking based on test results"},
      "pattern_recognition": {"accuracy": 0, "description": "MUST BE PERSONALIZED - Describe their pattern-finding ability based on test results"}
    },
    "topStrengths": ["MUST BE REAL STRENGTHS - List 2-3 cognitive strengths from their adaptive test results (e.g., 'Strong numerical reasoning (85%)', 'Excellent pattern recognition (92%)')"],
    "overallScore": 0,
    "cognitiveProfile": "MUST BE PERSONALIZED - Explain how they think and solve problems based on their adaptive test performance",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "characterStrengths": {
    "topStrengths": ["MUST BE REAL STRENGTHS - List their top 3-4 character strengths from assessment (e.g., Curiosity, Creativity, Perseverance, Leadership)"],
    "strengthDescriptions": [
      {"name": "MUST BE REAL STRENGTH NAME", "rating": 4, "description": "MUST BE PERSONALIZED - Explain how this strength shows in their specific responses"},
      {"name": "MUST BE REAL STRENGTH NAME", "rating": 4, "description": "MUST BE PERSONALIZED - Provide evidence from their assessment"}
    ],
    "growthAreas": ["MUST BE REAL AREAS - List 1-2 areas they rated lower that could be developed"]
  },
  "learningStyle": {
    "preferredMethods": ["MUST BE SPECIFIC - List how they learn best based on their responses (visual, hands-on, discussion, reading, etc.)"],
    "workPreference": "MUST BE SPECIFIC - Solo / With partner / In groups (based on their responses)",
    "teamRole": "MUST BE SPECIFIC - Their natural role in group work based on assessment",
    "problemSolvingApproach": "MUST BE SPECIFIC - How they handle challenges based on their responses"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "How they work and learn best based on their character traits"
  },
  "workValues": {
    "topThree": [
      {"value": "MUST BE REAL VALUE - Inferred from their interests and strengths (e.g., Helping Others, Creativity, Learning, Independence)", "score": 4.0},
      {"value": "MUST BE REAL VALUE - Second value based on their profile", "score": 3.5},
      {"value": "MUST BE REAL VALUE - Third value based on their profile", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["MUST BE REAL SKILLS - List 2-3 soft skills they're showing from character strengths and learning preferences"],
    "improvementAreas": ["MUST BE REAL AREAS - List 1-2 areas to grow, phrased positively"]
  },
  "knowledge": { "score": 0, "correctCount": 0, "totalQuestions": 0 },
  "careerFit": {
    "clusters": [
      {
        "title": "MUST BE SPECIFIC - Name the actual career area based on their RIASEC top 3 (e.g., 'Music & Entertainment', 'Healthcare & Medicine', 'Technology & Engineering')",
        "matchScore": 85,
        "fit": "High",
        "description": "MUST BE PERSONALIZED - Write 2-3 sentences explaining WHY this specific career area matches THEIR interests AND adaptive aptitude results. Reference their actual RIASEC scores and cognitive strengths.",
        "examples": ["MUST BE REAL JOBS - List 4-5 actual, specific job titles in this career area that a middle schooler can understand (NOT 'Job 1', 'Job 2')"],
        "whatYoullDo": "MUST BE DESCRIPTIVE - Explain what people actually DO in this career area day-to-day (NOT generic text)",
        "whyItFits": "MUST CONNECT TO THEIR DATA - Explain how their specific RIASEC interests, adaptive aptitude strengths, and character traits make this a good fit",
        "evidence": {
          "interest": "MUST REFERENCE THEIR RIASEC - Explain which of their RIASEC types (R/I/A/S/E/C) and scores support this career path",
          "aptitude": "MUST REFERENCE THEIR COGNITIVE STRENGTHS - Explain which adaptive test strengths (numerical/logical/verbal/spatial/pattern recognition) from their results make them suited for this",
          "personality": "MUST REFERENCE THEIR CHARACTER - Explain which of their character strengths from the assessment align with success in this field"
        },
        "roles": {
          "entry": ["MUST BE REAL ENTRY JOBS - List 3-4 actual jobs they could do right after school or basic training (e.g., 'Camp Counselor', 'Junior Graphic Designer', 'Coding Tutor')"],
          "mid": ["MUST BE REAL CAREER JOBS - List 3-4 actual jobs they could work towards with more experience (e.g., 'Art Teacher', 'Game Developer', 'UX Designer')"]
        },
        "domains": ["MUST BE REAL DOMAINS - List related career areas and industries (e.g., 'Design', 'Technology', 'Education', 'Entertainment')"]
      },
      {
        "title": "MUST BE SPECIFIC - Name the second career area based on their profile",
        "matchScore": 75,
        "fit": "Medium",
        "description": "MUST BE PERSONALIZED - Explain how THEIR specific assessment results AND adaptive aptitude connect to this career path",
        "examples": ["MUST BE REAL JOBS - List 3-4 actual, specific job titles"],
        "whatYoullDo": "MUST BE DESCRIPTIVE - Explain what work in this area actually looks like",
        "whyItFits": "MUST CONNECT TO THEIR DATA - Explain how their interests and cognitive strengths apply to this area",
        "evidence": {
          "interest": "MUST REFERENCE THEIR RIASEC - Explain their interest alignment with specific scores",
          "aptitude": "MUST REFERENCE THEIR COGNITIVE STRENGTHS - Explain relevant cognitive strengths from their adaptive test",
          "personality": "MUST REFERENCE THEIR CHARACTER - Explain their personality fit with specific traits"
        },
        "roles": {
          "entry": ["MUST BE REAL ENTRY JOBS - List 2-3 actual entry-level jobs"],
          "mid": ["MUST BE REAL CAREER JOBS - List 2-3 actual career-level jobs"]
        },
        "domains": ["MUST BE REAL DOMAINS - List related fields and industries"]
      },
      {
        "title": "MUST BE SPECIFIC - Name the third career area to explore",
        "matchScore": 65,
        "fit": "Explore",
        "description": "MUST BE PERSONALIZED - Explain why this could be interesting to explore based on THEIR specific results",
        "examples": ["MUST BE REAL JOBS - List 3-4 actual jobs to consider"],
        "whatYoullDo": "MUST BE DESCRIPTIVE - Give a real overview of work in this area",
        "whyItFits": "MUST CONNECT TO THEIR DATA - Explain potential connections to their interests and strengths",
        "evidence": {
          "interest": "MUST REFERENCE THEIR RIASEC - Explain interest connections with their scores",
          "aptitude": "MUST REFERENCE THEIR COGNITIVE STRENGTHS - Explain transferable strengths from their test",
          "personality": "MUST REFERENCE THEIR CHARACTER - Explain personality considerations from their assessment"
        },
        "roles": {
          "entry": ["MUST BE REAL ENTRY JOBS - List 2-3 actual starter jobs"],
          "mid": ["MUST BE REAL CAREER JOBS - List 2-3 actual growth opportunities"]
        },
        "domains": ["MUST BE REAL DOMAINS - List related career areas"]
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "MUST BE REAL JOB TITLE - Specific career from cluster 1", "salary": {"min": 3, "max": 6}},
        {"name": "MUST BE REAL JOB TITLE - Another specific career from cluster 1", "salary": {"min": 3, "max": 6}},
        {"name": "MUST BE REAL JOB TITLE - Third specific career from cluster 1", "salary": {"min": 3, "max": 6}}
      ],
      "mediumFit": [
        {"name": "MUST BE REAL JOB TITLE - Specific career from cluster 2", "salary": {"min": 3, "max": 5}},
        {"name": "MUST BE REAL JOB TITLE - Another specific career from cluster 2", "salary": {"min": 3, "max": 5}}
      ],
      "exploreLater": [
        {"name": "MUST BE REAL JOB TITLE - Specific career from cluster 3", "salary": {"min": 2, "max": 5}},
        {"name": "MUST BE REAL JOB TITLE - Another specific career from cluster 3", "salary": {"min": 2, "max": 5}}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "MUST BE REAL SKILL - Name a key foundational skill they need", "reason": "MUST BE PERSONALIZED - Write 2-3 sentences explaining WHY this specific skill matters for THEIR career interests", "targetLevel": "Beginner", "currentLevel": "Starting"},
      {"skill": "MUST BE REAL SKILL - Name another key skill", "reason": "MUST BE PERSONALIZED - Explain how developing this skill supports THEIR specific goals", "targetLevel": "Beginner", "currentLevel": "Starting"}
    ],
    "priorityB": [
      {"skill": "MUST BE REAL SKILL - Name an additional skill to explore", "reason": "MUST BE PERSONALIZED - Explain why this skill is valuable for THEIR profile", "targetLevel": "Beginner"}
    ],
    "currentStrengths": ["MUST BE REAL STRENGTHS - List 2-3 skills they're already showing based on assessment"],
    "recommendedTrack": "MUST BE SPECIFIC - Name a clear learning path based on their interests (e.g., 'Creative Exploration', 'STEM Discovery', 'People & Communication', 'Business & Leadership')"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Discover & Explore",
        "goals": ["MUST BE SPECIFIC - List concrete goals like 'Learn about 3 different careers', 'Try 2 new activities'"],
        "activities": ["MUST BE ACTIONABLE - List 2-3 specific things they can actually do"],
        "outcome": "MUST BE CLEAR - Describe what they'll achieve by end of phase"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Learn & Practice",
        "goals": ["MUST BE SPECIFIC - List concrete goals like 'Build 2 basic skills', 'Join 1 club'"],
        "activities": ["MUST BE ACTIONABLE - List 2-3 specific activities they can do"],
        "outcome": "MUST BE CLEAR - Describe skills they'll gain"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Create & Share",
        "goals": ["MUST BE SPECIFIC - List concrete goals like 'Complete 1 project', 'Share work with 5 people'"],
        "activities": ["MUST BE ACTIONABLE - List 2-3 hands-on projects they can do"],
        "outcome": "MUST BE CLEAR - Describe what they'll create"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "Grow & Reflect",
        "goals": ["MUST BE SPECIFIC - List concrete goals like 'Review progress', 'Set 3 new goals'"],
        "activities": ["MUST BE ACTIONABLE - List 2-3 reflection activities"],
        "outcome": "MUST BE CLEAR - Describe their path forward"
      }
    },
    "projects": [
      {
        "title": "MUST BE SPECIFIC - Name a beginner-friendly project related to their interests",
        "description": "MUST BE EXCITING - Describe what they'll do in 2-3 sentences, make it doable and exciting for a middle schooler",
        "skills": ["MUST BE REAL SKILLS - List skills they'll learn from this project"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "MUST BE CLEAR - Explain why this project matters for their development",
        "output": "MUST BE SPECIFIC - Describe what they'll have when done",
        "steps": ["MUST BE ACTIONABLE - Step 1: Specific action to start", "MUST BE ACTIONABLE - Step 2: Next specific action", "MUST BE ACTIONABLE - Step 3: Final action"]
      },
      {
        "title": "MUST BE SPECIFIC - Name another age-appropriate project",
        "description": "MUST BE EXCITING - Describe another engaging activity",
        "skills": ["MUST BE REAL SKILLS - List skills to build"],
        "timeline": "2-3 months",
        "difficulty": "Beginner",
        "purpose": "MUST BE CLEAR - Explain the learning goal",
        "output": "MUST BE SPECIFIC - Describe the final product",
        "steps": ["MUST BE ACTIONABLE - 3-4 simple, specific steps"]
      },
      {
        "title": "MUST BE SPECIFIC - Name a third exploration project",
        "description": "MUST BE EXCITING - Describe the third project",
        "skills": ["MUST BE REAL SKILLS - List more skills"],
        "timeline": "3-4 months",
        "difficulty": "Beginner",
        "purpose": "MUST BE CLEAR - Explain why it's valuable",
        "output": "MUST BE SPECIFIC - Describe what they'll create",
        "steps": ["MUST BE ACTIONABLE - Clear, specific action steps"]
      }
    ],
    "internship": {
      "types": ["MUST BE SPECIFIC - List actual opportunities like 'Shadow a graphic designer', 'Join coding club', 'Volunteer at animal shelter'"],
      "timing": "MUST BE SPECIFIC - Explain when to pursue these (e.g., 'Summer break for camps', 'School year for clubs')",
      "preparation": {
        "resume": "MUST BE AGE-APPROPRIATE - Advice for middle schoolers (e.g., 'Not needed yet - focus on exploring')",
        "portfolio": "MUST BE ACTIONABLE - Specific advice (e.g., 'Keep a journal of what you try and learn')",
        "interview": "MUST BE PRACTICAL - Real advice (e.g., 'Practice talking about what interests you and why')"
      }
    },
    "exposure": {
      "activities": ["MUST BE SPECIFIC - List actual clubs, field trips, events they can attend"],
      "certifications": ["MUST BE REAL - List age-appropriate certificates (e.g., 'Typing.com Certificate', 'Khan Academy Badges', 'Scratch Programming Certificate')"],
      "resources": ["MUST BE SPECIFIC - List actual books, websites, videos they can use"]
    }
  },
  "finalNote": {
    "advantage": "MUST BE PERSONALIZED - Describe their standout strength or characteristic based on THEIR assessment",
    "growthFocus": "MUST BE ACTIONABLE - Provide one clear, encouraging next step specific to THEIR profile"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "MUST BE PERSONALIZED - Describe what they enjoy based on their RIASEC top types",
      "strength": "MUST BE PERSONALIZED - Describe their character strengths from their assessment",
      "workStyle": "MUST BE PERSONALIZED - Describe how they work and learn best from their personality traits",
      "motivation": "MUST BE PERSONALIZED - Describe what motivates them from their work values"
    },
    "aptitudeStrengths": [
      {"name": "MUST BE REAL STRENGTH - Name a character strength (e.g., Curiosity, Creativity, Perseverance)", "description": "MUST BE PERSONALIZED - Explain how this shows up in THEIR responses"},
      {"name": "MUST BE REAL STRENGTH - Name another character strength", "description": "MUST BE PERSONALIZED - Provide evidence from THEIR assessment"}
    ],
    "interestHighlights": ["MUST BE SPECIFIC - List their top 2-3 interest areas from THEIR RIASEC results"],
    "personalityInsights": ["MUST BE PERSONALIZED - List 2-3 key personality traits from THEIR assessment that impact career fit"]
  },
  "overallSummary": "MUST BE PERSONALIZED - Write 3-4 sentences that: 1) Affirm THEIR specific interests, 2) Celebrate THEIR unique strengths, 3) Paint an exciting picture of THEIR possible futures, 4) Encourage continued exploration"
}

**JOB ROLE GUIDELINES FOR MIDDLE SCHOOL (Gen Z & Gen Alpha Focus):**

**FUTURISTIC & EMERGING CAREERS (Prioritize these):**
- AI/ML Engineer, Prompt Engineer, AI Ethics Officer, Robotics Designer
- Metaverse Architect, VR/AR Experience Designer, Digital Twin Engineer
- Space Tourism Guide, Asteroid Mining Engineer, Mars Colony Planner
- Drone Pilot, Autonomous Vehicle Designer, Flying Car Engineer
- Biotechnology Scientist, Gene Therapist, Biohacker, Longevity Researcher
- Climate Tech Innovator, Renewable Energy Engineer, Carbon Capture Specialist
- Blockchain Developer, Cryptocurrency Analyst, NFT Artist, Web3 Developer
- Esports Athlete, Gaming Streamer, Content Creator, Influencer Marketing Manager
- Cybersecurity Specialist, Ethical Hacker, Digital Forensics Expert
- Quantum Computing Researcher, Nanotechnology Engineer

**HIGH-PAYING TRADITIONAL CAREERS (For studious/high-aptitude students):**
- Government Services: IAS Officer, IPS Officer, IFS Diplomat, IRS Officer, State Civil Services
- Defence: Army/Navy/Air Force Officer, Defence Scientist (DRDO), Intelligence Officer (RAW/IB)
- Judiciary: Judge, Public Prosecutor, Legal Advisor, Supreme Court Advocate
- Medical: Surgeon, Cardiologist, Neurologist, Oncologist, Medical Researcher
- Engineering Elite: IIT Professor, ISRO Scientist, Nuclear Engineer, Aerospace Engineer
- Finance Elite: Investment Banker, Hedge Fund Manager, Chartered Accountant, Actuary
- Research: PhD Researcher, University Professor, Think Tank Analyst, Policy Advisor

**🎨 CREATIVE + SOCIAL CAREERS (For students high in Artistic 'A' + Social 'S' RIASEC):**
MUSIC & ENTERTAINMENT INDUSTRY:
- Music Producer, Sound Designer, Audio Engineer, DJ/Electronic Music Artist
- Spotify/Apple Music Curator, Music Licensing Manager, Concert Tour Manager
- Film Score Composer, Jingle Writer, Podcast Sound Designer
- K-Pop/Bollywood Choreographer, Music Video Director, Live Event Producer
- AI Music Creator, Virtual Concert Designer, Hologram Performance Director

ART & VISUAL MEDIA:
- Art Gallery Curator, Museum Experience Designer, Art Auction Specialist
- Digital Artist, NFT Creator, AI Art Director, Generative Art Designer
- Animation Director, Pixar/DreamWorks Animator, Anime Creator
- Fashion Designer, Costume Designer for Films, Sustainable Fashion Innovator
- Art Therapist, Creative Director, Brand Visual Strategist

ENTERTAINMENT & MEDIA:
- Film Director, Cinematographer, Documentary Filmmaker, OTT Content Creator
- YouTuber, Instagram Creator, TikTok Influencer, Podcast Host
- Screenwriter, Dialogue Writer, Story Artist, Narrative Designer for Games
- Talent Manager, Celebrity Stylist, Entertainment Lawyer
- Virtual Influencer Creator, Metaverse Event Planner, Digital Experience Designer

SOCIAL + CREATIVE HYBRID:
- Community Manager for Gaming/Music Brands, Fan Experience Designer
- Social Media Strategist for Artists, Influencer Marketing Director
- Event Designer, Wedding Planner, Festival Curator
- Creative Therapist, Drama Therapist, Music Therapist
- Cultural Ambassador, Arts Education Director, Creative Writing Coach

**CREATIVE & SOCIAL IMPACT CAREERS:**
- Sustainable Fashion Designer, Eco-Architect, Green Building Consultant
- Mental Health Tech Developer, Wellness App Creator, Digital Therapist
- Social Entrepreneur, Impact Investor, NGO Director, UN Officer
- Documentary Filmmaker, Podcast Producer, Digital Journalist

**GUIDELINES:**
- Suggest FUTURISTIC roles that will exist/grow in 2030-2040 (when they enter workforce)
- For HIGH APTITUDE students (level 4-5): Include competitive exam pathways (UPSC, JEE, NEET, CLAT, CAT)
- For CREATIVE + SOCIAL students (high A + S in RIASEC): Prioritize Music, Entertainment, Art Gallery, Media careers
- Include DIVERSE options across: Tech, Creative, Government, Defence, Healthcare, Business, Research, Entertainment
- Use EXCITING job titles that Gen Z/Alpha relate to
- PERSONALIZE based on their RIASEC interests AND adaptive aptitude results
- Salary ranges should reflect 2030+ projections (higher for emerging tech and entertainment roles)
- For studious students: Emphasize careers requiring dedication, discipline, and long-term preparation

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!

**⚠️ VALIDATION CHECKLIST - YOUR RESPONSE WILL BE REJECTED IF:**
1. Any field contains placeholder text like "Career name", "Brief description", "Example", "Job 1", etc.
2. Any "title" field is generic like "Broad career area #1" instead of specific like "Music & Entertainment"
3. Any "description" field is less than 2 complete sentences or doesn't reference their specific RIASEC/aptitude scores
4. Any "evidence" fields don't reference their actual assessment data (RIASEC scores, cognitive strengths, character traits)
5. Any "examples" or "roles" arrays contain generic job titles instead of real, specific careers
6. Any "whatYoullDo" or "whyItFits" fields are generic instead of personalized to their profile
7. The "specificOptions" contains "Career name 1" instead of actual job titles

**BEFORE RETURNING YOUR RESPONSE:**
- Verify EVERY career cluster has a specific, descriptive title (NOT "Broad career area #1")
- Verify EVERY description references their actual RIASEC scores and adaptive aptitude results
- Verify EVERY job title in examples/roles is a real, specific career (NOT "Career name 1")
- Verify ALL evidence fields reference their actual assessment data
- If ANY field contains placeholder text, REGENERATE that field with real, personalized content

**⚠️ FINAL CHECK - ARTISTIC CAREER REQUIREMENT:**
Before returning your response, verify:
1. What is the student's 'A' (Artistic) RIASEC score?
2. Is 'A' in their top 3 RIASEC types?
3. If YES → At least ONE career cluster MUST be from Music/Art/Entertainment/Design/Media
4. If you only suggest Tech/Science/Business careers for an Artistic student, YOUR RESPONSE IS WRONG!`;
}
