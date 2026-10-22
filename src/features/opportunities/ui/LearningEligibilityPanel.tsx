import { Link } from 'react-router-dom';
const labels:Record<string,string>={eligible:'Required learning approved',not_yet_eligible:'Reviewer approval required',unknown:'Learning verification unavailable',subscription_required:'Matching subscription required'};
export function LearningEligibilityPanel({job,compact=false}:{job:any;compact?:boolean}){
 const result=job?.learning_eligibility;
 if(!job?.learning_requirements?.length&&!result)return null;
 const state=result?.state||'unknown';
 return <section aria-label="Learning eligibility" className={`rounded-md border px-3 py-2 text-xs ${state==='eligible'?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-slate-200 bg-slate-50 text-slate-700'}`}>
  <p className="font-medium">{result?.evaluationPolicy==='ai'?(state==='eligible'?'Required learning evaluated':state==='not_yet_eligible'?'AI evaluation required':labels[state]||'Learning requirements'):labels[state]||'Learning requirements'}</p>
  {!compact&&<>
   {(result?.criteria||job.learning_requirements||[]).map((r:any)=><p key={r.levelId} className="mt-1 leading-5">{r.capabilityName} · Level {r.levelNumber}{!r.mandatory?' (preferred)':''} — {r.status==='eligible'?r.reason?.startsWith('AI_')?'AI evaluated':'Reviewer approved':r.status==='unknown'?'Content changed; employer update needed':result?.evaluationPolicy==='ai'?'AI evaluation or equivalent evidence needed':'Approval or equivalent evidence needed'}</p>)}
   <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
    <Link to="/learner/my-learning" className="underline underline-offset-2">Continue learning</Link>
    <Link to="/learner/learning-evidence" className="underline underline-offset-2">Submit equivalent evidence</Link>
   </div>
  </>}
 </section>;
}
