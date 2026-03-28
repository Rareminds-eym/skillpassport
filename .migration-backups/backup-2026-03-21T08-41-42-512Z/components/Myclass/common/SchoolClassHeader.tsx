import React from 'react';
import { BookOpen, GraduationCap, Calendar, Users, Mail } from 'lucide-react';

export interface SchoolClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  max_students: number;
  current_students: number;
  school_id: string;
  school_name?: string;
  educator_name?: string;
  educator_email?: string;
}

interface SchoolClassHeaderProps {
  classInfo: SchoolClassInfo;
}

const SchoolClassHeader: React.FC<SchoolClassHeaderProps> = ({ classInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{classInfo.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Grade {classInfo.grade} - Section {classInfo.section}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{classInfo.academic_year}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>{classInfo.current_students} students</span>
            </span>
          </div>
        </div>
        {classInfo.educator_name && (
          <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0 lg:max-w-xs">
            <p className="text-xs text-gray-500 mb-1">Class Teacher</p>
            <p className="font-medium text-gray-900 text-sm truncate">{classInfo.educator_name}</p>
            {classInfo.educator_email && (
              <a 
                href={`mailto:${classInfo.educator_email}`} 
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 truncate"
              >
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{classInfo.educator_email}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolClassHeader;