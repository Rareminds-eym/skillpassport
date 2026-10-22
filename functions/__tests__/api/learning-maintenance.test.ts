import {webcrypto} from 'node:crypto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({dispatch:vi.fn(),evaluate:vi.fn()}));
vi.mock('../../lib/supabase',()=>({getServiceClient:()=>({rpc:async()=>({data:0,error:null})})}));
vi.mock('../../lib/learning-ai-equivalency',()=>({dispatchIndependentEvaluations:f.evaluate}));
vi.mock('../../lib/learning-job-notifications',()=>({dispatchLearningJobNotifications:f.dispatch}));
import {onRequestPost} from '../../api/internal/learning/maintenance';
const secret='x'.repeat(32),path='/api/internal/learning/maintenance';
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);f.dispatch.mockResolvedValue({hasMore:false});f.evaluate.mockResolvedValue(undefined);});
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
async function signed(body='{}'){
 const timestamp=String(Date.now()),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`POST\n${path}\n${timestamp}\n${body}`));
 return new Request('https://fixture.invalid'+path,{method:'POST',body,headers:{'x-lte-timestamp':timestamp,'x-lte-signature':[...new Uint8Array(signature)].map(b=>b.toString(16).padStart(2,'0')).join('')}});
}
it('requires a valid body-bound service signature before maintenance',async()=>{
 const request=await signed();
 const response=await onRequestPost({env:{LTE_CATALOG_SYNC_SECRET:secret},request});
 expect(response.status).toBe(200);expect(f.dispatch).toHaveBeenCalledOnce();
 expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('rejects forged or altered requests before reading private work',async()=>{
 const signedRequest=await signed();
 const altered=new Request(signedRequest.url,{method:'POST',headers:signedRequest.headers,body:'{"altered":true}'});
 expect((await onRequestPost({env:{LTE_CATALOG_SYNC_SECRET:secret},request:altered})).status).toBe(401);
 expect((await onRequestPost({env:{LTE_CATALOG_SYNC_SECRET:secret},request:new Request(signedRequest.url,{method:'POST',body:'{}'})})).status).toBe(401);
 expect(f.dispatch).not.toHaveBeenCalled();
});

it('notification continuations do not duplicate AI work',async()=>{
 const response=await onRequestPost({env:{LTE_CATALOG_SYNC_SECRET:secret},request:await signed(JSON.stringify({task:'notifications'}))});
 expect(response.status).toBe(200);expect(f.dispatch).toHaveBeenCalledOnce();expect(f.evaluate).not.toHaveBeenCalled();
});
it('lets notification maintenance finish even if AI maintenance fails',async()=>{
 let finish!:()=>void,finished=false;
 const gate=new Promise<void>(resolve=>{finish=resolve;});
 f.dispatch.mockReturnValueOnce(gate.then(()=>({hasMore:false})));
 f.evaluate.mockRejectedValueOnce(new Error('AI queue unavailable'));
 const pending=onRequestPost({env:{LTE_CATALOG_SYNC_SECRET:secret},request:await signed()}).then(response=>{finished=true;return response;});
 await vi.waitFor(()=>expect(f.dispatch).toHaveBeenCalledOnce());
 expect(finished).toBe(false);finish();expect((await pending).status).toBe(503);
});
