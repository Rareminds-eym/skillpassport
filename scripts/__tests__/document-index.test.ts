import {describe,it,expect,vi} from 'vitest';
import {indexDocuments} from '../lib/document-index.mjs';
describe('domain independent indexing',()=>{
 it('indexes a lesson document with source-owned validation, without catalog entity assumptions',async()=>{
  const doc={cursor:'lesson:one',text:'Authorized lesson document text'};
  const pending=vi.fn().mockResolvedValue([doc]),store=vi.fn().mockResolvedValue(true);
  const result=await indexDocuments({pending,store,embed:async()=>({vector:[1]}),execute:true,
   validateDocument:value=>value.cursor==='lesson:one',validateEmbedding:value=>value.vector?.[0]===1});
  expect(result).toMatchObject({indexed:1,next:'lesson:one'});expect(store).toHaveBeenCalledWith(doc,{vector:[1]});
 });
 it('stops on invalid source documents before embedding',async()=>{
  const embed=vi.fn();
  await expect(indexDocuments({pending:async()=>[{cursor:'lesson:one',text:'Authorized lesson document text'}],store:vi.fn(),embed,execute:true,
   validateDocument:()=>false,validateEmbedding:()=>true})).rejects.toThrow('Invalid');
  expect(embed).not.toHaveBeenCalled();
 });
});
