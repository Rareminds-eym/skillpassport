// @vitest-environment node
import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'teacher'}),getServiceClient:()=>mocks}));
import {handleWorksheets} from '../worksheets';
const request=(action:string)=>({request:new Request('https://test/worksheets',{method:'POST',body:JSON.stringify({action})}),env:{}} as never);
beforeEach(()=>{
 vi.resetAllMocks();
 const q:any={select:()=>q,eq:()=>q,single:async()=>({data:{role:'college_educator'}})};
 mocks.from.mockReturnValue(q);
 mocks.rpc.mockResolvedValue({data:{organization:{id:'college',name:'College'},gradeLevel:'College/University',learnerCount:8}});
});
it('preserves teaching context without using legacy tables',async()=>{
 const response=await handleWorksheets(request('context'));
 expect(response.status).toBe(200);
 expect(await response.json()).toMatchObject({data:{learnerCount:8}});
 expect(mocks.from).toHaveBeenCalledWith('users');
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('ai_worksheet_context',{p_user_id:'teacher'});
});
it.each(['list','open','status','publish','publish-all','source','defer','learners'])('retires legacy action %s without database access',async(action)=>{
 expect((await handleWorksheets(request(action))).status).toBe(410);
 expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('denies learner access to teaching context',async()=>{
 const q:any={select:()=>q,eq:()=>q,single:async()=>({data:{role:'learner'}})};mocks.from.mockReturnValue(q);
 expect((await handleWorksheets(request('context'))).status).toBe(403);expect(mocks.rpc).not.toHaveBeenCalled();
});
