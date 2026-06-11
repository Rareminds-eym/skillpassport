// This file contains the modal components for ClassManagement
// Import this in ClassManagement.tsx if needed

import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from "@heroicons/react/24/outline"
import { useAuthStore } from '@/shared/model/authStore'
import { apiPost } from '@/shared/api/apiClient'
import { getLogger } from '@/shared/config/logging'

const logger = getLogger('class-management-modals')

interface Learner {
  id: string
  name: string
  email: string
  school_class_id: string | null
  progress?: number
}

interface SchoolClass {
  id: string
  name: string
  current_learners: number
  max_learners: number
  academic_year: string
}

interface Educator {
  id: string
  first_name: string
  last_name: string
  email: string
}

export const ManageLearnersModal = ({
  classItem,
  learners,
  onClose,
  onUpdate
}: {
  classItem: SchoolClass
  learners: Learner[]
  onClose: () => void
  onUpdate: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedlearners, setSelectedlearners] = useState<string[]>([])

  const classlearners = learners.filter(s => s.school_class_id === classItem.id)
  const availablelearners = learners.filter(s => !s.school_class_id)

  const filteredAvailable = availablelearners.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    setSelectedlearners([])
    setSearchQuery("")
  }, [classItem])

  const togglelearnerSelection = (learnerId: string) => {
    setSelectedlearners((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    )
  }

  const handleAddlearners = async () => {
    if (loading) return
    if (!selectedlearners.length) {
      toast.error("Choose at least one learner to add")
      return
    }

    // Check if adding these learners would exceed the maximum capacity
    const currentCount = classlearners.length
    const newCount = currentCount + selectedlearners.length
    
    if (newCount > classItem.max_learners) {
      const availableSpots = classItem.max_learners - currentCount
      if (availableSpots <= 0) {
        toast.error("This class is already at maximum capacity")
        return
      } else {
        toast.error(`Cannot add ${selectedlearners.length} learners. Only ${availableSpots} spot${availableSpots === 1 ? '' : 's'} available (${currentCount}/${classItem.max_learners})`)
        return
      }
    }

    setLoading(true)
    try {
      const { data } = await apiPost('/class-management/actions', {
        action: 'add-learners',
        learnerIds: selectedlearners,
        classId: classItem.id,
      })

      const addedCount = selectedlearners.length
      const learnerNames = learners.filter(s => selectedlearners.includes(s.id))
      
      toast.success(
        addedCount === 1
          ? `${learnerNames[0]?.name || 'Learner'} added`
          : `${addedCount} learners added`
      )
      setSelectedlearners([])
      onUpdate()
    } catch (error: any) {
      logger.error('Add learners failed', error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to add learners")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveLearner = async (learnerId: string, learnerName: string) => {
    if (loading) return
    
    setLoading(true)
    try {
      const { data } = await apiPost('/class-management/actions', {
        action: 'remove-learner',
        learnerId: learnerId,
        classId: classItem.id,
      })

      toast.success(`${learnerName} removed`)
      onUpdate()
    } catch (error: any) {
      logger.error('Remove learner failed', error instanceof Error ? error : new Error(String(error)), { classId: classItem.id, learnerId })
      toast.error("Failed to remove learner")
    } finally {
      setLoading(false)
    }
  }

  const learnerCount = classlearners.length
  const isAtCapacity = learnerCount >= classItem.max_learners
  const availableSpots = classItem.max_learners - learnerCount

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        <div className="inline-block w-full max-w-5xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900">Manage Learners</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isAtCapacity 
                    ? 'bg-red-100 text-red-700' 
                    : learnerCount > classItem.max_learners * 0.8 
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {learnerCount} / {classItem.max_learners}
                </span>
                {isAtCapacity && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    At Capacity
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{classItem.name}</p>
              {isAtCapacity && (
                <p className="mt-1 text-xs text-red-600">
                  This class has reached its maximum capacity of {classItem.max_learners} learners.
                </p>
              )}
              {!isAtCapacity && availableSpots <= 3 && availableSpots > 0 && (
                <p className="mt-1 text-xs text-yellow-600">
                  Only {availableSpots} spot{availableSpots === 1 ? '' : 's'} remaining.
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Learners - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {learnerCount === 0 && (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No learners yet. Add learners to start tracking progress.
                  </div>
                )}
                {classlearners.map((learner) => (
                  <div key={learner.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                      <p className="text-xs text-gray-500">{learner.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-semibold text-gray-900">{learner.progress || 0}%</p>
                      </div>
                      <button
                        onClick={() => handleRemoveLearner(learner.id, learner.name)}
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

            {/* Add Learners - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <div className={`border border-gray-200 rounded-lg p-4 ${isAtCapacity ? 'bg-red-50' : 'bg-gray-50'}`}>
                <h3 className="text-sm font-medium text-gray-900">Add Learner</h3>
                
                {isAtCapacity && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
                    <p className="text-xs text-red-700">
                      <strong>Class Full:</strong> This class has reached its maximum capacity of {classItem.max_learners} learners. 
                      To add more learners, either increase the class capacity or remove some existing learners.
                    </p>
                  </div>
                )}
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Choose Learners</label>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      type="text"
                      disabled={isAtCapacity}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={isAtCapacity ? "Class at capacity" : "Search by name or email"}
                    />
                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                      {isAtCapacity ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Cannot add learners - class at maximum capacity</div>
                      ) : availablelearners.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No learners available</div>
                      ) : filteredAvailable.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">No learners match your search</div>
                      ) : (
                        filteredAvailable.map((learner) => (
                          <label
                            key={learner.id}
                            className="flex items-start gap-3 border-b border-gray-100 px-3 py-2 last:border-none hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedlearners.includes(learner.id)}
                              onChange={() => togglelearnerSelection(learner.id)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{learner.name}</p>
                              <p className="text-xs text-gray-500">{learner.email}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedlearners.length > 0 && !isAtCapacity && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">
                          {selectedlearners.length} learner{selectedlearners.length === 1 ? "" : "s"} selected
                        </p>
                        {selectedlearners.length > availableSpots && (
                          <p className="text-xs text-red-600">
                            Warning: Only {availableSpots} spot{availableSpots === 1 ? '' : 's'} available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddlearners}
                  disabled={loading || selectedlearners.length === 0 || isAtCapacity}
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : isAtCapacity ? "Class Full" : "Add Learner"}
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
      const { data } = await apiPost('/class-management/actions', {
        action: 'fetch-assignments',
        classId: classItem.id,
      })
      setAssignments(data || [])
    } catch (error: any) {
      logger.error('Fetch assignments failed', error instanceof Error ? error : new Error(String(error)))
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
      const user = useAuthStore.getState().user;
      const { data } = await apiPost('/class-management/actions', {
        action: 'assign-educator',
        educatorId: selectedEducatorId,
        classId: classItem.id,
        subject: subject.trim(),
        academicYear: classItem.academic_year,
        isPrimary: isPrimary,
        assignedBy: user?.id,
      })

      const educator = educators.find(e => e.id === selectedEducatorId)
      const educatorName = educator ? `${educator.first_name} ${educator.last_name}` : "Educator"
      
      toast.success(`${educatorName} assigned to ${subject}`)
      setSelectedEducatorId("")
      setSubject("")
      setIsPrimary(false)
      fetchAssignments()
      onUpdate()
    } catch (error: any) {
      logger.error('Assign educator failed', error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to assign educator")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, educatorName: string) => {
    if (submitting) return
    
    setSubmitting(true)
    try {
      const { data } = await apiPost('/class-management/actions', {
        action: 'remove-assignment',
        assignmentId: assignmentId,
      })

      toast.success(`${educatorName} removed`)
      fetchAssignments()
      onUpdate()
    } catch (error: any) {
      logger.error('Remove educator assignment failed', error instanceof Error ? error : new Error(String(error)))
      toast.error("Failed to remove assignment")
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
