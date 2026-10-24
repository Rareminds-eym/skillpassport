import {describe,it,expect} from 'vitest';
import {loadCareerTurn,saveCareerTurn,clearCareerTurn} from '../pendingTurn';
const request={turnId:'11111111-1111-4111-8111-111111111111',conversationId:null,message:'Suggest courses',selectedChips:['learn']};
const store=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};};
describe('Career pending turn identity',()=>{
 it('survives reload and isolates actor and conversation scope',()=>{
  const s=store();saveCareerTurn(s,'actor',request,1000);
  expect(loadCareerTurn(s,'actor',null,1001)).toEqual(request);
  expect(loadCareerTurn(s,'other',null,1001)).toBeNull();expect(loadCareerTurn(s,'actor','other',1001)).toBeNull();
 });
 it('expires and explicitly clears saved drafts',()=>{
  const s=store();saveCareerTurn(s,'actor',request,1000);
  expect(loadCareerTurn(s,'actor',null,1000+86400000)).toBeNull();
  saveCareerTurn(s,'actor',request,2000);clearCareerTurn(s,'actor',null);expect(loadCareerTurn(s,'actor',null,2001)).toBeNull();
 });
 it('rejects malformed identities and future/oversized snapshots',()=>{
  const s=store();expect(()=>saveCareerTurn(s,'actor',{...request,turnId:'bad'})).toThrow();
  saveCareerTurn(s,'actor',request,2000);expect(loadCareerTurn(s,'actor',null,1000)).toBeNull();
  expect(()=>saveCareerTurn(s,'actor',{...request,message:'😀'.repeat(10000)})).toThrow();
 });
});
