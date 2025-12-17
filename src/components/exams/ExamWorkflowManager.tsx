import React, { useState, useCallback, useMemo } from 'react';
import { UIExam, UIStudentMark } from '../../hooks/useExams';
import { WorkflowStage } from './types';
import ModalWrapper from './ModalWrapper';
import WorkflowStepper from './WorkflowStepper';
import ExamCreationStep from './workflow/ExamCreationStep';
import TimetableStep from './workflow/TimetableStep';
import InvigilationStep from './workflow/InvigilationStep';
import MarksEntryStep from './workflow/MarksEntryStep';
import ModerationStep from './workflow/ModerationStep';
import PublishingStep from './workflow/PublishingStep';
import ResultsStep from './workflow/ResultsStep';

interface ExamWorkflowManagerProps {
  exam: UIExam;
  onUpdate: (exam: UIExam) => void;
  onClose: () => void;
  teachers: unknown[];
  rooms: unknown[];
  allSchoolRooms: unknown[];
  students: UIStudentMark[];
  loadStudents: (targetClasses?: unknown, grade?: string, section?: string) => Promise<unknown[]>;
  createTimetableEntry: (examId: string, entry: unknown) => Promise<unknown>;
  deleteTimetableEntry: (examId: string, entryId: string) => Promise<void>;
  createInvigilationAssignment: (examId: string, assignment: unknown) => Promise<unknown>;
  deleteInvigilationAssignment: (examId: string, assignmentId: string) => Promise<void>;
  saveMarks: (examId: string, subjectId: string, marks: UIStudentMark[]) => Promise<void>;
  moderateMarks: (markEntryId: string, moderationData: unknown) => Promise<void>;
  approveSubjectModeration: (examId: string, subjectId: string, userId?: string) => Promise<void>;
  getClassRoom: (grade: string, section?: string) => Promise<string | null>;
  loadData: () => Promise<void>;
  currentUserId?: string;
}

const ExamWorkflowManager: React.FC<ExamWorkflowManagerProps> = (props) => {
  const { exam, onUpdate, onClose } = props;

  // Determine the appropriate initial step based on exam state
  const getInitialStep = useCallback((): WorkflowStage => {
    // Helper function to check if all sessions have invigilators
    const allSessionsCovered = exam.timetable.length > 0 && exam.timetable.every(timetableEntry => 
      exam.invigilation.some(duty => duty.timetableEntryId === timetableEntry.id)
    );

    if (exam.status === "published") return "results";
    if (exam.marks.length === exam.subjects.length) return "publishing";
    
    // Check if timetable exists and all sessions have invigilators before allowing marks entry
    if (exam.timetable.length > 0 && allSessionsCovered && exam.marks.length < exam.subjects.length) {
      return "marks";
    }
    
    // If timetable exists but not all sessions have invigilators
    if (exam.timetable.length > 0 && !allSessionsCovered) {
      return "invigilation";
    }
    
    if (exam.timetable.length === 0) return "timetable";
    return "timetable"; // fallback
  }, [exam.status, exam.timetable.length, exam.invigilation.length, exam.marks.length, exam.subjects.length]);

  const [activeStep, setActiveStep] = useState<WorkflowStage>(() => getInitialStep());
  const [localExam, setLocalExam] = useState(exam);

  // Keep localExam in sync with the exam prop (which comes from global state)
  React.useEffect(() => {
    console.log('🔄 Exam prop updated:', exam.name, 'marks:', exam.marks.length);
    exam.marks.forEach(mark => {
      console.log(`  📊 Subject ${mark.subjectName} (${mark.subjectId}): ${mark.studentMarks.length} students`);
    });
    setLocalExam(exam);
  }, [exam]);

  const updateExam = useCallback((updates: Partial<UIExam>) => {
    const updated = { ...localExam, ...updates };
    setLocalExam(updated);
    onUpdate(updated);
  }, [localExam, onUpdate]);

  // Memoized common props to prevent unnecessary re-renders
  const commonProps = useMemo(() => ({
    exam: localExam,
    updateExam,
    setActiveStep,
    ...props
  }), [localExam, updateExam, props]);

  const renderStepContent = useCallback(() => {
    switch (activeStep) {
      case "creation":
        return <ExamCreationStep {...commonProps} />;
      case "timetable":
        return <TimetableStep {...commonProps} />;
      case "invigilation":
        return <InvigilationStep {...commonProps} />;
      case "marks":
        return <MarksEntryStep {...commonProps} />;
      case "moderation":
        return (
          <ModerationStep 
            exam={localExam}
            setActiveStep={setActiveStep}
            moderateMarks={props.moderateMarks}
            approveSubjectModeration={props.approveSubjectModeration}
            loadData={props.loadData}
            currentUserId={props.currentUserId}
          />
        );
      case "publishing":
        return (
          <PublishingStep 
            exam={localExam}
            setActiveStep={setActiveStep}
            updateExam={updateExam}
          />
        );
      case "results":
        return (
          <ResultsStep 
            exam={localExam}
            setActiveStep={setActiveStep}
          />
        );
      default:
        return <ExamCreationStep {...commonProps} />;
    }
  }, [activeStep, commonProps, localExam, updateExam, props]);

  return (
    <ModalWrapper
      isOpen={true}
      onClose={onClose}
      title={localExam.name}
      subtitle="Manage exam workflow"
      size="full"
    >
      <div className="flex flex-col h-full space-y-6">
        {/* Workflow Stepper */}
        <div className="flex-shrink-0">
          <WorkflowStepper exam={localExam} onStepClick={setActiveStep} />
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ExamWorkflowManager;