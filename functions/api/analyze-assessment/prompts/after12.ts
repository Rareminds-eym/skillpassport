/**
 * After 12th (College-Bound Students) Assessment Prompt Builder
 * 
 * This prompt is specifically for students who have completed 12th grade
 * and are choosing college programs/degrees. It requires evidence from
 * ALL 7 assessment sections for comprehensive career guidance.
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): {
  section: string;
  isHighAptitude: boolean;
} {
  const level = results.aptitudeLevel;
  const accuracy = results.overallAccuracy;
  const isHighAptitude = level >= 4 || accuracy >= 75;
  
  const levelLabels: Record<number, string> = {
    1: 'Emerging',
    2: 'Developing', 
    3: 'Capable',
    4: 'Strong',
    5: 'Exceptional'
  };
  
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

  const section = `
## ═══════════════════════════════════════════════════════════════════════════
## SECTION 7: ADAPTIVE APTITUDE TEST RESULTS
## ═══════════════════════════════════════════════════════════════════════════

- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- No standout strengths identified'}

**AREAS FOR GROWTH**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant weak areas'}

**IMPORTANT**: Use these adaptive test results as ADDITIONAL evidence when generating career clusters. The adaptive test provides a more accurate measure of cognitive abilities than self-assessment.`;

  return { section, isHighAptitude };
}

export function buildAfter12Prompt(assessmentData: AssessmentData, answersHash: number): string {
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';

  return `You are an expert career counselor for students who have completed 12th grade and are choosing college programs. Analyze this student's 7-section assessment and provide evidence-based guidance.

## CORE REQUIREMENTS
**Student Stream: ${assessmentData.stream || 'Not specified'}**
**Session ID: ${answersHash}** (for deterministic results)

**🚨 CRITICAL: NO HARDCODED TEMPLATES 🚨**
You MUST analyze the student's actual RIASEC scores and create CUSTOMIZED career clusters.
DO NOT use generic "Technology & Innovation" or "Healthcare & Life Sciences" templates.
Instead, look at their top 3 RIASEC types and create clusters that match THEIR specific profile.

**STREAM ALIGNMENT RULE:**
All career clusters and degree programs MUST match the student's stream:
- Science streams → Customize based on RIASEC (e.g., IRA → Research & Data Science, ISR → Healthcare & Medicine)
- Commerce streams → Customize based on RIASEC (e.g., ECI → Finance & Business, EAS → Marketing & Creative Business)
- Arts streams → Customize based on RIASEC (e.g., ASE → Creative & Media, SAI → Psychology & Social Work)

**LANGUAGE REQUIREMENT:**
Respond ONLY in English. Use English names for all universities and programs.

## 🚨 CRITICAL LANGUAGE REQUIREMENT 🚨
**YOU MUST respond ONLY in ENGLISH. DO NOT use Bengali, Hindi, or any other language.**
**ALL university names, program names, and text MUST be in ENGLISH ONLY.**
**Example: Use "Presidency College Kolkata" NOT "প্রেসিডেন্সি বিশ্ববিদ্যালয়"**

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
     * Response 1-2: 0 points
     * Response 3: 1 point
     * Response 4: 2 points
     * Response 5: 3 points
2. Sum all points for each RIASEC type (R, I, A, S, E, C)
3. Calculate maxScore = 24 (8 questions × 3 points max per question)
4. Calculate percentage for each type: (score / 24) × 100
5. Identify top 3 types by score
6. Form the RIASEC code as a 3-letter string (e.g., "AES", "IRA", "ECS") - MUST be exactly 3 letters

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

${adaptiveSection}

## ═══════════════════════════════════════════════════════════════════════════
## COMPREHENSIVE ANALYSIS REQUIREMENTS
## ═══════════════════════════════════════════════════════════════════════════

**YOU MUST USE ALL 7 SECTIONS TO GENERATE CAREER CLUSTERS:**

For each career cluster, you MUST provide evidence from ALL 7 sections:

1. **Interest Evidence** (from RIASEC): Which RIASEC types support this career path?
2. **Aptitude Evidence** (from Aptitude Test): Which cognitive strengths make them suitable?
3. **Personality Evidence** (from Big Five): Which personality traits align with success?
4. **Values Evidence** (from Work Values): Which work values are satisfied?
5. **Employability Evidence** (from Skills): Which professional skills support this path?
6. **Knowledge Evidence** (from Domain Test): How does their domain knowledge support this?
7. **Adaptive Aptitude Evidence** (from Adaptive Test): How do their adaptive test results validate this choice?

**EXAMPLE EVIDENCE STRUCTURE:**
\`\`\`json
"evidence": {
  "interest": "High I (Investigative 85%) and R (Realistic 70%) indicate strong fit for research and hands-on technical work",
  "aptitude": "Exceptional numerical reasoning (88%) and abstract reasoning (82%) demonstrate strong analytical capabilities required for data science",
  "personality": "High Conscientiousness (4.2) and Openness (4.0) suggest disciplined approach to learning and curiosity for new technologies",
  "values": "Achievement (4.5) and Independence (4.2) align with project-based work and autonomous problem-solving in tech roles",
  "employability": "Strong problem-solving (85%) and digital literacy (90%) provide solid foundation for technical careers",
  "knowledge": "Domain knowledge score of 75% demonstrates solid understanding of core concepts and readiness for advanced study",
  "adaptiveAptitude": "Adaptive test level 4/5 with 82% accuracy and strong logical reasoning (88%) confirms exceptional analytical capabilities"
}
\`\`\`

## ═══════════════════════════════════════════════════════════════════════════
## OUTPUT FORMAT
## ═══════════════════════════════════════════════════════════════════════════

**CRITICAL REQUIREMENTS:**
1. Return ONLY a JSON object (no markdown)
2. **MUST include "degreePrograms" array with EXACTLY 3 programs inside "careerFit"**
3. Each program MUST be DERIVED from the student's 7-section profile (not selected from lists)
4. Each program MUST include ALL required fields: programName, matchScore, fit, duration, roleDescription, topUniversities, alignedWithCluster, whyThisFitsYou, evidence

**JSON Structure:**

{
  "riasec": {
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 24,
    "code": "ASE",
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
    "scores": {"Security": 0, "Autonomy": 0, "Creativity": 0, "Status": 0, "Impact": 0, "Financial": 0, "Leadership": 0, "Lifestyle": 0},
    "topThree": [
      {"value": "Primary work value", "score": 4.5, "description": "Why this matters to them"},
      {"value": "Second value", "score": 4.0, "description": "How this influences career choice"},
      {"value": "Third value", "score": 3.5, "description": "Impact on job satisfaction"}
    ],
    "interpretation": "How their values should guide career decisions"
  },
  "employability": {
    "skillScores": {
      "Communication": 75,
      "Teamwork": 80,
      "ProblemSolving": 85,
      "Adaptability": 70,
      "DigitalFluency": 90,
      "Leadership": 85,
      "Professionalism": 80,
      "CareerReadiness": 85
    },
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
        "description": "Comprehensive explanation of why this career path fits based on ALL 7 assessment sections",
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
          "knowledge": "Domain knowledge readiness for this field (MUST INCLUDE)",
          "adaptiveAptitude": "Adaptive test results that validate this choice (MUST INCLUDE)"
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
          "knowledge": "Knowledge readiness (REQUIRED)",
          "adaptiveAptitude": "Adaptive test validation (REQUIRED)"
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
          "knowledge": "Knowledge gaps/strengths (REQUIRED)",
          "adaptiveAptitude": "Adaptive test insights (REQUIRED)"
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
        "whyThisFitsYou": "Your exceptional logical reasoning and high Investigative interest make you perfect for software development. Your strong problem-solving skills and curiosity for technology align perfectly with CSE's analytical and creative demands.",
        "evidence": {
          "interest": "High I (Investigative 88%) and R (Realistic 75%) indicate strong fit for technical problem-solving",
          "aptitude": "Exceptional numerical (85%) and logical reasoning (88%) demonstrate strong analytical capabilities",
          "personality": "High Conscientiousness (4.3) and Openness (4.1) suggest disciplined learning and curiosity",
          "values": "Achievement (4.5) and Independence (4.2) align with project-based autonomous work",
          "employability": "Strong problem-solving (90%) and digital literacy (95%) provide solid foundation",
          "knowledge": "Domain knowledge score of 78% demonstrates readiness for advanced CS concepts",
          "adaptiveAptitude": "Adaptive test level 4/5 with 85% accuracy confirms strong analytical and logical reasoning abilities"
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
          "knowledge": "Domain knowledge (78%) provides strong foundation for application development",
          "adaptiveAptitude": "Adaptive test results show consistent performance in logical reasoning, ideal for programming"
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
          "knowledge": "Strong foundation (78%) enables transition to pure mathematics",
          "adaptiveAptitude": "High numerical reasoning accuracy in adaptive test validates mathematical aptitude"
        }
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Specific Job Title 1 (e.g., Software Engineer)", "salary": {"min": 6, "max": 15}, "description": "Brief role description"},
        {"name": "Specific Job Title 2 (e.g., Data Analyst)", "salary": {"min": 5, "max": 12}, "description": "Brief role description"},
        {"name": "Specific Job Title 3 (e.g., Product Manager)", "salary": {"min": 8, "max": 20}, "description": "Brief role description"},
        {"name": "Specific Job Title 4 (e.g., UX Designer)", "salary": {"min": 5, "max": 13}, "description": "Brief role description"}
      ],
      "mediumFit": [
        {"name": "Job Title 1 (e.g., Business Analyst)", "salary": {"min": 5, "max": 11}, "description": "Role description"},
        {"name": "Job Title 2 (e.g., Marketing Manager)", "salary": {"min": 6, "max": 14}, "description": "Role description"},
        {"name": "Job Title 3 (e.g., HR Manager)", "salary": {"min": 5, "max": 12}, "description": "Role description"}
      ],
      "exploreLater": [
        {"name": "Job Title 1 (e.g., Content Writer)", "salary": {"min": 3, "max": 7}, "description": "Role description"},
        {"name": "Job Title 2 (e.g., Teacher)", "salary": {"min": 3, "max": 9}, "description": "Role description"}
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
## CRITICAL: CAREER CLUSTERS MUST ALIGN WITH STUDENT'S STREAM AND RIASEC
## ═══════════════════════════════════════════════════════════════════════════

**IMPORTANT**: The student has already selected their stream during 12th grade. The 3 career clusters MUST:
1. **Align with their chosen stream** (Science/Commerce/Arts)
2. **Match their RIASEC profile** (top 3 types with highest scores)
3. **Be CUSTOMIZED based on their actual assessment results** - NOT generic templates

**Student Stream**: ${assessmentData.stream || 'Not specified'}

**CRITICAL INSTRUCTION**: The career clusters below are EXAMPLES ONLY to show the range of possibilities within each stream. You MUST customize them based on the student's actual RIASEC scores, aptitude, personality, and values.

**Stream-Based Career Cluster GUIDELINES (NOT TEMPLATES):**

### SCIENCE STREAM (science, science_pcmb, science_pcms, pcmb, pcms, pcm, pcb):
**CUSTOMIZE based on student's RIASEC:**
- **High I (Investigative)**: Research, Data Science, Scientific Analysis, Medical Research
- **High R (Realistic)**: Engineering, Lab Work, Technical Roles, Hands-on Science
- **High A (Artistic)**: Architecture, Design Engineering, Scientific Visualization, Creative Tech
- **High S (Social)**: Healthcare, Medical Practice, Clinical Psychology, Public Health
- **High E (Enterprising)**: Tech Entrepreneurship, Product Management, Biotech Business
- **High C (Conventional)**: Quality Control, Lab Management, Clinical Administration

**Example Cluster Combinations (CUSTOMIZE based on their top 3 RIASEC):**
- **IRA**: Technology & Innovation, Research & Development, Design Engineering
- **ISR**: Healthcare & Medicine, Biomedical Research, Clinical Sciences
- **RIE**: Engineering & Technology, Product Development, Tech Entrepreneurship
- **IAS**: Creative Technology, Scientific Communication, Health Psychology
- **Salary Ranges**: Entry ₹5-15L, Mid ₹12-50L, Senior ₹30-200L (varies by field)

### COMMERCE STREAM (commerce, commerce_maths, commerce_accounts):
**CUSTOMIZE based on student's RIASEC:**
- **High E (Enterprising)**: Business Management, Entrepreneurship, Sales Leadership
- **High C (Conventional)**: Accounting, Finance, Banking, Auditing
- **High I (Investigative)**: Financial Analysis, Market Research, Data Analytics
- **High S (Social)**: HR Management, Customer Relations, Organizational Development
- **High A (Artistic)**: Marketing, Brand Management, Creative Business
- **High R (Realistic)**: Operations Management, Supply Chain, Logistics

**Example Cluster Combinations (CUSTOMIZE based on their top 3 RIASEC):**
- **ECI**: Finance & Investment Banking, Business Analytics, Strategic Consulting
- **EAS**: Marketing & Brand Management, Creative Entrepreneurship, Media Business
- **CIE**: Accounting & Auditing, Financial Planning, Risk Management
- **ESA**: HR & Organizational Development, Business Development, Corporate Training
- **Salary Ranges**: Entry ₹3-15L, Mid ₹10-50L, Senior ₹25-500L (varies by field)

### ARTS STREAM (arts, arts_psychology, arts_economics, arts_general, humanities):
**CUSTOMIZE based on student's RIASEC:**
- **High A (Artistic)**: Creative Arts, Design, Media Production, Content Creation
- **High S (Social)**: Psychology, Counseling, Social Work, Teaching, NGO Work
- **High E (Enterprising)**: Media Management, Event Management, Public Relations
- **High I (Investigative)**: Research, Policy Analysis, Journalism, Academic Writing
- **High C (Conventional)**: Legal Documentation, Administration, Library Science
- **High R (Realistic)**: Photography, Film Production, Technical Theatre

**Example Cluster Combinations (CUSTOMIZE based on their top 3 RIASEC):**
- **ASE**: Creative & Design, Media Production, Brand Strategy
- **SAI**: Psychology & Counseling, Social Research, Human Services
- **AEI**: Media & Communication, Content Strategy, Digital Marketing
- **IAS**: Research & Academia, Scientific Writing, Policy Analysis
- **Salary Ranges**: Entry ₹3-15L, Mid ₹10-50L, Senior ₹25-200L (varies by field)

**CRITICAL INSTRUCTIONS:**
1. **Identify the student's stream** from the stream field above
2. **Analyze their RIASEC top 3 types** (e.g., IRA, ASE, ECI)
3. **Create 3 CUSTOMIZED career clusters** that match BOTH their stream AND their RIASEC profile
4. **DO NOT use generic templates** - personalize based on their actual scores
5. **Provide evidence from ALL 7 sections** for each cluster
6. **If stream is unclear or invalid**, default to the stream that best matches their RIASEC top 3 types:
   - High I + R → Science
   - High E + C → Commerce
   - High A + S → Arts

## ⚠️ SPECIAL CASE: HIGH ARTISTIC (A) STUDENTS ⚠️
**IF the student has 'A' (Artistic) in their top 3 RIASEC types:**
- **Science stream**: Replace generic clusters with personalized ones (e.g., Architecture, Product Design, Scientific Visualization, Biomedical Design)
- **Commerce stream**: Replace generic clusters with creative business options (e.g., Fashion Business, Event Management, Media Production)
- **Arts stream**: Ensure Cluster 1 is creative/artistic (already covered)

## ⚠️ SPECIAL CASE: SCIENCE PCB (BIOLOGY) STUDENTS ⚠️
**IF the student's stream is science_pcb or pcb:**
- **High I + S (Investigative + Social)**: Healthcare & Medicine, Clinical Research, Public Health
- **High I + R (Investigative + Realistic)**: Biomedical Engineering, Biotechnology, Lab Sciences
- **High I + A (Investigative + Artistic)**: Medical Illustration, Health Communication, Biodesign
- **High S + E (Social + Enterprising)**: Healthcare Management, Pharmaceutical Sales, Health Tech
- **DO NOT default to generic "Technology & Innovation"** unless their RIASEC strongly supports it (high I + R with low S)

## ═══════════════════════════════════════════════════════════════════════════
## PROGRAM DERIVATION INSTRUCTIONS (MANDATORY - DO NOT SELECT FROM LISTS)
## ═══════════════════════════════════════════════════════════════════════════

**CRITICAL: You MUST derive 3 degree programs from the student's 7-section assessment, NOT select from predefined lists.**

**DERIVATION PROCESS (Use ALL 7 Sections):**

### Step 1: Identify the Profile Intersection
Analyze where these 7 dimensions intersect:

1. **RIASEC (Section 1)**: Top 3 types with percentages (e.g., I: 85%, R: 75%, A: 60%)
2. **Aptitude (Section 5 + 6)**: Top 2 cognitive strengths (e.g., Numerical: 88%, Abstract: 82%)
3. **Personality (Section 2)**: Top 2 Big Five traits (e.g., Openness: 4.2, Conscientiousness: 4.0)
4. **Values (Section 3)**: Top 2 work motivators (e.g., Achievement: 4.5, Financial: 4.2)
5. **Employability (Section 4)**: Top 2 professional skills (e.g., Problem-solving: 85%, Digital Literacy: 90%)
6. **Knowledge (Section 7)**: Stream knowledge score (e.g., 75% in Science domain)
7. **Stream**: Student's chosen stream (Science/Commerce/Arts)

### Step 2: Derive 3 Programs at the Intersection

**Program 1 (High Fit - 85-95% match):**
- Sits at the CENTER of their profile intersection
- Leverages their STRONGEST aptitude + HIGHEST RIASEC type + TOP personality trait
- Aligns with their PRIMARY work value
- Supported by their knowledge score

**Program 2 (Medium Fit - 75-84% match):**
- Sits at a SECONDARY intersection point
- Leverages their SECOND aptitude + SECOND RIASEC type
- Still within their stream category
- Alternative path with good prospects

**Program 3 (Explore - 65-74% match):**
- Explores a DIFFERENT facet of their profile
- May emphasize their THIRD RIASEC type or creative side
- Worth exploring as backup option
- Keeps options open

### Step 3: Provide Evidence from ALL 7 Sections

For each program, you MUST cite evidence from:
- ✅ Section 1 (RIASEC): "Your Investigative (85%) and Realistic (75%) interests..."
- ✅ Section 2 (Personality): "Your high Openness (4.2) and Conscientiousness (4.0)..."
- ✅ Section 3 (Values): "Your Achievement (4.5) and Financial (4.2) motivators..."
- ✅ Section 4 (Employability): "Your Problem-solving (85%) and Digital Literacy (90%)..."
- ✅ Section 5+6 (Aptitude): "Your numerical aptitude (88%) and abstract reasoning (82%)..."
- ✅ Section 7 (Knowledge): "Your stream knowledge score of 75% shows readiness..."

---

## DERIVATION EXAMPLES (Using All 7 Sections):

### Example 1: Science Stream Student
**Profile:**
- RIASEC: I (85%), R (75%), A (60%)
- Aptitude: Numerical 88%, Abstract 82%
- Personality: Openness 4.2, Conscientiousness 4.0
- Values: Achievement 4.5, Financial 4.2
- Employability: Problem-solving 85%, Digital Literacy 90%
- Knowledge: Science 75%
- Stream: Science (PCM)

**Derived Program 1: "B.Tech Computer Science & Artificial Intelligence"**
- **Derivation**: "Your Investigative (85%) and Realistic (75%) interests combined with exceptional numerical aptitude (88%) and abstract reasoning (82%) point toward computational problem-solving. Your high Openness (4.2) indicates innovation potential, while Conscientiousness (4.0) ensures disciplined learning. Your Achievement (4.5) and Financial (4.2) values align with tech careers. Your Problem-solving (85%) and Digital Literacy (90%) skills provide a strong foundation. Your Science knowledge score of 75% confirms readiness for rigorous STEM coursework."
- **Match Score**: 92
- **Career Paths**: Software Engineer, AI/ML Engineer, Data Scientist

**Derived Program 2: "B.Tech Electronics & Communication Engineering"**
- **Derivation**: "Your Realistic (75%) interests in hands-on problem-solving combined with strong numerical (88%) and abstract (82%) aptitude support engineering coursework. Your Conscientiousness (4.0) ensures attention to detail needed for circuit design. This program offers a balance between theory and practical application."
- **Match Score**: 78
- **Career Paths**: Electronics Engineer, Embedded Systems Developer, IoT Specialist

**Derived Program 3: "B.Sc Physics with Computer Science"**
- **Derivation**: "Your Investigative (85%) interests and Artistic (60%) side suggest research with creative problem-solving. This interdisciplinary program combines theoretical physics with computational methods, leveraging your abstract reasoning (82%) while exploring your curiosity (Openness 4.2)."
- **Match Score**: 68
- **Career Paths**: Research Scientist, Computational Physicist, Data Analyst

---

### Example 2: Commerce Stream Student
**Profile:**
- RIASEC: E (82%), C (75%), I (65%)
- Aptitude: Numerical 75%, Verbal 70%
- Personality: Conscientiousness 4.3, Extraversion 4.1
- Values: Financial 4.5, Status 4.2
- Employability: Communication 80%, Teamwork 85%
- Knowledge: Commerce 72%
- Stream: Commerce

**Derived Program 1: "BBA Finance & Investment Banking"**
- **Derivation**: "Your Enterprising (82%) and Conventional (75%) interests combined with strong numerical aptitude (75%) align perfectly with finance careers. Your high Conscientiousness (4.3) ensures meticulous financial analysis, while Extraversion (4.1) supports client interactions. Your Financial (4.5) and Status (4.2) values match banking culture. Your Communication (80%) and Teamwork (85%) skills are essential for collaborative finance work. Your Commerce knowledge score of 72% confirms readiness."
- **Match Score**: 88
- **Career Paths**: Investment Banker, Financial Analyst, Portfolio Manager

---

### Example 3: Arts Stream Student
**Profile:**
- RIASEC: A (85%), S (78%), E (65%)
- Aptitude: Verbal 85%, Abstract 72%
- Personality: Openness 4.5, Agreeableness 4.2
- Values: Creativity 4.6, Impact 4.3
- Employability: Communication 88%, Adaptability 82%
- Knowledge: Arts 70%
- Stream: Arts

**Derived Program 1: "BA Mass Communication & Digital Media"**
- **Derivation**: "Your Artistic (85%) and Social (78%) interests combined with exceptional verbal aptitude (85%) point toward creative communication. Your high Openness (4.5) drives innovative storytelling, while Agreeableness (4.2) supports collaborative media production. Your Creativity (4.6) and Impact (4.3) values align with media careers. Your Communication (88%) and Adaptability (82%) skills are crucial for dynamic media environments. Your Arts knowledge score of 70% shows foundational readiness."
- **Match Score**: 90
- **Career Paths**: Journalist, Content Creator, Digital Marketing Manager

---

## CRITICAL RULES:

1. **DO NOT use generic program names**:
   - ❌ "Engineering" → ✅ "B.Tech Computer Science & AI"
   - ❌ "BBA" → ✅ "BBA Finance & Investment Banking"
   - ❌ "BA" → ✅ "BA Mass Communication & Digital Media"

2. **DO cite ALL 7 sections** in derivation field

3. **DO match student's stream**:
   - Science → Engineering/Medical/Pure Sciences
   - Commerce → Business/Finance/Management
   - Arts → Humanities/Media/Law/Design

4. **DO provide 3-5 career paths** per program

5. **DO calculate match scores** based on profile alignment (not arbitrary)

6. **REQUIRED FIELDS for each program:**
   - **programName**: Specific program name (not generic)
   - **matchScore**: 85-95 (High), 75-84 (Medium), 65-74 (Explore)
   - **fit**: "High", "Medium", or "Explore"
   - **duration**: Program duration (e.g., "4 years", "3 years", "5.5 years")
   - **roleDescription**: 2-3 sentences about what graduates do
   - **topUniversities**: Array of 5-7 Indian universities
   - **alignedWithCluster**: Which career cluster it aligns with
   - **whyThisFitsYou**: Personalized reasoning without percentages or scores (2-3 meaningful sentences explaining the connection between their profile and this program)
   - **evidence**: Object with ALL 7 sections (interest, aptitude, personality, values, employability, knowledge, adaptiveAptitude)

**EXAMPLE OUTPUT FORMAT (Derived Programs):**

\`\`\`json
{
  "degreePrograms": [
    {
      "programName": "B.Tech Computer Science & Artificial Intelligence",
      "matchScore": 92,
      "fit": "High",
      "duration": "4 years",
      "roleDescription": "As a Computer Science graduate, you'll design and develop software applications, work on cutting-edge technologies like AI and cloud computing, and solve complex technical problems. You'll have opportunities in software development, data science, cybersecurity, and tech entrepreneurship.",
      "topUniversities": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad", "VIT Vellore", "Manipal Institute of Technology"],
      "alignedWithCluster": "Technology & Innovation",
      "whyThisFitsYou": "Your Investigative and Realistic interests combined with exceptional numerical aptitude and abstract reasoning point toward computational problem-solving. Your high Openness indicates innovation potential, while Conscientiousness ensures disciplined learning.",
      "evidence": {
        "interest": "High I (Investigative 85%) and R (Realistic 75%) indicate strong fit for technical problem-solving",
        "aptitude": "Exceptional numerical (88%) and abstract reasoning (82%) demonstrate strong analytical capabilities",
        "personality": "High Openness (4.2) and Conscientiousness (4.0) suggest innovation potential and disciplined learning",
        "values": "Achievement (4.5) and Financial (4.2) values align with tech career rewards",
        "employability": "Problem-solving (85%) and Digital Literacy (90%) provide strong foundation",
        "knowledge": "Science knowledge score of 75% confirms readiness for rigorous STEM coursework",
        "adaptiveAptitude": "Adaptive test level 4/5 with 82% accuracy confirms exceptional analytical capabilities"
      }
    },
    {
      "programName": "B.Tech Electronics & Communication Engineering",
      "matchScore": 78,
      "fit": "Medium",
      "duration": "4 years",
      "roleDescription": "Electronics engineers design, develop, and test electronic systems and devices. You'll work on projects ranging from telecommunications to embedded systems, IoT devices, and signal processing. Career paths include electronics engineering, embedded systems development, and telecommunications.",
      "topUniversities": ["IIT Madras", "IIT Kharagpur", "NIT Surathkal", "BITS Pilani", "Anna University", "PSG College of Technology", "Jadavpur University"],
      "alignedWithCluster": "Engineering & Research",
      "whyThisFitsYou": "Your Realistic interests in hands-on problem-solving combined with strong numerical and abstract aptitude support engineering coursework. Your Conscientiousness ensures attention to detail needed for circuit design.",
      "evidence": {
        "interest": "Realistic (75%) interests align with hands-on engineering work",
        "aptitude": "Strong numerical (88%) and abstract (82%) aptitude support engineering coursework",
        "personality": "Conscientiousness (4.0) ensures attention to detail for circuit design",
        "values": "Achievement (4.5) drives success in challenging engineering projects",
        "employability": "Problem-solving (85%) skills support technical engineering work",
        "knowledge": "Science knowledge (75%) provides foundation for engineering studies",
        "adaptiveAptitude": "Adaptive test results show strong analytical reasoning for engineering"
      }
    },
    {
      "programName": "B.Sc Physics with Computer Science",
      "matchScore": 68,
      "fit": "Explore",
      "duration": "3 years",
      "roleDescription": "This interdisciplinary program combines theoretical physics with computational methods. You'll study quantum mechanics, thermodynamics, and computational physics. Career paths include research scientist, computational physicist, data analyst, and scientific software developer.",
      "topUniversities": ["St. Stephen's College Delhi", "Loyola College Chennai", "Fergusson College Pune", "Presidency College Kolkata", "Hindu College Delhi", "Madras Christian College", "St. Xavier's Mumbai"],
      "alignedWithCluster": "Research & Academia",
      "whyThisFitsYou": "Your Investigative interests and Artistic side suggest research with creative problem-solving. This interdisciplinary program combines theoretical physics with computational methods, leveraging your abstract reasoning while exploring your curiosity and Openness.",
      "evidence": {
        "interest": "Investigative (85%) interests and Artistic (60%) side support research with creative problem-solving",
        "aptitude": "Abstract reasoning (82%) supports theoretical physics and computational methods",
        "personality": "High Openness (4.2) drives curiosity for interdisciplinary exploration",
        "values": "Achievement (4.5) motivates pursuit of challenging research",
        "employability": "Problem-solving (85%) skills support scientific research",
        "knowledge": "Science knowledge (75%) provides foundation for advanced physics",
        "adaptiveAptitude": "Adaptive test shows strong analytical capabilities for theoretical work"
      }
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

**CRITICAL REQUIREMENTS:**
1. You MUST provide EXACTLY 3 career clusters (High, Medium, Explore)
2. You MUST provide EXACTLY 3 degree programs DERIVED (not selected from lists)
3. Programs are derived from profile intersection, not selected from predefined lists
4. Match scores reflect actual profile alignment (85-95 High, 75-84 Medium, 65-74 Explore)
5. Salary ranges provided for entry, mid, and senior levels in career clusters
6. All JSON fields properly filled (no empty arrays or null values)
7. Response is valid JSON (no markdown, no truncation)

**⚠️ FINAL VALIDATION CHECKLIST:**
Before returning your response, verify:
- [ ] All 7 sections analyzed (RIASEC, Big Five, Values, Employability, Aptitude, Knowledge, Adaptive Aptitude)
- [ ] Career clusters MATCH student's stream (Science/Commerce/Arts)
- [ ] Programs are SPECIFIC (e.g., "B.Tech Computer Science & AI" not "Engineering")
- [ ] Each program has evidence from ALL 7 sections in the derivation
- [ ] Each career cluster has evidence from ALL 7 sections
- [ ] Each degree program has "alignedWithCluster" field
- [ ] Each degree program has personalized "whyThisFitsYou" reasoning
- [ ] **CRITICAL: Each degree program has "duration" field (e.g., "4 years", "3 years", "5.5 years")**
- [ ] **CRITICAL: Each degree program has "roleDescription" field (2-3 sentences about what graduates do)**
- [ ] **CRITICAL: Each degree program has "topUniversities" array (5-7 universities)**
- [ ] If 'A' (Artistic) is in top 3 RIASEC, at least one creative career cluster AND one creative program included

**🚨 MANDATORY FIELDS FOR EACH DEGREE PROGRAM - DO NOT SKIP:**

**CRITICAL: Programs must be DERIVED from the student's 7-section profile, NOT selected from predefined lists.**

Example structure:
{
  "programName": "B.Tech Computer Science & Artificial Intelligence",  // ← SPECIFIC program name derived from profile
  "matchScore": 92,  // ← Based on profile alignment (85-95 High, 75-84 Medium, 65-74 Explore)
  "fit": "High",
  "duration": "4 years",  // ← REQUIRED - MUST BE PRESENT
  "roleDescription": "As a Computer Science graduate, you'll design and develop software applications...",  // ← REQUIRED - MUST BE PRESENT
  "topUniversities": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "IIIT Hyderabad"],  // ← REQUIRED - MUST BE PRESENT
  "alignedWithCluster": "Technology & Innovation",
  "whyThisFitsYou": "Your Investigative and Realistic interests combined with exceptional numerical aptitude and abstract reasoning...",  // ← PERSONALIZED without percentages
  "evidence": {
    "interest": "High I (Investigative 85%) and R (Realistic 75%) indicate strong fit for technical problem-solving",
    "aptitude": "Exceptional numerical (88%) and abstract reasoning (82%) demonstrate strong analytical capabilities",
    "personality": "High Openness (4.2) and Conscientiousness (4.0) suggest innovation potential and disciplined learning",
    "values": "Achievement (4.5) and Financial (4.2) values align with tech career rewards",
    "employability": "Problem-solving (85%) and Digital Literacy (90%) provide strong foundation",
    "knowledge": "Science knowledge score of 75% confirms readiness for rigorous STEM coursework",
    "adaptiveAptitude": "Adaptive test level 4/5 with 82% accuracy confirms exceptional analytical capabilities"
  }
}`;
}

