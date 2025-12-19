import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Student, PortfolioSettings, DisplayPreferences } from '../types/student';
import { getStudentPortfolioByEmail } from '../services/portfolioService';
import { useAuth } from './AuthContext';

interface PortfolioContextType {
  student: Student | null;
  settings: PortfolioSettings;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  setStudent: (student: Student) => void;
  resetToAuthUser: () => void;
  resetToRoleDefaults: () => void;
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

// Role-based default layouts
const getRoleBasedDefaultLayout = (role: string | null): string => {
  switch (role) {
    case 'student':
      return 'infographic';
    case 'university_admin':
    case 'college_admin':
    case 'school_admin':
    case 'educator':
      return 'journey';
    case 'recruiter':
      return 'aipersona';
    default:
      return 'infographic';
  }
};

const getDefaultSettings = (viewerRole: string | null): PortfolioSettings => ({
  layout: getRoleBasedDefaultLayout(viewerRole) as any,
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  animation: 'fade',
  fontSize: 16,
  displayPreferences: defaultDisplayPreferences,
});

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
  const [settings, setSettings] = useState<PortfolioSettings>(getDefaultSettings(null));
  const [isLoading, setIsLoading] = useState(true);
  const [isManuallySet, setIsManuallySet] = useState(false); // Track if student was manually set
  const loadedUserEmailRef = useRef<string | null>(null); // Track which user's data we've loaded

  const setStudent = async (studentData: Student) => {
    // Prevent infinite loops by checking if we're already loading the same student
    if (isLoading && student?.email === studentData.email) {
      console.log('⚠️ Already loading this student, skipping duplicate request');
      return;
    }

    // Check if we already have this student's data
    if (student?.email === studentData.email && !isLoading) {
      console.log('✅ Student data already loaded, skipping duplicate request');
      setIsManuallySet(true); // Still mark as manually set
      return;
    }

    console.log('🔄 Loading student data for:', studentData.email);
    setIsLoading(true);
    setIsManuallySet(true); // Mark as manually set
    
    try {
      if (studentData.email) {
        // Use the new portfolio service to get full student data from relational tables
        const result = await getStudentPortfolioByEmail(studentData.email);

        if (result.success && result.data) {
          console.log('✅ Student portfolio data loaded via setStudent');
          _setStudent(result.data as Student);
          loadedUserEmailRef.current = studentData.email; // Mark this student as loaded
        } else {
          console.error('❌ Error fetching student data:', result.error);
          // Fallback to passed data
          _setStudent(studentData);
          loadedUserEmailRef.current = studentData.email;
        }
      } else {
        // If no email, use the passed data
        _setStudent(studentData);
        loadedUserEmailRef.current = studentData.email || null;
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
    // Load saved settings from localStorage with role-based defaults
    const loadSettings = () => {
      const roleBasedDefaults = getDefaultSettings(user?.role || null);
      
      try {
        // Create a role-specific key for localStorage
        const settingsKey = `portfolioSettings_${user?.role || 'guest'}`;
        const savedSettings = localStorage.getItem(settingsKey);
        
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          // Merge role-based defaults with saved preferences
          setSettings({ ...roleBasedDefaults, ...parsed });
        } else {
          // Use role-based defaults if no saved settings
          setSettings(roleBasedDefaults);
        }
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        setSettings(roleBasedDefaults);
      }
    };

    // Only load settings when we have user info
    if (!authLoading && user) {
      loadSettings();
    }
  }, [user, authLoading]);

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
      if (loadedUserEmailRef.current === user.email) {
        console.log('✅ Student data already loaded for this user');
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
          loadedUserEmailRef.current = user.email; // Mark this user as loaded
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
  }, [user, authLoading, isManuallySet]);

  const updateSettings = (newSettings: Partial<PortfolioSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Save settings with role-specific key
    const settingsKey = `portfolioSettings_${user?.role || 'guest'}`;
    localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
  };

  const resetToAuthUser = () => {
    setIsManuallySet(false);
    _setStudent(null); // Clear current student to trigger reload
    loadedUserEmailRef.current = null; // Reset loaded user tracking
  };

  const resetToRoleDefaults = () => {
    const roleBasedDefaults = getDefaultSettings(user?.role || null);
    setSettings(roleBasedDefaults);
    
    // Clear saved settings for this role
    const settingsKey = `portfolioSettings_${user?.role || 'guest'}`;
    localStorage.removeItem(settingsKey);
  };

  const value: PortfolioContextType = {
    student,
    settings,
    updateSettings,
    setStudent,
    resetToAuthUser,
    resetToRoleDefaults,
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