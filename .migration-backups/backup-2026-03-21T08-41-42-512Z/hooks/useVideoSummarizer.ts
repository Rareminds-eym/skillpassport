import { useCallback, useEffect, useState } from 'react';
import {
    VideoSummary,
    checkProcessingStatus,
    getVideoSummaryRobust,
    processVideo
} from '../services/videoSummarizerService';

interface UseVideoSummarizerOptions {
  videoUrl?: string;
  lessonId?: string;
  courseId?: string;
  autoProcess?: boolean;
}

interface UseVideoSummarizerReturn {
  summary: VideoSummary | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  processingProgress: number;
  processVideo: () => Promise<void>;
  refreshSummary: () => Promise<void>;
}

export function useVideoSummarizer(options: UseVideoSummarizerOptions): UseVideoSummarizerReturn {
  const { videoUrl, lessonId, courseId, autoProcess = false } = options;

  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Load existing summary
  const loadExistingSummary = useCallback(async () => {
    if (!videoUrl && !lessonId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use robust video summary lookup with fallback strategies
      const existingSummary = await getVideoSummaryRobust(lessonId, videoUrl);

      if (existingSummary) {
        setSummary(existingSummary);
        
        // Check if still processing
        if (existingSummary.processingStatus === 'processing') {
          setIsProcessing(true);
          pollProcessingStatus(existingSummary.id);
        }
      } else if (autoProcess && videoUrl) {
        // Auto-process if no existing summary
        await startProcessing();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [videoUrl, lessonId, autoProcess]);

  // Poll for processing status
  const pollProcessingStatus = useCallback(async (summaryId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { status, summary: updatedSummary } = await checkProcessingStatus(summaryId);

        if (status === 'completed' && updatedSummary) {
          setSummary(updatedSummary);
          setIsProcessing(false);
          setProcessingProgress(100);
          clearInterval(pollInterval);
        } else if (status === 'failed') {
          setError('Video processing failed');
          setIsProcessing(false);
          clearInterval(pollInterval);
        } else {
          // Simulate progress
          setProcessingProgress(prev => Math.min(prev + 5, 90));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isProcessing) {
        setError('Processing timeout');
        setIsProcessing(false);
      }
    }, 600000);

    return () => clearInterval(pollInterval);
  }, [isProcessing]);

  // Start processing video
  const startProcessing = useCallback(async () => {
    if (!videoUrl) {
      setError('Video URL is required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(10);

    try {
      const result = await processVideo({
        videoUrl,
        lessonId,
        courseId,
        language: 'en'
      });

      if (result.processingStatus === 'completed') {
        setSummary(result);
        setProcessingProgress(100);
        setIsProcessing(false);
      } else if (result.processingStatus === 'processing') {
        // Start polling
        pollProcessingStatus(result.id);
      } else if (result.processingStatus === 'failed') {
        setError(result.errorMessage || 'Processing failed');
        setIsProcessing(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setIsProcessing(false);
    }
  }, [videoUrl, lessonId, courseId, pollProcessingStatus]);

  // Refresh summary
  const refreshSummary = useCallback(async () => {
    setSummary(null);
    await loadExistingSummary();
  }, [loadExistingSummary]);

  // Load on mount
  useEffect(() => {
    loadExistingSummary();
  }, [loadExistingSummary]);

  return {
    summary,
    isLoading,
    isProcessing,
    error,
    processingProgress,
    processVideo: startProcessing,
    refreshSummary
  };
}

export default useVideoSummarizer;
