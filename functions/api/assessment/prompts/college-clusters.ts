/**
 * Cluster-generation prompt — COLLEGE / Higher Education.
 *
 * Same contract as middle school (group provided occupations into 3 clusters, narrative only,
 * no invented occupations or scores) but written for a college audience and citing the richer
 * signals available at this level: Big Five, Work Values, Knowledge, Employability, Aptitude.
 */
import type { StudentProfile } from '../services/scoring-service';
import type { PromptOccupation, ClusterNarrativeContext, ClusterPrompt } from '../types';

export function buildCollegeClusterPrompt(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, occupations, context) };
}

const SYSTEM = `You are a career counselor for college / higher-education students in India.

You will receive a student's full assessment profile and a list of REAL candidate occupations
(each with an id, name, and RIASEC codes). The occupations and their ranking are ALREADY
DECIDED by the system. Your ONLY job is to organize them into exactly 3 career clusters and
write the narrative content.

STRICT RULES:
- Use ONLY the occupations provided. Reference them by their exact "id".
- Do NOT invent, rename, or remove occupations.
- Do NOT output any match scores, percentages, or fit levels for clusters — the system computes those.
- The 3 clusters must be in genuinely DIFFERENT industries/domains.
- Write for a college-age reader: specific, professional, oriented to near-term entry and growth.
- Ground every claim in the student's actual signals (RIASEC, Big Five, work values, knowledge, aptitude, employability).
- Order the 3 clusters best-fit first (cluster 1 = strongest fit, cluster 3 = exploratory).

Return ONLY valid JSON in this exact shape:
{
  "clusters": [
    {
      "occupationIds": ["<id from the provided list>", "..."],
      "title": "<specific career domain name>",
      "derivation": "<how their RIASEC + Big Five + work values + aptitude point here>",
      "description": "<2-3 sentences on the field and why it fits this student>",
      "whatYoullDo": "<realistic day-to-day for these roles>",
      "whyItFits": "<connect their specific scores/traits/values>",
      "evidence": {
        "interest": "<RIASEC evidence citing their scores>",
        "aptitude": "<aptitude/knowledge evidence>",
        "personality": "<Big Five evidence>",
        "values": "<work-values evidence>",
        "employability": "<employability-skills evidence>",
        "adaptiveAptitude": "<adaptive aptitude evidence>"
      },
      "roles": { "entry": ["<entry-level titles>"], "mid": ["<mid-career titles>"] },
      "domains": ["<related industries>"],
      "futureOutlook": "<growth trajectory and why it matters in 2030-2040>"
    }
  ],
  "specificOptions": {
    "highFit": [{ "name": "<role from cluster 1>", "salary": { "min": <LPA number>, "max": <LPA number> } }],
    "mediumFit": [{ "name": "<role from cluster 2>", "salary": { "min": <LPA number>, "max": <LPA number> } }],
    "exploreLater": [{ "name": "<role from cluster 3>", "salary": { "min": <LPA number>, "max": <LPA number> } }]
  }
}

specificOptions RULES:
- Group the concrete job titles by cluster: cluster 1's roles → highFit, cluster 2 → mediumFit, cluster 3 → exploreLater.
- Use 2-3 roles per group, drawn from that cluster's entry/mid roles.
- "salary" is an APPROXIMATE entry-to-early-career range in INR LPA (lakhs per annum) for India; integers, min < max.`;

function buildUser(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): string {
  const topN = (obj: Record<string, number> | undefined, n: number) =>
    Object.entries(obj || {}).sort(([, a], [, b]) => b - a).slice(0, n)
      .map(([k, v]) => `${k} (${v})`).join(', ');

  const occupationList = occupations
    .map((o) => `- id=${o.occupation_id} | ${o.name} | RIASEC: ${o.riasecCodes.join('/') || 'n/a'}`)
    .join('\n');

  return `STUDENT PROFILE
Program / stream: ${student.stream || 'Not specified'}
Study level: ${student.degreeLevel || 'Not specified'} ${student.degreeLevel === 'postgraduate' ? '(postgraduate — emphasise advanced/specialist entry points and higher salary bands)' : student.degreeLevel === 'undergraduate' ? '(undergraduate — emphasise entry-level roles, internships and graduate-trainee salary bands)' : ''}
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Big Five (strongest first): ${topN(student.big_five_scores, 5) || 'Not available'}
Work values (top): ${topN(student.work_values, 3) || 'Not available'}
Knowledge score: ${student.knowledge_score != null ? student.knowledge_score + '%' : 'Not available'}
Adaptive aptitude: ${formatAptitude(context.adaptive)}

CANDIDATE OCCUPATIONS (already selected & ranked by the system — use these ONLY):
${occupationList}

Group these occupations into exactly 3 career clusters (different industries) and write the
narrative fields. Assign every cluster its occupations via "occupationIds" using the ids above.
When writing the evidence fields, cite the specific RIASEC scores, Big Five traits, work values,
knowledge, and aptitude areas shown above.`;
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
