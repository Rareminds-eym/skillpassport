import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('pipelineService');

// ==================== REQUISITION OPERATIONS ====================

export const getRequisitions = async () => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', { action: 'get-requisitions' });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.requisitions ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Failed to fetch requisitions', error as Error);
    return { data: null, error };
  }
};

export const getRequisitionById = async (requisitionId: string) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', { action: 'get-requisition-by-id', id: requisitionId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.requisition ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Failed to fetch requisition', error as Error);
    return { data: null, error };
  }
};

export const getOpportunityById = async (opportunityId: string) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', { action: 'get-opportunity-by-id', id: opportunityId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.opportunity ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Failed to fetch opportunity', error as Error);
    return { data: null, error };
  }
};

export const getRequisitionsWithStats = async () => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', { action: 'get-requisitions-with-stats' });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.requisitions ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Failed to fetch requisitions with stats', error as Error);
    return { data: null, error };
  }
};

// ==================== PIPELINE CANDIDATE OPERATIONS ====================

export const getPipelineCandidates = async (opportunityId?: string) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'get-pipeline-candidates',
      ...(opportunityId ? { opportunity_id: opportunityId } : {}),
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidates ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Failed to fetch pipeline candidates', error as Error);
    return { data: null, error };
  }
};

export const getPipelineCandidatesByStage = async (opportunityId: string, stage: string) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'get-pipeline-candidates-by-stage',
      opportunity_id: opportunityId,
      stage,
    });
    if (response?.error) {
      logger.error(`Failed to fetch pipeline candidates for stage ${stage}`, response.error);
      return { data: null, error: response.error };
    }
    return { data: response?.data?.candidates ?? [], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getPipelineCandidatesWithFilters = async (
  opportunityId: string,
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
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'get-pipeline-candidates-with-filters',
      opportunity_id: opportunityId,
      stages: filters.stages?.join(','),
      skills: filters.skills?.join(','),
      departments: filters.departments?.join(','),
      locations: filters.locations?.join(','),
      sources: filters.sources?.join(','),
      ai_score_min: filters.aiScoreRange?.min,
      ai_score_max: filters.aiScoreRange?.max,
      next_action_types: filters.nextActionTypes?.join(','),
      has_next_action: filters.hasNextAction,
      assigned_to: filters.assignedTo?.join(','),
      date_added_start: filters.dateAdded?.startDate,
      date_added_end: filters.dateAdded?.endDate,
      last_updated_start: filters.lastUpdated?.startDate,
      last_updated_end: filters.lastUpdated?.endDate,
      sort_field: sortOptions?.field,
      sort_direction: sortOptions?.direction,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidates ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getAllPipelineCandidatesByStage = async (opportunityId: string) => {
  try {
    const { data, error } = await getPipelineCandidates(opportunityId);

    if (error) throw error;

    const grouped: Record<string, any[]> = {
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
    return { data: null, error };
  }
};

export const addCandidateToPipeline = async (pipelineData: {
  opportunity_id: string | number;
  learner_id: string;
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
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'add-candidate-to-pipeline',
      ...pipelineData,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const moveCandidateToStage = async (
  candidateId: string | number,
  newStage: string,
  performedBy?: string,
  notes?: string
) => {
  const candidateIdStr = String(candidateId);

  try {
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'move-candidate-to-stage',
      candidate_id: candidateIdStr,
      stage: newStage,
      performed_by: performedBy,
      notes,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateNextAction = async (
  candidateId: string | number,
  nextAction: string,
  nextActionDate?: string,
  notes?: string
) => {
  try {
    const candidateIdStr = String(candidateId);

    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'update-next-action',
      candidate_id: candidateIdStr,
      next_action: nextAction,
      next_action_date: nextActionDate,
      notes,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const rejectCandidate = async (
  candidateId: string | number,
  rejectionReason?: string,
  performedBy?: string
) => {
  try {
    const candidateIdStr = String(candidateId);

    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'reject-candidate',
      candidate_id: candidateIdStr,
      rejection_reason: rejectionReason,
      performed_by: performedBy,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const updateCandidateRating = async (
  candidateId: string | number,
  rating: number,
  notes?: string
) => {
  try {
    const candidateIdStr = String(candidateId);

    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'update-candidate-rating',
      candidate_id: candidateIdStr,
      rating,
      notes,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const assignCandidate = async (
  candidateId: string | number,
  assignedTo: string,
  performedBy?: string
) => {
  try {
    const candidateIdStr = String(candidateId);

    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'assign-candidate',
      candidate_id: candidateIdStr,
      assigned_to: assignedTo,
      performed_by: performedBy,
    });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.candidate ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const removeCandidateFromPipeline = async (candidateId: string | number) => {
  try {
    const candidateIdStr = String(candidateId);

    const response: any = await apiPost('/recruiter-pipeline', { action: 'remove-candidate-from-pipeline', candidate_id: candidateIdStr });
    if (response?.error) return { error: response.error };
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ==================== PIPELINE ACTIVITY OPERATIONS ====================

export const logPipelineActivity = async (activityData: {
  pipeline_candidate_id: string | number;
  activity_type: string;
  from_stage?: string | null;
  to_stage?: string;
  activity_details?: any;
  performed_by?: string;
  learner_id?: string;
}) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', {
      action: 'log-pipeline-activity',
      ...activityData,
    });
    if (response?.error) {
      logger.error('Exception in logPipelineActivity', response.error);
      return { data: null, error: response.error };
    }
    return { data: response?.data ?? null, error: null };
  } catch (error: unknown) {
    logger.error('Exception in logPipelineActivity', error as Error);
    return { data: null, error };
  }
};

function getNotificationType(activityType: string, toStage?: string): string {
  if (activityType === 'stage_change') {
    if (toStage === 'rejected') {
      return 'candidate_rejected';
    }
    return 'pipeline_stage_changed';
  }
  if (activityType === 'next_action_set') {
    return 'interview_reminder';
  }
  return 'pipeline_stage_changed';
}

function getNotificationTitle(activityType: string, toStage?: string): string {
  if (activityType === 'stage_change') {
    switch (toStage) {
      case 'hired':
        return 'Congratulations! You\'ve been hired!';
      case 'offer':
        return 'Offer Extended!';
      case 'interview_2':
        return 'Advanced to Final Interview';
      case 'interview_1':
        return 'Interview Scheduled';
      case 'screened':
        return 'Application Screened';
      case 'rejected':
        return 'Application Status Update';
      default:
        return 'Application Update';
    }
  }
  if (activityType === 'note_added') {
    return 'Update on your application';
  }
  if (activityType === 'next_action_set') {
    return 'Action Required';
  }
  return 'Application Update';
}

function getNotificationMessage(activityType: string, toStage?: string): string {
  if (activityType === 'stage_change') {
    switch (toStage) {
      case 'hired':
        return 'Great news! You have been selected for the position.';
      case 'offer':
        return 'You have received an offer. Review the details in your dashboard.';
      case 'interview_2':
        return 'Congratulations! You have been selected for the final interview round.';
      case 'interview_1':
        return 'You have been selected for an interview.';
      case 'screened':
        return 'Your application is under review.';
      case 'rejected':
        return 'Thank you for your interest. We have decided to move forward with other candidates.';
      default:
        return 'Your application has been updated.';
    }
  }
  if (activityType === 'note_added') {
    return 'Your application has been updated with new information.';
  }
  if (activityType === 'next_action_set') {
    return 'Next steps for your application have been set.';
  }
  return 'Your application has been updated.';
}

export const getCandidateActivities = async (candidateId: string) => {
  try {
    const response: any = await apiPost('/recruiter-pipeline', { action: 'get-candidate-activities', candidate_id: candidateId });
    if (response?.error) return { data: null, error: response.error };
    return { data: response?.data?.activities ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ==================== BULK OPERATIONS ====================

export const bulkMoveCandidates = async (
  candidateIds: (string | number)[],
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
    return { data: null, error };
  }
};

export const bulkRejectCandidates = async (
  candidateIds: (string | number)[],
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
    return { data: null, error };
  }
};

// ==================== ANALYTICS ====================

export const getPipelineStatistics = async (opportunityId: string) => {
  try {
    const { data, error } = await getPipelineCandidates(opportunityId);

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
    logger.error('Failed to get pipeline statistics', error as Error);
    return { data: null, error };
  }
};
