/**
 * Profile-synthesis prompt — AFTER 12TH GRADE.
 *
 * The LLM interprets the student's DETERMINISTIC scores (7 components: RIASEC, Big Five,
 * Work Values, Employability, Aptitude, Knowledge, Adaptive) and produces narrative report
 * sections + a profile narrative (reused in RAG embedding query).
 *
 * Focus: College selection, career entry, gap year planning, employment vs further education.
 * Does NOT select occupations, rank, or compute match scores.
 */
import type { StudentProfile } from '../../services/core/scoring-service';
import type { ClusterNarrativeContext, ClusterPrompt } from '../../types';

export function buildAfter12SynthesisPrompt(
  student: StudentProfile,
  context: ClusterNarrativeContext
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, context) };
}

const SYSTEM = `You are a career counselor analyzing a student who has completed 12th grade
and is at a critical decision point: college selection, immediate employment, gap year, or certifications.

You are given the student's COMPUTED scores across 7 dimensions. Interpret them holistically.
Do NOT recommend specific occupations, do NOT compute match scores, and do NOT output any
"careerFit" or clusters — those are produced separately by a deterministic engine.

Return ONLY valid JSON in this exact shape:
{
  "profileNarrative": "<130-200 words: who this student is — RIASEC profile, Big Five personality, work values, aptitude strengths, knowledge level, and readiness for post-12 decisions (college vs work vs hybrid). Write as coherent, professional synthesis grounded in scores.>",
  "skillGap": {
    "currentStrengths": ["<strength>"],
    "prioritySkills": [{ "skill": "<skill>", "whyNeeded": "<reason>", "howToBuild": "<action>" }],
    "careerReadiness": "<assessment of readiness for work vs further study based on employability + aptitude>"
  },
  "roadmap": {
    "higherEducation": {
      "recommendedPrograms": ["<program e.g. B.Tech, BA, BCA>"],
      "colleges": ["<college type e.g. Tier-1, IIIT, private>"],
      "entranceExams": ["<exam e.g. JEE, CUET, CAT>"],
      "reasoning": "<why these fit based on RIASEC + Big Five + aptitude>"
    },
    "alternativePaths": {
      "certifications": ["<certification e.g. AWS, Google Cloud>"],
      "skillPrograms": ["<program e.g. bootcamp, vocational>"],
      "internships": ["<field e.g. tech, finance, consulting>"]
    },
    "immediateEmployment": {
      "suitableRoles": ["<entry-level role>"],
      "industries": ["<industry>"],
      "preparationNeeded": ["<skill or preparation>"]
    },
    "recommendedPath": "<education|employment|hybrid> with reasoning based on scores"
  },
  "finalNote": { "advantage": "<key advantage from scores>", "criticalDecision": "<the ONE most critical decision to make>", "nextSteps": "<immediate actionable next steps>" },
  "overallSummary": "<2-3 sentences (~45-55 words), THIRD PERSON. Sentence 1: completed 12th in <stream>, top interest areas and key strengths. Sentence 2: recommended path (college program OR career entry OR hybrid) with reasoning. Sentence 3: immediate next step. Plain language — no scores, no jargon.>"
}

WRITING RULES FOR overallSummary:
- Keep it to 2-3 sentences, ~45-55 words. Concise — no filler.
- Third person ('This student, who completed 12th...' or 'Having finished 12th grade...').
- Sentence 1: MUST mention 12th stream (science/commerce/humanities) + top 1-2 RIASEC interests + key strength.
- Sentence 2: MUST name the recommended path (B.Tech + college type, OR startup employment, OR hybrid) + reason (aptitude/Big Five/values).
- Sentence 3: Single, most useful immediate next step (appear for entrance exam, apply for internships, build portfolio, etc.).
- Derive everything from the scores provided — be specific to THIS student.
- Never use phrases like "good potential" or "shows promise" — use actual strengths from data.

Ground every statement in the scores provided. Be specific and professional.`;

function buildUser(
  student: StudentProfile,
  context: ClusterNarrativeContext
): string {
  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  const aptitudeInsightsText = context.aptitudeInsights
    ? `APTITUDE INSIGHTS:
Strengths: ${context.aptitudeInsights.strengths?.join(', ') || 'n/a'}
Weaknesses: ${context.aptitudeInsights.weaknesses?.join(', ') || 'n/a'}
Pattern: ${context.aptitudeInsights.pattern || 'n/a'}`
    : '';

  const bigFiveText = student.big_five_scores && Object.keys(student.big_five_scores).length > 0
    ? `Big Five (1-5): ${JSON.stringify(student.big_five_scores)}`
    : 'Big Five: Not assessed';

  const valuesText = student.work_values && Object.keys(student.work_values).length > 0
    ? `Work values (1-5): ${JSON.stringify(student.work_values)}`
    : 'Work values: Not assessed';

  const employabilityText = student.employability_scores && Object.keys(student.employability_scores).length > 0
    ? `Employability scores (0-100): ${JSON.stringify(student.employability_scores)}`
    : 'Employability: Not assessed';

  const knowledgeText = student.knowledge_score != null
    ? `Domain knowledge: ${student.knowledge_score}%`
    : 'Domain knowledge: Not assessed';

  const aptitudeText = student.stream_aptitude_score != null
    ? `Stream aptitude: ${student.stream_aptitude_score}%`
    : 'Stream aptitude: Not assessed';

  return `STUDENT COMPUTED SCORES (After 12th - Career Decision Point)

12th stream: ${student.stream || 'Not specified'}
RIASEC code: ${student.riasec_code}
RIASEC scores (0-100): ${JSON.stringify(student.riasec_scores)}

${bigFiveText}
${valuesText}
${employabilityText}
${knowledgeText}
${aptitudeText}

Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

${aptitudeInsightsText}

Analyze this student and return the JSON exactly as specified.`;
}
