import { beforeEach, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({user:{id:'11111111-1111-4111-8111-111111111111',roles:['learner']},tables:{} as Record<string,any[]>,writes:[] as any[],skillError:false}));
vi.mock('../../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>f.user}));
vi.mock('../../lib/supabase',()=>({getServiceClient:()=>({from:query})}));
vi.mock('../../lib/logger',()=>({createLogger:()=>({info:vi.fn(),warn:vi.fn(),error:vi.fn()})}));
vi.mock('../../lib/heal-user',()=>({}));
vi.mock('../../lib/newOpportunityNotifications',()=>({notifyLearnersOfNewOpportunity:vi.fn()}));
vi.mock('../../lib/permissions',()=>({verifyOrgAccess:async()=>({allowed:true})}));
import { onRequestGet as dashboard } from '../../api/learners/ai-recommendations';
import { onRequest as opportunities } from '../../api/opportunities/index';
import { onRequestPost as legacy } from '../../api/ai-tutor/handlers/actions';
const learner='33333333-3333-4333-8333-333333333333';
const job='99999999-9999-4999-8999-999999999999';
function query(table:string){
  let rows=f.tables[table]||[];let write:any;
  const result=()=>{
    if(write){f.writes.push({table,value:write});return {data:[{id:'fixture',...write}],error:null};}
    if(table==='skills'&&f.skillError)return {data:null,error:{code:'outage'}};
    return {data:rows,error:null,count:rows.length};
  };
  const q:any={select:()=>q,eq:(k:string,v:any)=>{rows=rows.filter(r=>r[k]===v);return q;},is:(k:string,v:any)=>{rows=rows.filter(r=>r[k]===v);return q;},
    neq:(k:string,v:any)=>{rows=rows.filter(r=>r[k]!==v);return q;},
    or:(filter:string)=>{if(filter.startsWith('deadline.'))rows=rows.filter(r=>r.deadline==null||Date.parse(r.deadline)>Date.now());return q;},
    order:()=>q,limit:(n:number)=>{rows=rows.slice(0,n);return q;},range:(a:number,b:number)=>{rows=rows.slice(a,b+1);return q;},
    upsert:(v:any)=>{write=v;return q;},insert:(v:any)=>{write=Array.isArray(v)?v[0]:v;return q;},
    maybeSingle:async()=>{const r=result();return {...r,data:r.data?.[0]||null};},single:async()=>{const r=result();return {...r,data:r.data?.[0]||null};},
    then:(resolve:any,reject:any)=>Promise.resolve(result()).then(resolve,reject)};return q;
}
function context(path:string,body?:any){return {request:new Request('https://fixture.invalid'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})}),env:{},data:{}} as any;}
beforeEach(()=>{f.user.roles=['learner'];f.writes=[];f.skillError=false;f.tables={learners:[{id:learner,user_id:f.user.id,name:'Own fixture'}],skills:[{learner_id:learner,name:'Python',type:'technical',training_id:null}],opportunities:[{id:job,title:'Open job',company_name:'Fixture',status:'open',is_active:true,deadline:null,skills_required:['Python']}],applied_jobs:[],pipeline_candidates:[]};});
it('dashboard includes open jobs and excludes expired/inactive jobs',async()=>{
  f.tables.opportunities.push({...f.tables.opportunities[0],id:'closed',status:'closed'},{...f.tables.opportunities[0],id:'expired',deadline:'2000-01-01'},{...f.tables.opportunities[0],id:'inactive',is_active:false});
  const response=await dashboard(context('/api/learners/ai-recommendations'));
  expect(response.status).toBe(200);expect((await response.json() as any).data.recommendations.map((r:any)=>r.id)).toEqual([job]);expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('dashboard survives null/non-string required-skill entries',async()=>{
  f.tables.opportunities[0].skills_required=[null,{},'Python'];expect((await dashboard(context('/api/learners/ai-recommendations'))).status).toBe(200);
});
it('dashboard distinguishes unavailable skills from an empty profile',async()=>{
  f.skillError=true;expect((await dashboard(context('/api/learners/ai-recommendations'))).status).toBe(503);
});
it('learner details exclude closed jobs but recruiter details retain them',async()=>{
  f.tables.opportunities[0].status='closed';expect((await opportunities(context('/api/opportunities?id='+job))).status).toBe(404);
  f.user.roles=['recruiter'];expect((await opportunities(context('/api/opportunities?id='+job))).status).toBe(200);
});
it('does not create an application for another learner',async()=>{
  const response=await opportunities(context('/api/opportunities',{action:'apply-to-job',learner_id:'22222222-2222-4222-8222-222222222222',opportunity_id:job}));expect(response.status).toBe(403);expect(f.writes).toEqual([]);
});
it('revalidates job eligibility before application creation',async()=>{
  f.tables.opportunities[0].status='closed';expect((await opportunities(context('/api/opportunities',{action:'apply-to-job',learner_id:learner,opportunity_id:job}))).status).toBe(409);expect(f.writes).toEqual([]);
});
it('preserves a legitimate own application',async()=>{
  expect((await opportunities(context('/api/opportunities',{action:'apply-to-job',learner_id:learner,opportunity_id:job}))).status).toBe(200);expect(f.writes.some(w=>w.table==='applied_jobs')).toBe(true);
});
it.each([learner,'11111111-1111-4111-8111-111111111111'])('records own legacy feedback under the user foreign key for %s',async id=>{
  const r=await legacy(context('/api/ai-tutor/actions',{action:'track-interaction',learner_id:id,opportunity_id:job,interaction_type:'dismiss'}));expect(r.status).toBe(200);expect(f.writes[0]).toMatchObject({table:'opportunity_interactions',value:{learner_id:f.user.id,action:'dismiss'}});
});
it('rejects foreign legacy feedback before persistence',async()=>{
  const r=await legacy(context('/api/ai-tutor/actions',{action:'track-interaction',learner_id:'22222222-2222-4222-8222-222222222222',opportunity_id:job,interaction_type:'dismiss'}));expect(r.status).toBe(403);expect(f.writes).toEqual([]);
});
it('validates required-skill arrays on writes',async()=>{
  expect((await opportunities(context('/api/opportunities',{action:'create-opportunity',opportunity:{skills_required:[null]}}))).status).toBe(400);expect(f.writes).toEqual([]);
});
it('normalizes the existing comma-separated skill write contract',async()=>{
  f.user.roles=['recruiter'];
  expect((await opportunities(context('/api/opportunities',{action:'create-opportunity',opportunity:{skills_required:'Python, SQL'}}))).status).toBe(200);
  expect(f.writes[0].value.skills_required).toEqual(['Python','SQL']);
});
