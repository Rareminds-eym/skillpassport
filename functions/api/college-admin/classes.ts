import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

type EducatorType = 'school' | 'college';

async function calculateLearnerProgress(
  supabase: ReturnType<typeof getServiceClient>,
  learnerId: string,
  classId: string,
): Promise<number> {
  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('assignment_id, assign_classes')
      .eq('assign_classes', classId)
      .eq('is_deleted', false);

    if (assignmentsError || !assignments || assignments.length === 0) return 0;

    const assignmentIds = assignments.map((a: any) => a.assignment_id);

    const { data: learnerAssignments, error: learnerError } = await supabase
      .from('learner_assignments')
      .select('assignment_id, status, grade_percentage')
      .eq('learner_id', learnerId)
      .in('assignment_id', assignmentIds)
      .eq('is_deleted', false);

    if (learnerError || !learnerAssignments || learnerAssignments.length === 0) return 0;

    const totalAssignments = assignments.length;
    const completedCount = learnerAssignments.filter(
      (sa: any) => sa.status === 'graded' || sa.status === 'submitted',
    ).length;
    const gradeSum = learnerAssignments
      .filter((sa: any) => sa.grade_percentage !== null)
      .reduce((sum: number, sa: any) => sum + (sa.grade_percentage || 0), 0);
    const gradedCount = learnerAssignments.filter((sa: any) => sa.grade_percentage !== null).length;

    const completionRate = (completedCount / totalAssignments) * 100;
    const averageGrade = gradedCount > 0 ? gradeSum / gradedCount : 0;
    const progress = completionRate * 0.5 + averageGrade * 0.5;

    return Math.round(progress);
  } catch {
    return 0;
  }
}

function transformDBClassToClass(dbClass: any, educatorType: EducatorType = 'school') {
  const metadata = dbClass.metadata || {};

  let educatorName = 'TBD';
  let educatorEmail = 'Not assigned';

  if (educatorType === 'school') {
    educatorName =
      dbClass.class_teacher_first_name && dbClass.class_teacher_last_name
        ? `${dbClass.class_teacher_first_name} ${dbClass.class_teacher_last_name}`.trim()
        : 'TBD';
    educatorEmail = dbClass.class_teacher_email || 'Not assigned';
  } else {
    educatorName =
      dbClass.faculty_first_name && dbClass.faculty_last_name
        ? `${dbClass.faculty_first_name} ${dbClass.faculty_last_name}`.trim()
        : 'TBD';
    educatorEmail = dbClass.faculty_email || 'Not assigned';
  }

  return {
    id: dbClass.id,
    name: dbClass.name || `Grade ${dbClass.grade} - ${dbClass.section || 'General'}`,
    course: dbClass.grade || 'General',
    educator: educatorName,
    educatorEmail,
    department: dbClass.section || 'General',
    year: dbClass.academic_year || String(new Date().getFullYear()),
    status: metadata.status || 'Active',
    total_learners: dbClass.current_learners || 0,
    max_learners: dbClass.max_learners || 40,
    avg_progress: 0,
    performance_band: 'Low',
    skillAreas: metadata.skillAreas || [],
    lastUpdated: dbClass.updated_at || new Date().toISOString(),
    learners: [] as any[],
    tasks: [] as any[],
    notes: [] as any[],
  };
}

function computeAggregates(classItem: any) {
  const total = classItem.learners.length;
  const avg =
    total === 0
      ? 0
      : Math.round(classItem.learners.reduce((acc: number, curr: any) => acc + curr.progress, 0) / total);
  let band = 'Low';
  if (avg >= 70) band = 'High';
  else if (avg >= 40) band = 'Medium';
  return { total, avg, band };
}

function syncClassAggregates(classItem: any) {
  const { total, avg, band } = computeAggregates(classItem);
  classItem.total_learners = total;
  classItem.avg_progress = avg;
  classItem.performance_band = band;
  return classItem;
}

async function fetchClassLearners(
  supabase: ReturnType<typeof getServiceClient>,
  classId: string,
  educatorType: EducatorType = 'school',
) {
  const classIdField = educatorType === 'school' ? 'school_class_id' : 'college_class_id';

  const { data, error } = await supabase
    .from('learners')
    .select('id, name, email, updated_at, user_id')
    .eq(classIdField, classId);

  if (error || !data) return [];

  const learnersWithProgress = await Promise.all(
    data.map(async (learner: any) => {
      const progress = await calculateLearnerProgress(supabase, learner.user_id || learner.id, classId);
      return {
        id: learner.id,
        name: learner.name || 'Unknown',
        email: learner.email || '',
        progress,
        lastActive: learner.updated_at || new Date().toISOString(),
      };
    }),
  );

  return learnersWithProgress;
}

async function fetchClassTasks(
  supabase: ReturnType<typeof getServiceClient>,
  classId: string,
) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('assign_classes', classId)
    .eq('is_deleted', false)
    .order('due_date', { ascending: true });

  if (error || !data) return [];

  return data.map((assignment: any) => ({
    id: assignment.assignment_id,
    name: assignment.title,
    dueDate: assignment.due_date,
    skillTags: assignment.skill_outcomes || [],
    referenceLink: assignment.document_pdf || undefined,
    status: assignment.is_deleted ? 'Completed' : 'Pending',
  }));
}

async function getSchoolClassById(supabase: ReturnType<typeof getServiceClient>, classId: string) {
  const { data, error } = await supabase
    .from('school_classes')
    .select(
      `*,
      class_teacher:school_educator_class_assignments(
        educator:school_educators(
          first_name,
          last_name,
          email
        )
      )`,
    )
    .eq('id', classId)
    .eq('school_educator_class_assignments.is_primary', true)
    .maybeSingle();

  if (error || !data) return null;

  const classTeacher = data.class_teacher?.[0]?.educator;
  return {
    ...data,
    class_teacher_first_name: classTeacher?.first_name,
    class_teacher_last_name: classTeacher?.last_name,
    class_teacher_email: classTeacher?.email,
  };
}

async function getCollegeClassById(supabase: ReturnType<typeof getServiceClient>, classId: string) {
  const { data, error } = await supabase
    .from('college_classes')
    .select(
      `*,
      faculty:college_faculty_class_assignments(
        lecturer:college_lecturers(
          first_name,
          last_name,
          email
        )
      )`,
    )
    .eq('id', classId)
    .eq('college_faculty_class_assignments.is_class_teacher', true)
    .maybeSingle();

  if (error || !data) return null;

  const faculty = data.faculty?.[0]?.lecturer;
  return {
    ...data,
    faculty_first_name: faculty?.first_name,
    faculty_last_name: faculty?.last_name,
    faculty_email: faculty?.email,
  };
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      // ═══════════════════════════════════════════════════════════════
      //  EDUCATOR CLASSES (school + college via educatorType)
      // ═══════════════════════════════════════════════════════════════

      case 'get-educator-assigned-class-ids': {
        const { educator_id, educator_type } = params;
        if (!educator_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing educator_id or educator_type', context.request, { startTime });
        }

        const table = educator_type === 'school' ? 'school_educator_class_assignments' : 'college_faculty_class_assignments';
        const idField = educator_type === 'school' ? 'educator_id' : 'faculty_id';

        const { data, error } = await supabase
          .from(table)
          .select('class_id')
          .eq(idField, educator_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess((data || []).map((r: any) => r.class_id), context.request, { startTime });
      }

      case 'fetch-educator-classes': {
        const { school_id, college_id, educator_id, educator_type } = params;
        if (!educator_id || !educator_type) {
          return apiSuccess([], context.request, { startTime });
        }

        const eType = educator_type as EducatorType;

        if (eType === 'school') {
          const { data: educatorCheck } = await supabase
            .from('school_educators')
            .select('id')
            .eq('id', educator_id)
            .maybeSingle();

          if (!educatorCheck) {
            return apiError(403, 'PERMISSION_DENIED', 'Invalid educator credentials', context.request, { startTime });
          }

          const { data: assignments, error: assignmentError } = await supabase
            .from('school_educator_class_assignments')
            .select('class_id')
            .eq('educator_id', educator_id);

          if (assignmentError) return apiDbError(assignmentError, context.request, { startTime });

          const classIds = (assignments || []).map((a: any) => a.class_id);
          if (classIds.length === 0) return apiSuccess([], context.request, { startTime });

          let query = supabase
            .from('school_classes')
            .select(
              `*,
              class_teacher:school_educator_class_assignments(
                educator:school_educators(
                  first_name,
                  last_name,
                  email
                )
              )`,
            )
            .in('id', classIds)
            .eq('school_educator_class_assignments.is_primary', true)
            .eq('account_status', 'active')
            .order('created_at', { ascending: false });

          if (school_id) query = query.eq('school_id', school_id);

          const { data, error } = await query;
          if (error) return apiDbError(error, context.request, { startTime });

          const classesWithLearners = await Promise.all(
            (data || []).map(async (dbClass: any) => {
              const ct = dbClass.class_teacher?.[0]?.educator;
              const enriched = {
                ...dbClass,
                class_teacher_first_name: ct?.first_name,
                class_teacher_last_name: ct?.last_name,
                class_teacher_email: ct?.email,
              };
              const classItem = transformDBClassToClass(enriched, 'school');
              classItem.learners = await fetchClassLearners(supabase, dbClass.id, 'school');
              classItem.tasks = await fetchClassTasks(supabase, dbClass.id);
              return syncClassAggregates(classItem);
            }),
          );

          return apiSuccess(classesWithLearners, context.request, { startTime });
        } else {
          const { data: educatorCheck } = await supabase
            .from('college_lecturers')
            .select('id')
            .eq('id', educator_id)
            .maybeSingle();

          if (!educatorCheck) {
            return apiError(403, 'PERMISSION_DENIED', 'Invalid educator credentials', context.request, { startTime });
          }

          const { data: assignments, error: assignmentError } = await supabase
            .from('college_faculty_class_assignments')
            .select('class_id')
            .eq('faculty_id', educator_id);

          if (assignmentError) return apiDbError(assignmentError, context.request, { startTime });

          const classIds = (assignments || []).map((a: any) => a.class_id);
          if (classIds.length === 0) return apiSuccess([], context.request, { startTime });

          let query = supabase
            .from('college_classes')
            .select(
              `*,
              faculty:college_faculty_class_assignments(
                lecturer:college_lecturers(
                  first_name,
                  last_name,
                  email
                )
              )`,
            )
            .in('id', classIds)
            .eq('college_faculty_class_assignments.is_class_teacher', true)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (college_id) query = query.eq('college_id', college_id);

          const { data, error } = await query;
          if (error) return apiDbError(error, context.request, { startTime });

          const classesWithLearners = await Promise.all(
            (data || []).map(async (dbClass: any) => {
              const f = dbClass.faculty?.[0]?.lecturer;
              const enriched = {
                ...dbClass,
                faculty_first_name: f?.first_name,
                faculty_last_name: f?.last_name,
                faculty_email: f?.email,
              };
              const classItem = transformDBClassToClass(enriched, 'college');
              classItem.learners = await fetchClassLearners(supabase, dbClass.id, 'college');
              classItem.tasks = await fetchClassTasks(supabase, dbClass.id);
              return syncClassAggregates(classItem);
            }),
          );

          return apiSuccess(classesWithLearners, context.request, { startTime });
        }
      }

      case 'fetch-all-school-classes': {
        const { school_id } = params;

        let query = supabase
          .from('school_classes')
          .select(
            `*,
            class_teacher:school_educator_class_assignments(
              educator:school_educators(
                first_name,
                last_name,
                email
              )
            )`,
          )
          .eq('school_educator_class_assignments.is_primary', true)
          .eq('account_status', 'active')
          .order('created_at', { ascending: false });

        if (school_id) query = query.eq('school_id', school_id);

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const classesWithLearners = await Promise.all(
          (data || []).map(async (dbClass: any) => {
            const ct = dbClass.class_teacher?.[0]?.educator;
            const enriched = {
              ...dbClass,
              class_teacher_first_name: ct?.first_name,
              class_teacher_last_name: ct?.last_name,
              class_teacher_email: ct?.email,
            };
            const classItem = transformDBClassToClass(enriched, 'school');
            classItem.learners = await fetchClassLearners(supabase, dbClass.id, 'school');
            classItem.tasks = await fetchClassTasks(supabase, dbClass.id);
            return syncClassAggregates(classItem);
          }),
        );

        return apiSuccess(classesWithLearners, context.request, { startTime });
      }

      case 'get-class-by-id': {
        const { class_id, educator_type } = params;
        if (!class_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id or educator_type', context.request, { startTime });
        }

        const eType = educator_type as EducatorType;
        let enrichedClass: any = null;

        if (eType === 'school') {
          enrichedClass = await getSchoolClassById(supabase, class_id);
        } else {
          enrichedClass = await getCollegeClassById(supabase, class_id);
        }

        if (!enrichedClass) {
          return apiError(404, 'NOT_FOUND', 'Class not found', context.request, { startTime });
        }

        const classItem = transformDBClassToClass(enrichedClass, eType);
        classItem.learners = await fetchClassLearners(supabase, class_id, eType);
        classItem.tasks = await fetchClassTasks(supabase, class_id);
        return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
      }

      case 'fetch-class-tasks': {
        const { class_id } = params;
        if (!class_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id', context.request, { startTime });
        }

        const tasks = await fetchClassTasks(supabase, class_id);
        return apiSuccess(tasks, context.request, { startTime });
      }

      case 'fetch-class-learners': {
        const { class_id, educator_type } = params;
        if (!class_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id or educator_type', context.request, { startTime });
        }

        const learners = await fetchClassLearners(supabase, class_id, educator_type as EducatorType);
        return apiSuccess(learners, context.request, { startTime });
      }

      case 'fetch-learner-directory': {
        const { school_id, college_id } = params;

        if (!school_id && !college_id) {
          return apiSuccess([], context.request, { startTime });
        }

        let query = supabase
          .from('learners')
          .select('id, name, email, school_id, college_id')
          .eq('is_deleted', false)
          .limit(100);

        if (school_id) {
          query = query.eq('school_id', school_id).is('school_class_id', null);
        } else if (college_id) {
          query = query.eq('college_id', college_id).is('college_class_id', null);
        }

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const directory = (data || []).map((learner: any) => ({
          id: learner.id,
          name: learner.name || 'Unknown',
          email: learner.email || '',
          defaultProgress: 0,
        }));

        return apiSuccess(directory, context.request, { startTime });
      }

      case 'add-learner-to-class': {
        const { class_id, learner_id, educator_type } = params;
        if (!class_id || !learner_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id, learner_id, or educator_type', context.request, { startTime });
        }

        const eType = educator_type as EducatorType;
        let enrichedClass: any = null;
        if (eType === 'school') {
          enrichedClass = await getSchoolClassById(supabase, class_id);
        } else {
          enrichedClass = await getCollegeClassById(supabase, class_id);
        }

        if (!enrichedClass) {
          return apiError(404, 'NOT_FOUND', 'Class not found', context.request, { startTime });
        }

        const classIdField = eType === 'school' ? 'school_class_id' : 'college_class_id';

        const { error: updateError } = await supabase
          .from('learners')
          .update({ [classIdField]: class_id })
          .eq('id', learner_id);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        const classTable = eType === 'school' ? 'school_classes' : 'college_classes';
        await supabase
          .from(classTable)
          .update({
            current_learners: (enrichedClass.current_learners || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', class_id);

        const classItem = transformDBClassToClass(enrichedClass, eType);
        classItem.learners = await fetchClassLearners(supabase, class_id, eType);
        classItem.tasks = await fetchClassTasks(supabase, class_id);
        return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
      }

      case 'remove-learner-from-class': {
        const { class_id, learner_id, educator_type } = params;
        if (!class_id || !learner_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id, learner_id, or educator_type', context.request, { startTime });
        }

        const eType = educator_type as EducatorType;
        let enrichedClass: any = null;
        if (eType === 'school') {
          enrichedClass = await getSchoolClassById(supabase, class_id);
        } else {
          enrichedClass = await getCollegeClassById(supabase, class_id);
        }

        if (!enrichedClass) {
          return apiError(404, 'NOT_FOUND', 'Class not found', context.request, { startTime });
        }

        const classIdField = eType === 'school' ? 'school_class_id' : 'college_class_id';

        const { error: updateError } = await supabase
          .from('learners')
          .update({ [classIdField]: null })
          .eq('id', learner_id);

        if (updateError) return apiDbError(updateError, context.request, { startTime });

        const newCount = Math.max(0, (enrichedClass.current_learners || 0) - 1);
        const classTable = eType === 'school' ? 'school_classes' : 'college_classes';
        await supabase
          .from(classTable)
          .update({
            current_learners: newCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', class_id);

        const classItem = transformDBClassToClass(enrichedClass, eType);
        classItem.learners = await fetchClassLearners(supabase, class_id, eType);
        classItem.tasks = await fetchClassTasks(supabase, class_id);
        return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
      }

      case 'create-class': {
        const {
          name,
          grade,
          section,
          academic_year,
          max_learners,
          status,
          skill_areas,
          school_id,
          college_id,
          educator_id,
          educator_name,
          educator_email,
          educator_type,
        } = params;

        if (!educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing educator_type', context.request, { startTime });
        }

        const eType = educator_type as EducatorType;
        const skills = Array.from(new Set((skill_areas || []).map((s: string) => s.trim()).filter(Boolean)));

        if (eType === 'school') {
          const { data, error } = await supabase
            .from('school_classes')
            .insert([
              {
                school_id,
                name,
                grade,
                section,
                academic_year,
                max_learners,
                current_learners: 0,
                account_status: 'active',
                metadata: {
                  skillAreas: skills,
                  status: status || 'Active',
                  educator: educator_name,
                  educatorEmail: educator_email,
                  educatorId: educator_id,
                },
              },
            ])
            .select('*')
            .single();

          if (error) return apiDbError(error, context.request, { startTime });
          if (!data) return apiError(500, 'CREATE_FAILED', 'Unable to create school class', context.request, { startTime });

          const classItem = transformDBClassToClass(data, 'school');
          classItem.skillAreas = skills;
          classItem.status = status || 'Active';
          classItem.educator = educator_name || 'TBD';
          classItem.educatorEmail = educator_email || 'Not assigned';

          return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
        } else {
          const { data, error } = await supabase
            .from('college_classes')
            .insert([
              {
                college_id,
                name,
                grade,
                section,
                academic_year,
                max_learners,
                current_learners: 0,
                status: 'active',
                metadata: {
                  skillAreas: skills,
                  status: status || 'Active',
                  educator: educator_name,
                  educatorEmail: educator_email,
                  educatorId: educator_id,
                },
              },
            ])
            .select('*')
            .single();

          if (error) return apiDbError(error, context.request, { startTime });
          if (!data) return apiError(500, 'CREATE_FAILED', 'Unable to create college class', context.request, { startTime });

          if (educator_id) {
            await supabase
              .from('college_faculty_class_assignments')
              .insert([
                {
                  college_id,
                  faculty_id: educator_id,
                  class_id: data.id,
                  is_class_teacher: true,
                  academic_year,
                },
              ])
              .then((r) => {
                if (r.error) console.warn('[classes] Failed to create faculty assignment:', r.error);
              });
          }

          const classItem = transformDBClassToClass(data, 'college');
          classItem.skillAreas = skills;
          classItem.status = status || 'Active';
          classItem.educator = educator_name || 'TBD';
          classItem.educatorEmail = educator_email || 'Not assigned';

          return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
        }
      }

      case 'update-class': {
        const {
          class_id,
          name,
          grade,
          section,
          academic_year,
          max_learners,
          status,
          skill_areas,
          educator_name,
          educator_email,
          educator_id,
          educator_type,
        } = params;

        if (!class_id || !educator_type) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id or educator_type', context.request, { startTime });
        }

        const eType = educator_type as EducatorType;
        const skills = Array.from(new Set((skill_areas || []).map((s: string) => s.trim()).filter(Boolean)));
        const classTable = eType === 'school' ? 'school_classes' : 'college_classes';

        const { data, error } = await supabase
          .from(classTable)
          .update({
            name,
            grade,
            section,
            academic_year,
            max_learners,
            updated_at: new Date().toISOString(),
            metadata: {
              skillAreas: skills,
              status: status || 'Active',
              educator: educator_name,
              educatorEmail: educator_email,
              educatorId: educator_id,
            },
          })
          .eq('id', class_id)
          .select('*')
          .maybeSingle();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiError(404, 'NOT_FOUND', 'Class not found', context.request, { startTime });

        const classItem = transformDBClassToClass(data, eType);
        classItem.skillAreas = skills;
        classItem.status = status || 'Active';
        classItem.educator = educator_name || 'TBD';
        classItem.educatorEmail = educator_email || 'Not assigned';
        classItem.learners = await fetchClassLearners(supabase, class_id, eType);
        return apiSuccess(syncClassAggregates(classItem), context.request, { startTime });
      }

      case 'assign-task': {
        const { class_id, task } = params;
        if (!class_id || !task) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id or task', context.request, { startTime });
        }

        return apiSuccess(
          {
            id: crypto.randomUUID().slice(0, 8),
            name: task.name,
            dueDate: task.dueDate,
            skillTags: task.skillTags || [],
            referenceLink: task.referenceLink,
            status: 'Pending',
          },
          context.request,
          { startTime },
        );
      }

      case 'save-class-note': {
        const { class_id, note } = params;
        if (!class_id || !note || !note.content?.trim()) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id or note content', context.request, { startTime });
        }

        return apiSuccess(
          {
            id: crypto.randomUUID().slice(0, 8),
            author: note.author || user.email || 'Unknown',
            content: note.content,
            createdAt: new Date().toISOString(),
          },
          context.request,
          { startTime },
        );
      }

      // ═══════════════════════════════════════════════════════════════
      //  COLLEGE CLASSES (college-specific)
      // ═══════════════════════════════════════════════════════════════

      case 'get-college-classes': {
        const { college_id, program_id } = params;

        let query = supabase
          .from('college_classes')
          .select(
            `*,
            faculty:college_faculty_class_assignments(
              lecturer:college_lecturers(
                first_name,
                last_name,
                email
              )
            )`,
          )
          .eq('status', 'active');

        if (college_id) query = query.eq('college_id', college_id);
        if (program_id) query = query.eq('program_id', program_id);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const mapped = (data || []).map((dbClass: any) => {
          const f = dbClass.faculty?.[0]?.lecturer;
          const enriched = {
            ...dbClass,
            faculty_first_name: f?.first_name,
            faculty_last_name: f?.last_name,
            faculty_email: f?.email,
          };
          return transformDBClassToClass(enriched, 'college');
        });

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-college-class-details': {
        const { class_id } = params;
        if (!class_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id', context.request, { startTime });
        }

        const enrichedClass = await getCollegeClassById(supabase, class_id);
        if (!enrichedClass) {
          return apiError(404, 'NOT_FOUND', 'College class not found', context.request, { startTime });
        }

        const classItem = transformDBClassToClass(enrichedClass, 'college');
        const learners = await fetchClassLearners(supabase, class_id, 'college');

        const { data: educators } = await supabase
          .from('college_faculty_class_assignments')
          .select(
            `faculty_id,
            is_class_teacher,
            lecturer:college_lecturers(
              id,
              first_name,
              last_name,
              email
            )`,
          )
          .eq('class_id', class_id);

        return apiSuccess(
          {
            ...classItem,
            learners,
            educators: (educators || []).map((e: any) => ({
              id: e.faculty_id,
              name: e.lecturer
                ? `${e.lecturer.first_name || ''} ${e.lecturer.last_name || ''}`.trim()
                : 'Unknown',
              email: e.lecturer?.email || '',
              isClassTeacher: e.is_class_teacher || false,
            })),
          },
          context.request,
          { startTime },
        );
      }

      case 'get-classmates': {
        const { program_id, semester, program_section_id, current_learner_id } = params;
        if (!program_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing program_id', context.request, { startTime });
        }

        let query = supabase
          .from('learners')
          .select(
            `id,
            name,
            email,
            profilePicture,
            semester,
            roll_number,
            admission_number,
            program_section_id,
            users!inner (
              role
            )`,
          )
          .eq('program_id', program_id)
          .eq('users.role', 'learner');

        if (current_learner_id) {
          query = query.neq('id', current_learner_id);
        }

        query = query.order('name', { ascending: true });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiSuccess([], context.request, { startTime });

        const filtered = data.filter((learner: any) => {
          if (program_section_id) return learner.program_section_id === program_section_id;
          const learnerSemester = learner.semester || semester;
          return learnerSemester === semester && !learner.program_section_id;
        });

        const mapped = filtered.map((learner: any) => ({
          id: learner.id,
          name: learner.name || 'Unknown',
          email: learner.email,
          profilePicture: learner.profilePicture,
          semester: learner.semester || semester,
          roll_number: learner.roll_number,
          admission_number: learner.admission_number,
        }));

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-class-activities': {
        const { class_id, educator_type } = params;
        if (!class_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id', context.request, { startTime });
        }

        const eType = (educator_type || 'school') as EducatorType;

        if (eType === 'school') {
          const tasks = await fetchClassTasks(supabase, class_id);
          return apiSuccess(tasks, context.request, { startTime });
        } else {
          const { data: classData } = await supabase
            .from('college_classes')
            .select('id')
            .eq('id', class_id)
            .maybeSingle();

          if (!classData) {
            return apiError(404, 'NOT_FOUND', 'College class not found', context.request, { startTime });
          }

          const { data: learners } = await supabase
            .from('learners')
            .select('user_id')
            .eq('college_class_id', class_id);

          if (!learners || learners.length === 0) {
            return apiSuccess([], context.request, { startTime });
          }

          const learnerUserIds = learners.map((l: any) => l.user_id).filter(Boolean);

          const { data: assignments, error } = await supabase
            .from('college_learner_assignments')
            .select(
              `learner_assignment_id,
              assignment_id,
              status,
              grade_percentage,
              priority,
              due_date,
              college_assignments!inner(
                assignment_id,
                title,
                description,
                course_name,
                assignment_type,
                skill_outcomes,
                due_date
              )`,
            )
            .in('learner_id', learnerUserIds);

          if (error) return apiDbError(error, context.request, { startTime });

          const seen = new Set<string>();
          const unique = (assignments || []).filter((a: any) => {
            const aid = a.college_assignments?.assignment_id;
            if (!aid || seen.has(aid)) return false;
            seen.add(aid);
            return true;
          });

          const mapped = unique.map((a: any) => ({
            id: a.college_assignments.assignment_id,
            name: a.college_assignments.title,
            courseName: a.college_assignments.course_name,
            assignmentType: a.college_assignments.assignment_type,
            skillTags: a.college_assignments.skill_outcomes || [],
            dueDate: a.college_assignments.due_date,
            status: a.status,
            gradePercentage: a.grade_percentage,
            priority: a.priority,
          }));

          return apiSuccess(mapped, context.request, { startTime });
        }
      }

      // ═══════════════════════════════════════════════════════════════
      //  TIMETABLE SLOTS
      // ═══════════════════════════════════════════════════════════════

      case 'get-timetable-slots': {
        const { timetable_id, educator_ids, day_of_week, period_number } = params;

        let query = supabase.from('college_timetable_slots').select('*');
        if (timetable_id) query = query.eq('timetable_id', timetable_id);
        if (educator_ids && Array.isArray(educator_ids) && educator_ids.length > 0) query = query.in('educator_id', educator_ids);
        if (day_of_week !== undefined) query = query.eq('day_of_week', day_of_week);
        if (period_number !== undefined) query = query.eq('period_number', period_number);
        query = query.order('day_of_week', { ascending: true }).order('start_time', { ascending: true });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-timetable-slot': {
        const { timetable_id, day_of_week, period_number, start_time, end_time, subject_name, educator_id, class_id, room_number, is_recurring, schedule_date, recurring_end_date, color } = params;
        if (!timetable_id || day_of_week === undefined || !start_time || !end_time || !period_number) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing required timetable slot fields', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_timetable_slots')
          .insert([
            {
              timetable_id,
              day_of_week,
              period_number,
              start_time,
              end_time,
              subject_name: subject_name || null,
              educator_id: educator_id || null,
              class_id: class_id || null,
              room_number: room_number || null,
              is_recurring: is_recurring ?? null,
              schedule_date: schedule_date || null,
              recurring_end_date: recurring_end_date || null,
              color: color || null,
            },
          ])
          .select('*')
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-timetable-slot': {
        const id = params.slot_id || params.id;
        if (!id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing slot_id', context.request, { startTime });
        }
        const { slot_id: _s, id: _i, ...slotData } = params;

        const { data, error } = await supabase
          .from('college_timetable_slots')
          .update(slotData)
          .eq('id', id)
          .select('*')
          .maybeSingle();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiError(404, 'NOT_FOUND', 'Timetable slot not found', context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-timetable-slot': {
        const id = params.slot_id || params.id;
        if (!id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing slot_id', context.request, { startTime });
        }

        const { error } = await supabase.from('college_timetable_slots').delete().eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  TIMETABLES
      // ═══════════════════════════════════════════════════════════════

      case 'get-timetables': {
        const { college_id, academic_year, semester } = params;

        let query = supabase.from('college_timetables').select('*');
        if (college_id) query = query.eq('college_id', college_id);
        if (academic_year) query = query.eq('academic_year', academic_year);
        if (semester) query = query.eq('semester', semester);
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'create-timetable': {
        const { college_id, name, academic_year, semester, description, status } = params;
        if (!college_id || !name) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing college_id or name', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_timetables')
          .insert([
            {
              college_id,
              name,
              academic_year: academic_year || null,
              semester: semester || null,
              description: description || null,
              status: status || 'draft',
            },
          ])
          .select('*')
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-timetable': {
        const { timetable_id, ...timetableData } = params;
        if (!timetable_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing timetable_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_timetables')
          .update(timetableData)
          .eq('id', timetable_id)
          .select('*')
          .maybeSingle();

        if (error) return apiDbError(error, context.request, { startTime });
        if (!data) return apiError(404, 'NOT_FOUND', 'Timetable not found', context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-timetable': {
        const { timetable_id } = params;
        if (!timetable_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing timetable_id', context.request, { startTime });
        }

        await supabase.from('college_timetable_slots').delete().eq('timetable_id', timetable_id);
        const { error } = await supabase.from('college_timetables').delete().eq('id', timetable_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  MISSING ACTIONS from frontend audit
      // ═══════════════════════════════════════════════════════════════

      case 'submit-assignment': {
        const { learnerAssignmentId, ...submissionData } = params;
        if (!learnerAssignmentId) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learnerAssignmentId', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('college_learner_assignments')
          .update({
            status: 'submitted',
            submission_content: submissionData.submission_content || null,
            submission_url: submissionData.submission_url || null,
            submission_files: submissionData.submission_files || null,
            submission_date: new Date().toISOString(),
          })
          .eq('learner_assignment_id', learnerAssignmentId)
          .select('*')
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'fetch-learner-assignments': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_learner_assignments')
          .select(`*,
            college_assignments!inner(
              assignment_id, title, description, course_name,
              assignment_type, skill_outcomes, due_date,
              total_points, educator_name, document_pdf,
              created_date, is_deleted
            )`)
          .eq('learner_id', learnerId)
          .order('created_date', { ascending: false });
        if (error) return apiDbError(error, context.request, { startTime });
        const mapped = (data || []).map((row: any) => {
          const a = row.college_assignments || {};
          return {
            learnerAssignmentId: row.learner_assignment_id,
            assignmentId: a.assignment_id,
            learnerId: row.learner_id,
            title: a.title, description: a.description || '',
            courseName: a.course_name,
            assignmentType: a.assignment_type,
            skillOutcomes: a.skill_outcomes || [],
            totalPoints: a.total_points,
            educatorName: a.educator_name,
            dueDate: a.due_date, documentPdf: a.document_pdf,
            status: row.status, priority: row.priority || 'normal',
            gradeReceived: row.grade_received,
            gradePercentage: row.grade_percentage,
            instructorFeedback: row.instructor_feedback,
            submissionDate: row.submission_date,
            submissionContent: row.submission_content,
            submissionUrl: row.submission_url,
            submissionFiles: row.submission_files,
            isLate: row.is_late, createdDate: row.created_date,
          };
        });
        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'get-learner-assignment-stats': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_learner_assignments')
          .select('status, grade_percentage, priority, due_date')
          .eq('learner_id', learnerId);
        if (error) return apiDbError(error, context.request, { startTime });
        const list = data || [];
        return apiSuccess({
          total: list.length,
          completed: list.filter((r: any) => r.status === 'submitted' || r.status === 'graded').length,
          pending: list.filter((r: any) => r.status === 'todo' || r.status === 'in_progress').length,
          overdue: list.filter((r: any) => r.due_date && new Date(r.due_date) < new Date() && r.status !== 'submitted' && r.status !== 'graded').length,
          graded: list.filter((r: any) => r.status === 'graded').length,
          averageGrade: (() => {
            const graded = list.filter((r: any) => r.grade_percentage != null);
            return graded.length > 0 ? Math.round(graded.reduce((s: number, r: any) => s + r.grade_percentage, 0) / graded.length) : 0;
          })(),
        }, context.request, { startTime });
      }

      case 'update-learner-assignment-status': {
        const { learnerAssignmentId, newStatus } = params;
        if (!learnerAssignmentId || !newStatus) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learnerAssignmentId or newStatus', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('college_learner_assignments')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('learner_assignment_id', learnerAssignmentId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'get-learner-class-info': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data: learner, error: learnerError } = await supabase
          .from('learners')
          .select('id, program_id, semester, section, college_class_id, college_id, program_section_id')
          .eq('id', learnerId)
          .maybeSingle();
        if (learnerError) return apiDbError(learnerError, context.request, { startTime });
        if (!learner) return apiSuccess(null, context.request, { startTime });
        const { data: program } = await supabase
          .from('programs')
          .select('id, name, code, department_id, degree_level')
          .eq('id', learner.program_id)
          .maybeSingle();
        const { data: department } = await supabase
          .from('departments')
          .select('id, name')
          .eq('id', program?.department_id)
          .maybeSingle();
        const { data: college } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', learner.college_id)
          .maybeSingle();
        let classInfo: any = null;
        if (learner.college_class_id) {
          const { data: collegeClass } = await supabase
            .from('college_classes')
            .select('id, name, current_learners, max_learners')
            .eq('id', learner.college_class_id)
            .maybeSingle();
          if (collegeClass) classInfo = collegeClass;
        }
        return apiSuccess({
          id: learner.id,
          program_id: learner.program_id,
          program_name: program?.name || '',
          program_code: program?.code || '',
          department_name: department?.name || '',
          semester: learner.semester || 1,
          section: learner.section || null,
          academic_year: program?.degree_level || '',
          college_name: college?.name || '',
          current_learners: classInfo?.current_learners || 0,
          max_learners: classInfo?.max_learners || 0,
          college_id: learner.college_id,
          program_section_id: learner.program_section_id,
        }, context.request, { startTime });
      }

      case 'get-learner-type-info': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('id, college_id, school_id, program_id, college_class_id, school_class_id')
          .eq('id', learnerId)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({
          isCollege: !!data?.college_id,
          isSchool: !!data?.school_id,
          hasProgram: !!data?.program_id,
          hasClass: !!(data?.college_class_id || data?.school_class_id),
        }, context.request, { startTime });
      }

      case 'is-college-learner': {
        const { learnerId } = params;
        if (!learnerId) return apiError(400, 'VALIDATION_ERROR', 'Missing learnerId', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('id')
          .eq('id', learnerId)
          .not('college_id', 'is', null)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(!!data, context.request, { startTime });
      }

      case 'publish-timetable': {
        const { timetableId } = params;
        if (!timetableId) return apiError(400, 'VALIDATION_ERROR', 'Missing timetableId', context.request, { startTime });
        const { data, error } = await supabase
          .from('college_timetables')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', timetableId)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  LEARNER ASSIGNMENTS (college admin)
      // ═══════════════════════════════════════════════════════════════

      case 'get-learner-assignments': {
        const { learner_id, assignment_id, class_id, limit } = params;

        let query = supabase
          .from('college_learner_assignments')
          .select(
            `*,
            college_assignments!inner(
              assignment_id,
              title,
              description,
              course_name,
              assignment_type,
              skill_outcomes,
              due_date,
              total_points,
              educator_name,
              document_pdf,
              created_date,
              is_deleted
            )`,
          );

        if (learner_id) query = query.eq('learner_id', learner_id);
        if (assignment_id) query = query.eq('assignment_id', assignment_id);
        if (limit) query = query.limit(limit);
        query = query.order('created_date', { ascending: false });

        const { data, error } = await query;
        if (error) return apiDbError(error, context.request, { startTime });

        const mapped = (data || []).map((row: any) => {
          const a = row.college_assignments as Record<string, any>;
          return {
            learnerAssignmentId: row.learner_assignment_id,
            assignmentId: a.assignment_id,
            learnerId: row.learner_id,
            title: a.title,
            description: a.description || '',
            courseName: a.course_name,
            assignmentType: a.assignment_type,
            skillOutcomes: a.skill_outcomes || [],
            totalPoints: a.total_points,
            educatorName: a.educator_name,
            dueDate: a.due_date,
            documentPdf: a.document_pdf,
            status: row.status,
            priority: row.priority,
            gradeReceived: row.grade_received,
            gradePercentage: row.grade_percentage,
            instructorFeedback: row.instructor_feedback,
            submissionDate: row.submission_date,
            submissionContent: row.submission_content,
            submissionUrl: row.submission_url,
            submissionFiles: row.submission_files,
            isLate: row.is_late,
            createdDate: row.created_date,
          };
        });

        return apiSuccess(mapped, context.request, { startTime });
      }

      case 'assign-learner': {
        const { learner_id, assignment_id, priority, due_date } = params;
        if (!learner_id || !assignment_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or assignment_id', context.request, { startTime });
        }

        const { data, error } = await supabase
          .from('college_learner_assignments')
          .insert([
            {
              learner_id,
              assignment_id,
              status: 'todo',
              priority: priority || 'normal',
              due_date: due_date || null,
            },
          ])
          .select('*')
          .single();

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'remove-learner-assignment': {
        const { learner_assignment_id } = params;
        if (!learner_assignment_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_assignment_id', context.request, { startTime });
        }

        const { error } = await supabase
          .from('college_learner_assignments')
          .delete()
          .eq('learner_assignment_id', learner_assignment_id);

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: true }, context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  TIMETABLE HELPERS (for useTimetableData hook)
      // ═══════════════════════════════════════════════════════════════

      case 'get-or-create-timetable': {
        const { college_id, academic_year, term } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const currentYear = new Date().getFullYear();
        const year = academic_year || `${currentYear}-${currentYear + 1}`;

        const { data: existing, error } = await supabase
          .from('college_timetables')
          .select('id, status')
          .eq('college_id', college_id)
          .eq('academic_year', year)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') return apiDbError(error, context.request, { startTime });
        if (existing) return apiSuccess({ ...existing, created: false }, context.request, { startTime });

        const { data: newTimetable, error: insertError } = await supabase
          .from('college_timetables')
          .insert({
            college_id,
            academic_year: year,
            term: term || 'Term 1',
            start_date: `${currentYear}-06-01`,
            end_date: `${currentYear + 1}-05-31`,
            status: 'draft',
          })
          .select('id, status')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            const { data: retry } = await supabase
              .from('college_timetables')
              .select('id, status')
              .eq('college_id', college_id)
              .eq('academic_year', year)
              .limit(1)
              .single();
            if (retry) return apiSuccess({ ...retry, created: false }, context.request, { startTime });
          }
          return apiDbError(insertError, context.request, { startTime });
        }

        return apiSuccess({ ...newTimetable, created: true }, context.request, { startTime });
      }

      case 'get-time-periods': {
        const { timetable_id } = params;
        if (!timetable_id) return apiError(400, 'VALIDATION_ERROR', 'Missing timetable_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('college_time_periods')
          .select('*')
          .eq('timetable_id', timetable_id)
          .order('period_number');

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'save-time-periods': {
        const { timetable_id, college_id, periods } = params;
        if (!timetable_id || !college_id || !periods || !Array.isArray(periods)) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing timetable_id, college_id, or periods array', context.request, { startTime });
        }

        await supabase.from('college_time_periods').delete().eq('timetable_id', timetable_id);

        const periodsToInsert = periods.map((p: any, index: number) => ({
          timetable_id,
          college_id,
          period_number: index + 1,
          period_name: p.period_name,
          start_time: p.start_time,
          end_time: p.end_time,
          is_break: !!p.is_break,
          break_type: p.break_type || null,
        }));

        const { error } = await supabase.from('college_time_periods').insert(periodsToInsert);
        if (error) return apiDbError(error, context.request, { startTime });

        const { data } = await supabase
          .from('college_time_periods')
          .select('*')
          .eq('timetable_id', timetable_id)
          .order('period_number');

        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-faculty-classes': {
        const { college_id, faculty_id } = params;
        if (!college_id || !faculty_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing college_id or faculty_id', context.request, { startTime });
        }

        const { data: assignments } = await supabase
          .from('college_faculty_class_assignments')
          .select('class_id, college_classes(id, name, grade, section)')
          .eq('faculty_id', faculty_id)
          .eq('college_id', college_id);

        if (assignments && assignments.length > 0) {
          const assigned = assignments.map((a: any) => a.college_classes).filter(Boolean);
          return apiSuccess(assigned, context.request, { startTime });
        }

        const { data: timetables } = await supabase
          .from('college_timetables')
          .select('id')
          .eq('college_id', college_id)
          .order('created_at', { ascending: false })
          .limit(1);

        const timetableId = timetables?.[0]?.id;
        if (timetableId) {
          const { data: slotClasses } = await supabase
            .from('college_timetable_slots')
            .select('class_id')
            .eq('educator_id', faculty_id)
            .eq('timetable_id', timetableId);

          if (slotClasses && slotClasses.length > 0) {
            const classIds = [...new Set(slotClasses.map((s: any) => s.class_id))];
            const { data: classDetails } = await supabase
              .from('college_classes')
              .select('id, name, grade, section')
              .in('id', classIds)
              .eq('status', 'active');
            if (classDetails) return apiSuccess(classDetails, context.request, { startTime });
          }
        }

        const { data: allClasses } = await supabase
          .from('college_classes')
          .select('id, name, grade, section')
          .eq('college_id', college_id)
          .eq('status', 'active');

        return apiSuccess(allClasses || [], context.request, { startTime });
      }

      case 'get-substitutions-with-details': {
        const { college_id, start_date, end_date } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        let query = supabase
          .from('college_faculty_substitutions')
          .select(`
            id, substitution_date, period_number, class_id, subject_name,
            original_faculty_id, substitute_faculty_id, status,
            original:college_lecturers!original_faculty_id(first_name, last_name),
            substitute:college_lecturers!substitute_faculty_id(first_name, last_name)
          `)
          .eq('college_id', college_id)
          .in('status', ['assigned', 'confirmed']);

        if (start_date) query = query.gte('substitution_date', start_date);
        if (end_date) query = query.lte('substitution_date', end_date);

        const { data, error } = await query.order('substitution_date');
        if (error) return apiDbError(error, context.request, { startTime });

        const processed = (data || []).map((s: any) => ({
          id: s.id,
          substitution_date: s.substitution_date,
          period_number: s.period_number,
          class_id: s.class_id,
          subject_name: s.subject_name,
          original_faculty_id: s.original_faculty_id,
          original_faculty_name: s.original ? `${s.original.first_name || ''} ${s.original.last_name || ''}`.trim() : '',
          substitute_faculty_id: s.substitute_faculty_id,
          substitute_faculty_name: s.substitute ? `${s.substitute.first_name || ''} ${s.substitute.last_name || ''}`.trim() : null,
          status: s.status,
        }));

        return apiSuccess(processed, context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  LEARNER SEARCH (for useLearnerSearch)
      // ═══════════════════════════════════════════════════════════════

      case 'get-learner-count': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { count, error } = await supabase
          .from('learners')
          .select('id', { count: 'exact', head: true })
          .eq('college_id', college_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(count || 0, context.request, { startTime });
      }

      case 'search-learners': {
        const { college_id, query: searchQuery } = params;
        if (!searchQuery || !searchQuery.trim()) {
          return apiSuccess([], context.request, { startTime });
        }

        let q = supabase
          .from('learners')
          .select('id, name, email, college_id')
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(30);

        if (college_id) q = q.eq('college_id', college_id);

        const { data, error } = await q;
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  LEARNERS BY COLLEGE (for useFeeTracking)
      // ═══════════════════════════════════════════════════════════════

      case 'get-learners-by-college': {
        const { college_id } = params;
        if (!college_id) return apiError(400, 'VALIDATION_ERROR', 'Missing college_id', context.request, { startTime });

        const { data, error } = await supabase
          .from('learners')
          .select('id, user_id, name, roll_number, email, college_id, grade, section')
          .eq('college_id', college_id)
          .order('name', { ascending: true });

        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      // ═══════════════════════════════════════════════════════════════
      //  EDUCATOR CLASS ASSIGNMENTS (school)
      // ═══════════════════════════════════════════════════════════════

      case 'create-educator-class-assignment': {
        const { educator_id, class_id, subject, academic_year, is_primary, assigned_by } = params;
        if (!educator_id || !class_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing educator_id or class_id', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('school_educator_class_assignments')
          .insert([{ educator_id, class_id, subject, academic_year, is_primary, assigned_by }])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'delete-educator-class-assignment': {
        const { id } = params;
        if (!id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing id', context.request, { startTime });
        }
        const { error } = await supabase
          .from('school_educator_class_assignments')
          .delete()
          .eq('id', id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'fetch-class-educator-assignments': {
        const { class_id } = params;
        if (!class_id) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing class_id', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('school_educator_class_assignments')
          .select(`*,
            school_educators (
              id,
              first_name,
              last_name,
              email
            )`)
          .eq('class_id', class_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'get-school-classes': {
        const { school_id } = params;
        if (!school_id) return apiError(400, 'VALIDATION_ERROR', 'Missing school_id', context.request, { startTime });
        const { data, error } = await supabase
          .from('school_classes')
          .select('id, grade, section, name, academic_year')
          .eq('school_id', school_id)
          .eq('account_status', 'active');
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[classes POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (_context: AuthenticatedContext) => {
  return apiMethodNotAllowed(_context.request);
});
