// @vitest-environment node
import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),heal:vi.fn(),user:{sub:'10000000-0000-4000-8000-000000000001',id:'10000000-0000-4000-8000-000000000001',email:'owner@fixture.example',roles:['learner'] as string[],org_id:'20000000-0000-4000-8000-000000000001'}}));
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>mocks.user}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from})}));
vi.mock('../lib/heal-user',()=>({ensureAppUserAndLearner:mocks.heal}));
import {onRequestGet as profile} from '../api/learners/profile';
import {onRequest as publicLearner} from '../api/learners/index';
import {onRequestGet as byEmail} from '../api/learners/by-email';
let calls:Array<[string,unknown[]]>;
const learner='30000000-0000-4000-8000-000000000001';
function db(table:string){const q:any={};
 for(const m of ['select','eq','or','limit','ilike'])q[m]=(...args:unknown[])=>{calls.push([m,args]);return q;};
 q.maybeSingle=async()=>({data:table==='learners'?{id:learner,user_id:mocks.user.id,users:{role:'learner'}}:null,error:null});
 return q;
}
function context(path:string){return {request:new Request('https://app.fixture.example'+path),env:{},data:{user:mocks.user}};}
beforeEach(()=>{vi.clearAllMocks();calls=[];mocks.user.roles=['learner'];mocks.from.mockImplementation(db);});
describe('owner and public learner read boundaries',()=>{
 it('uses only the verified SSO owner for private assessment context',async()=>{
  const response=await profile(context('/api/learners/profile') as any);
  expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(calls).toContainEqual(['eq',['user_id',mocks.user.sub]]);
 });
 it.each(['foreign-user','','id.eq.owner,user_id.neq.null'])('rejects a foreign user override %j before queries',async id=>{
  const response=await profile(context('/api/learners/profile?user_id='+encodeURIComponent(id)) as any);
  expect(response.status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();
 });
 it('allows the legacy matching user_id parameter',async()=>{
  expect((await profile(context('/api/learners/profile?user_id='+mocks.user.id) as any)).status).toBe(200);
 });
 it('hides a private profile from the public learner ID/alias API',async()=>{
  const response=await publicLearner(context('/api/learners?id='+learner));
  expect(response.status).toBe(404);expect(mocks.from).toHaveBeenCalledWith('zoho_recruiter_learners');
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it('rejects public filter injection before a database query',async()=>{
  expect((await publicLearner(context('/api/learners?id='+encodeURIComponent('id,user_id.neq.null')))).status).toBe(400);
  expect(mocks.from).not.toHaveBeenCalled();
 });
 it('denies private by-email public-profile lookup without read repair',async()=>{
  const response=await byEmail(context('/api/learners/by-email?email=other@fixture.example&learnerId='+learner) as any);
  expect(response.status).toBe(403);expect(mocks.from).toHaveBeenCalledWith('zoho_recruiter_learners');
  expect(mocks.from).not.toHaveBeenCalledWith('learners');expect(mocks.heal).not.toHaveBeenCalled();
 });
 it('does not treat an unrelated admin role as permission to view a private import',async()=>{
  mocks.user.roles=['school_admin'];
  const response=await byEmail(context('/api/learners/by-email?email=other@fixture.example') as any);
  expect(response.status).toBe(404);expect(mocks.from).not.toHaveBeenCalledWith('learners');expect(mocks.heal).not.toHaveBeenCalled();
 });
});
