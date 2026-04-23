import React, { useEffect, useState } from "react";
import LessonPlan from "./LessonPlan";
import { useLessonPlans, useSubjectsAndClasses } from '@/features/educator-copilot/model/useLessonPlans';

import { supabase } from '@/shared/api/supabaseClient';

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
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.schoolId) { setSchoolId(parsed.schoolId); setResolving(false); return; }
        }
      } catch { /* ignore */ }

      // Check school_educators table
      const { data: educator } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (educator?.school_id) { setSchoolId(educator.school_id); setResolving(false); return; }

      // Check organizations table
      const userEmail = user.email || localStorage.getItem('userEmail');
      if (userEmail) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', 'school')
          .or(`admin_id.eq.${user.id},email.eq.${userEmail}`)
          .maybeSingle();

        if (org?.id) { setSchoolId(org.id); setResolving(false); return; }
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
