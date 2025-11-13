import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Video, X, Play, Pause, Trash2, Download, CheckCircle, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoFile {
  id: string;
  file: File;
  url: string;
  title: string;
  description: string;
  uploadDate: Date;
}

const VideoPortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDescription, setNewVideoDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadingFile(file);
      setShowUploadForm(true);
      setNewVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
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
      setUploadingFile(file);
      setShowUploadForm(true);
      setNewVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadVideo = () => {
    if (!uploadingFile) return;

    const newVideo: VideoFile = {
      id: Date.now().toString(),
      file: uploadingFile,
      url: URL.createObjectURL(uploadingFile),
      title: newVideoTitle || uploadingFile.name,
      description: newVideoDescription,
      uploadDate: new Date(),
    };

    setVideos([...videos, newVideo]);
    setUploadingFile(null);
    setNewVideoTitle('');
    setNewVideoDescription('');
    setShowUploadForm(false);
  };

  const handleDeleteVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
    if (selectedVideo?.id === id) {
      setSelectedVideo(null);
    }
  };

  const togglePlayPause = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
      } else {
        videoPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownloadVideo = (video: VideoFile) => {
    const a = document.createElement('a');
    a.href = video.url;
    a.download = video.title + '.mp4';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">
      {/* Fixed Header - Similar to Portfolio Mode */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Portfolio</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFullscreen}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-all hover:scale-105"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video Player Section */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-300">
                {selectedVideo ? (
                  <div>
                    <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                      <video
                        ref={videoPlayerRef}
                        src={selectedVideo.url}
                        className="w-full aspect-video"
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedVideo.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                          {selectedVideo.description || 'No description provided'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Uploaded: {selectedVideo.uploadDate.toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadVideo(selectedVideo)}
                            className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(selectedVideo.id)}
                            className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                    <Video className="w-24 h-24 mb-4" />
                    <p className="text-xl font-medium mb-2">No video selected</p>
                    <p className="text-sm">Upload or select a video to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video List Section */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Your Videos ({videos.length})
                </h3>
                
                {videos.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      No videos uploaded yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Drag & drop or click upload
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {videos.map((video) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedVideo?.id === video.id
                            ? 'bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-500'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="flex items-start space-x-3">
                          <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {video.description || 'No description'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {video.uploadDate.toLocaleDateString()}
                            </p>
                          </div>
                          {selectedVideo?.id === video.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Upload Form Modal - Centered */}
      <AnimatePresence>
        {showUploadForm && uploadingFile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowUploadForm(false);
                setUploadingFile(null);
                setNewVideoTitle('');
                setNewVideoDescription('');
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl pointer-events-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Upload Video
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadingFile(null);
                      setNewVideoTitle('');
                      setNewVideoDescription('');
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  {/* Video Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Video Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Enter video title"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newVideoDescription}
                      onChange={(e) => setNewVideoDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-all"
                      rows={4}
                      placeholder="Add a description for your video"
                    />
                  </div>

                  {/* File Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <Video className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          Selected File
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {uploadingFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Size: {(uploadingFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      setUploadingFile(null);
                      setNewVideoTitle('');
                      setNewVideoDescription('');
                    }}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadVideo}
                    disabled={!newVideoTitle.trim()}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                      newVideoTitle.trim()
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Video</span>
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPortfolioPage;
