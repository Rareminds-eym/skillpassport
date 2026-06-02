import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  fetchLearnerName, 
  generateCertificateWithNameUpdate,
  type User,
  type CertificateGenerationParams 
} from '../api/certificateLearnerService';
import { downloadCertificate } from '../api/certificateService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useCertificateModal');

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
  const fetchName = async (): Promise<string> => {
    if (!user?.id && !user?.email) return '';
    
    try {
      return await fetchLearnerName(user);
    } catch (error) {
      logger.error('Error fetching learner name in openModal', error instanceof Error ? error : new Error(String(error)));
      // Use email fallback if fetching fails
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
      const nameToUse = data.prefillName || (await fetchName());
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
    
    // Security: Reject names with HTML/script tags or suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /<\/script/i,
      /<iframe/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /<img/i,
      /<svg/i,
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(trimmedName))) {
      return 'Name contains invalid characters';
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

      // Prepare certificate generation parameters
      const params: CertificateGenerationParams = {
        learnerId,
        learnerName: trimmedName,
        learnerIdText,
        courseId,
        courseName,
        educatorName,
        courseType,
        issuedOnDate
      };

      // Delegate to features layer for business logic
      const result = await generateCertificateWithNameUpdate(user, params);

      // Show warning if name update failed but certificate generation succeeded
      if (result.nameUpdateFailed && result.success) {
        toast.error('Warning: Your name was not saved. The certificate will still be generated.');
      }

      // Validate result object exists and has expected shape with proper type narrowing
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from certificate generation service');
      }

      // Type guard: Ensure result has the expected structure
      const isValidSuccessResult = (
        'success' in result && 
        typeof result.success === 'boolean' &&
        result.success &&
        'certificateUrl' in result && 
        typeof result.certificateUrl === 'string' &&
        result.certificateUrl.length > 0 &&
        'credentialId' in result &&
        typeof result.credentialId === 'string'
      );

      const isValidErrorResult = (
        'success' in result &&
        typeof result.success === 'boolean' &&
        !result.success
      );

      if (isValidSuccessResult) {
        // Type assertion is safe here because we validated the structure above
        const certificateUrl = result.certificateUrl as string;
        const credentialId = result.credentialId as string;
        
        logger.info('Certificate generated successfully', { credentialId });
        setGeneratedUrl(certificateUrl);
        toast.success('Certificate generated successfully!');
        
        if (onSuccess) {
          onSuccess({
            certificateUrl,
            credentialId,
            courseName,
            courseType,
            courseId
          });
        }
      } else if (isValidErrorResult) {
        const errorMessage = ('error' in result && typeof result.error === 'string') 
          ? result.error 
          : 'Certificate generation failed';
        const errorObj = new Error(errorMessage);
        logger.error('Certificate generation failed', errorObj);
        toast.error(errorMessage);
        
        if (onError) {
          onError(errorObj);
        }
      } else {
        // Unexpected response structure
        throw new Error('Unexpected response structure from certificate generation service');
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
