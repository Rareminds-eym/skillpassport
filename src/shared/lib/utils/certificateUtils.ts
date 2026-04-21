import { getPagesApiUrl } from '@/shared/lib/pagesUrl';

/**
 * Get the viewable/downloadable URL for a certificate.
 * Converts direct R2 URLs to proxy URLs that work without public bucket access.
 */
export const getCertificateProxyUrl = (certificateUrl: string, mode: 'inline' | 'download' = 'inline'): string | null => {
    const STORAGE_API_URL = getPagesApiUrl('storage');

    if (!certificateUrl) return null;

    if (certificateUrl.startsWith('data:')) return certificateUrl;

    if (certificateUrl.includes('/course-certificate')) {
        const url = new URL(certificateUrl);
        url.searchParams.set('mode', mode);
        return url.toString();
    }

    return `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}&mode=${mode}`;
};

/**
 * Download a certificate file to the user's device.
 */
export const downloadCertificate = async (certificateUrl: string, courseName: string): Promise<void> => {
    const STORAGE_API_URL = getPagesApiUrl('storage');

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
