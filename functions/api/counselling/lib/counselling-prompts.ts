/**
 * Counselling prompt builders (server copy).
 *
 * Verbatim ports of SYSTEM_PROMPTS + buildlearnerContextPrompt from
 * `src/features/counselling/api/counsellingService.ts` so Pages Functions
 * can run counselling chat without importing the Vite tree.
 */

export type CounsellingTopic = 'academic' | 'career' | 'performance' | 'mental-health' | 'general';

export const COUNSELLING_TOPICS: readonly CounsellingTopic[] = [
  'academic',
  'career',
  'performance',
  'mental-health',
  'general',
];

const SYSTEM_PROMPTS: Record<CounsellingTopic, string> = {
  academic: `You are an experienced academic counsellor at a university. Your role is to:
    - Help learners with course selection and academic planning
    - Provide study strategies and time management advice
    - Guide learners on academic goals and career pathways
    - Offer constructive feedback on academic performance
    - Be supportive, empathetic, and professional
    Always consider the learner's background, interests, and goals when providing advice.`,

  career: `You are a professional career counsellor specializing in helping university learners. Your role is to:
    - Guide learners on career exploration and planning
    - Provide insights on industry trends and job market
    - Help with resume building and interview preparation
    - Suggest skill development and networking opportunities
    - Connect academic choices with career prospects
    Be practical, encouraging, and provide actionable advice.`,

  performance: `You are an academic performance advisor. Your role is to:
    - Analyze learner performance data and provide insights
    - Identify strengths and areas for improvement
    - Suggest personalized learning strategies
    - Help learners set realistic academic goals
    - Provide motivational support and accountability
    Be data-driven, objective, and constructive in your feedback.`,

  'mental-health': `You are a supportive university counsellor focused on learner wellbeing. Your role is to:
    - Provide emotional support and stress management strategies
    - Help with work-life balance and time management
    - Offer coping mechanisms for academic pressure
    - Encourage healthy habits and self-care
    - IMPORTANT: You are NOT a licensed therapist. For serious mental health concerns, always recommend professional help
    Be compassionate, understanding, and non-judgmental.`,

  general: `You are a friendly and knowledgeable university counsellor. Your role is to:
    - Assist learners with various university-related questions
    - Provide guidance on campus resources and opportunities
    - Help with general learner life concerns
    - Offer advice on extracurricular activities and personal development
    - Be approachable, helpful, and informative
    Always maintain a supportive and professional tone.`,
};

export interface LearnerContextSummary {
  name?: string;
  department?: string;
  year?: string;
  gpa?: string;
  enrolled_courses?: string[];
  interests?: string[];
  career_goals?: string[];
  recent_performance?: Array<{ subject?: string; grade?: string }>;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function strList(value: unknown, maxItems: number, maxItem: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').slice(0, maxItems).map((v) => v.slice(0, maxItem));
}

/** Sanitize client-supplied learner context: bounded strings/lists only. */
export function sanitizeLearnerContext(input: unknown): LearnerContextSummary {
  const rec = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const perf = Array.isArray(rec.recent_performance)
    ? rec.recent_performance.slice(0, 10).map((p) => {
        const r = (typeof p === 'object' && p !== null ? p : {}) as Record<string, unknown>;
        return { subject: text(r.subject, 80), grade: text(r.grade, 20) };
      })
    : undefined;
  return {
    name: text(rec.name, 80) || undefined,
    department: text(rec.department, 80) || undefined,
    year: text(rec.year, 20) || undefined,
    gpa: text(rec.gpa, 20) || undefined,
    enrolled_courses: strList(rec.enrolled_courses, 20, 100),
    interests: strList(rec.interests, 20, 100),
    career_goals: strList(rec.career_goals, 20, 100),
    recent_performance: perf,
  };
}

export function buildlearnerContextPrompt(context?: LearnerContextSummary): string {
  if (!context) return '';

  let prompt = `\n\n=== Learner Information ===\n`;
  prompt += `Name: ${context.name ?? ''}\n`;

  if (context.department) prompt += `Department: ${context.department}\n`;
  if (context.year) prompt += `Year: ${context.year}\n`;
  if (context.gpa) prompt += `GPA: ${context.gpa}\n`;

  if (context.enrolled_courses && context.enrolled_courses.length > 0) {
    prompt += `Enrolled Courses: ${context.enrolled_courses.join(', ')}\n`;
  }

  if (context.interests && context.interests.length > 0) {
    prompt += `Interests: ${context.interests.join(', ')}\n`;
  }

  if (context.career_goals && context.career_goals.length > 0) {
    prompt += `Career Goals: ${context.career_goals.join(', ')}\n`;
  }

  if (context.recent_performance && context.recent_performance.length > 0) {
    prompt += `Recent Performance:\n`;
    context.recent_performance.forEach((perf) => {
      prompt += `  - ${perf.subject}: ${perf.grade}\n`;
    });
  }

  prompt += `========================\n`;
  return prompt;
}

export function systemPromptFor(topic: CounsellingTopic): string {
  return SYSTEM_PROMPTS[topic];
}

export function parseTopic(raw: unknown): CounsellingTopic {
  return typeof raw === 'string' && (COUNSELLING_TOPICS as readonly string[]).includes(raw)
    ? (raw as CounsellingTopic)
    : 'general';
}
