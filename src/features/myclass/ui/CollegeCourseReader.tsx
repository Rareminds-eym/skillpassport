import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { ArrowLeft, ArrowRight, BookOpen, Clock, List, X } from 'lucide-react';
import { LessonResourceFiles } from '@/features/college-lesson-plans';
import { useLearnerCollegeCourses } from '../model/useLearnerCollegeCourses';
import { getCoursePlayer } from '../model/collegeCoursePlayer';
import { CollegeCourseOutline } from './CollegeCourseOutline';
import { CollegeCourseContext } from './CollegeCourseContext';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';
const button = `inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${focus}`;

export default function CollegeCourseReader() {
  const { curriculumId } = useParams();
  const [params, setParams] = useSearchParams();
  const result = useLearnerCollegeCourses();
  const course = result.data?.courses.find(item => item.id === curriculumId);
  const player = getCoursePlayer(course, params);
  const { unit, lesson, lessons, previous, next } = player;
  const [mobileOpen, setMobileOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const fromMobile = useRef(false);
  const previousSelection = useRef('');
  const selection = `${course?.id}:${unit?.id}:${lesson?.id}`;
  useEffect(() => {
    if (previousSelection.current && previousSelection.current !== selection) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    previousSelection.current = selection;
  }, [selection]);
  const select = (unitId: string, lessonId: string | null) => {
    fromMobile.current = mobileOpen;
    const nextParams = new URLSearchParams(params);
    nextParams.set('unit', unitId);
    nextParams.set('lesson', lessonId || 'overview');
    nextParams.delete('resource'); nextParams.delete('view');
    setParams(nextParams); setMobileOpen(false);
  };
  const outline = (id: string) => course && <CollegeCourseOutline course={course} unitId={unit?.id} lessonId={lesson?.id} onSelect={select} idPrefix={id} />;
  const hasFiles = !!lesson?.resource_files?.length;
  const sections = lesson ? [
    ['Learning activities', lesson.teaching_methodology],
  ].filter(([, text]) => !!text) : [];
  return <main className="min-h-screen bg-white px-4 py-5 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1800px]">
      <Link to="/learner/my-class?tab=courses" className="mb-2 inline-flex min-h-11 items-center gap-2 rounded text-sm font-medium text-gray-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to courses</Link>
      {course && !result.error && (
        <header className="mb-6 border-b border-gray-200 pb-5 sm:mb-6 sm:pb-5"><p className="!text-xs !font-semibold !leading-5 text-blue-700">{course.course.course_code}</p><h1 tabIndex={-1} className="mt-1 max-w-4xl break-words !text-2xl !font-semibold !leading-9 text-gray-900 !outline-none">{course.course.course_name}</h1>
          <ul className="mt-2 flex list-none flex-wrap gap-x-4 gap-y-2 !p-0 text-sm leading-6 text-gray-500"><li>Semester {result.data?.enrollment?.semester}</li>{course.course.credits != null && <li className="border-l border-gray-300 pl-4">{course.course.credits} {course.course.credits === 1 ? 'credit' : 'credits'}</li>}<li className="border-l border-gray-300 pl-4">{course.academic_year}</li></ul>
          {course.course.description && <p className="mt-2 max-w-5xl whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{course.course.description}</p>}
        </header>
      )}
    </div>
    {result.isPending && <div role="status" className="mx-auto max-w-5xl space-y-5 p-8 motion-safe:animate-pulse"><span className="sr-only">Loading course...</span><div className="h-10 w-2/3 bg-gray-100" /><div className="h-96 bg-gray-100" /></div>}
    {result.error && <div role="alert" className="mx-auto max-w-3xl p-8 text-sm text-red-700">This course could not be loaded.<button className={`${button} underline`} onClick={() => { void result.refetch(); }}>Try again</button></div>}
    {result.data && !result.error && !course && <div className="mx-auto max-w-xl px-6 py-20 text-center"><BookOpen className="mx-auto mb-4 h-8 w-8 text-gray-400" aria-hidden="true" /><h2 className="!text-xl !font-semibold">Course not available</h2><p className="mt-3 !text-sm !leading-6 text-gray-500">{result.data.setupRequired || 'This course is no longer published for your enrollment.'}</p></div>}
    {course && !result.error && (unit ? <div className="mx-auto grid max-w-[1800px] items-start lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_270px] 2xl:grid-cols-[260px_minmax(0,1fr)_300px]">
      <aside className="sticky top-24 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto border-r border-gray-200 bg-white lg:block">
        <div className="px-3 pb-4 pt-3"><h2 className="!text-sm !font-semibold text-gray-900">Course content</h2><p className="mt-1 !text-xs text-gray-500">{course.units.length} units &middot; {player.lessonCount} lessons</p></div>{outline('desktop-outline')}
      </aside>
      <div className="min-w-0 lg:px-6 2xl:px-8">
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Trigger className={`flex min-h-12 w-full items-center justify-between gap-3 border-b border-gray-200 bg-white px-1 text-sm text-gray-700 lg:hidden ${focus}`}><span className="flex items-center gap-2"><List className="h-4 w-4" aria-hidden="true" />Course content</span><span className="text-xs text-gray-500">{unit.code}</span></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-gray-900/40" /><Dialog.Content onCloseAutoFocus={event => { if (fromMobile.current) { event.preventDefault(); fromMobile.current = false; requestAnimationFrame(() => heading.current?.focus()); } }} className="fixed inset-y-0 left-0 z-[60] flex w-[min(90vw,360px)] flex-col bg-white shadow-xl"><div className="flex items-start justify-between border-b border-gray-200 p-5"><div><Dialog.Title className="font-semibold text-gray-900">Course content</Dialog.Title><Dialog.Description className="mt-1 text-sm text-gray-500">{course.course.course_name}</Dialog.Description></div><Dialog.Close aria-label="Close course content" className={button}><X className="h-5 w-5" /></Dialog.Close></div><div className="min-h-0 flex-1 overflow-y-auto">{outline('mobile-outline')}</div></Dialog.Content></Dialog.Portal>
        </Dialog.Root>
        <article className="mt-5 min-w-0 bg-white pb-6 lg:mt-0" aria-labelledby="active-course-title">
          <header>
            <button type="button" onClick={() => select(unit.id, null)} className={`mb-3 rounded text-left text-sm font-medium leading-5 text-gray-500 hover:text-blue-700 ${focus}`}>{unit.code} &middot; {unit.name}</button>
            <h2 id="active-course-title" ref={heading} tabIndex={-1} className="max-w-3xl break-words !text-xl !font-semibold !leading-8 text-gray-900 !outline-none sm:!text-2xl sm:!leading-9">{lesson?.title || unit.name}</h2>
            <p className="mt-3 flex items-center gap-3 !text-xs text-gray-500">{lesson ? <>Lesson {player.lessonPosition} of {player.lessonCount}{lesson.duration_minutes != null && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{lesson.duration_minutes} min</span>}</> : 'Unit overview'}</p>
          </header>
          {lesson ? <>
            {lesson.session_objectives && <p className="mt-4 whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{lesson.session_objectives}</p>}
            <Tabs.Root key={lesson.id} defaultValue={hasFiles || lesson.resource_links?.length ? 'materials' : 'guide'} className="mt-5">
              <Tabs.List aria-label="Lesson content" className="mb-4 flex gap-6 border-b border-gray-200">
                <Tabs.Trigger value="materials" className={`college-course-tab min-h-12 border-b-2 border-transparent px-1 text-sm font-medium text-gray-500 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 ${focus}`}>Materials</Tabs.Trigger>
                <Tabs.Trigger value="guide" className={`college-course-tab min-h-12 border-b-2 border-transparent px-1 text-sm font-medium text-gray-500 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 ${focus}`}>Lesson guide</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="materials" className={focus}>
                {hasFiles && <LessonResourceFiles key={lesson.id} planId={lesson.id} files={lesson.resource_files} activeResourceId={params.get('resource') || undefined} onSelectResource={id => { const nextParams = new URLSearchParams(params); nextParams.set('resource', id); setParams(nextParams, { replace: true }); }} player />}
                {!!lesson.resource_links?.length && <section className="mt-5"><h3 className="!text-sm !font-semibold text-gray-900">Related reading</h3>{lesson.resource_links.filter(item => /^https?:\/\//i.test(item.url)).map(item => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className={`${button} mt-1 flex justify-between px-0 text-gray-700 hover:underline`}><span className="min-w-0 break-words">{item.title}</span><ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a>)}</section>}
                {!hasFiles && !lesson.resource_links?.length && <p className="py-6 !text-sm !leading-7 text-gray-500">No files or links have been added to this lesson. You can read the lesson guide.</p>}
              </Tabs.Content>
              <Tabs.Content value="guide" className={`space-y-6 py-2 ${focus}`}>
                {sections.map(([title, text]) => <section key={title}><h3 className="!text-base !font-semibold text-gray-900">{title}</h3><p className="mt-3 whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{text}</p></section>)}
                {!sections.length && <p className="!text-sm !leading-7 text-gray-500">Your educator has not added learning activities for this lesson yet.</p>}
              </Tabs.Content>
            </Tabs.Root>
          </> : <section className="mt-7"><h3 className="mb-3 !text-base !font-semibold text-gray-900">Lessons in this unit</h3>{lessons.length ? <ol className="divide-y divide-gray-100">{lessons.map((item, index) => <li key={item.id}><button type="button" onClick={() => select(unit.id, item.id)} className={`flex min-h-16 w-full items-start gap-4 py-4 text-left ${focus}`}><span className="mt-1 text-xs text-gray-400">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1 break-words text-sm font-medium leading-6 text-gray-800">{item.title}{item.duration_minutes != null && <span className="mt-1 block text-xs font-normal text-gray-500">{item.duration_minutes} min</span>}</span><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" /></button></li>)}</ol> : <p className="!text-sm !leading-7 text-gray-500">Lessons for this unit have not been published yet.</p>}</section>}
          <nav aria-label="Lesson navigation" className="mt-6 flex items-center justify-between gap-4 border-t border-gray-200 pt-5">{previous ? <button type="button" onClick={() => select(previous.unitId, previous.lessonId)} className={`${button} -ml-3 text-gray-500 hover:text-gray-900`}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Previous</button> : <Link className={`${button} -ml-3 text-gray-500`} to="/learner/my-class?tab=courses">My courses</Link>}{next ? <button type="button" onClick={() => select(next.unitId, next.lessonId)} className={`${button} bg-blue-600 px-5 text-white hover:bg-blue-700`}>{!lesson && lessons.length ? 'Start lesson' : `Next ${next.lessonId ? 'lesson' : 'unit'}`}<ArrowRight className="h-4 w-4" aria-hidden="true" /></button> : <Link to="/learner/my-class?tab=courses" className={`${button} text-blue-700`}>Back to courses<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}</nav>
          {next && <p className="mt-3 text-right !text-xs !leading-5 text-gray-400">Up next: {next.title}</p>}
        </article>
      </div>
      <div className="min-w-0 lg:col-start-2 xl:sticky xl:top-24 xl:col-start-3 xl:row-start-1"><CollegeCourseContext unit={unit} outcomes={player.outcomes} lesson={lesson} /></div>
    </div> : <p className="mx-auto max-w-3xl p-10 text-sm text-gray-500">Your college is preparing the units for this course.</p>)}
  </main>;
}
