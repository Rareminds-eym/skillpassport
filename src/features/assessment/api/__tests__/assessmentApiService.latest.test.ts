import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({fetch: vi.fn()}));
vi.mock('@/shared/api/ssoClient', () => ({ssoClient: {fetch: mocks.fetch}}));
import {getLatestResult} from '../assessmentApiService';

beforeEach(() => vi.clearAllMocks());
describe('public assessment latest-result export', () => {
  it.each(['user-reference', 'learner-reference'])('sends reference %s to the authorized resolver and requests completed results', async reference => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: [{id: 'completed'}]}));
    expect(await getLatestResult(reference)).toEqual({id: 'completed'});
    expect(mocks.fetch.mock.calls[0][0]).toBe('/api/learner-profile/actions');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({
      action: 'fetch-personal-assessment-results', learnerId: reference, completedOnly: true,
    });
  });
  it.each([401, 403, 500])('preserves HTTP %i rather than reporting an absent result', async status => {
    mocks.fetch.mockResolvedValueOnce(Response.json({error: 'denied'}, {status}));
    await expect(getLatestResult('reference')).rejects.toMatchObject({status});
  });
  it('returns null only for an empty successful result', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: []}));
    expect(await getLatestResult('reference')).toBeNull();
  });
  it('rejects a malformed successful envelope', async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({data: null}));
    await expect(getLatestResult('reference')).rejects.toThrow('unavailable');
  });
  it('does not issue an unscoped lookup when the reference is absent', async () => {
    expect(await getLatestResult('')).toBeNull(); expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
