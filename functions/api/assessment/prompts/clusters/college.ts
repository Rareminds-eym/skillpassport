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

YOU RECEIVE: 30 pre-filtered occupations (already matched via RAG)
YOUR TASK:
1. From these 30, select 6-9 best occupations for this learner
2. Group into 3 coherent career path clusters (2-3 occupations each)
3. Name each cluster based on what the roles actually do
4. Generate honest narrative + evidence for why each cluster fits
5. MatchScores will be computed from career fit algorithms (RIASEC, aptitude, personality, values)

YOUR RESPONSE WILL BE REJECTED IF:
- NOT 6-9 occupations selected
- Clusters not 2-3 each
- Invalid JSON
- Missing narrative elements for any cluster

🚨 **MANDATORY REQUIREMENTS**:
1. SELECT **EXACTLY 9** occupations from the 30 provided (NO additions, NO inventions) — aim for 3 per cluster
2. Organize into **exactly 3 clusters** (3 occupations each for balance)
3. Provide coherent clustering based on learner signals
4. Return job titles organized by entry/mid level (at least 2-3 distinct roles per cluster)
5. Include evidence for why each cluster fits the learner
6. **CLUSTER NAMES must be specific to the actual roles grouped** (not generic templates)

SELECTION STRATEGY (USE ALL LEARNER SIGNALS):
- Student stream/degree (MBA, MCA, B.Tech, B.Com, BBA, etc.)
- Aptitude strengths AND weaknesses (growth opportunities, not dealbreakers)
- Knowledge strengths AND weaknesses (⚠️ IF SCORE < 35% in a domain, exclude roles requiring that domain — but redirect to alternate roles in SAME stream, not unrelated fields)
- RIASEC profile (career interests)
- Big Five traits (personality fit)
- Work values (what motivates them)
- Profile narrative (readiness, trajectory)

🚨 **KNOWLEDGE GATE (MANDATORY — judge fit yourself from the learner's profile, not a numeric table)**:
Each candidate occupation in the list below carries a DEGREE GATE (Mandatory/Preferred) and, where
relevant, an Alternate path for learners who don't clear the gate. There is no per-role knowledge
score — use your own judgement of how well the learner's actual knowledge score, strengths, and
weaknesses (given above) fit each occupation's evident demands.

- DEGREE GATE: MANDATORY roles — only select if the learner's degree/stream is a genuine match AND
  their knowledge score/strengths plausibly support the role (treat ~35% knowledge score as the
  floor below which a Mandatory role should not be selected). If not, DO NOT select this occupation;
  instead consider the roles named in its "Alternate path" text.
- DEGREE GATE: Preferred roles — degree/knowledge is a ranking signal, not a hard block. If the
  learner's knowledge score is low (below ~35%) or their stated weaknesses clearly conflict with
  what the role demands, prefer the occupation's own "Alternate path" roles when present — but a
  Preferred-gate role MAY still be selected if RIASEC, Big Five, or work-values fit is strong (this
  is what allows a strong learner with a real interest in a different domain — e.g. Digital Media —
  to still be recommended even if their stream/knowledge doesn't directly match).
- If BOTH knowledge score AND stream aptitude score are low (below ~35%) for this learner, weight
  the redirect more heavily: prefer clusters built from each role's "Alternate path" text and from
  domains the learner's strengths actually support (e.g. Education & Skilling, Training, Operations,
  Customer-facing roles), over high-knowledge-demand technical/specialist roles.
- NEVER recommend a role with no plausible connection to the learner's actual stream, RIASEC
  profile, or stated strengths (e.g. do not recommend Medical/Clinical roles to a B.Com student
  with no health-domain signal anywhere in their profile).

**STEP 1: SELECT BEST 6-9 FROM THE 30 PROVIDED**

🚨 **CRITICAL: RIASEC MATCH IS PRIORITY #1**

From the 30 pre-filtered occupations you receive, select 6-9 that are genuinely the strongest fits.

**Priority Order (Check in this sequence)**:
1. **RIASEC Alignment** (HIGHEST PRIORITY): Does occupation's RIASEC code match learner's code?
   - Exact match (learner AIR → occupation AIR/ARI/RIA) = Select these FIRST
   - Adjacent match (close RIASEC codes) = Good
   - Weak match (completely different codes) = AVOID

2. **Stream alignment**: Does role leverage this stream's expertise?
3. **Aptitude fit**: Uses learner's cognitive strengths?
4. **Big Five fit**: Suits learner's personality?
5. **Work values**: Satisfies learner's motivations?
6. **Knowledge fit**: Learner has prerequisite knowledge?

⚠️ **Selection Strategy**:
- Ensure selected 6-9 occupations have DIFFERENT RIASEC codes
- Avoid selecting 7+ occupations with the SAME RIASEC code (this causes all to score identically)
- Diversify across RIASEC types so clusters will have different scores

Rule: ONLY use occupations from the 30 provided. NO additions or inventions.

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

**GROUPING RULES:**
- Each group MUST have 2-3 roles that naturally belong together
- Roles in a group must do SIMILAR daily work (not just have similar titles)
- DO NOT force roles together just because they're both in the candidate list
- DO NOT create artificial clusters - each must represent a genuine career path
- If you cannot naturally group all 6-9 roles into 3 coherent clusters, REDUCE to 2 per cluster

🚨 **DOMAIN-BASED GROUPING (PRIMARY RULE)**:
Each occupation now includes its domain in square brackets: [Domain Name]
- CRITICAL: **Group roles with the SAME domain together**
- FAIL if cluster mixes domains (e.g., [Career Services] + [Sales & Marketing] = REJECT)
- Use domain as the PRIMARY constraint for grouping

🚨 **MANDATORY GROUPING VALIDATION (CHECK BEFORE FINALIZING)**:
For EACH cluster you create, verify:
1. **Role Coherence Check**: Do all roles in this cluster do SIMILAR work?
   - PASS: Computer Vision Engineer + AI Application Engineer (both AI/technical)
   - FAIL: Career Services Executive + Data Analyst (different domains)
2. **Domain Consistency Check**: Are all roles in the same career domain?
   - Same domain = Tech, Career Services, Learning & Development, etc.
   - Different domains = REJECT this grouping, reorganize
3. **Stream Alignment Check**: Do all roles leverage this stream's expertise equally?
   - PASS: All technical roles for technical stream
   - FAIL: Career Services role mixed with technical roles (mismatched expertise)
4. **Skill Overlap Check**: Can a person with the same skillset succeed in all roles?
   - PASS: Coding Mentor + Academic Tutor + E-Learning Developer (all teaching/L&D)
   - FAIL: Career Analyst + Computer Vision Engineer (require different skills)

**IF any cluster FAILS validation**:
- Remove the mismatched role
- Reassign it to a more appropriate cluster
- Recheck the new cluster to ensure it still passes validation
- Do this iteratively until all 3 clusters PASS all 4 checks

**STEP 3: FINAL CLUSTER VALIDATION CHECKLIST**

Before naming clusters, VERIFY once more:
- [ ] Cluster 1: All 2-3 roles do similar work? (PASS/FAIL)
- [ ] Cluster 2: All 2-3 roles do similar work? (PASS/FAIL)
- [ ] Cluster 3: All 2-3 roles do similar work? (PASS/FAIL)
- [ ] No role appears in multiple clusters?
- [ ] Total roles = 6-9?
- [ ] Each cluster represents a GENUINE career path (not forced grouping)?

If ANY cluster fails → REORGANIZE immediately before proceeding.

**STEP 4: NAME CLUSTERS BASED ON ACTUAL ROLES**

Analyze the specific occupations you grouped and name based on what those roles ACTUALLY DO.

✅ **CORRECT (Based on actual roles)**:
- Grouped: "AI Engineer", "ML Developer", "Data Scientist" → Name: "AI & Machine Learning"
- Grouped: "Business Analyst", "Operations Manager" → Name: "Business & Operations"
- Grouped: "DevOps Engineer", "Cloud Architect" → Name: "Cloud Infrastructure"

❌ **WRONG (Generic/Templated)**:
- Generic templates that don't match roles grouped
- Vague names that don't reflect specific occupations
- Names that sound forced

**NAMING RULES**:
- 2-4 words, clear and professional
- Must reflect the actual occupations in the cluster
- Easy to understand for someone who just completed the assessment
- Match what the roles actually do

**STEP 5: FINALIZE CLUSTER DESCRIPTIONS (NO SCORING)**
Your job is ONLY to select, group, and describe the clusters.
Scoring will be computed by the backend algorithm using:
- Student RIASEC profile
- Student aptitude data
- Student Big Five personality
- Student work values
- Occupation data from database

You do NOT score the clusters. Just provide clear narratives on WHY each cluster fits this learner.

🚨 **PRE-FINALIZATION SANITY CHECK**:
Before returning JSON, ask yourself:
- "Would a recruiter group these roles together?" If NO → reorganize.
- "Do these roles share core competencies?" If NO → this cluster is incoherent.
- "Could someone transition between roles in this cluster?" If NO → grouping is forced.
- "Is the cluster name accurate for what these roles actually do?" If NO → rename or reorganize.

STRICT RULES:
- Use ONLY occupations provided
- NO invented, renamed, or external occupations
- NO hardcoded stream mappings (use learner signals instead)
- NO Junior + Senior duplication (select distinct role types)
- NO raw scores/percentages in narratives
- NO mismatched domains in single cluster (e.g., "Career Services + Data Analysis" = WRONG)

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
      "title": "<cluster name based on actual roles grouped>",
      "derivation": "<1 sentence: why this cluster aligns with the learner>",
      "description": "<1-2 sentences on the field>",
      "whatYoullDo": "<1 sentence: day-to-day>",
      "whyItFits": "<1-2 sentences using ALL 7 alignment dimensions: stream, RIASEC, Big Five, work values, aptitude, stream aptitude, stream knowledge>",
      "evidence": {
        "interest": "<RIASEC fit: 1 sentence on how their RIASEC codes match these roles>",
        "aptitude": "<Aptitude + Stream Knowledge fit: 1 sentence on cognitive strengths (logic, verbal, data) + subject matter knowledge they have>",
        "personality": "<Big Five fit: 1 sentence on how personality traits (openness, conscientiousness, etc.) support this path>",
        "values": "<Work Values fit: 1 sentence on how work values (achievement, independence, relationships) are met>"
      },
      "roles": { "entry": ["<title 1>", "<title 2>"], "mid": ["<title 3>"] },
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
- Group the concrete job titles by cluster: cluster 1's roles → highFit, cluster 2 → mediumFit, cluster 3 → exploreLater
- **MUST include 3 distinct roles per group** (minimum 3, not 2)
- Use both entry and mid-level roles from that cluster
- Example: [Software Engineer (entry), Full Stack Developer (entry), Technical Lead (mid)]
- "salary" is an APPROXIMATE entry-to-early-career range in INR LPA (lakhs per annum) for India; integers, min < max

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

KNOWLEDGE GATE CHECK (IF KNOWLEDGE SCORE < 35% OR STREAM APTITUDE SCORE < 10%):
□ For every selected MANDATORY-gate occupation: does the learner's degree/stream genuinely match,
  and do their knowledge score/strengths plausibly support this role? YES / NO / N/A (none selected)
□ For Preferred-gate occupations where the learner's knowledge is weak: did you prefer the
  occupation's own "Alternate path" roles, unless RIASEC/Big Five/work-values fit was strong enough
  to justify keeping the direct role anyway? YES / NO
□ Example check: a learner weak in Accounting and stream aptitude → did you skip Mandatory-gated
  Accountant/Auditor roles and prefer roles named in their Alternate path (e.g. HR/Ops/Support)
  instead? YES / NO

If either score < 35% or stream aptitude < 10%, and ANY answer is NO:
- STOP, DO NOT SUBMIT
- Review the candidate list's DEGREE GATE / Alternate path fields again
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
□ Total occupationIds across all clusters: _____ (MUST be 9, preferably 3+3+3)
□ Cluster 1 count: _____ (MUST be 3)
□ Cluster 2 count: _____ (MUST be 3)
□ Cluster 3 count: _____ (MUST be 3)
□ Each cluster has both entry AND mid level roles? YES / NO
□ Cluster names reflect ACTUAL roles (not generic templates)? YES / NO
□ NO Junior + Senior duplication? (e.g., don't have both "Junior Analyst" AND "Senior Analyst") YES / NO
□ All 9 roles are DISTINCT types, not progression levels? YES / NO

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
): string {
  const topN = (obj: Record<string, number> | undefined, n: number) =>
    Object.entries(obj || {}).sort(([, a], [, b]) => b - a).slice(0, n)
      .map(([k, v]) => `${k} (${v})`).join(', ');

  const occupationList = occupations
    .map((o) => {
      const desc = o.description ? ` | ${o.description}` : '';
      const gateText = o.degreeGate === 'Mandatory'
        ? ` | DEGREE GATE: MANDATORY — only match learners with a matching degree/strong knowledge fit`
        : ` | DEGREE GATE: Preferred`;
      const bridgeText = o.crossIndustryRolePaths ? ` | Alternate path for other degrees/weak knowledge: ${o.crossIndustryRolePaths}` : '';
      return `- id=${o.occupation_id} | ${o.name} | RIASEC: ${o.riasecCodes.join('/') || 'n/a'}${desc}${gateText}${bridgeText}`;
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
Stream aptitude score: ${student.stream_aptitude_score != null ? student.stream_aptitude_score + '%' : 'Not available'}
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
