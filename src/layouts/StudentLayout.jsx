import { useState } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentDataByEmail } from '../hooks/useStudentDataByEmail';
import { GlobalPresenceProvider } from '../context/GlobalPresenceContext';
import Header from '../components/Students/components/Header';
import ProfileHeroEdit from '../components/Students/components/ProfileHeroEdit';
import Footer from '../components/Students/components/Footer';
import FloatingAIButton from '../components/FloatingAIButton';
import { Toaster } from '../components/Students/components/ui/toaster';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '../components/Students/components/ProfileEditModals';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../components/Students/data/mockData';

const StudentLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if viewing someone else's profile
  const isViewingOthersProfile = location.pathname.includes('/student/profile/');
  
  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills
  });

  const handleSave = (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const handleEditClick = (sectionId) => {
    if (sectionId === 'profile') {
      // Navigate to profile edit or handle profile editing
      setActiveTab('profile');
    } else {
      // Open specific modal
      setActiveModal(sectionId);
    }
  };

  // Check if current page is dashboard
  const isDashboardPage = location.pathname === '/student/dashboard' || location.pathname === '/student' || location.pathname === '/student/';
  
  // Check if current page is Career AI
  const isCareerAIPage = location.pathname === '/student/career-ai' || location.pathname.includes('/career-ai');
  
  // Check if current page is Assessment (should be full-screen without padding)
  const isAssessmentPage = location.pathname.includes('/assessment/platform') || location.pathname.includes('/assessment/start') || location.pathname.includes('/assessment/result');
  
  // Assessment result page needs scrolling, unlike test/platform pages
  const isAssessmentResultPage = location.pathname.includes('/assessment/result');
  const isFullScreenAssessment = isAssessmentPage && !isAssessmentResultPage;

  return (
    <GlobalPresenceProvider userType="student">
      <div className={isCareerAIPage || isFullScreenAssessment ? "h-screen bg-gray-50 flex flex-col" : "min-h-screen bg-gray-50 flex flex-col"}>
        {!isAssessmentPage && <Header activeTab={activeTab} setActiveTab={setActiveTab} />}
        {!isViewingOthersProfile && isDashboardPage && <ProfileHeroEdit onEditClick={handleEditClick} />}
        <main className={isCareerAIPage || isFullScreenAssessment ? "flex-1 overflow-hidden" : isAssessmentResultPage ? "flex-1 overflow-auto" : "py-8 px-6"}>
          <Outlet context={{ activeTab, userData, handleSave, setActiveModal }} />
        </main>
        {!isCareerAIPage && !isAssessmentPage && <Footer />}
        {!isAssessmentPage && <FloatingAIButton />}
        <Toaster />

      {/* Edit Modals - Only show if not viewing someone else's profile */}
      {!isViewingOthersProfile && (
        <>
          <EducationEditModal
            isOpen={activeModal === 'education'}
            onClose={() => setActiveModal(null)}
            data={userData.education}
            onSave={(data) => handleSave('education', data)}
          />

          <TrainingEditModal
            isOpen={activeModal === 'training'}
            onClose={() => setActiveModal(null)}
            data={userData.training}
            onSave={(data) => handleSave('training', data)}
          />

          <ExperienceEditModal
            isOpen={activeModal === 'experience'}
            onClose={() => setActiveModal(null)}
            data={userData.experience}
            onSave={(data) => handleSave('experience', data)}
          />

          <SkillsEditModal
            isOpen={activeModal === 'softSkills'}
            onClose={() => setActiveModal(null)}
            data={userData.softSkills}
            title="Soft Skills"
            type="Skill"
            onSave={(data) => handleSave('softSkills', data)}
          />

          <SkillsEditModal
            isOpen={activeModal === 'technicalSkills'}
            onClose={() => setActiveModal(null)}
            data={userData.technicalSkills}
            title="Technical Skills"
            type="Skill"
            onSave={(data) => handleSave('technicalSkills', data)}
          />
        </>
      )}
      </div>
    </GlobalPresenceProvider>
  );
};

export default StudentLayout;
