// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const io=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),access:vi.fn(),privacy:vi.fn(),jobs:vi.fn()}));
const actor='a0000000-0000-4000-8000-000000000001',org='b0000000-0000-4000-8000-000000000001';
const learner='c0000000-0000-4000-8000-000000000001',learnerUser='d0000000-0000-4000-8000-000000000001';
const project='e0000000-0000-4000-8000-000000000001';
vi.mock('../../../lib/auth',()=>({withAuth:(handler:unknown)=>handler,getContextUser:()=>({id:actor,sub:actor,roles:['recruiter']})}));
vi.mock('../../../lib/supabase',()=>({getServiceClient:()=>({from:io.from,rpc:io.rpc})}));
vi.mock('../../../lib/org-ownership',()=>({getActiveOrgId:async()=>org,getOrgMemberUserIds:async()=>[actor],getOrgOwnedOpportunityIds:io.jobs}));
vi.mock('../../../lib/recruitment-scope',()=>({recruitmentScope:async()=>({orgId:org,opportunityIds:['synthetic-job'],shortlistIds:['synthetic-list']}),
  RecruitmentAccessError:class extends Error{},EMPTY_UUID:'00000000-0000-0000-0000-000000000000'}));
vi.mock('../../../lib/permissions',()=>({verifyOrgAccess:async()=>({allowed:true}),getUserRecruitmentRoles:async()=>[],
  PERMISSIONS:{MANAGE_CANDIDATES:'manage_candidates',VIEW_CANDIDATES:'view_candidates',CREATE_JOBS:'create_jobs',EDIT_JOBS:'edit_jobs',DELETE_JOBS:'delete_jobs'}}));
vi.mock('../../../shared/lib/subscription-access',()=>({requireSubscriptionAccess:io.access,readRecruiterContactPermissions:io.privacy}));
import {onRequest as offers} from '../offers';
import {onRequest as shortlists} from '../shortlists-actions';
import {onRequest as projects} from '../projects';
import {onRequest as work} from '../work-reviews';
import {onRequest as sharing} from '../shortlist-sharing';
import {startHandler} from '../../assessment/handlers/start';
type Handler=(context:any)=>any;
let tables:Record<string,unknown>,privacySettings:Record<string,unknown>|null;
function context(method:string,body?:unknown){return {env:{},data:{user:{id:actor,sub:actor}},request:new Request('https://synthetic.invalid/api/recruiter/test?id=synthetic-offer',
  {method,...(body===undefined?{}:{body:JSON.stringify(body)})})};}
beforeEach(()=>{
  vi.resetAllMocks();io.access.mockResolvedValue({current:{access:'full'}});io.jobs.mockResolvedValue(['synthetic-job']);
  io.privacy.mockResolvedValue(new Map([[learner,{visible:true,email:false,phone:false}]]));
  privacySettings={profileVisibility:'public'};
  tables={recruitment_projects:{id:project,organization_id:org,status:'draft'},recruitment_project_proposals:[{id:'synthetic-proposal',learner_id:learner}],
    recruitment_project_milestones:[],zoho_recruiter_learners:[{id:learner,user_id:learnerUser,name:'Synthetic candidate'}],
    applied_jobs:[{learner_id:learner}],pipeline_candidates:[],projects:[{id:project,learner_id:learner,title:'Synthetic work'}],recruitment_work_reviews:[]};
  io.from.mockImplementation((table:string)=>{
    const q:Record<string,unknown>={};for(const name of ['select','eq','in','gt','order','range','insert','update','delete'])q[name]=vi.fn(()=>q);
    let learnerReferences:unknown[]|null=null;
    q.in=vi.fn((column:string,values:unknown[])=>{if(column==='learner_id')learnerReferences=values;return q;});
    const result=()=>({data:table==='user_settings'?privacySettings===null?[]:[{user_id:learnerUser,privacy_settings:privacySettings}]
      :table==='projects'&&Array.isArray(tables.projects)&&learnerReferences!==null?tables.projects.filter(row=>learnerReferences?.includes(row.learner_id)):tables[table]??[],error:null,count:0});
    q.then=(resolve:(value:unknown)=>unknown,reject:(reason:unknown)=>unknown)=>Promise.resolve(result()).then(resolve,reject);
    q.maybeSingle=q.single=async()=>result();return q;
  });
});
describe('standalone recruiter lifecycle boundaries',()=>{
  it.each([
    ['offer read',offers,'GET',undefined,'read'],['offer write',offers,'POST',{},'write'],['offer delete',offers,'DELETE',undefined,'write'],
    ['shortlist read',shortlists,'POST',{action:'list'},'read'],['project read',projects,'POST',{action:'list'},'read'],
    ['project detail',projects,'POST',{action:'detail',projectId:project},'read'],['project write',projects,'POST',{action:'save'},'write'],
    ['work read',work,'POST',{action:'list'},'read'],['work write',work,'POST',{action:'review'},'write'],
    ['share create',sharing,'POST',{action:'generate'},'write'],['share revoke',sharing,'POST',{action:'revoke'},'write'],
  ] as const)('denies %s before resource IO when canonical access is denied',async(_label,handler,method,body,mode)=>{
    io.access.mockResolvedValue(Response.json({error:'Denied'},{status:403}));
    expect((await (handler as Handler)(context(method,body))).status).toBe(403);
    expect(io.access).toHaveBeenCalledWith(expect.objectContaining({actorId:actor,subject:{kind:'organization',id:org},mode}));
    expect(io.from).not.toHaveBeenCalled();expect(io.rpc).not.toHaveBeenCalled();expect(io.jobs).not.toHaveBeenCalled();
  });
  it('blocks specialization writes in a direct modern start caller before profile access',async()=>{
    io.access.mockResolvedValue(Response.json({error:'Read only'},{status:403}));
    expect((await startHandler(context('POST',{gradeLevel:'college',streamId:null,specialization:'Synthetic subject'}))).status).toBe(403);
    expect(io.from).not.toHaveBeenCalled();expect(io.rpc).not.toHaveBeenCalled();
  });
  it('keeps visible project proposal identity explicit and never returns embedded profile blobs',async()=>{
    const response=await projects(context('POST',{action:'detail',projectId:project}));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{proposals:[{learner:{id:learner,name:'Synthetic candidate'}}]}});
    expect(io.privacy).toHaveBeenCalled();
  });
  it('retains project commercial history while withholding a private candidate profile',async()=>{
    io.privacy.mockResolvedValue(new Map([[learner,{visible:false,email:false,phone:false}]]));
    const response=await projects(context('POST',{action:'detail',projectId:project}));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{proposals:[{id:'synthetic-proposal',learner:null}]}});
  });
  it('surfaces unavailable project profile authority before disclosure',async()=>{
    io.privacy.mockResolvedValue(Response.json({error:'Unavailable'},{status:503}));
    expect((await projects(context('POST',{action:'detail',projectId:project}))).status).toBe(503);
  });
  it('withholds private work and its learner name before returning review records',async()=>{
    io.privacy.mockResolvedValue(new Map([[learner,{visible:false}]]));
    const response=await work(context('POST',{action:'list'}));
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{work:[]}});
    expect(io.from).toHaveBeenCalledWith('zoho_recruiter_learners');
  });
  it('retains explicitly visible work with the canonical learner name',async()=>{
    const response=await work(context('POST',{action:'list'}));expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({data:{work:[{id:project,learnerName:'Synthetic candidate'}]}});
  });
});
describe('public shortlist disclosure',()=>{
  const read=()=>sharing(context('POST',{action:'read',token:'a'.repeat(64)}));
  beforeEach(()=>{
    tables.shortlists={id:'synthetic-list',name:'Synthetic shortlist',description:'Synthetic description',share_expiry:'2099-01-01'};
    tables.shortlist_candidates=[{learner_id:learner}];
    tables.zoho_recruiter_learners=[{id:learner,user_id:learnerUser,name:'Synthetic candidate',university:'Synthetic institution',branch_field:'Synthetic branch'}];
  });
  it('discloses only explicit public profile fields without requiring or exposing paid contacts',async()=>{
    const response=await read();expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({data:{candidates:[{name:'Synthetic candidate',university:'Synthetic institution',branch_field:'Synthetic branch'}]}});
    expect(io.access).not.toHaveBeenCalled();expect(io.privacy).not.toHaveBeenCalled();
  });
  it.each(['private','recruiters','missing'])('withholds %s profiles from unauthenticated link readers',async visibility=>{
    privacySettings=visibility==='missing'?null:{profileVisibility:visibility};
    const response=await read();expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{candidates:[]}});
  });
});
