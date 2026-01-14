import React, { useState, useMemo } from "react";
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
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from "../../../context/AuthContext";
import { useMentorAllocation } from "../../../hooks/useMentorAllocation";
import { findAllocationId } from "../../../services/mentorAllocationService";
import SearchBar from "../../../components/common/SearchBar";
import KPICard from "../../../components/admin/KPICard";
import Pagination from "../../../components/admin/Pagination";
import StudentSelectionModal from "../../../components/admin/collegeAdmin/StudentSelectionModal";
import MentorSelectionModal from "../../../components/admin/collegeAdmin/MentorSelectionModal";
import AllocationConfigurationModal from "../../../components/admin/collegeAdmin/AllocationConfigurationModal";
import InterventionModal from "../../../components/admin/collegeAdmin/InterventionModal";
import InterventionFeedbackModal from "../../../components/admin/collegeAdmin/InterventionFeedbackModal";
import MentorDetailsDrawer from "../../../components/admin/collegeAdmin/MentorDetailsModal";
import ReassignModal from "../../../components/admin/collegeAdmin/ReassignModal";
import MentorCapacityModal from "../../../components/admin/collegeAdmin/MentorCapacityModal";

// Legacy interfaces for compatibility with existing modals
interface LegacyStudent {
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
  students: LegacyStudent[];
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
  const { user } = useAuth() as { user: any | null };
  
  // Get college ID from user context with better debugging
  const collegeId = useMemo(() => {
    if (!user) {
      console.log('🔍 [MentorAllocation] No user context available');
      return '';
    }
    
    const id = user.college_id || 
               user.universityCollegeId || 
               (user as any).collegeId || 
               (user as any).metadata?.college_id || 
               '';
               
    console.log('🔍 [MentorAllocation] User context:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      college_id: user.college_id,
      universityCollegeId: user.universityCollegeId,
      collegeId: (user as any).collegeId,
      metadata: (user as any).metadata,
      extractedCollegeId: id,
      fullUser: user
    });
    
    return id;
  }, [user]);
  
  // Use the dynamic hook
  const {
    mentors: dynamicMentors,
    students: dynamicStudents,
    unallocatedStudents: dynamicUnallocatedStudents,
    periods,
    uniqueDepartments,
    uniqueBatches,
    loading,
    error,
    allocateStudents,
    addMentorNote,
    reassignStudent,
    createPeriod,
    updatePeriod,
    getMentorCurrentLoad,
    getMentorAtRiskStudents,
    notes: dynamicNotes, // Get notes from the hook
    updateNoteFeedback,
    markNoteResolved,
  } = useMentorAllocation(collegeId);

  // Transform dynamic data to legacy format for compatibility
  const transformStudentToLegacy = (student: any): LegacyStudent => ({
    id: parseInt(student.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number
    name: student.name || '',
    rollNo: student.roll_number || '',
    department: student.department_name || student.program_name || '',
    semester: student.semester || 1,
    cgpa: parseFloat(student.current_cgpa?.toString() || '0'),
    atRisk: student.at_risk || false,
    email: student.email || '',
    batch: student.batch || '',
    riskFactors: student.risk_factors || [],
    lastInteraction: student.last_interaction || undefined,
    interventionCount: student.intervention_count || 0,
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
    allocations: mentor.allocations?.map((allocation: any) => ({
      id: parseInt(allocation.id.replace(/-/g, '').substring(0, 8), 16),
      mentorId: parseInt(mentor.id.replace(/-/g, '').substring(0, 8), 16),
      students: allocation.students?.map(transformStudentToLegacy) || [],
      allocationPeriod: {
        startDate: allocation.period?.start_date || '',
        endDate: allocation.period?.end_date || '',
      },
      capacity: allocation.period?.default_mentor_capacity || 15,
      officeLocation: allocation.period?.default_office_location || '',
      availableHours: allocation.period?.default_available_hours || '',
      status: 'active' as const,
      createdAt: allocation.created_at || '',
      createdBy: allocation.assigned_by || '',
      academicYear: allocation.period?.academic_year || '',
      semester: 'All', // Added for compatibility with modal components
    })) || [],
  });

  // Convert dynamic data to legacy format
  const mentors = dynamicMentors.map(transformMentorToLegacy);
  const availableStudents = dynamicUnallocatedStudents.map(transformStudentToLegacy);
  const unallocatedStudents = availableStudents; // Alias for compatibility

  // All allocations across all mentors (for audit trail)
  const allAllocations = mentors.flatMap(mentor => mentor.allocations);

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mentorDetailsRefreshKey, setMentorDetailsRefreshKey] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 mentors per page

  // Modal States
  const [showStudentSelectionModal, setShowStudentSelectionModal] = useState(false);
  const [showMentorSelectionModal, setShowMentorSelectionModal] = useState(false);
  const [showAllocationConfigModal, setShowAllocationConfigModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showMentorDetailsModal, setShowMentorDetailsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Selected Items
  const [selectedMentor, setSelectedMentor] = useState<LegacyMentor | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<LegacyStudent | null>(null);
  const [selectedStudentsForAllocation, setSelectedStudentsForAllocation] = useState<number[]>([]);
  const [selectedMentorForAllocation, setSelectedMentorForAllocation] = useState<LegacyMentor | null>(null);
  const [studentToReassign, setStudentToReassign] = useState<LegacyStudent | null>(null);
  const [mentorForCapacityConfig, setMentorForCapacityConfig] = useState<LegacyMentor | null>(null);
  const [allocationForConfig, setAllocationForConfig] = useState<LegacyMentorAllocation | null>(null);
  const [mentorForAddingStudents, setMentorForAddingStudents] = useState<LegacyMentor | null>(null);
  const [selectedNoteForFeedback, setSelectedNoteForFeedback] = useState<any>(null);

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
        // Only show mentors who have active allocations with students
        m.allocations.some(allocation => 
          allocation.status === 'active' && allocation.students.length > 0
        ) &&
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designation.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedDepartment === "all" || m.department === selectedDepartment) &&
        // Add batch filtering - check if mentor has students from selected batch
        (selectedBatch === "all" || m.allocations.some(allocation =>
          allocation.students.some(student => student.batch === selectedBatch)
        ))
    );
  }, [mentors, searchQuery, selectedDepartment, selectedBatch]);

  // Calculate filtered statistics based on current filters
  const filteredStatistics = useMemo(() => {
    // Get all students from filtered mentors
    const filteredMentorStudents = filteredMentors.flatMap(mentor =>
      mentor.allocations.flatMap(allocation => allocation.students)
    );
    
    // Remove duplicates (same student might appear in multiple allocations)
    const uniqueStudentIds = new Set(filteredMentorStudents.map(s => s.id));
    const uniqueFilteredStudents = Array.from(uniqueStudentIds).map(id =>
      filteredMentorStudents.find(s => s.id === id)!
    );
    
    // Calculate at-risk students from filtered mentors
    const filteredAtRiskStudents = uniqueFilteredStudents.filter(s => s.atRisk);
    
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
      allocatedStudents: uniqueFilteredStudents.length,
      totalAtRisk: filteredAtRiskStudents.length,
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

  const getMentorAtRiskStudentsLegacy = (mentorId: number) => {
    const mentorUuid = dynamicMentors.find(m => 
      parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorId
    )?.id;
    return mentorUuid ? getMentorAtRiskStudents(mentorUuid).map(transformStudentToLegacy) : [];
  };

  // Event Handlers
  const handleStartAllocation = () => {
    setSelectedStudentsForAllocation([]);
    setShowStudentSelectionModal(true);
  };

  const handleStudentSelectionComplete = (studentIds: number[]) => {
    setSelectedStudentsForAllocation(studentIds);
    setShowStudentSelectionModal(false);
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
    // Keep selectedStudentsForAllocation and selectedMentorForAllocation for navigation
  };

  const handleBackToStudentSelection = () => {
    setShowMentorSelectionModal(false);
    setShowStudentSelectionModal(true);
    // Keep selectedStudentsForAllocation for navigation
  };

  const handleAllocateStudents = async (
    mentorId: number, 
    studentIds: number[],
    allocationPeriod: {startDate: string; endDate: string},
    capacityConfig: {capacity: number; officeLocation: string; availableHours: string}
  ) => {
    try {
      // Convert legacy IDs back to UUIDs
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorId
      )?.id;
      
      const studentUuids = studentIds.map(id => 
        dynamicUnallocatedStudents.find(s => 
          parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === id
        )?.id
      ).filter(Boolean) as string[];

      if (!mentorUuid || studentUuids.length === 0) {
        toast.error('Invalid mentor or student selection');
        return;
      }

      // Get the first available lecturer for foreign key constraints
      const firstLecturer = dynamicMentors.length > 0 ? dynamicMentors[0].id : null;
      
      if (!firstLecturer) {
        toast.error('No lecturers found. Please add lecturers before creating mentor periods.');
        return;
      }

      // Check if there's an active period for this college that matches the allocation dates
      let activePeriod = periods.find(p => 
        p.is_active && 
        p.college_id === collegeId &&
        p.start_date === allocationPeriod.startDate &&
        p.end_date === allocationPeriod.endDate
      );
      
      if (!activePeriod) {
        // Create a new period for this specific date range
        console.log('🔄 [handleAllocateStudents] No matching period found, creating new period for dates:', allocationPeriod);
        
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
          console.log('✅ [handleAllocateStudents] New period created successfully:', activePeriod);
        } catch (periodError) {
          console.error('❌ [handleAllocateStudents] Error creating new period:', periodError);
          toast.error('Failed to create mentor period. Please try again.');
          return;
        }
      } else {
        console.log('✅ [handleAllocateStudents] Using existing period:', activePeriod);
      }

      // Now allocate students using the active period
      await allocateStudents(mentorUuid, studentUuids, activePeriod.id, firstLecturer);
      
      toast.success(`Successfully allocated ${studentUuids.length} students to mentor`);
      
      // Reset states
      setShowAllocationConfigModal(false);
      setSelectedStudentsForAllocation([]);
      setSelectedMentorForAllocation(null);
    } catch (error) {
      console.error('Error allocating students:', error);
      toast.error('Failed to allocate students. Please try again.');
    }
  };

  const handleAddIntervention = async () => {
    if (!selectedMentor || !selectedStudent || !noteText) return;

    try {
      // Find the allocation ID for this mentor-student pair
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === selectedMentor.id
      )?.id;
      
      const studentUuid = dynamicStudents.find(s => 
        parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === selectedStudent.id
      )?.id;

      if (!mentorUuid || !studentUuid) {
        toast.error('Invalid mentor or student selection');
        return;
      }

      // Use the hook's addMentorNote function which will find the allocation ID automatically
      await addMentorNote('', mentorUuid, studentUuid, {
        title: `Intervention - ${interventionType}`,
        note_text: noteText,
        outcome: noteOutcome,
        intervention_type: interventionType,
        status: noteStatus,
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
      setNoteStatus('pending');
      setNotePriority('medium');
      setFollowUpRequired(false);
      setFollowUpDate('');
      setShowInterventionModal(false);
      
      toast.success('Intervention note added successfully');
    } catch (error) {
      console.error('Error adding intervention:', error);
      toast.error('Failed to add intervention note. Please try again.');
    }
  };

  const handleViewNoteFeedback = (note: any) => {
    setSelectedNoteForFeedback(note);
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async (feedback: {
    admin_feedback?: string;
    status?: string;
    priority?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
  }) => {
    if (!selectedNoteForFeedback) return;

    try {
      await updateNoteFeedback(selectedNoteForFeedback.id, feedback);
      setShowFeedbackModal(false);
      setSelectedNoteForFeedback(null);
    } catch (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
  };

  const handleResolveNote = async () => {
    if (!selectedNoteForFeedback) return;

    try {
      await markNoteResolved(selectedNoteForFeedback.id);
      setShowFeedbackModal(false);
      setSelectedNoteForFeedback(null);
    } catch (error) {
      console.error('Error resolving note:', error);
      throw error;
    }
  };

  const handleReassignStudent = async (newMentorId: number, newPeriodId: number) => {
    if (!studentToReassign) return;

    try {
      // Convert legacy IDs to UUIDs
      const newMentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === newMentorId
      )?.id;

      const studentUuid = dynamicStudents.find(s => 
        parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === studentToReassign.id
      )?.id;

      // Convert period ID to UUID
      const newPeriodUuid = periods.find(p => 
        parseInt(p.id.replace(/-/g, '').substring(0, 8), 16) === newPeriodId
      )?.id;

      if (!newMentorUuid || !studentUuid || !newPeriodUuid) {
        toast.error('Invalid mentor, student, or period selection');
        return;
      }

      // Find the current mentor for this student
      const currentMentorUuid = dynamicMentors.find(m => 
        m.allocations?.some(allocation => 
          allocation.students?.some(s => s.id === studentUuid)
        )
      )?.id;

      if (!currentMentorUuid) {
        toast.error('Unable to find current mentor allocation for this student');
        return;
      }

      // Find the actual allocation ID
      const allocationId = await findAllocationId(currentMentorUuid, studentUuid, 'active');
      
      if (!allocationId) {
        toast.error('No active allocation found for this student. Please check the allocation status.');
        return;
      }

      // Store the current mentor ID before reassignment
      const currentMentorId = selectedMentor?.id;
      
      console.log('🔄 [handleReassignStudent] Starting reassignment process...');
      
      // Perform the reassignment (this will call fetchData() internally and update state)
      await reassignStudent(allocationId, newMentorUuid, newPeriodUuid, 'Reassigned by admin');
      
      console.log('✅ [handleReassignStudent] Reassignment completed, data refreshed');
      
      // Close modals
      setShowReassignModal(false);
      setStudentToReassign(null);
      
      // Show success message
      toast.success('Student reassigned successfully');
      
      // Force a re-render of the drawer by incrementing the refresh key
      // The drawer will automatically pick up the updated mentor data from the mentors array
      // because React will re-render the component after the state updates from fetchData()
      console.log('🔄 [handleReassignStudent] Forcing drawer refresh...');
      setMentorDetailsRefreshKey(prev => prev + 1);
      
      // Update the selected mentor reference to trigger drawer update
      // We need to wait a tick for React to process the state updates from fetchData()
      setTimeout(() => {
        if (currentMentorId) {
          const refreshedMentor = mentors.find(m => m.id === currentMentorId);
          if (refreshedMentor) {
            console.log('✅ [handleReassignStudent] Updating drawer with refreshed mentor:', {
              mentorId: refreshedMentor.id,
              mentorName: refreshedMentor.name,
              totalAllocations: refreshedMentor.allocations.length,
              totalStudents: refreshedMentor.allocations.reduce((sum, a) => sum + a.students.length, 0)
            });
            setSelectedMentor(refreshedMentor);
          } else {
            console.warn('⚠️ [handleReassignStudent] Could not find refreshed mentor in updated array');
          }
        }
      }, 100); // Small delay to ensure React has processed state updates
    } catch (error) {
      console.error('❌ [handleReassignStudent] Error:', error);
      toast.error('Failed to reassign student. Please try again.');
    }
  };

  const handleCapacityConfiguration = async (
    allocationId: number, 
    config: {capacity: number; officeLocation: string; availableHours: string}
  ) => {
    try {
      console.log('🔧 [handleCapacityConfiguration] Starting update for allocation:', allocationId);
      console.log('🔧 [handleCapacityConfiguration] New config:', config);
      
      // Find the allocation to get the period ID
      const allocation = allAllocations.find(a => a.id === allocationId);
      if (!allocation) {
        console.error('❌ [handleCapacityConfiguration] Allocation not found:', allocationId);
        toast.error('Allocation not found');
        return;
      }

      console.log('🔧 [handleCapacityConfiguration] Found allocation:', allocation);

      // Find the mentor and their specific allocation
      const mentor = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === allocation.mentorId
      );
      
      if (!mentor || !mentor.allocations || mentor.allocations.length === 0) {
        console.error('❌ [handleCapacityConfiguration] Mentor or allocations not found');
        toast.error('Unable to find period information');
        return;
      }

      console.log('🔧 [handleCapacityConfiguration] Found mentor:', mentor.first_name, mentor.last_name);
      console.log('🔧 [handleCapacityConfiguration] Mentor allocations:', mentor.allocations.length);

      // Get the specific allocation that matches both the allocation ID and the period dates
      const mentorAllocation = mentor.allocations.find(a => {
        const allocationMatches = parseInt(a.id.replace(/-/g, '').substring(0, 8), 16) === allocationId;
        console.log('🔧 [handleCapacityConfiguration] Checking allocation:', a.id, 'matches:', allocationMatches);
        return allocationMatches;
      });

      if (!mentorAllocation || !mentorAllocation.period) {
        console.error('❌ [handleCapacityConfiguration] Mentor allocation or period not found');
        console.log('Available allocations:', mentor.allocations.map(a => ({
          id: a.id,
          periodId: a.period?.id,
          dates: `${a.period?.start_date} to ${a.period?.end_date}`
        })));
        toast.error('Unable to find period information');
        return;
      }

      const periodId = mentorAllocation.period.id;
      console.log('🔧 [handleCapacityConfiguration] Found period ID:', periodId);
      console.log('🔧 [handleCapacityConfiguration] Period details:', {
        name: mentorAllocation.period.name,
        dates: `${mentorAllocation.period.start_date} to ${mentorAllocation.period.end_date}`,
        currentOffice: mentorAllocation.period.default_office_location,
        currentHours: mentorAllocation.period.default_available_hours,
        currentCapacity: mentorAllocation.period.default_mentor_capacity
      });

      // Update the specific period configuration
      console.log('🔧 [handleCapacityConfiguration] Updating period with:', {
        default_mentor_capacity: config.capacity,
        default_office_location: config.officeLocation,
        default_available_hours: config.availableHours,
      });

      await updatePeriod(periodId, {
        default_mentor_capacity: config.capacity,
        default_office_location: config.officeLocation,
        default_available_hours: config.availableHours,
      });

      console.log('✅ [handleCapacityConfiguration] Period updated successfully');
      
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
            console.log('🔄 [handleCapacityConfiguration] Refreshing mentor details with updated data');
            setSelectedMentor(refreshedMentor);
            setMentorDetailsRefreshKey(prev => prev + 1); // Force re-render of modal
          }
        }
      }, 500); // Give a bit more time for the data to be fully refreshed
      
      toast.success('Allocation configuration updated successfully');
    } catch (error) {
      console.error('❌ [handleCapacityConfiguration] Error updating allocation configuration:', error);
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

  const handleAddStudentsToMentor = (mentor: LegacyMentor) => {
    setMentorForAddingStudents(mentor);
    setShowAddStudentsModal(true);
  };

  const handleAddStudentsComplete = async (studentIds: number[]) => {
    if (!mentorForAddingStudents) return;

    try {
      // Convert legacy IDs to UUIDs
      const mentorUuid = dynamicMentors.find(m => 
        parseInt(m.id.replace(/-/g, '').substring(0, 8), 16) === mentorForAddingStudents.id
      )?.id;
      
      const studentUuids = studentIds.map(id => 
        dynamicUnallocatedStudents.find(s => 
          parseInt(s.id.replace(/-/g, '').substring(0, 8), 16) === id
        )?.id
      ).filter(Boolean) as string[];

      if (!mentorUuid || studentUuids.length === 0) {
        toast.error('Invalid mentor or student selection');
        return;
      }

      // Get the first available lecturer for foreign key constraints
      const firstLecturer = dynamicMentors.length > 0 ? dynamicMentors[0].id : null;
      
      if (!firstLecturer) {
        toast.error('No lecturers found. Please add lecturers before creating mentor periods.');
        return;
      }

      // Check if there's an active period for this college that covers the current date
      const currentDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let activePeriod = periods.find(p => 
        p.is_active && 
        p.college_id === collegeId &&
        p.start_date <= currentDate &&
        p.end_date >= currentDate
      );
      
      if (!activePeriod) {
        // Create a new period for the current timeframe
        console.log('🔄 [handleAddStudentsComplete] No current period found, creating new period...');
        
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        
        // Create a unique name based on the current date
        const periodName = `Mentoring Period ${academicYear} (${new Date().toLocaleDateString()} onwards)`;
        
        const defaultPeriodData = {
          college_id: collegeId,
          name: periodName,
          academic_year: academicYear,
          start_date: currentDate,
          end_date: endDate,
          default_mentor_capacity: 15,
          default_office_location: 'TBD',
          default_available_hours: 'Mon-Fri 10:00 AM - 4:00 PM',
          is_active: true,
          created_by: firstLecturer,
        };

        try {
          activePeriod = await createPeriod(defaultPeriodData);
          console.log('✅ [handleAddStudentsComplete] New period created successfully:', activePeriod);
        } catch (periodError) {
          console.error('❌ [handleAddStudentsComplete] Error creating new period:', periodError);
          toast.error('Failed to create mentor period. Please try again.');
          return;
        }
      } else {
        console.log('✅ [handleAddStudentsComplete] Using existing period:', activePeriod);
      }

      await allocateStudents(mentorUuid, studentUuids, activePeriod.id, firstLecturer);

      setShowAddStudentsModal(false);
      setMentorForAddingStudents(null);
      
      toast.success(`Successfully added ${studentUuids.length} students to mentor`);
    } catch (error) {
      console.error('Error adding students:', error);
      toast.error('Failed to add students. Please try again.');
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
          Assign mentors to students and track mentoring interventions
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
            title="Students Allocated"
            value={filteredStatistics.allocatedStudents}
            icon={<AcademicCapIcon className="h-6 w-6" />}
            color="green"
          />

          <KPICard
            title="At-Risk Students"
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
                disabled={unallocatedStudents.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Allocate Students
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
                      {getMentorAtRiskStudentsLegacy(mentor.id).length > 0 && (
                        <div className="flex items-center gap-1">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">
                            {getMentorAtRiskStudentsLegacy(mentor.id).length} at-risk student{getMentorAtRiskStudentsLegacy(mentor.id).length > 1 ? 's' : ''}
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
                        const notesWithResponse = mentorNotes.filter(n => n.educator_response || n.action_taken);
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
                          const currentLoad = currentAllocation.students.length;
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
                            ? Math.max(...activeAllocations.map(a => a.capacity))
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
                        onClick={() => handleAddStudentsToMentor(mentor)}
                        disabled={(() => {
                          const currentLoad = getMentorCurrentLoadLegacy(mentor.id);
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                          return currentLoad >= maxCapacity || unallocatedStudents.length === 0 || activeAllocations.length === 0;
                        })()}
                        className="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Add Students"
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
                      {getMentorAtRiskStudentsLegacy(mentor.id).length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">
                            {getMentorAtRiskStudentsLegacy(mentor.id).length} at-risk
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
                        {getMentorAtRiskStudentsLegacy(mentor.id).length}
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
                        onClick={() => handleAddStudentsToMentor(mentor)}
                        disabled={(() => {
                          const currentLoad = getMentorCurrentLoadLegacy(mentor.id);
                          const activeAllocations = getMentorActiveAllocationsLegacy(mentor.id);
                          const maxCapacity = activeAllocations.length > 0 
                            ? Math.max(...activeAllocations.map(a => a.capacity))
                            : 15;
                          return currentLoad >= maxCapacity || unallocatedStudents.length === 0 || activeAllocations.length === 0;
                        })()}
                        className="px-2 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Add Students"
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
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
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
        {showStudentSelectionModal && (
          <StudentSelectionModal
            key="allocate-students"
            availableStudents={unallocatedStudents.filter(student => 
              (selectedBatch === "all" || student.batch === selectedBatch) &&
              (selectedDepartment === "all" || student.department === selectedDepartment)
            ) as any}
            onClose={() => setShowStudentSelectionModal(false)}
            onNext={handleStudentSelectionComplete}
            initialSelectedStudents={selectedStudentsForAllocation}
          />
        )}

        {showMentorSelectionModal && (
          <MentorSelectionModal
            selectedStudents={selectedStudentsForAllocation.map(id => 
              availableStudents.find(s => s.id === id)!
            ) as any}
            mentors={mentors as any}
            onClose={() => {
              setShowMentorSelectionModal(false);
              setSelectedStudentsForAllocation([]);
            }}
            onBack={handleBackToStudentSelection}
            onNext={handleMentorSelectionComplete}
            initialSelectedMentorId={selectedMentorForAllocation?.id || null}
            getMentorCurrentLoad={getMentorCurrentLoadLegacy}
            getMentorActiveAllocations={getMentorActiveAllocationsLegacy as any}
          />
        )}

        {showAllocationConfigModal && selectedMentorForAllocation && (
          <AllocationConfigurationModal
            selectedStudents={selectedStudentsForAllocation.map(id => 
              availableStudents.find(s => s.id === id)!
            ) as any}
            selectedMentor={selectedMentorForAllocation as any}
            onClose={() => {
              setShowAllocationConfigModal(false);
              setSelectedStudentsForAllocation([]);
              setSelectedMentorForAllocation(null);
            }}
            onBack={handleBackToMentorSelection}
            onAllocate={handleAllocateStudents}
            getMentorCurrentLoad={getMentorCurrentLoadLegacy}
            getMentorActiveAllocations={getMentorActiveAllocationsLegacy as any}
            allAllocations={allAllocations as any}
          />
        )}

        {showInterventionModal && (
          <InterventionModal
            student={selectedStudent as any}
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
              setSelectedStudent(null);
            }}
            onSave={handleAddIntervention}
          />
        )}

        {showFeedbackModal && selectedNoteForFeedback && (
          <InterventionFeedbackModal
            note={selectedNoteForFeedback}
            studentName={dynamicStudents.find(s => s.id === selectedNoteForFeedback.student_id)?.name || 'Unknown Student'}
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
              
              console.log('🔍 [MentorDetailsModal] Debug info:', {
                selectedMentorId: selectedMentor.id,
                mentorUuid: mentorUuid,
                totalNotes: dynamicNotes.length,
                notesForMentor: dynamicNotes.filter(n => n.mentor_id === mentorUuid).length
              });
              
              const filteredNotes = dynamicNotes.filter(n => {
                const matches = n.mentor_id === mentorUuid;
                if (matches) {
                  console.log('🎯 [MentorDetailsModal] Found matching note:', {
                    noteId: n.id,
                    mentorId: n.mentor_id,
                    studentId: n.student_id,
                    noteText: n.note_text
                  });
                }
                return matches;
              });
              
              const transformedNotes = filteredNotes.map(note => ({
                id: parseInt(note.id.replace(/-/g, '').substring(0, 8), 16),
                mentorId: selectedMentor.id,
                studentId: parseInt(note.student_id.replace(/-/g, '').substring(0, 8), 16),
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
              
              console.log('✅ [MentorDetailsModal] Transformed notes:', transformedNotes);
              return transformedNotes;
            })() as any}
            onClose={() => {
              setShowMentorDetailsModal(false);
              setSelectedMentor(null);
            }}
            onLogIntervention={(student) => {
              setSelectedStudent(student as any);
              setShowInterventionModal(true);
            }}
            onReassignStudent={(student) => {
              setStudentToReassign(student as any);
              setShowReassignModal(true);
            }}
            onConfigureAllocation={handleConfigureAllocation}
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

        {showReassignModal && studentToReassign && (
          <ReassignModal
            student={studentToReassign as any}
            mentors={mentors as any}
            onClose={() => {
              setShowReassignModal(false);
              setStudentToReassign(null);
            }}
            onReassign={handleReassignStudent}
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

        {showAddStudentsModal && mentorForAddingStudents && (
          <StudentSelectionModal
            key={`add-students-${mentorForAddingStudents.id}`}
            availableStudents={unallocatedStudents.filter(student => 
              (selectedBatch === "all" || student.batch === selectedBatch) &&
              (selectedDepartment === "all" || student.department === selectedDepartment)
            ) as any}
            title={`Add Students to ${mentorForAddingStudents.name}`}
            description={`Select students to assign to ${mentorForAddingStudents.name} (${mentorForAddingStudents.designation}). Available capacity: ${(() => {
              const currentLoad = getMentorCurrentLoadLegacy(mentorForAddingStudents.id);
              const activeAllocations = getMentorActiveAllocationsLegacy(mentorForAddingStudents.id);
              const maxCapacity = activeAllocations.length > 0 
                ? Math.max(...activeAllocations.map(a => a.capacity))
                : 15;
              return maxCapacity - currentLoad;
            })()} students`}
            buttonText="Add Selected Students"
            onClose={() => {
              setShowAddStudentsModal(false);
              setMentorForAddingStudents(null);
            }}
            onNext={handleAddStudentsComplete}
          />
        )}
      </div>
    </div>
  );
};

export default MentorAllocation;