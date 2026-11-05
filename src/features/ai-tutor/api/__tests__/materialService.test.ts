// @vitest-environment node
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({post:vi.fn(),fetch:vi.fn()}));
vi.mock('@/shared/api/apiClient',()=>({apiPost:mocks.post}));
vi.mock('@/shared/api/ssoClient',()=>({ssoClient:{fetch:mocks.fetch}}));
vi.mock('@/shared/api/apiUtils',()=>({getApiUrl:()=>'/api/ai-tutor'}));
import {submitLinkedMaterial,submitMaterialDocument} from '../materialService';
it('keeps non-AI uploads unchanged and uses authenticated multipart submission for linked tasks',async()=>{
 mocks.post.mockResolvedValueOnce({data:{enabled:false}});expect(await submitLinkedMaterial('legacy',[])).toBe(false);expect(mocks.fetch).not.toHaveBeenCalled();
 mocks.post.mockResolvedValueOnce({data:{enabled:true}}).mockResolvedValueOnce({data:{id:'recipient'}});mocks.fetch.mockResolvedValue(Response.json({success:true}));
 expect(await submitLinkedMaterial('linked',[new File(['Answer'],'a.txt',{type:'text/plain'})])).toBe(true);
 expect(mocks.fetch).toHaveBeenCalledWith('/api/ai-tutor/assignment-submission',expect.objectContaining({method:'POST',body:expect.any(FormData)}));
});

it('shows the server invalid-document message so the learner can choose the correct file',async()=>{
 mocks.fetch.mockResolvedValueOnce(Response.json({error:{code:'INVALID_SUBMISSION_DOCUMENT',message:'Invalid document. Please upload the completed worksheet for this assignment.'}},{status:422}));
 await expect(submitMaterialDocument('recipient',new File(['Wrong worksheet'],'wrong.txt'))).rejects.toThrow('Invalid document. Please upload the completed worksheet for this assignment.');
});
