import { getApiUrl } from '@/shared/api/apiUtils';

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
