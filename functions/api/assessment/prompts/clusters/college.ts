/**
 * College Cluster Generation (Simplified)
 *
 * Single LLM call that:
 * 1. Selects 6-9 best occupations and clusters into 3 coherent groups
 * 2. Generates narrative context and evidence for each cluster
 * 3. Returns specific job titles for each cluster
 * MatchScores are computed deterministically from DB assessment profiles, not LLM
 */
import type { StudentProfile } from '../../services/core/scoring-service';
import type { PromptOccupation, ClusterNarrativeContext, ClusterPrompt } from '../../types';

export function buildCollegeClusterPrompt(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, occupations, context) };
}

const SYSTEM = `You are a career counselor for college students.

YOUR TASK:
1. Select 6-9 best occupations and cluster into 3 coherent career paths
2. Generate narrative context and evidence for each cluster
3. Return specific job titles organized by cluster
4. MatchScores will be computed deterministically from database assessment profiles

YOUR RESPONSE WILL BE REJECTED IF:
- NOT 6-9 occupations selected
- Clusters not 2-3 each
- Invalid JSON
- Missing narrative elements for any cluster

🚨 **MANDATORY REQUIREMENTS**:
1. SELECT **EXACTLY 6-9** occupations (best fits only)
2. Organize into **exactly 3 clusters** (2-3 each)
3. Provide coherent clustering based on learner signals
4. Return job titles organized by entry/mid level
5. Include evidence for why each cluster fits the learner

SELECTION STRATEGY (USE ALL LEARNER SIGNALS):
- Student stream/degree (MBA, MCA, B.Tech, B.Com, BBA, etc.)
- Aptitude strengths AND weaknesses (growth opportunities, not dealbreakers)
- Knowledge strengths AND weaknesses (⚠️ IF SCORE < 50% in a domain, exclude roles requiring that domain — but redirect to alternate roles in SAME stream, not unrelated fields)
- RIASEC profile (career interests)
- Big Five traits (personality fit)
- Work values (what motivates them)
- Profile narrative (readiness, trajectory)

🚨 **KNOWLEDGE GATE (MANDATORY)**:
If knowledge score is provided:
- Knowledge score ≥ 50%: Use all occupations, weak areas are learning opportunities
- Knowledge score < 50%: Identify weak domains from context. Then:
  * EXCLUDE roles that require those weak domains (e.g., B.Com weak in Accounting → skip Accountant, Auditor, Financial Analyst)
  * REDIRECT to roles in same stream but DIFFERENT domain (e.g., B.Com weak in Accounting → HR, Operations, Business roles)
  * NEVER recommend unrelated fields (e.g., Teaching, Medical, Tech roles for B.Com)

**STEP 1: SELECT OCCUPATIONS (6-9 BEST FITS)**
- From 50 candidates, choose the 6-9 that best align with learner using ALL signals:
  * Stream alignment: Does role leverage this stream's core expertise? (Read stream from LEARNER PROFILE)
  * RIASEC alignment: Does role match learner's interest codes?
  * Aptitude fit: Does role use learner's cognitive strengths?
  * Big Five fit: Does role suit learner's personality traits?
  * Work values: Does role satisfy what motivates them?
  * Knowledge fit: Does learner have prerequisite knowledge?

**How to assess stream alignment:**
- Identify this stream's core domain (e.g., what is the learner studying/trained in?)
- For each candidate role, ask: "Would someone with this stream's background be EFFECTIVE in this role?"
- ACCEPT if: Role requires or benefits from this stream's core knowledge/skills
- REJECT if: Role requires completely different expertise (e.g., specialized HR knowledge when stream is technical)
- Use learner's actual skills, NOT stereotypes about the stream

**STEP 2: GROUP BY NATURAL AFFINITY (CRITICAL)**
- Look at what the selected roles ACTUALLY DO (not what you want to call them)
- Group 6-9 roles into 3 clusters by analyzing:
  * Daily work activities - what do people in these roles DO?
  * Core competencies required - what skills are essential?
  * Industry/domain - do they operate in the same sector?
  * Career progression - can roles progress into each other?

**Example grouping logic (applies to ANY stream):**
- If selected roles all involve "building/coding/systems" → Group as technical/development cluster
- If selected roles all involve "analyzing/reporting/data" → Group as analytics/insights cluster
- If selected roles all involve "managing people/processes" → Group as management/operations cluster
- If selected roles all involve "advising/consulting/strategy" → Group as strategy/advisory cluster

**GROUPING RULES:**
- Each group MUST have 2-3 roles that naturally belong together
- Roles in a group must do SIMILAR daily work (not just have similar titles)
- DO NOT force roles together just because they're both in the candidate list
- DO NOT create artificial clusters - each must represent a genuine career path
- If you cannot naturally group all 6-9 roles into 3 coherent clusters, REDUCE to 2 per cluster

**STEP 3: NAME CLUSTERS FROM ACTUAL GROUPING**
- ONLY AFTER grouping is done, look at each group's roles
- Extract cluster name FROM the role titles you grouped:
  * If group has "AI Engineer", "ML Developer", "LLM Engineer" → Name: "AI & Machine Learning Engineering"
  * If group has "Data Scientist", "Analytics Engineer" → Name: "Data Engineering & Analytics"
  * If group has "Cloud Engineer", "DevOps Engineer" → Name: "Cloud Infrastructure & DevOps"
- RULE: Cluster name MUST reflect what's actually in the group
- RULE: Keep titles 2-5 words, professional, no jargon
- RULE: Use "&" for combinations, no "Track" or arrows

**STEP 4: VALIDATE ALL 7 ALIGNMENT DIMENSIONS FOR EACH CLUSTER**

Before assigning fit levels, verify EACH cluster using all 7 dimensions:
1. **Stream Alignment**: Do these roles require + leverage the learner's stream knowledge?
2. **RIASEC Alignment**: Do roles match learner's RIASEC codes (top 3)?
3. **Big Five Alignment**: Do roles suit learner's personality traits?
4. **Work Values Alignment**: Do roles satisfy learner's motivators?
5. **Aptitude Alignment**: Do roles match learner's cognitive strengths?
6. **Stream Aptitude Alignment**: Does learner have stream-specific aptitudes (programming, analysis, etc.)?
7. **Stream Knowledge Alignment**: Does learner have subject knowledge needed?

**Scoring**: Count how many dimensions align (0-7)
- 6-7 aligned = HIGH FIT (Cluster 1)
- 4-5 aligned = MEDIUM FIT (Cluster 2)
- 3-4 aligned = EXPLORE FIT (Cluster 3)

**STEP 5: ASSIGN FIT LEVELS**
- Cluster 1 (Primary): 6-7 dimensions aligned
  * Derivation: "This career path aligns perfectly with your skills and interests."
- Cluster 2 (Secondary): 4-5 dimensions aligned
  * Derivation: "A promising career option with good alignment to your profile."
- Cluster 3 (Tertiary): 3-4 dimensions aligned
  * Derivation: "Worth exploring as you develop additional skills and experience."

STRICT RULES:
- Use ONLY occupations provided
- NO invented, renamed, or external occupations
- NO hardcoded stream mappings (use learner signals instead)
- NO Junior + Senior duplication (select distinct role types)
- NO raw scores/percentages in narratives

🚨 **CLUSTER SIZE CONSTRAINT (CRITICAL - MUST FOLLOW)**:
- Each cluster MUST have EXACTLY 2 or 3 occupationIds (NO MORE than 3)
- Total across all 3 clusters MUST be between 6 and 9
- Example: Cluster 1 = 2 roles, Cluster 2 = 3 roles, Cluster 3 = 2 roles (Total = 7 ✓)
- Example: Cluster 1 = 3 roles, Cluster 2 = 3 roles, Cluster 3 = 3 roles (Total = 9 ✓)
- REJECT: Cluster 1 = 4 roles, Cluster 2 = 4 roles, Cluster 3 = 4 roles (Total = 12 ✗ TOO MANY)

Return ONLY valid JSON with clusters and narratives (NO roleData — will be computed by backend):
{
  "clusters": [
    {
      "occupationIds": ["<id1>", "<id2>"],
      "title": "<stream-specific pathway name>",
      "derivation": "<1 sentence: alignment>. Use: Cluster 1: 'This career path aligns perfectly with your skills and interests.' Cluster 2: 'A promising career option with good alignment to your profile.' Cluster 3: 'Worth exploring as you develop additional skills and experience.'",
      "description": "<1-2 sentences on the field>",
      "whatYoullDo": "<1 sentence: day-to-day>",
      "whyItFits": "<1-2 sentences using ALL 7 alignment dimensions: stream, RIASEC, Big Five, work values, aptitude, stream aptitude, stream knowledge>",
      "evidence": {
        "interest": "<RIASEC fit: 1 sentence on how their RIASEC codes match these roles>",
        "aptitude": "<Aptitude + Stream Knowledge fit: 1 sentence on cognitive strengths (logic, verbal, data) + subject matter knowledge they have>",
        "personality": "<Big Five fit: 1 sentence on how personality traits (openness, conscientiousness, etc.) support this path>",
        "values": "<Work Values fit: 1 sentence on how work values (achievement, independence, relationships) are met>"
      },
      "roles": { "entry": ["<titles>"], "mid": ["<titles>"] },
      "domains": ["<industries>"],
      "futureOutlook": "<1 sentence>"
    }
  ],
  "specificOptions": {
    "highFit": [
      { "name": "<role 1 from cluster 1>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 2 from cluster 1>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 3 from cluster 1>", "salary": { "min": <LPA number>, "max": <LPA number> } }
    ],
    "mediumFit": [
      { "name": "<role 1 from cluster 2>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 2 from cluster 2>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 3 from cluster 2>", "salary": { "min": <LPA number>, "max": <LPA number> } }
    ],
    "exploreLater": [
      { "name": "<role 1 from cluster 3>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 2 from cluster 3>", "salary": { "min": <LPA number>, "max": <LPA number> } },
      { "name": "<role 3 from cluster 3>", "salary": { "min": <LPA number>, "max": <LPA number> } }
    ]
  },
  "overallSummary": "<A tight 2-3 sentence SYNTHESIS of this learner — see overallSummary RULES below>"
}

specificOptions RULES:
- Group the concrete job titles by cluster: cluster 1's roles → highFit, cluster 2 → mediumFit, cluster 3 → exploreLater.
- Use 2-3 roles per group, drawn from that cluster's entry/mid roles.
- "salary" is an APPROXIMATE entry-to-early-career range in INR LPA (lakhs per annum) for India; integers, min < max.

overallSummary RULES (STUDENT-CENTRIC — written FOR the learner, not ABOUT them):
- 3-4 sentences, ~80-100 words, second person ("You are...") or direct address to the learner
- **PURPOSE**: Validate their strengths, show clear career direction, identify ONE honest gap, inspire growth
- **MUST INCLUDE** (in this order):
  1. **Celebration** (opening): Name 2-3 actual strengths they have (combine interests + cognitive + personality)
  2. **Best-Fit Direction** (middle): Reference their cluster 1 by name, explain WHY they fit there
  3. **Honest Gap** (reality check): ONE main area to develop, framed as learnable/growable
  4. **Growth Mindset** (closing): Encourage action + confidence in their unique combination

- **BANNED**: "should", "consider", "might want to", "the learner", scores/percentages, vague praise, em-dashes (—), hyphens connecting clauses
- **REQUIRED**: Specific strength names, specific cluster name, specific ONE gap (not multiple), action-oriented encouragement, use periods or commas instead of dashes

**EXAMPLES (Student-Centric):**
- "You're naturally a logical thinker who works well with people. That combination is valuable. Your best fit is Student Services Leadership, where analytical thinking meets relationship-building. Financial roles interest you too, but need stronger quantitative foundation. That's learnable through dedicated practice. Your analytical mindset is your superpower; channel it strategically and you'll differentiate yourself."
- "You excel at strategic analysis and have strong drive for impact. That's a rare combination. Management & Operations is your best path where systematic thinking and leadership converge. Your secondary interest in analytics is viable but requires building comfort with detailed data work. You're positioned well for roles that need both vision and execution ability."

**VALIDATION BEFORE SUBMITTING:**
✓ Is it written TO the learner (you/your), not ABOUT them?
✓ Does it celebrate 2-3 specific strengths they actually have?
✓ Does it name their best-fit CLUSTER by actual name?
✓ Does it explain WHY they fit there?
✓ Does it identify ONE specific gap?
✓ Is that gap framed as learnable/actionable?
✓ Does it end with growth mindset encouragement?
✓ NO banned words or percentages?

🚨 **CRITICAL GATE**:

KNOWLEDGE GATE CHECK (IF KNOWLEDGE SCORE < 50%):
□ Have you identified weak knowledge domains from the KNOWLEDGE INSIGHTS section? YES / NO
□ Have you EXCLUDED roles that require those weak domains? YES / NO
□ Have you REDIRECTED to alternate roles in the SAME stream instead? YES / NO
□ Example check: B.Com student weak in Accounting → Did you skip Accountant/Auditor and recommend HR/Ops instead? YES / NO

If knowledge score < 50% and ANY answer is NO:
- STOP, DO NOT SUBMIT
- Review the weak domains
- Remove roles requiring those domains
- Add roles in same stream (different domain)
- Revalidate

BEFORE submitting JSON, verify ALL 7 DIMENSIONS for each cluster:
□ Cluster 1 - Stream Alignment: YES / NO
□ Cluster 1 - RIASEC Alignment: YES / NO
□ Cluster 1 - Big Five Alignment: YES / NO
□ Cluster 1 - Work Values Alignment: YES / NO
□ Cluster 1 - Aptitude Alignment: YES / NO
□ Cluster 1 - Stream Aptitude Alignment: YES / NO
□ Cluster 1 - Stream Knowledge Alignment: YES / NO
[Repeat for Cluster 2 and Cluster 3]

Then count and verify STRUCTURE:
□ Total occupationIds across all clusters: _____ (MUST be 6-9)
□ Cluster 1 count: _____ (MUST be 2-3)
□ Cluster 2 count: _____ (MUST be 2-3)
□ Cluster 3 count: _____ (MUST be 2-3)
□ NO Junior + Senior duplication? (e.g., don't have both "Junior Analyst" AND "Senior Analyst") YES / NO
□ All 6-9 roles are DISTINCT types, not progression levels? YES / NO

Verification:
✓ All 7 dimensions checked for each cluster? YES / NO
✓ Total is 6-9? YES / NO
✓ Each cluster is 2-3? YES / NO
✓ All roles are diverse (no Jr+Sr of same type)? YES / NO

If ANY answer is NO:
- STOP, DO NOT SUBMIT
- Recount and rebalance
- Add/remove occupations to reach 6-9
- Ensure each cluster is exactly 2-3
- Remove duplicate Jr/Sr pairs; replace with distinct role types
- Recount again to verify

Only submit when ALL counts are correct AND roles are diverse."`;

function buildUser(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext,
  extras?: { employabilityScores?: Record<string, number> }
): string {
  const topN = (obj: Record<string, number> | undefined, n: number) =>
    Object.entries(obj || {}).sort(([, a], [, b]) => b - a).slice(0, n)
      .map(([k, v]) => `${k} (${v})`).join(', ');

  const occupationList = occupations
    .map((o) => {
      const desc = o.description ? ` | ${o.description}` : '';
      return `- id=${o.occupation_id} | ${o.name} | RIASEC: ${o.riasecCodes.join('/') || 'n/a'}${desc}`;
    })
    .join('\n');

  const aptitudeInsightsText = context.aptitudeInsights
    ? `APTITUDE INSIGHTS:
Strengths: ${context.aptitudeInsights.strengths?.join(', ') || 'n/a'}
Weaknesses: ${context.aptitudeInsights.weaknesses?.join(', ') || 'n/a'}
Pattern: ${context.aptitudeInsights.pattern || 'n/a'}`
    : '';

  const knowledgeInsightsText = context.knowledgeInsights
    ? `KNOWLEDGE INSIGHTS:
Strengths: ${context.knowledgeInsights.strengths?.join(', ') || 'n/a'}
Weaknesses/Growth Areas: ${context.knowledgeInsights.weaknesses?.join(', ') || 'n/a'}`
    : '';

  const profileNarrativeText = context.profileNarrative
    ? `PROFILE NARRATIVE:
${context.profileNarrative}`
    : '';

  return `STUDENT PROFILE
Program / stream: ${student.stream || 'Not specified'}
Study level: ${student.degreeLevel || 'Not specified'} ${student.degreeLevel === 'postgraduate' ? '(postgraduate — emphasise advanced/specialist entry points and higher salary bands)' : student.degreeLevel === 'undergraduate' ? '(undergraduate — emphasise entry-level roles, internships and graduate-trainee salary bands)' : ''}
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Big Five (strongest first): ${topN(student.big_five_scores, 5) || 'Not available'}
Work values (top): ${topN(student.work_values, 3) || 'Not available'}
Knowledge score: ${student.knowledge_score != null ? student.knowledge_score + '%' : 'Not available'}
Adaptive aptitude: ${formatAptitude(context.adaptive)}

${aptitudeInsightsText}

${knowledgeInsightsText}

${profileNarrativeText}

CANDIDATE OCCUPATIONS (~50 real candidates — use these ONLY):
${occupationList}

**YOUR TASK:**
1. Select **6-9 best occupations** from the candidate list (ONLY the best fits)
2. Group into exactly **3 clusters** (2-3 each)
3. Provide narratives and evidence for each cluster
4. Return specific job titles organized by entry/mid level
5. DO NOT invent, rename, or use occupations outside the provided list

**MANDATORY VALIDATION CHECKLIST (BEFORE SUBMITTING):**
□ Count: total occupations = _____ (MUST be 6-9, not 12-15)
□ Cluster 1 size = _____ (MUST be 2-3, not 4-5)
□ Cluster 2 size = _____ (MUST be 2-3, not 4-5)
□ Cluster 3 size = _____ (MUST be 2-3, not 4-5)
□ All clusters have narrative + evidence? YES / NO
□ No duplicate Jr/Sr roles? YES / NO

**IF ANY CHECK FAILS:**
- STOP — DO NOT SUBMIT
- Re-cluster occupations to fix the problem
- Re-validate all checks
- Only submit when ALL checks pass

**ONLY submit JSON when all 6 validation checks are YES.**`;
}

/** Summarise adaptive aptitude (accuracy is on the 0-100 scale). */
function formatAptitude(adaptive?: ClusterNarrativeContext['adaptive']): string {
  if (!adaptive) return 'Not available';
  const parts: string[] = [];
  if (adaptive.overallAccuracy != null) parts.push(`overall accuracy ${adaptive.overallAccuracy}%`);
  if (adaptive.aptitudeLevel != null) parts.push(`level ${adaptive.aptitudeLevel}`);
  if (adaptive.confidenceTag) parts.push(`confidence ${adaptive.confidenceTag}`);
  const subtags = adaptive.accuracyBySubtag;
  if (subtags && typeof subtags === 'object') {
    const byArea = Object.entries(subtags)
      .map(([k, v]) => `${k} ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ');
    if (byArea) parts.push(`by area — ${byArea}`);
  }
  return parts.length ? parts.join('; ') : 'Not available';
}
