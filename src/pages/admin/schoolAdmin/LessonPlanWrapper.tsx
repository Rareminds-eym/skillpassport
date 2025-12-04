import React from "react";
import LessonPlan from "./LessonPlan";
import { useLessonPlans, useSubjectsAndClasses } from "../../../hooks/useLessonPlans";

/**
 * Wrapper component that connects the LessonPlan UI to the backend
 * This component handles data fetching and state management
 */
const LessonPlanWrapper: React.FC = () => {
  // Get current school ID from localStorage or context
  const schoolId = localStorage.getItem("schoolId") || undefined;

  // Use hooks for data management
  const lessonPlansHook = useLessonPlans();
  const { subjects, classes, loading: configLoading } = useSubjectsAndClasses(schoolId);

  if (configLoading || lessonPlansHook.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <LessonPlan
      initialLessonPlans={lessonPlansHook.lessonPlans}
      onCreateLessonPlan={lessonPlansHook.create}
      onUpdateLessonPlan={lessonPlansHook.update}
      onDeleteLessonPlan={lessonPlansHook.remove}
      subjects={subjects.map((s) => s.name)}
      classes={classes}
      schoolId={schoolId}
    />
  );
};

export default LessonPlanWrapper;
