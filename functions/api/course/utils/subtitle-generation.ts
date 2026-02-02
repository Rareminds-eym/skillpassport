/**
 * Subtitle Generation Utilities
 * 
 * Functions for generating SRT and VTT subtitle formats from transcript segments
 */

import type { TranscriptSegment } from '../types/video';

/**
 * Format seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds to VTT time format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Generate SRT subtitle format from transcript segments
 */
export function generateSRT(segments: TranscriptSegment[]): string {
  return segments.map((seg, i) => {
    const startTime = formatSRTTime(seg.start);
    const endTime = formatSRTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
}

/**
 * Generate VTT subtitle format from transcript segments
 */
export function generateVTT(segments: TranscriptSegment[]): string {
  const header = 'WEBVTT\n\n';
  const cues = segments.map((seg, i) => {
    const startTime = formatVTTTime(seg.start);
    const endTime = formatVTTTime(seg.end);
    return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
  }).join('\n');
  return header + cues;
}

/**
 * Get content type from URL extension
 */
export function getContentType(url: string): string {
  const urlPath = url.split('?')[0];
  const ext = urlPath.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'wma': 'audio/x-ms-wma',
    'webm': 'audio/webm',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
  };
  return mimeTypes[ext] || 'audio/mpeg';
}
