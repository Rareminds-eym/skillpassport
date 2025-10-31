import React, { useEffect, useMemo, useState } from "react"
import { XMarkIcon, PencilSquareIcon, PaperClipIcon, TagIcon, CalendarIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import { assignTaskToClass, EducatorClass } from "../../services/classService"

interface Props {
  isOpen: boolean
  onClose: () => void
  classItem: EducatorClass | null
  onTaskAssigned: (updatedClass: EducatorClass) => void
}

type SkillOption = { value: string; label: string }

const defaultSkills = ["Communication", "AI", "Design Thinking", "Problem Solving", "Research", "Entrepreneurship", "Data Structures"]

const AssignTaskModal: React.FC<Props> = ({ isOpen, onClose, classItem, onTaskAssigned }) => {
  const [taskName, setTaskName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [referenceLink, setReferenceLink] = useState("")
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTaskName("")
    setDueDate("")
    setSelectedSkills([])
    setReferenceLink("")
    setAttachmentName(undefined)
  }, [isOpen])

  const skillOptions: SkillOption[] = useMemo(() => {
    const merged = new Set(defaultSkills.map((skill) => skill.toLowerCase()))
    if (classItem) {
      classItem.skillAreas.forEach((skill) => merged.add(skill.toLowerCase()))
    }
    return Array.from(merged)
      .map((value) => ({ value, label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [classItem])

  if (!isOpen || !classItem) return null

  const toggleSkill = (value: string) => {
    setSelectedSkills((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleSubmit = async () => {
    if (!taskName.trim()) {
      toast.error("Task name is required")
      return
    }
    if (!dueDate) {
      toast.error("Select a due date")
      return
    }
    setLoading(true)
    const { data, error } = await assignTaskToClass({
      classId: classItem.id,
      task: {
        name: taskName.trim(),
        dueDate,
        skillTags: selectedSkills.map((skill) => skill.replace(/\b\w/g, (letter) => letter.toUpperCase())),
        referenceLink: referenceLink || undefined,
        attachment: attachmentName
      }
    })
    setLoading(false)
    if (error || !data) {
      toast.error(error || "Unable to assign task")
      return
    }
    toast.success("Task assigned")
    onTaskAssigned(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" aria-hidden="true" onClick={onClose} />
        <div className="inline-block w-full max-w-2xl align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assign Task</h2>
              <p className="mt-1 text-sm text-gray-500">{classItem.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <PencilSquareIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  type="text"
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Weekly Reflection Journal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  type="date"
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Skill Tags</label>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skillOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSkill(option.label)}
                    className={`inline-flex items-center justify-between px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
                      selectedSkills.includes(option.label)
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200"
                    }`}
                  >
                    <span className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-2" />
                      {option.label}
                    </span>
                    {selectedSkills.includes(option.label) && <span className="ml-2 text-indigo-600">Selected</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Link</label>
                <input
                  value={referenceLink}
                  onChange={(e) => setReferenceLink(e.target.value)}
                  type="url"
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach File</label>
                <div className="relative flex items-center">
                  <input
                    type="file"
                    aria-label="Upload reference file"
                    onChange={(event) => {
                      const files = event.target.files
                      setAttachmentName(files && files.length ? files[0].name : undefined)
                    }}
                    className="hidden"
                    id="task-attachment"
                  />
                  <label
                    htmlFor="task-attachment"
                    className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <PaperClipIcon className="h-4 w-4 mr-2" />
                    {attachmentName || "Upload"}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" type="button">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              type="button"
            >
              Assign Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignTaskModal
