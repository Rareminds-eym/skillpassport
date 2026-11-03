// @vitest-environment node
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),evaluate:vi.fn()}));
vi.mock('../../utils/assignment-evaluation',()=>({evaluateSavedSubmission:mocks.evaluate}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'outsider'}),getServiceClient:()=>mocks}));
import {handleAssignmentSubmission} from '../assignment-submission';
it('does not read an R2 object when the requester does not own the submission',async()=>{
 const query:any={select:()=>query,eq:()=>query,single:async()=>({data:{recipient:{assigned_by:'teacher',learner:{user_id:'student'}}}})};
 mocks.from.mockReturnValue(query);const get=vi.fn();
 const response=await handleAssignmentSubmission({env:{AI_ASSIGNMENTS_ENABLED:'true',R2_BUCKET:{get}},request:new Request('https://test?submissionId=00000000-0000-4000-8000-000000000001')} as never);
 expect(response.status).toBe(403);expect(get).not.toHaveBeenCalled();
});

it('keeps a successfully submitted object when evaluation fails',async()=>{
 const id='00000000-0000-4000-8000-000000000001';
 mocks.from.mockImplementation((table:string)=>{
  const query:any={select:()=>query,eq:()=>query,single:async()=>({data:{id,assignment_id:id,due_at:'2099-01-01',assignment:{course_id:id},learner:{user_id:'outsider'}}}),maybeSingle:async()=>({data:null})};return query;
 });
 mocks.rpc.mockImplementation(async(_name:string,args:any)=>({data:args.p_id,error:null}));mocks.evaluate.mockRejectedValue(new Error('Provider unavailable'));
 const put=vi.fn(),remove=vi.fn();const form=new FormData();form.set('recipientId',id);form.set('file',new File(['1. My answer'],'answer.txt',{type:'text/plain'}));
 const response=await handleAssignmentSubmission({env:{AI_ASSIGNMENTS_ENABLED:'true',R2_BUCKET:{put,delete:remove}},request:new Request('https://test',{method:'POST',body:form})} as never);
 expect(response.status).toBe(200);expect(put).toHaveBeenCalledOnce();expect(remove).not.toHaveBeenCalled();expect(mocks.rpc).toHaveBeenCalledWith('commit_ai_submission',expect.objectContaining({p_user:'outsider',p_recipient:id}));
});
it('removes an uploaded object if database submission persistence fails',async()=>{
 const id='00000000-0000-4000-8000-000000000001';
 mocks.from.mockImplementation(()=>{const query:any={select:()=>query,eq:()=>query,single:async()=>({data:{id,assignment_id:id,due_at:'2099-01-01',assignment:{course_id:id}}}),maybeSingle:async()=>({data:null})};return query;});
 mocks.rpc.mockResolvedValue({error:{code:'23514',message:'Transaction failed'}});const put=vi.fn(),remove=vi.fn();const form=new FormData();form.set('recipientId',id);form.set('file',new File(['Answer'],'answer.txt',{type:'text/plain'}));
 const response=await handleAssignmentSubmission({env:{AI_ASSIGNMENTS_ENABLED:'true',R2_BUCKET:{put,delete:remove}},request:new Request('https://test',{method:'POST',body:form})} as never);
 expect(response.status).toBe(409);expect(remove).toHaveBeenCalledWith(put.mock.calls[0][0]);
});
