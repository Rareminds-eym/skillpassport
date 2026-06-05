import React, { useEffect, useState } from "react";
import LessonPlan from "./LessonPlan";
import { useLessonPlans, useSubjectsAndClasses } from '@/features/educator-copilot/model/useLessonPlans';

import { apiPost } from '@/shared/api/apiClient';

import { useUser } from '@/shared/model/authStore';
/**
 * Wrapper component that connects the LessonPlan UI to the backend
 * This component handles data fetching and state management
 */
const LessonPlanWrapper: React.FC = () => {
  const user = useUser();
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [resolving, setResolving] = useState(true);

  // Resolve school ID from auth context (same pattern as Dashboard)
  useEffect(() => {
    const resolveSchoolId = async () => {
      if (!user) { setResolving(false); return; }

      // Check localStorage user object first
      try {
        const stored = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.schoolId) { setSchoolId(parsed.schoolId); setResolving(false); return; }
        }
      } catch { /* ignore */ }

      // Look up school_id via API
      const resp: any = await apiPost('/school-admin/actions', { action: 'fetchSchoolId', storedUser: (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user")) });
      if (resp.data?.schoolId) {
        setSchoolId(resp.data.schoolId);
        setResolving(false);
        return;
      }

      setResolving(false);
    };

    resolveSchoolId();
  }, [user]);

  // Use hooks for data management
  const lessonPlansHook = useLessonPlans();
  const { subjects, classes, loading: configLoading } = useSubjectsAndClasses(schoolId);

  if (resolving || configLoading || lessonPlansHook.loading) {
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
      subjects={Array.isArray(subjects) ? subjects.map((s) => s.name || s) : []}
      classes={Array.isArray(classes) ? classes : []}
      schoolId={schoolId}
    />
  );
};

export default LessonPlanWrapper;
