import { apiPost } from '@/shared/api/apiClient';
import type {
  ClassSwapRequest,
  ClassSwapRequestWithDetails,
  CreateSwapRequestPayload,
  RespondToSwapRequestPayload,
  AdminApprovalPayload,
  SwapRequestFilters,
  SwapConflictCheck,
  SwapStatistics,
  SlotInfo,
  FacultyInfo,
} from '@/shared/types/classSwap';

const getFacultyInfo = async (facultyId: string, isCollegeEducator: boolean): Promise<FacultyInfo | null> => {
  try {
    const result = await apiPost<{ success: boolean; data: FacultyInfo | null }>(
      '/college-admin/class-swaps',
      { action: 'get-faculty-info', faculty_id: facultyId, is_college_educator: isCollegeEducator }
    );
    return result.data;
  } catch {
    return null;
  }
};

const getSlotInfo = async (slotId: string, isCollegeEducator: boolean): Promise<SlotInfo | null> => {
  try {
    const result = await apiPost<{ success: boolean; data: SlotInfo | null }>(
      '/college-admin/class-swaps',
      { action: 'get-slot-info', slot_id: slotId, is_college_educator: isCollegeEducator }
    );
    return result.data;
  } catch {
    return null;
  }
};

export const createSwapRequest = async (
  payload: CreateSwapRequestPayload
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  if (payload.request_type === 'one_time' && !payload.swap_date) {
    return { data: null, error: new Error('Swap date is required for one-time swaps') };
  }

  if (payload.request_type === 'permanent' && payload.swap_date) {
    return { data: null, error: new Error('Swap date should not be provided for permanent swaps') };
  }

  const result = await apiPost<{ success: boolean; data: ClassSwapRequest }>(
    '/college-admin/class-swaps',
    { action: 'create-swap-request', ...payload }
  );

  return { data: result.data, error: null };
};

export const getSwapRequests = async (
  facultyId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequest[] | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest[] }>(
    '/college-admin/class-swaps',
    { action: 'get-swap-requests', faculty_id: facultyId, ...filters }
  );

  return { data: result.data, error: null };
};

export const getSwapRequestDetails = async (
  requestId: string,
  isCollegeEducator: boolean
): Promise<{ data: ClassSwapRequestWithDetails | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequestWithDetails }>(
    '/college-admin/class-swaps',
    { action: 'get-swap-request-details', request_id: requestId, is_college_educator: isCollegeEducator }
  );

  return { data: result.data, error: null };
};

export const respondToSwapRequest = async (
  requestId: string,
  payload: RespondToSwapRequestPayload
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest }>(
    '/college-admin/class-swaps',
    {
      action: 'respond-to-swap',
      request_id: requestId,
      status: payload.status,
      response_message: payload.response_message,
    }
  );

  return { data: result.data, error: null };
};

export const cancelSwapRequest = async (
  requestId: string
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest }>(
    '/college-admin/class-swaps',
    { action: 'cancel-swap-request', request_id: requestId }
  );

  return { data: result.data, error: null };
};

export const adminApproveSwapRequest = async (
  requestId: string,
  payload: AdminApprovalPayload,
  _adminId: string
): Promise<{ data: ClassSwapRequest | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest }>(
    '/college-admin/class-swaps',
    {
      action: 'admin-approve-swap',
      request_id: requestId,
      approval_status: payload.approval_status,
      response_message: payload.response_message,
    }
  );

  return { data: result.data, error: null };
};

export const checkSwapConflicts = async (
  requesterSlotId: string,
  targetSlotId: string,
  swapDate?: string
): Promise<SwapConflictCheck> => {
  const result = await apiPost<{ success: boolean; data: SwapConflictCheck[] }>(
    '/college-admin/class-swaps',
    {
      action: 'check-swap-conflicts',
      requester_slot_id: requesterSlotId,
      target_slot_id: targetSlotId,
      swap_date: swapDate,
    }
  );

  return result.data[0] || { has_conflict: false, conflict_reason: 'No conflicts detected' };
};

export const getPendingSwapCount = async (facultyId: string): Promise<number> => {
  const result = await apiPost<{ success: boolean; data: number }>(
    '/college-admin/class-swaps',
    { action: 'get-pending-swap-count', faculty_id: facultyId }
  );

  return result.data ?? 0;
};

export const getSwapStatistics = async (facultyId: string): Promise<SwapStatistics> => {
  const result = await apiPost<{ success: boolean; data: SwapStatistics }>(
    '/college-admin/class-swaps',
    { action: 'get-swap-statistics', faculty_id: facultyId }
  );

  return result.data;
};

export const getCollegeSwapRequests = async (
  collegeId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequest[] | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest[] }>(
    '/college-admin/class-swaps',
    { action: 'get-college-swap-requests', college_id: collegeId, ...filters }
  );

  return { data: result.data, error: null };
};

export const getCollegeSwapRequestsWithDetails = async (
  collegeId: string,
  filters?: SwapRequestFilters
): Promise<{ data: ClassSwapRequestWithDetails[] | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequestWithDetails[] }>(
    '/college-admin/class-swaps',
    { action: 'get-college-swap-requests', college_id: collegeId, ...filters }
  );

  return { data: result.data, error: null };
};

export const getCollegeSwapStatistics = async (collegeId: string): Promise<SwapStatistics> => {
  const result = await apiPost<{ success: boolean; data: ClassSwapRequest[] }>(
    '/college-admin/class-swaps',
    { action: 'get-college-swap-requests', college_id: collegeId }
  );

  const requests = result.data || [];

  return {
    total_requests: requests.length,
    pending_requests: requests.filter(r => r.status === 'pending').length,
    accepted_requests: requests.filter(r => r.status === 'accepted').length,
    rejected_requests: requests.filter(r => r.status === 'rejected').length,
    completed_swaps: requests.filter(r => r.status === 'completed').length,
    pending_admin_approval: requests.filter(r => r.admin_approval_status === 'pending').length,
  };
};

export const getAvailableSlotsForSwap = async (
  currentSlotId: string,
  currentFacultyId: string,
  isCollegeEducator: boolean
): Promise<{ data: SlotInfo[] | null; error: Error | null }> => {
  const result = await apiPost<{ success: boolean; data: SlotInfo[] }>(
    '/college-admin/class-swaps',
    {
      action: 'get-available-slots',
      current_slot_id: currentSlotId,
      current_faculty_id: currentFacultyId,
      is_college_educator: isCollegeEducator,
    }
  );

  return { data: result.data, error: null };
};
