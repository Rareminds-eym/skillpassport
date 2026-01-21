import React, { useMemo, useCallback } from 'react';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  EyeIcon,
  BellAlertIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { UIExam } from '../../hooks/useExams';
import StatusBadge from './StatusBadge';
import TypeBadge from './TypeBadge';

interface ExamCardProps {
  exam: UIExam;
  onManage: () => void;
}

const ExamCard: React.FC<ExamCardProps> = React.memo(({ exam, onManage }) => {
  // Memoized calculations for performance
  const { nextAction, progress, progressColor } = useMemo(() => {
    // Helper function to check if all sessions have invigilators
    const allSessionsCovered =
      exam.timetable.length > 0 &&
      exam.timetable.every((timetableEntry) =>
        exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
      );

    let action;
    if (exam.status === 'published') {
      action = {
        label: 'View Results',
        className: 'bg-green-600 hover:bg-green-700 text-white',
        icon: EyeIcon,
      };
    } else if (exam.marks.length === exam.subjects.length) {
      action = {
        label: 'Publish Results',
        className: 'bg-green-600 hover:bg-green-700 text-white',
        icon: BellAlertIcon,
      };
    } else if (
      exam.timetable.length > 0 &&
      allSessionsCovered &&
      exam.marks.length < exam.subjects.length
    ) {
      action = {
        label: 'Enter Marks',
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
        icon: ClipboardDocumentListIcon,
      };
    } else if (exam.timetable.length > 0 && !allSessionsCovered) {
      action = {
        label: 'Assign Invigilators',
        className: 'bg-purple-600 hover:bg-purple-700 text-white',
        icon: UserGroupIcon,
      };
    } else if (exam.timetable.length === 0) {
      action = {
        label: 'Create Timetable',
        className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        icon: CalendarIcon,
      };
    } else {
      action = {
        label: 'Continue Setup',
        className: 'bg-gray-600 hover:bg-gray-700 text-white',
        icon: Cog6ToothIcon,
      };
    }

    // Calculate progress based on workflow completion
    const timetableComplete = exam.timetable.length > 0 ? 1 : 0;
    const invigilationComplete = allSessionsCovered ? 1 : 0;
    const marksComplete = exam.marks.length / Math.max(exam.subjects.length, 1);

    const calculatedProgress = Math.round(
      ((timetableComplete + invigilationComplete + marksComplete) / 3) * 100
    );

    // Get progress bar color based on completion
    const color =
      calculatedProgress === 100
        ? 'bg-green-500'
        : calculatedProgress >= 75
          ? 'bg-blue-500'
          : calculatedProgress >= 50
            ? 'bg-amber-500'
            : 'bg-gray-400';

    return {
      nextAction: action,
      progress: calculatedProgress,
      progressColor: color,
    };
  }, [exam.status, exam.timetable, exam.invigilation, exam.marks, exam.subjects]);

  // Memoized date formatting
  const formattedDateRange = useMemo(() => {
    const startDate = new Date(exam.startDate);
    const endDate = new Date(exam.endDate);
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    // If same date, show only one date
    if (exam.startDate === exam.endDate) {
      return startDate.toLocaleDateString('en-US', {
        ...formatOptions,
        year: 'numeric',
      });
    }

    // If same year, don't repeat year
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString(
        'en-US',
        {
          ...formatOptions,
          year: 'numeric',
        }
      )}`;
    }

    // Different years, show full dates
    return `${startDate.toLocaleDateString('en-US', {
      ...formatOptions,
      year: 'numeric',
    })} - ${endDate.toLocaleDateString('en-US', {
      ...formatOptions,
      year: 'numeric',
    })}`;
  }, [exam.startDate, exam.endDate]);

  // Memoized class display text
  const classDisplayText = useMemo(() => {
    return exam.targetClasses?.type === 'whole_grade'
      ? `Grade ${exam.grade} (All Sections)`
      : `Class ${exam.grade}${exam.section ? `-${exam.section}` : ''}`;
  }, [exam.targetClasses, exam.grade, exam.section]);

  const handleManage = useCallback(() => {
    onManage();
  }, [onManage]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TypeBadge type={exam.type} />
              <StatusBadge status={exam.status} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">{exam.name}</h3>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <span>{classDisplayText}</span>
          <span className="mx-2">•</span>
          <span>
            {exam.subjects.length} Subject{exam.subjects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Exam Details */}
        <div className="flex justify-between items-start text-sm">
          <div className="flex-1">
            <span className="text-gray-500 block">Exam Period</span>
            <span className="font-medium text-gray-900">{formattedDateRange}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 block">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Setup</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleManage}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${nextAction.className}`}
        >
          <nextAction.icon className="h-4 w-4" />
          {nextAction.label}
        </button>
      </div>
    </div>
  );
});

ExamCard.displayName = 'ExamCard';

export default ExamCard;
