import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { UIExam } from '../../../hooks/useExams';
import { WorkflowStage } from '../types';
import StatusBadge from '../StatusBadge';
import TypeBadge from '../TypeBadge';

interface ExamCreationStepProps {
  exam: UIExam;
  setActiveStep: (step: WorkflowStage) => void;
}

const ExamCreationStep: React.FC<ExamCreationStepProps> = ({ exam, setActiveStep }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exam Setup</h3>
          <p className="text-sm text-gray-500 mt-1">View and edit exam details</p>
        </div>
      </div>

      {/* Exam Details Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Name</label>
            <p className="text-sm font-medium text-gray-900">{exam.name}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assessment Type</label>
            <TypeBadge type={exam.type} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Grade/Class</label>
            <p className="text-sm font-medium text-gray-900">
              Class {exam.grade}{exam.section ? ` - Section ${exam.section}` : " (All Sections)"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Year</label>
            <p className="text-sm font-medium text-gray-900">{exam.academicYear}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Period</label>
            <p className="text-sm font-medium text-gray-900">
              {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <StatusBadge status={exam.status} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Created By</label>
            <p className="text-sm font-medium text-gray-900">{exam.createdBy}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Created At</label>
            <p className="text-sm font-medium text-gray-900">
              {new Date(exam.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {exam.instructions && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Instructions</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{exam.instructions}</p>
          </div>
        </div>
      )}

      {/* Subjects List */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Subjects ({exam.subjects.length})</label>
        <div className="space-y-2">
          {exam.subjects.map((subject, index) => (
            <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                  <p className="text-xs text-gray-500">
                    Total: {subject.totalMarks} marks • Pass: {subject.passingMarks} marks • Duration: {subject.duration} min
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button 
          onClick={() => setActiveStep("timetable")} 
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          Next: Create Timetable
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ExamCreationStep;