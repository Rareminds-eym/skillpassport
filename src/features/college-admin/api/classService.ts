import { format } from "date-fns"
import { supabase } from '@/shared/api/supabaseClient'
import { getLogger } from '@/shared/config/logging'

const logger = getLogger('class-service')

type PerformanceBand = "High" | "Medium" | "Low"

type ClassStatus = "Active" | "Completed" | "Upcoming"

export interface ClassLearner {
  id: string
  name: string
  email: string
  avatar?: string
  progress: number
  lastActive?: string
}

export interface ClassTask {
  id: string
  name: string
  dueDate: string
  skillTags: string[]
  referenceLink?: string
  attachment?: string
  status: "Pending" | "In Progress" | "Completed"
}

export interface ClassNote {
  id: string
  author: string
  content: string
  createdAt: string
}

export interface EducatorClass {
  id: string
  name: string
  course: string
  educator: string
  educatorEmail: string
  department: string
  year: string
  status: ClassStatus
  total_learners: number
  max_learners: number
  avg_progress: number
  performance_band: PerformanceBand
  skillAreas: string[]
  lastUpdated: string
  learners: ClassLearner[]
  tasks: ClassTask[]
  notes: ClassNote[]
}

export interface LearnerDirectoryEntry {
  id: string
  name: string
  email: string
  avatar?: string
  defaultProgress?: number
}

type ServiceResponse<T> = { data: T; error: null } | { data: null; error: string }

type MutateResponse<T> = { data: T; error: null } | { data: null; error: string }

const createId = () => `${Math.random().toString(36).slice(2, 10)}`

const computeAggregates = (classItem: EducatorClass) => {
  const total = classItem.learners.length
  const avg = total === 0 ? 0 : Math.round(classItem.learners.reduce((acc, curr) => acc + curr.progress, 0) / total)
  let band: PerformanceBand = "Low"
  if (avg >= 70) band = "High"
  else if (avg >= 40) band = "Medium"
  return { total, avg, band }
}

const syncClassAggregates = (classItem: EducatorClass) => {
  const { total, avg, band } = computeAggregates(classItem)
  classItem.total_learners = total
  classItem.avg_progress = avg
  classItem.performance_band = band
  return classItem
}

/**
 * Get class IDs assigned to an educator (works for both school and college)
 * @param educatorId - The UUID of the educator
 * @param educatorType - Type of educator ('school' or 'college')
 * @returns Array of class IDs
 */
export const getEducatorAssignedClassIds = async (educatorId: string, educatorType: 'school' | 'college'): Promise<string[]> => {
  try {
    if (educatorType === 'school') {
      const { data, error } = await supabase
        .from("school_educator_class_assignments")
        .select("class_id")
        .eq("educator_id", educatorId)

      if (error) {
        logger.error('Failed to fetch school educator assigned classes', error instanceof Error ? error : new Error(String(error)));
        return []
      }

      return (data || []).map(ac => ac.class_id)
    } else {
      const { data, error } = await supabase
        .from("college_faculty_class_assignments")
        .select("class_id")
        .eq("faculty_id", educatorId)

      if (error) {
        logger.error('Failed to fetch college educator assigned classes', error instanceof Error ? error : new Error(String(error)), {
          educatorId
        });
        return []
      }

      return (data || []).map(ac => ac.class_id)
    }
  } catch (err) {
    logger.error('Exception fetching educator assigned classes', err instanceof Error ? err : new Error(String(err)));
    return []
  }
}

const transformDBClassToClass = (dbClass: any, educatorType: 'school' | 'college' = 'school'): EducatorClass => {
  const metadata = dbClass.metadata || {}
  
  // Get class teacher info from the joined data
  let classTeacherName = "TBD"
  let classTeacherEmail = "Not assigned"
  
  if (educatorType === 'school') {
    classTeacherName = dbClass.class_teacher_first_name && dbClass.class_teacher_last_name 
      ? `${dbClass.class_teacher_first_name} ${dbClass.class_teacher_last_name}`.trim()
      : "TBD"
    classTeacherEmail = dbClass.class_teacher_email || "Not assigned"
  } else {
    // For college, get from faculty assignment
    classTeacherName = dbClass.faculty_first_name && dbClass.faculty_last_name 
      ? `${dbClass.faculty_first_name} ${dbClass.faculty_last_name}`.trim()
      : "TBD"
    classTeacherEmail = dbClass.faculty_email || "Not assigned"
  }
  
  return {
    id: dbClass.id,
    name: dbClass.name || `Grade ${dbClass.grade} - ${dbClass.section || 'General'}`,
    course: dbClass.grade || "General",
    educator: classTeacherName,
    educatorEmail: classTeacherEmail,
    department: dbClass.section || "General",
    year: dbClass.academic_year || String(new Date().getFullYear()),
    status: (metadata.status || "Active") as ClassStatus,
    total_learners: dbClass.current_learners || 0,
    max_learners: dbClass.max_learners || 40,
    avg_progress: 0,
    performance_band: "Low" as PerformanceBand,
    skillAreas: metadata.skillAreas || [],
    lastUpdated: dbClass.updated_at || new Date().toISOString(),
    learners: [],
    tasks: [],
    notes: []
  }
}

const calculatelearnerProgress = async (learnerId: string, classId: string): Promise<number> => {
  try {
    // Get all assignments for learners in this class
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("assignment_id, assign_classes")
      .eq("assign_classes", classId)
      .eq("is_deleted", false)

    if (assignmentsError || !assignments || assignments.length === 0) {
      return 0
    }

    const assignmentIds = assignments.map(a => a.assignment_id)

    // Get learner's assignment submissions
    const { data: learnerAssignments, error: learnerError } = await supabase
      .from("learner_assignments")
      .select("assignment_id, status, grade_percentage")
      .eq("learner_id", learnerId)
      .in("assignment_id", assignmentIds)
      .eq("is_deleted", false)

    if (learnerError || !learnerAssignments || learnerAssignments.length === 0) {
      return 0
    }

    // Calculate average progress
    const totalAssignments = assignments.length
    const completedCount = learnerAssignments.filter(sa => sa.status === "graded" || sa.status === "submitted").length
    const gradeSum = learnerAssignments
      .filter(sa => sa.grade_percentage !== null)
      .reduce((sum, sa) => sum + (sa.grade_percentage || 0), 0)
    const gradedCount = learnerAssignments.filter(sa => sa.grade_percentage !== null).length

    // Progress = (completion rate * 0.5) + (average grade * 0.5)
    const completionRate = (completedCount / totalAssignments) * 100
    const averageGrade = gradedCount > 0 ? gradeSum / gradedCount : 0
    const progress = (completionRate * 0.5) + (averageGrade * 0.5)

    return Math.round(progress)
  } catch (err) {
    logger.error('Exception calculating learner progress', err instanceof Error ? err : new Error(String(err)));
    return 0
  }
}

export const fetchEducatorClasses = async (
  schoolId?: string, 
  collegeId?: string, 
  educatorId?: string, 
  educatorType?: 'school' | 'college'
): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    // SECURITY: Always require educatorId for educator role to prevent unauthorized access
    if (!educatorId || !educatorType) {
      logger.warn('fetchEducatorClasses called without educatorId or educatorType');
      return { data: [], error: null }
    }

    if (educatorType === 'school') {
      return await fetchSchoolEducatorClasses(schoolId, educatorId)
    } else {
      return await fetchCollegeEducatorClasses(collegeId, educatorId)
    }
  } catch (err: any) {
    logger.error('Exception in fetchEducatorClasses', err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err?.message || "Unable to fetch classes" }
  }
}

const fetchSchoolEducatorClasses = async (schoolId?: string, educatorId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    // SECURITY: Verify educator exists and get only their assigned classes
    const { data: educatorCheck, error: educatorCheckError } = await supabase
      .from("school_educators")
      .select("id")
      .eq("id", educatorId)
      .maybeSingle()

    if (educatorCheckError || !educatorCheck) {
      logger.error('Invalid school educator ID', educatorCheckError instanceof Error ? educatorCheckError : new Error(String(educatorCheckError)));
      return { data: null, error: "Invalid educator credentials" }
    }

    // Get only the classes assigned to this specific educator
    const { data: assignments, error: assignmentError } = await supabase
      .from("school_educator_class_assignments")
      .select("class_id")
      .eq("educator_id", educatorId)

    if (assignmentError) {
      logger.error('Failed to fetch school educator assignments', assignmentError instanceof Error ? assignmentError : new Error(String(assignmentError)));
      return { data: null, error: assignmentError.message }
    }

    const classIds = (assignments || []).map(a => a.class_id)

    if (classIds.length === 0) {
      return { data: [], error: null }
    }

    // Build query to fetch only assigned classes with class teacher info
    let query = supabase
      .from("school_classes")
      .select(`
        *,
        class_teacher:school_educator_class_assignments(
          educator:school_educators(
            first_name,
            last_name,
            email
          )
        )
      `)
      .in("id", classIds)
      .eq("school_educator_class_assignments.is_primary", true)
      .eq("account_status", "active")
      .order("created_at", { ascending: false })

    // Additional school filter if provided
    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to fetch school classes', error instanceof Error ? error : new Error(String(error)));
      return { data: null, error: error.message }
    }

    // Process each class with additional data
    const classesWithlearners = await Promise.all(
      (data || []).map(async (dbClass) => {
        // Extract class teacher info
        const classTeacher = dbClass.class_teacher?.[0]?.educator
        const enrichedClass = {
          ...dbClass,
          class_teacher_first_name: classTeacher?.first_name,
          class_teacher_last_name: classTeacher?.last_name,
          class_teacher_email: classTeacher?.email
        }
        
        const classItem = transformDBClassToClass(enrichedClass, 'school')
        const learners = await fetchClasslearners(dbClass.id, 'school')
        classItem.learners = learners
        const tasks = await fetchClassTasks(dbClass.id)
        classItem.tasks = tasks
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithlearners, error: null }
  } catch (err: any) {
    logger.error('Exception in fetchSchoolEducatorClasses', err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err?.message || "Unable to fetch school classes" }
  }
}

const fetchCollegeEducatorClasses = async (collegeId?: string, educatorId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    // SECURITY: Verify educator exists and get only their assigned classes
    const { data: educatorCheck, error: educatorCheckError } = await supabase
      .from("college_lecturers")
      .select("id")
      .eq("id", educatorId)
      .maybeSingle()

    if (educatorCheckError || !educatorCheck) {
      logger.error('Invalid college educator ID', educatorCheckError instanceof Error ? educatorCheckError : new Error(String(educatorCheckError)));
      return { data: null, error: "Invalid educator credentials" }
    }

    // Get only the classes assigned to this specific educator
    const { data: assignments, error: assignmentError } = await supabase
      .from("college_faculty_class_assignments")
      .select("class_id")
      .eq("faculty_id", educatorId)

    if (assignmentError) {
      logger.error('Failed to fetch college educator assignments', assignmentError instanceof Error ? assignmentError : new Error(String(assignmentError)));
      return { data: null, error: assignmentError.message }
    }

    const classIds = (assignments || []).map(a => a.class_id)

    if (classIds.length === 0) {
      return { data: [], error: null }
    }

    // Build query to fetch only assigned classes with faculty info
    let query = supabase
      .from("college_classes")
      .select(`
        *,
        faculty:college_faculty_class_assignments(
          lecturer:college_lecturers(
            first_name,
            last_name,
            email
          )
        )
      `)
      .in("id", classIds)
      .eq("college_faculty_class_assignments.is_class_teacher", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    // Additional college filter if provided
    if (collegeId) {
      query = query.eq("college_id", collegeId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Failed to fetch college classes', error instanceof Error ? error : new Error(String(error)));
      return { data: null, error: error.message }
    }

    // Process each class with additional data
    const classesWithlearners = await Promise.all(
      (data || []).map(async (dbClass) => {
        // Extract faculty info
        const faculty = dbClass.faculty?.[0]?.lecturer
        const enrichedClass = {
          ...dbClass,
          faculty_first_name: faculty?.first_name,
          faculty_last_name: faculty?.last_name,
          faculty_email: faculty?.email
        }
        
        const classItem = transformDBClassToClass(enrichedClass, 'college')
        const learners = await fetchClasslearners(dbClass.id, 'college')
        classItem.learners = learners
        const tasks = await fetchClassTasks(dbClass.id)
        classItem.tasks = tasks
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithlearners, error: null }
  } catch (err: any) {
    logger.error('Exception in fetchCollegeEducatorClasses', err instanceof Error ? err : new Error(String(err)));
    return { data: null, error: err?.message || "Unable to fetch college classes" }
  }
}

/**
 * Fetch all classes for admin view (school admin, etc.)
 * This is separate from educator classes to maintain security
 */
export const fetchAllSchoolClasses = async (schoolId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    // Query all classes for admin view with class teacher info
    let query = supabase
      .from("school_classes")
      .select(`
        *,
        class_teacher:school_educator_class_assignments(
          educator:school_educators(
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq("school_educator_class_assignments.is_primary", true)
      .eq("account_status", "active")
      .order("created_at", { ascending: false })

    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    const classesWithlearners = await Promise.all(
      (data || []).map(async (dbClass) => {
        // Extract class teacher info
        const classTeacher = dbClass.class_teacher?.[0]?.educator
        const enrichedClass = {
          ...dbClass,
          class_teacher_first_name: classTeacher?.first_name,
          class_teacher_last_name: classTeacher?.last_name,
          class_teacher_email: classTeacher?.email
        }
        
        const classItem = transformDBClassToClass(enrichedClass)
        const learners = await fetchClasslearners(dbClass.id)
        classItem.learners = learners
        const tasks = await fetchClassTasks(dbClass.id)
        classItem.tasks = tasks
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithlearners, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch classes" }
  }
}

/**
 * Fetch assignments/tasks for a specific class
 */
export const fetchClassTasks = async (classId: string): Promise<ClassTask[]> => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("assign_classes", classId)
      .eq("is_deleted", false)
      .order("due_date", { ascending: true })

    if (error) {
      logger.error('Failed to fetch class tasks', error instanceof Error ? error : new Error(String(error)));
      return []
    }

    return (data || []).map((assignment: any) => ({
      id: assignment.assignment_id,
      name: assignment.title,
      dueDate: assignment.due_date,
      skillTags: assignment.skill_outcomes || [],
      referenceLink: assignment.document_pdf || undefined,
      attachment: undefined,
      status: assignment.is_deleted ? "Completed" : "Pending"
    }))
  } catch (err: any) {
    logger.error('Exception fetching class tasks', err instanceof Error ? err : new Error(String(err)));
    return []
  }
}

export const fetchClasslearners = async (classId: string, educatorType: 'school' | 'college' = 'school'): Promise<ClassLearner[]> => {
  try {
    const classIdField = educatorType === 'school' ? 'school_class_id' : 'college_class_id'
    
    const { data, error } = await supabase
      .from("learners")
      .select("id, name, email, updated_at, user_id")
      .eq(classIdField, classId)

    if (error) {
      logger.error('Failed to fetch class learners', error instanceof Error ? error : new Error(String(error)));
      return []
    }

    const learnersWithProgress = await Promise.all(
      (data || []).map(async (learner: any) => {
        const progress = await calculatelearnerProgress(learner.user_id || learner.id, classId)
        return {
          id: learner.id,
          name: learner.name || "Unknown",
          email: learner.email || "",
          progress: progress,
          lastActive: learner.updated_at || new Date().toISOString()
        }
      })
    )

    return learnersWithProgress
  } catch (err: any) {
    logger.error('Exception fetching class learners', err instanceof Error ? err : new Error(String(err)));
    return []
  }
}

export const getClassById = async (classId: string, educatorType: 'school' | 'college' = 'school'): Promise<ServiceResponse<EducatorClass>> => {
  try {
    if (educatorType === 'school') {
      return await getSchoolClassById(classId)
    } else {
      return await getCollegeClassById(classId)
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch class" }
  }
}

const getSchoolClassById = async (classId: string): Promise<ServiceResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("school_classes")
    .select(`
      *,
      class_teacher:school_educator_class_assignments(
        educator:school_educators(
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq("id", classId)
    .eq("school_educator_class_assignments.is_primary", true)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message || "School class not found" }
  }

  if (!data) {
    return { data: null, error: "School class not found" }
  }

  // Extract class teacher info
  const classTeacher = data.class_teacher?.[0]?.educator
  const enrichedClass = {
    ...data,
    class_teacher_first_name: classTeacher?.first_name,
    class_teacher_last_name: classTeacher?.last_name,
    class_teacher_email: classTeacher?.email
  }

  const classItem = transformDBClassToClass(enrichedClass, 'school')
  const learners = await fetchClasslearners(classId, 'school')
  classItem.learners = learners
  
  // Fetch tasks from assignments table
  const tasks = await fetchClassTasks(classId)
  classItem.tasks = tasks
  
  return { data: syncClassAggregates(classItem), error: null }
}

const getCollegeClassById = async (classId: string): Promise<ServiceResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("college_classes")
    .select(`
      *,
      faculty:college_faculty_class_assignments(
        lecturer:college_lecturers(
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq("id", classId)
    .eq("college_faculty_class_assignments.is_class_teacher", true)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message || "College class not found" }
  }

  if (!data) {
    return { data: null, error: "College class not found" }
  }

  // Extract faculty info
  const faculty = data.faculty?.[0]?.lecturer
  const enrichedClass = {
    ...data,
    faculty_first_name: faculty?.first_name,
    faculty_last_name: faculty?.last_name,
    faculty_email: faculty?.email
  }

  const classItem = transformDBClassToClass(enrichedClass, 'college')
  const learners = await fetchClasslearners(classId, 'college')
  classItem.learners = learners
  
  // Fetch tasks from assignments table
  const tasks = await fetchClassTasks(classId)
  classItem.tasks = tasks
  
  return { data: syncClassAggregates(classItem), error: null }
}

export const fetchlearnerDirectory = async (schoolId?: string, collegeId?: string): Promise<ServiceResponse<LearnerDirectoryEntry[]>> => {
  try {
    let query = supabase
      .from("learners")
      .select("id, name, email, school_id, college_id")
      .eq("is_deleted", false)
      .limit(100)

    if (schoolId) {
      // For school: get learners without a class assignment
      query = query
        .eq("school_id", schoolId)
        .is("school_class_id", null)
    } else if (collegeId) {
      // For college: get learners without a class assignment
      query = query
        .eq("college_id", collegeId)
        .is("college_class_id", null)
    } else {
      // If neither provided, return empty (for security)
      return { data: [], error: null }
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    const directory = (data || []).map((learner: any) => ({
      id: learner.id,
      name: learner.name || "Unknown",
      email: learner.email || "",
      defaultProgress: 0
    }))

    return { data: directory, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to load learners" }
  }
}

type AddlearnerPayload = {
  classId: string
  learner: { id?: string; name: string; email: string; progress?: number }
}

export const addlearnerToClass = async ({ classId, learner, educatorType = 'school' }: AddlearnerPayload & { educatorType?: 'school' | 'college' }): Promise<MutateResponse<EducatorClass>> => {
  try {
    const { data: classData, error: classError } = await getClassById(classId, educatorType)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    if (!learner.id) {
      return { data: null, error: "Learner ID is required" }
    }

    const classIdField = educatorType === 'school' ? 'school_class_id' : 'college_class_id'

    const { error: updateError } = await supabase
      .from("learners")
      .update({ [classIdField]: classId })
      .eq("id", learner.id)

    if (updateError) {
      logger.error('Failed to update learner class assignment', updateError instanceof Error ? updateError : new Error(String(updateError)));
      return { data: null, error: updateError.message || "Unable to add learner to class" }
    }

    const classTable = educatorType === 'school' ? 'school_classes' : 'college_classes'
    const { error: incrementError } = await supabase
      .from(classTable)
      .update({ 
        current_learners: classData.total_learners + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", classId)

    if (incrementError) {
      logger.error('Failed to increment learner count', incrementError instanceof Error ? incrementError : new Error(String(incrementError)));
    }

    const { data: updatedClass, error: fetchError } = await getClassById(classId, educatorType)
    if (fetchError || !updatedClass) {
      return { data: null, error: "Unable to fetch updated class" }
    }

    return { data: updatedClass, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to add learner" }
  }
}

export const removelearnerFromClass = async (classId: string, learnerId: string, educatorType: 'school' | 'college' = 'school'): Promise<MutateResponse<EducatorClass>> => {
  try {
    const { data: classData, error: classError } = await getClassById(classId, educatorType)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    const classIdField = educatorType === 'school' ? 'school_class_id' : 'college_class_id'
    const { error: updateError } = await supabase
      .from("learners")
      .update({ [classIdField]: null })
      .eq("id", learnerId)

    if (updateError) {
      return { data: null, error: updateError.message || "Unable to remove learner from class" }
    }

    const newCount = Math.max(0, classData.total_learners - 1)
    const classTable = educatorType === 'school' ? 'school_classes' : 'college_classes'
    const { error: decrementError } = await supabase
      .from(classTable)
      .update({ 
        current_learners: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", classId)

    if (decrementError) {
      logger.error('Failed to decrement learner count', decrementError instanceof Error ? decrementError : new Error(String(decrementError)));
    }

    const { data: updatedClass, error: fetchError } = await getClassById(classId, educatorType)
    if (fetchError || !updatedClass) {
      return { data: null, error: "Unable to fetch updated class" }
    }

    return { data: updatedClass, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to remove learner" }
  }
}

type AssignTaskPayload = {
  classId: string
  task: { name: string; dueDate: string; skillTags: string[]; referenceLink?: string; attachment?: string }
}

type CreateClassPayload = {
  name: string
  grade: string
  section: string
  academicYear: string
  maxlearners: number
  status: ClassStatus
  skillAreas: string[]
  schoolId?: string
  collegeId?: string
  educatorId: string
  educatorName: string
  educatorEmail: string
  educatorType: 'school' | 'college'
}

export const createClass = async (payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))

    if (payload.educatorType === 'school') {
      return await createSchoolClass(payload, skills)
    } else {
      return await createCollegeClass(payload, skills)
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to create class" }
  }
}

const createSchoolClass = async (payload: CreateClassPayload, skills: string[]): Promise<MutateResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("school_classes")
    .insert([
      {
        school_id: payload.schoolId,
        name: payload.name,
        grade: payload.grade,
        section: payload.section,
        academic_year: payload.academicYear,
        max_learners: payload.maxlearners,
        current_learners: 0,
        account_status: "active",
        metadata: {
          skillAreas: skills,
          status: payload.status,
          educator: payload.educatorName,
          educatorEmail: payload.educatorEmail,
          educatorId: payload.educatorId
        }
      }
    ])
    .select("*")
    .single()

  if (error) {
    return { data: null, error: error.message || "Unable to create school class" }
  }

  if (!data) {
    return { data: null, error: "Unable to create school class" }
  }

  const classItem = transformDBClassToClass(data, 'school')
  classItem.skillAreas = skills
  classItem.status = payload.status
  classItem.educator = payload.educatorName
  classItem.educatorEmail = payload.educatorEmail

  return {
    data: syncClassAggregates(classItem),
    error: null
  }
}

const createCollegeClass = async (payload: CreateClassPayload, skills: string[]): Promise<MutateResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("college_classes")
    .insert([
      {
        college_id: payload.collegeId,
        name: payload.name,
        grade: payload.grade,
        section: payload.section,
        academic_year: payload.academicYear,
        max_learners: payload.maxlearners,
        current_learners: 0,
        status: "active",
        metadata: {
          skillAreas: skills,
          status: payload.status,
          educator: payload.educatorName,
          educatorEmail: payload.educatorEmail,
          educatorId: payload.educatorId
        }
      }
    ])
    .select("*")
    .single()

  if (error) {
    return { data: null, error: error.message || "Unable to create college class" }
  }

  if (!data) {
    return { data: null, error: "Unable to create college class" }
  }

  // Create the faculty assignment record so the educator can see this class
  const { error: assignmentError } = await supabase
    .from("college_faculty_class_assignments")
    .insert([
      {
        college_id: payload.collegeId,
        faculty_id: payload.educatorId,
        class_id: data.id,
        is_class_teacher: true,
        academic_year: payload.academicYear
      }
    ])

  if (assignmentError) {
    logger.warn('Failed to create faculty assignment', {
      error: assignmentError instanceof Error
        ? { message: assignmentError.message, stack: assignmentError.stack }
        : { message: String(assignmentError) }
    });
  }

  const classItem = transformDBClassToClass(data, 'college')
  classItem.skillAreas = skills
  classItem.status = payload.status
  classItem.educator = payload.educatorName
  classItem.educatorEmail = payload.educatorEmail

  return {
    data: syncClassAggregates(classItem),
    error: null
  }
}

export const updateClass = async (classId: string, payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))

    if (payload.educatorType === 'school') {
      return await updateSchoolClass(classId, payload, skills)
    } else {
      return await updateCollegeClass(classId, payload, skills)
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to update class" }
  }
}

const updateSchoolClass = async (classId: string, payload: CreateClassPayload, skills: string[]): Promise<MutateResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("school_classes")
    .update({
      name: payload.name,
      grade: payload.grade,
      section: payload.section,
      academic_year: payload.academicYear,
      max_learners: payload.maxlearners,
      updated_at: new Date().toISOString(),
      metadata: {
        skillAreas: skills,
        status: payload.status,
        educator: payload.educatorName,
        educatorEmail: payload.educatorEmail,
        educatorId: payload.educatorId
      }
    })
    .eq("id", classId)
    .select("*")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message || "Unable to update school class" }
  }

  if (!data) {
    return { data: null, error: "Unable to update school class" }
  }

  const classItem = transformDBClassToClass(data, 'school')
  classItem.skillAreas = skills
  classItem.status = payload.status
  classItem.educator = payload.educatorName
  classItem.educatorEmail = payload.educatorEmail

  const learners = await fetchClasslearners(classId, 'school')
  classItem.learners = learners

  return {
    data: syncClassAggregates(classItem),
    error: null
  }
}

const updateCollegeClass = async (classId: string, payload: CreateClassPayload, skills: string[]): Promise<MutateResponse<EducatorClass>> => {
  const { data, error } = await supabase
    .from("college_classes")
    .update({
      name: payload.name,
      grade: payload.grade,
      section: payload.section,
      academic_year: payload.academicYear,
      max_learners: payload.maxlearners,
      updated_at: new Date().toISOString(),
      metadata: {
        skillAreas: skills,
        status: payload.status,
        educator: payload.educatorName,
        educatorEmail: payload.educatorEmail,
        educatorId: payload.educatorId
      }
    })
    .eq("id", classId)
    .select("*")
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message || "Unable to update college class" }
  }

  if (!data) {
    return { data: null, error: "Unable to update college class" }
  }

  const classItem = transformDBClassToClass(data, 'college')
  classItem.skillAreas = skills
  classItem.status = payload.status
  classItem.educator = payload.educatorName
  classItem.educatorEmail = payload.educatorEmail

  const learners = await fetchClasslearners(classId, 'college')
  classItem.learners = learners

  return {
    data: syncClassAggregates(classItem),
    error: null
  }
}

const classTasks: Record<string, ClassTask[]> = {}
const classNotes: Record<string, ClassNote[]> = {}

export const assignTaskToClass = async ({ classId, task }: AssignTaskPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const { data: classData, error: classError } = await getClassById(classId)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    const newTask: ClassTask = {
      id: createId(),
      name: task.name,
      dueDate: task.dueDate,
      skillTags: task.skillTags,
      referenceLink: task.referenceLink,
      attachment: task.attachment,
      status: "Pending"
    }

    if (!classTasks[classId]) {
      classTasks[classId] = []
    }
    classTasks[classId] = [newTask, ...classTasks[classId]]

    const updatedClass = { ...classData, tasks: classTasks[classId], lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX") }
    return { data: syncClassAggregates(updatedClass), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to assign task" }
  }
}

type SaveNotePayload = { classId: string; note: { author: string; content: string } }

export const saveClassNote = async ({ classId, note }: SaveNotePayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    if (!note.content.trim()) return { data: null, error: "Note content is required" }

    const { data: classData, error: classError } = await getClassById(classId)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    const newNote: ClassNote = {
      id: createId(),
      author: note.author,
      content: note.content,
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    }

    if (!classNotes[classId]) {
      classNotes[classId] = []
    }
    classNotes[classId] = [newNote, ...classNotes[classId]]

    const updatedClass = { ...classData, notes: classNotes[classId], lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX") }
    return { data: syncClassAggregates(updatedClass), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to save note" }
  }
}

export const upsertClassInStore = (updated: EducatorClass) => {
  classTasks[updated.id] = updated.tasks
  classNotes[updated.id] = updated.notes
}