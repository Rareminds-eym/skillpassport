import { describe, it, expect } from 'vitest';
import { validateAttendanceImport } from '../api/college-admin/attendance';

/**
 * Traced-case coverage for session-first bulk attendance import validation.
 * The validator is DB-injected, so a stub supabase stands in for PostgREST.
 * Session is resolved by id (never re-matched by names).
 */

const PROGRAM = { id: 'prog-1', name: 'Master of Computer Applications', code: 'MCA' };
const ROSTER = [
  { id: 'l-1', name: 'Bhoomika D', roll_number: 'MCA001', email: 'bhoomika19503@gmail.com' },
  { id: 'l-2', name: 'Hemanth H R', roll_number: 'MCA002', email: 'hemu818hr@gmail.com' },
];
const SESSION = {
  id: 'sess-1', college_id: 'col-1', program_id: 'prog-1',
  subject_name: 'CS101 - Data Structures', subject_code: 'CS101',
  department_name: 'Department of Computer Applications',
  faculty_id: 'f-1', faculty_name: 'Prof A', room_number: '301',
  semester: 1, section: 'B', date: '2026-09-20', status: 'scheduled',
};

interface StubSession {
  id: string; college_id: string; program_id: string | null;
  subject_name: string; subject_code?: string | null;
  department_name: string; faculty_id?: string | null; faculty_name: string;
  room_number?: string | null; semester: number; section: string;
  date: string; status: string;
}

interface StubOverrides {
  session?: StubSession; sessionMissing?: boolean;
  program?: { id: string; name: string; code: string } | null;
  programsByName?: Array<{ id: string; name: string; code: string }> | null;
  settings?: { allow_retroactive_marking?: boolean; retroactive_days_limit?: number } | null;
  roster?: Array<{ id: string; name: string; roll_number: string; email: string }>;
  existingCount?: number;
}

function stubSupabase(overrides: StubOverrides = {}) {
  const {
    session = SESSION, sessionMissing = false,
    program = PROGRAM, programsByName = null,
    settings = null, roster = ROSTER, existingCount = 0,
  } = overrides;
  // eslint-disable-next-line no-unused-vars -- parameter names are type documentation only
  type ChainFilter = (...filterArgs: unknown[]) => StubChain;
  interface StubChain {
    select: ChainFilter;
    eq: ChainFilter;
    is: ChainFilter;
    order: ChainFilter;
    gte: ChainFilter;
    lte: ChainFilter;
    in: ChainFilter;
    not: ChainFilter;
    range: ChainFilter;
    limit: ChainFilter;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
    // eslint-disable-next-line no-unused-vars -- parameter names are type documentation only
    then: (onFulfilled: (v: { data: unknown; error: null; count?: number }) => unknown) => Promise<unknown>;
  }
  const makeChain = (table: string): StubChain => {
    const chain: StubChain = {
      select: () => chain, eq: () => chain, is: () => chain, order: () => chain,
      gte: () => chain, lte: () => chain, in: () => chain, not: () => chain, range: () => chain,
      limit: () => chain,
      maybeSingle: async () => {
        if (table === 'college_attendance_sessions') {
          return sessionMissing ? { data: null, error: null } : { data: session, error: null };
        }
        if (table === 'programs') return { data: program, error: null };
        if (table === 'college_attendance_settings') return { data: settings, error: null };
        return { data: null, error: null };
      },
      then: (resolve) => {
        if (table === 'programs' && programsByName !== null) {
          return Promise.resolve({ data: programsByName, error: null }).then(resolve);
        }
        if (table === 'learners') return Promise.resolve({ data: roster, error: null }).then(resolve);
        if (table === 'college_attendance_records') {
          return Promise.resolve({ data: [], error: null, count: existingCount }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return chain;
  };
  return {
    from: (table: string) => makeChain(table),
    rpc: async () => ({ data: { imported: 2 }, error: null }),
  };
}

const baseBody = () => ({
  college_id: 'col-1',
  session_id: 'sess-1',
  rows: [
    { roll_number: 'MCA001', status: 'present' },
    { roll_number: 'MCA002', status: 'absent' },
  ],
});

describe('validateAttendanceImport (session-first)', () => {
  it('accepts a clean file and builds snapshot records', async () => {
    const r = await validateAttendanceImport(stubSupabase(), baseBody());
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.summary).toMatchObject({ total: 2, present: 1, absent: 1, rosterSize: 2 });
    expect(r.recordsJson).toHaveLength(2);
    expect(r.recordsJson![0]).toMatchObject({
      learner_id: 'l-1', program_id: 'prog-1', program_name: PROGRAM.name,
      status: 'present', semester: 1, section: 'B',
    });
  });

  it('blocks when the session id does not exist in this college', async () => {
    const r = await validateAttendanceImport(stubSupabase({ sessionMissing: true }), baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.status).toBe(404);
  });

  it('blocks a completed session — re-upload is never allowed', async () => {
    const done = stubSupabase({ session: { ...SESSION, status: 'completed' } });
    const blocked = await validateAttendanceImport(done, baseBody());
    expect(blocked.ok).toBe(false);
    expect(blocked.fatal?.status).toBe(409);
    expect(blocked.fatal?.message).toMatch(/re-upload is not allowed/);
  });

  it('blocks when records already exist for the session, even if status is scheduled', async () => {
    const r = await validateAttendanceImport(
      stubSupabase({ existingCount: 79 }),
      baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.status).toBe(409);
    expect(r.fatal?.message).toMatch(/already exists/);
  });

  it('blocks a cancelled session', async () => {
    const r = await validateAttendanceImport(
      stubSupabase({ session: { ...SESSION, status: 'cancelled' } }),
      baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.message).toMatch(/cancelled/);
  });

  it('resolves legacy sessions without program_id by name, conflicts on duplicates', async () => {
    const legacy = { ...SESSION, program_id: null };
    const okStub = stubSupabase({ session: legacy, programsByName: [PROGRAM] });
    const ok = await validateAttendanceImport(okStub, baseBody());
    expect(ok.ok).toBe(true);

    const dupStub = stubSupabase({
      session: legacy, programsByName: [PROGRAM, { ...PROGRAM, id: 'prog-2' }],
    });
    const dup = await validateAttendanceImport(dupStub, baseBody());
    expect(dup.ok).toBe(false);
    expect(dup.fatal?.status).toBe(409);
  });

  it('blocks future session dates', async () => {
    const r = await validateAttendanceImport(
      stubSupabase({ session: { ...SESSION, date: '2999-01-01' } }), baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.message).toMatch(/future/);
  });

  it('enforces the retroactive window from college settings', async () => {
    const old = stubSupabase({
      session: { ...SESSION, date: '2020-01-01' },
      settings: { allow_retroactive_marking: true, retroactive_days_limit: 7 },
    });
    const r = await validateAttendanceImport(old, baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.message).toMatch(/up to 7 day/);
  });

  it('reports unknown roll numbers with file row numbers', async () => {
    const r = await validateAttendanceImport(stubSupabase(), {
      ...baseBody(),
      rows: [{ roll_number: 'NOPE', status: 'present' }, { roll_number: 'MCA001', status: 'present' }, { roll_number: 'MCA002', status: 'present' }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ row: 2 });
    expect(r.errors[0].message).toMatch(/not a student of this class/);
  });

  it('reports duplicates, bad statuses, and missing roster members', async () => {
    const r = await validateAttendanceImport(stubSupabase(), {
      ...baseBody(),
      rows: [
        { roll_number: 'MCA001', status: 'here' },
        { roll_number: 'MCA001', status: 'present' },
      ],
    });
    expect(r.ok).toBe(false);
    const msgs = r.errors.map((e) => e.message).join('\n');
    expect(msgs).toMatch(/must be present, absent, late or excused/);
    expect(msgs).toMatch(/duplicate of row 2/);
    expect(msgs).toMatch(/Missing from file: MCA002/);
  });

  it('requires time_in for late and remarks for excused', async () => {
    const r = await validateAttendanceImport(stubSupabase(), {
      ...baseBody(),
      rows: [
        { roll_number: 'MCA001', status: 'late' },
        { roll_number: 'MCA002', status: 'excused' },
      ],
    });
    expect(r.ok).toBe(false);
    const msgs = r.errors.map((e) => e.message).join('\n');
    expect(msgs).toMatch(/time_in.*required for late/);
    expect(msgs).toMatch(/remarks are required for excused/);
  });

  it('accepts late with time_in and excused with remarks, matching case-insensitively', async () => {
    const r = await validateAttendanceImport(stubSupabase(), {
      ...baseBody(),
      rows: [
        { roll_number: ' mca001 ', status: 'Late', time_in: '09:15' },
        { email: 'HEMU818HR@GMAIL.COM', status: 'EXCUSED', remarks: 'Medical' },
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.summary).toMatchObject({ late: 1, excused: 1 });
  });

  it('blocks an empty roster', async () => {
    const r = await validateAttendanceImport(stubSupabase({ roster: [] }), baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.status).toBe(404);
  });

  it('blocks when students lack roll numbers (prevents RPC 23502)', async () => {
    const r = await validateAttendanceImport(
      stubSupabase({ roster: [{ ...ROSTER[0], roll_number: '' }, ROSTER[1]] }),
      baseBody());
    expect(r.ok).toBe(false);
    expect(r.fatal?.status).toBe(400);
    expect(r.fatal?.message).toMatch(/have no roll numbers/);
  });
});
