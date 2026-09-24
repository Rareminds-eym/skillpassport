import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Video, Edit, Trash2, Settings, Play, Loader2, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import VideoPortfolioLoader from '../../components/VideoPortfolioLoader';
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
import { getVideoPortfolioUrl } from '@/shared/api/storageApiService';
import { ssoClient } from '@/shared/api/ssoClient';

const MAX_VIDEOS = 5;

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

// Helper function to get relative time (e.g., "2 hours ago", "3 days ago")
const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }
};

function VideoPortfolioPage() {
  return (
    <FeatureGate featureKey="video_portfolio">
      <VideoPortfolioPageContent />
    </FeatureGate>
  );
}

const VideoPortfolioPageContent: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoEntryType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<VideoEntryType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // Filter only published videos for display
  const publishedVideos = videos.filter(v => v.showOnPublic && v.approvalStatus === 'approved');

  // Set first published video as current playing video on mount
  useEffect(() => {
    if (publishedVideos.length > 0 && !currentPlayingVideo) {
      setCurrentPlayingVideo(publishedVideos[0]);
    }
  }, [publishedVideos.length]);

  // Load video when current playing video changes
  useEffect(() => {
    if (currentPlayingVideo) {
      loadVideo(currentPlayingVideo);
    } else {
      // Clear video URL when no video is playing
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
      setVideoUrl(null);
    }
  }, [currentPlayingVideo?.id]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const loadVideo = async (video: VideoEntryType) => {
    if (!video?.videoUrl) return;

    setLoadingVideo(true);
    try {
      const url = getVideoPortfolioUrl(video.videoUrl, 'inline');
      const response = await ssoClient.fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to load video: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideoUrl(blobUrl);
    } catch (error) {
      console.error('Failed to load video:', error);
      toast.error('Failed to load video');
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleVideoClick = (video: VideoEntryType) => {
    // Revoke old blob URL
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    setCurrentPlayingVideo(video);
  };

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

      // Close manage modal after upload
      setIsManageModalOpen(false);
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

  // Full-page loader for initial load - Show loader while fetching OR while learner data is loading
  if ((loading && videos.length === 0) || learnerLoading) {
    return <VideoPortfolioLoader />;
  }

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Video Portfolio
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {publishedVideos.length} published {publishedVideos.length === 1 ? 'video' : 'videos'}
            </p>
          </div>

          {/* Settings Icon */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/learner/digital-portfolio/video/manage')}
            className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            title="Manage Videos"
          >
            <Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </motion.button>
        </div>

        {/* Main Content */}
        {publishedVideos.length === 0 ? (
          // Empty State
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Video className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Publish Your Portfolio
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Upload your first video and publish it to showcase your skills and projects to the world
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/learner/digital-portfolio/video/manage')}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Upload Your First Video
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
            </motion.button>
          </div>
        ) : (
          // Video Display Layout (YouTube-style)
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Video Player */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Player */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div
                  className="w-full aspect-video bg-black flex items-center justify-center relative"
                  style={currentPlayingVideo ? getThumbnailStyle(currentPlayingVideo) : { backgroundColor: '#000' }}
                >
                  {loadingVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                  ) : videoUrl && currentPlayingVideo ? (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      crossOrigin="use-credentials"
                      className="w-full h-full"
                      onError={(e) => {
                        console.error('Video loading error:', e);
                        toast.error('Failed to load video');
                      }}
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Play className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                </div>
              </div>

              {/* Video Details */}
              {currentPlayingVideo && (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentPlayingVideo.title}
                    </h2>
                  </div>

                  {/* Description, User Profile, Tags, and Upload Date */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl space-y-4">
                    {/* User Profile and Upload Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {userName}
                          </h3>
                        </div>
                      </div>

                      {/* Upload Date */}
                      {currentPlayingVideo.createdAt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getRelativeTime(currentPlayingVideo.createdAt)}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {currentPlayingVideo.description && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {currentPlayingVideo.description}
                      </p>
                    )}

                    {/* Tags */}
                    {currentPlayingVideo.tags && currentPlayingVideo.tags.length > 0 && (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {currentPlayingVideo.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-lg border border-indigo-200 dark:border-indigo-800"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Video List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-2">
                All Videos
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto p-2
               scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {publishedVideos.map((video) => (
                  <motion.button
                    key={video.id}
                    onClick={() => handleVideoClick(video)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full bg-white dark:bg-gray-800 rounded-xl p-3 transition-all text-left focus:outline-none ${currentPlayingVideo?.id === video.id
                      ? 'ring-2 ring-indigo-500 shadow-lg'
                      : 'hover:shadow-md'
                      }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-40 h-24 rounded-lg flex items-center justify-center relative overflow-hidden"
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
                          {currentPlayingVideo?.id === video.id && (
                            <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {video.title}
                        </h4>
                        {video.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {video.description}
                          </p>
                        )}
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {video.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {video.tags.length > 2 && (
                              <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500">
                                +{video.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}
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

export default VideoPortfolioPage;
