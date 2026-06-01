import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/shared/api/supabaseClient';
import { generateCourseCertificate, downloadCertificate } from '@/features/digital-portfolio';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useCertificateModal');

/**
 * Custom hook for managing certificate generation modal state and logic
 * 
 * @param {Object} options
 * @param {Object} options.user - Current user object
 * @param {Function} options.onSuccess - Callback after successful certificate generation
 * @param {Function} options.onError - Callback on error
 * @returns {Object} Modal state and handlers
 */
export const useCertificateModal = ({ user, onSuccess, onError } = {}) => {
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');

  /**
   * Fetch learner name from database
   */
  const fetchLearnerName = async () => {
    if (!user?.id && !user?.email) return '';
    
    try {
      // Try to fetch from learners table using user_id or email
      const query = supabase
        .from('learners')
        .select('name');
      
      if (user.id) {
        query.eq('user_id', user.id);
      } else if (user.email) {
        query.eq('email', user.email);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (!error && data?.name) {
        return data.name;
      }
      
      // Fallback to email username
      return user?.email?.split('@')[0] || '';
    } catch (error) {
      logger.warn('Error fetching learner name', error instanceof Error ? error : new Error(String(error)));
      return user?.email?.split('@')[0] || '';
    }
  };

  /**
   * Open modal with pre-filled data
   * @param {Object} data - Certificate data
   * @param {string} data.courseId - Course ID
   * @param {string} data.courseName - Course name
   * @param {string} data.educatorName - Educator name
   * @param {string} data.courseType - 'course' or 'webinar'
   * @param {string} data.issuedOnDate - Issue date for webinars
   * @param {string} data.learnerId - Learner database ID
   * @param {string} data.learnerIdText - Learner ID text for certificate
   * @param {string} data.prefillName - Pre-filled name (optional, will fetch from DB if not provided)
   */
  const openModal = async (data) => {
    setPendingData(data);
    
    // Fetch name from database if not provided
    const nameToUse = data.prefillName || await fetchLearnerName();
    setFullName(nameToUse);
    
    setGeneratedUrl(null);
    setShowConfirmation(false);
    setValidationError('');
    setShowModal(true);
  };

  /**
   * Close modal and reset state
   */
  const closeModal = () => {
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
  const validateName = (name) => {
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
  const handleNameChange = (name) => {
    setFullName(name);
    // Clear validation error when user types
    if (validationError) {
      setValidationError('');
    }
  };

  /**
   * Show confirmation dialog
   */
  const showConfirmationDialog = () => {
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
  const cancelConfirmation = () => {
    setShowConfirmation(false);
  };

  /**
   * Generate certificate with current data (called after confirmation)
   */
  const generateCertificate = async () => {
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
          const learnerQuery = supabase
            .from('learners')
            .update({ name: trimmedName });
          
          if (user.id) {
            learnerQuery.eq('user_id', user.id);
          } else if (user.email) {
            learnerQuery.eq('email', user.email);
          }
          
          const { error: learnerUpdateError } = await learnerQuery;
          
          if (learnerUpdateError) {
            logger.warn('Failed to update learner name', learnerUpdateError instanceof Error ? learnerUpdateError : new Error(String(learnerUpdateError)));
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
              logger.warn('Failed to update user name', userUpdateError instanceof Error ? userUpdateError : new Error(String(userUpdateError)));
            }
          }
        } catch (err) {
          logger.warn('Error updating name', err instanceof Error ? err : new Error(String(err)));
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
            courseType
          });
        }
      } else {
        logger.error('Certificate generation failed', new Error(result.error));
        toast.error(result.error || 'Failed to generate certificate');
        
        if (onError) {
          onError(new Error(result.error));
        }
      }
    } catch (error) {
      logger.error('Error generating certificate', error);
      toast.error('An error occurred while generating the certificate');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download the generated certificate
   */
  const downloadGeneratedCertificate = async () => {
    if (!generatedUrl || !pendingData?.courseName) return;
    
    try {
      await downloadCertificate(generatedUrl, pendingData.courseName);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      logger.error('Error downloading certificate', error);
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
