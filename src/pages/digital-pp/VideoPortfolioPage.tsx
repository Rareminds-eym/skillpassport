import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, Edit, Trash2, Eye, Clock, MoreVertical, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FeatureGate } from '@/features/subscription';
import VideoEditDrawer from './VideoEditDrawer';
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

const MAX_VIDEOS = 5;

// Helper function to get video duration
const getVideoDuration = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;

      // Format as MM:SS
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      resolve(formatted);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

// Helper function to format dates with time
const formatVideoDate = (dateString: string): string => {
  // Handle missing or invalid date
  if (!dateString) {
    console.warn('Missing createdAt date for video');
    return 'Just uploaded';
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid createdAt date:', dateString);
      return 'Just uploaded';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // For very recent uploads, show relative time
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hrs ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    // For older uploads, show full date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Just uploaded';
  }
};

const VideoPortfolioPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'preview'>('manage');
  const [selectedVideo, setSelectedVideo] = useState<VideoEntryType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Debug: Log video data
  useEffect(() => {
    if (videos && videos.length > 0) {
      console.log('Video data received:', videos.map(v => ({
        id: v.id,
        title: v.title,
        createdAt: v.createdAt,
        duration: v.duration
      })));
    }
  }, [videos]);

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
        // Continue without duration
      }

      const { id } = await uploadAndCreateVideo(
        file,
        {
          learnerId,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: '',
          tags: [],
          thumbnailColor: '#6B7280',
          showOnPublic: false,
          duration, // Pass calculated duration
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
      // Error toast already shown by store
    }
  };

  const handleEditVideo = (video: VideoEntryType) => {
    setSelectedVideo(video);
    setIsDrawerOpen(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video && window.confirm(`Delete "${video.title}"? This action cannot be undone.`)) {
      try {
        await deleteVideo(videoId);
        toast.success('Video deleted successfully');

        // Close drawer if the deleted video was being edited
        if (selectedVideo?.id === videoId) {
          setIsDrawerOpen(false);
          setSelectedVideo(null);
        }
      } catch (err: any) {
        console.error('Delete failed:', err);
        // Error toast already shown by store
      }
    }
  };

  const handleSaveVideo = () => {
    // Video is already updated via the drawer's direct store calls
    setIsDrawerOpen(false);
    setSelectedVideo(null);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedVideo(null);
  };

  const getStatusBadge = (status: VideoEntryType['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            ● VERIFIED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            ● PROCESSING
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700">
            DRAFT
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700">
            ✖ REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  const filteredVideos = activeTab === 'preview'
    ? videos.filter(v => v.showOnPublic && v.approvalStatus === 'approved')
    : videos;

  // Full-page loader for initial load
  if ((loading || learnerLoading) && videos.length === 0) {
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
          <motion.div
            className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>

        {/* Loader Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            {/* Animated Logo with Ripple Effect */}
            <div className="relative mb-6 inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center relative z-10 p-4"
              >
                <img src="/RMLogo.webp" alt="RareMinds" className="w-full h-full object-contain" />
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-400 dark:to-blue-500"
              />
            </div>

            {/* Loading Text */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Video Portfolio
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Loading your videos...
            </p>

            {/* Animated Dots */}
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900">
      {/* Animated Ripple Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ripple circles */}
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
        <motion.div
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Video Portfolio
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {videoCount} of {maxAllowed} videos used
          </p>

          {/* Tabs */}
          <div className="flex items-center space-x-1 mt-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'manage'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Manage
              {activeTab === 'manage' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === 'preview'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              Public Preview
              {activeTab === 'preview' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Upload Area */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploading video...
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#2D3E5F] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 transition-all ${isDragging
                ? 'border-[#2D3E5F] bg-[#2D3E5F]/5 dark:bg-[#2D3E5F]/10'
                : !canUploadMore || loading
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#2D3E5F] dark:hover:border-[#2D3E5F]'
                }`}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Add a new video
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Drag a file here, or browse from your device.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  MP4, MOV, AVI, WebM • Max 100 MB
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handleBrowseFiles}
                    disabled={!canUploadMore || loading}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center">
                      {loading ? 'Uploading...' : 'Browse files'}
                      {!loading && <Upload className="w-5 h-5 ml-2" />}
                    </span>
                    {!loading && (
                      <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                    )}
                  </button>
                </motion.div>
                {!canUploadMore && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Maximum {maxAllowed} videos reached
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Entries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your entries
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>

          {/* Empty state */}
          {filteredVideos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <Video className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'preview' ? 'No public videos yet' : 'No videos uploaded yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'preview'
                  ? 'Upload a video and set it to public to see it here'
                  : 'Upload your first video to showcase your skills'}
              </p>
              {activeTab === 'manage' && canUploadMore && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={handleBrowseFiles}
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Upload Video
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Video Thumbnail */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-32 h-20 rounded-lg flex items-center justify-center relative"
                          style={{ backgroundColor: video.thumbnailColor || '#6B7280' }}
                        >
                          <Video className="w-8 h-8 text-white opacity-80" />
                          {video.duration && (
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                              {video.duration}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {video.title}
                              </h3>
                              {/* Status Badge */}
                              {video.showOnPublic ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded border border-green-300 dark:border-green-700">
                                  Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded border border-gray-300 dark:border-gray-600">
                                  Draft
                                </span>
                              )}
                            </div>
                            {video.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {video.description}
                              </p>
                            )}
                          </div>
                          {activeTab === 'manage' && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditVideo(video)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video.id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {video.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status, Upload Date/Time, and Duration */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(video.status)}
                            <span className="text-gray-500 dark:text-gray-400">
                              Uploaded: {formatVideoDate(video.createdAt)}
                            </span>
                          </div>
                          {video.duration && (
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              Duration: {video.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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

      {/* Edit Drawer */}
      <VideoEditDrawer
        isOpen={isDrawerOpen}
        video={selectedVideo}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

const VideoPortfolioPage: React.FC = () => (
  <FeatureGate featureKey="video_portfolio" showUpgradePrompt={true}>
    <VideoPortfolioPageContent />
  </FeatureGate>
);

export default VideoPortfolioPage;
