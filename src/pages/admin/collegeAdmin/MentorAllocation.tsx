import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserGroupIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserPlusIcon,
  ExclamationCircleIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';
import { supabase } from '@/shared/api/supabaseClient';

import { getLogger } from '@/shared/config/logging';
import { useMentorAllocation } from '@/features/college-admin/model/useMentorAllocation';
import { findAllocationId, updateMentorAllocation } from "@/features/college-admin";
import { SearchBar } from '@/shared/ui';
import { KPICard } from '@/features/analytics';
import { Pagination } from '@/shared/ui';
import { useUser } from '@/shared/model/authStore';
import {
  LearnerSelectionModal,
  MentorSelectionModal,
  AllocationConfigurationModal,
  InterventionModal,
  InterventionFeedbackModal,
  MentorDetailsModal as MentorDetailsDrawer,
  ReassignModal,
  MentorCapacityModal
} from '@/features/college-admin';

// Legacy interfaces for compatibility with existing modals
interface LegacyLearner {
  id: number;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  cgpa: number;
  atRisk: boolean;
  email: string;
  batch: string;
  riskFactors?: string[];
  lastInteraction?: string;
  interventionCount?: number;
}

interface LegacyMentorAllocation {
  id: number;
  mentorId: number;
  learners: LegacyLearner[];
  allocationPeriod: {
    startDate: string;
    endDate: string;
  };
  capacity: number;
  officeLocation: string;
  availableHours: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  academicYear: string;
  semester: string; // Added for compatibility with modal components
}

interface LegacyMentor {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  specializations?: string[];
  contactNumber?: string;
  // Additional faculty information
  qualification?: string;
  specialization?: string;
  experienceYears?: number;
  dateOfJoining?: string;
  gender?: string;
  address?: string;
  employeeId?: string;
  allocations: LegacyMentorAllocation[];
}

const MentorAllocation: React.FC = () => {
  const logger = getLogger('college-admin-mentor-allocation');
  const navigate = useNavigate();
  const user = useUser();
  const [collegeId, setCollegeId] = useState<string>('');
  
  // Fetch college ID
  React.useEffect(() => {
    const fetchCollegeId = async () => {
      if (!user?.id) return;
      
      try {
        const { data: lecturerData } = await supabase
          .from('college_lecturers')
          .select('collegeId')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (lecturerData?.collegeId) {
          setCollegeId(lecturerData.collegeId);
          return;
        }

        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('admin_id', user.id)
          .eq('organization_type', 'college')
          .maybeSingle();

        if (orgData?.id) {
          setCollegeId(orgData.id);
        }
      } catch (error) {
        logger.error('Error fetching college ID:', error as Error);
      }
    };

    fetchCollegeId();
  }, [user]);
  
  // Use the dynamic hook
  const {
    mentors: dynamicMentors,
    learners: dynamiclearners,
    unallocatedlearners: dynamicUnallocatedlearners,
    periods,
    uniqueDepartments,
    uniqueBatches,
    loading,
    error,
    allocatelearners,
    addMentorNote,
    reassignLearner,
    createPeriod,
    updatePeriod,
    getMentorCurrentLoad,
    getMentorAtRisklearners,
    notes: dynamicNotes, // Get notes from the hook
    updateNoteFeedback,
    markNoteResolved,
    refetch,
  } = useMentorAllocation(collegeId);

  // Transform dynamic data to legacy format for compatibility
  const transformlearnerToLegacy = (learner: any): LegacyLearner => ({
    id: parseInt(learner.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number
    name: learner.name || '',
    rollNo: learner.roll_number || '',
    department: learner.department_name || learner.program_name || '',
    semester: learner.semester || 1,
    cgpa: parseFloat(learner.current_cgpa?.toString() || '0'),
    atRisk: learner.at_risk || false,
    email: learner.email || '',
    batch: learner.batch || '',
    riskFactors: learner.risk_factors || [],
    lastInteraction: learner.last_interaction || undefined,
    interventionCount: learner.intervention_count || 0,
  });

  const transformMentorToLegacy = (mentor: any): LegacyMentor => ({
    id: parseInt(mentor.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number
    name: `${mentor.first_name} ${mentor.last_name}`.trim(),
    email: mentor.email || '',
    department: mentor.department || '',
    designation: mentor.designation || 'Faculty',
    specializations: mentor.subject_expertise?.map((exp: any) => exp.name) || [],
    contactNumber: mentor.phone || undefined,
    // Additional faculty information
    qualification: mentor.qualification,
    specialization: mentor.specialization,
    experienceYears: mentor.experience_years,
    dateOfJoining: mentor.date_of_joining,
    gender: mentor.gender,
    address: mentor.address,
    employeeId: mentor.employee_id,
    allocations: mentor.allocations?.map((allocation: any) => {
      // Ensure period exists - if not, try to find it from periods array
      let period = allocation.period;
      if (!period && allocation.period_id) {
        period = periods.find(p => p.id === allocation.period_id);
      }
      
      return {
        id: parseInt(allocation.id.replace(/-/g, '').substring(0, 8), 16),
        mentorId: parseInt(mentor.id.replace(/-/g, '').substring(0, 8), 16),
        learners: allocation.learners?.map(transformlearnerToLegacy) || [],
        period: period, // Keep the original period object
        allocationPeriod: {
          startDate: period?.start_date || '',
          endDate: period?.end_date || '',
        },
        capacity: period?.default_mentor_capacity || 15,
        officeLocation: period?.default_office_location || '',
        availableHours: period?.default_available_hours || '',
        status: 'active' as const,
        createdAt: allocation.created_at || '',
        createdBy: allocation.assigned_by || '',
        academicYear: period?.academic_year || '',
        semester: 'All', // Added for compatibility with modal components
      };
    }) || [],
  });

  // Convert dynamic data to legacy format
  const mentors = dynamicMentors.map(transformMentorToLegacy);
  const availablelearners = dynamicUnallocatedlearners.map(transformlearnerToLegacy);
  const unallocatedlearners = availablelearners; // Alias for compatibility

  // All allocations across all mentors (for audit trail)
  const allAllocations = mentors.flatMap(mentor => mentor.allocations);

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mentorDetailsRefreshKey, setMentorDetailsRefreshKey] = useState(0);
  const [isRemovingLearner, setIsRemovingLearner] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 mentors per page

  // Modal States
  const [showlearnerSelectionModal, setShowlearnerSelectionModal] = useState(false);
  const [showMentorSelectionModal, setShowMentorSelectionModal] = useState(false);
  const [showAllocationConfigModal, setShowAllocationConfigModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showMentorDetailsModal, setShowMentorDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showAddlearnersModal, setShowAddlearnersModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Selected Items
  const [selectedMentor, setSelectedMentor] = useState<LegacyMentor | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<LegacyLearner | null>(null);
  const [selectedlearnersForAllocation, setSelectedlearnersForAllocation] = useState<number[]>([]);
  const [selectedMentorForAllocation, setSelectedMentorForAllocation] = useState<LegacyMentor | null>(null);
  const [learnerToReassign, setlearnerToReassign] = useState<LegacyLearner | null>(null);
  const [mentorForCapacityConfig, setMentorForCapacityConfig] = useState<LegacyMentor | null>(null);
  const [allocationForConfig, setAllocationForConfig] = useState<LegacyMentorAllocation | null>(null);
  const [mentorForAddinglearners, setMentorForAddinglearners] = useState<LegacyMentor | null>(null);
  const [selectedNoteForFeedback, setSelectedNoteForFeedback] = useState<any>(null);
  const [assignedlearnersInfo, setAssignedlearnersInfo] = useState<Array<{ learnerId: number; mentorName: string }>>([]);
  const [allocationForAddinglearners, setAllocationForAddinglearners] = useState<LegacyMentorAllocation | null>(null);

  // Intervention Form States
  const [noteText, setNoteText] = useState("");
  const [noteOutcome, setNoteOutcome] = useState("");
  const [interventionType, setInterventionType] = useState<'academic' | 'personal' | 'career' | 'attendance' | 'behavioral' | 'financial' | 'other'>('academic');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState<'pending' | 'in-progress' | 'completed' | 'escalated'>('pending');
  const [notePriority, setNotePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Computed Values - Updated for allocation-based structure
  const filteredMentors = useMemo(() => {
    return mentors.filter(
      (m) =>
        // Only show mentors who have active allocations with learners
        m.allocations.some(allocation => 
          allocation.status === 'active' && allocation.learners.length > 0
        ) &&
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedDepartment === "all" || m.department === selectedDepartment) &&
        // Add batch filtering - check if mentor has learners from selected batch
        (selectedBatch === "all" || m.allocations.some(allocation =>
          allocation.learners.some(learner => learner.batch === selectedBatch)
        ))
    );
  }, [mentors, searchQuery, selectedDepartment, selectedBatch]);

  // Calculate filtered statistics based on current filters
  const filteredStatistics = useMemo(() => {
    // Get all learners from filtered mentors
    const filteredMentorlearners = filteredMentors.flatMap(mentor =>
      mentor.allocations.flatMap(allocation => allocation.learners)
    );
    
    // Remove duplicates (same learner might appear in multiple allocations)
    const uniqueLearnerIds = new Set(filteredMentorlearners.map(s => s.id));
    const uniqueFilteredlearners = Array.from(uniqueLearnerIds).map(id =>
      filteredMentorlearners.find(s => s.id === id)!
    );
    
    // Calculate at-risk learners from filtered mentors
    const filteredAtRisklearners = uniqueFilteredlearners.filter(s => s.atRisk);
    
    // Calculate interventions from filtered mentors
    const filteredMentorUuids = filteredMentors.map(mentor => {
      return dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentor.id
      )?.id;
    }).filter(Boolean);
    
    const filteredInterventions = dynamicNotes.filter(note => 
      filteredMentorUuids.includes(note.mentor_id)
    );

    return {
      totalMentors: filteredMentors.length,
      allocatedlearners: uniqueFilteredlearners.length,
      totalAtRisk: filteredAtRisklearners.length,
      totalInterventions: filteredInterventions.length,
    };
  }, [filteredMentors, dynamicMentors, dynamicNotes]);

  // Pagination calculations
  const totalMentors = filteredMentors.length;
  const totalPages = Math.ceil(totalMentors / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMentors = filteredMentors.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment, selectedBatch]);

  const uniqueBatchesComputed = useMemo(() => {
    return uniqueBatches;
  }, [uniqueBatches]);

  const uniqueDepartmentsComputed = useMemo(() => {
    return uniqueDepartments;
  }, [uniqueDepartments]);

  // Helper functions for mentor statistics (now using dynamic data)
  const getMentorCurrentLoadLegacy = (mentorId: number) => {
    const mentorUuid = dynamicMentors.find(m => 
      parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorId
    )?.id;
    return mentorUuid ? getMentorCurrentLoad(mentorUuid) : 0;
  };

  const getMentorActiveAllocationsLegacy = (mentorId: number) => {
    const mentor = mentors.find(m => m.id === mentorId);
    return mentor?.allocations.filter(a => a.status === 'active') || [];
  };

  const getMentorAtRisklearnersLegacy = (mentorId: number) => {
    const mentorUuid = dynamicMentors.find(m => 
      parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorId
    )?.id;
    return mentorUuid ? getMentorAtRisklearners(mentorUuid).map(transformlearnerToLegacy) : [];
  };

  // Event Handlers
  const handleStartAllocation = async () => {
    setSelectedlearnersForAllocation([]);
    
    // Fetch assigned learners info
    try {
      logger.info('Fetching assigned learners info...');
      
      const { data: allocations, error } = await supabase
        .from('college_mentor_learner_allocations')
        .select(`
          learner_id,
          mentor_id
        `)
        .in('status', ['active', 'pending']);
      
      // Fetch mentor names separately
      let allocationsWithMentors = allocations;
      if (allocations && allocations.length > 0) {
        const mentorIds = [...new Set(allocations.map(a => a.mentor_id))];
        const { data: mentorsData } = await supabase
          .from('college_lecturers')
          .select('id, first_name, last_name')
          .in('id', mentorIds);
        
        const mentorMap = new Map(mentorsData?.map(m => [m.id, m]) || []);
        allocationsWithMentors = allocations.map(allocation => ({
          ...allocation,
          college_lecturers: mentorMap.get(allocation.mentor_id)
        }));
      }

      logger.info('Allocations query result:', { allocationsCount: allocationsWithMentors?.length, error });

      if (!error && allocationsWithMentors) {
        const assignedInfo = allocationsWithMentors.map(allocation => {
          // Find the learner in dynamiclearners to get the legacy ID
          const learner = dynamiclearners.find(s => s.id === allocation.learner_id);
          if (!learner) {
            logger.warn('Learner not found for allocation:', { learnerId: allocation.learner_id });
            return null;
          }
          
          const learnerLegacyId = parseInt(learner.id.replace(/-/g, '').substring(0, 8), 16);
          const mentorName = allocation.college_lecturers 
            ? `${allocation.college_lecturers.first_name} ${allocation.college_lecturers.last_name}`.trim()
            : 'Unknown Mentor';
          
          logger.info('Mapped learner:', {
            uuid: learner.id,
            legacyId: learnerLegacyId,
            name: learner.name,
            mentorName
          });
          
          return {
            learnerId: learnerLegacyId,
            mentorName
          };
        }).filter(Boolean) as Array<{ learnerId: number; mentorName: string }>;
        
        logger.info('Final assigned learners info:', { count: assignedInfo.length });
        setAssignedlearnersInfo(assignedInfo);
      } else if (error) {
        logger.error('Error fetching allocations:', error as Error);
      }
    } catch (error) {
      logger.error('Error fetching assigned learners:', error as Error);
    }
    
    setShowlearnerSelectionModal(true);
  };

  const handlelearnerSelectionComplete = (learnerIds: number[]) => {
    setSelectedlearnersForAllocation(learnerIds);
    setShowlearnerSelectionModal(false);
    setShowMentorSelectionModal(true);
  };

  const handleMentorSelectionComplete = (mentorId: number) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      setSelectedMentorForAllocation(mentor);
      setShowMentorSelectionModal(false);
      setShowAllocationConfigModal(true);
    }
  };

  const handleBackToMentorSelection = () => {
    setShowAllocationConfigModal(false);
    setShowMentorSelectionModal(true);
    // Keep selectedlearnersForAllocation and selectedMentorForAllocation for navigation
  };

  const handleBackTolearnerSelection = () => {
    setShowMentorSelectionModal(false);
    setShowlearnerSelectionModal(true);
    // Keep selectedlearnersForAllocation for navigation
  };

  const handleAllocatelearners = async (
    mentorId: number, 
    learnerIds: number[],
    allocationPeriod: {startDate: string; endDate: string},
    capacityConfig: {capacity: number; officeLocation: string; availableHours: string}
  ) => {
    try {
      // Convert legacy IDs back to UUIDs
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorId
      )?.id;
      
      const learnerUuids = learnerIds.map(id => 
        dynamicUnallocatedlearners.find(s => 
          parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === id
        )?.id
      ).filter(Boolean) as string[];

      if (!mentorUuid || learnerUuids.length === 0) {
        toast.error('Invalid mentor or learner selection');
        return;
      }

      // ✅ VALIDATION: Check if any learners are already assigned to a mentor
      const { data: existingAllocations, error: checkError } = await supabase
        .from('college_mentor_learner_allocations')
        .select(`
          learner_id,
          mentor_id
        `)
        .in('learner_id', learnerUuids)
        .eq('status', 'active');

      if (checkError) {
        logger.error('Error checking existing allocations:', checkError as Error);
        toast.error('Failed to validate learner assignments');
        return;
      }

      if (existingAllocations && existingAllocations.length > 0) {
        // Fetch mentor names separately
        const mentorIds = [...new Set(existingAllocations.map(a => a.mentor_id))];
        const { data: mentorsData } = await supabase
          .from('college_lecturers')
          .select('id, first_name, last_name')
          .in('id', mentorIds);
        
        const mentorMap = new Map(mentorsData?.map(m => [m.id, m]) || []);
        
        // Build error message with mentor names
        const alreadyAssignedlearners = existingAllocations.map(allocation => {
          const learner = dynamicUnallocatedlearners.find(s => s.id === allocation.learner_id);
          const mentor = mentorMap.get(allocation.mentor_id);
          const mentorName = mentor 
            ? `${mentor.first_name} ${mentor.last_name}`.trim()
            : 'Unknown Mentor';
          return {
            learnerName: learner?.name || 'Unknown Learner',
            mentorName
          };
        });

        const errorMessage = alreadyAssignedlearners.length === 1
          ? `${alreadyAssignedlearners[0].learnerName} is already assigned to ${alreadyAssignedlearners[0].mentorName}`
          : `${alreadyAssignedlearners.length} learners are already assigned to mentors:\n${alreadyAssignedlearners.map(s => `• ${s.learnerName} → ${s.mentorName}`).join('\n')}`;

        toast.error(errorMessage, { duration: 5000 });
        return;
      }

      // Get the first available lecturer for foreign key constraints
      const firstLecturer = dynamicMentors.length > 0 ? dynamicMentors[0].id : null;
      
      if (!firstLecturer) {
        toast.error('No lecturers found. Please add lecturers before creating mentor periods.');
        return;
      }

      // Check if there's an active period for this college that contains the allocation dates
      // The allocation dates should fall within the period's date range
      let activePeriod = periods.find(p => {
        if (!p.is_active || p.college_id !== collegeId) {
          return false;
        }
        
        // Check if allocation dates fall within period's date range
        const allocationStart = new Date(allocationPeriod.startDate);
        const allocationEnd = new Date(allocationPeriod.endDate);
        const periodStart = new Date(p.start_date);
        const periodEnd = new Date(p.end_date);
        
        // Allocation must be completely within the period
        return allocationStart >= periodStart && allocationEnd <= periodEnd;
      });
      
      if (!activePeriod) {
        // No existing period contains the allocation date range, create a new period
        logger.info('No period found containing dates:', { allocationPeriod });
        logger.info('Available periods:', { periods: periods.map(p => ({
          name: p.name,
          start: p.start_date,
          end: p.end_date,
          active: p.is_active
        })) });
        
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        
        // Create a unique name based on the dates
        const startDate = new Date(allocationPeriod.startDate);
        const endDate = new Date(allocationPeriod.endDate);
        const periodName = `Mentoring Period ${startDate.getFullYear()}-${endDate.getFullYear()} (${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`;
        
        const defaultPeriodData = {
          college_id: collegeId,
          name: periodName,
          academic_year: academicYear,
          start_date: allocationPeriod.startDate,
          end_date: allocationPeriod.endDate,
          default_mentor_capacity: capacityConfig.capacity,
          default_office_location: capacityConfig.officeLocation,
          default_available_hours: capacityConfig.availableHours,
          is_active: true,
          created_by: firstLecturer,
        };

        try {
          activePeriod = await createPeriod(defaultPeriodData);
          logger.info('New period created successfully:', { periodId: activePeriod?.id, periodName: activePeriod?.name });
          
          // Wait a moment for the period to be available in the database
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (periodError) {
          logger.error('Error creating new period:', periodError as Error);
          toast.error('Failed to create mentor period. Please try again.');
          return;
        }
      } else {
        logger.info('Using existing period:', {
          id: activePeriod.id,
          name: activePeriod.name,
          start: activePeriod.start_date,
          end: activePeriod.end_date,
          allocationStart: allocationPeriod.startDate,
          allocationEnd: allocationPeriod.endDate
        });
      }

      // Verify the period exists and is valid
      if (!activePeriod || !activePeriod.id) {
        logger.error('No valid period available');
        toast.error('Failed to find or create a valid mentor period. Please try again.');
        return;
      }

      logger.info('Proceeding with allocation using period:', {
        periodId: activePeriod.id,
        periodName: activePeriod.name,
        mentorUuid,
        learnerCount: learnerUuids.length
      });

      // Now allocate learners using the active period
      await allocatelearners(mentorUuid, learnerUuids, activePeriod.id, firstLecturer);
      
      toast.success(`Successfully allocated ${learnerUuids.length} learners to mentor`);
      
      // Reset states
      setShowAllocationConfigModal(false);
      setSelectedlearnersForAllocation([]);
      setSelectedMentorForAllocation(null);
      setAssignedlearnersInfo([]); // Clear assigned learners cache to force refresh on next allocation
    } catch (error) {
      logger.error('Error allocating learners:', error as Error);
      toast.error('Failed to allocate learners. Please try again.');
    }
  };

  const handleAddIntervention = async () => {
    if (!selectedMentor || !selectedLearner || !noteText) return;

    try {
      // Find the allocation ID for this mentor-learner pair
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === selectedMentor.id
      )?.id;
      
      const learnerUuid = dynamiclearners.find(s => 
        parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === selectedLearner.id
      )?.id;

      if (!mentorUuid || !learnerUuid) {
        toast.error('Invalid mentor or learner selection');
        return;
      }

      // IMPORTANT: Admin-created notes MUST always start with status = 'pending'
      // This ensures the workflow starts correctly: pending → acknowledged → in_progress → completed
      await addMentorNote('', mentorUuid, learnerUuid, {
        title: `Intervention - ${interventionType}`,
        note_text: noteText,
        outcome: noteOutcome,
        intervention_type: interventionType,
        status: 'pending', // ALWAYS 'pending' for admin-created notes
        is_private: isPrivateNote,
        priority: notePriority,
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired ? followUpDate : undefined,
        created_by_role: 'admin',
        created_by_id: user?.id,
      });

      // Reset form
      setNoteText("");
      setNoteOutcome("");
      setInterventionType('academic');
      setIsPrivateNote(false);
      setNoteStatus('pending'); // Reset to pending
      setNotePriority('medium');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setShowInterventionModal(false);
      
      toast.success('Intervention note added successfully');
    } catch (error) {
      logger.error('Error adding intervention:', error as Error);
      toast.error('Failed to add intervention note. Please try again.');
    }
  };

  const handleViewNoteFeedback = (note: any) => {
    setSelectedNoteForFeedback(note);
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async (feedback: {
    admin_feedback?: string;
    priority?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
  }) => {
    if (!selectedNoteForFeedback) return;

    try {
      // Server-side validation will check if status is 'acknowledged'
      // and auto-transition to 'in_progress'
      await updateNoteFeedback(selectedNoteForFeedback.id, feedback);
      setShowFeedbackModal(false);
      setSelectedNoteForFeedback(null);
      toast.success('Feedback saved successfully');
    } catch (error: any) {
      logger.error('Error saving feedback:', error as Error);
      const errorMessage = error?.message || 'Failed to save feedback. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleResolveNote = async () => {
    if (!selectedNoteForFeedback) return;

    try {
      // Server-side validation will check if status is 'in_progress'
      // before allowing resolution
      await markNoteResolved(selectedNoteForFeedback.id);
      setShowFeedbackModal(false);
      setSelectedNoteForFeedback(null);
      toast.success('Note resolved successfully');
    } catch (error: any) {
      logger.error('Error resolving note:', error as Error);
      const errorMessage = error?.message || 'Failed to resolve note. Please try again.';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleReassignLearner = async (newMentorId: number, newPeriodId: number) => {
    if (!learnerToReassign) return;

    try {
      // Convert legacy IDs to UUIDs
      const newMentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === newMentorId
      )?.id;

      const learnerUuid = dynamiclearners.find(s => 
        parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === learnerToReassign.id
      )?.id;

      // Convert period ID to UUID
      const newPeriodUuid = periods.find(p => 
        parseInt(p.id.replace(/-/g, '').substring(0, 8), 16) === newPeriodId
      )?.id;

      if (!newMentorUuid || !learnerUuid || !newPeriodUuid) {
        toast.error('Invalid mentor, learner, or period selection');
        return;
      }

      // Find the current mentor for this learner
      const currentMentorUuid = dynamicMentors.find(m => 
        m.allocations?.some(allocation => 
          allocation.learners?.some(s => s.id === learnerUuid)
        )
      )?.id;

      if (!currentMentorUuid) {
        toast.error('Unable to find current mentor allocation for this learner');
        return;
      }

      // Find the actual allocation ID
      const allocationId = await findAllocationId(currentMentorUuid, learnerUuid, 'active');
      
      if (!allocationId) {
        toast.error('No active allocation found for this learner. Please check the allocation status.');
        return;
      }

      // Store the current mentor ID before reassignment
      const currentMentorId = selectedMentor?.id;
      
      logger.info('Starting reassignment process...');
      
      // Perform the reassignment (this will call fetchData() internally and update state)
      await reassignLearner(allocationId, newMentorUuid, newPeriodUuid, 'Reassigned by admin');
      
      logger.info('Reassignment completed, data refreshed');
      
      // Close modals
      setShowReassignModal(false);
      setlearnerToReassign(null);
      
      // Show success message
      toast.success('Learner reassigned successfully');
      
      // Force a re-render of the drawer by incrementing the refresh key
      // The drawer will automatically pick up the updated mentor data from the mentors array
      // because React will re-render the component after the state updates from fetchData()
      logger.info('Forcing drawer refresh...');
      setMentorDetailsRefreshKey(prev => prev + 1);
      
      // Update the selected mentor reference to trigger drawer update
      // We need to wait a tick for React to process the state updates from fetchData()
      setTimeout(() => {
        if (currentMentorId) {
          const refreshedMentor = mentors.find(m => m.id === currentMentorId);
          if (refreshedMentor) {
            logger.info('Updating drawer with refreshed mentor:', {
              mentorId: refreshedMentor.id,
              mentorName: refreshedMentor.name,
              totalAllocations: refreshedMentor.allocations.length,
              totallearners: refreshedMentor.allocations.reduce((sum, a) => sum + a.learners.length, 0)
            });
            setSelectedMentor(refreshedMentor);
          } else {
            logger.warn('Could not find refreshed mentor in updated array');
          }
        }
      }, 100); // Small delay to ensure React has processed state updates
    } catch (error) {
      logger.error('Error reassigning learner:', error as Error);
      toast.error('Failed to reassign learner. Please try again.');
    }
  };

  const handleCapacityConfiguration = async (
    allocationId: number, 
    config: {capacity: number; officeLocation: string; availableHours: string}
  ) => {
    try {
      logger.info('Starting update for allocation:', { allocationId });
      logger.info('New config:', config);
      
      // Find the allocation to get the period ID
      const allocation = allAllocations.find(a => a.id === allocationId);
      if (!allocation) {
        logger.error('Allocation not found:', { allocationId });
        toast.error('Allocation not found');
        return;
      }

      logger.info('Found allocation:', { allocationId, periodId: allocation.period?.id });

      // Find the mentor and their specific allocation
      const mentor = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === allocation.mentorId
      );
      
      if (!mentor || !mentor.allocations || mentor.allocations.length === 0) {
        logger.error('Mentor or allocations not found');
        toast.error('Unable to find period information');
        return;
      }

      logger.info('Found mentor:', { mentorName: `${mentor.first_name} ${mentor.last_name}`, allocationCount: mentor.allocations.length });

      // Get the specific allocation that matches both the allocation ID and the period dates
      const mentorAllocation = mentor.allocations.find(a => {
        const allocationMatches = parseInt(a.id.replace(/-/g, '').substring(0, 8), 16) === allocationId;
        logger.debug('Checking allocation:', { allocationId: a.id, matches: allocationMatches });
        return allocationMatches;
      });

      if (!mentorAllocation || !mentorAllocation.period) {
        logger.error('Mentor allocation or period not found');
        logger.info('Available allocations:', { allocations: mentor.allocations.map(a => ({
          id: a.id,
          periodId: a.period?.id,
          dates: `${a.period?.start_date} to ${a.period?.end_date}`
        })) });
        toast.error('Unable to find period information');
        return;
      }

      const periodId = mentorAllocation.period.id;
      logger.info('Found period ID:', { periodId });
      logger.info('Period details:', {
        name: mentorAllocation.period.name,
        dates: `${mentorAllocation.period.start_date} to ${mentorAllocation.period.end_date}`,
        currentOffice: mentorAllocation.period.default_office_location,
        currentHours: mentorAllocation.period.default_available_hours,
        currentCapacity: mentorAllocation.period.default_mentor_capacity
      });

      // Update the specific period configuration
      logger.info('Updating period with:', {
        default_mentor_capacity: config.capacity,
        default_office_location: config.officeLocation,
        default_available_hours: config.availableHours,
      });

      await updatePeriod(periodId, {
        default_mentor_capacity: config.capacity,
        default_office_location: config.officeLocation,
        default_available_hours: config.availableHours,
      });

      logger.info('Period updated successfully');
      
      // Close modals
      setShowCapacityModal(false);
      setMentorForCapacityConfig(null);
      setAllocationForConfig(null);
      
      // Store the current mentor ID for refreshing
      const currentMentorId = selectedMentor?.id;
      
      // Wait for the data to be refreshed by the hook's fetchData call
      // The updatePeriod function already calls fetchData(), so we just need to wait a bit
      setTimeout(() => {
        if (currentMentorId) {
          // Get the refreshed mentor data from the updated mentors array
          const refreshedMentor = mentors.find(m => m.id === currentMentorId);
          if (refreshedMentor) {
            logger.info('Refreshing mentor details with updated data');
            setSelectedMentor(refreshedMentor);
            setMentorDetailsRefreshKey(prev => prev + 1); // Force re-render of modal
          }
        }
      }, 500); // Give a bit more time for the data to be fully refreshed
      
      toast.success('Allocation configuration updated successfully');
    } catch (error) {
      logger.error('Error updating allocation configuration:', error as Error);
      toast.error('Failed to update allocation configuration. Please try again.');
    }
  };

  const handleConfigureAllocation = (allocation: LegacyMentorAllocation) => {
    const mentor = mentors.find(m => m.id === allocation.mentorId);
    if (mentor) {
      setMentorForCapacityConfig(mentor);
      setAllocationForConfig(allocation);
      setShowCapacityModal(true);
    }
  };

  const handleAddlearnersToMentor = (mentor: LegacyMentor) => {
    setMentorForAddinglearners(mentor);
    setShowAddlearnersModal(true);
  };

  const handleAddlearnersToAllocation = (mentor: LegacyMentor, allocation: any) => {
    logger.info('handleAddlearnersToAllocation - using allocation ID:', { allocationId: allocation.id });
    
    // Simple approach: Just pass the allocation as-is
    // The modal will handle finding the period when needed
    setMentorForAddinglearners(mentor);
    setAllocationForAddinglearners(allocation);
    setShowAddlearnersModal(true);
  };

  const handleRemovelearnerFromAllocation = async (learner: LegacyLearner, allocation: LegacyMentorAllocation) => {
    if (isRemovingLearner) return; // Prevent double-clicks
    
    try {
      setIsRemovingLearner(true);
      
      // Convert legacy IDs to UUIDs
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === allocation.mentorId
      )?.id;
      
      const learnerUuid = dynamiclearners.find(s => 
        parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === learner.id
      )?.id;

      if (!mentorUuid || !learnerUuid) {
        toast.error('Invalid mentor or learner selection');
        return;
      }

      // Find the allocation ID - check for active or pending status
      let allocationId = await findAllocationId(mentorUuid, learnerUuid, 'active');
      if (!allocationId) {
        allocationId = await findAllocationId(mentorUuid, learnerUuid, 'pending');
      }
      
      if (!allocationId) {
        // Learner already removed - just refresh UI
        toast.info('This learner is not currently allocated to this mentor');
        setShowMentorDetailsModal(false);
        setSelectedMentor(null);
        await refetch();
        return;
      }

      // Update database
      await updateMentorAllocation(allocationId, {
        status: 'cancelled',
        completion_date: new Date().toISOString().split('T')[0],
      });

      // Show success message
      toast.success(`${learner.name} removed from allocation`);
      
      // Close modal and clear selection
      setShowMentorDetailsModal(false);
      setSelectedMentor(null);
      
      // Refresh data from database - this will trigger a re-render with updated data
      await refetch();
      
    } catch (error) {
      logger.error('Error removing learner:', error as Error);
      toast.error('Failed to remove learner. Please try again.');
    } finally {
      setIsRemovingLearner(false);
    }
  };

  // Set the delete handler on window when modal opens
  React.useEffect(() => {
    if (showMentorDetailsModal) {
      (window as any).__deletePeriodHandler = handleDeletePeriod;
    }
    return () => {
      (window as any).__deletePeriodHandler = undefined;
    };
  }, [showMentorDetailsModal]);

  const handleDeletePeriod = async (allocation: LegacyMentorAllocation) => {
    try {
      // Get the period ID from the allocation
      const periodId = allocation.period?.id;
      
      if (!periodId) {
        toast.error('Could not find period information');
        return;
      }

      // First, delete all learner allocations for this period
      const { error: allocError } = await supabase
        .from('college_mentor_learner_allocations')
        .delete()
        .eq('period_id', periodId);

      if (allocError) {
        logger.error('Error deleting allocations:', allocError as Error);
        toast.error('Failed to delete period allocations. Please try again.');
        return;
      }

      // Then delete the period itself
      const { error: periodError } = await supabase
        .from('college_mentor_periods')
        .delete()
        .eq('id', periodId);

      if (periodError) {
        logger.error('Error deleting period:', periodError as Error);
        toast.error('Failed to delete period. Please try again.');
        return;
      }

      toast.success('Mentoring period deleted successfully');
      
      // Close the details modal
      setShowMentorDetailsModal(false);
      setSelectedMentor(null);
      
      // Refresh data
      await refetch();
    } catch (error) {
      logger.error('Error deleting period:', error as Error);
      toast.error('Failed to delete period. Please try again.');
    }
  };

  const handleAddlearnersComplete = async (learnerIds: number[]) => {
    if (!mentorForAddinglearners || learnerIds.length === 0) return;

    try {
      // Convert legacy IDs to UUIDs
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorForAddinglearners.id
      )?.id;
      
      // Find learners from dynamiclearners (not dynamicUnallocatedlearners)
      // because the modal might include learners that are already allocated
      const learnerUuids = learnerIds.map(id => 
        dynamiclearners.find(s => 
          parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === id
        )?.id
      ).filter(Boolean) as string[];

      if (!mentorUuid || learnerUuids.length === 0) {
        toast.error('Invalid mentor or learner selection');
        return;
      }

      const firstLecturer = dynamicMentors.length > 0 ? dynamicMentors[0].id : null;
      if (!firstLecturer) {
        toast.error('No lecturers found');
        return;
      }

      // Get the period ID from the allocation
      let periodId: string | undefined;
      
      if (allocationForAddinglearners) {
        logger.info('Allocation object:', { allocationId: allocationForAddinglearners.id });
        
        // Check if allocation has a period property with an id
        if (allocationForAddinglearners.period?.id) {
          periodId = allocationForAddinglearners.period.id;
          logger.info('Found period ID from allocation.period:', { periodId });
        } else {
          // Fallback: The allocation ID in processed data IS the period ID
          const allocationLegacyId = allocationForAddinglearners.id;
          logger.info('Trying to find period using allocation legacy ID:', { allocationLegacyId });
          
          const matchingPeriod = periods.find(p => {
            const periodLegacyId = parseInt(p.id.replace(/-/g, '').substring(0, 8), 16);
            return periodLegacyId === allocationLegacyId;
          });
          
          if (matchingPeriod) {
            periodId = matchingPeriod.id;
            logger.info('Found period by legacy ID match:', { periodName: matchingPeriod.name, periodId });
          }
        }
      }
      
      if (!periodId) {
        logger.error('Could not determine period ID', { allocation: allocationForAddinglearners });
        logger.error('Available periods:', { periods: periods.map(p => ({ id: p.id, name: p.name })) });
        toast.error('Could not find period for this allocation. Please try again.');
        return;
      }

      logger.info('Allocating learners to period:', { periodId });
      
      // Perform the allocation - this will throw an error if learners already have allocations
      await allocatelearners(mentorUuid, learnerUuids, periodId, firstLecturer);

      // Close the add learners modal
      setShowAddlearnersModal(false);
      setMentorForAddinglearners(null);
      setAllocationForAddinglearners(null);
      
      toast.success(`Successfully added ${learnerUuids.length} learners to mentor`);
      
      // Close the details modal
      setShowMentorDetailsModal(false);
      setSelectedMentor(null);
      
      // Refresh data from database - this will trigger a re-render with updated data
      await refetch();
      
    } catch (error: any) {
      logger.error('Error adding learners:', error as Error);
      // Show more specific error message
      if (error.message && error.message.includes('already have active allocations')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to add learners. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Mentor Allocation
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Assign mentors to learners and track mentoring interventions
        </p>
      </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Mentors"
            value={filteredStatistics.totalMentors}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="blue"
          />

          <KPICard
            title="Learners Allocated"
            value={filteredStatistics.allocatedlearners}
            icon={<AcademicCapIcon className="h-6 w-6" />}
            color="green"
          />

          <KPICard
            title="At-Risk Learners"
            value={filteredStatistics.totalAtRisk}
            icon={<ExclamationTriangleIcon className="h-6 w-6" />}
            color="red"
          />

          <KPICard
            title="Total Interventions"
            value={filteredStatistics.totalInterventions}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            color="purple"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search mentors by name, department, or designation..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Departments</option>
                {uniqueDepartmentsComputed.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Batches</option>
                {uniqueBatchesComputed.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
              </div>

              <button
                onClick={handleStartAllocation}
                disabled={unallocatedlearners.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Allocate Learners
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading mentor allocation data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* No College ID */}
        {!collegeId && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="text-yellow-800 font-medium">College Information Missing</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  Unable to load mentor allocation data. Please ensure you are logged in with a valid college account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mentors List */}
        {!loading && !error && collegeId && (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {paginatedMentors.map((mentor) => (
            <div
              key={mentor.id}
              className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 ${
                viewMode === 'grid' ? 'p-6 flex flex-col h-full' : 'p-4'
              }`}
            >
              {viewMode === 'grid' ? (
                // Grid View - Restructured for consistent layout
                <>
                  {/* Header Section - Fixed Height */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-7 w-7 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{mentor.name}</h3>
                      <p className="text-sm text-gray-600 font-medium truncate">{mentor.designation}</p>
                      <p className="text-xs text-gray-500 truncate">{mentor.department}</p>
                    </div>
                  </div>

                  {/* Period Information - Flexible Height */}
                  <div className="flex-1 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="text-xs text-blue-600 min-w-0">
                        {(() => {
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          if (activeAllocations.length === 0) {
                            return <span className="text-gray-400">No active allocations</span>;
                          }
                          
                          // Find currently running allocation (current date falls within period)
                          const currentDate = new Date();
                          const currentAllocation = activeAllocations.find(allocation => {
                            const startDate = new Date(allocation.allocationPeriod.startDate);
                            const endDate = new Date(allocation.allocationPeriod.endDate);
                            return currentDate >= startDate && currentDate <= endDate;
                          });
                          
                          if (currentAllocation) {
                            return (
                              <div>
                                <div className="font-medium truncate">{currentAllocation.allocationPeriod.startDate} - {currentAllocation.allocationPeriod.endDate}</div>
                                <div className="text-xs text-gray-500 truncate">{currentAllocation.academicYear}</div>
                              </div>
                            );
                          }
                          
                          if (activeAllocations.length === 1) {
                            const allocation = activeAllocations[0];
                            return (
                              <div>
                                <div className="truncate">{allocation.allocationPeriod.startDate} - {allocation.allocationPeriod.endDate}</div>
                                <div className="text-xs text-gray-500 truncate">{allocation.academicYear}</div>
                              </div>
                            );
                          }
                          
                          return (
                            <div>
                              <div className="font-medium">{activeAllocations.length} active periods</div>
                              <div className="text-xs text-gray-500">Multiple allocation timeframes</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Risk Indicator - Consistent Height */}
                    <div className="h-6 flex items-center gap-3">
                      {getMentorAtRisklearnersLegacy(mentor.id).length > 0 && (
                        <div className="flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">
                            {getMentorAtRisklearnersLegacy(mentor.id).length} at-risk learner{getMentorAtRisklearnersLegacy(mentor.id).length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      
                      {/* Response Indicator */}
                      {(() => {
                        const mentorUuid = dynamicMentors.find(m => 
                          parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentor.id
                        )?.id;
                        
                        if (!mentorUuid) return null;
                        
                        const mentorNotes = dynamicNotes.filter(n => n.mentor_id === mentorUuid);
                        const notesWithResponse = mentorNotes.filter(n => (n.educator_response || n.action_taken) && n.status !== 'completed');
                        const pendingNotes = mentorNotes.filter(n => !n.educator_response && !n.action_taken && n.status === 'pending');
                        
                        if (notesWithResponse.length > 0) {
                          return (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 font-medium">
                                {notesWithResponse.length} response{notesWithResponse.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        }
                        
                        if (pendingNotes.length > 0) {
                          return (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-orange-600 font-medium">
                                {pendingNotes.length} pending
                              </span>
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Capacity Section - Fixed at Bottom */}
                  <div className="mt-auto">
                    {/* Capacity Indicator */}
                    <div className="mb-4">
                      {(() => {
                        const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                        
                        // Find currently running allocation (current date falls within period)
                        const currentDate = new Date();
                        const currentAllocation = activeAllocations.find(allocation => {
                          const startDate = new Date(allocation.allocationPeriod.startDate);
                          const endDate = new Date(allocation.allocationPeriod.endDate);
                          return currentDate >= startDate && currentDate <= endDate;
                        });
                        
                        if (currentAllocation) {
                          // Show capacity for current period only
                          const currentLoad = currentAllocation.learners.length;
                          const maxCapacity = currentAllocation.capacity;
                          
                          return (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Capacity: {currentLoad}/{maxCapacity}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  currentLoad >= maxCapacity
                                    ? "bg-red-100 text-red-700"
                                    : currentLoad >= maxCapacity * 0.8
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {currentLoad >= maxCapacity
                                    ? "Full"
                                    : currentLoad >= maxCapacity * 0.8
                                    ? "Near Full"
                                    : "Available"
                                  }
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className={`h-3 rounded-full transition-all duration-300 ${
                                    currentLoad >= maxCapacity
                                      ? "bg-red-500"
                                      : currentLoad >= maxCapacity * 0.8
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{
                                    width: `${Math.min((currentLoad / maxCapacity) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </>
                          );
                        } else {
                          // No current period, show total across all active allocations
                          const currentLoad = getMentorCurrentLoadLegacy(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.period?.default_mentor_capacity || a.capacity || 15))
                            : 15; // Default capacity
                          
                          return (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Total Capacity: {currentLoad}/{maxCapacity}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  Historical Data
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="h-3 rounded-full transition-all duration-300 bg-gray-400"
                                  style={{
                                    width: `${Math.min((currentLoad / maxCapacity) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </>
                          );
                        }
                      })()}
                    </div>

                    {/* Action Buttons - Fixed at Bottom */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowMentorDetailsModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddlearnersToMentor(mentor)}
                        disabled={(() => {
                          const currentLoad = getMentorCurrentLoadLegacy(mentor.id);
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                          return currentLoad >= maxCapacity || unallocatedlearners.length === 0 || activeAllocations.length === 0;
                        })()}
                        className="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Add Learners"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // List View
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{mentor.name}</h3>
                      <p className="text-sm text-gray-600">{mentor.designation} • {mentor.department}</p>
                      {getMentorAtRisklearnersLegacy(mentor.id).length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">
                            {getMentorAtRisklearnersLegacy(mentor.id).length} at-risk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {getMentorCurrentLoadLegacy(mentor.id)}/{(() => {
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          return activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">Capacity</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-600">
                        {getMentorAtRisklearnersLegacy(mentor.id).length}
                      </p>
                      <p className="text-xs text-gray-500">At-Risk</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowMentorDetailsModal(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddlearnersToMentor(mentor)}
                        disabled={(() => {
                          const currentLoad = getMentorCurrentLoadLegacy(mentor.id);
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                          return currentLoad >= maxCapacity || unallocatedlearners.length === 0 || activeAllocations.length === 0;
                        })()}
                        className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Add Learners"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Empty States */}
        {!loading && !error && collegeId && (
          <>
            {/* No mentors at all */}
            {mentors.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Mentors Available</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  No mentors are currently available for allocation. Please add mentors to get started with the mentoring program.
                </p>
                <button 
                  onClick={() => navigate('/college-admin/departments/educators')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Mentors
                </button>
              </div>
            )}

            {/* No filtered results */}
            {mentors.length > 0 && filteredMentors.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="mb-4">
                  {searchQuery ? (
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto" />
                  ) : (
                    <AdjustmentsHorizontalIcon className="h-16 w-16 text-gray-300 mx-auto" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No Search Results' : 'No Mentors Match Filters'}
                </h3>
                <div className="text-gray-600 mb-6 max-w-lg mx-auto">
                  {searchQuery ? (
                    <div>
                      <p className="mb-2">No mentors found for "<span className="font-medium text-gray-900">{searchQuery}</span>"</p>
                      <p className="text-sm">Try adjusting your search terms or clearing filters to see more results.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2">No mentors match the current filter criteria:</p>
                      <div className="flex flex-wrap justify-center gap-2 text-sm">
                        {selectedDepartment !== 'all' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Department: {selectedDepartment}
                          </span>
                        )}
                        {selectedBatch !== 'all' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                            Batch: {selectedBatch}
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-2">Try adjusting or clearing the filters above.</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  {(selectedDepartment !== 'all' || selectedBatch !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedDepartment('all');
                        setSelectedBatch('all');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDepartment('all');
                      setSelectedBatch('all');
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Show All Mentors
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalMentors > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalMentors}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Modals */}
        {showlearnerSelectionModal && (
          <LearnerSelectionModal
            key="allocate-learners"
            availablelearners={dynamiclearners.map(transformlearnerToLegacy) as any}
            onClose={() => setShowlearnerSelectionModal(false)}
            onNext={handlelearnerSelectionComplete}
            initialSelectedlearners={selectedlearnersForAllocation}
            assignedlearners={assignedlearnersInfo}
          />
        )}

        {showMentorSelectionModal && (
          <MentorSelectionModal
            selectedlearners={selectedlearnersForAllocation.map(id => 
              availablelearners.find(s => s.id === id)!
            ) as any}
            mentors={mentors as any}
            onClose={() => {
              setShowMentorSelectionModal(false);
              setSelectedlearnersForAllocation([]);
            }}
            onBack={handleBackTolearnerSelection}
            onNext={handleMentorSelectionComplete}
            initialSelectedMentorId={selectedMentorForAllocation?.id || null}
            getMentorCurrentLoad={getMentorCurrentLoadLegacy}
            getMentorActiveAllocations={getMentorActiveAllocationsLegacy as any}
          />
        )}

        {showAllocationConfigModal && selectedMentorForAllocation && (
          <AllocationConfigurationModal
            selectedlearners={selectedlearnersForAllocation.map(id => 
              availablelearners.find(s => s.id === id)!
            ) as any}
            selectedMentor={selectedMentorForAllocation as any}
            onClose={() => {
              setShowAllocationConfigModal(false);
              setSelectedlearnersForAllocation([]);
              setSelectedMentorForAllocation(null);
            }}
            onBack={handleBackToMentorSelection}
            onAllocate={handleAllocatelearners}
            getMentorCurrentLoad={getMentorCurrentLoadLegacy}
            getMentorActiveAllocations={getMentorActiveAllocationsLegacy as any}
            allAllocations={allAllocations as any}
          />
        )}

        {showInterventionModal && (
          <InterventionModal
            learner={selectedLearner as any}
            noteText={noteText}
            noteOutcome={noteOutcome}
            interventionType={interventionType}
            isPrivateNote={isPrivateNote}
            noteStatus={noteStatus}
            priority={notePriority}
            followUpRequired={followUpRequired}
            followUpDate={followUpDate}
            onNoteChange={setNoteText}
            onOutcomeChange={setNoteOutcome}
            onInterventionTypeChange={(value) => setInterventionType(value as any)}
            onPrivateChange={setIsPrivateNote}
            onStatusChange={(value) => setNoteStatus(value as any)}
            onPriorityChange={(value) => setNotePriority(value as any)}
            onFollowUpRequiredChange={setFollowUpRequired}
            onFollowUpDateChange={setFollowUpDate}
            onClose={() => {
              setShowInterventionModal(false);
              setSelectedMentor(null);
              setSelectedLearner(null);
            }}
            onSave={handleAddIntervention}
          />
        )}

        {showFeedbackModal && selectedNoteForFeedback && (
          <InterventionFeedbackModal
            note={selectedNoteForFeedback}
            learnerName={dynamiclearners.find(s => s.id === selectedNoteForFeedback.learner_id)?.name || 'Unknown Learner'}
            mentorName={(() => {
              const mentor = dynamicMentors.find(m => m.id === selectedNoteForFeedback.mentor_id);
              return mentor ? `${mentor.first_name} ${mentor.last_name}` : 'Unknown Mentor';
            })()}
            onClose={() => {
              setShowFeedbackModal(false);
              setSelectedNoteForFeedback(null);
            }}
            onSave={handleSaveFeedback}
            onResolve={handleResolveNote}
          />
        )}

        {showMentorDetailsModal && selectedMentor && (
          <MentorDetailsDrawer
            key={`mentor-${selectedMentor.id}-${mentorDetailsRefreshKey}`}
            mentor={selectedMentor as any}
            notes={(() => {
              // Find the mentor UUID that corresponds to the selected mentor's legacy ID
              const mentorUuid = dynamicMentors.find(m => 
                parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === selectedMentor.id
              )?.id;
              
              logger.info('Debug info:', {
                selectedMentorId: selectedMentor.id,
                mentorUuid: mentorUuid,
                totalNotes: dynamicNotes.length,
                notesForMentor: dynamicNotes.filter(n => n.mentor_id === mentorUuid).length
              });
              
              const filteredNotes = dynamicNotes.filter(n => {
                const matches = n.mentor_id === mentorUuid;
                if (matches) {
                  logger.info('Found matching note:', {
                    noteId: n.id,
                    mentorId: n.mentor_id,
                    learnerId: n.learner_id,
                    noteText: n.note_text
                  });
                }
                return matches;
              });
              
              const transformedNotes = filteredNotes.map(note => ({
                id: parseInt(note.id.replace(/-/g, '').substring(0, 8), 16),
                mentorId: selectedMentor.id,
                learnerId: parseInt(note.learner_id.replace(/-/g, '').substring(0, 8), 16),
                note: note.note_text || '',
                date: note.note_date || note.created_at,
                outcome: note.outcome || '',
                isPrivate: note.is_private || false,
                interventionType: note.intervention_type,
                status: note.status,
                // Include new 2-way communication fields
                priority: note.priority,
                educator_response: note.educator_response,
                action_taken: note.action_taken,
                next_steps: note.next_steps,
                admin_feedback: note.admin_feedback,
                follow_up_required: note.follow_up_required,
                follow_up_date: note.follow_up_date,
                // Include the full note data for the feedback modal
                _fullNote: note,
              }));
              
              logger.info('Transformed notes:', { count: transformedNotes.length });
              return transformedNotes;
            })() as any}
            onClose={() => {
              setShowMentorDetailsModal(false);
              setSelectedMentor(null);
              // Clear the delete handler when modal closes
              (window as any).__deletePeriodHandler = undefined;
            }}
            onLogIntervention={(learner) => {
              setSelectedLearner(learner as any);
              setShowInterventionModal(true);
            }}
            onReassignLearner={(learner) => {
              setlearnerToReassign(learner as any);
              setShowReassignModal(true);
            }}
            onConfigureAllocation={handleConfigureAllocation}
            onAddlearnersToAllocation={(mentor, allocation) => {
              handleAddlearnersToAllocation(mentor, allocation);
            }}
            onRemoveLearner={handleRemovelearnerFromAllocation}
            onViewConversation={(note: any) => {
              // Use the full note data if available, otherwise use the transformed note
              const fullNote = note._fullNote || dynamicNotes.find(n => 
                parseInt(n.id.replace(/-/g, '').substring(0, 8), 16) === note.id
              );
              if (fullNote) {
                handleViewNoteFeedback(fullNote);
              }
            }}
          />
        )}

        {showReassignModal && learnerToReassign && (
          <ReassignModal
            learner={learnerToReassign as any}
            mentors={mentors as any}
            onClose={() => {
              setShowReassignModal(false);
              setlearnerToReassign(null);
            }}
            onReassign={handleReassignLearner}
            getMentorCurrentLoad={getMentorCurrentLoadLegacy}
            getMentorActiveAllocations={getMentorActiveAllocationsLegacy as any}
          />
        )}

        {showCapacityModal && mentorForCapacityConfig && allocationForConfig && (
          <MentorCapacityModal
            mentor={mentorForCapacityConfig as any}
            allocation={allocationForConfig as any}
            onClose={() => {
              setShowCapacityModal(false);
              setMentorForCapacityConfig(null);
              setAllocationForConfig(null);
            }}
            onSave={handleCapacityConfiguration}
          />
        )}

        {showAddlearnersModal && mentorForAddinglearners && (
          <LearnerSelectionModal
            key={`add-learners-${mentorForAddinglearners.id}`}
            availablelearners={(unallocatedlearners || []).filter(learner => 
              (selectedBatch === "all" || learner.batch === selectedBatch) &&
              (selectedDepartment === "all" || learner.department === selectedDepartment)
            ) as any}
            title={`Add Learners to ${mentorForAddinglearners.name}${allocationForAddinglearners ? ` - ${allocationForAddinglearners.academicYear}` : ''}`}
            description={`Select learners to assign to ${mentorForAddinglearners.name} (${mentorForAddinglearners.designation})${allocationForAddinglearners ? ` for the ${allocationForAddinglearners.academicYear} period` : ''}. Available capacity: ${(() => {
              if (allocationForAddinglearners) {
                const currentLoad = allocationForAddinglearners.learners?.length || 0;
                const maxCapacity = allocationForAddinglearners.capacity;
                return maxCapacity - currentLoad;
              }
              const currentLoad = getMentorCurrentLoadLegacy(mentorForAddinglearners.id);
              const activeAllocations = getMentorActiveAllocationsLegacy(mentorForAddinglearners.id);
              const maxCapacity = activeAllocations.length > 0 
                ? Math.max(...activeAllocations.map(a => a.capacity))
                : 15;
              return maxCapacity - currentLoad;
            })()} learners`}
            buttonText="Add Selected Learners"
            onClose={() => {
              setShowAddlearnersModal(false);
              setMentorForAddinglearners(null);
            }}
            onNext={handleAddlearnersComplete}
          />
        )}
      </div>
    </div>
  );
};

export default MentorAllocation;