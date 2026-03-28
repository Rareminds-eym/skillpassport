import React from 'react';
import { Users } from 'lucide-react';

export interface Classmate {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  // Optional additional fields for college students
  roll_number?: string;
  admission_number?: string;
  semester?: number;
}

interface ClassmatesTabProps {
  classmates: Classmate[];
  loading?: boolean;
}

const ClassmatesTab: React.FC<ClassmatesTabProps> = ({ 
  classmates, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{classmates.length} classmates</p>
      </div>
      {classmates.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classmates Yet</h3>
          <p className="text-gray-500">You're the first one in this class!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classmates.map(classmate => (
            <div key={classmate.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                {classmate.profilePicture ? (
                  <img src={classmate.profilePicture} alt={classmate.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-blue-600 font-medium text-sm">
                    {classmate.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{classmate.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{classmate.email}</p>
                {/* Show additional college info if available */}
                {(classmate.roll_number || classmate.admission_number) && (
                  <p className="text-xs text-gray-400 truncate mt-1">
                    {classmate.roll_number && `Roll: ${classmate.roll_number}`}
                    {classmate.admission_number && ` • Adm: ${classmate.admission_number}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassmatesTab;