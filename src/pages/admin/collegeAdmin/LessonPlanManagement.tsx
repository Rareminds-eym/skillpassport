/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ClipboardDocumentCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getLogger } from '@/shared/config/logging';

// Import the college lesson plan UI
import { CollegeLessonPlanUI } from '@/features/college-admin';
import { lessonPlanService, type CollegeLessonPlan } from '@/features/college-admin';
import { CollegeLessonPlanReviewDrawer } from '@/features/college-admin/ui';

function SessionPlanToolDialog({
  title,
  description,
  children,
  icon,
  drawer = false,
  reviewNotifications = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  drawer?: boolean;
  reviewNotifications?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const routeOpen = reviewNotifications && Boolean(searchParams.get('reviewChange'));

  return (
    <Dialog.Root
      open={open || routeOpen}
      onOpenChange={value => {
        setOpen(value);
        if (!value && routeOpen) {
          const next = new URLSearchParams(searchParams);
          next.delete('reviewChange');
          setSearchParams(next, { replace: true });
        }
      }}
    >
      <Dialog.Trigger className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
        {icon}
        {title}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/60" />
        <Dialog.Content
          className={
            drawer
              ? 'fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl focus:outline-none'
              : 'fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none'
          }
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-4 py-5 sm:px-6">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-600">{description}</Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={`Close ${title}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * CollegeLessonPlanManagement - Lesson plan management for college faculty
 * 
 * Follows the same pattern as CurriculumBuilder with department → program → semester → course flow
 */
const CollegeLessonPlanManagement: React.FC = () => {
  const logger = getLogger('college-lesson-plan-management');
  // Local state for college-specific selections
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Configuration data from database
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Current lesson plan data
  const [lessonPlans, setLessonPlans] = useState<CollegeLessonPlan[]>([]);
  const planRequest = useRef(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  const [currentCurriculumId, setCurrentCurriculumId] = useState<string | undefined>(undefined);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  // Load programs when department changes
  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms(selectedDepartment);
    } else {
      setPrograms([]);
      setSelectedProgram('');
    }
  }, [selectedDepartment]);

  // Load semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadSemesters(selectedProgram);
    } else {
      setSemesters([]);
      setSelectedSemester('');
    }
  }, [selectedProgram]);

  // Load courses when program and semester change
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadCourses(selectedProgram, parseInt(selectedSemester));
    } else {
      setCourses([]);
      setSelectedCourse('');
    }
  }, [selectedProgram, selectedSemester]);

  // The list owns its visible filters. Fetch all college plans so the form's
  // academic-year default does not silently filter the list.
  useEffect(() => {
    void loadLessonPlans();
    return () => { planRequest.current += 1; };
  }, []);

  const loadConfigurationData = async () => {
    try {
      // Load departments
      const deptResult = await lessonPlanService.getDepartments();
      if (deptResult.success) {
        setDepartments(deptResult.data || []);
      } else {
        toast.error('Failed to load departments');
      }

      // Load academic years
      const years = lessonPlanService.getAcademicYears();
      setAcademicYears(years);
      
      const now = new Date();
      const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      const currentYear = years.find(year => year === `${start}-${start + 1}`);
      
      if (currentYear) {
        setSelectedAcademicYear(currentYear);
      }

    } catch (error: any) {
      logger.error('Error loading configuration', error);
      toast.error('Failed to load configuration data');
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const result = await lessonPlanService.getPrograms(departmentId);
      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast.error('Failed to load programs');
        setPrograms([]);
      }
    } catch (error) {
      logger.error('Error loading programs', error as Error);
      toast.error('Failed to load programs');
      setPrograms([]);
    }
  };

  const loadSemesters = async (programId: string) => {
    try {
      const result = await lessonPlanService.getSemesters(programId);
      if (result.success) {
        setSemesters(result.data || []);
      } else {
        toast.error('Failed to load semesters');
        setSemesters([]);
      }
    } catch (error) {
      logger.error('Error loading semesters', error as Error);
      toast.error('Failed to load semesters');
      setSemesters([]);
    }
  };

  const loadCourses = async (programId: string, semester: number) => {
    try {
      const result = await lessonPlanService.getCourses(programId, semester);
      if (result.success) {
        setCourses(result.data || []);
      } else {
        toast.error('Failed to load courses');
        setCourses([]);
      }
    } catch (error) {
      logger.error('Error loading courses', error as Error);
      toast.error('Failed to load courses');
      setCourses([]);
    }
  };

  const loadLessonPlans = async () => {
    const request = ++planRequest.current;
    try {
      setLoading(true);
      setLoadError(null);
      const result = await lessonPlanService.getLessonPlans();
      if (request !== planRequest.current) return;
      if (result.success) {
        setLessonPlans(result.data || []);
      } else {
        setLoadError(result.error?.message || 'Failed to load lesson plans');
      }
    } catch (error) {
      if (request !== planRequest.current) return;
      logger.error('Error loading lesson plans', error as Error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load lesson plans');
    } finally {
      if (request === planRequest.current) setLoading(false);
    }
  };

  // Handler for department change in form
  const handleDepartmentChange = async (departmentId: string) => {
    if (departmentId && typeof departmentId === 'string') {
      const result = await lessonPlanService.getPrograms(departmentId);
      if (result.success) {
        return {
          programs: result.data || [],
          courses: [], // Courses will be loaded after program selection
        };
      }
    }
    
    return {
      programs: [],
      courses: [],
    };
  };

  // Handler for program change in form
  const handleProgramChange = async (programId: string) => {
    if (programId && typeof programId === 'string') {
      const semesterResult = await lessonPlanService.getSemesters(programId);
      if (semesterResult.success) {
        // Update the semesters state for the form
        setSemesters(semesterResult.data || []);
        return {
          semesters: (semesterResult.data || []).map(s => s.toString()),
          courses: [], // Courses will be loaded after semester selection
        };
      }
    }
    
    return {
      semesters: [],
      courses: [],
    };
  };

  // Handler for semester change in form
  const handleSemesterChange = async (semester: string, programId: string) => {
    if (semester && programId && typeof programId === 'string') {
      const result = await lessonPlanService.getCourses(programId, parseInt(semester));
      if (result.success) {
        return {
          courses: result.data || [],
        };
      }
    }
    
    return {
      courses: [],
    };
  };

  // Handler for curriculum context change (course + program + academic year)
  const handleCurriculumContextChange = async (courseId: string, programId: string, academicYear: string) => {
    if (courseId && programId && academicYear) {
      try {
        // Load curriculum units
        const unitsResult = await lessonPlanService.getCurriculumUnits(courseId, programId, academicYear);
        
        if (unitsResult.success) {
          setUnits(unitsResult.data || []);
          setCurrentCurriculumId(unitsResult.curriculumId);
          
          // Clear learning outcomes since unit hasn't been selected yet
          setLearningOutcomes([]);
        } else {
          setUnits([]);
          setLearningOutcomes([]);
          setCurrentCurriculumId(undefined);
        }
      } catch (error) {
        logger.error('Error loading curriculum context', error as Error);
        setUnits([]);
        setLearningOutcomes([]);
        setCurrentCurriculumId(undefined);
      }
    } else {
      setUnits([]);
      setLearningOutcomes([]);
      setCurrentCurriculumId(undefined);
    }
  };

  // Handler for unit selection change
  const handleUnitChange = async (unitId: string) => {
    if (unitId) {
      try {
        const outcomesResult = await lessonPlanService.getLearningOutcomes(unitId);
        if (outcomesResult.success) {
          setLearningOutcomes(outcomesResult.data || []);
        } else {
          setLearningOutcomes([]);
        }
      } catch (error) {
        logger.error('Error loading learning outcomes', error as Error);
        setLearningOutcomes([]);
      }
    } else {
      setLearningOutcomes([]);
    }
  };

  // Handler for adding/updating lesson plan
  const handleAddLessonPlan = async (lessonPlan: any) => {
    try {
      setSaveStatus("saving");
      
      // Debug: Log the received lesson plan data structure
      
      // Validate required fields before sending to service
      const sessionDate = lessonPlan.sessionDate || lessonPlan.session_date;
      if (!sessionDate || sessionDate.trim() === '') {
        throw new Error('Session date is required');
      }
      
      // Validate date format
      const dateObj = new Date(sessionDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Please enter a valid session date');
      }
      
      if (lessonPlan.id && lessonPlans.find(lp => lp.id === lessonPlan.id)) {
        // Update existing lesson plan
        const result = await lessonPlanService.updateLessonPlan(lessonPlan.id, {
          title: lessonPlan.title,
          session_date: lessonPlan.session_date || lessonPlan.sessionDate,
          duration_minutes: lessonPlan.duration ? parseInt(lessonPlan.duration) : lessonPlan.duration_minutes,
          department_id: lessonPlan.department_id || lessonPlan.department,
          program_id: lessonPlan.program_id || lessonPlan.program,
          course_id: lessonPlan.course_id || lessonPlan.course,
          semester: parseInt(lessonPlan.semester),
          academic_year: lessonPlan.academic_year || lessonPlan.academicYear,
          curriculum_id: currentCurriculumId, // Include curriculum_id
          unit_id: lessonPlan.unit_id || lessonPlan.unitId,
          selected_learning_outcomes: lessonPlan.selected_learning_outcomes || lessonPlan.selectedLearningOutcomes,
          session_objectives: lessonPlan.session_objectives || lessonPlan.sessionObjectives,
          teaching_methodology: lessonPlan.teaching_methodology || lessonPlan.teachingMethodology,
          required_materials: lessonPlan.required_materials || lessonPlan.requiredMaterials,
          resource_files: lessonPlan.resource_files || lessonPlan.resourceFiles,
          resource_links: lessonPlan.resource_links || lessonPlan.resourceLinks,
          evaluation_criteria: lessonPlan.evaluation_criteria || lessonPlan.evaluationCriteria,
          evaluation_items: lessonPlan.evaluation_items || lessonPlan.evaluationItems,
          follow_up_activities: lessonPlan.follow_up_activities || lessonPlan.followUpActivities,
          additional_notes: lessonPlan.additional_notes || lessonPlan.additionalNotes,
          status: lessonPlan.status,
        });

        if (result.success && result.data) {
          setLessonPlans(prev => prev.map(lp => lp.id === lessonPlan.id ? result.data! : lp));
          setSaveStatus("saved");
          toast.success('Lesson plan updated successfully');
        } else {
          setSaveStatus("idle");
          const errorMessage = result.error?.message || 'Failed to update lesson plan';
          throw new Error(errorMessage);
        }
      } else {
        // Create new lesson plan
        const result = await lessonPlanService.createLessonPlan({
          title: lessonPlan.title,
          session_date: lessonPlan.session_date || lessonPlan.sessionDate,
          duration_minutes: lessonPlan.duration ? parseInt(lessonPlan.duration) : lessonPlan.duration_minutes,
          department_id: lessonPlan.department_id || lessonPlan.department,
          program_id: lessonPlan.program_id || lessonPlan.program,
          course_id: lessonPlan.course_id || lessonPlan.course,
          semester: parseInt(lessonPlan.semester),
          academic_year: lessonPlan.academic_year || lessonPlan.academicYear,
          curriculum_id: currentCurriculumId, // Include curriculum_id
          unit_id: lessonPlan.unit_id || lessonPlan.unitId,
          selected_learning_outcomes: lessonPlan.selected_learning_outcomes || lessonPlan.selectedLearningOutcomes,
          session_objectives: lessonPlan.session_objectives || lessonPlan.sessionObjectives,
          teaching_methodology: lessonPlan.teaching_methodology || lessonPlan.teachingMethodology,
          required_materials: lessonPlan.required_materials || lessonPlan.requiredMaterials,
          resource_files: lessonPlan.resource_files || lessonPlan.resourceFiles,
          resource_links: lessonPlan.resource_links || lessonPlan.resourceLinks,
          evaluation_criteria: lessonPlan.evaluation_criteria || lessonPlan.evaluationCriteria,
          evaluation_items: lessonPlan.evaluation_items || lessonPlan.evaluationItems,
          follow_up_activities: lessonPlan.follow_up_activities || lessonPlan.followUpActivities,
          additional_notes: lessonPlan.additional_notes || lessonPlan.additionalNotes,
          status: lessonPlan.status,
          metadata: {},
        });

        if (result.success && result.data) {
          setLessonPlans(prev => [result.data!, ...prev]);
          setSaveStatus("saved");
          toast.success('Lesson plan created successfully');
        } else {
          setSaveStatus("idle");
          const errorMessage = result.error?.message || 'Failed to create lesson plan';
          throw new Error(errorMessage);
        }
      }
      
      await loadLessonPlans();
      // Reset save status after a delay
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      logger.error('Error saving lesson plan', error);
      setSaveStatus("idle");
      throw error;
    }
  };

  // Handler for deleting lesson plan
  const handleDeleteLessonPlan = async (id: string) => {
    try {
      const result = await lessonPlanService.deleteLessonPlan(id);
      if (result.success) {
        setLessonPlans(prev => prev.filter(lp => lp.id !== id));
        toast.success('Lesson plan deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete lesson plan');
      }
    } catch (error: any) {
      logger.error('Error deleting lesson plan', error);
      toast.error('Failed to delete lesson plan');
    }
  };

  // Handler for publishing lesson plan
  const handlePublishLessonPlan = async (id: string) => {
    try {
      const result = await lessonPlanService.updateLessonPlan(id, {
        status: 'published',
        published_at: new Date().toISOString(),
      });

      if (result.success && result.data) {
        setLessonPlans(prev => prev.map(lp => lp.id === id ? result.data! : lp));
        toast.success('Lesson plan published successfully');
      } else {
        toast.error(result.error?.message || 'Failed to publish lesson plan');
      }
    } catch (error: any) {
      logger.error('Error publishing lesson plan', error);
      toast.error('Failed to publish lesson plan');
    }
  };

  return (
    <>
    {loadError && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>Session plans could not be loaded: {loadError}</p><button type="button" disabled={loading} className="mt-2 min-h-11 rounded-lg px-3 font-semibold underline disabled:opacity-50" onClick={() => { void loadLessonPlans(); }}>Retry loading plans</button></div>}
    {(!loadError || lessonPlans.length > 0) &&
    <CollegeLessonPlanUI
      headerActions={
        <SessionPlanToolDialog
          drawer
          reviewNotifications
          title="Educator changes"
          description="Review proposed session plan changes. Content is updated only after approval."
          icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
        >
          <CollegeLessonPlanReviewDrawer onReviewed={() => { void loadLessonPlans(); }} />
        </SessionPlanToolDialog>
      }
      // College-specific selections
      selectedCourse={selectedCourse}
      setSelectedCourse={setSelectedCourse}
      selectedDepartment={selectedDepartment}
      setSelectedDepartment={setSelectedDepartment}
      selectedProgram={selectedProgram}
      setSelectedProgram={setSelectedProgram}
      selectedSemester={selectedSemester}
      setSelectedSemester={setSelectedSemester}
      selectedAcademicYear={selectedAcademicYear}
      setSelectedAcademicYear={setSelectedAcademicYear}
      // Configuration data
      courses={courses}
      departments={departments}
      programs={programs}
      semesters={semesters.map(s => s.toString())}
      academicYears={academicYears}
      // Data
      lessonPlans={lessonPlans}
      units={units}
      learningOutcomes={learningOutcomes}
      saveStatus={saveStatus}
      loading={loading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      // Handlers
      onAddLessonPlan={handleAddLessonPlan}
      onDeleteLessonPlan={handleDeleteLessonPlan}
      onPublishLessonPlan={handlePublishLessonPlan}
      // Dynamic handlers for form
      onDepartmentChange={handleDepartmentChange}
      onProgramChange={handleProgramChange}
      onSemesterChange={handleSemesterChange}
      onCurriculumContextChange={handleCurriculumContextChange}
      onUnitChange={handleUnitChange}
    />
    }
    </>
  );
};

export default CollegeLessonPlanManagement;
