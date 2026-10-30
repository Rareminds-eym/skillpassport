// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deferWorksheet } from '../worksheet-deferral';

function fixture(conversations: unknown[], saves: unknown[]) {
  const eq = vi.fn(); const update = vi.fn();
  const db = { from: vi.fn(() => {
    let writing = false;
    const query = { select: vi.fn(), eq: vi.fn(), update: vi.fn(), maybeSingle: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockImplementation((...args) => { eq(...args); return query; });
    query.update.mockImplementation(data => { writing = true; update(data); return query; });
    query.maybeSingle.mockImplementation(async () => ({ data: writing ? saves.shift() : conversations.shift(), error: null }));
    return query;
  }) };
  return { db: db as unknown as SupabaseClient, eq, update };
}
const source = { id: 'message', role: 'assistant', content: 'Keep questions', worksheetVariants: [{}] };
describe('saved worksheet deferral', () => {
  it('stores the choice on the owned source without changing the questions', async () => {
    const mock = fixture([{ messages: [source], updated_at: '2026-10-30T00:00:00Z' }], [{ id: 'conversation' }]);
    expect(await deferWorksheet(mock.db, 'owner', 'conversation', 'message')).toBe(true);
    expect(mock.eq).toHaveBeenCalledWith('learner_id', 'owner');
    expect(mock.update.mock.calls[0][0].messages[0]).toMatchObject({ ...source, assignmentDeferred: true });
  });
  it('retries a concurrent append instead of overwriting new messages', async () => {
    const newer = { id: 'new-message', role: 'user', content: 'A new question' };
    const mock = fixture([
      { messages: [source], updated_at: '2026-10-30T00:00:00Z' },
      { messages: [source, newer], updated_at: '2026-10-30T00:00:01Z' },
    ], [null, { id: 'conversation' }]);
    expect(await deferWorksheet(mock.db, 'owner', 'conversation', 'message')).toBe(true);
    expect(mock.update.mock.calls[1][0].messages[1]).toEqual(newer);
  });
  it('does not save for missing or foreign conversations', async () => {
    const mock = fixture([null], []);
    expect(await deferWorksheet(mock.db, 'owner', 'foreign', 'message')).toBe(false);
    expect(mock.update).not.toHaveBeenCalled();
  });
});
