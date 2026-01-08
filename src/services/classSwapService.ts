// =====================================================
// CLASS SWAP REQUEST - API SERVICE
// =====================================================

import { supabase } from '../lib/supabaseClient';
import type {
  ClassSwapRequest,
  ClassSwapRequestWithDetails,
  ClassSwapHistory,
  CreateSwapRequestPayload,
  RespondToSwapRequestPayload,
  AdminApprovalPayload,
  SwapRequestFilters,
  SwapConflictCheck,
  SwapStatistics,
  SlotInfo,
  FacultyInfo,
} from '../types/classSwap';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get faculty info from either school_educators or college_lecturers
 */
const getFacultyInfo = async (facultyId: string, isCollegeEducator: boolean): Promise<FacultyInfo | null> => {
  try {
    if (isCollegeEducator) {
      const { data, error } = await supabase
        .from('college_lecturers')
        .select('id, first_name, last_name, email')
        .eq('id', facultyId)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('school_educators')
        .select('id, first_name, last_name, email')
        .eq('id', facultyId)
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error fetching faculty info:', error);
    return null;
  }
};

/**
 * Get slot info from either timetable_slots or college_timetable_slots
 */
const getSlotInfo = async (slotId: string, isCollegeEducator: boolean): Promise<SlotInfo | null> => {
  try {
    if (isCollegeEducator) {
      const { data, error } = await supabase
        .from('college_timetable_slots')
        .select(`
          id,
          subject_name,
          room_number,
          day_of_week,
          period_number,
          start_time,
          end_time,
          college_classes!college_timetable_slots_class_id_fkey(name)
        `)
        .eq('id', slotId)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        class_name: (data as any).college_classes?.name || 'N/A',
      };
    } else {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          subject_name,
          room_number,
          day_of_week,
          period_number,
          start_time,
          end_time,
          school_classes!timetable_slots_class_id_fkey(name, grade, section)
        `)
        .eq('id', slotId)
        .single();
      
      if (error) throw error;
      
      const schoolClass = (data as any).school_classes;
      return {
        ...data,
        class_name: schoolClass?.name || 
          (schoolClass?.grade && schoolClass?.section 
            ? `${schoolClass.grade}-${schoolClass.section}` 
            : 'N/A'),
      };
    }
  } catch (error) {
    console.error('Error fetching slot info:', error);
    return null;
  }
};

// =====================================================
// MAIN API FUNCTIONS
// =====================================================

/**
 * Create a new class swap request
 */
export const createSwapRequest = async (
  payload: CreateSwapRequestPayload
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  try {
    // Validate payload
    if (payload.request_type === 'one_time' && !payload.swap_date) {
      throw new Error('Swap date is required for one-time swaps');
    }
    
    if (payload.request_type === 'permanent' && payload.swap_date) {
      throw new Error('Swap date should not be provided for permanent swaps');
    }
    
    // Check for conflicts
    const conflictCheck = await checkSwapConflicts(
      payload.requester_slot_id,
      payload.target_slot_id,
      payload.swap_date
    );
    
    if (conflictCheck.has_conflict) {
      throw new Error(`Conflict detected: ${conflictCheck.conflict_reason}`);
    }
    
    // Create the swap request
    const { data, error } = await supabase
      .from('class_swap_requests')
      .insert({
        requester_faculty_id: payload.requester_faculty_id,
        requester_slot_id: payload.requester_slot_id,
        target_faculty_id: payload.target_faculty_id,
        target_slot_id: payload.target_slot_id,
        reason: payload.reason,
        request_type: payload.request_type,
        swap_date: payload.swap_date || null,
        requires_admin_approval: payload.requires_admin_approval ?? true,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating swap request:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get swap requests for a faculty member
 */
export const getSwapRequests = async (
  facultyId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequest[] | null; error: Error | null }> => {
  try {
    let query = supabase
      .from('class_swap_requests')
      .select('*')
      .or(`requester_faculty_id.eq.${facultyId},target_faculty_id.eq.${facultyId}`)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.request_type) {
      query = query.eq('request_type', filters.request_type);
    }
    
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching swap requests:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get swap request with full details (faculty info, slot info, history)
 */
export const getSwapRequestDetails = async (
  requestId: string,
  isCollegeEducator: boolean
): Promise<{ data: ClassSwapRequestWithDetails | null; error: Error | null }> => {
  try {
    // Get the base request
    const { data: request, error: requestError } = await supabase
      .from('class_swap_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError) throw requestError;
    
    // Get history
    const { data: history } = await supabase
      .from('class_swap_history')
      .select('*')
      .eq('swap_request_id', requestId)
      .order('created_at', { ascending: true });
    
    // Get faculty and slot info
    const [requesterFaculty, targetFaculty, requesterSlot, targetSlot] = await Promise.all([
      getFacultyInfo(request.requester_faculty_id, isCollegeEducator),
      getFacultyInfo(request.target_faculty_id, isCollegeEducator),
      getSlotInfo(request.requester_slot_id, isCollegeEducator),
      getSlotInfo(request.target_slot_id, isCollegeEducator),
    ]);
    
    // Get admin info if exists
    let admin = null;
    if (request.admin_id) {
      admin = await getFacultyInfo(request.admin_id, isCollegeEducator);
    }
    
    const detailedRequest: ClassSwapRequestWithDetails = {
      ...request,
      requester_faculty: requesterFaculty || undefined,
      target_faculty: targetFaculty || undefined,
      requester_slot: requesterSlot || undefined,
      target_slot: targetSlot || undefined,
      admin: admin || undefined,
      history: history || undefined,
    };
    
    return { data: detailedRequest, error: null };
  } catch (error) {
    console.error('Error fetching swap request details:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Respond to a swap request (accept or reject)
 */
export const respondToSwapRequest = async (
  requestId: string,
  payload: RespondToSwapRequestPayload
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('class_swap_requests')
      .update({
        status: payload.status,
        target_response: payload.response_message,
        target_responded_at: new Date().toISOString(),
        // If accepted and requires admin approval, set admin status to pending
        admin_approval_status: payload.status === 'accepted' ? 'pending' : null,
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error responding to swap request:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Cancel a swap request (by requester)
 */
export const cancelSwapRequest = async (
  requestId: string
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('class_swap_requests')
      .update({
        status: 'cancelled',
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error cancelling swap request:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Admin approval/rejection of swap request
 */
export const adminApproveSwapRequest = async (
  requestId: string,
  payload: AdminApprovalPayload,
  adminId: string
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('class_swap_requests')
      .update({
        admin_approval_status: payload.approval_status,
        admin_id: adminId,
        admin_response: payload.response_message,
        admin_responded_at: new Date().toISOString(),
        // If approved, mark as completed (ready for execution)
        status: payload.approval_status === 'approved' ? 'completed' : 'rejected',
        completed_at: payload.approval_status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error processing admin approval:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Check for scheduling conflicts
 */
export const checkSwapConflicts = async (
  requesterSlotId: string,
  targetSlotId: string,
  swapDate?: string
): Promise<SwapConflictCheck> => {
  try {
    const { data, error } = await supabase.rpc('check_swap_conflicts', {
      p_requester_slot_id: requesterSlotId,
      p_target_slot_id: targetSlotId,
      p_swap_date: swapDate || null,
    });
    
    if (error) throw error;
    
    return data[0] || { has_conflict: false, conflict_reason: 'No conflicts detected' };
  } catch (error) {
    console.error('Error checking swap conflicts:', error);
    return { has_conflict: true, conflict_reason: 'Error checking conflicts' };
  }
};

/**
 * Get pending swap requests count for a faculty
 */
export const getPendingSwapCount = async (facultyId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('get_pending_swap_count', {
      p_faculty_id: facultyId,
    });
    
    if (error) throw error;
    
    return data || 0;
  } catch (error) {
    console.error('Error getting pending swap count:', error);
    return 0;
  }
};

/**
 * Get swap statistics for a faculty
 */
export const getSwapStatistics = async (facultyId: string): Promise<SwapStatistics> => {
  try {
    const { data, error } = await supabase
      .from('class_swap_requests')
      .select('status, admin_approval_status')
      .or(`requester_faculty_id.eq.${facultyId},target_faculty_id.eq.${facultyId}`);
    
    if (error) throw error;
    
    const stats: SwapStatistics = {
      total_requests: data.length,
      pending_requests: data.filter(r => r.status === 'pending').length,
      accepted_requests: data.filter(r => r.status === 'accepted').length,
      rejected_requests: data.filter(r => r.status === 'rejected').length,
      completed_swaps: data.filter(r => r.status === 'completed').length,
      pending_admin_approval: data.filter(r => r.admin_approval_status === 'pending').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting swap statistics:', error);
    return {
      total_requests: 0,
      pending_requests: 0,
      accepted_requests: 0,
      rejected_requests: 0,
      completed_swaps: 0,
      pending_admin_approval: 0,
    };
  }
};

/**
 * Get all swap requests for a college (admin view)
 */
export const getCollegeSwapRequests = async (
  collegeId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequest[] | null; error: Error | null }> => {
  try {
    // Get all faculty IDs from this college
    const { data: facultyData, error: facultyError } = await supabase
      .from('college_lecturers')
      .select('id')
      .eq('collegeId', collegeId);
    
    if (facultyError) throw facultyError;
    
    const facultyIds = facultyData.map(f => f.id);
    
    if (facultyIds.length === 0) {
      return { data: [], error: null };
    }
    
    // Get all swap requests involving these faculty members
    let query = supabase
      .from('class_swap_requests')
      .select('*')
      .or(`requester_faculty_id.in.(${facultyIds.join(',')}),target_faculty_id.in.(${facultyIds.join(',')})`)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.request_type) {
      query = query.eq('request_type', filters.request_type);
    }
    
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching college swap requests:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get swap requests with full details for admin view
 */
export const getCollegeSwapRequestsWithDetails = async (
  collegeId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequestWithDetails[] | null; error: Error | null }> => {
  try {
    const { data: requests, error: requestsError } = await getCollegeSwapRequests(collegeId, filters);
    
    if (requestsError || !requests) {
      return { data: null, error: requestsError };
    }
    
    // Enrich each request with details
    const detailedRequests = await Promise.all(
      requests.map(async (request) => {
        const [requesterFaculty, targetFaculty, requesterSlot, targetSlot, history] = await Promise.all([
          getFacultyInfo(request.requester_faculty_id, true),
          getFacultyInfo(request.target_faculty_id, true),
          getSlotInfo(request.requester_slot_id, true),
          getSlotInfo(request.target_slot_id, true),
          supabase
            .from('class_swap_history')
            .select('*')
            .eq('swap_request_id', request.id)
            .order('created_at', { ascending: true })
            .then(({ data }) => data || []),
        ]);
        
        let admin = null;
        if (request.admin_id) {
          admin = await getFacultyInfo(request.admin_id, true);
        }
        
        return {
          ...request,
          requester_faculty: requesterFaculty || undefined,
          target_faculty: targetFaculty || undefined,
          requester_slot: requesterSlot || undefined,
          target_slot: targetSlot || undefined,
          admin: admin || undefined,
          history: history || undefined,
        } as ClassSwapRequestWithDetails;
      })
    );
    
    return { data: detailedRequests, error: null };
  } catch (error) {
    console.error('Error fetching college swap requests with details:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get swap statistics for a college (admin view)
 */
export const getCollegeSwapStatistics = async (collegeId: string): Promise<SwapStatistics> => {
  try {
    const { data: requests } = await getCollegeSwapRequests(collegeId);
    
    if (!requests) {
      return {
        total_requests: 0,
        pending_requests: 0,
        accepted_requests: 0,
        rejected_requests: 0,
        completed_swaps: 0,
        pending_admin_approval: 0,
      };
    }
    
    const stats: SwapStatistics = {
      total_requests: requests.length,
      pending_requests: requests.filter(r => r.status === 'pending').length,
      accepted_requests: requests.filter(r => r.status === 'accepted').length,
      rejected_requests: requests.filter(r => r.status === 'rejected').length,
      completed_swaps: requests.filter(r => r.status === 'completed').length,
      pending_admin_approval: requests.filter(r => r.admin_approval_status === 'pending').length,
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting college swap statistics:', error);
    return {
      total_requests: 0,
      pending_requests: 0,
      accepted_requests: 0,
      rejected_requests: 0,
      completed_swaps: 0,
      pending_admin_approval: 0,
    };
  }
};

/**
 * Get available slots for swapping (only slots for the SAME class to avoid student timetable conflicts)
 */
export const getAvailableSlotsForSwap = async (
  currentSlotId: string,
  currentFacultyId: string,
  isCollegeEducator: boolean
): Promise<{ data: SlotInfo[] | null; error: Error | null }> => {
  try {
    // First get the current slot to find the timetable_id and class_id
    const tableName = isCollegeEducator ? 'college_timetable_slots' : 'timetable_slots';
    const { data: currentSlotData } = await supabase
      .from(tableName)
      .select('timetable_id, class_id')
      .eq('id', currentSlotId)
      .single();
    
    if (!currentSlotData) {
      throw new Error('Could not find current slot');
    }
    
    // CRITICAL: Get all slots from the same timetable AND same class
    // This ensures students don't have schedule conflicts
    if (isCollegeEducator) {
      const { data, error } = await supabase
        .from('college_timetable_slots')
        .select(`
          id,
          subject_name,
          room_number,
          day_of_week,
          period_number,
          start_time,
          end_time,
          educator_id,
          class_id,
          college_classes!college_timetable_slots_class_id_fkey(name)
        `)
        .eq('timetable_id', currentSlotData.timetable_id)
        .eq('class_id', currentSlotData.class_id)  // SAME CLASS ONLY
        .neq('educator_id', currentFacultyId)
        .neq('id', currentSlotId)  // Exclude current slot
        .order('day_of_week')
        .order('period_number');
      
      if (error) throw error;
      
      const slots: SlotInfo[] = (data || []).map((slot: any) => ({
        id: slot.id,
        subject_name: slot.subject_name,
        class_name: slot.college_classes?.name || 'N/A',
        room_number: slot.room_number,
        day_of_week: slot.day_of_week,
        period_number: slot.period_number,
        start_time: slot.start_time,
        end_time: slot.end_time,
        educator_id: slot.educator_id, // Include educator_id for swap requests
      }));
      
      return { data: slots, error: null };
    } else {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          subject_name,
          room_number,
          day_of_week,
          period_number,
          start_time,
          end_time,
          educator_id,
          class_id,
          school_classes!timetable_slots_class_id_fkey(name, grade, section)
        `)
        .eq('timetable_id', currentSlotData.timetable_id)
        .eq('class_id', currentSlotData.class_id)  // SAME CLASS ONLY
        .neq('educator_id', currentFacultyId)
        .neq('id', currentSlotId)  // Exclude current slot
        .order('day_of_week')
        .order('period_number');
      
      if (error) throw error;
      
      const slots: SlotInfo[] = (data || []).map((slot: any) => {
        const schoolClass = slot.school_classes;
        return {
          id: slot.id,
          subject_name: slot.subject_name,
          class_name: schoolClass?.name || 
            (schoolClass?.grade && schoolClass?.section 
              ? `${schoolClass.grade}-${schoolClass.section}` 
              : 'N/A'),
          room_number: slot.room_number,
          day_of_week: slot.day_of_week,
          period_number: slot.period_number,
          start_time: slot.start_time,
          end_time: slot.end_time,
          educator_id: slot.educator_id, // Include educator_id for swap requests
        };
      });
      
      return { data: slots, error: null };
    }
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return { data: null, error: error as Error };
  }
};
