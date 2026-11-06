import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{fetch:mocks.fetch}}));
import {getOwnAssessmentLearner} from '../learnerContext';
import {fetchAssessmentRoster} from '../assessmentRoster';
const learner={id:'learner',user_id:'owner',specialization:'Data Science',program:{name:'Engineering',code:'BE',degree_level:'undergraduate'}};
beforeEach(()=>{vi.clearAllMocks();mocks.fetch.mockResolvedValue(Response.json({success:true,learner}));});
describe('authenticated assessment learner context',()=>{
 it('uses the owner API without a client-selected target or database call',async()=>{
  expect(await getOwnAssessmentLearner('owner')).toEqual({...learner,programs:learner.program});
  expect(mocks.fetch).toHaveBeenCalledWith('/api/learners/profile',undefined);
 });
 it('accepts the owner learner-record alias',async()=>{expect((await getOwnAssessmentLearner('learner'))?.id).toBe('learner');});
 it('does not substitute the current owner for a foreign reference',async()=>{expect(await getOwnAssessmentLearner('foreign')).toBeNull();});
 it('treats a missing owned profile as absent',async()=>{mocks.fetch.mockResolvedValue(Response.json({error:'missing'},{status:404}));expect(await getOwnAssessmentLearner()).toBeNull();});
 it('preserves authorization failures',async()=>{mocks.fetch.mockResolvedValue(Response.json({error:'denied'},{status:403}));await expect(getOwnAssessmentLearner()).rejects.toMatchObject({status:403});});
 it('rejects a malformed successful response',async()=>{mocks.fetch.mockResolvedValue(Response.json({success:true,learner:{id:'x'}}));await expect(getOwnAssessmentLearner()).rejects.toThrow('unavailable');});
});
describe('academic roster API pagination',()=>{
 it('collects every page with a cursor and preserves roll-number ordering',async()=>{
  mocks.fetch.mockResolvedValueOnce(Response.json({data:{learners:[{id:'1',roll_number:'2'}],nextCursor:'1'}}))
   .mockResolvedValueOnce(Response.json({data:{learners:[{id:'2',roll_number:'1'}],nextCursor:null}}));
  expect((await fetchAssessmentRoster({schoolId:'school'})).map(r=>r.id)).toEqual(['2','1']);
  expect(mocks.fetch.mock.calls[0][0]).toBe('/api/assessment-roster');
  expect(JSON.parse(mocks.fetch.mock.calls[1][1].body)).toEqual({schoolId:'school',cursor:'1'});
 });
 it('rejects repeated pagination instead of returning partial data',async()=>{
  mocks.fetch.mockImplementation(async()=>Response.json({data:{learners:[],nextCursor:'same'}}));
  await expect(fetchAssessmentRoster({})).rejects.toThrow('did not progress');
 });
 it('never falls back to anonymous data access after denial',async()=>{
  mocks.fetch.mockResolvedValue(Response.json({error:'denied'},{status:403}));
  await expect(fetchAssessmentRoster({})).rejects.toMatchObject({status:403});expect(mocks.fetch).toHaveBeenCalledTimes(1);
 });
});
