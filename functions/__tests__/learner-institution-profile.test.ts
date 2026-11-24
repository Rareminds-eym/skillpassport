// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), eq: vi.fn(), writeError: false }));
vi.mock('../lib/auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
import { onRequestPut } from '../api/learners/profile';
beforeEach(() => {
  vi.clearAllMocks(); mocks.writeError = false;
  mocks.from.mockImplementation((table: string) => {
    let writing = false;
    const chain = {
      select: () => chain,
      eq: (...args: unknown[]) => { mocks.eq(...args); return chain; },
      update: (value: unknown) => { writing = true; mocks.update(value); return chain; },
      maybeSingle: async () => ({ data: { name: 'Bachelor of Computer Applications', code: 'BCA' }, error: null }),
      single: async () => writing && mocks.writeError ? { data: null, error: { message: 'write failed' } }
        : { data: { id: table === 'learners' ? 'owned-learner' : 'program' }, error: null },
    };
    return chain;
  });
});
const put = (body: unknown) => onRequestPut({ env: {}, data: { user: { sub: 'verified-owner' } }, request: new Request('https://fixture.invalid/api/learners/profile', { method: 'PUT', body: JSON.stringify(body) }) } as never);

describe('owner institution profile endpoint', () => {
  it('persists specialization and institution changes only for the verified owner', async () => {
    const response = await put({ learnerId: 'foreign', user_id: 'foreign-owner', collegeId: null, specialization: 'AI', branch: 'Custom degree', courseName: null });
    expect(response.status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'verified-owner');
    expect(mocks.eq).toHaveBeenCalledWith('id', 'owned-learner');
    expect(mocks.update).toHaveBeenCalledWith({ college_id: null, specialization: 'AI', branch_field: 'Custom degree', course_name: 'Custom degree' });
  });
  it('uses the selected catalog program name for assessment context', async () => {
    expect((await put({ programId: 'program', branch: 'Old degree', courseName: null })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ program_id: 'program', branch_field: 'Bachelor of Computer Applications', course_name: 'Bachelor of Computer Applications' }));
  });
  it('returns failure when the database rejects the write', async () => {
    mocks.writeError = true;
    expect((await put({ specialization: 'AI' })).status).toBe(500);
  });
});
