import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  UsersIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Course } from '../../../types/educator/course';

interface CourseCardProps {
  course: Course;
  onView: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onArchive?: (course: Course) => void;
  onViewAnalytics: (course: Course) => void;
  onAssignEducator?: (course: Course) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    Draft: 'bg-gray-100 text-gray-700 border-gray-300',
    Upcoming: 'bg-blue-100 text-blue-700 border-blue-300',
    Archived: 'bg-amber-100 text-amber-700 border-amber-300'
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[status] || colors.Draft}`}>
      {status}
    </span>
  );
};

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onView,
  onEdit,
  onArchive,
  onViewAnalytics,
  onAssignEducator
}) => {
  const [showActions, setShowActions] = useState(false);
  const skillCoverage = course.totalSkills > 0
    ? Math.round((course.skillsMapped / course.totalSkills) * 100)
    : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the actions menu or its children
    const target = e.target as HTMLElement;
    if (target.closest('.actions-menu')) return;
    onView(course);
  };

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 }
      }}
      onClick={handleCardClick}
    >
      {/* Thumbnail/Icon */}
      {course.thumbnail && (
        <motion.div
          className="mb-4 flex items-center justify-center overflow-hidden rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {(course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) ? (
            <>
              <motion.img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-32 object-cover rounded-lg"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.classList.remove('hidden');
                    fallback.classList.add('flex');
                  }
                }}
              />
              {/* Fallback icon (hidden by default, shown if image fails) */}
              <motion.div
                className="w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg items-center justify-center hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <BookOpenIcon className="h-16 w-16 text-white opacity-90" />
              </motion.div>
            </>
          ) : (
            <motion.div
              className="w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <BookOpenIcon className="h-16 w-16 text-white opacity-90" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
              {course.title}
            </h3>
            <StatusBadge status={course.status} />
          </div>
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{course.code}</span> • {course.duration}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {course.description}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => { onView(course); setShowActions(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <EyeIcon className="h-4 w-4" /> View Course
              </button>
              {onEdit && (
                <button
                  onClick={() => { onEdit(course); setShowActions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <PencilIcon className="h-4 w-4" /> Edit Course
                </button>
              )}
              {onAssignEducator && (
                <button
                  onClick={() => { onAssignEducator(course); setShowActions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <UsersIcon className="h-4 w-4" /> Assign Educator
                </button>
              )}
              <button
                onClick={() => { onViewAnalytics(course); setShowActions(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" /> View Analytics
              </button>
              {onArchive && (
                <button
                  onClick={() => { onArchive(course); setShowActions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                >
                  <ArchiveBoxIcon className="h-4 w-4" /> {course.status === 'Archived' ? 'Unarchive' : 'Archive'}
                </button>
              )}
            
            </div>
          )}
        </div>
      </div>

      {/* Skill Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {course.skillsCovered.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-200"
          >
            {skill}
          </span>
        ))}
        {course.skillsCovered.length > 3 && (
          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200">
            +{course.skillsCovered.length - 3} more
          </span>
        )}
      </div>

      {/* Skill Passport Info */}
      <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-900">Skill Coverage</span>
          <span className="text-xs font-semibold text-indigo-700">
            {course.skillsMapped}/{course.totalSkills} skills
          </span>
        </div>
        <div className="w-full bg-indigo-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${skillCoverage}%` }}
          />
        </div>
        <p className="text-xs text-indigo-600 mt-1">{skillCoverage}% mapped</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <UsersIcon className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Enrolled</p>
            <p className="font-semibold text-gray-900">{course.enrollmentCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircleIcon className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Completion</p>
            <p className="font-semibold text-gray-900">{course.completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <BookOpenIcon className="h-4 w-4" />
            <span>{course.modules?.length || 0} module(s)</span>
          </div>
          <div className="flex items-center gap-1">
            <AcademicCapIcon className="h-4 w-4" />
            <span>{course.linkedClasses.length} class(es)</span>
          </div>
        </div>
        {course.evidencePending > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
            <ClockIcon className="h-3 w-3" />
            <span>{course.evidencePending} pending</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseCard;
