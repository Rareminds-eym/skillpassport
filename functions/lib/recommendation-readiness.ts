import { z } from 'zod';
import { READINESS_POLICY_VERSION, recommendationReadinessSchema, type RecommendationReadiness } from '../../shared/contracts/job-recommendations';

const text = z.string().max(4000);
const strings = z.array(text).max(100).default([]);
// Only an authorized server reader constructs this input. Approval/visibility
// filtering belongs to that reader; clients cannot submit readiness evidence.
export const careerSignalsSchema = z.object({
  skills: strings,
  education: z.array(z.object({ field: text.optional(), degree: text.optional() })).max(100).default([]),
  experience: z.array(z.object({ role: text.optional(), description: text.optional() })).max(100).default([]),
  projects: z.array(z.object({ title: text, description: text.optional(), technologies: strings })).max(100).default([]),
  credentials: strings,
  completedCourses: strings,
  trainings: z.array(z.object({ title: text, status: text })).max(100).default([]),
  interests: strings,
});
export type CareerSignals = z.input<typeof careerSignalsSchema>;

const placeholders = new Set(['n/a', 'na', 'none', 'null', 'undefined', 'unknown', 'other', 'general', 'test', 'student', 'fresher', 'skill', 'project', 'certificate', 'training', 'course']);
export function normalizeCareerSignal(value: unknown): string {
  return typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 4000) : '';
}
export function isUsefulCareerSignal(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = normalizeCareerSignal(value).toLowerCase();
  return /\p{L}/u.test(normalized) && !/^https?:\/\//i.test(normalized) && !placeholders.has(normalized);
}
const experienceFiller = new Set(['i', 'am', 'a', 'an', 'the', 'my', 'and', 'but', 'very', 'passionate', 'motivated', 'hardworking', 'hard', 'working', 'worker', 'enthusiastic', 'dedicated', 'eager', 'to', 'learn', 'learner', 'student', 'fresher', 'looking', 'for', 'opportunities', 'seeking', 'job', 'jobs', 'opportunity', 'with', 'no', 'experience', 'yet']);
function usefulExperience(value: string | undefined): boolean {
  if (!isUsefulCareerSignal(value)) return false;
  const normalized = normalizeCareerSignal(value).toLowerCase().replace(/[’‘]/g, "'").replace(/[.!?]+$/, '');
  // Whole-field placeholders only: a real description may discuss a skill the
  // learner lacks, or mention zero-emission work, without losing its evidence.
  if (/^(?:i have )?(?:no|zero|0) (?:(?:prior|previous|professional|relevant|work|job|paid) )*experience(?: yet)?$/.test(normalized)) return false;
  if (/^(?:i )?(?:do not|don't) have (?:any )?(?:(?:prior|previous|professional|relevant|work|job|paid) )*experience(?: yet)?$/.test(normalized)) return false;
  if (/^(?:i )?(?:have not|haven't|have never|never) (?:worked|been employed)(?: before| yet)?$/.test(normalized)) return false;
  if (/^(?:0(?:\.0+)?|zero)\s*(?:years?|yrs?|months?|mos?)(?: (?:of )?(?:(?:prior|previous|professional|relevant|work) )*experience)?$/.test(normalized)) return false;
  const words = normalized.match(/[\p{L}\p{N}]+/gu) || [];
  return words.some(word => !experienceFiller.has(word));
}
function specificDegree(value: string | undefined): boolean {
  if (!isUsefulCareerSignal(value)) return false;
  // A generic degree level alone is not a career field. Never require work
  // experience from a fresher whose specific study field supplies context.
  const degree = normalizeCareerSignal(value).replace(/\./g, '').replace(/[’‘]/g, "'").trim();
  return !/^(b\s?(a|sc|com|tech|e)|m\s?(a|sc|com|tech|e)|mba|phd|bachelor(?:'s|s)?(?: of (?:science|arts|technology|engineering))?|master(?:'s|s)?(?: of (?:science|arts|technology|engineering))?|degree|diploma)$/i.test(degree);
}

export function evaluateRecommendationReadiness(input: CareerSignals): RecommendationReadiness {
  const signals = careerSignalsSchema.parse(input);
  const coverage: RecommendationReadiness['coverage'] = [];
  if (signals.skills.some(isUsefulCareerSignal)) coverage.push('skills');
  if (signals.education.some(row => isUsefulCareerSignal(row.field) || specificDegree(row.degree))) coverage.push('education');
  if (signals.experience.some(row => usefulExperience(row.role) || usefulExperience(row.description))) coverage.push('experience');
  if (signals.projects.some(row => isUsefulCareerSignal(row.title) && (isUsefulCareerSignal(row.description) || row.technologies.some(isUsefulCareerSignal)))) coverage.push('projects');
  if (signals.credentials.some(isUsefulCareerSignal)) coverage.push('credentials');
  if (signals.completedCourses.some(isUsefulCareerSignal) || signals.trainings.some(row => row.status === 'completed' && isUsefulCareerSignal(row.title))) coverage.push('completed_learning');
  const exploration = signals.interests.some(isUsefulCareerSignal) || signals.trainings.some(row => isUsefulCareerSignal(row.title)) || signals.education.some(row => isUsefulCareerSignal(row.degree));
  return recommendationReadinessSchema.parse({
    state: coverage.length ? 'ready' : exploration ? 'limited_context' : 'needs_profile',
    policyVersion: READINESS_POLICY_VERSION,
    coverage,
    suggestedActions: coverage.length ? [] : ['add_skill', 'add_education', 'describe_project', ...(signals.trainings.length ? ['review_learning'] : [])],
  });
}
