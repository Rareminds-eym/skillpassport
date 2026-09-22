import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Tag, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useVideoPortfolioStore,
  type VideoEntry,
} from '@/features/digital-portfolio';
import { getVideoPortfolioUrl } from '@/shared/api/storageApiService';
import { ssoClient } from '@/shared/api/ssoClient';

interface VideoEditDrawerProps {
  isOpen: boolean;
  video: VideoEntry | null;
  onClose: () => void;
}

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
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [pendingPublishState, setPendingPublishState] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Store actions
  const updateVideo = useVideoPortfolioStore(state => state.updateVideo);
  const deleteVideo = useVideoPortfolioStore(state => state.deleteVideo);

  // Initialize form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setTags(video.tags || []);
      setShowOnPublic(video.showOnPublic);
      setSelectedThumbnail(COVER_THUMBNAILS.indexOf(video.thumbnailColor || '#2D3E5F'));
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
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      if (tags.length >= 5) {
        toast.error('Maximum 5 tags allowed');
        return;
      }
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
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
      await updateVideo(video.id, {
        title: title.trim(),
        description: description.trim(),
        tags,
        showOnPublic,
        thumbnailColor: COVER_THUMBNAILS[selectedThumbnail],
        trimStart,
        trimEnd,
        // Auto-set status to VERIFIED and approval to approved when publishing
        ...(showOnPublic && {
          status: 'VERIFIED',
          approvalStatus: 'approved',
        }),
      });

      toast.success('Video updated successfully');
      onClose();
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

    // Show confirmation
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

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

  if (!video) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
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
                  style={{ backgroundColor: COVER_THUMBNAILS[selectedThumbnail] }}
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
                  <div className="relative h-16 rounded-lg overflow-hidden" style={{ backgroundColor: COVER_THUMBNAILS[selectedThumbnail] }}>
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
                  {COVER_THUMBNAILS.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedThumbnail(idx)}
                      className={`aspect-video rounded-lg transition-all ${selectedThumbnail === idx
                        ? 'ring-2 ring-[#2D3E5F] ring-offset-2 dark:ring-offset-gray-800'
                        : 'hover:opacity-80'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <button
                    onClick={handleSave}
                    disabled={saving || deleting}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {saving ? 'Saving...' : 'Save changes'}
                    </span>
                    {!saving && (
                      <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                    )}
                  </button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleDelete}
                    disabled={saving || deleting}
                    className="px-6 py-3 border-2 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>

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
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoEditDrawer;
