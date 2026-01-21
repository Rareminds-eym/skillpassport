import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  UserMinusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Student {
  id?: string;
  roll_number?: string;
  name?: string;
  email: string;
  contactNumber?: string;
  contact_number?: string;
  semester?: number;
  section?: string;
  course_name?: string;
  branch_field?: string;
  department_id?: string | null;
  college_id?: string | null;
  progress?: number;
  is_deleted?: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  onSave: (deptId: string, students: Student[]) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  department,
  onSave,
}) => {
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for student assignment details
  const [assignmentDetails, setAssignmentDetails] = useState({
    semester: 1,
    section: '',
    course_name: '',
  });

  useEffect(() => {
    if (isOpen && department) {
      console.log('AddStudentModal opened with department:', department);
      // @ts-expect-error - Auto-suppressed for migration
      console.log('Department college_id:', department.college_id);
      fetchStudents();
    }
  }, [isOpen, department]);

  const fetchStudents = async () => {
    if (!department) return;

    setLoading(true);
    setError(null);

    try {
      console.log(
        'Fetching students for department:',
        department.id,
        'college:',
        // @ts-expect-error - Auto-suppressed for migration
        department.college_id
      );

      // Check if department has college_id
      // @ts-expect-error - Auto-suppressed for migration
      if (!department.college_id) {
        console.warn('Department missing college_id, trying to fetch from departments table');

        // Fetch department details to get college_id
        const { data: deptData, error: deptFetchError } = await supabase
          .from('departments')
          .select('college_id')
          .eq('id', department.id)
          .single();

        if (deptFetchError || !deptData?.college_id) {
          throw new Error('Department is not associated with a college');
        }

        // Update the department object with college_id
        // @ts-expect-error - Auto-suppressed for migration
        department.college_id = deptData.college_id;
        console.log('Retrieved college_id from database:', deptData.college_id);
      }

      // Fetch current department students
      const { data: deptStudents, error: deptError } = await supabase
        .from('students')
        .select(
          'id, name, email, department_id, college_id, roll_number, course_name, branch_field, contactNumber, semester, section'
        )
        .eq('department_id', department.id);

      if (deptError) {
        console.error('Error fetching department students:', deptError);
        throw deptError;
      }

      console.log('Department students found:', deptStudents?.length || 0);

      // Fetch available students (not assigned to any department but belong to the same college)
      const { data: availStudents, error: availError } = await supabase
        .from('students')
        .select(
          'id, name, email, department_id, college_id, roll_number, course_name, branch_field, contactNumber, semester, section'
        )
        .is('department_id', null)
        // @ts-expect-error - Auto-suppressed for migration
        .eq('college_id', department.college_id);

      if (availError) {
        console.error('Error fetching available students:', availError);
        throw availError;
      }

      console.log('Available students found:', availStudents?.length || 0);

      setCurrentStudents(deptStudents || []);
      setAvailableStudents(availStudents || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setError(`Failed to load students: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to load students: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !department) return null;

  const filteredAvailable = availableStudents.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.branch_field?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddStudents = async () => {
    if (loading) return;
    if (!selectedStudents.length) {
      toast.error('Choose at least one student to add');
      return;
    }

    // Validate assignment details
    if (!assignmentDetails.section.trim()) {
      toast.error('Please specify the section');
      return;
    }

    if (!assignmentDetails.course_name.trim()) {
      toast.error('Please specify the course name');
      return;
    }

    setLoading(true);
    try {
      console.log('Adding students to department:', department.id, 'students:', selectedStudents);
      console.log('Assignment details:', assignmentDetails);

      const { error } = await supabase
        .from('students')
        .update({
          department_id: department.id,
          semester: assignmentDetails.semester,
          section: assignmentDetails.section.trim(),
          course_name: assignmentDetails.course_name.trim(),
        })
        .in('id', selectedStudents);

      if (error) {
        console.error('Error adding students:', error);
        throw error;
      }

      const addedCount = selectedStudents.length;
      const studentNames = availableStudents.filter((s) => selectedStudents.includes(s.id!));

      toast.success(
        addedCount === 1
          ? `${studentNames[0]?.name || 'Student'} added to ${department.name}`
          : `${addedCount} students added to ${department.name}`
      );

      setSelectedStudents([]);
      // Reset assignment details
      setAssignmentDetails({
        semester: 1,
        section: '',
        course_name: '',
      });
      fetchStudents(); // Refresh the lists
    } catch (error: any) {
      console.error('Error in handleAddStudents:', error);
      toast.error(`Failed to add students: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (loading) return;

    setLoading(true);
    try {
      console.log('Removing student from department:', studentId, studentName);

      const { error } = await supabase
        .from('students')
        .update({ department_id: null })
        .eq('id', studentId);

      if (error) {
        console.error('Error removing student:', error);
        throw error;
      }

      toast.success(`${studentName} removed from ${department.name}`);
      fetchStudents(); // Refresh the lists
    } catch (error: any) {
      console.error('Error in handleRemoveStudent:', error);
      toast.error(`Failed to remove student: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const studentCount = currentStudents.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} />
        <div className="inline-block w-full max-w-6xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:my-8 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserPlusIcon className="h-6 w-6 text-indigo-600" />
                  Manage Department Students
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                  {studentCount}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Assign students to {department.name} ({department.code}) with semester and course
                details
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
              <XMarkIcon className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Students - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Current Students</h3>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {loading ? (
                  <div className="py-10 px-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading students...</p>
                  </div>
                ) : studentCount === 0 ? (
                  <div className="py-10 px-6 text-center text-sm text-gray-500">
                    No students assigned yet. Add students to start building your department.
                  </div>
                ) : (
                  currentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {student.name || 'Unknown Student'}
                          </p>
                          {student.roll_number && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {student.roll_number}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                        <div className="mt-2 flex items-center gap-4">
                          {student.semester && (
                            <div>
                              <p className="text-xs text-gray-500">Semester</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.semester}
                              </p>
                            </div>
                          )}
                          {student.section && (
                            <div>
                              <p className="text-xs text-gray-500">Section</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.section}
                              </p>
                            </div>
                          )}
                          {student.course_name && (
                            <div>
                              <p className="text-xs text-gray-500">Course</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.course_name}
                              </p>
                            </div>
                          )}
                          {student.branch_field && (
                            <div>
                              <p className="text-xs text-gray-500">Branch</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.branch_field}
                              </p>
                            </div>
                          )}
                          {(student.contactNumber || student.contact_number) && (
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.contactNumber || student.contact_number}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Progress</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {student.progress || 0}%
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveStudent(student.id!, student.name || 'Student')
                          }
                          disabled={loading}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                        >
                          <UserMinusIcon className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Students - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Add Students to Department</h3>

                <div className="mt-4 space-y-4">
                  {/* Assignment Details Form */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-indigo-900 mb-3">Assignment Details</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Semester *
                        </label>
                        <select
                          value={assignmentDetails.semester}
                          onChange={(e) =>
                            setAssignmentDetails((prev) => ({
                              ...prev,
                              semester: parseInt(e.target.value),
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <option key={sem} value={sem}>
                              Semester {sem}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Section *
                        </label>
                        <input
                          type="text"
                          value={assignmentDetails.section}
                          onChange={(e) =>
                            setAssignmentDetails((prev) => ({ ...prev, section: e.target.value }))
                          }
                          placeholder="e.g., A, B, C"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Course Name *
                        </label>
                        <input
                          type="text"
                          value={assignmentDetails.course_name}
                          onChange={(e) =>
                            setAssignmentDetails((prev) => ({
                              ...prev,
                              course_name: e.target.value,
                            }))
                          }
                          placeholder="e.g., Bachelor of Computer Applications"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Choose Students
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        placeholder="Search by name, email, roll number, or course"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
                      {availableStudents.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No unassigned students available
                        </div>
                      ) : filteredAvailable.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No students match your search
                        </div>
                      ) : (
                        filteredAvailable.map((student) => (
                          <label
                            key={student.id}
                            className="flex items-start gap-3 border-b border-gray-100 px-3 py-2 last:border-none hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id!)}
                              onChange={() => toggleStudentSelection(student.id!)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {student.name || 'Unknown Student'}
                                </p>
                                {student.roll_number && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                    {student.roll_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{student.email}</p>
                              {(student.semester ||
                                student.section ||
                                student.course_name ||
                                student.branch_field) && (
                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                  {student.semester && <span>Sem {student.semester}</span>}
                                  {student.semester && student.section && <span>•</span>}
                                  {student.section && <span>Sec {student.section}</span>}
                                  {(student.semester || student.section) &&
                                    (student.course_name || student.branch_field) && <span>•</span>}
                                  {student.course_name && <span>{student.course_name}</span>}
                                  {student.course_name && student.branch_field && <span>•</span>}
                                  {student.branch_field && <span>{student.branch_field}</span>}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedStudents.length > 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'}{' '}
                        selected
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddStudents}
                  disabled={
                    loading ||
                    selectedStudents.length === 0 ||
                    !assignmentDetails.section.trim() ||
                    !assignmentDetails.course_name.trim()
                  }
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  type="button"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  {loading
                    ? 'Adding...'
                    : `Add ${selectedStudents.length || ''} Student${selectedStudents.length !== 1 ? 's' : ''} to Sem ${assignmentDetails.semester}`}
                </button>

                {selectedStudents.length > 0 &&
                  (!assignmentDetails.section.trim() || !assignmentDetails.course_name.trim()) && (
                    <p className="mt-2 text-xs text-red-600">
                      Please fill in all assignment details above
                    </p>
                  )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
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
  );
};

export default AddStudentModal;
