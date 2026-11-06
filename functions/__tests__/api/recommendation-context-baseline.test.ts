import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildlearnerTextFromDatabase, buildLearnerRecommendationContext } from '../../api/embedding/services/textBuilder';
import { EMBEDDING_CONFIG } from '../../api/embedding/config/constants';

type Row = Record<string, unknown>;
const learnerId = '33333333-3333-4333-8333-333333333333';

// Execute the real builder against rows filtered BEFORE limiting, as PostgREST
// does. Unknown query operations fail loudly rather than ignoring predicates.
function database(tables: Record<string, Row[]>, failedTable?: string, useSavedOptOut = true) {
  // These evidence fixtures intentionally isolate external sources with saved opt-outs.
  if (useSavedOptOut) tables = { ...tables, learner_career_preferences: (tables.learner_career_preferences ?? [{ learner_id: learnerId, preferences: {} }]).map(row => ({ ...row, preferences: { useAssessmentRecommendations: false, useVerifiedLearning: false, ...(row.preferences as Record<string, unknown>) } })) };
  const reads: Array<{ table: string; columns: string }> = [];
  const from = (table: string) => {
    if (!['learners', 'skills', 'projects', 'certificates', 'trainings', 'course_enrollments', 'education', 'experience', 'learner_career_preferences', 'personal_assessment_results'].includes(table)) {
      throw new Error(`Unsupported fixture table: ${table}`);
    }
    const read = { table, columns: '' };
    reads.push(read);
    let rows = [...(tables[table] ?? [])];
    let maximum = Infinity;
    const ordering: Array<{ key: string; ascending: boolean }> = [];
    const result = () => table === failedTable
      ? { data: null, error: { code: 'fixture-unavailable' } }
      : { data: [...rows].sort((a, b) => {
        for (const { key, ascending } of ordering) {
          const order = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
          if (order) return order * (ascending ? 1 : -1);
        }
        return 0;
      }).slice(0, maximum), error: null };
    const query = {
      select: (columns: string) => { read.columns = columns; return query; },
      eq: (key: string, value: unknown) => {
        rows = rows.filter(row => row[key] === value);
        return query;
      },
      in: (key: string, values: unknown[]) => {
        rows = rows.filter(row => values.includes(row[key]));
        return query;
      },
      or: (filter: string) => {
        if (filter === 'enabled.is.null,enabled.eq.true') {
          rows = rows.filter(row => row.enabled == null || row.enabled === true);
          return query;
        }
        if (filter !== 'expiry_date.is.null,expiry_date.gte.now()') {
          throw new Error(`Unsupported fixture predicate: ${filter}`);
        }
        rows = rows.filter(row => row.expiry_date == null || Date.parse(String(row.expiry_date)) >= Date.now());
        return query;
      },
      order: (key: string, options: { ascending: boolean }) => {
        ordering.push({ key, ascending: options.ascending });
        return query;
      },
      limit: (count: number) => { maximum = count; return query; },
      single: async () => {
        const response = result();
        return { ...response, data: response.data?.[0] ?? null };
      },
      maybeSingle: async () => { const response = result(); return { ...response, data: response.data?.[0] ?? null }; },
      then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return query;
  };
  let revision = 1, learningHash = '';
  const rpc = vi.fn(async (name: string, args?: Record<string, any>) => {
    if (name === 'job_learning_evaluation_policy') return { data: 'human', error: null };
    if (name === 'sync_recommendation_learning_dependency_v1') { if (learningHash !== args?.p_hash) { learningHash = args?.p_hash; revision++; } return { data: null, error: null }; }
    if (name !== 'get_recommendation_context_revision_v1') throw new Error(`Unsupported fixture RPC: ${name}`);
    return { data: String(revision), error: null };
  });
  return { client: { from, rpc } as unknown as SupabaseClient, reads, rpc };
}

function profile(extra: Row = {}): Row {
  return { id: learnerId, user_id: '11111111-1111-4111-8111-111111111111', name: 'Fixture Learner', country: 'India', ...extra };
}
function evidence(extra: Row): Row {
  return { id: '001', learner_id: learnerId, enabled: true, approval_status: 'approved', ...extra };
}
function build(tables: Record<string, Row[]>) {
  return buildlearnerTextFromDatabase(database(tables).client, learnerId);
}

beforeEach(() => { vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());

describe('context corrections and remaining baseline gaps', () => {
  it('uses completed assessment roles only as opt-in inferred intent', async () => {
    const db = database({ learners: [profile()], learner_career_preferences: [{ learner_id: learnerId, preferences: { useAssessmentRecommendations: true } }], personal_assessment_results: [{ id: 'final', learner_id: learnerId, status: 'completed', career_fit: { clusters: [{ examples: ['Marine technician'], skills: ['Fabricated skill'] }], personality: 'expert' } }] });
    const context = await buildLearnerRecommendationContext(db.client, learnerId);
    expect(context.readiness).toMatchObject({ state: 'limited_context', coverage: [] });
    expect(context.inferredRoles).toEqual(['Marine technician']); expect(context.skillNames).toEqual([]); expect(context.text).toBe('');
  });

  it('does not read assessments or LTE after an explicit saved opt-out', async () => {
    const db = database({ learners: [profile()] });
    await buildLearnerRecommendationContext(db.client, learnerId);
    expect(db.reads.some(read => read.table === 'personal_assessment_results')).toBe(false);
    expect(db.rpc.mock.calls.some(([name]) => name === 'job_learning_evaluation_policy')).toBe(false);
  });

  it('uses bounded evaluated LTE achievements without treating them as employment', async () => {
    const db = database({ learners: [profile()], learner_career_preferences: [{ learner_id: learnerId, preferences: { useVerifiedLearning: true } }] });
    const summary = { schemaVersion: 1, evaluationPolicy: 'human', revision: 'a'.repeat(32), truncated: false, levels: [{ levelId: '99999999-9999-4999-8999-999999999999', capabilityName: 'Ocean sensors', title: 'Calibrate instruments', levelNumber: 2, fingerprint: 'b'.repeat(32) }] };
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(summary));
    const context = await buildLearnerRecommendationContext(db.client, learnerId, undefined, { LTE_INTERNAL_SECRET: 'x'.repeat(32), LTE_APP_URL: 'https://lte.fixture.invalid' });
    expect(context.readiness.coverage).toEqual(['completed_learning']); expect(context.text).toContain('human evaluated');
    expect(context.sourceStatus.learning).toBe('available'); expect(context.text.length).toBeLessThanOrEqual(10000);
  });

  it('rejects an LTE approval revision that changes during collection', async () => {
    const db = database({ learners: [profile()], learner_career_preferences: [{ learner_id: learnerId, preferences: { useVerifiedLearning: true } }] });
    let count = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ schemaVersion: 1, evaluationPolicy: 'human', revision: (++count === 1 ? 'a' : 'b').repeat(32), truncated: false, levels: [] }));
    await expect(buildLearnerRecommendationContext(db.client, learnerId, undefined, { LTE_INTERNAL_SECRET: 'x'.repeat(32), LTE_APP_URL: 'https://lte.fixture.invalid' })).rejects.toMatchObject({ code: 'CONTEXT_CHANGED' });
  });
  it('keeps saved target roles as intent without inventing career evidence', async () => {
    const db = database({ learners: [profile()], learner_career_preferences: [{ learner_id: learnerId, preferences: { targetRoles: ['Marine technician'] } }] });
    const context = await buildLearnerRecommendationContext(db.client, learnerId);
    expect(context.readiness).toMatchObject({ state: 'limited_context', coverage: [] });
    expect(context.preferences.targetRoles).toEqual(['Marine technician']);
    expect(context.text).toBe('');
  });

  it('does not replace a preferences outage with empty choices', async () => {
    const db = database({ learners: [profile()] }, 'learner_career_preferences');
    await expect(buildLearnerRecommendationContext(db.client, learnerId)).rejects.toMatchObject({ code: 'API_ERROR' });
  });
  it.each(["I don't have any work experience", 'I have never worked before'])('rejects empty legacy and normalized experience: %s', async description => {
    await expect(build({ learners: [profile({ work_experience: description })] })).rejects.toMatchObject({ code: 'INSUFFICIENT_DATA' });
    await expect(build({ learners: [profile()], experience: [evidence({ description })] })).rejects.toMatchObject({ code: 'INSUFFICIENT_DATA' });
  });

  it.each(['branch_field', 'course_name'])('normalizes legacy %s before text budgeting', async field => {
    const signal = 'Marine Biology';
    const plain = { learners: [profile({ [field]: signal })] };
    const padded = { learners: [profile({ [field]: ' '.repeat(1800) + signal })] };
    const text = await build(padded);
    expect(text).toContain(signal);
    expect(text).toBe(await build(plain));
  });

  it('filters placeholder skills before they can crowd out the sole useful skill', async () => {
    const text = await build({ learners: [profile()], skills: [
      evidence({ id:'001', name:'unknown', level:5, description:'filler '.repeat(500) }),
      evidence({ id:'002', name:'Python', level:1 }),
    ] });
    expect(text).toContain('Python');
    expect(text).not.toContain('unknown');
    expect(text).not.toContain('filler');
  });

  it('bounds each skill so all selected names survive long earlier descriptions', async () => {
    const skills = Array.from({length:EMBEDDING_CONFIG.MAX_SKILLS}, (_,index) => evidence({
      id:String(index).padStart(3,'0'), name:`UsefulSkill${index}`, level:5,
      description:'A long skill description '.repeat(250),
    }));
    const text = await build({learners:[profile()],skills});
    for (const skill of skills) expect(text).toContain(String(skill.name));
    expect(text.length).toBeLessThanOrEqual(10000);
    expect(text).toBe(await build({learners:[profile()],skills:[...skills].reverse()}));
  });

  it.each(['No experience', '0 years', 'I am passionate and motivated.'])('does not generate context from legacy placeholder %s', work_experience => {
    return expect(build({ learners: [profile({ work_experience })] })).rejects.toMatchObject({ code: 'INSUFFICIENT_DATA' });
  });

  it('retains the sole useful legacy signal after normalizing whitespace and budgeting', async () => {
    const signal = 'Python backend developer';
    const text = await build({ learners: [profile({ work_experience: ' '.repeat(1800) + signal })] });
    expect(text).toContain(`Work Experience: ${signal}`);
    expect(text.length).toBeLessThanOrEqual(10_000);
    expect(await build({ learners: [profile({ work_experience: signal })] })).toBe(text);
  });

  it('G06: identity/country-only text cannot reach the legacy length threshold', async () => {
    await expect(build({ learners: [profile()] })).rejects.toMatchObject({ code: 'INSUFFICIENT_DATA' });
  });

  it('G01: rejects long generic filler without structured career evidence', async () => {
    const filler = 'I am passionate and motivated. '.repeat(50);
    await expect(build({ learners: [profile({ bio: filler })] })).rejects.toMatchObject({ code: 'INSUFFICIENT_DATA' });
  });

  it('G03: includes approved normalized-only education for a fresher', async () => {
    const db = database({ learners: [profile()], education: [evidence({ degree: 'BSc', department: 'Marine Biology' })] });
    expect(await buildlearnerTextFromDatabase(db.client, learnerId)).toContain('Marine Biology');
    expect(db.reads.some(read => read.table === 'education')).toBe(true);
  });

  it('G03: includes approved normalized-only experience', async () => {
    const db = database({ learners: [profile()], experience: [evidence({ role: 'Marine technician', description: 'Maintained ocean sensors' })] });
    expect(await buildlearnerTextFromDatabase(db.client, learnerId)).toContain('Maintained ocean sensors');
    expect(db.reads.some(read => read.table === 'experience')).toBe(true);
  });

  it('G04: finds completed courses after MAX_COURSES ongoing enrollments', async () => {
    const ongoing = Array.from({ length: EMBEDDING_CONFIG.MAX_COURSES }, (_, index) => evidence({ id: `00${index}`, course_title: 'Ongoing learning', status: 'in_progress' }));
    const text = await build({ learners: [profile()], course_enrollments: [...ongoing, evidence({ id: '999', course_title: 'Completed Oceanography', status: 'completed' })] });
    expect(text).toContain('Completed Oceanography');
  });

  it('G05: excludes approved but explicitly hidden training', async () => {
    const text = await build({ learners: [profile({ branch_field: 'Marine engineering' })], trainings: [evidence({ enabled: false, title: 'Hidden qualification', status: 'completed' })] });
    expect(text).not.toContain('Hidden qualification');
  });

  it('G06: identical career evidence yields identical text across identity/demographics', async () => {
    const skills = [evidence({ name: 'Python' })];
    const first = await build({ learners: [profile({ name: 'First', age: 21, gender: 'female' })], skills });
    const second = await build({ learners: [profile({ name: 'Second', age: 44, gender: 'male' })], skills });
    expect(first).toBe(second);
  });

  it('G06: excludes raw links and does not select unused identity/contact fields', async () => {
    const db = database({ learners: [profile({ branch_field: 'Marine engineering', github_link: 'https://example.invalid/private-link', email: 'private@example.invalid', age: 35, name: 'PrivateName' })] });
    const text = await buildlearnerTextFromDatabase(db.client, learnerId);
    expect(text).toContain('Marine engineering');
    for (const value of ['private-link', 'private@example.invalid', 'PrivateName', 'Age:']) expect(text).not.toContain(value);
    const columns = db.reads.filter(read => read.table === 'learners').flatMap(read => read.columns.split(',').map(column => column.trim()));
    for (const column of ['name', 'age', 'gender', 'email', 'contact_number', 'contactNumber', 'github_link', 'linkedin_link', 'portfolio_link', 'resumeUrl', 'profilePicture', 'date_of_birth', 'dateOfBirth']) expect(columns).not.toContain(column);
  });

  it.each([true, null])('G05: retains visible legacy training with enabled=%s and preserves ongoing status', async enabled => {
    const text = await build({ learners: [profile({ branch_field: 'Marine engineering' })], trainings: [evidence({ title: 'Ongoing Oceanography', enabled, status: 'ongoing' })] });
    expect(text).toContain('Ongoing Oceanography (ongoing)');
    expect(text).not.toContain('=== COMPLETED COURSES ===');
  });

  it('G05: filters hidden training before the training limit', async () => {
    const hidden = Array.from({ length: EMBEDDING_CONFIG.MAX_TRAININGS }, (_, index) => evidence({ id: `00${index}`, title: 'Hidden training', enabled: false }));
    const text = await build({ learners: [profile()], trainings: [...hidden, evidence({ id: '999', title: 'Visible Oceanography', status: 'completed' })] });
    expect(text).toContain('Visible Oceanography');
    expect(text).not.toContain('Hidden training');
  });

  it.each([
    { title: 'HiddenParent', learner_id: learnerId, enabled: false, approval_status: 'approved' },
    { title: 'PendingParent', learner_id: learnerId, enabled: true, approval_status: 'pending' },
    { title: 'ForeignParent', learner_id: 'foreign', enabled: true, approval_status: 'approved' },
  ])('G05: does not reintroduce $title through an approved certificate join', async training => {
    const text = await build({ learners: [profile()], certificates: [evidence({ title: 'Valid independent certificate', trainings: training })] });
    expect(text).toContain('Valid independent certificate');
    expect(text).not.toContain(training.title);
  });

  it.each([true, null])('retains approved related-training context with enabled=%s', async enabled => {
    const text = await build({ learners: [profile()], certificates: [evidence({ title: 'Valid certificate', trainings: [{ title: 'Visible Oceanography', learner_id: learnerId, enabled, approval_status: 'approved' }] })] });
    expect(text).toContain('Related Training: Visible Oceanography');
  });
});

describe('existing evidence controls to preserve', () => {
  it('admits a fresher with one approved skill and no employment or certificates', async () => {
    const text = await build({ learners: [profile()], skills: [evidence({ name: 'R' })] });
    expect(text).toContain('=== TECHNICAL SKILLS ===\nR');
  });

  it('admits a fresher with an approved project and no employment', async () => {
    const text = await build({ learners: [profile()], projects: [evidence({ title: 'Ocean sensor', description: 'Built a salinity measurement device' })] });
    expect(text).toContain('Built a salinity measurement device');
  });

  it('excludes foreign, hidden and unapproved skills', async () => {
    const text = await build({ learners: [profile()], skills: [
      evidence({ name: 'AllowedSkill' }),
      evidence({ name: 'ForeignSkill', learner_id: 'foreign' }),
      evidence({ name: 'HiddenSkill', enabled: false }),
      evidence({ name: 'PendingSkill', approval_status: 'pending' }),
    ] });
    expect(text).toContain('AllowedSkill');
    for (const name of ['ForeignSkill', 'HiddenSkill', 'PendingSkill']) expect(text).not.toContain(name);
  });

  it('excludes expired certificates without excluding current certificates', async () => {
    const text = await build({ learners: [profile()], certificates: [
      evidence({ title: 'ExpiredCredential', expiry_date: '2000-01-01' }),
      evidence({ title: 'CurrentCredential', expiry_date: null }),
    ] });
    expect(text).not.toContain('ExpiredCredential');
    expect(text).toContain('CurrentCredential');
  });

  it.each(['skills', 'certificates', 'projects', 'course_enrollments', 'trainings', 'education', 'experience'])('distinguishes unavailable %s from absent evidence', async table => {
    const db = database({ learners: [profile()] }, table);
    await expect(buildlearnerTextFromDatabase(db.client, learnerId)).rejects.toMatchObject({ code: 'API_ERROR' });
    expect(db.reads.some(read => read.table === table)).toBe(true);
  });

  it('rejects mixed snapshots before returning context', async () => {
    const db = database({ learners: [profile()], skills: [evidence({ name: 'Python' })] });
    db.rpc.mockResolvedValueOnce({ data: '1', error: null }).mockResolvedValueOnce({ data: '2', error: null });
    await expect(buildLearnerRecommendationContext(db.client, learnerId)).rejects.toMatchObject({ code: 'CONTEXT_CHANGED' });
  });

  it('reserves deterministic text budgets so a long biography cannot hide skills or completed learning', async () => {
    const tables = { learners: [profile({ bio: 'Long career biography. '.repeat(1000) })], skills: [evidence({ name: 'Python' })], course_enrollments: [evidence({ course_title: 'Oceanography', status: 'completed' })] };
    const first = await build(tables);
    expect(first).toContain('Python');
    expect(first).toContain('Oceanography');
    expect(first.length).toBeLessThanOrEqual(10_000);
    expect(await build(tables)).toBe(first);
  });

  it.each(['education', 'experience'])('excludes hidden, unapproved and foreign %s', async table => {
    const hidden = evidence({ department: 'HiddenField', role: 'HiddenRole', enabled: false });
    const pending = evidence({ department: 'PendingField', role: 'PendingRole', approval_status: 'pending' });
    const foreign = evidence({ department: 'ForeignField', role: 'ForeignRole', learner_id: 'foreign' });
    const context = await buildLearnerRecommendationContext(database({ learners: [profile()], [table]: [hidden, pending, foreign] }).client, learnerId);
    expect(context.readiness.state).toBe('needs_profile');
    expect(context.text).toBe('');
  });

  it('does not turn unavailable revision metadata into a profile prompt', async () => {
    const db = database({ learners: [profile()] });
    db.rpc.mockResolvedValueOnce({ data: null as unknown as string, error: null });
    await expect(buildLearnerRecommendationContext(db.client, learnerId)).rejects.toMatchObject({ code: 'API_ERROR' });
  });
});

it('passes only approved visible soft-skill names to the shared ranker', async () => {
  const db = database({ learners: [profile()], skills: [evidence({ id: '1', name: 'Python', type: 'technical' }), evidence({ id: '2', name: 'Customer empathy', type: 'soft' }), evidence({ id: '3', name: 'Hidden skill', type: 'soft', enabled: false }), evidence({ id: '4', name: 'Unapproved skill', type: 'soft', approval_status: 'pending' })] });
  const context = await buildLearnerRecommendationContext(db.client, learnerId);
  expect(context.softSkillNames).toEqual(['Customer empathy']);
  expect(context.skillNames).toEqual(['Python', 'Customer empathy']);
});

it('uses both additional context sources by default when no preferences are saved', async () => {
  const db = database({ learners: [profile()] }, undefined, false);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ schemaVersion: 1, evaluationPolicy: 'human', revision: 'a'.repeat(32), truncated: false, levels: [] }));
  const context = await buildLearnerRecommendationContext(db.client, learnerId, undefined, { LTE_INTERNAL_SECRET: 'x'.repeat(32), LTE_APP_URL: 'https://lte.fixture.invalid' });
  expect(context.preferences).toMatchObject({ useAssessmentRecommendations: true, useVerifiedLearning: true });
  expect(db.reads.some(read => read.table === 'personal_assessment_results')).toBe(true);
  expect(db.rpc.mock.calls.some(([name]) => name === 'job_learning_evaluation_policy')).toBe(true);
});
