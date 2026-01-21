import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Assessment,
  AssessmentType,
  CurriculumSubject,
  ExamRoom,
  examsService,
  ExamTimetable,
  MarkEntry,
  SchoolClass,
  SchoolEducator,
  Student,
} from '../services/examsService';

// Transform database types to UI types
export interface UIExam {
  id: string;
  name: string;
  type: string;
  grade: string;
  section?: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  subjects: UISubject[];
  timetable: UITimetableEntry[];
  invigilation: UIInvigilationDuty[];
  marks: UISubjectMarks[];
  status: string;
  instructions?: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  isModerated?: boolean;
  // New targeting system
  targetClasses?: {
    type: 'single_section' | 'whole_grade' | 'multiple_sections';
    grade: string;
    sections: string[] | null;
    class_ids: string[];
  };
}

export interface UISubject {
  id: string;
  name: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
}

export interface UITimetableEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface UIInvigilationDuty {
  id: string;
  timetableEntryId: string;
  teacherId: string;
  teacherName: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface UIStudentMark {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marks: number | null;
  isAbsent: boolean;
  isExempt: boolean;
  remarks?: string;
  originalMarks?: number | null;
  moderatedBy?: string;
  moderatedAt?: string;
  moderationReason?: string;
  moderationType?: string; // Individual moderation type for each student
  markEntryId?: string; // Add mark entry ID for moderation
}

export interface UISubjectMarks {
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  studentMarks: UIStudentMark[];
  submittedBy?: string;
  submittedAt?: string;
  isModerated?: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
}

export interface UITeacher {
  id: string;
  name: string;
}

export interface UIRoom {
  id: string;
  name: string;
  capacity?: number;
}

export const useExams = (schoolId?: string, collegeId?: string) => {
  const [exams, setExams] = useState<UIExam[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>([]);
  const [teachers, setTeachers] = useState<SchoolEducator[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [allSchoolRooms, setAllSchoolRooms] = useState<any[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transform database assessment to UI exam
  const transformAssessmentToExam = useCallback(
    (
      assessment: Assessment,
      timetable: ExamTimetable[] = [],
      markEntries: any[] = [],
      invigilations: any[] = []
    ): UIExam => {
      // Extract subjects from syllabus_coverage or create single subject fallback
      let subjects: UISubject[] = [];

      if (assessment.syllabus_coverage?.subjects) {
        // Multi-subject exam - read from syllabus_coverage
        subjects = assessment.syllabus_coverage.subjects.map((subject: any) => ({
          id: subject.id || assessment.course_id,
          name: subject.name,
          totalMarks: subject.totalMarks || 100,
          passingMarks: subject.passingMarks || 35,
          duration: subject.duration || 180,
        }));
      } else {
        // Single subject fallback
        subjects = [
          {
            id: assessment.course_id || assessment.id, // Use assessment.id if course_id is null
            name: assessment.course_name,
            totalMarks: Number(assessment.total_marks) || 100,
            passingMarks: Number(assessment.pass_marks) || 35,
            duration: assessment.duration_minutes || 180,
          },
        ];
      }

      // Transform timetable
      const uiTimetable: UITimetableEntry[] = timetable.map((tt) => ({
        id: tt.id,
        subjectId: assessment.id,
        subjectName: tt.course_name,
        date: tt.exam_date,
        startTime: tt.start_time,
        endTime: tt.end_time,
        room: tt.room,
      }));

      // Transform invigilation duties from database
      const uiInvigilation: UIInvigilationDuty[] = invigilations.map((inv: any) => {
        // Find the corresponding timetable entry to get room info
        const correspondingTimetable = timetable.find((tt) => tt.id === inv.exam_timetable_id);

        return {
          id: inv.id,
          timetableEntryId: inv.exam_timetable_id,
          teacherId: inv.educator_id || inv.invigilator_id, // Use educator_id if available, fallback to user_id
          teacherName: inv.invigilator_name,
          room: correspondingTimetable?.room || inv.exam_timetable?.room || '',
          date: inv.duty_date,
          startTime: inv.duty_start_time,
          endTime: inv.duty_end_time,
        };
      });

      // Transform marks - now organized by subject_id
      const uiMarks: UISubjectMarks[] = [];

      // Group mark entries by subject_id
      const marksBySubject = new Map<string, any[]>();
      markEntries.forEach((entry) => {
        const subjectId = entry.subject_id;
        if (subjectId) {
          if (!marksBySubject.has(subjectId)) {
            marksBySubject.set(subjectId, []);
          }
          marksBySubject.get(subjectId)!.push(entry);
        }
      });

      // Create UISubjectMarks for each subject that has marks
      marksBySubject.forEach((entries, subjectId) => {
        const subject = subjects.find((s) => s.id === subjectId);
        if (subject) {
          const studentMarks: UIStudentMark[] = entries.map((entry) => {
            // Determine if this entry has been moderated
            const hasModeration =
              entry.original_marks !== null ||
              entry.moderated_by !== null ||
              (entry.mark_moderation_log && entry.mark_moderation_log.length > 0);

            return {
              studentId: entry.student_id,
              studentName: entry.students?.name || 'Unknown',
              rollNumber: entry.students?.roll_number || entry.students?.admission_number || 'N/A',
              marks: entry.marks_obtained ? Number(entry.marks_obtained) : null,
              isAbsent: entry.is_absent,
              isExempt: entry.is_exempt,
              remarks: entry.remarks,
              // Only show original marks if there's actual moderation
              originalMarks: hasModeration ? entry.original_marks : null,
              moderatedBy: hasModeration ? entry.moderated_by : null,
              moderatedAt: hasModeration ? entry.moderation_date : null,
              moderationReason: hasModeration
                ? entry.mark_moderation_log?.[0]?.reason || entry.moderation_reason
                : null,
              moderationType: hasModeration
                ? entry.mark_moderation_log?.[0]?.moderation_type
                : null,
              markEntryId: entry.id,
            };
          });

          // Check if this subject has any moderation (either in logs or in mark entries)
          const hasModeration = entries.some(
            (entry) =>
              (entry.mark_moderation_log && entry.mark_moderation_log.length > 0) ||
              entry.original_marks !== null ||
              entry.moderated_by !== null
          );

          // Get all moderation logs for this specific subject
          const allSubjectLogs = entries
            .flatMap((entry) => entry.mark_moderation_log || [])
            .filter((log: any) => {
              // Convert both to strings for comparison to handle type mismatches
              const logSubjectId = String(log.subject_id);
              const targetSubjectId = String(subjectId);
              return logSubjectId === targetSubjectId;
            });

          // Smart logic:
          // - If no moderation needed, subject is automatically ready
          // - If has moderation, it needs manual approval
          const isModerated =
            !hasModeration ||
            (hasModeration &&
              allSubjectLogs.length > 0 &&
              allSubjectLogs.every((log: any) => log.approval_status === 'approved'));

          uiMarks.push({
            subjectId: subject.id,
            subjectName: subject.name,
            totalMarks: subject.totalMarks,
            studentMarks,
            submittedBy: 'System',
            submittedAt: new Date().toISOString(),
            isModerated: isModerated,
            moderatedBy: isModerated ? 'System' : undefined,
            moderatedAt: isModerated ? new Date().toISOString() : undefined,
          });
        }
      });

      return {
        id: assessment.id,
        name: assessment.assessment_code,
        type: assessment.type,
        // Extract grade and section from target_classes or fallback to old logic
        grade:
          assessment.target_classes?.grade ||
          assessment.syllabus_coverage?.grade ||
          assessment.course_code?.split('-')[0] ||
          String(assessment.semester) ||
          '10',
        section:
          assessment.target_classes?.type === 'single_section'
            ? assessment.target_classes.sections?.[0]
            : undefined,
        academicYear: assessment.academic_year,
        startDate:
          assessment.start_date ||
          timetable[0]?.exam_date ||
          new Date().toISOString().split('T')[0],
        endDate:
          assessment.end_date ||
          timetable[timetable.length - 1]?.exam_date ||
          new Date().toISOString().split('T')[0],
        subjects,
        timetable: uiTimetable,
        invigilation: uiInvigilation, // Now populated from database
        marks: uiMarks,
        status: assessment.status || 'draft',
        instructions: assessment.instructions,
        createdBy: 'Admin',
        createdAt: assessment.created_at || new Date().toISOString(),
        publishedAt: assessment.is_published ? assessment.updated_at : undefined,
        isModerated: markEntries.some((entry) => entry.moderated_by),
        // New targeting system
        targetClasses: assessment.target_classes || {
          type: 'whole_grade',
          grade: assessment.syllabus_coverage?.grade || String(assessment.semester) || '10',
          sections: null,
          class_ids: [],
        },
      };
    },
    []
  );

  // Load initial data
  const loadData = useCallback(
    async (forceRefresh = false) => {
      // Don't load data if we don't have schoolId or collegeId yet
      if (!schoolId && !collegeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          assessmentsData,
          assessmentTypesData,
          subjectsData,
          teachersData,
          roomsData,
          allSchoolRoomsData,
          classesData,
        ] = await Promise.all([
          examsService.getAssessments(schoolId, collegeId),
          examsService.getAssessmentTypes(schoolId),
          examsService.getSubjects(),
          examsService.getEducators(schoolId),
          examsService.getExamRooms(schoolId, collegeId),
          schoolId ? examsService.getAllSchoolRooms(schoolId) : Promise.resolve([]),
          schoolId ? examsService.getSchoolClasses(schoolId) : Promise.resolve([]),
        ]);

        // Transform assessments to exams
        const transformedExams: UIExam[] = [];
        for (const assessment of assessmentsData) {
          const timetable = await examsService.getExamTimetable(assessment.id);

          // Get all mark entries for this assessment (we'll organize by subject later)
          const allMarkEntries = await examsService.getMarkEntries(assessment.id);

          // Load invigilation assignments for all timetable entries
          const invigilationPromises = timetable.map((tt) =>
            examsService.getInvigilatorAssignments(tt.id)
          );
          const invigilationResults = await Promise.all(invigilationPromises);
          const allInvigilations = invigilationResults.flat();

          // Map user_ids back to school_educators.id for UI consistency
          const invigilationsWithEducatorIds = await Promise.all(
            allInvigilations.map(async (inv) => {
              // Find the school_educators record that matches this user_id
              const { data: educatorData } = await supabase
                .from('school_educators')
                .select('id')
                .eq('user_id', inv.invigilator_id)
                .maybeSingle();

              return {
                ...inv,
                educator_id: educatorData?.id || inv.invigilator_id, // Fallback to user_id if not found
              };
            })
          );

          transformedExams.push(
            transformAssessmentToExam(
              assessment,
              timetable,
              allMarkEntries,
              invigilationsWithEducatorIds
            )
          );
        }

        setExams(transformedExams);
        setAssessmentTypes(assessmentTypesData);
        setSubjects(subjectsData);
        setTeachers(teachersData);
        setRooms(roomsData);
        setAllSchoolRooms(allSchoolRoomsData);
        setClasses(classesData);
      } catch (err) {
        console.error('Error loading exam data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [schoolId, collegeId, transformAssessmentToExam]
  );

  // Load students using new target classes system
  const loadStudents = useCallback(
    async (targetClasses?: any, grade?: string, section?: string): Promise<any[]> => {
      try {
        let studentsData: any[] = [];

        if (targetClasses?.class_ids?.length > 0) {
          // Use new target classes approach (preferred)
          studentsData = await examsService.getStudentsByTargetClasses(targetClasses);
        } else if (grade) {
          // Fallback: build target classes from grade/section
          const builtTargetClasses = await examsService.buildTargetClasses(
            schoolId!,
            grade,
            section
          );
          studentsData = await examsService.getStudentsByTargetClasses(builtTargetClasses);
        } else {
          studentsData = [];
        }

        setStudents(studentsData);
        return studentsData;
      } catch (err) {
        console.error('Error loading students:', err);
        throw err;
      }
    },
    [schoolId, collegeId]
  );

  // Create exam
  const createExam = useCallback(
    async (examData: Partial<UIExam>, userId?: string) => {
      try {
        // Use provided userId or fallback to supabase auth
        let currentUserId = userId;
        if (!currentUserId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          currentUserId = user.id;
        }

        // Build target classes from grade/section
        const targetClasses = await examsService.buildTargetClasses(
          schoolId!,
          examData.grade || '1',
          examData.section
        );

        // Get teacher_id from school_educators table (not user.id)
        const { data: educatorData, error: educatorError } = await supabase
          .from('school_educators')
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (educatorError || !educatorData) {
          throw new Error('Teacher record not found in school_educators table');
        }

        // Transform UI exam to database assessment
        const assessment: Partial<Assessment> = {
          assessment_code: examData.name || 'New Assessment',
          type: examData.type || 'exam',
          academic_year: examData.academicYear || new Date().getFullYear().toString(),

          // Add start_date and end_date
          start_date: examData.startDate,
          end_date: examData.endDate,

          // Use new school-specific fields
          school_id: schoolId,
          teacher_id: educatorData.id, // School educator ID (not user.id)

          // New targeting system
          target_classes: targetClasses,

          // Keep college fields null for school assessments
          college_id: undefined,
          faculty_id: undefined,
          department_id: undefined,
          program_id: undefined,

          // Use grade as semester for compatibility
          semester: parseInt(examData.grade || '1'),

          // For school assessments, course_id should be null (college concept)
          course_id: undefined,

          // Handle multiple subjects
          course_name:
            examData.subjects && examData.subjects.length > 1
              ? `${examData.name} (${examData.subjects.length} subjects)`
              : examData.subjects?.[0]?.name || 'General',

          course_code: `${examData.grade || 'GEN'}-${examData.section || 'ALL'}`,

          // Calculate totals from all subjects
          duration_minutes:
            examData.subjects?.reduce((total, subject) => total + (subject.duration || 0), 0) ||
            180,
          total_marks:
            examData.subjects?.reduce((total, subject) => total + (subject.totalMarks || 0), 0) ||
            100,
          pass_marks:
            examData.subjects?.reduce((total, subject) => total + (subject.passingMarks || 0), 0) ||
            35,

          // Store all subjects in syllabus_coverage JSONB field
          syllabus_coverage:
            examData.subjects && examData.subjects.length > 0
              ? {
                  subjects: examData.subjects.map((subject) => ({
                    id: subject.id,
                    name: subject.name,
                    totalMarks: subject.totalMarks,
                    passingMarks: subject.passingMarks,
                    duration: subject.duration,
                  })),
                  totalSubjects: examData.subjects.length,
                  examType: 'multi-subject',
                  grade: examData.grade,
                  section: examData.section,
                }
              : undefined,

          instructions: examData.instructions,
          status: 'draft',
          is_published: false,
          is_locked: false,
          created_by: currentUserId,
        };

        const newAssessment = await examsService.createAssessment(assessment);
        const newExam = transformAssessmentToExam(newAssessment);

        setExams((prev) => [...prev, newExam]);
        return newExam;
      } catch (err) {
        console.error('Error creating exam:', err);
        throw err;
      }
    },
    [schoolId, collegeId, transformAssessmentToExam]
  );

  // Update exam
  const updateExam = useCallback(async (examId: string, updates: Partial<UIExam>) => {
    try {
      // Transform UI updates to database updates
      const assessmentUpdates: Partial<Assessment> = {
        assessment_code: updates.name,
        type: updates.type,
        academic_year: updates.academicYear,
        start_date: updates.startDate,
        end_date: updates.endDate,
        instructions: updates.instructions,
        status: updates.status,
        is_published: updates.status === 'published',
        updated_at: new Date().toISOString(),
      };

      await examsService.updateAssessment(examId, assessmentUpdates);

      setExams((prev) => prev.map((exam) => (exam.id === examId ? { ...exam, ...updates } : exam)));
    } catch (err) {
      console.error('Error updating exam:', err);
      throw err;
    }
  }, []);

  // Create timetable entry
  const createTimetableEntry = useCallback(
    async (examId: string, entry: Omit<UITimetableEntry, 'id'>) => {
      try {
        // Get the exam details for context
        const exam = exams.find((e) => e.id === examId);
        if (!exam) {
          throw new Error('Exam not found');
        }

        // Ensure time format is HH:MM:SS for database
        const formatTime = (time: string) => {
          if (time.includes(':') && time.split(':').length === 2) {
            return time + ':00'; // Add seconds if not present
          }
          return time;
        };

        // Validate date range - ensure exam date is within the assessment period
        if (exam.startDate && exam.endDate) {
          if (entry.date < exam.startDate || entry.date > exam.endDate) {
            throw new Error(
              `Exam date must be between ${new Date(exam.startDate).toLocaleDateString()} and ${new Date(exam.endDate).toLocaleDateString()}`
            );
          }
        }

        // Validate time range
        const startTime = formatTime(entry.startTime);
        const endTime = formatTime(entry.endTime);

        if (startTime >= endTime) {
          throw new Error('End time must be after start time');
        }

        // Get class_id for the exam using target_classes
        const firstClassId = exam.targetClasses?.class_ids?.[0] || null;

        // Find the actual subject ID from curriculum_subjects
        let actualSubjectId = null;
        if (schoolId) {
          const { data: subjectData, error: subjectError } = await supabase
            .from('curriculum_subjects')
            .select('id')
            .eq('name', entry.subjectName)
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .maybeSingle();

          if (!subjectError && subjectData) {
            actualSubjectId = subjectData.id;
          }
        }

        // Create professional course code: GRADE-SECTION-SUBJECT
        const courseCode = `${exam.grade}-${exam.section || 'ALL'}-${entry.subjectName.substring(0, 3).toUpperCase()}`;

        const timetableEntry: Partial<ExamTimetable> = {
          assessment_id: examId,
          course_name: entry.subjectName, // Subject name for display
          course_code: courseCode, // Professional format: 10-A-PSY
          exam_date: entry.date,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: 180, // Default duration
          room: entry.room || '',
          status: 'scheduled',
          batch_section: `${exam.grade}-${exam.section || 'ALL'}`,
          // Professional schema fields
          subject_id: actualSubjectId || undefined,
          school_id: schoolId,
          class_id: firstClassId || undefined,
        };

        const newEntry = await examsService.createTimetableEntry(timetableEntry);

        // Create the new timetable entry for UI
        const newUIEntry = {
          id: newEntry.id,
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
          date: entry.date,
          startTime: entry.startTime, // Keep original format for UI
          endTime: entry.endTime, // Keep original format for UI
          room: entry.room,
        };

        // Update local state immediately for better UX
        setExams((prev) =>
          prev.map((exam) =>
            exam.id === examId
              ? {
                  ...exam,
                  timetable: [...exam.timetable, newUIEntry],
                }
              : exam
          )
        );

        // Return the new entry so the component can use it if needed
        return newUIEntry;
      } catch (err) {
        console.error('Error creating timetable entry:', err);
        throw err;
      }
    },
    [exams, schoolId]
  );

  // Delete timetable entry
  const deleteTimetableEntry = useCallback(
    async (examId: string, entryId: string) => {
      try {
        await examsService.deleteTimetableEntry(entryId);

        // Update local state immediately
        setExams((prev) =>
          prev.map((exam) =>
            exam.id === examId
              ? {
                  ...exam,
                  timetable: exam.timetable.filter((t) => t.id !== entryId),
                }
              : exam
          )
        );

        // Optional: Refresh the exam data in background for consistency (but don't await it)
        loadData().catch(console.error);
      } catch (err) {
        console.error('Error deleting timetable entry:', err);
        throw err;
      }
    },
    [loadData]
  );

  // Create invigilation assignment
  const createInvigilationAssignment = useCallback(
    async (
      examId: string,
      assignment: {
        timetableEntryId: string;
        teacherId: string;
        teacherName: string;
        room?: string;
      },
      userId?: string
    ) => {
      try {
        // Use provided userId or fallback to supabase auth
        let currentUserId = userId;
        if (!currentUserId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          currentUserId = user.id;
        }

        // Find the timetable entry to get date and time info
        const exam = exams.find((e) => e.id === examId);
        const timetableEntry = exam?.timetable.find((t) => t.id === assignment.timetableEntryId);

        if (!timetableEntry) {
          throw new Error('Timetable entry not found');
        }

        // Get the user_id from school_educators table since invigilator_id references users.id
        const { data: educatorData, error: educatorError } = await supabase
          .from('school_educators')
          .select('user_id')
          .eq('id', assignment.teacherId)
          .maybeSingle();

        if (educatorError || !educatorData?.user_id) {
          throw new Error('Could not find user ID for the selected teacher');
        }

        const invAssignment = {
          exam_timetable_id: assignment.timetableEntryId,
          invigilator_id: educatorData.user_id, // Use user_id from school_educators
          invigilator_name: assignment.teacherName,
          duty_date: timetableEntry.date,
          duty_start_time: timetableEntry.startTime,
          duty_end_time: timetableEntry.endTime,
          // exam_room_id expects a UUID, but we have room names, so we'll leave it null for now
          // The room information is stored in the exam_timetable record
          exam_room_id: null,
          assigned_by: currentUserId, // Use actual user ID
        };

        const newAssignment = await examsService.createInvigilatorAssignment(invAssignment);

        // Create the new duty for UI
        const newDuty: UIInvigilationDuty = {
          id: newAssignment.id,
          timetableEntryId: assignment.timetableEntryId,
          teacherId: assignment.teacherId, // Keep using school_educators.id for UI consistency
          teacherName: assignment.teacherName,
          room: assignment.room || timetableEntry.room || '', // Use override room or timetable room
          date: timetableEntry.date,
          startTime: timetableEntry.startTime,
          endTime: timetableEntry.endTime,
        };

        // Update local state immediately
        setExams((prev) =>
          prev.map((exam) =>
            exam.id === examId
              ? {
                  ...exam,
                  invigilation: [...exam.invigilation, newDuty],
                }
              : exam
          )
        );

        // Return the new duty so the component can use it if needed
        return newDuty;
      } catch (err) {
        console.error('Error creating invigilation assignment:', err);
        throw err;
      }
    },
    [exams, loadData]
  );

  // Delete invigilation assignment
  const deleteInvigilationAssignment = useCallback(
    async (examId: string, assignmentId: string) => {
      try {
        await examsService.deleteInvigilatorAssignment(assignmentId);

        // Update local state immediately
        setExams((prev) =>
          prev.map((exam) =>
            exam.id === examId
              ? {
                  ...exam,
                  invigilation: exam.invigilation.filter((i) => i.id !== assignmentId),
                }
              : exam
          )
        );

        // Optional: Refresh data in background for consistency (but don't await it)
        loadData().catch(console.error);
      } catch (err) {
        console.error('Error deleting invigilation assignment:', err);
        throw err;
      }
    },
    [loadData]
  );

  // Save marks
  const saveMarks = useCallback(
    async (examId: string, subjectId: string, studentMarks: UIStudentMark[], userId?: string) => {
      try {
        // Use provided userId or fallback to supabase auth
        let currentUserId = userId;
        if (!currentUserId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          currentUserId = user.id;
        }

        const markEntries: Partial<MarkEntry>[] = studentMarks.map((mark) => ({
          assessment_id: examId,
          student_id: mark.studentId, // This should be the student's UUID from the students table
          subject_id: subjectId, // Include the subject_id
          marks_obtained: mark.marks || undefined, // Convert null to undefined
          total_marks: 100, // You might want to get this from the subject
          is_absent: mark.isAbsent,
          is_exempt: mark.isExempt,
          remarks: mark.remarks,
          entered_by: currentUserId,
          entered_at: new Date().toISOString(),
          is_locked: false,
        }));

        const savedEntries = await examsService.saveMarkEntries(markEntries);

        // Update studentMarks with the returned mark entry IDs
        const updatedStudentMarks = studentMarks.map((mark) => {
          const savedEntry = savedEntries.find((entry) => entry.student_id === mark.studentId);
          return {
            ...mark,
            markEntryId: savedEntry?.id,
          };
        });

        // Update local state
        setExams((prev) =>
          prev.map((exam) => {
            if (exam.id === examId) {
              const existingMarkIndex = exam.marks.findIndex((m) => m.subjectId === subjectId);
              const subjectMarks: UISubjectMarks = {
                subjectId,
                subjectName: exam.subjects.find((s) => s.id === subjectId)?.name || 'Unknown',
                totalMarks: exam.subjects.find((s) => s.id === subjectId)?.totalMarks || 100,
                studentMarks: updatedStudentMarks,
                submittedBy: 'Current User',
                submittedAt: new Date().toISOString(),
              };

              if (existingMarkIndex >= 0) {
                const updatedMarks = [...exam.marks];
                updatedMarks[existingMarkIndex] = subjectMarks;
                return { ...exam, marks: updatedMarks };
              } else {
                return { ...exam, marks: [...exam.marks, subjectMarks] };
              }
            }
            return exam;
          })
        );
      } catch (err) {
        console.error('Error saving marks:', err);
        throw err;
      }
    },
    []
  );

  // Publish exam
  const publishExam = useCallback(async (examId: string) => {
    try {
      await examsService.publishAssessment(examId);

      setExams((prev) =>
        prev.map((exam) =>
          exam.id === examId
            ? {
                ...exam,
                status: 'published',
                publishedAt: new Date().toISOString(),
              }
            : exam
        )
      );
    } catch (err) {
      console.error('Error publishing exam:', err);
      throw err;
    }
  }, []);

  // Moderate marks
  const moderateMarks = useCallback(
    async (
      markEntryId: string,
      moderationData: {
        assessment_id: string;
        student_id: string;
        subject_id: string; // Add subject_id parameter
        original_marks: number;
        marks_obtained: number;
        moderation_reason: string;
        moderation_type: string;
        moderated_by: string;
      }
    ) => {
      try {
        await examsService.moderateMarks(markEntryId, moderationData);

        // Don't refresh data here - let the calling code handle it to avoid race conditions
      } catch (err) {
        console.error('Error moderating marks:', err);
        throw err;
      }
    },
    []
  );

  // Approve subject moderation
  const approveSubjectModeration = useCallback(
    async (examId: string, subjectId: string, userId?: string) => {
      try {
        // Use provided userId or fallback to supabase auth
        let currentUserId = userId;
        if (!currentUserId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user?.id) {
            throw new Error('User not authenticated');
          }
          currentUserId = user.id;
        }

        const result = await examsService.approveSubjectModeration(
          examId,
          subjectId,
          currentUserId
        );

        // Update local state immediately for better UX
        setExams((prev) => {
          const updated = prev.map((exam) => {
            if (exam.id === examId) {
              const updatedMarks = exam.marks.map((subjectMarks) => {
                if (subjectMarks.subjectId === subjectId) {
                  return {
                    ...subjectMarks,
                    isModerated: true,
                    moderatedBy: 'Current User',
                    moderatedAt: new Date().toISOString(),
                  };
                }
                return subjectMarks;
              });
              return { ...exam, marks: updatedMarks };
            }
            return exam;
          });
          return updated;
        });

        // Refresh the exam data in background to ensure consistency
        setTimeout(() => {
          loadData(true).catch(console.error); // Force refresh
        }, 100);
      } catch (err) {
        console.error('Error approving subject moderation:', err);
        throw err;
      }
    },
    [loadData]
  );

  // Get transformed data for UI components
  const getUITeachers = useCallback((): UITeacher[] => {
    return teachers.map((teacher) => ({
      id: teacher.id,
      name: `${teacher.first_name} ${teacher.last_name}`.trim(),
    }));
  }, [teachers]);

  const getUIRooms = useCallback((): UIRoom[] => {
    return rooms.map((room) => ({
      id: room.id,
      name: room.room_name,
      capacity: room.exam_capacity,
    }));
  }, [rooms]);

  const getAllUIRooms = useCallback(() => {
    return allSchoolRooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      description: room.description,
    }));
  }, [allSchoolRooms]);

  const getUISubjects = useCallback(() => {
    if (subjects.length === 0) {
      // Fallback subjects if none in database
      return [
        { id: 'math', name: 'Mathematics' },
        { id: 'physics', name: 'Physics' },
        { id: 'chemistry', name: 'Chemistry' },
        { id: 'biology', name: 'Biology' },
        { id: 'english', name: 'English' },
        { id: 'hindi', name: 'Hindi' },
        { id: 'social', name: 'Social Studies' },
        { id: 'computer', name: 'Computer Science' },
      ];
    }

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
    }));
  }, [subjects]);

  // Get class room for the exam
  const getClassRoom = useCallback(
    async (grade: string, section?: string): Promise<string | null> => {
      if (!schoolId) return null;

      try {
        return await examsService.getClassRoom(schoolId, grade, section);
      } catch (error) {
        console.error('Error getting class room:', error);
        return null;
      }
    },
    [schoolId]
  );

  const getUIAssessmentTypes = useCallback(() => {
    if (assessmentTypes.length === 0) {
      // Fallback assessment types if none in database
      return [
        { value: 'periodic_test', label: 'Periodic Test', color: 'blue' },
        { value: 'term_exam', label: 'Term Exam', color: 'purple' },
        { value: 'skill_assessment', label: 'Skill Assessment', color: 'green' },
        { value: 'practical_exam', label: 'Practical Exam', color: 'amber' },
      ];
    }

    return assessmentTypes.map((type) => ({
      value: type.name.toLowerCase().replace(/\s+/g, '_'),
      label: type.name,
      color: 'blue', // Default color
    }));
  }, [assessmentTypes]);

  const getGrades = useCallback(() => {
    if (classes.length === 0) {
      // Fallback grades if none in database
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    }

    const uniqueGrades = [...new Set(classes.map((c) => c.grade))];
    return uniqueGrades.sort();
  }, [classes]);

  const getSections = useCallback(
    (grade?: string, academicYear?: string) => {
      if (!grade) return [];

      let filteredClasses = classes.filter((c) => c.grade === grade && c.section);

      // Filter by academic year if provided - handle both formats (with and without spaces)
      if (academicYear) {
        filteredClasses = filteredClasses.filter((c) => {
          if (!c.academic_year) return false;

          // Normalize both values by removing spaces around dashes for comparison
          const normalizedDbYear = c.academic_year.replace(/\s*-\s*/g, '-');
          const normalizedSearchYear = academicYear.replace(/\s*-\s*/g, '-');

          return normalizedDbYear === normalizedSearchYear;
        });
      }

      const sectionsForGrade = filteredClasses
        .map((c) => c.section!)
        .filter((section, index, arr) => arr.indexOf(section) === index);

      return sectionsForGrade.sort();
    },
    [classes]
  );

  useEffect(() => {
    // Only load data if we have schoolId or collegeId
    if (schoolId || collegeId) {
      loadData();
    }
  }, [loadData, schoolId, collegeId]);

  return {
    // Data
    exams,
    assessmentTypes: getUIAssessmentTypes(),
    subjects: getUISubjects(),
    teachers: getUITeachers(),
    rooms: getUIRooms(),
    allSchoolRooms: getAllUIRooms(),
    classes,
    grades: getGrades(),

    // State
    loading,
    error,

    // Actions
    loadData,
    loadStudents,
    createExam,
    updateExam,
    createTimetableEntry,
    deleteTimetableEntry,
    createInvigilationAssignment,
    deleteInvigilationAssignment,
    saveMarks,
    publishExam,
    moderateMarks,
    approveSubjectModeration,
    getSections,
    getClassRoom,

    // Utilities
    transformAssessmentToExam,
  };
};
