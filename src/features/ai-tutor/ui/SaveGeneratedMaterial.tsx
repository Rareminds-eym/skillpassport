import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/shared/model';
import { materialAction } from '../api/materialService';

export function AllocateSavedMaterial({ courseId, assignmentId }: { courseId: string; assignmentId: string }) {
  const user = useUser(), client = useQueryClient();
  const [open, setOpen] = useState(false), [due, setDue] = useState(''), [selected, setSelected] = useState<string[]>([]), [reviewed, setReviewed] = useState(false);
  const learners = useQuery({ queryKey: ['material-learners', user?.id, courseId], enabled: open && !!user?.id, queryFn: () => materialAction<{ learners: any[]; blockedCount: number }>('allocation-learners', { courseId }), retry: false });
  const rules = useQuery({ queryKey: ['material-rules', user?.id, assignmentId], enabled: open && !!user?.id, queryFn: () => materialAction('review-detail', { courseId, assignmentId }), retry: false });
  const mutation = useMutation({ mutationFn: () => materialAction('allocate', { courseId, assignmentId, learnerIds: selected, dueAt: new Date(due).toISOString(), reviewed }), retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ['saved-deliveries', user?.id, courseId] }) });
  if (!open) return <button type="button" className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-xs text-white" onClick={() => setOpen(true)}>Assign to learners</button>;
  return <section aria-label="Assign saved material" className="mt-3 space-y-3 rounded-lg border border-blue-100 p-3 text-xs">
    <p>Choose learners and a deadline. Saved questions stay unchanged.</p>
    {learners.isLoading || rules.isLoading ? <p role="status">Loading learners and grading rules...</p> : <>
      <details><summary>Review questions and private grading rules</summary><div className="max-h-64 overflow-auto">{rules.data?.content.questions.map((q:any)=>{const rule=rules.data.grading_rules.find((r:any)=>r.questionId===q.id);return <div key={q.id} className="my-3"><p className="font-medium">{q.position}. {q.prompt} ({q.maxMarks} marks)</p>{q.options.map((option:string,i:number)=><p key={i}>{String.fromCharCode(65+i)}) {option}</p>)}<p className="mt-1">Accepted answers: {rule?.acceptedAnswers.join('; ')||'Use the rubric'}</p><p>Rubric: {rule?.rubric}</p></div>;})}</div></details>
      {learners.data?.learners.length===0 && <p role="status">No learners have the required class or active college section mapping. Complete their mappings before assigning.</p>}
      {!!learners.data?.blockedCount && <p role="status">{learners.data.blockedCount} mapped learners need a valid class or active college section before they can receive this task.</p>}
      <button type="button" onClick={() => setSelected((learners.data?.learners || []).map(l => l.id))}>Select all mapped learners</button>
      <div className="max-h-40 space-y-2 overflow-y-auto">{learners.data?.learners.map(l => <label key={l.id} className="flex gap-2"><input type="checkbox" checked={selected.includes(l.id)} onChange={e => setSelected(old => e.target.checked ? [...old,l.id] : old.filter(id => id!==l.id))} />{l.name}</label>)}</div>
      <label className="block">Deadline<input aria-label="Assignment deadline" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>
      <label className="flex gap-2"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed the questions, answers and rubrics.</label>
      <button type="button" disabled={!due || !selected.length || !reviewed || !rules.isSuccess || mutation.isPending} onClick={() => mutation.mutate()} className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50">{mutation.isPending ? 'Assigning...' : 'Confirm assignment'}</button>
    </>}
    {mutation.isSuccess && <p role="status">Assignment confirmed for {mutation.data.learnerCount} learners.</p>}
    {(learners.error || rules.error || mutation.error) && <p role="alert">{(learners.error || rules.error || mutation.error)?.message}</p>}
  </section>;
}

export default function SaveGeneratedMaterial({ courseId, conversationId, messageId, fallback }: { courseId: string; conversationId: string; messageId: string; fallback?: React.ReactNode }) {
  const user = useUser(), client = useQueryClient();
  const capability = useQuery({ queryKey: ['saved-material-capability',user?.id], queryFn: () => materialAction<{enabled:boolean}>('capabilities'), enabled: !!user?.id, retry: false });
  const key = ['saved-material-choice',user?.id,conversationId,messageId];
  const choice = useQuery({ queryKey: key, queryFn: () => materialAction('choice', { courseId,conversationId,messageId }), enabled: !!user?.id && capability.data?.enabled===true, retry: false });
  const mutation = useMutation({ mutationFn: (action: string) => materialAction(action,{courseId,conversationId,messageId}), retry: false, onSuccess: async data => { await client.cancelQueries({queryKey:key}); client.setQueryData(key,data); void client.invalidateQueries({queryKey:['material-library',user?.id,courseId]}); } });
  if (capability.isPending) return <p role="status" className="mt-2 text-xs text-slate-500">Checking material controls...</p>;
  if (capability.isError) return <p role="alert" className="mt-2 text-xs text-red-700">Unable to verify material controls. <button type="button" onClick={() => { void capability.refetch(); }} className="underline">Retry</button></p>;
  if (!capability.data?.enabled) return <>{fallback}</>;
  const data = choice.data;
  return <div className="mt-3 border-t border-slate-100 pt-3 text-xs">
    {choice.isPending ? <p role="status">Checking saved material...</p> : data?.id ? <><p role="status">Saved independently of this conversation.</p>{data.kind==='assignment' && <AllocateSavedMaterial courseId={courseId} assignmentId={data.id} />}</> : <>
      <p>{data?.state==='deferred' ? 'Not saved to the library.' : 'Would you like to save this generated material?'}</p>
      <div className="mt-2 flex gap-2"><button type="button" disabled={mutation.isPending || choice.isError} onClick={() => mutation.mutate('save')} className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50">{mutation.isPending ? 'Saving...' : 'Save'}</button>{data?.state!=='deferred' && <button type="button" disabled={mutation.isPending || choice.isError} onClick={() => mutation.mutate('defer')}>Not now</button>}</div>
    </>}
    {(choice.error || mutation.error) && <p role="alert">{(choice.error || mutation.error)?.message}<button type="button" className="ml-2 underline" onClick={() => { mutation.reset(); void choice.refetch(); }}>Retry</button></p>}
  </div>;
}
