type Turn={role:string;content:string};
const encoder=new TextEncoder();
function excerpt(text:string,bytes:number):string{
 if(encoder.encode(text).byteLength<=bytes)return text;
 const suffix='\n[conversation excerpt]';const raw=encoder.encode(text);
 let end=bytes-encoder.encode(suffix).byteLength;
 for(;end>0;end--){try{return new TextDecoder('utf-8',{fatal:true}).decode(raw.subarray(0,end))+suffix;}catch{/* complete UTF8 boundary */}}
 return '';
}
/** Deterministic conversation retrieval, not a fabricated or model-generated summary. */
export function selectCareerHistory(turns:readonly Turn[],query:string):Array<{role:'user'|'assistant';content:string}>{
 const valid=turns.filter((turn):turn is Turn&{role:'user'|'assistant'}=>(turn.role==='user'||turn.role==='assistant')&&typeof turn.content==='string'&&turn.content.trim().length>0);
 const recent=valid.slice(-10),older=valid.slice(0,-10);
 const terms=[...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu)??[])].filter(term=>!['what','which','would','could','please','about','explain','with','this','that','have'].includes(term));
 const olderHits=older.map((turn,index)=>({turn,index,score:terms.reduce((score,term)=>score+Number(turn.content.toLowerCase().includes(term)),0)}))
  .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||b.index-a.index).slice(0,2).sort((a,b)=>a.index-b.index)
  .map(({turn})=>({role:turn.role,content:excerpt(turn.content,500)}));
 let remaining=9000;const tail:Array<{role:'user'|'assistant';content:string}>=[];
 for(const turn of [...recent].reverse()){
  if(remaining<100)break;
  const content=excerpt(turn.content,Math.min(2500,remaining));
  if(content){tail.unshift({role:turn.role,content});remaining-=encoder.encode(content).byteLength;}
 }
 return [...olderHits,...tail];
}
