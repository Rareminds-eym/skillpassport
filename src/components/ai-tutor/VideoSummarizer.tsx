import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Sparkles,
  BookOpen,
  List,
  FileText,
  Clock,
  Tag,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Brain,
  Send
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  VideoSummary,
  TranscriptSegment,
  processVideo,
  getVideoSummaryByUrl,
  formatTimestamp,
  findSegmentAtTime
} from '../../services/videoSummarizerService';
import { useTutorChat } from '../../hooks/useTutorChat';

interface VideoSummarizerProps {
  videoUrl: string;
  lessonId?: string;
  courseId?: string;
  lessonTitle?: string;
}

type TabType = 'summary' | 'transcript' | 'chapters' | 'chat';

const VideoSummarizer: React.FC<VideoSummarizerProps> = ({
  videoUrl,
  lessonId,
  courseId,
  lessonTitle = 'Lesson'
}) => {
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Summary state
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [activeSegment, setActiveSegment] = useState<TranscriptSegment | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    sendMessage,
  } = useTutorChat({
    courseId: courseId || '',
    lessonId
  });

  // Load existing summary or process video
  useEffect(() => {
    loadOrProcessVideo();
  }, [videoUrl]);

  const loadOrProcessVideo = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Check for existing summary
      const existing = await getVideoSummaryByUrl(videoUrl);
      if (existing && existing.processingStatus === 'completed') {
        setSummary(existing);
        setIsProcessing(false);
        return;
      }

      // Process new video
      const result = await processVideo({
        videoUrl,
        lessonId,
        courseId,
        language: 'en'
      });

      setSummary(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Update active transcript segment
      if (summary?.transcriptSegments) {
        const segment = findSegmentAtTime(summary.transcriptSegments, videoRef.current.currentTime);
        setActiveSegment(segment);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      seekTo(newTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const container = document.getElementById('video-container');
    if (container) {
      if (!isFullscreen) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Chat with video context
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    // Include video context in the message
    const videoContext = summary ? `
[Video Context: Currently at ${formatTimestamp(currentTime)} in "${lessonTitle}"]
${activeSegment ? `Current segment: "${activeSegment.text}"` : ''}
` : '';

    const messageWithContext = `${chatInput}\n\n${videoContext}`;
    setChatInput('');
    await sendMessage(messageWithContext);
  };

  // Auto-scroll chat
  useEffect(() => {
    chatMessagesRef.current?.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  const renderProgressBar = () => (
    <div className="relative w-full h-1 bg-gray-700 rounded cursor-pointer group"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seekTo(percent * duration);
      }}
    >
      <div
        className="absolute h-full bg-violet-500 rounded"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />
      <div
        className="absolute w-3 h-3 bg-white rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }}
      />
    </div>
  );


  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Video Player Section */}
      <div className="lg:w-2/3 flex flex-col">
        {/* Video Container */}
        <div id="video-container" className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            {renderProgressBar()}

            {/* Controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => skip(-10)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => skip(10)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <span className="text-white text-sm ml-2">
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
              <p className="text-white font-medium">Analyzing video content...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a few minutes</p>
            </div>
          )}
        </div>

        {/* Active Transcript Segment */}
        {activeSegment && (
          <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
            <p className="text-gray-300 text-sm">
              <span className="text-violet-400 font-mono mr-2">
                [{formatTimestamp(activeSegment.start)}]
              </span>
              {activeSegment.text}
            </p>
          </div>
        )}
      </div>

      {/* Summary Panel */}
      <div className="lg:w-1/3 flex flex-col bg-white border-l border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'summary', icon: Sparkles, label: 'Summary' },
            { id: 'transcript', icon: FileText, label: 'Transcript' },
            { id: 'chapters', icon: List, label: 'Chapters' },
            { id: 'chat', icon: Brain, label: 'AI Chat' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-2">Processing Failed</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={loadOrProcessVideo}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : isProcessing ? (
            <div className="p-6 text-center">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Generating AI summary...</p>
            </div>
          ) : (
            <>
              {/* Summary Tab */}
              {activeTab === 'summary' && summary && (
                <div className="p-4 space-y-6">
                  {/* Key Points */}
                  {summary.keyPoints.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                        <BookOpen className="w-4 h-4 text-violet-500" />
                        Key Points
                      </h3>
                      <ul className="space-y-2">
                        {summary.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <ChevronRight className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Summary */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      AI Summary
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {summary.summary || 'No summary available'}
                    </p>
                  </div>

                  {/* Topics */}
                  {summary.topics.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                        <Tag className="w-4 h-4 text-violet-500" />
                        Topics Covered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {summary.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript Tab */}
              {activeTab === 'transcript' && summary && (
                <div className="p-4">
                  <div className="space-y-2">
                    {summary.transcriptSegments.length > 0 ? (
                      summary.transcriptSegments.map((segment, i) => (
                        <button
                          key={i}
                          onClick={() => seekTo(segment.start)}
                          className={`w-full text-left p-2 rounded-lg transition-colors ${
                            activeSegment?.start === segment.start
                              ? 'bg-violet-100 border border-violet-300'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-violet-600 font-mono text-xs">
                            {formatTimestamp(segment.start)}
                          </span>
                          <p className="text-gray-700 text-sm mt-1">{segment.text}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No transcript available
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Chapters Tab */}
              {activeTab === 'chapters' && summary && (
                <div className="p-4">
                  <div className="space-y-3">
                    {summary.chapters.length > 0 ? (
                      summary.chapters.map((chapter, i) => (
                        <button
                          key={i}
                          onClick={() => seekTo(chapter.timestamp)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-violet-500" />
                            <span className="text-violet-600 font-mono text-sm">
                              {formatTimestamp(chapter.timestamp)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-800 text-sm">{chapter.title}</h4>
                          <p className="text-gray-500 text-xs mt-1">{chapter.summary}</p>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-8">
                        No chapters detected
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* Chat Messages */}
                  <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="w-10 h-10 text-violet-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Ask about this video</p>
                        <p className="text-gray-400 text-sm mt-1">
                          I can answer questions about the content
                        </p>
                        
                        {/* Quick Questions */}
                        <div className="mt-4 space-y-2">
                          {[
                            'Summarize the main points',
                            'What are the key takeaways?',
                            'Explain this concept in simple terms'
                          ].map((q, i) => (
                            <button
                              key={i}
                              onClick={() => setChatInput(q)}
                              className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-violet-50 rounded-lg transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                              msg.role === 'user'
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {msg.role === 'user' ? (
                              msg.content
                            ) : (
                              <div className="prose prose-sm max-w-none text-sm leading-normal [&>p]:mb-1 [&>p:last-child]:mb-0 [&>p]:text-sm [&>p]:leading-normal [&_strong]:font-semibold [&_strong]:text-gray-900">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {isStreaming && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-3 py-2 rounded-xl">
                          <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="p-3 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about this video..."
                        disabled={isStreaming}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isStreaming}
                        className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-300 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSummarizer;
