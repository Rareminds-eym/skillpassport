import {z} from 'zod';
const Request=z.object({turnId:z.string().uuid(),conversationId:z.string().nullable(),message:z.string().min(1).max(10000),selectedChips:z.array(z.string().max(256)).max(20)}).strict();
const Snapshot=z.object({version:z.literal(1),actorId:z.string().min(1),savedAt:z.number().finite(),request:Request}).strict();
export type PendingCareerTurn=z.infer<typeof Request>;
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const key=(actor:string,conversation:string|null)=>`career-pending:1:${encodeURIComponent(actor)}:${encodeURIComponent(conversation??'new')}`;
export function loadCareerTurn(storage:Store,actor:string,conversation:string|null,now=Date.now()):PendingCareerTurn|null{
 const name=key(actor,conversation),raw=storage.getItem(name);if(!raw)return null;
 try{
  if(new TextEncoder().encode(raw).byteLength>32000)throw new Error('oversized');
  const value=Snapshot.parse(JSON.parse(raw));
  if(value.actorId!==actor||value.request.conversationId!==conversation||value.savedAt>now||now-value.savedAt>=86400000)throw new Error('expired');
  return value.request;
 }catch{storage.removeItem(name);return null;}
}
export function saveCareerTurn(storage:Store,actor:string,request:PendingCareerTurn,now=Date.now()):void{
 const text=JSON.stringify(Snapshot.parse({version:1,actorId:actor,savedAt:now,request}));
 if(new TextEncoder().encode(text).byteLength>32000)throw new Error('Pending message exceeds recovery limit');
 storage.setItem(key(actor,request.conversationId),text);
}
export function clearCareerTurn(storage:Store,actor:string,conversation:string|null):void{storage.removeItem(key(actor,conversation));}
