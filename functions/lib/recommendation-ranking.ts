import { canonicalSkillName, stringSkills, isRecommendableJob } from './job-recommendations';
import { emptyCareerPreferences, type CareerPreferences } from '../../shared/contracts/career-preferences';

export const SHARED_RANKING_VERSION = 'evidence-order-4';
export const choiceKey = (value: unknown): string => typeof value === 'string'
  ? value.normalize('NFKC').toLowerCase().trim().replace(/[-_\s]+/g, ' ').replace(/^on site$/, 'onsite') : '';
const contains = (values: string[], value: unknown) => values.some(item => choiceKey(item) === choiceKey(value));
// A bounded policy for common cross-occupation skills also covers legacy rows
// without a skill type. Other approved soft skills come from the owned reader.
// These overlaps remain truthful explanations, but cannot substitute for a
// job's specialist requirements. General-skill-only roles remain discoverable.
const generalSkillKeys = new Set([
  'communication', 'communication skills', 'verbal communication', 'written communication',
  'teamwork', 'team work', 'collaboration', 'leadership', 'time management',
  'problem solving', 'critical thinking', 'adaptability', 'interpersonal skills',
  'creativity', 'attention to detail', 'computer skills',
]);
export function preferenceMatches(job: Record<string, any>, preferences: CareerPreferences) {
  const locationParts = typeof job.location === 'string' ? [job.location, ...job.location.split(',')] : [];
  return {
    location: preferences.locations.length > 0 && locationParts.some(part => contains(preferences.locations, part)),
    employment: preferences.employmentTypes.length > 0 && contains(preferences.employmentTypes, job.employment_type),
    workMode: preferences.workModes.length > 0 && contains(preferences.workModes, job.mode),
    department: preferences.departments.length > 0 && [job.department, job.sector].some(value => contains(preferences.departments, value)),
  };
}
export function passesRequiredPreferences(job: Record<string, any>, preferences: CareerPreferences) {
  const matches = preferenceMatches(job, preferences);
  return (!preferences.strictLocations || matches.location) && (!preferences.strictEmploymentTypes || matches.employment) && (!preferences.strictWorkModes || matches.workMode);
}

/** Shared deterministic ordering. Preferences describe intent; they never prove
 * a skill or eligibility. Scores retain their original semantic meaning. */
export function rankRecommendationCandidates<T extends Record<string, any>>(jobs: T[], context: { skillNames?: string[]; softSkillNames?: string[]; preferences?: CareerPreferences; inferredRoles?: string[] }, excludedIds: string[] = []): Array<T & Record<string, any>> {
  const preferences = context.preferences || emptyCareerPreferences();
  const skills = new Set((context.skillNames || []).map(canonicalSkillName));
  const softSkills = new Set((context.softSkillNames || []).map(canonicalSkillName));
  const isGeneralSkill = (skill: string) => generalSkillKeys.has(choiceKey(skill)) || softSkills.has(canonicalSkillName(skill));
  const excluded = new Set(excludedIds), seen = new Set<string>();
  const ranked = jobs.flatMap(job => {
    if (!isRecommendableJob(job) || excluded.has(job.id) || seen.has(job.id) || !passesRequiredPreferences(job, preferences)) return [];
    seen.add(job.id);
    const required = [...new Map(stringSkills(job.skills_required).map(skill => [canonicalSkillName(skill), skill])).values()];
    const matched = required.filter(skill => skills.has(canonicalSkillName(skill)));
    const specificRequired = required.filter(skill => !isGeneralSkill(skill));
    const relevantRequired = specificRequired.length ? specificRequired : required;
    const relevantMatched = relevantRequired.filter(skill => skills.has(canonicalSkillName(skill)));
    const matches = preferenceMatches(job, preferences);
    const title = ` ${choiceKey(job.job_title || job.title)} `;
    const roles = preferences.targetRoles.filter(role => title.includes(` ${choiceKey(role)} `));
    const inferredRoles = (context.inferredRoles || []).filter(role => title.includes(` ${choiceKey(role)} `));
    const criteria = Array.isArray(job.learning_eligibility?.criteria) ? job.learning_eligibility.criteria : [];
    // Application eligibility remains attached to the job independently of
    // personalization consent. Only enabled learning context can use it for ranking.
    const confirmedLearning = preferences.useVerifiedLearning
      ? criteria.filter((criterion: any) => criterion.status === 'eligible').length : 0;
    const semantic = typeof job.similarity === 'number' && Number.isFinite(job.similarity) ? job.similarity : 0;
    const reasons = [
      ...matched.map(skill => ({ source: 'approved_skill', label: skill })),
      ...roles.map(role => ({ source: 'saved_preference', label: `Target role: ${role}` })),
      ...inferredRoles.map(role => ({ source: 'assessment_inferred_intent', label: `Assessment suggests exploring: ${role}` })),
      ...Object.entries(matches).filter(([, yes]) => yes).map(([kind]) => ({ source: 'saved_preference', label: `Preferred ${kind}` })),
      ...(semantic > 0 ? [{ source: 'semantic_retrieval', label: 'Related to your career context; review the requirements.' }] : []),
    ];
    // Do not turn a recent timestamp alone into a personalized match. The
    // semantic route already supplies a bounded retrieval candidate set.
    // Location, work arrangement and employment preferences only filter/order
    // career-relevant candidates; they cannot establish relevance by themselves.
    if (!relevantMatched.length && !confirmedLearning && semantic <= 0 && !roles.length && !inferredRoles.length) return [];
    return [{ ...job, match_reasons: { skill_match: matched.length > 0, matched_skills: matched, employment_type_match: matches.employment, location_match: matches.location, department_match: matches.department },
      recommendation_reasons: reasons, ranking_policy_version: SHARED_RANKING_VERSION,
      ranking_features: { skillCoverage: relevantRequired.length ? relevantMatched.length / relevantRequired.length : 0, confirmedLearning, targetRole: roles.length > 0, preferredChoices: Object.values(matches).filter(Boolean).length, semantic },
    }];
  });
  return ranked.sort((a, b) => {
    for (const key of ['skillCoverage', 'confirmedLearning', 'targetRole', 'preferredChoices', 'semantic'] as const) {
      const delta = Number(b.ranking_features[key]) - Number(a.ranking_features[key]);
      if (delta) return delta;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
