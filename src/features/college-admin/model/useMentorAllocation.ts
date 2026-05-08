import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-mentor-allocation');


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
  getLearners,
  getMentorPeriods,
  getMentorAllocations,
  getMentorNotes,
  getCourseMappingDepartments,
  getCourseMappingPrograms,
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
  type Learner,
  type MentorPeriod,
  type MentorAllocation,
  type MentorNote,
} from '../api';

export interface ProcessedMentor extends Mentor {
  allocations: ProcessedAllocation[];
  current_load: number;
  at_risk_learners: number;
  total_interventions: number;
}

export interface ProcessedAllocation {
  id: string;
  period: MentorPeriod;
  learners: Learner[];
  mentor_id: string;
  status: string;
  assigned_date: string;
  created_at: string;
  capacity?: number; // Add capacity field for compatibility
}

export interface ProcessedLearner extends Learner {
  allocation_id?: string;
  mentor_id?: string;
  mentor_name?: string;
  period_id?: string;
}

export const useMentorAllocation = (collegeId: string) => {
  const user = useUser() as AuthUser | null;


  // Data states
  const [mentors, setMentors] = useState<ProcessedMentor[]>([]);
  const [learners, setlearners] = useState<Learner[]>([]);
  const [periods, setPeriods] = useState<MentorPeriod[]>([]);
  const [allocations, setAllocations] = useState<MentorAllocation[]>([]);
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; code: string; department_name: string }>>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    if (!collegeId) {
      setError('No college ID available. Please ensure you are logged in with a valid college account.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        mentorsData,
        learnersData,
        periodsData,
        allocationsData,
        notesData,
        departmentsData,
        programsData,
      ] = await Promise.all([
        getMentors(collegeId),
        getLearners(collegeId),
        getMentorPeriods(collegeId),
        getMentorAllocations(collegeId),
        getMentorNotes(collegeId),
        getCourseMappingDepartments(collegeId),
        getCourseMappingPrograms(collegeId),
      ]);


      setMentors(mentorsData as ProcessedMentor[]);
      setlearners(learnersData);
      setPeriods(periodsData);
      setAllocations(allocationsData);
      setNotes(notesData);
      setDepartments(departmentsData);
      setPrograms(programsData);
    } catch (err) {
      logger.error('Error fetching data', err as Error, { collegeId });
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

        // Create the allocation object (even if no learners)
        acc[key] = {
          id: key,
          period,
          learners: [],
          mentor_id: mentor.id,
          status: periodAllocations.length > 0 ? 'active' : 'available', // 'available' for periods with no learners
          assigned_date: periodAllocations[0]?.assigned_date || new Date().toISOString().split('T')[0],
          created_at: periodAllocations[0]?.created_at || new Date().toISOString(),
          capacity: period.default_mentor_capacity || 15, // Add capacity from period
        };

        // Add learners if there are any allocations
        periodAllocations.forEach(allocation => {
          const learner = learners.find(s => s.id === allocation.learner_id);
          if (learner) {
            // Check if learner is already in the list (prevent duplicates)
            const alreadyAdded = acc[key].learners.some(s => s.id === learner.id);
            if (!alreadyAdded) {
              // Add intervention count and last interaction from notes
              const learnerNotes = notes.filter(n => n.learner_id === learner.id && n.mentor_id === mentor.id);
              const lastNote = learnerNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

              const processedLearner = {
                ...learner,
                intervention_count: learnerNotes.length,
                last_interaction: lastNote?.note_date || undefined,
              };

              acc[key].learners.push(processedLearner);
            }
          }
        });

        return acc;
      }, {} as Record<string, ProcessedAllocation>);

      const processedAllocations = Object.values(allocationsByPeriod);

      // Calculate statistics (only count periods with actual learners)
      const currentLoad = processedAllocations.reduce((total, allocation) => total + allocation.learners.length, 0);
      const atRisklearners = processedAllocations.reduce(
        (total, allocation) => total + allocation.learners.filter(s => s.at_risk).length,
        0
      );
      const totalInterventions = notes.filter(n => n.mentor_id === mentor.id).length;

      return {
        ...mentor,
        allocations: processedAllocations,
        current_load: currentLoad,
        at_risk_learners: atRisklearners,
        total_interventions: totalInterventions,
      };
    });
  }, [mentors, allocations, periods, learners, notes]);

  // Get unallocated learners
  const unallocatedlearners = useMemo(() => {
    const allocatedLearnerIds = allocations
      .filter(allocation => allocation.status === 'active' || allocation.status === 'pending')
      .map(allocation => allocation.learner_id);

    return learners.filter(learner => !allocatedLearnerIds.includes(learner.id));
  }, [learners, allocations]);

  // Get at-risk learners
  const atRisklearners = useMemo(() => {
    return learners.filter(learner => learner.at_risk);
  }, [learners]);

  // Get active periods
  const activePeriods = useMemo(() => {
    return periods.filter(period => period.is_active);
  }, [periods]);

  // Get unique departments from mentors
  const uniqueDepartments = useMemo(() => {
    const depts = new Set(mentors.map(m => m.department).filter(Boolean));
    return Array.from(depts);
  }, [mentors]);

  // Get unique batches from learners
  const uniqueBatches = useMemo(() => {
    const batches = new Set(learners.map(s => s.batch).filter(Boolean));
    return Array.from(batches);
  }, [learners]);

  // Statistics
  const statistics = useMemo(() => {
    const totalMentors = mentors.length;
    const totallearners = learners.length;
    const allocatedlearners = allocations.filter(a => a.status === 'active').length;
    const totalAtRisk = atRisklearners.length;
    const totalInterventions = notes.length;

    return {
      totalMentors,
      totallearners,
      allocatedlearners,
      unallocatedlearners: totallearners - allocatedlearners,
      totalAtRisk,
      totalInterventions,
    };
  }, [mentors, learners, allocations, atRisklearners, notes]);

  // Helper functions
  const getMentorCurrentLoad = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.current_load || 0;
  };

  const getMentorActiveAllocations = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.allocations || [];
  };

  const getMentorAtRisklearners = (mentorId: string) => {
    const mentor = processedMentors.find(m => m.id === mentorId);
    return mentor?.allocations.flatMap(allocation =>
      allocation.learners.filter(learner => learner.at_risk)
    ) || [];
  };

  // Actions
  const allocatelearners = async (
    mentorId: string,
    learnerIds: string[],
    periodId: string,
    assignedBy: string
  ) => {
    try {
      // Find the period to determine the correct status
      const period = periods.find(p => p.id === periodId);

      // Determine allocation status based on period dates
      let allocationStatus: 'pending' | 'active' = 'active'; // Default to active

      if (period) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(period.start_date);
        startDate.setHours(0, 0, 0, 0);

        // If period hasn't started yet, status should be 'pending'
        // If period has started, status should be 'active'
        allocationStatus = today < startDate ? 'pending' : 'active';
      }

      const allocationsToCreate = learnerIds.map(learnerId => ({
        mentor_id: mentorId,
        learner_id: learnerId,
        period_id: periodId,
        assigned_date: new Date().toISOString().split('T')[0],
        assigned_by: assignedBy,
        status: allocationStatus,
      }));

      const newAllocations = await createMentorAllocations(allocationsToCreate);
      setAllocations(prev => [...prev, ...newAllocations]);

      return newAllocations;
    } catch (err) {
      logger.error('Error allocating learners', err as Error, { mentorId, learnerCount: learnerIds.length, periodId });
      throw err;
    }
  };

  const addMentorNote = async (
    allocationId: string,
    mentorId: string,
    learnerId: string,
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
        actualAllocationId = await findAllocationId(mentorId, learnerId, 'active') || '';
        if (!actualAllocationId) {
          throw new Error('No active allocation found for this mentor-learner pair');
        }
      }

      const newNote = await createMentorNote({
        allocation_id: actualAllocationId,
        mentor_id: mentorId,
        learner_id: learnerId,
        note_date: new Date().toISOString().split('T')[0],
        ...noteData,
      });

      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (err) {
      logger.error('Error adding mentor note', err as Error);
      throw err;
    }
  };

  const reassignLearner = async (
    allocationId: string,
    newMentorId: string,
    newPeriodId: string,
    reason?: string
  ) => {
    try {

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

      if (currentLoad >= maxCapacity) {
        throw new Error(`New mentor has reached maximum capacity in this period (${currentLoad}/${maxCapacity})`);
      }

      // Step 1: Mark the current allocation as transferred
      await updateMentorAllocation(allocationId, {
        status: 'transferred',
        completion_date: new Date().toISOString().split('T')[0],
        transfer_reason: reason || 'Reassigned to different mentor/period',
      });

      // Step 2: Create new allocation with the new mentor and period
      const newAllocationData = {
        mentor_id: newMentorId,
        learner_id: currentAllocation.learner_id,
        period_id: newPeriodId,
        assigned_date: new Date().toISOString().split('T')[0],
        assigned_by: newMentorId, // Use new mentor as assigned_by since they're a valid lecturer
        status: 'active' as const,
        transfer_reason: reason || `Transferred from previous mentor${currentAllocation.period_id !== newPeriodId ? ' to different period' : ''}`,
      };

      const newAllocations = await createMentorAllocations([newAllocationData]);
      const newAllocation = newAllocations[0];

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
      await fetchData();

      return newAllocation;
    } catch (err) {
      logger.error('Error reassigning learner', err as Error);
      throw err;
    }
  };

  const createPeriod = async (periodData: Omit<MentorPeriod, 'id' | 'created_at'>) => {
    try {
      const newPeriod = await createMentorPeriod(periodData);
      setPeriods(prev => [...prev, newPeriod]);
      return newPeriod;
    } catch (err) {
      logger.error('Error creating period', err as Error);
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
      logger.error('Error updating period', err as Error, { periodId });
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
      logger.error('Error updating note response', err as Error, { noteId });
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
      logger.error('Error updating note feedback', err as Error, { noteId });
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
      logger.error('Error resolving note', err as Error, { noteId });
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
      logger.error('Error escalating note', err as Error, { noteId });
      throw err;
    }
  };

  return {
    // Data
    mentors: processedMentors,
    learners,
    periods,
    allocations,
    notes,
    departments,
    programs,
    unallocatedlearners,
    atRisklearners,
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
    getMentorAtRisklearners,

    // Actions
    allocatelearners,
    addMentorNote,
    reassignLearner,
    createPeriod,
    updatePeriod,
    updateNoteResponse,
    updateNoteFeedback,
    markNoteResolved,
    escalateNoteAction,
    refetch: fetchData,
  };
};