import {indexCatalogSource} from './rag-index.mjs';
export async function runIndexCli({args=process.argv.slice(2)}={}) {
const flag='RAG_INDEX_EXECUTE';

if(args.includes('--help')) {
  console.log(`node scripts/index-rag.mjs --source=catalog.roles|catalog.courses [--limit=10] [--after=kind:uuid] [--execute]\nDefault is read-only dry-run. Execute requires ${flag}=1 and makes paid embedding calls.\nServer-only env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; execute also EMBEDDING_WORKER_URL and EMBEDDING_API_KEY.`);
} else {
  if(args.some(arg=>!/^--(?:execute|limit=\d+|after=(?:role|course):[a-f0-9-]+)$/.test(arg)&&!/^--source=catalog\.(?:roles|courses)$/.test(arg)))throw new Error('Unknown indexing argument');
  const sourceKey=args.find(arg=>arg.startsWith('--source='))?.slice(9);
  if(!sourceKey||args.filter(arg=>arg.startsWith('--source=')).length!==1)throw new Error('Choose exactly one --source=catalog.roles or --source=catalog.courses');
  const execute=args.includes('--execute');
  if(execute&&process.env[flag]!=='1')throw new Error(`Execute is disabled: review paid backfill and set ${flag}=1 explicitly`);
  const origin=(name)=>{
    const url=new URL(process.env[name]??'');
    if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||
      (url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))))throw new Error(`Invalid ${name}`);
    return url.origin;
  };
  const database=origin('SUPABASE_URL'), key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error('Missing server-only database key');
  const post=async(url,headers,body)=>{
    const response=await fetch(url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    if(!response.ok)throw new Error(`Index dependency returned HTTP ${response.status}; stopped without retry`);
    if(!response.body)throw new Error('Empty index dependency response');
    const reader=response.body.getReader();let size=0;const chunks=[];
    try{for(;;){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;
      if(size>512000){await reader.cancel();throw new Error('Index response too large');}chunks.push(item.value);}}
    finally{reader.releaseLock();}
    const merged=new Uint8Array(size);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length;}
    return JSON.parse(new TextDecoder().decode(merged));
  };
  const rpc=(name,params)=>post(`${database}/rest/v1/rpc/${name}`,{apikey:key,Authorization:`Bearer ${key}`},params);
  const embed=async text=>{
    const embedding=origin('EMBEDDING_WORKER_URL'), secret=process.env.EMBEDDING_API_KEY;
    if(!secret)throw new Error('Missing embedding-worker internal key');
    return post(`${embedding}/embeddings/text`,{'X-Internal-Api-Key':secret},{input:text,task_type:'RETRIEVAL_DOCUMENT'});
  };
  const after=args.find(arg=>arg.startsWith('--after='))?.slice(8)??'';
  const limit=Number(args.find(arg=>arg.startsWith('--limit='))?.slice(8)??10);
  const options={rpc,embed,execute,after,limit};
  console.log(JSON.stringify(await indexCatalogSource({sourceKey,...options})));
}

}
