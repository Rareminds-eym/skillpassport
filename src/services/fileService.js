/**
 * File Service for fetching course videos and resources from R2
 * Uses Cloudflare Worker (preferred) or Supabase Edge Function as fallback
 */

import { getFileUrl as getFileUrlFromApi } from './courseApiService';

// Get the API URL from environment variables
const FILE_SERVER_URL =
  import.meta.env.VITE_FILE_SERVER_URL ||
  import.meta.env.VITE_EXTERNAL_API_KEY ||
  'http://localhost:3001';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class FileService {
  /**
   * Get presigned URL for a file using Course API (Cloudflare Worker or Supabase)
   * @param {string} fileKey - The R2 file key
   * @returns {Promise<string>} - Presigned URL
   */
  async getFileUrlFromApi(fileKey) {
    console.log('Calling Course API get-file-url with key:', fileKey);

    try {
      const url = await getFileUrlFromApi(fileKey);
      console.log('Course API returned URL successfully');
      return url;
    } catch (error) {
      console.error('Course API error:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for a file from local server
   * @param {string} fileKey - The R2 file key
   * @returns {Promise<string>} - Presigned URL
   */
  async getFileUrlFromServer(fileKey) {
    const response = await fetch(`${FILE_SERVER_URL}/api/file/${fileKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Get presigned URL for a file
   * Uses Course API (Cloudflare Worker) only
   * @param {string} fileKey - The R2 file key (e.g., "courses/ABC123/lessons/L1/video.mp4")
   * @returns {Promise<string>} - Presigned URL valid for 7 days
   */
  async getFileUrl(fileKey) {
    // Use Course API only (Cloudflare Worker)
    try {
      return await this.getFileUrlFromApi(fileKey);
    } catch (apiError) {
      console.error('Course API failed:', apiError.message);
      throw new Error(
        'Unable to generate file URL. Please ensure R2 credentials are configured in the Course API worker.'
      );
    }
  }

  /**
   * Get all files for a specific lesson
   * @param {string} courseId - Course ID
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Array>} - Array of file objects with URLs
   */
  async getLessonFiles(courseId, lessonId) {
    try {
      const response = await fetch(`${FILE_SERVER_URL}/api/files/${courseId}/${lessonId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson files: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching lesson files:', error);
      return [];
    }
  }

  /**
   * Get all files for a course
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} - Array of file objects with URLs
   */
  async getCourseFiles(courseId) {
    try {
      const response = await fetch(`${FILE_SERVER_URL}/api/files/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course files: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching course files:', error);
      return [];
    }
  }

  /**
   * Extract video files from a list of files
   * @param {Array} files - Array of file objects
   * @returns {Array} - Filtered array of video files
   */
  getVideoFiles(files) {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return files.filter((file) => {
      const key = file.key.toLowerCase();
      return videoExtensions.some((ext) => key.endsWith(ext));
    });
  }

  /**
   * Extract document/resource files from a list of files
   * @param {Array} files - Array of file objects
   * @returns {Array} - Filtered array of document files
   */
  getResourceFiles(files) {
    const resourceExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
    return files.filter((file) => {
      const key = file.key.toLowerCase();
      return resourceExtensions.some((ext) => key.endsWith(ext));
    });
  }

  /**
   * Get file name from key
   * @param {string} fileKey - R2 file key
   * @returns {string} - File name
   */
  getFileName(fileKey) {
    return fileKey.split('/').pop();
  }
}

export const fileService = new FileService();
export default fileService;
