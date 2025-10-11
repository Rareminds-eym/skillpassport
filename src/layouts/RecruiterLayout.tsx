import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/Recruiter/components/Header';
import Sidebar from '../components/Recruiter/components/Sidebar';
import MobileTabBar from '../components/Recruiter/components/MobileTabBar';
import CandidateProfileDrawer from '../components/Recruiter/components/CandidateProfileDrawer';
import { useResponsive } from '../hooks/useresponsive';
import { Candidate } from '../types/recruiter';

const RecruiterLayout = () => {
  const { isMobile } = useResponsive();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateDrawer, setShowCandidateDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

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

      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showMobileMenu={showMobileMenu}
        />

        {/* Main Content */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pb-20' : 'md:ml-64'}`}>
          <Outlet context={{ onViewProfile: handleViewProfile }} />
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
    </div>
  );
};

export default RecruiterLayout;
