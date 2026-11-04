import { Skeleton } from '@/shared/ui/skeleton';

export default function PanelLoadingSkeleton({label,variant='line'}:{label:string;variant?:'line'|'cards'|'form'|'progress'}) {
  return <div role="status" aria-label={label} className={`min-w-0 ${variant==='line'?'inline-flex w-32 items-center py-1':'w-full space-y-3 py-3'}`}>
    <span className="sr-only">{label}</span>
    {variant==='line'?<Skeleton aria-hidden="true" className="h-3 w-full bg-slate-200/70 motion-reduce:animate-none"/>:variant==='progress'?<>
      <div aria-hidden="true" className="grid grid-cols-3 gap-3">{[0,1,2].map(i=><Skeleton key={i} className="h-16 bg-slate-100 motion-reduce:animate-none"/>)}</div>
      <Skeleton aria-hidden="true" className="h-9 bg-slate-100 motion-reduce:animate-none"/>
      {[0,1,2].map(i=><Skeleton key={i} aria-hidden="true" className="h-10 bg-slate-100 motion-reduce:animate-none"/>)}</>:variant==='form'?<>
      <Skeleton aria-hidden="true" className="h-3 w-2/3 bg-slate-200/70 motion-reduce:animate-none"/>
      {[0,1,2].map(i=><Skeleton key={i} aria-hidden="true" className="h-10 bg-slate-100 motion-reduce:animate-none"/>)}</>:<>
      {[0,1,2].map(i=><div key={i} aria-hidden="true" className="space-y-3 rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-4"><Skeleton className="h-3 w-1/2 bg-slate-200/70 motion-reduce:animate-none"/><Skeleton className="h-3 w-16 bg-slate-100 motion-reduce:animate-none"/></div><Skeleton className="h-3 w-2/3 bg-slate-100 motion-reduce:animate-none"/><Skeleton className="h-7 w-24 bg-slate-100 motion-reduce:animate-none"/></div>)}</>}
  </div>;
}
