/**
 * Certificate Generation Service
 * Generates course completion certificates using Cloudflare R2 storage
 */

import { apiPost } from '@/shared/api/apiClient';
import { getApiUrl } from '@/shared/api/apiUtils';
import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';
import { generateCertificateHTML } from '../lib/certificateTemplate';
import html2canvas from 'html2canvas';

const logger = getLogger('certificate-service');

const STORAGE_API_URL = getApiUrl('storage');

// Certificate dimensions (matching template design)
// CERTIFICATE_WIDTH and CERTIFICATE_HEIGHT define the render target dimensions (3579px × 2551px)
// The background graphic asset itself is 3094px × 2551px, centered within the render area
const CERTIFICATE_WIDTH = 3579;
const CERTIFICATE_HEIGHT = 2551;

// SSO initialization lock to prevent race conditions
let ssoInitializationPromise: Promise<{ authenticated: boolean }> | null = null;

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
  // Use crypto.randomUUID() for collision-resistant credential IDs
  // Falls back to timestamp-based approach if crypto is unavailable
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `CERT-${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
};

/**
 * Generates certificate image using html2canvas from the HTML template
 * This ensures all styling and layout from certificateTemplate.ts is properly used
 * 
 * FIX 6: Course name consistency decision:
 * - This function receives the raw courseName parameter
 * - For webinars, the DB title field stores certificateTitle which appends " - Webinar Participation"
 * - The certificate image itself displays the raw course name (visual design choice)
 * - This is intentional: the image shows "Advanced JavaScript", DB stores "Advanced JavaScript - Webinar Participation"
 */
const generateCertificateImage = async (
  learnerName: string,
  courseName: string,
  completionDate: string,
  credentialId: string,
  learnerIdText: string | null,
  courseType: 'course' | 'webinar' = 'course'
): Promise<string> => {
  // Generate the certificate HTML using the template
  const certificateHTML = generateCertificateHTML(
    {
      studentName: learnerName,
      studentId: learnerIdText || 'N/A',
      courseName: courseName,
      completionDate: completionDate,
      credentialId: credentialId,
      courseType: courseType,
    },
    window.location.origin // Use current origin as base URL for assets
  );

  // Create a temporary container to render the HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${CERTIFICATE_WIDTH}px`;
  container.style.height = `${CERTIFICATE_HEIGHT}px`;
  container.style.overflow = 'visible';
  container.style.zIndex = '-9999'; // Behind everything
  container.style.pointerEvents = 'none'; // Prevent interaction
  container.style.opacity = '0'; // Make it invisible
  container.style.transform = 'scale(0.01)'; // Scale down to minimize any visual artifacts
  container.style.transformOrigin = 'top left';
  container.innerHTML = certificateHTML;
  
  let mounted = false;
  try {
    document.body.appendChild(container);
    mounted = true;
    // Find the certificate background element
    const certificateElement = container.querySelector('.background') as HTMLElement;
    
    if (!certificateElement) {
      throw new Error('Certificate background element not found in template');
    }

    // Ensure the element has proper dimensions set
    certificateElement.style.width = `${CERTIFICATE_WIDTH}px`;
    certificateElement.style.height = `${CERTIFICATE_HEIGHT}px`;
    certificateElement.style.minWidth = `${CERTIFICATE_WIDTH}px`;
    certificateElement.style.minHeight = `${CERTIFICATE_HEIGHT}px`;
    certificateElement.style.position = 'relative';

    // Wait for all images to load
    const images = Array.from(certificateElement.querySelectorAll('img'));
    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            logger.warn(`Failed to load image: ${img.src}`);
            resolve(); // Continue even if some images fail
          };
          // Set a timeout for image loading
          setTimeout(() => resolve(), 5000);
        });
      })
    );

    // Wait for fonts to load
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (fontError) {
        logger.warn('Font loading timeout, continuing with available fonts');
      }
    }

    // Give a small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Temporarily restore scale and opacity for rendering
    container.style.transform = 'scale(1)';
    container.style.opacity = '1';

    // FIX 4: Force reflow before html2canvas to ensure browser completes layout
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Use html2canvas to convert the HTML to canvas with explicit dimensions
    // Wrap in Promise.race to enforce a 15-second timeout
    let timeoutId: ReturnType<typeof setTimeout>;
    const html2canvasPromise = html2canvas(certificateElement, {
      width: CERTIFICATE_WIDTH,
      height: CERTIFICATE_HEIGHT,
      windowWidth: CERTIFICATE_WIDTH,
      windowHeight: CERTIFICATE_HEIGHT,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 10000,
      removeContainer: false,
      foreignObjectRendering: false, // Disable foreign object rendering for better compatibility
      x: 0,
      y: 0,
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Certificate rendering timed out after 15 seconds')), 15000);
    });
    // FIX 5: Clear timeout in finally to prevent resource leak
    const canvas = await Promise.race([html2canvasPromise, timeoutPromise])
      .finally(() => clearTimeout(timeoutId));

    // Verify canvas dimensions
    if (canvas.width !== CERTIFICATE_WIDTH || canvas.height !== CERTIFICATE_HEIGHT) {
      logger.warn(`Canvas dimensions mismatch. Expected: ${CERTIFICATE_WIDTH}x${CERTIFICATE_HEIGHT}, Got: ${canvas.width}x${canvas.height}`);
    }

    // Convert canvas to data URL with high quality
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    
    return dataUrl;
  } catch (error) {
    logger.error('Failed to generate certificate image', error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    // Clean up the temporary container only if it was successfully mounted
    if (mounted) {
      try {
        document.body.removeChild(container);
      } catch (removeError) {
        // Container may have already been removed or DOM state changed
        logger.warn('Failed to remove certificate container');
      }
    }
  }
};

const dataURLtoBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid data URL format: missing comma separator');
  }
  const [header, data] = parts;
  const mimeMatch = header.match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL format: missing MIME type');
  }
  const mime = mimeMatch[1];
  
  try {
    const binary = atob(data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch (decodeError) {
    throw new Error('Invalid data URL format: base64 decode failed');
  }
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
  // Use a lock to prevent race conditions from concurrent uploads
  if (!ssoClient.isInitialized()) {
    logger.warn('SSO client not initialized, initializing now');
    
    // If another upload is already initializing, wait for it
    if (ssoInitializationPromise) {
      logger.info('SSO initialization already in progress, waiting for completion');
      try {
        const result = await ssoInitializationPromise;
        if (!result.authenticated) {
          throw new Error('Authentication required. Please log in and try again.');
        }
      } catch (initError) {
        const errorMessage = `SSO initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`;
        logger.error('Waiting for SSO initialization failed', new Error(errorMessage));
        throw new Error(errorMessage);
      }
      // FIX 1: Waiting branch should NOT clear the promise - only the creating branch should
    } else {
      // This is the first concurrent call, create the initialization promise
      ssoInitializationPromise = ssoClient.initSession();
      
      try {
        const { authenticated } = await ssoInitializationPromise;
        if (!authenticated) {
          throw new Error('Authentication required. Please log in and try again.');
        }
      } catch (initError) {
        const errorMessage = `SSO initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`;
        logger.error('SSO initialization failed', new Error(errorMessage));
        throw new Error(errorMessage);
      } finally {
        // FIX 1: Only the branch that creates the promise should clear it
        ssoInitializationPromise = null;
      }
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
  
  // Runtime guard for type safety
  if (!responseData.key) {
    throw new Error('Upload response missing key');
  }
  
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
    if (!learnerId || !courseId) {
      logger.error('Missing certificate generation identifiers', new Error('Missing learnerId or courseId'), {
        hasLearnerId: Boolean(learnerId),
        hasCourseId: Boolean(courseId),
      });
      return {
        success: false,
        error: 'Learner or course information is missing. Please refresh and try again.',
      };
    }

    const credentialId = generateCredentialId();
    
    // Determine certificate text based on course type
    const isWebinar = courseType === 'webinar';
    
    // Normalize completion date to ISO string format for consistent template handling
    // For webinars, use the issued_on date from course table; for courses, use current date
    let completionDate: string;
    if (isWebinar && issuedOnDate) {
      // Ensure issuedOnDate is in ISO format (may be date-only or full ISO string)
      if (issuedOnDate.includes('T')) {
        completionDate = issuedOnDate;
      } else {
        const parsedDate = new Date(issuedOnDate);
        if (isNaN(parsedDate.getTime())) {
          logger.warn(`Invalid issuedOnDate: ${issuedOnDate}, falling back to current date`);
          completionDate = new Date().toISOString();
        } else {
          completionDate = parsedDate.toISOString();
        }
      }
    } else {
      completionDate = new Date().toISOString();
    }
    
    const certificateTitle = isWebinar 
      ? `${courseName} - Webinar Participation` 
      : `${courseName} - Course Completion`;
    const certificateLevel = isWebinar ? 'Webinar Participation' : 'Course Completion';
    const certificateDescription = isWebinar 
      ? `Certificate of Participation for "${courseName}"` 
      : `Certificate of Completion for "${courseName}"`;

    const certificateDataUrl = await generateCertificateImage(learnerName, courseName, completionDate, credentialId, learnerIdText, courseType);
    // FIX 3: Declare certificateUrl without misleading fallback assignment
    // The only path that continues past R2 upload is success (failures return early)
    let certificateUrl: string;

    // Upload to R2 - this is critical, we need the R2 URL for database storage
    let blob: Blob;
    try {
      blob = dataURLtoBlob(certificateDataUrl);
    } catch (blobError) {
      logger.error('Failed to convert data URL to blob', blobError instanceof Error ? blobError : new Error('Unknown error'));
      return {
        success: false,
        error: 'Invalid certificate image format. Please try again.',
        credentialId
      };
    }

    try {
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

    // Save to database and update enrollment
    const response = await apiPost('/course/actions', {
      action: 'save-certificate',
      learnerId,
      courseId,
      certificateData: {
        learner_id: learnerId,
        title: certificateTitle,
        issuer: educatorName || 'Skill Ecosystem Platform',
        level: certificateLevel,
        credential_id: credentialId,
        link: certificateUrl,
        document_url: certificateUrl,
        issued_on: completionDate.split('T')[0],
        description: certificateDescription,
        status: 'active',
        approval_status: 'approved',
        enabled: true
      }
    });

    if (!response.success) {
      logger.error('Failed to save certificate to database via API', new Error(response.error || 'API error'));
      throw new Error(`Database save failed: ${response.error || 'API error'}`);
    }

    let warning: string | undefined;
    // Since API handles both, if it succeeded, it succeeded.
    logger.info('Certificate saved to database and enrollment updated successfully', { credentialId, courseType, isWebinar });

    // Embedding regeneration handled by database trigger on certificates table

    return { success: true, certificateUrl, credentialId, warning };
  } catch (error) {
    logger.error('Failed to generate course certificate', error instanceof Error ? error : new Error('Unknown error'));
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};

// Re-export utility functions from shared layer for feature-level API consistency
// These are pure utility functions without business logic specific to certificate generation
export { downloadCertificate, getCertificateProxyUrl } from '@/shared/lib/certificateUtils';
