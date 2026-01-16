import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ProgramSection, ProgramStudent, getStudentsByProgramSection, getAvailableStudentsForProgram, addStudentToProgram, removeStudentFromProgram } from '../../services/programService'
import { useEducatorSchool } from '../../hooks/useEducatorSchool'
import { usePermission } from '../../hooks/usePermissions'
import toast from 'react-hot-toast'

interface ManageProgramStudentsModalProps {
  isOpen: boolean
  onClose: () => void
  programSection: ProgramSection | null
  onStudentsUpdated?: () => void
}

const ManageProgramStudentsModal: React.FC<ManageProgramStudentsModalProps> = ({
  isOpen,
  onClose,
  programSection,
  onStudentsUpdated
}) => {
  const { college } = useEducatorSchool()
  
  // Permission controls for Classroom Management module
  const canCreate = usePermission("Classroom Management", "create")
  const canEdit = usePermission("Classroom Management", "edit")
  
  const [students, setStudents] = useState<ProgramStudent[]>([])
  const [availableStudents, setAvailableStudents] = useState<ProgramStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [addingStudent, setAddingStudent] = useState(false)

  useEffect(() => {
    if (isOpen && programSection) {
      fetchStudents()
      fetchAvailableStudents()
    }
  }, [isOpen, programSection])

  const fetchStudents = async () => {
    if (!programSection) return

    setLoading(true)
    try {
      const { data, error } = await getStudentsByProgramSection(programSection.id)
      if (error) {
        toast.error(error)
      } else {
        setStudents(data || [])
      }
    } catch (err) {
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableStudents = async () => {
    if (!college?.id) return

    try {
      const { data, error } = await getAvailableStudentsForProgram(college.id)
      if (error) {
        console.error('Error fetching available students:', error)
      } else {
        setAvailableStudents(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch available students:', err)
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId || !programSection) return

    setAddingStudent(true)
    try {
      const { error } = await addStudentToProgram(
        selectedStudentId,
        programSection.program_id,
        programSection.semester,
        programSection.section
      )
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Student added successfully')
        setSelectedStudentId('')
        await fetchStudents()
        await fetchAvailableStudents()
        onStudentsUpdated?.()
      }
    } catch (err) {
      toast.error('Failed to add student')
    } finally {
      setAddingStudent(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error } = await removeStudentFromProgram(studentId)
      
      if (error) {
        toast.error(error)
      } else {
        toast.success('Student removed successfully')
        await fetchStudents()
        await fetchAvailableStudents()
        onStudentsUpdated?.()
      }
    } catch (err) {
      toast.error('Failed to remove student')
    }
  }

  if (!isOpen || !programSection) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Students - {programSection.program.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Semester {programSection.semester}, Section {programSection.section} ({programSection.academic_year})
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6">
            {/* Add Student Section - Only show if user has create permission */}
            {canCreate.allowed ? (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Add Student to Program</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={addingStudent}
                  >
                    <option value="">Select a student...</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      console.log('🎓 [ManageProgramStudentsModal] Action: Add Student Button Clicked', {
                        module: 'Classroom Management',
                        action: 'Add Student',
                        permissions: {
                          canCreate: canCreate.allowed,
                          canEdit: canEdit.allowed
                        },
                        selectedStudentId: selectedStudentId,
                        programSectionId: programSection?.id,
                        timestamp: new Date().toISOString()
                      });
                      alert('✅ Permission Test: Add student to program allowed for College Educator');
                      handleAddStudent();
                    }}
                    disabled={!selectedStudentId || addingStudent}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    type="button"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    {addingStudent ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-100 p-4 opacity-50 blur-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Add Student to Program</h3>
                <div className="flex gap-3">
                  <select
                    disabled
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">❌ No CREATE Permission</option>
                  </select>
                  <button
                    disabled
                    className="inline-flex items-center rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                    type="button"
                    title="❌ No CREATE permission to add students"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    No Permission
                  </button>
                </div>
              </div>
            )}

            {/* Current Students */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Current Students ({students.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No students enrolled in this program section yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                          {student.enrollment_number && (
                            <div className="text-xs text-gray-500">
                              Enrollment: {student.enrollment_number}
                            </div>
                          )}
                          {student.contact_number && (
                            <div className="text-xs text-gray-500">
                              Phone: {student.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Remove button - permission-based styling */}
                      {canEdit.allowed ? (
                        <button
                          onClick={() => {
                            console.log('🎓 [ManageProgramStudentsModal] Action: Remove Student Button Clicked', {
                              module: 'Classroom Management',
                              action: 'Remove Student',
                              permissions: {
                                canCreate: canCreate.allowed,
                                canEdit: canEdit.allowed
                              },
                              studentId: student.id,
                              studentName: student.name,
                              programSectionId: programSection?.id,
                              timestamp: new Date().toISOString()
                            });
                            alert('✅ Permission Test: Remove student from program allowed for College Educator');
                            handleRemoveStudent(student.id);
                          }}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-all"
                          type="button"
                          title="Remove student from program"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            console.log('❌ [ManageProgramStudentsModal] Action Blocked: Remove Student - No Edit Permission');
                            alert('❌ Access Denied: You need EDIT permission to remove students');
                          }}
                          disabled
                          className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 cursor-not-allowed opacity-50 blur-sm transition-all"
                          type="button"
                          title="❌ No EDIT permission to remove students"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          No Permission
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-gray-200 pt-4">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageProgramStudentsModal