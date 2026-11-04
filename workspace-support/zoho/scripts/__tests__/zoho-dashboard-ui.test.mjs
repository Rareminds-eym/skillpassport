import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root=fileURLToPath(new URL('../../',import.meta.url));
const dashRequire=createRequire(resolve(root,'sp-dash/package.json'));
const appRequire=createRequire(resolve(root,'skillpassport/package.json'));
const {build}=dashRequire('esbuild'), {JSDOM}=appRequire('jsdom');
let bundle;
before(async()=>{
  const result=await build({stdin:{contents:`import React,{act} from 'react';import {createRoot} from 'react-dom/client';import Page from './components/pages/ZohoRecruitPage.jsx';window.auditAct=act;window.auditRoot=createRoot(document.getElementById('root'));window.auditMount=()=>window.auditRoot.render(React.createElement(Page));`,resolveDir:resolve(root,'sp-dash'),loader:'jsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"development"'},alias:{'@':resolve(root,'sp-dash')},plugins:[{name:'test-only-panels',setup(build){
    build.onResolve({filter:/^(next\/link|@\/components\/(ui\/button|zoho\/(JobPolicyPanel|SourcePrivacyPanel|OperationsPanel)))$/},args=>({path:args.path,namespace:'audit-stub'}));
    build.onLoad({filter:/.*/,namespace:'audit-stub'},()=>({contents:`import React from ${JSON.stringify(dashRequire.resolve('react'))};export const Button=({variant,size,...props})=>React.createElement('button',props);export default function Stub(){return null;}`,loader:'js',resolveDir:resolve(root,'sp-dash')}));
  }}]});bundle=result.outputFiles[0].text;
});

const id='a5700000-0000-4000-8000-000000000001';
async function fixture({ candidate = false, recordCount = 2, sources = null, compact = false } = {}) {
  const state={approved:false,complete:false,changed:false,historyGets:0, failures:{}, posts:[], decisionError:null, run:null};
  const timers=new Map();let sequence=0;
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;w.IS_REACT_ACT_ENVIRONMENT=true;w.matchMedia=()=>({matches:compact,addEventListener(){},removeEventListener(){}});
  w.MessageChannel=class { constructor(){this.port1={onmessage:null};this.port2={postMessage:()=>setTimeout(()=>this.port1.onmessage?.(),0)};} };
  w.setInterval=fn=>{timers.set(++sequence,fn);return sequence;};w.clearInterval=key=>timers.delete(key);
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const row=(external)=>({id:external==='999'?id:'a5700000-0000-4000-8000-000000000002',external_id:external,module:candidate?'Candidates':'Job_Openings',revision:external==='888'&&state.changed?2:1,source_hash:'a'.repeat(64),config_revision:1,target_id:null,proposed_data:candidate?{name:'Audit candidate '+external}:{title:'Audit job '+external},validation_errors:[],decision:external==='999'&&state.approved?(state.complete?'completed':'approved'):'pending_approval',created_at:new Date().toISOString()});
  w.fetch=async(input,init={})=>{
    const url=new URL(input,'http://localhost');let data;
    const view=url.searchParams.get('view')||'summary';
    if(state.approved && state.failures[view]>0){state.failures[view]--;return Response.json({error:'Injected '+view+' outage'},{status:503});}
    if(init.method==='POST'){
      const command=JSON.parse(init.body);state.posts.push(command);
      if(command.action==='decide'&&state.decisionError)return Response.json({error:state.decisionError},{status:503});
      if(command.action==='review_candidate') data={review:{recordId:id,revision:1,sourceHash:'a'.repeat(64),configRevision:1,targetId:null,
        reviewHash:'b'.repeat(64),decision:'create',blockers:[],expiresAt:new Date(Date.now()+600000).toISOString(),
        identity:{email:'candidate@example.invalid',outcome:'new_identity',profileAction:'create',name:'Audit candidate 999',activationState:'activation_pending'},
        entitlements:{action:'grant_discover',planCodes:['freemium'],paidAccessPreserved:false,organizationAccessPreserved:false}}};
      else {state.approved=true;data={result:{count:1,decision:'approve',delivery:'queued'}};}
    }
    else if(url.searchParams.get('view')==='records'){
      const all=recordCount===2?[row('999'),row('888')]:Array.from({length:recordCount},(_,i)=>({...row(String(1000+i)),id:`b5700000-0000-4000-8000-${String(i+1).padStart(12,'0')}`}));
      data={records:url.searchParams.get('module')===(candidate?'Candidates':'Job_Openings')?all.slice(url.searchParams.has('before')?50:0,url.searchParams.has('before')?100:50):[],total:all.length};
    }
    else if(url.searchParams.get('view')==='executions'){state.historyGets++;data={executions:state.approved?[{id,state:state.complete?'completed':'queued',execution_attempts:1,record_revision:1,zoho_staged_records:{module:candidate?'Candidates':'Job_Openings',external_id:'999'}}]:[]};}
    else if(url.searchParams.get('view')==='runs')data={runs:state.run?[state.run]:[]};
    else if(url.searchParams.get('view')==='deferred')data={deferred:[]};
    else data={connections:sources||[{id,name:'Audit fixture',region:'in',status:'connected'}],counts:{},countsByConnection:{[id]:{completed:state.complete?1:0}},capabilities:{oauth:false,discovery:false,execution:{ready:true,modules:['Candidates','Job_Openings']}}};
    return Response.json(data);
  };
  w.eval(bundle);
  const act=async fn=>{await w.auditAct(async()=>{await fn?.();await new Promise(resolve=>setTimeout(resolve,5));});};
  await act(()=>w.auditMount());
  const button=text=>[...w.document.querySelectorAll('button')].find(node=>node.textContent.trim()===text);
  if(!candidate) await act(()=>button('Job openings').click());
  async function approve(){
    if(!candidate) await act(()=>w.document.querySelector('[aria-label="Select source 999"]').click());
    await act(()=>button('Approve selection').click());
    await act(()=>{const field=w.document.querySelector('dialog textarea');Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype,'value').set.call(field,'Synthetic reviewed approval');field.dispatchEvent(new w.Event('input',{bubbles:true}));});
    assert.equal(button('Confirm decision').disabled,false);
    await act(()=>button('Confirm decision').click());
  }
  return {w,state,timers,act,approve,button,async close(){await act(()=>w.auditRoot.unmount());w.close();}};
}

test('a new approval refreshes history and starts polling from idle',async()=>{
  const f=await fixture();try{assert.equal(f.state.historyGets,1);await f.approve();assert.ok(f.state.historyGets>=2);assert.equal(f.timers.size,1);assert.ok(!f.w.document.body.textContent.includes('No approved execution recorded.'));}finally{await f.close();}
});
test('completion refreshes records and summary without losing another unchanged selection',async()=>{
  const f=await fixture();try{
    await f.approve();await f.act(()=>f.w.document.querySelector('[aria-label="Select source 888"]').click());
    f.state.complete=true;await f.act(async()=>{await [...f.timers.values()][0]();});
    assert.equal(f.w.document.querySelector('[aria-label="Select source 888"]').checked,true);
    assert.match(f.w.document.querySelector('tbody').textContent,/Completed/);
    assert.equal(f.timers.size,0);
  }finally{await f.close();}
});
test('background refresh removes a selection when its reviewed revision changes',async()=>{
  const f=await fixture();try{
    await f.approve();await f.act(()=>f.w.document.querySelector('[aria-label="Select source 888"]').click());
    f.state.changed=true;await f.act(async()=>{await [...f.timers.values()][0]();});
    assert.equal(f.w.document.querySelector('[aria-label="Select source 888"]').checked,false);
    assert.match(f.w.document.querySelector('tbody').textContent,/v2/);
  }finally{await f.close();}
});

for(const view of ['summary','records']) test(`approval refresh survives a ${view} outage`,async()=>{
  const f=await fixture();try{
    f.state.failures[view]=1;await f.approve();
    assert.equal(f.state.approved,true);assert.ok(f.state.historyGets>=2);assert.equal(f.timers.size,1);
    assert.match(f.w.document.body.textContent,new RegExp('Injected '+view+' outage'));
    f.state.complete=true;await f.act(async()=>{await [...f.timers.values()][0]();});
    assert.equal(f.timers.size,0);assert.match(f.w.document.querySelector('tbody').textContent,/Completed/);
  }finally{await f.close();}
});
test('failed execution refresh starts a retry loop even before history is available',async()=>{
  const f=await fixture();try{
    f.state.failures.executions=1;await f.approve();assert.equal(f.state.historyGets,1);assert.equal(f.timers.size,1);
    await f.act(async()=>{await [...f.timers.values()][0]();});assert.ok(f.state.historyGets>=2);assert.equal(f.timers.size,1);
    f.state.complete=true;await f.act(async()=>{await [...f.timers.values()][0]();});assert.equal(f.timers.size,0);
  }finally{await f.close();}
});
test('candidate check requires human acknowledgement before a version-bound approval',async()=>{
  const f=await fixture({candidate:true});try{
    assert.equal(f.button('Approve selection').disabled,true);
    await f.act(()=>f.button('Audit candidate 999').click());
    await f.act(()=>f.button('Check canonical account').click());
    assert.equal(f.state.approved,false);assert.equal(f.button('Approve selection').disabled,true);
    assert.match(f.w.document.body.textContent,/Grant Discover/);
    assert.match(f.w.document.body.textContent,/Activation pending/);
    await f.act(()=>f.button('Acknowledge and select').click());
    assert.equal(f.button('Approve selection').disabled,false);
    await f.approve();
    const command=f.state.posts.find(item=>item.action==='decide');
    assert.equal(command.input.items[0].candidateReviewHash,'b'.repeat(64));
    assert.equal(command.input.items[0].revision,1);assert.equal(f.state.approved,true);assert.equal(f.timers.size,1);
    f.state.complete=true;await f.act(async()=>{await [...f.timers.values()][0]();});
    assert.match(f.w.document.querySelector('tbody').textContent,/Completed/);assert.equal(f.timers.size,0);
  }finally{await f.close();}
});


test('decision failure remains visible inside its named modal',async()=>{
 const f=await fixture();try{
  f.state.decisionError='Synthetic decision outage';await f.approve();
  const dialog=f.w.document.querySelector('dialog');assert.equal(dialog.open,true);
  assert.match(dialog.querySelector('[role="alert"]').textContent,/Synthetic decision outage/);
  assert.ok(f.w.document.getElementById(dialog.getAttribute('aria-labelledby')));
  assert.equal(f.state.approved,false);
 }finally{await f.close();}
});
test('selection is capped at fifty across loaded pages',async()=>{
 const f=await fixture({recordCount:51});try{
  await f.act(()=>f.button('Load more records').click());
  await f.act(()=>{for(const input of f.w.document.querySelectorAll('tbody input[type="checkbox"]'))input.click();});
  assert.equal(f.w.document.querySelectorAll('tbody input:checked').length,50);
  assert.equal(f.w.document.querySelectorAll('tbody input:not(:checked):disabled').length,1);
  assert.match(f.w.document.body.textContent,/maximum 50 per decision/);
 }finally{await f.close();}
});
test('keyboard tabs have associated panels and switch on arrow keys',async()=>{
 const f=await fixture({candidate:true});try{
  const tab=f.w.document.querySelector('[role="tab"]');
  await f.act(()=>tab.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
  const selected=f.w.document.querySelector('[role="tab"][aria-selected="true"]');
  assert.equal(selected.textContent,'Job openings');assert.equal(selected.tabIndex,0);
  assert.equal(f.w.document.getElementById(selected.getAttribute('aria-controls')).getAttribute('role'),'tabpanel');
 }finally{await f.close();}
});
test('source selection survives leaving and remounting the page',async()=>{
 const second='a5700000-0000-4000-8000-000000000002';
 const f=await fixture({sources:[{id,name:'First',region:'in',status:'connected'},{id:second,name:'Second',region:'in',status:'connected'}]});try{
  await f.act(()=>{const select=f.w.document.querySelector('[aria-label="Source connection"]');select.value=second;select.dispatchEvent(new f.w.Event('change',{bubbles:true}));});
  await f.act(()=>f.w.auditRoot.render(null));await f.act(()=>f.w.auditMount());
  assert.equal(f.w.document.querySelector('[aria-label="Source connection"]').value,second);
  assert.equal(new URL(f.w.location.href).searchParams.get('source'),second);
 }finally{await f.close();}
});
test('discovery progress updates when execution history fails',async()=>{
 const f=await fixture({candidate:true});try{
  f.state.approved=true;f.state.failures.executions=1;
  f.state.run={id,connection_id:id,module:'Candidates',state:'running',next_page:5,received_count:40,staged_count:40,created_at:new Date().toISOString()};
  await f.act(()=>f.button('Refresh status').click());
  assert.match(f.w.document.querySelector('[aria-label="Discovery progress"]').textContent,/Reading batch 5/);
  assert.match(f.w.document.body.textContent,/Injected executions outage/);
 }finally{await f.close();}
});

test('background refresh removes records that stopped matching across loaded pages',async()=>{
 const f=await fixture({recordCount:51});try{
  await f.act(()=>{const select=f.w.document.querySelector('[aria-label="Review state"]');select.value='pending_approval';select.dispatchEvent(new f.w.Event('change',{bubbles:true}));});
  await f.act(()=>f.button('Load more records').click());
  assert.equal(f.w.document.querySelectorAll('tbody tr').length,51);
  const original=f.w.fetch;
  f.w.fetch=async(url,options)=>{
   const u=new URL(url,'http://localhost');
   if(!options?.method&&u.searchParams.get('view')==='records'){
    const first=await (await original(url,options)).json();
    const older=await (await original(url+'&before=2026-01-01',options)).json();
    return Response.json({records:[...first.records.slice(1),...older.records],total:50});
   }
   return original(url,options);
  };
  await f.act(()=>f.button('Refresh status').click());
  assert.equal(f.w.document.querySelectorAll('tbody tr').length,50);
  assert.equal(f.w.document.querySelector('[aria-label="Select source 1000"]'),null);
  assert.match(f.w.document.body.textContent,/50 displayed of 50 matching records/);
 }finally{await f.close();}
});
test('hold confirmation is disabled after refresh removes its selection',async()=>{
 const f=await fixture();try{
  await f.approve();
  await f.act(()=>f.w.document.querySelector('[aria-label="Select source 888"]').click());
  await f.act(()=>f.button('Hold').click());
  await f.act(()=>{const field=f.w.document.querySelector('dialog textarea');Object.getOwnPropertyDescriptor(f.w.HTMLTextAreaElement.prototype,'value').set.call(field,'Reviewed hold reason');field.dispatchEvent(new f.w.Event('input',{bubbles:true}));});
  f.state.changed=true;await f.act(()=>[...f.timers.values()][0]());
  assert.match(f.w.document.querySelector('#decision-description').textContent,/0 selected/);
  assert.equal(f.button('Confirm decision').disabled,true);
 }finally{await f.close();}
});
test('filter changes show loading instead of an empty result and stale total',async()=>{
 const f=await fixture();let release;try{
  const original=f.w.fetch;
  f.w.fetch=async(url,options)=>new URL(url,'http://localhost').searchParams.get('view')==='records'?new Promise(resolve=>{release=async()=>resolve(await original(url,options));}):original(url,options);
  await f.act(()=>{const select=f.w.document.querySelector('[aria-label="Review state"]');select.value='held';select.dispatchEvent(new f.w.Event('change',{bubbles:true}));});
  assert.match(f.w.document.body.textContent,/Loading records…/);
  assert.doesNotMatch(f.w.document.body.textContent,/No matching records|0 displayed of/);
  assert.equal(f.w.document.querySelector('[role="tabpanel"]').getAttribute('aria-busy'),'true');
  await f.act(()=>release());
  assert.equal(f.w.document.querySelector('[role="tabpanel"]').getAttribute('aria-busy'),'false');
 }finally{await f.close();}
});
test('closing a mobile review keeps its selected candidate available',async()=>{
 const f=await fixture({candidate:true,compact:true});try{
  await f.act(()=>f.button('Audit candidate 999').click());
  assert.equal(f.w.document.querySelector('aside').getAttribute('role'),'dialog');
  await f.act(()=>f.w.document.querySelector('[aria-label="Close record review"]').click());
  assert.equal(f.w.document.querySelector('aside').getAttribute('role'),null);
  assert.match(f.w.document.querySelector('aside').className,/hidden lg:block/);
  assert.ok(f.button('Go to candidate administration'),'Selected candidate context must survive drawer dismissal');
 }finally{await f.close();}
});

test('refresh revalidates later-page revisions and preserves other unchanged selections',async()=>{
 const f=await fixture({recordCount:51});try{
  await f.act(()=>f.button('Load more records').click());
  await f.act(()=>f.w.document.querySelector('[aria-label="Select source 1000"]').click());
  await f.act(()=>f.w.document.querySelector('[aria-label="Select source 1050"]').click());
  const original=f.w.fetch;
  f.w.fetch=async(url,options)=>{
   const response=await original(url,options);
   if(!options?.method&&new URL(url,'http://localhost').searchParams.get('view')==='records'){
    const result=await response.json();return Response.json({...result,records:result.records.map(row=>row.external_id==='1050'?{...row,revision:2}:row)});
   }
   return response;
  };
  await f.act(()=>f.button('Refresh status').click());
  assert.equal(f.w.document.querySelectorAll('tbody tr').length,51);
  assert.equal(f.w.document.querySelector('[aria-label="Select source 1000"]').checked,true);
  assert.equal(f.w.document.querySelector('[aria-label="Select source 1050"]').checked,false);
 }finally{await f.close();}
});
