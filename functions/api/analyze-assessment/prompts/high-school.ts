/**
 * High School (Grades 9-12) Assessment Prompt Builder - CLEAN VERSION
 * This version relies on real-time job market data instead of hardcoded career clusters
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): string {
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

  return `
## ADAPTIVE APTITUDE TEST RESULTS:
- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- Balanced across all areas'}

**AREAS FOR DEVELOPMENT**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant gaps'}

**⚠️ CRITICAL: You MUST copy these exact accuracy values into aptitude.adaptiveTest field:**
${sortedSubtags.map(s => `- ${s.name}: ${Math.round(s.accuracy)}%`).join('\n')}

**Example for JSON output:**
"adaptiveTest": {
${sortedSubtags.map(s => `  "${s.name.replace(/ /g, '_')}": {"accuracy": ${Math.round(s.accuracy)}}`).join(',\n')}
}

${isHighAptitude ? `
**⭐ HIGH-APTITUDE STUDENT** (Level ${level}, ${Math.round(accuracy)}% accuracy)
Consider competitive/prestigious paths:
- UPSC: IAS, IPS, IFS, IRS
- Defence: NDA, CDS, AFCAT
- Medical Elite: AIIMS, top medical colleges (NEET)
- Engineering Elite: IIT (JEE Advanced), ISRO, DRDO
- Legal: NLSIU, top NLUs (CLAT)
- Finance: CA, CFA, Investment Banking
- Research: PhD at IISc, IITs, international universities
` : ''}`;
}

export function buildHighSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  const adaptiveSection = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : '';

  // Extract actual grade from student context
  const studentGrade = assessmentData.studentContext?.rawGrade;
  const gradeInfo = studentGrade ? ` The student is currently in grade ${studentGrade}.` : '';
  
  // Parse grade to determine if it's 9 or 10
  let isGrade9 = false;
  let isGrade10 = false;
  
  if (studentGrade) {
    const gradeStr = String(studentGrade).toLowerCase();
    // Check for explicit grade 9
    if (gradeStr === '9' || gradeStr === 'grade 9' || gradeStr === 'class 9') {
      isGrade9 = true;
    }
    // Check for explicit grade 10
    else if (gradeStr === '10' || gradeStr === 'grade 10' || gradeStr === 'class 10') {
      isGrade10 = true;
    }
    // Check for "Grade 9/10" format (should not happen anymore, but handle as fallback)
    else if (gradeStr.includes('9/10') || gradeStr.includes('9-10')) {
      isGrade10 = true; // Default to Grade 10 behavior when range is given
    }
  }

  return `You are a career counselor for high school students (grades 9-10 ONLY). Analyze this student's career exploration assessment and provide guidance appropriate for their age and academic level.${gradeInfo}

🚨 CRITICAL: THIS PROMPT IS FOR GRADES 9-10 ONLY 🚨
This is NOT for grades 11-12 (higher secondary). Those students use a different prompt.
Focus on exploration (Grade 9) or stream decision (Grade 10) - NOT college/career placement.

${isGrade9 ? `
🚨 CRITICAL ALERT: THIS STUDENT IS IN GRADE 9 🚨

YOU MUST FOLLOW THESE MANDATORY RULES FOR GRADE 9:

**REPORT TYPE: EXPLORATORY DEVELOPMENTAL REPORT**
- This is NOT a career placement report - it's an exploration and development guide
- Avoid deterministic career conclusions - use exploratory language like "you might enjoy", "worth exploring", "could be a good fit"
- Focus on skill-building, interest exploration, and personal development
- Separate interest alignment (what they enjoy) from aptitude readiness (what they're currently good at)
- Do NOT expose backend metadata (no _timestamp, _corrected, _metadata fields in output)

1. **STREAM AWARENESS (NOT SELECTION YET)** - Every career cluster MUST include:
   - streamRequired field stating which stream(s): "Science (PCM)", "Science (PCB)", "Commerce", "Arts", or "Any stream"
   - whyThisStream field explaining WHY that stream is needed for these careers
   - Frame as "When you choose your stream after 10th, you'll need..."

2. **NO SALARY INFORMATION FOR GRADE 9**:
   - DO NOT include salary field anywhere in the output
   - DO NOT include salaryRange field in career clusters
   - Remove all salary references - this is about exploration, not compensation

3. **specificOptions MUST BE EXPLORATION ACTIVITIES, NOT JOBS**:
   - ✅ CORRECT: {"name": "Learn Graphic Design on Canva", "whyThisRole": "Helps you explore creative careers"}
   - Use specific, actionable activities: "Learn Python on Khan Academy", "Join School Art Club", "Start YouTube Channel"

4. **SEPARATE INTEREST FROM APTITUDE**:
   - In evidence section, clearly distinguish:
     * interest: "You ENJOY activities like..." (based on RIASEC)
     * aptitude: "You currently SHOW STRENGTH in..." (based on test results)

5. **USE EXPLORATORY, NON-DETERMINISTIC LANGUAGE**:
   - ✅ "You might enjoy careers in...", "Worth exploring...", "Could be a good fit if..."
   - Emphasize that this is ONE data point in their journey, not a final decision

6. **ROADMAP PHASE 4 FOCUS**:
   - Title: "Explore & Build Foundation"
   - Goals: Try different activities, discover interests, build basic skills
   - Activities: Join clubs, try hobbies, explore subjects
   - Outcome: Better understanding of what you enjoy

7. **USE SIMPLE, RELATABLE LANGUAGE**:
   - ✅ "Creative & Design Careers" NOT ❌ "Creative Industries & Media"
   - Use future-oriented language: "When you complete your education, you could become..."

8. **NO ENTRANCE EXAM DETAILS** - Do not mention JEE, NEET, CLAT, UPSC, or exam strategies

9. **NO SPECIFIC COLLEGE NAMES** - Do not mention IIT, AIIMS, NLU, or specific institutions

FAILURE TO FOLLOW THESE RULES WILL RESULT IN INCORRECT OUTPUT FOR THIS 9TH GRADER.
` : ''}${isGrade10 ? `
🚨 CRITICAL ALERT: THIS STUDENT IS IN GRADE 10 🚨

YOU MUST FOLLOW THESE MANDATORY RULES FOR GRADE 10:

**REPORT TYPE: STREAM PREPARATION REPORT**
- This is a STREAM DECISION GUIDE - help them choose Science/Commerce/Arts wisely
- Use more decisive language than grade 9, but still exploratory: "Based on your profile, Science PCM would be a strong fit"
- Focus on stream selection readiness, entrance exam awareness, and skill-building
- Separate interest alignment (what they enjoy) from aptitude readiness (what they're currently good at)
- Do NOT expose backend metadata (no _timestamp, _corrected, _metadata fields in output)

1. **STREAM SELECTION IS THE PRIMARY FOCUS** - Every career cluster MUST include:
   - streamRequired field stating which stream(s): "Science (PCM)", "Science (PCB)", "Commerce", "Arts", or "Any stream"
   - whyThisStream field explaining WHY that stream is needed for these careers
   - Frame as "You should choose [stream] because..." (more directive than grade 9)

2. **SIMPLIFIED SALARY INFORMATION ALLOWED FOR GRADE 10**:
   - ✅ You MAY include ONE simple salary range per career cluster
   - Format: "Starting ₹4-8 lakhs, growing to ₹15-30 lakhs with experience"
   - Keep it brief - this helps them understand career viability
   - DO NOT include detailed breakdowns (entry/mid/senior)

3. **specificOptions CAN INCLUDE BOTH ACTIVITIES AND AWARENESS**:
   - Mix of exploration activities AND career awareness
   - ✅ CORRECT: {"name": "Learn Python and build simple projects", "whyThisRole": "Prepares you for engineering/tech careers if you choose Science PCM"}
   - ✅ CORRECT: {"name": "Research Software Developer role", "whyThisRole": "Understand what this career involves before choosing Science stream"}
   - You MAY mention salary in whyThisRole if relevant to decision-making

4. **SEPARATE INTEREST FROM APTITUDE**:
   - In evidence section, clearly distinguish:
     * interest: "You ENJOY activities like..." (based on RIASEC)
     * aptitude: "You currently SHOW STRENGTH in..." (based on test results)
   - Be more direct about fit: "Your strong numerical aptitude (X%) makes Science PCM a good match"

5. **USE CONFIDENT BUT SUPPORTIVE LANGUAGE**:
   - ✅ "Based on your interests, you're well-suited for...", "[Stream] would open doors to careers in..."
   - ✅ "You may consider [stream] to explore careers in..."
   - ❌ AVOID: "You should choose", "You must take", "You need to"
   - Still acknowledge this is guidance based on current data, not a final decision

6. **ROADMAP PHASE 4 MUST FOCUS ON STREAM DECISION**:
   - Title: "Finalize Stream Selection & Prepare for 11th"
   - Goals: Make confident stream choice, understand entrance exams, plan subject preparation
   - Activities: Meet counselors, research streams deeply, talk to seniors, understand exam requirements
   - Outcome: Clear stream decision with preparation plan for 11th grade

7. **ENTRANCE EXAM AWARENESS (GENERAL ONLY)**:
   - ✅ You MAY mention entrance exams in GENERAL terms: "Science PCM students typically prepare for engineering entrance exams"
   - ✅ You MAY say: "Medical careers require entrance exams after 12th"
   - ❌ DO NOT provide detailed exam strategies, coaching recommendations, or specific exam names (JEE/NEET/CLAT)

8. **SKILL REALITY CHECK (CRITICAL)**:
   - ✅ If aptitude scores are low (<30%), MUST acknowledge: "These careers are achievable but will require significant improvement in [specific skills] over the next 2-3 years"
   - ✅ Distinguish between interest (what they enjoy) and readiness (what they're currently good at)
   - ✅ Frame match scores as "Interest Alignment %" not "Career Match %"
   - ✅ Be honest about skill gaps while remaining encouraging

9. **USE SIMPLE, RELATABLE LANGUAGE**:
   - ✅ "Creative & Design Careers" NOT ❌ "Creative Industries & Media"
   - Use future-oriented but closer language: "After 12th, you could pursue...", "In 2-3 years, you'll be ready for..."

9. **NO SPECIFIC COLLEGE NAMES** - Do not mention IIT, AIIMS, NLU, or specific institutions

10. **CLEAN OUTPUT - NO BACKEND METADATA**:
   - Remove all fields starting with underscore: _timestamp, _corrected, _metadata, _scoreBackup, etc.

FAILURE TO FOLLOW THESE RULES WILL RESULT IN INCORRECT OUTPUT FOR THIS 10TH GRADER.
` : ''}

**CRITICAL FOR GRADE 10 - MATCH SCORE LABELING:**
When displaying match scores in the output:
- The JSON field is still called "matchScore" (keep this for compatibility)
- BUT in the description/evidence, you MUST refer to it as "Interest Alignment" not "Match"
- Example: "This 85% represents your INTEREST ALIGNMENT with healthcare, based on what you enjoy (I: 60%, S: 40%)"
- NEVER say "85% match" or "85% fit" - always say "85% interest alignment"

**CRITICAL FOR GRADE 10 - APTITUDE REALITY CHECK:**
If overall aptitude is below 30%, you MUST include this statement in the description:
"These careers are achievable but will require significant improvement in [specific weak areas] over the next 2-3 years. Your current aptitude scores show developing skills that need focused practice."

Example for healthcare with 16% aptitude:
"Your 85% interest alignment with healthcare shows strong motivation. However, your current aptitude scores (16% overall, 12% numerical, 13% abstract) indicate these careers will require significant improvement in analytical and numerical skills over the next 2-3 years. This is normal for Grade 10 - focus on building these skills now."

**CRITICAL - AGE-APPROPRIATE GUIDANCE:**
${isGrade9 ? `
**THIS STUDENT IS IN GRADE 9 (Age 14-15) - EXPLORATION & INTEREST DISCOVERY FOCUS:**

**PRIMARY FOCUS**: Help them explore interests and understand what different careers involve. Stream choice comes AFTER 10th.

**LANGUAGE & FRAMING RULES:**
1. **Use BROAD, relatable career fields** - NOT complex industry jargon:
   - ✅ "Creative & Design Careers" NOT ❌ "Creative Industries & Media"
   - ✅ "Technology & Computers" NOT ❌ "Technology & Digital Innovation"

2. **Use future-oriented language** - They're exploring, not deciding yet:
   - ✅ "When you complete your education, you could become..."
   - ✅ "After finishing college, careers like..."
   - ✅ "In the future, you might work as..."

3. **Mention STREAM AWARENESS, not selection**:
   - Frame as: "When you choose your stream after 10th, careers in [field] will require [stream]"
   - Explain WHY streams matter, but don't pressure them to decide now
   - Help them understand the connection between streams and careers

4. **Simplify career examples**:
   - Use job titles teenagers can understand and relate to
   - ✅ "Software Developer", "Doctor", "Teacher", "Designer", "Business Owner"

5. **NO entrance exam mentions** - Too early for this

6. **NO salary information** - Focus on interest and exploration

7. **NO specific college names**

8. **Roadmap should focus on EXPLORATION**:
   - Phase 1-2: Try different activities, discover what you enjoy
   - Phase 3-4: Explore subjects, understand your strengths
   - Projects should be fun, exploratory activities

9. **specificOptions should be CURRENT EXPLORATION ACTIVITIES**:
   - ✅ "Join Coding Club", "Learn Graphic Design on Canva", "Start a Blog"
   - These are things they can do NOW to explore interests

**REMEMBER**: This student is 14-15 years old. They need to explore and discover, NOT make decisions yet.
` : ''}${isGrade10 ? `
**THIS STUDENT IS IN GRADE 10 (Age 15-16) - STREAM DECISION PREPARATION FOCUS:**

**PRIMARY FOCUS**: Help them make a confident stream choice (Science/Commerce/Arts) for 11th grade. This is decision time.

**LANGUAGE & FRAMING RULES:**
1. **Use BROAD, relatable career fields** - NOT complex industry jargon:
   - ✅ "Creative & Design Careers" NOT ❌ "Creative Industries & Media"
   - ✅ "Technology & Computers" NOT ❌ "Technology & Digital Innovation"

2. **Use confident, directive language** - They need to decide soon:
   - ✅ "Based on your profile, Science PCM would be a strong choice because..."
   - ✅ "You should consider Commerce stream to pursue careers in..."
   - ✅ "After 12th, you'll be ready to pursue..."

3. **STREAM SELECTION IS CRITICAL**:
   - Clearly state which stream(s) (Science PCM/PCB, Commerce, Arts) lead to each career cluster
   - Explain WHY that stream is needed with specific reasoning
   - Be directive: "You should choose Science PCB because your biology interest and social aptitude align with medical careers"
   - Help them understand this decision shapes their next 2 years

4. **Simplified salary information ALLOWED**:
   - ✅ Use simple ranges: "Starting salaries around ₹4-8 lakhs, growing to ₹15-30 lakhs with experience"
   - Keep it brief - helps them understand career viability
   - ❌ DO NOT provide detailed breakdowns (entry/mid/senior)

5. **General entrance exam awareness ALLOWED**:
   - ✅ "Science PCM students typically prepare for engineering entrance exams"
   - ✅ "Medical careers require competitive entrance exams after 12th"
   - ❌ DO NOT mention specific exam names (JEE, NEET, CLAT) or strategies

6. **NO specific college names** - Use general terms like "top engineering colleges"

7. **Roadmap should focus on STREAM DECISION & PREPARATION**:
   - Phase 1-2: Deepen skills in target areas, confirm interests
   - Phase 3: Research streams thoroughly, talk to seniors
   - Phase 4: FINALIZE stream choice, understand 11th grade requirements, prepare mentally
   - Projects should help them validate their stream choice

8. **specificOptions can mix ACTIVITIES and AWARENESS**:
   - ✅ "Learn Python and build projects" (activity)
   - ✅ "Research Software Developer career path" (awareness)
   - ✅ "Shadow a doctor for a day" (exposure)
   - Help them make informed decisions

**REMEMBER**: This student is 15-16 years old and will choose their stream in 2-4 months. They need clear guidance to make a confident decision.
` : ''}

🚨 CRITICAL: GRADES 11-12 ARE NOT SUPPORTED BY THIS PROMPT 🚨
This prompt is ONLY for grades 9-10. If you see grade 11 or 12, there's a routing error.
Students in grades 11-12 should use the higher_secondary prompt instead.

## 🔥 CRITICAL: USE REAL-TIME JOB MARKET DATA

**IF real-time Indian job market data is provided above** (marked with "REAL-TIME INDIAN JOB MARKET DATA"):
1. ✅ Use ONLY the salary ranges from that data
2. ✅ Use ONLY the job roles listed in that data
3. ✅ Use ONLY the career categories provided in the real-time data
4. ✅ Copy the "Why Better" descriptions exactly as provided
5. ✅ Use the exact salary format: "₹X-YL entry, ₹X-YL mid, ₹X-YL senior"
6. ✅ Prioritize HIGH demand roles over medium/low demand
7. ✅ Consider growth rates when ranking career recommendations
8. ✅ The categories above were SPECIFICALLY SELECTED for this student's RIASEC profile

**The real-time data includes:**
- Current 2026 Indian salary ranges
- Demand levels (high/medium/low)
- Growth rates and market trends
- Categories matched to this student's RIASEC combination

**YOU MUST use these categories as your TRACK 1, TRACK 2, and TRACK 3 recommendations.**

---

## STUDENT ASSESSMENT DATA

### Session ID: ${answersHash}
${studentGrade ? `### Student Grade: ${studentGrade}` : ''}

### Interest Explorer (RIASEC):
${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, puzzles, experiments, figuring things out, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, working with groups, caring, making friends
- **E (Enterprising)**: Leading, organizing, persuading, selling, being in charge, starting projects
- **C (Conventional)**: Organizing, following rules, keeping things neat, detailed work, lists

**RIASEC SCORING INSTRUCTIONS:**
1. For each question with categoryMapping, look up the RIASEC type for the student's answer
2. Add 2 points for each answer to the corresponding RIASEC type
3. Calculate percentage: (score / maxScore) × 100
4. Identify top 3 types by score (HIGHEST scores, not random selection)
5. The RIASEC code is the top 3 types in DESCENDING ORDER by score (e.g., if I=6, R=4, E=4, code is "IRE")
6. ⚠️ CRITICAL: You MUST fill in the actual calculated scores in the "scores" field - DO NOT leave them as zeros!
7. ⚠️ CRITICAL: The "code" field MUST match the top 3 highest scores. If I=6, R=4, E=4, S=0, the code is "IRE" NOT "IES"

Example calculation:
- If student answered 3 questions that map to "I", scores.I = 6 (3 × 2)
- If maxScore is 20, percentages.I = (6/20) × 100 = 30%
- Sort all scores: I=6, R=4, E=4, A=2, S=0, C=0
- Top 3: I, R, E → code = "IRE"

### Character Strengths:
${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**VIA Character Strengths**: Curiosity, Perseverance, Honesty, Creativity, Resilience, Kindness, Self-Discipline, Responsibility, Leadership, Self-Awareness
- Rating 1 = Not me, 2 = A bit, 3 = Mostly, 4 = Strongly me
- Identify top 3-4 strengths (ratings 3-4)

### Aptitude Self-Assessment:
${JSON.stringify(assessmentData.aptitudeAnswers, null, 2)}
Pre-calculated scores: ${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**Task Types**: Analytical, Creative, Technical, Social
- Students rated EASE (1-4) and ENJOYMENT (1-4) for each type
- Higher ratings = stronger aptitude and interest

${adaptiveSection}

### Learning & Work Preferences:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

---

## OUTPUT REQUIREMENTS

**Return ONLY a JSON object (no markdown).**

**CRITICAL DATABASE COMPATIBILITY:**
1. riasec.code MUST be a 3-letter string (e.g., "IES"), NOT an array
2. aptitude.scores MUST exist with standard categories (verbal, numerical, abstract, spatial, clerical)
3. aptitude.overallScore MUST be a number (0-100)
4. bigFive MUST be a flat object with O, C, E, A, N keys (NO nested "scores" wrapper)

**JSON Structure:**

{
  "riasec": {
    "code": "ABC",
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 20,
    "interpretation": "2-3 sentences about what their interests mean for stream selection and career paths",
    "topThree": ["Top 3 RIASEC codes"]
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
      "pattern_recognition": {"accuracy": 0}
    },
    "topStrengths": ["2-3 strengths combining self-assessment AND adaptive test results"],
    "cognitiveProfile": "How they think and solve problems",
    "adaptiveLevel": 0,
    "adaptiveConfidence": "high/medium/low"
  },
  "characterStrengths": {
    "topStrengths": ["Top 3-4 character strengths"],
    "strengthDescriptions": [
      {"name": "Strength 1", "rating": 4, "description": "How this shows in their responses"}
    ],
    "challengeOvercome": "Summary of challenge they described",
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
      {"value": "Inferred from interests, strengths, and preferences", "score": 4.0}
    ]
  },
  "employability": {
    "strengthAreas": ["Soft skills they're demonstrating"],
    "improvementAreas": ["Skills to develop - phrase constructively"],
    "overallReadiness": "Their current career readiness level"
  },
  "knowledge": { "score": 70, "correctCount": 7, "totalQuestions": 10 },
  "careerFit": {
    "clusters": [
      {
        "title": "FOR GRADES 9-10 EXAMPLE: 'Creative & Design Careers', 'Technology & Computers', 'Healthcare & Medicine'. FOR GRADES 11-12: Can use detailed industry names from real-time data",
        "matchScore": "REQUIRED: Calculate as INTEGER between 80-95 using FINE-GRAINED formula. FOR GRADE 10: This represents INTEREST ALIGNMENT, not final career fit. Base score = 80 + (RIASEC_match_percentage * 0.15). Example: If top 2 RIASEC types match at 70% and 65%, score = 80 + ((70+65)/2 * 0.15) = 80 + 10.125 = 90. Then adjust ±1-3 based on aptitude and personality fit. Result must be unique per student (e.g., 82, 83, 87, 91, 93) - NEVER use round numbers like 85, 90, 95",
        "fit": "High",
        "streamRequired": "FOR GRADES 9-10 MANDATORY: 'Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts', or 'Any stream'. FOR GRADES 11-12: Optional field",
        "whyThisStream": "FOR GRADE 9: Frame as awareness - 'When you choose your stream after 10th, careers in [field] will require [stream]'. FOR GRADE 10: Frame as guidance - 'Based on your interests, [stream] would open doors to these careers' (NOT 'You should choose'). FOR GRADES 11-12: Optional field",
        "description": "3-4 sentences explaining WHY this fits. FOR GRADE 9: Use exploratory language. FOR GRADE 10: Include interest alignment + skill reality check. If aptitude is low (<30%), MUST mention: 'These careers are achievable but will require significant improvement in [specific skills] over the next 2-3 years.' FOR GRADES 11-12: Can be more direct",
        "examples": ["FOR GRADES 9-10: Simple job titles like 'Graphic Designer', 'Software Developer', 'Doctor', 'Teacher'. FOR GRADES 11-12: Can include specialized titles"],
        "educationPath": "Specific college majors. FOR GRADES 9-10: Keep brief and general",
        "whatYoullDo": "Day-to-day activities. FOR GRADES 9-10: Write so a 14-16 year old can picture it",
        "whyItFits": "Connection between their profile and this career area",
        "evidence": {
          "interest": "How their RIASEC scores support this path - cite specific RIASEC types and percentages. FOR GRADE 10: Clearly label this as 'What you ENJOY' not 'What you're ready for'",
          "aptitude": "Which cognitive strengths make them a good fit - cite specific aptitude scores and accuracy percentages. FOR GRADE 10: If aptitude is low (<30%), acknowledge gap: 'Currently developing - needs focused improvement in [skills]'",
          "personality": "Personality traits that align with success - cite specific character strengths and ratings"
        },
        "roles": {
          "entry": ["4-5 entry-level jobs from real-time data"],
          "mid": ["4-5 mid-career jobs from real-time data"]
        },
        "domains": ["Related fields"],
        "salaryRange": "FOR GRADE 9: ⚠️ DO NOT INCLUDE THIS FIELD - completely omit salary information. FOR GRADE 10: Include simplified format like 'Starting ₹4-8 lakhs, growing to ₹15-30 lakhs with experience'. FOR GRADES 11-12: Use detailed format"
      },
      {
        "title": "Career cluster #2 from real-time data above (FOR GRADES 9-10: Use simple titles)",
        "matchScore": "REQUIRED: Calculate as INTEGER between 65-78. FOR GRADE 10: This represents INTEREST ALIGNMENT for secondary option. STRICT FORMULA: Base score = 65 + (secondary_RIASEC_match_percentage * 0.13). Example: If 1-2 RIASEC types match at 55% and 50%, score = 65 + ((55+50)/2 * 0.13) = 65 + 6.825 = 72. Adjust ±1-2 based on partial aptitude/personality fit. Result must be unique (e.g., 67, 71, 73, 76). ❌ FORBIDDEN VALUES: 70, 75, 80 - these are TOO ROUND. MUST be at least 10-15 points lower than Track 1. If you calculate 75, use 73 or 76 instead.",
        "fit": "Medium",
        "streamRequired": "FOR GRADES 9-10 ONLY: State which stream(s) are needed. FOR GRADES 11-12: Optional",
        "whyThisStream": "FOR GRADE 9: Frame as awareness. FOR GRADE 10: Frame as guidance - 'You may consider [stream] to explore these careers' (NOT 'You should choose'). FOR GRADES 11-12: Optional",
        "description": "Specific explanation connecting their profile to this career area. FOR GRADE 9: Use exploratory language. FOR GRADE 10: Acknowledge this is a secondary option worth exploring. If aptitude gaps exist, mention them honestly. FOR GRADES 11-12: Can be more direct",
        "examples": ["4-5 career options from real-time data. FOR GRADES 9-10: Use simple job titles"],
        "educationPath": "Relevant majors and programs. FOR GRADES 9-10: Keep brief and general",
        "whatYoullDo": "Overview of work in this field. FOR GRADES 9-10: Age-appropriate language",
        "whyItFits": "How their strengths translate here",
        "evidence": {
          "interest": "Interest alignment - cite specific RIASEC types and percentages. FOR GRADE 10: Frame as 'What you ENJOY'",
          "aptitude": "Relevant cognitive skills - cite specific aptitude scores and accuracy percentages. FOR GRADE 10: Be honest about current skill level",
          "personality": "Personality fit - cite specific character strengths and ratings"
        },
        "roles": {
          "entry": ["3-4 entry-level positions from real-time data"],
          "mid": ["3-4 mid-level careers from real-time data"]
        },
        "domains": ["Related industries"],
        "salaryRange": "FOR GRADE 9: ⚠️ DO NOT INCLUDE THIS FIELD. FOR GRADE 10: Include simplified format. FOR GRADES 11-12: Can use detailed breakdowns"
      },
      {
        "title": "Career cluster #3 from real-time data above (FOR GRADES 9-10: Use simple titles)",
        "matchScore": "REQUIRED: Calculate as INTEGER between 50-65. FOR GRADE 10: This represents EXPLORATORY INTEREST only. STRICT FORMULA: Base score = 50 + (exploratory_RIASEC_match_percentage * 0.15). Example: If 1 RIASEC type matches at 40%, score = 50 + (40 * 0.15) = 50 + 6 = 56. Adjust ±1-2 based on growth potential. Result must be unique (e.g., 52, 56, 59, 62). ❌ FORBIDDEN VALUES: 55, 60, 65 - these are TOO ROUND. MUST be at least 10-15 points lower than Track 2. If you calculate 65, use 62 or 63 instead.",
        "fit": "Explore",
        "streamRequired": "FOR GRADES 9-10 ONLY: State which stream(s) are needed. FOR GRADES 11-12: Optional",
        "whyThisStream": "FOR GRADE 9: Frame as awareness. FOR GRADE 10: Frame as 'This stream could work if you develop interest in [area]'. FOR GRADES 11-12: Optional",
        "description": "Why this is worth exploring. FOR GRADE 9: Keep very open. FOR GRADE 10: Frame as backup/alternative option. Be realistic about fit. FOR GRADES 11-12: Can be more direct",
        "examples": ["3-4 careers from real-time data. FOR GRADES 9-10: Use simple job titles"],
        "educationPath": "Potential degree paths. FOR GRADES 9-10: Keep brief and general",
        "whatYoullDo": "What professionals do. FOR GRADES 9-10: Age-appropriate language",
        "whyItFits": "Potential growth areas",
        "evidence": {
          "interest": "Interest connections - cite specific RIASEC types and percentages. FOR GRADE 10: Frame as 'Worth exploring'",
          "aptitude": "Transferable skills - cite specific aptitude scores and accuracy percentages. FOR GRADE 10: Be realistic about current readiness",
          "personality": "Personality considerations - cite specific character strengths and ratings"
        },
        "roles": {
          "entry": ["2-3 starting positions from real-time data"],
          "mid": ["2-3 advanced roles from real-time data"]
        },
        "domains": ["Related career paths"],
        "salaryRange": "FOR GRADE 9: ⚠️ DO NOT INCLUDE THIS FIELD. FOR GRADE 10: Include simplified format. FOR GRADES 11-12: Can use detailed breakdowns"
      }
    ],
    "specificOptions": {
      "highFit": [
        {
          "name": "FOR GRADE 9 EXAMPLE: 'Learn Graphic Design on Canva', 'Join School Coding Club'. FOR GRADE 10 EXAMPLE: 'Shadow a professional for a day', 'Take online course in [subject]', 'Volunteer at [relevant place]' (school-level, parent-guided, NOT internships or LinkedIn). FOR GRADES 11-12: Career name from real-time data",
          "whyThisRole": "FOR GRADE 9: Explain how this activity helps explore interests. FOR GRADE 10: Explain how this helps validate stream choice. FOR GRADES 11-12: Why this career fits",
          "salary": "FOR GRADE 9: ⚠️ DO NOT INCLUDE THIS FIELD AT ALL. FOR GRADE 10: You MAY mention salary in whyThisRole if relevant to stream decision, but DO NOT include separate salary field. FOR GRADES 11-12: Include {min: X, max: Y}"
        },
        {
          "name": "FOR GRADE 9: Another exploration activity. FOR GRADE 10: Activity that validates stream choice. FOR GRADES 11-12: Another career",
          "whyThisRole": "1 sentence explanation"
        },
        {
          "name": "FOR GRADE 9: Third exploration activity. FOR GRADE 10: Third activity for stream validation. FOR GRADES 11-12: Third career",
          "whyThisRole": "1 sentence explanation"
        }
      ],
      "mediumFit": [
        {
          "name": "FOR GRADE 9: Exploration activity for second interest. FOR GRADE 10: Activity for second stream option. FOR GRADES 11-12: Career",
          "whyThisRole": "1 sentence explanation"
        },
        {
          "name": "FOR GRADE 9: Another exploration activity. FOR GRADE 10: Another stream validation activity. FOR GRADES 11-12: Another career",
          "whyThisRole": "1 sentence explanation"
        },
        {
          "name": "FOR GRADE 9: Third exploration activity. FOR GRADE 10: Third stream validation activity. FOR GRADES 11-12: Third career",
          "whyThisRole": "1 sentence explanation"
        }
      ],
      "exploreLater": [
        {
          "name": "FOR GRADE 9: Exploration activity for third interest. FOR GRADE 10: Activity for alternative stream. FOR GRADES 11-12: Career",
          "whyThisRole": "1 sentence explanation"
        },
        {
          "name": "FOR GRADE 9: Another exploration activity. FOR GRADE 10: Another alternative stream activity. FOR GRADES 11-12: Another career",
          "whyThisRole": "1 sentence explanation"
        },
        {
          "name": "FOR GRADE 9: Third exploration activity. FOR GRADE 10: Third alternative stream activity. FOR GRADES 11-12: Third career",
          "whyThisRole": "1 sentence explanation"
        }
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {"skill": "Critical skill", "reason": "Why essential", "targetLevel": "Intermediate", "currentLevel": "Beginner", "howToBuild": "Action steps"}
    ],
    "priorityB": [
      {"skill": "Important skill", "reason": "Why it matters", "targetLevel": "Intermediate", "currentLevel": "Beginner"}
    ],
    "currentStrengths": ["3-4 skills they already demonstrate"],
    "recommendedTrack": "Clear development path"
  },
  "roadmap": {
    "twelveMonthJourney": {
      "phase1": {
        "months": "Months 1-3",
        "title": "Foundation Building",
        "goals": ["Master core skills", "Identify career interests", "Build portfolio"],
        "activities": ["Specific courses", "Projects", "Competitions"],
        "outcome": "Clear career direction"
      },
      "phase2": {
        "months": "Months 4-6",
        "title": "Skill Development",
        "goals": ["Earn certifications", "Build projects", "Network"],
        "activities": ["Certifications", "Portfolio work", "Mentors"],
        "outcome": "Demonstrable skills"
      },
      "phase3": {
        "months": "Months 7-9",
        "title": "Experience & Application",
        "goals": ["Secure internship", "Lead projects", "Apply skills"],
        "activities": ["Internships", "Leadership", "Competitions"],
        "outcome": "Real-world experience"
      },
      "phase4": {
        "months": "Months 10-12",
        "title": "FOR GRADES 9-10: 'Stream Selection & Subject Planning' - Focus on choosing the right stream for 11th grade. FOR GRADES 11-12: 'College & Career Prep'",
        "goals": ["FOR GRADES 9-10: Finalize stream choice (Science/Commerce/Arts), understand subject requirements, plan for 11th grade. FOR GRADES 11-12: Finalize college plans, perfect portfolio, interview prep"],
        "activities": ["FOR GRADES 9-10: Meet with counselors, research stream options, talk to seniors in different streams, finalize subject selection. FOR GRADES 11-12: Applications, portfolio refinement, mock interviews"],
        "outcome": "FOR GRADES 9-10: Clear stream decision with confidence about future path. FOR GRADES 11-12: College-ready"
      }
    },
    "projects": [
      {
        "title": "Portfolio project #1",
        "description": "Detailed description",
        "skills": ["Skills to develop"],
        "timeline": "3-4 months",
        "difficulty": "Intermediate",
        "purpose": "Career readiness",
        "output": "Deliverable",
        "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
        "resources": ["Tools and platforms"]
      }
    ],
    "internship": {
      "types": ["Internship types matching their interests"],
      "timing": "When and how long",
      "preparation": {
        "resume": "What to include",
        "portfolio": "What to showcase",
        "interview": "How to prepare"
      },
      "whereToApply": ["Companies and platforms"]
    },
    "exposure": {
      "activities": ["Clubs", "Competitions", "Events"],
      "certifications": ["Certifications to earn"],
      "onlineLearning": ["Specific courses"],
      "networking": ["How to connect with professionals"]
    }
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage",
    "growthFocus": "One key area to focus development"
  },
  "profileSnapshot": {
    "keyPatterns": {
      "enjoyment": "What they enjoy based on RIASEC",
      "strength": "Their aptitude strengths",
      "workStyle": "How they work",
      "motivation": "What drives them"
    },
    "aptitudeStrengths": [
      {"name": "Cognitive strength", "description": "Evidence"}
    ],
    "interestHighlights": ["Top 2-3 RIASEC areas"],
    "personalityInsights": ["2-3 key personality traits"]
  },
  "overallSummary": "3-4 sentences: FOR GRADE 10: Start with 'This is an exploratory stage - these recommendations are based on your current interests and will evolve as you grow.' Then acknowledge readiness, affirm direction, highlight strengths, provide encouragement. FOR OTHER GRADES: Acknowledge readiness, affirm direction, highlight strengths, provide encouragement"
}

---

## CAREER MATCHING GUIDELINES

**IF REAL-TIME DATA IS PROVIDED ABOVE:**
1. **Use ONLY the career categories provided in the real-time data**
2. **Use the salary ranges and demand levels from the real-time data**
3. **Prioritize HIGH demand roles with strong growth rates**

**IF NO REAL-TIME DATA IS PROVIDED (FALLBACK):**
Use these market-aligned career clusters for 2025-2030:

**TRACK 1 (HIGH FIT) - Top Career Clusters:**

${studentGrade && (studentGrade.includes('9') || studentGrade.includes('10') || studentGrade === 'Grade 9' || studentGrade === 'Grade 10') ? `
**FOR GRADES 9-10 (Ages 14-16) - USE THESE SIMPLIFIED, STREAM-FOCUSED CAREER FIELDS:**

**CRITICAL**: For 9th-10th graders, career recommendations must:
1. **Clearly state which STREAM(S) are needed** (Science PCM/PCB, Commerce, Arts/Humanities)
2. **Use simple, relatable job titles** that teenagers can understand
3. **Focus on EXPLORATION (Grade 9) or DECISION (Grade 10)** - adjust language accordingly
4. **Help with stream awareness (Grade 9) or stream selection (Grade 10)**
5. **Keep salary info simple for Grade 10 ONLY** - Grade 9 gets NO salary info
6. **Avoid entrance exam details** - Grade 10 can have general awareness only


---

**🎨 CREATIVE & DESIGN CAREERS** (For students with high A - Artistic interests)
- **Stream Needed**: Any stream works! Science/Commerce/Arts all lead here
- **Why This Stream**: Creativity matters more than your subjects. Portfolio is key.
- **Future Career Examples**: Graphic Designer, Content Creator, Video Editor, Fashion Designer, Photographer, Animator, UI/UX Designer
- **What You'll Do**: Create visual content, design products, make videos, express ideas through art and digital media
- **Salary Range (Grade 10 only)**: Starting ₹3-8 lakhs, growing to ₹15-40 lakhs with experience
- **Exploration Activities NOW**: 
  - Grade 9: Join art/design club, learn Canva basics, start Instagram art page, create simple videos
  - Grade 10: Learn Figma/Adobe tools, build design portfolio, research design careers, shadow a designer

**💻 TECHNOLOGY & COMPUTERS** (For students with high I - Investigative or R - Realistic interests + good numerical/logical aptitude)
- **Stream Needed**: Science (PCM - Physics, Chemistry, Maths) is best, OR Commerce with Computer Science
- **Why This Stream**: Programming and tech careers need strong math and logical thinking
- **Future Career Examples**: Software Developer, App Developer, Game Designer, Web Developer, Data Analyst, Cybersecurity Expert
- **What You'll Do**: Build apps and websites, solve tech problems, create games, analyze data, protect systems from hackers
- **Salary Range (Grade 10 only)**: Starting ₹6-15 lakhs, growing to ₹20-60 lakhs with experience
- **Exploration Activities NOW**:
  - Grade 9: Learn coding basics (Python/Scratch), join coding club, try simple projects
  - Grade 10: Build real projects, complete coding courses, research engineering vs CS careers, understand entrance exam requirements

**💼 BUSINESS & MANAGEMENT** (For students with high E - Enterprising or C - Conventional interests)
- **Stream Needed**: Commerce is best, but Arts also works
- **Why This Stream**: Business careers need understanding of economics, accounts, and organization
- **Future Career Examples**: Business Owner/Entrepreneur, Marketing Manager, Sales Manager, HR Manager, Event Manager, Business Analyst
- **What You'll Do**: Start and run businesses, manage teams, organize events, sell products, handle company operations
- **Salary Range (Grade 10 only)**: Starting ₹4-10 lakhs, growing to ₹15-50 lakhs (entrepreneurs can earn much more)
- **Exploration Activities NOW**:
  - Grade 9: Start small business (sell crafts), organize school events, learn about business basics
  - Grade 10: Run a sustained business project, learn digital marketing, research Commerce vs other streams, understand business education paths

**🏥 HEALTHCARE & MEDICINE** (For students with high S - Social or I - Investigative interests + interest in biology)
- **Stream Needed**: Science (PCB - Physics, Chemistry, Biology) is REQUIRED for medical careers
- **Why This Stream**: You cannot become a doctor, nurse, or pharmacist without Biology in 11th-12th
- **Future Career Examples**: Doctor, Dentist, Nurse, Pharmacist, Physiotherapist, Medical Lab Technician, Psychologist
- **What You'll Do**: Help sick people get better, diagnose diseases, prescribe medicines, work in hospitals, do medical research
- **Salary Range (Grade 10 only)**: Starting ₹4-12 lakhs, growing to ₹20-80 lakhs (doctors can earn much more in private practice)
- **Exploration Activities NOW**:
  - Grade 9: Volunteer at hospitals/clinics, learn first aid, read about human body, watch medical documentaries
  - Grade 10: Shadow healthcare professionals, understand medical entrance exam requirements, research different medical careers, confirm interest in Biology

**🔧 ENGINEERING & BUILDING** (For students with high R - Realistic or I - Investigative interests + good spatial/numerical aptitude)
- **Stream Needed**: Science (PCM - Physics, Chemistry, Maths) is REQUIRED
- **Why This Stream**: Engineering needs strong math and physics understanding
- **Future Career Examples**: Civil Engineer (buildings/roads), Mechanical Engineer (machines), Electrical Engineer (power systems), Aerospace Engineer (planes/rockets)
- **What You'll Do**: Design and build structures, create machines, solve technical problems, work on construction sites or in labs
- **Salary Range (Grade 10 only)**: Starting ₹4-10 lakhs, growing to ₹15-40 lakhs with experience
- **Exploration Activities NOW**:
  - Grade 9: Join robotics/science club, build DIY projects, watch engineering videos
  - Grade 10: Build complex projects, learn CAD software, research engineering branches, understand entrance exam landscape

**🎓 EDUCATION & TEACHING** (For students with high S - Social interests + good verbal aptitude)
- **Stream Needed**: Any stream! Choose based on what subject you want to teach
- **Why This Stream**: Science stream for teaching science/math, Commerce for business subjects, Arts for languages/social studies
- **Future Career Examples**: School Teacher, College Professor, Private Tutor, Educational Content Creator, School Counselor, Corporate Trainer
- **What You'll Do**: Teach students, create learning materials, help people understand subjects, guide students in their careers
- **Salary Range (Grade 10 only)**: Starting ₹3-8 lakhs (government teachers), growing to ₹10-30 lakhs (professors/private coaching)
- **Exploration Activities NOW**:
  - Grade 9: Tutor younger students, create educational content, explain concepts to classmates
  - Grade 10: Develop teaching skills, research education careers, understand which stream aligns with teaching interests

**⚖️ LAW & GOVERNMENT** (For students with high E - Enterprising or S - Social interests + strong verbal aptitude)
- **Stream Needed**: Arts/Humanities is best, but Commerce also works (Science students can also do law!)
- **Why This Stream**: Law needs strong reading, writing, and argumentation skills - any stream can lead here
- **Future Career Examples**: Lawyer, Judge, Legal Advisor, Government Officer (IAS/IPS), Policy Maker, Social Worker
- **What You'll Do**: Help people with legal problems, argue cases in court, work for government, make policies, fight for justice
- **Salary Range (Grade 10 only)**: Starting ₹5-15 lakhs, growing to ₹20-80 lakhs (top lawyers earn much more)
- **Exploration Activities NOW**:
  - Grade 9: Join debate club, participate in mock trials, read about laws and rights
  - Grade 10: Develop argumentation skills, research law careers, understand that any stream can lead to law

**🔬 SCIENCE & RESEARCH** (For students with very high I - Investigative interests + high aptitude in science)
- **Stream Needed**: Science (PCM or PCB depending on interest - Physics/Chemistry/Biology)
- **Why This Stream**: Research careers need deep science knowledge and analytical thinking
- **Future Career Examples**: Research Scientist, Lab Researcher, Space Scientist, Biotechnology Researcher, Environmental Scientist
- **What You'll Do**: Conduct experiments, discover new things, work in laboratories, publish research papers, solve scientific problems
- **Salary Range (Grade 10 only)**: Starting ₹4-10 lakhs, growing to ₹15-50 lakhs (international research pays more)
- **Exploration Activities NOW**:
  - Grade 9: Join science club, do home experiments, participate in science fairs
  - Grade 10: Conduct deeper research projects, understand research career paths, choose between PCM and PCB

---

**MATCHING RULES FOR GRADE 9:**
1. **Always mention the required STREAM** - but frame as awareness, not decision
2. **Explain WHY that stream is needed** - help them understand connections
3. **Use simple, relatable job titles** - avoid jargon
4. **NO salary information** - focus on exploration
5. **Focus on EXPLORATION activities** - things they can do NOW to discover interests
6. **Use exploratory language** - "You might enjoy...", "Worth exploring..."
7. **Match careers to their RIASEC + aptitude** - but acknowledge they're still discovering

**MATCHING RULES FOR GRADE 10:**
1. **Always mention the required STREAM first** - this is their immediate decision
2. **Explain WHY that stream is needed** - connect subjects to career requirements with specific reasoning
3. **Use simple, relatable job titles** - avoid jargon
4. **Include simple salary info** - one range showing starting and experienced levels
5. **Mix EXPLORATION and DECISION activities** - help them validate their choice
6. **Use confident, directive language** - "Based on your profile, Science PCM would be a strong choice"
7. **Match careers to their RIASEC + aptitude** - provide clear guidance on best fit

**USE ONLY THESE SIMPLIFIED CATEGORIES FOR GRADES 9-10. DO NOT use the detailed categories below.**
` : `
**FOR GRADES 11-12 - USE THESE DETAILED CAREER CLUSTERS:**
`}

**🚀 TECHNOLOGY & DIGITAL INNOVATION** (For I+R+E types, high numerical/logical aptitude)
- **Hot Roles**: AI/ML Engineer (₹8-25L entry, ₹25-80L mid), Full Stack Developer (₹6-18L entry, ₹18-50L mid), Data Scientist (₹7-20L entry, ₹20-60L mid), Cloud Architect (₹10-25L entry, ₹25-70L mid), Cybersecurity Analyst (₹6-15L entry, ₹15-45L mid)
- **Education Path**: BTech CS/IT, Online certifications (AWS, Google Cloud), Bootcamps, Self-taught + portfolio
- **Market Reality**: 70% of tech jobs don't require IIT degree. Portfolio + skills > college brand. Remote work = global salaries

**💼 BUSINESS, FINANCE & CONSULTING** (For E+C+I types, high numerical/analytical aptitude)
- **Hot Roles**: Business Analyst (₹6-15L entry, ₹15-40L mid), Management Consultant (₹8-20L entry, ₹20-60L mid), Product Manager (₹10-25L entry, ₹25-80L mid), Financial Analyst (₹5-12L entry, ₹12-35L mid), Investment Banking Analyst (₹10-25L entry, ₹25-1Cr mid)
- **Education Path**: BCom/BBA + MBA from top B-schools, CA (5 years), CFA (3-4 years), Economics/Finance degree
- **Market Reality**: MBA from top 20 B-schools = ₹20-35L starting. CA = stable ₹8-15L start, ₹30-80L after 8-10 years

**🏥 HEALTHCARE & LIFE SCIENCES** (For I+S types, high verbal/analytical aptitude, PCB stream)
- **Hot Roles**: Doctor/MBBS (₹6-15L entry, ₹15-80L mid), Dentist (₹5-12L entry, ₹12-50L mid), Pharmacist (₹3-8L entry, ₹8-25L mid), Biotech Researcher (₹4-10L entry, ₹10-35L mid), Medical Device Engineer (₹5-12L entry, ₹12-40L mid)
- **Education Path**: NEET → MBBS (5.5 years) → MD/MS (3 years), BDS (5 years), BPharm (4 years), BTech Biomedical
- **Market Reality**: MBBS = 10-year commitment. Private practice = ₹50L-2Cr after 10-15 years. Government jobs = stable ₹10-25L

**🎨 CREATIVE INDUSTRIES & MEDIA** (For A+E types, high creative/verbal aptitude)
- **Hot Roles**: UX/UI Designer (₹5-15L entry, ₹15-45L mid), Content Creator/YouTuber (₹2-10L entry, ₹10L-2Cr mid), Graphic Designer (₹3-8L entry, ₹8-25L mid), Video Editor (₹4-10L entry, ₹10-35L mid), Digital Marketing Manager (₹5-12L entry, ₹12-40L mid)
- **Education Path**: BDes from NID/NIFT/Srishti, Mass Comm/Journalism, Self-taught + portfolio, Online courses
- **Market Reality**: Portfolio > degree. Freelancing = ₹50K-5L/month. In-house at tech companies = best pay (₹15-50L)

**⚖️ LAW & GOVERNANCE** (For I+E+S types, high verbal/logical aptitude)
- **Hot Roles**: Corporate Lawyer (₹6-18L entry, ₹18-80L mid), Legal Consultant (₹5-15L entry, ₹15-50L mid), Compliance Officer (₹5-12L entry, ₹12-35L mid), Patent Attorney (₹6-15L entry, ₹15-45L mid)
- **Education Path**: CLAT → 5-year BA LLB from NLU, 3-year LLB after graduation, LLM for specialization
- **Market Reality**: Top law firms = ₹15-25L start. Tier 2 firms = ₹8-15L. Corporate in-house = ₹10-30L after 5 years

**🏛️ CIVIL SERVICES & GOVERNMENT** (For high aptitude students, I+S+C types)
- **Hot Roles**: IAS Officer (₹56K-2.5L/month + perks), IPS Officer (₹56K-2L/month + perks), IFS Diplomat (₹56K-2L/month + perks), IRS Officer (₹56K-2L/month + perks)
- **Education Path**: Any graduation + UPSC CSE (2-3 years prep), NDA for defence (after 12th), State PSC exams
- **Market Reality**: UPSC success rate = 0.1%. Requires 2-3 years dedicated preparation. Lifetime job security + prestige

**TRACK 2 (MEDIUM FIT) - Emerging & Specialized:**

**🔬 RESEARCH & ACADEMIA** (For I+C types, very high analytical aptitude)
- **Hot Roles**: Research Scientist (₹5-12L entry, ₹12-40L mid), PhD Scholar (₹31K-35K/month stipend), Professor (₹6-15L entry, ₹15-50L mid), Data Analyst (₹4-10L entry, ₹10-30L mid)
- **Education Path**: BSc → MSc → PhD (8-10 years), BTech → MTech → PhD, Research fellowships
- **Market Reality**: Long education path. Academic jobs = stable but lower pay. Industry research = ₹15-60L

**🏗️ ENGINEERING & INFRASTRUCTURE** (For R+I types, high spatial/numerical aptitude, PCM stream)
- **Hot Roles**: Civil Engineer (₹3-8L entry, ₹8-25L mid), Mechanical Engineer (₹4-10L entry, ₹10-30L mid), Electrical Engineer (₹4-10L entry, ₹10-35L mid), Aerospace Engineer (₹6-15L entry, ₹15-50L mid)
- **Education Path**: BTech from Tier 1-2 colleges, Diploma + BTech lateral entry, MTech for specialization
- **Market Reality**: Core engineering = lower pay than software. PSUs = stable ₹8-15L. Private = project-based

**🎓 EDUCATION & TRAINING** (For S+I types, high verbal aptitude)
- **Hot Roles**: Teacher (₹3-8L entry, ₹8-20L mid), Corporate Trainer (₹5-12L entry, ₹12-35L mid), EdTech Content Creator (₹4-10L entry, ₹10-30L mid), Curriculum Designer (₹5-12L entry, ₹12-30L mid)
- **Education Path**: BEd (2 years after graduation), MEd, Subject degree + teaching certification
- **Market Reality**: Government teacher = ₹3-8L (stable). EdTech = ₹8-25L. Freelance tutoring = ₹50K-3L/month

**TRACK 3 (EXPLORE) - For Social Students with Decent Aptitude:**

**🎉 EVENT & EXPERIENCE MANAGEMENT** (BEST for A+S or E+S combinations)
- **Why Better**: India's experience economy booming (₹10,000+ crore wedding industry, 15-20% YoY growth). Entrepreneurial potential.
- **Hot Roles**: Wedding Planner (₹4-7L entry + ₹50K-2L per event, ₹10-25L mid, ₹25L-1Cr senior/own business), Event Coordinator (₹4-8L entry, ₹8-15L mid), Hospitality Manager (₹4-7L entry, ₹7-14L mid), Experience Designer (₹5-9L entry, ₹9-18L mid)
- **Education Path**: Hotel Management diploma/degree, Event Management certification, or start with internships
- **Market Reality**: Wedding packages ₹2L-5L+. Corporate events ₹5L-50L. Own event company after 5-7 years = ₹20L-1Cr revenue

**🏥 HEALTHCARE COORDINATION** (BEST for S+I combinations)
- **Why Better**: Healthcare sector added 7.5M jobs (62% YoY growth). Entry-level roles growing 25% annually. Stable, recession-proof.
- **Hot Roles**: Patient Care Coordinator (₹4-7L entry, ₹7-13L mid), Healthcare Customer Support (₹3.5-6L entry, ₹6-11L mid), Medical Representative (₹4-8L entry + incentives, ₹8-18L mid), Wellness Program Coordinator (₹4-7L entry, ₹7-14L mid), Health Coach (₹4-7L entry, ₹7-15L mid)
- **Education Path**: Healthcare administration diploma, Medical representative training, Wellness coaching certification
- **Market Reality**: Telemedicine creating 8,000+ opportunities. Healthcare IT roles ₹8-25L. Hospital administration ₹10-30L after 5-8 years

**💻 DIGITAL CONTENT & COMMUNITY** (BEST for A+S combinations)
- **Why Better**: Orange economy creating 10-20M jobs by 2026. Remote work opportunities. Creative expression + audience engagement.
- **Hot Roles**: Social Media Manager (₹3-6L entry, ₹6-13L mid), Community Manager (₹4-7L entry, ₹7-15L mid), Content Coordinator (₹3-6L entry, ₹6-12L mid), Customer Success Manager (₹4-8L entry, ₹8-16L mid), Content Creator (₹3-8L entry + brand deals, ₹8-20L mid)
- **Education Path**: Digital marketing certification, Content creation courses, Social media management training
- **Market Reality**: Remote work = global opportunities. Freelancing ₹50K-5L/month. In-house at tech companies = ₹15-50L

**💰 SALES & ACCOUNT MANAGEMENT** (BEST for E+S combinations)
- **Why Better**: Every company needs sales. High earning potential with commissions. Clear progression path.
- **Hot Roles**: Account Executive (₹4-8L entry + commission, ₹8-18L mid), Customer Success Manager (₹4-8L entry, ₹8-16L mid), Business Development Associate (₹4-9L entry + incentives, ₹9-20L mid), Relationship Manager (₹4-8L entry, ₹8-18L mid)
- **Education Path**: Any degree + sales training, MBA for faster growth
- **Market Reality**: Top performers earn 2-3x base salary with commissions. B2B SaaS sales = ₹15-50L after 3-5 years

**🌍 SOCIAL IMPACT & NGO** (ONLY if aptitude <30% OR student explicitly mentions NGO interest)
- **Hot Roles**: NGO Program Manager (₹4-10L entry, ₹10-20L mid), Social Worker (₹3-6L entry, ₹6-12L mid), CSR Manager (₹6-15L entry, ₹15-30L mid), Development Consultant (₹5-12L entry, ₹12-25L mid)
- **Education Path**: BA/BSW in Social Work, MA in Development Studies, MBA with CSR specialization
- **Market Reality**: NGO sector = lower pay but high satisfaction. Corporate CSR roles = better pay (₹10-30L). International NGOs = ₹15-50L

**CRITICAL RULES FOR ALL SCENARIOS:**
1. **Match careers to ALL THREE of the student's top RIASEC types, not just one**
2. **If 'A' (Artistic) is in top 3, include at least ONE creative career cluster**
3. **If 'S' (Social) is in top 3 with decent aptitude (>30%), prioritize Event/Healthcare/Digital over NGO**
4. **Explain WHY each career fits using their specific RIASEC combination**
5. **Provide exactly 3 career clusters with ALL fields filled (evidence, roles, domains)**
6. **Use match scores: Track 1 = 75-95%, Track 2 = 60-75%, Track 3 = 50-65%**

**FINAL VERIFICATION:**
Before returning your response, verify:
- ✅ All 3 career clusters align with student's RIASEC combination
- ✅ Used ALL THREE of their top RIASEC types
- ✅ Evidence section explains how RIASEC, aptitude, and personality align
- ✅ No stereotyping (all I→Tech, all S→NGO, all A→Artist)
- ✅ If real-time data was provided, used ONLY those categories and salaries
- ✅ If no real-time data, used the fallback clusters above with proper RIASEC matching

**ADDITIONAL VERIFICATION FOR GRADE 9 STUDENTS:**
If student is in grade 9, also verify:
- ✅ Report type is EXPLORATORY DEVELOPMENTAL, not career placement or stream decision
- ✅ Language is exploratory and non-deterministic ("might enjoy", "worth exploring", "could be a good fit")
- ✅ NO salary information anywhere in the output (no salaryRange field, no salary in specificOptions)
- ✅ Stream information is framed as AWARENESS, not selection: "When you choose your stream after 10th..."
- ✅ Interest and aptitude are clearly separated in evidence sections
- ✅ NO backend metadata fields (_timestamp, _corrected, _metadata, _scoreBackup, etc.)
- ✅ Match scores are DYNAMICALLY CALCULATED from student's actual RIASEC percentages
- ✅ Evidence sections cite SPECIFIC numbers from student data
- ✅ Career cluster titles use SIMPLE language
- ✅ Each cluster states which STREAM(S) are needed in streamRequired field
- ✅ Each cluster explains WHY that stream is needed in whyThisStream field
- ✅ Career examples use simple, relatable job titles
- ✅ NO entrance exam mentions at all
- ✅ NO specific college names
- ✅ Future-oriented language: "When you complete education...", "After college..."
- ✅ specificOptions contains EXPLORATION ACTIVITIES with whyThisRole field
- ✅ specificOptions does NOT include salary field
- ✅ Roadmap focuses on EXPLORATION and interest discovery
- ✅ Roadmap phase4 focuses on "Explore & Build Foundation" NOT stream selection
- ✅ Projects are fun, exploratory activities for 14-15 year olds
- ✅ Overall tone is exploratory and encouraging, focused on discovery

**ADDITIONAL VERIFICATION FOR GRADE 10 STUDENTS:**
If student is in grade 10, also verify:
- ✅ Report type is STREAM PREPARATION REPORT, focused on helping them choose wisely
- ✅ Language is supportive and exploratory: "Based on your interests, [stream] would open doors to..." (NOT "You should choose")
- ✅ Match scores are labeled as "Interest Alignment %" not "Career Match %"
- ✅ SIMPLIFIED salary information IS included (one range per cluster, brief format)
- ✅ Stream information is GUIDANCE-BASED: "You may consider [stream] to explore these careers"
- ✅ Interest and aptitude are CLEARLY SEPARATED with honest assessment
- ✅ If aptitude is low (<30%), MUST include skill improvement statement: "These careers are achievable but will require significant improvement in [skills] over the next 2-3 years"
- ✅ NO backend metadata fields (_timestamp, _corrected, _metadata, _scoreBackup, etc.)
- ✅ Match scores are DYNAMICALLY CALCULATED from student's actual RIASEC percentages
- ✅ Evidence sections cite SPECIFIC numbers and distinguish "What you ENJOY" vs "Current skill level"
- ✅ Career cluster titles use SIMPLE language
- ✅ Each cluster states which STREAM(S) are needed in streamRequired field
- ✅ Each cluster explains WHY that stream opens doors (NOT "You should choose") in whyThisStream field
- ✅ Career examples use simple, relatable job titles
- ✅ General entrance exam awareness IS allowed ("engineering entrance exams", "medical entrance exams")
- ✅ NO specific exam names (JEE, NEET, CLAT) or strategies
- ✅ NO specific college names
- ✅ Realistic language: "After 12th, you could pursue...", "In 2-3 years..."
- ✅ specificOptions contains REALISTIC, SCHOOL-LEVEL activities (shadowing, volunteering, online courses) NOT internships or LinkedIn
- ✅ specificOptions MAY mention salary in whyThisRole if relevant to stream decision
- ✅ Roadmap focuses on STREAM DECISION and preparation for 11th grade
- ✅ Roadmap phase4 focuses on "Finalize Stream Selection & Prepare for 11th"
- ✅ Projects are realistic for 15-16 year olds (school-level, parent-guided)
- ✅ Overall summary STARTS with "This is an exploratory stage - these recommendations are based on your current interests and will evolve"
- ✅ Overall tone is supportive but realistic, acknowledging this is guidance not a final decision`;
}
