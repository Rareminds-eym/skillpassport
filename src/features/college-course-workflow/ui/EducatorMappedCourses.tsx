import { useUser } from '@/shared/model/authStore';
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { ReviewHistory } from './ReviewHistory';
import { reviewDecisions } from '../lib/reviewHistory';
import { BookOpenIcon, MagnifyingGlassIcon, ArrowRightIcon, PlusIcon, XMarkIcon, PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient, useIsMutating } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { courseWorkflow } from '../api/courseWorkflow';
import type { CourseCurriculum, MappedCourse } from '../model/types';
import { CurriculumFormDialog } from './CurriculumFormDialog';
import { AddCurriculumContent } from './AddCurriculumContent';
import { CourseCardsSkeleton, CurriculumSkeleton } from './CourseSkeletons';

type CurriculumEdit = { curriculum: string; type: 'unit' | 'outcome'; id: string; name: string; text: string };
const secondaryAction = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50';

function CurriculumContent({ course }: { course: MappedCourse }) {
  const actor = useUser();
  const client = useQueryClient();
  const content = useQuery({ queryKey: ['mapped-course-content',actor?.id,course.id,course.program_id],queryFn: () => courseWorkflow.content(course.id,course.program_id!),refetchInterval: 15000 });
  const [params] = useSearchParams();
  const [view, setView] = useState(params.get('reviewChange') ? 'decisions' : 'curriculum');
  const requestedDecision = params.get('reviewChange');
  useEffect(() => { if (requestedDecision) setView('decisions'); }, [requestedDecision]);
  const decisions = actor?.id ? reviewDecisions((content.data || []).map(curriculum => ({ ...curriculum, course: { course_name: course.title } })), actor.id) : [];
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const [edit,setEdit] = useState<CurriculumEdit | null>(null);
  const proposal = useMutation({ mutationFn: (value: CurriculumEdit) => courseWorkflow.propose(value.curriculum,value.type,value.id,value.type === 'unit' ? { name:value.name.trim(),description:value.text.trim() } : { outcome_text:value.text.trim() }),onSuccess: () => { setEdit(null);void client.invalidateQueries({queryKey:['mapped-course-content']});void client.invalidateQueries({queryKey:['college-course-admin']}); } });
  const startEdit = (value: CurriculumEdit) => { editTrigger.current = document.activeElement as HTMLButtonElement; proposal.reset();setEdit(value); };
  const editForm = (id: string) => edit?.id === id && <CurriculumFormDialog open title={edit.type === 'unit' ? 'Edit unit' : 'Edit learning outcome'}
    description={course.title} formLabel="Propose curriculum change" pending={proposal.isPending}
    disabled={edit.type === 'unit' ? !edit.name.trim() : !edit.text.trim()} error={proposal.error?.message}
    returnFocus={editTrigger} cancelLabel="Cancel edit" onClose={() => { setEdit(null); proposal.reset(); }}
    onSubmit={event => { event.preventDefault(); proposal.mutate(edit); }}>
      {edit.type === 'unit' && <label className="block text-sm font-medium text-gray-700">Unit name<input autoFocus required maxLength={255} className="mt-1.5 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" value={edit.name} onChange={event => setEdit({...edit,name:event.target.value})}/></label>}
      <label className="block text-sm font-medium text-gray-700">{edit.type === 'unit' ? 'Unit description' : 'Learning outcome'}<textarea autoFocus={edit.type === 'outcome'} required={edit.type === 'outcome'} maxLength={10000} rows={4} className="mt-1.5 block w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" value={edit.text} onChange={event => setEdit({...edit,text:event.target.value})}/></label>
  </CurriculumFormDialog>;
  return <Tabs.Root value={view} onValueChange={setView} className="space-y-5">
    {content.isPending && <CurriculumSkeleton />}
    {content.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{content.error.message} <button className="min-h-11 px-2 font-semibold underline" onClick={() => { void content.refetch(); }}>Try again</button></div>}
    {content.data && <Tabs.List aria-label="Course curriculum and review decisions" className="flex border-b border-gray-200">
      <Tabs.Trigger value="curriculum" className="min-h-11 flex-1 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Curriculum</Tabs.Trigger>
      <Tabs.Trigger value="decisions" className="min-h-11 flex-1 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-gray-500 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Review decisions{decisions.length > 0 && ` (${decisions.length})`}</Tabs.Trigger>
    </Tabs.List>}
    <Tabs.Content value="curriculum" className="space-y-5">
    {content.data?.length === 0 && course.can_propose_edits && <AddCurriculumContent course={course} emptyState />}
    {content.data?.length===0 && !course.can_propose_edits && <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center"><BookOpenIcon aria-hidden="true" className="mx-auto mb-3 h-9 w-9 text-gray-300" /><h3 className="text-base font-semibold text-gray-800">Curriculum not available yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">No curriculum content has been added for this course yet.</p><p className="mt-2 text-xs text-gray-500">{course.can_propose_edits ? 'Use Add unit to submit the first unit and learning outcomes for approval.' : 'Your college administrator needs to add units and learning outcomes.'}</p></div>}

    {proposal.isSuccess && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 !text-sm !leading-6 text-green-800">Change submitted for admin approval. Current content is unchanged.</p>}
    {content.data?.map((curriculum: CourseCurriculum) => {
      const pending = (curriculum.pending_changes || []).filter(request => request.requested_by === actor?.id && (!request.status || request.status === 'pending'));
      const pendingFor = (id: string) => pending.some(request => request.entity_id === id);
      return <section key={curriculum.id} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div><h3 className="!m-0 !text-base !font-semibold text-gray-900">{curriculum.academic_year}</h3><p className="mt-1 !text-xs text-gray-500">{curriculum.units.length} {curriculum.units.length === 1 ? 'unit' : 'units'} &middot; {curriculum.outcomes.length} learning outcomes</p></div>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">{curriculum.status.replaceAll('_',' ')}</span>
        </div>
        {pending.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p className="!text-sm font-semibold text-amber-900">Awaiting administrator approval ({pending.length})</p><ul className="mt-2 space-y-1">{pending.map(request => <li key={request.id} className="!text-xs !leading-5 text-amber-800">{request.change_type.includes('add') ? 'Addition' : 'Edit'}: {request.data?.after?.name || request.data?.after?.outcome_text || (request.change_type.startsWith('unit') ? 'Unit' : 'Learning outcome')}</li>)}</ul></div>}
        <AddCurriculumContent course={course} curriculum={curriculum} emptyState={curriculum.units.length === 0} />
        {!curriculum.units.length && !course.can_propose_edits && <p className="rounded-lg border border-dashed border-gray-200 p-5 !text-sm !leading-6 text-gray-500">No approved units yet. Submitted units appear here after administrator approval.</p>}
        {curriculum.units.map((unit,index) => {
          const outcomes = curriculum.outcomes.filter(outcome => outcome.unit_id === unit.id);
          return <article key={unit.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-4">
              <div className="min-w-0"><p className="!text-xs font-semibold text-indigo-600">{unit.code || 'Unit '+(index+1)}</p><h4 className="mt-1 !text-base !font-semibold !leading-6 text-gray-900">{unit.name}</h4><p className="mt-1 !text-xs !leading-5 text-gray-500">{outcomes.length} learning outcomes{unit.credits != null && <> &middot; {unit.credits} {unit.credits === 1 ? 'credit' : 'credits'}</>}{unit.estimated_duration != null && <> &middot; {unit.estimated_duration} {unit.duration_unit || 'hours'}</>}</p></div>
              {course.can_propose_edits && <button aria-label="Propose unit edit" disabled={proposal.isPending || Boolean(edit) || pendingFor(unit.id)} className={secondaryAction} onClick={() => startEdit({curriculum:curriculum.id,type:'unit',id:unit.id,name:unit.name,text:unit.description || ''})}><PencilSquareIcon aria-hidden="true" className="h-4 w-4" />{pendingFor(unit.id) ? 'Pending' : 'Edit unit'}</button>}
            </div>
            <div className="space-y-4 p-4">
              {unit.description && <p className="whitespace-pre-wrap !text-sm !leading-6 text-gray-600">{unit.description}</p>}
              {editForm(unit.id)}
              <div className="border-t border-gray-100 pt-4"><h5 className="mb-3 !text-xs !font-semibold uppercase tracking-wide text-gray-500">Learning outcomes</h5>
                {!outcomes.length && <p className="mb-3 !text-sm text-gray-500">No learning outcomes yet.</p>}
                <ol className="space-y-3">{outcomes.map((outcome,n) => <li key={outcome.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex items-start gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-500">{n+1}</span><div className="min-w-0 flex-1"><p className="whitespace-pre-wrap !text-sm !leading-6 text-gray-800">{outcome.outcome_text}</p>
                    {(outcome.bloom_level || outcome.assessment_mappings?.length) && <div className="mt-2 flex flex-wrap gap-1.5">{outcome.bloom_level && <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">{outcome.bloom_level}</span>}{outcome.assessment_mappings?.map((mapping,i) => <span key={i} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{mapping.assessmentType}{mapping.weightage != null && ' '+mapping.weightage+'%'}</span>)}</div>}
                    {course.can_propose_edits && <button aria-label="Propose outcome edit" disabled={proposal.isPending || Boolean(edit) || pendingFor(outcome.id)} className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50" onClick={() => startEdit({curriculum:curriculum.id,type:'outcome',id:outcome.id,name:'',text:outcome.outcome_text})}><PencilSquareIcon aria-hidden="true" className="h-3.5 w-3.5" />{pendingFor(outcome.id) ? 'Pending review' : 'Edit outcome'}</button>}
                  </div></div><div className={edit?.id === outcome.id ? 'mt-3' : ''}>{editForm(outcome.id)}</div>
                </li>)}</ol>
              </div>
              <AddCurriculumContent course={course} curriculum={curriculum} unitId={unit.id} />
            </div>
          </article>;
        })}
      </section>;
    })}
    </Tabs.Content>
    <Tabs.Content value="decisions" className="space-y-4"><ReviewHistory decisions={decisions} filter /></Tabs.Content>
  </Tabs.Root>;
}

function RaremindsContent({ course }: { course: MappedCourse }) {
  const actor = useUser();
  const content = useQuery({ queryKey: ['mapped-rareminds-content',actor?.id,course.id],queryFn: () => courseWorkflow.raremindsContent(course.id) });
  return <div className="space-y-3">
    {content.isPending && <CurriculumSkeleton />}
    {content.error && <p role="alert">{content.error.message} <button onClick={() => { void content.refetch(); }}>Try again</button></p>}
    {content.data?.length===0 && <p>No modules have been added to this course.</p>}
    {content.data?.map(module => <details key={module.module_id} className="rounded border p-3"><summary>{module.title}</summary><p>{module.description}</p>{module.lessons.map(lesson => <div key={lesson.lesson_id} className="mt-3 space-y-2"><h4 className="font-medium">{lesson.title}</h4><p>{lesson.description}</p>{lesson.content && <iframe title={`${lesson.title} content`} sandbox="" referrerPolicy="no-referrer" className="h-96 w-full rounded border" srcDoc={lesson.content}/>} {lesson.lesson_resources.map(resource => /^https?:\/\//i.test(resource.url) && <a className="block underline" key={resource.resource_id} href={resource.url} target="_blank" rel="noopener noreferrer">{resource.name}</a>)}</div>)}</details>)}
  </div>;
}

export function EducatorMappedCourses({ embedded = false }: { embedded?: boolean } = {}) {
  const actor = useUser();
  const submitting = useIsMutating() > 0;
  const courses = useQuery({ queryKey: ['educator-mapped-courses',actor?.id],queryFn: courseWorkflow.courses });
  const [ownership,setOwnership] = useState<'institution' | 'rareminds'>('institution');
  const [selected,setSelected] = useState<MappedCourse | null>(null);
  const [params, setParams] = useSearchParams();
  const notificationCourse = params.get('courseId');
  const notificationProgram = params.get('programId');
  useEffect(() => {
    if (!params.get('reviewChange') || !notificationCourse || !courses.data) return;
    const course = courses.data.courses.find(item => item.id === notificationCourse && item.program_id === notificationProgram);
    if (course) { setOwnership('institution'); setSelected(course); }
  }, [notificationCourse, notificationProgram, params, courses.data]);
  const courseButton = useRef<HTMLButtonElement | null>(null);
  const [search,setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [semester, setSemester] = useState('');
  const [permission, setPermission] = useState('');
  const assigned = courses.data?.courses.filter(course => course.ownership === ownership) || [];
  const departments = [...new Map(assigned.filter(course => course.department_id).map(course => [course.department_id!, course.department_name || course.department_code || 'Department'])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const programs = [...new Map(assigned.filter(course => course.program_id && (!department || course.department_id === department)).map(course => [course.program_id!, course.program_name || course.program_code || 'Program'])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const semesters = [...new Set(assigned.filter(course => (!department || course.department_id === department) && (!program || course.program_id === program)).map(course => course.semester).filter((value): value is number => value !== null))].sort((a, b) => a - b);
  const hasFilters = Boolean(search || department || program || semester || permission);
  const clearFilters = () => { setSearch(''); setDepartment(''); setProgram(''); setSemester(''); setPermission(''); };
  const visible = assigned.filter(course => `${course.title} ${course.code} ${course.program_name || ''} ${course.department_name || ''}`.toLowerCase().includes(search.trim().toLowerCase())
    && (ownership !== 'institution' || ((!department || course.department_id === department) && (!program || course.program_id === program) && (!semester || String(course.semester) === semester) && (!permission || course.can_propose_edits === (permission === 'edit')))));
  return <section aria-label="Mapped courses" className="space-y-5">
    {!embedded && <><h1 className="text-2xl font-semibold">Courses</h1>
    <p>View the courses mapped to you. College course edits require admin approval; Rareminds courses are read only.</p></>}
    {!embedded && <div role="tablist" aria-label="Course ownership" className="flex gap-3 border-b">
      {([['institution','College Course'],['rareminds','Resource Studio']] as const).map(([value,label]) => <button key={value} id={`ownership-${value}`} role="tab" aria-selected={ownership===value} aria-controls="mapped-courses-panel" tabIndex={ownership===value ? 0 : -1} className={`px-4 py-3 ${ownership===value ? 'border-b-2 border-indigo-600 font-semibold' : ''}`} onClick={() => { setOwnership(value);setSelected(null); }} onKeyDown={event => {
        if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault();const next = event.key==='Home' ? 'institution' : event.key==='End' ? 'rareminds' : ownership==='institution' ? 'rareminds' : 'institution';setOwnership(next);setSelected(null);document.getElementById(`ownership-${next}`)?.focus(); }
      }}>{label}</button>)}
    </div>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:max-w-lg"><span className="sr-only">Search mapped courses</span><MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" /><input placeholder="Search courses by name or code…" className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={search} onChange={event => setSearch(event.target.value)}/></label>
      {courses.data && <p role="status" className="!text-sm !leading-5 text-gray-500">{visible.length} of {assigned.length} assigned courses</p>}
    </div>
    {ownership === 'institution' && <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1fr_1fr_auto]">
      <label className="min-w-0 text-xs font-medium text-gray-500">Department<select aria-label="Filter by department" value={department} disabled={courses.isPending} onChange={event => { setDepartment(event.target.value); setProgram(''); setSemester(''); }} className="mt-1.5 min-h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"><option value="">All departments</option>{departments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="min-w-0 text-xs font-medium text-gray-500">Program<select aria-label="Filter by program" value={program} disabled={courses.isPending} onChange={event => { setProgram(event.target.value); setSemester(''); }} className="mt-1.5 min-h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"><option value="">All programs</option>{programs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="min-w-0 text-xs font-medium text-gray-500">Semester<select aria-label="Filter by semester" value={semester} disabled={courses.isPending} onChange={event => setSemester(event.target.value)} className="mt-1.5 min-h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"><option value="">All semesters</option>{semesters.map(value => <option key={value} value={value}>Semester {value}</option>)}</select></label>
      <label className="min-w-0 text-xs font-medium text-gray-500">Access<select aria-label="Filter by access" value={permission} disabled={courses.isPending} onChange={event => setPermission(event.target.value)} className="mt-1.5 min-h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"><option value="">All access</option><option value="read">Read only</option><option value="edit">Add &amp; edit</option></select></label>
      <button type="button" onClick={clearFilters} disabled={!hasFilters} className="min-h-11 self-end rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:text-gray-400">Clear filters</button>
    </div>}
    {courses.isPending && <CourseCardsSkeleton />}
    {courses.error && <div role="alert">{courses.error.message} <button onClick={() => { void courses.refetch(); }}>Try again</button></div>}
    <div role={embedded ? undefined : 'tabpanel'} id={embedded ? undefined : 'mapped-courses-panel'} aria-labelledby={embedded ? undefined : `ownership-${ownership}`} tabIndex={0} className="space-y-4">
      {courses.data && !visible.length && <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center"><BookOpenIcon aria-hidden="true" className="mx-auto mb-3 h-9 w-9 text-gray-300" /><p className="!text-sm text-gray-500">{hasFilters ? 'No courses match your filters.' : `No ${ownership==='institution' ? 'college' : 'Rareminds'} courses mapped to you.`}</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-3 min-h-11 px-3 text-sm font-medium text-indigo-600">Clear all filters</button>}</div>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(course => <article key={`${course.id}-${course.program_id}-${course.semester}`} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex-1 p-5 pb-6">
          <div className="mb-4 flex items-center justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpenIcon aria-hidden="true" className="h-6 w-6" /></span><span title={course.can_propose_edits ? 'Add units and propose curriculum changes. Administrator approval required.' : 'View the course curriculum.'} className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium leading-4 ${course.can_propose_edits ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{course.can_propose_edits ? <PencilSquareIcon aria-hidden="true" className="h-3.5 w-3.5" /> : <EyeIcon aria-hidden="true" className="h-3.5 w-3.5" />}{course.can_propose_edits ? 'Add & edit' : 'Read only'}</span></div>
          <p className="mb-2 !text-xs !leading-5 font-semibold tracking-wide text-indigo-600">{course.code}</p>
          <h2 className="!text-base !leading-6 font-semibold text-gray-900">{course.title}</h2>
          {course.semester && <p className="mt-2 !text-sm !leading-5 text-gray-500">Semester {course.semester}</p>}
          {(course.program_name || course.department_name) && <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">{course.program_name && <p className="!text-xs !leading-5 text-gray-600">{course.program_name}</p>}{course.department_name && <p className="!text-xs !leading-5 text-gray-400">{course.department_name}</p>}</div>}
          {course.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{course.description}</p>}

        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/40 px-5 py-3.5">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" onClick={event => { courseButton.current = event.currentTarget; setSelected(course); }}>View course<ArrowRightIcon aria-hidden="true" className="h-3.5 w-3.5" /></button>
          {course.ownership==='institution' && <Link className="inline-flex items-center gap-1.5 rounded px-1 py-2 text-xs font-medium text-gray-600 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600" to={`/educator/college-assignments?courseId=${course.id}&programId=${course.program_id}`}><PlusIcon aria-hidden="true" className="h-3.5 w-3.5" />Create assignment</Link>}
        </div>
      </article>)}</div>
      <Dialog.Root open={Boolean(selected)} onOpenChange={open => { if (!open && !submitting) { setSelected(null); const next = new URLSearchParams(params); next.delete('reviewChange'); next.delete('courseId'); next.delete('programId'); setParams(next, { replace: true }); } }}><Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/50" />
        <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); courseButton.current?.focus(); }} className="fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-2xl flex-col bg-white shadow-2xl focus:outline-none">
          {selected && <>
            <div className="shrink-0 border-b border-gray-200 p-4 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">{selected.code}</span><Dialog.Close disabled={submitting} aria-label="Close course" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"><XMarkIcon className="h-5 w-5" /></Dialog.Close></div><Dialog.Title className="!text-xl !leading-7 font-semibold text-gray-900">{selected.title}</Dialog.Title><Dialog.Description className="mt-2 !text-sm !leading-6 text-gray-500">{selected.semester ? `Semester ${selected.semester} · ` : ''}{selected.can_propose_edits ? 'Propose edits · administrator approval required' : 'Read-only curriculum access'}</Dialog.Description></div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">{selected.description && <p className="text-sm leading-6 text-gray-600">{selected.description}</p>}{selected.ownership !== 'institution' && <h2 className="!text-sm !leading-5 font-semibold text-gray-900">Course curriculum</h2>}{selected.ownership==='institution' ? <CurriculumContent key={`${selected.id}-${selected.program_id}`} course={selected}/> : <RaremindsContent key={selected.id} course={selected}/>}</div>

          </>}
        </Dialog.Content>
      </Dialog.Portal></Dialog.Root>
    </div>
  </section>;
}

