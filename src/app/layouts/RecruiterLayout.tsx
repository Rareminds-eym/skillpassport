import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import Header from '@/features/recruiter-pipeline/ui/Header';
import Sidebar from '@/features/recruiter-pipeline/ui/Sidebar';
import MobileTabBar from '@/features/recruiter-pipeline/ui/MobileTabBar';
const CandidateProfileDrawer = React.lazy(() => import('@/features/recruiter-pipeline/ui/CandidateProfileDrawer'));
import { Candidate } from '@/entities/recruiter';
import { useUnreadMessagesCount } from '@/features/messaging';

import { useUser } from '@/shared/model/authStore';
const RecruiterLayout: React.FC = () => {
  const location = useLocation();
  const user = useUser();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get unread messages count for sidebar badge
  const { unreadCount } = useUnreadMessagesCount(user?.id);

  const handleMenuToggle = () => {
    setShowMobileMenu(open => !open);
  };

  const handleMoreMenuToggle = () => {
    setShowMobileMenu(open => !open);
  };

  useEffect(() => { setShowMobileMenu(false); }, [location.pathname, location.search]);

  // The marketing support widget overlaps the workspace's mobile navigation.
  useEffect(() => {
    const alreadyHidden = document.body.classList.contains('hide-zoho-widget');
    document.body.classList.add('hide-zoho-widget');
    return () => { if (!alreadyHidden) document.body.classList.remove('hide-zoho-widget'); };
  }, []);

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDrawer(true);
  };

  const handleCloseCandidateDrawer = () => {
    setShowCandidateDrawer(false);
    setSelectedCandidate(null);
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <a href="#recruiter-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-primary-700 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        {/* Header */}
        <Header
        onMenuToggle={handleMenuToggle} 
        showMobileMenu={showMobileMenu}
      />

      <div className="flex min-h-[calc(100dvh-4rem)]">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showMobileMenu={showMobileMenu}
          unreadMessagesCount={unreadCount}
          onClose={() => setShowMobileMenu(false)}
        />

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:ml-64 md:pb-0">
          <main id="recruiter-main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
            <Outlet context={{ onViewProfile: handleViewProfile }} />
          </main>
            <footer className="hidden border-t border-gray-200 bg-white px-6 py-4 md:block">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <span>© {new Date().getFullYear()} Recruiter Portal. All rights reserved.</span>
                <div className="flex items-center gap-4">
                  <Link to="/privacy-policy" className="rounded py-2 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary-500">Privacy Policy</Link>
                  <Link to="/terms" className="rounded py-2 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary-500">Terms of Service</Link>
                  <Link to="/contact" className="rounded py-2 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary-500">Help</Link>
                </div>
              </div>
            </footer>
        </div>
      </div>

      {/* Mobile Tab Bar */}
        <MobileTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMoreMenuToggle={handleMoreMenuToggle}
          showMoreMenu={showMobileMenu}
        />

      {/* Candidate Profile Drawer */}
      <React.Suspense fallback={null}>
        <CandidateProfileDrawer
          candidate={selectedCandidate}
          isOpen={showCandidateDrawer}
          onClose={handleCloseCandidateDrawer}
        />
      </React.Suspense>

      </div>
  );
};

export default RecruiterLayout;
