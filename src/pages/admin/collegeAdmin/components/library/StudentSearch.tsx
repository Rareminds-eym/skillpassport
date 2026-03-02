import { UsersIcon } from "@heroicons/react/24/outline";
import React, { RefObject } from 'react';

interface StudentSearchProps {
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  showStudentDropdown: boolean;
  studentSearchResults: any[];
  searchLoading: boolean;
  selectStudent: (student: any) => void;
  studentSearchRef: RefObject<HTMLDivElement>;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({
  studentSearch,
  setStudentSearch,
  showStudentDropdown,
  studentSearchResults,
  searchLoading,
  selectStudent,
  studentSearchRef,
}) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="flex items-center gap-3 font-bold text-blue-900 mb-3">
        <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center">
          <UsersIcon className="w-6 h-6 text-blue-600" />
        </div>
        Select Student
      </h3>
      <div className="relative" ref={studentSearchRef}>
        <label className="block mb-2 font-medium text-gray-700">Search Student</label>
        <div className="relative">
          <input 
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type student name, roll number, enrollment number, or email..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            onFocus={() => {
              if (studentSearchResults.length > 0 && studentSearch.length >= 2) {
                // Show dropdown on focus if there are results
              }
            }}
          />
          {/* Search Icon or Loading Spinner */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {searchLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Student Search Dropdown */}
        {showStudentDropdown && studentSearchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {studentSearchResults.map((student) => (
              <div
                key={student.id}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => selectStudent(student)}
              >
                <div className="font-semibold text-gray-800">{student.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {student.roll_number && `Roll: ${student.roll_number}`}
                  {student.enrollmentNumber && ` | Enrollment: ${student.enrollmentNumber}`}
                  {student.admission_number && ` | Admission: ${student.admission_number}`}
                </div>
                <div className="text-sm text-gray-600">
                  {student.grade && `Grade: ${student.grade}`}
                  {student.section && ` Section: ${student.section}`}
                  {student.course_name && ` | Course: ${student.course_name}`}
                  {student.semester && ` | Semester: ${student.semester}`}
                </div>
                {student.email && (
                  <div className="text-xs text-gray-500 mt-1">{student.email}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Loading State */}
        {searchLoading && studentSearch.length >= 2 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Searching students...
            </div>
          </div>
        )}
        
        {/* No Results Message */}
        {!searchLoading && studentSearch.length >= 2 && studentSearchResults.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500 text-center">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
};
