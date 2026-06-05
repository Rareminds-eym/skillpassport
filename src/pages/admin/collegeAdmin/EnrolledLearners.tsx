/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  FunnelIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { learnerEnrollmentService, type EnrolledLearnerView } from "@/features/learner-profile/api";

import toast from "react-hot-toast";
import { Pagination } from '@/shared/ui';
import { SearchBar } from '@/shared/ui';
import { getLogger } from '@/shared/config/logging';

import { useUser } from '@/shared/model/authStore';
const logger = getLogger('college-admin-enrolled-learners');

const ITEMS_PER_PAGE = 10;

const EnrolledLearners: React.FC = () => {
  const user = useUser();
  const [collegeId, setCollegeId] = useState<string | null>(null);

  const [learners, setlearners] = useState<EnrolledLearnerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    graduated: 0,
  });

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Pagination for main table
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch college ID for the logged-in admin
  useEffect(() => {
    const fetchCollegeId = async () => {
      if (!user?.id && !user?.email) return;

      try {
        // Try organizations table by admin_id first (most reliable for college admins)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('admin_id', user.id)
          .eq('organization_type', 'college')
          .maybeSingle();

        if (orgData?.id) {
          setCollegeId(orgData.id);
          return;
        }

        // Fallback: try organizations table by email
        if (user.email) {
          const { data: orgByEmail } = await supabase
            .from('organizations')
            .select('id')
            .eq('email', user.email)
            .eq('organization_type', 'college')
            .maybeSingle();

          if (orgByEmail?.id) {
            setCollegeId(orgByEmail.id);
            return;
          }
        }

        // Fallback: check localStorage
        const stored = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.collegeId) {
              setCollegeId(parsed.collegeId);
              return;
            }
            if (parsed.organizationId) {
              setCollegeId(parsed.organizationId);
              return;
            }
          } catch { /* ignore */ }
        }
      } catch (error) {
        logger.error('Error fetching college ID:', error as Error);
      }
    };

    fetchCollegeId();
  }, [user]);

  useEffect(() => {
    if (collegeId) {
      loadData();
    }
  }, [collegeId]);

  useEffect(() => {
    if (departmentFilter) {
      loadPrograms(departmentFilter);
    } else {
      setPrograms([]);
      setProgramFilter("");
    }
  }, [departmentFilter]);

  useEffect(() => {
    loadlearners();
  }, [collegeId, departmentFilter, programFilter, semesterFilter, statusFilter, academicYearFilter, searchTerm]);

  const loadData = async () => {
    await Promise.all([
      loadDepartments(),
      loadlearners(),
    ]);
  };

  const loadDepartments = async () => {
    if (!collegeId) return;

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("college_id", collegeId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      logger.error("Error loading departments:", error as Error);
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("department_id", departmentId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      logger.error("Error loading programs:", error as Error);
    }
  };

  const loadlearners = async () => {
    if (!collegeId) return;

    try {
      setLoading(true);

      const result = await learnerEnrollmentService.getEnrolledLearners({
        college_id: collegeId,
        department_id: departmentFilter || undefined,
        program_id: programFilter || undefined,
        semester: semesterFilter ? parseInt(semesterFilter) : undefined,
        search: searchTerm || undefined,
      });

      if (result.success && result.data) {
        setlearners(result.data);

        // Calculate stats - all enrolled learners are considered active
        const total = result.data.length;

        setStats({ total, active: total, inactive: 0, graduated: 0 });
      } else {
        toast.error(result.error?.message || "Failed to load learners");
      }
    } catch (error: any) {
      logger.error("Error loading learners:", error);
      toast.error("Failed to load enrolled learners");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | undefined | null) => {
    const safeStatus = status || 'active';
    const styles = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      graduated: "bg-blue-100 text-blue-700",
      transferred: "bg-yellow-100 text-yellow-700",
      withdrawn: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[safeStatus as keyof typeof styles] || styles.active}`}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    );
  };

  const clearFilters = () => {
    setDepartmentFilter("");
    setProgramFilter("");
    setSemesterFilter("");
    setStatusFilter("");
    setAcademicYearFilter("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Pagination calculations for main table
  const totalPages = Math.ceil(learners.length / ITEMS_PER_PAGE);
  const paginatedlearners = learners.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [departmentFilter, programFilter, semesterFilter, statusFilter, academicYearFilter, searchTerm]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Enrolled Learners
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              View and manage learner enrollments by department, program, and section
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserGroupIcon className="h-5 w-5" />
            Enroll Learners
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Enrolled
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
              <UserGroupIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Active
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Graduated
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.graduated}</p>
            </div>
            <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Inactive
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <div className="p-3 rounded-xl border bg-gray-50 text-gray-600 border-gray-200">
              <XCircleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          {(departmentFilter || programFilter || semesterFilter || statusFilter || academicYearFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onDebouncedChange={setSearchTerm}
            placeholder="Search learners..."
            debounceMs={300}
            size="md"
          />

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={!departmentFilter}
          >
            <option value="">All Programs</option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Learners ({learners.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : learners.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No enrolled learners found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Learner</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Roll Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Section</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedlearners.map((learner, index) => (
                    <tr key={learner.learner_id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{learner.learner_name}</div>
                          <div className="text-sm text-gray-500">{learner.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{learner.roll_number || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{learner.department_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{learner.program_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Semester {learner.semester}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{learner.section ? `Section ${learner.section}` : "Not Assigned"}</td>
                      <td className="px-4 py-3">{getStatusBadge('active')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={learners.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Enroll Learners Modal */}
      {showEnrollModal && (
        <EnrolllearnersModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            setShowEnrollModal(false);
            loadlearners();
          }}
          departments={departments}
          collegeId={collegeId}
        />
      )}
    </div>
  );
};


// Modern Enrollment Modal Component
const EnrolllearnersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: any[];
  collegeId: string | null;
}> = ({ isOpen, onClose, onSuccess, departments, collegeId }) => {
  // Form state
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  // Data state
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  const [availablelearners, setAvailablelearners] = useState<any[]>([]);
  const [selectedlearners, setSelectedlearners] = useState<string[]>([]);

  // UI state
  const [learnerSearch, setlearnerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadinglearners, setLoadinglearners] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const MODAL_ITEMS_PER_PAGE = 8;

  // Load programs when department changes
  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms();
    } else {
      setPrograms([]);
      setSelectedProgram("");
    }
  }, [selectedDepartment]);

  // Load available semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadAvailableSemesters();
    } else {
      setAvailableSemesters([]);
      setSelectedSemester("");
    }
  }, [selectedProgram]);

  // Load sections when program/semester changes
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadSections();
    } else {
      setSections([]);
      setSelectedSection("");
    }
  }, [selectedProgram, selectedSemester]);

  // Load unenrolled learners when program is selected
  useEffect(() => {
    if (selectedProgram) {
      loadUnenrolledlearners();
    } else {
      setAvailablelearners([]);
      setSelectedlearners([]);
    }
  }, [selectedProgram]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("department_id", selectedDepartment)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      logger.error("Error loading programs:", error as Error);
      toast.error("Failed to load programs");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSemesters = async () => {
    try {
      // Get distinct semesters from program_sections for this program
      const { data, error } = await supabase
        .from("program_sections")
        .select("semester")
        .eq("program_id", selectedProgram)
        .eq("status", "active");

      if (error) throw error;

      // Get unique semesters and sort them
      const semesters = [...new Set((data || []).map(s => s.semester))].sort((a, b) => a - b);
      setAvailableSemesters(semesters);

      // Reset semester selection if current selection is not available
      if (selectedSemester && !semesters.includes(parseInt(selectedSemester))) {
        setSelectedSemester("");
      }
    } catch (error) {
      logger.error("Error loading semesters:", error as Error);
      // Fallback to default semesters if query fails
      setAvailableSemesters([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  };

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from("program_sections")
        .select("*")
        .eq("program_id", selectedProgram)
        .eq("semester", parseInt(selectedSemester))
        .eq("status", "active")
        .order("section");

      if (error) throw error;

      // Get actual learner counts for each section
      if (data && data.length > 0) {
        const sectionsWithCounts = await Promise.all(
          data.map(async (sec) => {
            const { count } = await supabase
              .from("learners")
              .select("*", { count: "exact", head: true })
              .eq("program_id", selectedProgram)
              .eq("semester", parseInt(selectedSemester))
              .eq("section", sec.section)
              .eq("is_deleted", false);

            return {
              ...sec,
              current_learners: count || 0
            };
          })
        );
        setSections(sectionsWithCounts);
      } else {
        setSections([]);
      }
    } catch (error) {
      logger.error("Error loading sections:", error as Error);
    }
  };

  const loadUnenrolledlearners = async () => {
    try {
      setLoadinglearners(true);

      // Get learners who are NOT enrolled in any program (program_id is null)
      // AND belong to the same college as the admin
      let query = supabase
        .from("learners")
        .select("id, name, roll_number, email, contact_number, admission_number")
        .eq("is_deleted", false)
        .is("program_id", null)
        .order("name");

      // Filter by college if collegeId is available
      if (collegeId) {
        query = query.eq("college_id", collegeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailablelearners(data || []);
    } catch (error: any) {
      logger.error("Error loading learners:", error);
      toast.error("Failed to load learners");
    } finally {
      setLoadinglearners(false);
    }
  };

  const handleEnroll = async () => {
    if (selectedlearners.length === 0) {
      toast.error("Please select at least one learner");
      return;
    }

    if (!selectedProgram || !selectedSemester || !selectedSection) {
      toast.error("Please select program, semester, and section");
      return;
    }

    try {
      setEnrolling(true);

      const enrollments = selectedlearners.map(learnerId => ({
        learner_id: learnerId,
        program_id: selectedProgram,
        section: selectedSection || undefined,
        semester: parseInt(selectedSemester),
      }));

      const result = await learnerEnrollmentService.bulkEnrollLearners(enrollments);

      if (result.success) {
        toast.success(`Successfully enrolled ${selectedlearners.length} learner(s)`);
        onSuccess();
      } else {
        toast.error(result.error?.message || "Failed to enroll learners");
      }
    } catch (error: any) {
      logger.error("Error enrolling learners:", error);
      toast.error("Failed to enroll learners");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleLearner = (learnerId: string) => {
    setSelectedlearners(prev =>
      prev.includes(learnerId)
        ? prev.filter(id => id !== learnerId)
        : [...prev, learnerId]
    );
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredlearners.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedlearners.includes(id));

    if (allSelected) {
      setSelectedlearners(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedlearners(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Filter learners by search
  const filteredlearners = availablelearners.filter(learner => {
    if (!learnerSearch) return true;
    const search = learnerSearch.toLowerCase();
    return (
      learner.name?.toLowerCase().includes(search) ||
      learner.roll_number?.toLowerCase().includes(search) ||
      learner.email?.toLowerCase().includes(search) ||
      learner.admission_number?.toLowerCase().includes(search)
    );
  });

  // Pagination for modal
  const modalTotalPages = Math.ceil(filteredlearners.length / MODAL_ITEMS_PER_PAGE);
  const paginatedModallearners = filteredlearners.slice(
    (modalCurrentPage - 1) * MODAL_ITEMS_PER_PAGE,
    modalCurrentPage * MODAL_ITEMS_PER_PAGE
  );

  // Reset modal page when search changes
  useEffect(() => {
    setModalCurrentPage(1);
  }, [learnerSearch, selectedProgram]);

  const selectedProgData = programs.find(p => p.id === selectedProgram);
  const selectedDeptData = departments.find(d => d.id === selectedDepartment);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex min-h-screen">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative mx-auto my-4 sm:my-8 w-full max-w-5xl flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserGroupIcon className="h-6 w-6" />
                    Enroll Learners to Program
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Select program details and choose learners to enroll
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

              {/* Left Panel - Program Selection */}
              <div className="lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 p-5 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Program Details
                </h3>

                <div className="space-y-4">
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedProgram("");
                        setSelectedlearners([]);
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Program */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!selectedDepartment || loading}
                    >
                      <option value="">
                        {loading ? "Loading..." : "Select Program"}
                      </option>
                      {programs.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.name} {prog.code ? `(${prog.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Semester <span className="text-red-500">*</span>
                    </label>
                    {availableSemesters.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSemesters.map((sem) => (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => setSelectedSemester(sem.toString())}
                            className={`py-2 text-sm font-medium rounded-lg border transition ${selectedSemester === sem.toString()
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                              }`}
                          >
                            {sem}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">
                        {selectedProgram ? "No semesters configured for this program" : "Select a program first"}
                      </p>
                    )}
                  </div>

                  {/* Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!selectedProgram || !selectedSemester}
                    >
                      <option value="">Select Section</option>
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.section}>
                          Section {sec.section} ({sec.current_learners || 0}/{sec.max_learners || 60})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selection Summary */}
                {selectedlearners.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="font-semibold text-sm">Ready to Enroll</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><span className="font-medium">{selectedlearners.length}</span> learner(s) selected</p>
                      {selectedDeptData && <p>Dept: {selectedDeptData.name}</p>}
                      {selectedProgData && <p>Program: {selectedProgData.name}</p>}
                      {selectedSemester && <p>Semester: {selectedSemester}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Learner Selection */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Learner List Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Unenrolled Learners
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {loadinglearners
                          ? "Loading learners..."
                          : `${filteredlearners.length} of ${availablelearners.length} learners`
                        }
                      </p>
                    </div>

                    {/* Search */}
                    <div className="flex-1 max-w-xs">
                      <SearchBar
                        value={learnerSearch}
                        onChange={setlearnerSearch}
                        onDebouncedChange={setlearnerSearch}
                        placeholder="Search by name, roll no, email..."
                        debounceMs={300}
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {/* Learner List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {!selectedProgram ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <AcademicCapIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Select a Program First</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Choose department and program to view available learners
                      </p>
                    </div>
                  ) : loadinglearners ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-gray-500">Loading learners...</p>
                      </div>
                    </div>
                  ) : filteredlearners.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UserGroupIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        {learnerSearch ? "No matching learners" : "No unenrolled learners"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {learnerSearch
                          ? "Try a different search term"
                          : "All learners are already enrolled in programs"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Select All */}
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filteredlearners.length > 0 && filteredlearners.every(s => selectedlearners.includes(s.id))}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Select All ({filteredlearners.length})
                          </span>
                        </label>
                        {selectedlearners.length > 0 && (
                          <button
                            onClick={() => setSelectedlearners([])}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>

                      {/* Learner Cards */}
                      {paginatedModallearners.map((learner) => {
                        const isSelected = selectedlearners.includes(learner.id);
                        return (
                          <label
                            key={learner.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLearner(learner.id)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />

                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                              }`}>
                              {learner.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 truncate">
                                  {learner.name || "Unknown"}
                                </span>
                                {learner.roll_number && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                    {learner.roll_number}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                {learner.email && (
                                  <span className="truncate">{learner.email}</span>
                                )}
                              </div>
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                            )}
                          </label>
                        );
                      })}

                      {/* Modal Pagination */}
                      {modalTotalPages > 1 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Pagination
                            currentPage={modalCurrentPage}
                            totalPages={modalTotalPages}
                            totalItems={filteredlearners.length}
                            itemsPerPage={MODAL_ITEMS_PER_PAGE}
                            onPageChange={setModalCurrentPage}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {selectedlearners.length > 0 ? (
                    <span className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span><strong>{selectedlearners.length}</strong> learner(s) ready to enroll</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">Select learners to enroll</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnroll}
                    disabled={selectedlearners.length === 0 || !selectedProgram || !selectedSemester || !selectedSection || enrolling}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {enrolling ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Enroll {selectedlearners.length > 0 ? `(${selectedlearners.length})` : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrolledLearners;
