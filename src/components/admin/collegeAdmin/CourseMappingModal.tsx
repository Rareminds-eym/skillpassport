import React, { useEffect, useState } from 'react';
import { XMarkIcon, BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { DepartmentWithStats } from '../../../services/college/departmentService';

interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: number;
}

interface Department extends DepartmentWithStats {
  courses?: Course[];
}

interface CourseMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  allCourses: Course[];
  onSave: () => void;
}

const CourseMappingModal: React.FC<CourseMappingModalProps> = ({
  isOpen,
  onClose,
  department,
  allCourses,
  onSave,
}) => {
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (department) {
      // Always sync selected courses from department
      setSelectedCourses(department.courses?.map((c) => c.id) || []);
    }
  }, [department, isOpen]);

  if (!isOpen || !department) return null;

  const filteredCourses = allCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCourse = (courseId: number) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
              Map Courses — {department.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Select or remove courses for this department.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses..."
          className="w-full mb-4 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-md">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No courses found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCourses.map((course) => {
                const checked = selectedCourses.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                      checked ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCourse(course.id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {course.code} — {course.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {course.credits} Credits • Semester {course.semester}
                        </p>
                      </div>
                    </div>
                    {checked && <CheckCircleIcon className="h-5 w-5 text-indigo-600" />}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedCourses.length} course
            {selectedCourses.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              Save Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseMappingModal;
