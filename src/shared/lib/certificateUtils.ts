import toast from 'react-hot-toast';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('certificateUtils');

/**
 * Get the viewable/downloadable URL for a certificate.
 * Converts direct R2 URLs to proxy URLs that work without public bucket access.
 * 
 * @param certificateUrl - The certificate URL (can be null)
 * @param mode - 'inline' for viewing in browser, 'download' for downloading
 * @returns Processed URL or null if input is null/empty
 */
export const getCertificateProxyUrl = (
  certificateUrl: string | null, 
  mode: 'inline' | 'download' = 'inline'
): string | null => {
  const STORAGE_API_URL = getApiUrl('storage');

  if (!certificateUrl) {
    return null;
  }

  // Data URLs work directly
  if (certificateUrl.startsWith('data:')) {
    return certificateUrl;
  }

  // Already a proxy URL - add/update mode parameter
  if (certificateUrl.includes('/course-certificate')) {
    try {
      // Determine if URL is absolute or relative
      let url: URL;
      
      if (certificateUrl.startsWith('http://') || certificateUrl.startsWith('https://')) {
        // Absolute URL
        url = new URL(certificateUrl);
      } else if (certificateUrl.startsWith('/')) {
        // Relative URL starting with /
        url = new URL(certificateUrl, window.location.origin);
      } else {
        // Relative URL without leading /
        url = new URL('/' + certificateUrl, window.location.origin);
      }
      
      url.searchParams.set('mode', mode);
      return url.toString();
    } catch (error: unknown) {
      // If URL parsing fails, manually append mode parameter
      const separator = certificateUrl.includes('?') ? '&' : '?';
      return `${certificateUrl}${separator}mode=${mode}`;
    }
  }

  // Convert R2 URL to proxy URL
  if (certificateUrl.includes('.r2.dev/') || certificateUrl.includes('r2.cloudflarestorage.com')) {
    return `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}&mode=${mode}`;
  }

  // For other URLs, try proxy
  return `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}&mode=${mode}`;
};

/**
 * Download a certificate file to the user's device.
 */
export const downloadCertificate = async (certificateUrl: string, courseName: string): Promise<void> => {
    const STORAGE_API_URL = getApiUrl('storage');

    if (certificateUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = certificateUrl;
        link.download = `${courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }

    let downloadUrl = certificateUrl;
    if (!certificateUrl.includes('/course-certificate')) {
        downloadUrl = `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}`;
    }

    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

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
          // fix: Popup was blocked - cleanup immediately and return
          URL.revokeObjectURL(blobUrl);
          toast.error('Please allow popups for this site to view the certificate.');
          logger.warn('Certificate popup blocked by browser', { urlType: 'data-url-blob' });
          return;
        }
        
        // fix: Popup succeeded - schedule cleanup after browser has loaded the content
        // Keep reference for cleanup
        const urlToRevoke = blobUrl;
        setTimeout(() => {
          URL.revokeObjectURL(urlToRevoke);
        }, 5000);
        return;
        
      } catch (blobError) {
        // fix: Clean up blob URL if it was created before error
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        logger.error('Error converting data URL to blob', blobError instanceof Error ? blobError : new Error(String(blobError)));
        toast.error('Error displaying certificate. Please try downloading instead.');
        return;
      }
    }
    
    // For non-data URLs, use the proxy URL
    const viewUrl = getCertificateProxyUrl(certUrl, 'inline');
    
    if (!viewUrl || viewUrl.trim() === '') {
      toast.error('Failed to generate certificate viewing URL. Please try downloading instead.');
      logger.error('Invalid proxy URL generated', new Error('Empty or invalid proxy URL'));
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
