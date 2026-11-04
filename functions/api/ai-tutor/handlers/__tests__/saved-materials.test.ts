// @vitest-environment node
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn()}));
vi.mock('../../../../lib/auth',()=>({getContextUser:()=>({id:'user'}),getServiceClient:()=>mocks}));
vi.mock('../../utils/course-index',()=>({requireCourseAccess:async()=>true}));
import {handleSavedMaterials} from '../saved-materials';
it.each(['learner','college_educator'].flatMap(role=>['object','array','null'].flatMap(submissionShape=>['object','array','null'].map(resultShape=>({role,submissionShape,resultShape})))))(
 'returns stable lists for $role with $submissionShape submissions and $resultShape results',async({role,submissionShape,resultShape})=>{
 const evaluation={id:'result',status:'review_required',total_marks:99,feedback:'private'};
 const submission={id:'submission',results:resultShape==='null'?null:resultShape==='array'?[evaluation]:evaluation};
 const row={id:'recipient',submissions:submissionShape==='null'?null:submissionShape==='array'?[submission]:submission};
 mocks.from.mockImplementation(()=>{const q:any={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,single:async()=>({data:{role}}),then:(resolve:(v:unknown)=>void)=>resolve({data:[row],error:null})};return q;});
 const response=await handleSavedMaterials({env:{AI_ASSIGNMENTS_ENABLED:'true'},request:new Request('https://test',{method:'POST',body:JSON.stringify({action:'deliveries',courseId:'00000000-0000-4000-8000-000000000001'})})} as never);
 expect(response.status).toBe(200);
 const body=await response.json() as any;
 const submissions=body.data[0].submissions;
 expect(Array.isArray(submissions)).toBe(true);
 expect(submissions).toHaveLength(submissionShape==='null'?0:1);
 if(submissions.length){expect(submissions[0].results).toEqual(resultShape==='null'?[]:[role==='learner'?{id:'result',status:'review_required'}:evaluation]);}
});
it('rejects an already allocated learner before calling the allocation RPC',async()=>{
 mocks.from.mockImplementation((table:string)=>{const q:any={select:()=>q,eq:()=>q,in:()=>q,limit:async()=>({data:[{learner_id:'00000000-0000-4000-8000-000000000003'}]}),single:async()=>({data:table==='users'?{role:'college_educator'}:{id:'assignment'}})};return q;});
 const response=await handleSavedMaterials({env:{AI_ASSIGNMENTS_ENABLED:'true'},request:new Request('https://test',{method:'POST',body:JSON.stringify({action:'allocate',courseId:'00000000-0000-4000-8000-000000000001',assignmentId:'00000000-0000-4000-8000-000000000002',learnerIds:['00000000-0000-4000-8000-000000000003'],dueAt:'2099-01-01T12:00:00Z',reviewed:true})})} as never);
 expect(response.status).toBe(409);
 expect(await response.text()).toContain('already assigned');
});
it('advertises disabled capability and never writes library records while disabled',async()=>{
 const make=(action:string)=>({env:{},request:new Request('https://test',{method:'POST',body:JSON.stringify({action})})}) as never;
 const response=await handleSavedMaterials(make('capabilities'));expect((await response.json() as any).data.enabled).toBe(false);
 expect((await handleSavedMaterials(make('save'))).status).toBe(503);
});

it.each(['object','array','null'])('normalizes %s results and hides unreleased marks from the learner',async(shape)=>{
 const eq=vi.fn();const result={id:'result',status:'review_required',total_marks:99,feedback:'Private provisional feedback',question_results:['private']};const row={submissions:[{results:shape==='object'?result:shape==='array'?[result]:null}]};
 mocks.from.mockImplementation((table:string)=>{const q:any={select:()=>q,eq:eq.mockImplementation(()=>q),order:()=>q,limit:()=>q,single:async()=>({data:{role:'learner'}}),then:(resolve:(v:unknown)=>void)=>resolve({data:[row],error:null})};return q;});
 const response=await handleSavedMaterials({env:{AI_ASSIGNMENTS_ENABLED:'true'},request:new Request('https://test',{method:'POST',body:JSON.stringify({action:'deliveries',courseId:'00000000-0000-4000-8000-000000000001'})})} as never);
 const body=await response.text();expect(response.status).toBe(200);expect(body).not.toContain('Private provisional');expect(body).not.toContain('total_marks');expect(eq).toHaveBeenCalledWith('learner.user_id','user');
 expect(JSON.parse(body).data[0].submissions[0].results).toEqual(shape==='null'?[]:[{id:'result',status:'review_required'}]);
});
