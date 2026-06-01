/**
 * Profile-synthesis prompt — COLLEGE.
 *
 * The LLM interprets the student's DETERMINISTIC scores and produces the narrative report
 * sections + a profile narrative (reused as part of the RAG embedding query). It does NOT
 * select occupations, rank, or compute match scores, and it does NOT produce careerFit
 * (clusters are deterministic + RAG, generated separately).
 */
import type { StudentProfile } from '../services/scoring-service';
import type { ClusterNarrativeContext, ClusterPrompt } from '../types';

export function buildCollegeSynthesisPrompt(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  extras: { employabilityScores?: Record<string, number>; streamAptitude?: any }
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, context, extras) };
}

const SYSTEM = `You are a career counselor analyzing a college student's completed assessment.

You are given the student's COMPUTED scores. Interpret them. Do NOT recommend specific
occupations, do NOT compute match scores, and do NOT output any "careerFit" or clusters —
those are produced separately by a deterministic engine.

Return ONLY valid JSON in this exact shape:
{
  "profileNarrative": "<150-220 words: who this student is — interests (RIASEC), personality (Big Five), values, aptitude strengths, knowledge, employability readiness — written as a coherent professional synthesis>",
  "employability": {
    "overallReadiness": "<High|Medium|Low>",
    "strengthAreas": ["<skill>"],
    "improvementAreas": ["<skill>"],
    "recommendation": "<1-2 sentences>"
  },
  "skillGap": {
    "currentStrengths": ["<skill>"],
    "priorityA": [{ "skill": "<skill>", "currentLevel": 1, "targetLevel": 3, "whyNeeded": "<reason>", "howToBuild": "<action>" }],
    "priorityB": [{ "skill": "<skill>" }],
    "learningTracks": [{ "track": "<track>", "suggestedIf": "<condition>", "topics": "<topics>" }],
    "recommendedTrack": "<track>"
  },
  "roadmap": {
    "projects": [{ "title": "<title>", "purpose": "<purpose>", "output": "<output>" }],
    "internship": { "types": ["<type>"], "timeline": "<timeline>", "preparation": { "resume": "<focus>", "portfolio": "<focus>", "interview": "<focus>" } },
    "exposure": { "activities": ["<activity>"], "certifications": ["<cert>"] }
  },
  "finalNote": { "advantage": "<advantage>", "growthFocus": "<focus>", "nextReview": "<timeline>" },
  "overallSummary": "<2-3 sentences (~40-50 words), THIRD PERSON about the learner. Sentence 1 MUST state their study level AND program/stream by name (e.g. 'an undergraduate pursuing Hospitality & Hotel Management') and the 1-2 career directions they show strong potential for, tied to a specific strength. Sentence 2: the ONE most important skill/area to develop. Optional Sentence 3: a short readiness statement + the single most useful next step. Plain language — no scores, no RIASEC letters, no jargon.>"
}

WRITING RULES FOR overallSummary:
- Keep it to 2-3 sentences, ~40-50 words. Be concise — no filler.
- Third person ("The learner, an undergraduate pursuing...").
- ALWAYS open by naming BOTH the study level (undergraduate / postgraduate) AND the exact program/stream name from the inputs. If the level is not specified, just name the program.
- Translate scores into plain meaning (say "strengths in communication and teamwork" not "high employability score").
- Be specific to THIS student — never a sentence that could apply to anyone.
- Derive the program, level, directions, strengths and gaps ENTIRELY from the inputs below. Do NOT assume any field — the example uses placeholders, not real values.
- Structure (style only — fill placeholders from the actual inputs, do NOT copy any field): "The learner, [a/an] [study level] pursuing [program name], shows strong potential in [career direction(s) implied by their scores], supported by [their top strengths]. Building stronger [key gap] is their next step. They are [readiness] for entry-level roles and should [single most useful next step]."

Ground every statement in the scores provided. Be specific and professional.`;

function buildUser(
  student: StudentProfile,
  context: ClusterNarrativeContext,
  extras: { employabilityScores?: Record<string, number>; streamAptitude?: any }
): string {
  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => `${k}: ${typeof v === 'object' && v ? v.accuracy : v}%`).join(', ')
    : 'n/a';

  return `STUDENT COMPUTED SCORES

Program / stream: ${student.stream || 'Not specified'}
Study level: ${student.degreeLevel || 'Not specified'} ${student.degreeLevel === 'postgraduate' ? '(postgraduate — frame around advanced/specialist roles)' : student.degreeLevel === 'undergraduate' ? '(undergraduate — frame around entry-level roles & internships)' : ''}
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Big Five (1-5): ${JSON.stringify(student.big_five_scores || {})}
Work values (1-5): ${JSON.stringify(student.work_values || {})}
Employability skills (0-100, includes an SJT situational-judgment score): ${JSON.stringify(extras.employabilityScores || {})}
Domain knowledge score: ${student.knowledge_score != null ? student.knowledge_score + '%' : 'n/a'}
Stream aptitude: ${extras.streamAptitude ? JSON.stringify(extras.streamAptitude) : 'n/a'}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze this student and return the JSON exactly as specified.`;
}
