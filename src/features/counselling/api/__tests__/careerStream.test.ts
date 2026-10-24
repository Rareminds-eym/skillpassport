import {describe,it,expect} from 'vitest';
import {readCareerStream} from '../careerStream';
const frame=(data:unknown)=>`data: ${JSON.stringify(data)}\n\n`;
const receipt={done:true,conversationId:'conversation',messageId:'turn'};
describe('Career product stream',()=>{
 it('preserves typed late credit errors without a successful receipt',async()=>{
  await expect(readCareerStream(new Response(frame({error:{type:'AI_CREDITS_PENDING',message:'Settlement pending'}})))).rejects.toThrow('AI_CREDITS_PENDING: Settlement pending');
 });
 it('accepts a bounded detailed answer stream and rejects unbounded data',async()=>{
  const pieces=Array.from({length:3000},()=>frame({content:'word '})).join('');
  expect(await readCareerStream(new Response(pieces+frame(receipt)))).toEqual(receipt);
  await expect(readCareerStream(new Response('x'.repeat(512001)))).rejects.toThrow('exceeds limit');
 });
 it('forwards split UTF8 text before the receipt while keeping completion pending',async()=>{
  let controller!:ReadableStreamDefaultController<Uint8Array>;const seen:string[]=[];
  const response=new Response(new ReadableStream({start(c){controller=c;}}));
  const work=readCareerStream(response,text=>seen.push(text));
  const bytes=new TextEncoder().encode(frame({content:'Learn தமிழ்'}));
  for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));
  await new Promise(resolve=>setTimeout(resolve,0));expect(seen).toEqual(['Learn தமிழ்']);
  controller.enqueue(new TextEncoder().encode(frame(receipt)));controller.close();
  expect(await work).toEqual(receipt);
 });
 it.each([
  frame({content:'unfinished'}),
  frame(receipt)+frame({content:'trailing'}),
  frame(receipt)+frame(receipt),
  'data: {invalid}\n\n',
 ])('rejects incomplete or malformed completion %#',async text=>{
  await expect(readCareerStream(new Response(text))).rejects.toThrow();
 });
});
