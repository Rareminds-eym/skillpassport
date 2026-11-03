// @vitest-environment node
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'user'}),getServiceClient:()=>mocks}));
import {handleSavedMaterials} from '../saved-materials';
it('advertises disabled capability and never writes library records while disabled',async()=>{
 const make=(action:string)=>({env:{},request:new Request('https://test',{method:'POST',body:JSON.stringify({action})})}) as never;
 const response=await handleSavedMaterials(make('capabilities'));expect((await response.json() as any).data.enabled).toBe(false);
 expect((await handleSavedMaterials(make('save'))).status).toBe(503);
});

it('projects out unreleased marks and filters deliveries by the authenticated learner',async()=>{
 const eq=vi.fn();const row={submissions:[{results:[{id:'result',status:'review_required',total_marks:99,feedback:'Private provisional feedback',question_results:['private']}]}]};
 mocks.from.mockImplementation((table:string)=>{const q:any={select:()=>q,eq:eq.mockImplementation(()=>q),order:()=>q,limit:()=>q,single:async()=>({data:{role:'learner'}}),then:(resolve:(v:unknown)=>void)=>resolve({data:[row],error:null})};return q;});
 const response=await handleSavedMaterials({env:{AI_ASSIGNMENTS_ENABLED:'true'},request:new Request('https://test',{method:'POST',body:JSON.stringify({action:'deliveries',courseId:'00000000-0000-4000-8000-000000000001'})})} as never);
 const body=await response.text();expect(response.status).toBe(200);expect(body).not.toContain('Private provisional');expect(body).not.toContain('total_marks');expect(eq).toHaveBeenCalledWith('learner.user_id','user');
});
