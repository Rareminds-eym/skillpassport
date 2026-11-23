// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../curriculum-changes';
const mocks=vi.hoisted(() => ({ rpc:vi.fn(),role:'college_admin' }));
vi.mock('../../../lib/college-course-notifications',()=>({publishCollegeCourseNotifications:vi.fn()}));
vi.mock('../../../lib/auth',() => ({ withAuth:(handler:unknown) => handler,getContextUser:() => ({ id:'admin' }) }));
vi.mock('../../../lib/entitlements',() => ({ hasFeatureEntitlement:async() => true }));
vi.mock('../../../lib/supabase',() => ({ getServiceClient:() => ({ rpc:mocks.rpc,from:(table:string) => {
 const chain={ select:() => chain,eq:() => chain,maybeSingle:async() => ({ data:table==='users' ? { role:mocks.role,isActive:true } : { pending_changes:[{ id:'proposal',source:'faculty_course' }] },error:null }) };
 return chain;
} }) }));
async function send(action:string) {
 return await onRequestPost({ request:new Request('https://example.test/api/college-admin/curriculum-changes',{ method:'POST',headers:{ 'content-type':'application/json' },body:JSON.stringify({ action,curriculum_id:'curriculum',change_id:'proposal',review_notes:'Reviewed' }) }),env:{},waitUntil:vi.fn() } as never) as Response;
}
beforeEach(() => { vi.clearAllMocks();mocks.role='college_admin';mocks.rpc.mockResolvedValue({ data:{ reviewed:true },error:null }); });
describe('existing review actions with faculty pending changes',() => {
 it('does not grant an organization owner the college administrator bypass',async() => {
  mocks.role='owner';
  expect((await send('approve-change')).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it.each([['approve-change','approved'],['reject-change','rejected'],['approve-curriculum-by-hod','approved']])('routes %s through the permission checked reviewer',async(action,decision) => {
  expect((await send(action)).status).toBe(200);
  expect(mocks.rpc).toHaveBeenCalledWith('college_course_workflow',{ p_actor:'admin',p_action:'review',p_payload:{ requestId:'proposal',decision,note:'Reviewed' } });
 });
 it('preserves stale content rejection through the existing API',async() => {
  mocks.rpc.mockResolvedValue({ data:null,error:{ code:'40001',message:'Content changed' } });
  expect((await send('approve-change')).status).toBe(409);
 });
 it('does not let an educator approve through a legacy review action',async() => {
  mocks.role='college_educator';
  expect((await send('approve-change')).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
});
