import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../actions';
const mocks = vi.hoisted(() => ({ rpc:vi.fn(),from:vi.fn(),entitled:vi.fn(),publish:vi.fn() }));
vi.mock('../../../lib/auth',() => ({ withAuth:(handler:unknown) => handler,getContextUser:() => ({ id:'authenticated-user' }) }));
vi.mock('../../../lib/supabase',() => ({ getServiceClient:() => ({ rpc:mocks.rpc,from:mocks.from }) }));
vi.mock('../../../lib/entitlements',() => ({ hasFeatureEntitlement:mocks.entitled }));
vi.mock('../../../lib/college-course-notifications', () => ({ publishCollegeCourseNotifications: mocks.publish }));
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function send(body:unknown) {
 return await onRequestPost({ request:new Request('https://example.test/api/college-courses/actions',{ method:'POST',headers:{ 'content-type':'application/json' },body:JSON.stringify(body) }),env:{},waitUntil:vi.fn() } as never) as Response;
}
beforeEach(() => { vi.resetAllMocks();mocks.entitled.mockResolvedValue(true);mocks.rpc.mockResolvedValue({ data:{ courses:[] },error:null }); });
describe('college course API boundary',() => {
 it('creates an assessment type with the authenticated actor and no client organization',async() => {
  mocks.rpc.mockResolvedValue({data:{id,name:'Quiz'},error:null});
  expect((await send({action:'create-assessment-type',payload:{courseId:id,programId:id,name:' Quiz '}})).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith('create_college_assessment_type',{p_actor:'authenticated-user',p_course:id,p_program:id,p_name:'Quiz',p_description:''});
  expect((await send({action:'create-assessment-type',payload:{courseId:id,programId:id,name:'Quiz',institution_id:id}})).status).toBe(400);
 });
 it('loads program and department metadata only for authorized course assignments',async() => {
  mocks.rpc.mockResolvedValue({ data:{ courses:[{ id:'course',program_id:id }] },error:null });
  const filter=vi.fn().mockResolvedValue({ data:[{ id,name:'Computer Science',code:'CS',department:{ id:'dept',name:'Engineering',code:'ENG' } }],error:null });
  mocks.from.mockReturnValue({ select:() => ({ in:filter }) });
  const response=await send({ action:'courses',payload:{} });
  expect(response.status).toBe(200);
  expect(filter).toHaveBeenCalledWith('id',[id]);
  expect((await response.json()).data.courses[0]).toMatchObject({ program_name:'Computer Science',department_id:'dept',department_name:'Engineering' });
 });
 it('reports metadata failures instead of presenting incomplete filters',async() => {
  mocks.rpc.mockResolvedValue({ data:{ courses:[{ program_id:id }] },error:null });
  mocks.from.mockReturnValue({ select:() => ({ in:async() => ({ data:null,error:{ message:'Unavailable' } }) }) });
  expect((await send({ action:'courses',payload:{} })).status).toBe(503);
 });
 it('uses the authenticated actor instead of a supplied actor',async() => {
  const response=await send({ action:'courses',payload:{},actor:'other-user' });
  expect(response.status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith('college_course_workflow',{ p_actor:'authenticated-user',p_action:'courses',p_payload:{} });
 });
 it('rejects invalid permissions before querying the database',async() => {
  expect((await send({ action:'set-access',payload:{ mappingId:id,access:'admin' } })).status).toBe(400);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it('does not expose content for an unmapped Rareminds course',async() => {
  expect((await send({ action:'rareminds-content',payload:{ courseId:id } })).status).toBe(403);
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it('fails closed if ownership cannot be checked',async() => {
  mocks.rpc.mockResolvedValue({ data:null,error:{ code:'XX000' } });
  expect((await send({ action:'rareminds-content',payload:{ courseId:id } })).status).toBe(503);
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it('returns conflict for stale proposals',async() => {
  mocks.rpc.mockResolvedValue({ data:null,error:{ code:'40001',message:'Content changed' } });
  expect((await send({ action:'review',payload:{ requestId:id,decision:'approved' } })).status).toBe(409);
 });
 it('requires an entitlement for Excel import',async() => {
  mocks.entitled.mockResolvedValue(false);
  const payload={ departmentId:id,programId:id,semester:1,academicYear:'2026-27',courses:[{ code:'CS101',title:'Computing',credits:3,description:'',units:[{ code:'U1',name:'Algorithms',description:'',credits:1,duration:6,order:0,outcomes:[] }] }] };
  expect((await send({ action:'import',payload })).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
});

describe('curriculum notification integration', () => {
 it('broadcasts after a saved proposal', async () => {
  mocks.rpc.mockResolvedValue({data:{requestId:id},error:null});
  expect((await send({action:'propose',payload:{curriculumId:id,entityType:'unit',entityId:id,changes:{name:'Unit',description:'Updated'}}})).status).toBe(200);
  expect(mocks.publish).toHaveBeenCalledWith(expect.anything(),{},id,'curriculum_change_submitted');
 });
 it('broadcasts the educator decision after successful review', async () => {
  mocks.rpc.mockResolvedValue({data:{reviewed:true},error:null});
  expect((await send({action:'review',payload:{requestId:id,decision:'rejected',note:'Please revise'}})).status).toBe(200);
  expect(mocks.publish).toHaveBeenCalledWith(expect.anything(),{},id,'curriculum_change_rejected');
 });
 it('does not broadcast a failed proposal', async () => {
  mocks.rpc.mockResolvedValue({data:null,error:{code:'42501',message:'Forbidden'}});
  expect((await send({action:'propose',payload:{curriculumId:id,entityType:'unit',entityId:id,changes:{name:'Unit',description:'Updated'}}})).status).toBe(403);
  expect(mocks.publish).not.toHaveBeenCalled();
 });
});
