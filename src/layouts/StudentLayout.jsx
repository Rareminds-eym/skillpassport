import { useState, useEffect } from 'react';
import { Outlet, useParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentDataByEmail } from '../hooks/useStudentDataByEmail';
import { GlobalPresenceProvider } from '../context/GlobalPresenceContext';
import Header from '../components/Students/components/Header';
import ProfileHeroEdit from '../components/Students/components/ProfileHeroEdit';
import FloatingAIButton from '../components/FloatingAIButton';
import { Toaster } from '../components/Students/components/ui/toaster';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal,
} from '../components/Students/components/ProfileEditModals';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills,
} from '../components/Students/data/mockData';

// Helper function to get active tab from pathname
const getActiveTabFromPath = (pathname) => {
  if (pathname.includes('/my-learning')) return 'training';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/digital-portfolio')) return 'digital-portfolio';
  if (pathname.includes('/opportunities')) return 'opportunities';
  if (pathname.includes('/career-ai')) return 'career-ai';
  if (pathname.includes('/assignments') || pathname.includes('/my-class')) return 'assignments';
  if (pathname.includes('/messages')) return 'messages';
  if (pathname.includes('/my-skills')) return 'skills';
  if (pathname.includes('/my-experience')) return 'experience';
  if (pathname.includes('/applications')) return 'applications';
  if (pathname.includes('/profile')) return 'profile';
  if (pathname.includes('/saved-jobs')) return 'saved-jobs';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/dashboard') || pathname === '/student' || pathname === '/student/')
    return 'dashboard';
  return 'dashboard';
};

const StudentLayout = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(location.pathname));
  const [activeModal, setActiveModal] = useState(null);
  const { user } = useAuth();

  // Sync activeTab with current route
  useEffect(() => {
    const tabFromPath = getActiveTabFromPath(location.pathname);
    setActiveTab(tabFromPath);
  }, [location.pathname]);

  // Check if viewing someone else's profile
  const isViewingOthersProfile = location.pathname.includes('/student/profile/');

  const [userData, setUserData] = useState({
    education: educationData,
    training: trainingData,
    experience: experienceData,
    technicalSkills: technicalSkills,
    softSkills: softSkills,
  });

  const handleSave = (section, data) => {
    setUserData((prev) => ({
      ...prev,
      [section]: data,
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
  const isDashboardPage =
    location.pathname === '/student/dashboard' ||
    location.pathname === '/student' ||
    location.pathname === '/student/';

  // Check if current page is Career AI
  const isCareerAIPage =
    location.pathname === '/student/career-ai' || location.pathname.includes('/career-ai');

  // Check if current page is Assessment (should be full-screen without padding)
  const isAssessmentPage =
    location.pathname.includes('/assessment/platform') ||
    location.pathname.includes('/assessment/start') ||
    location.pathname.includes('/assessment/result');

  // Assessment result page needs scrolling, unlike test/platform pages
  const isAssessmentResultPage = location.pathname.includes('/assessment/result');
  const isFullScreenAssessment = isAssessmentPage && !isAssessmentResultPage;

  return (
    <GlobalPresenceProvider userType="student">
      <div
        className={
          isCareerAIPage || isFullScreenAssessment
            ? 'h-screen bg-gray-50 flex flex-col'
            : 'min-h-screen bg-gray-50 flex flex-col'
        }
      >
        {!isAssessmentPage && <Header activeTab={activeTab} setActiveTab={setActiveTab} />}
        {!isViewingOthersProfile && isDashboardPage && (
          <ProfileHeroEdit onEditClick={handleEditClick} />
        )}
        <main className={isCareerAIPage ? 'flex-1 overflow-hidden' : ''}>
          <Outlet context={{ activeTab, userData, handleSave, setActiveModal }} />
        </main>
        {!isCareerAIPage && !isAssessmentPage && (
          <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>© {new Date().getFullYear()} Student Portal. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <Link to="/privacy-policy" className="hover:text-gray-700 transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-gray-700 transition-colors">
                  Terms of Service
                </Link>
                <a href="#" className="hover:text-gray-700 transition-colors">
                  Help
                </a>
              </div>
            </div>
          </footer>
        )}
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
