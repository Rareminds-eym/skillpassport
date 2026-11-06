import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({fetch: vi.fn()}));
vi.mock('@/shared/api/ssoClient', () => ({ssoClient: {fetch: mocks.fetch}}));
import {fetchOwnAssessmentPages, fetchOwnAssessmentRecord} from '../assessmentRecords';

beforeEach(() => vi.clearAllMocks());
describe('assessment records authenticated transport', () => {
  it('loads all history pages with the same owner reference', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: [{id: 'one'}], nextCursor: 'one'}))
      .mockResolvedValueOnce(Response.json({data: [{id: 'two'}], nextCursor: null}));
    expect(await fetchOwnAssessmentPages('history', 'owner')).toEqual([{id: 'one'}, {id: 'two'}]);
    expect(mocks.fetch.mock.calls.map(call => call[0])).toEqual([
      '/api/assessment-records?mode=history&reference=owner',
      '/api/assessment-records?mode=history&reference=owner&cursor=one',
    ]);
  });
  it('reads attempt details through authenticated transport', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: {id: 'attempt', results: []}}));
    expect(await fetchOwnAssessmentRecord('attempt', undefined, 'attempt')).toEqual({id: 'attempt', results: []});
    expect(mocks.fetch).toHaveBeenCalledWith('/api/assessment-records?mode=attempt&attemptId=attempt', undefined);
  });
  it('rejects repeated cursors without returning partial records', async () => {
    mocks.fetch.mockImplementation(async () => Response.json({data: [], nextCursor: 'same'}));
    await expect(fetchOwnAssessmentPages('responses', undefined, 'attempt')).rejects.toThrow('did not progress');
  });
  it.each([401, 403, 404, 500])('propagates HTTP %i without fallback', async status => {
    mocks.fetch.mockResolvedValueOnce(Response.json({error: 'denied'}, {status}));
    await expect(fetchOwnAssessmentRecord('latest', 'owner')).rejects.toMatchObject({status});
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects a missing result envelope', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({success: true}));
    await expect(fetchOwnAssessmentRecord('latest')).rejects.toThrow('unavailable');
  });
  it('rejects a missing page continuation', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: []}));
    await expect(fetchOwnAssessmentPages('history')).rejects.toThrow('unavailable');
  });
  it.each([null, [], 'invalid'])('rejects a malformed attempt record %j', async data => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data}));
    await expect(fetchOwnAssessmentRecord('attempt', undefined, 'attempt')).rejects.toThrow('unavailable');
  });
  it('fails visibly when its maximum page budget is exhausted', async () => {
    mocks.fetch.mockImplementation(async () => Response.json({data: [], nextCursor: String(mocks.fetch.mock.calls.length)}));
    await expect(fetchOwnAssessmentPages('history', 'owner')).rejects.toThrow('limit exceeded');
    expect(mocks.fetch).toHaveBeenCalledTimes(100);
  });
});
