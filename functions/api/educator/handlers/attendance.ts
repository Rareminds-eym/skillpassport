import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

const getSub = (context: AuthenticatedContext) => getServiceClient(context.env as any);


export async function handleGetEducatorInfo(context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const user = getContextUser(context);
  if (!user?.id) {
    return apiError(401, 'UNAUTHORIZED', 'User not authenticated', context.request, { startTime });
  }

  const { data: schoolEducator } = await supabase
    .from('school_educators')
    .select('id, school_id, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (schoolEducator) {
    return apiSuccess({
      educatorId: schoolEducator.id,
      educatorUserId: schoolEducator.user_id,
      schoolId: schoolEducator.school_id,
      educatorType: 'school'
    }, context.request, { startTime });
  }

  const { data: collegeLecturer } = await supabase
    .from('college_lecturers')
    .select('id, collegeId, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (collegeLecturer) {
    return apiSuccess({
      educatorId: collegeLecturer.id,
      educatorUserId: collegeLecturer.user_id,
      collegeId: collegeLecturer.collegeId,
      educatorType: 'college'
    }, context.request, { startTime });
  }

  return apiError(404, 'NOT_FOUND', 'No educator record found', context.request, { startTime });
}

export async function handleGetSchoolTimetableSlots(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, educatorId, selectedDate } = params;
  if (!schoolId || !educatorId || !selectedDate) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const date = new Date(selectedDate);
  const dayOfWeek = date.getDay();
  const currentYear = new Date().getFullYear();

  const { data: timetables } = await supabase
    .from('timetables')
    .select('id')
    .eq('school_id', schoolId)
    .eq('academic_year', `${currentYear}-${currentYear + 1}`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);

  const timetable = timetables?.[0];
  if (!timetable) {
    return apiSuccess({ slots: [] }, context.request, { startTime });
  }

  const { data: slots, error } = await supabase
    .from('timetable_slots')
    .select(`
      id,
      day_of_week,
      period_number,
      start_time,
      end_time,
      subject_name,
      room_number,
      class_id,
      school_classes (
        name,
        grade,
        section,
        current_learners
      )
    `)
    .eq('timetable_id', timetable.id)
    .eq('educator_id', educatorId)
    .eq('day_of_week', dayOfWeek)
    .order('period_number');

  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ slots: slots || [] }, context.request, { startTime });
}

export async function handleGetCollegeAttendanceSessions(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { collegeId, educatorId, selectedDate } = params;
  if (!collegeId || !educatorId || !selectedDate) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: existingSessions, error: sessionsError } = await supabase
    .from('college_attendance_sessions')
    .select(`
      id,
      date,
      start_time,
      end_time,
      subject_name,
      subject_code,
      course_type,
      department_name,
      program_name,
      semester,
      section,
      academic_year,
      room_number,
      total_learners,
      present_count,
      absent_count,
      status
    `)
    .eq('faculty_id', educatorId)
    .eq('date', selectedDate)
    .eq('college_id', collegeId)
    .order('start_time');

  if (sessionsError) return apiDbError(sessionsError, context.request, { startTime });
  return apiSuccess({ sessions: existingSessions || [] }, context.request, { startTime });
}

export async function handleGetSchoolAttendanceData(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, selectedDate, classIds } = params;
  if (!schoolId || !selectedDate || !classIds || !Array.isArray(classIds)) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: alllearners } = await supabase
    .from('learners')
    .select('id, school_class_id')
    .in('school_class_id', classIds)
    .eq('is_deleted', false);

  const allLearnerIds = alllearners?.map(s => s.id) || [];
  const { data: attendanceRecords } = allLearnerIds.length > 0 ? await supabase
    .from('attendance_records')
    .select('learner_id, slot_id')
    .eq('school_id', schoolId)
    .eq('date', selectedDate)
    .in('learner_id', allLearnerIds)
    .not('slot_id', 'is', null) : { data: [] };

  return apiSuccess({
    learners: alllearners || [],
    attendanceRecords: attendanceRecords || []
  }, context.request, { startTime });
}

export async function handleGetClassLearnersForAttendance(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { classId } = params;
  if (!classId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing classId', context.request, { startTime });
  }

  const { data: learners, error } = await supabase
    .from('learners')
    .select('id, name, roll_number, grade, section, profilePicture')
    .eq('school_class_id', classId)
    .eq('is_deleted', false)
    .order('roll_number');

  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ learners: learners || [] }, context.request, { startTime });
}

export async function handleGetExistingAttendanceRecords(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, selectedDate, slotId, classId } = params;
  if (!schoolId || !selectedDate || !slotId || !classId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: classlearners } = await supabase
    .from('learners')
    .select('id')
    .eq('school_class_id', classId)
    .eq('is_deleted', false);

  const classLearnerIds = classlearners?.map(s => s.id) || [];

  const { data: existingRecords } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('school_id', schoolId)
    .eq('date', selectedDate)
    .eq('slot_id', slotId)
    .in('learner_id', classLearnerIds);

  return apiSuccess({ records: existingRecords || [] }, context.request, { startTime });
}

export async function handleGetCollegeAttendanceRecords(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { sessionId, selectedDate } = params;
  if (!sessionId || !selectedDate) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: existingRecords } = await supabase
    .from('college_attendance_records')
    .select('*')
    .eq('session_id', sessionId)
    .eq('date', selectedDate);

  return apiSuccess({ records: existingRecords || [] }, context.request, { startTime });
}

export async function handleGetProgramByName(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { programName } = params;
  if (!programName) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing programName', context.request, { startTime });
  }

  const { data: programData, error: programError } = await supabase
    .from('programs')
    .select('id, name, departments(name)')
    .eq('name', programName)
    .maybeSingle();

  if (programError) return apiDbError(programError, context.request, { startTime });
  return apiSuccess(programData, context.request, { startTime });
}

export async function handleGetProgramSectionsByCriteria(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { programId, semester, section } = params;
  if (!programId || semester === undefined || !section) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: programSections, error: programError } = await supabase
    .from('program_sections')
    .select('program_id, id, programs(name, departments(name))')
    .eq('program_id', programId)
    .eq('semester', semester)
    .eq('section', section);

  if (programError) return apiDbError(programError, context.request, { startTime });
  return apiSuccess({ programSections: programSections || [] }, context.request, { startTime });
}

export async function handleGetLearnersByProgramSection(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { programId, semester, section } = params;
  if (!programId || semester === undefined || !section) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: learners, error } = await supabase
    .from('learners')
    .select('id, name, roll_number, grade, section, profilePicture, program_id')
    .eq('is_deleted', false)
    .eq('program_id', programId)
    .eq('semester', semester)
    .eq('section', section)
    .order('roll_number');

  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess({ learners: learners || [] }, context.request, { startTime });
}

export async function handleSubmitSchoolAttendance(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, educatorUserId, selectedDate, slotId, records } = params;
  if (!schoolId || !educatorUserId || !selectedDate || !slotId || !records || !Array.isArray(records)) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  await supabase
    .from('attendance_records')
    .delete()
    .eq('school_id', schoolId)
    .eq('date', selectedDate)
    .eq('slot_id', slotId);

  const recordsToInsert = records.map((record: any) => ({
    learner_id: record.learner_id,
    school_id: schoolId,
    date: selectedDate,
    status: record.status,
    time_in: record.time_in || null,
    time_out: null,
    marked_by: educatorUserId,
    remarks: record.remarks || null,
    mode: 'manual',
    otp_verified: false,
    slot_id: slotId,
  }));

  const { error: insertError } = await supabase
    .from('attendance_records')
    .insert(recordsToInsert);

  if (insertError) return apiDbError(insertError, context.request, { startTime });
  return apiSuccess({ submitted: true }, context.request, { startTime });
}

export async function handleGetProgramDetails(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { programId } = params;
  if (!programId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing programId', context.request, { startTime });
  }

  const { data: programData } = await supabase
    .from('programs')
    .select('name, department_id, departments(name)')
    .eq('id', programId)
    .single();

  return apiSuccess(programData, context.request, { startTime });
}

export async function handleGetFacultyName(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { educatorId } = params;
  if (!educatorId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId', context.request, { startTime });
  }

  const { data: facultyData, error: facultyError } = await supabase
    .from('college_lecturers')
    .select('first_name, last_name')
    .eq('id', educatorId)
    .single();

  if (facultyError) return apiDbError(facultyError, context.request, { startTime });
  return apiSuccess(facultyData, context.request, { startTime });
}

export async function handleSubmitCollegeAttendance(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { sessionId, selectedDate, records, sessionUpdateData } = params;
  if (!sessionId || !selectedDate || !records || !Array.isArray(records)) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  await supabase
    .from('college_attendance_records')
    .delete()
    .eq('session_id', sessionId)
    .eq('date', selectedDate);

  const { error: recordsError } = await supabase
    .from('college_attendance_records')
    .insert(records);

  if (recordsError) return apiDbError(recordsError, context.request, { startTime });

  if (sessionUpdateData) {
    const { error: sessionUpdateError } = await supabase
      .from('college_attendance_sessions')
      .update(sessionUpdateData)
      .eq('id', sessionId);

    if (sessionUpdateError) return apiDbError(sessionUpdateError, context.request, { startTime });
  }

  return apiSuccess({ submitted: true }, context.request, { startTime });
}

export async function handleGetTimetableSlotId(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { educatorId, periodNumber, dayOfWeek, subjectName, classId } = params;
  if (!educatorId || periodNumber === undefined || dayOfWeek === undefined || !subjectName || !classId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });
  }

  const { data: slotData } = await supabase
    .from('timetable_slots')
    .select('id')
    .eq('educator_id', educatorId)
    .eq('period_number', periodNumber)
    .eq('day_of_week', dayOfWeek)
    .eq('subject_name', subjectName)
    .eq('class_id', classId)
    .maybeSingle();

  return apiSuccess({ slotId: slotData?.id || null }, context.request, { startTime });
}

export async function handleGetSchoolSchedule(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { educatorId, schoolId, dayOfWeek } = params;
  if (!educatorId || !schoolId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId or schoolId', context.request, { startTime });

  try {
    const currentYear = new Date().getFullYear();
    const { data: timetables } = await supabase
      .from('timetables')
      .select('id')
      .eq('school_id', schoolId)
      .eq('academic_year', `${currentYear}-${currentYear + 1}`)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!timetables || timetables.length === 0) {
      return apiSuccess({ slots: [] }, context.request, { startTime });
    }

    const { data: slots, error } = await supabase
      .from('timetable_slots')
      .select(`
        id,
        day_of_week,
        period_number,
        start_time,
        end_time,
        subject_name,
        room_number,
        class_id,
        school_classes (
          name,
          grade,
          section,
          current_learners
        )
      `)
      .eq('timetable_id', timetables[0].id)
      .eq('educator_id', educatorId)
      .eq('day_of_week', dayOfWeek)
      .order('period_number');

    if (error) return apiDbError(error, context.request, { startTime });
    return apiSuccess({ slots: slots || [] }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleGetCollegeSchedule(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { educatorId, collegeId, selectedDate } = params;
  if (!educatorId || !collegeId) return apiError(400, 'VALIDATION_ERROR', 'Missing educatorId or collegeId', context.request, { startTime });

  try {
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('college_attendance_sessions')
      .select(`
        id,
        date,
        start_time,
        end_time,
        subject_name,
        subject_code,
        course_type,
        department_name,
        program_name,
        semester,
        section,
        academic_year,
        room_number,
        total_learners,
        present_count,
        absent_count,
        status
      `)
      .eq('faculty_id', educatorId)
      .eq('date', selectedDate)
      .eq('college_id', collegeId)
      .order('start_time');

    if (sessionsError) return apiDbError(sessionsError, context.request, { startTime });
    return apiSuccess({ sessions: existingSessions || [] }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleProcessSchoolSlots(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, classIds, selectedDate } = params;
  if (!schoolId || !classIds?.length) return apiError(400, 'VALIDATION_ERROR', 'Missing schoolId or classIds', context.request, { startTime });

  try {
    const { data: allLearners } = await supabase
      .from('learners')
      .select('id, school_class_id')
      .in('school_class_id', classIds)
      .eq('is_deleted', false);

    const learnersByClass: Record<string, string[]> = {};
    allLearners?.forEach(learner => {
      if (!learnersByClass[learner.school_class_id]) {
        learnersByClass[learner.school_class_id] = [];
      }
      learnersByClass[learner.school_class_id].push(learner.id);
    });

    const allLearnerIds = allLearners?.map(s => s.id) || [];
    const { data: attendanceRecords } = allLearnerIds.length > 0 ? await supabase
      .from('attendance_records')
      .select('learner_id, slot_id')
      .eq('school_id', schoolId)
      .eq('date', selectedDate)
      .in('learner_id', allLearnerIds)
      .not('slot_id', 'is', null) : { data: [] };

    return apiSuccess({
      learnersByClass,
      attendanceRecords: attendanceRecords || []
    }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleStartSchoolAttendanceSession(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { schoolId, slotId, classId, selectedDate } = params;
  if (!schoolId || !slotId || !classId) return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });

  try {
    const { data: classlearners } = await supabase
      .from('learners')
      .select('id')
      .eq('school_class_id', classId)
      .eq('is_deleted', false);

    const classLearnerIds = classlearners?.map(s => s.id) || [];

    const { data: existingRecords } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('school_id', schoolId)
      .eq('date', selectedDate)
      .eq('slot_id', slotId)
      .in('learner_id', classLearnerIds);

    const { data: learners, error } = await supabase
      .from('learners')
      .select('id, name, roll_number, grade, section, profilePicture')
      .eq('school_class_id', classId)
      .eq('is_deleted', false)
      .order('roll_number');

    if (error) return apiDbError(error, context.request, { startTime });

    return apiSuccess({
      learners: learners || [],
      existingRecords: existingRecords || [],
      isSubmitted: (existingRecords && existingRecords.length > 0)
    }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}

export async function handleStartCollegeAttendanceSession(params: any, context: AuthenticatedContext, startTime: number) {
  const supabase = getSub(context);
  const { sessionId, classId, selectedDate } = params;
  if (!sessionId || !classId) return apiError(400, 'VALIDATION_ERROR', 'Missing required parameters', context.request, { startTime });

  try {
    const { data: existingRecords } = await supabase
      .from('college_attendance_records')
      .select('*')
      .eq('session_id', sessionId)
      .eq('date', selectedDate);

    const classParts = classId.split('-');
    const secondToLast = classParts[classParts.length - 2];
    const isOldFormat = !isNaN(parseInt(secondToLast)) && secondToLast.length <= 2;

    let program_id: string;
    const section = classParts[classParts.length - 1];
    const semesterValue = parseInt(classParts[classParts.length - 2]);

    if (isOldFormat) {
      const programNameParts = classParts.slice(1, classParts.length - 2);
      const programName = programNameParts.join('-');
      const { data: programData } = await supabase
        .from('programs')
        .select('id')
        .eq('name', programName)
        .maybeSingle();
      if (!programData) return apiError(400, 'NOT_FOUND', `Program not found: ${programName}`, context.request, { startTime });
      program_id = programData.id;
    } else {
      const programIdParts = classParts.slice(classParts.length - 7, classParts.length - 2);
      program_id = programIdParts.join('-');
    }

    const { data: learners, error: learnersError } = await supabase
      .from('learners')
      .select('id, name, roll_number, grade, section, profilePicture')
      .eq('is_deleted', false)
      .eq('program_id', program_id)
      .eq('semester', semesterValue)
      .eq('section', section)
      .order('roll_number');

    if (learnersError) return apiDbError(learnersError, context.request, { startTime });

    return apiSuccess({
      existingRecords: existingRecords || [],
      isSubmitted: (existingRecords && existingRecords.length > 0),
      learners: (learners || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        roll_number: s.roll_number || 'N/A',
        grade: `Semester ${semesterValue}`,
        section: s.section || section,
        profilePicture: s.profilePicture
      }))
    }, context.request, { startTime });
  } catch (error) {
    return apiDbError(error, context.request, { startTime });
  }
}






