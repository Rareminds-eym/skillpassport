import React from 'react';
import {
  FileText,
  Star
} from 'lucide-react';
import AssignmentCard, { Assignment } from '../common/AssignmentCard';
import Pagination from '../../educator/Pagination';

interface AssignmentsTabProps {
  assignments: Assignment[];
  paginatedAssignments: Assignment[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  loading?: boolean;
  onStatusChange?: (assignmentId: string, studentAssignmentId: string, newStatus: string) => void;
  onUploadClick?: (assignment: Assignment) => void;
  onViewDetails?: (assignment: Assignment) => void;
  onPageChange: (page: number) => void;
  // For college students, these might be disabled
  isReadOnly?: boolean;
}

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  assignments,
  paginatedAssignments,
  currentPage,
  totalPages,
  itemsPerPage,
  loading = false,
  onStatusChange,
  onUploadClick,
  onViewDetails,
  onPageChange,
  isReadOnly = false
}) => {
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 sm:w-20"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-12 sm:h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-8 sm:h-10 bg-gray-200 rounded w-full sm:w-32"></div>
              <div className="h-8 sm:h-10 bg-gray-200 rounded w-full sm:w-40"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Star className="w-4 h-4 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Assignments Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          {isReadOnly 
            ? "Assignment management will be available soon for college students!"
            : "Your assignments will appear here when your teachers create them. Check back soon for new learning opportunities!"
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:gap-6 mb-6">
        {paginatedAssignments.map(assignment => (
          <div key={assignment.assignment_id}>
            {isReadOnly ? (
              // Read-only version for college students
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">{assignment.course_name}</p>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Points</p>
                    <p className="text-sm font-semibold text-gray-900">{assignment.total_points}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {assignment.assignment_type?.replace('_', ' ') || 'Assignment'}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-blue-700 text-sm font-medium">
                    Assignment management coming soon for college students!
                  </p>
                </div>
              </div>
            ) : (
              // Full interactive version for school students
              <AssignmentCard
                assignment={assignment}
                onStatusChange={onStatusChange!}
                onUploadClick={onUploadClick!}
                onViewDetails={onViewDetails!}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={assignments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default AssignmentsTab;