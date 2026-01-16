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

{
  "riasec": {
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for stream selection and career paths"
  },
  "aptitude": {
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
    "overallScore": 0,
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

**JOB ROLE GUIDELINES FOR HIGH SCHOOL (Gen Z Focus - 2030+ Workforce):**

**FUTURISTIC & EMERGING CAREERS (Prioritize these):**
- AI/ML Engineer, Prompt Engineer, AI Ethics Officer, Robotics Engineer, Computer Vision Specialist
- Metaverse Developer, VR/AR Designer, Digital Twin Engineer, Extended Reality Architect
- Space Tech: Satellite Engineer, Space Tourism Manager, Asteroid Mining Specialist, Mars Habitat Designer
- Autonomous Systems: Self-Driving Car Engineer, Drone Fleet Manager, Smart City Planner
- Biotech: Gene Therapy Researcher, Synthetic Biologist, Longevity Scientist, Personalized Medicine Specialist
- Climate Tech: Carbon Capture Engineer, Renewable Energy Consultant, Sustainability Analyst
- Web3/Blockchain: Smart Contract Developer, DeFi Analyst, Tokenomics Designer
- Cybersecurity: Ethical Hacker, Security Architect, Digital Forensics Expert, Zero Trust Specialist
- Quantum Computing: Quantum Software Developer, Quantum Cryptographer
- Creator Economy: Professional Content Creator, Influencer Marketing Director, Community Manager

**HIGH-PAYING TRADITIONAL CAREERS (For studious/high-aptitude students):**
- Government Services: IAS Officer (₹56K-2.5L/month + perks), IPS Officer, IFS Diplomat, IRS Officer
- Defence: Army/Navy/Air Force Officer, DRDO Scientist, ISRO Scientist, Intelligence Officer (RAW/IB)
- Judiciary: High Court Judge, Supreme Court Advocate, Corporate Lawyer, Legal Counsel
- Medical Elite: Surgeon (₹15-50L/year), Cardiologist, Neurologist, Oncologist, Medical Researcher
- Engineering Elite: IIT Professor, Senior Scientist, Nuclear Engineer, Aerospace Engineer at HAL/ISRO
- Finance Elite: Investment Banker (₹20-80L/year), Hedge Fund Manager, Chartered Accountant, Actuary
- Management: IIM Graduate roles, Management Consultant (McKinsey/BCG), Strategy Director
- Research: PhD at top universities, Research Fellow, Think Tank Analyst, Policy Advisor

**🎨 CREATIVE + SOCIAL CAREERS (For students high in Artistic 'A' + Social 'S' RIASEC):**

MUSIC & ENTERTAINMENT INDUSTRY:
- Music Producer (₹5-50L/year), Sound Designer, Audio Engineer, DJ/Electronic Music Artist
- Spotify/Apple Music Curator, Music Licensing Manager, Concert Tour Manager, Artist Manager
- Film Score Composer, Jingle Writer for Ads, Podcast Sound Designer, Foley Artist
- K-Pop/Bollywood Choreographer, Music Video Director, Live Event Producer
- AI Music Creator, Virtual Concert Designer, Hologram Performance Director
- Music Therapist, Sound Healing Practitioner, Music Education Director

ART & VISUAL MEDIA:
- Art Gallery Curator (₹4-15L/year), Museum Experience Designer, Art Auction Specialist (Christie's/Sotheby's)
- Digital Artist, NFT Creator, AI Art Director, Generative Art Designer
- Animation Director (₹8-40L/year), Pixar/DreamWorks Animator, Anime Creator, VFX Supervisor
- Fashion Designer (₹5-30L/year), Costume Designer for Films, Sustainable Fashion Innovator
- Art Therapist, Creative Director at Ad Agencies, Brand Visual Strategist
- Art Restoration Specialist, Cultural Heritage Consultant, Art Investment Advisor

ENTERTAINMENT & MEDIA:
- Film Director, Cinematographer (₹10-80L/year), Documentary Filmmaker, OTT Content Creator
- YouTuber (₹2L-2Cr/year), Instagram Creator, TikTok Influencer, Podcast Host
- Screenwriter (₹5-50L/year), Dialogue Writer, Story Artist, Narrative Designer for Games
- Talent Manager, Celebrity Stylist, Entertainment Lawyer, Casting Director
- Virtual Influencer Creator, Metaverse Event Planner, Digital Experience Designer
- Film Critic, Entertainment Journalist, Red Carpet Correspondent

SOCIAL + CREATIVE HYBRID:
- Community Manager for Gaming/Music Brands (₹6-20L/year), Fan Experience Designer
- Social Media Strategist for Artists, Influencer Marketing Director
- Event Designer (₹4-25L/year), Destination Wedding Planner, Festival Curator
- Creative Therapist, Drama Therapist, Expressive Arts Therapist
- Cultural Ambassador, Arts Education Director, Creative Writing Coach
- Brand Storyteller, Content Strategist, User Experience Designer

**PROFESSIONAL CAREER PATHS BY STREAM:**

**SCIENCE STREAM (PCM/PCB):**
- Engineering: Software Engineer, AI/ML Engineer, Data Scientist, Robotics Engineer, Aerospace Engineer
- Medical: Doctor (MBBS), Surgeon, Dentist, Pharmacist, Medical Researcher
- Research: ISRO Scientist, DRDO Scientist, Biotechnologist, Quantum Researcher
- Technology: Cloud Architect, Cybersecurity Specialist, Blockchain Developer

**COMMERCE STREAM:**
- Finance: Chartered Accountant, CFA, Investment Banker, Financial Analyst, Actuary
- Business: Management Consultant, Business Analyst, Product Manager, Startup Founder
- Banking: Bank Manager, Credit Analyst, Risk Manager, Fintech Specialist

**ARTS/HUMANITIES STREAM:**
- Law: Corporate Lawyer, Civil Rights Lawyer, Legal Tech Specialist, International Law Expert
- Civil Services: IAS, IFS, IPS through UPSC
- Media: Digital Journalist, Documentary Filmmaker, Podcast Producer, Content Strategist
- Psychology: Clinical Psychologist, UX Researcher, Organizational Psychologist
- Creative Arts: Film Director, Music Producer, Fashion Designer, Art Gallery Curator

**GUIDELINES:**
- Suggest FUTURISTIC roles that will dominate 2030-2040 job market
- For HIGH APTITUDE students (level 4-5): Include competitive exam pathways (UPSC, JEE Advanced, NEET, CLAT, CAT, GATE)
- For CREATIVE + SOCIAL students (high A + S in RIASEC): Prioritize Music, Entertainment, Art, Media careers
- Include DIVERSE options: Tech, Government, Defence, Healthcare, Finance, Research, Creative, Entertainment
- Show EDUCATION PATH for each career (specific degrees, entrance exams, portfolio requirements)
- PERSONALIZE based on RIASEC interests AND adaptive aptitude results
- Salary ranges should reflect 2025-2030 projections in India
- For studious students: Emphasize careers requiring dedication, discipline, and competitive preparation
- For creative students: Emphasize portfolio-building, internships, and industry connections

CRITICAL: You MUST provide exactly 3 career clusters with ALL fields filled including evidence, roles, and domains!

**⚠️ FINAL CHECK - ARTISTIC CAREER REQUIREMENT:**
Before returning your response, verify:
1. What is the student's 'A' (Artistic) RIASEC score?
2. Is 'A' in their top 3 RIASEC types?
3. If YES → At least ONE career cluster MUST be from Music/Art/Entertainment/Design/Media
4. If you only suggest Tech/Science/Business careers for an Artistic student, YOUR RESPONSE IS WRONG!`;
}
