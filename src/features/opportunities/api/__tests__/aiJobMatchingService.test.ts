import { beforeEach, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{getAccessToken:()=>null,fetch:f.fetch}}));
vi.mock('@/shared/api/apiUtils',()=>({getApiUrl:()=>'/api/career'}));
import { getJobRecommendations, matchJobsWithAI } from '../aiJobMatchingService';
beforeEach(()=>vi.clearAllMocks());
const respond=(data:any,status=200)=>f.fetch.mockImplementation(async()=>new Response(JSON.stringify(data),{status}));
it.each([400,403,404,409,429,500,503])('preserves structured error text, code and status %i',async status=>{
  respond({success:false,error:{code:'CONTROLLED',message:'Actionable message'}},status);
  await expect(matchJobsWithAI({id:'A'})).rejects.toMatchObject({message:'Actionable message',code:'CONTROLLED',status});
});
it('preserves a real zero and distinguishes the overall index from similarity',async()=>{
  respond({data:{provenance:'embedding',recommendations:[{id:'zero',similarity:0,match_percentage:0},{id:'ranked',similarity:0.9,match_percentage:49}]}});
  const result=await matchJobsWithAI({id:'A'});expect(result[0].match_score).toBe(0);expect(result[1]).toMatchObject({match_score:49,similarity_score:90,score_label:'Match index'});
});
it('rejects generic responses and never invents missing scores',async()=>{
  respond({data:{fallback:true,provenance:'generic',reason:'controlled',recommendations:[{id:'generic',similarity:0.9}]}});
  await expect(matchJobsWithAI({id:'A'})).rejects.toThrow('Personalized AI recommendations are unavailable');
  respond({data:{provenance:'embedding',recommendations:[{id:'unknown'}]}});
  expect((await matchJobsWithAI({id:'A'}))[0].match_score).toBeNull();
});
it('treats an old envelope with unknown provenance conservatively',async()=>{
  respond({data:{recommendations:[{id:'legacy',similarity:0.9}]}});
  await expect(matchJobsWithAI({id:'A'})).rejects.toThrow('Personalized AI recommendations are unavailable');
});

it('accepts an empty verified AI result',async()=>{respond({data:{provenance:'embedding',recommendations:[]}});expect(await matchJobsWithAI({id:'A'})).toEqual([]);});
it('preserves actionable profile-needed metadata for the compatibility hook', async () => {
  const readiness = { state: 'needs_profile', policyVersion: 'career-readiness-4', coverage: [], suggestedActions: ['add_skill'] };
  respond({ data: { schemaVersion: 2, state: 'needs_profile', readiness, recommendations: [], provenance: 'none', cached: false, input_revision: '1' } });
  await expect(matchJobsWithAI({ id: 'A' })).rejects.toMatchObject({ code: 'PROFILE_CONTEXT_REQUIRED', readiness, status: 200 });
});

const ready = (recommendations:any[] = []) => ({schemaVersion:2,state:recommendations.length ? 'ready' : 'no_matches',readiness:{state:'ready',policyVersion:'career-readiness-4',coverage:['skills'],suggestedActions:[]},recommendations,provenance:'embedding',cached:true,input_revision:'42',computed_at:'2026-10-28T10:00:00Z',catalogue_revision:'7'});
it('preserves empty-result envelope metadata without deriving it from a card', async () => {
  const envelope=ready();respond({success:true,data:envelope});
  expect(await getJobRecommendations({id:'A'})).toEqual({matches:[],envelope});
});
it.each(['needs_profile','limited_context'])('returns %s as a versioned success', async state => {
  const envelope={...ready(),state,provenance:'none',cached:false,readiness:{state,policyVersion:'career-readiness-4',coverage:[],suggestedActions:['add_skill']}};
  respond({success:true,data:envelope});
  expect(await getJobRecommendations({id:'A'})).toEqual({matches:[],envelope});
});
it('keeps ready-result mappings and metadata together', async () => {
  const envelope=ready([{id:'zero',similarity:0,match_percentage:0}]);respond({success:true,data:envelope});
  const result=await getJobRecommendations({learner_id:'A'},5,true);
  expect(result.envelope).toEqual(envelope);
  expect(result.matches[0]).toMatchObject({job_id:'zero',match_score:0});
  expect(JSON.parse(f.fetch.mock.calls[0][1].body)).toEqual({learnerId:'A',limit:5,forceRefresh:true});
});
it('requires an envelope for migrated consumers while retaining the legacy array adapter', async () => {
  respond({data:{provenance:'embedding',recommendations:[]}});
  await expect(getJobRecommendations({id:'A'})).rejects.toThrow('versioned recommendation response');
  expect(await matchJobsWithAI({id:'A'})).toEqual([]);
});
it.each([1,3])('rejects an unsupported advertised schema %i for all callers', async schemaVersion => {
  respond({success:true,data:{...ready(),schemaVersion}});
  await expect(getJobRecommendations({id:'A'})).rejects.toMatchObject({name:'ZodError'});
  await expect(matchJobsWithAI({id:'A'})).rejects.toMatchObject({name:'ZodError'});
});
it('rejects contradictory result metadata and a failed success envelope', async () => {
  respond({success:true,data:{...ready(),state:'ready'}});
  await expect(getJobRecommendations({id:'A'})).rejects.toMatchObject({name:'ZodError'});
  respond({success:false,data:ready()});
  await expect(getJobRecommendations({id:'A'})).rejects.toThrow('Invalid recommendation response');
});
it('passes the query cancellation signal to the authenticated transport', async () => {
  respond({success:true,data:ready()});const controller=new AbortController();
  await getJobRecommendations({id:'A'},3,false,controller.signal);
  expect(f.fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it('preserves Retry-After for manual regeneration cooldown',async()=>{
  f.fetch.mockImplementation(async()=>new Response(JSON.stringify({error:{code:'RATE_LIMITED',message:'wait'}}),{status:429,headers:{'Retry-After':'60'}}));
  const before=Date.now();const error=await getJobRecommendations({id:'A'}).catch(error=>error);
  expect(error).toMatchObject({status:429,code:'RATE_LIMITED'});expect(error.retryAt).toBeGreaterThanOrEqual(before+60000);
});

it.each(['processing','index_building'])('keeps HTTP 202 %s as pending data and blocks the legacy array adapter', async state=>{
  const pending={...ready(),state,provenance:'none',cached:false,retry_after_seconds:3};
  f.fetch.mockImplementation(async()=>new Response(JSON.stringify({success:true,data:pending}),{status:202,headers:{'Retry-After':'60'}}));
  const before=Date.now();const result=await getJobRecommendations({id:'A'});
  expect(result.matches).toEqual([]);expect(result.envelope.state).toBe(state);expect(result.envelope.retry_at).toBeGreaterThanOrEqual(before+60000);
  await expect(matchJobsWithAI({id:'A'})).rejects.toMatchObject({code:'MATCHING_PROCESSING',status:202});
});
it('rejects pending/terminal HTTP status mismatches',async()=>{
  respond({data:{...ready(),state:'index_building',provenance:'none',cached:false,retry_after_seconds:3}});
  await expect(getJobRecommendations({id:'A'})).rejects.toThrow('response status');
  respond({data:ready()},202);await expect(getJobRecommendations({id:'A'})).rejects.toThrow('response status');
});
