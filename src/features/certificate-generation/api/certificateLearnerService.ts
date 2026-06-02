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
import { generateCourseCertificate, type CertificateResult } from './certificateService';

const logger = getLogger('certificate-learner-service');

export interface User {
  id?: string;
  email?: string;
}

export interface CertificateGenerationParams {
  learnerId: string;
  learnerName: string;
  learnerIdText: string;
  courseId: string;
  courseName: string;
  educatorName: string;
  courseType: 'course' | 'webinar';
  issuedOnDate?: string;
}

/**
 * Fetch learner name from database
 * @param user User object with id or email
 * @returns Learner name or email username as fallback
 */
export async function fetchLearnerName(user: User): Promise<string> {
  if (!user?.id && !user?.email) return '';
  
  try {
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
 * @returns Success status
 */
export async function updateLearnerName(user: User, fullName: string): Promise<boolean> {
  if (!user?.id && !user?.email) return false;
  
  try {
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';
    
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
    
    if (learnerUpdateError) {
      logger.error('Failed to update learner name', learnerUpdateError);
      return false;
    }
    
    // Also update users table for backward compatibility
    if (user.id) {
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

/**
 * Generate certificate with user name update
 * Orchestrates the full certificate generation flow:
 * 1. Update user name in database (if provided)
 * 2. Generate certificate
 * 3. Return result with appropriate warnings
 * 
 * @param user User object for name updates
 * @param params Certificate generation parameters
 * @returns Certificate generation result
 */
export async function generateCertificateWithNameUpdate(
  user: User | undefined,
  params: CertificateGenerationParams
): Promise<CertificateResult & { nameUpdateFailed?: boolean }> {
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
  
  let nameUpdateFailed = false;
  
  // Update user name in database if user object is provided
  if (user?.id || user?.email) {
    const nameUpdated = await updateLearnerName(user, learnerName);
    if (!nameUpdated) {
      nameUpdateFailed = true;
      logger.warn('Name update failed but continuing with certificate generation', {
        userId: user.id,
        email: user.email
      });
    }
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
  
  return {
    ...result,
    nameUpdateFailed
  };
}
