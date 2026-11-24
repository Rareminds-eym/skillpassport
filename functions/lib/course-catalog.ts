// Browse screens need the hierarchy summary, not lesson bodies or resource URLs.
export const COURSE_CATALOG_SELECT = `*,
  modules:course_modules(module_id,title,order_index,lessons(lesson_id,title,order_index)),
  course_skills(skill_name)`;

export function presentCatalogCourse(row: any) {
  const { course_skills, ...course } = row;
  return {
    ...course,
    skills_covered: (course_skills || []).map((skill: any) => skill.skill_name).filter(Boolean),
    modules: [...(course.modules || [])]
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((module: any) => ({
        ...module,
        lessons: [...(module.lessons || [])]
          .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)),
      })),
  };
}
