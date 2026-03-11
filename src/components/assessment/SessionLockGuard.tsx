/**
 * Session Lock Guard Component
 * 
 * Displays session lock status and prevents assessment access when locked by another tab.
 * Provides user-friendly messaging and options to handle multi-tab scenarios.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Lock,
  RefreshCw,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../Students/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../Students/components/ui/card';
import { useAssessmentSessionLock, SessionLockState } from '../../services/assessmentSessionLock';

// =============================================================================
// TYPES
// =============================================================================

export interface SessionLockGuardProps {
  assessmentId: string;
  studentId: string;
  studentName?: string;
  enabled?: boolean;
  children: React.ReactNode;
  onLockAcquired?: () => void;
  onLockLost?: () => void;
  onLockBlocked?: (holderName: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Session Lock Guard Component
 * 
 * Wraps assessment content and manages multi-tab session locking.
 * Shows appropriate UI based on lock state.
 */
export const SessionLockGuard: React.FC<SessionLockGuardProps> = ({
  assessmentId,
  studentId,
  studentName,
  enabled = true,
  children,
  onLockAcquired,
  onLockLost,
  onLockBlocked,
}) => {
  const [showForceDialog, setShowForceDialog] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const {
    isLocked,
    isActiveTab,
    lockHolderId,
    lockHolderName,
    error,
    acquireLock,
    forceRelease,
  } = useAssessmentSessionLock({
    assessmentId,
    studentId,
    studentName,
    enabled,
    onLockAcquired: () => {
      console.log('[SessionLockGuard] Lock acquired');
      onLockAcquired?.();
    },
    onLockLost: () => {
      console.log('[SessionLockGuard] Lock lost');
      onLockLost?.();
    },
    onLockBlocked: (holderName) => {
      console.log('[SessionLockGuard] Lock blocked by:', holderName);
      onLockBlocked?.(holderName);
    },
  });

  // Debug logging
  console.log('[SessionLockGuard] State:', {
    enabled,
    assessmentId,
    studentId,
    isLocked,
    isActiveTab,
    lockHolderId,
    lockHolderName,
    error
  });

  // Test API endpoint function
  const testAPI = async () => {
    try {
      console.log('[SessionLockGuard] Testing API endpoint...');
      const response = await fetch('/api/test-session');
      const result = await response.json();
      console.log('[SessionLockGuard] Test API result:', result);
      
      // Also test the assessment session API
      const authSession = await fetch('/api/assessment-session/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'test-assessment',
          studentId: 'test-student',
          tabId: 'test-tab',
          studentName: 'Test User'
        })
      });
      console.log('[SessionLockGuard] Assessment API test status:', authSession.status);
      const authResult = await authSession.text();
      console.log('[SessionLockGuard] Assessment API test result:', authResult);
    } catch (error) {
      console.error('[SessionLockGuard] API test failed:', error);
    }
  };

  // Handle retry lock acquisition
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    const success = await acquireLock();
    if (!success) {
      // Show force dialog after 3 failed attempts
      if (retryCount >= 2) {
        setShowForceDialog(true);
      }
    }
  };

  // Handle force release
  const handleForceRelease = () => {
    forceRelease();
    setShowForceDialog(false);
    setRetryCount(0);
    // Try to acquire lock after forcing release
    setTimeout(() => acquireLock(), 1000);
  };

  // If disabled, just render children
  if (!enabled) {
    return <>{children}</>;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Session Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while acquiring lock
  if (!isLocked && !isActiveTab) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8 space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Securing Assessment Session
            </h3>
            <p className="text-gray-600">
              Please wait while we prepare your assessment environment...
            </p>
            
            {/* Debug Test Button */}
            <Button onClick={testAPI} variant="outline" size="sm">
              Test API Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show blocked state when another tab has the lock
  if (isLocked && !isActiveTab) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900">
                Assessment Already Open
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-amber-800">
                  This assessment is currently open in another browser tab or window.
                </p>
                <p className="text-sm text-amber-700">
                  Active session: <span className="font-medium">{lockHolderName || 'Another Tab'}</span>
                </p>
              </div>

              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-800 text-sm">
                    To maintain assessment integrity, only one tab can be active at a time.
                    Please close the other tab or complete the assessment there.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Again
                </Button>

                {retryCount >= 2 && (
                  <Button 
                    onClick={() => setShowForceDialog(true)}
                    variant="destructive" 
                    className="w-full"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Force Take Control
                  </Button>
                )}
              </div>

              <div className="text-xs text-amber-600 text-center space-y-1">
                <p>💡 <strong>Tip:</strong> Look for other browser windows or tabs with this assessment open.</p>
                <p>🔒 This security measure prevents accidental data loss and ensures fair assessment conditions.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Force Release Dialog */}
        {showForceDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl max-w-md p-6 mx-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold">Force Take Control?</h3>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-gray-700">
                  This will forcibly close the assessment session in the other tab and transfer 
                  control to this tab.
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Warning: Any unsaved progress in the other tab may be lost.
                </p>
                <p className="text-sm text-gray-600">
                  Only do this if you're sure the other tab is no longer needed or if you're 
                  experiencing technical difficulties.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  onClick={() => setShowForceDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleForceRelease}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Force Take Control
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show success state when we have the lock
  if (isLocked && isActiveTab) {
    return (
      <div className="relative">
        {/* Session Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Secure Session Active</span>
            </div>
          </div>
        </motion.div>

        {/* Assessment Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key="assessment-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-gray-600">Initializing session...</p>
      </div>
    </div>
  );
};

// =============================================================================
// MINI STATUS COMPONENT
// =============================================================================

export interface SessionLockStatusProps {
  lockState: SessionLockState;
  className?: string;
}

/**
 * Mini component to show session lock status in the UI
 */
export const SessionLockStatus: React.FC<SessionLockStatusProps> = ({
  lockState,
  className = '',
}) => {
  if (!lockState.isLocked) {
    return null;
  }

  const isActive = lockState.isActiveTab;
  const statusColor = isActive ? 'text-green-600' : 'text-amber-600';
  const bgColor = isActive ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200';
  const icon = isActive ? CheckCircle : Lock;
  const IconComponent = icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${bgColor} ${statusColor} ${className}`}>
      <IconComponent className="w-3 h-3" />
      <span className="font-medium">
        {isActive ? 'Active Session' : `Locked by ${lockState.lockHolderName}`}
      </span>
    </div>
  );
};