import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/shared/api/supabaseClient';
import { generateCourseCertificate, downloadCertificate } from '@/features/digital-portfolio';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useCertificateModal');

interface User {
  id?: string;
  email?: string;
}

interface CertificateData {
  courseId: string;
  courseName: string;
  educatorName: string;
  courseType: 'course' | 'webinar';
  issuedOnDate?: string;
  learnerId: string;
  learnerIdText: string;
  prefillName?: string;
}

interface CertificateResult {
  certificateUrl: string;
  credentialId: string;
  courseName: string;
  courseType: string;
  courseId: string;
}

interface UseCertificateModalOptions {
  user?: User;
  onSuccess?: (result: CertificateResult) => void;
  onError?: (error: Error) => void;
}

interface UseCertificateModalReturn {
  showModal: boolean;
  fullName: string;
  isGenerating: boolean;
  pendingData: CertificateData | null;
  generatedUrl: string | null;
  showConfirmation: boolean;
  validationError: string;
  setFullName: (name: string) => void;
  openModal: (data: CertificateData) => Promise<void>;
  closeModal: () => void;
  showConfirmationDialog: () => void;
  cancelConfirmation: () => void;
  generateCertificate: () => Promise<void>;
  downloadGeneratedCertificate: () => Promise<void>;
}

/**
 * Custom hook for managing certificate generation modal state and logic
 */
export const useCertificateModal = ({ user, onSuccess, onError }: UseCertificateModalOptions = {}): UseCertificateModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingData, setPendingData] = useState<CertificateData | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');

  /**
   * Fetch learner name from database
   */
  const fetchLearnerName = async (): Promise<string> => {
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
      logger.warn('Error fetching learner name', { error: error instanceof Error ? error.message : String(error) });
      return user?.email?.split('@')[0] || '';
    }
  };

  /**
   * Open modal with pre-filled data
   */
  const openModal = async (data: CertificateData): Promise<void> => {
    setPendingData(data);
    
    try {
      // Fetch name from database if not provided
      const nameToUse = data.prefillName || (await fetchLearnerName());
      setFullName(nameToUse);
    } catch (error) {
      logger.error('Error fetching learner name in openModal', error instanceof Error ? error : new Error(String(error)));
      // Use email fallback if fetching fails
      setFullName(user?.email?.split('@')[0] || '');
    }
    
    setGeneratedUrl(null);
    setShowConfirmation(false);
    setValidationError('');
    setShowModal(true);
  };

  /**
   * Close modal and reset state
   */
  const closeModal = (): void => {
    setShowModal(false);
    setShowConfirmation(false);
    setPendingData(null);
    setFullName('');
    setGeneratedUrl(null);
    setValidationError('');
  };

  /**
   * Validate name input
   */
  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Please enter your full name';
    }
    
    if (trimmedName.length < 2) {
      return 'Name must be at least 2 characters';
    }
    
    if (trimmedName.length > 100) {
      return 'Name must be less than 100 characters';
    }
    
    // Check if name contains at least one letter
    if (!/[a-zA-Z]/.test(trimmedName)) {
      return 'Name must contain at least one letter';
    }
    
    return null;
  };

  /**
   * Handle name change with validation
   */
  const handleNameChange = (name: string): void => {
    setFullName(name);
    // Clear validation error when user types
    if (validationError) {
      setValidationError('');
    }
  };

  /**
   * Show confirmation dialog
   */
  const showConfirmationDialog = (): void => {
    const error = validateName(fullName);
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }
    
    setShowConfirmation(true);
  };

  /**
   * Cancel confirmation and go back to edit
   */
  const cancelConfirmation = (): void => {
    setShowConfirmation(false);
  };

  /**
   * Generate certificate with current data (called after confirmation)
   */
  const generateCertificate = async (): Promise<void> => {
    const trimmedName = fullName.trim();
    const error = validateName(trimmedName);
    
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    if (!pendingData) {
      toast.error('Certificate data not found');
      return;
    }

    setIsGenerating(true);
    setShowConfirmation(false);

    try {
      const {
        learnerId,
        learnerIdText,
        courseName,
        educatorName,
        courseType,
        issuedOnDate,
        courseId
      } = pendingData;

      // Update user name in database if user object is provided
      // Store in learners table for consistency
      if (user?.id || user?.email) {
        try {
          const nameParts = trimmedName.split(' ');
          const firstName = nameParts[0] || trimmedName;
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Update learners table
          let learnerQuery = supabase
            .from('learners')
            .update({ name: trimmedName });
          
          if (user.id) {
            learnerQuery = learnerQuery.eq('user_id', user.id);
          } else if (user.email) {
            learnerQuery = learnerQuery.eq('email', user.email);
          }
          
          const { error: learnerUpdateError } = await learnerQuery;
          
          if (learnerUpdateError) {
            logger.warn('Failed to update learner name', { error: learnerUpdateError });
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
              logger.warn('Failed to update user name', { error: userUpdateError });
            }
          }
        } catch (err) {
          logger.warn('Error updating name', { error: err instanceof Error ? err.message : String(err) });
        }
      }

      logger.info('Generating certificate', { 
        learnerId, 
        learnerName: trimmedName,
        courseName, 
        courseType, 
        issuedOnDate 
      });

      const result = await generateCourseCertificate(
        learnerId,
        trimmedName,
        courseId,
        courseName,
        educatorName,
        learnerIdText,
        courseType,
        issuedOnDate
      );

      if (result.success && result.certificateUrl) {
        logger.info('Certificate generated successfully', { credentialId: result.credentialId });
        setGeneratedUrl(result.certificateUrl);
        toast.success('Certificate generated successfully!');
        
        if (onSuccess) {
          onSuccess({
            certificateUrl: result.certificateUrl,
            credentialId: result.credentialId,
            courseName,
            courseType,
            courseId
          });
        }
      } else {
        const errorObj = new Error(result.error || 'Certificate generation failed');
        logger.error('Certificate generation failed', errorObj);
        toast.error(result.error || 'Failed to generate certificate');
        
        if (onError) {
          onError(new Error(result.error));
        }
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error generating certificate', errorObj);
      toast.error('An error occurred while generating the certificate');
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download the generated certificate
   */
  const downloadGeneratedCertificate = async (): Promise<void> => {
    if (!generatedUrl || !pendingData?.courseName) return;
    
    try {
      await downloadCertificate(generatedUrl, pendingData.courseName);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error downloading certificate', errorObj);
      toast.error('Failed to download certificate');
    }
  };

  return {
    // State
    showModal,
    fullName,
    isGenerating,
    pendingData,
    generatedUrl,
    showConfirmation,
    validationError,
    
    // Setters
    setFullName: handleNameChange,
    
    // Actions
    openModal,
    closeModal,
    showConfirmationDialog,
    cancelConfirmation,
    generateCertificate,
    downloadGeneratedCertificate
  };
};
