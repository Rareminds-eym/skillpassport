import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../curriculum';
const m=vi.hoisted(()=>({from:vi.fn(),entitled:vi.fn(),units:[{id:'u'}] as any[],outcomes:[{id:'o'}] as any[],select:vi.fn(),update:vi.fn()}));
vi.mock('../../../lib/auth',()=>({withAuth:(h:unknown)=>h,getContextUser:()=>({id:'admin'})}));
vi.mock('../../../lib/supabase',()=>({getServiceClient:()=>({from:m.from})}));
vi.mock('../../../lib/entitlements',()=>({hasFeatureEntitlement:m.entitled}));
beforeEach(()=>{vi.clearAllMocks();m.units=[{id:'u'}];m.outcomes=[{id:'o'}];m.entitled.mockResolvedValue(true);m.from.mockImplementation((table:string)=>{const value=table==='users'?{role:'college_admin',isActive:true}:{status:'draft',college_id:'college',university_id:null};const data=table==='college_curriculum_units'?m.units:table==='college_curriculum_outcomes'?m.outcomes:value;const chain:any={then:(resolve:any)=>Promise.resolve({data,error:null}).then(resolve),eq:()=>chain,single:async()=>({data:value,error:null}),maybeSingle:async()=>({data:value,error:null}),select:(...args:any[])=>{m.select(table,...args);return chain;},update:(value:any)=>{m.update(value);return chain;}};return chain;});});
async function approve(){return await onRequestPost({request:new Request('https://test/api/college-admin/curriculum',{method:'POST',body:JSON.stringify({action:'approve-curriculum',id:'curriculum'})}),env:{}} as never) as Response;}
describe('curriculum approval content validation',()=>{
it('approves when saved units and outcomes exist without requesting head-only rows',async()=>{expect((await approve()).status).toBe(200);expect(m.select).toHaveBeenCalledWith('college_curriculum_units','id');expect(m.select).toHaveBeenCalledWith('college_curriculum_outcomes','id');expect(m.update).toHaveBeenCalledWith(expect.objectContaining({status:'approved'}));});
it('rejects approval without units',async()=>{m.units=[];expect((await approve()).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
it('rejects approval without learning outcomes',async()=>{m.outcomes=[];expect((await approve()).status).toBe(400);expect(m.update).not.toHaveBeenCalled();});
});
