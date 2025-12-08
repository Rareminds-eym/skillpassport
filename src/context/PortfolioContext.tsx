import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, PortfolioSettings, DisplayPreferences } from '../types/student';
import { getStudentPortfolioByEmail } from '../services/portfolioService';
import { useAuth } from './AuthContext';

interface PortfolioContextType {
  student: Student | null;
  settings: PortfolioSettings;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  setStudent: (student: Student) => void;
  resetToAuthUser: () => void;
  isLoading: boolean;
  isManuallySet: boolean; // Indicates if viewing another student's portfolio
  viewerRole: string | null; // Role of the person viewing (educator, admin, etc.)
}

const defaultDisplayPreferences: DisplayPreferences = {
  showSocialLinks: true,
  showSkillBars: true,
  showProjectImages: true,
  enableAnimations: true,
  showContactForm: true,
  showDownloadResume: true,
};

const defaultSettings: PortfolioSettings = {
  layout: 'infographic',
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  animation: 'fade',
  fontSize: 16,
  displayPreferences: defaultDisplayPreferences,
};

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [student, _setStudent] = useState<Student | null>(null);
  const [settings, setSettings] = useState<PortfolioSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isManuallySet, setIsManuallySet] = useState(false); // Track if student was manually set

  const setStudent = async (studentData: Student) => {
    setIsLoading(true);
    setIsManuallySet(true); // Mark as manually set
    try {
      if (studentData.email) {
        // Use the new portfolio service to get full student data from relational tables
        const result = await getStudentPortfolioByEmail(studentData.email);

        if (result.success && result.data) {
          console.log('✅ Student portfolio data loaded via setStudent');
          _setStudent(result.data as Student);
        } else {
          console.error('❌ Error fetching student data:', result.error);
          // Fallback to passed data
          _setStudent(studentData);
        }
      } else {
        // If no email, use the passed data
        _setStudent(studentData);
      }
    } catch (error) {
      console.error('❌ Error in setStudent:', error);
      _setStudent(studentData);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🎨 PortfolioProvider render:', {
    student: student ? { 
      email: student.email, 
      name: student.name || student.profile?.name,
      hasProfile: !!student.profile,
      hasProjects: !!student.projects,
      hasSkills: !!student.skills,
      profileProjects: student.profile?.projects?.length || 0,
      directProjects: student.projects?.length || 0,
      profileSkills: student.profile?.skills?.length || 0,
      directSkills: student.skills?.length || 0
    } : null,
    isLoading,
    isManuallySet
  });

  useEffect(() => {
    // Load saved settings from localStorage
    try {
      const savedSettings = localStorage.getItem('portfolioSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error parsing saved settings:', error);
    }
  }, []);

  // Load student data when auth is ready
  useEffect(() => {
    const loadStudentData = async () => {
      // If student was manually set (e.g., educator viewing a specific student), don't override it
      if (isManuallySet) {
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Waiting for auth to load...');
        return;
      }

      // Check if user is authenticated
      if (!user?.email) {
        console.log('⚠️ No authenticated user found');
        setIsLoading(false);
        return;
      }

      // Don't reload if we already have the student data for this user
      if (student && student.email === user.email) {
        console.log('✅ Student data already loaded');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Loading student portfolio data for authenticated user:', user.email);
      setIsLoading(true);

      try {
        // Use the new portfolio service to fetch from relational tables
        const result = await getStudentPortfolioByEmail(user.email);

        if (result.success && result.data) {
          console.log('✅ Student portfolio data loaded successfully');
          console.log('📊 Data includes:', {
            skills: result.data.skills?.length || 0,
            projects: result.data.projects?.length || 0,
            education: result.data.education?.length || 0,
            experience: result.data.experience?.length || 0,
            certificates: result.data.certificates?.length || 0,
            training: result.data.training?.length || 0
          });
          _setStudent(result.data as Student);
        } else {
          console.error('❌ Error fetching student portfolio data:', result.error);
        }
      } catch (error) {
        console.error('❌ Error loading student portfolio data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [user, authLoading, student, isManuallySet]);

  const updateSettings = (newSettings: Partial<PortfolioSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('portfolioSettings', JSON.stringify(updatedSettings));
  };

  const resetToAuthUser = () => {
    setIsManuallySet(false);
    _setStudent(null); // Clear current student to trigger reload
  };

  const value: PortfolioContextType = {
    student,
    settings,
    updateSettings,
    setStudent,
    resetToAuthUser,
    isLoading,
    isManuallySet,
    viewerRole: user?.role || null,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};