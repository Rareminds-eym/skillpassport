import { describe, expect, it, vi } from 'vitest';
import { loadCareerPolicyContext } from '../policy-context';

function store(overrides: Record<string, unknown> = {}) {
  const rows: Record<string, any> = {
    learners: { data: { id: 'owned-learner', grade: 'college' }, error: null },
    education: { data: [{ level: 'Bachelor' }], error: null },
    personal_assessment_results: { data: { id: 'assessment' }, error: null }, ...overrides,
  };
  const chains: Record<string, any> = {};
  const from = vi.fn((table: string) => {
    if (!(table in rows)) throw new Error(`Unexpected private table ${table}`);
    const chain: Record<string, any> = {};
    for (const method of ['select', 'eq', 'order', 'limit']) chain[method] = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () => rows[table]);
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(rows[table]).then(resolve);
    chains[table] = chain;
    return chain;
  });
  return { db: { from } as never, from, chains };
}

describe('minimal Career policy projection', () => {
  it('loads only policy fields and assessment existence using the resolved learner id', async () => {
    const s = store();
    expect(await loadCareerPolicyContext(s.db, 'authenticated-user')).toEqual({ gradeLevel: 'college', hasAssessment: true });
    expect(s.chains.learners.eq).toHaveBeenCalledWith('user_id', 'authenticated-user');
    expect(s.chains.education.select).toHaveBeenCalledWith('level');
    expect(s.chains.personal_assessment_results.select).toHaveBeenCalledWith('id');
    expect(s.chains.personal_assessment_results.eq).toHaveBeenCalledWith('learner_id', 'owned-learner');
    expect(s.from.mock.calls.map(call => call[0])).toEqual(['learners', 'education', 'personal_assessment_results']);
    for (const chain of Object.values(s.chains)) expect(chain.select).not.toHaveBeenCalledWith('*');
  });
  it('does not fall back from a missing user to a caller-named learner', async () => {
    const s = store({ learners: { data: null, error: null } });
    expect(await loadCareerPolicyContext(s.db, 'other-learner-id')).toBeNull();
    expect(s.from).toHaveBeenCalledTimes(1);
  });
  it('preserves education fallback and a genuinely absent assessment', async () => {
    const s = store({ learners: { data: { id: 'owned', grade: '', education: [{ level: 'Higher secondary' }] }, error: null }, education: { data: null, error: null }, personal_assessment_results: { data: null, error: null } });
    expect(await loadCareerPolicyContext(s.db, 'actor')).toEqual({ gradeLevel: 'higher_secondary', hasAssessment: false });
  });
  it.each(['learners', 'education', 'personal_assessment_results'])('does not invent metadata when %s is unavailable', async table => {
    const s = store({ [table]: { data: null, error: { code: 'unavailable' } } });
    await expect(loadCareerPolicyContext(s.db, 'actor')).rejects.toThrow(/unavailable/);
  });
});
