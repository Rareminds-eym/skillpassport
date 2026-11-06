import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), from: vi.fn(), finalize: vi.fn(), record: vi.fn(), patch: vi.fn() }));
vi.mock('@/shared/api/ssoClient', () => ({ ssoClient: { fetch: mocks.fetch } }));
vi.mock('@/shared/api/supabaseClient', () => ({ supabase: { from: mocks.from } }));
vi.mock('../assessmentApiService', () => ({ retryClusterGeneration: vi.fn(), completeAttempt: mocks.finalize }));
vi.mock('../assessmentRecords', () => ({ fetchOwnAssessmentRecord: mocks.record, patchOwnAssessment: mocks.patch,
  fetchOwnAssessmentPages: vi.fn(), saveOwnAssessmentResponse: vi.fn(), createOwnAssessmentAttempt: vi.fn() }));
import { completeAttempt, completeAttemptWithoutAI, saveAptitudeScores, saveKnowledgeScores } from '../assessmentService';
beforeEach(() => {
  vi.clearAllMocks(); mocks.from.mockImplementation(() => { throw new Error('Anonymous database access forbidden'); });
});
describe('legacy assessment finalization compatibility', () => {
  it('returns the confirmed result from authenticated owner reads', async () => {
    const report = { overallSummary: 'advisory' }; const result = { id: 'result', attempt_id: 'attempt' };
    mocks.finalize.mockResolvedValue({ success: true, data: { resultId: 'result' } });
    mocks.record.mockResolvedValue({ results: [result] });
    expect(await completeAttempt('attempt', 'learner', 'bca', 'after12', report, {})).toEqual(result);
    expect(mocks.finalize).toHaveBeenCalledWith('attempt', 'learner', 'bca', 'after12', report, {});
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('rejects missing confirmation and mismatched result identities', async () => {
    mocks.finalize.mockResolvedValueOnce({ success: true, data: {} });
    await expect(completeAttempt('a', 'l', null, 'college', {}, {})).rejects.toThrow('confirmation');
    expect(mocks.record).not.toHaveBeenCalled();
    mocks.finalize.mockResolvedValue({ success: true, data: { resultId: 'r' } });
    mocks.record.mockResolvedValue({ results: [{ id: 'r', attempt_id: 'other' }] });
    await expect(completeAttempt('a', 'l', null, 'college', {}, {})).rejects.toThrow('unavailable');
  });
  it('does not fall back to anonymous writes when authentication is rejected', async () => {
    mocks.finalize.mockRejectedValue(new Error('Authentication required'));
    await expect(completeAttempt('a', 'l', null, 'college', {}, {})).rejects.toThrow('Authentication');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('submits a report-free placeholder through the existing owner finalizer', async () => {
    const result = { id: 'r', attempt_id: 'a' };
    mocks.record.mockResolvedValueOnce({ status: 'in_progress', stream_id: 'bca', grade_level: 'after12' })
      .mockResolvedValueOnce({ results: [result] });
    mocks.fetch.mockResolvedValue(Response.json({ success: true, data: { resultId: 'r' } }));
    expect(await completeAttemptWithoutAI('a', 'l', 'bca', 'after12', { knowledge: 10 })).toEqual(result);
    expect(mocks.patch).toHaveBeenCalledWith('a', { sectionTimings: { knowledge: 10 } });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ attemptId: 'a' });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([saveAptitudeScores, saveKnowledgeScores])('rejects browser score persistence', async setter => {
    await expect(setter('a', { overall: 100 })).rejects.toThrow('server grading');
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
