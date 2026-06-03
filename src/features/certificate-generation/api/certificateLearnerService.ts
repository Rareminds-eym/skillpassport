/**
 * Certificate Learner Service
 * 
 * Business logic for certificate generation from learner perspective.
 * Handles user data updates and certificate generation orchestration.
 * 
 * FSD Note: This service belongs in features layer as it orchestrates
 * business logic specific to the certificate generation feature.
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';
import { generateCourseCertificate } from './certificateService';

const logger = getLogger('certificate-learner-service');

export interface User {
  id?: string;
  email?: string;
}

export type CourseType = 'course' | 'webinar';

export interface CertificateGenerationParams {
  learnerId: string;
  learnerName: string;
  learnerIdText: string;
  courseId: string;
  courseName: string;
  educatorName: string;
  courseType: CourseType;
  issuedOnDate?: string;
}

/**
 * Fetch learner name from database
 * @param user User object with id or email
 * @param signal Optional AbortSignal for cancellation
 * @returns Learner name or email username as fallback
 */
export async function fetchLearnerName(user: User | undefined, signal?: AbortSignal): Promise<string> {
  if (!user?.id && !user?.email) return '';
  
  try {
    // Check if aborted before starting
    if (signal?.aborted) {
      return '';
    }

    // Try to fetch from learners table using user_id or email
    let query = supabase
      .from('learners')
      .select('name');
    
    if (user.id) {
      query = query.eq('user_id', user.id);
    } else if (user.email) {
      query = query.eq('email', user.email);
    }
    
    const { data, error } = await query.maybeSingle();
    
    // Check if aborted after fetch
    if (signal?.aborted) {
      return '';
    }
    
    if (!error && data?.name) {
      return data.name;
    }
    
    // Fallback to email username
    return user?.email?.split('@')[0] || '';
  } catch (error) {
    logger.warn('Error fetching learner name', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return user?.email?.split('@')[0] || '';
  }
}

/**
 * Update learner name in database tables
 * Updates both learners and users tables for consistency
 * 
 * @param user User object with id or email
 * @param fullName Full name to update
 * @param signal Optional AbortSignal for cancellation
 * @returns Success status
 */
export async function updateLearnerName(user: User, fullName: string, signal?: AbortSignal): Promise<boolean> {
  if (!user?.id && !user?.email) return false;
  
  try {
    // Check if aborted before starting
    if (signal?.aborted) {
      return false;
    }

    // Update learners table
    let learnerQuery = supabase
      .from('learners')
      .update({ name: fullName });
    
    if (user.id) {
      learnerQuery = learnerQuery.eq('user_id', user.id);
    } else if (user.email) {
      learnerQuery = learnerQuery.eq('email', user.email);
    }
    
    const { error: learnerUpdateError } = await learnerQuery;
    
    // Check if aborted after first DB write
    if (signal?.aborted) {
      return false;
    }
    
    if (learnerUpdateError) {
      logger.error('Failed to update learner name', learnerUpdateError);
      return false;
    }
    
    // Also update users table for backward compatibility
    if (user.id) {
      // Split name only when needed for users table update
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          firstName,
          lastName
        })
        .eq('id', user.id);

      if (userUpdateError) {
        logger.error('Failed to update user name', userUpdateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error updating name', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

export type CertificateServiceResult =
  | { success: true; certificateUrl: string; credentialId: string; nameUpdateFailed?: boolean }
  | { success: false; error: string };

/**
 * Generate certificate with user name update
 * Orchestrates the full certificate generation flow:
 * 1. Update user name in database (if provided)
 * 2. Generate certificate
 * 3. Return result with appropriate warnings
 * 
 * @param user User object for name updates
 * @param params Certificate generation parameters
 * @param signal Optional AbortSignal for cancellation
 * @returns Certificate generation result
 */
export async function generateCertificateWithNameUpdate(
  user: User | undefined,
  params: CertificateGenerationParams,
  signal?: AbortSignal
): Promise<CertificateServiceResult> {
  const {
    learnerId,
    learnerName,
    learnerIdText,
    courseId,
    courseName,
    educatorName,
    courseType,
    issuedOnDate
  } = params;
  
  // Check if aborted before starting
  if (signal?.aborted) {
    return {
      success: false,
      error: 'Operation was cancelled'
    };
  }

  let nameUpdateFailed = false;
  
  // Update user name in database if user object is provided
  if (user?.id || user?.email) {
    const nameUpdated = await updateLearnerName(user, learnerName, signal);
    if (!nameUpdated) {
      nameUpdateFailed = true;
      logger.warn('Name update failed but continuing with certificate generation', {
        userId: user.id,
        email: user.email
      });
    }
  }
  
  // Check if aborted after name update
  if (signal?.aborted) {
    return {
      success: false,
      error: 'Operation was cancelled'
    };
  }

  // Generate certificate
  logger.info('Generating certificate', { 
    learnerId, 
    learnerName,
    courseName, 
    courseType, 
    issuedOnDate 
  });
  
  const result = await generateCourseCertificate(
    learnerId,
    learnerName,
    courseId,
    courseName,
    educatorName,
    learnerIdText,
    courseType,
    issuedOnDate
  );
  
  // Check if aborted after certificate generation
  if (signal?.aborted) {
    return {
      success: false,
      error: 'Operation was cancelled'
    };
  }

  // Transform CertificateResult to CertificateServiceResult
  if (result.success && result.certificateUrl) {
    return {
      success: true,
      certificateUrl: result.certificateUrl,
      credentialId: result.credentialId,
      nameUpdateFailed
    };
  } else {
    return {
      success: false,
      error: result.error || 'Certificate generation failed'
    };
  }
}
