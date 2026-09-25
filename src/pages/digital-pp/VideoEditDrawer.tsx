import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Tag, Trash2, Loader2, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  useVideoPortfolioStore,
  type VideoEntry,
} from '@/features/digital-portfolio';
import { getVideoPortfolioUrl } from '@/shared/api/storageApiService';
import { ssoClient } from '@/shared/api/ssoClient';
import * as storageApiService from '@/shared/api/storageApiService';
import { useUser } from '@/shared/model/authStore';

interface VideoEditDrawerProps {
  isOpen: boolean;
  video: VideoEntry | null;
  onClose: () => void;
}

// Thumbnail option types
type ThumbnailType = 'color' | 'logo' | 'upload' | 'frame';

interface ThumbnailOption {
  type: ThumbnailType;
  value: string | null;
  label?: string;
}

const THUMBNAIL_OPTIONS: ThumbnailOption[] = [
  { type: 'upload', value: null, label: 'Upload Image' },
  { type: 'logo', value: 'rm-logo', label: 'RM Logo' },
  { type: 'frame', value: null, label: 'Capture Frame' },
  { type: 'color', value: '#2D3E5F', label: 'Dark Blue' },
  { type: 'color', value: '#4A5568', label: 'Gray' },
  { type: 'color', value: '#374151', label: 'Dark Gray' },
];

const RM_LOGO_PATH = '/RMLogo.webp';

const COVER_THUMBNAILS = [
  '#2D3E5F',
  '#4A5568',
  '#374151',
  '#6B7280',
  '#1F2937',
  '#111827',
];

const VideoEditDrawer: React.FC<VideoEditDrawerProps> = ({
  isOpen,
  video,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showOnPublic, setShowOnPublic] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [thumbnailType, setThumbnailType] = useState<ThumbnailType>('color');
  const [thumbnailValue, setThumbnailValue] = useState<string>('#2D3E5F');
  const [uploadedThumbnail, setUploadedThumbnail] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingPublishState, setPendingPublishState] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const replaceVideoInputRef = useRef<HTMLInputElement>(null);

  // Store actions
  const updateVideo = useVideoPortfolioStore(state => state.updateVideo);
  const deleteVideo = useVideoPortfolioStore(state => state.deleteVideo);
  const fetchVideos = useVideoPortfolioStore(state => state.fetchVideos);
  const navigate = useNavigate();

  // Get user info
  const user = useUser();
  const userName = user?.name || 'User';

  // Initialize form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setTags(video.tags || []);
      setShowOnPublic(video.showOnPublic);

      // Parse thumbnail data (backward compatible)
      const thumbType = (video as any).thumbnailType || 'color';
      const thumbValue = (video as any).thumbnailValue || video.thumbnailColor || '#2D3E5F';

      setThumbnailType(thumbType);
      setThumbnailValue(thumbValue);

      // Set selected thumbnail index based on type
      const optionIndex = THUMBNAIL_OPTIONS.findIndex(
        opt => opt.type === thumbType && (opt.value === thumbValue || opt.type === thumbType)
      );
      setSelectedThumbnail(optionIndex >= 0 ? optionIndex : 0);

      // Restore uploaded/captured thumbnails if applicable
      if (thumbType === 'upload') {
        setUploadedThumbnail(thumbValue);
      } else if (thumbType === 'frame') {
        setCapturedFrame(thumbValue);
      }

      setTrimStart(video.trimStart || 0);
      setTrimEnd(video.trimEnd || 100);

      // Load video URL
      loadVideo();
    }
  }, [video]);

  // Update video playback to respect trim settings
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) return;

    const handleLoadedMetadata = () => {
      const duration = videoElement.duration;
      const startTime = (trimStart / 100) * duration;
      videoElement.currentTime = startTime;
    };

    const handleTimeUpdate = () => {
      const duration = videoElement.duration;
      const currentTime = videoElement.currentTime;
      const endTime = (trimEnd / 100) * duration;

      if (currentTime >= endTime) {
        videoElement.pause();
        videoElement.currentTime = (trimStart / 100) * duration; // Reset to start
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoUrl, trimStart, trimEnd]);

  const loadVideo = async () => {
    if (!video?.videoUrl) return;

    setLoadingVideo(true);
    try {
      // Get the video URL
      const url = getVideoPortfolioUrl(video.videoUrl, 'inline');
      console.log('Fetching video from:', url);

      // Fetch the video with authentication using ssoClient
      const response = await ssoClient.fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to load video: ${response.status} ${response.statusText}`);
      }

      // Convert response to blob and create object URL
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideoUrl(blobUrl);
      console.log('Video blob URL created successfully');
    } catch (error) {
      console.error('Failed to load video:', error);
      toast.error('Failed to load video preview');
    } finally {
      setLoadingVideo(false);
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();

    // Validate: only allow letters, numbers, and spaces (no symbols)
    const validTagRegex = /^[a-zA-Z0-9\s]+$/;

    if (!trimmedTag) return;

    if (!validTagRegex.test(trimmedTag)) {
      toast.error('Tags can only contain letters, numbers, and spaces');
      return;
    }

    if (tags.includes(trimmedTag)) {
      toast.error('Tag already added');
      return;
    }

    if (tags.length >= 5) {
      toast.error('Maximum 5 tags allowed');
      return;
    }

    setTags([...tags, trimmedTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle thumbnail selection
  const handleThumbnailSelect = (index: number) => {
    const option = THUMBNAIL_OPTIONS[index];
    setSelectedThumbnail(index);

    if (option.type === 'upload') {
      // Trigger file input
      thumbnailInputRef.current?.click();
    } else if (option.type === 'frame') {
      // Capture current video frame
      handleCaptureFrame();
    } else {
      // Color or logo
      setThumbnailType(option.type);
      setThumbnailValue(option.value || '');
    }
  };

  // Handle thumbnail image upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Image too large. Maximum 5MB allowed.');
      return;
    }

    // Read file and create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedThumbnail(imageUrl);
      setThumbnailType('upload');
      setThumbnailValue(imageUrl);

      // Update selected option to upload
      const uploadIndex = THUMBNAIL_OPTIONS.findIndex(opt => opt.type === 'upload');
      if (uploadIndex >= 0) {
        setSelectedThumbnail(uploadIndex);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle capturing frame from video
  const handleCaptureFrame = () => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoUrl) {
      toast.error('Video not loaded. Please wait.');
      return;
    }

    try {
      // Create canvas and capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error('Failed to capture frame');
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedFrame(frameDataUrl);
      setThumbnailType('frame');
      setThumbnailValue(frameDataUrl);

      // Update selected option to frame
      const frameIndex = THUMBNAIL_OPTIONS.findIndex(opt => opt.type === 'frame');
      if (frameIndex >= 0) {
        setSelectedThumbnail(frameIndex);
      }

      toast.success('Frame captured successfully');
    } catch (error) {
      console.error('Failed to capture frame:', error);
      toast.error('Failed to capture frame');
    }
  };

  // Handle trim slider changes and update video position
  const handleTrimStartChange = (value: number) => {
    setTrimStart(value);
    const videoElement = videoRef.current;
    if (videoElement && videoElement.duration) {
      const startTime = (value / 100) * videoElement.duration;
      videoElement.currentTime = startTime;
    }
  };

  const handleTrimEndChange = (value: number) => {
    setTrimEnd(value);
    // Optionally jump to end position for preview
    const videoElement = videoRef.current;
    if (videoElement && videoElement.duration) {
      const endTime = (value / 100) * videoElement.duration;
      videoElement.currentTime = endTime;
    }
  };

  // Preview the trimmed section
  const handlePreviewTrim = () => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.duration) return;

    // Scroll to the video player smoothly
    videoElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Small delay to let scroll complete before playing
    setTimeout(() => {
      const startTime = (trimStart / 100) * videoElement.duration;
      videoElement.currentTime = startTime;
      videoElement.play();
    }, 300);
  };

  const handleSave = async () => {
    if (!video) return;

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        tags,
        showOnPublic,
        thumbnailColor: COVER_THUMBNAILS[selectedThumbnail], // Keep for backward compatibility
        thumbnailType,
        thumbnailValue,
        trimStart,
        trimEnd,
        // Auto-set status to VERIFIED and approval to approved when publishing
        ...(showOnPublic && {
          status: 'VERIFIED',
          approvalStatus: 'approved',
        }),
      };

      await updateVideo(video.id, updateData as any);

      toast.success(showOnPublic ? 'Video published successfully' : 'Video updated successfully');
      onClose();

      // Navigate to display page if publishing
      if (showOnPublic) {
        navigate('/learner/digital-portfolio/video');
      }
    } catch (error: any) {
      console.error('Failed to update video:', error);
      toast.error(error.message || 'Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const handlePublicToggle = (newState: boolean) => {
    if (newState && !showOnPublic) {
      // User wants to publish - show confirmation modal
      setPendingPublishState(true);
      setShowPublishModal(true);
    } else {
      // User wants to unpublish - no confirmation needed
      setShowOnPublic(false);
    }
  };

  const handleConfirmPublish = () => {
    setShowOnPublic(true);
    setShowPublishModal(false);
  };

  const handleCancelPublish = () => {
    setPendingPublishState(false);
    setShowPublishModal(false);
  };

  const handleDelete = async () => {
    if (!video) return;

    // Show confirmation modal instead of window.confirm
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!video) return;

    setShowDeleteModal(false);
    setDeleting(true);
    try {
      await deleteVideo(video.id);
      toast.success('Video deleted successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      toast.error(error.message || 'Failed to delete video');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleReplaceVideo = () => {
    replaceVideoInputRef.current?.click();
  };

  const handleReplaceVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !video) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Video file too large. Maximum 100MB allowed.');
      return;
    }

    if (!window.confirm('Replace this video? The current video will be deleted and replaced with the new one.')) {
      return;
    }

    setReplacing(true);
    try {
      // Generate new video ID
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Upload new video to R2
      const uploadResult = await storageApiService.uploadVideoPortfolio(
        file,
        videoId,
        userName
      );

      // Calculate duration for new video
      let duration: string | undefined;
      try {
        const videoDuration = await new Promise<string>((resolve, reject) => {
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          videoEl.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoEl.src);
            const dur = videoEl.duration;
            const minutes = Math.floor(dur / 60);
            const seconds = Math.floor(dur % 60);
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          };
          videoEl.onerror = () => {
            window.URL.revokeObjectURL(videoEl.src);
            reject(new Error('Failed to load video metadata'));
          };
          videoEl.src = URL.createObjectURL(file);
        });
        duration = videoDuration;
      } catch (err) {
        console.warn('Failed to calculate video duration:', err);
      }

      // Update video with new URL and metadata
      await updateVideo(video.id, {
        videoUrl: uploadResult.fileKey,
        duration: duration || video.duration,
        fileSizeBytes: uploadResult.fileSize,
        mimeType: file.type,
        trimStart: 0,
        trimEnd: 100,
      } as any);

      toast.success('Video replaced successfully');

      // Reload the video
      if (video.learnerId) {
        await fetchVideos(video.learnerId);
      }

      // Reload video in drawer
      loadVideo();
    } catch (error: any) {
      console.error('Failed to replace video:', error);
      toast.error(error.message || 'Failed to replace video');
    } finally {
      setReplacing(false);
      // Clear the file input
      if (replaceVideoInputRef.current) {
        replaceVideoInputRef.current.value = '';
      }
    }
  };

  if (!video) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - prevents scrolling and interaction with background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 overflow-hidden"
            style={{ touchAction: 'none' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit entry
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Video Preview */}
              <div>
                <div
                  className="w-full aspect-video rounded-lg flex items-center justify-center relative mb-4 overflow-hidden"
                  style={{
                    backgroundColor: thumbnailType === 'color' ? thumbnailValue : '#000',
                    backgroundImage: thumbnailType === 'upload' || thumbnailType === 'frame'
                      ? `url(${thumbnailValue})`
                      : thumbnailType === 'logo'
                        ? `url(/RMLogo.webp)`
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {loadingVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  ) : videoUrl ? (
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      crossOrigin="use-credentials"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Video loading error:', e);
                        toast.error('Failed to load video. Please try again.');
                      }}
                      onLoadedMetadata={() => {
                        console.log('Video metadata loaded successfully');
                      }}
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Panel wiring walkthrough"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2D3E5F] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Wiring a 12-circuit residential panel from rough-in to final inspection, narrated step by step."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2D3E5F] focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all"
                />
              </div>

              {/* Skill Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill tags
                </label>

                {/* Existing Tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded text-sm border border-amber-200 dark:border-amber-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Tag Input */}
                <div className="relative">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add a tag..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2D3E5F] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                  {tagInput.trim() && (
                    <button
                      onClick={handleAddTag}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Press Enter to add. Maximum 5 tags.
                </p>
              </div>

              {/* Trim Clip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trim clip
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                  {/* Video Timeline Visual */}
                  <div
                    className="relative h-16 rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: thumbnailType === 'color' ? thumbnailValue : '#000',
                      backgroundImage: thumbnailType === 'upload' || thumbnailType === 'frame'
                        ? `url(${thumbnailValue})`
                        : thumbnailType === 'logo'
                          ? `url(/RMLogo.webp)`
                          : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Trim Overlay */}
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/30 border-l-2 border-r-2 border-indigo-500"
                      style={{
                        left: `${trimStart}%`,
                        right: `${100 - trimEnd}%`,
                      }}
                    />
                  </div>

                  {/* Trim Start Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Trim Start
                      </label>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                        {trimStart}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, trimEnd - 5)}
                      value={trimStart}
                      onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Trim End Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Trim End
                      </label>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                        {trimEnd}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.min(100, trimStart + 5)}
                      max="100"
                      value={trimEnd}
                      onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Selected Duration Info */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Selected: <span className="font-medium text-indigo-600 dark:text-indigo-400">{trimEnd - trimStart}%</span> of video
                    </span>
                    <button
                      onClick={handlePreviewTrim}
                      disabled={loadingVideo || !videoUrl}
                      className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Preview Trim
                    </button>
                  </div>
                </div>
              </div>

              {/* Cover Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover thumbnail
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {THUMBNAIL_OPTIONS.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleThumbnailSelect(idx)}
                      className={`aspect-video rounded-lg transition-all relative overflow-hidden ${selectedThumbnail === idx
                        ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-gray-800'
                        : 'hover:opacity-80 border-2 border-gray-200 dark:border-gray-600'
                        }`}
                      style={{
                        backgroundColor: option.type === 'color' ? option.value || '#000' : '#f3f4f6',
                        backgroundImage:
                          option.type === 'logo'
                            ? `url(/RMLogo.webp)`
                            : option.type === 'upload' && uploadedThumbnail
                              ? `url(${uploadedThumbnail})`
                              : option.type === 'frame' && capturedFrame
                                ? `url(${capturedFrame})`
                                : 'none',
                        backgroundSize: option.type === 'logo' ? 'contain' : 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {/* Upload placeholder */}
                      {option.type === 'upload' && !uploadedThumbnail && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Upload</span>
                        </div>
                      )}

                      {/* Frame capture placeholder */}
                      {option.type === 'frame' && !capturedFrame && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Capture</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Choose a color, upload an image, use logo, or capture a frame from your video
                </p>
              </div>

              {/* Show on Public Portfolio */}
              <div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Show on public portfolio
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Visitors to your profile can view this entry
                    </p>
                  </div>
                  <button
                    onClick={() => handlePublicToggle(!showOnPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showOnPublic
                      ? 'bg-indigo-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOnPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {/* Save Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <button
                    onClick={handleSave}
                    disabled={saving || deleting || replacing}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 relative overflow-hidden group text-sm"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span className="hidden sm:inline">
                        {saving ? (showOnPublic ? 'Publishing...' : 'Saving...') : (showOnPublic ? 'Publish' : 'Save')}
                      </span>
                      <span className="sm:hidden">{saving ? '...' : (showOnPublic ? 'Publish' : 'Save')}</span>
                    </span>
                    {!saving && (
                      <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                    )}
                  </button>
                </motion.div>

                {/* Replace Video Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <button
                    onClick={handleReplaceVideo}
                    disabled={saving || deleting || replacing}
                    className="w-full py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
                  >
                    {replacing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Replacing...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Replace</span>
                      </>
                    )}
                  </button>
                </motion.div>

                {/* Delete Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleDelete}
                    disabled={saving || deleting || replacing}
                    className="px-4 py-2.5 border-2 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-sm"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Hidden Thumbnail Upload Input */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="hidden"
          />

          {/* Hidden Replace Video Input */}
          <input
            ref={replaceVideoInputRef}
            type="file"
            accept="video/*"
            onChange={handleReplaceVideoFile}
            className="hidden"
          />

          {/* Publish Confirmation Modal */}
          <AnimatePresence>
            {showPublishModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={handleCancelPublish}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Publish to public portfolio?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This video will be visible to anyone viewing your public portfolio. You can unpublish it anytime.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelPublish}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmPublish}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      Publish
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={handleCancelDelete}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Delete this video?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This action cannot be undone. The video will be permanently removed from your portfolio.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelDelete}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoEditDrawer;
