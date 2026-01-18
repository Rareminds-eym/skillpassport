import { useState, useEffect, useMemo } from 'react';
// @ts-ignore - AuthContext is a .jsx file
import { useAuth } from '../context/AuthContext';

// Type assertion for AuthContext
interface AuthUser {
  id: string;
  email: string;
  role: string;
  college_id?: string;
  universityCollegeId?: string;
  [key: string]: any;
}
import {
  getMentors,
  getStudents,
  getMentorPeriods,
  getMentorAllocations,
  getMentorNotes,
  getDepartments,
  getPrograms,
  createMentorPeriod,
  createMentorAllocations,
  createMentorNote,
  updateMentorAllocation,
  updateMentorPeriod,
  findAllocationId,
  updateMentorNoteResponse,
  updateMentorNoteFeedback,
  resolveNote,
  escalateNote,
  type Mentor,
  type Student,
  type MentorPeriod,
  type MentorAllocation,
  type MentorNote,
} from '../services/mentorAllocationService';

export interface ProcessedMentor extends Mentor {
  allocations: ProcessedAllocation[];
  current_load: number;
  at_risk_students: number;
  total_interventions: number;
}

export interface ProcessedAllocation {
  id: string;
  period: MentorPeriod;
  students: Student[];
  mentor_id: string;
  status: string;
  assigned_date: string;
  created_at: string;
  capacity?: number; // Add capacity field for compatibility
}

export interface ProcessedStudent extends Student {
  allocation_id?: string;
  mentor_id?: string;
  mentor_name?: string;
  period_id?: string;
}

export const useMentorAllocation = (collegeId: string) => {
  const { user } = useAuth() as { user: AuthUser | null };
  
  // Debug logging for college ID
  console.log('🔍 [useMentorAllocation] College ID received:', collegeId);
  console.log('🔍 [useMentorAllocation] User context:', user);
  
  // Data states
  const [mentors, setMentors] = useState<ProcessedMentor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<MentorPeriod[]>([]);
  const [allocations, setAllocations] = useState<MentorAllocation[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [departments, setDepartments] = useState<Array<{id: string; name: string}>>([]);
  const [programs, setPrograms] = useState<Array<{id: string; name: string; code: string; department_name: string}>>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    if (!collegeId) {
      console.log('❌ [useMentorAllocation] No college ID provided');
      setError('No college ID available. Please ensure you are logged in with a valid college account.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [useMentorAllocation] Fetching data for college:', collegeId);

      const [
        mentorsData,
        studentsData,
        periodsData,
        allocationsData,
        notesData,
        departmentsData,
        programsData,
      ] = await Promise.all([
        getMentors(collegeId),
        getStudents(collegeId),
        getMentorPeriods(collegeId),
        getMentorAllocations(collegeId),
        getMentorNotes(collegeId),
        getDepartments(collegeId),
        getPrograms(collegeId),
      ]);

      console.log('✅ [useMentorAllocation] Data fetched successfully:', {
        mentors: mentorsData.length,
        students: studentsData.length,
        periods: periodsData.length,
        allocations: allocationsData.length,
        notes: notesData.length,
        departments: departmentsData.length,
        programs: programsData.length,
      });

      setMentors(mentorsData as ProcessedMentor[]);
      setStudents(studentsData);
      setPeriods(periodsData);
      setAllocations(allocationsData);
      setNotes(notesData);
      setDepartments(departmentsData);
      setPrograms(programsData);
    } catch (err) {
      console.error('❌ [useMentorAllocation] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collegeId]);

  // Process mentors with their allocations and statistics
  const processedMentors = useMemo(() => {
    return mentors.map(mentor => {
      // Get all periods for this college (not just those with allocations)
      const allPeriods = periods.filter(period => period.is_active !== false); // Include active and null is_active
      
      // Get allocations for this mentor
      const mentorAllocations = allocations.filter(
        allocation => allocation.mentor_id === mentor.id
      );

      // Create allocations for all periods (including empty ones)
      const allocationsByPeriod = allPeriods.reduce((acc, period) => {
        const key = period.id;
        
        // Get allocations for this specific period
        const periodAllocations = mentorAllocations.filter(
          allocation => allocation.period_id === period.id && 
          (allocation.status === 'active' || allocation.status === 'pending')
        );

        // Create the allocation object (even if no students)
        acc[key] = {
          id: key,
          period,
          students: [],
          mentor_id: mentor.id,
          status: periodAllocations.length > 0 ? 'active' : 'available', // 'available' for periods with no students
          assigned_date: periodAllocations[0]?.assigned_date || new Date().toISOString().split('T')[0],
          created_at: periodAllocations[0]?.created_at || new Date().toISOString(),
          capacity: period.default_mentor_capacity || 15, // Add capacity from period
        };

        // Add students if there are any allocations
        periodAllocations.forEach(allocation => {
          const student = students.find(s => s.id === allocation.student_id);
          if (student) {
            // Add intervention count and last interaction from notes
            const studentNotes = notes.filter(n => n.student_id === student.id && n.mentor_id === mentor.id);
            const lastNote = studentNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            const processedStudent = {
              ...student,
              intervention_count: studentNotes.length,
              last_interaction: lastNote?.note_date || undefined,
            };
            
            acc[key].students.push(processedStudent);
          }
        });

        return acc;
      }, {} as Record<string, ProcessedAllocation>);

      const processedAllocations = Object.values(allocationsByPeriod);

      // Calculate statistics (only count periods with actual students)
      const currentLoad = processedAllocations.reduce((total, allocation) => total + allocation.students.length, 0);
      const atRiskStudents = processedAllocations.reduce(
        (total, allocation) => total + allocation.students.filter(s => s.at_risk).length,
        0
      );
      const totalInterventions = notes.filter(n => n.mentor_id === mentor.id).length;

      return {
        ...mentor,
        allocations: processedAllocations,
        current_load: currentLoad,
        at_risk_students: atRiskStudents,
        total_interventions: totalInterventions,
      };
    });
  }, [mentors, allocations, periods, students, notes]);

  // Get unallocated students
  const unallocatedStudents = useMemo(() => {
    const allocatedStudentIds = allocations
      .filter(allocation => allocation.status === 'active')
      .map(allocation => allocation.student_id);
    
    return students.filter(student => !allocatedStudentIds.includes(student.id));
  }, [students, allocations]);

  // Get at-risk students
  const atRiskStudents = useMemo(() => {
    return students.filter(student => student.at_risk);
  }, [students]);

  // Get active periods
  const activePeriods = useMemo(() => {
    return periods.filter(period => period.is_active);
  }, [periods]);

  // Get unique departments from mentors
  const uniqueDepartments = useMemo(() => {
    const depts = new Set(mentors.map(m => m.department).filter(Boolean));
    return Array.from(depts);
  }, [mentors]);

  // Get unique batches from students
  const uniqueBatches = useMemo(() => {
    const batches = new Set(students.map(s => s.batch).filter(Boolean));
    return Array.from(batches);
  }, [students]);

  // Statistics
  const statistics = useMemo(() => {
    const totalMentors = mentors.length;
    const totalStudents = students.length;
    const allocatedStudents = allocations.filter(a => a.status === 'active').length;
    const totalAtRisk = atRiskStudents.length;
    const totalInterventions = notes.length;

    return {
      totalMentors,
      totalStudents,
      allocatedStudents,
      unallocatedStudents: totalStudents - allocatedStudents,
      totalAtRisk,
      totalInterventions,
    };
  }, [mentors, students, allocations, atRiskStudents, notes]);

  // Helper functions
  const getMentorCurrentLoad = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.current_load || 0;
  };

  const getMentorActiveAllocations = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.allocations || [];
  };

  const getMentorAtRiskStudents = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.allocations.flatMap(allocation => 
      allocation.students.filter(student => student.at_risk)
    ) || [];
  };

  // Actions
  const allocateStudents = async (
    mentorId: string,
    studentIds: string[],
    periodId: string,
    assignedBy: string
  ) => {
    try {
      // Find the period to determine the correct status
      const period = periods.find(p => p.id === periodId);
      if (!period) {
        throw new Error('Period not found');
      }

      // Determine allocation status based on period dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(period.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      // If period hasn't started yet, status should be 'pending'
      // If period has started, status should be 'active'
      const allocationStatus = today < startDate ? 'pending' : 'active';
      
      console.log('🔍 [allocateStudents] Period status check:', {
        periodId,
        periodName: period.name,
        startDate: period.start_date,
        today: today.toISOString().split('T')[0],
        status: allocationStatus
      });

      const allocationsToCreate = studentIds.map(studentId => ({
        mentor_id: mentorId,
        student_id: studentId,
        period_id: periodId,
        assigned_date: new Date().toISOString().split('T')[0],
        assigned_by: assignedBy,
        status: allocationStatus,
      }));

      const newAllocations = await createMentorAllocations(allocationsToCreate);
      setAllocations(prev => [...prev, ...newAllocations]);
      
      return newAllocations;
    } catch (err) {
      console.error('Error allocating students:', err);
      throw err;
    }
  };

  const addMentorNote = async (
    allocationId: string,
    mentorId: string,
    studentId: string,
    noteData: {
      title?: string;
      note_text: string;
      outcome?: string;
      intervention_type: MentorNote['intervention_type'];
      status: MentorNote['status'];
      is_private: boolean;
      priority?: MentorNote['priority'];
      follow_up_required?: boolean;
      follow_up_date?: string;
      created_by_role?: 'admin' | 'educator';
      created_by_id?: string;
      admin_feedback?: string;
      educator_response?: string;
      action_taken?: string;
      next_steps?: string;
    }
  ) => {
    try {
      // If no allocation ID provided, try to find it
      let actualAllocationId = allocationId;
      if (!allocationId || allocationId === 'placeholder-allocation-id') {
        actualAllocationId = await findAllocationId(mentorId, studentId, 'active') || '';
        if (!actualAllocationId) {
          throw new Error('No active allocation found for this mentor-student pair');
        }
      }

      const newNote = await createMentorNote({
        allocation_id: actualAllocationId,
        mentor_id: mentorId,
        student_id: studentId,
        note_date: new Date().toISOString().split('T')[0],
        ...noteData,
      });

      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (err) {
      console.error('Error adding mentor note:', err);
      throw err;
    }
  };

  const reassignStudent = async (
    allocationId: string,
    newMentorId: string,
    newPeriodId: string,
    reason?: string
  ) => {
    try {
      console.log('🔄 [reassignStudent] Starting reassignment:', {
        allocationId,
        newMentorId,
        newPeriodId,
        reason
      });

      // Validate allocation ID
      if (!allocationId || allocationId === 'placeholder-allocation-id') {
        throw new Error('Valid allocation ID is required for reassignment');
      }

      // Validate period ID
      if (!newPeriodId) {
        throw new Error('Period selection is required for reassignment');
      }

      // Get the current allocation details
      const currentAllocation = allocations.find(a => a.id === allocationId);
      if (!currentAllocation) {
        throw new Error('Current allocation not found');
      }

      console.log('📋 [reassignStudent] Current allocation:', {
        id: currentAllocation.id,
        currentMentorId: currentAllocation.mentor_id,
        currentPeriodId: currentAllocation.period_id,
        studentId: currentAllocation.student_id,
        status: currentAllocation.status
      });

      // Validate the allocation is active
      if (currentAllocation.status !== 'active') {
        throw new Error(`Cannot reassign: allocation status is '${currentAllocation.status}', must be 'active'`);
      }

      // Validate new mentor is different from current mentor OR period is different
      if (currentAllocation.mentor_id === newMentorId && currentAllocation.period_id === newPeriodId) {
        throw new Error('New mentor and period cannot be the same as current assignment');
      }

      // Check if new mentor has capacity in the selected period
      const newMentorAllocationsInPeriod = allocations.filter(a => 
        a.mentor_id === newMentorId && 
        a.period_id === newPeriodId &&
        a.status === 'active'
      );

      const period = periods.find(p => p.id === newPeriodId);
      if (!period) {
        throw new Error('Selected period not found');
      }

      const maxCapacity = period.default_mentor_capacity || 15;
      const currentLoad = newMentorAllocationsInPeriod.length;

      console.log('📊 [reassignStudent] New mentor capacity check:', {
        newMentorId,
        periodId: newPeriodId,
        periodName: period.name,
        currentLoad,
        maxCapacity,
        hasCapacity: currentLoad < maxCapacity
      });

      if (currentLoad >= maxCapacity) {
        throw new Error(`New mentor has reached maximum capacity in this period (${currentLoad}/${maxCapacity})`);
      }

      // Step 1: Mark the current allocation as transferred
      console.log('✏️ [reassignStudent] Marking old allocation as transferred...');
      await updateMentorAllocation(allocationId, {
        status: 'transferred',
        completion_date: new Date().toISOString().split('T')[0],
        transfer_reason: reason || 'Reassigned to different mentor/period',
      });

      // Step 2: Create new allocation with the new mentor and period
      console.log('➕ [reassignStudent] Creating new allocation...');
      const newAllocationData = {
        mentor_id: newMentorId,
        student_id: currentAllocation.student_id,
        period_id: newPeriodId,
        assigned_date: new Date().toISOString().split('T')[0],
        assigned_by: newMentorId, // Use new mentor as assigned_by since they're a valid lecturer
        status: 'active' as const,
        transfer_reason: reason || `Transferred from previous mentor${currentAllocation.period_id !== newPeriodId ? ' to different period' : ''}`,
      };

      const newAllocations = await createMentorAllocations([newAllocationData]);
      const newAllocation = newAllocations[0];

      console.log('✅ [reassignStudent] New allocation created:', {
        id: newAllocation.id,
        mentorId: newAllocation.mentor_id,
        studentId: newAllocation.student_id,
        periodId: newAllocation.period_id,
        status: newAllocation.status
      });

      // Step 3: Update local state
      setAllocations(prev => 
        prev.map(a => 
          a.id === allocationId 
            ? { 
                ...a, 
                status: 'transferred', 
                completion_date: new Date().toISOString().split('T')[0], 
                transfer_reason: reason || 'Reassigned to different mentor/period'
              }
            : a
        ).concat(newAllocation)
      );

      // Step 4: Refresh all data to ensure consistency
      console.log('🔄 [reassignStudent] Refreshing all data...');
      await fetchData();

      console.log('✅ [reassignStudent] Reassignment completed successfully');
      return newAllocation;
    } catch (err) {
      console.error('❌ [reassignStudent] Error:', err);
      throw err;
    }
  };

  const createPeriod = async (periodData: Omit<MentorPeriod, 'id' | 'created_at'>) => {
    try {
      const newPeriod = await createMentorPeriod(periodData);
      setPeriods(prev => [...prev, newPeriod]);
      return newPeriod;
    } catch (err) {
      console.error('Error creating period:', err);
      throw err;
    }
  };

  const updatePeriod = async (periodId: string, updates: Partial<MentorPeriod>) => {
    try {
      const updatedPeriod = await updateMentorPeriod(periodId, updates);
      setPeriods(prev => prev.map(p => p.id === periodId ? updatedPeriod : p));
      
      // Refetch all data to ensure consistency across all components
      await fetchData();
      
      return updatedPeriod;
    } catch (err) {
      console.error('Error updating period:', err);
      throw err;
    }
  };

  const updateNoteResponse = async (
    noteId: string,
    response: {
      educator_response: string;
      action_taken?: string;
      next_steps?: string;
    }
  ) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updatedNote = await updateMentorNoteResponse(noteId, {
        ...response,
        last_updated_by: user.id,
      });
      
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      console.error('Error updating note response:', err);
      throw err;
    }
  };

  const updateNoteFeedback = async (
    noteId: string,
    feedback: {
      admin_feedback?: string;
      priority?: string;
      follow_up_required?: boolean;
      follow_up_date?: string;
    }
  ) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updatedNote = await updateMentorNoteFeedback(noteId, {
        ...feedback,
        last_updated_by: user.id,
      });
      
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      console.error('Error updating note feedback:', err);
      throw err;
    }
  };

  const markNoteResolved = async (noteId: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updatedNote = await resolveNote(noteId, user.id);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      console.error('Error resolving note:', err);
      throw err;
    }
  };

  const escalateNoteAction = async (noteId: string, reason: string) => {
    try {
      if (!user?.id) throw new Error('User not authenticated');
      
      const updatedNote = await escalateNote(noteId, reason, user.id);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err) {
      console.error('Error escalating note:', err);
      throw err;
    }
  };

  return {
    // Data
    mentors: processedMentors,
    students,
    periods,
    allocations,
    notes,
    departments,
    programs,
    unallocatedStudents,
    atRiskStudents,
    activePeriods,
    uniqueDepartments,
    uniqueBatches,
    statistics,
    
    // State
    loading,
    error,
    
    // Helper functions
    getMentorCurrentLoad,
    getMentorActiveAllocations,
    getMentorAtRiskStudents,
    
    // Actions
    allocateStudents,
    addMentorNote,
    reassignStudent,
    createPeriod,
    updatePeriod,
    updateNoteResponse,
    updateNoteFeedback,
    markNoteResolved,
    escalateNoteAction,
    refetch: fetchData,
  };
};