/**
 * Video Portfolio Types
 * 
 * Type definitions for video portfolio feature in digital passport.
 * These types match the database schema in video_portfolio table.
 */

/**
 * Video processing status
 */
export type VideoStatus = 'DRAFT' | 'PROCESSING' | 'VERIFIED' | 'REJECTED';

/**
 * Admin approval status
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Main video portfolio entry interface
 * Represents a single video in a learner's portfolio
 */
export interface VideoEntry {
  // Identification
  id: string;
  learnerId: string;

  // Metadata
  title: string;
  description: string | null;
  tags: string[];

  // Storage
  videoUrl: string;           // R2 key
  thumbnailColor: string;     // Hex color code (deprecated, kept for backward compatibility)
  thumbnailType?: string;     // 'color' | 'logo' | 'upload' | 'frame'
  thumbnailValue?: string;    // hex code, image URL, timestamp, or 'rm-logo'

  // Properties
  duration: string | null;    // Format: "4:02"
  fileSizeBytes: number | null;
  mimeType: string;

  // Editing
  trimStart: number;          // Percentage 0-100
  trimEnd: number;            // Percentage 0-100

  // Status
  status: VideoStatus;
  approvalStatus: ApprovalStatus;
  showOnPublic: boolean;

  // Admin review
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Response from get-videos API
 */
export interface VideoPortfolioResponse {
  videos: VideoEntry[];
  totalCount: number;
  maxAllowed: number;         // Always 5
}

/**
 * Request body for create-video API
 */
export interface CreateVideoRequest {
  action: 'create-video';
  learnerId: string;
  title: string;
  description?: string;
  tags?: string[];
  videoUrl: string;           // R2 key from upload
  thumbnailColor?: string;
  duration?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  trimStart?: number;
  trimEnd?: number;
  showOnPublic?: boolean;
}

/**
 * Request body for update-video API
 */
export interface UpdateVideoRequest {
  action: 'update-video';
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  thumbnailColor?: string;
  thumbnailType?: string;     // 'color' | 'logo' | 'upload' | 'frame'
  thumbnailValue?: string;    // hex code, image URL, timestamp, or 'rm-logo'
  trimStart?: number;
  trimEnd?: number;
  showOnPublic?: boolean;
  status?: VideoStatus;
  approvalStatus?: ApprovalStatus;
}

/**
 * Request body for delete-video API
 */
export interface DeleteVideoRequest {
  action: 'delete-video';
  videoId: string;
}

/**
 * Request body for approve-video API (admin only)
 */
export interface ApproveVideoRequest {
  action: 'approve-video';
  videoId: string;
}

/**
 * Request body for reject-video API (admin only)
 */
export interface RejectVideoRequest {
  action: 'reject-video';
  videoId: string;
  rejectionReason: string;
}

/**
 * Request body for get-pending-videos API (admin only)
 */
export interface GetPendingVideosRequest {
  action: 'get-pending-videos';
  limit?: number;
}

/**
 * Pending video entry (for admin review)
 */
export interface PendingVideoEntry {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  title: string;
  description: string | null;
  tags: string[];
  videoUrl: string;
  duration: string | null;
  status: VideoStatus;
  createdAt: string;
}

/**
 * Upload video response from storage API
 */
export interface UploadVideoResponse {
  url: string;                // Proxy URL for streaming
  fileKey: string;            // R2 key
  filename: string;
  fileSize: number;
}

/**
 * Video upload request to storage API
 */
export interface UploadVideoRequest {
  videoBase64: string;
  videoId: string;
  userId: string;
  userName?: string;
  filename?: string;
  mimeType?: string;
}

/**
 * Constants
 */
export const VIDEO_PORTFOLIO_CONSTANTS = {
  MAX_VIDEOS: 5,
  MAX_TAGS: 5,
  MAX_FILE_SIZE_MB: 100,
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024,
  SUPPORTED_MIME_TYPES: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ] as const,
  SUPPORTED_EXTENSIONS: ['mp4', 'mov', 'avi', 'webm'] as const,
  DEFAULT_THUMBNAIL_COLOR: '#2D3E5F',
  THUMBNAIL_COLORS: [
    '#2D3E5F',
    '#4A5568',
    '#374151',
    '#6B7280',
    '#1F2937',
    '#111827',
  ] as const,
} as const;

/**
 * Type guard to check if status is valid
 */
export function isValidVideoStatus(status: string): status is VideoStatus {
  return ['DRAFT', 'PROCESSING', 'VERIFIED', 'REJECTED'].includes(status);
}

/**
 * Type guard to check if approval status is valid
 */
export function isValidApprovalStatus(status: string): status is ApprovalStatus {
  return ['pending', 'approved', 'rejected'].includes(status);
}

/**
 * Helper to format file size
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';

  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

/**
 * Helper to validate video entry
 */
export function validateVideoEntry(entry: Partial<VideoEntry>): string[] {
  const errors: string[] = [];

  if (!entry.title || entry.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (entry.title && entry.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (entry.description && entry.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  if (entry.tags && entry.tags.length > VIDEO_PORTFOLIO_CONSTANTS.MAX_TAGS) {
    errors.push(`Maximum ${VIDEO_PORTFOLIO_CONSTANTS.MAX_TAGS} tags allowed`);
  }

  if (entry.trimStart !== undefined && (entry.trimStart < 0 || entry.trimStart > 100)) {
    errors.push('Trim start must be between 0 and 100');
  }

  if (entry.trimEnd !== undefined && (entry.trimEnd < 0 || entry.trimEnd > 100)) {
    errors.push('Trim end must be between 0 and 100');
  }

  if (
    entry.trimStart !== undefined &&
    entry.trimEnd !== undefined &&
    entry.trimStart >= entry.trimEnd
  ) {
    errors.push('Trim start must be less than trim end');
  }

  return errors;
}
