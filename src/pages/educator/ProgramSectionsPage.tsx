import {
  ArrowPathIcon,
  ClockIcon,
  EyeIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UserGroupIcon,
  XMarkIcon
} from "@heroicons/react/24/outline"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import SearchBar from "../../components/common/SearchBar"
import { useProgramSections } from "../../hooks/useProgramSections"
import { useEducatorSchool } from "../../hooks/useEducatorSchool"
import toast from "react-hot-toast"
import Pagination from "../../components/educator/Pagination"
import { useAuth } from "../../context/AuthContext"
import { ProgramSection } from "../../services/programService"
import ManageProgramStudentsModal from "../../components/educator/ManageProgramStudentsModal"
import { usePermission } from "../../rbac/hooks/usePermissions"

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600"
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${config[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

const formatDate = (value: string) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

const ProgramSectionDetailsDrawer = ({
  section,
  onClose,
  onManageStudents,
  onUnassign
}: {
  section: ProgramSection | null
  onClose: () => void
  onManageStudents: (section: ProgramSection) => void
  onUnassign: (section: ProgramSection) => void
}) => {
  if (!section) return null

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
              <h2 className="text-lg font-semibold text-gray-900">
                {section.program.name} - Semester {section.semester}
              </h2>
              <StatusBadge status={section.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">Section {section.section}</p>
            <p className="text-xs text-gray-400">
              {section.program.department.name} • {section.academic_year}
            </p>
            <p className="text-xs text-gray-400">
              {section.program.department.college.name}
            </p>
            {section.faculty && (
              <p className="text-xs text-gray-400">
                Faculty: {section.faculty.first_name} {section.faculty.last_name}
              </p>
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
              <p className="text-xs uppercase tracking-wide text-gray-500">Current Students</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{section.current_students}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Max Students</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{section.max_students}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Degree Level</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{section.program.degree_level}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="mr-1.5 h-4 w-4" />
              Updated {formatDate(section.updated_at)}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onManageStudents(section)}
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                type="button"
              >
                <UserGroupIcon className="mr-1.5 h-4 w-4" />
                Manage Students
              </button>
              <button
                onClick={() => onUnassign(section)}
                className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                type="button"
              >
                <XMarkIcon className="mr-1.5 h-4 w-4" />
                Unassign
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-900">Program Details</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Program Code:</span>
                    <span className="ml-2 font-medium">{section.program.code}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Semester:</span>
                    <span className="ml-2 font-medium">{section.semester}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Section:</span>
                    <span className="ml-2 font-medium">{section.section}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Academic Year:</span>
                    <span className="ml-2 font-medium">{section.academic_year}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
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
      <h2 className="mt-4 text-lg font-semibold text-gray-900">No program sections yet</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        No program sections found. Create a new program section to get started with your educator workspace.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          type="button"
        >
          Create New Program Section
        </button>
      </div>
    </div>
  )
}

const ProgramSectionsPage = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { college: educatorCollege, loading: schoolLoading } = useEducatorSchool()
  
  // Permission controls for Classroom Management module
  const canView = usePermission("Classroom Management", "view")
  const canCreate = usePermission("Classroom Management", "create")
  
  const {
    programSections,
    loading,
    error,
    fetchDepartments,
    unassignFromSection,
    refetch
  } = useProgramSections()

  const [viewMode, setViewMode] = useState("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)
  const [detailSection, setDetailSection] = useState<ProgramSection | null>(null)
  const [manageStudentsSection, setManageStudentsSection] = useState<ProgramSection | null>(null)

  // Security check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    
    if (user?.role !== 'educator' && user?.role !== 'college_educator') {
      console.error('Unauthorized access attempt to program sections page')
      navigate('/auth/login')
      return
    }
  }, [isAuthenticated, user, navigate])

  // Permission check - redirect if no view permission
  useEffect(() => {
    if (!canView) {
      console.warn('Access denied: No view permission for Classroom Management')
      navigate('/educator/dashboard')
      return
    }
  }, [canView, navigate])

  // Fetch departments when college is loaded
  useEffect(() => {
    if (educatorCollege?.id) {
      fetchDepartments(educatorCollege.id)
    }
  }, [educatorCollege?.id, fetchDepartments])

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return programSections.filter((section) => {
      const matchesSearch = query
        ? [
            section.program.name,
            section.program.code,
            section.section,
            section.academic_year,
            section.program.department.name
          ].some((field) => field.toLowerCase().includes(query))
        : true

      return matchesSearch
    })
  }, [programSections, searchQuery])

  const totalItems = filteredSections.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSections = filteredSections.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUnassignFromSection = async (section: ProgramSection) => {
    try {
      const success = await unassignFromSection(section.id)
      if (success) {
        toast.success('Successfully unassigned from program section')
        setDetailSection(null)
      }
    } catch (err) {
      toast.error('Failed to unassign from program section')
    }
  }

  const isLoading = loading || schoolLoading
  const isEmpty = !isLoading && paginatedSections.length === 0 && !error && !searchQuery

  // Show access denied if no view permission
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XMarkIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the Classroom Management module.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/educator/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex overflow-y-auto mb-4 flex-col h-screen">
      <div className='p-4 sm:p-6 lg:p-8 mb-2'>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Program Sections</h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">Manage your assigned program sections and students.</p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 hidden lg:flex items-center p-4 bg-white border-b border-gray-200">
        <div className="w-80 flex-shrink-0 pr-4 text-left">
          <div className="inline-flex items-baseline">
            <h1 className="text-xl font-semibold text-gray-900">Program Sections</h1>
            <span className="ml-2 text-sm text-gray-500">({programSections.length} assigned)</span>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="max-w-xl mx-auto">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by program name, code, or section"
              size="md"
            />
          </div>
        </div>

        <div className="w-80 flex-shrink-0 pl-4 flex items-center justify-end space-x-2">
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
          <h1 className="text-xl font-semibold text-gray-900">Program Sections</h1>
          <span className="text-sm text-gray-500">{paginatedSections.length} results</span>
        </div>

        <div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search sections" size="md" />
        </div>

        <div className="flex items-center space-x-2">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredSections.length}</span> result{filteredSections.length === 1 ? "" : "s"}
              {searchQuery && <span className="text-gray-500"> for "{searchQuery}"</span>}
            </p>
            {/* <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              type="button"
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Create New Program Section
            </button> */}
          </div>

          <div className="px-4 sm:px-6 lg:px-8 flex-1 overflow-y-auto p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500 space-x-2">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Loading program sections...</span>
              </div>
            )}
            {!isLoading && error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md p-4">
                {error}
              </div>
            )}
            {!isLoading && isEmpty && <EmptyState onCreate={() => {}} />}

            {!isLoading && !isEmpty && viewMode === "grid" && paginatedSections.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedSections.map((section) => (
                  <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.program.name}</h3>
                        <p className="text-xs text-gray-400">
                          Semester {section.semester} • Section {section.section}
                        </p>
                        <p className="text-sm text-gray-500">{section.program.code}</p>
                      </div>
                      <StatusBadge status={section.status} />
                    </div>

                    <div className="mb-4 space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Students</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {section.current_students} / {section.max_students}
                        </span>
                      </div>
                      {section.faculty && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">Faculty:</span> 
                          <span className="font-medium text-gray-900 ml-1">
                            {section.faculty.first_name} {section.faculty.last_name}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-500">Department:</span> 
                        <span className="font-medium text-gray-900 ml-1">{section.program.department.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-500">Academic Year:</span> 
                        <span className="font-medium text-gray-900 ml-1">{section.academic_year}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!canCreate) {
                              alert('❌ Access Denied: You need CREATE permission to manage students');
                              return;
                            }
                            setManageStudentsSection(section);
                          }}
                          disabled={!canCreate.allowed}
                          className={`inline-flex items-center px-3 py-1.5 border rounded text-xs font-medium transition-all ${
                            canCreate.allowed
                              ? 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
                              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50 blur-sm'
                          }`}
                          type="button"
                          title={canCreate.allowed ? 'Manage Students' : '❌ No CREATE permission'}
                        >
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          Students
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!canView) {
                              alert('❌ Access Denied: You need VIEW permission to see details');
                              return;
                            }
                            setDetailSection(section);
                          }}
                          disabled={!canView.allowed}
                          className={`inline-flex items-center px-3 py-1.5 border rounded text-xs font-medium transition-all ${
                            canView.allowed
                              ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
                              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50 blur-sm'
                          }`}
                          type="button"
                          title={canView.allowed ? 'View Details' : '❌ No VIEW permission'}
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

            {!isLoading && !isEmpty && viewMode === "table" && paginatedSections.length > 0 && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSections.map((section) => (
                      <tr key={section.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{section.program.name}</div>
                          <div className="text-xs text-gray-500">{section.program.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {section.faculty ? `${section.faculty.first_name} ${section.faculty.last_name}` : 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{section.semester}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{section.section}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {section.current_students} / {section.max_students}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{section.academic_year}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <StatusBadge status={section.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => {
                                if (!canCreate) {
                                  alert('❌ Access Denied: You need CREATE permission to manage students');
                                  return;
                                }
                                setManageStudentsSection(section);
                              }} 
                              disabled={!canCreate.allowed}
                              className={`transition-all ${
                                canCreate.allowed
                                  ? 'text-indigo-600 hover:text-indigo-900 cursor-pointer'
                                  : 'text-gray-400 cursor-not-allowed opacity-50 blur-sm'
                              }`}
                              type="button"
                              title={canCreate.allowed ? 'Manage Students' : '❌ No CREATE permission'}
                            >
                              Students
                            </button>
                            <button onClick={() => {
                              if (!canView) {
                                alert('❌ Access Denied: You need VIEW permission to see details');
                                return;
                              }
                              setDetailSection(section);
                            }} 
                            disabled={!canView.allowed}
                            className={`transition-all ${
                              canView.allowed
                                ? 'text-indigo-600 hover:text-indigo-900 cursor-pointer'
                                : 'text-gray-400 cursor-not-allowed opacity-50 blur-sm'
                            }`}
                            type="button"
                            title={canView.allowed ? 'View Details' : '❌ No VIEW permission'}
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

            {!isLoading && paginatedSections.length === 0 && !isEmpty && (
              <div className="text-center py-10 text-sm text-gray-500">
                No program sections match your search. Try adjusting your search terms.
              </div>
            )}
          </div>

          {!isLoading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <ManageProgramStudentsModal
        isOpen={!!manageStudentsSection}
        onClose={() => setManageStudentsSection(null)}
        programSection={manageStudentsSection}
        onStudentsUpdated={() => {
          // Refresh program sections to update student counts
          refetch()
        }}
      />

      <ProgramSectionDetailsDrawer
        section={detailSection}
        onClose={() => setDetailSection(null)}
        onManageStudents={(section) => {
          setManageStudentsSection(section)
          setDetailSection(null)
        }}
        onUnassign={handleUnassignFromSection}
      />
    </div>
  )
}

export default ProgramSectionsPage