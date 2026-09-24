import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  useVideoPortfolioStore,
  selectVideos,
  selectLoading,
  selectError,
  selectUploadProgress,
  selectVideoCount,
  selectMaxAllowed,
  selectCanUploadMore,
  type VideoEntry as VideoEntryType
} from '@/features/digital-portfolio';
import { useUser } from '@/shared/model/authStore';
import { useLearnerDataByEmail } from '@/entities/learner/model/useLearnerDataByEmail';
import VideoEditDrawer from './VideoEditDrawer';

// Helper function to get thumbnail style based on type
const getThumbnailStyle = (video: VideoEntryType): React.CSSProperties => {
  const thumbType = (video as any).thumbnailType || 'color';
  const thumbValue = (video as any).thumbnailValue || video.thumbnailColor || '#6B7280';

  if (thumbType === 'color') {
    return { backgroundColor: thumbValue };
  } else if (thumbType === 'logo') {
    return {
      backgroundColor: '#fff',
      backgroundImage: `url(/RMLogo.webp)`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  } else if (thumbType === 'upload' || thumbType === 'frame') {
    return {
      backgroundColor: '#000',
      backgroundImage: `url(${thumbValue})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return { backgroundColor: thumbValue || '#6B7280' };
};

// Helper function to get video duration
const getVideoDuration = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

const VideoPortfolioManagePage: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoEntryType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Get user and learner data
  const user = useUser();
  const { learnerData, loading: learnerLoading } = useLearnerDataByEmail(user?.email);
  const learnerId = learnerData?.id || '';
  const userName = user?.name || learnerData?.name || 'User';

  // Store state
  const videos = useVideoPortfolioStore(selectVideos);
  const loading = useVideoPortfolioStore(selectLoading);
  const error = useVideoPortfolioStore(selectError);
  const uploadProgress = useVideoPortfolioStore(selectUploadProgress);
  const videoCount = useVideoPortfolioStore(selectVideoCount);
  const maxAllowed = useVideoPortfolioStore(selectMaxAllowed);
  const canUploadMore = useVideoPortfolioStore(selectCanUploadMore);

  // Store actions
  const fetchVideos = useVideoPortfolioStore(state => state.fetchVideos);
  const uploadAndCreateVideo = useVideoPortfolioStore(state => state.uploadAndCreateVideo);
  const deleteVideo = useVideoPortfolioStore(state => state.deleteVideo);
  const clearError = useVideoPortfolioStore(state => state.clearError);

  // Fetch videos on mount when learnerId is available
  useEffect(() => {
    if (learnerId && !learnerLoading) {
      fetchVideos(learnerId).catch(err => {
        console.error('Failed to fetch videos:', err);
        toast.error(err.message || 'Failed to load videos');
      });
    }
  }, [learnerId, learnerLoading, fetchVideos]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleFileUpload(file);
    } else if (file) {
      toast.error('Please select a valid video file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileUpload(file);
    } else {
      toast.error('Please drop a valid video file');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!canUploadMore) {
      toast.error(`Maximum ${maxAllowed} videos allowed`);
      return;
    }

    // Validate file size (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Video file too large. Maximum 100MB allowed.');
      return;
    }

    try {
      // Calculate video duration
      let duration: string | undefined;
      try {
        duration = await getVideoDuration(file);
        console.log('Video duration calculated:', duration);
      } catch (err) {
        console.warn('Failed to calculate video duration:', err);
      }

      const { id } = await uploadAndCreateVideo(
        file,
        {
          learnerId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: '',
          tags: [],
          thumbnailColor: '#6B7280',
          showOnPublic: false,
          duration,
        },
        userName
      );

      toast.success('Video uploaded successfully');

      // Find the newly created video and open drawer
      const newVideo = videos.find(v => v.id === id);
      if (newVideo) {
        setSelectedVideo(newVideo);
        setIsDrawerOpen(true);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
    }
  };

  const handleEditVideo = (video: VideoEntryType) => {
    setSelectedVideo(video);
    setIsDrawerOpen(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteVideo(videoId);
      toast.success('Video deleted successfully');
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err.message || 'Failed to delete video');
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedVideo(null);
    // Refresh videos after editing
    if (learnerId) {
      fetchVideos(learnerId);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900">
      {/* Animated Ripple Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => navigate('/learner/digital-portfolio/video')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Manage Videos
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-14">
              {videoCount} of {maxAllowed} videos used
            </p>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Uploading video...
              </span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white dark:bg-gray-800 border-2 border-dashed rounded-2xl p-12 transition-all shadow-xl ${isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : !canUploadMore || loading
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-50 cursor-not-allowed'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add a new video
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drag a file here, or browse from your device
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
                MP4, MOV, AVI, WebM • Max 100 MB
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBrowseFiles}
                disabled={!canUploadMore || loading}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Browse files'}
                {!loading && <Upload className="w-5 h-5 ml-2" />}
              </motion.button>
              {!canUploadMore && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                  Maximum {maxAllowed} videos reached
                </p>
              )}
            </div>
          </div>
        </div>

        {/* All Videos List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            All Videos ({videos.length})
          </h3>

          {videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No videos uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-32 h-20 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={getThumbnailStyle(video)}
                      >
                        {/* Only show video icon if it's a color thumbnail */}
                        {(!(video as any).thumbnailType || (video as any).thumbnailType === 'color') && (
                          <Video className="w-6 h-6 text-white opacity-80" />
                        )}
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                            {video.duration}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                              {video.title}
                            </h4>
                            {video.showOnPublic ? (
                              <span className="inline-flex items-center px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded border border-green-300 dark:border-green-700">
                                Published
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                                Draft
                              </span>
                            )}
                          </div>
                          {video.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Tags */}
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {video.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Video Edit Drawer */}
      <VideoEditDrawer
        isOpen={isDrawerOpen}
        video={selectedVideo}
        onClose={handleDrawerClose}
      />
    </div>
  );
};

export default VideoPortfolioManagePage;
