import React from 'react';
import { BookOpen, GraduationCap, Calendar, Users } from 'lucide-react';
import { CollegeClassInfo } from '../../../services/collegeClassService';

interface CollegeClassHeaderProps {
  classInfo: CollegeClassInfo;
}

const CollegeClassHeader: React.FC<CollegeClassHeaderProps> = ({ classInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Header Background */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex p-2 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {classInfo.program_code} - Semester {classInfo.semester}
                {classInfo.section && <span className="text-base"> ({classInfo.section})</span>}
              </h1>
              <p className="text-blue-100 text-sm mt-1 leading-tight">
                {classInfo.program_name}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-white/80 text-xs mb-1">Academic Year</div>
            <div className="text-white text-sm font-semibold">
              {classInfo.academic_year || 'Current'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Program</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {classInfo.program_code}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Semester</p>
            <p className="text-sm font-semibold text-gray-900">
              {classInfo.semester}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Department</p>
            <p className="text-sm font-semibold text-gray-900 truncate" title={classInfo.department_name}>
              {classInfo.department_name.split(' ').slice(-1)[0]}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Students</p>
            <p className="text-sm font-semibold text-gray-900">
              {classInfo.current_students}
              {classInfo.max_students && classInfo.max_students > 0 && `/${classInfo.max_students}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeClassHeader;