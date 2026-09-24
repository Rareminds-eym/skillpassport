/**
 * Video Portfolio Store
 * 
 * Zustand store for managing video portfolio state.
 * Handles video list, loading states, errors, and CRUD operations.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { VideoEntry, CreateVideoRequest } from '../types/videoPortfolio';
import * as videoPortfolioService from '../api/videoPortfolioService';
import * as storageApiService from '@/shared/api/storageApiService';

interface VideoPortfolioState {
  // State
  videos: VideoEntry[];
  loading: boolean;
  error: string | null;
  uploadProgress: number | null;
  totalCount: number;
  maxAllowed: number;

  // Actions
  fetchVideos: (learnerId?: string) => Promise<void>;
  uploadAndCreateVideo: (
    file: File,
    metadata: {
      learnerId: string;
      title: string;
      description?: string;
      tags?: string[];
      thumbnailColor?: string;
      trimStart?: number;
      trimEnd?: number;
      showOnPublic?: boolean;
      duration?: string;
    },
    userName?: string
  ) => Promise<{ id: string }>;
  updateVideo: (
    videoId: string,
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      thumbnailColor?: string;
      thumbnailType?: string;
      thumbnailValue?: string;
      trimStart?: number;
      trimEnd?: number;
      showOnPublic?: boolean;
      status?: string;
      approvalStatus?: string;
    }
  ) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  videos: [],
  loading: false,
  error: null,
  uploadProgress: null,
  totalCount: 0,
  maxAllowed: 5,
};

export const useVideoPortfolioStore = create<VideoPortfolioState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch videos for a learner
       */
      fetchVideos: async (learnerId?: string) => {
        set({ loading: true, error: null });

        try {
          const response = await videoPortfolioService.getVideos(learnerId);

          set({
            videos: response.videos,
            totalCount: response.totalCount,
            maxAllowed: response.maxAllowed,
            loading: false,
          });
        } catch (error) {
          console.error('Error fetching videos:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      /**
       * Upload video file and create entry
       */
      uploadAndCreateVideo: async (file, metadata, userName) => {
        set({ loading: true, error: null, uploadProgress: 0 });

        try {
          // Generate unique video ID
          const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          // Step 1: Upload file to R2
          set({ uploadProgress: 10 });
          const uploadResult = await storageApiService.uploadVideoPortfolio(
            file,
            videoId,
            userName
          );

          set({ uploadProgress: 60 });

          // Step 2: Create video entry in database
          const createResult = await videoPortfolioService.createVideo({
            learnerId: metadata.learnerId,
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            videoUrl: uploadResult.fileKey,
            thumbnailColor: metadata.thumbnailColor,
            duration: metadata.duration, // Use calculated duration
            fileSizeBytes: uploadResult.fileSize,
            mimeType: file.type,
            trimStart: metadata.trimStart,
            trimEnd: metadata.trimEnd,
            showOnPublic: metadata.showOnPublic,
          });

          set({ uploadProgress: 90 });

          // Step 3: Refresh video list
          await get().fetchVideos(metadata.learnerId);

          set({
            uploadProgress: 100,
            loading: false,
          });

          // Clear progress after a delay
          setTimeout(() => {
            set({ uploadProgress: null });
          }, 1000);

          return { id: createResult.id };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
          set({
            error: errorMessage,
            loading: false,
            uploadProgress: null,
          });
          throw error;
        }
      },

      /**
       * Update video metadata
       */
      updateVideo: async (videoId, updates) => {
        set({ loading: true, error: null });

        try {
          await videoPortfolioService.updateVideo({
            videoId,
            ...updates,
          });

          // Update local state optimistically
          set((state) => {
            const updatedVideos = state.videos.map((video) =>
              video.id === videoId
                ? {
                  ...video,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
                : video
            );

            return {
              videos: updatedVideos,
              loading: false,
            };
          });
        } catch (error) {
          console.error('Error updating video:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to update video';
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      /**
       * Delete video (removes from R2 and database)
       */
      deleteVideo: async (videoId) => {
        set({ loading: true, error: null });

        try {
          await videoPortfolioService.deleteVideo(videoId);

          // Update local state
          set((state) => ({
            videos: state.videos.filter((video) => video.id !== videoId),
            totalCount: state.totalCount - 1,
            loading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete video';
          set({
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      /**
       * Set error message
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'VideoPortfolioStore' }
  )
);

// Selectors
export const selectVideos = (state: VideoPortfolioState) => state.videos;
export const selectLoading = (state: VideoPortfolioState) => state.loading;
export const selectError = (state: VideoPortfolioState) => state.error;
export const selectUploadProgress = (state: VideoPortfolioState) => state.uploadProgress;
export const selectVideoCount = (state: VideoPortfolioState) => state.totalCount;
export const selectMaxAllowed = (state: VideoPortfolioState) => state.maxAllowed;
export const selectCanUploadMore = (state: VideoPortfolioState) =>
  state.totalCount < state.maxAllowed;
export const selectQuotaPercentage = (state: VideoPortfolioState) =>
  (state.totalCount / state.maxAllowed) * 100;
export const selectVideosByStatus = (status: string) => (state: VideoPortfolioState) =>
  state.videos.filter((video) => video.status === status);
export const selectPublicVideos = (state: VideoPortfolioState) =>
  state.videos.filter((video) => video.showOnPublic && video.approvalStatus === 'approved');
export const selectPendingVideos = (state: VideoPortfolioState) =>
  state.videos.filter((video) => video.approvalStatus === 'pending');

export default useVideoPortfolioStore;
