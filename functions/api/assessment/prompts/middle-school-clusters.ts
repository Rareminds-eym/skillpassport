/**
 * Cluster-generation prompt — SCHOOL LEARNER.
 *
 * OpenRouter groups the (already selected & ranked) occupations into 3 clusters and writes
 * RIASEC-grounded narrative ONLY. It must not invent/rename/remove occupations or output scores.
 * Tone is driven by the learner's profile (RIASEC, strengths, learning style) — NOT by any
 * assumed age or grade.
 */
import type { StudentProfile } from '../services/scoring-service';
import type { PromptOccupation, ClusterNarrativeContext, ClusterPrompt } from '../types';

export function buildMiddleSchoolClusterPrompt(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, occupations, context) };
}

const SYSTEM = `You are a career counselor for school learners in India.

You will receive a learner's assessment profile and a list of REAL candidate occupations
(each with an id, name, and RIASEC codes). The occupations and their ranking are ALREADY
DECIDED by the system. Your ONLY job is to organize them into exactly 3 career clusters and
write narrative content grounded in the learner's RIASEC profile.

STRICT RULES:
- Use ONLY the occupations provided. Reference them by their exact "id".
- Do NOT invent, rename, or remove occupations.
- Do NOT output any match scores, percentages, or fit levels — the system computes those.
- The 3 clusters must be in genuinely DIFFERENT industries/domains.
- Do NOT assume the learner's age, grade, or year — say nothing about how old they are.
- Ground EVERYTHING in their RIASEC interests, character strengths and learning style.
- Write in clear, encouraging language. Use future-oriented framing about exploring and
  growing into these fields ("you could explore...", "this field could grow into..."), without
  referencing age or schooling stage.

Return ONLY valid JSON in this exact shape:
{
  "clusters": [
    {
      "occupationIds": ["<id from the provided list>", "..."],
      "title": "<specific career domain name>",
      "derivation": "<how their RIASEC + strengths + learning style point here>",
      "description": "<2-3 sentences, future-oriented>",
      "whatYoullDo": "<day-to-day the learner can picture>",
      "whyItFits": "<connect their specific scores/strengths/traits>",
      "evidence": {
        "interest": "<RIASEC evidence citing their scores>",
        "aptitude": "<cognitive evidence>",
        "personality": "<character/learning-style evidence>"
      },
      "roles": { "entry": ["<future entry-level titles>"], "mid": ["<future mid-career titles>"] },
      "domains": ["<related industries>"],
      "futureOutlook": "<is the field growing? why it matters in 2030-2040>"
    }
  ]
}`;

function buildUser(
  student: StudentProfile,
  occupations: PromptOccupation[],
  context: ClusterNarrativeContext
): string {
  const strengths = (student.strength_scores || [])
    .slice().sort((a, b) => b.average - a.average)
    .map((s) => `${s.dimension} (${s.average}/5)`).join(', ');

  const occupationList = occupations
    .map((o) => `- id=${o.occupation_id} | ${o.name} | RIASEC: ${o.riasecCodes.join('/') || 'n/a'}`)
    .join('\n');

  return `STUDENT PROFILE
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Character strengths (strongest first): ${strengths || 'Not available'}
Learning preferences: ${formatLearningPreferences(student.learning_preferences)}
Adaptive aptitude: ${formatAptitude(context.adaptive)}
Reflections: ${formatReflections(context.reflections)}

CANDIDATE OCCUPATIONS (already selected & ranked by the system — use these ONLY):
${occupationList}

Group these occupations into exactly 3 career clusters (different industries) and write the
narrative fields. Assign every cluster its occupations via "occupationIds" using the ids above.
When writing the evidence fields, cite the specific RIASEC scores, aptitude areas, and
character strengths shown above.`;
}

/** Learning preferences are stored as { questionId: answer }; surface the answer VALUES only. */
function formatLearningPreferences(lp?: Record<string, unknown>): string {
  if (!lp) return 'Not available';
  const values = Object.values(lp)
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return values.length ? values.join('; ') : 'Not available';
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

/** Render free-text reflections for the prompt. */
function formatReflections(reflections?: Array<{ question: string; answer: string }>): string {
  if (!reflections || reflections.length === 0) return 'None';
  return reflections.map((r) => `"${r.answer}"`).join(' | ');
}
