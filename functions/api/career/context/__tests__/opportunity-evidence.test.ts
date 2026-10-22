import { describe, expect, it, vi } from 'vitest';
import { buildCareerEvidence } from '../evidence';

describe('authorized query-aware opportunity evidence', () => {
  it('filters and ranks using the signed relevance query before applying the evidence cap', async () => {
    const chains: Record<string, any> = {};
    const rows: Record<string, unknown> = {
      learners: { id: 'owned', name: 'Learner', branch_field: 'Engineering' },
      skills: [{ id: 'python', name: 'Python', type: 'technical', verified: true }],
      opportunities: [
        { id: 'sales', title: 'Sales', skills_required: [] },
        ...Array.from({ length: 5 }, (_, i) => ({ id: `python-${i}`, title: 'Python developer', skills_required: i === 4 ? '["Python"]' : ['Other'] })),
      ],
    };
    const from = vi.fn((table: string) => {
      if (!(table in rows)) throw new Error('scope widened');
      const chain: Record<string, any> = {};
      for (const method of ['select', 'eq', 'order', 'limit', 'ilike', 'or']) chain[method] = vi.fn(() => chain);
      chain.maybeSingle = async () => ({ data: rows[table], error: null });
      chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: rows[table], error: null }).then(resolve);
      chains[table] = chain;
      return chain;
    });
    const result = await buildCareerEvidence({ from } as never, { actorId: 'authenticated-user', query: 'Python jobs in Chennai', kinds: ['learner.skills', 'opportunities.recommended'], resources: [] });
    expect(chains.learners.eq).toHaveBeenCalledWith('user_id', 'authenticated-user');
    expect(chains.skills.eq).toHaveBeenCalledWith('learner_id', 'owned');
    expect(chains.opportunities.ilike).toHaveBeenCalledWith('location', '%Chennai%');
    expect(chains.opportunities.limit).toHaveBeenCalledWith(100);
    const jobs = result.bundle.evidence.filter(item => item.kind === 'opportunities.recommended');
    expect(jobs).toHaveLength(3);
    expect(jobs[0]?.reference).toBe('opportunity:python-4');
    expect(jobs.every(job => !job.text.includes('Sales'))).toBe(true);
    expect(jobs.every(job => job.source === 'skillpassport:opportunities')).toBe(true);
  });
});
