/**
 * Video Portfolio Service
 * 
 * Handles CRUD operations for video portfolio entries.
 * Connects to /api/college-admin/digital-portfolio endpoint.
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';
import type {
  VideoEntry,
  VideoPortfolioResponse,
  CreateVideoRequest,
  UpdateVideoRequest,
  DeleteVideoRequest,
  ApproveVideoRequest,
  RejectVideoRequest,
  GetPendingVideosRequest,
  PendingVideoEntry,
} from '../types/videoPortfolio';

const logger = getLogger('video-portfolio-service');

const API_URL = getApiUrl('college-admin');

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

/**
 * Get learner's video portfolio
 */
export async function getVideos(learnerId?: string): Promise<VideoPortfolioResponse> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-videos',
        ...(learnerId && { learnerId }),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view these videos.');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to fetch videos');
    }

    const result = await response.json() as ApiResponse<VideoPortfolioResponse>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error fetching videos', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create a new video entry
 */
export async function createVideo(request: Omit<CreateVideoRequest, 'action'>): Promise<{ id: string; message: string }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'create-video',
        ...request,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Quota exceeded. Maximum 5 videos allowed per learner.');
      } else if (response.status === 400) {
        throw new Error(error.error?.message || error.message || 'Invalid video data');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to create video');
    }

    const result = await response.json() as ApiResponse<{ id: string; message: string }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error creating video', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Update video metadata
 */
export async function updateVideo(request: Omit<UpdateVideoRequest, 'action'>): Promise<{ message: string }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update-video',
        ...request,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to update this video.');
      } else if (response.status === 404) {
        throw new Error('Video not found.');
      } else if (response.status === 400) {
        throw new Error(error.error?.message || error.message || 'Invalid update data');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to update video');
    }

    const result = await response.json() as ApiResponse<{ message: string }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error updating video', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Delete a video entry (also deletes R2 file)
 */
export async function deleteVideo(videoId: string): Promise<{ message: string }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete-video',
        videoId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to delete this video.');
      } else if (response.status === 404) {
        throw new Error('Video not found.');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to delete video');
    }

    const result = await response.json() as ApiResponse<{ message: string }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error deleting video', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Approve a video (admin only)
 */
export async function approveVideo(videoId: string): Promise<{ message: string }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'approve-video',
        videoId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Admin permission required.');
      } else if (response.status === 404) {
        throw new Error('Video not found.');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to approve video');
    }

    const result = await response.json() as ApiResponse<{ message: string }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error approving video', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Reject a video (admin only)
 */
export async function rejectVideo(videoId: string, rejectionReason: string): Promise<{ message: string }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reject-video',
        videoId,
        rejectionReason,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Admin permission required.');
      } else if (response.status === 404) {
        throw new Error('Video not found.');
      } else if (response.status === 400) {
        throw new Error('Rejection reason is required.');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to reject video');
    }

    const result = await response.json() as ApiResponse<{ message: string }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error rejecting video', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get pending videos for review (admin only)
 */
export async function getPendingVideos(limit: number = 50): Promise<{ videos: PendingVideoEntry[]; totalCount: number }> {
  try {
    const response = await ssoClient.fetch(`${API_URL}/digital-portfolio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'get-pending-videos',
        limit,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ApiResponse;
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Admin permission required.');
      }
      
      throw new Error(error.error?.message || error.message || 'Failed to fetch pending videos');
    }

    const result = await response.json() as ApiResponse<{ videos: PendingVideoEntry[]; totalCount: number }>;
    
    if (!result.success || !result.data) {
      throw new Error('Invalid API response');
    }

    return result.data;
  } catch (error) {
    logger.error('Error fetching pending videos', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

export default {
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  approveVideo,
  rejectVideo,
  getPendingVideos,
};
