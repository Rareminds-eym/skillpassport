/**
 * Centralized error handling utilities
 */

export const getAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
    return 'Authentication failed. Please refresh the page and try logging in again.';
  }
  
  return errorMessage;
};

export const getStorageErrorMessage = (error: any): string => {
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes('Storage service')) {
    return 'File storage service is not available. Please try again later or contact support.';
  }
  
  if (errorMessage.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return errorMessage;
};

export const getUploadErrorMessage = (error: any): string => {
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes('Authentication') || errorMessage.includes('401')) {
    return 'Authentication failed. Please refresh the page and try logging in again.';
  }
  
  if (errorMessage.includes('Storage service')) {
    return 'File storage service is not available. Please try again later or contact support.';
  }
  
  if (errorMessage.includes('Network')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return errorMessage;
};
