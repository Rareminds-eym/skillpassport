/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  PlusCircleIcon,
  XMarkIcon,
  PencilIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface ProgramSection {
  id: string;
  department_id: string;
  department_name: string;
  program_id: string;
  program_name: string;
  semester: number;
  section: string;
  max_students: number;
  current_students: number;
  faculty_id?: string;
  faculty_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  department_id: string;
  duration_semesters: number;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
}

const ProgramSectionManagement: React.FC = () => {
  const [sections, setSections] = useState<ProgramSection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ProgramSection | null>(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('status', 'active');

      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // Load programs
      const { data: progData, error: progError } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active');

      if (progError) throw progError;
      setPrograms(progData || []);

      // Load faculty from college_lecturers
      const { data: facultyData, error: facultyError } = await supabase
        .from('college_lecturers')
        .select(
          `
          id,
          user_id,
          users!fk_college_lecturers_user (
            firstName,
            lastName,
            email
          )
        `
        )
        .eq('accountStatus', 'active');

      if (facultyError) {
        console.error('Error loading faculty:', facultyError);
        // Continue without faculty data
        setFaculty([]);
      } else {
        // Transform the data to match Faculty interface
        const transformedFaculty = (facultyData || []).map((f: any) => ({
          id: f.user_id,
          name: f.users
            ? `${f.users.firstName || ''} ${f.users.lastName || ''}`.trim() || f.users.email
            : 'Unknown',
          email: f.users?.email || '',
        }));
        setFaculty(transformedFaculty);
      }

      // Load sections from program_sections_view
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('program_sections_view')
        .select('*')
        .order('department_name', { ascending: true })
        .order('program_name', { ascending: true })
        .order('semester', { ascending: true })
        .order('section', { ascending: true });

      if (sectionsError) {
        console.error('Error loading sections:', sectionsError);
        // If view doesn't exist yet, show empty state
        setSections([]);
      } else {
        const formattedSections: ProgramSection[] = (sectionsData || []).map((s: any) => ({
          id: s.id,
          department_id: s.department_id,
          department_name: s.department_name,
          program_id: s.program_id,
          program_name: s.program_name,
          semester: s.semester,
          section: s.section,
          max_students: s.max_students,
          current_students: s.current_students,
          faculty_id: s.faculty_id,
          faculty_name: s.faculty_name,
          status: s.status,
          created_at: s.created_at,
        }));
        setSections(formattedSections);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = () => {
    setSelectedSection(null);
    setIsModalOpen(true);
  };

  const handleEditSection = (section: ProgramSection) => {
    setSelectedSection(section);
    setIsModalOpen(true);
  };

  const handleSaveSection = async (data: Partial<ProgramSection>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (selectedSection) {
        // Update existing section
        const { error } = await supabase
          .from('program_sections')
          .update({
            department_id: data.department_id,
            program_id: data.program_id,
            semester: data.semester,
            section: data.section,
            max_students: data.max_students,
            faculty_id: data.faculty_id || null,
            status: data.status,
            updated_by: user?.id,
          })
          .eq('id', selectedSection.id);

        if (error) throw error;
        toast.success('Section updated successfully');
      } else {
        // Create new section
        const currentYear = new Date().getFullYear();
        const nextYear = (currentYear + 1).toString().slice(-2);
        const academicYear = `${currentYear}-${nextYear}`;

        const { error } = await supabase.from('program_sections').insert({
          department_id: data.department_id,
          program_id: data.program_id,
          semester: data.semester,
          section: data.section,
          max_students: data.max_students,
          faculty_id: data.faculty_id || null,
          academic_year: academicYear,
          status: data.status || 'active',
          current_students: 0,
          created_by: user?.id,
        });

        if (error) throw error;
        toast.success('Section created successfully');
      }

      setIsModalOpen(false);
      loadData(); // Reload data to show changes
    } catch (error: any) {
      console.error('Error saving section:', error);
      toast.error(`Failed to save section: ${error.message}`);
    }
  };

  const filteredSections = sections.filter((section) => {
    if (departmentFilter && section.department_id !== departmentFilter) return false;
    if (programFilter && section.program_id !== programFilter) return false;
    if (semesterFilter && section.semester.toString() !== semesterFilter) return false;
    if (statusFilter && section.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        section.section.toLowerCase().includes(search) ||
        section.program_name.toLowerCase().includes(search) ||
        section.department_name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Inactive
      </span>
    );
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Calculate stats
  const totalSections = filteredSections.length;
  const activeSections = filteredSections.filter((s) => s.status === 'active').length;
  const totalCapacity = filteredSections.reduce((sum, s) => sum + s.max_students, 0);
  const totalStudents = filteredSections.reduce((sum, s) => sum + s.current_students, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Program & Section Management
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage department programs, semesters, sections, and capacity
            </p>
          </div>
          <button
            onClick={handleCreateSection}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Section
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Sections
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalSections}</p>
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
                Active Sections
              </p>
              <p className="text-2xl font-bold text-gray-900">{activeSections}</p>
            </div>
            <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Capacity
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
            <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
              <UserGroupIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Enrolled Students
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="p-3 rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-200">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sections..."
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
          >
            <option value="">All Programs</option>
            {programs
              .filter((p) => !departmentFilter || p.department_id === departmentFilter)
              .map((prog) => (
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Sections ({filteredSections.length})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No sections found</p>
            <button
              onClick={handleCreateSection}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first section
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                    Faculty
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Capacity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{section.department_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{section.program_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Semester {section.semester}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                        Section {section.section}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {section.faculty_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${getCapacityColor(
                          section.current_students,
                          section.max_students
                        )}`}
                      >
                        {section.current_students} / {section.max_students}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(section.status)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditSection(section)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit section"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section Form Modal */}
      {isModalOpen && (
        <SectionFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSection}
          section={selectedSection}
          departments={departments}
          programs={programs}
          faculty={faculty}
        />
      )}
    </div>
  );
};

// Section Form Modal Component
const SectionFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProgramSection>) => void;
  section: ProgramSection | null;
  departments: Department[];
  programs: Program[];
  faculty: Faculty[];
}> = ({ isOpen, onClose, onSave, section, departments, programs, faculty }) => {
  const [formData, setFormData] = useState({
    department_id: section?.department_id || '',
    program_id: section?.program_id || '',
    semester: section?.semester || 1,
    section: section?.section || '',
    max_students: section?.max_students || 60,
    faculty_id: section?.faculty_id || '',
    status: section?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dept = departments.find((d) => d.id === formData.department_id);
    const prog = programs.find((p) => p.id === formData.program_id);
    const fac = faculty.find((f) => f.id === formData.faculty_id);

    onSave({
      ...formData,
      department_name: dept?.name || '',
      program_name: prog?.name || '',
      faculty_name: fac?.name,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {section ? 'Edit Section' : 'Create New Section'}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData({ ...formData, department_id: e.target.value, program_id: '' })
                  }
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.department_id}
                >
                  <option value="">Select Program</option>
                  {programs
                    .filter((p) => p.department_id === formData.department_id)
                    .map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value.toUpperCase() })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="A, B, C..."
                  required
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Students *
                </label>
                <input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) =>
                    setFormData({ ...formData, max_students: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Teacher (Optional)
                </label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {faculty.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {section ? 'Update Section' : 'Create Section'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProgramSectionManagement;
