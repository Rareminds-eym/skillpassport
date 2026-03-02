/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AcademicCapIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    ClockIcon,
    EnvelopeIcon,
    EyeIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    PlusCircleIcon,
    Squares2X2Icon,
    TableCellsIcon,
    UserGroupIcon,
    XMarkIcon
} from "@heroicons/react/24/outline"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { supabase } from "../../../lib/supabaseClient"

interface SchoolClass {
  id: string
  name: string
  grade: string
  section: string
  academic_year: string
  max_students: number
  current_students: number
  account_status: string
  created_at: string
  updated_at: string
  metadata: any
  students: Student[]
  avg_progress: number
  performance_band: string
  skillAreas: string[]
  educator: string
  educatorEmail: string
}

interface Educator {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Student {
  id: string
  name: string
  email: string
  school_class_id: string | null
  progress?: number
  lastActive?: string
}

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        type="button"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return options.map((option: any) => (
    <label key={option.value} className="flex items-center text-sm text-gray-700">
      <input
        type="checkbox"
        checked={selectedValues.includes(option.value)}
        onChange={(e) => {
          if (e.target.checked) {
            onChange([...selectedValues, option.value])
          } else {
            onChange(selectedValues.filter((value: string) => value !== option.value))
          }
        }}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <span className="ml-2">{option.label}</span>
      {option.count !== undefined && (
        <span className="ml-auto text-xs text-gray-500">({option.count})</span>
      )}
    </label>
  ))
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-700",
    archived: "bg-indigo-100 text-indigo-700"
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

const getProgressConfig = (value: number) => {
  if (value >= 70) {
    return {
      bar: "bg-emerald-500",
      label: "On Track",
      badge: "bg-emerald-50 text-emerald-700"
    }
  }
  if (value >= 40) {
    return {
      bar: "bg-amber-400",
      label: "Needs Attention",
      badge: "bg-amber-50 text-amber-700"
    }
  }
  return {
    bar: "bg-rose-500",
    label: "Needs Support",
    badge: "bg-rose-50 text-rose-700"
  }
}

const ProgressBar = ({ value }: { value: number }) => {
  const clamped = Math.min(100, Math.max(0, value))
  const config = getProgressConfig(clamped)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Average Progress</span>
        <span className="font-semibold text-gray-900">{clamped}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full">
        <div className={`${config.bar} h-2 rounded-full`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
        {config.label}
      </span>
    </div>
  )
}

const formatDate = (value: string) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const ClassDetailsDrawer = ({
  classItem,
  onClose,
  onManageStudents,
  onAssignEducator,
  onEdit
}: {
  classItem: SchoolClass | null
  onClose: () => void
  onManageStudents: (classItem: SchoolClass) => void
  onAssignEducator: (classItem: SchoolClass) => void
  onEdit: (classItem: SchoolClass) => void
}) => {
  if (!classItem) return null

  const topStudents = classItem.students?.slice(0, 5) || []
  const progressConfig = getProgressConfig(classItem.avg_progress || 0)

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{classItem.name}</h2>
              <StatusBadge status={classItem.account_status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">Grade {classItem.grade}</p>
            <p className="text-xs text-gray-400">Section {classItem.section} • {classItem.academic_year}</p>
            {classItem.educator && classItem.educator !== "TBD" && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-500">Class Teacher:</span>
                <span className="font-medium text-gray-900">{classItem.educator}</span>
                {classItem.educatorEmail && classItem.educatorEmail !== "Not assigned" && (
                  <>
                    <span className="text-gray-400">•</span>
                    <a
                      href={`mailto:${classItem.educatorEmail}`}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                    >
                      <EnvelopeIcon className="mr-1 h-4 w-4" />
                      {classItem.educatorEmail}
                    </a>
                  </>
                )}
              </div>
            )}
            {classItem.skillAreas && classItem.skillAreas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {classItem.skillAreas.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
            <XMarkIcon className="h-6 w-6" />
            <span className="sr-only">Close drawer</span>
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Students</p>
              <p className={`mt-2 text-2xl font-semibold ${
                classItem.current_students > classItem.max_students ? 'text-red-600' : 'text-gray-900'
              }`}>
                {classItem.current_students} / {classItem.max_students}
              </p>
              {classItem.current_students > classItem.max_students && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  Over capacity by {classItem.current_students - classItem.max_students}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Average Progress</p>
              <div className="mt-3 max-w-[220px]">
                <ProgressBar value={classItem.avg_progress || 0} />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Performance Band</p>
              <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${progressConfig.badge}`}>
                {classItem.performance_band || "N/A"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="mr-1.5 h-4 w-4" />
              Updated {formatDate(classItem.updated_at)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(classItem)}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <PencilIcon className="mr-1.5 h-4 w-4" />
                Edit Class
              </button>
              <button
                onClick={() => onManageStudents(classItem)}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <UserGroupIcon className="mr-1.5 h-4 w-4" />
                Manage Students
              </button>
              <button
                onClick={() => onAssignEducator(classItem)}
                className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                type="button"
              >
                <AcademicCapIcon className="mr-1.5 h-4 w-4" />
                Assign Educator
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Student Progress</h3>
              {classItem.students && classItem.students.length > 5 && (
                <span className="text-xs text-gray-500">Showing top 5 of {classItem.students.length}</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {topStudents.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
                  No students enrolled yet.
                </div>
              )}
              {topStudents.map((student) => {
                const studentConfig = getProgressConfig(student.progress || 0)
                const progressValue = Math.min(100, Math.max(0, student.progress || 0))
                return (
                  <div key={student.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <a
                          href={`mailto:${student.email}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          {student.email}
                        </a>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{progressValue}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                      <div className={`${studentConfig.bar} h-2 rounded-full`} style={{ width: `${progressValue}%` }} />
                    </div>
                    {student.lastActive && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <ClockIcon className="mr-1 h-3.5 w-3.5" />
                        Last active {formatDate(student.lastActive)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const AddEditClassModal = ({
  isOpen,
  onClose,
  onSaved,
  editingClass,
  schoolId
}: {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  editingClass?: SchoolClass | null
  schoolId: string | null
}) => {
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [section, setSection] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [maxStudents, setMaxStudents] = useState("40")
  const [skillInput, setSkillInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && editingClass) {
      setName(editingClass.name)
      setGrade(editingClass.grade)
      setSection(editingClass.section)
      setAcademicYear(editingClass.academic_year)
      setMaxStudents(String(editingClass.max_students))
      setSkillInput(editingClass.skillAreas?.join(", ") || "")
    } else if (!isOpen) {
      setName("")
      setGrade("")
      setSection("")
      setAcademicYear("")
      setMaxStudents("40")
      setSkillInput("")
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, editingClass])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name.trim() || !grade.trim() || !section.trim() || !academicYear.trim() || !maxStudents.trim()) {
      setError("Fill in all required fields")
      return
    }

    if (!schoolId) {
      setError("School information not available")
      return
    }

    const maxStudentsNum = parseInt(maxStudents)
    if (isNaN(maxStudentsNum) || maxStudentsNum <= 0) {
      setError("Max students must be a positive number")
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const skills = skillInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)

      if (editingClass) {
        const { error: updateError } = await supabase
          .from("school_classes")
          .update({
            name: name.trim(),
            grade: grade.trim(),
            section: section.trim(),
            academic_year: academicYear.trim(),
            max_students: maxStudentsNum,
            updated_at: new Date().toISOString(),
            metadata: {
              ...editingClass.metadata,
              skillAreas: skills
            }
          })
          .eq("id", editingClass.id)

        if (updateError) throw updateError
        toast.success("Class updated successfully")
      } else {
        const { error: insertError } = await supabase
          .from("school_classes")
          .insert([
            {
              school_id: schoolId,
              name: name.trim(),
              grade: grade.trim(),
              section: section.trim(),
              academic_year: academicYear.trim(),
              max_students: maxStudentsNum,
              current_students: 0,
              account_status: "active",
              metadata: {
                skillAreas: skills
              }
            }
          ])

        if (insertError) throw insertError
        toast.success("Class created successfully")
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || `Unable to ${editingClass ? 'update' : 'create'} class`)
      toast.error(err.message || `Unable to ${editingClass ? 'update' : 'create'} class`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{editingClass ? 'Edit Class' : 'Create New Class'}</h2>
              <p className="mt-1 text-sm text-gray-500">{editingClass ? 'Update class details' : 'Enter class details to add it to your school.'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Class Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Science A"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Grade *</label>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="10"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Section *</label>
                <input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="A"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Academic Year *</label>
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Max Students *</label>
                <input
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="40"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Skill Areas (comma separated)</label>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Math, Science, Critical Thinking"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={submitting}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={submitting}
              type="button"
            >
              {submitting ? (editingClass ? 'Updating...' : 'Creating...') : (editingClass ? 'Update Class' : 'Create Class')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const EmptyState = ({ onCreate }: { onCreate: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white border border-dashed border-gray-300 rounded-lg p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <PlusCircleIcon className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">No Class Present</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        You haven't created any classes yet. Create your first class to start managing students and educators.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          type="button"
        >
          Create New Class
        </button>
      </div>
    </div>
  )
}

const ClassManagement = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [educators, setEducators] = useState<Educator[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [showAssignEducatorModal, setShowAssignEducatorModal] = useState(false)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const [filters, setFilters] = useState({
    grades: [] as string[],
    sections: [] as string[],
    years: [] as string[],
    statuses: [] as string[]
  })

  useEffect(() => {
    fetchSchoolId()
  }, [])

  useEffect(() => {
    if (schoolId) {
      fetchClasses()
      fetchEducators()
      fetchStudents()
    }
  }, [schoolId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  const fetchSchoolId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log("No user found")
        return
      }

      // Get user role first - use maybeSingle() to avoid 406 error
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (userError && userError.code !== 'PGRST116') {
        console.error("Error fetching user data:", userError)
        toast.error("Failed to fetch user information")
        return
      }

      console.log("User role:", userData?.role)

      // For school_admin: lookup school from organizations table
      if (userData?.role === "school_admin") {
        const { data: schoolData, error: schoolError } = await supabase
          .from("organizations")
          .select("id")
          .eq("organization_type", "school")
          .eq("admin_id", user.id)
          .maybeSingle()

        if (schoolError && schoolError.code !== 'PGRST116') {
          console.error("Error fetching school data:", schoolError)
        }

        if (schoolData?.id) {
          console.log("Found school ID from organizations:", schoolData.id)
          setSchoolId(schoolData.id)
          return
        }

        toast.error("School profile not found. Please ensure your school is registered.")
        return
      }

      // For school_educator: lookup from school_educators table
      if (userData?.role === "school_educator") {
        const { data: educatorData, error: educatorError } = await supabase
          .from("school_educators")
          .select("school_id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (educatorError && educatorError.code !== 'PGRST116') {
          console.error("Error fetching educator data:", educatorError)
        }

        if (educatorData?.school_id) {
          console.log("Found school ID from school_educators:", educatorData.school_id)
          setSchoolId(educatorData.school_id)
          return
        }

        toast.error("Educator profile not found. Please contact your school admin.")
        return
      }

      toast.error("You don't have access to this page")
    } catch (error) {
      console.error("Error fetching school ID:", error)
      toast.error("An error occurred while loading school information")
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    if (!schoolId) {
      console.log("No school ID available")
      return
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("school_classes")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching classes:", error)
        throw error
      }
      
      console.log("Fetched classes:", data?.length || 0)
      
      // Enrich classes with student data and metadata
      const enrichedClasses = await Promise.all((data || []).map(async (cls) => {
        const { data: classStudents } = await supabase
          .from("students")
          .select("id, name, email, updated_at")
          .eq("school_class_id", cls.id)
          .eq("is_deleted", false)

        const studentCount = classStudents?.length || 0
        const metadata = cls.metadata || {}
        
        // Update current_students count in database if it doesn't match
        if (cls.current_students !== studentCount) {
          await supabase
            .from("school_classes")
            .update({ current_students: studentCount })
            .eq("id", cls.id)
        }
        
        return {
          ...cls,
          current_students: studentCount, // Use actual count
          students: classStudents || [],
          avg_progress: 0,
          performance_band: "N/A",
          skillAreas: metadata.skillAreas || [],
          educator: metadata.educator || "",
          educatorEmail: metadata.educatorEmail || ""
        }
      }))

      setClasses(enrichedClasses)
    } catch (error: any) {
      console.error("Failed to fetch classes:", error)
      toast.error(`Failed to fetch classes: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchEducators = async () => {
    if (!schoolId) {
      console.log("No school ID available for fetching educators")
      return
    }

    try {
      const { data, error } = await supabase
        .from("school_educators")
        .select("id, first_name, last_name, email")
        .eq("school_id", schoolId)
        .eq("account_status", "active")

      if (error) {
        console.error("Error fetching educators:", error)
        throw error
      }
      
      console.log("Fetched educators:", data?.length || 0)
      setEducators(data || [])
    } catch (error: any) {
      console.error("Failed to fetch educators:", error)
    }
  }

  const fetchStudents = async () => {
    if (!schoolId) {
      console.log("No school ID available for fetching students")
      return
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, email, school_class_id")
        .eq("school_id", schoolId)
        .eq("is_deleted", false)

      if (error) {
        console.error("Error fetching students:", error)
        throw error
      }
      
      console.log("Fetched students:", data?.length || 0)
      setStudents(data || [])
    } catch (error: any) {
      console.error("Failed to fetch students:", error)
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return

    try {
      const { error } = await supabase
        .from("school_classes")
        .delete()
        .eq("id", classId)

      if (error) throw error

      toast.success("Class deleted successfully")
      fetchClasses()
    } catch (error: any) {
      toast.error("Failed to delete class")
      console.error(error)
    }
  }

  const gradeOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.grade.toLowerCase()
      counts[value] = (counts[value] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [classes])

  const sectionOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.section.toLowerCase()
      counts[value] = (counts[value] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [classes])

  const yearOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      counts[item.academic_year] = (counts[item.academic_year] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.value.localeCompare(a.value))
  }, [classes])

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.account_status.toLowerCase()
      counts[value] = (counts[value] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [classes])

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return classes.filter((item) => {
      const matchesSearch = query
        ? [item.name, item.grade, item.section, item.academic_year].some((field) => field.toLowerCase().includes(query))
        : true

      const matchesGrade = filters.grades.length ? filters.grades.includes(item.grade.toLowerCase()) : true
      const matchesSection = filters.sections.length ? filters.sections.includes(item.section.toLowerCase()) : true
      const matchesYear = filters.years.length ? filters.years.includes(item.academic_year) : true
      const matchesStatus = filters.statuses.length ? filters.statuses.includes(item.account_status.toLowerCase()) : true

      return matchesSearch && matchesGrade && matchesSection && matchesYear && matchesStatus
    })
  }, [classes, searchQuery, filters])

  const totalItems = filteredClasses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex)

  const handleClearFilters = () => {
    setFilters({
      grades: [],
      sections: [],
      years: [],
      statuses: []
    })
  }

  const totalFilters = filters.grades.length + filters.sections.length + filters.years.length + filters.statuses.length
  const isEmpty = !loading && classes.length === 0 && !searchQuery && totalFilters === 0

  if (!loading && !schoolId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">School Information Not Found</h3>
            <p className="mt-2 text-gray-500">
              Unable to load school information. Please ensure your account is properly configured as a school administrator.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex overflow-y-auto mb-4 flex-col h-screen">
      <div className='p-4 sm:p-6 lg:p-8 mb-2'>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Class Management</h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">Manage classes, assign educators, and organize students</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
            <span className="ml-2 text-sm text-gray-500">({classes.length} total)</span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by class name, grade, or section"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === "grid"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === "table"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden p-4 bg-white border-b border-gray-200 space-y-4">
        <div className="text-left">
          <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
          <span className="text-sm text-gray-500">{paginatedClasses.length} results</span>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 relative"
            type="button"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {totalFilters > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === "grid"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${viewMode === "table"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {showFilters && (
          <>
            <div className="fixed inset-0 z-40 bg-gray-900/40 lg:hidden" onClick={() => setShowFilters(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-xl lg:static lg:inset-auto lg:z-auto lg:h-full lg:flex-shrink-0 lg:shadow-none">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium text-gray-900">Filters</h2>
                  <div className="flex items-center gap-3">
                    <button onClick={handleClearFilters} className="text-sm text-indigo-600 hover:text-indigo-700" type="button">
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-600"
                      type="button"
                      aria-label="Close filters"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-0">
                  <FilterSection title="Grade" defaultOpen>
                    <CheckboxGroup
                      options={gradeOptions}
                      selectedValues={filters.grades}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, grades: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Section">
                    <CheckboxGroup
                      options={sectionOptions}
                      selectedValues={filters.sections}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, sections: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Academic Year">
                    <CheckboxGroup
                      options={yearOptions}
                      selectedValues={filters.years}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, years: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Status">
                    <CheckboxGroup
                      options={statusOptions}
                      selectedValues={filters.statuses}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, statuses: values }))}
                    />
                  </FilterSection>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredClasses.length}</span> result{filteredClasses.length === 1 ? "" : "s"}
              {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
            </p>
            {/* <button
              onClick={() => {
                setSelectedClass(null)
                setShowAddModal(true)
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              type="button"
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add New Class
            </button> */}
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500 space-x-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Loading classes...</span>
              </div>
            )}
            
            {!loading && isEmpty && <EmptyState onCreate={() => setShowAddModal(true)} />}

            {!loading && !isEmpty && viewMode === "grid" && paginatedClasses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                        <p className="text-xs text-gray-400">Section {classItem.section} • {classItem.academic_year}</p>
                        <p className="text-sm text-gray-500">Grade {classItem.grade}</p>
                      </div>
                      <StatusBadge status={classItem.account_status} />
                    </div>

                    <div className="mb-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Enrolled Students</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          classItem.current_students > classItem.max_students
                            ? 'bg-red-100 text-red-700'
                            : classItem.current_students === classItem.max_students
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {classItem.current_students} / {classItem.max_students}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            classItem.current_students > classItem.max_students
                              ? 'bg-red-500'
                              : classItem.current_students === classItem.max_students
                                ? 'bg-yellow-500'
                                : 'bg-indigo-600'
                          }`}
                          style={{
                            width: `${Math.min(100, (classItem.current_students / classItem.max_students) * 100)}%`
                          }}
                        />
                      </div>
                      {classItem.current_students > classItem.max_students && (
                        <div className="text-xs text-red-600 font-medium">
                          ⚠️ Over capacity by {classItem.current_students - classItem.max_students} student{classItem.current_students - classItem.max_students === 1 ? '' : 's'}
                        </div>
                      )}
                      {classItem.educator && classItem.educator !== "TBD" && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Class Teacher:</span> <span className="font-medium text-gray-900">{classItem.educator}</span>
                        </div>
                      )}
                      {classItem.skillAreas && classItem.skillAreas.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {classItem.skillAreas.map((skill) => (
                            <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowEditModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          type="button"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowStudentsModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          type="button"
                        >
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          Students
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClass(classItem)
                            setShowDetailsDrawer(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          type="button"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !isEmpty && viewMode === "table" && paginatedClasses.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedClasses.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                          <div className="text-xs text-gray-500">Section {classItem.section}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.grade}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span className={classItem.current_students > classItem.max_students ? 'text-red-600 font-medium' : ''}>
                              {classItem.current_students} / {classItem.max_students}
                            </span>
                            {classItem.current_students > classItem.max_students && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Over
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={classItem.account_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedClass(classItem)
                                setShowEditModal(true)
                              }} 
                              className="text-indigo-600 hover:text-indigo-900" 
                              type="button"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedClass(classItem)
                                setShowStudentsModal(true)
                              }} 
                              className="text-indigo-600 hover:text-indigo-900" 
                              type="button"
                            >
                              Students
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedClass(classItem)
                                setShowDetailsDrawer(true)
                              }} 
                              className="text-indigo-600 hover:text-indigo-900" 
                              type="button"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && paginatedClasses.length === 0 && !isEmpty && (
              <div className="text-center py-10 text-sm text-gray-500">
                No classes match your current filters. Try adjusting filters or clearing them.
                <div className="mt-3">
                  <button onClick={handleClearFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-700" type="button">
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </div>
      </div>

      <AddEditClassModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false)
          setShowEditModal(false)
          setSelectedClass(null)
        }}
        onSaved={() => {
          fetchClasses()
          setShowAddModal(false)
          setShowEditModal(false)
          setSelectedClass(null)
        }}
        editingClass={showEditModal ? selectedClass : null}
        schoolId={schoolId}
      />

      {showStudentsModal && selectedClass && (
        <ManageStudentsModalComponent
          classItem={selectedClass}
          students={students}
          onClose={() => {
            setShowStudentsModal(false)
            setSelectedClass(null)
          }}
          onUpdate={() => {
            fetchClasses()
            fetchStudents()
          }}
        />
      )}

      {showAssignEducatorModal && selectedClass && (
        <AssignEducatorModalComponent
          classItem={selectedClass}
          educators={educators}
          onClose={() => {
            setShowAssignEducatorModal(false)
            setSelectedClass(null)
          }}
          onUpdate={() => {
            fetchClasses()
          }}
        />
      )}

      {showDetailsDrawer && (
        <ClassDetailsDrawer
          classItem={selectedClass}
          onClose={() => {
            setShowDetailsDrawer(false)
            setSelectedClass(null)
          }}
          onEdit={(item) => {
            setSelectedClass(item)
            setShowEditModal(true)
            setShowDetailsDrawer(false)
          }}
          onManageStudents={(item) => {
            setSelectedClass(item)
            setShowStudentsModal(true)
            setShowDetailsDrawer(false)
          }}
          onAssignEducator={(item) => {
            setSelectedClass(item)
            setShowAssignEducatorModal(true)
            setShowDetailsDrawer(false)
          }}
        />
      )}
    </div>
  )
}

// Import modal components
import { AssignEducatorModal as AssignEducatorModalComponent, ManageStudentsModal as ManageStudentsModalComponent } from "../../../components/admin/modals/ClassManagementModals"
import Pagination from "../../../components/admin/Pagination"

export default ClassManagement
