/**
 * After 10th (Stream Selection) Assessment Prompt Builder
 * 
 * This prompt is specifically for students who have completed 10th grade
 * and are choosing their stream (Science/Commerce/Arts) for 11th-12th.
 * Focus is on stream selection, foundational skills, and exploration.
 */

import type { AssessmentData, AdaptiveAptitudeResults } from '../types';

/**
 * Pre-process adaptive aptitude results into actionable insights
 */
function processAdaptiveResults(results: AdaptiveAptitudeResults): {
  section: string;
  isHighAptitude: boolean;
} {
  // Fix 3: Add null guards for adaptive results
  const level = results.aptitudeLevel ?? 2; // default to 2 if undefined
  const accuracy = results.overallAccuracy ?? 50; // default to 50% if undefined
  const isHighAptitude = level >= 4 || accuracy >= 75;
  
  const levelLabels: Record<number, string> = {
    1: 'Emerging',
    2: 'Developing', 
    3: 'Capable',
    4: 'Strong',
    5: 'Exceptional'
  };
  
  // Fix 3: Add null guard for subtags
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
## ADAPTIVE APTITUDE TEST RESULTS
## ═══════════════════════════════════════════════════════════════════════════

- **Aptitude Level**: ${level}/5 (${levelLabels[level] || 'Unknown'})
- **Overall Accuracy**: ${Math.round(accuracy)}%
- **Confidence**: ${results.confidenceTag}
- **Performance Trend**: ${results.pathClassification}

**COGNITIVE STRENGTHS**:
${topStrengths.length > 0 ? topStrengths.map(s => `- ${s}`).join('\n') : '- Balanced across all areas'}

**AREAS FOR DEVELOPMENT**:
${weakAreas.length > 0 ? weakAreas.map(s => `- ${s}`).join('\n') : '- No significant gaps'}

${isHighAptitude ? `
**⭐ HIGH-APTITUDE STUDENT** (Level ${level}, ${Math.round(accuracy)}% accuracy)
Consider competitive pathways:
- Science Stream → IIT-JEE, NEET, KVPY, Olympiads
- Commerce Stream → CA Foundation, CS Foundation
- Any Stream → UPSC preparation (start early), NDA, CLAT
` : ''}

**IMPORTANT**: Use these adaptive test results to recommend the most suitable stream and career paths.

## ═══════════════════════════════════════════════════════════════════════════
## YOUR ANALYTICAL THINKING PROCESS (Complete this BEFORE generating output)
## ═══════════════════════════════════════════════════════════════════════════

Before recommending ANY stream, you MUST complete this internal reasoning:

### THINK STEP 1: Analyze Adaptive Aptitude Results (HIGHEST PRIORITY)
- Look at aptitude_level (1-5), overall_accuracy (%), confidence_tag, path_classification
- Check performance at each difficulty level - especially difficulty 3 (mid-level)
- Ask yourself: "Is this student's cognitive performance STABLE or FLUCTUATING?"
- Ask yourself: "Can this student handle sustained academic pressure for 2 years?"
- **CRITICAL DECISION RULES**:
  * IF aptitude_level ≤ 2 OR confidence = "low" OR path = "fluctuating" OR difficulty 3 accuracy < 40%:
    → This student needs a MANAGEABLE stream, NOT the most demanding one
    → **PCMB is OFF THE TABLE** (highest cognitive load - requires level 4+, 75%+ accuracy, high confidence)
    → **PCM/PCB are RISKY** (high cognitive load - mark as "Moderate Fit" at best)
    → **Commerce or Arts are SAFER** (moderate cognitive load - mark as "High Fit")

### THINK STEP 2: Calculate RIASEC Scores Precisely
- Go through every question, apply categoryMapping, compute exact scores
- Identify top 3 RIASEC types with exact scores and percentages
- Form the 3-letter RIASEC code (e.g., "IRA", "ASE", "ECS")
- Ask yourself: "What SPECIFIC activities did this student choose?" (not just letters)

### THINK STEP 3: Map Cognitive Strengths to Stream Requirements
**Stream Requirements (Academic Survivability):**
- **Science PCM**: Numerical 65%+, Abstract 60%+, Stable performance, Confidence NOT low, Level 3+
- **Science PCB**: Verbal 60%+, Numerical 55%+, Memory stability, Confidence NOT low, Level 3+
- **Science PCMB**: Numerical 70%+, Abstract 70%+, Verbal 65%+, Level 4+, Confidence HIGH, Stable/Ascending path
- **Commerce**: Numerical 55%+, Verbal 55%+, Stable attention, Level 2+ OK
- **Arts/Humanities**: Any aptitude profile, Verbal/Creative strengths preferred, Level 2+ OK

Ask yourself for EACH stream:
- "Does this student MEET the threshold?" (Yes/No)
- "Does this student have STABLE performance?" (Yes/No)
- "Does this student have CONFIDENCE?" (Yes/No)
- "Can this student SUSTAIN this for 2 years?" (Yes/No)

If ANY answer is "No" → That stream is RISKY or OFF THE TABLE

### THINK STEP 4: Match Interests to Streams (AFTER aptitude check)
**RIASEC to Stream Mapping (Use as GUIDE, not absolute rule):**
- High I + R → Science (PCM) IF aptitude supports it
- High I + S → Science (PCB) IF aptitude supports it
- High I + R + S → Science (PCMB) IF aptitude is EXCEPTIONAL (level 4+, 75%+, high confidence)
- High E + C → Commerce IF aptitude supports it
- High A + S → Arts/Humanities (always safe)
- High A + E → Arts/Commerce hybrid

**CRITICAL**: Interests show what they WANT. Aptitude shows what they CAN HANDLE.
If interests say Science but aptitude says No → Recommend Commerce/Arts with STEM electives

### THINK STEP 5: Make Final Stream Decision Using This Decision Tree

**CRITICAL: Follow this decision tree EXACTLY. Do NOT skip steps.**

**STEP 5A: Check Adaptive Aptitude Stability (HIGHEST PRIORITY)**

**CRITICAL: Aptitude LEVEL takes precedence over confidence/path when level is 3+**

IF (aptitude_level ≤ 2) OR (overall_accuracy < 50%):
  → **Student has GENUINELY LOW aptitude**
  → **PCMB is FORBIDDEN** (requires level 4+, 75%+ accuracy)
  → **PCM/PCB are RISKY** (require level 3+, stable performance)
  → **Commerce or Arts are RECOMMENDED** (manageable cognitive load)
  → Decision logic:
    * IF High E (Enterprising) OR High C (Conventional) → **Commerce (High Fit)**
    * IF High A (Artistic) OR High S (Social) → **Arts/Humanities (High Fit)**
    * ELSE → **Commerce (High Fit)** (safer default for low aptitude)
  → Explanation: "Your aptitude profile shows [specific issue: low accuracy/level 2]. Starting with a manageable stream will help you build confidence and succeed. You can still pursue science/tech careers through alternative pathways like BCA, BSc IT, or Commerce with Computer Science."
  → **STOP HERE - Do NOT proceed to Step 5B**

ELSE IF (aptitude_level = 3) AND (confidence = "low" OR path = "fluctuating") AND (overall_accuracy < 60%):
  → **Student has MODERATE aptitude but UNSTABLE performance**
  → **PCMB is FORBIDDEN** (requires level 4+, high confidence)
  → **PCM/PCB are RISKY** (require stable performance)
  → **Commerce is RECOMMENDED** (manageable cognitive load, good career prospects)
  → Decision logic:
    * IF High E (Enterprising) OR High C (Conventional) OR Numerical ≥ 55% → **Commerce (High Fit)**
    * IF High A (Artistic) OR High S (Social) → **Arts/Humanities (High Fit)** OR **Commerce (High Fit)** (choose based on numerical aptitude)
    * ELSE → **Commerce (High Fit)** (safer default)
  → Explanation: "Your aptitude level is moderate (level 3), but your performance shows [low confidence/fluctuating pattern]. Commerce offers a balanced path with strong career prospects while being more manageable than Science streams. You can still explore tech/analytical careers through Commerce with Computer Science or pursue BCA/BSc IT after 12th."
  → **STOP HERE - Do NOT proceed to Step 5B**

ELSE IF (aptitude_level ≥ 4) AND (confidence = "low" OR path = "fluctuating"):
  → **Student has HIGH aptitude but UNSTABLE confidence/performance**
  → **This is likely test anxiety or inconsistent preparation, NOT lack of ability**
  → **PCMB is RISKY** (requires both high aptitude AND high confidence)
  → **PCM/PCB are VIABLE** (aptitude level 4+ can handle it with support)
  → **Commerce is SAFE** (leverages aptitude without overwhelming pressure)
  → Decision logic:
    * Check RIASEC interests FIRST (they have the ability, so follow their interests):
      - IF High I (Investigative) AND (High R OR High E) AND Numerical ≥ 65% AND Abstract ≥ 60% → **Science PCM (High Fit)** + mention "Your aptitude level 4 shows strong capability. Focus on building consistency and managing test anxiety."
      - IF High I (Investigative) AND High S (Social) AND Verbal ≥ 60% AND Numerical ≥ 55% → **Science PCB (High Fit)** + mention "Your aptitude level 4 shows strong capability. Focus on building consistency and managing test anxiety."
      - IF High E (Enterprising) OR High C (Conventional) OR Numerical ≥ 55% → **Commerce (High Fit)** + mention "Your aptitude level 4 means you can excel in Commerce with less pressure than Science. This is a strategic choice, not a limitation."
      - IF High A (Artistic) AND High S (Social) AND Low I (< 50%) → **Arts/Humanities (High Fit)** + mention "Your aptitude level 4 means you can excel in any stream. Arts aligns with your creative and social interests."
    * **CRITICAL**: For aptitude level 4+, low confidence is NOT a reason to avoid their interest area - it's a reason to provide support and encouragement
  → **STOP HERE - Do NOT proceed to Step 5B**

**STEP 5B: For Stable Aptitude Students (level 3+, confidence NOT low, NOT fluctuating)**

IF aptitude_level = 3 AND (confidence = "medium" OR "high") AND (path = "stable" OR "ascending"):
  → **Student has MODERATE aptitude - can handle ONE demanding stream**
  → Check numerical and abstract scores:
    * IF Numerical ≥ 65% AND Abstract ≥ 60% AND (High I OR High R) → **Science PCM (Moderate Fit)** + mention "requires consistent effort and support"
    * IF Verbal ≥ 60% AND Numerical ≥ 55% AND (High I OR High S) → **Science PCB (Moderate Fit)** + mention "requires consistent effort and support"
    * IF Numerical ≥ 55% AND (High E OR High C) → **Commerce (High Fit)**
    * ELSE → **Arts/Humanities (High Fit)**
  → **PCMB is still OFF THE TABLE** (requires level 4+)

**STEP 5C: For High Aptitude Students (level 4-5, confidence high, stable/ascending)**

IF aptitude_level ≥ 4 AND confidence = "high" AND (path = "stable" OR "ascending"):
  → **Student has STRONG aptitude - can handle demanding streams**
  → Check for PCMB eligibility FIRST:
    * IF Numerical ≥ 70% AND Abstract ≥ 70% AND Verbal ≥ 65% AND (High I+R+S combination) → **Science PCMB (High Fit)**
    * ELSE check for PCM:
      - IF Numerical ≥ 65% AND Abstract ≥ 60% AND (High I OR High R) → **Science PCM (High Fit)**
    * ELSE check for PCB:
      - IF Verbal ≥ 60% AND Numerical ≥ 55% AND (High I OR High S) → **Science PCB (High Fit)**
    * ELSE check for Commerce:
      - IF Numerical ≥ 55% AND (High E OR High C) → **Commerce (High Fit)**
    * ELSE → **Arts/Humanities (High Fit)**

**STEP 5D: Final Validation**
- Confirm the recommended stream matches BOTH aptitude AND interests
- If there's a mismatch (e.g., interests say Science but aptitude says Commerce), PRIORITIZE APTITUDE
- Explain the mismatch clearly: "While you're interested in [X], your aptitude profile suggests [Y] would be more manageable. You can still pursue [X-related careers] through alternative pathways."

**REMEMBER: NEVER recommend PCMB unless aptitude_level ≥ 4 AND Numerical ≥ 70% AND Abstract ≥ 70% AND Verbal ≥ 65% AND confidence = "high" AND path = "stable" or "ascending"**

### THINK STEP 6: Derive Career Tracks from Student Profile (DO NOT SELECT FROM LISTS)

**CRITICAL: You MUST derive careers from the student's actual profile, NOT select from the career tracks sections below.**

The career tracks sections below are EXAMPLES ONLY to show you what types of careers exist in each stream. You MUST:

1. **First, confirm which stream you recommended** in Step 5 (Science PCM/PCB/PCMB, Commerce, or Arts)
2. **Analyze the student's top 3 RIASEC types** - What specific activities and interests do they show?
3. **Review their cognitive strengths** - Which aptitude areas are strongest? (numerical, verbal, abstract, spatial)
4. **Consider their personality traits** - Are they creative, analytical, people-oriented, detail-oriented?
5. **Derive 3 career clusters** that sit at the intersection of:
   - Their RIASEC interests (what they WANT to do)
   - Their aptitude strengths (what they CAN do well)
   - Their personality traits (HOW they work best)
   - The recommended stream (what's ACCESSIBLE through this educational path)

**DERIVATION RULES:**
- **DO NOT copy job titles from the career tracks sections** - Use them as inspiration only
- **DO NOT mix streams** - If you recommended Science PCM, derive ONLY Engineering/Tech/Research careers
- **DO NOT show Arts careers if you recommended Science** - This is a critical error
- **Each career cluster MUST pass the 3-check filter**:
  1. Interest Check: Aligns with their top RIASEC types (cite specific scores)
  2. Aptitude Check: Matches their cognitive strengths (cite specific accuracy %)
  3. Personality Check: Fits their work style (cite specific traits)

**EXAMPLE OF CORRECT DERIVATION:**
- Student profile: RIASEC = IRA (Investigative 85%, Realistic 75%, Artistic 65%), Numerical 88%, Abstract 82%, High Openness 4.2, High Conscientiousness 4.0
- Recommended stream: Science PCM
- Derived Cluster 1: "Computational Design & Engineering" (NOT just "Technology & Innovation")
  - Why: Combines I (analytical problem-solving) + R (building/creating) + A (creative design) + strong numerical/abstract aptitude + high openness
  - Careers: Computational Designer, Algorithm Engineer, Data Visualization Specialist, Simulation Engineer
  - Evidence: "Your Investigative score of 85% shows strong analytical thinking, Realistic 75% indicates hands-on problem-solving, and Artistic 65% suggests creative approach. Your numerical aptitude of 88% and abstract reasoning of 82% support complex computational work."

**The career tracks sections below are REFERENCE MATERIAL ONLY - DO NOT copy from them directly.**

## ═══════════════════════════════════════════════════════════════════════════

**⚠️ CRITICAL DECISION RULE ⚠️**
When recommending a stream, you MUST follow this priority order:

**1. ADAPTIVE STABILITY CHECK (HIGHEST PRIORITY)**
If adaptive aptitude results show:
- confidence_tag = "low" 
- path_classification = "fluctuating"
- aptitude_level ≤ 2
- accuracy at difficulty 3 < 40%

Then:
→ **AVOID recommending the most demanding streams (PCMB)**
→ **Prefer stable pathways**: PCM or Commerce (based on interests)
→ **Mention**: "This stream is achievable with consistent effort and structured support. Time management and conceptual clarity will be critical."
→ **DO NOT recommend PCMB** - it has the highest cognitive load

**2. PCMB SHOULD ONLY BE RECOMMENDED IF:**
- aptitude_level ≥ 4 (Strong or Exceptional)
- overall_accuracy ≥ 75%
- numerical ≥ 70%
- abstract ≥ 70%
- confidence_tag = "high" or "medium"
- path_classification = "consistent" or "ascending"

**3. STREAM FIT SCORING (Use this, not just thresholds):**

**Science PCM Fit:**
- Numerical ≥ 65% AND Abstract ≥ 60%
- Confidence NOT "low"
- Stable performance across difficulty levels
- If aptitude_level ≤ 2: Mark as "Moderate Fit" not "High Fit"

**Science PCB Fit:**
- Verbal ≥ 60% AND Numerical ≥ 55%
- Memory & recall stability
- If aptitude_level ≤ 2: Mark as "Moderate Fit"

**Commerce Fit:**
- Numerical ≥ 55% AND Verbal ≥ 55%
- Stable attention and clerical skills
- **SAFE CHOICE for aptitude_level ≤ 2**

**Arts/Humanities Fit:**
- Any aptitude profile works
- Verbal or creative strengths preferred
- **SAFE CHOICE for low aptitude or fluctuating performance**

**4. INTERESTS SECOND (After aptitude stability check)**
- Use RIASEC to choose between streams they CAN handle
- Never recommend a stream if aptitude is insufficient or unstable

**5. NEVER recommend a stream if:**
- Aptitude is below threshold AND confidence is low
- Performance is fluctuating AND stream is demanding
- Student will likely struggle and burn out

Example: If RIASEC shows High I+R (Science interests) BUT aptitude_level = 2, confidence = "low", fluctuating:
→ Recommend Commerce or Arts with STEM electives
→ Explain: "While you enjoy science, your current aptitude profile suggests starting with a less demanding stream. You can pursue science careers through alternative pathways."`;

  return { section, isHighAptitude };
}

export function buildAfter10Prompt(assessmentData: AssessmentData, answersHash: number): string {
  // Fix 4: Pre-compute stream hint to reduce LLM guessing
  const aptitude = assessmentData.aptitudeScores;
  const numerical = aptitude?.numerical?.percentage ?? 0;
  const abstract = aptitude?.abstract?.percentage ?? 0;
  const verbal = aptitude?.verbal?.percentage ?? 0;
  
  let streamHint = "Commerce"; // Safe default
  if (numerical >= 65 && abstract >= 60) {
    streamHint = "Science (PCM)";
  } else if (verbal >= 60 && numerical >= 55) {
    streamHint = "Science (PCB)";
  } else if (numerical >= 55) {
    streamHint = "Commerce";
  } else if (verbal >= 55) {
    streamHint = "Arts/Humanities";
  }
  
  // Pre-process adaptive results for efficiency
  const adaptiveData = assessmentData.adaptiveAptitudeResults 
    ? processAdaptiveResults(assessmentData.adaptiveAptitudeResults)
    : null;
  
  const adaptiveSection = adaptiveData?.section || '';

  return `You are an expert career counselor for students who have completed 10th grade and are choosing their stream for 11th-12th. This is a CRITICAL decision point that will shape their college and career options. Analyze this student's comprehensive assessment and provide clear, actionable guidance for stream selection.

## CRITICAL: This must be DETERMINISTIC - same input = same output always
Session ID: ${answersHash}

## ═══════════════════════════════════════════════════════════════════════════
## PRE-COMPUTED HINT (Verify and use this as starting point)
## ═══════════════════════════════════════════════════════════════════════════

**Aptitude-based stream hint**: ${streamHint}
- Numerical: ${numerical}%
- Abstract: ${abstract}%
- Verbal: ${verbal}%

**INSTRUCTION**: Use this hint as your starting point. Override ONLY if:
1. RIASEC interests STRONGLY contradict (e.g., high A+S but numerical is 70%+)
2. AND adaptive aptitude results support the override
3. Otherwise, TRUST the aptitude-based hint

## ═══════════════════════════════════════════════════════════════════════════
## YOUR PRIMARY GOAL: RECOMMEND THE BEST STREAM FOR 11TH-12TH
## ═══════════════════════════════════════════════════════════════════════════

**STREAM OPTIONS:**
1. **Science (PCM)**: Physics, Chemistry, Mathematics → Engineering, Technology, Research
2. **Science (PCB)**: Physics, Chemistry, Biology → Medicine, Healthcare, Life Sciences
3. **Science (PCMB)**: All four subjects → Maximum flexibility (Engineering OR Medical)
4. **Commerce**: Accountancy, Business Studies, Economics → Business, Finance, Management
5. **Arts/Humanities**: Psychology, Sociology, Political Science, Economics → Creative, Social Sciences, Law

## ═══════════════════════════════════════════════════════════════════════════
## YOUR PRIMARY GOAL: RECOMMEND THE BEST STREAM FOR 11TH-12TH
## ═══════════════════════════════════════════════════════════════════════════

**STREAM OPTIONS:**
1. **Science (PCM)**: Physics, Chemistry, Mathematics → Engineering, Technology, Research
2. **Science (PCB)**: Physics, Chemistry, Biology → Medicine, Healthcare, Life Sciences
3. **Science (PCMB)**: All four subjects → Maximum flexibility (Engineering OR Medical)
4. **Commerce**: Accountancy, Business Studies, Economics → Business, Finance, Management
5. **Arts/Humanities**: Psychology, Sociology, Political Science, Economics → Creative, Social Sciences, Law

**CRITICAL: YOUR RECOMMENDATION MUST BE BASED ON BOTH INTERESTS AND APTITUDE**

**YOUR TASK:**
1. Calculate RIASEC scores from the interest answers below
2. Review the adaptive aptitude test results (already calculated and provided)
3. **MOST IMPORTANT**: Match the student's aptitude scores to stream requirements:
   - Science PCM requires: Numerical 65%+, Abstract 60%+
   - Science PCB requires: Verbal 60%+, Numerical 55%+
   - Commerce requires: Numerical 55%+, Verbal 55%+
   - Arts/Humanities: Any aptitude profile works, but consider strengths
4. If interests suggest one stream but aptitude suggests another, PRIORITIZE APTITUDE
5. Provide 3 career clusters aligned with the recommended stream
6. Explain WHY this stream fits them better than alternatives (using BOTH interests AND aptitude)

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 1: CAREER INTERESTS (RIASEC)
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.riasecAnswers, null, 2)}

**RIASEC Type Meanings:**
- **R (Realistic)**: Building, fixing, tools, outdoor work, sports, hands-on activities
- **I (Investigative)**: Science, research, analysis, experiments, problem-solving, learning
- **A (Artistic)**: Art, music, writing, performing, creating, designing, expressing ideas
- **S (Social)**: Helping people, teaching, counseling, healthcare, working with groups
- **E (Enterprising)**: Leading, organizing, persuading, selling, managing, entrepreneurship
- **C (Conventional)**: Organizing, data management, following procedures, detail work

**RIASEC TO STREAM MAPPING:**
- **High I + R** → Science (PCM) - Engineering, Technology, Research
- **High I + S** → Science (PCB) - Medicine, Healthcare, Biotechnology
- **High I + R + S** → Science (PCMB) - Maximum flexibility
- **High E + C** → Commerce - Business, Finance, Management
- **High A + S** → Arts - Creative fields, Media, Design
- **High A + E** → Arts/Commerce - Creative Business, Event Management
- **High S + E** → Commerce/Arts - HR, Marketing, Social Work

**SCORING ALGORITHM:**
1. For each question with categoryMapping, look up the RIASEC type for the student's answer
2. Add 2 points for each answer to the corresponding RIASEC type
3. Calculate percentage: (score / maxScore) × 100
4. Identify top 3 types by score (MUST be exactly 3 types, even if some scores are 0)
5. The RIASEC code is the top 3 types as a 3-letter string (e.g., "ASE", "IES", "RIC") - MUST be exactly 3 letters
6. Use the mapping above as a STARTING POINT, but ALWAYS consider aptitude scores before finalizing stream recommendation

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 2: PERSONALITY (BIG FIVE)
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.bigFiveAnswers, null, 2)}

**BIG FIVE SCORING**: Calculate average (mean) score for each dimension (6 questions per dimension, divide sum by 6).

**Dimensions**:
- **Openness (O)**: Curiosity, imagination, creativity, willingness to try new things
- **Conscientiousness (C)**: Organization, discipline, reliability, goal-orientation
- **Extraversion (E)**: Sociability, energy, assertiveness, enthusiasm
- **Agreeableness (A)**: Cooperation, empathy, kindness, trust
- **Neuroticism (N)**: Emotional stability, stress management (lower is better)

**PERSONALITY TO STREAM MAPPING:**
- **High O + C** → Science - Curiosity + Discipline = Research/Engineering success
- **High E + C** → Commerce - Leadership + Organization = Business success
- **High O + A** → Arts - Creativity + Empathy = Creative/Social careers
- **High C (any stream)** → Indicates strong work ethic and exam preparation ability

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 3: WORK VALUES & MOTIVATORS
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.workValuesAnswers, null, 2)}

**WORK VALUES SCORING**: Calculate average (mean) score for each dimension (3 questions per dimension, divide sum by 3).

**Dimensions**:
- **Impact**: Making a difference, helping others, social contribution
- **Status**: Recognition, prestige, respect, visibility
- **Autonomy**: Independence, freedom, self-direction
- **Security**: Stability, job security, predictability
- **Financial**: Salary, benefits, financial rewards
- **Lifestyle**: Work-life balance, location, flexibility
- **Creativity**: Innovation, originality, artistic expression
- **Leadership**: Managing others, authority, decision-making

**CRITICAL: You MUST include a "scores" object with all 8 dimensions (impact, status, autonomy, security, financial, lifestyle, creativity, leadership) with calculated scores (1-5 scale).**

**VALUES TO STREAM MAPPING:**
- **High Impact + Financial** → Science (PCB) - Medicine offers both
- **High Financial + Status** → Science (PCM) or Commerce - Engineering/Business
- **High Creativity + Autonomy** → Arts - Creative freedom
- **High Leadership + Financial** → Commerce - Business/Entrepreneurship

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 4: EMPLOYABILITY SKILLS
## ═══════════════════════════════════════════════════════════════════════════

${JSON.stringify(assessmentData.employabilityAnswers, null, 2)}

**EMPLOYABILITY ASSESSMENT**: Assess readiness across key skills:
- Communication, Teamwork, Problem-Solving, Adaptability, Digital Literacy, Work Ethic

**CRITICAL: You MUST include BOTH "skillScores" and "scores" objects with the same data (for backward compatibility). Calculate scores as percentages (0-100) for each skill dimension.**

Calculate overall readiness score and identify strengths and gaps.

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 5: APTITUDE (MULTI-DOMAIN)
## ═══════════════════════════════════════════════════════════════════════════

Pre-calculated aptitude scores:
${JSON.stringify(assessmentData.aptitudeScores, null, 2)}

**NOTE**: If clerical shows 0/0, it means no clerical questions were asked (not a weakness). Do not penalize for this.

**APTITUDE TO STREAM MAPPING:**
- **High Numerical + Abstract** → Science (PCM) - Engineering, Technology
- **High Verbal + Numerical** → Science (PCB) or Commerce - Medicine or Business
- **High Verbal + Spatial** → Arts - Design, Architecture, Media
- **High Numerical + Clerical** → Commerce - Accounting, Finance

**CRITICAL**: Aptitude scores are the STRONGEST predictor of academic success. Weight them heavily in stream recommendation.

## ═══════════════════════════════════════════════════════════════════════════
## SECTION 6: STREAM KNOWLEDGE (DOMAIN-SPECIFIC)
## ═══════════════════════════════════════════════════════════════════════════

Knowledge answers and assessment:
${JSON.stringify(assessmentData.knowledgeAnswers, null, 2)}

Total questions: ${assessmentData.totalKnowledgeQuestions}

**KNOWLEDGE ASSESSMENT**:
- Score >= 70%: Strong foundation, ready for that stream
- Score 50-69%: Moderate foundation, needs focused preparation
- Score < 50%: Weak foundation, consider alternative streams or foundational courses

${adaptiveSection}

## ═══════════════════════════════════════════════════════════════════════════
## CAREER DERIVATION RULES (CRITICAL - READ CAREFULLY)
## ═══════════════════════════════════════════════════════════════════════════

**⚠️ CRITICAL WARNING ⚠️**
The career tracks sections below (Science PCM, Science PCB, Commerce, Arts) contain EXAMPLE careers to show you what types of roles exist in each stream. These are REFERENCE MATERIAL ONLY.

**YOU MUST NOT:**
- Copy job titles directly from these sections
- Use the hardcoded salary ranges as-is
- Select careers just because they're listed under the recommended stream
- Mix streams (e.g., showing Arts careers when you recommended Science)

**YOU MUST:**
- DERIVE careers from the student's unique profile intersection
- Analyze their specific RIASEC scores, aptitude strengths, and personality traits
- Create career clusters that match THEIR specific combination
- Provide evidence from THEIR actual assessment data
- Calculate match scores based on THEIR profile, not generic percentages

**DERIVATION PROCESS (Follow this for EVERY career cluster):**

1. **Identify the intersection**: What sits at the overlap of their top 2-3 RIASEC types + their strongest aptitude area + their dominant personality trait?

2. **Ask yourself**: "What careers require THIS specific combination of interests, abilities, and work style?"

3. **Validate with 3-check filter**:
   - Interest Check: Does this career involve activities they chose in the assessment? (cite specific RIASEC scores)
   - Aptitude Check: Does this career require cognitive skills they demonstrated? (cite specific accuracy %)
   - Personality Check: Does this career's work environment match their traits? (cite specific ratings)

4. **Provide transparent derivation**: In the "derivation" field, show your analytical reasoning:
   - "Your combination of [specific RIASEC types with scores] + [specific cognitive strengths with accuracy %] + [specific character traits with ratings] points toward careers where you [specific activities]."

5. **Be specific, not generic**: Instead of "Technology & Innovation", derive something like "Data-Driven Problem Solving" or "Computational Design & Engineering" based on their unique profile.

**EXAMPLE OF CORRECT DERIVATION:**
Student: RIASEC = ASE (Artistic 80%, Social 70%, Enterprising 65%), Verbal 75%, Numerical 60%, High Openness 4.3, High Extraversion 4.1
Recommended Stream: Arts/Humanities

Derived Cluster 1: "Creative Communication & Brand Strategy"
- Derivation: "Your Artistic score of 80% shows strong creative expression, Social 70% indicates people-oriented work, and Enterprising 65% suggests leadership potential. Your verbal aptitude of 75% supports communication-heavy roles, and your high Openness (4.3) and Extraversion (4.1) indicate you thrive in dynamic, collaborative environments. This points toward careers that blend creative content creation with strategic communication and audience engagement."
- Careers: Brand Storyteller, Content Strategist, Creative Communications Manager, Social Impact Designer
- NOT just: "Graphic Designer, UI/UX Designer, Fashion Designer" (too generic, doesn't match their specific SE combination)

**REMEMBER**: The career tracks sections are EXAMPLES to show you what's possible. You must DERIVE careers that match THIS student's unique profile.

**REMEMBER**: The career tracks sections are EXAMPLES to show you what's possible. You must DERIVE careers that match THIS student's unique profile.

## ═══════════════════════════════════════════════════════════════════════════
## CAREER TRACKS REFERENCE SECTIONS (EXAMPLES ONLY - DO NOT COPY DIRECTLY)
## ═══════════════════════════════════════════════════════════════════════════

**⚠️ FINAL WARNING BEFORE YOU READ THE CAREER TRACKS ⚠️**

The sections below show example careers for each stream. These are REFERENCE MATERIAL to help you understand what types of careers exist in each field.

**DO NOT:**
- Copy job titles verbatim from these sections
- Use these as a checklist to select from
- Assume these are the only careers available
- Mix careers from different streams

**DO:**
- Use these as inspiration to understand career domains
- Derive careers that match the student's SPECIFIC profile
- Create unique career clusters based on their RIASEC + aptitude + personality intersection
- Provide evidence from THEIR assessment data, not generic descriptions

**If you find yourself copying "Graphic Designer₹3L - ₹8L" or "Software Engineer₹6-18L" directly, STOP. You are not deriving from the student's profile.**

---

### SCIENCE (PCM) - For High I+R, Strong Numerical+Abstract Aptitude

**TRACK 1 - Technology & Innovation** (High Fit: 85-95% match)
- **Hot Roles**: Software Engineer (₹6-18L entry, ₹18-50L mid, ₹50-150L senior), Data Scientist (₹7-20L entry, ₹20-60L mid, ₹60-200L senior), AI/ML Engineer (₹8-25L entry, ₹25-80L mid, ₹80-250L senior), Full Stack Developer (₹6-15L entry, ₹15-45L mid, ₹45-120L senior), Cloud Architect (₹10-25L entry, ₹25-70L mid, ₹70-180L senior)
- **Education Path**: B.Tech CS/IT/AI/ML → MTech/MS → PhD (optional)
- **Entrance Exams**: JEE Main, JEE Advanced, BITSAT, VITEEE, SRMJEEE
- **11th-12th Focus**: Mathematics (calculus, algebra), Physics (mechanics, electronics), Chemistry (basics), Computer Science (optional but helpful)
- **Market Reality**: Highest paying stream. Remote work = global salaries. Portfolio + skills > college brand

**TRACK 2 - Engineering & Core Industries** (Medium Fit: 75-84% match)
- **Hot Roles**: Mechanical Engineer (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Civil Engineer (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), Aerospace Engineer (₹6-15L entry, ₹15-50L mid, ₹50-150L senior), Robotics Engineer (₹5-12L entry, ₹12-35L mid, ₹35-100L senior), Electrical Engineer (₹4-10L entry, ₹10-35L mid, ₹35-90L senior)
- **Education Path**: B.Tech Mechanical/Civil/Aerospace/Electrical → MTech → MBA (for management roles)
- **Entrance Exams**: JEE Main, JEE Advanced, state engineering exams
- **11th-12th Focus**: Physics (mechanics, thermodynamics), Mathematics (calculus, vectors), Chemistry
- **Market Reality**: Core engineering = lower pay than software initially. PSUs = stable ₹8-15L. Private = project-based

**TRACK 3 - Research & Academia** (Explore: 65-74% match)
- **Hot Roles**: Research Scientist (₹5-12L entry, ₹12-40L mid, ₹40-100L senior), PhD Scholar (₹31K-35K/month stipend), Professor (₹6-15L entry, ₹15-50L mid, ₹50-120L senior), ISRO/DRDO Scientist (₹6-15L entry, ₹15-45L mid, ₹45-120L senior), Data Analyst (₹4-10L entry, ₹10-30L mid, ₹30-80L senior)
- **Education Path**: B.Sc/B.Tech → M.Sc/MTech → PhD (8-10 years total)
- **Entrance Exams**: JEE Main, KVPY, NEST, IISc entrance
- **11th-12th Focus**: All three subjects equally (Physics, Chemistry, Mathematics)
- **Market Reality**: Long education path. Academic jobs = stable but lower pay. Industry research (Google, Microsoft) = ₹15-60L

### SCIENCE (PCB) - For High I+S, Strong Verbal+Numerical Aptitude

**TRACK 1 - Medicine & Healthcare** (High Fit: 85-95% match)
- **Hot Roles**: Doctor/MBBS (₹6-15L entry, ₹15-80L mid, ₹80-500L senior/specialist), Surgeon (₹10-25L entry, ₹25-150L mid, ₹150L-2Cr senior), Dentist (₹5-12L entry, ₹12-50L mid, ₹50-200L senior), Pharmacist (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), Medical Researcher (₹5-12L entry, ₹12-40L mid, ₹40-100L senior)
- **Education Path**: NEET → MBBS (5.5 years) → MD/MS (3 years) → Super-specialization (3 years optional)
- **Entrance Exams**: NEET UG (mandatory for all medical colleges)
- **11th-12th Focus**: Biology (human anatomy, physiology), Chemistry (organic, biochemistry), Physics (basics)
- **Market Reality**: 10-year commitment minimum. Private practice = ₹50L-2Cr after 10-15 years. Government jobs = stable ₹10-25L

**TRACK 2 - Life Sciences & Biotechnology** (Medium Fit: 75-84% match)
- **Hot Roles**: Biotechnologist (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Geneticist (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Microbiologist (₹3-8L entry, ₹8-22L mid, ₹22-60L senior), Clinical Research Associate (₹4-10L entry, ₹10-28L mid, ₹28-75L senior), Bioinformatics Specialist (₹5-12L entry, ₹12-35L mid, ₹35-95L senior)
- **Education Path**: B.Sc Biotechnology/Microbiology → M.Sc → PhD (optional)
- **Entrance Exams**: NEET (for some programs), university-specific entrance exams
- **11th-12th Focus**: Biology (genetics, cell biology), Chemistry (organic, biochemistry), Physics
- **Market Reality**: Research-heavy field. Industry jobs (pharma, biotech companies) = ₹8-25L. Academia = lower pay

**TRACK 3 - Allied Health & Paramedical** (Explore: 65-74% match)
- **Hot Roles**: Physiotherapist (₹3-7L entry, ₹7-18L mid, ₹18-50L senior), Nutritionist (₹3-6L entry, ₹6-15L mid, ₹15-40L senior), Medical Lab Technician (₹2-5L entry, ₹5-12L mid, ₹12-30L senior), Radiologist Technician (₹3-7L entry, ₹7-16L mid, ₹16-45L senior), Occupational Therapist (₹3-7L entry, ₹7-17L mid, ₹17-48L senior)
- **Education Path**: BPT/B.Sc Nutrition/B.Sc MLT (3-4 years) → MPT/M.Sc (optional)
- **Entrance Exams**: University-specific entrance exams, some accept NEET
- **11th-12th Focus**: Biology, Chemistry, Physics (basics)
- **Market Reality**: Shorter education path than MBBS. Own practice = ₹10-30L after 5-7 years. Hospital jobs = stable ₹5-15L

### SCIENCE (PCMB) - For High I+R+S, Exceptional Aptitude

**TRACK 1 - Biomedical Engineering** (High Fit: 85-95% match)
- **Hot Roles**: Biomedical Engineer (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Medical Device Designer (₹6-15L entry, ₹15-40L mid, ₹40-110L senior), Clinical Engineer (₹5-12L entry, ₹12-32L mid, ₹32-85L senior), Prosthetics Designer (₹4-10L entry, ₹10-28L mid, ₹28-75L senior)
- **Education Path**: B.Tech Biomedical Engineering → MTech/MS → MBA/PhD (optional)
- **Entrance Exams**: JEE Main, JEE Advanced, BITSAT
- **11th-12th Focus**: All four subjects (Physics, Chemistry, Mathematics, Biology)
- **Market Reality**: Combines engineering + medicine. Medical device companies = ₹10-30L. Research = ₹8-25L

**TRACK 2 - Biotechnology & Bioinformatics** (Medium Fit: 75-84% match)
- **Hot Roles**: Biotech Researcher (₹5-12L entry, ₹12-35L mid, ₹35-95L senior), Genetic Engineer (₹6-14L entry, ₹14-38L mid, ₹38-100L senior), Bioinformatics Analyst (₹5-13L entry, ₹13-36L mid, ₹36-98L senior), Computational Biologist (₹6-15L entry, ₹15-42L mid, ₹42-115L senior)
- **Education Path**: B.Tech Biotechnology → MTech/MS → PhD (for research)
- **Entrance Exams**: JEE Main, BITSAT, university-specific exams
- **11th-12th Focus**: Biology, Chemistry, Mathematics, Physics
- **Market Reality**: Interdisciplinary field. Pharma/biotech companies = ₹10-35L. Academia = ₹6-20L

**TRACK 3 - Flexible Career Path** (Explore: 65-74% match)
- **Strategy**: Keep options open until 12th board results
- **If strong in PCM**: Choose Engineering (JEE route)
- **If strong in PCB**: Choose Medicine (NEET route)
- **If strong in all**: Choose based on interest and entrance exam performance
- **Advantage**: Maximum flexibility. Can prepare for both JEE and NEET simultaneously
- **11th-12th Focus**: Equal focus on all four subjects. Decide by end of 11th based on performance

### COMMERCE - For High E+C, Strong Numerical+Clerical Aptitude

**TRACK 1 - Finance & Accounting** (High Fit: 85-95% match)
- **Hot Roles**: Chartered Accountant (₹6-15L entry, ₹15-50L mid, ₹50-200L senior), Financial Analyst (₹5-12L entry, ₹12-35L mid, ₹35-100L senior), Investment Banker (₹10-25L entry, ₹25-100L mid, ₹100L-5Cr senior), Portfolio Manager (₹8-20L entry, ₹20-70L mid, ₹70-300L senior), Risk Analyst (₹5-12L entry, ₹12-32L mid, ₹32-90L senior)
- **Education Path**: B.Com + CA (5 years) OR BBA Finance → MBA Finance OR B.Com → CFA
- **Entrance Exams**: CA Foundation (can start after 10th), university entrance exams, CAT (for MBA)
- **11th-12th Focus**: Accountancy (financial statements, taxation), Business Studies (finance, management), Economics (micro, macro), Mathematics (statistics)
- **Market Reality**: CA = stable ₹8-15L start, ₹30-80L after 8-10 years. Investment banking = high stress, high reward. CFA = global opportunities

**TRACK 2 - Business & Management** (Medium Fit: 75-84% match)
- **Hot Roles**: Business Manager (₹5-12L entry, ₹12-35L mid, ₹35-100L senior), Operations Manager (₹5-13L entry, ₹13-38L mid, ₹38-110L senior), Strategy Consultant (₹8-20L entry, ₹20-60L mid, ₹60-200L senior), Product Manager (₹10-25L entry, ₹25-80L mid, ₹80-250L senior), Marketing Manager (₹5-12L entry, ₹12-35L mid, ₹35-95L senior)
- **Education Path**: BBA → MBA (from top B-schools) OR B.Com → MBA
- **Entrance Exams**: University entrance exams, CAT/XAT/GMAT (for MBA)
- **11th-12th Focus**: Business Studies (management, marketing), Economics, Accountancy, English (communication)
- **Market Reality**: MBA from top 20 B-schools = ₹20-35L starting. Tier 2 MBA = ₹8-15L. Consulting = ₹15-40L start

**TRACK 3 - Entrepreneurship & Digital Business** (Explore: 65-74% match)
- **Hot Roles**: Entrepreneur/Startup Founder (₹0-50L+ variable), Business Consultant (₹5-15L entry, ₹15-45L mid, ₹45-150L senior), Digital Marketing Manager (₹4-10L entry, ₹10-28L mid, ₹28-80L senior), E-commerce Manager (₹5-12L entry, ₹12-32L mid, ₹32-90L senior), Business Analyst (₹5-12L entry, ₹12-35L mid, ₹35-95L senior)
- **Education Path**: BBA Entrepreneurship → MBA OR B.Com → Start own business OR Digital Marketing certifications
- **Entrance Exams**: University entrance exams
- **11th-12th Focus**: Business Studies, Economics, Computer Science (optional), English
- **Market Reality**: High risk, high reward. Successful startups = ₹50L-10Cr+. Failed startups = learning experience. Digital marketing = stable ₹8-25L

### ARTS/HUMANITIES - MATCH TRACKS TO STUDENT'S RIASEC PROFILE

**CRITICAL: Choose tracks based on student's top 3 RIASEC types, NOT just defaulting to creative careers**

**FOR HIGH ARTISTIC (A) + SOCIAL (S) STUDENTS [ASE, ASI, ASR combinations]:**

**TRACK 1 - Creative & Design** (High Fit: 85-95% match)
- **Hot Roles**: Graphic Designer (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), UI/UX Designer (₹5-15L entry, ₹15-45L mid, ₹45-130L senior), Fashion Designer (₹3-10L entry, ₹10-35L mid, ₹35-150L senior), Interior Designer (₹3-9L entry, ₹9-28L mid, ₹28-85L senior), Animator (₹4-10L entry, ₹10-30L mid, ₹30-90L senior), Brand Designer (₹5-12L entry, ₹12-35L mid, ₹35-100L senior)
- **Education Path**: BDes from NID/NIFT/Srishti OR BA Design OR Diploma + Portfolio
- **Entrance Exams**: NID DAT, NIFT entrance, UCEED, CEED, university-specific exams
- **11th-12th Focus**: Fine Arts (drawing, painting), English (communication), Psychology (understanding users), Computer Science (design software)
- **Market Reality**: Portfolio > degree. Freelancing = ₹50K-5L/month. Agency jobs = ₹5-15L. In-house at tech companies = ₹15-50L. Own studio = ₹20L-1Cr

**TRACK 2 - Media & Communication** (Medium Fit: 75-84% match)
- **Hot Roles**: Journalist (₹3-8L entry, ₹8-22L mid, ₹22-60L senior), Content Writer (₹3-7L entry, ₹7-18L mid, ₹18-50L senior), PR Manager (₹5-12L entry, ₹12-32L mid, ₹32-90L senior), Social Media Manager (₹3-8L entry, ₹8-22L mid, ₹22-65L senior), Film Director (₹5-15L entry, ₹15-50L mid, ₹50L-5Cr senior), Video Editor (₹4-10L entry, ₹10-28L mid, ₹28-80L senior)
- **Education Path**: BA Journalism & Mass Communication OR BA English → Journalism OR Film school (FTII, Whistling Woods)
- **Entrance Exams**: University entrance exams, FTII entrance (for film), IIMC entrance
- **11th-12th Focus**: English (writing, literature), Political Science (current affairs), Sociology (understanding society), Psychology
- **Market Reality**: Journalism = ₹3-10L (print/digital). OTT content creation = ₹10-50L. YouTuber/Content Creator = ₹2-10L entry, ₹10L-2Cr mid (highly variable)

**TRACK 3 - Social Impact & Education** (Explore: 65-74% match)
- **Hot Roles**: Teacher (₹3-8L entry, ₹8-20L mid, ₹20-50L senior), School Counselor (₹4-10L entry, ₹10-25L mid, ₹25-60L senior), Educational Content Creator (₹4-12L entry, ₹12-35L mid, ₹35-90L senior), NGO Program Manager (₹3-8L entry, ₹8-22L mid, ₹22-65L senior), Social Entrepreneur (₹5-15L entry, ₹15-50L mid, ₹50L-2Cr senior)
- **Education Path**: BA Education/Psychology/Sociology → BEd/MEd OR MA Social Work OR Entrepreneurship programs
- **Entrance Exams**: University entrance exams, BEd entrance exams
- **11th-12th Focus**: Psychology, Sociology, English, Political Science
- **Market Reality**: Teaching = ₹3-10L (schools), ₹8-25L (international schools/coaching). EdTech = ₹10-40L. Social entrepreneurship = variable but high impact

---

**FOR HIGH SOCIAL (S) + ENTERPRISING (E) STUDENTS [SEA, SEC, SEI combinations]:**

**TRACK 1 - Human Resources & Organizational Development** (High Fit: 85-95% match)
- **Hot Roles**: HR Manager (₹5-15L entry, ₹15-45L mid, ₹45-120L senior), Talent Acquisition Lead (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Corporate Trainer (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Organizational Psychologist (₹6-15L entry, ₹15-40L mid, ₹40-100L senior), Employee Relations Manager (₹5-13L entry, ₹13-38L mid, ₹38-95L senior)
- **Education Path**: BA Psychology/Sociology → MBA HR OR MA Industrial Psychology OR HR certifications (SHRM, CIPD)
- **Entrance Exams**: CAT/XAT/GMAT (for MBA), university entrance exams
- **11th-12th Focus**: Psychology, Sociology, English (communication), Economics
- **Market Reality**: HR in startups = ₹8-20L. HR in MNCs = ₹12-40L. CHRO roles = ₹50L-2Cr. People analytics = fastest growing

**TRACK 2 - Marketing & Brand Management** (Medium Fit: 75-84% match)
- **Hot Roles**: Marketing Manager (₹5-15L entry, ₹15-45L mid, ₹45-120L senior), Brand Manager (₹6-18L entry, ₹18-50L mid, ₹50-150L senior), Digital Marketing Manager (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Customer Success Manager (₹5-13L entry, ₹13-38L mid, ₹38-95L senior), Growth Manager (₹7-20L entry, ₹20-60L mid, ₹60-180L senior)
- **Education Path**: BA/BBA → MBA Marketing OR Digital Marketing certifications OR Brand Management programs
- **Entrance Exams**: CAT/XAT (for MBA), university entrance exams
- **11th-12th Focus**: English, Psychology (consumer behavior), Economics, Computer Science (digital marketing)
- **Market Reality**: Marketing in startups = ₹8-25L. Marketing in MNCs = ₹15-50L. CMO roles = ₹60L-3Cr. Performance marketing = high demand

**TRACK 3 - Event Management & Hospitality** (Explore: 65-74% match)
- **Hot Roles**: Event Manager (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Wedding Planner (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), Conference Manager (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Hospitality Manager (₹4-10L entry, ₹10-28L mid, ₹28-75L senior), Experience Designer (₹5-13L entry, ₹13-38L mid, ₹38-95L senior)
- **Education Path**: BA/BBA Event Management OR Hotel Management OR MBA Hospitality
- **Entrance Exams**: University entrance exams, hotel management entrance exams
- **11th-12th Focus**: English, Psychology, Business Studies, Economics
- **Market Reality**: Own event company = ₹10-50L after 5 years. Corporate events = ₹8-25L. Destination weddings = ₹15-80L

---

**FOR HIGH INVESTIGATIVE (I) + SOCIAL (S) STUDENTS [ISA, ISE, ISC combinations]:**

**TRACK 1 - Psychology & Counseling** (High Fit: 85-95% match)
- **Hot Roles**: Clinical Psychologist (₹4-12L entry, ₹12-40L mid, ₹40-120L senior), Counselor (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), Organizational Psychologist (₹6-15L entry, ₹15-45L mid, ₹45-130L senior), Educational Psychologist (₹4-10L entry, ₹10-30L mid, ₹30-85L senior), Therapist (₹4-12L entry, ₹12-38L mid, ₹38-110L senior)
- **Education Path**: BA Psychology → MA Clinical Psychology → MPhil/PhD OR RCI license for practice
- **Entrance Exams**: University entrance exams, RCI entrance for clinical programs
- **11th-12th Focus**: Psychology, Biology (for clinical), Sociology, English
- **Market Reality**: Private practice = ₹10-50L after 5-7 years. Corporate counseling = ₹8-25L. Mental health startups = ₹12-40L. High demand post-COVID

**TRACK 2 - Social Research & Policy** (Medium Fit: 75-84% match)
- **Hot Roles**: Social Researcher (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Policy Analyst (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Think Tank Researcher (₹5-13L entry, ₹13-38L mid, ₹38-95L senior), Development Consultant (₹5-15L entry, ₹15-45L mid, ₹45-120L senior), Program Evaluator (₹4-11L entry, ₹11-32L mid, ₹32-85L senior)
- **Education Path**: BA Sociology/Economics/Political Science → MA → PhD OR MPP (Master of Public Policy)
- **Entrance Exams**: University entrance exams, MPP entrance exams
- **11th-12th Focus**: Political Science, Economics, Sociology, History, English
- **Market Reality**: Think tanks = ₹8-25L. International NGOs = ₹10-35L. Government consulting = ₹12-40L. UN/World Bank = ₹20-80L

**TRACK 3 - Social Work & Community Development** (Explore: 65-74% match)
- **Hot Roles**: Social Worker (₹3-7L entry, ₹7-18L mid, ₹18-50L senior), Community Development Officer (₹4-9L entry, ₹9-24L mid, ₹24-65L senior), NGO Program Manager (₹4-10L entry, ₹10-28L mid, ₹28-75L senior), CSR Manager (₹5-13L entry, ₹13-38L mid, ₹38-95L senior), Development Sector Consultant (₹5-15L entry, ₹15-45L mid, ₹45-120L senior)
- **Education Path**: BA Sociology/Social Work → MSW (Master of Social Work) OR MA Development Studies
- **Entrance Exams**: University entrance exams, MSW entrance exams
- **11th-12th Focus**: Sociology, Political Science, Psychology, Economics
- **Market Reality**: NGO sector = ₹3-12L. Corporate CSR = ₹8-25L. International development = ₹12-40L. Social entrepreneurship = variable

---

**FOR HIGH ENTERPRISING (E) + INVESTIGATIVE (I) STUDENTS [EIA, EIS, EIC combinations]:**

**TRACK 1 - Management Consulting & Strategy** (High Fit: 85-95% match)
- **Hot Roles**: Management Consultant (₹8-20L entry, ₹20-60L mid, ₹60-200L senior), Strategy Consultant (₹10-25L entry, ₹25-80L mid, ₹80-250L senior), Business Analyst (₹6-15L entry, ₹15-45L mid, ₹45-130L senior), Corporate Strategy Manager (₹8-22L entry, ₹22-70L mid, ₹70-220L senior), Operations Consultant (₹7-18L entry, ₹18-55L mid, ₹55-160L senior)
- **Education Path**: BA Economics/Political Science → MBA from top B-schools (IIM, ISB, XLRI) OR MA Economics
- **Entrance Exams**: CAT/XAT/GMAT (for MBA), university entrance exams
- **11th-12th Focus**: Economics, Mathematics, Political Science, English
- **Market Reality**: MBB consulting (McKinsey, BCG, Bain) = ₹20-35L start. Tier 2 consulting = ₹12-25L. Partner level = ₹1-5Cr

**TRACK 2 - Civil Services & Public Administration** (Medium Fit: 75-84% match)
- **Hot Roles**: IAS Officer (₹56K-2.5L/month + perks), IPS Officer (₹56K-2L/month + perks), IFS Diplomat (₹56K-2L/month + perks), IRS Officer (₹56K-2L/month + perks), State Civil Services (₹40K-1.5L/month + perks)
- **Education Path**: Any BA/BSc/BCom → UPSC CSE preparation (2-3 years) OR State PSC exams
- **Entrance Exams**: UPSC CSE (Civil Services Examination), State PSC exams
- **11th-12th Focus**: History, Political Science, Geography, Economics, English
- **Market Reality**: UPSC success rate = 0.1% (requires 2-3 years dedicated prep). Lifetime job security + prestige + power. Retirement benefits excellent

**TRACK 3 - Political Analysis & International Relations** (Explore: 65-74% match)
- **Hot Roles**: Political Analyst (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Policy Advisor (₹6-15L entry, ₹15-45L mid, ₹45-120L senior), International Relations Specialist (₹6-18L entry, ₹18-55L mid, ₹55-150L senior), Think Tank Analyst (₹5-13L entry, ₹13-38L mid, ₹38-95L senior), Geopolitical Consultant (₹7-20L entry, ₹20-60L mid, ₹60-180L senior)
- **Education Path**: BA Political Science/International Relations → MA → PhD OR MPP OR Foreign Service exam
- **Entrance Exams**: University entrance exams, IFS exam (for diplomacy)
- **11th-12th Focus**: Political Science, History, Geography, Economics, English
- **Market Reality**: Think tanks = ₹8-25L. Media houses = ₹6-18L. International organizations = ₹15-50L. Consulting firms = ₹12-40L

---

**FOR HIGH CONVENTIONAL (C) + INVESTIGATIVE (I) STUDENTS [CIA, CIS, CIE combinations]:**

**TRACK 1 - Law & Legal Services** (High Fit: 85-95% match)
- **Hot Roles**: Corporate Lawyer (₹6-18L entry, ₹18-80L mid, ₹80-300L senior), Legal Consultant (₹5-15L entry, ₹15-50L mid, ₹50-180L senior), Compliance Officer (₹5-12L entry, ₹12-35L mid, ₹35-100L senior), Patent Attorney (₹6-15L entry, ₹15-45L mid, ₹45-130L senior), Legal Researcher (₹4-10L entry, ₹10-30L mid, ₹30-85L senior)
- **Education Path**: BA LLB (5 years) from NLU OR 3-year LLB after graduation → LLM for specialization
- **Entrance Exams**: CLAT (for NLUs), AILET (for NLU Delhi), university law entrance exams
- **11th-12th Focus**: English, Political Science, History, Economics, Logical Reasoning
- **Market Reality**: Top law firms (AZB, Cyril Amarchand) = ₹15-25L start. Tier 2 firms = ₹8-15L. Corporate in-house = ₹10-30L after 5 years. Partner = ₹50L-5Cr

**TRACK 2 - Regulatory & Compliance** (Medium Fit: 75-84% match)
- **Hot Roles**: Regulatory Affairs Manager (₹6-15L entry, ₹15-45L mid, ₹45-130L senior), Compliance Manager (₹6-18L entry, ₹18-55L mid, ₹55-160L senior), Legal Advisor (₹5-13L entry, ₹13-38L mid, ₹38-110L senior), Contract Specialist (₹5-12L entry, ₹12-35L mid, ₹35-95L senior), Risk & Compliance Analyst (₹5-14L entry, ₹14-42L mid, ₹42-120L senior)
- **Education Path**: BA LLB OR BA + LLB OR BCom + LLB → Compliance certifications (CRCM, CAMS)
- **Entrance Exams**: CLAT, university law entrance exams
- **11th-12th Focus**: Economics, Political Science, Business Studies, English
- **Market Reality**: Banking compliance = ₹8-25L. Pharma/healthcare compliance = ₹10-35L. Fintech compliance = ₹12-40L. High demand post-regulation changes

**TRACK 3 - Judiciary & Legal Academia** (Explore: 65-74% match)
- **Hot Roles**: Judge (₹80K-3L/month + perks), Magistrate (₹60K-2L/month + perks), Law Professor (₹6-15L entry, ₹15-50L mid, ₹50-150L senior), Legal Academic (₹5-12L entry, ₹12-35L mid, ₹35-95L senior), Public Prosecutor (₹5-15L entry, ₹15-45L mid, ₹45-130L senior)
- **Education Path**: BA LLB → Judicial Services exam OR LLM → PhD → Teaching
- **Entrance Exams**: State Judicial Services exams, UGC NET (for teaching)
- **11th-12th Focus**: Political Science, History, English, Economics
- **Market Reality**: Judicial services = stable ₹80K-3L/month + perks. Law teaching = ₹6-20L. Research = ₹5-15L. Lifetime job security

---

**FOR HIGH ARTISTIC (A) + ENTERPRISING (E) STUDENTS [AES, AEI, AEC combinations]:**

**TRACK 1 - Creative Business & Brand Strategy** (High Fit: 85-95% match)
- **Hot Roles**: Creative Director (₹8-25L entry, ₹25-80L mid, ₹80-250L senior), Brand Manager (₹6-18L entry, ₹18-55L mid, ₹55-170L senior), Advertising Manager (₹6-15L entry, ₹15-45L mid, ₹45-130L senior), Content Strategist (₹5-13L entry, ₹13-40L mid, ₹40-115L senior), Influencer Marketing Manager (₹5-15L entry, ₹15-48L mid, ₹48-140L senior)
- **Education Path**: BA/BBA → MBA Marketing OR BDes → Brand Management OR Self-taught + portfolio
- **Entrance Exams**: CAT/XAT (for MBA), NID/NIFT entrance, university entrance exams
- **11th-12th Focus**: English, Psychology, Business Studies, Fine Arts, Computer Science
- **Market Reality**: Agency creative director = ₹15-50L. In-house at tech companies = ₹20-80L. Own agency = ₹30L-2Cr after 5-7 years

**TRACK 2 - Media Production & Entertainment** (Medium Fit: 75-84% match)
- **Hot Roles**: Media Producer (₹6-18L entry, ₹18-60L mid, ₹60-200L senior), Film Director (₹5-15L entry, ₹15-50L mid, ₹50L-5Cr senior), Content Producer (₹5-13L entry, ₹13-40L mid, ₹40-120L senior), Show Producer (₹6-16L entry, ₹16-50L mid, ₹50-150L senior), Digital Content Head (₹7-20L entry, ₹20-65L mid, ₹65-200L senior)
- **Education Path**: BA Mass Comm → Film school (FTII, Whistling Woods) OR Self-taught + portfolio
- **Entrance Exams**: FTII entrance, university entrance exams
- **11th-12th Focus**: English, Fine Arts, Psychology, Computer Science (editing software)
- **Market Reality**: OTT production = ₹10-50L. YouTube/digital content = ₹5-30L. Film industry = highly variable (₹10L-10Cr). Own production house = ₹20L-5Cr

**TRACK 3 - Entrepreneurship & Startups** (Explore: 65-74% match)
- **Hot Roles**: Startup Founder (₹0-50L+ variable), Creative Entrepreneur (₹5-20L entry, ₹20-80L mid, ₹80L-5Cr senior), Business Owner (₹10-30L entry, ₹30-100L mid, ₹100L-10Cr senior), Franchise Owner (₹8-25L entry, ₹25-80L mid, ₹80L-3Cr senior), Social Entrepreneur (₹5-15L entry, ₹15-50L mid, ₹50L-2Cr senior)
- **Education Path**: BA/BBA Entrepreneurship → MBA OR Start directly with mentorship
- **Entrance Exams**: University entrance exams (optional)
- **11th-12th Focus**: Business Studies, Economics, English, Computer Science, Psychology
- **Market Reality**: High risk, high reward. Successful startups = ₹50L-10Cr+. Failed startups = learning experience. Creative businesses (design studios, agencies) = ₹20L-2Cr after 5 years

---

**DEFAULT TRACKS (For balanced or unclear RIASEC profiles):**

**TRACK 1 - Media & Communication** (High Fit: 85-95% match)
- **Hot Roles**: Journalist (₹3-8L entry, ₹8-22L mid, ₹22-60L senior), Content Writer (₹3-7L entry, ₹7-18L mid, ₹18-50L senior), PR Manager (₹5-12L entry, ₹12-32L mid, ₹32-90L senior), Social Media Manager (₹3-8L entry, ₹8-22L mid, ₹22-65L senior), Communications Specialist (₹4-10L entry, ₹10-28L mid, ₹28-75L senior)
- **Education Path**: BA Journalism & Mass Communication OR BA English → Journalism
- **Entrance Exams**: University entrance exams, IIMC entrance
- **11th-12th Focus**: English, Political Science, Sociology, Psychology
- **Market Reality**: Journalism = ₹3-10L. Digital media = ₹5-18L. Corporate communications = ₹8-25L

**TRACK 2 - Education & Training** (Medium Fit: 75-84% match)
- **Hot Roles**: Teacher (₹3-8L entry, ₹8-20L mid, ₹20-50L senior), Corporate Trainer (₹4-10L entry, ₹10-30L mid, ₹30-80L senior), Educational Content Creator (₹4-12L entry, ₹12-35L mid, ₹35-90L senior), Curriculum Designer (₹4-11L entry, ₹11-32L mid, ₹32-85L senior), Learning & Development Manager (₹5-15L entry, ₹15-45L mid, ₹45-130L senior)
- **Education Path**: BA Education → BEd OR BA + BEd OR MA + BEd
- **Entrance Exams**: BEd entrance exams, university entrance exams
- **11th-12th Focus**: Psychology, English, Sociology, Subject specialization
- **Market Reality**: Government schools = ₹3-8L. International schools = ₹8-25L. EdTech = ₹10-40L. Corporate training = ₹8-30L

**TRACK 3 - Social Sciences & Law** (Explore: 65-74% match)
- **Hot Roles**: Lawyer (₹4-12L entry, ₹12-50L mid, ₹50-300L senior), Psychologist (₹3-8L entry, ₹8-25L mid, ₹25-70L senior), Social Worker (₹3-7L entry, ₹7-18L mid, ₹18-50L senior), Policy Analyst (₹5-12L entry, ₹12-35L mid, ₹35-90L senior), Civil Services Officer (₹56K-2.5L/month + perks)
- **Education Path**: BA LLB (5 years) OR BA Psychology → MA OR BA → UPSC preparation
- **Entrance Exams**: CLAT (for law), UPSC CSE (for civil services), university entrance exams
- **11th-12th Focus**: Political Science, History, Economics, Psychology, Sociology, English
- **Market Reality**: Law = ₹8-25L (varies by firm). Psychology = ₹5-15L. UPSC = 0.1% success rate. Social work = ₹3-12L

## ═══════════════════════════════════════════════════════════════════════════
## OUTPUT FORMAT
## ═══════════════════════════════════════════════════════════════════════════

## ⚠️ STREAM GUARD — READ BEFORE WRITING JSON ⚠️

**CRITICAL**: Before writing the careerFit section, you MUST:

1. **Identify the stream you recommended** in the recommendedStream section above
2. **ALL THREE career clusters MUST come from that stream ONLY**

**Stream-to-Career Mapping (STRICT):**
- If stream = "Science (PCM)" → ONLY show Engineering/Tech/Research careers
- If stream = "Science (PCB)" → ONLY show Medicine/Healthcare/Life Sciences careers  
- If stream = "Science (PCMB)" → Mix of Engineering AND Medical careers
- If stream = "Commerce" → ONLY show Business/Finance/Management careers
- If stream = "Arts/Humanities" → ONLY show Creative/Social Sciences/Law careers

**NEVER default to Arts careers unless you explicitly recommended Arts/Humanities.**

If you recommended Science PCM but show "Content Writer" or "Graphic Designer" → YOU FAILED.
If you recommended Commerce but show "Teacher" or "Social Worker" → YOU FAILED.

**IMPORTANT**: Return ONLY a JSON object (no markdown). Use this structure:

{
  "recommendedStream": {
    "stream": "Science (PCM)" | "Science (PCB)" | "Science (PCMB)" | "Commerce" | "Arts/Humanities",
    "confidence": "High" | "Medium" | "Moderate",
    "matchScore": 85,
    "reasoning": "3-4 sentences explaining WHY this stream is the best fit based on their RIASEC, aptitude, personality, and values",
    "evidence": {
      "interest": "RIASEC types that support this stream (e.g., High I: 85%, R: 75%)",
      "aptitude": "Cognitive strengths that align (e.g., Numerical: 88%, Abstract: 82%)",
      "personality": "Personality traits that fit (e.g., High Conscientiousness: 4.2, Openness: 4.0)",
      "values": "Work values satisfied (e.g., Achievement: 4.5, Financial: 4.2)",
      "employability": "Skills that support success (e.g., Problem-solving: 85%, Digital Literacy: 90%)",
      "knowledge": "Domain readiness (e.g., Knowledge score: 75%)",
      "adaptiveAptitude": "Adaptive test results (e.g., Level 4/5, 82% accuracy, strong in logical reasoning)"
    },
    "whyNotOtherStreams": {
      "alternativeStream1": "Why this alternative is less suitable",
      "alternativeStream2": "Why this alternative is less suitable"
    },
    "preparationAdvice": "Specific advice for preparing for this stream in 11th-12th"
  },
  "riasec": {
    "code": "ABC",
    "topThree": ["Top 3 RIASEC codes"],
    "scores": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "percentages": { "R": 0, "I": 0, "A": 0, "S": 0, "E": 0, "C": 0 },
    "maxScore": 24,
    "interpretation": "What their interests mean for stream selection"
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
    "cognitiveProfile": "How they think and solve problems",
    "streamAlignment": "Which stream their aptitude profile best supports"
  },
  "bigFive": {
    "O": 3.5, "C": 3.2, "E": 3.8, "A": 4.0, "N": 2.5,
    "workStyleSummary": "Their work style and how personality shapes stream fit"
  },
  "workValues": {
    "scores": {
      "impact": 4.5,
      "status": 3.8,
      "autonomy": 4.0,
      "security": 3.5,
      "financial": 4.2,
      "lifestyle": 3.7,
      "creativity": 4.3,
      "leadership": 3.9
    },
    "topThree": [
      {"value": "Primary work value", "score": 4.5, "description": "Why this matters"},
      {"value": "Second value", "score": 4.0, "description": "How this influences stream choice"},
      {"value": "Third value", "score": 3.5, "description": "Impact on career satisfaction"}
    ],
    "interpretation": "How their values should guide stream selection"
  },
  "employability": {
    "skillScores": {
      "communication": 75,
      "teamwork": 80,
      "problemSolving": 85,
      "adaptability": 70,
      "digitalLiteracy": 90,
      "workEthic": 85
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
    "careerReadiness": "Assessment of their readiness for 11th-12th and beyond"
  },
  "knowledge": {
    "score": 75,
    "correctCount": 15,
    "totalQuestions": 20,
    "domainReadiness": "Assessment of their academic preparation",
    "recommendations": ["Specific preparation strategies"]
  },
  "careerFit": {
    "clusters": [
      {
        "title": "Technology & Innovation" | "Creative & Design" | "Finance & Accounting" (cluster name WITHOUT "TRACK 1 -" prefix),
        "trackNumber": 1,
        "matchScore": 88,
        "fit": "High",
        "description": "Comprehensive explanation of why this career path fits",
        "examples": ["6-8 specific career roles with salary ranges"],
        "educationPath": "What to study in 11th-12th, then college majors",
        "whatYoullDo": "Day-to-day work in this field",
        "whyItFits": "Detailed connection to their profile",
        "evidence": {
          "interest": "RIASEC support (e.g., High I: 85%, R: 75%)",
          "aptitude": "Cognitive fit (e.g., Numerical: 88%, Abstract: 82%)",
          "personality": "Personality alignment (e.g., High Conscientiousness: 4.2)",
          "values": "Values match (e.g., Achievement: 4.5, Financial: 4.2)",
          "employability": "Skills support (e.g., Problem-solving: 85%)",
          "knowledge": "Knowledge readiness (e.g., Score: 75%)"
        },
        "roles": {
          "entry": ["5-6 entry-level positions with salary ranges"],
          "mid": ["5-6 mid-career positions with salary ranges"],
          "senior": ["4-5 senior positions with salary ranges"]
        },
        "domains": ["Related specializations"],
        "salaryRange": {
          "entry": {"min": 4, "max": 8, "currency": "LPA"},
          "mid": {"min": 10, "max": 25, "currency": "LPA"},
          "senior": {"min": 30, "max": 100, "currency": "LPA"}
        },
        "growthOutlook": "Industry growth trends and future opportunities",
        "subjectsToFocusIn11th12th": ["Specific subjects to excel in for this career path"],
        "entranceExams": ["Relevant entrance exams (e.g., JEE Main, NEET, CLAT)"]
      },
      {
        "title": "Engineering & Core Industries" | "Media & Communication" | "Business & Management" (cluster name WITHOUT "TRACK 2 -" prefix),
        "trackNumber": 2,
        "matchScore": 78,
        "fit": "Medium",
        "description": "Why this is a strong alternative",
        "examples": ["5-6 career options with salary ranges"],
        "educationPath": "11th-12th subjects, then college programs",
        "whatYoullDo": "Work overview",
        "whyItFits": "Profile alignment",
        "evidence": {
          "interest": "RIASEC support",
          "aptitude": "Cognitive fit",
          "personality": "Personality alignment",
          "values": "Values match",
          "employability": "Skills support",
          "knowledge": "Knowledge readiness",
          "adaptiveAptitude": "Adaptive test validation"
        },
        "roles": {
          "entry": ["4-5 entry positions with salary ranges"],
          "mid": ["4-5 mid positions with salary ranges"],
          "senior": ["3-4 senior positions with salary ranges"]
        },
        "domains": ["Related fields"],
        "salaryRange": {
          "entry": {"min": 3, "max": 7, "currency": "LPA"},
          "mid": {"min": 8, "max": 20, "currency": "LPA"},
          "senior": {"min": 25, "max": 80, "currency": "LPA"}
        },
        "growthOutlook": "Career prospects",
        "subjectsToFocusIn11th12th": ["Key subjects for this path"],
        "entranceExams": ["Relevant entrance exams"]
      },
      {
        "title": "Research & Academia" | "Social Sciences & Law" | "Entrepreneurship & Digital Business" (cluster name WITHOUT "TRACK 3 -" prefix),
        "trackNumber": 3,
        "matchScore": 68,
        "fit": "Explore",
        "description": "Worth exploring as backup option",
        "examples": ["4-5 careers with salary ranges"],
        "educationPath": "11th-12th preparation, then degree options",
        "whatYoullDo": "Work description",
        "whyItFits": "Potential fit areas",
        "evidence": {
          "interest": "Interest connections",
          "aptitude": "Aptitude support",
          "personality": "Personality considerations",
          "values": "Values alignment",
          "employability": "Skills relevance",
          "knowledge": "Knowledge gaps/strengths",
          "adaptiveAptitude": "Adaptive test insights"
        },
        "roles": {
          "entry": ["3-4 entry roles with salary ranges"],
          "mid": ["3-4 mid roles with salary ranges"],
          "senior": ["2-3 senior roles with salary ranges"]
        },
        "domains": ["Related areas"],
        "salaryRange": {
          "entry": {"min": 3, "max": 6, "currency": "LPA"},
          "mid": {"min": 7, "max": 18, "currency": "LPA"},
          "senior": {"min": 20, "max": 60, "currency": "LPA"}
        },
        "growthOutlook": "Future potential",
        "subjectsToFocusIn11th12th": ["Subjects to keep options open"],
        "entranceExams": ["Relevant entrance exams"]
      }
    ],
    "specificOptions": {
      "highFit": [
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 6, "max": 15}, "description": "Primary career role with highest match to student's profile. Requires strong foundation in recommended stream subjects."},
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 7, "max": 20}, "description": "High-demand role with excellent growth prospects. Aligns with student's top RIASEC types and aptitude strengths."},
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 8, "max": 25}, "description": "Specialized role requiring advanced skills. Offers premium compensation and career advancement opportunities."},
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 6, "max": 18}, "description": "Versatile career path with multiple specialization options. Strong job market demand and stability."},
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 10, "max": 25}, "description": "Senior-level career trajectory with leadership opportunities. Combines technical expertise with strategic thinking."},
        {"name": "Actual Job Title from TRACK 1 based on student's stream and RIASEC profile", "salary": {"min": 6, "max": 15}, "description": "Emerging field with rapid growth. Ideal for students with strong analytical and problem-solving skills."}
      ],
      "mediumFit": [
        {"name": "Actual Job Title from TRACK 2 based on student's stream", "salary": {"min": 4, "max": 10}, "description": "Solid alternative career path with good growth potential. Aligns with secondary RIASEC interests."},
        {"name": "Actual Job Title from TRACK 2 based on student's stream", "salary": {"min": 3, "max": 8}, "description": "Stable career option with consistent demand. Suitable for students with balanced aptitude profile."},
        {"name": "Actual Job Title from TRACK 2 based on student's stream", "salary": {"min": 6, "max": 15}, "description": "Specialized field requiring focused skill development. Offers unique career opportunities and challenges."},
        {"name": "Actual Job Title from TRACK 2 based on student's stream", "salary": {"min": 5, "max": 12}, "description": "Growing field with innovation opportunities. Combines technical knowledge with practical application."},
        {"name": "Actual Job Title from TRACK 2 based on student's stream", "salary": {"min": 4, "max": 10}, "description": "Versatile career with multiple industry applications. Good work-life balance and job security."}
      ],
      "exploreLater": [
        {"name": "Actual Job Title from TRACK 3 based on student's stream", "salary": {"min": 5, "max": 12}, "description": "Alternative career path worth exploring. May require additional skill development or interest cultivation."},
        {"name": "Actual Job Title from TRACK 3 based on student's stream", "salary": {"min": 3, "max": 8}, "description": "Long-term career option with academic or specialized focus. Suitable as backup plan or future consideration."},
        {"name": "Actual Job Title from TRACK 3 based on student's stream", "salary": {"min": 6, "max": 15}, "description": "Career path requiring patience and dedication. Offers stability and social impact opportunities."},
        {"name": "Actual Job Title from TRACK 3 based on student's stream", "salary": {"min": 4, "max": 10}, "description": "Practical career option with steady growth. Good entry point for exploring the field before specialization."}
      ]
    }
  },
  "skillGap": {
    "priorityA": [
      {
        "skill": "Critical Skill #1",
        "currentLevel": "Beginner/Intermediate",
        "targetLevel": "Intermediate/Advanced",
        "reason": "Why essential for recommended stream",
        "howToBuild": "Specific courses, resources, practice",
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
    "recommendedTrack": "Clear skill development roadmap"
  },
  "roadmap": {
    "immediate": {
      "title": "Before 11th Grade Starts",
      "goals": ["Finalize stream choice", "Prepare mentally", "Gather resources"],
      "actions": ["Specific preparation steps"],
      "milestones": ["Readiness checkpoints"]
    },
    "eleventhGrade": {
      "title": "11th Grade Focus",
      "goals": ["Build strong foundation", "Develop study habits", "Explore career options"],
      "actions": ["Subject-specific strategies", "Extracurricular activities"],
      "milestones": ["Academic targets", "Skill development goals"]
    },
    "twelfthGrade": {
      "title": "12th Grade & Entrance Exams",
      "goals": ["Excel in board exams", "Prepare for entrance exams", "Finalize college choices"],
      "actions": ["Exam preparation strategies", "College research", "Application planning"],
      "milestones": ["Board exam targets", "Entrance exam scores", "College admissions"]
    },
    "entranceExams": [
      {
        "exam": "JEE Main/Advanced" | "NEET" | "CLAT" | "CA Foundation" | "NDA" | "Other",
        "relevance": "Why this exam matters for their stream",
        "preparationTimeline": "When to start, how long to prepare",
        "keySubjects": ["Subjects to focus on"],
        "resources": ["Recommended coaching/books/online resources"]
      }
    ],
    "projects": [
      {
        "title": "Portfolio Project #1",
        "description": "Detailed project description",
        "skills": ["Skills developed"],
        "timeline": "During 11th or 12th",
        "difficulty": "Beginner/Intermediate",
        "output": "What they'll create",
        "careerRelevance": "How it helps their goals"
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
    "uniqueStrengths": ["3-4 standout qualities"],
    "developmentAreas": ["2-3 areas for growth"],
    "streamFitSummary": "Why the recommended stream is their best choice"
  },
  "finalNote": {
    "advantage": "Their strongest competitive advantage",
    "focusArea": "One key area to focus on in 11th-12th",
    "encouragement": "Personalized motivational message about their stream choice"
  },
  "overallSummary": "3-4 sentences synthesizing their profile and providing clear direction for stream selection and 11th-12th preparation"
}

## ═══════════════════════════════════════════════════════════════════════════
## CRITICAL GUIDELINES
## ═══════════════════════════════════════════════════════════════════════════

**STREAM RECOMMENDATION RULES:**
1. **Check adaptive stability FIRST** - If level ≤ 2 or confidence = "low" or fluctuating → Avoid PCMB, prefer stable streams
2. **Use scoring, not just thresholds** - Consider stability, confidence, and difficulty performance
3. **Be realistic about academic load** - PCM/PCB are demanding, PCMB is most demanding, Commerce/Arts are more manageable
4. **Interests guide choice within capability** - Don't let interests override cognitive readiness
5. **Provide honest guidance** - If they're borderline, say "Moderate Fit" and mention support needs
6. **Consider survivability** - Academic success requires sustained performance, not just threshold scores

**CAREER CLUSTER RULES:**
1. **CRITICAL: Align with recommended stream** - All 3 clusters MUST be achievable through the recommended stream
   - If you recommend Science PCM → Show Engineering/Tech/Research tracks ONLY
   - If you recommend Science PCB → Show Medical/Healthcare/Biotech tracks ONLY
   - If you recommend Science PCMB → Show Biomedical/Healthcare Tech tracks ONLY
   - If you recommend Commerce → Show Business/Finance/Management tracks ONLY
   - If you recommend Arts/Humanities → Show Creative/Media/Social Science tracks ONLY
2. **DO NOT mix streams** - If you recommend Science, do NOT show Arts careers
3. **Provide evidence from ALL 6 sections**: Interest, Aptitude, Personality, Values, Employability, Knowledge
4. **Include "subjectsToFocusIn11th12th"**: Specific subjects they should excel in for each career path
5. **Be specific**: Provide concrete career titles, not vague categories
6. **Include salary ranges**: Realistic Indian market salaries (in LPA)
7. **Show progression**: Entry → Mid → Senior career paths

**VALIDATION CHECKLIST:**
- [ ] ONE primary stream recommended with clear reasoning
- [ ] Evidence from ALL 6 sections for stream recommendation
- [ ] Stream recommendation considers BOTH interests AND aptitude (aptitude takes priority)
- [ ] **CRITICAL: Followed the decision tree in Step 5 - if aptitude_level ≤ 2 OR confidence = "low" OR fluctuating, did NOT recommend Science streams**
- [ ] If recommending Arts/Humanities, explain why despite moderate/strong numerical aptitude
- [ ] EXACTLY 3 career clusters aligned with recommended stream
- [ ] **CRITICAL: Career clusters are DERIVED from student's unique profile, NOT copied from the career tracks sections**
- [ ] **CRITICAL: Career clusters MATCH the recommended stream** (Science → Engineering/Medical, Commerce → Business, Arts → Creative/Media)
- [ ] **CRITICAL: NO MIXING STREAMS**: If Science recommended, do NOT show Arts/Commerce careers
- [ ] **CRITICAL: Each cluster has a "derivation" field showing analytical reasoning from student's specific data**
- [ ] Each cluster title is SPECIFIC to the student's profile (NOT generic like "Technology & Innovation")
- [ ] Each cluster has trackNumber field (1, 2, or 3)
- [ ] Each cluster has evidence from ALL 6 sections with ACTUAL scores/percentages from THIS student
- [ ] Each cluster has "subjectsToFocusIn11th12th" field
- [ ] Each cluster has "entranceExams" field with relevant exams
- [ ] "whyNotOtherStreams" explains why alternatives are less suitable
- [ ] Entrance exams relevant to recommended stream included in roadmap
- [ ] Roadmap covers: Before 11th, 11th Grade, 12th Grade
- [ ] Response is valid JSON (no markdown, no truncation)
- [ ] riasec.code is EXACTLY a 3-letter string (e.g., "ASE"), NOT 2 letters, NOT an array
- [ ] **CRITICAL: specificOptions contains ACTUAL job titles from the student's recommended stream, NOT placeholder text**
- [ ] **CRITICAL: No hardcoded career examples like "Graphic Designer₹3L - ₹8L" - all careers must be derived from student profile**

**CRITICAL: CAREER NAMING CONVENTION:**
- **TRACK 1** = High Fit (85-95% match) - Best career path for their profile
- **TRACK 2** = Medium Fit (75-84% match) - Strong alternative option
- **TRACK 3** = Explore (65-74% match) - Worth exploring as backup

**CRITICAL: specificOptions MUST BE POPULATED WITH ACTUAL ROLES FROM THE RECOMMENDED STREAM:**

**⚠️ DO NOT COPY THE PLACEHOLDER TEXT ⚠️**
The "name" fields below say "Actual Job Title from TRACK X based on student's stream" - you MUST replace these with real job titles from the career tracks sections above that match the student's recommended stream.

**INSTRUCTIONS:**
1. Look at which stream you recommended (Science PCM/PCB/PCMB, Commerce, or Arts)
2. Go to that stream's career tracks section above
3. Extract actual job titles from TRACK 1, TRACK 2, and TRACK 3
4. Use those real job titles in the specificOptions below
5. Match the salary ranges to the actual roles

**Example of CORRECT output:**
- If you recommended Science PCM and TRACK 1 is "Technology & Innovation":
  - highFit: [{"name": "Software Engineer", "salary": {"min": 6, "max": 15}}, {"name": "Data Scientist", "salary": {"min": 8, "max": 20}}]
- If you recommended Arts and TRACK 1 is "Creative & Design":
  - highFit: [{"name": "Graphic Designer", "salary": {"min": 3, "max": 8}}, {"name": "UI/UX Designer", "salary": {"min": 5, "max": 15}}]

The AI MUST replace the example job titles with ACTUAL roles from the student's recommended stream:

**For Science (PCM) students:**
- highFit: Software Engineer, Data Scientist, AI/ML Engineer, Full Stack Developer, Cloud Architect, Cybersecurity Analyst
- mediumFit: Mechanical Engineer, Civil Engineer, Aerospace Engineer, Robotics Engineer, Electrical Engineer
- exploreLater: Research Scientist, PhD Scholar, Professor, Data Analyst

**For Science (PCB) students:**
- highFit: Doctor (MBBS), Surgeon, Dentist, Pharmacist, Medical Researcher, Biotechnologist
- mediumFit: Geneticist, Microbiologist, Clinical Research Associate, Bioinformatics Specialist, Biochemist
- exploreLater: Physiotherapist, Nutritionist, Medical Lab Technician, Radiologist Technician

**For Science (PCMB) students:**
- highFit: Biomedical Engineer, Medical Device Designer, Clinical Engineer, Prosthetics Designer, Healthcare Technology Specialist
- mediumFit: Biotech Researcher, Genetic Engineer, Bioinformatics Analyst, Computational Biologist
- exploreLater: Can choose Engineering OR Medical based on 12th performance

**For Commerce students:**
- highFit: Chartered Accountant, Financial Analyst, Investment Banker, Portfolio Manager, Risk Analyst, Business Analyst
- mediumFit: Business Manager, Operations Manager, Strategy Consultant, Product Manager, Marketing Manager
- exploreLater: Entrepreneur, Digital Marketing Manager, E-commerce Manager, Business Consultant

**For Arts/Humanities students - MATCH TO THEIR RIASEC PROFILE:**

**IF High Artistic (A) + Social (S) [ASE, ASI, ASR combinations]:**
- highFit: Graphic Designer, UI/UX Designer, Fashion Designer, Interior Designer, Animator, Brand Designer, Art Therapist
- mediumFit: Content Creator, Social Media Manager, Event Designer, Community Manager, Creative Director
- exploreLater: Art Teacher, Museum Curator, Cultural Program Manager

**IF High Social (S) + Enterprising (E) [SEA, SEC, SEI combinations]:**
- highFit: HR Manager, Corporate Trainer, Public Relations Manager, Event Manager, Counselor, Social Entrepreneur
- mediumFit: Marketing Manager, Brand Strategist, Customer Success Manager, Talent Acquisition Lead
- exploreLater: NGO Director, Community Development Officer, Organizational Psychologist

**IF High Investigative (I) + Artistic (A) [IAS, IAE, IAC combinations]:**
- highFit: UX Researcher, Content Strategist, Technical Writer, Research Analyst, Data Journalist, Documentary Filmmaker
- mediumFit: Market Research Analyst, User Experience Analyst, Information Architect, Science Communicator
- exploreLater: Academic Researcher, Policy Analyst, Think Tank Researcher

**IF High Enterprising (E) + Conventional (C) [ECA, ECS, ECI combinations]:**
- highFit: Business Development Manager, Sales Manager, Operations Manager, Project Manager, Entrepreneur, Consultant
- mediumFit: Account Manager, Client Relations Manager, Business Analyst, Strategy Consultant
- exploreLater: Startup Founder, Franchise Owner, Business Coach

**IF High Investigative (I) + Social (S) [ISA, ISE, ISC combinations]:**
- highFit: Psychologist, Counselor, Social Worker, Clinical Psychologist, Educational Psychologist, Therapist
- mediumFit: Research Psychologist, Behavioral Analyst, Human Resources Specialist, Career Counselor
- exploreLater: School Counselor, Mental Health Advocate, Social Researcher

**IF High Artistic (A) + Enterprising (E) [AES, AEI, AEC combinations]:**
- highFit: Creative Director, Brand Manager, Advertising Manager, Content Strategist, Influencer Marketing Manager, Media Producer
- mediumFit: Marketing Creative Lead, Campaign Manager, Digital Marketing Manager, Social Media Strategist
- exploreLater: Startup Founder (Creative Industry), Agency Owner, Creative Consultant

**IF High Conventional (C) + Investigative (I) [CIA, CIS, CIE combinations]:**
- highFit: Lawyer, Legal Consultant, Compliance Officer, Policy Analyst, Legal Researcher, Corporate Lawyer
- mediumFit: Paralegal, Legal Advisor, Contract Specialist, Regulatory Affairs Manager
- exploreLater: Judge, Magistrate, Legal Academic, Law Professor

**IF High Social (S) + Investigative (I) + Artistic (A) [SIA, SAI, IAS combinations]:**
- highFit: Journalist, Documentary Filmmaker, Content Writer, Podcast Host, Screenwriter, Author
- mediumFit: Editor, Publishing Professional, Media Researcher, Communications Specialist
- exploreLater: Professor (Humanities), Academic Writer, Literary Critic

**IF High Enterprising (E) + Investigative (I) [EIA, EIS, EIC combinations]:**
- highFit: Management Consultant, Strategy Consultant, Business Analyst, Policy Advisor, Political Analyst, Diplomat (IFS)
- mediumFit: Economic Analyst, Market Strategist, Corporate Strategy Manager, Think Tank Analyst
- exploreLater: Civil Services (IAS/IPS/IFS), Political Advisor, International Relations Specialist

**DEFAULT (Balanced RIASEC or unclear profile):**
→ **DO NOT use generic defaults.** Instead:
1. **Check aptitude scores** — highest scoring area determines stream
   - If Numerical ≥ 65% AND Abstract ≥ 60% → Science (PCM)
   - If Numerical ≥ 55% → Commerce
   - If Verbal ≥ 55% → Arts/Humanities
2. **If aptitude is also balanced** → recommend Commerce (safest universal choice)
3. **Commerce highFit careers**: Business Analyst, Operations Manager, Financial Analyst, Accountant, Marketing Manager, HR Manager
4. **Commerce mediumFit careers**: Administrative Manager, Office Manager, Customer Relations, Sales Manager
5. **Commerce exploreLater careers**: Chartered Accountant (CA), Company Secretary (CS), Management Consultant

**EXAMPLES OF CORRECT TRACK TITLES (WITHOUT "TRACK X -" PREFIX):**
- Science (PCM): "Technology & Innovation", "Engineering & Core Industries", "Research & Academia"
- Science (PCB): "Medicine & Healthcare", "Life Sciences & Biotechnology", "Allied Health & Paramedical"
- Science (PCMB): "Biomedical Engineering", "Biotechnology & Bioinformatics", "Flexible Career Path"
- Commerce: "Finance & Accounting", "Business & Management", "Entrepreneurship & Digital Business"
- Arts: "Creative & Design", "Media & Communication", "Social Sciences & Law"

**CRITICAL: DO NOT include "TRACK 1 -", "TRACK 2 -", or "TRACK 3 -" in the title field. The frontend will add this automatically.**

**CORRECT EXAMPLE:**
{
  "title": "Creative & Design",
  "trackNumber": 1
}

**WRONG EXAMPLE:**
{
  "title": "TRACK 1 - Creative & Design",
  "trackNumber": 1
}

**REMEMBER**: This is a CRITICAL life decision. Be thorough, evidence-based, and supportive. Help them make the right choice with confidence.`;

}
