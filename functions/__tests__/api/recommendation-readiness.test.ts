import { describe, expect, it } from 'vitest';
import { evaluateRecommendationReadiness } from '../../lib/recommendation-readiness';
import { recommendationEnvelopeSchema, type RecommendationReadiness } from '../../../shared/contracts/job-recommendations';

describe('source-semantic readiness', () => {
  describe.each(['role', 'description'])('empty experience in %s', field => {
    it.each([
      "I don't have any work experience",
      'I don’t have any work experience.',
      'I do not have any professional experience yet',
      'I have never worked before',
      "I haven't worked yet",
      'I have not been employed before',
      'Never worked before',
    ])('does not treat %s as career evidence', value => {
      expect(evaluateRecommendationReadiness({ experience: [{ [field]: value }] })).toMatchObject({ state: 'needs_profile', coverage: [] });
    });
  });

  it.each([
    'I have no professional experience, but built a Python inventory tool',
    "I don't have any work experience, but built a Python inventory tool",
    'I have never worked before, but maintained ocean sensors as a volunteer',
    'I have never worked with Python; maintained marine diesel engines',
  ])('preserves substantive evidence after a negative statement: %s', description => {
    expect(evaluateRecommendationReadiness({ experience: [{ description }] })).toMatchObject({ state: 'ready', coverage: ['experience'] });
  });

  it('retains other career evidence when experience is empty', () => {
    expect(evaluateRecommendationReadiness({ skills: ['Python'], experience: [{ description: "I don't have any work experience" }] })).toMatchObject({ state: 'ready', coverage: ['skills'] });
  });

  it.each(['No experience', 'No work experience yet.', '0 years', 'Zero years of experience', 'I have no previous experience.', 'I am passionate and motivated.'])('does not treat %s as experience evidence', description => {
    expect(evaluateRecommendationReadiness({ experience: [{ description }] })).toMatchObject({ state: 'needs_profile', coverage: [] });
  });

  it.each(['BSc', 'B.Sc.', 'B. Sc.', 'B.Tech.', 'M.Sc.', 'Ph.D.', 'Ｂ．Ｓｃ．', 'Bachelor of Technology', 'Bachelor of Engineering', "Bachelor’s of Engineering", 'Master of Technology', 'Master of Engineering'])('keeps generic degree %s limited regardless of punctuation', degree => {
    expect(evaluateRecommendationReadiness({ education: [{ degree }] })).toMatchObject({ state: 'limited_context', coverage: [] });
  });

  it.each(['B.Sc. in Marine Biology', 'B.Tech. in Mechanical Engineering', 'M.Sc. Physics', 'Bachelor of Technology in Mechanical Engineering', 'Bachelor of Engineering in Computer Science', 'Master of Technology in Ocean Engineering'])('preserves the specific field in %s', degree => {
    expect(evaluateRecommendationReadiness({ education: [{ degree }] })).toMatchObject({ state: 'ready', coverage: ['education'] });
  });

  it.each(['Marine technician with no prior software experience', 'Built Python APIs during an internship', 'Engineer working on zero-emission vehicles'])('does not discard substantive experience containing a negative or zero: %s', description => {
    expect(evaluateRecommendationReadiness({ experience: [{ description }] }).state).toBe('ready');
  });

  it.each([
    {},
    { name: 'A very long name', country: 'India', age: 30, gender: 'female' },
    { bio: 'Motivated and passionate. '.repeat(100) },
    { bio: 'abcdef'.repeat(1000), portfolio_link: 'https://example.invalid' },
    { skills: ['unknown', 'N/A', ' ', 'https://example.invalid'] },
    { assessment: { personality: 'Technical expert', skills: ['Python'] } },
    { projects: [{ title: 'Project', description: ' ', technologies: [] }] },
  ])('does not count identity, filler, placeholders or unsupported assessment input: %j', input => {
    expect(evaluateRecommendationReadiness(input)).toMatchObject({ state: 'needs_profile', coverage: [] });
  });

  it.each([
    { skills: ['R'] },
    { education: [{ field: 'Marine Biology', degree: 'BSc' }] },
    { education: [{ degree: 'Bachelor of Mechanical Engineering' }] },
    { education: [{ degree: 'Bachelor of Engineering', field: 'Civil Engineering' }] },
    { projects: [{ title: 'Salinity sensor', description: 'Built a calibrated salinity measurement device', technologies: [] }] },
    { experience: [{ role: 'Marine technician' }] },
    { completedCourses: ['Oceanography'] },
    { trainings: [{ title: 'Ocean instrumentation', status: 'completed' }] },
  ])('allows useful sparse/fresher career evidence without a universal field count: %j', input => {
    const result = evaluateRecommendationReadiness(input);
    expect(result.state).toBe('ready');
    expect(result.coverage).toHaveLength(1);
    expect(result.suggestedActions).toEqual([]);
  });

  it.each([
    { interests: ['Software developer'] },
    { education: [{ degree: 'BSc' }] },
    { trainings: [{ title: 'Ocean instrumentation', status: 'ongoing' }] },
  ])('keeps intent/ongoing learning separate from personal-fit evidence: %j', input => {
    expect(evaluateRecommendationReadiness(input)).toMatchObject({ state: 'limited_context', coverage: [] });
  });
});

describe('runtime response contract', () => {
  const readiness: RecommendationReadiness = { state: 'needs_profile', policyVersion: 'career-readiness-4', coverage: [], suggestedActions: ['add_skill'] };
  const profile = { schemaVersion: 2, state: 'needs_profile', readiness, recommendations: [], provenance: 'none', cached: false, input_revision: '4' };
  it('rejects envelopes from the previous readiness policy', () => {
    expect(recommendationEnvelopeSchema.safeParse({ ...profile, readiness: { ...readiness, policyVersion: 'career-readiness-3' } }).success).toBe(false);
  });
  it('retains profile-needed and empty-result state without relying on the first card', () => {
    expect(recommendationEnvelopeSchema.parse(profile)).toEqual(profile);
    expect(recommendationEnvelopeSchema.parse({ ...profile, state: 'no_matches', readiness: { ...readiness, state: 'ready', coverage: ['skills'], suggestedActions: [] }, provenance: 'embedding' }).state).toBe('no_matches');
  });
  it.each([
    { recommendations: [{ id: 'unsafe' }] },
    { provenance: 'embedding' },
    { cached: true },
    { readiness: { ...readiness, state: 'ready' } },
    { state: 'ready' },
  ])('rejects contradictory profile/result provenance: %j', override => {
    expect(recommendationEnvelopeSchema.safeParse({ ...profile, ...override }).success).toBe(false);
  });
});

describe('pending response contract',()=>{
  const pending={schemaVersion:2,state:'index_building',readiness:{state:'ready',policyVersion:'career-readiness-4',coverage:['skills'],suggestedActions:[]},recommendations:[],provenance:'none',cached:false,input_revision:'1',retry_after_seconds:3};
  it.each(['processing','index_building'])('accepts a bounded %s response without claimed matches',state=>{
    expect(recommendationEnvelopeSchema.parse({...pending,state}).state).toBe(state);
  });
  it.each([{recommendations:[{id:'unsafe'}]},{cached:true},{provenance:'embedding'},{retry_after_seconds:undefined},{retry_after_seconds:0},{retry_after_seconds:61},{retry_after_seconds:1.5},{readiness:{state:'needs_profile',policyVersion:'career-readiness-4',coverage:[],suggestedActions:['add_skill']}}])('rejects contradictory pending metadata %j',override=>{
    expect(recommendationEnvelopeSchema.safeParse({...pending,...override}).success).toBe(false);
  });
});
