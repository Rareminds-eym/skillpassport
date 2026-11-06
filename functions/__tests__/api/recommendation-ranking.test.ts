import { expect, it } from 'vitest';
import { rankRecommendationCandidates } from '../../lib/recommendation-ranking';
import { careerPreferencesSchema } from '../../../shared/contracts/career-preferences';
const job = (id: string, extra: Record<string, any> = {}) => ({ id, status: 'open', is_active: true, employment_type: 'full_time', title: 'Python developer', skills_required: ['Python'], ...extra });
it.each([
  { locations: ['Chennai'] },
  { locations: ['Chennai'], strictLocations: true },
  { employmentTypes: ['full_time'] },
  { workModes: ['remote'] },
  { departments: ['Healthcare'] },
])('does not admit an unrelated job solely for a non-career preference: %j', values => {
  const preferences = careerPreferencesSchema.parse(values);
  const unrelated = job('cardiologist', { title: 'Consultant cardiologist', skills_required: ['Cardiology'], location: 'Chennai, India', mode: 'remote', department: 'Healthcare' });
  expect(rankRecommendationCandidates([unrelated], { skillNames: ['Python'], preferences })).toEqual([]);
});
it.each([0, -0.1])('does not treat a nonpositive semantic score %s as career relevance', similarity => {
  expect(rankRecommendationCandidates([job('unrelated', { skills_required: ['Cardiology'], similarity })], { skillNames: ['Python'] })).toEqual([]);
});
it('prefers supporting approved skills to a stronger semantic score alone', () => {
  const result = rankRecommendationCandidates([job('weak', { similarity: 0.95, skills_required: ['Java'] }), job('supported', { similarity: 0.7 })], { skillNames: ['Python'] });
  expect(result.map(row => row.id)).toEqual(['supported', 'weak']);
  expect(result[0].recommendation_reasons).toContainEqual({ source: 'approved_skill', label: 'Python' });
});
it('never explains JavaScript as evidence for Java or a title as eligibility', () => {
  const result = rankRecommendationCandidates([job('java', { skills_required: ['Java'], similarity: 0.6 })], { skillNames: ['JavaScript'] });
  expect(result[0].match_reasons.matched_skills).toEqual([]); expect(result[0].learning_eligibility).toBeUndefined();
});
it('applies required choices to unknown fields and exact city components', () => {
  const preferences = careerPreferencesSchema.parse({ locations: ['Chennai'], workModes: ['remote'], strictLocations: true, strictWorkModes: true });
  const result = rankRecommendationCandidates([job('unknown', { similarity: 0.9 }), job('substring', { location: 'Chennaiville', mode: 'remote', similarity: 0.9 }), job('valid', { location: 'Chennai, India', mode: 'remote', similarity: 0.7 })], { preferences });
  expect(result.map(row => row.id)).toEqual(['valid']);
});
it('keeps soft preferences soft and never infers relocation consent from country', () => {
  const preferences = careerPreferencesSchema.parse({ locations: ['Chennai'] });
  const result = rankRecommendationCandidates([job('remote-city', { location: 'Mumbai', similarity: 0.7 })], { preferences });
  expect(result).toHaveLength(1); expect(result[0].match_reasons.location_match).toBe(false);
});
it('does not present recency-only candidates as personalized matches', () => {
  expect(rankRecommendationCandidates([job('unrelated', { skills_required: ['Java'], posted_date: new Date().toISOString() })], { skillNames: ['Python'] })).toEqual([]);
});
it('labels saved preferences and assessment intent separately from skill evidence', () => {
  const result = rankRecommendationCandidates([job('intent', { skills_required: [] })], { preferences: careerPreferencesSchema.parse({ targetRoles: ['Python developer'] }), inferredRoles: ['Python developer'] });
  expect(result[0].recommendation_reasons.map((reason: any) => reason.source)).toEqual(['saved_preference', 'assessment_inferred_intent']);
  expect(result[0].match_reasons.matched_skills).toEqual([]);
});
it('removes expired, closed, visit, duplicate and excluded candidates deterministically', () => {
  const result = rankRecommendationCandidates([job('closed', { status: 'closed' }), job('visit', { employment_type: 'factory_visit' }), job('expired', { deadline: '2000-01-01' }), job('excluded'), job('b'), job('a'), job('a')], { skillNames: ['Python'] }, ['excluded']);
  expect(result.map(row => row.id)).toEqual(['a', 'b']);
});

it.each(['Communication', 'Teamwork', 'Problem-solving', 'Leadership'])('does not admit a specialist job from a general skill alone: %s', skill => {
  expect(rankRecommendationCandidates([job('specialist', { title: 'Consultant cardiologist', skills_required: ['Cardiology', skill] })], { skillNames: [skill] })).toEqual([]);
});
it('honors approved soft-skill metadata beyond the common general-skill names', () => {
  expect(rankRecommendationCandidates([job('specialist', { title: 'Consultant cardiologist', skills_required: ['Cardiology', 'Customer empathy'] })], { skillNames: ['Customer empathy'], softSkillNames: ['Customer empathy'] })).toEqual([]);
});
it('retains roles whose complete requirements consist of matching general skills', () => {
  expect(rankRecommendationCandidates([job('support', { title: 'Customer support assistant', skills_required: ['Communication', 'Teamwork'] })], { skillNames: ['Communication'] })).toHaveLength(1);
});
it('does not inflate specialist skill coverage with general-skill overlaps', () => {
  const result = rankRecommendationCandidates([job('semantic', { title: 'Consultant cardiologist', skills_required: ['Cardiology', 'Communication'], similarity: 0.5 })], { skillNames: ['Communication'] });
  expect(result).toHaveLength(1);
  expect(result[0].ranking_features.skillCoverage).toBe(0);
  expect(result[0].match_reasons.matched_skills).toEqual(['Communication']);
});
it('retains a specific skill match without requiring every general skill', () => {
  const result = rankRecommendationCandidates([job('supported', { skills_required: ['Python', 'Communication'] })], { skillNames: ['Python'] });
  expect(result).toHaveLength(1); expect(result[0].ranking_features.skillCoverage).toBe(1);
});
const learningEligibility = { state: 'eligible', canApply: true, criteria: [{ status: 'eligible' }] };
it.each([false])('does not admit a learning-only candidate after an explicit opt-out: %s', useVerifiedLearning => {
  expect(rankRecommendationCandidates([job('learning-only', { skills_required: ['Excel'], learning_eligibility: learningEligibility })], { skillNames: ['Python'], preferences: careerPreferencesSchema.parse({ useVerifiedLearning }) })).toEqual([]);
});
it('retains opted-in evaluated-learning relevance', () => {
  const result = rankRecommendationCandidates([job('learning-only', { skills_required: ['Excel'], learning_eligibility: learningEligibility })], { skillNames: ['Python'], preferences: careerPreferencesSchema.parse({ useVerifiedLearning: true }) });
  expect(result).toHaveLength(1); expect(result[0].ranking_features.confirmedLearning).toBe(1);
});
it('preserves application eligibility while suppressing opted-out learning ranking features', () => {
  const result = rankRecommendationCandidates([job('supported', { learning_eligibility: learningEligibility })], { skillNames: ['Python'], preferences: careerPreferencesSchema.parse({ useVerifiedLearning: false }) });
  expect(result).toHaveLength(1); expect(result[0].learning_eligibility).toBe(learningEligibility);
  expect(result[0].ranking_features.confirmedLearning).toBe(0);
});
it.each([false, true])('only boosts learning matches when useVerifiedLearning is %s', enabled => {
  const result = rankRecommendationCandidates([job('a'), job('b', { learning_eligibility: learningEligibility })], { skillNames: ['Python'], preferences: careerPreferencesSchema.parse({ useVerifiedLearning: enabled }) });
  expect(result.map(row => row.id)).toEqual(enabled ? ['b', 'a'] : ['a', 'b']);
});
