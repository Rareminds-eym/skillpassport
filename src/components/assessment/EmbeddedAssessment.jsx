import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, Loader2 } from 'lucide-react';

/**
 * Embedded Assessment Component
 * Integrates the RM_Assessment platform into the main application
 * Uses iframe to embed the assessment without authentication conflicts
 */
const EmbeddedAssessment = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessmentUrl, setAssessmentUrl] = useState('');

  useEffect(() => {
    // Set the assessment platform URL
    // In production, this would be the deployed URL of RM_Assessment
    // For development, it could be localhost:5174 or similar
    const baseUrl = import.meta.env.VITE_ASSESSMENT_URL || 'http://localhost:5174';
    
    // Pass user data as query parameters to pre-fill information
    const params = new URLSearchParams({
      userId: user?.id || '',
      email: user?.email || '',
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
      source: 'skillpassport',
      embedded: 'true'
    });

    setAssessmentUrl(`${baseUrl}?${params.toString()}`);
  }, [user]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Listen for messages from the iframe (assessment completion, navigation, etc.)
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify origin for security
      const allowedOrigins = [
        'http://localhost:5174',
        import.meta.env.VITE_ASSESSMENT_URL
      ].filter(Boolean);

      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case 'ASSESSMENT_COMPLETE':
          // Handle assessment completion
          console.log('Assessment completed:', data);
          // You can save results, show success message, etc.
          if (onClose) {
            onClose(data);
          } else {
            navigate('/student/dashboard', { 
              state: { 
                assessmentCompleted: true,
                results: data 
              } 
            });
          }
          break;

        case 'ASSESSMENT_EXIT':
          // Handle user exiting assessment
          if (onClose) {
            onClose();
          } else {
            navigate(-1);
          }
          break;

        case 'ASSESSMENT_ERROR':
          // Handle errors
          console.error('Assessment error:', data);
          break;

        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, onClose]);

  const handleClose = () => {
    if (window.confirm('Are you sure you want to exit the assessment? Your progress may not be saved.')) {
      if (onClose) {
        onClose();
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header with Close Button */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <img 
              src="/assets/HomePage/RMLogo.webp" 
              alt="RareMinds" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Assessment Platform</h1>
            <p className="text-blue-100 text-xs">Powered by RareMinds</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
          title="Exit Assessment"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white z-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading Assessment Platform...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we prepare your test</p>
          </div>
        </div>
      )}

      {/* Assessment Iframe */}
      <iframe
        src={assessmentUrl}
        className="w-full h-full border-0"
        style={{ marginTop: '64px', height: 'calc(100vh - 64px)' }}
        title="Assessment Platform"
        onLoad={handleIframeLoad}
        allow="camera; microphone; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default EmbeddedAssessment;
