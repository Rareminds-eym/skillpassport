// Upload context types
export type UploadContext = 
  | 'assignment'
  | 'course_video'
  | 'course_resource'
  | 'document'
  | 'certificate'
  | 'resume'
  | 'message_attachment'
  | 'profile_photo';

// Configuration structure
export interface FileSizeConfig {
  maxSize: number;        // in bytes
  displaySize: string;    // human-readable (e.g., "10 MB")
  description: string;    // context description
}

export interface FileSizeLimits {
  [key: string]: FileSizeConfig;
  default: FileSizeConfig;
}

// Configuration object
export const FILE_SIZE_LIMITS: FileSizeLimits = {
  assignment: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    displaySize: '10 MB',
    description: 'Assignment files'
  },
  course_video: {
    maxSize: 100 * 1024 * 1024,  // 100MB
    displaySize: '100 MB',
    description: 'Course videos'
  },
  course_resource: {
    maxSize: 100 * 1024 * 1024,  // 100MB
    displaySize: '100 MB',
    description: 'Course resources and materials'
  },
  document: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    displaySize: '10 MB',
    description: 'General documents'
  },
  certificate: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    displaySize: '10 MB',
    description: 'Certificates and credentials'
  },
  resume: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    displaySize: '5 MB',
    description: 'Resume files for parsing'
  },
  message_attachment: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    displaySize: '5 MB',
    description: 'Message attachments'
  },
  profile_photo: {
    maxSize: 5 * 1024 * 1024,  // 5MB
    displaySize: '5 MB',
    description: 'Profile photos'
  },
  default: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    displaySize: '10 MB',
    description: 'Default file size limit'
  }
};

// Helper functions
export function getFileSizeLimit(context: UploadContext | string): FileSizeConfig {
  return FILE_SIZE_LIMITS[context] || FILE_SIZE_LIMITS.default;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateFileSizeConfig(): void {
  const errors: string[] = [];
  
  Object.entries(FILE_SIZE_LIMITS).forEach(([context, config]) => {
    if (config.maxSize <= 0) {
      errors.push(`Invalid size for ${context}: ${config.maxSize} (must be positive)`);
    }
    if (config.maxSize > 1024 * 1024 * 1024) {  // 1GB
      errors.push(`Size for ${context} exceeds maximum: ${config.maxSize} (max 1GB)`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`File size configuration validation failed:\n${errors.join('\n')}`);
  }
}
