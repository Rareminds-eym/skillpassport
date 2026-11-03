// @vitest-environment node
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'outsider'}),getServiceClient:()=>mocks}));
import {handleAssignmentSubmission} from '../assignment-submission';
it('does not read an R2 object when the requester does not own the submission',async()=>{
 const query:any={select:()=>query,eq:()=>query,single:async()=>({data:{recipient:{assigned_by:'teacher',learner:{user_id:'student'}}}})};
 mocks.from.mockReturnValue(query);const get=vi.fn();
 const response=await handleAssignmentSubmission({env:{AI_ASSIGNMENTS_ENABLED:'true',AI_ASSIGNMENT_FILES:{get}},request:new Request('https://test?submissionId=00000000-0000-4000-8000-000000000001')} as never);
 expect(response.status).toBe(403);expect(get).not.toHaveBeenCalled();
});
