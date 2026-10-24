/** Parse the product SSE incrementally, but report success only after a saved receipt and clean EOF. */
export async function readCareerStream(response:Response,onToken?:(text:string)=>void):Promise<Record<string,unknown>> {
  if(!response.body)throw new Error('TURN_STATE_UNKNOWN: No response stream; retry the same message.');
  const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  const deadline=Date.now()+80000;
  let bytes=0,buffer='',receipt:Record<string,unknown>|undefined;
  try{
    for(;;){
      let timer:ReturnType<typeof setTimeout>|undefined;
      const chunk=await Promise.race([reader.read(),new Promise<never>((_,reject)=>{
        timer=setTimeout(()=>reject(new Error('TURN_STATE_UNKNOWN: Response timed out; retry the same message.')),Math.max(0,deadline-Date.now()));
      })]).finally(()=>{if(timer!==undefined)clearTimeout(timer);});
      if(chunk.done){buffer+=decoder.decode();if(buffer.trim()||!receipt)throw new Error('TURN_STATE_UNKNOWN: Incomplete response; retry the same message.');return receipt;}
      bytes+=chunk.value.byteLength;if(bytes>512000)throw new Error('TURN_STATE_UNKNOWN: Response exceeds limit.');
      buffer+=decoder.decode(chunk.value,{stream:true}).replace(/\r/g,'');
      let end:number;
      while((end=buffer.indexOf('\n\n'))>=0){
        const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
        if(!frame.trim()||frame.startsWith(':'))continue;
        if(receipt||!frame.startsWith('data: ')||frame.includes('\n'))throw new Error('TURN_STATE_UNKNOWN: Invalid response frame.');
        const data:unknown=JSON.parse(frame.slice(6));
        if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('TURN_STATE_UNKNOWN: Invalid response.');
        const value=data as Record<string,unknown>;
        if(value.error){
          const error=value.error;
          if(typeof error==='object'&&error!==null){
            const detail=error as Record<string,unknown>;
            const code=typeof detail.type==='string'?detail.type:typeof detail.code==='string'?detail.code:'TURN_STATE_UNKNOWN';
            throw new Error(`${code}: ${typeof detail.message==='string'?detail.message:'Response failed.'}`);
          }
          throw new Error(typeof error==='string'?error:'TURN_STATE_UNKNOWN: Response failed.');
        }
        if(typeof value.content==='string'&&value.content){onToken?.(value.content);continue;}
        if(value.done===true&&typeof value.conversationId==='string'&&typeof value.messageId==='string'){receipt=value;continue;}
        throw new Error('TURN_STATE_UNKNOWN: Missing response receipt.');
      }
    }
  }finally{void reader.cancel().catch(()=>undefined);reader.releaseLock();}
}
