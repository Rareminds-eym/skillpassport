import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/model';

import Header from '@/features/recruiter-pipeline/ui/Header';
import Sidebar from '@/features/recruiter-pipeline/ui/Sidebar';
import MobileTabBar from '@/features/recruiter-pipeline/ui/MobileTabBar';
import FloatingRecruiterAIButton from '@/shared/ui/FloatingRecruiterAIButton';
const CandidateProfileDrawer = React.lazy(() => import('@/features/recruiter-pipeline/ui/CandidateProfileDrawer'));
import { useResponsive } from '@/shared/lib/hooks';
import { Candidate } from '@/entities/recruiter';
import { useUnreadMessagesCount } from '@/features/messaging';

import { useUser } from '@/shared/model/authStore';
const RecruiterLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { isMobile } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get unread messages count for sidebar badge
  const { unreadCount } = useUnreadMessagesCount(user?.id);

  const handleMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleMoreMenuToggle = () => {
    setShowMobileMoreMenu(!showMobileMoreMenu);
  };

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
        {/* Header */}
        <Header
        onMenuToggle={handleMenuToggle} 
        showMobileMenu={showMobileMenu}
      />

      <div className="flex h-screen pt-0">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showMobileMenu={showMobileMenu}
          unreadMessagesCount={unreadCount}
        />

        {/* Main Content */}
        <div className={`flex-1 overflow-auto flex flex-col ${isMobile ? 'pb-20' : 'md:ml-64'}`}>
          <div className="flex-1">
            <Outlet context={{ onViewProfile: handleViewProfile }} />
          </div>
          {!isMobile && (
            <footer className="bg-white border-t border-gray-200 py-4 px-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>© {new Date().getFullYear()} Recruiter Portal. All rights reserved.</span>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-gray-700 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-gray-700 transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-gray-700 transition-colors">Help</a>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      {isMobile && (
        <MobileTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onMoreMenuToggle={handleMoreMenuToggle}
        />
      )}

      {/* Candidate Profile Drawer */}
      <React.Suspense fallback={null}>
        <CandidateProfileDrawer
          candidate={selectedCandidate}
          isOpen={showCandidateDrawer}
          onClose={handleCloseCandidateDrawer}
        />
      </React.Suspense>

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}
      
      {/* Floating AI Button */}
      <FloatingRecruiterAIButton />
      </div>
  );
};

export default RecruiterLayout;
