import SubmissionPreview from './SubmissionPreview';
import ReactMarkdown from 'react-markdown';
import { summarizeAssignmentProgress } from '../model/savedProgress';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/shared/model';
import { materialAction, submitMaterialDocument, downloadMaterialDocument } from '../api/materialService';
import { AllocateSavedMaterial } from './SaveGeneratedMaterial';

function SubmissionCard({ row, courseId, educator }: {row:any;courseId:string;educator:boolean}) {
  const user = useUser(), client = useQueryClient();
  const [file,setFile] = useState<File|null>(null), [marks,setMarks] = useState<Record<string,string>>({}), [reasons,setReasons] = useState<Record<string,string>>({}), [feedback,setFeedback] = useState(''), [reviewConfirmed,setReviewConfirmed] = useState(false);
  const submission = row.submissions?.[0], result = submission?.results?.[0];
  const refresh = () => client.invalidateQueries({queryKey:['saved-deliveries',user?.id,courseId]});
  const action = useMutation({mutationFn:async (kind:string) => {
    if (kind==='submit') { if(!file)throw new Error('Select one document'); await submitMaterialDocument(row.id,file); setFile(null); }
    if (kind==='download') await downloadMaterialDocument(submission.id,submission.file_name);
    if (kind==='retry') await materialAction('retry',{courseId,resultId:result.id});
    if (kind==='release') {
      const results=row.assignment.content.questions.map((q:any)=>{const ai=Array.isArray(result.question_results)?result.question_results.find((r:any)=>r.questionId===q.id):null;const mark=Number(marks[q.id]??ai?.marks);return {questionId:q.id,marks:mark,reason:reasons[q.id]||(reviewConfirmed&&mark===ai?.marks?'Reviewed without changes':'')};});
      if(!reviewConfirmed||results.some((r:any)=>!Number.isFinite(r.marks)||!r.reason.trim()))throw new Error('Review every question and add a reason before release');
      await materialAction('release',{courseId,resultId:result.id,results,feedback});
    }
  },retry:false,onSuccess:refresh});
  return <article className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs">
    <h4 className="font-semibold">{row.assignment.title}{educator?` - ${row.learner.name}`:''}</h4>
    <p>Due {new Date(row.due_at).toLocaleString()} · {submission?'Submitted':'Awaiting submission'}</p>
    <details><summary>Questions</summary>{row.assignment.content.questions.map((q:any)=><p key={q.id} className="my-2">{q.position}. {q.prompt}<br/>{q.options?.join(' / ')}</p>)}</details>
    {!educator&&!submission&&<><label className="block">Completed document<input aria-label={`Document for ${row.assignment.title}`} type="file" accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg" disabled={action.isPending} onChange={e=>{setFile(e.target.files?.[0]||null);e.target.value='';}} className="mt-1 block w-full"/></label>{file&&<p>{file.name}<button type="button" disabled={action.isPending} className="ml-2 underline" onClick={()=>setFile(null)}>Remove selection</button></p>}{file&&<SubmissionPreview file={file}/>}<button type="button" disabled={!file||action.isPending||Date.parse(row.due_at)<Date.now()} onClick={()=>action.mutate('submit')} className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">{action.isPending?'Submitting and evaluating...':'Submit document'}</button></>}
    {submission&&<button type="button" disabled={action.isPending} className="text-blue-700 underline" onClick={()=>action.mutate('download')}>Download submitted document</button>}
    {result&&<p role="status">Evaluation: {result.status.replace(/_/g,' ')}</p>}
    {result?.status==='released'&&<><p>Score: {result.total_marks}/{result.maximum_marks}</p><p>{result.feedback}</p><div>{result.question_results.review.map((review:any)=>{const q=row.assignment.content.questions.find((q:any)=>q.id===review.questionId);const ai=Array.isArray(result.question_results.ai)?result.question_results.ai.find((r:any)=>r.questionId===review.questionId):null;return <div key={review.questionId} className="my-2"><p>{q?.position}. {q?.prompt}: {review.marks}/{q?.maxMarks}</p><p>{ai?.feedback}</p><p>{review.reason}</p></div>;})}</div></>}
    {educator&&result&&result.status!=='released'&&<>
      {['failed','pending','evaluating'].includes(result.status)&&<button disabled={action.isPending} type="button" onClick={()=>action.mutate('retry')}>Retry evaluation (stale processing unlocks after five minutes)</button>}
      <details><summary>Review marks and release feedback</summary><p className="my-2">Download the document and verify every answer. AI marks are provisional.</p>
      {row.assignment.content.questions.map((q:any)=>{const evaluated=Array.isArray(result.question_results)?result.question_results.find((r:any)=>r.questionId===q.id):null;return <div key={q.id} className="my-3 space-y-1"><p>{q.position}. {q.prompt} ({q.maxMarks} marks)</p><p>{evaluated?.feedback}</p><label className="block">Reviewed marks<input aria-label={`Marks for question ${q.position}`} type="number" min="0" max={q.maxMarks} step="0.5" value={marks[q.id]??evaluated?.marks??''} onChange={e=>setMarks(old=>({...old,[q.id]:e.target.value}))} className="ml-2 w-20 rounded border p-1"/></label><input aria-label={`Review reason for question ${q.position}`} placeholder="Review/override reason" value={reasons[q.id]||''} onChange={e=>setReasons(old=>({...old,[q.id]:e.target.value}))} className="w-full rounded border p-2"/></div>;})}
      <textarea aria-label="Overall released feedback" value={feedback} onChange={e=>setFeedback(e.target.value)} className="w-full rounded border p-2"/>
      <label className="my-2 flex gap-2"><input type="checkbox" checked={reviewConfirmed} onChange={e=>setReviewConfirmed(e.target.checked)}/>I checked the submitted document and every question mark.</label>
      <button type="button" disabled={!reviewConfirmed||action.isPending||!['failed','review_required'].includes(result.status)} onClick={()=>action.mutate('release')} className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">Release reviewed results</button></details>
    </>}
    {action.error&&<p role="alert">{action.error.message}</p>}
  </article>;
}
export default function SavedMaterialWorkspace({courseId,educator,onFollowup}:{courseId:string;educator:boolean;onFollowup?:(prompt:string)=>void}) {
  const user=useUser(); const [kind,setKind]=useState('assignment');
  const capability=useQuery({queryKey:['saved-material-capability',user?.id],queryFn:()=>materialAction<{enabled:boolean}>('capabilities'),enabled:!!user?.id,retry:false});
  const enabled=!!user?.id&&capability.data?.enabled===true;
  const deliveries=useQuery({queryKey:['saved-deliveries',user?.id,courseId],queryFn:()=>materialAction<any[]>('deliveries',{courseId}),enabled,retry:false,refetchInterval:10000});
  const library=useQuery({queryKey:['material-library',user?.id,courseId,kind],queryFn:()=>materialAction<any[]>('library',{courseId,kind}),enabled:enabled&&educator,retry:false});
  const progress=summarizeAssignmentProgress(deliveries.data||[]);
  if(capability.isError)return <p role="alert" className="p-3 text-xs text-red-700">Unable to load saved assignments. <button type="button" onClick={()=>{void capability.refetch();}}>Retry</button></p>;
  if(!enabled)return null;
  return <section className="space-y-3 p-3" aria-label={educator?'Saved materials and learner progress':'Document assignments'}>
    {educator&&<><h3 className="text-sm font-semibold">Saved course materials</h3><select aria-label="Saved material type" value={kind} onChange={e=>setKind(e.target.value)} className="rounded border p-2 text-xs"><option value="assignment">Assignments</option><option value="lesson_plan">Lesson plans</option></select>{library.data?.map(item=><div key={item.id} className="rounded border p-3 text-xs"><p>{item.title}</p><details><summary>View saved content</summary><div className="max-h-60 overflow-auto">{kind==='lesson_plan'?<ReactMarkdown>{item.content.markdown}</ReactMarkdown>:item.content.questions.map((q:any)=><div key={q.id} className="my-2"><p>{q.position}. {q.prompt}</p>{q.options.map((option:string,i:number)=><p key={i}>{String.fromCharCode(65+i)}) {option}</p>)}</div>)}</div></details>{kind==='assignment'&&<AllocateSavedMaterial courseId={courseId} assignmentId={item.id}/>}</div>)}</>}
    {educator&&<div className="space-y-2 rounded-lg bg-blue-50 p-3 text-xs"><p>{progress.assigned} assigned ? {progress.submitted} submitted ? {progress.released} released</p><p>Average released score: {progress.average===null?'Not available':`${progress.average}%`}</p>{progress.gaps.slice(0,5).map((gap,i)=><p key={i}>{gap.question}: {gap.marks}/{gap.maximum} across {gap.responses} released responses{gap.skills.length?` ? ${gap.skills.join(', ')}`:''}</p>)}{progress.gaps.length>0&&onFollowup&&<button type="button" className="text-blue-700 underline" onClick={()=>onFollowup(`Create a targeted follow-up worksheet for these gaps from released results. Do not assume results for other learners. ${JSON.stringify(progress.gaps.slice(0,5))}`)}>Draft targeted follow-up</button>}</div>}
    <h3 className="text-sm font-semibold">{educator?'Learner submissions and results':'Your document assignments'}</h3>
    {deliveries.isPending&&<p role="status">Loading assignments...</p>}
    {deliveries.data?.map(row=><SubmissionCard key={row.id} row={row} courseId={courseId} educator={educator}/>)}
    {deliveries.data?.length===0&&<p className="text-xs text-slate-500">No assignments allocated yet.</p>}
    {(deliveries.error||library.error)&&<p role="alert" className="text-xs text-red-700">{(deliveries.error||library.error)?.message}</p>}
  </section>;
}
