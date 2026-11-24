import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, FileText, Folder } from 'lucide-react';
import type { LearnerCollegeCourse } from '../model/collegeCourses';
import { getCoursePlayer } from '../model/collegeCoursePlayer';

export function CollegeCourseOutline({ course, unitId, lessonId, onSelect, idPrefix = 'outline' }: {
  course: LearnerCollegeCourse; unitId?: string; lessonId?: string; idPrefix?: string;
  onSelect: (unitId: string, lessonId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(unitId ? [unitId] : []));
  useEffect(() => { if (unitId) setExpanded(current => new Set([...current, unitId])); }, [unitId]);
  const { lessonsFor } = getCoursePlayer(course, new URLSearchParams());
  const row = 'flex min-h-11 w-full items-start gap-3 rounded-md px-2 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600';
  return <nav aria-label="Course units and lessons" className="divide-y divide-gray-100 pb-5">
    {course.units.map((unit, index) => {
      const lessons = lessonsFor(unit.id);
      const open = expanded.has(unit.id);
      const active = unitId === unit.id;
      return <section key={unit.id} className="py-2 pr-2">
        <button type="button" aria-expanded={open} aria-controls={open ? `${idPrefix}-${unit.id}` : undefined} onClick={() => setExpanded(current => { const next = new Set(current); if (next.has(unit.id)) next.delete(unit.id); else next.add(unit.id); return next; })} className={`${row} justify-between text-gray-800 hover:bg-gray-50`}>
          <Folder className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" /><span className="min-w-0 flex-1 break-words font-semibold leading-6">{unit.code || `Unit ${index + 1}`} {unit.name}</span>
          <ChevronDown aria-hidden="true" className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div id={`${idPrefix}-${unit.id}`} className="mb-1 ml-2 space-y-1 py-1">
          <button type="button" aria-current={active && !lessonId ? 'page' : undefined} onClick={() => onSelect(unit.id, null)} className={`${row} ${active && !lessonId ? 'border-l-2 border-blue-600 bg-gray-50 font-medium text-gray-900' : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50'}`}><BookOpen aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>Unit overview</span></button>
          {lessons.map(lesson => <button type="button" key={lesson.id} aria-current={lesson.id === lessonId ? 'page' : undefined} onClick={() => onSelect(unit.id, lesson.id)} className={`${row} ${lesson.id === lessonId ? 'border-l-2 border-blue-600 bg-gray-50 font-medium text-gray-900' : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50'}`}><FileText aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block break-words leading-5">{lesson.title}</span></span></button>)}
          {!lessons.length && <p className="px-3 py-2 text-xs leading-5 text-gray-400">No lessons yet</p>}
        </div>}
      </section>;
    })}
  </nav>;
}
