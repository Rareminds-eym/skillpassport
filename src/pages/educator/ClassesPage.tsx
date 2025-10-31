import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  EyeIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import SearchBar from "../../components/common/SearchBar"
import { useClasses } from "../../hooks/useClasses"

const FilterSection = ({ title, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        type="button"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  )
}

const CheckboxGroup = ({ options, selectedValues, onChange }: any) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
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
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
          {option.count !== undefined && (
            <span className="ml-auto text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    Active: "bg-green-100 text-green-800",
    Completed: "bg-indigo-100 text-indigo-800",
    Upcoming: "bg-yellow-100 text-yellow-800"
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

const ProgressBar = ({ value }: { value: number }) => {
  return (
    <div className="w-full bg-gray-100 h-2 rounded-full">
      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

const ClassNoteModal = ({ isOpen, onClose, selectedClass, onSuccess }: any) => {
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setNote("")
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError("Please enter a note")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save note")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Add Class Note</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add a note for <span className="font-medium">{selectedClass?.name}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your observations, reminders, or follow-ups for this class"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
              type="button"
            >
              {loading ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ClassesPage = () => {
  const navigate = useNavigate()
  const { classes, loading, error, stats } = useClasses()
  const [viewMode, setViewMode] = useState("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    courses: [] as string[],
    years: [] as string[],
    statuses: [] as string[],
    departments: [] as string[],
    educators: [] as string[]
  })
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any>(null)

  const courseOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    classes.forEach((item) => {
      const value = item.course.toLowerCase()
      counts[value] = (counts[value] || 0) + 1
    })
    return Object.entries(counts)
      .map(([value, count]) => ({
        value,
        label: value.replace(/\b\w/g, (l) => l.toUpperCase()),
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
        label: value.replace(/\b\w/g, (l) => l.toUpperCase()),
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
        label: value.replace(/\b\w/g, (l) => l.toUpperCase()),
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
        label: value.replace(/\b\w/g, (l) => l.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count)
  }, [classes])

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return classes.filter((item) => {
      const matchesSearch = query
        ? [item.name, item.course, item.educator, item.department, item.year]
            .some((field) => field.toLowerCase().includes(query))
        : true

      const matchesCourse = filters.courses.length
        ? filters.courses.includes(item.course.toLowerCase())
        : true

      const matchesYear = filters.years.length ? filters.years.includes(item.year) : true

      const matchesStatus = filters.statuses.length
        ? filters.statuses.includes(item.status.toLowerCase())
        : true

      const matchesDepartment = filters.departments.length
        ? filters.departments.includes(item.department.toLowerCase())
        : true

      const matchesEducator = filters.educators.length
        ? filters.educators.includes(item.educator.toLowerCase())
        : true

      return matchesSearch && matchesCourse && matchesYear && matchesStatus && matchesDepartment && matchesEducator
    })
  }, [classes, searchQuery, filters])

  const handleClearFilters = () => {
    setFilters({ courses: [], years: [], statuses: [], departments: [], educators: [] })
  }

  const handleAddNote = (classItem: any) => {
    setSelectedClass(classItem)
    setShowNoteModal(true)
  }

  const handleNoteSuccess = () => {
    window.alert(`Note added for ${selectedClass?.name}`)
    setShowNoteModal(false)
    setSelectedClass(null)
  }

  const handleViewDetails = (classItem: any) => {
    navigate(`/educator/classes/${classItem.id}`)
  }

  const totalFilters = filters.courses.length + filters.years.length + filters.statuses.length + filters.departments.length + filters.educators.length

  return (
    <div className="flex flex-col h-screen">
      <div className="hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
            <span className="ml-2 text-sm text-gray-500">
              ({stats.activeCount} active of {stats.total} total)
            </span>
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
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
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
          <span className="text-sm text-gray-500">
            {filteredClasses.length} results
          </span>
        </div>

        <div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search classes"
            size="md"
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
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {totalFilters}
              </span>
            )}
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === "grid"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                viewMode === "table"
                  ? "bg-primary-50 border-primary-300 text-primary-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showFilters && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-gray-900">Filters</h2>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                  type="button"
                >
                  Clear all
                </button>
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
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredClasses.length}</span> result{filteredClasses.length === 1 ? "" : "s"}
                {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading && <div className="text-sm text-gray-500">Loading classes...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && filteredClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-500">{classItem.course}</p>
                        <p className="text-xs text-gray-400">{classItem.department} • Batch {classItem.year}</p>
                      </div>
                      <StatusBadge status={classItem.status} />
                    </div>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Enrolled Students</span>
                        <span className="font-medium text-gray-900">{classItem.total_students}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Average Progress</span>
                          <span className="font-medium text-gray-900">{classItem.avg_progress}%</span>
                        </div>
                        <ProgressBar value={classItem.avg_progress} />
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-500">Educator:</span> <span className="font-medium text-gray-900">{classItem.educator}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleViewDetails(classItem)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                        type="button"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddNote(classItem)}
                        className="inline-flex items-center px-3 py-1.5 border border-primary-300 rounded text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
                        type="button"
                      >
                        <PencilSquareIcon className="h-3 w-3 mr-1" />
                        Add Note
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && filteredClasses.length === 0 && !error && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">
                      {searchQuery || totalFilters > 0 ? "No classes match your current filters" : "No classes available"}
                    </p>
                    {(totalFilters > 0 || searchQuery) && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        type="button"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">{classItem.avg_progress}%</span>
                            <div className="w-24">
                              <ProgressBar value={classItem.avg_progress} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={classItem.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => handleViewDetails(classItem)}
                              className="text-primary-600 hover:text-primary-900"
                              type="button"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleAddNote(classItem)}
                              className="text-primary-600 hover:text-primary-900"
                              type="button"
                            >
                              Add Note
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
          </div>
        </div>
      </div>

      <ClassNoteModal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false)
          setSelectedClass(null)
        }}
        selectedClass={selectedClass}
        onSuccess={handleNoteSuccess}
      />
    </div>
  )
}

export default ClassesPage
