import React, { ChangeEvent, useEffect, useMemo, useState } from "react"
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline"
import Papa from "papaparse"
import toast from "react-hot-toast"
import {
  addStudentToClass,
  EducatorClass,
  fetchStudentDirectory,
  removeStudentFromClass,
  StudentDirectoryEntry
} from "../../services/classService"

interface Props {
  isOpen: boolean
  onClose: () => void
  classItem: EducatorClass | null
  onStudentsUpdated: (updatedClass: EducatorClass) => void
}

type AddMode = "select" | "manual" | "csv"
type CSVStudent = { name: string; email: string; progress?: number }

const ManageStudentsModal: React.FC<Props> = ({ isOpen, onClose, classItem, onStudentsUpdated }) => {
  const [loading, setLoading] = useState(false)
  const [loadingDirectory, setLoadingDirectory] = useState(false)
  const [directory, setDirectory] = useState<StudentDirectoryEntry[]>([])
  const [addMode, setAddMode] = useState<AddMode>("select")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [manualName, setManualName] = useState("")
  const [manualEmail, setManualEmail] = useState("")
  const [manualProgress, setManualProgress] = useState<string>("")
  const [csvStudents, setCsvStudents] = useState<CSVStudent[]>([])
  const [csvError, setCsvError] = useState("")
  const [directorySearch, setDirectorySearch] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setSelectedStudentIds([])
    setManualName("")
    setManualEmail("")
    setManualProgress("")
    setAddMode("select")
    setCsvStudents([])
    setCsvError("")
    setDirectorySearch("")
    if (!directory.length) {
      loadDirectory()
    }
  }, [isOpen])

  const loadDirectory = async () => {
    setLoadingDirectory(true)
    const { data, error } = await fetchStudentDirectory()
    if (error || !data) {
      toast.error(error || "Unable to load students")
    } else {
      setDirectory(data)
    }
    setLoadingDirectory(false)
  }

  const availableStudents = useMemo(() => {
    if (!classItem) return []
    const existing = new Set(classItem.students.map((student) => student.id))
    return directory.filter((entry) => !existing.has(entry.id))
  }, [directory, classItem])

  const filteredStudents = useMemo(() => {
    if (!directorySearch.trim()) return availableStudents
    const query = directorySearch.toLowerCase()
    return availableStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query)
    )
  }, [availableStudents, directorySearch])

  useEffect(() => {
    setSelectedStudentIds((prev) => prev.filter((id) => availableStudents.some((student) => student.id === id)))
  }, [availableStudents])

  if (!isOpen || !classItem) return null

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const handleCSVChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) {
      input.value = ""
      return
    }
    setCsvError("")
    setCsvStudents([])
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const students = results.data
          .map((row) => {
            if (!row) return null
            const normalized = Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
              acc[key.trim().toLowerCase()] = typeof value === "string" ? value.trim() : value ? String(value).trim() : ""
              return acc
            }, {})
            const name = normalized.name || ""
            const email = normalized.email || ""
            const progressText = normalized.progress || ""
            if (!name || !email) return null
            const progressValue = progressText ? Number(progressText) : undefined
            if (progressValue !== undefined && (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100)) {
              return null
            }
            return {
              name,
              email,
              ...(progressValue !== undefined ? { progress: progressValue } : {})
            }
          })
          .filter((student): student is CSVStudent => Boolean(student))
        if (!students.length) {
          setCsvError("No valid rows found")
          return
        }
        setCsvStudents(students)
        setCsvError(results.errors && results.errors.length ? "Some rows could not be parsed" : "")
      },
      error: () => {
        setCsvStudents([])
        setCsvError("Unable to parse CSV")
      }
    })
    input.value = ""
  }

  const handleAddStudent = async () => {
    if (loading) return
    if (addMode === "select") {
      if (!selectedStudentIds.length) {
        toast.error("Choose at least one student to add")
        return
      }
      const entries = selectedStudentIds
        .map((id) => directory.find((entry) => entry.id === id))
        .filter((entry): entry is StudentDirectoryEntry => Boolean(entry))
      if (!entries.length) {
        toast.error("Selected students not found")
        return
      }
      setLoading(true)
      let latestClass: EducatorClass | null = null
      for (const entry of entries) {
        const { data, error } = await addStudentToClass({
          classId: classItem.id,
          student: {
            id: entry.id,
            name: entry.name,
            email: entry.email,
            progress: entry.defaultProgress
          }
        })
        if (error || !data) {
          toast.error(error || "Unable to add students")
          setLoading(false)
          return
        }
        latestClass = data
      }
      setLoading(false)
      if (latestClass) {
        toast.success(
          entries.length === 1 ? `${entries[0].name} added` : `${entries.length} students added`
        )
        onStudentsUpdated(latestClass)
        setSelectedStudentIds([])
      }
    } else if (addMode === "csv") {
      if (!csvStudents.length) {
        toast.error("Upload a CSV with students")
        return
      }
      const studentsToAdd = csvStudents
      setLoading(true)
      let latestClass: EducatorClass | null = null
      for (const student of studentsToAdd) {
        const { data, error } = await addStudentToClass({
          classId: classItem.id,
          student: {
            name: student.name,
            email: student.email,
            progress: student.progress
          }
        })
        if (error || !data) {
          toast.error(error || "Unable to add students")
          setLoading(false)
          return
        }
        latestClass = data
      }
      setLoading(false)
      if (latestClass) {
        toast.success(
          studentsToAdd.length === 1
            ? `${studentsToAdd[0].name} added`
            : `${studentsToAdd.length} students added`
        )
        onStudentsUpdated(latestClass)
        setCsvStudents([])
        setCsvError("")
      }
    } else {
      if (!manualName.trim() || !manualEmail.trim()) {
        toast.error("Enter name and email")
        return
      }
      const progressValue = manualProgress ? Number(manualProgress) : undefined
      if (progressValue !== undefined && (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100)) {
        toast.error("Progress must be between 0 and 100")
        return
      }
      setLoading(true)
      const { data, error } = await addStudentToClass({
        classId: classItem.id,
        student: {
          name: manualName.trim(),
          email: manualEmail.trim(),
          progress: progressValue
        }
      })
      setLoading(false)
      if (error || !data) {
        toast.error(error || "Unable to add student")
        return
      }
      toast.success(`${manualName.trim()} added`)
      onStudentsUpdated(data)
      setManualName("")
      setManualEmail("")
      setManualProgress("")
    }
  }

  const handleRemoveStudent = async (studentId: string, name: string) => {
    if (loading) return
    setLoading(true)
    const { data, error } = await removeStudentFromClass(classItem.id, studentId)
    setLoading(false)
    if (error || !data) {
      toast.error(error || "Unable to remove student")
      return
    }
    toast.success(`${name} removed`)
    onStudentsUpdated(data)
  }

  const studentCount = classItem.students.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Manage Students</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{studentCount}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{classItem.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {studentCount === 0 && (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No students yet. Add learners to start tracking progress.
                  </div>
                )}
                {classItem.students.map((student) => (
                  <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-semibold text-gray-900">{student.progress}%</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.name)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100"
                        type="button"
                      >
                        <UserMinusIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Add Student</h3>
                <div className="mt-4">
                  <div className="flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setAddMode("select")}
                      className={`flex-1 px-3 py-2 text-xs font-medium border ${
                        addMode === "select" ? "border-indigo-600 text-indigo-700 bg-white" : "border-gray-200 text-gray-600 bg-gray-100"
                      } rounded-l-md`}
                    >
                      From Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode("manual")}
                      className={`flex-1 px-3 py-2 text-xs font-medium border -ml-px ${
                        addMode === "manual" ? "border-indigo-600 text-indigo-700 bg-white" : "border-gray-200 text-gray-600 bg-gray-100"
                      }`}
                    >
                      Add Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode("csv")}
                      className={`flex-1 px-3 py-2 text-xs font-medium border -ml-px ${
                        addMode === "csv" ? "border-indigo-600 text-indigo-700 bg-white" : "border-gray-200 text-gray-600 bg-gray-100"
                      } rounded-r-md`}
                    >
                      Upload CSV
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {addMode === "select" ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Choose Students</label>
                      <input
                        value={directorySearch}
                        onChange={(e) => setDirectorySearch(e.target.value)}
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        placeholder="Search by name or email"
                      />
                      <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                        {loadingDirectory ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Loading students...</div>
                        ) : availableStudents.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No students available</div>
                        ) : filteredStudents.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No students match your search</div>
                        ) : (
                          filteredStudents.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-start gap-3 border-b border-gray-100 px-3 py-2 last:border-none hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                      {selectedStudentIds.length > 0 && (
                        <p className="mt-2 text-xs text-gray-500">{selectedStudentIds.length} student{selectedStudentIds.length === 1 ? "" : "s"} selected</p>
                      )}
                    </div>
                  ) : addMode === "manual" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Student name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <input
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          type="email"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="student@example.edu"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Starting Progress (Optional)</label>
                        <input
                          value={manualProgress}
                          onChange={(e) => setManualProgress(e.target.value)}
                          type="number"
                          min={0}
                          max={100}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0-100"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Upload CSV</label>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleCSVChange}
                          className="w-full text-xs text-gray-600"
                        />
                      </div>
                      {csvError && <p className="text-xs text-red-600">{csvError}</p>}
                      {csvStudents.length > 0 && (
                        <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                          {csvStudents.map((student, index) => (
                            <div
                              key={`${student.email}-${index}`}
                              className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-none"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Progress</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {student.progress !== undefined ? `${student.progress}%` : "N/A"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {csvStudents.length > 0 && (
                        <p className="text-xs text-gray-500">{csvStudents.length} student{csvStudents.length === 1 ? "" : "s"} ready to add</p>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={handleAddStudent}
                  disabled={
                    loading ||
                    (addMode === "select"
                      ? selectedStudentIds.length === 0
                      : addMode === "manual"
                      ? !manualName.trim() || !manualEmail.trim()
                      : csvStudents.length === 0)
                  }
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Add Student"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageStudentsModal
