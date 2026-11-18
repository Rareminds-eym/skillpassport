// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { buildCourseEvidence, condenseEvidence, planCourseEvidence } from '../course-evidence';

describe('request based course evidence', () => {
  it('distinguishes questions, scoped summaries, topic summaries, generation and followups', () => {
    expect(planCourseEvidence({question:'Summarize the entire course',history:[]}).mode).toBe('coverage');
    expect(planCourseEvidence({question:'Give me a summary',history:[],scope:'lesson',lessonId:'l'})).toMatchObject({mode:'coverage',lessonIds:['l']});
    expect(planCourseEvidence({question:'Summarize Reynolds number',history:[]}).mode).toBe('topic');
    expect(planCourseEvidence({question:'What is Reynolds number?',history:[]}).mode).toBe('targeted');
    expect(planCourseEvidence({question:'Generate a worksheet',history:[],generation:true}).mode).toBe('coverage');
    expect(planCourseEvidence({question:'Explain that further',history:[{role:'user',content:'Reynolds number'},{role:'assistant',content:'untrusted answer'}]}).query).toContain('Reynolds number');
    expect(planCourseEvidence({question:'Explain that further',history:[{role:'assistant',content:'untrusted answer'}]}).query).not.toContain('untrusted answer');
  });
  it('passes the end of every batch through summary reduction rather than truncating', async () => {
    const passages=Array.from({length:12},(_,i)=>'x'.repeat(9000)+` END-${i}`);
    const seen:string[]=[];
    const summarize=vi.fn(async input=>{seen.push(input);return input.match(/END-\d+/g)!.join(' ');});
    const result=await condenseEvidence(passages,'Summarize all',summarize);
    for(let i=0;i<12;i++){expect(seen.join(' ')).toContain(`END-${i}`);expect(result).toContain(`END-${i}`);}
  });
  it('rejects unbounded summaries and propagates cancellation', async () => {
    await expect(condenseEvidence(['x'.repeat(25000),'y'.repeat(25000)],'all',vi.fn())).rejects.toThrow('batch budget');
    await expect(condenseEvidence(Array(4).fill('x'.repeat(20000)),'all',async()=>{throw new Error('aborted');})).rejects.toThrow('aborted');
  });
  it('runs at most three summaries concurrently, preserves order and reuses unchanged evidence',async()=>{
    let active=0;let peak=0;
    const parts=Array.from({length:9},(_,i)=>'x'.repeat(15000)+` unique-batch-${i}`);
    const summarize=vi.fn(async(input:string)=>{
      active++;peak=Math.max(peak,active);
      await new Promise(resolve=>setTimeout(resolve,5));
      active--;return input.match(/unique-batch-\d+/g)!.join(' ');
    });
    const result=await condenseEvidence(parts,'concurrency-and-cache-test',summarize);
    expect(peak).toBe(3);expect(summarize).toHaveBeenCalledTimes(9);
    expect(result.indexOf('unique-batch-0')).toBeLessThan(result.indexOf('unique-batch-8'));
    await condenseEvidence(parts,'concurrency-and-cache-test',summarize);
    expect(summarize).toHaveBeenCalledTimes(9);
    await condenseEvidence(parts,'different-request',summarize);
    expect(summarize).toHaveBeenCalledTimes(18);
  });
  it('denies access before reading sources or calling models',async()=>{
    const from=vi.fn();const summarize=vi.fn();
    await expect(buildCourseEvidence({rpc:vi.fn().mockResolvedValue({data:false}),from} as never,{},'u','c',{question:'all',history:[]},summarize)).rejects.toThrow('access denied');
    expect(from).not.toHaveBeenCalled();expect(summarize).not.toHaveBeenCalled();
  });
  it('retrieves question-specific evidence with neighbors from the same source',async()=>{
    const chunks=Array.from({length:5},(_,i)=>({id:`c${i}`,analysis_id:'a',chunk_index:i,content:`section ${i}`,source_location:{}}));
    const rpc=vi.fn(async(name:string)=>({data:name==='search_course_chunks'?[{chunk_id:'c3',analysis_id:'a',similarity:.9}]:true}));
    const db={rpc,from:(table:string)=>{
      let rows:any[]=table==='course_resource_analysis'?[{id:'a',lesson_id:'l',resource_id:null,source_metadata:{name:'Source'}}]:table==='course_modules'?[{module_id:'m'}]:table==='lessons'?[{lesson_id:'l'}]:table==='lesson_resources'?[]:[...chunks];
      const q:any={select:()=>q,order:()=>q,limit:()=>q};
      q.eq=(key:string,value:unknown)=>{if(rows.length && key in rows[0])rows=rows.filter(r=>r[key]===value);return q;};
      q.in=(key:string,values:unknown[])=>{if(rows.length && key in rows[0])rows=rows.filter(r=>values.includes(r[key]));return q;};
      q.gte=(key:string,n:number)=>{rows=rows.filter(r=>r[key]>=n);return q;};
      q.lte=(key:string,n:number)=>{rows=rows.filter(r=>r[key]<=n);return q;};
      q.then=(resolve:any)=>resolve({data:rows,error:null});return q;
    }};
    const embedText=vi.fn().mockResolvedValue({model:'google/gemini-embedding-2-preview',dimensions:1536,embedding:Array(1536).fill(.1)});
    const result=await buildCourseEvidence(db as never,{EMBEDDING_SERVICE:{embedText}},'u','course',{question:'Explain turbulent flow',history:[]},vi.fn());
    expect(result.evidence.map(c=>c.chunk_id).sort()).toEqual(['c2','c3','c4']);
    expect(result.prompt).toContain('section 4');expect(result.prompt).not.toContain('section 0');
    expect(embedText).toHaveBeenCalledWith('Explain turbulent flow','RETRIEVAL_QUERY');
  });
  it('reads every scoped chunk including tails and reports unindexed resources',async()=>{
    const calls:Array<{table:string;methods:Array<[string,unknown[]]>}>=[];
    const chunks=Array.from({length:3},(_,i)=>({id:`chunk-${i}`,analysis_id:'a',chunk_index:i,content:`topic ${i} ${i===2?'DOCUMENT END':''}`,source_location:{}}));
    const db={rpc:vi.fn().mockResolvedValue({data:true}),from:(table:string)=>{
      const call={table,methods:[] as Array<[string,unknown[]]>};calls.push(call);
      const q:any={};for(const method of ['select','eq','in','order','limit','range'])q[method]=(...args:unknown[])=>{call.methods.push([method,args]);return q;};
      q.then=(resolve:any)=>resolve({data:table==='course_resource_analysis'?[{id:'a',lesson_id:'l',resource_id:null,source_metadata:{name:'Lesson'}}]:table==='course_modules'?[{module_id:'m'}]:table==='lessons'?[{lesson_id:'l'}]:table==='lesson_resources'?[{resource_id:'missing'}]:chunks,error:null});return q;
    }};
    const summarize=vi.fn();
    const result=await buildCourseEvidence(db as never,{},'u','c',{question:'Summarize entire course',history:[]},summarize);
    expect(result.evidence).toHaveLength(3);expect(result.prompt).toContain('DOCUMENT END');expect(result.prompt).toContain('"missingResources":["missing"]');
    expect(summarize).not.toHaveBeenCalled();
    expect(calls.find(c=>c.table==='lessons')?.methods).toContainEqual(['select',['lesson_id']]);
  });
});
