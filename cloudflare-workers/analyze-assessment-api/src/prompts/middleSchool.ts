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

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this EXACT structure for MIDDLE SCHOOL (6-8):

{
  "riasec": {
    "topThree": ["R", "I", "A"],
    "scores": { "R": 12, "I": 10, "A": 8, "S": 5, "E": 4, "C": 3 },
    "percentages": { "R": 60, "I": 50, "A": 40, "S": 25, "E": 20, "C": 15 },
    "maxScore": 20,
    "interpretation": "Brief, encouraging explanation of what their interests mean for future careers"
  },
  "aptitude": {
    "scores": {
      "numerical_reasoning": {"accuracy": 0, "description": "Math and number skills"},
      "logical_reasoning": {"accuracy": 0, "description": "Problem-solving ability"},
      "verbal_reasoning": {"accuracy": 0, "description": "Language and word skills"},
      "spatial_reasoning": {"accuracy": 0, "description": "Visual thinking"},
      "pattern_recognition": {"accuracy": 0, "description": "Finding patterns"}
    },
    "topStrengths": ["2-3 strengths from adaptive test results above"],
    "overallScore": 0,
    "cognitiveProfile": "How they think and solve problems based on adaptive test",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "characterStrengths": {
    "topStrengths": ["Top 3-4 character strengths from Strengths & Character section (e.g., Curiosity, Creativity, Perseverance)"],
    "strengthDescriptions": [
      {"name": "Strength 1", "rating": 4, "description": "How this shows in their responses"},
      {"name": "Strength 2", "rating": 4, "description": "Evidence from assessment"}
    ],
    "growthAreas": ["1-2 areas they rated lower that could be developed"]
  },
  "learningStyle": {
    "preferredMethods": ["How they learn best (visual, hands-on, discussion, etc.)"],
    "workPreference": "Solo / With partner / In groups",
    "teamRole": "Their natural role in group work",
    "problemSolvingApproach": "How they handle challenges"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "How they work and learn best based on their character traits"
  },
  "workValues": {
    "topThree": [
      {"value": "Inferred from interests and strengths (e.g., Helping Others, Creativity, Learning)", "score": 4.0},
      {"value": "Second value", "score": 3.5},
      {"value": "Third value", "score": 3.0}
    ]
  },
  "employability": {
    "strengthAreas": ["2-3 soft skills they're showing (from character strengths and learning preferences)"],
    "improvementAreas": ["1-2 areas to grow (phrase positively)"]
  },
  "knowledge": { "score": 0, "correctCount": 0, "totalQuestions": 0 },
  "careerFit": {
    "clusters": [
      {
        "title": "Broad career area #1 (e.g., Creative Arts & Design, Science & Technology, Helping People)",
        "matchScore": 85,
        "fit": "High",
        "description": "2-3 sentences explaining WHY this career area matches their interests AND aptitude test results. Make it personal and specific.",
        "examples": ["4-5 specific jobs in this area they can understand"],
        "whatYoullDo": "Brief description of typical activities in this career area",
        "whyItFits": "Connects to their RIASEC interests, adaptive aptitude strengths, and character traits",
        "evidence": {
          "interest": "How their RIASEC scores support this path",
          "aptitude": "Which adaptive test strengths (numerical, logical, verbal, spatial, pattern) make them a good fit",
          "personality": "Character strengths that align with success in this field"
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
        "description": "Specific explanation of how their assessment AND adaptive aptitude connects to this career path",
        "examples": ["3-4 specific jobs"],
        "whatYoullDo": "What work in this area looks like",
        "whyItFits": "How their interests and cognitive strengths apply here",
        "evidence": {
          "interest": "Interest alignment",
          "aptitude": "Relevant cognitive strengths from adaptive test",
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

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!`;
}
