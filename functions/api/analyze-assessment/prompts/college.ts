/**
 * College Assessment Prompt Builder
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): string {
  const level = results.aptitudeLevel;
  const accuracy = results.overallAccuracy;

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
## ADAPTIVE APTITUDE TEST RESULTS:
- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- No standout strengths identified'}

**AREAS FOR GROWTH**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant weak areas'}

**IMPORTANT**: Use these adaptive test results as ADDITIONAL evidence when generating career clusters.`;

  return section;
}

/**
 * Build degree-level specific instructions
 */
function buildDegreeLevelInstructions(degreeLevel: string | undefined, programName: string | undefined): string {
  if (degreeLevel === 'postgraduate') {
    return `
### ⚠️ POSTGRADUATE STUDENT - SPECIAL INSTRUCTIONS ⚠️

This student is pursuing a POSTGRADUATE degree (Master's/PG Diploma). Your recommendations MUST reflect this:

**MANDATORY REQUIREMENTS:**
1. **NO Undergraduate Programs**: Do NOT recommend Bachelor's degrees (B.Tech, BCA, B.Sc, etc.)
2. **Entry-Level Roles for Fresh PG Graduates**: Focus on roles accessible to fresh Master's graduates (Junior Scientist, Research Associate, Analyst, etc.)
3. **Salary Expectations**: Research actual market rates for the specific role and field (varies by industry, location, and specialization)
4. **Specialized Skills**: Recommend certifications relevant to their Master's specialization
5. **Industry-Specific Roles**: Match recommendations to their field of study

**CAREER TITLE RULES FOR POSTGRADUATE:**
- ✅ CORRECT: "Research Scientist", "Data Scientist", "Business Analyst", "Product Manager", "Research Associate"
- ✅ CORRECT: Entry-level roles that typically require/prefer Master's degree
- ❌ WRONG: "Senior Scientist", "Lead Engineer", "Director", "VP" (these require 5+ years experience)
- ❌ WRONG: "Junior Developer", "Trainee" (these are for Bachelor's graduates)

**FILTERING RULES (STRICTLY ENFORCE):**
- ❌ Remove any "Complete your Bachelor's degree" suggestions
- ❌ Remove any UG program recommendations
- ✅ Include roles that value/require PG qualifications
- ✅ Include specialized certifications relevant to Master's level
- ✅ Adjust salary ranges to fresh PG graduate level
`;
  }

  if (degreeLevel === 'undergraduate') {
    return `
### 📚 UNDERGRADUATE STUDENT INSTRUCTIONS

This student is pursuing an UNDERGRADUATE degree (Bachelor's).

**RECOMMENDATIONS SHOULD INCLUDE:**
1. **Entry-Level Roles**: Focus on campus placements and fresher positions
2. **Salary Expectations**: Research actual market rates for the specific role, field, and location (varies significantly)
3. **Foundational Skills**: Basic to intermediate certifications
4. **Internship Opportunities**: Emphasize internships and training programs
5. **Career Growth Path**: Show progression from entry to mid-level
6. **Program Alignment**: ALL career clusters must be related to their ${programName || 'chosen'} program
`;
  }

  if (degreeLevel === 'diploma') {
    return `
### 🔧 DIPLOMA STUDENT INSTRUCTIONS

This student is pursuing a DIPLOMA program.

**RECOMMENDATIONS SHOULD INCLUDE:**
1. **Technical/Vocational Roles**: Focus on hands-on, skill-based positions
2. **Salary Expectations**: Research actual market rates for the specific role and industry (varies by skill level)
3. **Industry Certifications**: Practical, industry-recognized certifications
4. **Skill Development**: Emphasize technical skills and on-the-job training
5. **Career Pathways**: Show how to progress to higher qualifications if desired
6. **Program Alignment**: ALL career clusters must be related to their ${programName || 'chosen'} program
`;
  }

  return '';
}

/**
 * Build program analysis instructions (dynamic, not hardcoded)
 */
function buildProgramAnalysisSection(): string {
  return `
## PROGRAM-TO-CAREER ANALYSIS INSTRUCTIONS

**DO NOT rely on hardcoded mappings.** Instead, dynamically analyze the student's program:

1. **Identify the Program Domain:**
   - Parse the program name/code to identify the field (e.g., "M.Sc Data Science" → Data Science/Analytics)
   - Recognize common abbreviations (B.Tech, M.Tech, BBA, MBA, B.Pharm, MBBS, LLB, etc.)
   - Understand the specialization within the domain

2. **Generate Career Recommendations Based on Program:**
   - **Cluster 1 (High Fit)**: Core careers directly aligned with the program's primary focus
   - **Cluster 2 (Medium Fit)**: Adjacent careers that leverage the program's skills in related domains
   - **Cluster 3 (Explore)**: Interdisciplinary careers that still use the program's core competencies

3. **Consider Degree Level for Seniority:**
   - Diploma → Entry-level, technical/hands-on roles
   - Undergraduate (B.Tech, BCA, B.Sc, etc.) → Entry to junior level positions
   - Postgraduate (M.Tech, MBA, M.Sc, etc.) → Mid to senior level positions

4. **Match Salary Ranges to Field Standards:**
   - Research typical salary ranges for the specific field in India
   - Adjust based on degree level and specialization

5. **Recommend Relevant Certifications:**
   - Identify industry-recognized certifications for the program field
   - Match certification level to degree level (basic for UG, advanced for PG)

**CRITICAL**: Career clusters must be derived from the actual program name provided, NOT from generic templates.
`;
}


/**
 * Build validation rules section
 */
function buildValidationRulesSection(): string {
  return `
## CRITICAL VALIDATION RULES

**MANDATORY:**
- ✅ Ensure ALL 3 career clusters are related to the student's program field
- ✅ Match salary ranges to the field's industry standards
- ✅ Recommend certifications relevant to the field
- ✅ Consider degree level (UG = entry-level, PG = mid-senior level)

**PROHIBITED:**
- ❌ Recommend careers from completely unrelated fields
- ❌ Ignore the program information and give generic recommendations
- ❌ Recommend UG programs to PG students or vice versa
`;
}

export function buildCollegePrompt(assessmentData: AssessmentData, answersHash: number): string {
  // Pre-process adaptive results for efficiency
  const adaptiveSection = assessmentData.adaptiveAptitudeResults
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : '';

  // Student context for program-specific recommendations
  const studentContext = assessmentData.studentContext;
  const hasStudentContext = studentContext && (studentContext.rawGrade || studentContext.programName || studentContext.degreeLevel);

  // 🔍 DEBUG: Log student context
  console.log('[COLLEGE-PROMPT] === STUDENT CONTEXT DEBUG ===');
  console.log('[COLLEGE-PROMPT] Has studentContext:', !!studentContext);
  console.log('[COLLEGE-PROMPT] rawGrade:', studentContext?.rawGrade);
  console.log('[COLLEGE-PROMPT] programName:', studentContext?.programName);
  console.log('[COLLEGE-PROMPT] programCode:', studentContext?.programCode);
  console.log('[COLLEGE-PROMPT] degreeLevel:', studentContext?.degreeLevel);
  console.log('[COLLEGE-PROMPT] hasStudentContext:', hasStudentContext);

  // Build student context section
  const studentContextSection = hasStudentContext ? `
## 🎓 STUDENT ACADEMIC CONTEXT (CRITICAL - READ CAREFULLY)

**Current Academic Level**: ${studentContext.rawGrade || 'Not specified'}
**Program/Course**: ${studentContext.programName || 'Not specified'}
**Program Code**: ${studentContext.programCode || 'Not specified'}
**Degree Level**: ${studentContext.degreeLevel || 'Not specified'}

${buildDegreeLevelInstructions(studentContext.degreeLevel ?? undefined, studentContext.programName ?? undefined)}

**Program Field Alignment:**

🚨🚨🚨 CRITICAL - PROGRAM ALIGNMENT IS ABSOLUTELY MANDATORY 🚨🚨🚨

The student is studying **${studentContext.programName || 'their chosen program'}**. 

**YOU MUST GENERATE CAREER RECOMMENDATIONS THAT ARE 100% ALIGNED WITH THIS PROGRAM.**

**IF YOU IGNORE THE PROGRAM AND RECOMMEND UNRELATED CAREERS, YOUR RESPONSE WILL BE REJECTED.**

**MANDATORY STEP-BY-STEP PROCESS (FOLLOW EXACTLY):**

**STEP 1: IDENTIFY THE PROGRAM FIELD**
   - Extract the EXACT field from "${studentContext.programName || 'the program'}"
   - Is it Physics? Chemistry? Computer Science? Business? Engineering? Medicine? Law?
   - Write down the field: _________________

**STEP 2: LIST CAREERS IN THAT FIELD**
   - List 15-20 careers that are DIRECTLY related to this field
   - These careers should be what graduates of this program typically pursue
   - DO NOT list careers from other fields

**STEP 3: CREATE 3 CAREER CLUSTERS FROM YOUR LIST**
   - **Cluster 1 (High Fit)**: Top 3-5 careers from your list that are CORE to the field
   - **Cluster 2 (Medium Fit)**: 3-5 careers from your list that are ADJACENT to the field
   - **Cluster 3 (Explore)**: 3-5 careers from your list that are INTERDISCIPLINARY but still use field skills

**STEP 4: FINAL VALIDATION (MANDATORY)**
   Before returning your response, answer these questions:
   
   ✅ Question 1: Are ALL 3 career clusters related to "${studentContext.programName || 'the program'}"?
      - If NO → GO BACK TO STEP 2 and start over
   
   ✅ Question 2: Would a graduate of "${studentContext.programName || 'the program'}" realistically pursue these careers?
      - If NO → GO BACK TO STEP 2 and start over
   
   ✅ Question 3: Did you avoid generic careers (Creative Arts, Social Work, NGO, Teaching) unless the program is specifically in those fields?
      - If NO → GO BACK TO STEP 2 and start over
   
   ⚠️ IMPORTANT VALIDATION NOTES:
      - Career clusters must align with BOTH the program field AND the student's RIASEC profile
      - If a Physics student has high Artistic (A) scores, consider creative physics careers (science communication, visualization, education)
      - If a CS student has high Social (S) scores, consider people-focused tech careers (UX research, tech education, product management)
      - Balance program relevance with personal interests - don't force mismatched careers

**NAMING RULES FOR CAREER CLUSTER TITLES:**
   - ✅ PREFERRED: Entry-level role names (e.g., "Data Scientist", "Research Scientist", "Software Developer")
   - ✅ ACCEPTABLE: Generic cluster names when multiple related roles fit (e.g., "Technology & Innovation", "Scientific Research")
   - ❌ WRONG: Senior role names (e.g., "Senior Engineer", "Manager", "Director")
   - The title should represent roles accessible to fresh graduates or early-career professionals
` : '';

  // Always include program analysis and validation for college students
  const programAnalysisSection = buildProgramAnalysisSection();
  const validationRulesSection = buildValidationRulesSection();

  // 🔍 DEBUG: Log if student context section was included
  console.log('[COLLEGE-PROMPT] === PROMPT ASSEMBLY DEBUG ===');
  console.log('[COLLEGE-PROMPT] Student context section included:', !!studentContextSection);
  if (studentContextSection) {
    console.log('[COLLEGE-PROMPT] Student context section length:', studentContextSection.length);
    console.log('[COLLEGE-PROMPT] Program name in prompt:', studentContext?.programName);
  }
  console.log('[COLLEGE-PROMPT] === END PROMPT ASSEMBLY ===');

  return `You are a career counselor and psychometric assessment expert. Analyze the following student assessment data and provide comprehensive results.

## CONSISTENCY REQUIREMENT - CRITICAL:
This analysis must be DETERMINISTIC and CONSISTENT. Given the same input data, you must ALWAYS produce the SAME output.
- Use ONLY the provided data to make calculations - do not introduce randomness
- Calculate scores using EXACT mathematical formulas provided below
- Career recommendations must be derived DIRECTLY from the calculated scores
- If this same data is analyzed again, the results MUST be identical
- Session ID for consistency verification: ${answersHash}

## Student Grade Level: ${assessmentData.gradeLevel.toUpperCase()}
## Student Stream: ${assessmentData.stream.toUpperCase()}
${studentContextSection}
${programAnalysisSection}
${validationRulesSection}

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
4. The "code" string MUST be these 3 letters joined (e.g., if C=19, E=17, S=15, then code="CES")
5. VERIFY: The first letter in topThree MUST have the highest score, second letter the second-highest, etc.
6. DO NOT guess or assume - calculate from the actual responses above

## ⚠️ CRITICAL: RIASEC-ALIGNED CAREER MATCHING ⚠️

**YOU MUST align career recommendations with the student's top RIASEC types:**

**RIASEC Type Definitions:**
- **R (Realistic)**: Hands-on, technical, mechanical work; working with tools, machines, or physical objects
- **I (Investigative)**: Research, analysis, problem-solving; scientific, mathematical, or intellectual work
- **A (Artistic)**: Creative expression, design, arts; working with ideas, aesthetics, and innovation
- **S (Social)**: Helping, teaching, counseling; working with people to support, educate, or care
- **E (Enterprising)**: Leadership, persuasion, business; managing, selling, or influencing others
- **C (Conventional)**: Organization, data management, detail work; structured, systematic tasks

**MANDATORY RIASEC ALIGNMENT RULES:**

1. **Identify the student's top 3 RIASEC types** from their assessment scores
2. **Generate career clusters that match these types** - don't default to generic tech/business careers
3. **For Artistic (A) students**: Include creative careers (design, media, arts, content creation, entertainment)
4. **For Social (S) students**: Include people-focused careers (counseling, teaching, HR, healthcare, social work)
5. **For Realistic (R) students**: Include hands-on careers (engineering, trades, technical roles, manufacturing)
6. **For Investigative (I) students**: Include research/analytical careers (science, data analysis, research)
7. **For Enterprising (E) students**: Include business/leadership careers (management, sales, entrepreneurship)
8. **For Conventional (C) students**: Include structured careers (accounting, administration, operations)

**DO NOT ignore the student's RIASEC profile!**
**Career recommendations MUST reflect their actual interests, not just their academic program.**

## MULTI-APTITUDE BATTERY RESULTS:
Pre-calculated Scores:
- Verbal: ${assessmentData.aptitudeScores?.verbal?.correct || 0}/${assessmentData.aptitudeScores?.verbal?.total || 8}
- Numerical: ${assessmentData.aptitudeScores?.numerical?.correct || 0}/${assessmentData.aptitudeScores?.numerical?.total || 8}
- Abstract: ${assessmentData.aptitudeScores?.abstract?.correct || 0}/${assessmentData.aptitudeScores?.abstract?.total || 8}
- Spatial: ${assessmentData.aptitudeScores?.spatial?.correct || 0}/${assessmentData.aptitudeScores?.spatial?.total || 6}
- Clerical: ${assessmentData.aptitudeScores?.clerical?.correct || 0}/${assessmentData.aptitudeScores?.clerical?.total || 20}

**APTITUDE SCORING INSTRUCTIONS** (CRITICAL - READ CAREFULLY):

**YOU MUST USE THE PRE-CALCULATED SCORES ABOVE - DO NOT RECALCULATE!**

The aptitude scores have already been calculated from the adaptive aptitude test results.
Simply copy the scores above into your response:

1. Copy the "correct" and "total" values for each category (verbal, numerical, abstract, spatial, clerical)
2. Calculate percentage: (correct / total) * 100, rounded to nearest integer
3. DO NOT try to score from answers - the scores are already provided above

**Example**:
- If Verbal shows: 1/8
- Then your response should have: {"correct": 1, "total": 8, "percentage": 13}

**VALIDATION**: The scores you return MUST match the pre-calculated scores shown above.

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

## Work Values Responses:
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

## Employability Skills:
Self-Rating: ${JSON.stringify(assessmentData.employabilityAnswers?.selfRating || {}, null, 2)}
SJT: ${JSON.stringify(assessmentData.employabilityAnswers?.sjt || [], null, 2)}

## Knowledge Test Results:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

${adaptiveSection}

## Section Timings:
${JSON.stringify(assessmentData.sectionTimings, null, 2)}

---

**CRITICAL REMINDER BEFORE RESPONDING:**

1. **APTITUDE SCORES**: Use the pre-calculated scores from "MULTI-APTITUDE BATTERY RESULTS" section above
   - DO NOT calculate from answers
   - Copy the "correct" and "total" values exactly as shown
   - Calculate percentage: (correct/total) * 100

2. **BIG FIVE SCORES**: Calculate AVERAGE (not sum) from responses - must be 1.0 to 5.0

3. **WORK VALUES SCORES**: Calculate AVERAGE (not sum) from responses - must be 1.0 to 5.0

Return ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "<Pattern>",
      "strength": "<Pattern>",
      "workStyle": "<Pattern>",
      "motivation": "<Pattern>"
    },
    "aptitudeStrengths": [
      {"name": "<Strength>", "percentile": "<Percentile>"}
    ]
  },
  "riasec": {
    "scores": {"R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0},
    "maxScore": 24,
    "code": "<3-letter code>",
    "topThree": ["<letter>", "<letter>", "<letter>"],
    "interpretation": "<2-3 sentences>"
  },
  "aptitude": {
    "scores": {
      "verbal": {"correct": <USE_PRE_CALCULATED>, "total": <USE_PRE_CALCULATED>, "percentage": <CALCULATE_FROM_CORRECT_TOTAL>},
      "numerical": {"correct": <USE_PRE_CALCULATED>, "total": <USE_PRE_CALCULATED>, "percentage": <CALCULATE_FROM_CORRECT_TOTAL>},
      "abstract": {"correct": <USE_PRE_CALCULATED>, "total": <USE_PRE_CALCULATED>, "percentage": <CALCULATE_FROM_CORRECT_TOTAL>},
      "spatial": {"correct": <USE_PRE_CALCULATED>, "total": <USE_PRE_CALCULATED>, "percentage": <CALCULATE_FROM_CORRECT_TOTAL>},
      "clerical": {"correct": <USE_PRE_CALCULATED>, "total": <USE_PRE_CALCULATED>, "percentage": <CALCULATE_FROM_CORRECT_TOTAL>}
    },
    "overallScore": 0,
    "topStrengths": ["<strength>"],
    "areasToImprove": ["<area>"],
    "cognitiveProfile": "<2-3 sentences>",
    "careerImplications": "<1-2 sentences>"
  },
  "bigFive": {
    "O": 0, "C": 0, "E": 0, "A": 0, "N": 0,
    "dominantTraits": ["<trait>"],
    "workStyleSummary": "<2-3 sentences>"
  },
  "workValues": {
    "scores": {"Security": 0, "Autonomy": 0, "Creativity": 0, "Status": 0, "Impact": 0, "Financial": 0, "Leadership": 0, "Lifestyle": 0},
    "topThree": [
      {"value": "<value>", "score": 0}
    ],
    "motivationSummary": "<2-3 sentences>"
  },
  "employability": {
    "skillScores": {"Communication": 0, "Teamwork": 0, "ProblemSolving": 0, "Adaptability": 0, "Leadership": 0, "DigitalFluency": 0, "Professionalism": 0, "CareerReadiness": 0},
    "sjtScore": 0,
    "overallReadiness": "<High/Medium/Low>",
    "strengthAreas": ["<skill>"],
    "improvementAreas": ["<skill>"]
  },
  "knowledge": {
    "score": 0,
    "correctCount": 0,
    "totalQuestions": 0,
    "strongTopics": ["<topic>"],
    "weakTopics": ["<topic>"],
    "recommendation": "<1-2 sentences>"
  },
  "careerFit": {
    "clusters": [
      {
        "title": "<ENTRY-LEVEL ROLE OR CAREER CLUSTER - e.g., 'Software Developer', 'Data Analyst', 'Technology & Innovation' - REQUIRED>",
        "fit": "High",
        "matchScore": "<CALCULATE DYNAMICALLY 80-100 based on RIASEC + aptitude + program fit - DO NOT USE 85>",
        "description": "<2-3 sentences explaining WHY this fits based on assessment - REQUIRED>",
        "evidence": {
          "interest": "<RIASEC evidence - REQUIRED>",
          "aptitude": "<Aptitude evidence - REQUIRED>",
          "personality": "<Big Five personality evidence - REQUIRED>",
          "values": "<Work Values alignment - REQUIRED>",
          "employability": "<Employability skills evidence - REQUIRED>",
          "adaptiveAptitude": "<Adaptive test results evidence - if available>"
        },
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Specific connection to student's profile - REQUIRED>"
      },
      {
        "title": "<ENTRY-LEVEL ROLE OR CAREER CLUSTER - e.g., 'Business Analyst', 'UI/UX Designer', 'Business & Management' - REQUIRED>",
        "fit": "Medium",
        "matchScore": "<CALCULATE DYNAMICALLY 70-85 based on fit - DO NOT USE 75>",
        "description": "<2-3 sentences explaining fit - REQUIRED>",
        "evidence": {
          "interest": "<RIASEC evidence - REQUIRED>",
          "aptitude": "<Aptitude evidence - REQUIRED>",
          "personality": "<Big Five personality evidence - REQUIRED>",
          "values": "<Work Values alignment - REQUIRED>",
          "employability": "<Employability skills evidence - REQUIRED>",
          "adaptiveAptitude": "<Adaptive test results evidence - if available>"
        },
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Connection to student's profile - REQUIRED>"
      },
      {
        "title": "<ENTRY-LEVEL ROLE OR CAREER CLUSTER - e.g., 'Quality Analyst', 'Research Assistant', 'Creative Industries' - REQUIRED>",
        "fit": "Explore",
        "matchScore": "<CALCULATE DYNAMICALLY 60-75 based on fit - DO NOT USE 65>",
        "description": "<2-3 sentences explaining potential - REQUIRED>",
        "evidence": {
          "interest": "<RIASEC evidence - REQUIRED>",
          "aptitude": "<Aptitude evidence - REQUIRED>",
          "personality": "<Big Five personality evidence - REQUIRED>",
          "values": "<Work Values alignment - REQUIRED>",
          "employability": "<Employability skills evidence - REQUIRED>",
          "adaptiveAptitude": "<Adaptive test results evidence - if available>"
        },
        "roles": {"entry": ["<entry role 1>", "<entry role 2>"], "mid": ["<mid role 1>", "<mid role 2>"]},
        "domains": ["<domain 1>", "<domain 2>"],
        "whyItFits": "<Why worth exploring - REQUIRED>"
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "<role 1>", "salary": {"min": "<calculate based on role/field/location>", "max": "<calculate based on role/field/location>"}}, 
        {"name": "<role 2>", "salary": {"min": "<calculate>", "max": "<calculate>"}}, 
        {"name": "<role 3>", "salary": {"min": "<calculate>", "max": "<calculate>"}}
      ],
      "mediumFit": [
        {"name": "<role 1>", "salary": {"min": "<calculate>", "max": "<calculate>"}}, 
        {"name": "<role 2>", "salary": {"min": "<calculate>", "max": "<calculate>"}}
      ],
      "exploreLater": [
        {"name": "<role 1>", "salary": {"min": "<calculate>", "max": "<calculate>"}}, 
        {"name": "<role 2>", "salary": {"min": "<calculate>", "max": "<calculate>"}}
      ]
    }
  },
  "skillGap": {
    "currentStrengths": ["<skill>"],
    "priorityA": [{"skill": "<skill>", "currentLevel": 1, "targetLevel": 3, "whyNeeded": "<reason>", "howToBuild": "<action>"}],
    "priorityB": [{"skill": "<skill>"}],
    "learningTracks": [{"track": "<track>", "suggestedIf": "<condition>", "topics": "<topics>"}],
    "recommendedTrack": "<track>"
  },
  "roadmap": {
    "projects": [{"title": "<title>", "purpose": "<purpose>", "output": "<output>"}],
    "internship": {"types": ["<type>"], "timeline": "<timeline>", "preparation": {"resume": "<focus>", "portfolio": "<focus>", "interview": "<focus>"}},
    "exposure": {"activities": ["<activity>"], "certifications": ["<cert>"]}
  },
  "finalNote": {
    "advantage": "<advantage>",
    "growthFocus": "<focus>",
    "nextReview": "<timeline>"
  },
  "timingAnalysis": {
    "overallPace": "<Fast/Moderate/Deliberate>",
    "decisionStyle": "<Intuitive/Balanced/Analytical>",
    "confidenceIndicator": "<High/Medium/Low>",
    "sectionInsights": {"riasec": "<insight>", "personality": "<insight>", "values": "<insight>", "employability": "<insight>", "knowledge": "<insight>"},
    "recommendation": "<1-2 sentences>"
  },
  "overallSummary": "<4-5 sentences>"
}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW ALL:
1. EXACTLY 3 CAREER CLUSTERS ARE MANDATORY - You MUST provide 3 different career clusters:
   - Cluster 1: High fit (matchScore 80-100%)
   - Cluster 2: Medium fit (matchScore 70-85%)
   - Cluster 3: Explore fit (matchScore 60-75%)

**MATCH SCORE CALCULATION (MANDATORY - DO NOT USE FIXED VALUES):**
Calculate matchScore dynamically based on:
- RIASEC alignment with career (40% weight): How well top 3 RIASEC codes match career requirements
- Aptitude fit (30% weight): Cognitive strengths alignment with career demands
- Program relevance (30% weight): How directly the career relates to their program/degree

Example calculation:
- Physics student with high I+R scores → Physics Research = 90% (high RIASEC match + high program relevance)
- Physics student with high I+R scores → Data Science = 78% (good RIASEC match + medium program relevance)
- Physics student with high A scores → Creative Arts = 68% (RIASEC match but low program relevance)

**YOU MUST CALCULATE UNIQUE SCORES - DO NOT USE 85, 75, 65 FOR EVERY ASSESSMENT**

2. **CLUSTER TITLE MUST USE ENTRY-LEVEL JOB ROLE NAMES (NOT SENIOR TITLES)**:
   - ✅ CORRECT: "Research Scientist", "Data Scientist", "Software Developer", "Business Analyst", "Product Manager"
   - ✅ CORRECT: "Research Associate", "Data Analyst", "Marketing Associate", "UI/UX Designer"
   - ✅ ACCEPTABLE: "Technology & Innovation", "Scientific Research" (when multiple related entry roles fit)
   - ❌ WRONG: "Senior Engineer", "Lead Developer", "Manager", "Director", "VP", "Chief" (require 5+ years experience)
   - ❌ WRONG: "Head of", "Principal", "Architect" (senior-level titles)
   - The title should represent roles accessible to fresh graduates or early-career professionals (0-2 years experience)
3. Each cluster MUST have: title, fit, matchScore, description, evidence (all 6 fields), roles (entry + mid), domains, whyItFits
4. ALL arrays must have at least 2 items - NO empty arrays
5. ALL career clusters must have roles.entry, roles.mid, and domains filled with real job titles
6. Career clusters should be based on the student's program/degree field and assessment results
7. Use EXACT scoring formulas provided - Be DETERMINISTIC (same input = same output)
8. Provide SPECIFIC, ACTIONABLE career guidance based on the student's actual scores
9. DO NOT truncate the response - complete ALL fields`;
}
