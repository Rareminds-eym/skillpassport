import toast from 'react-hot-toast';
import { getCertificateProxyUrl } from '@/shared/lib/utils/certificate-utils';
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
        
        // Attempt to open in new window with proper cleanup
        const newWindow = window.open(blobUrl, '_blank');
        
        if (!newWindow) {
          // Popup was blocked - cleanup immediately
          toast.error('Please allow popups for this site to view the certificate.');
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
          logger.warn('Certificate popup blocked by browser', { urlType: 'data-url-blob' });
          return;
        }
        
        // Popup succeeded - schedule cleanup after browser has loaded the content
        setTimeout(() => {
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
        }, 5000);
        blobUrl = null; // Clear reference to prevent double cleanup in finally block
        return;
        
      } catch (blobError) {
        logger.error('Error converting data URL to blob', blobError instanceof Error ? blobError : new Error(String(blobError)));
        toast.error('Error displaying certificate. Please try downloading instead.');
        return;
      } finally {
        // Safety net: ensure blob URL is always cleaned up if not already handled
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      }
    }
    
    // For non-data URLs, use the proxy URL
    const viewUrl = getCertificateProxyUrl(certUrl, 'inline');
    
    if (!viewUrl || viewUrl.trim() === '') {
      toast.error('Failed to generate certificate viewing URL. Please try downloading instead.');
      logger.error('Invalid proxy URL generated', { originalUrl: certUrl });
      return;
    }
    
    // Attempt to open proxy URL in new window
    const newWindow = window.open(viewUrl, '_blank');
    
    if (!newWindow) {
      // Popup was blocked - provide user feedback
      toast.error('Please allow popups for this site to view the certificate.');
      logger.warn('Certificate popup blocked by browser', { urlType: 'proxy-url' });
      return;
    }
    
    // Popup succeeded - no cleanup needed for regular URLs
    logger.info('Certificate opened successfully', { urlType: 'proxy-url' });
    
  } catch (error) {
    logger.error('Error opening certificate', error instanceof Error ? error : new Error(String(error)));
    toast.error('Error opening certificate. Please try downloading instead.');
  }
};
