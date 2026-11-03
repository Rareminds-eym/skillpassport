import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({decisions:vi.fn()}));
vi.mock('../../lib/learning-eligibility',()=>({learningDecisions:f.decisions}));
import {dispatchLearningJobNotifications} from '../../lib/learning-job-notifications';
beforeEach(()=>{vi.clearAllMocks();f.decisions.mockResolvedValue([{learning_eligibility:{state:'eligible'}}]);});
function fixture(pages:any[][],infinite=false){
 let claims=0,page=0;
 const rpc=vi.fn(async(name:string)=>{
  if(name==='claim_learning_job_notification_work')return {data:infinite||claims<pages.length?{id:'work',opportunity_id:'job',lease_token:'lease',cursor_id:claims++?'previous':null}:null,error:null};
  if(name==='has_learning_job_notification_work')return {data:infinite,error:null};
  return {data:true,error:null};
 });
 const from=(table:string)=>{const q:any={select:()=>q,eq:()=>q,gt:()=>q,order:()=>q,limit:async()=>({data:pages[Math.min(page++,pages.length-1)],error:null}),maybeSingle:async()=>({data:{id:'job',learning_requirements:[{}],learning_requirements_version:1,status:'open',is_active:true},error:null})};return q;};
 return {db:{rpc,from} as any,rpc};
}
const learners=(n:number)=>Array.from({length:n},(_,i)=>({id:'learner-'+i,user_id:'user-'+i}));
it('drains multiple pages immediately rather than waiting for the next cron tick',async()=>{
 const {db,rpc}=fixture([learners(25),learners(1)]);const result=await dispatchLearningJobNotifications(db,{});
 expect(result).toEqual({pages:2,hasMore:false});expect(rpc.mock.calls.filter(c=>c[0]==='record_learning_job_notification')).toHaveLength(26);
 expect(rpc.mock.calls.filter(c=>c[0]==='finish_learning_job_notification_work')).toHaveLength(2);
});
it('bounds each invocation and signals backlog for queue continuation',async()=>{
 const {db}=fixture([learners(25)],true);expect(await dispatchLearningJobNotifications(db,{})).toEqual({pages:20,hasMore:true});
});
it('does not advance the checkpoint when authoritative evidence is unavailable',async()=>{
 f.decisions.mockResolvedValue([{learning_eligibility:{state:'unknown'}}]);const {db,rpc}=fixture([learners(1)]);
 await expect(dispatchLearningJobNotifications(db,{})).rejects.toThrow('retry');
 expect(rpc).toHaveBeenCalledWith('finish_learning_job_notification_work',expect.objectContaining({p_cursor:null,p_done:false,p_error:expect.any(String)}));
 expect(rpc.mock.calls.some(c=>c[0]==='record_learning_job_notification')).toBe(false);
});
it('checkpoints completed recipients when the request time budget runs low',async()=>{
 let clock=0;const spy=vi.spyOn(Date,'now').mockImplementation(()=>clock);
 try{
  f.decisions.mockImplementation(async()=>{clock+=5000;return [{learning_eligibility:{state:'eligible'}}];});
  const {db,rpc}=fixture([learners(25)],true);const result=await dispatchLearningJobNotifications(db,{});
  expect(result).toEqual({pages:1,hasMore:true});
  expect(rpc).toHaveBeenCalledWith('finish_learning_job_notification_work',expect.objectContaining({p_cursor:'learner-4',p_done:false,p_error:null}));
 }finally{spy.mockRestore();}
});
