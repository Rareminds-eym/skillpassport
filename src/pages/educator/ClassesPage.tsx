import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  XMarkIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  ClockIcon
} from "@heroicons/react/24/outline"
import SearchBar from "../../components/common/SearchBar"
import { useClasses } from "../../hooks/useClasses"
import ManageStudentsModal from "../../components/educator/ManageStudentsModal"
import { createClass, EducatorClass } from "../../services/classService"
import toast from "react-hot-toast"

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
    Active: "bg-emerald-100 text-emerald-700",
    Completed: "bg-indigo-100 text-indigo-700",
    Upcoming: "bg-amber-100 text-amber-700"
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

const taskStatusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Completed: "bg-emerald-100 text-emerald-700"
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
  onAssignTask
}: {
  classItem: EducatorClass | null
  onClose: () => void
  onManageStudents: (classItem: EducatorClass) => void
  onAssignTask: () => void
}) => {
  if (!classItem) return null

  const topStudents = classItem.students.slice(0, 5)
  const activeTasks = classItem.tasks.slice(0, 4)
  const recentNotes = classItem.notes.slice(0, 4)
  const progressConfig = getProgressConfig(classItem.avg_progress)

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
              <StatusBadge status={classItem.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">{classItem.course}</p>
            <p className="text-xs text-gray-400">{classItem.department} • Batch {classItem.year}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-500">Educator:</span>
              <span className="font-medium text-gray-900">{classItem.educator}</span>
              <span className="text-gray-400">•</span>
              <a
                href={`mailto:${classItem.educatorEmail}`}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
              >
                <EnvelopeIcon className="mr-1 h-4 w-4" />
                {classItem.educatorEmail}
              </a>
            </div>
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
              <p className="mt-2 text-2xl font-semibold text-gray-900">{classItem.total_students}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Average Progress</p>
              <div className="mt-3 max-w-[220px]">
                <ProgressBar value={classItem.avg_progress} />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Performance Band</p>
              <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${progressConfig.badge}`}>
                {classItem.performance_band}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="mr-1.5 h-4 w-4" />
              Updated {formatDate(classItem.lastUpdated)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onManageStudents(classItem)}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <UserGroupIcon className="mr-1.5 h-4 w-4" />
                Manage Students
              </button>
              <button
                onClick={onAssignTask}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <ClipboardDocumentCheckIcon className="mr-1.5 h-4 w-4" />
                Assign Task
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Student Progress</h3>
              {classItem.students.length > 5 && (
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
                const studentConfig = getProgressConfig(student.progress)
                const progressValue = Math.min(100, Math.max(0, student.progress))
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

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
              {classItem.tasks.length > 4 && (
                <span className="text-xs text-gray-500">Showing recent {activeTasks.length} of {classItem.tasks.length}</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {activeTasks.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
                  No tasks assigned yet.
                </div>
              )}
              {activeTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center">
                          <CalendarDaysIcon className="mr-1 h-4 w-4" />
                          Due {formatDate(task.dueDate)}
                        </span>
                        {task.referenceLink && (
                          <a
                            href={task.referenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                          >
                            Resource
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusStyles[task.status] || "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  {task.skillTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.skillTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Recent Notes</h3>
              {classItem.notes.length > 4 && (
                <span className="text-xs text-gray-500">Showing latest {recentNotes.length} of {classItem.notes.length}</span>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {recentNotes.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
                  No notes recorded yet.
                </div>
              )}
              {recentNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-700">{note.content}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{note.author}</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const AddClassModal = ({
  isOpen,
  onClose,
  onCreated
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: (newClass: EducatorClass) => void
}) => {
  const [name, setName] = useState("")
  const [course, setCourse] = useState("")
  const [educator, setEducator] = useState("")
  const [educatorEmail, setEducatorEmail] = useState("")
  const [department, setDepartment] = useState("")
  const [year, setYear] = useState("")
  const [status, setStatus] = useState("Active")
  const [skillInput, setSkillInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const statusOptions = ["Active", "Upcoming", "Completed"]

  useEffect(() => {
    if (!isOpen) {
      setName("")
      setCourse("")
      setEducator("")
      setEducatorEmail("")
      setDepartment("")
      setYear("")
      setStatus("Active")
      setSkillInput("")
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!name.trim() || !course.trim() || !educator.trim() || !educatorEmail.trim() || !department.trim() || !year.trim()) {
      setError("Fill in all required fields")
      return
    }

    setError(null)
    setSubmitting(true)
    const { data, error: serviceError } = await createClass({
      name: name.trim(),
      course: course.trim(),
      educator: educator.trim(),
      educatorEmail: educatorEmail.trim(),
      department: department.trim(),
      year: year.trim(),
      status: status as "Active" | "Completed" | "Upcoming",
      skillAreas: skillInput
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    })
    setSubmitting(false)
    if (serviceError || !data) {
      setError(serviceError || "Unable to create class")
      toast.error(serviceError || "Unable to create class")
      return
    }

    toast.success("Class created")
    onCreated(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Class</h2>
              <p className="mt-1 text-sm text-gray-500">Enter class details to add it to your educator workspace.</p>
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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Class Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="AI Fundamentals"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Course</label>
              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Artificial Intelligence"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Educator Name</label>
              <input
                value={educator}
                onChange={(e) => setEducator(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dr. Asha Raman"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Educator Email</label>
              <input
                value={educatorEmail}
                onChange={(e) => setEducatorEmail(e.target.value)}
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="asha.raman@example.edu"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Department</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Computer Science"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Batch Year</label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2025"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Skill Areas (comma separated)</label>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="AI, Communication"
              />
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
              {submitting ? "Creating..." : "Create Class"}
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
      <h2 className="mt-4 text-lg font-semibold text-gray-900">No classes yet</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        No classes found. You can import from CSV or create one manually to get started with your educator workspace.
      </p>
      <div className="mt-6 flex flex-col space-y-3 w-full sm:w-auto">
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          type="button"
        >
          Create New Class
        </button>
        <a
          href="/educator/classes/import"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Import from CSV
        </a>
      </div>
    </div>
  )
}

const ClassesPage = () => {
  const navigate = useNavigate()
  const { classes, loading, error, stats, upsertClass } = useClasses()
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    courses: [] as string[],
    years: [] as string[],
    statuses: [] as string[],
    departments: [] as string[],
    educators: [] as string[],
    skillAreas: [] as string[],
    performanceBands: [] as string[]
  })
  const [detailClass, setDetailClass] = useState<EducatorClass | null>(null)
  const [manageStudentsClass, setManageStudentsClass] = useState<EducatorClass | null>(null)
  const [showAddClassModal, setShowAddClassModal] = useState(false)

  const courseOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.course.toLowerCase()
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

  const departmentOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.department.toLowerCase()
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
      counts[item.year] = (counts[item.year] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => Number(b.value) - Number(a.value))
  }, [classes])

  const educatorOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.educator.toLowerCase()
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

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.status.toLowerCase()
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

  const skillAreaOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      item.skillAreas.forEach((area) => {
        const key = area.toLowerCase()
        counts[key] = (counts[key] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [classes])

  const performanceOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.performance_band.toLowerCase()
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
        ? [item.name, item.course, item.educator, item.department, item.year].some((field) => field.toLowerCase().includes(query))
        : true

      const matchesCourse = filters.courses.length ? filters.courses.includes(item.course.toLowerCase()) : true
      const matchesYear = filters.years.length ? filters.years.includes(item.year) : true
      const matchesStatus = filters.statuses.length ? filters.statuses.includes(item.status.toLowerCase()) : true
      const matchesDepartment = filters.departments.length ? filters.departments.includes(item.department.toLowerCase()) : true
      const matchesEducator = filters.educators.length ? filters.educators.includes(item.educator.toLowerCase()) : true
      const matchesSkill = filters.skillAreas.length
        ? item.skillAreas.some((area) => filters.skillAreas.includes(area.toLowerCase()))
        : true
      const matchesPerformance = filters.performanceBands.length
        ? filters.performanceBands.includes(item.performance_band.toLowerCase())
        : true

      return (
        matchesSearch &&
        matchesCourse &&
        matchesYear &&
        matchesStatus &&
        matchesDepartment &&
        matchesEducator &&
        matchesSkill &&
        matchesPerformance
      )
    })
  }, [classes, searchQuery, filters])

  const handleClearFilters = () => {
    setFilters({
      courses: [],
      years: [],
      statuses: [],
      departments: [],
      educators: [],
      skillAreas: [],
      performanceBands: []
    })
  }

  const handleViewDetails = (classItem: EducatorClass) => {
    const matched = classes.find((item) => item.id === classItem.id)
    setDetailClass(matched || classItem)
  }

  const totalFilters =
    filters.courses.length +
    filters.years.length +
    filters.statuses.length +
    filters.departments.length +
    filters.educators.length +
    filters.skillAreas.length +
    filters.performanceBands.length

  const isEmpty = !loading && filteredClasses.length === 0 && !error && !searchQuery && totalFilters === 0

  return (
    <div className="flex flex-col h-screen">
      {/* Header - responsive layout */}
      <div className='p-4 sm:p-6 lg:p-8 mb-2'>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Classes Management</h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">Manage your classes and manage student progress here.</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
            <span className="ml-2 text-sm text-gray-500">({stats.activeCount} active of {stats.total} total)</span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by class name, course, educator, or department"
              size="md"
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
          <span className="text-sm text-gray-500">{filteredClasses.length} results</span>
        </div>

        <div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search classes" size="md" />
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

      <div className="flex flex-1 overflow-hidden relative">
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
                  <FilterSection title="Course / Subject" defaultOpen>
                    <CheckboxGroup
                      options={courseOptions}
                      selectedValues={filters.courses}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, courses: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Batch Year">
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

                  <FilterSection title="Department">
                    <CheckboxGroup
                      options={departmentOptions}
                      selectedValues={filters.departments}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, departments: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Educator Name">
                    <CheckboxGroup
                      options={educatorOptions}
                      selectedValues={filters.educators}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, educators: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Skill Area">
                    <CheckboxGroup
                      options={skillAreaOptions}
                      selectedValues={filters.skillAreas}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, skillAreas: values }))}
                    />
                  </FilterSection>

                  <FilterSection title="Performance Band">
                    <CheckboxGroup
                      options={performanceOptions}
                      selectedValues={filters.performanceBands}
                      onChange={(values: string[]) => setFilters((prev) => ({ ...prev, performanceBands: values }))}
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
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              type="button"
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Add New Class
            </button>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500 space-x-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Loading classes...</span>
              </div>
            )}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md p-4">{error}</div>
            )}
            {isEmpty && <EmptyState onCreate={() => setShowAddClassModal(true)} />}

            {!loading && !isEmpty && viewMode === "grid" && filteredClasses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-500">{classItem.course}</p>
                        <p className="text-xs text-gray-400">{classItem.department} • Batch {classItem.year}</p>
                      </div>
                      <StatusBadge status={classItem.status} />
                    </div>

                    <div className="mb-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Enrolled Students</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {classItem.total_students}
                        </span>
                      </div>
                      <ProgressBar value={classItem.avg_progress} />
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-500">Educator:</span> <span className="font-medium text-gray-900">{classItem.educator}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {classItem.skillAreas.map((skill) => (
                          <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setManageStudentsClass(classItem)}
                          className="inline-flex items-center px-3 py-1.5 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          type="button"
                        >
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          Manage Students
                        </button>
                        <button
                          onClick={() => navigate("/educator/assignments")}
                          className="inline-flex items-center px-3 py-1.5 border border-indigo-200 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          type="button"
                        >
                          <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                          Assign Task
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(classItem)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                          type="button"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !isEmpty && viewMode === "table" && filteredClasses.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Areas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClasses.map((classItem) => (
                      <tr key={classItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                          <div className="text-xs text-gray-500">{classItem.educator}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.course}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.total_students}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-36">
                            <ProgressBar value={classItem.avg_progress} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={classItem.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {classItem.skillAreas.slice(0, 3).map((skill) => (
                              <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                {skill}
                              </span>
                            ))}
                            {classItem.skillAreas.length > 3 && (
                              <span className="text-xs text-gray-500">+{classItem.skillAreas.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => setManageStudentsClass(classItem)} className="text-indigo-600 hover:text-indigo-900" type="button">
                              Manage Students
                            </button>
                            <button onClick={() => navigate("/educator/assignments")} className="text-indigo-600 hover:text-indigo-900" type="button">
                              Assign Task
                            </button>
                            <button onClick={() => handleViewDetails(classItem)} className="text-indigo-600 hover:text-indigo-900" type="button">
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && filteredClasses.length === 0 && !error && (
                  <div className="text-center py-8 text-sm text-gray-500">No classes available</div>
                )}
              </div>
            )}

            {!loading && filteredClasses.length === 0 && !isEmpty && (
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
        </div>
      </div>

      <AddClassModal
        isOpen={showAddClassModal}
        onClose={() => setShowAddClassModal(false)}
        onCreated={(newClass) => {
          upsertClass(newClass)
          setShowAddClassModal(false)
        }}
      />

      <ManageStudentsModal
        isOpen={!!manageStudentsClass}
        onClose={() => setManageStudentsClass(null)}
        classItem={manageStudentsClass}
        onStudentsUpdated={(updated) => {
          upsertClass(updated)
          setManageStudentsClass(updated)
          if (detailClass && detailClass.id === updated.id) {
            setDetailClass(updated)
          }
        }}
      />

      <ClassDetailsDrawer
        classItem={detailClass}
        onClose={() => setDetailClass(null)}
        onManageStudents={(item) => {
          setManageStudentsClass(item)
          setDetailClass(item)
        }}
        onAssignTask={() => {
          navigate("/educator/assignments")
        }}
      />
    </div>
  )
}

export default ClassesPage
