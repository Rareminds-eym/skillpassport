import React, { useState } from 'react';
import { XMarkIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import SearchBar from '../../common/SearchBar';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
  lastInteraction?: string;
  interventionCount?: number;
}

interface StudentSelectionModalProps {
  availableStudents: Student[];
  onClose: () => void;
  onNext: (studentIds: number[]) => void;
  title?: string;
  description?: string;
  buttonText?: string;
  initialSelectedStudents?: number[];
}

const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
  availableStudents,
  onClose,
  onNext,
  title,
  description,
  buttonText,
  initialSelectedStudents = [],
}) => {
  const modalTitle = title || "Select Students for Mentor Allocation";
  const modalDescription = description || "Choose students who need mentor assignment";
  const modalButtonText = buttonText || "Next: Select Mentor →";
  const [selectedStudents, setSelectedStudents] = useState<number[]>(initialSelectedStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAtRisk, setFilterAtRisk] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Get unique departments for filtering
  const departments = Array.from(new Set(availableStudents.map(s => s.department)));
  
  // Get unique years from batch (extract starting year from batch like "2021-2025")
  const years = Array.from(new Set(availableStudents.map(s => {
    const batchYear = s.batch.split('-')[0];
    return batchYear;
  }))).sort();

  const filteredStudents = availableStudents.filter(
    (s: Student) =>
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterAtRisk === "all" || 
       (filterAtRisk === "at-risk" && s.atRisk) ||
       (filterAtRisk === "not-at-risk" && !s.atRisk)) &&
      (filterDepartment === "all" || s.department === filterDepartment) &&
      (filterYear === "all" || s.batch.startsWith(filterYear))
  );

  const handleToggle = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s: Student) => s.id));
    }
  };

  const handleNext = () => {
    if (selectedStudents.length > 0) {
      onNext(selectedStudents);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {modalTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {modalDescription}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search students by name or roll number..."
              size="md"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>Batch {year}</option>
            ))}
          </select>
          <select
            value={filterAtRisk}
            onChange={(e) => setFilterAtRisk(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Students</option>
            <option value="at-risk">At-Risk Only</option>
            <option value="not-at-risk">Not At-Risk</option>
          </select>
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Selection Summary */}
        {selectedStudents.length > 0 && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-700">
                {selectedStudents.length} student(s) selected for mentor allocation
              </span>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No unallocated students found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredStudents.map((student: Student) => (
              <label
                key={student.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedStudents.includes(student.id) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleToggle(student.id)}
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{student.name}</p>
                      {student.atRisk && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          At Risk
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {student.rollNo} • {student.department} • Semester {student.semester} • CGPA: {student.cgpa}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {student.batch} • {student.email}
                    </p>
                    {student.riskFactors && student.riskFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.riskFactors.map((factor, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {student.interventionCount !== undefined && (
                    <p>{student.interventionCount} interventions</p>
                  )}
                  {student.lastInteraction && (
                    <p>Last: {new Date(student.lastInteraction).toLocaleDateString()}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {filteredStudents.length > 0 && (
              <span>
                Showing {filteredStudents.length} of {availableStudents.length} unallocated students
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={selectedStudents.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {modalButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSelectionModal;