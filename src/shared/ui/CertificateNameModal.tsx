import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, Clock, Download, Eye, X, Edit3 } from 'lucide-react';
import { Button } from '@/shared/ui';

/**
 * CertificateNameModal - Pure Presentational UI Component
 * 
 * FSD Layer: shared/ui ✅
 * 
 * This is a PURE presentational component with NO business logic:
 * - No API calls
 * - No direct state management
 * - No feature-specific business rules
 * - Only UI rendering and callback invocation
 * 
 * All business logic is handled by the consuming feature via props:
 * - Certificate generation → @/features/certificate-generation
 * - State management → useCertificateModal hook
 * - API calls → certificateService
 * 
 * This component is fully controlled by parent props and only handles:
 * 1. Rendering modal UI states
 * 2. Form input handling (name input)
 * 3. Calling parent-provided callbacks
 * 
 * Prop Validation: TypeScript interface provides compile-time validation.
 * Optional props have safe defaults in component implementation.
 */

export interface CertificateNameModalProps {
  // Required props - modal control
  isOpen: boolean;
  onClose: () => void;
  
  // Required props - name handling
  fullName: string;
  onFullNameChange: (name: string) => void;
  onConfirm: () => void;
  onGenerate: () => void;
  
  // Optional props - state flags (have safe defaults)
  isGenerating?: boolean;           // Default: false
  showConfirmation?: boolean;       // Default: false
  
  // Optional props - error and result handling
  validationError?: string;         // Default: '' (empty)
  generatedCertificateUrl?: string | null;  // Default: null
  
  // Required props - action callbacks
  onCancelConfirmation: () => void;
  onView: () => void;
  onDownload: () => void;
}

/**
 * Reusable Certificate Name Modal Component
 * 
 * Handles safe defaults for optional props internally
 */
export const CertificateNameModal = ({
  isOpen,
  onClose,
  fullName,
  onFullNameChange,
  onConfirm,
  onGenerate,
  isGenerating = false,              // ✅ Default: false
  showConfirmation = false,          // ✅ Default: false
  onCancelConfirmation,
  validationError = '',              // ✅ Default: empty string
  generatedCertificateUrl = null,    // ✅ Default: null
  onView,
  onDownload,
}: CertificateNameModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!fullName.trim()) return;
    onConfirm();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating && fullName.trim() && !showConfirmation) {
      handleConfirm();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {!generatedCertificateUrl ? (
            !showConfirmation ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Certificate Name
                    </h3>
                  </div>
                  {!isGenerating && (
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Please enter your full name as you want it to appear on your certificate.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => onFullNameChange(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isGenerating}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        validationError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                    {validationError && (
                      <p className="mt-1 text-sm text-red-600">{validationError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={onClose}
                      variant="outline"
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isGenerating || !fullName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg"
                    >
                      <Award className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Confirm Your Name
                      </h3>
                      <p className="text-xs text-amber-600 font-medium">⚠️ This cannot be changed later</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-700 font-medium mb-4">
                    Please carefully review your name. This is exactly how it will appear on your official certificate.
                  </p>
                  
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl blur opacity-20 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                            Certificate Recipient
                          </p>
                          <p className="text-2xl font-bold text-gray-900 break-words leading-tight uppercase">
                            {fullName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <div className="flex gap-2">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-amber-800 font-medium">
                          <strong>Important:</strong> Make sure your name is spelled correctly. Once generated, the certificate cannot be modified.
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Note: Your name will be converted to <strong>UPPERCASE</strong> when printed on the certificate.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={onCancelConfirmation}
                    variant="outline"
                    disabled={isGenerating}
                    className="flex-1 border-2 hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Name
                  </Button>
                  <motion.div 
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={onGenerate}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Confirm & Generate
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </>
            )
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Certificate Generated!
                </h3>
                <p className="text-gray-600">
                  Your certificate has been generated successfully.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={onView}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Certificate</span>
                </button>
                
                <button
                  onClick={onDownload}
                  className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Certificate</span>
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
