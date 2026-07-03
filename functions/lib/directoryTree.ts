/**
 * Recursive Directory Tree — shared tree-assembly helpers.
 *
 * Kept deliberately separate from lib/courseAnalyticsKpis.ts (which is scoped
 * to enrollment/completion analytics: KPIs, Enrollment Overview, Course
 * Performance, Academic Status). Tree-building groups learners by the
 * application's existing ACADEMIC STRUCTURE, not by course enrollment — a
 * distinct concern with its own shared home.
 *
 * Canonical hierarchy (verified against the app's existing source of truth —
 * the same tables the learner profile-completion endpoint
 * (functions/api/learners/profile.ts) writes to, and the same tables
 * Academic Management already manages):
 *
 *   College / University (once resolved to a linked college):
 *     departments (college_id) -> programs -> program_sections
 *     (department_id, program_id, semester, section)
 *   School:
 *     school_classes (school_id, grade, section) — flat, no department level.
 *
 * "Academic Year" for the College/University shape means YEAR OF STUDY
 * (1st/2nd/3rd/4th Year), derived from program_sections.semester via the
 * standard two-semesters-per-year convention (ceil(semester/2) -> Year N) —
 * program_sections has no dedicated year-of-study column, and its
 * `academic_year` column is a free-text CALENDAR year, not year-of-study.
 *
 * Every builder fetches the full academic structure FIRST, then overlays
 * learner counts as a separate, additive step — so branches with zero
 * learners still render (count: 0), never dropped from the tree.
 */

/** Minimal shape returned by every builder — matches the frontend's DirectoryNode. */
export interface DirectoryTreeNode {
  id: string;
  label: string;
  level: string;
  icon?: string;
  childrenLabel?: string;
  selectable?: boolean;
  count: number;
  children?: DirectoryTreeNode[];
}

function yearOfStudyLabel(semester: number): string {
  const yearNumber = Math.ceil(semester / 2);
  const suffix = yearNumber === 1 ? 'st' : yearNumber === 2 ? 'nd' : yearNumber === 3 ? 'rd' : 'th';
  return `${yearNumber}${suffix} Year`;
}

/**
 * Department -> Academic Year (derived from semester) -> Section, for one
 * college. Used directly by College Admin, once per linked college by
 * University Admin, and (with `sectionIdFilter`) by college-type Educators
 * to restrict the tree to only their assigned sections.
 *
 * @param sectionIdFilter Optional allow-list of program_sections.id — when
 *   provided, only those sections (and their ancestor department/year nodes)
 *   are included. Used to scope the tree to an educator's own assignments
 *   without inventing a different hierarchy shape.
 */
export async function buildCollegeStyleDirectoryTree(
  supabase: any,
  collegeId: string,
  sectionIdFilter?: string[],
): Promise<DirectoryTreeNode[]> {
  // Step 1: this college's full department catalog — the tree's roots exist
  // regardless of whether any section under them has a learner.
  const { data: departments, error: departmentsError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('college_id', collegeId)
    .eq('status', 'active');
  if (departmentsError) throw departmentsError;
  if (!departments || departments.length === 0) return [];

  const departmentIds = departments.map((d: { id: string }) => d.id);

  // Step 2: every active section under those departments — the full
  // academic structure, independent of learner assignment. Matches the
  // existing 'departments' + 'program_sections' convention already used by
  // functions/api/college-admin/academic.ts.
  let sectionsQuery = supabase
    .from('program_sections')
    .select('id, section, semester, department_id')
    .in('department_id', departmentIds)
    .eq('status', 'active');
  if (sectionIdFilter) {
    // Educator scope: only the sections this educator actually teaches.
    if (sectionIdFilter.length === 0) return [];
    sectionsQuery = sectionsQuery.in('id', sectionIdFilter);
  }
  const { data: sections, error: sectionsError } = await sectionsQuery;
  if (sectionsError) throw sectionsError;

  // Step 3: learner counts per section — a separate, additive step. Sections
  // with zero learners simply get count 0, never dropped from the tree.
  const sectionIds = (sections || []).map((s: { id: string }) => s.id);
  const learnerCountBySectionId = new Map<string, number>();
  if (sectionIds.length > 0) {
    const { data: collegeLearners, error: learnersError } = await supabase
      .from('learners')
      .select('id, program_section_id')
      .eq('college_id', collegeId)
      .in('program_section_id', sectionIds);
    if (learnersError) throw learnersError;
    for (const learner of collegeLearners || []) {
      if (!learner.program_section_id) continue;
      learnerCountBySectionId.set(
        learner.program_section_id,
        (learnerCountBySectionId.get(learner.program_section_id) ?? 0) + 1,
      );
    }
  }

  // Assemble department_id -> yearOfStudy -> section rows.
  type SectionRow = { id: string; section: string | null; semester: number; department_id: string };
  const byDepartment = new Map<string, Map<string, SectionRow[]>>();
  for (const row of (sections || []) as SectionRow[]) {
    const label = yearOfStudyLabel(row.semester);
    if (!byDepartment.has(row.department_id)) byDepartment.set(row.department_id, new Map());
    const byYear = byDepartment.get(row.department_id)!;
    if (!byYear.has(label)) byYear.set(label, []);
    byYear.get(label)!.push(row);
  }

  return departments
    .slice()
    .sort((a: { name: string }, b: { name: string }) => (a.name || '').localeCompare(b.name || ''))
    .map((dept: { id: string; name: string }) => {
      const byYear = byDepartment.get(dept.id) ?? new Map<string, SectionRow[]>();
      const years = Array.from(byYear.entries())
        // Sort by the actual year number (1st, 2nd, 3rd...), not
        // alphabetically — "10th Year" must not sort before "2nd Year".
        .sort(([, rowsA], [, rowsB]) => Math.ceil(rowsA[0].semester / 2) - Math.ceil(rowsB[0].semester / 2))
        .map(([label, rows]) => {
          const sectionNodes: DirectoryTreeNode[] = rows
            .slice()
            .sort((a, b) => (a.section || '').localeCompare(b.section || ''))
            .map((row) => ({
              id: row.id,
              label: row.section ? `Section ${row.section}` : 'Unassigned Section',
              level: 'section',
              icon: 'users',
              selectable: true,
              count: learnerCountBySectionId.get(row.id) ?? 0,
            }));
          const yearCount = sectionNodes.reduce((sum, s) => sum + s.count, 0);
          return {
            id: `${dept.id}::${label}`,
            label,
            level: 'academic-year',
            icon: 'graduation-cap',
            childrenLabel: 'Sections',
            count: yearCount,
            children: sectionNodes,
          };
        });
      if (years.length === 0) return null;
      const deptCount = years.reduce((sum, y) => sum + y.count, 0);
      return {
        id: dept.id,
        label: dept.name || 'Untitled Department',
        level: 'department',
        icon: 'cpu',
        childrenLabel: 'Academic Years',
        count: deptCount,
        children: years,
      };
    })
    .filter((node: DirectoryTreeNode | null): node is DirectoryTreeNode => node !== null);
}

/**
 * Grade -> Section, for one school. `school_classes` has no department
 * level — grade and section live on the same row (verified: no
 * department_id column). Used directly by School Admin, and (with
 * `classIdFilter`) by school-type Educators to restrict the tree to only
 * their assigned classes.
 *
 * @param classIdFilter Optional allow-list of school_classes.id — when
 *   provided, only those classes are included. Used to scope the tree to an
 *   educator's own assignments.
 */
export async function buildSchoolStyleDirectoryTree(
  supabase: any,
  schoolId: string,
  classIdFilter?: string[],
): Promise<DirectoryTreeNode[]> {
  let classesQuery = supabase
    .from('school_classes')
    .select('id, grade, section')
    .eq('school_id', schoolId)
    .eq('account_status', 'active');
  if (classIdFilter) {
    if (classIdFilter.length === 0) return [];
    classesQuery = classesQuery.in('id', classIdFilter);
  }
  const { data: classes, error: classesError } = await classesQuery;
  if (classesError) throw classesError;
  if (!classes || classes.length === 0) return [];

  const classIds = classes.map((c: { id: string }) => c.id);
  const learnerCountByClassId = new Map<string, number>();
  const { data: schoolLearners, error: learnersError } = await supabase
    .from('learners')
    .select('id, school_class_id')
    .eq('school_id', schoolId)
    .in('school_class_id', classIds);
  if (learnersError) throw learnersError;
  for (const learner of schoolLearners || []) {
    if (!learner.school_class_id) continue;
    learnerCountByClassId.set(
      learner.school_class_id,
      (learnerCountByClassId.get(learner.school_class_id) ?? 0) + 1,
    );
  }

  // Group by grade — grade is free text (e.g. "Grade 8", "8") but every
  // class row already carries the display-ready value, so no derivation is
  // needed here (unlike College's semester -> year-of-study mapping).
  type ClassRow = { id: string; grade: string; section: string | null };
  const byGrade = new Map<string, ClassRow[]>();
  for (const row of (classes || []) as ClassRow[]) {
    if (!byGrade.has(row.grade)) byGrade.set(row.grade, []);
    byGrade.get(row.grade)!.push(row);
  }

  return Array.from(byGrade.entries())
    // Numeric-aware sort so "Grade 10" doesn't sort before "Grade 2".
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([grade, rows]) => {
      const sectionNodes: DirectoryTreeNode[] = rows
        .slice()
        .sort((a, b) => (a.section || '').localeCompare(b.section || ''))
        .map((row) => ({
          id: row.id,
          label: row.section ? `Section ${row.section}` : 'Unassigned Section',
          level: 'section',
          icon: 'users',
          selectable: true,
          count: learnerCountByClassId.get(row.id) ?? 0,
        }));
      const gradeCount = sectionNodes.reduce((sum, s) => sum + s.count, 0);
      return {
        id: `grade::${grade}`,
        label: grade,
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        count: gradeCount,
        children: sectionNodes,
      };
    });
}

/**
 * Resolves an educator's assigned program_sections.id list, for feeding into
 * buildCollegeStyleDirectoryTree's `sectionIdFilter` so the tree is scoped to
 * only what that educator teaches — without flattening straight to learner
 * ids the way functions/api/analytics/educator.ts's getFilteredLearnerRecordIds
 * does for KPI purposes. Mirrors that function's exact college-branch
 * predicate (`program_sections.faculty_id = userId AND status = 'active'`)
 * so both call sites resolve the identical set of sections — the difference
 * is this one stops at `id` instead of resolving all the way to learners.
 */
export async function resolveEducatorCollegeSectionIds(
  supabase: any,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('program_sections')
    .select('id')
    .eq('faculty_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data || []).map((row: { id: string }) => row.id);
}

/**
 * Resolves a school educator's assigned school_classes.id list, for feeding
 * into buildSchoolStyleDirectoryTree's `classIdFilter`. Mirrors
 * functions/api/analytics/educator.ts's getFilteredLearnerRecordIds school
 * branch: a school admin/school_admin role sees every class in the school;
 * any other role is restricted to `assignedClassIds` (already resolved
 * client-side by useEducatorSchool, same contract as the KPI actions).
 */
export async function resolveEducatorSchoolClassIds(
  supabase: any,
  schoolId: string,
  educatorRole: string | null | undefined,
  assignedClassIds: string[] | null | undefined,
): Promise<string[]> {
  if (educatorRole === 'admin' || educatorRole === 'school_admin') {
    const { data, error } = await supabase
      .from('school_classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('account_status', 'active');
    if (error) throw error;
    return (data || []).map((row: { id: string }) => row.id);
  }
  return assignedClassIds && assignedClassIds.length > 0 ? assignedClassIds : [];
}
