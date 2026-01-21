import React from 'react';
import {
  DocumentCheckIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  BellAlertIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { UIExam } from '../../hooks/useExams';
import { WorkflowStage } from './types';

interface WorkflowStepperProps {
  exam: UIExam;
  onStepClick: (step: WorkflowStage) => void;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ exam, onStepClick }) => {
  const steps = [
    {
      key: 'creation' as WorkflowStage,
      label: 'Exam Setup',
      icon: DocumentCheckIcon,
      description: 'Basic details & subjects',
    },
    {
      key: 'timetable' as WorkflowStage,
      label: 'Timetable',
      icon: CalendarIcon,
      description: 'Schedule exam sessions',
    },
    {
      key: 'invigilation' as WorkflowStage,
      label: 'Invigilation',
      icon: UserGroupIcon,
      description: 'Assign teachers',
    },
    {
      key: 'marks' as WorkflowStage,
      label: 'Marks Entry',
      icon: ClipboardDocumentListIcon,
      description: 'Enter student marks',
    },
    {
      key: 'moderation' as WorkflowStage,
      label: 'Moderation',
      icon: ShieldCheckIcon,
      description: 'Review & approve',
    },
    {
      key: 'publishing' as WorkflowStage,
      label: 'Publish',
      icon: BellAlertIcon,
      description: 'Release results',
    },
    {
      key: 'results' as WorkflowStage,
      label: 'View Results',
      icon: EyeIcon,
      description: 'View published results',
    },
  ];

  const getStepStatus = (stepKey: WorkflowStage) => {
    // Helper function to check if all sessions have invigilators
    const allSessionsCovered =
      exam.timetable.length > 0 &&
      exam.timetable.every((timetableEntry) =>
        exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
      );

    if (stepKey === 'creation') return 'completed';
    if (stepKey === 'timetable') return exam.timetable.length > 0 ? 'completed' : 'current';
    if (stepKey === 'invigilation')
      return allSessionsCovered ? 'completed' : exam.timetable.length > 0 ? 'current' : 'locked';
    if (stepKey === 'marks')
      return exam.marks.length === exam.subjects.length
        ? 'completed'
        : allSessionsCovered
          ? 'current'
          : 'locked';
    if (stepKey === 'moderation')
      return exam.marks.length === exam.subjects.length ? 'current' : 'locked';
    if (stepKey === 'publishing')
      return exam.status === 'published'
        ? 'completed'
        : exam.marks.length === exam.subjects.length
          ? 'current'
          : 'locked';
    if (stepKey === 'results') return exam.status === 'published' ? 'current' : 'locked';
    return 'locked';
  };

  const isStepClickable = (stepKey: WorkflowStage) => {
    // If exam is published, only allow viewing (all steps are clickable for viewing)
    if (exam.status === 'published') return true;

    // For non-published exams, allow navigation to:
    // 1. Always allow creation (exam setup)
    // 2. Always allow timetable
    // 3. Allow invigilation if timetable exists
    // 4. Allow marks if all sessions are covered
    // 5. Don't allow moderation/publishing/results until appropriate conditions are met

    if (stepKey === 'creation') return true;
    if (stepKey === 'timetable') return true;
    if (stepKey === 'invigilation') return exam.timetable.length > 0;

    // For marks and beyond, use the original logic
    const allSessionsCovered =
      exam.timetable.length > 0 &&
      exam.timetable.every((timetableEntry) =>
        exam.invigilation.some((duty) => duty.timetableEntryId === timetableEntry.id)
      );

    if (stepKey === 'marks') return allSessionsCovered;
    if (stepKey === 'moderation') return exam.marks.length === exam.subjects.length;
    if (stepKey === 'publishing') return exam.marks.length === exam.subjects.length;
    if (stepKey === 'results') return exam.status === 'published';

    return false;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Exam Workflow Progress</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;
          const isClickable = isStepClickable(step.key);

          return (
            <button
              key={step.key}
              onClick={() => isClickable && onStepClick(step.key)}
              disabled={!isClickable}
              className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${status === 'completed' ? 'bg-green-50 border-green-500 hover:bg-green-100' : ''}
                ${status === 'current' ? 'bg-indigo-50 border-indigo-500 hover:bg-indigo-100' : ''}
                ${status === 'locked' && !isClickable ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' : ''}
                ${isClickable ? 'cursor-pointer' : ''}
              `}
            >
              {status === 'completed' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-2
                ${status === 'completed' ? 'bg-green-100' : ''}
                ${status === 'current' ? 'bg-indigo-100' : ''}
                ${status === 'locked' ? 'bg-gray-100' : ''}
              `}
              >
                <Icon
                  className={`h-5 w-5 ${
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'current'
                        ? 'text-indigo-600'
                        : 'text-gray-400'
                  }`}
                />
              </div>
              <p
                className={`text-sm font-semibold mb-1 ${
                  status === 'completed'
                    ? 'text-green-900'
                    : status === 'current'
                      ? 'text-indigo-900'
                      : 'text-gray-500'
                }`}
              >
                {step.label}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
