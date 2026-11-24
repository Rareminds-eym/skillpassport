import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDown } from 'lucide-react';
import type { LessonPlanContent } from '@/features/college-lesson-plans';
import type { LearnerCollegeCourse } from '../model/collegeCourses';

const trigger = 'college-course-tab min-h-12 border-b-2 border-transparent px-1 text-sm font-medium text-gray-500 data-[state=active]:border-blue-600 data-[state=active]:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600';

export function CollegeCourseContext({ unit, outcomes, lesson }: {
  unit: LearnerCollegeCourse['units'][number];
  outcomes: LearnerCollegeCourse['outcomes'];
  lesson?: LessonPlanContent;
}) {
  const hasAssessment = Boolean(lesson?.evaluation_criteria || lesson?.evaluation_items?.length);
  return <aside aria-label="Unit details" className="min-w-0 border-t border-gray-200 px-5 py-3 sm:px-7 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto xl:border-l xl:border-t-0 xl:px-5 xl:py-0">
    <Tabs.Root defaultValue="overview" key={`${unit.id}:${lesson?.id || 'overview'}`}>
      <Tabs.List aria-label="Unit information" className="flex gap-5 border-b border-gray-200">
        <Tabs.Trigger value="overview" className={trigger}>Unit overview</Tabs.Trigger>
        {hasAssessment && <Tabs.Trigger value="assessment" className={trigger}>Assessment</Tabs.Trigger>}
      </Tabs.List>
      <Tabs.Content value="overview" className="pt-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        {unit.code && <p className="!text-xs !leading-5 text-gray-500">{unit.code}</p>}
        <h3 className="mt-2 break-words !text-lg !font-semibold !leading-7 text-gray-900">{unit.name}</h3>
        {unit.description && <p className="mt-3 whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{unit.description}</p>}
        {(unit.estimated_duration != null || unit.credits != null) && <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 !text-xs !leading-5 text-gray-500">{unit.estimated_duration != null && <span>{unit.estimated_duration} {unit.duration_unit || 'hours'}</span>}{unit.credits != null && <span>{unit.credits} {unit.credits === 1 ? 'credit' : 'credits'}</span>}</p>}
        {!!outcomes.length && <section className="mt-6 border-t border-gray-200 pt-5"><h4 className="!text-sm !font-semibold text-gray-900">Learning outcomes</h4><ul className="mt-3 list-disc space-y-3 pl-4 text-sm leading-7 text-gray-600">{outcomes.map(outcome => <li key={outcome.id} className="whitespace-pre-wrap break-words">{outcome.outcome_text}</li>)}</ul></section>}
        {lesson?.required_materials && <section className="mt-6 border-t border-gray-200 pt-5"><h4 className="!text-sm !font-semibold text-gray-900">Before you begin</h4><p className="mt-3 whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{lesson.required_materials}</p></section>}
        {lesson?.follow_up_activities && <details className="group mt-6 border-t border-gray-200"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">After this lesson<ChevronDown className="h-4 w-4 shrink-0 text-gray-500 group-open:rotate-180" aria-hidden="true" /></summary><p className="pb-4 whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{lesson.follow_up_activities}</p></details>}
      </Tabs.Content>
      {hasAssessment && <Tabs.Content value="assessment" className="space-y-5 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><h3 className="!text-base !font-semibold text-gray-900">Lesson assessment</h3>{lesson?.evaluation_criteria && <p className="whitespace-pre-wrap break-words !text-sm !leading-7 text-gray-600">{lesson.evaluation_criteria}</p>}{!!lesson?.evaluation_items?.length && <ul className="divide-y divide-gray-200">{lesson.evaluation_items.map(item => <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm leading-6 text-gray-600"><span className="min-w-0 break-words">{item.criterion}</span><span className="shrink-0 font-medium text-gray-900">{item.percentage}%</span></li>)}</ul>}</Tabs.Content>}
    </Tabs.Root>
  </aside>;
}
