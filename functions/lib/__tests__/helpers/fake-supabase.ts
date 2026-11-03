/**
 * Minimal in-memory, chainable Supabase client for SyncService tests.
 * Records every read and write (with call order) and can inject errors or throws per table/op.
 */
type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete';
type Row = Record<string, any>;

export interface Injected {
  table: string;
  op: Op;
  /** Returned as `{ error }` from the query. */
  error?: { code?: string; message: string };
  /** Thrown from the query instead (simulates a driver exception). */
  throws?: Error;
  /** Returned as `{ data }` without applying the write (simulates another writer winning a race). */
  data?: unknown;
}

export interface Access { table: string; op: Op; values?: unknown; filters: Array<[string, unknown]> }

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  accesses: Access[] = [];
  injected: Injected[] = [];
  private seq = 0;

  seed(table: string, rows: Row[]): this {
    this.tables[table] = [...(this.tables[table] ?? []), ...rows.map((row) => ({ ...row }))];
    return this;
  }

  rows(table: string): Row[] { return this.tables[table] ?? []; }

  writes(): Access[] { return this.accesses.filter((a) => a.op !== 'select'); }
  writesTo(...tables: string[]): Access[] { return this.writes().filter((a) => tables.includes(a.table)); }
  accessesTo(...tables: string[]): Access[] { return this.accesses.filter((a) => tables.includes(a.table)); }

  from(table: string) {
    const self = this;
    let op: Op = 'select';
    let values: any;
    let conflict: string | undefined;
    const filters: Array<[string, unknown]> = [];
    let returnRows = false;

    const run = (single: boolean) => {
      self.accesses.push({ table, op, values, filters: [...filters] });
      const hit = self.injected.find((i) => i.table === table && i.op === op);
      if (hit?.throws) throw hit.throws;
      if (hit?.error) return { data: null, error: hit.error };
      if (hit && 'data' in hit) return { data: hit.data, error: null };
      const rows = self.tables[table] ?? (self.tables[table] = []);
      const matches = rows.filter((row) => filters.every(([col, val]) => row[col] === val));
      if (op === 'select') {
        return { data: single ? (matches[0] ?? null) : matches, error: null };
      }
      if (op === 'insert') {
        const list = Array.isArray(values) ? values : [values];
        const inserted = list.map((item: Row) => ({ id: `${table}-${++self.seq}`, ...item }));
        rows.push(...inserted);
        if (returnRows) return { data: single ? (inserted[0] ?? null) : inserted, error: null };
      } else if (op === 'update') {
        for (const row of matches) Object.assign(row, values);
        if (returnRows) return { data: single ? (matches[0] ?? null) : matches, error: null };
      } else if (op === 'upsert') {
        const keys = (conflict ?? 'id').split(',');
        const list = Array.isArray(values) ? values : [values];
        for (const item of list) {
          const existing = rows.find((row) => keys.every((k) => row[k] === item[k]));
          if (existing) Object.assign(existing, item); else rows.push({ ...item });
        }
      } else if (op === 'delete') {
        self.tables[table] = rows.filter((row) => !matches.includes(row));
      }
      return { data: null, error: null };
    };

    const builder: any = {
      select() { if (op !== 'select') returnRows = true; return builder; },
      insert(v: unknown) { op = 'insert'; values = v; return builder; },
      update(v: unknown) { op = 'update'; values = v; return builder; },
      upsert(v: unknown, options?: { onConflict?: string }) { op = 'upsert'; values = v; conflict = options?.onConflict; return builder; },
      delete() { op = 'delete'; return builder; },
      eq(col: string, val: unknown) { filters.push([col, val]); return builder; },
      maybeSingle() { return Promise.resolve().then(() => run(true)); },
      single() { return Promise.resolve().then(() => run(true)); },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve().then(() => run(false)).then(resolve, reject);
      },
    };
    return builder;
  }
}
