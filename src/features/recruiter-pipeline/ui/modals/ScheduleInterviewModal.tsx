import React, { useEffect, useState } from 'react'
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { createInterview } from '@/features/opportunities'
import { getLogger } from '@/shared/config/logging'

const logger = getLogger('ScheduleInterviewModal')

interface Props {
  isOpen: boolean
  onClose: () => void
  candidate: any
  onSuccess?: () => void
}

const ScheduleInterviewModal: React.FC<Props> = ({ isOpen, onClose, candidate, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ date?: string; interviewer?: string; job_title?: string }>({})
  const [formData, setFormData] = useState({
    date: '',
    duration: 30,
    interviewer: '',
    job_title: '',
    type: 'Technical',
    meeting_type: 'meet',
    meeting_link: '',
    meeting_notes: ''
  })

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setFieldErrors({})
    setLoading(false)
  }, [isOpen])

  const validate = () => {
    const errs: { date?: string; interviewer?: string; job_title?: string } = {}
    if (!formData.date) errs.date = 'Please select a date and time'
    if (!formData.interviewer.trim()) errs.interviewer = 'Please enter the interviewer name'
    if (!formData.job_title.trim()) errs.job_title = 'Please enter the job title'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSchedule = async () => {
    if (!validate()) return

    setLoading(true)
    setError(null)
    try {
      // interviews table contract (supabase/migrations/20260526000000_schema.sql):
      // date (timestamptz NOT NULL), duration (int), interviewer (text NOT NULL),
      // job_title (text NOT NULL), candidate_* contact columns, type /
      // meeting_type / meeting_link / meeting_notes. `candidate_id` is NOT a
      // real column — the candidate link is `learner_id` (uuid); only send it
      // when the candidate id actually is a uuid, otherwise the insert fails.
      const isUuid = (v: any) =>
        typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
      const learnerId = candidate?.learner_id ?? candidate?.id

      const payload: any = {
        id: `int_${Date.now()}`,
        candidate_name: candidate?.name,
        candidate_email: candidate?.email || null,
        candidate_phone: candidate?.phone_number || candidate?.phone || null,
        job_title: formData.job_title.trim(),
        interviewer: formData.interviewer.trim(),
        date: new Date(formData.date).toISOString(),
        duration: formData.duration,
        status: 'scheduled',
        type: formData.type,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link || null,
        meeting_notes: formData.meeting_notes || null,
      }
      if (isUuid(learnerId)) payload.learner_id = learnerId

      const { error } = await createInterview(payload)
      if (error) throw new Error(error.message)

      onSuccess?.()
      onClose()
    } catch (err: any) {
      logger.error('Failed to schedule interview', err as Error)
      setError(err.message || 'Failed to schedule interview')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Schedule Interview</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* Date & time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {fieldErrors.date && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Senior Full Stack Developer"
                />
                {fieldErrors.job_title && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.job_title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.interviewer}
                  onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Jane Smith"
                />
                {fieldErrors.interviewer && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.interviewer}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="HR">HR Round</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Final">Final Round</option>
                  <option value="Screening">Screening</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Platform</label>
                <select
                  value={formData.meeting_type}
                  onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="meet">Google Meet</option>
                  <option value="teams">MS Teams</option>
                  <option value="zoom">Zoom</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.meeting_notes}
                  onChange={(e) => setFormData({ ...formData, meeting_notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Any additional notes or instructions for the interview..."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleInterviewModal
