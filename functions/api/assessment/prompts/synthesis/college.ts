/**
 * Profile-synthesis prompt — COLLEGE.
 *
 * The LLM interprets the student's DETERMINISTIC scores and produces the narrative report
 * sections + a profile narrative (reused as part of the RAG embedding query). It does NOT
 * select occupations, rank, or compute match scores, and it does NOT produce careerFit
 * (clusters are deterministic + RAG, generated separately).
 */
import type { StudentProfile } from '../../services/core/scoring-service';
import type { ClusterNarrativeContext, ClusterPrompt } from '../../types';

export function buildCollegeSynthesisPrompt(
  student: StudentProfile,
  context: ClusterNarrativeContext
): ClusterPrompt {
  return { system: SYSTEM, user: buildUser(student, context) };
}

const SYSTEM = `You are a career counselor analyzing a college student's completed assessment.

You are given the student's COMPUTED scores. Interpret them based on THEIR ACTUAL PROGRAM and KNOWLEDGE.
Do NOT recommend specific occupations, do NOT compute match scores, and do NOT output any "careerFit"
or clusters — those are produced separately by a deterministic engine.

INTERPRETATION GUIDANCE:
- Ground the narrative in the student's actual program, knowledge domain, and assessment data
- Use language specific to their field and RIASEC profile
- Avoid generic language that doesn't reflect their actual domain or work orientation
- Let the data guide the interpretation, not template language

Return ONLY valid JSON in this exact shape:
{
  "profileNarrative": "<150-220 words: who this student is — interests (RIASEC), personality (Big Five), values, aptitude strengths, knowledge — written as a coherent professional synthesis, ANCHORED to their program/stream and technical domain (see RIASEC + NARRATIVE rules below)>",
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

RIASEC ACCURACY RULES:
- Interpret each RIASEC letter according to Holland's model:
  R = Realistic (hands-on, building, systems)
  I = Investigative (analytical, research, problem-solving)
  A = Artistic (creative, design, self-expression)
  S = Social (helping, teaching, counseling people)
  E = Enterprising (leading, persuading, business)
  C = Conventional (organizing, data, structured tasks)
- ONLY mention letters actually present in the student's code
- Match language to their actual work orientation (R, I, A, S, E, or C)

NARRATIVE GROUNDING:
- The narrative MUST be grounded in the student's actual program, knowledge domain, RIASEC code, and Big Five
- Use domain-specific language that reflects their field of study
- The narrative goes into the RAG context and influences career matching, so accuracy is critical
- Do NOT name specific occupations — describe the type of work and domain they fit within

OVERALL SUMMARY:
- 2-3 sentences, ~40-50 words
- Third person, student-centric
- Open with study level and program name
- Ground every statement in actual scores and data
- Be specific and professional, no generic language`;

function buildUser(
  student: StudentProfile,
  context: ClusterNarrativeContext
): string {
  const adaptive = context.adaptive;
  const aptByArea = adaptive?.accuracyBySubtag
    ? Object.entries(adaptive.accuracyBySubtag)
        .map(([k, v]) => {
          const val = typeof v === 'object' && v ? v.accuracy : v;
          return `${k.replace(/_/g, ' ')}: ${val}%`;
        })
        .join(', ')
    : 'n/a';

  const aptitudeInsightsText = context.aptitudeInsights
    ? `APTITUDE INSIGHTS:
Strengths: ${context.aptitudeInsights.strengths?.map((s: string) => s.replace(/_/g, ' ')).join(', ') || 'n/a'}
Weaknesses: ${context.aptitudeInsights.weaknesses?.map((w: string) => w.replace(/_/g, ' ')).join(', ') || 'n/a'}
Pattern: ${context.aptitudeInsights.pattern || 'n/a'}`
    : '';

  // Domain knowledge details (if available)
  const knowledgeText = student.knowledge_details
    ? `DOMAIN EXPERTISE:
Strong topics: ${student.knowledge_details.strongTopics?.join(', ') || 'n/a'}
Weak topics: ${student.knowledge_details.weakTopics?.join(', ') || 'n/a'}`
    : '';

  // Top work values (for RAG matching)
  const workValuesText = student.work_values
    ? `Top work values: ${Object.entries(student.work_values)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([k, v]) => `${k} (${v})`)
        .join(', ')}`
    : '';

  // Stream-specific aptitude (MCQ test for their program)
  const streamAptitudeText = student.stream_aptitude_score
    ? `Stream (${student.stream}) Aptitude: ${student.stream_aptitude_score}%${
        student.stream_aptitude_details?.aptitudeInsights
          ? `
  Performance by difficulty: ${JSON.stringify(student.stream_aptitude_details.byDifficulty || {})}
  Strong cognitive areas: ${student.stream_aptitude_details.aptitudeInsights.strongTopics?.join(', ') || 'none identified yet'}
  Areas to improve: ${student.stream_aptitude_details.aptitudeInsights.weakTopics?.join(', ') || 'none identified'}
  Performance pattern: ${student.stream_aptitude_details.aptitudeInsights.pattern || 'n/a'}
  Recommendation: ${student.stream_aptitude_details.aptitudeInsights.recommendation || 'n/a'}`
          : ''
      }`
    : '';

  return `STUDENT ASSESSMENT DATA

Program / stream: ${student.stream || 'Not specified'}
Study level: ${student.degreeLevel || 'Not specified'} ${student.degreeLevel === 'postgraduate' ? '(postgraduate — frame around advanced/specialist roles)' : student.degreeLevel === 'undergraduate' ? '(undergraduate — frame around entry-level roles & internships)' : ''}

PERSONALITY & INTERESTS:
RIASEC code: ${student.riasec_code}
RIASEC scores: ${JSON.stringify(student.riasec_scores)}
Big Five (1-5): ${JSON.stringify(student.big_five_scores || {})}
${workValuesText}

ACADEMIC PERFORMANCE:
${streamAptitudeText}

Domain knowledge score: ${student.knowledge_score != null ? student.knowledge_score + '%' : 'n/a'}
${knowledgeText}

Adaptive aptitude: overall ${adaptive?.overallAccuracy ?? 'n/a'}%, level ${adaptive?.aptitudeLevel ?? 'n/a'}
By area: ${aptByArea}

${aptitudeInsightsText}

NARRATIVE GENERATION RULES:
1. Use the domain expertise (strong topics, stream, aptitude pattern) to write a rich, field-specific narrative.
2. CRITICAL: Include actual keywords from their domain expertise in the narrative for RAG semantic matching:
   - For technical streams (MCA, BCA, etc.): emphasize programming, software development, data, systems, architecture, engineering
   - Include specific competencies from their field (Database, Web Development, OS, etc.)
   - Reference their degree program explicitly (e.g., "Master of Computer Applications")
3. Interpret their RIASEC code and Big Five through the lens of their actual program and knowledge.
4. Balance RIASEC profile with domain context (e.g., "Enterprising orientation in technical leadership" not just "Enterprising")
5. Avoid generic language that could match non-technical careers.

Interpret this student's profile and return the JSON exactly as specified.`;
}
