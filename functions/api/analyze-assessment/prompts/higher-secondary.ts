/**
 * Higher Secondary (Grades 11-12) Assessment Prompt Builder
 * 
 * Students in grades 11-12 have already chosen their stream (Science/Commerce/Arts)
 * and complete the comprehensive 6-section assessment.
 * 
 * This prompt requires evidence from ALL 6 sections for career cluster generation:
 * 1. RIASEC (Career Interests)
 * 2. Big Five (Personality)
 * 3. Work Values (Motivators)
 * 4. Employability Skills
 * 5. Aptitude (Multi-domain cognitive abilities)
 * 6. Knowledge (Stream-specific subject knowledge)
 */

import type { AssessmentData } from '../types';

export function buildHigherSecondaryPrompt(assessmentData: AssessmentData, answersHash: number): string {
  // Extract student context for stream-specific guidance
  const studentContext = assessmentData.studentContext;
  const selectedStream = studentContext?.selectedStream || assessmentData.stream;
  const selectedCategory = studentContext?.selectedCategory;
  
  // Determine stream category from stream ID if not explicitly provided
  const getStreamCategory = (stream: string): string | null => {
    const streamLower = stream.toLowerCase();
    if (streamLower.includes('arts') || streamLower.includes('humanities')) return 'arts';
    if (streamLower.includes('science') || streamLower.includes('pcm') || streamLower.includes('pcb')) return 'science';
    if (streamLower.includes('commerce')) return 'commerce';
    return null;
  };
  
  const streamCategory = selectedCategory || getStreamCategory(selectedStream);
  
  // Build stream-specific instructions
  const streamSpecificInstructions = streamCategory ? `

## ⚠️ CRITICAL: STUDENT'S SELECTED STREAM CATEGORY

**This student has selected the ${streamCategory.toUpperCase()} stream.**
**Specific Stream**: ${selectedStream}

${streamCategory === 'arts' ? `
### 🎨 ARTS/HUMANITIES STREAM - MANDATORY REQUIREMENTS

This student is in the ARTS/HUMANITIES stream. Your career recommendations MUST reflect this:

**WHAT TO RECOMMEND:**
✅ Arts & Humanities careers: Writer, Journalist, Psychologist, Lawyer, Teacher, Social Worker
✅ Creative fields: Designer, Artist, Content Creator, Media Professional, Filmmaker
✅ Social Sciences: Counselor, HR Professional, Public Relations, NGO Management
✅ Liberal Arts programs: BA, BFA, LLB, Journalism, Psychology, Sociology, Political Science
✅ Arts-aligned entrance exams: CLAT (Law), CUET (Central Universities), JMI, BHU Arts

**WHAT NOT TO RECOMMEND:**
❌ NO Engineering careers (Mechanical, Civil, Electrical, Software Engineer)
❌ NO Medical careers (Doctor, Dentist, Pharmacist, Nurse)
❌ NO Pure Science careers (Physicist, Chemist, Biologist, Researcher)
❌ NO Technology careers (Data Scientist, AI Engineer, IT Professional)
❌ NO Science programs (B.Tech, MBBS, B.Sc Physics/Chemistry)
❌ NO Science entrance exams (JEE, NEET, BITSAT)

**CAREER CLUSTER REQUIREMENTS:**
- Cluster 1 (High Fit): Core Arts careers based on their RIASEC profile
- Cluster 2 (Medium Fit): Adjacent Arts/Creative careers
- Cluster 3 (Explore): Interdisciplinary Arts careers

**VALIDATION:** Before finalizing, verify that ZERO careers from Science/Engineering/Medical fields are included!

` : streamCategory === 'science' ? `
### 🔬 SCIENCE STREAM - MANDATORY REQUIREMENTS

This student is in the SCIENCE stream. Your career recommendations MUST reflect this:

**WHAT TO RECOMMEND:**
✅ Engineering: Mechanical, Civil, Electrical, Computer Science, Aerospace
✅ Medical: Doctor, Dentist, Pharmacist, Physiotherapist, Medical Researcher
✅ Technology: Software Engineer, Data Scientist, AI/ML Engineer, IT Professional
✅ Pure Sciences: Physicist, Chemist, Biologist, Research Scientist
✅ Science programs: B.Tech, MBBS, B.Sc, BCA, Pharmacy
✅ Science entrance exams: JEE Main/Advanced, NEET, BITSAT, AIIMS

**WHAT NOT TO RECOMMEND:**
❌ NO Pure Arts careers (Writer, Journalist, Artist, Filmmaker)
❌ NO Law careers (Lawyer, Legal Advisor)
❌ NO Pure Commerce careers (CA without engineering, Business Management)
❌ NO Arts programs (BA, BFA, LLB without science component)

` : streamCategory === 'commerce' ? `
### 💼 COMMERCE STREAM - MANDATORY REQUIREMENTS

This student is in the COMMERCE stream. Your career recommendations MUST reflect this:

**WHAT TO RECOMMEND:**
✅ Finance & Accounting: CA, CFA, Financial Analyst, Investment Banker
✅ Business: MBA, Business Manager, Entrepreneur, Marketing Professional
✅ Banking: Bank Manager, Actuary, Risk Analyst
✅ Commerce programs: B.Com, BBA, CA, CMA, MBA
✅ Commerce entrance exams: CA Foundation, CUET Commerce, IPM, BBA entrance

**WHAT NOT TO RECOMMEND:**
❌ NO Pure Engineering careers (Mechanical, Civil, Electrical Engineer)
❌ NO Medical careers (Doctor, Dentist, Pharmacist)
❌ NO Pure Arts careers (Writer, Journalist, Artist)
❌ NO Science programs (B.Tech, MBBS, B.Sc)

` : ''}
` : '';

  return `You are an expert career counselor for higher secondary students (grades 11-12). These students have already chosen their academic stream and are preparing for college entrance exams and career decisions.
${streamSpecificInstructions}

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## STUDENT CONTEXT
- **Grade Level**: Higher Secondary (11th or 12th grade)
- **Stream**: ${assessmentData.stream}
- **Assessment Type**: Comprehensive 6-section career assessment

## ⚠️ CRITICAL REQUIREMENT: USE ALL 6 ASSESSMENT SECTIONS

This student completed a comprehensive assessment with 6 sections. You MUST use data from ALL 6 sections when generating career clusters:

1. **RIASEC** (Career Interests) - Primary factor for career family identification
2. **Aptitude** (Cognitive Abilities) - Validates cognitive fit for careers
3. **Big Five** (Personality) - Determines work style and personality fit
4. **Work Values** (Motivators) - Ensures career aligns with what drives them
5. **Employability** (Job Readiness) - Assesses current skill level and readiness
6. **Knowledge** (Stream Expertise) - Validates academic preparation in their chosen stream

**Each career cluster MUST include evidence from ALL 6 sections in the evidence field.**

## RIASEC Career Interest Responses (1-5 scale):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

RIASEC SCORING RULES:
- Response 1-2: 0 points
- Response 3: 1 point
- Response 4: 2 points
- Response 5: 3 points
- Maximum score per type = 24 (8 questions × 3 points max)

⚠️ CRITICAL RIASEC topThree CALCULATION:
1. Calculate the total score for each of the 6 RIASEC types (R, I, A, S, E, C)
2. Sort ALL 6 types by their scores in DESCENDING order (highest first)
3. The "topThree" array MUST contain the 3 types with the HIGHEST scores
4. Calculate percentage for each type: (score / 20) × 100
5. Identify which types have scores >= 60% (strong interests)
6. DO NOT guess or assume - calculate from the actual responses above

## MULTI-APTITUDE BATTERY RESULTS:
Pre-calculated Scores:
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8}
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8}
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8}
- Spatial: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6}
- Clerical: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20}

## Big Five Personality Responses:
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

## Work Values & Motivators Responses:
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

## Employability Skills Responses:
${JSON.stringify(assessmentData.employabilityAnswers, null, 2)}

## Stream Knowledge Assessment:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}
Total Questions: ${assessmentData.totalKnowledgeQuestions || 20}

## CAREER CLUSTER GENERATION REQUIREMENTS

For higher secondary students, career clusters MUST:

1. **Align with their chosen stream** (${assessmentData.stream})
2. **Show evidence from ALL 6 sections** (not just 3)
3. **Be specific and actionable** for college major selection
4. **Include entrance exam guidance** (JEE, NEET, CLAT, etc.)
5. **Reflect their current academic preparation** (knowledge scores)

### Required Evidence Structure:

Each career cluster MUST include:

\`\`\`json
"evidence": {
  "interest": "<How RIASEC scores support this career path>",
  "aptitude": "<Which cognitive strengths (verbal/numerical/abstract/spatial) make them a good fit>",
  "personality": "<Big Five traits that align with success in this field>",
  "values": "<How their work values align with this career (e.g., helping others, creativity, financial security)>",
  "employability": "<Current skill level and readiness for this path>",
  "knowledge": "<How their stream knowledge (${assessmentData.stream}) prepares them for this career>"
}
\`\`\`

### Career Cluster Mapping by Stream:

**Science PCMB:**
- Healthcare & Medicine (Doctor, Medical Researcher, Biotechnologist)
- Life Sciences & Research (Geneticist, Microbiologist, Pharmaceutical Scientist)
- Biomedical Engineering (Medical Device Designer, Biotech Engineer)

**Science PCMS:**
- Technology & Software (Software Engineer, AI/ML Engineer, Data Scientist)
- Engineering & Innovation (Systems Engineer, Robotics Engineer, Tech Architect)
- Research & Development (Computer Scientist, Algorithm Designer, Tech Researcher)

**Science PCM:**
- Core Engineering (Mechanical, Civil, Electrical, Aerospace Engineer)
- Architecture & Design (Architect, Urban Planner, Structural Designer)
- Defense & Aviation (Defense Engineer, Pilot, Aerospace Scientist)

**Commerce with Maths:**
- Finance & Accounting (CA, CFA, Financial Analyst, Investment Banker)
- Banking & Insurance (Bank Manager, Actuary, Risk Analyst)
- Business Analytics (Data Analyst, Business Intelligence, Market Researcher)

**Commerce without Maths:**
- Business Management (MBA, Business Manager, Entrepreneur)
- Marketing & Sales (Marketing Manager, Brand Strategist, Sales Director)
- Human Resources (HR Manager, Talent Acquisition, Organizational Development)

**Arts with Psychology:**
- Psychology & Counseling (Clinical Psychologist, Counselor, Therapist)
- Social Work (Social Worker, Community Development, NGO Management)
- Human Behavior Research (UX Researcher, Behavioral Scientist, Market Psychologist)

**Arts with Economics:**
- Economics & Policy (Economist, Policy Analyst, Economic Researcher)
- Journalism & Media (Economic Journalist, Financial Reporter, Content Strategist)
- Public Administration (Civil Services, Policy Advisor, Government Economist)

**Arts General:**
- Creative Arts (Writer, Designer, Artist, Filmmaker)
- Education & Teaching (Teacher, Professor, Education Consultant)
- Law & Humanities (Lawyer, Legal Researcher, Human Rights Advocate)

## ⚠️ CRITICAL: COMPLETE RESPONSE REQUIRED

You MUST include ALL sections in your response. DO NOT truncate or skip any sections.

**MANDATORY SECTIONS (ALL REQUIRED):**
1. ✅ profileSnapshot
2. ✅ riasec
3. ✅ aptitude
4. ✅ bigFive
5. ✅ workValues
6. ✅ employability (REQUIRED - DO NOT SKIP)
7. ✅ knowledge (REQUIRED - DO NOT SKIP)
8. ✅ careerFit (with 3 clusters, each with evidence from ALL 6 sections)
9. ✅ skillGap (REQUIRED - DO NOT SKIP)
10. ✅ roadmap (REQUIRED - DO NOT SKIP)
11. ✅ finalNote (REQUIRED - DO NOT SKIP)
12. ✅ overallSummary

**If you skip employability, knowledge, skillGap, roadmap, or finalNote, your response is INCOMPLETE and INVALID!**

## OUTPUT FORMAT

Return ONLY a JSON object (no markdown). Use this exact structure:

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<What they enjoy based on RIASEC>",
      "strength": "<Their aptitude strengths>",
      "workStyle": "<How they work - from Big Five>",
      "motivation": "<What drives them - from Work Values>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength 1>", "percentile": "<Percentile>"},
      {"name": "<Strength 2>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "topThree": ["<Type 1>", "<Type 2>", "<Type 3>"],
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 24,
    "code": "<3-letter Holland Code>",
    "interpretation": "<2-3 sentences about career implications>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": 0, "total": 8, "percentage": 0},
      "numerical": {"correct": 0, "total": 8, "percentage": 0},
      "abstract": {"correct": 0, "total": 8, "percentage": 0},
      "spatial": {"correct": 0, "total": 6, "percentage": 0},
      "clerical": {"correct": 0, "total": 20, "percentage": 0}
    },
    "topStrengths": ["<Strength 1>", "<Strength 2>"],
    "overallScore": 0,
    "interpretation": "<How their cognitive profile fits their stream and career goals>"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "traits": {
      "openness": {"score": 3.5, "description": "<How this affects career fit>"},
      "conscientiousness": {"score": 3.2, "description": "<Work ethic implications>"},
      "extraversion": {"score": 3.8, "description": "<Social interaction preferences>"},
      "agreeableness": {"score": 4.0, "description": "<Team collaboration style>"},
      "neuroticism": {"score": 2.5, "description": "<Stress management approach>"}
    },
    "workStyleSummary": "<How their personality shapes their ideal work environment>"
  },
  "workValues": {
    "topThree": [
      {"value": "<Value 1>", "score": 4.5, "description": "<Why this matters for career choice>"},
      {"value": "<Value 2>", "score": 4.2, "description": "<Career implications>"},
      {"value": "<Value 3>", "score": 4.0, "description": "<How to satisfy this value>"}
    ],
    "scores": {
      "achievement": 4.0,
      "independence": 3.5,
      "recognition": 3.8,
      "relationships": 4.2,
      "support": 3.7,
      "workingConditions": 3.9
    },
    "interpretation": "<How their values should guide career decisions>"
  },
  "employability": {
    "skillScores": {
      "communication": 4.0,
      "teamwork": 3.8,
      "problemSolving": 4.2,
      "criticalThinking": 3.9,
      "adaptability": 3.7,
      "leadership": 3.5,
      "digitalLiteracy": 4.1,
      "timeManagement": 3.6
    },
    "strengthAreas": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "developmentAreas": ["<Skill to improve 1>", "<Skill to improve 2>"],
    "overallReadiness": 75,
    "readinessLevel": "<Beginner/Intermediate/Advanced>",
    "recommendation": "<Specific steps to improve employability>"
  },
  "knowledge": {
    "score": 75,
    "correctCount": 15,
    "totalQuestions": 20,
    "percentage": 75,
    "strongTopics": ["<Topic 1>", "<Topic 2>", "<Topic 3>"],
    "weakTopics": ["<Topic 1>", "<Topic 2>"],
    "streamAlignment": "<How well their knowledge aligns with their chosen stream>",
    "recommendation": "<Specific topics to focus on for entrance exams>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<Career Cluster 1 - MUST align with ${assessmentData.stream}>",
        "fit": "High",
        "matchScore": 85,
        "description": "<3-4 sentences explaining WHY this fits based on ALL 6 assessment sections>",
        "evidence": {
          "interest": "<RIASEC evidence - REQUIRED>",
          "aptitude": "<Aptitude evidence - REQUIRED>",
          "personality": "<Big Five evidence - REQUIRED>",
          "values": "<Work Values evidence - REQUIRED>",
          "employability": "<Employability evidence - REQUIRED>",
          "knowledge": "<Knowledge/Stream evidence - REQUIRED>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>", "<Entry role 3>"],
          "mid": ["<Mid role 1>", "<Mid role 2>", "<Mid role 3>"]
        },
        "domains": ["<Domain 1>", "<Domain 2>", "<Domain 3>"],
        "whyItFits": "<Detailed explanation connecting their complete profile to this career>",
        "entranceExams": ["<Exam 1>", "<Exam 2>"],
        "collegeMajors": ["<Major 1>", "<Major 2>", "<Major 3>"],
        "preparationFocus": "<What to focus on in 11th/12th for this career path>"
      },
      {
        "title": "<Career Cluster 2>",
        "fit": "Medium",
        "matchScore": 75,
        "description": "<Explanation based on all 6 sections>",
        "evidence": {
          "interest": "<RIASEC evidence>",
          "aptitude": "<Aptitude evidence>",
          "personality": "<Personality evidence>",
          "values": "<Values evidence>",
          "employability": "<Employability evidence>",
          "knowledge": "<Knowledge evidence>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>"],
          "mid": ["<Mid role 1>", "<Mid role 2>"]
        },
        "domains": ["<Domain 1>", "<Domain 2>"],
        "whyItFits": "<Connection to their profile>",
        "entranceExams": ["<Exam 1>"],
        "collegeMajors": ["<Major 1>", "<Major 2>"],
        "preparationFocus": "<Preparation guidance>"
      },
      {
        "title": "<Career Cluster 3>",
        "fit": "Explore",
        "matchScore": 65,
        "description": "<Why worth exploring>",
        "evidence": {
          "interest": "<RIASEC evidence>",
          "aptitude": "<Aptitude evidence>",
          "personality": "<Personality evidence>",
          "values": "<Values evidence>",
          "employability": "<Employability evidence>",
          "knowledge": "<Knowledge evidence>"
        },
        "roles": {
          "entry": ["<Entry role 1>", "<Entry role 2>"],
          "mid": ["<Mid role 1>"]
        },
        "domains": ["<Domain 1>"],
        "whyItFits": "<Potential fit explanation>",
        "entranceExams": ["<Exam 1>"],
        "collegeMajors": ["<Major 1>"],
        "preparationFocus": "<What to explore>"
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "<Career 1>", "salary": {"min": 4, "max": 12}},
        {"name": "<Career 2>", "salary": {"min": 4, "max": 10}},
        {"name": "<Career 3>", "salary": {"min": 3, "max": 8}}
      ],
      "mediumFit": [
        {"name": "<Career 1>", "salary": {"min": 3, "max": 8}},
        {"name": "<Career 2>", "salary": {"min": 3, "max": 7}}
      ],
      "exploreLater": [
        {"name": "<Career 1>", "salary": {"min": 3, "max": 7}},
        {"name": "<Career 2>", "salary": {"min": 2, "max": 6}}
      ]
    }
  },
  "skillGap": {
    "currentStrengths": ["<Skill 1>", "<Skill 2>", "<Skill 3>"],
    "priorityA": [
      {
        "skill": "<Critical skill for their career path>",
        "currentLevel": 2,
        "targetLevel": 4,
        "whyNeeded": "<Why this skill is essential for their target careers>",
        "howToBuild": "<Specific action steps to develop this skill>"
      }
    ],
    "priorityB": [
      {
        "skill": "<Important skill>",
        "currentLevel": 2,
        "targetLevel": 3,
        "whyNeeded": "<Importance explanation>",
        "howToBuild": "<Development steps>"
      }
    ],
    "learningTracks": [
      {
        "track": "<Track name>",
        "suggestedIf": "<Condition>",
        "topics": "<Topics to learn>"
      }
    ],
    "recommendedTrack": "<Best track for their profile>"
  },
  "roadmap": {
    "immediate": {
      "title": "Next 3 Months (11th/12th Grade Focus)",
      "goals": ["<Goal 1>", "<Goal 2>", "<Goal 3>"],
      "actions": ["<Action 1>", "<Action 2>", "<Action 3>"],
      "entranceExamPrep": "<Specific exam preparation guidance>"
    },
    "shortTerm": {
      "title": "6-12 Months (College Preparation)",
      "goals": ["<Goal 1>", "<Goal 2>"],
      "actions": ["<Action 1>", "<Action 2>"],
      "collegeApplications": "<Application strategy>"
    },
    "projects": [
      {
        "title": "<Project 1>",
        "description": "<Detailed description>",
        "skills": ["<Skill 1>", "<Skill 2>"],
        "timeline": "<Timeline>",
        "difficulty": "<Level>",
        "purpose": "<Why this project matters>",
        "output": "<Deliverable>",
        "steps": ["<Step 1>", "<Step 2>", "<Step 3>"],
        "resources": ["<Resource 1>", "<Resource 2>"]
      }
    ]
  },
  "finalNote": {
    "advantage": "<Their strongest competitive advantage>",
    "growthFocus": "<Key area to focus on>",
    "collegeGuidance": "<Specific guidance for college major selection>",
    "entranceExamStrategy": "<Strategy for entrance exams based on their profile>"
  },
  "overallSummary": "<3-4 sentences summarizing their career readiness, unique strengths, and clear next steps for college preparation>"
}

## CRITICAL VALIDATION CHECKLIST

Before returning your response, verify:

1. ✅ **employability section is included** (skillScores, strengthAreas, developmentAreas, overallReadiness, recommendation)
2. ✅ **knowledge section is included** (score, correctCount, strongTopics, weakTopics, streamAlignment, recommendation)
3. ✅ **skillGap section is included** (currentStrengths, priorityA, priorityB, learningTracks, recommendedTrack)
4. ✅ **roadmap section is included** (immediate, shortTerm, projects)
5. ✅ **finalNote section is included** (advantage, growthFocus, collegeGuidance, entranceExamStrategy)
6. ✅ Each career cluster has evidence from ALL 6 sections (interest, aptitude, personality, values, employability, knowledge)
7. ✅ Career clusters align with the student's stream (${assessmentData.stream})
8. ✅ Entrance exams and college majors are specified for each cluster
9. ✅ All 3 career clusters are provided with complete information
10. ✅ Salary ranges are realistic for India (2025-2030)
11. ✅ Preparation guidance is specific to 11th/12th grade students
12. ✅ The response is personalized based on THEIR specific scores, not generic

**CRITICAL: If employability, knowledge, skillGap, roadmap, or finalNote sections are missing, YOUR RESPONSE IS INCOMPLETE AND INVALID!**

**DO NOT TRUNCATE THE RESPONSE - Complete all sections before ending the JSON object!**`;
}
