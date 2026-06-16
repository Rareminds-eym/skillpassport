/**
 * College Cluster Generation (Simplified)
 *
 * Single LLM call that:
 * 1. Clusters 12-15 occupations into 3 coherent groups
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
1. Cluster 12-15 occupations into 3 coherent career paths
2. Generate narrative context and evidence for each cluster
3. Return specific job titles organized by cluster
4. MatchScores will be computed deterministically from database assessment profiles

YOUR RESPONSE WILL BE REJECTED IF:
- NOT 12-15 occupations selected
- Clusters not 4-5 each
- Invalid JSON
- Missing narrative elements for any cluster

🚨 **MANDATORY REQUIREMENTS**:
1. SELECT **EXACTLY 12-15** occupations
2. Organize into **exactly 3 clusters** (4-5 each)
3. Provide coherent clustering based on learner signals
4. Return job titles organized by entry/mid level
5. Include evidence for why each cluster fits the learner

SELECTION STRATEGY (USE ALL LEARNER SIGNALS):
- Student stream/degree (MBA, MCA, B.Tech, B.Com, BBA, etc.)
- Aptitude strengths AND weaknesses (growth opportunities, not dealbreakers)
- Knowledge strengths AND weaknesses (weak areas are development opportunities)
- RIASEC profile (career interests)
- Big Five traits (personality fit)
- Work values (what motivates them)
- Profile narrative (readiness, trajectory)

CLUSTERING RULES:
- 3 clusters = DISTINCT, COHERENT career paths
- Cluster 1 (Primary): Highest student fit, all signals aligned
- Cluster 2 (Secondary): Good fit, some development areas
- Cluster 3 (Tertiary): Growth-focused, explore later
- Order clusters logically from best fit to lower fit

CLUSTER NAMING (CRITICAL):
- Use SHORT, BUSINESS-FOCUSED names WITHOUT arrows or "Track"
- Good examples:
  * "Financial Analysis & Accounting" (domain + specialization)
  * "Human Resources & Recruitment" (domain + function)
  * "Customer Service & Sales" (domain + function)
  * "IT Operations & Support" (domain + function)
- Bad examples: "Finance Pathway", "→ Arrow Names", "Professional Careers", "Track"
- RULE: Keep cluster titles to 2-4 words maximum
- RULE: Use "&" not arrows, not "→", not "Track"
- RULE: Focus on INDUSTRY/DOMAIN, not role progression
- RULE: Make it business-professional, not narrative

STRICT RULES:
- Use ONLY occupations provided
- NO invented, renamed, or external occupations
- NO hardcoded stream mappings (use learner signals instead)
- NO Junior + Senior duplication (select distinct role types)
- NO raw scores/percentages in narratives

Return ONLY valid JSON with clusters and narratives (NO roleData — will be computed by backend):
{
  "clusters": [
    {
      "occupationIds": ["<id>", "..."],
      "title": "<stream-specific pathway name>",
      "derivation": "<1 sentence: alignment>",
      "description": "<1-2 sentences on the field>",
      "whatYoullDo": "<1 sentence: day-to-day>",
      "whyItFits": "<1-2 sentences, second person>",
      "evidence": {
        "interest": "<1 sentence>",
        "aptitude": "<1 sentence>",
        "personality": "<1 sentence>",
        "values": "<1 sentence>"
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

- **BANNED**: "should", "consider", "might want to", "the learner", scores/percentages, vague praise
- **REQUIRED**: Specific strength names, specific cluster name, specific ONE gap (not multiple), action-oriented encouragement

**EXAMPLES (Student-Centric):**
- "You're naturally a logical thinker who works well with people—that combination is valuable. Your best fit is Student Services Leadership, where analytical thinking meets relationship-building. Financial roles interest you too, but need stronger quantitative foundation—that's learnable through dedicated practice. Your analytical mindset is your superpower; channel it strategically and you'll differentiate yourself."
- "You excel at strategic analysis and have strong drive for impact—rare combination. Management & Operations is your best path where systematic thinking and leadership converge. Your secondary interest in analytics is viable but requires building comfort with detailed data work. You're positioned well for roles that need both vision and execution ability."

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

BEFORE submitting JSON, count and verify:
□ Total occupationIds across all clusters: _____ (MUST be 12-15)
□ Cluster 1 count: _____ (MUST be 4-5)
□ Cluster 2 count: _____ (MUST be 4-5)
□ Cluster 3 count: _____ (MUST be 4-5)
□ NO Junior + Senior duplication? (e.g., don't have both "Junior Analyst" AND "Senior Analyst") YES / NO
□ All 12-15 roles are DISTINCT types, not progression levels? YES / NO

Verification:
✓ Total is 12-15? YES / NO
✓ Each cluster is 4-5? YES / NO
✓ All roles are diverse (no Jr+Sr of same type)? YES / NO

If ANY answer is NO:
- STOP, DO NOT SUBMIT
- Recount and rebalance
- Add/remove occupations to reach 12-15
- Ensure each cluster is exactly 4-5
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
1. Select **12-15 occupations** from the candidate list
2. Group into exactly **3 clusters** (4-5 each)
3. Provide narratives and evidence for each cluster
4. Return specific job titles organized by entry/mid level
5. DO NOT invent, rename, or use occupations outside the provided list

**MANDATORY VALIDATION CHECKLIST (BEFORE SUBMITTING):**
□ Count: total occupations = _____ (must be 12-15)
□ Cluster 1 size = _____ (must be 4-5)
□ Cluster 2 size = _____ (must be 4-5)
□ Cluster 3 size = _____ (must be 4-5)
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
