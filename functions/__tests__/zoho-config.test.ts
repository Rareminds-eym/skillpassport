import {it,expect,vi} from 'vitest';
import {readZohoProjectionConfig,ZOHO_PROFILES} from '../lib/zoho-config';
import {createSupabaseAdminClient} from '../lib/supabase';
import type {PagesEnv} from '../lib/types';
import {readFileSync} from 'node:fs';
it('normal Pages development commands select the local profile without changing deployment policy',()=>{
 const scripts=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8')).scripts;
 for(const command of ['pages:dev','pages:start']){
  const match=scripts[command].match(/--binding\s+ENVIRONMENT=([^\s]+)/);
  expect(match?.[1]).toBe('development');
  expect(readZohoProjectionConfig({ENVIRONMENT:match?.[1],SUPABASE_URL:'http://127.0.0.1:54321'}).projectionDelivery).toBe(true);
  expect(readZohoProjectionConfig({ENVIRONMENT:match?.[1],SUPABASE_URL:'https://remote.invalid'}).projectionDelivery).toBe(false);
 }
 expect(readZohoProjectionConfig({ENVIRONMENT:'production',SUPABASE_URL:'http://127.0.0.1:54321'}).projectionDelivery).toBe(false);
});
it('uses the same local fallback URL as the application database client',async()=>{
 const env:PagesEnv={ENVIRONMENT:'development',VITE_SUPABASE_URL:'http://127.0.0.1:54321',SUPABASE_SERVICE_ROLE_KEY:'synthetic'};
 const fetcher=vi.fn(async(_input:unknown,_init?:unknown)=>Response.json(true));
 vi.stubGlobal('fetch',fetcher);
 try {
  await createSupabaseAdminClient(env).rpc('zoho_candidate_projection_ready',{});
  expect(String(fetcher.mock.calls[0]?.[0])).toBe('http://127.0.0.1:54321/rest/v1/rpc/zoho_candidate_projection_ready');
  expect(readZohoProjectionConfig(env)).toBe(ZOHO_PROFILES.local);
 } finally {vi.unstubAllGlobals();}
});
it('honors primary URL precedence and keeps deployment gates with the fallback',()=>{
 const fallback={ENVIRONMENT:'development',VITE_SUPABASE_URL:'http://127.0.0.1:54321'};
 for(const SUPABASE_URL of ['https://remote.invalid','invalid'])
  expect(readZohoProjectionConfig({...fallback,SUPABASE_URL}).projectionDelivery).toBe(false);
 expect(readZohoProjectionConfig({...fallback,SUPABASE_URL:''})).toBe(ZOHO_PROFILES.local);
 expect(readZohoProjectionConfig({...fallback,SUPABASE_URL:'http://localhost:54321',VITE_SUPABASE_URL:'https://unused.invalid'})).toBe(ZOHO_PROFILES.local);
 for(const ENVIRONMENT of ['production','preview','local-review','unknown'])
  expect(readZohoProjectionConfig({...fallback,ENVIRONMENT}).projectionDelivery).toBe(false);
});
it('rejects unsafe fallback URLs without enabling projection',()=>{
 for(const VITE_SUPABASE_URL of ['http://localhost.evil.invalid','http://user:pass@localhost:54321','http://localhost:54321/path','http://localhost:54321/?q=1','file:///tmp/db','invalid'])
  expect(readZohoProjectionConfig({ENVIRONMENT:'development',VITE_SUPABASE_URL}).projectionDelivery).toBe(false);
});
it('uses code profiles and ignores obsolete feature variables',()=>{
 const old={ENVIRONMENT:'production',ZOHO_CANDIDATE_PROVISIONING_ENABLED:'true',ZOHO_PROJECTION_DELIVERY_ENABLED:'true'};
 expect(readZohoProjectionConfig(old)).toBe(ZOHO_PROFILES.production);
 for(const ENVIRONMENT of ['production','development','preview','unknown']){
  const config=readZohoProjectionConfig({ENVIRONMENT});
  for(const key of ['projectionDelivery'] as const)expect(config[key]).toBe(false);
 }
 expect(readZohoProjectionConfig({ENVIRONMENT:'development',SUPABASE_URL:'http://127.0.0.1:54321'})).toBe(ZOHO_PROFILES.local);
});
it('preserves review-only local setup and mandatory immutable policy',()=>{
 const config=readZohoProjectionConfig({ENVIRONMENT:'local-review',SUPABASE_URL:'http://127.0.0.1:54321'});
 expect(config).toBe(ZOHO_PROFILES['local-review']);expect(config.emailPolicy).toBe('forbidden');expect(config.requiresApproval).toBe(true);expect(Object.isFrozen(config)).toBe(true);
});

it('enables QA projection without weakening the mandatory policy',()=>{
 const config=readZohoProjectionConfig({ENVIRONMENT:'qa',SUPABASE_URL:'https://qa.invalid'});
 expect(config).toBe(ZOHO_PROFILES.qa);expect(config.projectionDelivery).toBe(true);
 expect(config.emailPolicy).toBe('forbidden');expect(config.requiresApproval).toBe(true);
});
