import { beforeEach, expect, it, vi } from 'vitest';
import { acknowledgeResourceDelivery, prepareResourceDelivery, validateResourceReservation } from '../resource-delivery';
import { authorizeSubscriptionAction } from '../action';

const id = (n: number) => `${n}0000000-0000-4000-8000-000000000001`;
const actor=id(1), subscription=id(2), product=id(3), revision=id(4), plan=id(5), operation=id(6), track=id(7);
const auth = () => ({ schemaVersion:1,actorId:actor,subject:{kind:'user',id:actor},subscriptionId:subscription,productId:product,
  revisionId:revision,version:1,actionKey:'learning_path.activate',featureKey:'course_lte_assignments',mode:'write',validUntil:2000,
  quota:{period:'billing_period',countingEvent:'course_lte_assignment',periodStartsAt:100,periodEndsAt:2000,limit:3} });
const outcome = (created=true) => ({schemaVersion:1,operationId:operation,reservationId:operation,actorId:actor,trackId:track,
  subscriptionId:subscription,productId:product,revisionId:revision,version:1,created,completedAt:1500});
const receipt = () => ({schemaVersion:1,operationId:operation,actorId:actor,trackId:track,authorization:auth(),status:'pending',outcome:null,
  quotaReceipt:{used:1,command:{operationId:operation,actorId:actor,subject:{kind:'user',id:actor},subscriptionId:subscription,productId:product,
    revisionId:revision,version:1,actionKey:'learning_path.activate',countingEvent:'course_lte_assignment',resourceId:operation,
    periodStartsAt:100,periodEndsAt:2000,limit:3}}});
const decision = () => authorizeSubscriptionAction({schemaVersion:1,actorId:actor,access:'full',audience:'synthetic',activatedAt:100,subscriptionEndsAt:3000,
 state:{id:subscription,planId:plan,revisionId:revision,productId:product,version:1,subject:{kind:'user',id:actor},status:'active',
  periodStartsAt:100,periodEndsAt:2000,trialEndsAt:null,renewalEnabled:true,cancelledAt:null,paymentFailedAt:null,scheduledChange:null},
 actions:{schemaVersion:1,bindings:[{actionKey:'learning_path.activate',featureKey:'course_lte_assignments',mode:'write',
  quota:{period:'billing_period',countingEvent:'course_lte_assignment'}}]}},
 {schemaVersion:1,entitlements:[],bundle:{schemaVersion:1,draft:{schemaVersion:2,id:revision,plan:{id:plan,code:'pln_'+'a'.repeat(32),productId:product},
  revisionNumber:1,name:'Synthetic',audiences:['synthetic'],purchaseMode:'self_service',prices:[],
  features:[{key:'course_lte_assignments',type:'numeric_limit',enabled:true,limit:{kind:'finite',value:3}}]},
  includedCredits:{schemaVersion:1,id:id(8),revisionId:revision,funding:'included',rules:[]}}},
 {actorId:actor,productId:product,subject:{kind:'user',id:actor},actionKey:'learning_path.activate',mode:'write'});
const rpc=vi.fn();
beforeEach(()=>{vi.resetAllMocks();rpc.mockResolvedValue({data:receipt(),error:null});});
it('reserves exactly the immutable shared counter with one application transaction',async()=>{
 expect(await prepareResourceDelivery({rpc},decision(),operation,track)).toEqual(receipt());
 expect(rpc).toHaveBeenCalledExactlyOnceWith('reserve_subscription_resource_delivery',{p_operation:operation,p_target:track,p_authorization:auth()});
});
it.each(['actor','resource','window','quantity','pending_outcome'])('rejects conflicting central %s evidence', defect=>{
 const value=receipt();
 if(defect==='actor')value.actorId=plan;
 if(defect==='resource')value.quotaReceipt.command.resourceId=track;
 if(defect==='window')value.quotaReceipt.command.periodEndsAt++;
 if(defect==='quantity')value.quotaReceipt.used=4;
 if(defect==='pending_outcome')Object.assign(value,{outcome:outcome()});
 expect(()=>validateResourceReservation(value)).toThrow();
});
it('denies a service user claim differing from the durable outcome before database IO',async()=>{
 await expect(acknowledgeResourceDelivery({rpc},plan,outcome())).rejects.toMatchObject({status:403});expect(rpc).not.toHaveBeenCalled();
});
it.each([true,false])('accepts delayed trusted created=%s outcome using commit time, not acknowledgement time',async created=>{
 vi.spyOn(Date,'now').mockReturnValue(9000);
 const committed=outcome(created);rpc.mockResolvedValue({data:{...receipt(),status:'confirmed',outcome:committed},error:null});
 expect((await acknowledgeResourceDelivery({rpc},actor,committed)).outcome).toEqual(committed);
 expect(rpc).toHaveBeenCalledExactlyOnceWith('acknowledge_subscription_resource_delivery',{p_actor:actor,p_outcome:committed});
 vi.restoreAllMocks();
});
it('rejects a conflicting replay outcome rather than interpreting it as a released reservation',async()=>{
 rpc.mockResolvedValue({data:{...receipt(),status:'confirmed',outcome:outcome(true)},error:null});
 await expect(acknowledgeResourceDelivery({rpc},actor,outcome(false))).rejects.toMatchObject({status:503});
});
it('propagates uncertain owner failure with no release, alternate call or retry',async()=>{
 rpc.mockResolvedValue({data:null,error:{code:'XX000'}});
 await expect(prepareResourceDelivery({rpc},decision(),operation,track)).rejects.toMatchObject({status:503});
 expect(rpc).toHaveBeenCalledTimes(1);
});
it.each(['revision','version','limit','period','feature','deadline'])('rejects a self-consistent returned %s that differs from requested signed authority',async defect=>{
 const value=receipt();
 if(defect==='revision'){value.authorization.revisionId=id(8);value.quotaReceipt.command.revisionId=id(8);}
 if(defect==='version'){value.authorization.version=2;value.quotaReceipt.command.version=2;}
 if(defect==='limit'){value.authorization.quota.limit=4;value.quotaReceipt.command.limit=4;}
 if(defect==='period'){value.authorization.quota.periodStartsAt=99;value.quotaReceipt.command.periodStartsAt=99;}
 if(defect==='feature')value.authorization.featureKey='other_feature';
 if(defect==='deadline')value.authorization.validUntil=2001;
 rpc.mockResolvedValue({data:value,error:null});
 await expect(prepareResourceDelivery({rpc},decision(),operation,track)).rejects.toMatchObject({status:503});
 expect(rpc).toHaveBeenCalledTimes(1);
});

it('retains an earlier deadline on exact commercial operation replay',async()=>{
 const value=receipt();value.authorization.validUntil=1900;rpc.mockResolvedValue({data:value,error:null});
 expect((await prepareResourceDelivery({rpc},decision(),operation,track)).authorization.validUntil).toBe(1900);
});
