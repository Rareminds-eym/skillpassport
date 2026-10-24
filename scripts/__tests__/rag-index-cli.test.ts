import {describe,it,expect,vi,afterEach} from 'vitest';
import {runIndexCli} from '../lib/rag-index-cli.mjs';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks();});
describe('generic indexing command',()=>{
 it('shows help without accessing dependencies',async()=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const log=vi.spyOn(console,'log').mockImplementation(()=>{});
  await runIndexCli({args:['--help']});
  expect(log).toHaveBeenCalledWith(expect.stringContaining('RAG_INDEX_EXECUTE=1'));expect(fetch).not.toHaveBeenCalled();
 });
 it.each([[],['--source=private.anything'],['--source=catalog.roles','--source=catalog.courses']])('rejects invalid source selection %j',async args=>{
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  await expect(runIndexCli({args})).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
 });
 it('retains the explicit paid-work gate before accessing dependencies',async()=>{
  vi.stubEnv('RAG_INDEX_EXECUTE','0');const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  await expect(runIndexCli({args:['--source=catalog.courses','--execute']})).rejects.toThrow('Execute is disabled');
  expect(fetch).not.toHaveBeenCalled();
 });
 it('dry-run requests only the selected generic pending source',async()=>{
  vi.stubEnv('SUPABASE_URL','https://database.example.invalid');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');
  const fetch=vi.fn().mockResolvedValue(new Response('[]'));vi.stubGlobal('fetch',fetch);
  const log=vi.spyOn(console,'log').mockImplementation(()=>{});
  await runIndexCli({args:['--source=catalog.courses','--limit=2']});
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0]![0]).toBe('https://database.example.invalid/rest/v1/rpc/rag_pending');
  expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({p_source:'catalog.courses',p_after:'',p_limit:2});
  expect(JSON.parse(log.mock.calls[0]![0])).toMatchObject({mode:'dry-run',indexed:0});
 });
});
