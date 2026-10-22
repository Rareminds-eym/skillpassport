import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSmartOpportunities } from '../smart-opportunities';

describe('opportunity lookup without inference', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('keeps database filters, parsing and ranking without provider calls', async () => {
    const fetch = vi.fn(() => { throw new Error('provider bypass'); });
    vi.stubGlobal('fetch', fetch);
    const query: Record<string, any> = {};
    for (const method of ['select', 'eq', 'ilike', 'or', 'order']) query[method] = vi.fn(() => query);
    query.limit = vi.fn(async () => ({ data: [
      { id: 'match', title: 'Python developer', skills_required: '["Python"]' },
      { id: 'other', title: 'Sales', skills_required: [] },
    ], error: null }));
    const db = { from: vi.fn(() => query) };
    const context = { userMessage: 'Python jobs in Chennai', conversationHistory: [],
      learnerProfile: { technicalSkills: [{ name: 'Python' }], experience: [], department: 'Engineering' }, intent: 'find-jobs', env: {} };
    const result = await fetchSmartOpportunities(db as never, context as never);
    expect(db.from).toHaveBeenCalledWith('opportunities');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.eq).toHaveBeenCalledWith('status', 'open');
    expect(query.ilike).toHaveBeenCalledWith('location', '%Chennai%');
    expect(result[0]).toMatchObject({ id: 'match', skills_required: ['Python'] });
    expect(fetch).not.toHaveBeenCalled();
  });
});
