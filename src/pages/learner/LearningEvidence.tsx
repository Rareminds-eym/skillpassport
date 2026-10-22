import { useEffect,useState } from 'react';
import { apiGet,apiPost } from '@/shared/api/apiClient';
import { GraduationCap,ExternalLink } from 'lucide-react';

export default function LearningEvidence({reviewMode=false}:{reviewMode?:boolean}){
 const [items,setItems]=useState<any[]>([]),[levels,setLevels]=useState<any[]>([]),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false),[page,setPage]=useState(0),[next,setNext]=useState<number|null>(null),[refresh,setRefresh]=useState(0);
 const [submissionError,setSubmissionError]=useState('');
 const [policy,setPolicy]=useState('human');
 const [sources,setSources]=useState<any[]>([]),[sourcePage,setSourcePage]=useState(0),[sourceNext,setSourceNext]=useState<number|null>(null),[sourceBusy,setSourceBusy]=useState(false);
 const [form,setForm]=useState({levelId:'',sourceKind:'training',sourceId:''});
 const [feedback,setFeedback]=useState<Record<string,string>>({});
 useEffect(()=>{let active=true;setBusy(true);setError('');
  apiGet<any>(`/learning/equivalencies?review=${reviewMode}&offset=${page}`).then(r=>{if(active){setItems(r.data?.items||[]);setNext(r.data?.nextOffset??null);setPolicy(r.data?.evaluationPolicy||'human');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;};
 },[reviewMode,page,refresh]);
 useEffect(()=>{let active=true;apiGet<any>('/learning/catalog').then(r=>{if(active)setLevels(r.data?.levels||[]);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
 useEffect(()=>{
  if(reviewMode)return;let active=true;setSourceBusy(true);
  apiGet<any>(`/learning/evidence-sources?kind=${form.sourceKind}&offset=${sourcePage}`).then(r=>{if(active){setSources(r.data?.items||[]);setSourceNext(r.data?.nextOffset??null);}}).catch(e=>{if(active){setSources([]);setError(e.message);}}).finally(()=>{if(active)setSourceBusy(false);});
  return()=>{active=false;};
 },[reviewMode,form.sourceKind,sourcePage,refresh]);
 const save=async(payload:any)=>{setBusy(true);setSubmissionError('');setError('');setSuccess('');try{const result=await apiPost<any>('/learning/equivalencies',payload);setSuccess(reviewMode?'Review recorded.':result.data?.duplicate?'This evidence already has an evaluation request.':payload.action==='requeue-ai'?'Evaluation rescheduled.':payload.action==='retry-ai'?'Evaluation requested.':'Evidence submitted for evaluation.');if(!reviewMode&&!payload.action)setForm({levelId:'',sourceKind:'training',sourceId:''});setRefresh(v=>v+1);}catch(e){setSubmissionError(e instanceof Error?e.message:'Unable to save evidence.');setRefresh(v=>v+1);}finally{setBusy(false);}};
 const input='w-full min-w-0 max-w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm';
 return <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
  <header><div className="mb-2 flex items-center gap-2"><GraduationCap size={22}/><h1 className="text-xl font-semibold text-slate-900">{reviewMode?'Equivalent learning reviews':'Equivalent learning evidence'}</h1></div>
   <p className="text-sm leading-6 text-slate-600">{reviewMode?'Review evidence from learners in your institution. Approve only when it demonstrates the selected capability and level.':policy==='ai'?'As an independent candidate, your equivalent evidence is evaluated by AI against the published level outcomes. Provide the actual work or evidence content; a credential claim or link alone cannot qualify you.':'Use another course, certification, or work sample to demonstrate a required learning level. An authorized reviewer must approve the evidence before it qualifies you for applications.'}</p>
   <button type="button" disabled={busy} onClick={()=>setRefresh(v=>v+1)} className="mt-3 text-xs font-medium text-blue-700 underline disabled:text-slate-400">Refresh evaluation status</button>
  </header>
  {(submissionError||error)&&<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submissionError||error}</p>}
  {success&&<p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
  {!reviewMode&&<form className="space-y-4 rounded-lg border border-slate-200 bg-white p-5" onSubmit={e=>{e.preventDefault();void save(form);}}>
   <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
    <label className="min-w-0 space-y-1 text-xs font-medium text-slate-700 sm:col-span-2"><span>Target capability and level</span><select required className={input} value={form.levelId} onChange={e=>setForm({...form,levelId:e.target.value})}><option value="">Select a published learning level</option>{levels.map(l=><option value={l.levelId} key={l.levelId}>{l.capabilityName} · Level {l.levelNumber} · {l.title}</option>)}</select></label>
    <label className="min-w-0 space-y-1 text-xs font-medium text-slate-700"><span>Evidence source type</span><select className={input} value={form.sourceKind} onChange={e=>{setForm({...form,sourceKind:e.target.value,sourceId:''});setSourcePage(0);setSources([]);}}><option value="training">Course or training</option><option value="certificate">Certification</option><option value="experience">Work experience</option><option value="project">Project or work sample</option></select></label>
    <label className="min-w-0 space-y-1 text-xs font-medium text-slate-700"><span>Profile evidence</span><select required disabled={sourceBusy} className={input} value={form.sourceId} onChange={e=>setForm({...form,sourceId:e.target.value})}><option value="">{sourceBusy?'Loading evidence…':'Select an existing evidence record'}</option>{sources.map(source=><option key={source.id} value={source.id}>{source.title||'Untitled evidence'}</option>)}</select></label>
    <div className="space-y-2 text-xs leading-5 text-slate-600 sm:col-span-2"><p>Add or edit the source in your profile before requesting equivalence. Its assessed revision is preserved; changing the source requires a new evaluation. {policy==='ai'?'AI evaluation requires at least 200 characters of actual evidence in the source description.':''}</p><a className="font-medium text-blue-700 underline" href="/learner/profile">Manage profile evidence</a>
     {!sourceBusy&&!sources.length&&<p>No available evidence in this category. Add it to your profile, then refresh evaluation status.</p>}
     <div className="flex gap-3"><button type="button" disabled={sourceBusy||sourcePage===0} onClick={()=>{setSourcePage(v=>Math.max(0,v-50));setForm({...form,sourceId:''});}} className="text-blue-700 disabled:text-slate-400">Previous evidence</button><button type="button" disabled={sourceBusy||sourceNext===null} onClick={()=>{if(sourceNext!==null)setSourcePage(sourceNext);setForm({...form,sourceId:''});}} className="text-blue-700 disabled:text-slate-400">More evidence</button></div>
    </div>
    <button disabled={busy||sourceBusy||!levels.length||!form.sourceId} className="justify-self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">{busy?'Submitting…':policy==='ai'?'Submit for AI evaluation':'Submit for review'}</button>
   </fieldset>
  </form>}
  <section aria-label={reviewMode?'Review queue':'Your evidence requests'} className="space-y-3">
   {!busy&&!items.length&&<p className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-500">{reviewMode?'No evidence requests in your review scope.':'No equivalent evidence submitted yet.'}</p>}
   {items.map(r=>{const level=levels.find(l=>l.levelId===r.level_id);return <article key={r.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-900">{r.title}</h2><p className="mt-1 text-xs text-slate-500">{level?`${level.capabilityName} · Level ${level.levelNumber}`:'Selected learning level'} · {r.evidence_type}</p></div><span className="rounded bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{r.status}</span></div>
    <p className="whitespace-pre-wrap break-words text-sm text-slate-600">{r.description}</p>
    {r.evidence_url&&<a className="inline-flex items-center gap-1 text-xs text-blue-700 underline" href={/^https:\/\//i.test(r.evidence_url)?r.evidence_url:undefined} target="_blank" rel="noopener noreferrer">View evidence<ExternalLink size={12}/></a>}
    {r.evidence_content&&<details className="text-xs text-slate-600"><summary className="cursor-pointer font-medium">Submitted work content</summary><p className="mt-2 whitespace-pre-wrap break-words rounded bg-slate-50 p-3">{r.evidence_content}</p></details>}
    {r.feedback&&<p className="whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-600">{r.evaluation_type==='ai'?'AI evaluation':'Reviewer feedback'}: {r.feedback}</p>}
    {!reviewMode&&policy==='ai'&&r.evaluation_type==='ai'&&r.status==='pending'&&r.ai_attempts<5&&<button type="button" disabled={busy||Boolean(r.ai_lease_until&&Date.parse(r.ai_lease_until)>Date.now())||Boolean(r.ai_next_attempt_at&&Date.parse(r.ai_next_attempt_at)>Date.now())} onClick={()=>void save({action:'retry-ai',id:r.id})} className="text-xs font-medium text-blue-700 underline disabled:text-slate-400">Retry AI evaluation</button>}
    {!reviewMode&&policy==='ai'&&r.evaluation_type==='ai'&&r.status==='pending'&&<div role="status" className="space-y-2 text-xs text-slate-500">
     <p className="text-xs leading-5">{r.ai_attempts>=5?'Automatic attempts paused. You can request another evaluation round one day after the last attempt.':'Evaluation retries automatically when due, subject to your subscription.'}</p>
     {r.ai_last_error&&<p className="text-xs leading-5">{r.ai_last_error}</p>}
     {r.ai_attempts>=5&&<button type="button" disabled={busy||!r.ai_last_attempt_at||Date.parse(r.ai_last_attempt_at)+86400000>Date.now()} onClick={()=>void save({action:'requeue-ai',id:r.id})} className="font-medium text-blue-700 underline disabled:text-slate-400">Request another evaluation round</button>}
    </div>}
    {!reviewMode&&policy==='human'&&r.evaluation_type==='ai'&&['pending','approved'].includes(r.status)&&<p className="text-xs leading-5 text-amber-800">{r.status==='pending'?'Your institution requires an authorized reviewer. This evidence is awaiting human review.':'Institutional reviewer approval is required for this evidence to qualify. Submit a request for human review.'}</p>}
    {reviewMode&&['pending','approved'].includes(r.status)&&<div className="space-y-2 border-t border-slate-100 pt-3">
     <label className="block text-xs font-medium text-slate-600">Review rationale<textarea maxLength={4000} rows={2} className={`${input} mt-1`} value={feedback[r.id]||''} onChange={e=>setFeedback({...feedback,[r.id]:e.target.value})}/></label>
     <div className="flex gap-2">{(r.status==='approved'?['revoked']:['approved','rejected']).map(decision=><button type="button" key={decision} disabled={busy||!feedback[r.id]?.trim()} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium capitalize disabled:opacity-40" onClick={()=>void save({action:'review',review:{id:r.id,version:r.version,decision,feedback:feedback[r.id]}})}>{decision==='approved'?'Approve equivalence':decision==='rejected'?'Reject':'Revoke approval'}</button>)}</div>
    </div>}
   </article>;})}
  </section>
  <nav aria-label="Evidence pages" className="flex justify-between text-sm"><button disabled={busy||page===0} className="text-blue-700 disabled:text-slate-400" onClick={()=>setPage(Math.max(0,page-25))}>Previous</button><button disabled={busy||next===null} className="text-blue-700 disabled:text-slate-400" onClick={()=>next!==null&&setPage(next)}>Next</button></nav>
 </main>;
}
