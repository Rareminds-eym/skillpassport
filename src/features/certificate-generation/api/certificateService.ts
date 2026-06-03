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

// Type definitions for API responses
interface UploadErrorResponse {
  error?: string;
  [key: string]: unknown;
}

interface UploadSuccessResponse {
  key: string;
  url?: string;
  [key: string]: unknown;
}

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
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

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
  const mimeMatch = header.match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL format');
  }
  const mime = mimeMatch[1];
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

/**
 * Upload certificate blob to R2 storage
 * Handles authentication by leveraging ssoClient.fetch() which automatically:
 * - Includes JWT token in Authorization header
 * - Refreshes token on 401 and retries once
 */
const uploadToR2 = async (
  blob: Blob,
  learnerId: string,
  courseId: string,
  credentialId: string
): Promise<string> => {
  const filename = `certificates/${learnerId}/${courseId}/${credentialId}.png`;
  
  logger.info('Starting R2 upload', { filename, blobSize: blob.size });
  
  // Ensure ssoClient has been initialized (initSession was called)
  // This prevents issues when user tries to upload immediately after page load
  if (!ssoClient.isInitialized()) {
    logger.warn('SSO client not initialized, initializing now');
    try {
      const { authenticated } = await ssoClient.initSession();
      if (!authenticated) {
        throw new Error('Authentication required. Please log in and try again.');
      }
    } catch (initError) {
      const errorMessage = `SSO initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`;
      logger.error('SSO initialization failed', new Error(errorMessage));
      throw new Error(errorMessage);
    }
  }
  
  const formData = new FormData();
  formData.append('file', blob, `${credentialId}.png`);
  formData.append('filename', filename);
  formData.append('context', 'certificate');

  // ssoClient.fetch() handles:
  // 1. Adding Authorization header with JWT token
  // 2. Auto-retry on 401 with token refresh
  // 3. Session expiry handling
  const response = await ssoClient.fetch(`${STORAGE_API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as UploadErrorResponse;
    const errorMessage = `Upload failed (${response.status}): ${errorData.error || response.statusText}`;
    logger.error('Upload failed', new Error(errorMessage), { status: response.status, errorData });
    throw new Error(errorMessage);
  }

  const responseData: UploadSuccessResponse = await response.json();
  logger.info('Upload successful', { key: responseData.key });

  const proxyUrl = `${STORAGE_API_URL}/course-certificate?key=${encodeURIComponent(responseData.key)}`;
  
  return proxyUrl;
};

export interface CertificateResult {
  success: boolean;
  certificateUrl?: string;
  credentialId?: string;
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

// Re-export utility functions from shared layer for feature-level API consistency
// These are pure utility functions without business logic specific to certificate generation
export { downloadCertificate, getCertificateProxyUrl } from '@/shared/lib/certificateUtils';
