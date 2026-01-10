/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  UserGroupIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../../lib/supabaseClient";
import { studentEnrollmentService, type EnrolledStudentView } from "../../../services/studentEnrollmentService";
import toast from "react-hot-toast";

const EnrolledStudents: React.FC = () => {
  const [students, setStudents] = useState<EnrolledStudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filters
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (departmentFilter) {
      loadPrograms(departmentFilter);
    } else {
      setPrograms([]);
      setProgramFilter("");
    }
  }, [departmentFilter]);

  useEffect(() => {
    if (programFilter) {
      loadSections(programFilter);
    } else {
      setSections([]);
      setSectionFilter("");
    }
  }, [programFilter]);

  useEffect(() => {
    loadStudents();
  }, [departmentFilter, programFilter, sectionFilter, semesterFilter, statusFilter, academicYearFilter, searchTerm]);

  const loadData = async () => {
    await Promise.all([
      loadDepartments(),
      loadStudents(),
    ]);
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error loading departments:", error);
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
      console.error("Error loading programs:", error);
    }
  };

  const loadSections = async (programId: string) => {
    try {
      const { data, error} = await supabase
        .from("program_sections")
        .select("*")
        .eq("program_id", programId)
        .eq("status", "active")
        .order("semester")
        .order("section");

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);

      const result = await studentEnrollmentService.getEnrolledStudents({
        department_id: departmentFilter || undefined,
        program_id: programFilter || undefined,
        section_id: sectionFilter || undefined,
        semester: semesterFilter ? parseInt(semesterFilter) : undefined,
        enrollment_status: statusFilter || undefined,
        academic_year: academicYearFilter || undefined,
        search: searchTerm || undefined,
      });

      if (result.success && result.data) {
        setStudents(result.data);
        
        // Calculate stats
        const total = result.data.length;
        const active = result.data.filter(s => s.enrollment_status === 'active').length;
        const inactive = result.data.filter(s => s.enrollment_status === 'inactive').length;
        const graduated = result.data.filter(s => s.enrollment_status === 'graduated').length;
        
        setStats({ total, active, inactive, graduated });
      } else {
        toast.error(result.error?.message || "Failed to load students");
      }
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error("Failed to load enrolled students");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      graduated: "bg-blue-100 text-blue-700",
      transferred: "bg-yellow-100 text-yellow-700",
      withdrawn: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const clearFilters = () => {
    setDepartmentFilter("");
    setProgramFilter("");
    setSectionFilter("");
    setSemesterFilter("");
    setStatusFilter("");
    setAcademicYearFilter("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Enrolled Students
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              View and manage student enrollments by department, program, and section
            </p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserGroupIcon className="h-5 w-5" />
            Enroll Students
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
          {(departmentFilter || programFilter || sectionFilter || semesterFilter || statusFilter || academicYearFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={!programFilter}
          >
            <option value="">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                Semester {sec.semester} - Section {sec.section}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <input
            type="text"
            placeholder="Academic Year (e.g., 2025-26)"
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Students ({students.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No enrolled students found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Roll Number
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Section
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Academic Year
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.enrollment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.student_name}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {student.roll_number || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.department_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.program_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Semester {student.semester}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.section ? `Section ${student.section}` : "Not Assigned"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.academic_year}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(student.enrollment_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Students Modal */}
      {showEnrollModal && (
        <EnrollStudentsModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            setShowEnrollModal(false);
            loadStudents();
          }}
          departments={departments}
        />
      )}
    </div>
  );
};

// Enroll Students Modal Component
const EnrollStudentsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: any[];
}> = ({ isOpen, onClose, onSuccess, departments }) => {
  const [step, setStep] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadSections();
    }
  }, [selectedProgram, selectedSemester]);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("department_id", selectedDepartment)
        .eq("status", "active");

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from("program_sections")
        .select("*")
        .eq("program_id", selectedProgram)
        .eq("semester", parseInt(selectedSemester))
        .eq("status", "active");

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      setLoading(true);
      
      // First, get students already enrolled in this program for this academic year
      const { data: enrolledStudentIds, error: enrolledError } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("program_id", selectedProgram)
        .eq("academic_year", academicYear);

      if (enrolledError) throw enrolledError;

      const enrolledIds = enrolledStudentIds?.map(e => e.student_id) || [];

      // Then get all students not in that list
      let query = supabase
        .from("students")
        .select("id, name, roll_number, email")
        .eq("is_deleted", false);

      // If there are enrolled students, exclude them
      if (enrolledIds.length > 0) {
        query = query.not("id", "in", `(${enrolledIds.join(",")})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableStudents(data || []);
      setStep(2);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      setEnrolling(true);

      const enrollments = selectedStudents.map(studentId => ({
        student_id: studentId,
        program_id: selectedProgram,
        section_id: selectedSection || undefined,
        semester: parseInt(selectedSemester),
        academic_year: academicYear,
      }));

      const result = await studentEnrollmentService.bulkEnrollStudents(enrollments);

      if (result.success) {
        toast.success(`Successfully enrolled ${selectedStudents.length} student(s)`);
        onSuccess();
      } else {
        toast.error(result.error?.message || "Failed to enroll students");
      }
    } catch (error: any) {
      console.error("Error enrolling students:", error);
      toast.error("Failed to enroll students");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const selectAll = () => {
    if (selectedStudents.length === availableStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(availableStudents.map(s => s.id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Enroll Students to Program
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {step} of 2: {step === 1 ? "Select Program & Section" : "Select Students"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedProgram("");
                      setPrograms([]);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program *
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!selectedDepartment}
                  >
                    <option value="">Select Program</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section (Optional)
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedProgram || !selectedSemester}
                  >
                    <option value="">No Section</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.section} ({sec.current_students}/{sec.max_students} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g., 2025-26"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={loadAvailableStudents}
                    disabled={!selectedDepartment || !selectedProgram || !selectedSemester || !academicYear || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Next: Select Students"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {availableStudents.length} students available • {selectedStudents.length} selected
                  </p>
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedStudents.length === availableStudents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No students available for enrollment
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {availableStudents.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">
                              {student.roll_number} • {student.email}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnroll}
                      disabled={selectedStudents.length === 0 || enrolling}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {enrolling ? "Enrolling..." : `Enroll ${selectedStudents.length} Student(s)`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrolledStudents;
