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

const computePerformanceBand = (avg: number): PerformanceBand => {
  if (avg >= 70) return "High"
  if (avg >= 40) return "Medium"
  return "Low"
}

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

const transformDBClassToClass = (dbClass: any): EducatorClass => {
  const metadata = dbClass.metadata || {}
  return {
    id: dbClass.id,
    name: dbClass.name || `Grade ${dbClass.grade} - ${dbClass.section || 'General'}`,
    course: dbClass.grade || "General",
    educator: metadata.educator || "TBD",
    educatorEmail: metadata.educatorEmail || "educator@example.com",
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

export const fetchEducatorClasses = async (schoolId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    let query = supabase
      .from("school_classes")
      .select("*")
      .order("created_at", { ascending: false })

    // Filter by school if provided
    if (schoolId) {
      query = query.eq("school_id", schoolId)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    const classesWithStudents = await Promise.all(
      (data || []).map(async (dbClass) => {
        const classItem = transformDBClassToClass(dbClass)
        const students = await fetchClassStudents(dbClass.id)
        classItem.students = students
        return syncClassAggregates(classItem)
      })
    )

    return { data: classesWithStudents, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch classes" }
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
      .select("*")
      .eq("id", classId)
      .single()

    if (error) {
      return { data: null, error: error.message || "Class not found" }
    }

    if (!data) {
      return { data: null, error: "Class not found" }
    }

    const classItem = transformDBClassToClass(data)
    const students = await fetchClassStudents(classId)
    classItem.students = students
    
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