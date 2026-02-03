/**
 * Storage Service for handling file uploads to Cloudflare R2
 * 
 * @deprecated This service is a legacy duplicate of storageApiService.ts
 * Please use storageApiService.ts instead for all new code.
 * This file is kept for backward compatibility only.
 */

import { getPagesApiUrl } from '../utils/pagesUrl';

interface UploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

interface PresignedResponse {
  success: boolean;
  data?: {
    uploadUrl: string;
    fileKey: string;
    headers: Record<string, string>;
  };
  error?: string;
}

interface ConfirmResponse {
  success: boolean;
  data?: {
    key: string;
    url: string;
    name?: string;
    size?: number;
    type?: string;
  };
  error?: string;
}

class StorageService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getPagesApiUrl('storage');
  }

  /**
   * Upload a file directly to R2 storage
   */
  async uploadFile(file: File, filename?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', filename || file.name);

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload teacher document with organized folder structure
   */
  async uploadTeacherDocument(file: File, teacherId: string, documentType: string = 'general'): Promise<UploadResponse> {
    try {
      // Create organized filename with timestamp
      const timestamp = Date.now();
      const extension = file.name.substring(file.name.lastIndexOf('.'));
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `teachers/${teacherId}/documents/${documentType}/${timestamp}_${sanitizedName}`;

      return await this.uploadFile(file, filename);
    } catch (error) {
      console.error('Teacher document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document upload failed'
      };
    }
  }

  /**
   * Upload multiple teacher documents
   */
  async uploadTeacherDocuments(files: File[], teacherId: string, documentType: string = 'general'): Promise<{
    success: boolean;
    results: Array<{
      file: string;
      success: boolean;
      url?: string;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.uploadTeacherDocument(file, teacherId, documentType);
        results.push({
          file: file.name,
          success: result.success,
          url: result.url,
          error: result.error
        });
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      results
    };
  }
  async uploadStudentDocument(file: File, studentId: string, documentType: string = 'general'): Promise<UploadResponse> {
    try {
      // Create organized filename with timestamp
      const timestamp = Date.now();
      const extension = file.name.substring(file.name.lastIndexOf('.'));
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `students/${studentId}/documents/${documentType}/${timestamp}_${sanitizedName}`;

      return await this.uploadFile(file, filename);
    } catch (error) {
      console.error('Student document upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document upload failed'
      };
    }
  }

  /**
   * Upload multiple student documents
   */
  async uploadStudentDocuments(files: File[], studentId: string): Promise<{
    success: boolean;
    results: Array<{
      file: string;
      success: boolean;
      url?: string;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.uploadStudentDocument(file, studentId);
        results.push({
          file: file.name,
          success: result.success,
          url: result.url,
          error: result.error
        });
      } catch (error) {
        results.push({
          file: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      results
    };
  }

  /**
   * Get presigned URL for large file uploads
   */
  async getPresignedUrl(filename: string, contentType: string, studentId: string): Promise<PresignedResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/presigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          contentType,
          courseId: 'students',
          lessonId: studentId,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Presigned URL error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get presigned URL'
      };
    }
  }

  /**
   * Confirm upload after using presigned URL
   */
  async confirmUpload(fileKey: string, fileName?: string, fileSize?: number, fileType?: string): Promise<ConfirmResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileKey,
          fileName,
          fileSize,
          fileType,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Confirm upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm upload'
      };
    }
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Get file URL from file key
   */
  async getFileUrl(fileKey: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/get-file-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileKey }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get file URL error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file URL'
      };
    }
  }

  /**
   * Get signed URL for viewing a document (temporary access)
   */
  async getSignedUrl(url: string, expiresIn: number = 3600): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          expiresIn // seconds
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get signed URL error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get signed URL'
      };
    }
  }
}

export const storageService = new StorageService();
export default storageService;