import { beforeEach, expect, it, vi } from 'vitest';
const io=vi.hoisted(()=>({access:vi.fn(),prepare:vi.fn(),database:{rpc:vi.fn()}}));
const actor='10000000-0000-4000-8000-000000000001',product='20000000-0000-4000-8000-000000000001';
const operation='30000000-0000-4000-8000-000000000001',track='40000000-0000-4000-8000-000000000001';
vi.mock('../../../lib/auth',()=>({getAuthInstance:()=>({authenticate:(handler:(request:Request,context:{user:{sub:string;is_email_verified:boolean;membership_status:string}})=>Promise<Response>)=>(request:Request)=>handler(request,
 {user:{sub:actor,is_email_verified:true,membership_status:'active'}})})}));
vi.mock('../../../shared/lib/subscription-access',()=>({requireSubscriptionAccess:io.access}));
vi.mock('../../../lib/subscriptions/catalog-inventory',()=>({catalogInventoryDatabase:()=>io.database}));
vi.mock('../../../lib/subscriptions/resource-delivery',async original=>({...await original<typeof import('../../../lib/subscriptions/resource-delivery')>(),prepareResourceDelivery:io.prepare}));
import {onRequestPost} from '../quota-reservations';
const run=(body:unknown,token=true)=>onRequestPost({request:new Request('https://fixture.invalid/api/subscriptions/quota-reservations',{
 method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer synthetic-original'}:{})},body:JSON.stringify(body)}),
 env:{SKILLPASSPORT_PRODUCT_ID:product,SSO_SERVICE:{}}} as never);
const decision=()=>({binding:{paymentRequired:false,quota:{period:'billing_period',countingEvent:'course_lte_assignment'}},grant:{type:'numeric_limit'}});
beforeEach(()=>{vi.clearAllMocks();io.access.mockResolvedValue(decision());io.prepare.mockResolvedValue({status:'pending'});});
it('forwards the original request and exact canonical action to the owner before reserving',async()=>{
 expect((await run({operationId:operation,trackId:track})).status).toBe(200);
 expect(io.access).toHaveBeenCalledWith(expect.objectContaining({actorId:actor,actionKey:'learning_path.activate',mode:'write',subject:{kind:'user',id:actor}}));
 expect(io.access.mock.calls[0][0].request.headers.get('Authorization')).toBe('Bearer synthetic-original');
 expect(io.prepare).toHaveBeenCalledExactlyOnceWith(io.database,decision(),operation,track);
});
it('denies anonymous reservation before authentication or storage',async()=>{
 expect((await run({operationId:operation,trackId:track},false)).status).toBe(401);
 expect(io.access).not.toHaveBeenCalled();expect(io.prepare).not.toHaveBeenCalled();
});
it('propagates signed owner denial without preparing capacity',async()=>{
 const denial=Response.json({error:'Denied'},{status:403});io.access.mockResolvedValue(denial);
 const response=await run({operationId:operation,trackId:track});
 expect(response.status).toBe(403);expect(await response.json()).toEqual({error:'Denied'});
 expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(io.prepare).not.toHaveBeenCalled();
});
it.each([{limit:900},{actorId:actor},{actionKey:'other'},{status:'confirmed'}])('rejects caller authority %j',async extra=>{
 expect((await run({operationId:operation,trackId:track,...extra})).status).toBe(400);expect(io.prepare).not.toHaveBeenCalled();
});
it('rejects incompatible configured counter instead of silently using separate LTE capacity',async()=>{
 const configured=decision();configured.binding.quota.countingEvent='separate_counter';io.access.mockResolvedValue(configured);
 expect((await run({operationId:operation,trackId:track})).status).toBe(503);expect(io.prepare).not.toHaveBeenCalled();
});
