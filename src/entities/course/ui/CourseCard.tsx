/**
 * Course Entity - CourseCard Component
 * Displays course information in a card format
 */

import React from 'react';
import type { Course } from '../model/types';
import { getCourseDisplayTitle, getCourseDuration, getCourseStats } from '../model/utils';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
  className?: string;
  showStats?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onClick,
  className = '',
  showStats = true,
}) => {
  const title = getCourseDisplayTitle(course);
  const duration = getCourseDuration(course);
  const stats = getCourseStats(course);

  return (
    <div
      className={`
        p-4 rounded-lg border border-gray-200 bg-white
        hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {course.thumbnail && (
        <img
          src={course.thumbnail}
          alt={title}
          className="w-full h-40 object-cover rounded-md mb-3"
        />
      )}
      
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">
            {title}
          </h3>
          {course.status && (
            <span
              className={`
                px-2 py-1 text-xs rounded-full
                ${course.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                ${course.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                ${course.status === 'Archived' ? 'bg-red-100 text-red-800' : ''}
              `}
            >
              {course.status}
            </span>
          )}
        </div>

        {course.code && (
          <p className="text-sm text-gray-500">
            {course.code}
          </p>
        )}

        <p className="text-sm text-gray-600 line-clamp-2">
          {course.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{duration}</span>
          {course.category && (
            <>
              <span>•</span>
              <span>{course.category}</span>
            </>
          )}
        </div>

        {showStats && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <div className="text-xs">
              <span className="text-gray-500">Enrolled: </span>
              <span className="font-semibold text-gray-900">
                {stats.enrollmentCount}
              </span>
            </div>
            {stats.completionRate > 0 && (
              <div className="text-xs">
                <span className="text-gray-500">Completion: </span>
                <span className="font-semibold text-gray-900">
                  {stats.completionRate}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
