// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),convert:vi.fn(),insert:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'teacher'}),getServiceClient:()=>mocks}));
vi.mock('../../utils/course-index',()=>({requireCourseAccess:async()=>true}));
vi.mock('../../utils/saved-assessment',async original=>({...await original<typeof import('../../utils/saved-assessment')>(),structureSavedWorksheet:mocks.convert}));
import { AssessmentModelError } from '../../utils/saved-assessment';
import { handleSavedMaterials } from '../saved-materials';
const id='00000000-0000-4000-8000-000000000001';
beforeEach(()=>{
 vi.clearAllMocks();vi.spyOn(console,'warn').mockImplementation(()=>{});
 mocks.rpc.mockResolvedValue({data:true,error:null});
 mocks.convert.mockResolvedValue({questions:[],rules:[]});
 mocks.from.mockImplementation((table:string)=>{
  const row=table==='users'?{role:'college_educator'}:table==='tutor_conversations'?{messages:[{id,role:'assistant',content:'Worksheet',worksheetConfig:{questionCount:1},materialRequestFingerprint:'request',materialContextFingerprint:'context',worksheetVariants:[{difficulty:'intermediate',content:'<!-- STUDENT_WORKSHEET -->\n1. Q\n<!-- PRIVATE_SOLUTIONS -->\n1. A\n<!-- END_WORKSHEET -->'}]}]}:null;
  const query={select:()=>query,eq:()=>query,single:async()=>({data:row,error:null}),maybeSingle:async()=>({data:null,error:null}),insert:mocks.insert.mockImplementation(()=>({select:()=>({single:async()=>({data:{id:'saved'},error:null})})}))};
  return query;
 });
});
afterEach(()=>vi.restoreAllMocks());
const save=()=>handleSavedMaterials({env:{OPENROUTER_API_KEY:'test'},request:new Request('https://test/api/ai-tutor/materials',{method:'POST',body:JSON.stringify({action:'save',courseId:id,conversationId:id,messageId:id})})} as never);
it.each([401,402,403,429])('reports provider failure %s safely without inserting an assignment',async status=>{
 mocks.convert.mockRejectedValueOnce(new AssessmentModelError('provider',status));
 const response=await save();const body=await response.text();
 expect(response.status).toBe(status===429?429:503);expect(body).toContain(status===429?'service is busy':'provider access and credits');
 expect(body).not.toContain('storage configuration');expect(mocks.insert).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
 expect(console.warn).toHaveBeenCalledWith('Saved material operation failed',expect.objectContaining({stage:'worksheet_conversion',providerStatus:status}));
});
it('reports validated conversion failure without creating a partial assignment',async()=>{
 mocks.convert.mockRejectedValueOnce(new Error('Worksheet conversion failed validation'));
 const response=await save();expect(response.status).toBe(503);expect(await response.text()).toContain('no assignment was created');expect(mocks.insert).not.toHaveBeenCalled();
});
it('distinguishes an already saved material from a failed conversation link',async()=>{
 mocks.rpc.mockResolvedValue({error:{code:'DB_FAILURE'},data:null});
 const response=await save();expect(response.status).toBe(503);expect(await response.text()).toContain('material was saved');expect(mocks.insert).toHaveBeenCalledTimes(1);
});
