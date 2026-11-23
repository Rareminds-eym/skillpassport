import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, Clock } from 'lucide-react';
import { useLearnerCollegeCourses } from '../model/useLearnerCollegeCourses';

export default function CollegeCourseReader() {
  const { curriculumId } = useParams();
  const [params, setParams] = useSearchParams();
  const result = useLearnerCollegeCourses();
  const course = result.data?.courses.find(item => item.id === curriculumId);
  const units = course?.units || [];
  const index = Math.max(0, units.findIndex(unit => unit.id === params.get('unit')));
  const unit = units[index];
  const heading = useRef<HTMLHeadingElement>(null);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  const mobileNavigation = useRef<HTMLDetailsElement>(null);
  const previousUnit = useRef<string | null>(null);
  useEffect(() => {
    if (!course?.id) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    pageTitle.current?.focus({ preventScroll: true });
  }, [course?.id]);
  useEffect(() => {
    if (previousUnit.current && previousUnit.current !== unit?.id) heading.current?.focus({ preventScroll: true });
    previousUnit.current = unit?.id || null;
  }, [unit?.id]);
  const selectUnit = (id: string) => {
    const next = new URLSearchParams(params); next.set('unit', id); setParams(next, { replace: true });
    if (mobileNavigation.current) mobileNavigation.current.open = false;
    if (window.matchMedia('(max-width: 1023px)').matches) requestAnimationFrame(() => heading.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' }));
  };
  const navigation = () => <nav aria-label="Course units" className="divide-y divide-gray-100">{units.map((item, position) => <button key={item.id} type="button" aria-label={`Open ${item.code || `unit ${position + 1}`}: ${item.name}`} aria-current={index === position ? 'step' : undefined} onClick={() => selectUnit(item.id)} className={`block min-h-16 w-full border-l-[3px] px-5 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 ${index === position ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-transparent text-gray-700 hover:bg-gray-50'}`}><span className={`block break-words text-xs font-semibold leading-5 ${index === position ? 'text-blue-700' : 'text-gray-400'}`}>{item.code || `Unit ${position + 1}`}</span><span className="mt-1 block break-words text-sm font-medium leading-6">{item.name}</span></button>)}</nav>;
  const outcomes = course?.outcomes.filter(outcome => outcome.unit_id === unit?.id) || [];
  return <main className="min-h-screen bg-gray-50 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <Link to="/learner/my-class?tab=courses" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-gray-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to courses</Link>
      {result.isPending && <div role="status" className="space-y-6 motion-safe:animate-pulse"><span className="sr-only">Loading course...</span><div className="h-24 rounded-xl bg-gray-200" /><div className="h-96 rounded-xl bg-gray-100" /></div>}
      {result.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">This course could not be loaded. <button className="min-h-11 px-2 font-semibold underline" type="button" onClick={() => { void result.refetch(); }}>Try again</button></div>}
      {result.data && !result.error && !course && <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center"><BookOpen aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-gray-400" /><h1 className="!m-0 !text-xl !font-semibold !leading-7 text-gray-900">Course not available</h1><p className="mx-auto mt-2 max-w-lg !text-sm !leading-6 text-gray-600">{result.data.setupRequired || 'This course may no longer be published or mapped to your current enrollment.'}</p></div>}
      {course && !result.error && <>
        <header className="mb-6 border-b border-gray-200 pb-6 sm:mb-8 sm:pb-7"><p className="!text-xs !font-semibold !leading-5 text-blue-700">{course.course.course_code}</p><h1 ref={pageTitle} tabIndex={-1} className="mt-2 max-w-4xl break-words !text-2xl !font-semibold !leading-9 !tracking-tight text-gray-900 outline-none sm:!text-3xl sm:!leading-10">{course.course.course_name}</h1>
          <ul className="mt-3 flex list-none flex-wrap gap-x-4 gap-y-2 !p-0 text-sm leading-6 text-gray-500"><li>Semester {result.data?.enrollment?.semester}</li>{course.course.credits != null && <li className="border-l border-gray-300 pl-4">{course.course.credits} {course.course.credits === 1 ? 'credit' : 'credits'}</li>}<li className="border-l border-gray-300 pl-4">{course.academic_year}</li></ul>
          {course.course.description && <p className="mt-4 max-w-3xl whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{course.course.description}</p>}
        </header>
        {!units.length ? <p className="rounded-xl border border-gray-200 bg-white p-6 !text-sm !leading-6 text-gray-600">No units have been published for this course yet.</p> : <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7">
          <aside className="sticky top-24 hidden overflow-hidden rounded-2xl border border-gray-200 bg-white lg:block"><h2 className="border-b border-gray-200 px-5 py-5 !text-base !font-semibold !leading-6 text-gray-900">Course units <span className="ml-1 text-xs font-normal text-gray-400">({units.length})</span></h2>{navigation()}</aside>
          <details ref={mobileNavigation} className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:hidden"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-900 [&::-webkit-details-marker]:hidden"><span>Course units <span className="ml-2 text-xs font-normal text-gray-500">Unit {index + 1} of {units.length}</span></span><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500" /></summary>{navigation()}</details>
          <article aria-labelledby="course-unit-title" className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="px-5 py-6 sm:px-8 sm:py-7">
            <header className="border-b border-gray-200 pb-6"><p className="!text-xs !font-semibold !leading-5 text-blue-700">{unit?.code || `Unit ${index + 1}`}</p><h2 id="course-unit-title" tabIndex={-1} ref={heading} className="mt-2 scroll-mt-28 break-words !text-xl !font-semibold !leading-8 !tracking-tight text-gray-900 outline-none sm:!text-2xl">{unit?.name}</h2>{unit?.estimated_duration != null && <p className="mt-3 flex items-center gap-2 !text-sm !leading-6 text-gray-500"><Clock aria-hidden="true" className="h-4 w-4" />{unit.estimated_duration} {unit.duration_unit || 'hours'}</p>}</header>
            <div className="space-y-8 py-6 sm:py-8">
              {unit?.description && <section aria-label="Unit description"><h3 className="!m-0 !text-sm !font-semibold !leading-6 text-gray-900">Unit description</h3><p className="mt-3 max-w-prose whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600 sm:!text-base">{unit.description}</p></section>}
              <section aria-label="What you will learn"><h3 className="!m-0 !text-base !font-semibold !leading-7 text-gray-900 sm:!text-lg">What you will learn</h3>{!outcomes.length ? <p className="mt-3 !text-sm !leading-6 text-gray-500">No learning outcomes have been published for this unit yet.</p> : <ol role="list" className="mt-4 list-none space-y-5 !pl-0">{outcomes.map((outcome, position) => <li key={outcome.id} className="flex items-start gap-3 sm:gap-4"><span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 text-xs font-semibold text-blue-700">{position + 1}</span><div className="min-w-0"><p className="whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-700 sm:!text-base">{outcome.outcome_text}</p>{outcome.bloom_level && <p className="mt-1.5 !text-xs !leading-5 text-gray-500">Bloom's level: {outcome.bloom_level}</p>}</div></li>)}</ol>}</section>
            </div>
            {(index > 0 || index < units.length - 1) && <nav aria-label="Previous and next units" className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-between">
              {index > 0 ? <button type="button" aria-label={`Previous unit: ${units[index - 1].name}`} onClick={() => selectUnit(units[index - 1].id)} className="flex min-h-14 items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:max-w-[48%]"><ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block text-xs leading-5 text-gray-500">Previous unit</span><span className="block break-words text-sm font-medium leading-6">{units[index - 1].name}</span></span></button> : <span className="hidden sm:block" />}
              {index < units.length - 1 && <button type="button" aria-label={`Next unit: ${units[index + 1].name}`} onClick={() => selectUnit(units[index + 1].id)} className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-blue-600 px-4 py-3 text-left text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:max-w-[48%]"><span className="min-w-0"><span className="block text-xs leading-5 text-blue-100">Next unit</span><span className="block break-words text-sm font-medium leading-6">{units[index + 1].name}</span></span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></button>}
            </nav>}
          </div></article>
        </div>}
      </>}
    </div>
  </main>;
}
