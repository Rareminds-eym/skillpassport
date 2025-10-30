import { supabase } from '../lib/supabaseClient';

// ==================== REQUISITION OPERATIONS ====================

/**
 * Get all requisitions
 */
export const getRequisitions = async () => {
  try {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .order('created_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    return { data: null, error };
  }
};

/**
 * Get a single requisition by ID
 */
export const getRequisitionById = async (requisitionId: string) => {
  try {
    const { data, error } = await supabase
      .from('requisitions')
      .select('*')
      .eq('id', requisitionId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching requisition:', error);
    return { data: null, error };
  }
};

/**
 * Get requisitions with pipeline stats
 */
export const getRequisitionsWithStats = async () => {
  try {
    const { data, error } = await supabase
      .from('requisitions_with_pipeline_stats')
      .select('*')
      .order('created_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching requisitions with stats:', error);
    return { data: null, error };
  }
};

// ==================== PIPELINE CANDIDATE OPERATIONS ====================

/**
 * Get all pipeline candidates for a requisition
 * If requisitionId is empty, fetch all candidates from all requisitions
 */
export const getPipelineCandidates = async (requisitionId?: string) => {
  try {
    let query = supabase
      .from('pipeline_candidates_detailed')
      .select('*');
    
    // Only filter by requisition_id if provided
    if (requisitionId) {
      query = query.eq('requisition_id', requisitionId);
    }
    
    const { data, error } = await query.order('added_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pipeline candidates:', error);
    return { data: null, error };
  }
};

/**
 * Get pipeline candidates for a specific stage
 */
export const getPipelineCandidatesByStage = async (requisitionId: string, stage: string) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .select(`
        *,
        students (*)
      `)
      .eq('requisition_id', requisitionId)
      .eq('stage', stage)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching pipeline candidates by stage:', error);
    return { data: null, error };
  }
};

/**
 * Get pipeline candidates with advanced filters and sorting (SQL-optimized)
 */
export const getPipelineCandidatesWithFilters = async (
  requisitionId: string,
  filters: {
    stages?: string[]
    skills?: string[]
    departments?: string[]
    locations?: string[]
    sources?: string[]
    aiScoreRange?: { min?: number; max?: number }
    nextActionTypes?: string[]
    hasNextAction?: boolean | null
    assignedTo?: string[]
    dateAdded?: { startDate?: string; endDate?: string }
    lastUpdated?: { startDate?: string; endDate?: string }
  },
  sortOptions?: {
    field: string
    direction: 'asc' | 'desc'
  }
) => {
  try {
    // Start with base query
    let query = supabase
      .from('pipeline_candidates')
      .select(`
        *,
        students (*)
      `)
      .eq('requisition_id', requisitionId)
      .eq('status', 'active');

    // Apply stage filters
    if (filters.stages && filters.stages.length > 0) {
      query = query.in('stage', filters.stages);
    }

    // Apply source filters
    if (filters.sources && filters.sources.length > 0) {
      query = query.in('source', filters.sources);
    }

    // Apply next action filters
    if (filters.nextActionTypes && filters.nextActionTypes.length > 0) {
      query = query.in('next_action', filters.nextActionTypes);
    }

    // Filter by has next action
    if (filters.hasNextAction === true) {
      query = query.not('next_action', 'is', null);
    } else if (filters.hasNextAction === false) {
      query = query.is('next_action', null);
    }

    // Apply assigned to filters
    if (filters.assignedTo && filters.assignedTo.length > 0) {
      query = query.in('assigned_to', filters.assignedTo);
    }

    // Apply date added filters
    if (filters.dateAdded?.startDate) {
      query = query.gte('added_at', filters.dateAdded.startDate);
    }
    if (filters.dateAdded?.endDate) {
      query = query.lte('added_at', filters.dateAdded.endDate);
    }

    // Apply last updated filters
    if (filters.lastUpdated?.startDate) {
      query = query.gte('updated_at', filters.lastUpdated.startDate);
    }
    if (filters.lastUpdated?.endDate) {
      query = query.lte('updated_at', filters.lastUpdated.endDate);
    }

    // Apply sorting (default to updated_at desc)
    if (sortOptions) {
      const { field, direction } = sortOptions;
      const ascending = direction === 'asc';

      // Map sort fields to database columns
      switch (field) {
        case 'candidate_name':
          query = query.order('candidate_name', { ascending });
          break;
        case 'added_at':
          query = query.order('added_at', { ascending });
          break;
        case 'updated_at':
          query = query.order('updated_at', { ascending });
          break;
        case 'next_action_date':
          query = query.order('next_action_date', { ascending, nullsFirst: !ascending });
          break;
        case 'stage_changed_at':
          query = query.order('stage_changed_at', { ascending });
          break;
        case 'source':
          query = query.order('source', { ascending });
          break;
        default:
          query = query.order('updated_at', { ascending: false });
      }
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    // Apply client-side filters for student data (skills, department, location, AI score)
    let filteredData = data || [];

    // Filter by skills (check if student has any of the selected skills)
    if (filters.skills && filters.skills.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const studentSkills = candidate.students?.skills || [];
        return filters.skills.some(skill => 
          studentSkills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }

    // Filter by department
    if (filters.departments && filters.departments.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const dept = candidate.students?.dept || '';
        return filters.departments.includes(dept);
      });
    }

    // Filter by location
    if (filters.locations && filters.locations.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const location = candidate.students?.location || '';
        return filters.locations.includes(location);
      });
    }

    // Filter by AI score range
    if (filters.aiScoreRange) {
      filteredData = filteredData.filter(candidate => {
        const score = candidate.students?.ai_score_overall || 0;
        const meetsMin = filters.aiScoreRange.min ? score >= filters.aiScoreRange.min : true;
        const meetsMax = filters.aiScoreRange.max ? score <= filters.aiScoreRange.max : true;
        return meetsMin && meetsMax;
      });
    }

    // Apply client-side sorting for student-related fields
    if (sortOptions && ['ai_score', 'department', 'location'].includes(sortOptions.field)) {
      const { field, direction } = sortOptions;
      const multiplier = direction === 'asc' ? 1 : -1;

      filteredData.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (field) {
          case 'ai_score':
            aValue = a.students?.ai_score_overall || 0;
            bValue = b.students?.ai_score_overall || 0;
            return (aValue - bValue) * multiplier;
          
          case 'department':
            aValue = (a.students?.dept || '').toLowerCase();
            bValue = (b.students?.dept || '').toLowerCase();
            return aValue.localeCompare(bValue) * multiplier;
          
          case 'location':
            aValue = (a.students?.location || '').toLowerCase();
            bValue = (b.students?.location || '').toLowerCase();
            return aValue.localeCompare(bValue) * multiplier;
          
          default:
            return 0;
        }
      });
    }

    return { data: filteredData, error: null };
  } catch (error) {
    console.error('Error fetching pipeline candidates with filters:', error);
    return { data: null, error };
  }
};

/**
 * Get all pipeline candidates grouped by stage
 */
export const getAllPipelineCandidatesByStage = async (requisitionId: string) => {
  try {
    const { data, error } = await getPipelineCandidates(requisitionId);
    
    if (error) throw error;

    // Group candidates by stage
    const grouped = {
      sourced: [],
      screened: [],
      interview_1: [],
      interview_2: [],
      offer: [],
      hired: []
    };

    (data || []).forEach(candidate => {
      if (grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate);
      }
    });

    return { data: grouped, error: null };
  } catch (error) {
    console.error('Error grouping pipeline candidates:', error);
    return { data: null, error };
  }
};

/**
 * Add candidate to pipeline
 */
export const addCandidateToPipeline = async (pipelineData: {
  requisition_id: string;
  student_id: string;
  candidate_name: string;
  candidate_email?: string;
  candidate_phone?: string;
  stage?: string;
  source?: string;
  added_by?: string;
  next_action?: string;
  next_action_notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .insert([{
        ...pipelineData,
        stage: pipelineData.stage || 'sourced',
        source: pipelineData.source || 'talent_pool',
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      // Check for duplicate entry
      if (error.code === '23505') {
        return {
          data: null,
          error: {
            ...error,
            message: 'Candidate is already in this pipeline'
          }
        };
      }
      throw error;
    }

    // Log activity
    if (data) {
      await logPipelineActivity({
        pipeline_candidate_id: data.id,
        activity_type: 'stage_change',
        from_stage: null,
        to_stage: data.stage,
        performed_by: pipelineData.added_by
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error adding candidate to pipeline:', error);
    return { data: null, error };
  }
};

/**
 * Move candidate to a different stage
 */
export const moveCandidateToStage = async (
  candidateId: number,
  newStage: string,
  performedBy?: string,
  notes?: string
) => {
  try {
    // Get current candidate data
    const { data: currentData, error: fetchError } = await supabase
      .from('pipeline_candidates')
      .select('stage')
      .eq('id', candidateId)
      .single();

    if (fetchError) throw fetchError;

    const previousStage = currentData.stage;

    // Update the candidate
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        stage: newStage,
        previous_stage: previousStage,
        stage_changed_at: new Date().toISOString(),
        stage_changed_by: performedBy
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;

    // Log the stage change
    await logPipelineActivity({
      pipeline_candidate_id: candidateId,
      activity_type: 'stage_change',
      from_stage: previousStage,
      to_stage: newStage,
      activity_details: notes ? { notes } : null,
      performed_by: performedBy
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error moving candidate:', error);
    return { data: null, error };
  }
};

/**
 * Update next action for candidate
 */
export const updateNextAction = async (
  candidateId: number,
  nextAction: string,
  nextActionDate?: string,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        next_action: nextAction,
        next_action_date: nextActionDate,
        next_action_notes: notes
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating next action:', error);
    return { data: null, error };
  }
};

/**
 * Reject candidate
 */
export const rejectCandidate = async (
  candidateId: number,
  rejectionReason?: string,
  performedBy?: string
) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        status: 'rejected',
        stage: 'rejected',
        rejection_reason: rejectionReason,
        rejection_date: new Date().toISOString()
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;

    // Log rejection
    await logPipelineActivity({
      pipeline_candidate_id: candidateId,
      activity_type: 'stage_change',
      from_stage: data.previous_stage,
      to_stage: 'rejected',
      activity_details: { reason: rejectionReason },
      performed_by: performedBy
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error rejecting candidate:', error);
    return { data: null, error };
  }
};

/**
 * Update candidate rating and notes
 */
export const updateCandidateRating = async (
  candidateId: number,
  rating: number,
  notes?: string
) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        recruiter_rating: rating,
        recruiter_notes: notes
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating rating:', error);
    return { data: null, error };
  }
};

/**
 * Assign candidate to interviewer/recruiter
 */
export const assignCandidate = async (
  candidateId: number,
  assignedTo: string,
  performedBy?: string
) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({ assigned_to: assignedTo })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;

    // Log assignment
    await logPipelineActivity({
      pipeline_candidate_id: candidateId,
      activity_type: 'note_added',
      activity_details: { assigned_to: assignedTo },
      performed_by: performedBy
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error assigning candidate:', error);
    return { data: null, error };
  }
};

/**
 * Remove candidate from pipeline
 */
export const removeCandidateFromPipeline = async (candidateId: number) => {
  try {
    const { error } = await supabase
      .from('pipeline_candidates')
      .delete()
      .eq('id', candidateId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error removing candidate:', error);
    return { error };
  }
};

// ==================== PIPELINE ACTIVITY OPERATIONS ====================

/**
 * Log pipeline activity
 */
export const logPipelineActivity = async (activityData: {
  pipeline_candidate_id: number;
  activity_type: string;
  from_stage?: string;
  to_stage?: string;
  activity_details?: any;
  performed_by?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_activities')
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { data: null, error };
  }
};

/**
 * Get activity history for a candidate
 */
export const getCandidateActivities = async (candidateId: number) => {
  try {
    const { data, error } = await supabase
      .from('pipeline_activities')
      .select('*')
      .eq('pipeline_candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching activities:', error);
    return { data: null, error };
  }
};

// ==================== BULK OPERATIONS ====================

/**
 * Bulk move candidates to stage
 */
export const bulkMoveCandidates = async (
  candidateIds: number[],
  newStage: string,
  performedBy?: string
) => {
  try {
    const results = await Promise.all(
      candidateIds.map(id => moveCandidateToStage(id, newStage, performedBy))
    );

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      return { data: null, error: errors[0].error };
    }

    return { data: results.map(r => r.data), error: null };
  } catch (error) {
    console.error('Error bulk moving candidates:', error);
    return { data: null, error };
  }
};

/**
 * Bulk reject candidates
 */
export const bulkRejectCandidates = async (
  candidateIds: number[],
  rejectionReason?: string,
  performedBy?: string
) => {
  try {
    const results = await Promise.all(
      candidateIds.map(id => rejectCandidate(id, rejectionReason, performedBy))
    );

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      return { data: null, error: errors[0].error };
    }

    return { data: results.map(r => r.data), error: null };
  } catch (error) {
    console.error('Error bulk rejecting candidates:', error);
    return { data: null, error };
  }
};

// ==================== ANALYTICS ====================

/**
 * Get pipeline statistics for a requisition
 */
export const getPipelineStatistics = async (requisitionId: string) => {
  try {
    const { data, error } = await getPipelineCandidates(requisitionId);
    
    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      by_stage: {
        sourced: data?.filter(c => c.stage === 'sourced').length || 0,
        screened: data?.filter(c => c.stage === 'screened').length || 0,
        interview_1: data?.filter(c => c.stage === 'interview_1').length || 0,
        interview_2: data?.filter(c => c.stage === 'interview_2').length || 0,
        offer: data?.filter(c => c.stage === 'offer').length || 0,
        hired: data?.filter(c => c.stage === 'hired').length || 0,
        rejected: data?.filter(c => c.stage === 'rejected').length || 0
      },
      by_status: {
        active: data?.filter(c => c.status === 'active').length || 0,
        rejected: data?.filter(c => c.status === 'rejected').length || 0
      }
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting statistics:', error);
    return { data: null, error };
  }
};
