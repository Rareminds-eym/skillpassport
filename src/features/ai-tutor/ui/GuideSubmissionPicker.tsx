import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/shared/model';
import { materialAction } from '../api/materialService';
import PanelLoadingSkeleton from './PanelLoadingSkeleton';

interface Delivery {id:string;learner:{name:string};assignment:{id:string;title:string};submissions:Array<{id:string;submitted_at:string}>}
export default function GuideSubmissionPicker({courseId,onSelect,onClose,disabled}:{courseId:string;onSelect:(id:string,label:string)=>void;onClose:()=>void;disabled:boolean}) {
  const user=useUser();const [assignment,setAssignment]=useState(''),[search,setSearch]=useState('');
  const query=useQuery({queryKey:['saved-deliveries',user?.id,courseId],queryFn:()=>materialAction<Delivery[]>('deliveries',{courseId}),enabled:!!user?.id,retry:false});
  const submitted=(query.data||[]).filter(row=>row.submissions?.length);
  const assignments=[...new Map(submitted.map(row=>[row.assignment.id,row.assignment])).values()];
  const rows=submitted.filter(row=>(!assignment||row.assignment.id===assignment)&&row.learner.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a,b)=>a.learner.name.localeCompare(b.learner.name));
  return <section aria-label="Guide a learner response" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 font-sans text-xs leading-5 text-slate-600 [&_p]:text-xs [&_p]:leading-5">
    <header className="flex items-center justify-between gap-3"><h3 className="!text-sm !font-semibold !leading-5 text-slate-900">Guide a learner response</h3><button type="button" onClick={onClose} aria-label="Close learner selection" className="text-[11px] text-slate-500">Cancel</button></header>
    <p className="text-slate-500">Choose submitted work. The response, questions and grading criteria will be loaded.</p>
    {query.isPending?<PanelLoadingSkeleton label="Loading learner submissions" variant="form"/>:query.isError?<div role="alert">Unable to load submissions. <button type="button" onClick={()=>void query.refetch()} className="text-blue-700">Retry</button></div>:!submitted.length?<p role="status">No submitted learner work is available for this course yet.</p>:<>
      <select aria-label="Guide assignment" value={assignment} onChange={e=>setAssignment(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">All assignments</option>{assignments.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <input aria-label="Search submitted learners" placeholder="Search learners…" value={search} onChange={e=>setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"/>
      <div className="max-h-64 overflow-y-auto overscroll-contain divide-y divide-slate-100 [scrollbar-width:thin]">{rows.map(row=><button key={row.id} type="button" disabled={disabled} onClick={()=>onSelect(row.submissions[0].id,`${row.learner.name} — ${row.assignment.title}`)} className="flex w-full items-center justify-between gap-3 rounded px-1 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><span className="min-w-0"><span className="block break-words font-medium text-slate-800">{row.learner.name}</span><span className="block break-words text-[11px] text-slate-500">{row.assignment.title}</span></span><span className="shrink-0 text-[11px] font-medium text-blue-700">Guide response</span></button>)}{!rows.length&&<p role="status" className="py-3">No submissions match your selection.</p>}</div>
    </>}
  </section>;
}
