/**
 * After 12th (College-Bound Students) Assessment Prompt Builder
 * 
 * This prompt is specifically for students who have completed 12th grade
 * and are choosing college programs/degrees. It requires evidence from
 * ALL 6 assessment sections for comprehensive career guidance.
 */

import type { AssessmentData } from '../types';

export function buildAfter12Prompt(assessmentData: AssessmentData, answersHash: number): string {
  return `You are an expert career counselor for students who have completed 12th grade and are choosing college programs. Analyze this student's comprehensive 6-section career assessment and provide detailed guidance for their college and career decisions.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 1: CAREER INTERESTS (RIASEC) - 48 Questions
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**CRITICAL RIASEC SCORING INSTRUCTIONS:**
Each question includes a "categoryMapping" field that maps answer options to RIASEC types (R, I, A, S, E, C).
You MUST use this mapping to calculate scores precisely:

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities, mechanical work
- **I (Investigative)**: Science, research, analysis, experiments, problem-solving, learning, discovery
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas, creativity
- **S (Social)**: Helping people, teaching, counseling, healthcare, working with groups, caring
- **E (Enterprising)**: Leading, organizing, persuading, selling, managing, entrepreneurship, influence
- **C (Conventional)**: Organizing, data management, following procedures, detail work, administration

**EXACT SCORING ALGORITHM:**
1. For each question with categoryMapping:
   - If answer is an array (multiselect): For each selected option, look up its RIASEC type and add 2 points
   - If answer is a single string: Look up the RIASEC type and add 2 points
   - If answer is a number 1-5 (rating): Use strengthType or context to determine RIASEC type, then:
     * Response 1-3: 0 points
     * Response 4: 1 point
     * Response 5: 2 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 20 (or highest score if higher)
4. Calculate percentage for each type: (score / maxScore) × 100
5. Identify top 3 types by score

## ⚠️ CRITICAL: ARTISTIC (A) RIASEC CAREER MATCHING ⚠️
**IF the student's RIASEC scores show 'A' (Artistic) in their top 3 types, you MUST include at least ONE career cluster from these categories:**

**MANDATORY for High Artistic (A) Students:**
- **Music & Entertainment**: Music Producer, Sound Designer, Film Score Composer, Concert Manager, Audio Engineer
- **Visual Arts**: Digital Artist, Animator, Art Director, Fashion Designer, NFT Creator, VFX Supervisor
- **Performing Arts**: Actor, Director, Choreographer, Theatre Producer, Voice Actor, Performance Artist
- **Media & Content**: YouTuber, Content Creator, Podcast Host, Film Director, Screenwriter, Documentary Filmmaker
- **Design**: Graphic Designer, UX/UI Designer, Game Designer, Interior Designer, Brand Designer, Product Designer

**DO NOT default to only Technology/Science/Business careers for Artistic students!**
**The student's creative interests MUST be reflected in their career recommendations.**

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 2: PERSONALITY (BIG FIVE) - 30 Questions
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**BIG FIVE SCORING INSTRUCTIONS** (CRITICAL - READ CAREFULLY):

Each BigFive dimension has 6 questions, each rated 1-5.

**YOU MUST CALCULATE THE AVERAGE (MEAN) SCORE FOR EACH DIMENSION:**

1. For each dimension (O, C, E, A, N), identify the 6 questions that belong to it
2. Sum the 6 response values
3. **DIVIDE by 6** to get the average
4. The final score for each dimension MUST be between 1.0 and 5.0

**Example Calculation**:
- Openness questions: [5, 4, 5, 4, 5, 4]
- Sum: 5 + 4 + 5 + 4 + 5 + 4 = 27
- **Average: 27 / 6 = 4.5** ← This is the score to report

**Dimensions**:
- **Openness (O)**: Curiosity, imagination, creativity, willingness to try new things
- **Conscientiousness (C)**: Organization, discipline, reliability, goal-orientation, planning
- **Extraversion (E)**: Sociability, energy, assertiveness, enthusiasm, outgoing nature
- **Agreeableness (A)**: Cooperation, empathy, kindness, trust, helpfulness
- **Neuroticism (N)**: Emotional stability, stress management, anxiety levels (lower is better)

**VALIDATION**: After calculating, verify each score is between 1.0 and 5.0. If any score is > 5.0, you made an error - you summed instead of averaged!

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 3: WORK VALUES & MOTIVATORS - 24 Questions
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

**WORK VALUES SCORING INSTRUCTIONS** (CRITICAL - READ CAREFULLY):

Each Work Value dimension has 3 questions, each rated 1-5.

**YOU MUST CALCULATE THE AVERAGE (MEAN) SCORE FOR EACH DIMENSION:**

1. For each dimension, identify the 3 questions that belong to it
2. Sum the 3 response values
3. **DIVIDE by 3** to get the average
4. The final score for each dimension MUST be between 1.0 and 5.0

**Example Calculation**:
- Impact questions: [5, 4, 5]
- Sum: 5 + 4 + 5 = 14
- **Average: 14 / 3 = 4.67** ← This is the score to report

**Dimensions**:
- **Impact**: Making a difference, helping others, social contribution
- **Status**: Recognition, prestige, respect, visibility, influence
- **Autonomy**: Independence, freedom, self-direction, flexibility
- **Security**: Stability, job security, predictability, safety
- **Financial**: Salary, benefits, financial rewards, wealth
- **Lifestyle**: Work-life balance, location, flexibility, comfort
- **Creativity**: Innovation, originality, artistic expression, new ideas
- **Leadership**: Managing others, authority, decision-making, influence

**VALIDATION**: After calculating, verify each score is between 1.0 and 5.0. If any score is > 5.0, you made an error - you summed instead of averaged!

Identify top 3 work values based on highest average scores.

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 4: EMPLOYABILITY SKILLS - 31 Questions
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.employabilityAnswers, null, 2)}

**EMPLOYABILITY SCORING**: Assess readiness across key professional skills:
- **Communication**: Written, verbal, presentation, active listening
- **Teamwork**: Collaboration, conflict resolution, leadership, delegation
- **Problem-Solving**: Critical thinking, creativity, analytical skills, decision-making
- **Adaptability**: Flexibility, learning agility, resilience, change management
- **Digital Literacy**: Technology skills, online tools, digital communication
- **Work Ethic**: Reliability, punctuality, professionalism, initiative

Calculate overall employability readiness score (0-100%) and identify strength areas and gaps.

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 5: APTITUDE (MULTI-DOMAIN) - 50 Questions
## ═══════════════════════════════════════════════════════════════════════════

Pre-calculated aptitude scores:
${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**APTITUDE DOMAINS**:
- **Verbal Reasoning**: Language comprehension, vocabulary, analogies, reading comprehension
- **Numerical Ability**: Mathematical reasoning, data interpretation, quantitative analysis
- **Abstract Reasoning**: Pattern recognition, logical sequences, non-verbal problem-solving
- **Spatial Reasoning**: 3D visualization, mental rotation, spatial relationships
- **Clerical Speed & Accuracy**: Attention to detail, data verification, processing speed

Use aptitude scores to validate career fit and identify cognitive strengths.

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 6: STREAM KNOWLEDGE (DOMAIN-SPECIFIC) - 20 Questions
## ═══════════════════════════════════════════════════════════════════════════

Knowledge answers and assessment:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

Total questions: ${assessmentData.totalKnowledgeQuestions}

**KNOWLEDGE ASSESSMENT**: Tests domain-specific knowledge in their chosen stream/field.
- Score >= 70%: Strong foundation, ready for advanced study
- Score 50-69%: Moderate foundation, needs focused preparation
- Score < 50%: Weak foundation, consider foundational courses or alternative paths

Use knowledge score to assess academic readiness and recommend preparation strategies.

## ═══════════════════════════════════════════════════════════════════════════
## COMPREHENSIVE ANALYSIS REQUIREMENTS
## ═══════════════════════════════════════════════════════════════════════════

**YOU MUST USE ALL 6 SECTIONS TO GENERATE CAREER CLUSTERS:**

For each career cluster, you MUST provide evidence from ALL 6 sections:

1. **Interest Evidence** (from RIASEC): Which RIASEC types support this career path?
2. **Aptitude Evidence** (from Aptitude Test): Which cognitive strengths make them suitable?
3. **Personality Evidence** (from Big Five): Which personality traits align with success?
4. **Values Evidence** (from Work Values): Which work values are satisfied?
5. **Employability Evidence** (from Skills): Which professional skills support this path?
6. **Knowledge Evidence** (from Domain Test): How does their domain knowledge support this?

**EXAMPLE EVIDENCE STRUCTURE:**
\`\`\`json
"evidence": {
  "interest": "High I (Investigative 85%) and R (Realistic 70%) indicate strong fit for research and hands-on technical work",
  "aptitude": "Exceptional numerical reasoning (88%) and abstract reasoning (82%) demonstrate strong analytical capabilities required for data science",
  "personality": "High Conscientiousness (4.2) and Openness (4.0) suggest disciplined approach to learning and curiosity for new technologies",
  "values": "Achievement (4.5) and Independence (4.2) align with project-based work and autonomous problem-solving in tech roles",
  "employability": "Strong problem-solving (85%) and digital literacy (90%) provide solid foundation for technical careers",
  "knowledge": "Domain knowledge score of 75% demonstrates solid understanding of core concepts and readiness for advanced study"
}
\`\`\`

## ═══════════════════════════════════════════════════════════════════════════
## OUTPUT FORMAT
## ═══════════════════════════════════════════════════════════════════════════

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this structure:

{
  "riasec": {
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "What their interests mean for college major and career selection"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 10, "percentage": 0},
      "numerical": {"correct": 0, "total": 10, "percentage": 0},
      "abstract": {"correct": 0, "total": 10, "percentage": 0},
      "spatial": {"correct": 0, "total": 10, "percentage": 0},
      "clerical": {"correct": 0, "total": 10, "percentage": 0}
    },
    "topStrengths": ["Top 2-3 cognitive strengths"],
    "overallScore": 0,
    "cognitiveProfile": "How they think and solve problems"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "Their work style and how personality shapes career fit"
  },
  "workValues": {
    "topThree": [
      {"value": "Primary work value", "score": 4.5, "description": "Why this matters to them"},
      {"value": "Second value", "score": 4.0, "description": "How this influences career choice"},
      {"value": "Third value", "score": 3.5, "description": "Impact on job satisfaction"}
    ],
    "interpretation": "How their values should guide career decisions"
  },
  "employability": {
    "scores": {
      "communication": 75,
      "teamwork": 80,
      "problemSolving": 85,
      "adaptability": 70,
      "digitalLiteracy": 90,
      "workEthic": 85
    },
    "overallReadiness": 80,
    "strengthAreas": ["Top 3 professional skills"],
    "developmentAreas": ["2-3 skills to improve"],
    "careerReadiness": "Assessment of their readiness for professional work"
  },
  "knowledge": {
    "score": 75,
    "correctCount": 15,
    "totalQuestions": 20,
    "domainReadiness": "Assessment of their academic preparation in chosen field",
    "recommendations": ["Specific preparation strategies based on score"]
  },
  "careerFit": {
    "clusters": [
      {
        "title": "Career Cluster #1 (e.g., Technology & Software Development)",
        "matchScore": 88,
        "fit": "High",
        "description": "Comprehensive explanation of why this career path fits based on ALL 6 assessment sections",
        "examples": ["6-8 specific career roles with brief descriptions"],
        "educationPath": "Specific college majors, degrees, and programs (e.g., B.Tech CSE, BCA, B.Sc Computer Science)",
        "whatYoullDo": "Day-to-day work and responsibilities in this field",
        "whyItFits": "Detailed connection between their complete profile and this career area",
        "evidence": {
          "interest": "RIASEC evidence - which types and scores support this (MUST INCLUDE)",
          "aptitude": "Cognitive strengths that make them suitable (MUST INCLUDE)",
          "personality": "Big Five traits that align with success (MUST INCLUDE)",
          "values": "Work values satisfied by this career (MUST INCLUDE)",
          "employability": "Professional skills that support this path (MUST INCLUDE)",
          "knowledge": "Domain knowledge readiness for this field (MUST INCLUDE)"
        },
        "roles": {
          "entry": ["5-6 entry-level positions"],
          "mid": ["5-6 mid-career positions"],
          "senior": ["4-5 senior/leadership positions"]
        },
        "domains": ["Related specializations and sub-fields"],
        "salaryRange": {
          "entry": {"min": 4, "max": 8, "currency": "LPA"},
          "mid": {"min": 10, "max": 25, "currency": "LPA"},
          "senior": {"min": 30, "max": 100, "currency": "LPA"}
        },
        "growthOutlook": "Industry growth trends and future opportunities"
      },
      {
        "title": "Career Cluster #2",
        "matchScore": 78,
        "fit": "Medium",
        "description": "Why this is a strong alternative based on their profile",
        "examples": ["5-6 career options"],
        "educationPath": "Relevant degrees and programs",
        "whatYoullDo": "Work overview",
        "whyItFits": "Profile alignment",
        "evidence": {
          "interest": "RIASEC support (REQUIRED)",
          "aptitude": "Cognitive fit (REQUIRED)",
          "personality": "Personality alignment (REQUIRED)",
          "values": "Values match (REQUIRED)",
          "employability": "Skills support (REQUIRED)",
          "knowledge": "Knowledge readiness (REQUIRED)"
        },
        "roles": {
          "entry": ["4-5 entry positions"],
          "mid": ["4-5 mid positions"],
          "senior": ["3-4 senior positions"]
        },
        "domains": ["Related fields"],
        "salaryRange": {
          "entry": {"min": 3, "max": 7, "currency": "LPA"},
          "mid": {"min": 8, "max": 20, "currency": "LPA"},
          "senior": {"min": 25, "max": 80, "currency": "LPA"}
        },
        "growthOutlook": "Career prospects"
      },
      {
        "title": "Career Cluster #3",
        "matchScore": 68,
        "fit": "Explore",
        "description": "Worth exploring as alternative or backup option",
        "examples": ["4-5 careers"],
        "educationPath": "Degree options",
        "whatYoullDo": "Work description",
        "whyItFits": "Potential fit areas",
        "evidence": {
          "interest": "Interest connections (REQUIRED)",
          "aptitude": "Aptitude support (REQUIRED)",
          "personality": "Personality considerations (REQUIRED)",
          "values": "Values alignment (REQUIRED)",
          "employability": "Skills relevance (REQUIRED)",
          "knowledge": "Knowledge gaps/strengths (REQUIRED)"
        },
        "roles": {
          "entry": ["3-4 entry roles"],
          "mid": ["3-4 mid roles"],
          "senior": ["2-3 senior roles"]
        },
        "domains": ["Related areas"],
        "salaryRange": {
          "entry": {"min": 3, "max": 6, "currency": "LPA"},
          "mid": {"min": 7, "max": 18, "currency": "LPA"},
          "senior": {"min": 20, "max": 60, "currency": "LPA"}
        },
        "growthOutlook": "Future potential"
      }
    ],
    "degreePrograms": [
      {
        "programName": "B.Tech Computer Science & Engineering",
        "matchScore": 92,
        "fit": "High",
        "duration": "4 years",
        "roleDescription": "As a Computer Science graduate, you'll design and develop software applications, work on cutting-edge technologies like AI and cloud computing, and solve complex technical problems. You'll have opportunities in software development, data science, cybersecurity, and tech entrepreneurship.",
        "topUniversities": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad", "VIT Vellore", "Manipal Institute of Technology"],
        "alignedWithCluster": "Technology & Innovation",
        "whyThisFitsYou": "Your exceptional logical reasoning (85%) and high Investigative interest (I: 88%) make you perfect for software development. Your strong problem-solving skills (90%) and curiosity for technology align perfectly with CSE's analytical and creative demands.",
        "evidence": {
          "interest": "High I (Investigative 88%) and R (Realistic 75%) indicate strong fit for technical problem-solving",
          "aptitude": "Exceptional numerical (85%) and logical reasoning (88%) demonstrate strong analytical capabilities",
          "personality": "High Conscientiousness (4.3) and Openness (4.1) suggest disciplined learning and curiosity",
          "values": "Achievement (4.5) and Independence (4.2) align with project-based autonomous work",
          "employability": "Strong problem-solving (90%) and digital literacy (95%) provide solid foundation",
          "knowledge": "Domain knowledge score of 78% demonstrates readiness for advanced CS concepts"
        }
      },
      {
        "programName": "BCA (Bachelor of Computer Applications)",
        "matchScore": 85,
        "fit": "Medium",
        "duration": "3 years",
        "roleDescription": "BCA graduates work as software developers, web developers, and IT professionals. You'll build applications, manage databases, and work on software projects. Career opportunities include app development, system administration, and IT consulting with paths to MCA or MBA.",
        "topUniversities": ["Christ University Bangalore", "Symbiosis Pune", "Presidency College Bangalore", "St. Xavier's Mumbai", "Loyola College Chennai", "Amity University", "Chandigarh University"],
        "alignedWithCluster": "Engineering & Research",
        "whyThisFitsYou": "Your strong programming aptitude and practical approach to technology make BCA an excellent alternative. This program offers hands-on software development training that matches your learning style.",
        "evidence": {
          "interest": "Investigative (I: 88%) and Realistic (R: 75%) interests align with applied computing",
          "aptitude": "Strong numerical (82%) and logical (85%) skills support programming and algorithms",
          "personality": "Conscientiousness (4.3) ensures disciplined coding practice and project completion",
          "values": "Independence (4.2) matches the self-directed learning in BCA programs",
          "employability": "Digital literacy (95%) and problem-solving (90%) are core BCA requirements",
          "knowledge": "Domain knowledge (78%) provides strong foundation for application development"
        }
      },
      {
        "programName": "B.Sc Mathematics",
        "matchScore": 78,
        "fit": "Explore",
        "duration": "3 years",
        "roleDescription": "Mathematics graduates pursue careers in data science, actuarial science, quantitative finance, research, and teaching. You'll analyze complex problems, develop mathematical models, and apply statistical methods. This degree opens doors to analytics, banking, insurance, and academic research.",
        "topUniversities": ["St. Stephen's College Delhi", "Loyola College Chennai", "Fergusson College Pune", "Presidency College Kolkata", "Hindu College Delhi", "Madras Christian College", "St. Xavier's Mumbai"],
        "alignedWithCluster": "Healthcare & Life Sciences",
        "whyThisFitsYou": "Your exceptional numerical reasoning (85%) and analytical mindset make mathematics a viable path. This opens doors to data science, actuarial science, and quantitative finance careers.",
        "evidence": {
          "interest": "Investigative (I: 88%) interest aligns with mathematical research and problem-solving",
          "aptitude": "Outstanding numerical reasoning (85%) and logical thinking (88%) are perfect for advanced math",
          "personality": "High Conscientiousness (4.3) supports the rigorous study mathematics demands",
          "values": "Achievement (4.5) drives success in challenging mathematical concepts",
          "employability": "Problem-solving (90%) and analytical skills support mathematical applications",
          "knowledge": "Strong foundation (78%) enables transition to pure mathematics"
        }
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Specific Job Title 1", "salary": {"min": 5, "max": 12}, "description": "Brief role description"},
        {"name": "Specific Job Title 2", "salary": {"min": 5, "max": 12}, "description": "Brief role description"},
        {"name": "Specific Job Title 3", "salary": {"min": 5, "max": 12}, "description": "Brief role description"},
        {"name": "Specific Job Title 4", "salary": {"min": 5, "max": 12}, "description": "Brief role description"}
      ],
      "mediumFit": [
        {"name": "Job Title 1", "salary": {"min": 4, "max": 10}, "description": "Role description"},
        {"name": "Job Title 2", "salary": {"min": 4, "max": 10}, "description": "Role description"},
        {"name": "Job Title 3", "salary": {"min": 4, "max": 10}, "description": "Role description"}
      ],
      "exploreLater": [
        {"name": "Job Title 1", "salary": {"min": 3, "max": 8}, "description": "Role description"},
        {"name": "Job Title 2", "salary": {"min": 3, "max": 8}, "description": "Role description"}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {
        "skill": "Critical Skill #1",
        "currentLevel": "Beginner/Intermediate/Advanced",
        "targetLevel": "Intermediate/Advanced/Expert",
        "reason": "Why this skill is essential for their target careers",
        "howToBuild": "Specific courses, certifications, projects to develop this skill",
        "timeline": "3-6 months"
      },
      {
        "skill": "Critical Skill #2",
        "currentLevel": "Assessment-based level",
        "targetLevel": "Required level",
        "reason": "Impact on career readiness",
        "howToBuild": "Development strategies",
        "timeline": "3-6 months"
      }
    ],
    "priorityB": [
      {
        "skill": "Important Skill",
        "currentLevel": "Current",
        "targetLevel": "Target",
        "reason": "Why it matters",
        "howToBuild": "Development path",
        "timeline": "6-12 months"
      }
    ],
    "currentStrengths": ["4-5 skills they already possess"],
    "recommendedTrack": "Clear skill development roadmap with rationale"
  },
  "roadmap": {
    "immediate": {
      "title": "Next 3 Months - Foundation",
      "goals": ["Specific, measurable goals"],
      "actions": ["Concrete action steps"],
      "milestones": ["Checkpoints to track progress"]
    },
    "shortTerm": {
      "title": "3-6 Months - Skill Building",
      "goals": ["Development goals"],
      "actions": ["Learning activities"],
      "milestones": ["Achievement markers"]
    },
    "mediumTerm": {
      "title": "6-12 Months - Experience & Portfolio",
      "goals": ["Experience goals"],
      "actions": ["Projects and internships"],
      "milestones": ["Portfolio pieces"]
    },
    "longTerm": {
      "title": "1-2 Years - Career Launch",
      "goals": ["Career entry goals"],
      "actions": ["Job search and networking"],
      "milestones": ["Career milestones"]
    },
    "certifications": [
      {
        "name": "Certification Name",
        "provider": "Issuing organization",
        "relevance": "Why it matters for their career",
        "timeline": "When to pursue",
        "cost": "Approximate cost"
      }
    ],
    "projects": [
      {
        "title": "Portfolio Project #1",
        "description": "Detailed project description",
        "skills": ["Skills developed"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "output": "What they'll create",
        "careerRelevance": "How it helps their career goals"
      }
    ]
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy (from RIASEC)",
      "strength": "Their cognitive strengths (from Aptitude)",
      "workStyle": "How they work (from Big Five)",
      "motivation": "What drives them (from Work Values)",
      "readiness": "Professional readiness (from Employability)",
      "preparation": "Academic readiness (from Knowledge)"
    },
    "uniqueStrengths": ["3-4 standout qualities from across all sections"],
    "developmentAreas": ["2-3 areas for growth"],
    "careerPersonality": "Their overall career profile in 2-3 sentences"
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage",
    "focusArea": "One key area to focus on in next 6-12 months",
    "encouragement": "Personalized motivational message"
  },
  "overallSummary": "3-4 sentences synthesizing their complete profile and providing clear direction for college and career decisions"
}

## ═══════════════════════════════════════════════════════════════════════════
## CRITICAL: CAREER CLUSTERS MUST ALIGN WITH STUDENT'S STREAM
## ═══════════════════════════════════════════════════════════════════════════

**IMPORTANT**: The student has already selected their stream during 12th grade. The 3 career clusters MUST align with their chosen stream:

**Student Stream**: ${assessmentData.stream || 'Not specified'}

**Stream-Based Career Cluster Mapping:**

### SCIENCE STREAM (science, science_pcmb, science_pcms, pcmb, pcms, pcm, pcb):
**Cluster 1 (High Fit) - Technology & Innovation:**
- Software Engineer, Data Scientist, AI/ML Engineer, Cybersecurity Analyst
- Product Manager, Tech Entrepreneur, Full Stack Developer
- Salary: Entry ₹6-15L, Mid ₹15-40L, Senior ₹40-100L+

**Cluster 2 (Medium Fit) - Engineering & Research:**
- Mechanical Engineer, Civil Engineer, Aerospace Engineer, Robotics Engineer
- Research Scientist, R&D Engineer, Systems Architect
- Salary: Entry ₹5-12L, Mid ₹12-30L, Senior ₹30-80L

**Cluster 3 (Explore) - Healthcare & Life Sciences:**
- Doctor, Surgeon, Medical Researcher, Pharmacist
- Biotechnologist, Geneticist, Clinical Researcher
- Salary: Entry ₹6-15L, Mid ₹15-50L, Senior ₹50-200L

### COMMERCE STREAM (commerce, commerce_maths, commerce_accounts):
**Cluster 1 (High Fit) - Finance & Accounting:**
- Chartered Accountant, Financial Analyst, Investment Banker
- Portfolio Manager, Risk Analyst, Tax Consultant
- Salary: Entry ₹5-12L, Mid ₹12-35L, Senior ₹35-100L

**Cluster 2 (Medium Fit) - Business & Management:**
- Business Manager, Operations Manager, Strategy Consultant
- Marketing Manager, HR Manager, Product Manager
- Salary: Entry ₹4-10L, Mid ₹10-25L, Senior ₹25-70L

**Cluster 3 (Explore) - Entrepreneurship & Digital Business:**
- Entrepreneur, Startup Founder, Business Consultant
- Digital Marketing Manager, E-commerce Manager, Brand Strategist
- Salary: Entry ₹3-15L, Mid ₹15-50L, Senior ₹50-500L (variable)

### ARTS STREAM (arts, arts_psychology, arts_economics, arts_general, humanities):
**Cluster 1 (High Fit) - Creative & Design:**
- Graphic Designer, UI/UX Designer, Fashion Designer, Interior Designer
- Animator, VFX Artist, Game Designer, Brand Designer
- Salary: Entry ₹4-12L, Mid ₹12-35L, Senior ₹35-100L

**Cluster 2 (Medium Fit) - Media & Communication:**
- Journalist, Content Writer, PR Manager, Social Media Manager
- Film Director, Video Editor, Podcast Host, YouTuber
- Salary: Entry ₹3-10L, Mid ₹10-25L, Senior ₹25-70L

**Cluster 3 (Explore) - Social Sciences & Law:**
- Lawyer, Civil Services Officer, Policy Analyst, Diplomat
- Psychologist, Counselor, Social Worker, NGO Manager
- Salary: Entry ₹4-15L, Mid ₹15-50L, Senior ₹50-200L

**CRITICAL INSTRUCTIONS:**
1. **Identify the student's stream** from the stream field above
2. **Use ONLY the 3 career clusters** that match their stream
3. **Customize each cluster** based on their specific RIASEC, aptitude, and personality scores
4. **Provide evidence from ALL 6 sections** for each cluster
5. **If stream is unclear or invalid**, default to the stream that best matches their RIASEC top 3 types:
   - High I + R → Science
   - High E + C → Commerce
   - High A + S → Arts

## ⚠️ SPECIAL CASE: HIGH ARTISTIC (A) STUDENTS ⚠️
**IF the student has 'A' (Artistic) in their top 3 RIASEC types:**
- **Science stream**: Replace Cluster 3 with "Design & Architecture" (Architecture, Product Design, Industrial Design)
- **Commerce stream**: Replace Cluster 3 with "Creative Business" (Fashion Business, Event Management, Media Production)
- **Arts stream**: Ensure Cluster 1 is creative/artistic (already covered)

## ═══════════════════════════════════════════════════════════════════════════
## DEGREE PROGRAM RECOMMENDATIONS (ALIGNED WITH CAREER CLUSTERS)
## ═══════════════════════════════════════════════════════════════════════════

**CRITICAL**: The 3 degree programs MUST align with the 3 career clusters for the student's stream.

### SCIENCE STREAM - Program Recommendations

**For Cluster 1 (Technology & Innovation) - Select ONE:**
- B.Tech Computer Science & Engineering
- B.Tech Artificial Intelligence & Machine Learning
- B.Tech Data Science & Analytics
- B.Tech Cybersecurity
- BCA (Bachelor of Computer Applications)

**For Cluster 2 (Engineering & Research) - Select ONE:**
- B.Tech Mechanical Engineering
- B.Tech Civil Engineering
- B.Tech Electronics & Communication
- B.Sc Physics
- B.Sc Chemistry
- B.Sc Mathematics

**For Cluster 3 (Healthcare & Life Sciences) - Select ONE:**
- MBBS (Bachelor of Medicine & Surgery)
- BDS (Bachelor of Dental Surgery)
- B.Pharm (Bachelor of Pharmacy)
- B.Sc Biotechnology

**For Cluster 3 (Design & Architecture) - If High Artistic (A) - Select ONE:**
- B.Arch (Bachelor of Architecture)
- BA Design (Graphic/UI/UX)
- BA Interior Design

### COMMERCE STREAM - Program Recommendations

**For Cluster 1 (Finance & Accounting) - Select ONE:**
- BBA Finance & Banking
- B.Com (Bachelor of Commerce)
- B.Com (Honors)
- BBA Insurance & Risk Management

**For Cluster 2 (Business & Management) - Select ONE:**
- BBA (Bachelor of Business Administration)
- BMS (Bachelor of Management Studies)
- BBA International Business
- BBA Human Resource Management
- BBA Supply Chain & Logistics

**For Cluster 3 (Entrepreneurship & Digital Business) - Select ONE:**
- BBA Entrepreneurship
- BBA Digital Marketing
- BBA Retail Management
- BBA Aviation Management

**For Cluster 3 (Creative Business) - If High Artistic (A) - Select ONE:**
- BBA Event Management
- BA Fashion Design
- BA Film Making & Cinematography

### ARTS STREAM - Program Recommendations

**For Cluster 1 (Creative & Design) - Select ONE:**
- BA Design (Graphic/UI/UX)
- BA Fashion Design
- BA Animation & VFX
- BFA (Bachelor of Fine Arts)
- BA Interior Design

**For Cluster 2 (Media & Communication) - Select ONE:**
- BA Journalism & Mass Communication
- BA Film Making & Cinematography
- BA Public Relations & Advertising
- BA English Literature

**For Cluster 3 (Social Sciences & Law) - Select ONE:**
- LLB (Bachelor of Laws)
- BA Psychology
- BA Economics
- BA Political Science
- BA Sociology

**CRITICAL INSTRUCTIONS FOR PROGRAM SELECTION:**
1. **YOU MUST SELECT EXACTLY 3 PROGRAMS** - one for each career cluster
2. **Programs MUST align with career clusters:**
   - Program 1 (High fit) → From Cluster 1 program list
   - Program 2 (Medium fit) → From Cluster 2 program list
   - Program 3 (Explore) → From Cluster 3 program list
3. **Each program MUST include ALL OF THESE REQUIRED FIELDS:**
   - **programName**: Program name (exact match from list above)
   - **matchScore**: Match score (85-95 for High fit, 75-84 for Medium fit, 65-74 for Explore)
   - **fit**: "High", "Medium", or "Explore"
   - **duration**: REQUIRED - Program duration (e.g., "4 years", "3-4 years", "5 years", "5.5 years" - typical duration for that degree in India)
   - **roleDescription**: REQUIRED - 2-3 sentences explaining what graduates typically do in their careers, career opportunities, and work responsibilities
   - **topUniversities**: REQUIRED - Array of 5-7 well-known Indian universities offering this program (e.g., ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy"])
   - **alignedWithCluster**: The career cluster this program aligns with
   - **whyThisFitsYou**: Personalized reasoning (2-3 sentences connecting their assessment results to the program)
   - **evidence**: Object with ALL 6 sections (interest, aptitude, personality, values, employability, knowledge)
4. **Selection criteria within each cluster:**
   - Choose program that best matches student's RIASEC top 3 types
   - Consider aptitude strengths (numerical, logical, verbal, spatial, creative)
   - Consider personality traits (Big Five scores)
   - Consider work values and employability skills
5. **If student has high 'A' (Artistic) in RIASEC top 3:**
   - Use the artistic variant for Cluster 3 (Design & Architecture for Science, Creative Business for Commerce)

**EXAMPLE PROGRAM RECOMMENDATION FORMAT (Aligned with Clusters):**

**Science Stream Example:**
\`\`\`json
{
  "degreePrograms": [
    {
      "programName": "B.Tech Computer Science & Engineering",
      "matchScore": 92,
      "fit": "High",
      "duration": "4 years",
      "roleDescription": "As a Computer Science graduate, you'll design and develop software applications, work on cutting-edge technologies like AI and cloud computing, and solve complex technical problems. You'll have opportunities in software development, data science, cybersecurity, and tech entrepreneurship.",
      "topUniversities": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad", "VIT Vellore", "Manipal Institute of Technology"],
      "alignedWithCluster": "Technology & Innovation",
      "whyThisFitsYou": "Your exceptional logical reasoning (85%) and high Investigative interest (I: 88%) make you perfect for software development. Your strong problem-solving skills (90%) and curiosity for technology align perfectly with CSE's analytical and creative demands.",
      "evidence": {
        "interest": "High I (Investigative 88%) and R (Realistic 75%) indicate strong fit for technical problem-solving",
        "aptitude": "Exceptional numerical (85%) and logical reasoning (88%) demonstrate strong analytical capabilities",
        "personality": "High Conscientiousness (4.3) and Openness (4.1) suggest disciplined learning and curiosity",
        "values": "Achievement (4.5) and Independence (4.2) align with project-based autonomous work",
        "employability": "Strong problem-solving (90%) and digital literacy (95%) provide solid foundation",
        "knowledge": "Domain knowledge score of 78% demonstrates readiness for advanced CS concepts"
      }
    },
    {
      "programName": "B.Tech Mechanical Engineering",
      "matchScore": 85,
      "fit": "Medium",
      "duration": "4 years",
      "roleDescription": "Mechanical engineers design, develop, and test mechanical systems and devices. You'll work on projects ranging from automotive design to robotics, renewable energy systems, and manufacturing processes. Career paths include product design, R&D, automotive engineering, and aerospace.",
      "topUniversities": ["IIT Madras", "IIT Kharagpur", "NIT Surathkal", "BITS Pilani", "Anna University", "PSG College of Technology", "Jadavpur University"],
      "alignedWithCluster": "Engineering & Research",
      "whyThisFitsYou": "Your strong Realistic interest (R: 75%) and spatial reasoning (82%) make mechanical engineering a natural fit. Your hands-on approach and analytical mindset support complex engineering challenges.",
      "evidence": {
        "interest": "High R (Realistic 75%) and I (Investigative 88%) align with engineering problem-solving",
        "aptitude": "Strong spatial reasoning (82%) and numerical skills (85%) support mechanical design",
        "personality": "High Conscientiousness (4.3) ensures disciplined approach to engineering projects",
        "values": "Achievement (4.5) drives success in challenging engineering work",
        "employability": "Problem-solving (90%) and technical skills support engineering careers",
        "knowledge": "Strong foundation (78%) enables transition to engineering studies"
      }
    },
    {
      "programName": "MBBS (Bachelor of Medicine & Surgery)",
      "matchScore": 78,
      "fit": "Explore",
      "duration": "5.5 years",
      "roleDescription": "As a medical doctor, you'll diagnose and treat patients, conduct medical research, and contribute to public health. You'll specialize in areas like surgery, pediatrics, cardiology, or pursue research in medical sciences. The career combines scientific knowledge with compassionate patient care.",
      "topUniversities": ["AIIMS Delhi", "CMC Vellore", "JIPMER Puducherry", "KGMU Lucknow", "Maulana Azad Medical College", "Grant Medical College Mumbai", "Madras Medical College"],
      "alignedWithCluster": "Healthcare & Life Sciences",
      "whyThisFitsYou": "Your Investigative interest (I: 88%) and Social aptitude (S: 70%) open doors to medical careers. Your empathy and scientific curiosity support patient care and medical research.",
      "evidence": {
        "interest": "High I (Investigative 88%) and moderate S (Social 70%) align with medical science",
        "aptitude": "Strong logical reasoning (88%) and verbal skills (75%) support medical studies",
        "personality": "High Conscientiousness (4.3) and Agreeableness (4.0) suit medical profession",
        "values": "Achievement (4.5) and helping others drive medical career success",
        "employability": "Communication (85%) and problem-solving (90%) are essential for doctors",
        "knowledge": "Biology knowledge (78%) provides foundation for medical studies"
      }
    }
  ]
}
\`\`\`

**Commerce Stream Example:**
\`\`\`json
{
  "degreePrograms": [
    {
      "programName": "BBA Finance & Banking",
      "matchScore": 90,
      "fit": "High",
      "duration": "3 years",
      "roleDescription": "Finance graduates work in investment banking, financial analysis, portfolio management, and corporate finance. You'll analyze market trends, manage investments, assess financial risks, and advise clients on wealth management. Career paths include investment banking, equity research, and financial consulting.",
      "topUniversities": ["Shaheed Sukhdev College of Business Studies Delhi", "Christ University Bangalore", "Symbiosis Pune", "NMIMS Mumbai", "Narsee Monjee College Mumbai", "St. Xavier's Mumbai", "Loyola College Chennai"],
      "alignedWithCluster": "Finance & Accounting",
      "whyThisFitsYou": "Your exceptional Conventional interest (C: 80%) and numerical reasoning (88%) make you perfect for finance careers. Your attention to detail and analytical skills align with investment banking and financial analysis."
    },
    {
      "programName": "BBA (Bachelor of Business Administration)",
      "matchScore": 84,
      "fit": "Medium",
      "duration": "3 years",
      "roleDescription": "BBA graduates become business managers, marketing professionals, HR specialists, and operations managers. You'll lead teams, develop business strategies, manage projects, and drive organizational growth. Career opportunities span across consulting, marketing, operations, and general management.",
      "topUniversities": ["Shaheed Sukhdev College Delhi", "Christ University Bangalore", "Symbiosis Pune", "NMIMS Mumbai", "Amity University", "Manipal University", "VIT Vellore"],
      "alignedWithCluster": "Business & Management",
      "whyThisFitsYou": "Your strong Enterprising interest (E: 85%) and leadership skills make business management a natural fit. Your communication abilities and strategic thinking support managerial roles."
    },
    {
      "programName": "BBA Entrepreneurship",
      "matchScore": 76,
      "fit": "Explore",
      "duration": "3 years",
      "roleDescription": "Entrepreneurship graduates start their own ventures, work in startups, or drive innovation in established companies. You'll develop business plans, secure funding, build teams, and launch products. This path suits those who want to create their own opportunities and drive change.",
      "topUniversities": ["Christ University Bangalore", "Symbiosis Pune", "NMIMS Mumbai", "Amity University", "Manipal University", "VIT Vellore", "Chandigarh University"],
      "alignedWithCluster": "Entrepreneurship & Digital Business",
      "whyThisFitsYou": "Your Enterprising interest (E: 85%) and creativity (A: 65%) open doors to entrepreneurship. Your risk-taking ability and innovative mindset support startup ventures."
    }
  ]
}
\`\`\`

**Arts Stream Example:**
\`\`\`json
{
  "degreePrograms": [
    {
      "programName": "BA Design (Graphic/UI/UX)",
      "matchScore": 94,
      "fit": "High",
      "duration": "3-4 years",
      "roleDescription": "Design graduates create visual content, user interfaces, brand identities, and digital experiences. You'll work as UI/UX designers, graphic designers, brand strategists, or creative directors. Career opportunities exist in tech companies, design agencies, advertising firms, and as freelance designers.",
      "topUniversities": ["NID Ahmedabad", "NIFT Delhi", "Srishti Manipal", "Pearl Academy", "MIT Institute of Design", "Symbiosis Institute of Design", "DJ Academy of Design"],
      "alignedWithCluster": "Creative & Design",
      "whyThisFitsYou": "Your exceptional Artistic interest (A: 92%) and creativity score (88%) make you perfect for design. Your visual thinking and attention to detail align with UI/UX design's creative and analytical demands."
    },
    {
      "programName": "BA Journalism & Mass Communication",
      "matchScore": 86,
      "fit": "Medium",
      "duration": "3 years",
      "roleDescription": "Journalism graduates work as reporters, content creators, news anchors, editors, and media strategists. You'll investigate stories, conduct interviews, create multimedia content, and shape public discourse. Career paths include print journalism, broadcast media, digital content, and public relations.",
      "topUniversities": ["IIMC Delhi", "Symbiosis Pune", "Xavier's Institute Mumbai", "Christ University Bangalore", "Jamia Millia Islamia", "Lady Shri Ram College Delhi", "Asian College of Journalism Chennai"],
      "alignedWithCluster": "Media & Communication",
      "whyThisFitsYou": "Your high Social interest (S: 85%) and excellent verbal skills (90%) make journalism a natural fit. Your curiosity and communication strengths support investigative reporting and storytelling."
    },
    {
      "programName": "LLB (Bachelor of Laws)",
      "matchScore": 79,
      "fit": "Explore",
      "duration": "3 years (after graduation) or 5 years (integrated)",
      "roleDescription": "Law graduates become lawyers, legal advisors, judges, corporate counsels, and policy makers. You'll represent clients, draft legal documents, argue cases in court, and provide legal guidance. Career opportunities span litigation, corporate law, intellectual property, human rights, and legal academia.",
      "topUniversities": ["National Law School Bangalore", "NALSAR Hyderabad", "NLSIU Bangalore", "NUJS Kolkata", "NLU Delhi", "Symbiosis Law School Pune", "Jindal Global Law School"],
      "alignedWithCluster": "Social Sciences & Law",
      "whyThisFitsYou": "Your high Social interest (S: 85%) and logical reasoning (85%) make law worth exploring. Your analytical thinking and communication skills support legal advocacy and policy work."
    }
  ]
}
\`\`\`

**CAREER RECOMMENDATIONS GUIDELINES:**

**JOB TITLE REQUIREMENTS - PROFESSIONAL & SERIOUS:**
- Use formal, industry-standard job titles (e.g., "Software Engineer" not "App Developer")
- Avoid casual or trendy titles (e.g., "Data Scientist" not "Data Ninja")
- Use senior-level titles for high-paying roles (e.g., "Senior Product Manager", "Lead UX Designer")
- Include specific specializations (e.g., "Machine Learning Engineer" not just "AI Engineer")
- For creative roles, use professional titles (e.g., "Creative Director" not "Content Creator")
- Avoid generic titles - be specific about the domain (e.g., "Financial Analyst" not just "Analyst")

**EXAMPLES OF PROFESSIONAL JOB TITLES BY FIELD:**
- **Technology**: Software Engineer, Data Scientist, Machine Learning Engineer, DevOps Engineer, Cloud Architect, Cybersecurity Analyst, Full Stack Developer, Backend Engineer, Frontend Engineer, Systems Architect
- **Design**: UX Designer, UI Designer, Product Designer, Visual Designer, Interaction Designer, Design Researcher, Creative Director, Brand Strategist
- **Business**: Product Manager, Business Analyst, Strategy Consultant, Operations Manager, Project Manager, Business Development Manager
- **Finance**: Financial Analyst, Investment Analyst, Risk Analyst, Portfolio Manager, Quantitative Analyst, Corporate Finance Manager
- **Media**: Journalist, Editor, Content Strategist, Communications Manager, Public Relations Manager, Media Producer
- **Research**: Research Scientist, Data Analyst, Research Associate, Laboratory Technician, Clinical Research Coordinator

**FUTURISTIC & EMERGING CAREERS (2025-2035 Job Market):**
- AI/ML Engineer, Prompt Engineer, AI Ethics Officer, Computer Vision Specialist
- Metaverse Developer, VR/AR Designer, Digital Twin Engineer
- Space Technology: Satellite Engineer, Space Tourism Manager, Aerospace Engineer
- Autonomous Systems: Self-Driving Car Engineer, Robotics Engineer, Smart City Planner
- Biotech: Gene Therapy Researcher, Synthetic Biologist, Personalized Medicine Specialist
- Climate Tech: Carbon Capture Engineer, Renewable Energy Consultant, Sustainability Analyst
- Web3/Blockchain: Smart Contract Developer, DeFi Analyst, Tokenomics Designer
- Cybersecurity: Ethical Hacker, Security Architect, Digital Forensics Expert
- Quantum Computing: Quantum Software Developer, Quantum Cryptographer
- Creator Economy: Professional Content Creator, Community Manager, Digital Strategist

**🎨 CREATIVE & ARTISTIC CAREERS (For High 'A' RIASEC Students):**
- Music & Entertainment: Music Producer, Sound Designer, Film Score Composer, Concert Manager
- Visual Arts: Digital Artist, Animator, Art Director, Fashion Designer, NFT Creator
- Performing Arts: Actor, Director, Choreographer, Theatre Producer, Voice Actor
- Media & Content: YouTuber, Film Director, Screenwriter, Documentary Filmmaker, Podcast Host
- Design: Graphic Designer, UX/UI Designer, Game Designer, Interior Designer, Brand Designer

**HIGH-PAYING TRADITIONAL CAREERS:**
- Government: IAS Officer, IPS Officer, IFS Diplomat, IRS Officer (via UPSC)
- Defence: Army/Navy/Air Force Officer, DRDO Scientist, ISRO Scientist
- Medical: Surgeon, Cardiologist, Neurologist, Medical Researcher
- Engineering: IIT Professor, Senior Scientist, Aerospace Engineer
- Finance: Investment Banker, Hedge Fund Manager, Chartered Accountant, Actuary
- Law: Corporate Lawyer, Supreme Court Advocate, Legal Counsel
- Management: Management Consultant (McKinsey/BCG), Strategy Director, CEO

**CRITICAL REQUIREMENTS:**
1. You MUST provide EXACTLY 3 career clusters (High fit, Medium fit, Explore)
2. You MUST provide EXACTLY 3 degree program recommendations (from the list above)
3. Each cluster MUST have evidence from ALL 6 sections (interest, aptitude, personality, values, employability, knowledge)
4. Each program MUST have personalized "Why this fits you" reasoning
5. If student has high 'A' (Artistic) in RIASEC, at least ONE cluster AND ONE program MUST be creative/artistic
6. Personalize based on THEIR specific scores - no generic recommendations
7. Include specific college majors and degree programs for each cluster
8. Provide realistic salary ranges for Indian job market (in LPA)
9. Include both entry-level and senior career progression paths

**⚠️ FINAL VALIDATION CHECKLIST:**
Before returning your response, verify:
- [ ] All 6 sections analyzed (RIASEC, Big Five, Values, Employability, Aptitude, Knowledge)
- [ ] EXACTLY 3 career clusters provided (High, Medium, Explore)
- [ ] Career clusters MATCH student's stream (Science/Commerce/Arts)
- [ ] EXACTLY 3 degree programs provided
- [ ] Degree programs MATCH student's stream (Science/Commerce/Arts)
- [ ] Degree programs ALIGN with career clusters:
  - Program 1 (High fit) aligns with Cluster 1
  - Program 2 (Medium fit) aligns with Cluster 2
  - Program 3 (Explore) aligns with Cluster 3
- [ ] Each career cluster has evidence from ALL 6 sections
- [ ] Each degree program has "alignedWithCluster" field
- [ ] Each degree program has personalized "Why this fits you" reasoning
- [ ] Each degree program has evidence from ALL 6 sections
- [ ] **CRITICAL: Each degree program has "duration" field (e.g., "4 years", "3 years", "5.5 years")**
- [ ] **CRITICAL: Each degree program has "roleDescription" field (2-3 sentences about what graduates do)**
- [ ] **CRITICAL: Each degree program has "topUniversities" array (5-7 universities)**
- [ ] If 'A' (Artistic) is in top 3 RIASEC, at least one creative career cluster AND one creative program included
- [ ] Specific college majors and programs listed for each cluster
- [ ] Salary ranges provided for entry, mid, and senior levels
- [ ] All JSON fields properly filled (no empty arrays or null values)
- [ ] Response is valid JSON (no markdown, no truncation)

**🚨 MANDATORY FIELDS FOR EACH DEGREE PROGRAM - DO NOT SKIP:**
Example structure:
{
  "programName": "B.Tech Computer Science & Engineering",
  "matchScore": 92,
  "fit": "High",
  "duration": "4 years",  // ← REQUIRED - MUST BE PRESENT
  "roleDescription": "As a Computer Science graduate, you'll design and develop software applications...",  // ← REQUIRED - MUST BE PRESENT
  "topUniversities": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad"],  // ← REQUIRED - MUST BE PRESENT
  "alignedWithCluster": "Technology & Innovation",
  "whyThisFitsYou": "Your exceptional logical reasoning...",
  "evidence": { ... }
}`;
}

