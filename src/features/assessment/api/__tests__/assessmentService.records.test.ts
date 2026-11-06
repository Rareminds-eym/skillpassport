import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({fetch: vi.fn(), from: vi.fn()}));
vi.mock('@/shared/api/ssoClient', () => ({ssoClient: {fetch: mocks.fetch}}));
vi.mock('@/shared/api/supabaseClient', () => ({supabase: {from: mocks.from}}));
vi.mock('../assessmentApiService', () => ({retryClusterGeneration: vi.fn()}));
import {getlearnerAttempts, getAttemptWithResults, getAttemptResponses,
  getLatestResult, canTakeAssessment, updateAttemptProgress, saveAllResponses,
  getInProgressAttempt, abandonAttempt} from '../assessmentService';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation(() => {throw new Error('Anonymous database access forbidden');});
});
afterEach(() => vi.unstubAllEnvs());
describe('legacy assessment exports use authenticated records', () => {
  it('preserves newest-first history ordering after keyset pagination', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: [
      {id: 'older', created_at: '2026-09-01'}, {id: 'newer', created_at: '2026-10-01'},
    ], nextCursor: null}));
    expect((await getlearnerAttempts('owner')).map(row => row.id)).toEqual(['newer', 'older']);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('preserves the attempt results array contract', async () => {
    const attempt = {id: 'attempt', results: [{id: 'result'}]};
    mocks.fetch.mockResolvedValueOnce(Response.json({data: attempt}));
    expect(await getAttemptWithResults('attempt')).toEqual(attempt); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('loads answers through the owned parent endpoint', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: [{id: 'answer'}], nextCursor: null}));
    expect(await getAttemptResponses('attempt')).toEqual([{id: 'answer'}]); expect(mocks.from).not.toHaveBeenCalled();
  });
  it('loads the latest result without a direct-ID-first fallback', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: {id: 'result'}}));
    expect(await getLatestResult('owner')).toEqual({id: 'result'});
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/assessment-records?mode=latest&reference=owner');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not swallow owner denial on latest results', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({error: 'denied'}, {status: 403}));
    await expect(getLatestResult('foreign')).rejects.toMatchObject({status: 403});
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('uses only the date endpoint for the production eligibility hint', async () => {
    vi.stubEnv('DEV', false); vi.stubEnv('MODE', 'production');
    mocks.fetch.mockResolvedValueOnce(Response.json({data: {created_at: '2020-01-01'}}));
    expect(await canTakeAssessment('owner')).toMatchObject({canTake: true});
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/assessment-records?mode=latest-date&reference=owner');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('preserves the no-ID latest-result contract without issuing an unscoped request', async () => {
    expect(await getLatestResult('')).toBeNull(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each([getAttemptResponses, getAttemptWithResults, getlearnerAttempts])('rejects missing required IDs', async operation => {
    await expect(operation('')).rejects.toThrow('required'); expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('sends progress to the authenticated atomic writer without fetching an anonymous snapshot', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({success: true, attempt: {id: 'attempt'}}));
    expect(await updateAttemptProgress('attempt', {allResponses: {q: 3}, sectionIndex: 0})).toEqual({id: 'attempt'});
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/assessment-progress');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({attemptId: 'attempt', action: 'progress', allResponses: {q: 3}, sectionIndex: 0});
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('saves responses without resetting position and timings', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({success: true, attempt: {id: 'attempt'}}));
    await saveAllResponses('attempt', {q: 3});
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({attemptId: 'attempt', action: 'progress', allResponses: {q: 3}});
  });
  it('abandons through the same authorized transaction', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({success: true, attempt: {id: 'attempt', status: 'abandoned'}}));
    await abandonAttempt('attempt');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({attemptId: 'attempt', action: 'abandon'});
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('reads a nullable-stream in-progress attempt without mutating or abandoning it', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: {id: 'attempt', stream_id: null}}));
    expect(await getInProgressAttempt('owner')).toEqual({id: 'attempt', stream_id: null});
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/assessment-records?mode=in-progress&reference=owner');
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not acknowledge another attempt returned by a broken writer', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({success: true, attempt: {id: 'foreign'}}));
    await expect(updateAttemptProgress('attempt', {})).rejects.toThrow('confirmation unavailable');
  });
  it.each([403, 409, 503])('preserves a failed progress save with HTTP %i', async status => {
    mocks.fetch.mockResolvedValueOnce(Response.json({error: 'blocked'}, {status}));
    await expect(updateAttemptProgress('attempt', {})).rejects.toMatchObject({status});
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
