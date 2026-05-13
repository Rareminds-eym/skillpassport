import React, { useState, useEffect } from 'react'
import { XMarkIcon, UserPlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ProgramSection, ProgramLearner, getlearnersByProgramSection, getAvailablelearnersForProgram, addlearnerToProgram, removelearnerFromProgram } from '@/features/college-admin'
import { useEducatorSchool } from '@/features/educator/model/useEducatorSchool'
import { usePermission } from '@/entities/user/model/usePermissions'
import toast from 'react-hot-toast'
import { getLogger } from '@/shared/config/logging'

const logger = getLogger('manage-program-learners-modal')

interface ManageProgramLearnersModalProps {
  isOpen: boolean
  onClose: () => void
  programSection: ProgramSection | null
  onlearnersUpdated?: () => void
}

const ManageProgramLearnersModal: React.FC<ManageProgramLearnersModalProps> = ({
  isOpen,
  onClose,
  programSection,
  onlearnersUpdated
}) => {
  const { college } = useEducatorSchool()

  // Permission controls for Classroom Management module
  const canCreate = usePermission("Classroom Management", "create")
  const canEdit = usePermission("Classroom Management", "edit")

  const [learners, setlearners] = useState<ProgramLearner[]>([])
  const [availablelearners, setAvailablelearners] = useState<ProgramLearner[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('')
  const [addingLearner, setAddingLearner] = useState(false)

  useEffect(() => {
    if (isOpen && programSection) {
      fetchlearners()
      fetchAvailablelearners()
    }
  }, [isOpen, programSection])

  const fetchlearners = async () => {
    if (!programSection) return

    setLoading(true)
    try {
      const { data, error } = await getlearnersByProgramSection(programSection.id)
      if (error) {
        toast.error(error)
      } else {
        setlearners(data || [])
      }
    } catch (err) {
      toast.error('Failed to fetch learners')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablelearners = async () => {
    if (!college?.id) return

    try {
      const { data, error } = await getAvailablelearnersForProgram(college.id)
      if (error) {
        logger.error('Error fetching available learners', new Error(error))
      } else {
        setAvailablelearners(data || [])
      }
    } catch (err) {
      logger.error('Failed to fetch available learners', err instanceof Error ? err : new Error(String(err)))
    }
  }

  const handleAddLearner = async () => {
    if (!selectedLearnerId || !programSection) return

    setAddingLearner(true)
    try {
      const { error } = await addlearnerToProgram(
        selectedLearnerId,
        programSection.program_id,
        programSection.semester,
        programSection.section
      )

      if (error) {
        toast.error(error)
      } else {
        toast.success('Learner added successfully')
        setSelectedLearnerId('')
        await fetchlearners()
        await fetchAvailablelearners()
        onlearnersUpdated?.()
      }
    } catch (err) {
      toast.error('Failed to add learner')
    } finally {
      setAddingLearner(false)
    }
  }

  const handleRemoveLearner = async (learnerId: string) => {
    try {
      const { error } = await removelearnerFromProgram(learnerId)

      if (error) {
        toast.error(error)
      } else {
        toast.success('Learner removed successfully')
        await fetchlearners()
        await fetchAvailablelearners()
        onlearnersUpdated?.()
      }
    } catch (err) {
      toast.error('Failed to remove learner')
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
                Manage Learners - {programSection.program.name}
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
            {/* Add Learner Section - Only show if user has create permission */}
            {canCreate.allowed ? (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Add Learner to Program</h3>
                <div className="flex gap-3">
                  <select
                    value={selectedLearnerId}
                    onChange={(e) => setSelectedLearnerId(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={addingLearner}
                  >
                    <option value="">Select a learner...</option>
                    {availablelearners.map((learner) => (
                      <option key={learner.id} value={learner.id}>
                        {learner.name} ({learner.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      handleAddLearner();
                    }}
                    disabled={!selectedLearnerId || addingLearner}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    type="button"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    {addingLearner ? 'Adding...' : 'Add Learner'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-100 p-4 opacity-50 blur-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Add Learner to Program</h3>
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
                    title="❌ No CREATE permission to add learners"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    No Permission
                  </button>
                </div>
              </div>
            )}

            {/* Current Learners */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Current Learners ({learners.length})
              </h3>

              {loading ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Loading learners...
                </div>
              ) : learners.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  No learners enrolled in this program section yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {learners.map((learner) => (
                    <div
                      key={learner.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                            <p className="text-xs text-gray-500">{learner.email}</p>
                          </div>
                          {learner.enrollment_number && (
                            <div className="text-xs text-gray-500">
                              Enrollment: {learner.enrollment_number}
                            </div>
                          )}
                          {learner.contact_number && (
                            <div className="text-xs text-gray-500">
                              Phone: {learner.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Remove button - permission-based styling */}
                      {canEdit.allowed ? (
                        <button
                          onClick={() => {
                            handleRemoveLearner(learner.id);
                          }}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-all"
                          type="button"
                          title="Remove learner from program"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            logger.warn('Access denied: User lacks EDIT permission to remove learners');
                          }}
                          disabled
                          className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 cursor-not-allowed opacity-50 blur-sm transition-all"
                          type="button"
                          title="❌ No EDIT permission to remove learners"
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

export default ManageProgramLearnersModal