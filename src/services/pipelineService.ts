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
 * Get a single requisition by ID (DEPRECATED - use getOpportunityById instead)
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
 * Get a single opportunity by ID
 */
export const getOpportunityById = async (opportunityId: string) => {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching opportunity:', error);
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
 * Get all pipeline candidates for an opportunity
 * If opportunityId is empty, fetch all candidates from all opportunities
 */
export const getPipelineCandidates = async (opportunityId?: string) => {
  try {
    let query = supabase
      .from('pipeline_candidates_detailed')
      .select('*');
    
    // Only filter by opportunity_id if provided
    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
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
export const getPipelineCandidatesByStage = async (opportunityId: string, stage: string) => {
  try {
    // First, fetch pipeline candidates
    const { data: pipelineCandidates, error: pcError } = await supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('stage', stage)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (pcError) {
      console.error(`[Pipeline Service] Error fetching stage ${stage}:`, {
        message: pcError.message,
        details: pcError.details,
        hint: pcError.hint,
        code: pcError.code
      });
      throw pcError;
    }

    if (!pipelineCandidates || pipelineCandidates.length === 0) {
      return { data: [], error: null };
    }

    // Get unique student IDs
    const studentIds = [...new Set(pipelineCandidates.map(pc => pc.student_id))];

    // Fetch student data with relational tables
    // Note: pipeline_candidates.student_id references students.id (not user_id)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        user_id, id, name, email, contact_number, 
        college_school_name, university, branch_field, course_name, district_name,
        skills!skills_student_id_fkey(id, name, enabled, approval_status)
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error(`[Pipeline Service] Error fetching students for stage ${stage}:`, {
        message: studentsError.message,
        details: studentsError.details,
        hint: studentsError.hint,
        code: studentsError.code
      });
      // Continue without student data rather than failing completely
    }

    // Create a map of students by id for quick lookup
    const studentsMap = new Map();
    students?.forEach(student => {
      // Filter skills to only enabled ones (include all approval statuses)
      const enabledSkills = Array.isArray(student.skills) 
        ? student.skills
            .filter((s: any) => s.enabled)
            .map((s: any) => s.name)
        : [];
      
      studentsMap.set(student.id, {
        ...student,
        // Map actual DB columns to UI-friendly names
        dept: student.branch_field || student.course_name,
        college: student.college_school_name || student.university,
        location: student.district_name,
        ai_score_overall: 0, // AI score not stored in students table directly
        skills: enabledSkills
      });
    });

    // Combine pipeline candidates with student data
    const data = pipelineCandidates.map(candidate => ({
      ...candidate,
      students: studentsMap.get(candidate.student_id) || null
    }));

    return { data, error: null };
  } catch (error) {
    console.error('[Pipeline Service] Error fetching pipeline candidates by stage:', error);
    return { data: null, error };
  }
};

/**
 * Get pipeline candidates with advanced filters and sorting (SQL-optimized)
 */
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
    // Start with base query
    let query = supabase
      .from('pipeline_candidates')
      .select('*')
      .eq('opportunity_id', opportunityId)
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

    const { data: pipelineCandidates, error } = await query;

    if (error) throw error;

    if (!pipelineCandidates || pipelineCandidates.length === 0) {
      return { data: [], error: null };
    }

    // Get unique student IDs
    const studentIds = [...new Set(pipelineCandidates.map((pc: any) => pc.student_id))];

    // Fetch student data with relational tables
    // Note: pipeline_candidates.student_id references students.id (not user_id)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        user_id, id, name, email, contact_number, 
        college_school_name, university, branch_field, course_name, district_name,
        skills!skills_student_id_fkey(id, name, enabled, approval_status)
      `)
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students for filters:', studentsError);
      // Continue without student data
    }

    // Create a map of students by id for quick lookup
    const studentsMap = new Map();
    students?.forEach(student => {
      // Filter skills to only enabled ones (include all approval statuses)
      const enabledSkills = Array.isArray(student.skills) 
        ? student.skills
            .filter((s: any) => s.enabled)
            .map((s: any) => s.name)
        : [];
      
      studentsMap.set(student.id, {
        ...student,
        // Map actual DB columns to UI-friendly names
        dept: student.branch_field || student.course_name,
        college: student.college_school_name || student.university,
        location: student.district_name,
        ai_score_overall: 0, // AI score not stored in students table directly
        skills: enabledSkills
      });
    });

    // Combine pipeline candidates with student data
    let filteredData = pipelineCandidates.map((candidate: any) => {
      const student = studentsMap.get(candidate.student_id);
      
      return {
        ...candidate,
        students: student || null
      };
    }) || [];

    // Apply client-side filters for student data (skills, department, location, AI score)
    // Filter by skills (check if student has any of the selected skills)
    if (filters.skills && filters.skills.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const studentSkills = candidate.students?.skills || [];
        return filters.skills!.some(skill => 
          studentSkills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
        );
      });
    }

    // Filter by department
    if (filters.departments && filters.departments.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const dept = candidate.students?.dept || '';
        return filters.departments!.includes(dept);
      });
    }

    // Filter by location
    if (filters.locations && filters.locations.length > 0) {
      filteredData = filteredData.filter(candidate => {
        const location = candidate.students?.location || '';
        return filters.locations!.includes(location);
      });
    }

    // Filter by AI score range
    if (filters.aiScoreRange && (filters.aiScoreRange.min !== undefined || filters.aiScoreRange.max !== undefined)) {
      filteredData = filteredData.filter(candidate => {
        const score = candidate.students?.ai_score_overall || 0;
        const meetsMin = filters.aiScoreRange!.min !== undefined ? score >= filters.aiScoreRange!.min : true;
        const meetsMax = filters.aiScoreRange!.max !== undefined ? score <= filters.aiScoreRange!.max : true;
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
export const getAllPipelineCandidatesByStage = async (opportunityId: string) => {
  try {
    const { data, error } = await getPipelineCandidates(opportunityId);
    
    if (error) throw error;

    // Group candidates by stage
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
    console.error('Error grouping pipeline candidates:', error);
    return { data: null, error };
  }
};

/**
 * Add candidate to pipeline
 */
export const addCandidateToPipeline = async (pipelineData: {
  opportunity_id: string | number;
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
    // Convert IDs to strings (for backward compatibility)
    const opportunityIdStr = String(pipelineData.opportunity_id);
    
    // Check if candidate already exists in this pipeline
    const { data: existingCandidate, error: checkError } = await supabase
      .from('pipeline_candidates')
      .select('id, stage, status')
      .eq('opportunity_id', opportunityIdStr)
      .eq('student_id', pipelineData.student_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing candidate:', checkError);
    }

    if (existingCandidate) {
      // Candidate already exists
      if (existingCandidate.status === 'active') {
        return {
          data: null,
          error: {
            code: 'DUPLICATE_CANDIDATE',
            message: `Candidate is already in this pipeline (${existingCandidate.stage} stage)`,
            details: existingCandidate
          }
        };
      } else {
        // Reactivate rejected candidate
        const { data: reactivated, error: reactivateError } = await supabase
          .from('pipeline_candidates')
          .update({
            status: 'active',
            stage: pipelineData.stage || 'sourced',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCandidate.id)
          .select()
          .single();

        if (reactivateError) throw reactivateError;

        return { 
          data: reactivated, 
          error: null,
          message: 'Candidate reactivated in pipeline'
        };
      }
    }
    
    // Fetch student's AI score and employability data from relational tables
    let aiScore = null;
    let employabilityScore = null;
    
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('ai_score_overall, employability_score')
        .eq('id', pipelineData.student_id)
        .single();
      
      if (!studentError && studentData) {
        aiScore = studentData.ai_score_overall || null;
        employabilityScore = studentData.employability_score || null;
      }
    } catch (e) {
    }

    // Add AI score to recruiter notes for visibility
    let recruiterNotes = '';
    if (aiScore !== null) {
      recruiterNotes += `AI Match Score: ${aiScore}/100`;
    }
    if (employabilityScore !== null) {
      recruiterNotes += recruiterNotes ? ` | Employability Score: ${employabilityScore}/100` : `Employability Score: ${employabilityScore}/100`;
    }

    const stage = pipelineData.stage || 'sourced';
    
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .insert([{
        opportunity_id: opportunityIdStr,
        student_id: pipelineData.student_id,
        candidate_name: pipelineData.candidate_name,
        candidate_email: pipelineData.candidate_email,
        candidate_phone: pipelineData.candidate_phone,
        stage: stage,
        source: pipelineData.source || 'talent_pool',
        status: 'active',
        added_by: pipelineData.added_by,
        next_action: pipelineData.next_action,
        recruiter_notes: recruiterNotes || pipelineData.next_action_notes || null
      }])
      .select()
      .single();

    if (error) {
      // Check for duplicate entry (fallback)
      if (error.code === '23505') {
        return {
          data: null,
          error: {
            code: 'DUPLICATE_CANDIDATE',
            message: 'Candidate is already in this pipeline',
            details: error.details
          }
        };
      }
      throw error;
    }

    // Sync with applied_jobs table - map pipeline stage to application status
    const stageToStatusMap: { [key: string]: string } = {
      sourced: 'applied',
      screened: 'under_review',
      interview_1: 'interview_scheduled',
      interview_2: 'interviewed',
      offer: 'offer_received',
      hired: 'accepted',
      rejected: 'rejected'
    };

    const applicationStatus = stageToStatusMap[stage];
    if (applicationStatus && pipelineData.student_id && opportunityIdStr) {
      try {
        // Check if applied_jobs record exists
        const { data: existingApplication } = await supabase
          .from('applied_jobs')
          .select('id')
          .eq('student_id', pipelineData.student_id)
          .eq('opportunity_id', opportunityIdStr)
          .maybeSingle();

        if (existingApplication) {
          // Update existing application status
          await supabase
            .from('applied_jobs')
            .update({
              application_status: applicationStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingApplication.id);
        }
        // If no existing application, the candidate was added from talent pool
        // and doesn't have an applied_jobs record yet - that's okay
      } catch (syncError) {
        console.error('Error syncing with applied_jobs:', syncError);
        // Don't fail the main operation if sync fails
      }
    }

    // Log activity
    if (data) {
      await logPipelineActivity({
        pipeline_candidate_id: data.id,
        activity_type: 'stage_change',
        from_stage: null,
        to_stage: data.stage,
        performed_by: pipelineData.added_by,
        student_id: pipelineData.student_id,
        activity_details: {
          ai_score: aiScore,
          employability_score: employabilityScore
        }
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
  candidateId: string | number,
  newStage: string,
  performedBy?: string,
  notes?: string
) => {
  // Convert to string if number (for backward compatibility)
  const candidateIdStr = String(candidateId);
  
  console.log('[Pipeline Service] moveCandidateToStage called:', {
    candidateId,
    candidateIdStr,
    newStage,
    performedBy,
    notes
  });
  
  try {
    // Get current candidate data with student info
    const { data: currentData, error: fetchError } = await supabase
      .from('pipeline_candidates')
      .select('stage, student_id, candidate_name, candidate_email, opportunity_id')
      .eq('id', candidateIdStr)
      .single();

    console.log('[Pipeline Service] Fetch current data result:', {
      data: currentData,
      error: fetchError
    });

    if (fetchError) throw fetchError;

    // Check if opportunity still has openings before allowing stage progression
    if (currentData.opportunity_id) {
      const { data: opportunityData, error: oppError } = await supabase
        .from('opportunities')
        .select('openings_count, status, job_title, company_name')
        .eq('id', currentData.opportunity_id)
        .single();

      if (!oppError && opportunityData) {
        if (opportunityData.openings_count === 0 || opportunityData.status === 'filled') {
          return {
            error: `Cannot move candidate: All openings for ${opportunityData.job_title} at ${opportunityData.company_name} have been filled.`,
            data: null
          };
        }
      }
    }

    const previousStage = currentData.stage;

    console.log('[Pipeline Service] Updating candidate stage:', {
      candidateIdStr,
      previousStage,
      newStage
    });

    // Update the candidate
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        stage: newStage,
        previous_stage: previousStage,
        stage_changed_at: new Date().toISOString(),
        stage_changed_by: performedBy
      })
      .eq('id', candidateIdStr)
      .select()
      .single();

    console.log('[Pipeline Service] Update result:', {
      data,
      error
    });

    if (error) throw error;

    // Sync with applied_jobs table - map pipeline stage to application status
    const stageToStatusMap: { [key: string]: string } = {
      sourced: 'applied',
      screened: 'under_review',
      interview_1: 'interview_scheduled',
      interview_2: 'interviewed',
      offer: 'offer_received',
      hired: 'accepted',
      rejected: 'rejected'
    };

    const applicationStatus = stageToStatusMap[newStage];
    if (applicationStatus && currentData.student_id && currentData.opportunity_id) {
      try {
        const updateData: any = {
          application_status: applicationStatus,
          updated_at: new Date().toISOString()
        };

        // Add specific timestamp fields based on status
        if (applicationStatus === 'interview_scheduled') {
          updateData.interview_scheduled_at = new Date().toISOString();
        }

        await supabase
          .from('applied_jobs')
          .update(updateData)
          .eq('student_id', currentData.student_id)
          .eq('opportunity_id', currentData.opportunity_id);
      } catch (syncError) {
        console.error('Error syncing with applied_jobs:', syncError);
        // Don't fail the main operation if sync fails
      }
    }

    // Log the stage change
    await logPipelineActivity({
      pipeline_candidate_id: candidateIdStr,
      activity_type: 'stage_change',
      from_stage: previousStage,
      to_stage: newStage,
      activity_details: notes ? { notes } : null,
      performed_by: performedBy,
      student_id: currentData.student_id
    });

    return { data, error: null };
  } catch (error) {
    console.error('[Pipeline Service] Error moving candidate:', error);
    console.error('[Pipeline Service] Error details:', {
      message: (error as any)?.message,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      code: (error as any)?.code
    });
    return { data: null, error };
  }
};

/**
 * Update next action for candidate
 */
export const updateNextAction = async (
  candidateId: string | number,
  nextAction: string,
  nextActionDate?: string,
  notes?: string
) => {
  try {
    const candidateIdStr = String(candidateId);
    
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        next_action: nextAction,
        next_action_date: nextActionDate,
        next_action_notes: notes
      })
      .eq('id', candidateIdStr)
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
  candidateId: string | number,
  rejectionReason?: string,
  performedBy?: string
) => {
  try {
    const candidateIdStr = String(candidateId);
    
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        status: 'rejected',
        stage: 'rejected',
        rejection_reason: rejectionReason,
        rejection_date: new Date().toISOString()
      })
      .eq('id', candidateIdStr)
      .select()
      .single();

    if (error) throw error;

    // Log rejection
    await logPipelineActivity({
      pipeline_candidate_id: candidateIdStr,
      activity_type: 'stage_change',
      from_stage: data.previous_stage || undefined,
      to_stage: 'rejected',
      activity_details: { reason: rejectionReason },
      performed_by: performedBy,
      student_id: data.student_id
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
  candidateId: string | number,
  rating: number,
  notes?: string
) => {
  try {
    const candidateIdStr = String(candidateId);
    
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({
        recruiter_rating: rating,
        recruiter_notes: notes
      })
      .eq('id', candidateIdStr)
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
  candidateId: string | number,
  assignedTo: string,
  performedBy?: string
) => {
  try {
    const candidateIdStr = String(candidateId);
    
    const { data, error } = await supabase
      .from('pipeline_candidates')
      .update({ assigned_to: assignedTo })
      .eq('id', candidateIdStr)
      .select()
      .single();

    if (error) throw error;

    // Log assignment
    await logPipelineActivity({
      pipeline_candidate_id: candidateIdStr,
      activity_type: 'note_added',
      activity_details: { assigned_to: assignedTo },
      performed_by: performedBy,
      student_id: data.student_id
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
export const removeCandidateFromPipeline = async (candidateId: string | number) => {
  try {
    const candidateIdStr = String(candidateId);
    
    const { error } = await supabase
      .from('pipeline_candidates')
      .delete()
      .eq('id', candidateIdStr);

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
  pipeline_candidate_id: string;
  activity_type: string;
  from_stage?: string | null;
  to_stage?: string;
  activity_details?: any;
  performed_by?: string;
  student_id?: string;
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
export const getCandidateActivities = async (candidateId: string) => {
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
    console.error('Error bulk moving candidates:', error);
    return { data: null, error };
  }
};

/**
 * Bulk reject candidates
 */
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
    console.error('Error bulk rejecting candidates:', error);
    return { data: null, error };
  }
};

// ==================== ANALYTICS ====================

/**
 * Get pipeline statistics for an opportunity
 */
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
    console.error('Error getting statistics:', error);
    return { data: null, error };
  }
};
