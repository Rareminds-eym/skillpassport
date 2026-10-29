import { beforeEach, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{fetch:f.fetch}}));
vi.mock('@/shared/config/logging',()=>({getLogger:()=>({error:vi.fn()})}));
import { getLearnerRecommendationEnvelope } from '../learnerAIRecommendationsService';
const envelope={schemaVersion:2,state:'no_matches',readiness:{state:'ready',policyVersion:'career-readiness-4',coverage:['skills'],suggestedActions:[]},recommendations:[],provenance:'rules',cached:false,input_revision:'42'};
beforeEach(()=>vi.resetAllMocks());
it('passes cancellation to SSO and preserves no-match revisions',async()=>{
  f.fetch.mockImplementation(async()=>new Response(JSON.stringify({success:true,data:envelope})));
  const controller=new AbortController();expect(await getLearnerRecommendationEnvelope(controller.signal)).toEqual(envelope);
  expect(f.fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it.each(['needs_profile','limited_context'])('retains %s as successful query data',async state=>{
  const data={...envelope,state,provenance:'none',readiness:{...envelope.readiness,state,coverage:[],suggestedActions:['add_skill']}};
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({success:true,data})));
  expect(await getLearnerRecommendationEnvelope()).toEqual(data);
});
it.each([undefined,1,3])('rejects absent or unsupported schema %s',async schemaVersion=>{
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({success:true,data:{...envelope,schemaVersion}})));
  await expect(getLearnerRecommendationEnvelope()).rejects.toMatchObject({name:'ZodError'});
});
it('preserves structured status, code and Retry-After',async()=>{
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({success:false,error:{code:'RATE_LIMITED',message:'Wait before retrying'}}),{status:429,headers:{'Retry-After':'60'}}));
  const before=Date.now();await expect(getLearnerRecommendationEnvelope()).rejects.toMatchObject({status:429,code:'RATE_LIMITED',message:'Wait before retrying',retryAt:expect.any(Number)});
  // Check the actual delay, not just the presence of a timestamp.
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({error:'wait'}),{status:429,headers:{'Retry-After':'60'}}));
  const error=await getLearnerRecommendationEnvelope().catch(error=>error);
  expect(error.retryAt).toBeGreaterThanOrEqual(before+60000);
});
it('rejects failed success payloads and contradictory profile cards',async()=>{
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({success:false,error:{message:'failed'},data:envelope})));
  await expect(getLearnerRecommendationEnvelope()).rejects.toThrow('failed');
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({data:{...envelope,state:'needs_profile',recommendations:[{id:'unsafe'}]}})));
  await expect(getLearnerRecommendationEnvelope()).rejects.toMatchObject({name:'ZodError'});
});
it('propagates cancellation without converting it to successful empty data',async()=>{
  const aborted=new DOMException('Aborted','AbortError');f.fetch.mockRejectedValueOnce(aborted);
  await expect(getLearnerRecommendationEnvelope()).rejects.toBe(aborted);
});

it('preserves HTTP 202 processing metadata and its Retry-After deadline',async()=>{
  const data={...envelope,state:'processing',provenance:'none',retry_after_seconds:3};
  f.fetch.mockResolvedValueOnce(new Response(JSON.stringify({success:true,data}),{status:202,headers:{'Retry-After':'60'}}));
  const before=Date.now();const result=await getLearnerRecommendationEnvelope();expect(result.state).toBe('processing');expect(result.retry_at).toBeGreaterThanOrEqual(before+60000);
});
