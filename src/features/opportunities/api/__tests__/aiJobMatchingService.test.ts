import { beforeEach, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{getAccessToken:()=>null,fetch:f.fetch}}));
vi.mock('@/shared/api/apiUtils',()=>({getApiUrl:()=>'/api/career'}));
import { matchJobsWithAI } from '../aiJobMatchingService';
beforeEach(()=>vi.clearAllMocks());
const respond=(data:any,status=200)=>f.fetch.mockResolvedValue(new Response(JSON.stringify(data),{status}));
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
