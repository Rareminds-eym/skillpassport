import { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useUser } from '@/shared/model/authStore';
import { useLearnerDashboard, LearnerTypeSelectionModal } from '@/features/learner-profile';
import { Header, ProfileHeroEdit } from '@/widgets/learner-dashboard';
import { FloatingAIButton } from '@/features/career-assistant';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '@/features/learner-profile';

// Route patterns for page detection
const ROUTE_PATTERNS = {
  training: '/my-learning',
  courses: '/courses',
  portfolio: '/digital-portfolio',
  opportunities: '/opportunities',
  careerAI: '/career-ai',
  assignments: ['/assignments', '/my-class'],
  messages: '/messages',
  skills: '/my-skills',
  experience: '/my-experience',
  applications: '/applications',
  profile: '/profile',
  savedJobs: '/saved-jobs',
  settings: '/settings',
  dashboard: ['/learner/dashboard', '/learner', '/learner/']
};

// Helper function to get active tab from pathname
const getActiveTabFromPath = (pathname) => {
  for (const [tab, patterns] of Object.entries(ROUTE_PATTERNS)) {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    if (patternArray.some(pattern => pathname.includes(pattern))) {
      return tab;
    }
  }
  return 'dashboard';
};

// Helper function to check if page is assessment
const isAssessmentPage = (pathname) => {
  const assessmentPaths = [
    '/learner/assessment/platform',
    '/learner/assessment/start',
    '/learner/assessment/result',
    '/learner/assessment/test',
    '/learner/assessment-report',
    '/learner/assessment/dynamic',
    '/learner/adaptive-aptitude-test',
    '/learner/assessment/results'
  ];
  return assessmentPaths.some(path => pathname.includes(path));
};

const LearnerLayout = () => {
  const location = useLocation();
  const user = useUser();
  const [activeModal, setActiveModal] = useState(null);
  const [showLearnerTypeModal, setShowLearnerTypeModal] = useState(false);

  // Fetch learner data using backend API
  const {
    profile: learnerData,
    loading: learnerLoading,
    refresh: refreshLearnerData,
  } = useLearnerDashboard({ enabled: true });

  // Check if learner_type is empty or null
  useEffect(() => {
    if (!learnerLoading && learnerData) {
      const learnerType = learnerData?.learner_type || learnerData?.rawData?.learner_type;
      if (!learnerType || learnerType === '' || learnerType === null) {
        setShowLearnerTypeModal(true);
      }
    }
  }, [learnerData, learnerLoading]);

  // Handle successful learner type selection
  const handleLearnerTypeSuccess = useCallback(() => {
    setShowLearnerTypeModal(false);
    refreshLearnerData();
  }, [refreshLearnerData]);

  // Memoize page detection and active tab
  const pageState = useMemo(() => ({
    isViewingOthersProfile: location.pathname.includes('/learner/profile/'),
    isDashboardPage: location.pathname === '/learner/dashboard' || location.pathname === '/learner' || location.pathname === '/learner/',
    isCareerAIPage: location.pathname.includes('/career-ai'),
    isAssessmentPage: isAssessmentPage(location.pathname),
    isAssessmentTestPage: ['/learner/assessment/test', '/learner/assessment-report', '/learner/assessment/start', '/learner/assessment/platform', '/learner/assessment/dynamic', '/learner/adaptive-aptitude-test'].some(path => location.pathname.includes(path)),
    isAssessmentResultPage: location.pathname.includes('/learner/assessment/result'),
    activeTab: getActiveTabFromPath(location.pathname)
  }), [location.pathname]);

  // Memoize full screen assessment check
  const isFullScreenAssessment = useMemo(() =>
    pageState.isAssessmentPage && !pageState.isAssessmentResultPage,
    [pageState.isAssessmentPage, pageState.isAssessmentResultPage]
  );

  // Memoize user data from learner profile
  const userData = useMemo(() => ({
    education: learnerData?.education || [],
    training: learnerData?.training || learnerData?.trainings || [],
    experience: learnerData?.experience || [],
    technicalSkills: learnerData?.technicalSkills || [],
    softSkills: learnerData?.softSkills || []
  }), [learnerData]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Handle edit click - open modal
  const handleEditClick = useCallback((sectionId) => {
    if (sectionId !== 'profile') {
      setActiveModal(sectionId);
    }
  }, []);

  return (
    <div className={`${pageState.isCareerAIPage || isFullScreenAssessment ? "h-screen bg-gray-50 flex flex-col" : "min-h-screen bg-gray-50 flex flex-col"}`}>
      {!pageState.isAssessmentTestPage && <Header activeTab={pageState.activeTab} />}
      {!pageState.isViewingOthersProfile && pageState.isDashboardPage && (
        <ProfileHeroEdit
          onEditClick={handleEditClick}
          learnerData={learnerData}
          loading={learnerLoading}
        />
      )}

      <main className={pageState.isCareerAIPage ? "flex-1 overflow-hidden" : ""}>
        <Outlet context={{ activeTab: pageState.activeTab, userData }} />
      </main>

      {!pageState.isCareerAIPage && (
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>© {new Date().getFullYear()} Learner Portal. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
              <a href="#" className="hover:text-gray-700 transition-colors">Help</a>
            </div>
          </div>
        </footer>
      )}

      {!pageState.isAssessmentTestPage && <FloatingAIButton />}

      {/* Edit Modals - Only show if not viewing someone else's profile */}
      {!pageState.isViewingOthersProfile && (
        <>
          <EducationEditModal
            isOpen={activeModal === 'education'}
            onClose={handleModalClose}
            data={userData.education}
          />

          <TrainingEditModal
            isOpen={activeModal === 'training'}
            onClose={handleModalClose}
            data={userData.training}
          />

          <ExperienceEditModal
            isOpen={activeModal === 'experience'}
            onClose={handleModalClose}
            data={userData.experience}
          />

          <SkillsEditModal
            isOpen={activeModal === 'softSkills'}
            onClose={handleModalClose}
            data={userData.softSkills}
            title="Soft Skills"
            type="Skill"
          />

          <SkillsEditModal
            isOpen={activeModal === 'technicalSkills'}
            onClose={handleModalClose}
            data={userData.technicalSkills}
            title="Technical Skills"
            type="Skill"
          />
        </>
      )}

      {/* Learner Type Selection Modal */}
      {showLearnerTypeModal && learnerData?.id && (
        <LearnerTypeSelectionModal
          isOpen={showLearnerTypeModal}
          learnerId={learnerData.id}
          onSuccess={handleLearnerTypeSuccess}
        />
      )}
    </div>
  );
};

export default LearnerLayout;