import type { LearnerCollegeCourse } from './collegeCourses';

export type CourseStep = { unitId: string; lessonId: string | null; title: string };

export function getCoursePlayer(course: LearnerCollegeCourse | undefined, params: URLSearchParams) {
  const units = course?.units || [];
  const plans = course?.lesson_plans || [];
  const lessonsFor = (unitId: string) => plans.filter(plan => plan.unit_id === unitId)
    .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.title.localeCompare(b.title));
  const requestedLesson = params.get('lesson');
  const unit = units.find(item => item.id === params.get('unit')) ||
    units.find(item => lessonsFor(item.id).some(plan => plan.id === requestedLesson)) || units[0];
  const lessons = unit ? lessonsFor(unit.id) : [];
  const lesson = requestedLesson === 'overview' ? undefined : lessons.find(item => item.id === requestedLesson) || lessons[0];
  const steps: CourseStep[] = units.flatMap<CourseStep>(item => {
    const items = lessonsFor(item.id);
    return items.length ? items.map(plan => ({ unitId: item.id, lessonId: plan.id, title: plan.title })) :
      [{ unitId: item.id, lessonId: null, title: item.name }];
  });
  const position = lesson ? steps.findIndex(item => item.lessonId === lesson.id) : steps.findIndex(item => item.unitId === unit?.id);
  const previous = position > 0 ? steps[position - 1] : undefined;
  const next = !lesson && lessons.length ? steps[position] : steps[position + 1];
  const outcomes = course?.outcomes.filter(item => item.unit_id === unit?.id) || [];
  const lessonOutcomes = lesson?.selected_learning_outcomes?.length
    ? outcomes.filter(item => lesson.selected_learning_outcomes.includes(item.id)) : outcomes;
  const orderedLessons = units.flatMap(item => lessonsFor(item.id));
  return { units, unit, lesson, lessons, lessonsFor, steps, previous, next, outcomes, lessonOutcomes,
    lessonCount: orderedLessons.length, lessonPosition: lesson ? orderedLessons.findIndex(item => item.id === lesson.id) + 1 : 0 };
}
