import {describe,it,expect,vi} from 'vitest';
import {runRetrieval} from '../retrieval/engine';
function adapter(){return {
 assertAllowed:vi.fn(),authorize:vi.fn().mockResolvedValue(true),
 embed:vi.fn().mockResolvedValue([1]),parseVector:(raw:unknown)=>raw as number[],
 search:vi.fn(async(source:string)=>({source,title:'Authorized source record'})),
};}
const request=()=>({version:1,sourceKeys:['learning.lessons'],query:'Explain a lesson',deadlineMs:Date.now()+3500});
describe('domain independent retrieval engine',()=>{
 it('supports a registered non-career source without database or persona assumptions',async()=>{
  const a=adapter();const result=await runRetrieval(request(),new AbortController().signal,a);
  expect(result[0]).toMatchObject({sourceKey:'learning.lessons',result:{source:'learning.lessons'}});
  expect(a.assertAllowed).toHaveBeenCalledWith(['learning.lessons']);
  expect(a.embed).toHaveBeenCalledWith('Explain a lesson',expect.objectContaining({maxAttempts:1}));
 });
 it('requires the adapter to approve source and actor before generating vectors',async()=>{
  const a=adapter();a.authorize.mockResolvedValue(false);
  await expect(runRetrieval(request(),new AbortController().signal,a)).rejects.toThrow('not authorized');
  expect(a.embed).not.toHaveBeenCalled();expect(a.search).not.toHaveBeenCalled();
  a.assertAllowed.mockImplementation(()=>{throw new Error('Source forbidden');});
  await expect(runRetrieval(request(),new AbortController().signal,a)).rejects.toThrow('Source forbidden');
  expect(a.authorize).toHaveBeenCalledTimes(1);
 });
 it('stops waiting on aborted embedding dispatch without retry or search',async()=>{
  const a=adapter();a.embed.mockImplementation(()=>new Promise(()=>{}));
  const controller=new AbortController();
  const pending=runRetrieval(request(),controller.signal,a);
  await vi.waitFor(()=>expect(a.embed).toHaveBeenCalledTimes(1));controller.abort();
  await expect(pending).rejects.toThrow('timed out');expect(a.search).not.toHaveBeenCalled();
 });
});
