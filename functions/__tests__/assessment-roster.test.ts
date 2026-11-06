// @vitest-environment node
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),user:{id:'10000000-0000-4000-8000-000000000001',sub:'10000000-0000-4000-8000-000000000001',org_id:'20000000-0000-4000-8000-000000000001',roles:['school_admin'] as string[]}}));
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>mocks.user}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from})}));
import {onRequestPost} from '../api/assessment-roster';
const classId='30000000-0000-4000-8000-000000000001';
let calls:Array<{table:string;method:string;args:unknown[]}>;
let records:Record<string,any>;
let failure:string|undefined;
function db(table:string){const q:any={};
 for(const method of ['select','eq','in','or','gt','limit','order'])q[method]=(...args:unknown[])=>{calls.push({table,method,args});return q;};
 const result=()=>({data:failure===table?null:records[table]??null,error:failure===table?{code:'XX000',message:'unavailable'}:null});
 q.maybeSingle=async()=>result();q.then=(resolve:any,reject:any)=>Promise.resolve(result()).then(resolve,reject);return q;
}
async function request(input:unknown={}){return onRequestPost({request:new Request('https://app.fixture.example/api/assessment-roster',{method:'POST',body:JSON.stringify(input)}),env:{}});}
beforeEach(()=>{vi.clearAllMocks();calls=[];failure=undefined;mocks.user.roles=['school_admin'];
 records={organization_members:{id:'member',role:'admin'},organizations:{organization_type:'school'},school_classes:[{id:classId,academic_year:'2026-2027'}],college_classes:[{id:classId,academic_year:'2026-2027'}],
  school_educators:{id:'teacher'},college_lecturers:{id:'teacher'},school_educator_class_assignments:[{class_id:classId,academic_year:'2026-2027'}],college_faculty_class_assignments:[{class_id:classId,academic_year:'2026-2027'}],
  zoho_recruiter_learners:[{id:'40000000-0000-4000-8000-000000000001',name:'Public Learner'}]};mocks.from.mockImplementation(db);
});
describe('academic roster scope',()=>{
 it('uses live membership, academic scope and the private-profile filtered source',async()=>{
  const response=await request({schoolId:mocks.user.org_id,classIds:[classId]});expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect(calls).toContainEqual({table:'organization_members',method:'eq',args:['user_id',mocks.user.id]});
  expect(calls).toContainEqual({table:'organization_members',method:'eq',args:['status','active']});
  expect(calls).toContainEqual({table:'zoho_recruiter_learners',method:'eq',args:['school_id',mocks.user.org_id]});
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it('denies a learner role before any database read',async()=>{mocks.user.roles=['learner'];expect((await request()).status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();});
 it('does not trust client organization selection',async()=>{expect((await request({schoolId:'90000000-0000-4000-8000-000000000001'})).status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();});
 it.each([{classIds:['invalid']},{section:'A,school_id.neq.null'},{actorId:'foreign'},{classIds:[]},{schoolId:mocks.user.org_id,collegeId:mocks.user.org_id}])('rejects invalid or unsafe filter %j',async input=>{expect((await request(input)).status).toBe(400);expect(mocks.from).not.toHaveBeenCalled();});
 it('requires active membership even with an administrator JWT role',async()=>{records.organization_members=null;expect((await request()).status).toBe(403);expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');});
 it('does not elevate an ordinary membership from a stale admin role',async()=>{records.organization_members.role='member';expect((await request()).status).toBe(403);});
 it('rejects non-academic organizations',async()=>{records.organizations.organization_type='company';expect((await request()).status).toBe(403);});
 it('requires every requested class to belong to the active organization',async()=>{records.school_classes=[];expect((await request({classIds:[classId]})).status).toBe(403);expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');});
 it('uses college scope and the college class column',async()=>{
  mocks.user.roles=['college_admin'];records.organizations.organization_type='college';
  expect((await request({collegeId:mocks.user.org_id,classIds:[classId]})).status).toBe(200);
  expect(calls).toContainEqual({table:'zoho_recruiter_learners',method:'in',args:['college_class_id',[classId]]});
 });
 it('constrains an educator to live assigned classes',async()=>{
  mocks.user.roles=['school_educator'];records.organization_members.role='member';
  expect((await request()).status).toBe(200);
  expect(calls).toContainEqual({table:'school_educators',method:'eq',args:['user_id',mocks.user.id]});
  expect(calls).toContainEqual({table:'school_educators',method:'eq',args:['account_status','active']});
  expect(calls).toContainEqual({table:'zoho_recruiter_learners',method:'in',args:['school_class_id',[classId]]});
 });
 it('rejects an unassigned class even in the same organization',async()=>{
  mocks.user.roles=['school_educator'];records.organization_members.role='member';records.school_educator_class_assignments=[];
  expect((await request({classIds:[classId]})).status).toBe(403);
 });
 it('rejects a stale academic-year teaching assignment',async()=>{
  mocks.user.roles=['school_educator'];records.organization_members.role='member';
  records.school_educator_class_assignments=[{class_id:classId,academic_year:'2025-2026'}];
  expect((await request({classIds:[classId]})).status).toBe(403);
  expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');
 });
 it('returns no roster for an educator with no assignments',async()=>{
  mocks.user.roles=['school_educator'];records.organization_members.role='member';records.school_educator_class_assignments=[];
  const response=await request();expect(((await response.json()) as any).data).toEqual({learners:[],nextCursor:null});
  expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');
 });
 it('does not fall back after a storage or authorization query failure',async()=>{failure='organization_members';expect((await request()).status).toBe(500);expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');});
 it('bounds pages and returns a continuation rather than truncating silently',async()=>{
  records.zoho_recruiter_learners=Array.from({length:201},(_,i)=>({id:String(i)}));
  const response=await request({cursor:classId});const data=((await response.json()) as any).data;
  expect(data.learners).toHaveLength(200);expect(data.nextCursor).toBe('199');
  expect(calls).toContainEqual({table:'zoho_recruiter_learners',method:'gt',args:['id',classId]});
 });
});
