import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { Plus, Edit, Trash2, Search, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  course_type: string;
  semester: number;
  credits: number;
  contact_hours: number;
  department_id?: string;
  program_id?: string;
  is_active: boolean;
}

const CourseManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchUserCollege = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('metadata')
          .eq('id', user.id)
          .single();

        if (userData?.metadata?.college_id) {
          setCollegeId(userData.metadata.college_id);
        }
      }
    };
    fetchUserCollege();
  }, []);

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['curriculum_courses', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('curriculum_courses')
        .select('*')
        .eq('college_id', collegeId)
        .order('semester', { ascending: true })
        .order('course_code', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('college_id', collegeId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Fetch programs
  const { data: programs = [] } = useQuery({
    queryKey: ['programs', collegeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, department_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!collegeId,
  });

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = !semesterFilter || course.semester === parseInt(semesterFilter);
    const matchesType = !typeFilter || course.course_type === typeFilter;
    return matchesSearch && matchesSemester && matchesType;
  });

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Course Management</h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage curriculum courses for assessments and examinations
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
              <option value="Lab">Lab</option>
              <option value="Project">Project</option>
              <option value="Elective">Elective</option>
              <option value="Core">Core</option>
            </select>

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No courses found</p>
            <button onClick={handleAdd} className="text-blue-600 hover:text-blue-700 font-medium">
              Add your first course
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Course Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {course.course_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{course.course_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.course_type === 'Theory'
                            ? 'bg-blue-100 text-blue-700'
                            : course.course_type === 'Lab'
                              ? 'bg-green-100 text-green-700'
                              : course.course_type === 'Practical'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {course.course_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">Sem {course.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.credits}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{course.contact_hours}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit course"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {isModalOpen && (
        <CourseFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
          course={editingCourse}
          collegeId={collegeId}
          departments={departments}
          programs={programs}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['curriculum_courses'] });
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
};

// Course Form Modal Component
interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  collegeId: string | null;
  departments: Array<{ id: string; name: string }>;
  programs: Array<{ id: string; name: string; department_id: string }>;
  onSuccess: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  course,
  collegeId,
  departments,
  programs,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    course_code: course?.course_code || '',
    course_name: course?.course_name || '',
    course_type: course?.course_type || 'Theory',
    semester: course?.semester || 1,
    credits: course?.credits || 0,
    contact_hours: course?.contact_hours || 0,
    department_id: course?.department_id || '',
    program_id: course?.program_id || '',
    is_active: course?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const courseData = {
        ...formData,
        college_id: collegeId,
        created_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (course) {
        // Update existing course
        const { error: updateError } = await supabase
          .from('curriculum_courses')
          .update(courseData)
          .eq('id', course.id);

        if (updateError) throw updateError;
      } else {
        // Create new course
        const { error: insertError } = await supabase
          .from('curriculum_courses')
          .insert([courseData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {course ? 'Edit Course' : 'Add New Course'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CS101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.course_type}
                onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Theory">Theory</option>
                <option value="Practical">Practical</option>
                <option value="Lab">Lab</option>
                <option value="Project">Project</option>
                <option value="Elective">Elective</option>
                <option value="Core">Core</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Introduction to Programming"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Hours</label>
              <input
                type="number"
                min="0"
                value={formData.contact_hours}
                onChange={(e) =>
                  setFormData({ ...formData, contact_hours: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                Program (Optional)
              </label>
              <select
                value={formData.program_id}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Program</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active (visible in assessment creation)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : course ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseManagement;
