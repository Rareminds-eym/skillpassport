import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  fetchLearnerName, 
  generateCertificateWithNameUpdate,
  type User,
  type CertificateGenerationParams,
  type CourseType,
} from '../api/certificateLearnerService';
import { downloadCertificate } from '../api/certificateService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useCertificateModal');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CertificateData {
  courseId: string;
  courseName: string;
  educatorName: string;
  courseType: CourseType;
  issuedOnDate?: string;
  learnerId: string;
  learnerIdText: string;
  prefillName?: string;
}

interface CertificateResult {
  certificateUrl: string;
  credentialId: string;
  courseName: string;
  courseType: CourseType;
  courseId: string;
}

interface UseCertificateModalOptions {
  userId?: string;
  userEmail?: string;
  onSuccess?: (result: CertificateResult) => void | Promise<void>;
  onError?: (error: Error) => void;
}

interface UseCertificateModalReturn {
  showModal: boolean;
  fullName: string;
  isGenerating: boolean;
  isLoadingName: boolean;
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

// ============================================================================
// MODULE-SCOPE HELPERS
// ============================================================================

/**
 * Validate name input - pure function with no dependencies
 */
function validateName(name: string): string | null {
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
}

/**
 * Safely call onError callback with error handling
 */
function callSafeOnError(
  onError: ((e: Error) => void) | undefined,
  err: Error,
  loggerInstance: typeof logger
): void {
  if (!onError) return;
  try {
    onError(err);
  } catch (cbErr) {
    loggerInstance.error(
      'Error in onError callback',
      cbErr instanceof Error ? cbErr : new Error(String(cbErr))
    );
  }
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing certificate generation modal state and logic
 */
export const useCertificateModal = ({ 
  userId,
  userEmail,
  onSuccess, 
  onError 
}: UseCertificateModalOptions = {}): UseCertificateModalReturn => {
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [pendingData, setPendingData] = useState<CertificateData | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Store abort functions for cleanup
  const abortFetchRef = useRef<(() => void) | null>(null);
  const abortGenerateRef = useRef<(() => void) | null>(null);
  
  // Store latest callbacks in refs to avoid stale closures
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  // This ensures we always call the latest version without recreating dependent functions
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Construct user object from primitives for backward compatibility with service layer
  const user: User | undefined = userId || userEmail 
    ? { id: userId, email: userEmail }
    : undefined;

  /**
   * Validate name and set error state
   * @returns true if valid, false if invalid
   */
  const validateAndSet = useCallback((name: string): boolean => {
    const error = validateName(name);
    if (error) {
      setValidationError(error);
      toast.error(error);
      return false;
    }
    return true;
  }, []);

  /**
   * Open modal with pre-filled data
   * Implements AbortController for proper cancellation
   */
  const openModal = useCallback(async (data: CertificateData): Promise<void> => {
    // Abort any previous fetch operation before creating a new one
    if (abortFetchRef.current) {
      abortFetchRef.current();
    }
    
    // Create abort controller for this fetch operation
    const abortController = new AbortController();
    abortFetchRef.current = () => abortController.abort();

    setPendingData(data);
    setGeneratedUrl(null);
    setShowConfirmation(false);
    setValidationError('');
    setIsLoadingName(true);
    
    try {
      // Fetch name from database if not provided
      const nameToUse = data.prefillName || (await fetchLearnerName(user, abortController.signal));
      
      // Check if aborted
      if (abortController.signal.aborted) {
        setIsLoadingName(false);
        return;
      }
      
      setFullName(nameToUse);
      setIsLoadingName(false);
      setShowModal(true);
    } catch (error) {
      // Check if aborted
      if (abortController.signal.aborted) {
        setIsLoadingName(false);
        return;
      }

      logger.error(
        'Error fetching learner name in openModal',
        error instanceof Error ? error : new Error(String(error))
      );
      
      setFullName('');
      setIsLoadingName(false);
      setShowModal(true);
    }
  }, [userId, userEmail]);

  /**
   * Close modal and reset state
   * Aborts any pending fetch operations
   */
  const closeModal = useCallback((): void => {
    // Abort any pending fetch
    if (abortFetchRef.current) {
      abortFetchRef.current();
      abortFetchRef.current = null;
    }
    
    // Abort any pending certificate generation
    if (abortGenerateRef.current) {
      abortGenerateRef.current();
      abortGenerateRef.current = null;
    }
    
    setShowModal(false);
    setShowConfirmation(false);
    setPendingData(null);
    setFullName('');
    setGeneratedUrl(null);
    setValidationError('');
    setIsLoadingName(false);
  }, []);

  /**
   * Handle name change with validation
   */
  const handleNameChange = useCallback((name: string): void => {
    setFullName(name);
    // Clear validation error when user types (functional updater to avoid dependency)
    setValidationError(prev => prev ? '' : prev);
  }, []);

  /**
   * Show confirmation dialog
   */
  const showConfirmationDialog = useCallback((): void => {
    if (!validateAndSet(fullName)) {
      return;
    }
    
    setShowConfirmation(true);
  }, [fullName, validateAndSet]);

  /**
   * Cancel confirmation and go back to edit
   */
  const cancelConfirmation = useCallback((): void => {
    setShowConfirmation(false);
  }, []);

  /**
   * Generate certificate with current data (called after confirmation)
   * Implements AbortController and comprehensive error handling
   */
  const generateCertificate = useCallback(async (): Promise<void> => {
    const trimmedName = fullName.trim();
    
    if (!validateAndSet(trimmedName)) {
      return;
    }

    if (!pendingData) {
      toast.error('Certificate data not found');
      return;
    }

    // Abort any previous generation operation before creating a new one
    if (abortGenerateRef.current) {
      abortGenerateRef.current();
    }
    
    // Create abort controller for this generation operation
    // Declare at top level to ensure it's accessible in finally block
    const abortController = new AbortController();
    abortGenerateRef.current = () => abortController.abort();
    
    // Track whether we've started the async operation
    let asyncOperationStarted = false;

    try {
      setIsGenerating(true);
      asyncOperationStarted = true;
      setShowConfirmation(false);

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
      const result = await generateCertificateWithNameUpdate(
        user, 
        params, 
        abortController.signal
      );

      // Check if aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Show warning if name update failed but certificate generation succeeded
      if (result.success && result.nameUpdateFailed) {
        toast.error('Warning: Your name was not saved. The certificate will still be generated.');
      }

      // Handle success
      if (result.success) {
        logger.info('Certificate generated successfully', { credentialId: result.credentialId });
        
        setGeneratedUrl(result.certificateUrl);
        toast.success('Certificate generated successfully!');
        
        // Handle onSuccess callback - await if it returns a promise
        if (onSuccessRef.current) {
          try {
            await Promise.resolve(onSuccessRef.current({
              certificateUrl: result.certificateUrl,
              credentialId: result.credentialId,
              courseName,
              courseType,
              courseId
            }));
          } catch (callbackError) {
            // Log callback errors but don't fail the certificate generation
            logger.error(
              'Error in onSuccess callback',
              callbackError instanceof Error ? callbackError : new Error(String(callbackError))
            );
          }
        }
        
        return;
      }
      
      // Handle error response
      const errorObj = new Error(result.error);
      logger.error('Certificate generation failed', errorObj);
      toast.error(result.error);
      
      callSafeOnError(onErrorRef.current, errorObj, logger);
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error generating certificate', errorObj);
      toast.error(error instanceof Error ? error.message : 'An error occurred while generating the certificate');
      
      callSafeOnError(onErrorRef.current, errorObj, logger);
    } finally {
      // Only reset isGenerating if we actually started the operation and it wasn't aborted
      // This prevents leaving the component in a generating state indefinitely
      if (asyncOperationStarted && !abortController.signal.aborted) {
        setIsGenerating(false);
      }
    }
  }, [fullName, pendingData, userId, userEmail, validateAndSet]);

  /**
   * Download the generated certificate
   */
  const downloadGeneratedCertificate = useCallback(async (): Promise<void> => {
    if (!generatedUrl || !pendingData?.courseName) return;
    
    try {
      await downloadCertificate(generatedUrl, pendingData.courseName);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error downloading certificate', errorObj);
      toast.error('Failed to download certificate');
    }
  }, [generatedUrl, pendingData]);

  return {
    // State
    showModal,
    fullName,
    isGenerating,
    isLoadingName,
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
