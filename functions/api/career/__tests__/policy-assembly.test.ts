import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultAssembleContext } from '../handlers/chat';
import { loadCareerPolicyContext } from '../context/policy-context';
vi.mock('../context/policy-context', () => ({ loadCareerPolicyContext: vi.fn() }));

describe('Career app policy assembly', () => {
  beforeEach(() => {
    vi.mocked(loadCareerPolicyContext).mockReset();
  });
  it.each(['find jobs', 'help me choose a career'])('keeps private facts out of instructions for %s', async message => {
    vi.mocked(loadCareerPolicyContext).mockResolvedValue({ gradeLevel: 'college', hasAssessment: true });
    const dbAdmin = {} as never;
    const db = vi.fn(() => { throw new Error('pre-gather course/progress/opportunity read'); });
    const result = await defaultAssembleContext({ db, dbAdmin: () => dbAdmin, env: {}, learnerId: 'actor', message, chips: [], history: Array.from({ length: 14 }, (_, i) => ({ role: 'user', content: `PRIVATE_HISTORY_${i}` } as never)) });
    expect(result?.hasAssessment).toBe(true);
    expect(result?.systemPromptWithMemory).not.toMatch(/PRIVATE_/);
    expect(result?.systemPromptWithMemory).toContain('Career Readiness Coach');
    expect(result?.historyTail).toHaveLength(10);
    expect(result?.historyTail[0]?.content).toBe('PRIVATE_HISTORY_4');
    expect(db).not.toHaveBeenCalled();
    expect(loadCareerPolicyContext).toHaveBeenCalledWith(dbAdmin, 'actor');
  });
  it('retains missing-profile failure instead of inventing a policy subject', async () => {
    vi.mocked(loadCareerPolicyContext).mockResolvedValue(null);
    const result = await defaultAssembleContext({ db: vi.fn(), dbAdmin: () => ({} as never), env: {}, learnerId: 'actor', message: 'help', chips: [], history: [] });
    expect(result).toBeNull();
  });
});
