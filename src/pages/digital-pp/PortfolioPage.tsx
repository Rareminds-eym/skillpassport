import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AIPersonaLayout from '../../components/digital-pp/portfolio/layouts/AIPersonaLayout';
import CompactResumeDashboard from '../../components/digital-pp/portfolio/layouts/CompactResumeDashboard';
import CreativeLayout from '../../components/digital-pp/portfolio/layouts/CreativeLayout';
import InfographicDashboard from '../../components/digital-pp/portfolio/layouts/InfographicDashboard';
import JourneyMapLayout from '../../components/digital-pp/portfolio/layouts/JourneyMapLayout';
import ModernLayout from '../../components/digital-pp/portfolio/layouts/ModernLayout';
import SplitScreenLayout from '../../components/digital-pp/portfolio/layouts/SplitScreenLayout';
import { usePortfolio } from '../../context/PortfolioContext';
import { exportAsHTML, exportAsPDF } from '../../utils/exportppUtils';

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { student, settings, isLoading, isManuallySet, viewerRole } = usePortfolio();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // console.log('🎨 PortfolioPage rendering...', { 
  //   student: student?.name || student?.email, 
  //   currentLayout: settings.layout,
  //   viewerRole,
  //   isManuallySet,
  //   isLoading,
  //   message: `${viewerRole} using ${settings.layout} layout`
  // });

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
          const { type, filename, preferences } = JSON.parse(pendingExport);
          
          // Small delay to ensure DOM is fully rendered
          setTimeout(async () => {
            try {
              if (type === 'PDF') {
                // Enter fullscreen mode for PDF
                await document.documentElement.requestFullscreen().catch(() => {
                  console.warn('Fullscreen not available');
                });
                setIsFullscreen(true);
                
                // Additional delay for fullscreen to apply
                setTimeout(async () => {
                  const layoutContent = document.querySelector('[data-portfolio-content]') || 
                                      document.querySelector('.pt-20') ||
                                      document.documentElement;
                  
                  await exportAsPDF(layoutContent as HTMLElement, filename);
                  sessionStorage.removeItem('pendingExport');
                  
                  // Exit fullscreen after export
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }, 500);
              } else if (type === 'HTML') {
                // For HTML, we don't need fullscreen - just wait for render
                setTimeout(async () => {
                  if (!student || !settings) {
                    throw new Error('Student or settings data not available');
                  }
                  
                  await exportAsHTML(student, settings, preferences, filename);
                  sessionStorage.removeItem('pendingExport');
                  
                  // Navigate back to export settings
                  navigate('/settings/export');
                }, 300);
              }
            } catch (error) {
              console.error('Export error:', error);
              sessionStorage.removeItem('pendingExport');
              alert('Export failed. Please try again.');
            }
          }, 100);
        } catch (error) {
          console.error('Error parsing pending export:', error);
          sessionStorage.removeItem('pendingExport');
        }
      }
    };

    handlePendingExport();
  }, [student, settings, navigate]);

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
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No student data available</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
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

    // Use the user's selected layout (role-based defaults are handled in context)
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
        return <ModernLayout {...layoutProps} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 backdrop-blur-sm bg-opacity-90"
        >
         
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Layout Content */}
      <div>
        {renderLayout()}
      </div>
    </div>
  );
};

export default PortfolioPage;