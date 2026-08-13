import { describe, expect, it } from 'vitest';
import type { WriteDb } from '../../../api/internal/lte/v1/write-db';
import {
  upsertLteTrainings,
  type LteSyncCapability,
} from '../../../lib/lte/lte-sync-write';

interface FakeRow extends Record<string, unknown> {
  id: string;
  lte_course_id: string;
  lte_hash?: string | null;
}

function createFakeDb(initial: FakeRow[] = []): { db: WriteDb; rows: FakeRow[] } {
  const rows: FakeRow[] = [...initial];
  const db: WriteDb = {
    queryOne: async (_path) => {
      const match = /lte_course_id=eq\.([^&]+)/.exec(String(_path));
      const courseId = match ? decodeURIComponent(match[1]) : null;
      return rows.find((r) => r.lte_course_id === courseId) ?? null;
    },
    query: async () => rows,
    insert: async (_table, row) => {
      rows.push({ id: `row-${rows.length + 1}`, ...(row as FakeRow) });
      return null;
    },
    update: async (_table, id, patch) => {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows[idx] = { ...rows[idx], ...patch };
      return true;
    },
  };
  return { db, rows };
}

const cap = (overrides: Partial<LteSyncCapability> = {}): LteSyncCapability => ({
  id: 'cap-1',
  name: 'Support exchange member',
  description: 'Evidence handoffs',
  status: 'in_progress',
  currentLevel: 1,
  totalLevels: 5,
  durationHours: 35,
  totalModules: 35,
  completedModules: 7,
  levels: [],
  fingerprint: 'abc123',
  ...overrides,
});

describe('upsertLteTrainings (fingerprint delta)', () => {
  it('inserts a course that does not exist yet and counts it as synced', async () => {
    const { db, rows } = createFakeDb();
    const result = await upsertLteTrainings(db, 'learner-1', [cap()]);
    expect(result).toEqual({ synced: 1, updated: 0, skipped: 0 });
    expect(rows).toHaveLength(1);
    expect(rows[0].lte_hash).toBe('abc123');
  });

  it('skips a course whose stored fingerprint is unchanged', async () => {
    const { db, rows } = createFakeDb([
      { id: 'row-1', lte_course_id: 'cap-1', lte_hash: 'abc123' },
    ]);
    const result = await upsertLteTrainings(db, 'learner-1', [cap()]);
    expect(result).toEqual({ synced: 0, updated: 0, skipped: 1 });
    expect(rows[0].lte_hash).toBe('abc123'); // untouched
    expect(rows[0].title).toBeUndefined();    // no write happened
  });

  it('updates a course whose fingerprint changed and stores the new hash', async () => {
    const { db, rows } = createFakeDb([
      { id: 'row-1', lte_course_id: 'cap-1', lte_hash: 'old-hash' },
    ]);
    const result = await upsertLteTrainings(db, 'learner-1', [cap()]);
    expect(result).toEqual({ synced: 0, updated: 1, skipped: 0 });
    expect(rows[0].lte_hash).toBe('abc123');
    expect(rows[0].title).toBe('Support exchange member');
  });

  it('updates when LTE sends no fingerprint (cannot safely skip)', async () => {
    const { db } = createFakeDb([
      { id: 'row-1', lte_course_id: 'cap-1', lte_hash: 'abc123' },
    ]);
    const noFingerprint = cap({ fingerprint: undefined });
    const result = await upsertLteTrainings(db, 'learner-1', [noFingerprint]);
    expect(result).toEqual({ synced: 0, updated: 1, skipped: 0 });
  });

  it('sums synced/updated/skipped across a mixed batch', async () => {
    const { db } = createFakeDb([
      { id: 'row-a', lte_course_id: 'cap-a', lte_hash: 'same' },
      { id: 'row-b', lte_course_id: 'cap-b', lte_hash: 'stale-hash' },
    ]);
    const result = await upsertLteTrainings(db, 'learner-1', [
      cap({ id: 'cap-a', fingerprint: 'same' }),        // skip
      cap({ id: 'cap-b', fingerprint: 'new-hash' }),     // update
      cap({ id: 'cap-c', fingerprint: 'brand-new' }),    // insert
    ]);
    expect(result).toEqual({ synced: 1, updated: 1, skipped: 1 });
  });
});
