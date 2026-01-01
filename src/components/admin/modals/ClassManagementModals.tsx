// This file contains the modal components for ClassManagement
// Import this in ClassManagement.tsx if needed

import { useState, useEffect } from "react"
import { supabase } from "../../../lib/supabaseClient"
import toast from "react-hot-toast"
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline"

interface Student {
  id: string
  name: string
  email: string
  school_class_id: string | null
  progress?: number
}

interface SchoolClass {
  id: string
  name: string
  current_students: number
  max_students: number
  academic_year: string
}

interface Educator {
  id: string
  first_name: string
  last_name: string
  email: string
}

export const ManageStudentsModal = ({
  classItem,
  students,
  onClose,
  onUpdate
}: {
  classItem: SchoolClass
  students: Student[]
  onClose: () => void
  onUpdate: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const classStudents = students.filter(s => s.school_class_id === classItem.id)
  const availableStudents = students.filter(s => !s.school_class_id)

  const filteredAvailable = availableStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    setSelectedStudents([])
    setSearchQuery("")
  }, [classItem])

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const handleAddStudents = async () => {
    if (loading) return
    if (!selectedStudents.length) {
      toast.error("Choose at least one student to add")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("students")
        .update({ school_class_id: classItem.id })
        .in("id", selectedStudents)

      if (error) throw error

      await supabase
        .from("school_classes")
        .update({ 
          current_students: classStudents.length + selectedStudents.length,
          updated_at: new Date().toISOString()
        })
        .eq("id", classItem.id)

      const addedCount = selectedStudents.length
      const studentNames = students.filter(s => selectedStudents.includes(s.id))
      
      toast.success(
        addedCount === 1 
          ? `${studentNames[0]?.name || 'Student'} added` 
          : `${addedCount} students added`
      )
      setSelectedStudents([])
      onUpdate()
    } catch (error: any) {
      toast.error("Failed to add students")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (loading) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from("students")
        .update({ school_class_id: null })
        .eq("id", studentId)

      if (error) throw error

      await supabase
        .from("school_classes")
        .update({ 
          current_students: Math.max(0, classStudents.length - 1),
          updated_at: new Date().toISOString()
        })
        .eq("id", classItem.id)

      toast.success(`${studentName} removed`)
      onUpdate()
    } catch (error: any) {
      toast.error("Failed to remove student")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const studentCount = classStudents.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Manage Students</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {studentCount}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{classItem.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Students - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {studentCount === 0 && (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No students yet. Add learners to start tracking progress.
                  </div>
                )}
                {classStudents.map((student) => (
                  <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-semibold text-gray-900">{student.progress || 0}%</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.name)}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Add Students - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Add Student</h3>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Choose Students</label>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                      placeholder="Search by name or email"
                    />
                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                      {availableStudents.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No students available</div>
                      ) : filteredAvailable.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No students match your search</div>
                      ) : (
                        filteredAvailable.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-start gap-3 border-b border-gray-100 px-3 py-2 last:border-none hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
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
                    {selectedStudents.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedStudents.length} student{selectedStudents.length === 1 ? "" : "s"} selected
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddStudents}
                  disabled={loading || selectedStudents.length === 0}
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

export const AssignEducatorModal = ({
  classItem,
  educators,
  onClose,
  onUpdate
}: {
  classItem: SchoolClass
  educators: Educator[]
  onClose: () => void
  onUpdate: () => void
}) => {
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [isPrimary, setIsPrimary] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("school_educator_class_assignments")
        .select(`
          *,
          school_educators (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("class_id", classItem.id)

      if (error) throw error
      setAssignments(data || [])
    } catch (error: any) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignEducator = async () => {
    if (!selectedEducatorId || !subject.trim()) {
      toast.error("Please select an educator and enter a subject")
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from("school_educator_class_assignments")
        .insert([
          {
            educator_id: selectedEducatorId,
            class_id: classItem.id,
            subject: subject.trim(),
            academic_year: classItem.academic_year,
            is_primary: isPrimary,
            assigned_by: user?.id
          }
        ])

      if (error) throw error

      const educator = educators.find(e => e.id === selectedEducatorId)
      const educatorName = educator ? `${educator.first_name} ${educator.last_name}` : "Educator"
      
      toast.success(`${educatorName} assigned to ${subject}`)
      setSelectedEducatorId("")
      setSubject("")
      setIsPrimary(false)
      fetchAssignments()
      onUpdate()
    } catch (error: any) {
      toast.error("Failed to assign educator")
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, educatorName: string) => {
    if (submitting) return
    
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from("school_educator_class_assignments")
        .delete()
        .eq("id", assignmentId)

      if (error) throw error

      toast.success(`${educatorName} removed`)
      fetchAssignments()
      onUpdate()
    } catch (error: any) {
      toast.error("Failed to remove assignment")
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const assignmentCount = assignments.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Assign Educators</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {assignmentCount}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{classItem.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Assignments - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {loading ? (
                  <div className="py-10 px-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading assignments...</p>
                  </div>
                ) : assignmentCount === 0 ? (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No educators assigned yet. Assign educators to teach different subjects for this class.
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {assignment.school_educators?.first_name} {assignment.school_educators?.last_name}
                          </p>
                          {assignment.is_primary && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              ClassTeacher
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{assignment.school_educators?.email}</p>
                        <div className="mt-2 flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Subject</p>
                            <p className="text-sm font-semibold text-gray-900">{assignment.subject}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(
                          assignment.id, 
                          `${assignment.school_educators?.first_name} ${assignment.school_educators?.last_name}`
                        )}
                        disabled={submitting}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                      >
                        <UserMinusIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assign Educator - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Assign Educator</h3>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Educator
                    </label>
                    <select
                      value={selectedEducatorId}
                      onChange={(e) => setSelectedEducatorId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Choose an educator...</option>
                      {educators.map((educator) => (
                        <option key={educator.id} value={educator.id}>
                          {educator.first_name} {educator.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics, Science"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isPrimary" className="ml-2 text-xs text-gray-700">
                      Set as primary class teacher
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleAssignEducator}
                  disabled={submitting || !selectedEducatorId || !subject.trim()}
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {submitting ? "Assigning..." : "Assign Educator"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
