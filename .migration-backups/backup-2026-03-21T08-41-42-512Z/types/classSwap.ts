// =====================================================
// CLASS SWAP REQUEST - TYPE DEFINITIONS
// =====================================================

export type SwapRequestType = 'one_time' | 'permanent';

export type SwapRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export type AdminApprovalStatus = 'pending' | 'approved' | 'rejected';

export type SwapHistoryAction = 
  | 'created' 
  | 'accepted' 
  | 'rejected' 
  | 'cancelled' 
  | 'admin_approved' 
  | 'admin_rejected' 
  | 'completed';

export type ActorRole = 'requester' | 'target' | 'admin';

// =====================================================
// MAIN INTERFACES
// =====================================================

export interface ClassSwapRequest {
  id: string;
  
  // Requester Information
  requester_faculty_id: string;
  requester_slot_id: string;
  
  // Target Information
  target_faculty_id: string;
  target_slot_id: string;
  
  // Request Details
  reason: string;
  request_type: SwapRequestType;
  swap_date?: string; // ISO date string for one_time swaps
  
  // Status & Approval
  status: SwapRequestStatus;
  target_response?: string;
  target_responded_at?: string;
  
  // Admin Approval
  requires_admin_approval: boolean;
  admin_approval_status?: AdminApprovalStatus;
  admin_id?: string;
  admin_response?: string;
  admin_responded_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ClassSwapHistory {
  id: string;
  swap_request_id: string;
  action: SwapHistoryAction;
  actor_id: string;
  actor_role: ActorRole;
  notes?: string;
  created_at: string;
}

// =====================================================
// EXTENDED INTERFACES (with joined data)
// =====================================================

export interface SlotInfo {
  id: string;
  subject_name: string;
  class_name: string;
  room_number: string;
  day_of_week: number;
  period_number: number;
  start_time: string;
  end_time: string;
  educator_id?: string; // Optional educator ID for swap requests
}

export interface FacultyInfo {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
}

export interface ClassSwapRequestWithDetails extends ClassSwapRequest {
  requester_faculty?: FacultyInfo;
  target_faculty?: FacultyInfo;
  requester_slot?: SlotInfo;
  target_slot?: SlotInfo;
  admin?: FacultyInfo;
  history?: ClassSwapHistory[];
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateSwapRequestPayload {
  requester_faculty_id: string;
  requester_slot_id: string;
  target_faculty_id: string;
  target_slot_id: string;
  reason: string;
  request_type: SwapRequestType;
  swap_date?: string; // Required for one_time, null for permanent
  requires_admin_approval?: boolean;
}

export interface RespondToSwapRequestPayload {
  status: 'accepted' | 'rejected';
  response_message?: string;
}

export interface AdminApprovalPayload {
  approval_status: 'approved' | 'rejected';
  response_message?: string;
}

export interface SwapRequestFilters {
  status?: SwapRequestStatus;
  request_type?: SwapRequestType;
  date_from?: string;
  date_to?: string;
  faculty_id?: string; // Filter by specific faculty (as requester or target)
}

// =====================================================
// UI STATE INTERFACES
// =====================================================

export interface SwapRequestCardProps {
  request: ClassSwapRequestWithDetails;
  viewMode: 'sent' | 'received' | 'history';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string, reason?: string) => void;
  onCancel?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
}

export interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlot: SlotInfo;
  availableSlots: SlotInfo[];
  onSubmit: (payload: CreateSwapRequestPayload) => Promise<void>;
}

export interface SwapRequestsDashboardProps {
  facultyId: string;
  isCollegeEducator: boolean;
}

// =====================================================
// CONFLICT CHECK INTERFACE
// =====================================================

export interface SwapConflictCheck {
  has_conflict: boolean;
  conflict_reason: string;
}

// =====================================================
// NOTIFICATION INTERFACE
// =====================================================

export interface SwapNotification {
  id: string;
  swap_request_id: string;
  recipient_id: string;
  notification_type: 'new_request' | 'accepted' | 'rejected' | 'admin_approved' | 'admin_rejected' | 'reminder';
  message: string;
  is_read: boolean;
  created_at: string;
}

// =====================================================
// STATISTICS INTERFACE
// =====================================================

export interface SwapStatistics {
  total_requests: number;
  pending_requests: number;
  accepted_requests: number;
  rejected_requests: number;
  completed_swaps: number;
  pending_admin_approval: number;
}
