import {describe,it,expect,vi} from 'vitest';
import {indexCatalogSource} from '../lib/rag-index.mjs';
const doc={kind:'course',id:'11111111-1111-4111-8111-111111111111',revision:'a'.repeat(64),text:'Learn Python and SQL for data analysis',cursor:'course:11111111-1111-4111-8111-111111111111'};
const vector={model:'google/gemini-embedding-2-preview',dimensions:1536,task_type:'RETRIEVAL_DOCUMENT',embedding:Array(1536).fill(.1)};
describe('source-keyed indexing',()=>{
 it('keeps dry run read-only and source scoped',async()=>{
  const rpc=vi.fn().mockResolvedValue([doc]),embed=vi.fn();
  expect(await indexCatalogSource({sourceKey:'catalog.courses',rpc,embed})).toMatchObject({mode:'dry-run',examined:1,indexed:0,next:doc.cursor});
  expect(rpc).toHaveBeenCalledWith('rag_pending',{p_source:'catalog.courses',p_after:'',p_limit:10});expect(embed).not.toHaveBeenCalled();
 });
 it('stores through shared RPC without changing entity identity or provenance',async()=>{
  const rpc=vi.fn().mockResolvedValueOnce([doc]).mockResolvedValueOnce(true);
  const embed=vi.fn().mockResolvedValue({model:'google/gemini-embedding-2-preview',dimensions:1536,task_type:'RETRIEVAL_DOCUMENT',embedding:Array(1536).fill(.1)});
  expect(await indexCatalogSource({sourceKey:'catalog.courses',rpc,embed,execute:true})).toMatchObject({indexed:1});
  expect(rpc).toHaveBeenLastCalledWith('rag_store',expect.objectContaining({p_source:'catalog.courses',p_id:doc.id,p_revision:doc.revision}));expect(embed).toHaveBeenCalledTimes(1);
 });
 it('rejects unknown or substituted sources before generating vectors',async()=>{
  const rpc=vi.fn().mockResolvedValue([doc]),embed=vi.fn();
  await expect(indexCatalogSource({sourceKey:'unknown',rpc,embed,execute:true})).rejects.toThrow('Unknown');expect(rpc).not.toHaveBeenCalled();
  await expect(indexCatalogSource({sourceKey:'catalog.roles',rpc,embed,execute:true})).rejects.toThrow('Unexpected');expect(embed).not.toHaveBeenCalled();
 });
 it('records stale source conflicts without retrying embedding',async()=>{
  const rpc=vi.fn().mockResolvedValueOnce([doc]).mockResolvedValueOnce(false),embed=vi.fn().mockResolvedValue(vector);
  expect(await indexCatalogSource({sourceKey:'catalog.courses',rpc,embed,execute:true})).toMatchObject({indexed:0,conflicts:1});
  expect(embed).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenLastCalledWith('rag_store',expect.objectContaining({p_revision:doc.revision,p_model:vector.model}));
 });
 it('skips current records without generating vectors',async()=>{
  const embed=vi.fn();await indexCatalogSource({sourceKey:'catalog.courses',rpc:async()=>[],embed,execute:true});expect(embed).not.toHaveBeenCalled();
 });
 it('rejects incompatible embedding metadata before storing',async()=>{
  const rpc=vi.fn().mockResolvedValueOnce([doc]);
  await expect(indexCatalogSource({sourceKey:'catalog.courses',rpc,embed:async()=>({...vector,model:'wrong'}),execute:true})).rejects.toThrow('Incompatible');
  expect(rpc).toHaveBeenCalledTimes(1);
 });
 it('stops on unconfirmed writes without regenerating or silently succeeding',async()=>{
  const rpc=vi.fn().mockResolvedValueOnce([doc]).mockResolvedValueOnce(null),embed=vi.fn().mockResolvedValue(vector);
  await expect(indexCatalogSource({sourceKey:'catalog.courses',rpc,embed,execute:true})).rejects.toThrow('Unconfirmed');
  expect(rpc).toHaveBeenCalledTimes(2);expect(embed).toHaveBeenCalledTimes(1);
 });
 it('rejects cursors for another source before database or embedding access',async()=>{
  const rpc=vi.fn(),embed=vi.fn();
  await expect(indexCatalogSource({sourceKey:'catalog.courses',rpc,embed,after:'role:'+doc.id,execute:true})).rejects.toThrow('Cursor');
  expect(rpc).not.toHaveBeenCalled();expect(embed).not.toHaveBeenCalled();
 });
});
