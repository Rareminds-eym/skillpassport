/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FeatureGate } from '../../../components/Subscription/FeatureGate';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

// Import the college-adapted curriculum builder UI
import CollegeCurriculumBuilderUI from '../../../components/admin/collegeAdmin/CollegeCurriculumBuilderUI';
import { curriculumService, type CurriculumUnit, type CurriculumOutcome } from '../../../services/college/curriculumService';
import { curriculumApprovalService } from '../../../services/curriculumApprovalService';
import { supabase } from '../../../lib/supabaseClient';

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
  
  // Real-time subscription refs
  const subscriptionRef = useRef<any>(null);
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
    onConfirm: () => {},
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
  }, [selectedDepartment]);

  // Load semesters when program changes
  useEffect(() => {
    if (selectedProgram) {
      loadSemesters(selectedProgram);
    } else {
      setSemesters([]);
      setSelectedSemester(''); // Reset semester selection
    }
  }, [selectedProgram]);

  // Load courses when program and semester change
  useEffect(() => {
    if (selectedProgram && selectedSemester) {
      loadCourses(selectedProgram, parseInt(selectedSemester));
    } else {
      setCourses([]);
      setSelectedCourse(''); // Reset course selection
    }
  }, [selectedProgram, selectedSemester]);

  // Load curriculum when context is complete (but don't auto-create)
  useEffect(() => {
    if (selectedDepartment && selectedProgram && selectedSemester && selectedAcademicYear && selectedCourse) {
      loadExistingCurriculum();
    } else {
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

    const setupRealTimeSubscription = () => {
      // Clean up existing subscription
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }

      // Create new subscription for the specific curriculum and its related tables
      const channel = supabase
        .channel(`curriculum-live-${curriculumId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'college_curriculums',
            filter: `id=eq.${curriculumId}` // Only listen to changes for this specific curriculum
          },
          (payload) => {
            console.log('🔄 Real-time curriculum change detected:', payload);
            
            // Auto-refresh curriculum data when changes are detected
            loadExistingCurriculum();

            // Show a subtle notification
            if (payload.eventType === 'UPDATE') {
              toast.success('Curriculum updated', {
                duration: 2000,
                icon: '🔔'
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'curriculum_units',
            filter: `curriculum_id=eq.${curriculumId}` // Listen to unit changes for current curriculum
          },
          (payload) => {
            console.log('🔄 Real-time unit change detected:', payload);
            
            // Refresh curriculum data when units change
            loadExistingCurriculum();
            
            if (payload.eventType === 'INSERT') {
              toast.success('New unit added', { duration: 2000, icon: '📚' });
            } else if (payload.eventType === 'UPDATE') {
              toast.success('Unit updated', { duration: 2000, icon: '📝' });
            } else if (payload.eventType === 'DELETE') {
              toast.success('Unit removed', { duration: 2000, icon: '🗑️' });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'curriculum_learning_outcomes',
            filter: `curriculum_id=eq.${curriculumId}` // Listen to outcome changes for current curriculum
          },
          (payload) => {
            console.log('🔄 Real-time outcome change detected:', payload);
            
            // Refresh curriculum data when outcomes change
            loadExistingCurriculum();
            
            if (payload.eventType === 'INSERT') {
              toast.success('New learning outcome added', { duration: 2000, icon: '🎯' });
            } else if (payload.eventType === 'UPDATE') {
              toast.success('Learning outcome updated', { duration: 2000, icon: '✏️' });
            } else if (payload.eventType === 'DELETE') {
              toast.success('Learning outcome removed', { duration: 2000, icon: '🗑️' });
            }
          }
        )
        .subscribe((status) => {
          console.log('🔌 Real-time subscription status:', status);
          setIsRealTimeConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time updates enabled for curriculum changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error');
            // Retry connection after 5 seconds
            setTimeout(setupRealTimeSubscription, 5000);
          }
        });

      subscriptionRef.current = channel;
    };

    setupRealTimeSubscription();

    // Cleanup on unmount or curriculum change
    return () => {
      if (subscriptionRef.current) {
        console.log('🔌 Cleaning up real-time subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsRealTimeConnected(false);
    };
  }, [curriculumId]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);

      // Load departments
      const deptResult = await curriculumService.getDepartments();
      if (deptResult.success) {
        setDepartments(deptResult.data || []);
      } else {
        toast.error('Failed to load departments');
      }

      // Load assessment types
      const assessmentResult = await curriculumService.getAssessmentTypes();
      if (assessmentResult.success) {
        setAssessmentTypes(assessmentResult.data || []);
      } else {
        toast.error('Failed to load assessment types');
      }

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
      console.error('Error loading configuration:', error);
      toast.error('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (departmentId: string) => {
    try {
      const result = await curriculumService.getPrograms(departmentId);
      if (result.success) {
        setPrograms(result.data || []);
      } else {
        toast.error('Failed to load programs');
        setPrograms([]);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
      setPrograms([]);
    }
  };

  const loadSemesters = async (programId: string) => {
    try {
      const result = await curriculumService.getSemesters(programId);
      if (result.success) {
        setSemesters(result.data || []);
      } else {
        toast.error('Failed to load semesters');
        setSemesters([]);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast.error('Failed to load semesters');
      setSemesters([]);
    }
  };

  const loadCourses = async (programId: string, semester: number) => {
    try {
      const result = await curriculumService.getCourses(programId, semester);
      if (result.success) {
        setCourses(result.data || []);
      } else {
        toast.error('Failed to load courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    }
  };

  const loadExistingCurriculum = async () => {
    if (!selectedDepartment || !selectedProgram || !selectedSemester || !selectedAcademicYear || !selectedCourse) {
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading existing curriculum with filters:', {
        department_id: selectedDepartment,
        program_id: selectedProgram,
        semester: parseInt(selectedSemester),
        academic_year: selectedAcademicYear,
        course_id: selectedCourse,
      });

      // Get the selected course details
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      if (!selectedCourseData) {
        console.log('❌ Course not found, clearing curriculum data');
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

      console.log('📊 getCurriculums result:', result);

      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ Found ${result.data.length} existing curriculum(s)`);
        
        // Load existing curriculum (prioritize published/approved over draft)
        const sortedCurriculums = result.data.sort((a, b) => {
          const statusPriority: Record<string, number> = { 
            'published': 3, 
            'approved': 2, 
            'pending_approval': 1, 
            'draft': 0 
          };
          return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
        });
        
        const existingCurriculum = sortedCurriculums[0];
        console.log(`📋 Loading curriculum with status: ${existingCurriculum.status}`);
        
        const detailResult = await curriculumService.getCurriculumById(existingCurriculum.id);
        if (detailResult.success && detailResult.data) {
          setCurriculumId(detailResult.data.id);
          setUnits(detailResult.data.units);
          setLearningOutcomes(detailResult.data.outcomes);
          setStatus(detailResult.data.status);
          
          console.log(`✅ Curriculum loaded successfully:`, {
            id: detailResult.data.id,
            status: detailResult.data.status,
            unitsCount: detailResult.data.units.length,
            outcomesCount: detailResult.data.outcomes.length,
          });
          
          toast.success(`Existing curriculum loaded (${detailResult.data.status})`);
        } else {
          console.error('❌ Failed to load curriculum details:', detailResult.error);
          toast.error('Failed to load curriculum details');
        }
      } else {
        console.log('ℹ️ No existing curriculum found - ready to create new');
        // No existing curriculum found - clear state but don't create yet
        setCurriculumId(null);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus("draft");
      }
    } catch (error: any) {
      console.error('❌ Error loading curriculum:', error);
      toast.error('Failed to load curriculum');
      // Clear state on error
      setCurriculumId(null);
      setUnits([]);
      setLearningOutcomes([]);
      setStatus("draft");
    } finally {
      setLoading(false);
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

      if (result.success && result.data) {
        setCurriculumId(result.data.id);
        setUnits([]);
        setLearningOutcomes([]);
        setStatus(result.data.status);
        toast.success('New curriculum created');
        return result.data.id;
      } else {
        toast.error(result.error?.message || 'Failed to create curriculum');
        return null;
      }
    } catch (error: any) {
      console.error('Error creating curriculum:', error);
      toast.error('Failed to create curriculum');
      return null;
    }
  };

  // Create curriculum when user tries to add content (if not exists)
  const ensureCurriculumExists = async (): Promise<string | null> => {
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
      return;
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

        if (result.success && result.data) {
          setUnits(prev => prev.map(u => u.id === unit.id ? result.data! : u));
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
          toast.error(result.error?.message || 'Failed to update unit');
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

        if (result.success && result.data) {
          setUnits(prev => [...prev, result.data!]);
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
        } else {
          toast.error(result.error?.message || 'Failed to add unit');
        }
      }
    } catch (error: any) {
      console.error('Error saving unit:', error);
      toast.error('Failed to save unit');
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
      const result = await curriculumService.deleteUnit(id);
      if (result.success) {
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
      } else {
        toast.error(result.error?.message || 'Failed to delete unit');
      }
    } catch (error: any) {
      console.error('Error deleting unit:', error);
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

        if (result.success && result.data) {
          setLearningOutcomes(prev => prev.map(lo => lo.id === outcome.id ? result.data! : lo));
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
          toast.error(result.error?.message || 'Failed to update outcome');
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

        if (result.success && result.data) {
          setLearningOutcomes(prev => [...prev, result.data!]);
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
        } else {
          toast.error(result.error?.message || 'Failed to add outcome');
        }
      }
    } catch (error: any) {
      console.error('Error saving outcome:', error);
      toast.error('Failed to save outcome');
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
      const result = await curriculumService.deleteOutcome(id);
      if (result.success) {
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
      } else {
        toast.error(result.error?.message || 'Failed to delete outcome');
      }
    } catch (error: any) {
      console.error('Error deleting outcome:', error);
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
      console.error('Error saving draft:', error);
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
      const result = await curriculumService.approveCurriculum(curriculumId);
      if (result.success) {
        setStatus("approved");
        toast.success('Curriculum approved successfully!');
      } else {
        toast.error(result.error?.message || 'Failed to approve curriculum');
      }
    } catch (error: any) {
      console.error('Error approving curriculum:', error);
      toast.error('Failed to approve curriculum');
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
      message: 'Are you sure you want to publish this curriculum? It will be immediately available to students and faculty.',
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
      console.error('Error submitting for approval:', error);
      toast.error('Failed to submit curriculum for approval');
    }
  };

  const confirmPublish = async () => {
    if (!curriculumId) return;
    
    try {
      const result = await curriculumService.publishCurriculum(curriculumId);
      if (result.success) {
        setStatus("published");
        toast.success('Curriculum published successfully! It is now active and available to students and faculty.');
      } else {
        toast.error(result.error?.message || 'Failed to publish curriculum');
      }
    } catch (error: any) {
      console.error('Error publishing curriculum:', error);
      toast.error('Failed to publish curriculum');
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleClone = async (sourceId: string, targetData: any) => {
    try {
      const result = await curriculumService.cloneCurriculum(sourceId, targetData);
      if (result.success) {
        toast.success('Curriculum cloned successfully! You can now edit the new curriculum.');
        // Optionally redirect to the new curriculum or reload current data
        if (result.data) {
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
      } else {
        toast.error(result.error?.message || 'Failed to clone curriculum');
      }
    } catch (error: any) {
      console.error('Error cloning curriculum:', error);
      toast.error('Failed to clone curriculum');
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
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
        const { exportCurriculum } = await import('@/services/curriculumExportService');
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
      if (result.success && result.data) {
        if (format === 'csv' && result.data.format === 'csv') {
          // Handle CSV export
          const csvContent = result.data.content.map((row: any[]) => 
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
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
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
      } else {
        toast.error(result.error?.message || 'Failed to export curriculum');
      }
    } catch (error: any) {
      console.error('Error exporting curriculum:', error);
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
        courses={courseOptions}
        departments={departments.map(d => ({ id: d.id, name: d.name }))}
        programs={programs.map(p => ({ id: p.id, name: p.name }))}
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
