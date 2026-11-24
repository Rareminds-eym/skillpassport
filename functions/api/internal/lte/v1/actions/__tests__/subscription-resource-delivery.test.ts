import {beforeEach,expect,it,vi} from 'vitest';
const io=vi.hoisted(()=>({acknowledge:vi.fn()}));
vi.mock('../../../../../../lib/supabase',()=>({getServiceClient:()=>({})}));
vi.mock('../../../../../../lib/subscriptions/resource-delivery',async original=>({
 ...await original<typeof import('../../../../../../lib/subscriptions/resource-delivery')>(),acknowledgeResourceDelivery:io.acknowledge,
}));
import {onRequestPost} from '../../index';
import {signServiceToken,signUserClaim} from '../../auth';
const actor='10000000-0000-4000-8000-000000000001',operation='20000000-0000-4000-8000-000000000001';
const track='30000000-0000-4000-8000-000000000001',subscription='40000000-0000-4000-8000-000000000001';
const product='50000000-0000-4000-8000-000000000001',revision='60000000-0000-4000-8000-000000000001';
const secret='isolated-fixture-signing-material-with-no-runtime-account';
const outcome=()=>({schemaVersion:1,operationId:operation,reservationId:operation,actorId:actor,trackId:track,
 subscriptionId:subscription,productId:product,revisionId:revision,version:1,created:true,completedAt:1000});
async function run(options:{token?:string;actions?:string[];user?:string;payload?:unknown}={}){
 const now=Math.floor(Date.now()/1000);
 const token=options.token??await signServiceToken(secret,{app:'lte',actions:options.actions??['subscription-resource:acknowledge'],iat:now,exp:now+60});
 const claim=await signUserClaim(secret,options.user??actor);
 return onRequestPost({request:new Request('https://fixture.invalid/api/internal/lte/v1',{method:'POST',headers:{Authorization:`Bearer ${token}`,
  'X-Lte-Claim':claim.claim,'X-Lte-Sig':claim.sig,'Content-Type':'application/json'},body:JSON.stringify({action:'subscription-resource:acknowledge',
  requestId:operation,payload:options.payload??{outcome:outcome()}})}),env:{LTE_INTERNAL_SECRET:secret,SUPABASE_URL:'https://database.fixture.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'isolated-unusable-fixture'}} as never);
}
beforeEach(()=>{vi.clearAllMocks();io.acknowledge.mockResolvedValue({status:'confirmed'});});
it('requires the existing service signature and exact action scope before acknowledging',async()=>{
 expect((await run({token:'invalid'})).status).toBe(401);expect(io.acknowledge).not.toHaveBeenCalled();
 expect((await run({actions:['learning-track:get']})).status).toBe(403);expect(io.acknowledge).not.toHaveBeenCalled();
});
it('passes the verified per-user claim and exact durable receipt through the registered gateway action',async()=>{
 expect((await run()).status).toBe(200);expect(io.acknowledge).toHaveBeenCalledExactlyOnceWith({},actor,outcome());
});
it('rejects browser-style success acknowledgement without durable scope and operation identity',async()=>{
 expect((await run({payload:{success:true}})).status).toBe(400);expect(io.acknowledge).not.toHaveBeenCalled();
});
