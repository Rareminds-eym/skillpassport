import { Skeleton } from '@/shared/ui/skeleton';

function Placeholder({ className = '' }: { className?: string }) {
  return <Skeleton className={`!animate-none rounded-md !bg-gray-100 ${className}`} />;
}

export function CourseCardsSkeleton() {
  return <div role="status" aria-label="Loading assigned courses" className="grid gap-5 motion-safe:animate-pulse sm:grid-cols-2 xl:grid-cols-3">
    <span className="sr-only">Loading assigned courses</span>
    {Array.from({ length: 3 }, (_, index) => <div key={index} aria-hidden="true" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="space-y-4 p-5 pb-6"><div className="flex items-center justify-between"><Placeholder className="h-11 w-11 rounded-xl" /><Placeholder className="h-6 w-24" /></div><Placeholder className="h-3 w-16" /><div className="space-y-2"><Placeholder className="h-4 w-5/6" /><Placeholder className="h-4 w-1/2" /></div><Placeholder className="h-4 w-20" /></div>
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5"><Placeholder className="h-9 w-28" /><Placeholder className="h-4 w-28" /></div>
    </div>)}
  </div>;
}

export function CurriculumSkeleton() {
  return <div role="status" aria-label="Loading course curriculum" className="space-y-4 motion-safe:animate-pulse">
    <span className="sr-only">Loading course curriculum</span>
    {[0, 1].map(index => <div key={index} aria-hidden="true" className="space-y-4 rounded-xl border border-gray-200 p-5"><Placeholder className="h-4 w-2/3" /><div className="space-y-2"><Placeholder className="h-3 w-full" /><Placeholder className="h-3 w-5/6" /><Placeholder className="h-3 w-3/4" /></div><Placeholder className="h-9 w-32" /></div>)}
  </div>;
}
