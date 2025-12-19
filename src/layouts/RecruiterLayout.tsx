import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlobalPresenceProvider } from '../context/GlobalPresenceContext';
import Header from '../components/Recruiter/components/Header';
import Sidebar from '../components/Recruiter/components/Sidebar';
import MobileTabBar from '../components/Recruiter/components/MobileTabBar';
import CandidateProfileDrawer from '../components/Recruiter/components/CandidateProfileDrawer';
import FloatingRecruiterAIButton from '../components/FloatingRecruiterAIButton';
import { useResponsive } from '../hooks/useresponsive';
import { Candidate } from '../types/recruiter';
import { useUnreadMessagesCount } from '../hooks/useUnreadMessagesCount';

const RecruiterLayout = () => {
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
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
    <GlobalPresenceProvider userType="recruiter">
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
      <CandidateProfileDrawer
        candidate={selectedCandidate}
        isOpen={showCandidateDrawer}
        onClose={handleCloseCandidateDrawer}
      />

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
    </GlobalPresenceProvider>
  );
};

export default RecruiterLayout;
