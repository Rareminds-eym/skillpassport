import { addDays, format } from "date-fns"

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

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms))

const createId = () => `cls-${Math.random().toString(36).slice(2, 10)}`

const directory: StudentDirectoryEntry[] = [
  { id: "stu-001", name: "Vihaan Kapoor", email: "vihaan.kapoor@example.edu", defaultProgress: 68 },
  { id: "stu-002", name: "Aarav Nair", email: "aarav.nair@example.edu", defaultProgress: 74 },
  { id: "stu-003", name: "Meera Bhat", email: "meera.bhat@example.edu", defaultProgress: 59 },
  { id: "stu-004", name: "Nisha Roy", email: "nisha.roy@example.edu", defaultProgress: 82 },
  { id: "stu-005", name: "Zara Khan", email: "zara.khan@example.edu", defaultProgress: 65 },
  { id: "stu-006", name: "Kabir Sharma", email: "kabir.sharma@example.edu", defaultProgress: 72 },
  { id: "stu-007", name: "Aisha Patel", email: "aisha.patel@example.edu", defaultProgress: 47 },
  { id: "stu-008", name: "Rahul Bose", email: "rahul.bose@example.edu", defaultProgress: 54 },
  { id: "stu-009", name: "Ira Menon", email: "ira.menon@example.edu", defaultProgress: 91 },
  { id: "stu-010", name: "Dev Mehta", email: "dev.mehta@example.edu", defaultProgress: 36 }
]

const now = new Date()

let classesStore: EducatorClass[] = [
  {
    id: "cls-001",
    name: "AI Fundamentals - Batch 2025",
    course: "Artificial Intelligence",
    educator: "Dr. Asha Raman",
    educatorEmail: "asha.raman@example.edu",
    department: "Computer Science",
    year: "2025",
    status: "Active",
    total_students: 42,
    avg_progress: 76,
    performance_band: "High",
    skillAreas: ["AI", "Communication"],
    lastUpdated: format(addDays(now, -1), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [
      { id: "stu-201", name: "Rohan S", email: "rohan@example.edu", progress: 78 },
      { id: "stu-202", name: "Priya G", email: "priya@example.edu", progress: 71 },
      { id: "stu-203", name: "Sana K", email: "sana@example.edu", progress: 83 }
    ],
    tasks: [
      {
        id: "task-501",
        name: "AI Ethics Case Study",
        dueDate: format(addDays(now, 5), "yyyy-MM-dd"),
        skillTags: ["AI", "Research"],
        status: "In Progress"
      }
    ],
    notes: [
      {
        id: "note-401",
        author: "Dr. Asha Raman",
        content: "Group project presentations scheduled next Friday.",
        createdAt: format(addDays(now, -2), "yyyy-MM-dd'T'HH:mm:ssXXX")
      }
    ]
  },
  {
    id: "cls-002",
    name: "Data Structures Workshop",
    course: "Data Structures",
    educator: "Prof. Karthik Rao",
    educatorEmail: "karthik.rao@example.edu",
    department: "Computer Science",
    year: "2024",
    status: "Completed",
    total_students: 38,
    avg_progress: 91,
    performance_band: "High",
    skillAreas: ["Problem Solving"],
    lastUpdated: format(addDays(now, -12), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [
      { id: "stu-301", name: "Diya M", email: "diya@example.edu", progress: 95 },
      { id: "stu-302", name: "Arjun V", email: "arjun@example.edu", progress: 88 }
    ],
    tasks: [
      {
        id: "task-601",
        name: "Binary Tree Visualizer",
        dueDate: format(addDays(now, -7), "yyyy-MM-dd"),
        skillTags: ["Data Structures"],
        status: "Completed",
        referenceLink: "https://example.edu/resources/trees"
      }
    ],
    notes: []
  },
  {
    id: "cls-003",
    name: "Digital Marketing Sprint",
    course: "Marketing Analytics",
    educator: "Anita Desai",
    educatorEmail: "anita.desai@example.edu",
    department: "Management",
    year: "2025",
    status: "Active",
    total_students: 56,
    avg_progress: 64,
    performance_band: "Medium",
    skillAreas: ["Communication", "Design Thinking"],
    lastUpdated: format(addDays(now, -3), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [
      { id: "stu-401", name: "Samaira L", email: "samaira@example.edu", progress: 69 },
      { id: "stu-402", name: "Kian P", email: "kian@example.edu", progress: 58 }
    ],
    tasks: [],
    notes: []
  },
  {
    id: "cls-004",
    name: "Cloud Computing Essentials",
    course: "Cloud Platforms",
    educator: "Sanjay Gupta",
    educatorEmail: "sanjay.gupta@example.edu",
    department: "Information Technology",
    year: "2026",
    status: "Upcoming",
    total_students: 48,
    avg_progress: 0,
    performance_band: "Low",
    skillAreas: ["Cloud", "AI"],
    lastUpdated: format(addDays(now, -6), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [],
    tasks: [],
    notes: []
  },
  {
    id: "cls-005",
    name: "Product Design Studio",
    course: "Design Thinking",
    educator: "Rhea Malhotra",
    educatorEmail: "rhea.malhotra@example.edu",
    department: "Design",
    year: "2024",
    status: "Completed",
    total_students: 32,
    avg_progress: 88,
    performance_band: "High",
    skillAreas: ["Design Thinking", "Communication"],
    lastUpdated: format(addDays(now, -18), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [],
    tasks: [],
    notes: []
  },
  {
    id: "cls-006",
    name: "Entrepreneurship Lab",
    course: "Startup Management",
    educator: "Rahul Mehta",
    educatorEmail: "rahul.mehta@example.edu",
    department: "Management",
    year: "2025",
    status: "Active",
    total_students: 27,
    avg_progress: 71,
    performance_band: "High",
    skillAreas: ["Entrepreneurship", "Communication"],
    lastUpdated: format(addDays(now, -4), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    students: [],
    tasks: [],
    notes: []
  }
]

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

export const fetchEducatorClasses = async (): Promise<ServiceResponse<EducatorClass[]>> => {
  try {
    await delay()
    classesStore = classesStore.map((item) => syncClassAggregates({ ...item }))
    return { data: classesStore.map((item) => ({ ...item })), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch classes" }
  }
}

export const getClassById = async (classId: string): Promise<ServiceResponse<EducatorClass>> => {
  try {
    await delay(180)
    const classItem = classesStore.find((item) => item.id === classId)
    if (!classItem) return { data: null, error: "Class not found" }
    return { data: syncClassAggregates({ ...classItem, students: [...classItem.students], tasks: [...classItem.tasks], notes: [...classItem.notes] }), error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to fetch class" }
  }
}

export const fetchStudentDirectory = async (): Promise<ServiceResponse<StudentDirectoryEntry[]>> => {
  try {
    await delay(150)
    return { data: directory.map((entry) => ({ ...entry })), error: null }
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
    await delay(220)
    const classIndex = classesStore.findIndex((item) => item.id === classId)
    if (classIndex === -1) return { data: null, error: "Class not found" }
    const existingStudentId = student.id || createId()
    const progress = typeof student.progress === "number" ? student.progress : student.id ? directory.find((entry) => entry.id === student.id)?.defaultProgress || 0 : 0
    const newStudent: ClassStudent = {
      id: existingStudentId,
      name: student.name,
      email: student.email,
      progress,
      lastActive: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    }
    const updatedClass = { ...classesStore[classIndex], students: [...classesStore[classIndex].students.filter((item) => item.id !== newStudent.id), newStudent] }
    classesStore[classIndex] = syncClassAggregates(updatedClass)
    classesStore[classIndex].lastUpdated = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    return { data: { ...classesStore[classIndex], students: [...classesStore[classIndex].students], tasks: [...classesStore[classIndex].tasks], notes: [...classesStore[classIndex].notes] }, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to add student" }
  }
}

export const removeStudentFromClass = async (classId: string, studentId: string): Promise<MutateResponse<EducatorClass>> => {
  try {
    await delay(220)
    const classIndex = classesStore.findIndex((item) => item.id === classId)
    if (classIndex === -1) return { data: null, error: "Class not found" }
    const updatedClass = { ...classesStore[classIndex], students: classesStore[classIndex].students.filter((student) => student.id !== studentId) }
    classesStore[classIndex] = syncClassAggregates(updatedClass)
    classesStore[classIndex].lastUpdated = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    return { data: { ...classesStore[classIndex], students: [...classesStore[classIndex].students], tasks: [...classesStore[classIndex].tasks], notes: [...classesStore[classIndex].notes] }, error: null }
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
  course: string
  educator: string
  educatorEmail: string
  department: string
  year: string
  status: ClassStatus
  skillAreas: string[]
}

export const createClass = async (payload: CreateClassPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    await delay(240)
    const skills = Array.from(new Set(payload.skillAreas.map((skill) => skill.trim()).filter(Boolean)))
    const base: EducatorClass = {
      id: createId(),
      name: payload.name,
      course: payload.course,
      educator: payload.educator,
      educatorEmail: payload.educatorEmail,
      department: payload.department,
      year: payload.year,
      status: payload.status,
      total_students: 0,
      avg_progress: 0,
      performance_band: "Low",
      skillAreas: skills,
      lastUpdated: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
      students: [],
      tasks: [],
      notes: []
    }
    const prepared = syncClassAggregates({ ...base })
    classesStore = [prepared, ...classesStore]
    return {
      data: {
        ...prepared,
        students: [...prepared.students],
        tasks: [...prepared.tasks],
        notes: [...prepared.notes]
      },
      error: null
    }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to create class" }
  }
}

export const assignTaskToClass = async ({ classId, task }: AssignTaskPayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    await delay(260)
    const classIndex = classesStore.findIndex((item) => item.id === classId)
    if (classIndex === -1) return { data: null, error: "Class not found" }
    const newTask: ClassTask = {
      id: createId(),
      name: task.name,
      dueDate: task.dueDate,
      skillTags: task.skillTags,
      referenceLink: task.referenceLink,
      attachment: task.attachment,
      status: "Pending"
    }
    const updatedClass = { ...classesStore[classIndex], tasks: [newTask, ...classesStore[classIndex].tasks] }
    classesStore[classIndex] = syncClassAggregates(updatedClass)
    classesStore[classIndex].lastUpdated = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    return { data: { ...classesStore[classIndex], students: [...classesStore[classIndex].students], tasks: [...classesStore[classIndex].tasks], notes: [...classesStore[classIndex].notes] }, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to assign task" }
  }
}

type SaveNotePayload = { classId: string; note: { author: string; content: string } }

export const saveClassNote = async ({ classId, note }: SaveNotePayload): Promise<MutateResponse<EducatorClass>> => {
  try {
    if (!note.content.trim()) return { data: null, error: "Note content is required" }
    await delay(200)
    const classIndex = classesStore.findIndex((item) => item.id === classId)
    if (classIndex === -1) return { data: null, error: "Class not found" }
    const newNote: ClassNote = {
      id: createId(),
      author: note.author,
      content: note.content,
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    }
    const updatedClass = { ...classesStore[classIndex], notes: [newNote, ...classesStore[classIndex].notes] }
    classesStore[classIndex] = syncClassAggregates(updatedClass)
    classesStore[classIndex].lastUpdated = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    return { data: { ...classesStore[classIndex], students: [...classesStore[classIndex].students], tasks: [...classesStore[classIndex].tasks], notes: [...classesStore[classIndex].notes] }, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || "Unable to save note" }
  }
}

export const upsertClassInStore = (updated: EducatorClass) => {
  const index = classesStore.findIndex((item) => item.id === updated.id)
  const prepared = syncClassAggregates({ ...updated, students: [...updated.students], tasks: [...updated.tasks], notes: [...updated.notes] })
  if (index === -1) {
    classesStore = [prepared, ...classesStore]
  } else {
    classesStore[index] = prepared
  }
}
