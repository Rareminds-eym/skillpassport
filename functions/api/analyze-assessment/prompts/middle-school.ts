/**
 * Middle School (Grades 6-8) Assessment Prompt Builder
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Calculate RIASEC scores from raw assessment answers
 * This ensures deterministic scoring before sending to AI
 */
function calculateRIASECScores(riasecAnswers: any): Record<string, number> {
  const scores: Record<string, number> = {
    R: 0, I: 0, A: 0, S: 0, E: 0, C: 0
  };

  console.log('[RIASEC-CALC] Starting calculation...');
  console.log('[RIASEC-CALC] Input type:', typeof riasecAnswers);
  console.log('[RIASEC-CALC] Is array?', Array.isArray(riasecAnswers));
  console.log('[RIASEC-CALC] Raw input:', JSON.stringify(riasecAnswers).substring(0, 500));

  // Hardcoded category mappings for middle school questions (ms1-ms5)
  // These match the actual questions in src/features/assessment/data/questions/middleSchoolQuestions.ts
  const middleSchoolMappings: Record<string, Record<string, string>> = {
    'ms1': {
      'Building/making something with your hands': 'R',
      'Drawing/painting/designing': 'A',
      'Solving puzzles or brain games': 'I',
      'Helping someone learn or feel better': 'S',
      'Organizing a class event or selling something': 'E',
      'Being outdoors / with animals / nature': 'R'
    },
    'ms2': {
      'Science experiments': 'I',
      'Math games / logic puzzles': 'I',
      'Writing stories / poems': 'A',
      'Art / craft / design': 'A',
      'Sports / dance / drama': 'R',
      'Group discussions / debates': 'S',
      'Coding / robotics / tinkering': 'I',
      'Community / volunteering': 'S',
      'Business fairs / buying-selling projects': 'E',
      'Gardening / environment clubs': 'R'
    },
    'ms3': {
      'How things work / inventions': 'I',
      'Art / music / creativity': 'A',
      'Mysteries / problem-solving': 'I',
      'People stories / emotions / friendships': 'S',
      'Money/business / "how to grow" ideas': 'E',
      'Nature / space / animals / earth': 'R'
    },
    'ms4': {
      'Make a model / build something': 'R',
      'Make it look beautiful / creative': 'A',
      'Find facts and explain clearly': 'I',
      'Work with friends and share roles': 'S',
      'Plan it, lead it, present it': 'E',
      'Connect it to real life / society / environment': 'S'
    },
    'ms5': {
      'Writing long answers': 'A',
      'Doing calculations': 'I',
      'Speaking in front of people': 'E',
      'Working in groups': 'S',
      'Doing neat/design work': 'A',
      'Doing hands-on/building tasks': 'R'
    }
  };

  // Handle if riasecAnswers is an object instead of array
  // If it's an object, convert to array while preserving the keys as questionId
  const answersArray = Array.isArray(riasecAnswers) 
    ? riasecAnswers 
    : Object.entries(riasecAnswers || {}).map(([key, value]) => ({
        ...value,
        questionId: value.questionId || key // Use existing questionId or the object key
      }));

  console.log('[RIASEC-CALC] Answers array length:', answersArray.length);
  console.log('[RIASEC-CALC] Sample answer:', JSON.stringify(answersArray[0]).substring(0, 200));

  answersArray.forEach((answer, index) => {
    if (!answer) {
      console.log(`[RIASEC-CALC] Question ${index}: Skipped (null/undefined)`);
      return;
    }
    
    // Extract question ID if available (e.g., "ms1", "ms2")
    const questionId = answer.questionId || answer.id || `q${index}`;
    const categoryMapping = answer.categoryMapping || middleSchoolMappings[questionId];
    const response = answer.answer;
    
    // ms5 is INVERSE - asking what they AVOID (subtract points instead of add)
    const isInverseQuestion = questionId === 'ms5';

    console.log(`[RIASEC-CALC] Question ${questionId}:`, {
      hasMapping: !!categoryMapping,
      responseType: typeof response,
      response: Array.isArray(response) ? response.length + ' items' : response,
      isInverse: isInverseQuestion
    });

    if (!categoryMapping) {
      console.log(`[RIASEC-CALC] Question ${questionId}: No categoryMapping found`);
      return;
    }

    // Handle array responses (multiselect)
    if (Array.isArray(response)) {
      console.log(`[RIASEC-CALC] Question ${questionId}: Array response with ${response.length} items`);
      response.forEach(selected => {
        const riasecType = categoryMapping[selected];
        if (riasecType && scores[riasecType] !== undefined) {
          if (isInverseQuestion) {
            // For ms5 (what they avoid), subtract points
            scores[riasecType] = Math.max(0, scores[riasecType] - 2);
            console.log(`[RIASEC-CALC] Subtracted 2 points from ${riasecType} (they avoid "${selected}")`);
          } else {
            scores[riasecType] += 2;
            console.log(`[RIASEC-CALC] Added 2 points to ${riasecType} (from "${selected}")`);
          }
        } else {
          console.log(`[RIASEC-CALC] No mapping found for "${selected}"`);
        }
      });
    }
    // Handle single string responses
    else if (typeof response === 'string') {
      const riasecType = categoryMapping[response];
      console.log(`[RIASEC-CALC] Question ${questionId}: String response "${response}" -> ${riasecType}`);
      if (riasecType && scores[riasecType] !== undefined) {
        if (isInverseQuestion) {
          scores[riasecType] = Math.max(0, scores[riasecType] - 2);
          console.log(`[RIASEC-CALC] Subtracted 2 points from ${riasecType}`);
        } else {
          scores[riasecType] += 2;
          console.log(`[RIASEC-CALC] Added 2 points to ${riasecType}`);
        }
      }
    }
    // Handle rating responses (1-4)
    else if (typeof response === 'number') {
      const strengthType = answer.strengthType || answer.context;
      console.log(`[RIASEC-CALC] Question ${questionId}: Number response ${response}, strengthType: ${strengthType}`);
      if (strengthType && scores[strengthType] !== undefined) {
        if (response >= 3) {
          const points = response === 4 ? 2 : 1;
          scores[strengthType] += points;
          console.log(`[RIASEC-CALC] Added ${points} points to ${strengthType}`);
        }
      }
    }
  });

  console.log('[RIASEC-CALC] Final scores:', scores);
  return scores;
}

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

**INSTRUCTIONS FOR CAREER RECOMMENDATIONS:**
- Analyze the student's cognitive strengths above
- Match careers that require these specific cognitive abilities
- For high aptitude students (Level 4-5), consider prestigious career paths that demand strong cognitive skills
- For developing students (Level 1-2), focus on careers with lower cognitive barriers and growth opportunities
- Always personalize based on BOTH cognitive profile AND RIASEC interests (50/50 weight)
`;

  return { section, isHighAptitude, topStrengths, weakAreas };
}

export function buildMiddleSchoolPrompt(assessmentData: AssessmentData, answersHash: number): string {
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';

  // Calculate RIASEC scores dynamically from responses
  const riasecScores = calculateRIASECScores(assessmentData.riasecAnswers);
  
  // Calculate percentages (highest score = 100%)
  const maxScore = Math.max(...Object.values(riasecScores), 1);
  const riasecPercentages: Record<string, number> = {};
  Object.entries(riasecScores).forEach(([type, score]) => {
    riasecPercentages[type] = Math.round((score / maxScore) * 100);
  });
  
  // Sort by score to get top 3
  const sortedTypes = Object.entries(riasecScores)
    .sort(([,a], [,b]) => b - a)
    .map(([type]) => type);
  
  // Check if all scores are zero - if so, don't assign a Holland code
  const allScoresZero = Object.values(riasecScores).every(score => score === 0);
  
  const topThreeTypes = allScoresZero ? [] : sortedTypes.slice(0, 3);
  const hollandCode = allScoresZero ? '' : topThreeTypes.join('');

  // Check if we have valid RIASEC data
  const hasValidRiasec = !allScoresZero && topThreeTypes.length === 3;

  // Generate dynamic cluster suggestions based on RIASEC combinations
  const generateClusterSuggestions = () => {
    if (!hasValidRiasec) return '';

    const [first, second, third] = topThreeTypes;
    const combo = `${first}${second}`;

    // RIASEC combination to personalized cluster mapping
    const comboMapping: Record<string, string> = {
      // Realistic combinations
      'RI': 'Engineering & Applied Science',
      'RA': 'Creative Technology & Design',
      'RS': 'Healthcare Technology & Support',
      'RE': 'Construction & Project Management',
      'RC': 'Technical Operations & Quality Control',
      
      // Investigative combinations
      'IR': 'Research & Development Engineering',
      'IA': 'Scientific Communication & Design',
      'IS': 'Healthcare & Medical Research',
      'IE': 'Data Science & Business Analytics',
      'IC': 'Research & Information Systems',
      
      // Artistic combinations
      'AR': 'Industrial Design & Innovation',
      'AI': 'Creative Research & Media',
      'AS': 'Arts Education & Therapy',
      'AE': 'Creative Business & Entertainment',
      'AC': 'Graphic Design & Digital Media',
      
      // Social combinations
      'SR': 'Occupational Therapy & Rehabilitation',
      'SI': 'Psychology & Behavioral Science',
      'SA': 'Arts & Creative Therapy',
      'SE': 'Human Resources & Training',
      'SC': 'Education & Administration',
      
      // Enterprising combinations
      'ER': 'Engineering Management & Operations',
      'EI': 'Business Strategy & Consulting',
      'EA': 'Marketing & Brand Management',
      'ES': 'Sales & Customer Relations',
      'EC': 'Business Administration & Finance',
      
      // Conventional combinations
      'CR': 'Technical Documentation & Systems',
      'CI': 'Data Management & Analysis',
      'CA': 'Publishing & Content Management',
      'CS': 'Administrative Services & Support',
      'CE': 'Accounting & Financial Services'
    };

    const suggestedCluster = comboMapping[combo] || `${first}-${second} Hybrid Careers`;
    
    // Generate cluster 2 and 3 suggestions
    const combo2 = `${second}${third}`;
    const combo3 = `${first}${third}`;
    const suggestedCluster2 = comboMapping[combo2] || `${second}-${third} Hybrid Careers`;
    const suggestedCluster3 = comboMapping[combo3] || `${first}-${third} Hybrid Careers`;

    return `
## 🎯 DYNAMIC CAREER CLUSTER GUIDANCE:

**Your RIASEC Profile:** ${hollandCode} (${first}: ${riasecPercentages[first]}%, ${second}: ${riasecPercentages[second]}%, ${third}: ${riasecPercentages[third]}%)

**CRITICAL INSTRUCTIONS FOR CLUSTER GENERATION:**

1. **Analyze the student's unique combination:**
   - Top RIASEC type: ${first} (${riasecPercentages[first]}%)
   - Second RIASEC type: ${second} (${riasecPercentages[second]}%)
   - Third RIASEC type: ${third} (${riasecPercentages[third]}%)
   - Cognitive strengths from adaptive aptitude (see above)

2. **Create 3 personalized cluster titles:**
   - **Cluster 1**: Combine ${first} + ${second} interests with strongest cognitive abilities
   - **Cluster 2**: Combine ${second} + ${third} interests with secondary cognitive abilities
   - **Cluster 3**: Explore ${first} + ${third} OR pure ${third} careers with available cognitive skills

3. **Generate careers dynamically:**
   - Match careers to BOTH interests AND cognitive abilities
   - Consider aptitude level when suggesting career complexity
   - Use modern, exciting language for middle schoolers
   - NO predefined lists - create based on THIS student's profile

4. **Examples of dynamic thinking (DO NOT COPY THESE):**
   - R+I RIASEC + High Spatial + Medium Logical → "Robotics & Engineering Design"
   - A+S RIASEC + High Verbal + Low Numerical → "Creative Storytelling & Communication"
   - E+I RIASEC + High Numerical + High Logical → "Business Analytics & Strategy"
   - S+A RIASEC + Medium Verbal + High Pattern Recognition → "Art Therapy & Creative Wellness"

5. **Match score calculation:**
   - Calculate based on RIASEC alignment (50%) + Aptitude alignment (50%)
   - Higher aptitude = higher match scores for cognitively demanding careers
   - Lower aptitude = focus on careers with lower cognitive barriers

**YOU MUST CREATE UNIQUE RECOMMENDATIONS - NO TEMPLATES OR PREDEFINED LISTS**
`;
  };

  return `You are a career counselor for middle school students (grades 6-8). Analyze this student's interest exploration assessment using the EXACT scoring rules below.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## ⚠️ PRE-CALCULATED RIASEC DATA (YOU MUST USE THESE EXACT VALUES):

**Raw Scores:**
${JSON.stringify(riasecScores, null, 2)}

**Calculated Percentages (Highest = 100%):**
${JSON.stringify(riasecPercentages, null, 2)}

**Holland Code (Top 3 Types):** ${hollandCode || 'NONE - All scores are zero'}

${allScoresZero ? `
## ⚠️ CRITICAL WARNING: NO VALID RIASEC DATA
All RIASEC scores are zero, which means the student did not complete the interest exploration section or there was an error in data collection.

**YOU MUST:**
1. Set riasec.code to empty string ""
2. Set riasec.topThree to empty array []
3. Set all riasec.percentages to 0
4. In riasec.interpretation, explain that interest data is missing and career recommendations are based ONLY on adaptive aptitude results
5. Base ALL career recommendations ONLY on their adaptive aptitude cognitive strengths (numerical, logical, verbal, spatial, pattern recognition, data interpretation)
6. Create personalized cluster titles based on cognitive strengths (e.g., "Analytical Problem Solving" for high logical reasoning, "Creative Communication" for high verbal + pattern recognition)
7. Match scores should be based on cognitive aptitude alignment, not interest alignment
` : `
**Sorted RIASEC Types (Highest to Lowest):**
${sortedTypes.map((type, i) => `${i + 1}. ${type} - ${riasecPercentages[type]}%`).join('\n')}

${generateClusterSuggestions()}`}

**⚠️ CRITICAL RULES:**

**MATCH SCORE CALCULATION (MANDATORY - MUST BE UNIQUE FOR EACH STUDENT):**

**STEP 1: Calculate RIASEC Alignment (50% weight)**
- Cluster 1 (uses top 2 RIASEC types): (Type1% + Type2%) / 2 = RIASEC score
- Cluster 2 (uses 2nd + 3rd types): (Type2% + Type3%) / 2 = RIASEC score  
- Cluster 3 (uses 1st + 3rd OR pure 3rd): (Type1% + Type3%) / 2 OR Type3% = RIASEC score

**STEP 2: Calculate Aptitude Alignment (50% weight)**
- High aptitude careers (requires 60%+ accuracy): Full aptitude score
- Medium aptitude careers (requires 40-60%): 70% of aptitude score
- Low aptitude careers (requires <40%): 50% of aptitude score

**STEP 3: Final Match Score = (RIASEC score × 0.5) + (Aptitude score × 0.5)**

**REAL CALCULATION EXAMPLES (DO NOT COPY - CALCULATE FOR THIS STUDENT):**

Example 1: Student with R=85%, I=70%, A=45%, Aptitude=75%
- Cluster 1 (R+I, high aptitude career): ((85+70)/2 × 0.5) + (75 × 0.5) = 38.75 + 37.5 = 76%
- Cluster 2 (I+A, medium aptitude): ((70+45)/2 × 0.5) + (75×0.7 × 0.5) = 28.75 + 26.25 = 55%
- Cluster 3 (R+A, low aptitude): ((85+45)/2 × 0.5) + (75×0.5 × 0.5) = 32.5 + 18.75 = 51%

Example 2: Student with S=90%, E=80%, A=60%, Aptitude=45%
- Cluster 1 (S+E, medium aptitude): ((90+80)/2 × 0.5) + (45×0.7 × 0.5) = 42.5 + 15.75 = 58%
- Cluster 2 (E+A, medium aptitude): ((80+60)/2 × 0.5) + (45×0.7 × 0.5) = 35 + 15.75 = 51%
- Cluster 3 (S+A, low aptitude): ((90+60)/2 × 0.5) + (45×0.5 × 0.5) = 37.5 + 11.25 = 49%

**CRITICAL REQUIREMENTS:**
1. **NEVER use 85, 75, 65 for every student** - these are just examples
2. **CALCULATE using the formula above** with THIS student's actual RIASEC percentages and aptitude level
3. **Match scores MUST be different** for each student based on their unique profile
4. **Round to nearest whole number** (e.g., 76.3% → 76%)
5. **Scores typically range 45-90%** depending on alignment strength

**VERIFICATION CHECK:**
- If all 3 clusters have scores 85, 75, 65 → YOU FAILED - recalculate using the formula
- If scores don't reflect student's actual RIASEC + aptitude → YOU FAILED - recalculate
- Scores must be mathematically derived from their data, not guessed
- **FOR THIS STUDENT:** RIASEC top 3 are ${topThreeTypes.join(', ')} with percentages ${topThreeTypes.map(t => `${t}=${riasecPercentages[t]}%`).join(', ')}
- **FOR THIS STUDENT:** Aptitude level is ${assessmentData.adaptiveAptitudeResults?.aptitude_level || 'unknown'} with ${assessmentData.adaptiveAptitudeResults?.overall_accuracy || 0}% accuracy
- **FOR THIS STUDENT:** Profile data status: ${assessmentData.studentProfile ? 'HAS verified achievements' : 'NO profile data'}
- **CALCULATE MATCH SCORES USING THESE EXACT VALUES - DO NOT USE 85, 75, 65**

${hasValidRiasec ? `
- You MUST create PERSONALIZED cluster titles based on BOTH the student's RIASEC combination AND cognitive aptitude strengths
- Match scores MUST combine RIASEC fit (50%) + Aptitude fit (50%)
- Do NOT use generic single-letter titles like "Engineering & Technology" - make them specific to THIS student's combination
- Do NOT recommend Music/Entertainment if 'A' is NOT in top 3
- Do NOT recommend Science/Research if 'I' is NOT in top 3
- Do NOT recommend Business/Sales if 'E' is NOT in top 3
- COMBINE interests AND cognitive strengths creatively (e.g., R+A + high spatial = "Robotics & Creative Design", I+S + high verbal = "Medical Research & Patient Communication")
- Use adaptive aptitude to differentiate within RIASEC categories (e.g., high A + high verbal → Writing/Content, high A + high spatial → Animation/Design)
` : `
- NO VALID RIASEC DATA - Base recommendations ONLY on adaptive aptitude cognitive strengths
- Create personalized cluster titles based on cognitive profile (e.g., "Analytical Problem Solving" for high logical reasoning)
- Match scores should reflect cognitive aptitude alignment (e.g., high numerical reasoning → Data Science/Finance)
- Do NOT assign arbitrary RIASEC-based clusters
- Explain in each cluster why the cognitive profile fits that career area
`}

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

## ⚠️ CRITICAL: ARTISTIC (A) RIASEC + ADAPTIVE APTITUDE MATCHING ⚠️
**IF the student's RIASEC scores show 'A' (Artistic) in their top 3 types, you MUST:**

1. **Include at least ONE artistic career cluster**
2. **Use ADAPTIVE APTITUDE to differentiate within artistic careers** (50% weight):

**ADAPTIVE APTITUDE → ARTISTIC CAREER MAPPING:**
- **High Verbal + Pattern Recognition** → Writing, Content Creation, Journalism, Screenwriting, Podcasting
- **High Spatial + Visual Processing** → Animation, 3D Design, Architecture, Game Design, Visual Effects
- **High Logical + Creative** → Music Production, Sound Engineering, Creative Technology, UX Design
- **High Numerical + Artistic** → Data Visualization, Infographics, Financial Design, Analytics Design
- **High Pattern Recognition + Auditory** → Music Composition, DJ, Audio Engineering, Sound Design
- **High Social + Artistic** → Performance Arts, Theatre, Teaching Arts, Art Therapy

**EXAMPLES - DO NOT USE THESE AS TEMPLATES, CREATE UNIQUE RECOMMENDATIONS:**
- Student: A+I RIASEC + High Spatial (85%) + High Logical (80%) → "Creative Technology & Design" (Animation, Game Development, VR Design)
- Student: A+S RIASEC + High Verbal (90%) + Medium Spatial (60%) → "Storytelling & Communication" (Content Creation, Writing, Journalism)
- Student: A+E RIASEC + High Logical (75%) + High Verbal (70%) → "Creative Business & Media" (Marketing, Brand Design, Social Media Strategy)

**DO NOT:**
- Use predefined lists as templates
- Recommend same artistic careers for all high-A students
- Ignore adaptive aptitude when selecting specific roles
- Default to only Technology/Science careers for Artistic students

**YOU MUST:**
- Analyze their specific cognitive strengths from adaptive aptitude
- Match artistic career types to their cognitive profile
- Explain WHY their aptitude fits the recommended artistic careers
- Create personalized cluster titles combining RIASEC + aptitude (e.g., "Visual Storytelling & Design" not just "Arts")

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

${assessmentData.studentProfile ? `
## ═══════════════════════════════════════════════════════════════════════════
## STUDENT PROFILE DATA (REAL EXPERIENCE & ACHIEVEMENTS)
## ═══════════════════════════════════════════════════════════════════════════

**CRITICAL: This is REAL data about what the student has actually done. Use this as PRIMARY evidence:**
1. **Validate aptitude scores** - Projects/certificates confirm cognitive strengths
2. **Personalize recommendations** - Suggest careers aligned with existing experience
3. **Identify skill gaps** - Compare what they have vs what they need
4. **Provide evidence** - Reference specific projects/skills in career recommendations
5. **Calculate match scores** - Use verified achievements for accurate career fit
6. **Build credibility** - Ground recommendations in proven accomplishments

**PROFILE DATA ANALYSIS REQUIREMENTS:**
- Count total verified items in each category
- Identify skill proficiency levels (beginner/intermediate/advanced/expert)
- Analyze project complexity and relevance
- Check certificate authority and recognition
- Evaluate experience duration and relevance
- Connect profile data to specific career recommendations

${assessmentData.studentProfile.skills && assessmentData.studentProfile.skills.length > 0 ? `
### Skills (${assessmentData.studentProfile.skills.length} total):
${JSON.stringify(assessmentData.studentProfile.skills, null, 2)}

**How to use**: Match skills to career requirements. High proficiency = stronger fit.
**CRITICAL: Only use VERIFIED/APPROVED skills (approval_status = 'approved'). Ignore pending/unverified skills.**
` : ''}

${assessmentData.studentProfile.projects && assessmentData.studentProfile.projects.length > 0 ? `
### Projects (${assessmentData.studentProfile.projects.length} total):
${JSON.stringify(assessmentData.studentProfile.projects, null, 2)}

**How to use**: Projects show applied skills. Reference specific projects when explaining career fit.
**CRITICAL: Only use VERIFIED/APPROVED projects (approval_status = 'approved'). Ignore pending/unverified projects.**
Example: "Your game development project demonstrates strong spatial reasoning and creative problem-solving, perfect for Animation & Game Design careers."
` : ''}

${assessmentData.studentProfile.certificates && assessmentData.studentProfile.certificates.length > 0 ? `
### Certificates (${assessmentData.studentProfile.certificates.length} total):
${JSON.stringify(assessmentData.studentProfile.certificates, null, 2)}

**How to use**: Certificates validate skills and show commitment. Prioritize verified certificates.
**CRITICAL: Only use VERIFIED/APPROVED certificates (approval_status = 'approved'). Ignore pending/unverified certificates.**
` : ''}

${assessmentData.studentProfile.internships && assessmentData.studentProfile.internships.length > 0 ? `
### Internships/Experience (${assessmentData.studentProfile.internships.length} total):
${JSON.stringify(assessmentData.studentProfile.internships, null, 2)}

**How to use**: Real work experience is the strongest predictor. Recommend careers aligned with their experience.
**CRITICAL: Only use VERIFIED/APPROVED experience (approval_status = 'approved'). Ignore pending/unverified experience.**
` : ''}

${assessmentData.studentProfile.education && assessmentData.studentProfile.education.length > 0 ? `
### Education (${assessmentData.studentProfile.education.length} records):
${JSON.stringify(assessmentData.studentProfile.education, null, 2)}

**How to use**: Academic background shows preparation level and interests.
**CRITICAL: Only use VERIFIED/APPROVED education records (approval_status = 'approved'). Ignore pending/unverified records.**
` : ''}

**WEIGHTING FORMULA WITH PROFILE DATA (UPDATED - PRIORITIZE REAL EXPERIENCE):**
- Profile Data (skills, projects, education, certificates, internships): 50%
- Adaptive Aptitude (cognitive abilities): 30%
- RIASEC (interests): 20%

**CRITICAL: Profile data is the STRONGEST predictor of career success:**
1. **Skills** show what they can actually do (highest weight)
2. **Projects** demonstrate applied knowledge and initiative
3. **Certificates** validate competencies and commitment
4. **Internships/Experience** prove real-world capability
5. **Education** shows academic preparation
6. **Courses** show continuous learning and skill development

**DYNAMIC WEIGHTING BASED ON AVAILABLE DATA:**

**If student HAS profile data (skills/projects/certificates/internships):**
- Profile Data: 50%
- Adaptive Aptitude: 30%
- RIASEC: 20%

**If student has NO profile data (like THIS student):**
- Adaptive Aptitude: 50% (primary indicator of capability)
- RIASEC: 50% (interests guide direction)
- DO NOT use fixed 60/40 - adjust based on data quality:
  - If aptitude confidence is HIGH: Weight aptitude 60%, RIASEC 40%
  - If aptitude confidence is MEDIUM: Weight aptitude 50%, RIASEC 50%
  - If aptitude confidence is LOW: Weight aptitude 40%, RIASEC 60% (rely more on interests)

**FOR THIS STUDENT:**
- Has Profile Data: ${assessmentData.studentProfile ? 'YES' : 'NO'}
- Aptitude Confidence: ${assessmentData.adaptiveAptitudeResults?.confidence_tag || 'unknown'}
- **Recommended Weighting:** ${assessmentData.studentProfile ? 'Profile 50%, Aptitude 30%, RIASEC 20%' : assessmentData.adaptiveAptitudeResults?.confidence_tag === 'high' ? 'Aptitude 60%, RIASEC 40%' : assessmentData.adaptiveAptitudeResults?.confidence_tag === 'low' ? 'Aptitude 40%, RIASEC 60%' : 'Aptitude 50%, RIASEC 50%'}

**CRITICAL: ADJUST RECOMMENDATIONS BASED ON APTITUDE LEVEL:**

**FOR LOW APTITUDE STUDENTS (Level 1-2, <40% accuracy):**
- Focus on careers with LOWER cognitive barriers
- Emphasize hands-on, practical skills over abstract thinking
- Suggest vocational training and skill-based careers
- Avoid careers requiring high analytical/logical reasoning
- Examples: Skilled trades, creative arts, customer service, retail, hospitality
- DO NOT suggest: Engineering, Data Science, Research, Complex Analysis roles

**FOR MEDIUM APTITUDE STUDENTS (Level 3, 40-60% accuracy):**
- Balance between cognitive and practical careers
- Suggest careers with moderate learning curves
- Include both technical and non-technical options

**FOR HIGH APTITUDE STUDENTS (Level 4-5, >60% accuracy):**
- Include cognitively demanding careers
- Suggest competitive exam pathways (UPSC, JEE, NEET)
- Recommend research, engineering, medicine, law

**FOR THIS SPECIFIC STUDENT:**
- Aptitude Level: ${assessmentData.adaptiveAptitudeResults?.aptitude_level || 0}
- Overall Accuracy: ${assessmentData.adaptiveAptitudeResults?.overall_accuracy || 0}%
- Cognitive Strengths: ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag ? Object.entries(assessmentData.adaptiveAptitudeResults.accuracy_by_subtag).filter(([_, data]: [string, any]) => data.accuracy >= 40).map(([name, data]: [string, any]) => `${name} (${Math.round(data.accuracy)}%)`).join(', ') || 'None above 40%' : 'No data'}
- Cognitive Weaknesses: ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag ? Object.entries(assessmentData.adaptiveAptitudeResults.accuracy_by_subtag).filter(([_, data]: [string, any]) => data.accuracy < 30).map(([name, data]: [string, any]) => `${name} (${Math.round(data.accuracy)}%)`).join(', ') || 'None below 30%' : 'No data'}
- **YOU MUST recommend careers that match THIS aptitude level - NOT generic high-level careers**

**MATCH SCORE CALCULATION WITH PROFILE DATA:**
- Base score from RIASEC + Aptitude (as calculated above)
- Add +15 points if they have relevant VERIFIED skills (approval_status = 'approved')
- Add +15 points if they have relevant VERIFIED projects (approval_status = 'approved')
- Add +10 points if they have relevant VERIFIED certificates (approval_status = 'approved')
- Add +20 points if they have relevant VERIFIED internship/work experience (approval_status = 'approved')
- Add +10 points if they have relevant VERIFIED education/coursework (approval_status = 'approved')
- Add +10 points if they have completed relevant courses (from course enrollment data)
- Maximum match score: 100%

**ADVANCED SCORING RULES:**
1. **Skill Proficiency Multiplier**: 
   - Expert level: Full +15 points
   - Advanced level: +12 points
   - Intermediate level: +8 points
   - Beginner level: +5 points

2. **Project Complexity Multiplier**:
   - Complex/Advanced projects: Full +15 points
   - Medium complexity: +10 points
   - Simple/Beginner projects: +7 points

3. **Experience Duration Multiplier**:
   - 1+ year experience: Full +20 points
   - 6-12 months: +15 points
   - 3-6 months: +10 points
   - <3 months: +7 points

4. **Certificate Authority Multiplier**:
   - Industry-recognized (Google, Microsoft, AWS, etc.): Full +10 points
   - Educational institution: +8 points
   - Online platform (Coursera, Udemy): +6 points
   - Self-issued: +3 points

**CRITICAL: Only count VERIFIED/APPROVED data:**
- Check approval_status field - must be 'approved' or 'verified'
- Unverified/pending data should NOT contribute to match scores
- This ensures recommendations are based on validated achievements only

**Example:** Student with R+I RIASEC (70%), High Aptitude (80%), has VERIFIED Expert Python skill + VERIFIED Complex Robotics project + VERIFIED Google certificate + VERIFIED 6-month internship + VERIFIED STEM coursework + Completed 3 AI courses
- Base: (70 × 0.2) + (80 × 0.3) = 14% + 24% = 38%
- Profile bonus: +15 (expert Python) + 15 (complex project) + 10 (Google cert) + 15 (6-month internship) + 10 (STEM education) + 10 (completed courses) = +75 points
- Profile contribution: 75 × 0.5 = 37.5%
- Final: 38% + 37.5% = 75.5% → Round to 76% match for Engineering careers

**EVIDENCE-BASED RECOMMENDATIONS:**
- Reference specific verified skills, projects, certificates in career explanations
- Use project titles and descriptions to show career fit
- Mention certificate names to validate expertise
- Cite internship roles to demonstrate experience
- Connect coursework to career requirements
` : ''}

**CRITICAL INSTRUCTIONS - NO FALLBACK VALUES ALLOWED:**
1. You MUST generate COMPLETE, PERSONALIZED information for EVERY field
2. NEVER use placeholder text like "Career name 1", "Brief description", "Example text"
3. NEVER use template match scores (85, 75, 65) - CALCULATE using the formula with THIS student's data
4. **MATCH SCORE CALCULATION REMINDER:**
   - Student RIASEC: ${topThreeTypes.map(t => `${t}=${riasecPercentages[t]}%`).join(', ')}
   - Student Aptitude: ${assessmentData.adaptiveAptitudeResults?.overall_accuracy || 0}% (Level ${assessmentData.adaptiveAptitudeResults?.aptitude_level || 0})
   - Profile Data: ${assessmentData.studentProfile ? 'YES - add bonuses' : 'NO - use fallback'}
   - Each cluster MUST have DIFFERENT scores based on RIASEC alignment + Aptitude fit + Profile bonuses
3. NEVER use generic descriptions - make everything specific to THIS student's results
4. ALL role overviews, descriptions, and evidence MUST be fully generated based on their assessment
5. If you cannot generate complete information, the response is INVALID

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this EXACT structure for MIDDLE SCHOOL (6-8):

**CRITICAL DATABASE COMPATIBILITY REQUIREMENTS:**
1. riasec.code MUST be a 3-letter string (e.g., "RIA"), NOT an array
2. aptitude.scores MUST exist with standard categories (verbal, numerical, abstract, spatial, clerical)
3. aptitude.overallScore MUST be a number (0-100)
4. bigFive MUST be a flat object with O, C, E, A, N keys (NO nested "scores" wrapper)

{
  "riasec": {
    "code": "RIA",
    "topThree": ["R", "I", "A"],
    "scores": { "R": 12, "I": 10, "A": 8, "S": 5, "E": 4, "C": 3 },
    "percentages": { "R": 60, "I": 50, "A": 40, "S": 25, "E": 20, "C": 15 },
    "maxScore": 20,
    "interpretation": "MUST BE PERSONALIZED - explain what THEIR specific interests mean for future careers based on their top RIASEC types"
  },
  "aptitude": {
    "scores": {
      "verbal": { "correct": 0, "total": 0, "percentage": 0 },
      "numerical": { "correct": 0, "total": 0, "percentage": 0 },
      "abstract": { "correct": 0, "total": 0, "percentage": 0 },
      "spatial": { "correct": 0, "total": 0, "percentage": 0 },
      "clerical": { "correct": 0, "total": 0, "percentage": 0 }
    },
    "overallScore": ${assessmentData.adaptiveAptitudeResults?.overall_accuracy || 0},
    "adaptiveTest": {
      "numerical_reasoning": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.numerical_reasoning?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their math and number skills based on test results"},
      "logical_reasoning": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.logical_reasoning?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their problem-solving ability based on test results"},
      "verbal_reasoning": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.verbal_reasoning?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their language and word skills based on test results"},
      "spatial_reasoning": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.spatial_reasoning?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their visual thinking based on test results"},
      "data_interpretation": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.data_interpretation?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their ability to analyze and understand data based on test results"},
      "pattern_recognition": {"accuracy": ${assessmentData.adaptiveAptitudeResults?.accuracy_by_subtag?.pattern_recognition?.accuracy || 0}, "description": "MUST BE PERSONALIZED - Describe their pattern-finding ability based on test results"}
    },
    "topStrengths": ["MUST BE REAL STRENGTHS - List 2-3 cognitive strengths from their adaptive test results (e.g., 'Strong numerical reasoning (85%)', 'Excellent pattern recognition (92%)')"],
    "cognitiveProfile": "MUST BE PERSONALIZED - Explain how they think and solve problems based on their adaptive test performance",
    "adaptiveLevel": ${assessmentData.adaptiveAptitudeResults?.aptitude_level || 0},
    "adaptiveConfidence": "${assessmentData.adaptiveAptitudeResults?.confidence_tag || 'low'}"
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
        "matchScore": "<CALCULATE: (RIASEC_avg × 0.5) + (Aptitude × 0.5) - DO NOT USE 85>",
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
        "matchScore": "<CALCULATE: (RIASEC_avg × 0.5) + (Aptitude × 0.5) - DO NOT USE 75>",
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
        "matchScore": "<CALCULATE: (RIASEC_avg × 0.5) + (Aptitude × 0.5) - DO NOT USE 65>",
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
        {"name": "MUST BE REAL JOB TITLE - e.g., Game Developer", "salary": {"min": 5, "max": 12}},
        {"name": "MUST BE REAL JOB TITLE - e.g., Animator", "salary": {"min": 4, "max": 10}},
        {"name": "MUST BE REAL JOB TITLE - e.g., YouTuber/Content Creator", "salary": {"min": 3, "max": 15}}
      ],
      "mediumFit": [
        {"name": "MUST BE REAL JOB TITLE - e.g., Graphic Designer", "salary": {"min": 3, "max": 8}},
        {"name": "MUST BE REAL JOB TITLE - e.g., Teacher", "salary": {"min": 3, "max": 7}}
      ],
      "exploreLater": [
        {"name": "MUST BE REAL JOB TITLE - e.g., Photographer", "salary": {"min": 2, "max": 8}},
        {"name": "MUST BE REAL JOB TITLE - e.g., Chef", "salary": {"min": 2, "max": 6}}
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
