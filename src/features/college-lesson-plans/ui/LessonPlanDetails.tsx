import type { LessonPlanContent } from '../model/types';
import { LessonResourceFiles } from './LessonResourceFiles';

const safeUrl = (value: string) => /^https?:\/\//i.test(value);
export function LessonPlanDetails({ plan, outcomes = [] }: { plan: LessonPlanContent; outcomes?: { id: string; outcome_text: string }[] }) {
  const sections = [
    ['Session objectives', plan.session_objectives], ['Teaching approach', plan.teaching_methodology],
    ['Required materials', plan.required_materials], ['Evaluation criteria', plan.evaluation_criteria],
    ['Follow-up activities', plan.follow_up_activities],
  ];
  return <div className="space-y-5 border-t border-gray-100 pt-4">
    <p className="text-sm text-gray-500">{plan.session_date}{plan.duration_minutes != null && ` · ${plan.duration_minutes} minutes`}</p>
    {sections.map(([title, value]) => value && <section key={title}><h4 className="!text-sm !font-semibold text-gray-900">{title}</h4><p className="mt-1 whitespace-pre-wrap break-words !text-sm !leading-6 text-gray-600">{value}</p></section>)}
    {!!outcomes.length && <section><h4 className="!text-sm !font-semibold text-gray-900">Learning outcomes</h4><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-600">{outcomes.filter(item => plan.selected_learning_outcomes?.includes(item.id)).map(item => <li key={item.id}>{item.outcome_text}</li>)}</ul></section>}
    {!!plan.evaluation_items?.length && <section><h4 className="!text-sm !font-semibold text-gray-900">Evaluation weightages</h4><ul className="mt-2 space-y-2 text-sm text-gray-600">{plan.evaluation_items.map(item => <li key={item.id}>{item.criterion}: {item.percentage}%</li>)}</ul></section>}
    {!!plan.resource_links?.length && <section><h4 className="!text-sm !font-semibold text-gray-900">Resource links</h4><ul className="mt-2 space-y-2 text-sm">
      {plan.resource_links?.filter(item => safeUrl(item.url)).map(item => <li key={item.id}><a className="break-words text-indigo-700 underline" href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></li>)}
    </ul></section>}
    {!!plan.resource_files?.length && <LessonResourceFiles planId={plan.id} files={plan.resource_files} />}
  </div>;
}
