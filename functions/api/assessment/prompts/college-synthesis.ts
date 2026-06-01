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
  "overallSummary": "<4 sentences (~60-80 words), written in the THIRD PERSON about the learner. Sentence 1: name their program and the 1-2 career directions they show strong potential for. Sentence 2: connect their specific strengths (e.g. communication, teamwork) and what they value to those directions. Sentence 3: name the ONE most important skill/area to develop and why it matters for those roles. Sentence 4: an honest readiness statement plus the single most useful next step (e.g. internships). Plain language — no scores, no RIASEC letters, no jargon.>"
}

WRITING RULES FOR overallSummary:
- Follow the 4-sentence structure exactly: program + direction → strengths/values alignment → key development area → readiness + next step.
- Third person ("The learner is pursuing... Their strengths in...").
- Translate scores into plain meaning (say "strengths in communication and teamwork" not "high employability score").
- Be specific to THIS student — never a sentence that could apply to anyone.
- Reference the actual program/stream name when available.
- Model example (style only, do NOT copy content): "The learner is pursuing a Bachelor of Commerce and shows strong potential for roles in business analysis and marketing. Their strengths in communication and teamwork, combined with a desire for impactful work, align well with these career paths. Developing numerical skills will be crucial for their success in analytical roles. Overall, they are well-prepared for entry-level positions and should seek internships to gain practical experience."

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
Employability skills (1-5): ${JSON.stringify(extras.employabilityScores || {})}
Domain knowledge score: ${student.knowledge_score != null ? student.knowledge_score + '%' : 'n/a'}
Stream aptitude: ${extras.streamAptitude ? JSON.stringify(extras.streamAptitude) : 'n/a'}
Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}, by area — ${aptByArea}

Analyze this student and return the JSON exactly as specified.`;
}
