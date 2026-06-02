import toast from 'react-hot-toast';
import { getCertificateProxyUrl } from '@/features/digital-portfolio';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('certificateUtils');

/**
 * View a certificate in a new window
 * Handles both data URLs and regular URLs
 * 
 * @param certUrl - Certificate URL (data URL or regular URL)
 */
export const viewCertificate = (certUrl: string): void => {
  if (!certUrl) {
    toast.error('Certificate URL not found');
    return;
  }

  try {
    // Special handling for data URLs
    if (certUrl.startsWith('data:')) {
      let blobUrl: string | null = null;
      
      try {
        const arr = certUrl.split(',');
        
        if (arr.length < 2) {
          throw new Error('Invalid data URL: missing base64 content');
        }
        
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch || !mimeMatch[1]) {
          throw new Error('Invalid data URL format: missing MIME type');
        }
        const mime = mimeMatch[1];
        
        let bstr: string;
        try {
          bstr = atob(arr[1]);
        } catch (decodeError) {
          throw new Error('Invalid base64 encoding in data URL');
        }
        
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow) {
          toast.error('Please allow popups for this site to view the certificate.');
          // Cleanup immediately if popup was blocked
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
        } else {
          // Cleanup after a delay if popup succeeded
          setTimeout(() => {
            if (blobUrl) {
              URL.revokeObjectURL(blobUrl);
            }
          }, 5000);
          blobUrl = null; // Clear reference so finally block doesn't double-revoke
        }
        
        return;
      } catch (blobError) {
        logger.error('Error converting data URL to blob', blobError instanceof Error ? blobError : new Error(String(blobError)));
        toast.error('Error displaying certificate. Please try downloading instead.');
        return;
      } finally {
        // Ensure blob URL is always cleaned up if not already handled
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      }
    }
    
    // For non-data URLs, use the proxy URL
    const viewUrl = getCertificateProxyUrl(certUrl, 'inline');
    
    if (!viewUrl || viewUrl.trim() === '') {
      toast.error('Failed to generate certificate viewing URL. Please try downloading instead.');
      return;
    }
    
    const newWindow = window.open(viewUrl, '_blank');
    
    if (!newWindow) {
      toast.error('Please allow popups for this site to view the certificate.');
    }
  } catch (error) {
    logger.error('Error opening certificate', error instanceof Error ? error : new Error(String(error)));
    toast.error('Error opening certificate. Please try downloading instead.');
  }
};
