import { format } from "date-fns"
import { apiPost } from '@/shared/api/apiClient'

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

const transformDBClassToClass = (dbClass: any, educatorType: 'school' | 'college' = 'school'): EducatorClass => {
  const metadata = dbClass.metadata || {}
  
  let classTeacherName = "TBD"
  let classTeacherEmail = "Not assigned"
  
  if (educatorType === 'school') {
    classTeacherName = dbClass.class_teacher_first_name && dbClass.class_teacher_last_name 
      ? `${dbClass.class_teacher_first_name} ${dbClass.class_teacher_last_name}`.trim()
      : "TBD"
    classTeacherEmail = dbClass.class_teacher_email || "Not assigned"
  } else {
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

export const getEducatorAssignedClassIds = async (educatorId: string, educatorType: 'school' | 'college'): Promise<string[]> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'get-educator-assigned-class-ids', educatorId, educatorType })
    if (!result.success) return []
    return result.data || []
  } catch {
    return []
  }
}

export const fetchEducatorClasses = async (
  schoolId?: string, 
  collegeId?: string, 
  educatorId?: string, 
  educatorType?: 'school' | 'college'
): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    if (!educatorId || !educatorType) {
      return { data: [], error: null }
    }

    const result = await apiPost('/college-admin/classes', { action: 'fetch-educator-classes', schoolId, collegeId, educatorId, educatorType })
    if (!result.success) {
      return { data: null, error: result.error || 'Unable to fetch classes' }
    }

    const classes = (result.data || []).map((dbClass: any) => {
      const classItem = transformDBClassToClass(dbClass, educatorType)
      classItem.learners = dbClass.learners || []
      classItem.tasks = dbClass.tasks || []
      return syncClassAggregates(classItem)
    })

    return { data: classes, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch classes" }
  }
}

export const fetchAllSchoolClasses = async (schoolId?: string): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'fetch-all-school-classes', schoolId })
    if (!result.success) {
      return { data: null, error: result.error || 'Unable to fetch classes' }
    }

    const classes = (result.data || []).map((dbClass: any) => {
      const classItem = transformDBClassToClass(dbClass)
      classItem.learners = dbClass.learners || []
      classItem.tasks = dbClass.tasks || []
      return syncClassAggregates(classItem)
    })

    return { data: classes, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch classes" }
  }
}

export const fetchClassTasks = async (classId: string): Promise<ClassTask[]> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'fetch-class-tasks', classId })
    if (!result.success) return []
    return result.data || []
  } catch {
    return []
  }
}

export const fetchClasslearners = async (classId: string, educatorType: 'school' | 'college' = 'school'): Promise<ClassLearner[]> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'fetch-class-learners', classId, educatorType })
    if (!result.success) return []
    return result.data || []
  } catch {
    return []
  }
}

export const getClassById = async (classId: string, educatorType: 'school' | 'college' = 'school'): Promise<ServiceResponse<EducatorClass>> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'get-class-by-id', classId, educatorType })
    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'Class not found' }
    }

    const classItem = transformDBClassToClass(result.data, educatorType)
    classItem.learners = result.data.learners || []
    classItem.tasks = result.data.tasks || []

    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch class" }
  }
}

export const fetchlearnerDirectory = async (schoolId?: string, collegeId?: string): Promise<ServiceResponse<LearnerDirectoryEntry[]>> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'fetch-learner-directory', schoolId, collegeId })
    if (!result.success) {
      return { data: null, error: result.error || 'Unable to load learners' }
    }
    return { data: result.data || [], error: null }
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
    const result = await apiPost('/college-admin/classes', { action: 'add-learner-to-class', classId, learner, educatorType })
    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'Unable to add learner' }
    }

    const classItem = transformDBClassToClass(result.data, educatorType)
    classItem.learners = result.data.learners || []
    classItem.tasks = result.data.tasks || []

    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to add learner" }
  }
}

export const removelearnerFromClass = async (classId: string, learnerId: string, educatorType: 'school' | 'college' = 'school'): Promise<MutateResponse<EducatorClass>> => {
  try {
    const result = await apiPost('/college-admin/classes', { action: 'remove-learner-from-class', classId, learnerId, educatorType })
    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'Unable to remove learner' }
    }

    const classItem = transformDBClassToClass(result.data, educatorType)
    classItem.learners = result.data.learners || []
    classItem.tasks = result.data.tasks || []

    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to remove learner" }
  }
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
    const result = await apiPost('/college-admin/classes', { action: 'create-class', ...payload, skills })
    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'Unable to create class' }
    }

    const classItem = transformDBClassToClass(result.data, payload.educatorType)
    classItem.skillAreas = skills
    classItem.learners = result.data.learners || []
    classItem.tasks = result.data.tasks || []

    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to create class" }
  }
}

export const updateClass = async (classId: string, payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))
    const result = await apiPost('/college-admin/classes', { action: 'update-class', classId, ...payload, skills })
    if (!result.success || !result.data) {
      return { data: null, error: result.error || 'Unable to update class' }
    }

    const classItem = transformDBClassToClass(result.data, payload.educatorType)
    classItem.skillAreas = skills
    classItem.learners = result.data.learners || []
    classItem.tasks = result.data.tasks || []

    return { data: syncClassAggregates(classItem), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to update class" }
  }
}

type AssignTaskPayload = {
  classId: string
  task: { name: string; dueDate: string; skillTags: string[]; referenceLink?: string; attachment?: string }
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
