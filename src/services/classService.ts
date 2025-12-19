import { format } from "date-fns"
import { supabase } from "../lib/supabaseClient"

type PerformanceBand = "High" | "Medium" | "Low"

type ClassStatus = "Active" | "Completed" | "Upcoming"

export interface ClassStudent {
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
  total_students: number
  avg_progress: number
  performance_band: PerformanceBand
  skillAreas: string[]
  lastUpdated: string
  students: ClassStudent[]
  tasks: ClassTask[]
  notes: ClassNote[]
}

export interface StudentDirectoryEntry {
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
  const total = classItem.students.length
  const avg = total === 0 ? 0 : Math.round(classItem.students.reduce((acc, curr) => acc + curr.progress, 0) / total)
  let band: PerformanceBand = "Low"
  if (avg >= 70) band = "High"
  else if (avg >= 40) band = "Medium"
  return { total, avg, band }
}

const syncClassAggregates = (classItem: EducatorClass) => {
  const { total, avg, band } = computeAggregates(classItem)
  classItem.total_students = total
  classItem.avg_progress = avg
  classItem.performance_band = band
  return classItem
}

/**
 * Get class IDs assigned to an educator
 * @param educatorId - The UUID of the educator
 * @returns Array of class IDs
 */
export const getEducatorAssignedClassIds = async (educatorId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("school_educator_class_assignments")
      .select("class_id")
      .eq("educator_id", educatorId)

    if (error) {
      console.error("Error fetching educator assigned classes:", error)
      return []
    }

    return (data || []).map(ac => ac.class_id)
  } catch (err) {
    console.error("Error fetching educator assigned classes:", err)
    return []
  }
}

const transformDBClassToClass = (dbClass: any): EducatorClass => {
  const metadata = dbClass.metadata || {}
  
  // Get class teacher info from the joined data
  const classTeacherName = dbClass.class_teacher_first_name && dbClass.class_teacher_last_name 
    ? `${dbClass.class_teacher_first_name} ${dbClass.class_teacher_last_name}`.trim()
    : "TBD"
  
  const classTeacherEmail = dbClass.class_teacher_email || "Not assigned"
  
  return {
    id: dbClass.id,
    name: dbClass.name || `Grade ${dbClass.grade} - ${dbClass.section || 'General'}`,
    course: dbClass.grade || "General",
    educator: classTeacherName,
    educatorEmail: classTeacherEmail,
    department: dbClass.section || "General",
    year: dbClass.academic_year || String(new Date().getFullYear()),
    status: (metadata.status || "Active") as ClassStatus,
    total_students: dbClass.current_students || 0,
    avg_progress: 0,
    performance_band: "Low" as PerformanceBand,
    skillAreas: metadata.skillAreas || [],
    lastUpdated: dbClass.updated_at || new Date().toISOString(),
    students: [],
    tasks: [],
    notes: []
  }
}

const calculateStudentProgress = async (studentId: string, classId: string): Promise<number> => {
  try {
    // Get all assignments for students in this class
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("assignment_id, assign_classes")
      .eq("assign_classes", classId)
      .eq("is_deleted", false)

    if (assignmentsError || !assignments || assignments.length === 0) {
      return 0
    }

    const assignmentIds = assignments.map(a => a.assignment_id)

    // Get student's assignment submissions
    const { data: studentAssignments, error: studentError } = await supabase
      .from("student_assignments")
      .select("assignment_id, status, grade_percentage")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds)
      .eq("is_deleted", false)

    if (studentError || !studentAssignments || studentAssignments.length === 0) {
      return 0
    }

    // Calculate average progress
    const totalAssignments = assignments.length
    const completedCount = studentAssignments.filter(sa => sa.status === "graded" || sa.status === "submitted").length
    const gradeSum = studentAssignments
      .filter(sa => sa.grade_percentage !== null)
      .reduce((sum, sa) => sum + (sa.grade_percentage || 0), 0)
    const gradedCount = studentAssignments.filter(sa => sa.grade_percentage !== null).length

    // Progress = (completion rate * 0.5) + (average grade * 0.5)
    const completionRate = (completedCount / totalAssignments) * 100
    const averageGrade = gradedCount > 0 ? gradeSum / gradedCount : 0
    const progress = (completionRate * 0.5) + (averageGrade * 0.5)

    return Math.round(progress)
  } catch (err) {
    console.error("Error calculating student progress:", err)
    return 0
  }
}

export const fetchEducatorClasses = async (schoolId?: string, educatorId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    // SECURITY: Always require educatorId for educator role to prevent unauthorized access
    if (!educatorId) {
      console.warn("fetchEducatorClasses called without educatorId - this should not happen for educators")
      return { data: [], error: null }
    }

    // SECURITY: Verify educator exists and get only their assigned classes
    const { data: educatorCheck, error: educatorCheckError } = await supabase
      .from("school_educators")
      .select("id")
      .eq("id", educatorId)
      .single()

    if (educatorCheckError || !educatorCheck) {
      console.error("Invalid educator ID:", educatorId)
      return { data: null, error: "Invalid educator credentials" }
    }

    // Get only the classes assigned to this specific educator
    const { data: assignments, error: assignmentError } = await supabase
      .from("school_educator_class_assignments")
      .select("class_id")
      .eq("educator_id", educatorId)

    if (assignmentError) {
      console.error("Error fetching educator assignments:", assignmentError)
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
      console.error("Error fetching classes:", error)
      return { data: null, error: error.message }
    }

    // Process each class with additional data
    const classesWithStudents = await Promise.all(
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
        const students = await fetchClassStudents(dbClass.id)
        classItem.students = students
        const tasks = await fetchClassTasks(dbClass.id)
        classItem.tasks = tasks
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithStudents, error: null }
  } catch (err: any) {
    console.error("Error in fetchEducatorClasses:", err)
    return { data: null, error: err?.message || "Unable to fetch classes" }
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

    const classesWithStudents = await Promise.all(
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
        const students = await fetchClassStudents(dbClass.id)
        classItem.students = students
        const tasks = await fetchClassTasks(dbClass.id)
        classItem.tasks = tasks
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithStudents, error: null }
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
      console.error("Error fetching class tasks:", error)
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
    console.error("Error fetching class tasks:", err)
    return []
  }
}

export const fetchClassStudents = async (classId: string): Promise<ClassStudent[]> => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, email, updated_at, user_id")
      .eq("school_class_id", classId)

    if (error) {
      console.error("Error fetching class students:", error)
      return []
    }

    const studentsWithProgress = await Promise.all(
      (data || []).map(async (student: any) => {
        const progress = await calculateStudentProgress(student.user_id || student.id, classId)
        return {
          id: student.id,
          name: student.name || "Unknown",
          email: student.email || "",
          progress: progress,
          lastActive: student.updated_at || new Date().toISOString()
        }
      })
    )

    return studentsWithProgress
  } catch (err: any) {
    console.error("Error fetching class students:", err)
    return []
  }
}

export const getClassById = async (classId: string): Promise<ServiceResponse<EducatorClass>> => {
  try {
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
      .single()

    if (error) {
      return { data: null, error: error.message || "Class not found" }
    }

    if (!data) {
      return { data: null, error: "Class not found" }
    }

    // Extract class teacher info
    const classTeacher = data.class_teacher?.[0]?.educator
    const enrichedClass = {
      ...data,
      class_teacher_first_name: classTeacher?.first_name,
      class_teacher_last_name: classTeacher?.last_name,
      class_teacher_email: classTeacher?.email
    }

    const classItem = transformDBClassToClass(enrichedClass)
    const students = await fetchClassStudents(classId)
    classItem.students = students
    
    // Fetch tasks from assignments table
    const tasks = await fetchClassTasks(classId)
    classItem.tasks = tasks
    
    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch class" }
  }
}

export const fetchStudentDirectory = async (schoolId?: string): Promise<ServiceResponse<StudentDirectoryEntry[]>> => {
  try {
    let query = supabase
      .from("students")
      .select("id, name, email, school_id")
      .is("school_class_id", null)
      .eq("is_deleted", false)
      .limit(100)

    // Filter by school if provided
    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    const directory = (data || []).map((student: any) => ({
      id: student.id,
      name: student.name || "Unknown",
      email: student.email || "",
      defaultProgress: 0
    }))

    return { data: directory, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to load students" }
  }
}

type AddStudentPayload = {
  classId: string
  student: { id?: string; name: string; email: string; progress?: number }
}

export const addStudentToClass = async ({ classId, student }: AddStudentPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const { data: classData, error: classError } = await getClassById(classId)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    if (!student.id) {
      return { data: null, error: "Student ID is required" }
    }

    const { error: updateError } = await supabase
      .from("students")
      .update({ school_class_id: classId })
      .eq("id", student.id)

    if (updateError) {
      return { data: null, error: updateError.message || "Unable to add student to class" }
    }

    const { error: incrementError } = await supabase
      .from("school_classes")
      .update({ 
        current_students: classData.total_students + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", classId)

    if (incrementError) {
      console.error("Error incrementing student count:", incrementError)
    }

    const { data: updatedClass, error: fetchError } = await getClassById(classId)
    if (fetchError || !updatedClass) {
      return { data: null, error: "Unable to fetch updated class" }
    }

    return { data: updatedClass, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to add student" }
  }
}

export const removeStudentFromClass = async (classId: string, studentId: string): Promise<MutateResponse<EducatorClass>> => {
  try {
    const { data: classData, error: classError } = await getClassById(classId)
    if (classError || !classData) {
      return { data: null, error: "Class not found" }
    }

    const { error: updateError } = await supabase
      .from("students")
      .update({ school_class_id: null })
      .eq("id", studentId)

    if (updateError) {
      return { data: null, error: updateError.message || "Unable to remove student from class" }
    }

    const newCount = Math.max(0, classData.total_students - 1)
    const { error: decrementError } = await supabase
      .from("school_classes")
      .update({ 
        current_students: newCount,
        updated_at: new Date().toISOString()
      })
      .eq("id", classId)

    if (decrementError) {
      console.error("Error decrementing student count:", decrementError)
    }

    const { data: updatedClass, error: fetchError } = await getClassById(classId)
    if (fetchError || !updatedClass) {
      return { data: null, error: "Unable to fetch updated class" }
    }

    return { data: updatedClass, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to remove student" }
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
  maxStudents: number
  status: ClassStatus
  skillAreas: string[]
  schoolId: string
  educatorId: string
  educatorName: string
  educatorEmail: string
}

export const createClass = async (payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))

    const { data, error } = await supabase
      .from("school_classes")
      .insert([
        {
          school_id: payload.schoolId,
          name: payload.name,
          grade: payload.grade,
          section: payload.section,
          academic_year: payload.academicYear,
          max_students: payload.maxStudents,
          current_students: 0,
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
      return { data: null, error: error.message || "Unable to create class" }
    }

    if (!data) {
      return { data: null, error: "Unable to create class" }
    }

    const classItem = transformDBClassToClass(data)
    classItem.skillAreas = skills
    classItem.status = payload.status
    classItem.educator = payload.educatorName
    classItem.educatorEmail = payload.educatorEmail

    return {
      data: syncClassAggregates(classItem),
      error: null
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to create class" }
  }
}

export const updateClass = async (classId: string, payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))

    const { data, error } = await supabase
      .from("school_classes")
      .update({
        name: payload.name,
        grade: payload.grade,
        section: payload.section,
        academic_year: payload.academicYear,
        max_students: payload.maxStudents,
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
      .single()

    if (error) {
      return { data: null, error: error.message || "Unable to update class" }
    }

    if (!data) {
      return { data: null, error: "Unable to update class" }
    }

    const classItem = transformDBClassToClass(data)
    classItem.skillAreas = skills
    classItem.status = payload.status
    classItem.educator = payload.educatorName
    classItem.educatorEmail = payload.educatorEmail

    const students = await fetchClassStudents(classId)
    classItem.students = students

    return {
      data: syncClassAggregates(classItem),
      error: null
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to update class" }
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