/**
 * Certificate Generation Service
 * Generates course completion certificates using Cloudflare R2 storage
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('certificate-service');

const STORAGE_API_URL = getApiUrl('storage');

const generateCredentialId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
};

// Helper function to load images - moved to module level to avoid closure overhead
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const generateCertificateImage = async (
  learnerName: string,
  courseName: string,
  completionDate: string,
  credentialId: string,
  learnerIdText: string | null,
  courseType: 'course' | 'webinar' = 'course'
): Promise<string> => {
  // Determine text based on course type
  const isWebinar = courseType === 'webinar';
  const certificateSubtitle = isWebinar ? 'OF PARTICIPATION' : 'OF COMPLETION';
  const achievementText = isWebinar ? 'has actively participated in the webinar session' : 'has successfully completed the course';
  const dateLabel = isWebinar ? 'Conducted on' : 'Completed on';

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 850);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 850);

  // Borders
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 1140, 790);
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, 1100, 750);

  // Corner decorations
  ctx.fillStyle = '#3b82f6';
  [[30, 30], [1130, 30], [30, 780], [1130, 780]].forEach(([x, y]) => {
    ctx.fillRect(x, y, 40, 8);
    ctx.fillRect(x, y, 8, 40);
  });

  // Load and draw RareMinds logo at top left
  try {
    const logo = await loadImage('/RareMinds ISO Logo-01.png');
    // Position logo at top left with some padding from borders
    const logoWidth = 120;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = 70; // 70px from left edge (inside the border)
    const logoY = 70; // 70px from top edge (inside the border)
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    logger.error('Failed to load RareMinds logo:', error instanceof Error ? error : new Error(String(error)));
    // Continue without logo if it fails to load
  }

  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('CERTIFICATE', 600, 130);
  ctx.fillStyle = '#3b82f6';
  ctx.font = '24px Georgia, serif';
  ctx.fillText(certificateSubtitle, 600, 170);

  // Decorative line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 200);
  ctx.lineTo(850, 200);
  ctx.stroke();

  // Content
  ctx.fillStyle = '#475569';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('This is to certify that', 600, 270);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText(learnerName, 600, 340);

  // Name underline
  const nameWidth = ctx.measureText(learnerName).width;
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2 - 20, 355);
  ctx.lineTo(600 + nameWidth / 2 + 20, 355);
  ctx.stroke();

  // Display Learner ID if available
  if (learnerIdText) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`Learner ID: ${learnerIdText}`, 600, 385);
  }

  ctx.fillStyle = '#475569';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText(achievementText, 600, 420);

  ctx.fillStyle = '#1e40af';
  ctx.font = ctx.measureText(courseName).width > 900 ? 'bold 28px Georgia, serif' : 'bold 36px Georgia, serif';
  ctx.fillText(courseName, 600, 490);

  ctx.fillStyle = '#475569';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(`${dateLabel} ${completionDate}`, 600, 560);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px monospace';
  ctx.fillText(`Credential ID: ${credentialId}`, 600, 600);

  // Load and draw signature images (reuse loadImage function from above)
  try {
    // Load both signature images
    const [instructorSig, adminSig] = await Promise.all([
      loadImage('/assets/certificates/instructor.png'),
      loadImage('/assets/certificates/admin.png')
    ]);

    // Signature dimensions and positioning
    const signatureWidth = 100;
    const signatureYPosition = 640;
    
    // Left signature line goes from x=200 to x=450 (center at 325)
    const leftLineCenter = 325;
    const instructorHeight = (instructorSig.height / instructorSig.width) * signatureWidth;
    const instructorX = leftLineCenter - (signatureWidth / 2); // Center the signature
    ctx.drawImage(instructorSig, instructorX, signatureYPosition, signatureWidth, instructorHeight);

    // Right signature line goes from x=750 to x=1000 (center at 875)
    const rightLineCenter = 875;
    const adminHeight = (adminSig.height / adminSig.width) * signatureWidth;
    const adminX = rightLineCenter - (signatureWidth / 2); // Center the signature
    ctx.drawImage(adminSig, adminX, signatureYPosition, signatureWidth, adminHeight);
  } catch (error) {
    logger.error('Failed to load signature images:', error instanceof Error ? error : new Error(String(error)));
    // Continue without signatures if images fail to load
  }

  // Signature lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  [[200, 450], [750, 1000]].forEach(([start, end]) => {
    ctx.beginPath();
    ctx.moveTo(start, 720);
    ctx.lineTo(end, 720);
    ctx.stroke();
  });

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText('Instructor', 325, 745);
  ctx.fillText('Platform Administrator', 875, 745);

  // Platform name at bottom - centered and positioned above bottom border
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('Skill Ecosystem Platform', 600, 785);

  return canvas.toDataURL('image/png', 1.0);
};

const dataURLtoBlob = (dataURL: string): Blob => {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

const uploadToR2 = async (
  blob: Blob,
  learnerId: string,
  courseId: string,
  credentialId: string
): Promise<string> => {
  const filename = `certificates/${learnerId}/${courseId}/${credentialId}.png`;
  
  logger.info('Starting R2 upload', { filename, blobSize: blob.size });
  
  const formData = new FormData();
  formData.append('file', blob, `${credentialId}.png`);
  formData.append('filename', filename);
  formData.append('context', 'certificate'); // Add context for file size validation

  logger.info('Sending upload request to storage API');

  const response = await ssoClient.fetch(`${STORAGE_API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  logger.info('Upload response received', { status: response.status, ok: response.ok });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    logger.error('Upload failed', { status: response.status, errorData });
    throw new Error(`Upload failed (${response.status}): ${errorData.error || response.statusText}`);
  }

  const responseData = await response.json();
  logger.info('Upload successful', { responseData });

  // Use the actual key returned from the upload response
  // The upload handler generates its own unique key in format: uploads/{userId}/{timestamp}-{uuid}.{ext}
  const actualKey = responseData.key;
  
  // Return proxy URL with the actual key from R2
  const proxyUrl = `${STORAGE_API_URL}/course-certificate?key=${encodeURIComponent(actualKey)}`;
  logger.info('Generated proxy URL', { proxyUrl, actualKey });
  
  return proxyUrl;
};

interface CertificateResult {
  success: boolean;
  certificateUrl: string;
  credentialId: string;
  warning?: string;
  error?: string;
}

export const generateCourseCertificate = async (
  learnerId: string,
  learnerName: string,
  courseId: string,
  courseName: string,
  educatorName: string,
  learnerIdText: string | null = null,
  courseType: 'course' | 'webinar' = 'course',
  issuedOnDate: string | null = null
): Promise<CertificateResult> => {
  try {
    const credentialId = generateCredentialId();
    
    // Determine certificate text based on course type
    const isWebinar = courseType === 'webinar';
    
    // For webinars, use the issued_on date from course table; for courses, use current date
    let completionDate;
    if (isWebinar && issuedOnDate) {
      // Format the issued_on date from the database
      const dateObj = new Date(issuedOnDate);
      completionDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      // For courses, use current date (completion date)
      completionDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    const certificateTitle = isWebinar 
      ? `${courseName} - Webinar Participation` 
      : `${courseName} - Course Completion`;
    const certificateLevel = isWebinar ? 'Webinar Participation' : 'Course Completion';
    const certificateDescription = isWebinar 
      ? `Certificate of Participation for "${courseName}"` 
      : `Certificate of Completion for "${courseName}"`;

    const certificateDataUrl = await generateCertificateImage(learnerName, courseName, completionDate, credentialId, learnerIdText, courseType);
    let certificateUrl = certificateDataUrl;

    // Upload to R2 - this is critical, we need the R2 URL for database storage
    try {
      const blob = dataURLtoBlob(certificateDataUrl);
      certificateUrl = await uploadToR2(blob, learnerId, courseId, credentialId);
      logger.info('Certificate uploaded to R2 successfully', { certificateUrl });
    } catch (err) {
      logger.error('Failed to upload certificate to R2 storage', err instanceof Error ? err : new Error('Unknown error'));
      // If R2 upload fails, return error - data URL is too large for database
      return { 
        success: false, 
        error: 'Failed to upload certificate to storage. Please try again.',
        certificateUrl: undefined,
        credentialId
      };
    }

    // Save to database
    const { error: certificateError } = await supabase.from('certificates').insert({
      learner_id: learnerId,
      title: certificateTitle,
      issuer: educatorName || 'Skill Ecosystem Platform',
      level: certificateLevel,
      credential_id: credentialId,
      link: certificateUrl,
      document_url: certificateUrl,
      issued_on: new Date().toISOString().split('T')[0],
      description: certificateDescription,
      status: 'active',
      approval_status: 'approved',
      enabled: true
    });

    if (certificateError) {
      logger.error('Failed to insert certificate into database', certificateError);
      throw new Error(`Database insert failed: ${certificateError.message}`);
    }

    logger.info('Certificate saved to database successfully', { credentialId, courseType, isWebinar });

    // Update enrollment
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .update({ certificate_url: certificateUrl })
      .eq('learner_id', learnerId)
      .eq('course_id', courseId);

    if (enrollmentError) {
      logger.error('Failed to update enrollment with certificate URL', enrollmentError);
      // Don't throw here - certificate is already saved, just log the error
    } else {
      logger.info('Enrollment updated with certificate URL', { learnerId, courseId });
    }

    // Embedding regeneration handled by database trigger on certificates table

    return { success: true, certificateUrl, credentialId };
  } catch (error) {
    logger.error('Failed to generate course certificate', error instanceof Error ? error : new Error('Unknown error'));
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

export const downloadCertificate = async (certificateUrl, courseName) => {
  const STORAGE_API_URL = getApiUrl('storage');

  try {
    // If it's a data URL, download directly
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

    // If it's already a proxy URL, use it directly
    if (certificateUrl.includes('/course-certificate')) {
      downloadUrl = certificateUrl;
    }
    // If it's a direct R2 URL, convert to proxy URL
    else if (certificateUrl.includes('.r2.dev/') || certificateUrl.includes('r2.cloudflarestorage.com')) {
      downloadUrl = `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}`;
    }
    // For any other URL, try using the proxy
    else {
      downloadUrl = `${STORAGE_API_URL}/course-certificate?url=${encodeURIComponent(certificateUrl)}`;
    }

    const response = await ssoClient.fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseName.replace(/[^a-z0-9]/gi, '_')}_Certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    window.URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Failed to download certificate', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
};

/**
 * Get the viewable/downloadable URL for a certificate
 * Converts direct R2 URLs to proxy URLs that work without public bucket access
 * @param {string | null} certificateUrl - The certificate URL
 * @param {string} mode - 'inline' for viewing in browser, 'download' for downloading
 */
export const getCertificateProxyUrl = (certificateUrl: string | null, mode: 'inline' | 'download' = 'inline'): string | null => {
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
    } catch (error) {
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
