import { useState, useMemo, useCallback, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useUser } from '../stores';
import { useStudentData } from '../hooks/useStudentData';
import Header from '../components/Students/components/Header';
import ProfileHeroEdit from '../components/Students/components/ProfileHeroEdit';
import FloatingAIButton from '../components/FloatingAIButton';
import { Toaster } from '../components/Students/components/ui/toaster';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from '../components/Students/components/ProfileEditModals';

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
  dashboard: ['/student/dashboard', '/student', '/student/']
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
  const assessmentPaths = ['/assessment/platform', '/assessment/start', '/assessment/result', '/assessment/test', '/assessment-report'];
  return assessmentPaths.some(path => pathname.includes(path));
};

const StudentLayout = () => {
  const location = useLocation();
  const user = useUser();
  const [activeModal, setActiveModal] = useState(null);

  // Get real student data from state management
  const {
    student,
    education,
    experience,
    projects,
    trainings,
    skills,
    isLoading
  } = useStudentData({ loadRelated: true });

  // Memoize active tab calculation
  const activeTab = useMemo(() => getActiveTabFromPath(location.pathname), [location.pathname]);

  // Memoize page detection
  const pageState = useMemo(() => ({
    isViewingOthersProfile: location.pathname.includes('/student/profile/'),
    isDashboardPage: location.pathname === '/student/dashboard' || location.pathname === '/student' || location.pathname === '/student/',
    isCareerAIPage: location.pathname.includes('/career-ai'),
    isAssessmentPage: isAssessmentPage(location.pathname),
    isAssessmentTestPage: ['/assessment/test', '/assessment-report', '/assessment/start', '/assessment/platform'].some(path => location.pathname.includes(path)),
    isAssessmentResultPage: location.pathname.includes('/assessment/result')
  }), [location.pathname]);

  // Memoize full screen assessment check
  const isFullScreenAssessment = useMemo(() =>
    pageState.isAssessmentPage && !pageState.isAssessmentResultPage,
    [pageState.isAssessmentPage, pageState.isAssessmentResultPage]
  );

  // Memoize user data from real sources
  const userData = useMemo(() => ({
    education: education || [],
    training: trainings || [],
    experience: experience || [],
    technicalSkills: skills?.filter(s => s.type === 'technical') || [],
    softSkills: skills?.filter(s => s.type === 'soft') || []
  }), [education, trainings, experience, skills]);

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
      {!pageState.isAssessmentTestPage && <Header activeTab={activeTab} setActiveTab={() => { }} />}
      {!pageState.isViewingOthersProfile && pageState.isDashboardPage && <ProfileHeroEdit onEditClick={handleEditClick} />}

      <main className={pageState.isCareerAIPage ? "flex-1 overflow-hidden" : ""}>
        <Outlet context={{ activeTab, userData }} />
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
      <Toaster />
    </div>
  );
};

export default StudentLayout;
