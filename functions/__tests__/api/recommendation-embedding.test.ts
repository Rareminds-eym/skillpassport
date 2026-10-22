import { afterEach, expect, it, vi } from 'vitest';
import { callEmbeddingWorker } from '../../api/embedding/services/embeddingWorkerClient';
import { updateEmbedding, batchUpdateEmbeddings } from '../../api/embedding/services/databaseUpdater';
import { buildlearnerTextFromDatabase } from '../../api/embedding/services/textBuilder';
import { checkRateLimit } from '../../api/career/utils/rate-limit';
const vector=()=>Array(1536).fill(0.01);
afterEach(()=>vi.restoreAllMocks());
it('keeps matching quota actor-scoped without consuming the chat/generation bucket',async()=>{
  const actor=crypto.randomUUID();
  for(let i=0;i<5;i++) expect(await checkRateLimit(`matching:${actor}`)).toBe(true);
  expect(await checkRateLimit(`matching:${actor}`)).toBe(false);
  expect(await checkRateLimit(actor)).toBe(true);
});
it('truncates long input and accepts valid worker output',async()=>{
  const embedText=vi.fn(async(_text: string, _task?: string)=>({embedding:vector(),model:'fixture-model'}));
  expect(await callEmbeddingWorker('a'.repeat(10001),{EMBEDDING_SERVICE:{embedText}})).toHaveLength(1536);
  expect(embedText.mock.calls[0][0]).toHaveLength(10000);
});
it.each([null,{embedding:[]},{embedding:[0.1,0.2]},{embedding:Array(1536).fill(0)},{embedding:Array(1536).fill(Infinity)},
  {embedding:Object.assign(Array(1536),{0:0.01})},{embedding:Array(1536).fill(1e308)},{embedding:Array(1536).fill(1e-100)}])('rejects malformed provider output before a return or write',async response=>{
  await expect(callEmbeddingWorker('Controlled profile text',{EMBEDDING_SERVICE:{embedText:async()=>response}})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('rejects a provider model mismatch',async()=>{
  await expect(callEmbeddingWorker('Controlled profile text',{MATCHING_EMBEDDING_MODEL:'expected',EMBEDDING_SERVICE:{embedText:async()=>({embedding:vector(),model:'other'})}})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it.each([0,1])('acknowledges exactly one persisted row, not %i rows',async count=>{
  const query:any={update:()=>query,eq:()=>query,select:async()=>({data:Array(count).fill({id:'A'}),error:null})};
  const db:any={from:()=>query};
  if(count===0){await expect(updateEmbedding(db,'learners','A',vector())).rejects.toMatchObject({code:'API_ERROR'});expect((await batchUpdateEmbeddings(db,'learners',[{id:'A',embedding:vector()}]))[0].success).toBe(false);}
  else expect(await updateEmbedding(db,'learners','A',vector())).toMatchObject({success:true,rowsAffected:1});
});
it.each(['skills','certificates','projects','course_enrollments','trainings'])('does not build a partial profile after %s fails',async failed=>{
  const db:any={from(table:string){const q:any={};for(const method of ['select','eq','or','order','limit','in'])q[method]=()=>q;q.single=async()=>({data:{id:'A',name:'Fixture learner',bio:'Detailed controlled learner biography'},error:null});q.then=(resolve:any)=>Promise.resolve(table===failed?{data:null,error:{code:'fixture'}}:{data:[],error:null}).then(resolve);return q;}};
  await expect(buildlearnerTextFromDatabase(db,'A')).rejects.toMatchObject({code:'API_ERROR'});
});
