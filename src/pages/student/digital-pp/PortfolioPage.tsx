import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Maximize, Minimize } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { exportAsPDF, exportAsHTML } from '../../utils/exportppUtils';
import ModernLayout from '../../components/digital-pp/portfolio/layouts/ModernLayout';
import CreativeLayout from '../../components/digital-pp/portfolio/layouts/CreativeLayout';
import SplitScreenLayout from '../../components/digital-pp/portfolio/layouts/SplitScreenLayout';
import AIPersonaLayout from '../../components/digital-pp/portfolio/layouts/AIPersonaLayout';
import InfographicDashboard from '../../components/digital-pp/portfolio/layouts/InfographicDashboard';
import CompactResumeDashboard from '../../components/digital-pp/portfolio/layouts/CompactResumeDashboard';
import JourneyMapLayout from '../../components/digital-pp/portfolio/layouts/JourneyMapLayout';

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { student, settings, isLoading } = usePortfolio();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  console.log('PortfolioPage rendering...', { student, settings, isLoading });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle pending export from settings page
  useEffect(() => {
    const handlePendingExport = async () => {
      const pendingExport = sessionStorage.getItem('pendingExport');
      if (pendingExport) {
        try {
          const { type, filename } = JSON.parse(pendingExport);
          
          // Small delay to ensure DOM is fully rendered
          setTimeout(async () => {
            try {
              // Enter fullscreen mode
              await document.documentElement.requestFullscreen().catch(() => {
                console.warn('Fullscreen not available');
              });
              setIsFullscreen(true);
              
              // Additional delay for fullscreen to apply
              setTimeout(async () => {
                // Find the layout content container - use the main content div
                const layoutContent = document.querySelector('[data-portfolio-content]') || 
                                    document.querySelector('.pt-20') ||
                                    document.documentElement;
                
                if (type === 'HTML') {
                  await exportAsHTML(layoutContent as HTMLElement, filename);
                } else if (type === 'PDF') {
                  await exportAsPDF(layoutContent as HTMLElement, filename);
                }
                
                // Clean up
                sessionStorage.removeItem('pendingExport');
              }, 500);
            } catch (error) {
              console.error('Export error:', error);
              sessionStorage.removeItem('pendingExport');
            }
          }, 100);
        } catch (error) {
          console.error('Error parsing pending export:', error);
          sessionStorage.removeItem('pendingExport');
        }
      }
    };

    handlePendingExport();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Student Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to load your profile data. This may happen if:
          </p>
          <ul className="text-left text-sm text-gray-500 dark:text-gray-400 space-y-2 mb-6">
            <li>• You're not logged in as a student</li>
            <li>• Your profile hasn't been created yet</li>
            <li>• There's a connection issue</li>
          </ul>
          <div className="space-y-2">
            <Link 
              to="/student/profile" 
              className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Profile
            </Link>
            <Link 
              to="/student/dashboard" 
              className="block px-4 py-2 text-blue-600 hover:underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderLayout = () => {
    const layoutProps = {
      student,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      animation: settings.animation,
      displayPreferences: settings.displayPreferences,
    };

    switch (settings.layout) {
      case 'modern':
        return <ModernLayout {...layoutProps} />;
      case 'creative':
        return <CreativeLayout {...layoutProps} />;
      case 'splitscreen':
        return <SplitScreenLayout {...layoutProps} />;
      case 'aipersona':
        return <AIPersonaLayout {...layoutProps} />;
      case 'infographic':
        return <InfographicDashboard {...layoutProps} />;
      case 'resume':
        return <CompactResumeDashboard {...layoutProps} />;
      case 'journey':
        return <JourneyMapLayout {...layoutProps} />;
      default:
        // Default to Infographic Dashboard for students
        return <InfographicDashboard {...layoutProps} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Mode</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFullscreen}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 mr-2" />
                    Fullscreen
                  </>
                )}
              </button>
              <Link 
                to="/student/digital-portfolio/settings/layout" 
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </span>
                <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Content with top padding for fixed header */}
      <div className="pt-20">
        {renderLayout()}
      </div>
    </div>
  );
};

export default PortfolioPage;