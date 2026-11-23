import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Layers, ListChecks } from 'lucide-react';
import { useLearnerCollegeCourses } from '../../model/useLearnerCollegeCourses';

export default function CollegeCoursesTab() {
  const result = useLearnerCollegeCourses();
  const [search, setSearch] = useState('');
  const enrollment = result.data?.enrollment;
  const visible = (result.data?.courses || []).filter(item => `${item.course.course_code} ${item.course.course_name}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <section aria-label="Your college courses" className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h2 className="!m-0 !text-xl !font-semibold !leading-7 text-gray-900">Your courses</h2><p className="mt-1 !text-sm !leading-6 text-gray-500">{enrollment ? <>Semester {enrollment.semester} <span className="px-1.5" aria-hidden="true">&middot;</span> {enrollment.academic_year}</> : 'Published courses for your current program and semester.'}</p></div>
      {!!result.data?.courses.length && <label className="relative block w-full sm:max-w-xs"><span className="sr-only">Search your courses</span><Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search courses" className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>}
    </div>
    {result.isPending && <div role="status" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><span className="sr-only">Loading your courses...</span>{[1, 2, 3].map(item => <div key={item} className="h-64 rounded-2xl border border-gray-200 bg-gray-50 motion-safe:animate-pulse" />)}</div>}
    {result.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">Your courses could not be loaded. <button type="button" className="min-h-11 px-2 font-semibold underline" onClick={() => { void result.refetch(); }}>Try again</button></div>}
    {result.data && !result.error && <>
      {result.data.setupRequired ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><h3 className="!m-0 !text-base !font-semibold !leading-6">Course enrollment needs attention</h3><p className="mt-1 !text-sm !leading-6">{result.data.setupRequired}</p></div> : !result.data.courses.length ? <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center"><BookOpen aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-gray-400" /><h3 className="!m-0 !text-base !font-semibold !leading-6 text-gray-900">No published courses yet</h3><p className="mx-auto mt-2 max-w-md !text-sm !leading-6 text-gray-600">Your college's published courses will appear here for your program, semester and academic year.</p></div> : <>
        {!visible.length && <p role="status" className="py-10 text-center !text-sm !leading-6 text-gray-600">No courses match your search.</p>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(item => <article key={item.id} className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-blue-300">
          <Link to={`/learner/my-class/courses/${item.id}`} aria-label={`Explore course: ${item.course.course_name}`} className="group flex h-full flex-col rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpen aria-hidden="true" className="h-5 w-5" /></span>{item.course.credits != null && <span className="text-xs font-medium text-gray-500">{item.course.credits} {item.course.credits === 1 ? 'credit' : 'credits'}</span>}</div>
            <p className="break-words !text-xs !font-semibold !leading-5 text-blue-700">{item.course.course_code}</p><h3 className="mt-2 break-words !text-lg !font-semibold !leading-7 text-gray-900 group-hover:text-blue-800">{item.course.course_name}</h3>
            {item.course.description && <p className="mt-2 line-clamp-2 break-words !text-sm !leading-6 text-gray-500">{item.course.description}</p>}
            <div className="mt-auto pt-6"><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-5 text-gray-500"><span className="inline-flex items-center gap-1.5"><Layers aria-hidden="true" className="h-3.5 w-3.5" />{item.units.length} {item.units.length === 1 ? 'unit' : 'units'}</span><span className="inline-flex items-center gap-1.5"><ListChecks aria-hidden="true" className="h-3.5 w-3.5" />{item.outcomes.length} {item.outcomes.length === 1 ? 'learning outcome' : 'learning outcomes'}</span></div><div className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm font-semibold text-blue-700">Explore course<ArrowRight aria-hidden="true" className="h-4 w-4" /></div></div>
          </Link>
        </article>)}</div>
      </>}
    </>}
  </section>;
}
