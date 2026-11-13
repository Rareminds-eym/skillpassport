import { CurriculumExcelImport, CourseAccessReview } from '@/features/college-course-workflow';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FeatureGate } from '@/features/subscription';
import { ConfirmationModal } from '@/shared/ui';
import { useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import toast from 'react-hot-toast';
import * as Dialog from '@radix-ui/react-dialog';
import { useSearchParams } from 'react-router-dom';
import { useIsMutating } from '@tanstack/react-query';
import { ArrowUpTrayIcon, ClipboardDocumentCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Import the college-adapted curriculum builder UI
import { CollegeCurriculumBuilderUI, curriculumApprovalService, curriculumService, type CurriculumOutcome, type CurriculumUnit } from '@/features/college-admin';
import { getLogger } from '@/shared/config/logging';
const logger = getLogger('college-curriculum-builder');

import { getWSClient } from '@/shared/api/wsRealtimeClient';

function CurriculumToolDialog({ title, description, children, icon, drawer = false, reviewNotifications = false }: { title: string; description: string; children: React.ReactNode; icon: React.ReactNode; drawer?: boolean; reviewNotifications?: boolean }) {
  const [open, setOpen] = useState(false);
  const busy = useIsMutating() > 0;
  const [searchParams, setSearchParams] = useSearchParams();
  const routeOpen = reviewNotifications && Boolean(searchParams.get('reviewChange'));
  return <Dialog.Root open={open || routeOpen} onOpenChange={value => { if (busy) return; setOpen(value); if (!value && routeOpen) { const next = new URLSearchParams(searchParams); next.delete('reviewChange'); setSearchParams(next, { replace: true }); } }}>
    <Dialog.Trigger className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
      {icon}{title}
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-900/60" />
      <Dialog.Content className={drawer ? 'fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl focus:outline-none' : 'fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none'}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-4 py-5 sm:px-6">
          <div><Dialog.Title className="text-xl font-semibold text-gray-900">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-600">{description}</Dialog.Description></div>
          <Dialog.Close disabled={busy} aria-label={`Close ${title}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"><XMarkIcon className="h-5 w-5" /></Dialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

/**
 * CollegeCurriculumBuilder - Curriculum management for college admins
 * 
 * Wrapped with FeatureGate for curriculum_builder add-on access control
 */
const CollegeCurriculumBuilderContent: React.FC = () => {
  // Local state for college-specific selections
  const [selectedCourse, setSelectedCourse] = useState(''); // Course/Subject
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
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);

  // Current curriculum data
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<CurriculumOutcome[]>([]);
  const [status, setStatus] = useState<"draft" | "approved" | "published" | "pending_approval" | "rejected">("draft");

  // UI state
  const [loading, setLoading] = useState(false);

  const requests = useRef({ programs: 0, semesters: 0, courses: 0, curriculum: 0 });

  // Real-time subscription refs
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deleteUnit' | 'deleteOutcome' | 'approve' | 'publish';
    title: string;
    message: string;
    onConfirm: () => void;
    itemId?: string;
  }>({
    isOpen: false,
    type: 'deleteUnit',
    title: '',
    message: '',
    onConfirm: () => { },
  });

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
      setSelectedProgram(''); // Reset program selection
    }
    const pending = requests.current;
    return () => { pending.programs++; };
  }, [selectedDepartment]);

  // Load semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadSemesters(selectedProgram);
    } else {
      setSemesters([]);
      setSelectedSemester(''); // Reset semester selection
    }
    const pending = requests.current;
    return () => { pending.semesters++; };
  }, [selectedProgram]);

  // Load courses when program and semester change
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadCourses(selectedProgram, parseInt(selectedSemester));
    } else {
      setCourses([]);
      setSelectedCourse(''); // Reset course selection
    }
    const pending = requests.current;
    return () => { pending.courses++; };
  }, [selectedProgram, selectedSemester]);

  // Load curriculum when context is complete (but don't auto-create)
  useEffect(() => {
    if (selectedDepartment && selectedProgram && selectedSemester && selectedAcademicYear && selectedCourse) {
      loadExistingCurriculum();
    } else {
      requests.current.curriculum++;
      setLoading(false);
      // Clear curriculum data when context is incomplete
      setCurriculumId(null);
      setUnits([]);
      setLearningOutcomes([]);
      setStatus("draft");
    }
  }, [selectedDepartment, selectedProgram, selectedSemester, selectedAcademicYear, selectedCourse]);

  // Real-time subscription for curriculum changes
  useEffect(() => {
    if (!curriculumId) return; // Only subscribe when we have a specific curriculum

    const wsClient = getWSClient();
    const unsubscribers: Array<() => void> = [];

    // Subscribe to college_curriculums changes for this specific curriculum
    const unsubCurriculum = wsClient.subscribe(
      'college_curriculums',
      { event: '*', filter: `id=eq.${curriculumId}` },
      (event) => {
        if (event.type === 'change') {
          // Auto-refresh curriculum data when changes are detected
          loadExistingCurriculum();

          // Show a subtle notification
          if (event.event === 'UPDATE') {
            toast.success('Curriculum updated', {
              duration: 2000,
              icon: '🔔'
            });
          }
        }
      }
    );
    unsubscribers.push(unsubCurriculum);

    // Subscribe to curriculum_units changes for this curriculum
    const unsubUnits = wsClient.subscribe(
      'college_curriculum_units',
      { event: '*', filter: `curriculum_id=eq.${curriculumId}` },
      (event) => {
        if (event.type === 'change') {
          // Refresh curriculum data when units change
          loadExistingCurriculum();

          if (event.event === 'INSERT') {
            toast.success('New unit added', { duration: 2000, icon: '📚' });
          } else if (event.event === 'UPDATE') {
            toast.success('Unit updated', { duration: 2000, icon: '📝' });
          } else if (event.event === 'DELETE') {
            toast.success('Unit removed', { duration: 2000, icon: '🗑️' });
          }
        }
      }
    );
    unsubscribers.push(unsubUnits);

    // Subscribe to curriculum_learning_outcomes changes for this curriculum
    const unsubOutcomes = wsClient.subscribe(
      'college_curriculum_outcomes',
      { event: '*', filter: `curriculum_id=eq.${curriculumId}` },
      (event) => {
        if (event.type === 'change') {
          // Refresh curriculum data when outcomes change
          loadExistingCurriculum();

          if (event.event === 'INSERT') {
            toast.success('New learning outcome added', { duration: 2000, icon: '🎯' });
          } else if (event.event === 'UPDATE') {
            toast.success('Learning outcome updated', { duration: 2000, icon: '✏️' });
          } else if (event.event === 'DELETE') {
            toast.success('Learning outcome removed', { duration: 2000, icon: '🗑️' });
          }
        }
      }
    );
    unsubscribers.push(unsubOutcomes);

    // Set connected state
    setIsRealTimeConnected(true);

    // Cleanup on unmount or curriculum change
    return () => {
      unsubscribers.forEach(unsub => unsub());
      setIsRealTimeConnected(false);
    };
  }, [curriculumId]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptResult = await curriculumService.getDepartments();

        setDepartments(deptResult || []);


      // Load assessment types
      const assessmentResult = await curriculumService.getAssessmentTypes();

        setAssessmentTypes(assessmentResult || []);


      // Load academic years
      const years = curriculumService.getAcademicYears();
      setAcademicYears(years);

      // Auto-select current academic year
      const currentYear = years.find(year => {
        const startYear = parseInt(year.split('-')[0]);
        const now = new Date();
        const currentYearNum = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 0-based to 1-based

        // Academic year typically starts in July/August
        if (currentMonth >= 7) {
          return startYear === currentYearNum;
        } else {
          return startYear === currentYearNum - 1;
        }
      });

      if (currentYear) {
        setSelectedAcademicYear(currentYear);
      }

    } catch (error: any) {
      logger.error('Error loading configuration:', error as Error);
      toast.error('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (departmentId: string) => {
    const request = ++requests.current.programs;
    try {
      const result = await curriculumService.getPrograms(departmentId);
      if (request !== requests.current.programs) return;

        setPrograms(result || []);

    } catch (error) {
      if (request !== requests.current.programs) return;
      logger.error('Error loading programs:', error as Error);
      toast.error('Failed to load programs');
      setPrograms([]);
    }
  };

  const loadSemesters = async (programId: string) => {
    const request = ++requests.current.semesters;
    try {
      const result = await curriculumService.getSemesters(programId);
      if (request !== requests.current.semesters) return;

        setSemesters(result || []);

    } catch (error) {
      if (request !== requests.current.semesters) return;
      logger.error('Error loading semesters:', error as Error);
      toast.error('Failed to load semesters');
      setSemesters([]);
    }
  };

  const loadCourses = async (programId: string, semester: number) => {
    const request = ++requests.current.courses;
    try {
      const result = await curriculumService.getCourses(programId, semester);
      if (request !== requests.current.courses) return;

        setCourses(result || []);

    } catch (error) {
      if (request !== requests.current.courses) return;
      logger.error('Error loading courses:', error as Error);
      toast.error('Failed to load courses');
      setCourses([]);
    }
  };

  const loadExistingCurriculum = async () => {
    const request = ++requests.current.curriculum;
    if (!selectedDepartment || !selectedProgram || !selectedSemester || !selectedAcademicYear || !selectedCourse) {
      return;
    }

    try {
      setLoading(true);
      logger.info('Loading existing curriculum with filters:', {
        department_id: selectedDepartment,
        program_id: selectedProgram,
        semester: parseInt(selectedSemester),
        academic_year: selectedAcademicYear,
        course_id: selectedCourse,
      });

      // Get the selected course details
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      if (!selectedCourseData) {
        logger.info('❌ Course not found, clearing curriculum data');
        // Course not found, clear curriculum data
        setCurriculumId(null);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus("draft");
        return;
      }

      // Try to find existing curriculum (including approved/published ones)
      const result = await curriculumService.getCurriculums({
        department_id: selectedDepartment,
        program_id: selectedProgram,
        semester: parseInt(selectedSemester),
        academic_year: selectedAcademicYear,
        course_id: selectedCourse,
        // Don't filter by status - include all statuses
      });
      if (request !== requests.current.curriculum) return;

      logger.info('📊 getCurriculums result:', { value: result });

      if (result.length > 0) {
        logger.info(`Found ${result.length} existing curriculum(s)`);

        // Load existing curriculum (prioritize published/approved over draft)
        const sortedCurriculums = result.sort((a, b) => {
          const statusPriority: Record<string, number> = {
            'published': 3,
            'approved': 2,
            'pending_approval': 1,
            'draft': 0
          };
          return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        });

        const existingCurriculum = sortedCurriculums[0];
        logger.info(`Loading curriculum with status: ${existingCurriculum.status}`);

        const detailResult = await curriculumService.getCurriculumById(existingCurriculum.id);
        if (request !== requests.current.curriculum) return;

          setCurriculumId(detailResult.id);
          setUnits(detailResult.units);
          setLearningOutcomes(detailResult.outcomes);
          setStatus(detailResult.status);

          logger.info(`✅ Curriculum loaded successfully:`, {
            value: {
              id: detailResult.id,
              status: detailResult.status,
              unitsCount: detailResult.units.length,
              outcomesCount: detailResult.outcomes.length,
            }
          });



      } else {
        logger.info('ℹ️ No existing curriculum found - ready to create new');
        // No existing curriculum found - clear state but don't create yet
        setCurriculumId(null);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus("draft");
      }
    } catch (error: any) {
      if (request !== requests.current.curriculum) return;
      logger.error('❌ Error loading curriculum:', error as Error);
      toast.error('Failed to load curriculum');
      // Clear state on error
      setCurriculumId(null);
      setUnits([]);
      setLearningOutcomes([]);
      setStatus("draft");
    } finally {
      if (request === requests.current.curriculum) setLoading(false);
    }
  };

  const createNewCurriculum = async (courseId: string) => {
    try {
      const result = await curriculumService.createCurriculum({
        department_id: selectedDepartment,
        program_id: selectedProgram,
        course_id: courseId,
        academic_year: selectedAcademicYear,
      });


        setCurriculumId(result.id);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus(result.status);
        toast.success('New curriculum created');
        return result.id;

    } catch (error: any) {
      logger.error('Error creating curriculum:', error as Error);
      toast.error('Failed to create curriculum');
      return null;
    }
  };

  // Create curriculum when user tries to add content (if not exists)
  const ensureCurriculumExists = async (): Promise<string | null> => {
    if (loading) {
      toast.error('Please wait for the curriculum to finish loading');
      return null;
    }
    if (curriculumId) {
      return curriculumId; // Already exists
    }

    if (!selectedDepartment || !selectedProgram || !selectedSemester || !selectedAcademicYear || !selectedCourse) {
      toast.error('Please select all context fields first');
      return null;
    }

    // Get the selected course details
    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    if (!selectedCourseData) {
      toast.error('Selected course not found');
      return null;
    }

    // Create new curriculum
    return await createNewCurriculum(selectedCourse);
  };

  // Unit handlers
  const handleAddUnit = async (unit: any) => {
    // Ensure curriculum exists before adding unit
    const currentCurriculumId = await ensureCurriculumExists();
    if (!currentCurriculumId) {
      throw new Error('Select a valid curriculum context before saving');
    }

    try {
      if (unit.id && units.find(u => u.id === unit.id)) {
        // Update existing unit
        const result = await curriculumService.updateUnit(unit.id, {
          name: unit.name,
          code: unit.code,
          description: unit.description,
          credits: unit.credits,
          estimated_duration: unit.estimatedDuration,
          duration_unit: unit.durationUnit,
        });


          setUnits(prev => prev.map(u => u.id === unit.id ? result! : u));
          // If curriculum was approved or published and is being edited, set to draft for re-approval
          if (status === "approved" || status === "published") {
            setStatus("draft");
            toast("Curriculum moved to draft status. Please get approval before publishing again.", {
              icon: "ℹ️",
              duration: 4000,
            });
          } else {
            toast.success('Unit updated successfully');
          }

      } else {
        // Create new unit
        const result = await curriculumService.addUnit({
          curriculum_id: currentCurriculumId,
          name: unit.name,
          code: unit.code,
          description: unit.description,
          credits: unit.credits,
          estimated_duration: unit.estimatedDuration,
          duration_unit: unit.durationUnit,
        });


          setUnits(prev => [...prev, result!]);
          // If curriculum was approved or published and is being edited, set to draft for re-approval
          if (status === "approved" || status === "published") {
            setStatus("draft");
            toast("Curriculum moved to draft status. Please get approval before publishing again.", {
              icon: "ℹ️",
              duration: 4000,
            });
          } else {
            toast.success('Unit added successfully');
          }

      }
    } catch (error: any) {
      logger.error('Error saving unit:', error as Error);
      toast.error(error?.message || 'Failed to save unit');
      throw error;
    }
  };

  const handleDeleteUnit = async (id: string) => {
    const unit = units.find(u => u.id === id);
    const unitName = unit?.name || 'this unit';
    const outcomeCount = learningOutcomes.filter(lo => lo.unit_id === id).length;

    setConfirmModal({
      isOpen: true,
      type: 'deleteUnit',
      title: 'Delete Unit',
      message: `Are you sure you want to delete "${unitName}"?${outcomeCount > 0 ? ` This will also delete ${outcomeCount} associated learning outcome(s).` : ''}`,
      onConfirm: () => confirmDeleteUnit(id),
      itemId: id,
    });
  };

  const confirmDeleteUnit = async (id: string) => {
    try {
      await curriculumService.deleteUnit(id);

        setUnits(prev => prev.filter(u => u.id !== id));
        setLearningOutcomes(prev => prev.filter(lo => lo.unit_id !== id));

        // If curriculum was approved or published, move to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Unit deleted. Curriculum moved to draft status - please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Unit deleted successfully');
        }

    } catch (error: any) {
      logger.error('Error deleting unit:', error as Error);
      toast.error('Failed to delete unit');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddOutcome = async (outcome: any) => {
    // Ensure curriculum exists before adding outcome
    const currentCurriculumId = await ensureCurriculumExists();
    if (!currentCurriculumId) {
      return;
    }

    try {
      if (outcome.id && learningOutcomes.find(lo => lo.id === outcome.id)) {
        // Update existing outcome
        const result = await curriculumService.updateOutcome(outcome.id, {
          unit_id: outcome.unitId,
          outcome_text: outcome.outcome,
          bloom_level: outcome.bloomLevel,
          assessment_mappings: outcome.assessmentMappings,
        });


          setLearningOutcomes(prev => prev.map(lo => lo.id === outcome.id ? result! : lo));
          // If curriculum was approved or published and is being edited, set to draft for re-approval
          if (status === "approved" || status === "published") {
            setStatus("draft");
            toast("Curriculum moved to draft status. Please get approval before publishing again.", {
              icon: "ℹ️",
              duration: 4000,
            });
          } else {
            toast.success('Learning outcome updated successfully');
          }

      } else {
        // Create new outcome
        const result = await curriculumService.addOutcome({
          curriculum_id: currentCurriculumId,
          unit_id: outcome.unitId,
          outcome_text: outcome.outcome,
          bloom_level: outcome.bloomLevel,
          assessment_mappings: outcome.assessmentMappings,
        });


          setLearningOutcomes(prev => [...prev, result!]);
          // If curriculum was approved or published and is being edited, set to draft for re-approval
          if (status === "approved" || status === "published") {
            setStatus("draft");
            toast("Curriculum moved to draft status. Please get approval before publishing again.", {
              icon: "ℹ️",
              duration: 4000,
            });
          } else {
            toast.success('Learning outcome added successfully');
          }

      }
    } catch (error: any) {
      logger.error('Error saving outcome:', error as Error);
      toast.error(error?.message || 'Failed to save outcome');
      throw error;
    }
  };

  const handleDeleteOutcome = async (id: string) => {
    const outcome = learningOutcomes.find(lo => lo.id === id);
    const outcomeText = outcome?.outcome_text?.substring(0, 50) || 'this learning outcome';

    setConfirmModal({
      isOpen: true,
      type: 'deleteOutcome',
      title: 'Delete Learning Outcome',
      message: `Are you sure you want to delete "${outcomeText}${outcome?.outcome_text && outcome.outcome_text.length > 50 ? '...' : ''}"?`,
      onConfirm: () => confirmDeleteOutcome(id),
      itemId: id,
    });
  };

  const confirmDeleteOutcome = async (id: string) => {
    try {
      await curriculumService.deleteOutcome(id);

        setLearningOutcomes(prev => prev.filter(lo => lo.id !== id));

        // If curriculum was approved or published, move to draft for re-approval
        if (status === "approved" || status === "published") {
          setStatus("draft");
          toast("Learning outcome deleted. Curriculum moved to draft status - please get approval before publishing again.", {
            icon: "ℹ️",
            duration: 4000,
          });
        } else {
          toast.success('Learning outcome deleted successfully');
        }

    } catch (error: any) {
      logger.error('Error deleting outcome:', error as Error);
      toast.error('Failed to delete outcome');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveDraft = async () => {
    if (!curriculumId) {
      toast.error('No curriculum to save');
      return;
    }

    // Check if there's actually content to save
    if (units.length === 0 && learningOutcomes.length === 0) {
      toast.error('Add units and learning outcomes before saving');
      return;
    }

    try {
      // Data is already saved when units/outcomes are added, so this is just a confirmation
      toast.success('Draft saved successfully - all changes are automatically saved');
    } catch (error: any) {
      logger.error('Error saving draft:', error as Error);
      toast.error('Failed to save draft');
    }
  };

  const handleApprove = async () => {
    if (!curriculumId) return;

    setConfirmModal({
      isOpen: true,
      type: 'approve',
      title: 'Approve Curriculum',
      message: 'Are you sure you want to approve this curriculum? Once approved, it will be ready for publishing.',
      onConfirm: () => confirmApprove(),
    });
  };

  const confirmApprove = async () => {
    if (!curriculumId) return;

    try {
      await curriculumService.approveCurriculum(curriculumId);

        setStatus("approved");
        toast.success('Curriculum approved successfully!');

    } catch (error: any) {
      logger.error('Error approving curriculum:', error as Error);
      toast.error(error?.message || 'Failed to approve curriculum');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handlePublish = async () => {
    if (!curriculumId) {
      toast.error('No curriculum to publish');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'publish',
      title: 'Publish Curriculum',
      message: 'Are you sure you want to publish this curriculum? It will be immediately available to learners and faculty.',
      onConfirm: () => confirmPublish(),
    });
  };

  const handleRequestApproval = async (message?: string) => {
    if (!curriculumId) {
      toast.error('No curriculum to submit for approval');
      return;
    }

    try {
      const result = await curriculumApprovalService.submitForApproval(curriculumId, message);
      if (result.success) {
        setStatus("pending_approval");
        toast.success('Curriculum submitted for approval! You will be notified when it is reviewed.');
      } else {
        toast.error(result.error || 'Failed to submit curriculum for approval');
      }
    } catch (error: any) {
      logger.error('Error submitting for approval:', error as Error);
      toast.error('Failed to submit curriculum for approval');
    }
  };

  const confirmPublish = async () => {
    if (!curriculumId) return;

    try {
      await curriculumService.publishCurriculum(curriculumId);

        setStatus("published");
        toast.success('Curriculum published successfully! It is now active and available to learners and faculty.');

    } catch (error: any) {
      logger.error('Error publishing curriculum:', error as Error);
      toast.error(error?.message || 'Failed to publish curriculum');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleClone = async (sourceId: string, targetData: any) => {
    try {
      const result = await curriculumService.cloneCurriculum(sourceId, targetData);

        toast.success('Curriculum cloned successfully! You can now edit the new curriculum.');
        // Optionally redirect to the new curriculum or reload current data
        if (result) {
          // If the cloned curriculum is for the same context, reload it
          const isSameContext =
            targetData.academic_year === selectedAcademicYear &&
            (!targetData.department_id || targetData.department_id === selectedDepartment) &&
            (!targetData.program_id || targetData.program_id === selectedProgram) &&
            (!targetData.semester || targetData.semester.toString() === selectedSemester);

          if (isSameContext) {
            // Reload the current curriculum data
            loadExistingCurriculum();
          }
        }

    } catch (error: any) {
      logger.error('Error cloning curriculum:', error as Error);
      toast.error('Failed to clone curriculum');
      throw error;
    }
  };

  // NEW: Refresh curriculum data function for when changes are approved
  const handleRefreshCurriculum = async () => {
    logger.info('🔄 Refreshing curriculum data after approved changes...');
    await loadExistingCurriculum();
  };

  // Export curriculum function
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!curriculumId) {
      toast.error('No curriculum to export. Please add some units first.');
      return;
    }

    try {
      if (format === 'pdf') {
        // Use the same PDF export service as school curriculum builder
        // Validate that we have data to export
        if (!selectedCourse || !selectedDepartment || !selectedProgram || !selectedSemester || !selectedAcademicYear) {
          toast.error('Please select all context fields before exporting.');
          return;
        }

        if (transformedUnits.length === 0) {
          toast.error('No units to export. Please add units first.');
          return;
        }

        // Show loading toast
        const loadingToast = toast.loading('Generating PDF file...');

        // Get department and program names
        const deptInfo = departments.find(d => d.id === selectedDepartment);
        const programInfo = programs.find(p => p.id === selectedProgram);
        const courseInfo = courseOptions.find(c => c.value === selectedCourse);

        // Prepare export data in the same format as school curriculum builder
        const exportData = {
          subject: courseInfo?.label || selectedCourse,
          class: `${programInfo?.name || selectedProgram} - Semester ${selectedSemester}`,
          academicYear: selectedAcademicYear,
          chapters: transformedUnits.map(unit => ({
            id: unit.id,
            name: unit.name,
            code: unit.code,
            description: unit.description,
            order: unit.order,
            estimatedDuration: unit.estimatedDuration,
            durationUnit: unit.durationUnit,
          })),
          learningOutcomes: transformedOutcomes.map(outcome => ({
            id: outcome.id,
            chapterId: outcome.unitId, // Map unitId to chapterId for compatibility
            outcome: outcome.outcome,
            bloomLevel: outcome.bloomLevel,
            assessmentMappings: outcome.assessmentMappings,
          })),
          status: status,
          collegeName: deptInfo?.name || 'College Department', // Changed from schoolName to collegeName
        };

        // Use the same export service as school curriculum builder
        const { exportCurriculum } = await import('@/features/college-admin');
        exportCurriculum('pdf', exportData);

        // Dismiss loading and show success
        toast.dismiss(loadingToast);
        toast.success('Curriculum exported successfully as PDF!', {
          duration: 4000,
          icon: '📥',
        });
        return;
      }

      // Handle CSV export using the service
      const result = await curriculumService.exportCurriculum(curriculumId, format);

        if (format === 'csv' && result.format === 'csv') {
          // Handle CSV export
          const csvContent = result.content.map((row: any[]) =>
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
          ).join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `curriculum-${selectedCourse}-${selectedAcademicYear}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Curriculum exported as CSV successfully!');
        } else {
          // Handle JSON export (fallback)
          const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `curriculum-${selectedCourse}-${selectedAcademicYear}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Curriculum exported successfully!');
        }

    } catch (error: any) {
      logger.error('Error exporting curriculum:', error as Error);
      toast.error('Failed to export curriculum');
    }
  };

  // Generate course options from database
  const courseOptions = courses.map(course => ({
    id: course.id,
    value: course.id,
    label: `${course.course_code} - ${course.course_name}`,
    code: course.course_code,
    name: course.course_name,
    credits: course.credits,
    type: course.type,
  }));

  // Transform units for UI (add order property)
  const transformedUnits = units.map(unit => ({
    id: unit.id,
    name: unit.name,
    code: unit.code,
    description: unit.description,
    order: unit.order_index,
    estimatedDuration: unit.estimated_duration,
    durationUnit: unit.duration_unit as 'hours' | 'weeks' | undefined,
    credits: unit.credits ? Number(unit.credits) : undefined,
  }));

  // Transform outcomes for UI
  const transformedOutcomes = learningOutcomes.map(outcome => ({
    id: outcome.id,
    unitId: outcome.unit_id,
    outcome: outcome.outcome_text,
    bloomLevel: outcome.bloom_level,
    assessmentMappings: outcome.assessment_mappings,
  }));

  return (
    <>
      <CollegeCurriculumBuilderUI
        headerActions={<>
        <CurriculumToolDialog drawer reviewNotifications title="Educator changes" description="Review proposed curriculum changes. Content is updated only after approval." icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}>
          <CourseAccessReview embedded mode="reviews" onReviewed={() => { void loadExistingCurriculum(); }} />
        </CurriculumToolDialog>
        <CurriculumToolDialog title="Import Excel" description="Upload courses, units and learning outcomes as draft curricula." icon={<ArrowUpTrayIcon className="h-5 w-5" />}>
          <CurriculumExcelImport embedded context={{ departmentId: selectedDepartment, programId: selectedProgram, semester: Number(selectedSemester), academicYear: selectedAcademicYear }} onImported={() => { void loadCourses(selectedProgram, Number(selectedSemester)); void loadExistingCurriculum(); }} />
        </CurriculumToolDialog>
        </>}
        // College-specific selections
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={value => { setSelectedDepartment(value); setSelectedProgram(''); setSelectedSemester(''); setSelectedCourse(''); }}
        selectedProgram={selectedProgram}
        setSelectedProgram={value => { setSelectedProgram(value); setSelectedSemester(''); setSelectedCourse(''); }}
        selectedSemester={selectedSemester}
        setSelectedSemester={value => { setSelectedSemester(value); setSelectedCourse(''); }}
        selectedAcademicYear={selectedAcademicYear}
        setSelectedAcademicYear={setSelectedAcademicYear}
        // Configuration data
        courses={courseOptions}
        departments={departments.map(d => ({ id: d.id, name: d.name }))}
        programs={programs.map(p => ({ id: p.id, name: p.name, code: p.code, specializations: p.specializations }))}
        semesters={semesters.map(s => s.toString())}
        academicYears={academicYears}
        // Current data
        curriculumId={curriculumId}
        units={transformedUnits}
        learningOutcomes={transformedOutcomes}
        assessmentTypes={assessmentTypes.map(at => ({ id: at.id, name: at.name, description: at.description }))}
        status={status}
        loading={loading}
        isRealTimeConnected={isRealTimeConnected}
        // Search
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        // Handlers
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onAddOutcome={handleAddOutcome}
        onDeleteOutcome={handleDeleteOutcome}
        onSaveDraft={handleSaveDraft}
        onApprove={handleApprove}
        onPublish={handlePublish}
        onRequestApproval={handleRequestApproval}
        onClone={handleClone}
        onExport={handleExport}
        onRefreshCurriculum={handleRefreshCurriculum}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type === 'deleteUnit' || confirmModal.type === 'deleteOutcome' ? 'danger' : 'warning'}
        confirmText={
          confirmModal.type === 'deleteUnit' ? 'Delete Unit' :
            confirmModal.type === 'deleteOutcome' ? 'Delete Outcome' :
              confirmModal.type === 'approve' ? 'Approve' :
                confirmModal.type === 'publish' ? 'Publish' : 'Confirm'
        }
        cancelText="Cancel"
      />
    </>
  );
};

/**
 * Wrapped CollegeCurriculumBuilder with FeatureGate for curriculum_builder add-on
 */
const CollegeCurriculumBuilder: React.FC = () => (
  <FeatureGate featureKey="curriculum_builder" showUpgradePrompt={true}>
    <CollegeCurriculumBuilderContent />
  </FeatureGate>
);

export default CollegeCurriculumBuilder;

