import {execFileSync} from 'node:child_process';
import {describe,it,expect,vi} from 'vitest';
const {createDb}=vi.hoisted(()=>({createDb:vi.fn()}));
vi.mock('../lib/db',()=>({createDb}));
vi.mock('../lib/sync-shadow',()=>({syncUserShadow:vi.fn(async()=>{})}));
import {SyncService} from '../lib/sync-service';

async function genericDto(){
 let captured:Record<string,unknown>|undefined;
 createDb.mockReturnValue({from:(table:string)=>({
  select(){return this;},eq(){return this;},
  async maybeSingle(){return {data:table==='users'?{email:'concurrent-projection@fixture.example'}:null};},
  async upsert(row:Record<string,unknown>){
   if(table!=='subscription_cache')throw new Error('Unexpected write');
   captured=row;return {error:null};
  },
 })});
 const result=await new SyncService({}).syncSubscriptionCreated({
  id:'10000000-0000-4000-8000-000000000008',user_id:'10000000-0000-4000-8000-000000000006',
  plan_id:'10000000-0000-4000-8000-000000000003',plan_code:'freemium',plan_type:'Freemium',plan_amount:0,
  billing_cycle:'lifetime',status:'active',features:[],is_organization_subscription:false,
  subscription_start_date:'2026-10-30T00:00:00+00:00',subscription_end_date:null,
  product_id:'10000000-0000-4000-8000-000000000005',updated_at:'2026-10-30T00:00:00+00:00',
 });
 expect(result).toEqual({success:true});
 expect(captured).toMatchObject({plan_name:'Freemium',plan_type:'Freemium',plan_code:'freemium',status:'active',plan_amount:0});
 return captured!;
}
describe('generic sync to Zoho projection compatibility',()=>{
 it('captures the real generic subscription DTO including its legacy display label',async()=>{await genericDto();});
 it.runIf(process.env.ZOHO_LOCAL_PROJECTION_SQL_TEST==='1')('projects the real DTO through a disposable database without relaxing access guards',async()=>{
  const dto=await genericDto();
  const encoded=Buffer.from(JSON.stringify(dto)).toString('base64');
  const output=execFileSync(process.execPath,['scripts/checks/test-zoho-projection-sql.mjs','supabase_db_skillpassport',encoded],{
   cwd:process.cwd(),encoding:'utf8',timeout:120000,
  });
  expect(output).toContain('label compatibility');
 },120000);
});
