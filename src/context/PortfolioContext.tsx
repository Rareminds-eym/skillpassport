import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, PortfolioSettings, DisplayPreferences } from '../types/student';
import { supabase } from '../lib/supabaseClient';

interface PortfolioContextType {
  student: Student | null;
  settings: PortfolioSettings;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  setStudent: (student: Student) => void;
  isLoading: boolean;
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
  layout: 'modern',
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
  const [student, _setStudent] = useState<Student | null>(null);
  const [settings, setSettings] = useState<PortfolioSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const setStudent = async (studentData: Student) => {
    setIsLoading(true);
    try {
      if (studentData.email) {
        // First try to get the full student data from Supabase
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('email', studentData.email)
          .single();

        if (error) {
          console.error('Error fetching student data:', error);
          // If we can't get the data from Supabase, use the passed data
          _setStudent(studentData);
        } else if (data) {
          // Merge the Supabase data with any additional data passed in
          _setStudent({
            ...data,
            ...studentData,
            profile: {
              ...(data.profile || {}),
              ...(studentData.profile || {})
            }
          });
        } else {
          // If no data found in Supabase, use the passed data
          _setStudent(studentData);
        }
      } else {
        // If no email (shouldn't happen), use the passed data
        _setStudent(studentData);
      }
    } catch (error) {
      console.error('Error in setStudent:', error);
      _setStudent(studentData);
    } finally {
      setIsLoading(false);
    }
  };

  console.log('PortfolioProvider render:', { student, isLoading });

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

    // If student data is passed through setStudent, don't fetch
    // This prevents overwriting data passed from the TalentPool
    if (!student) {
      setIsLoading(false);
    }
  }, [student]);

  const updateSettings = (newSettings: Partial<PortfolioSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('portfolioSettings', JSON.stringify(updatedSettings));
  };

  const value: PortfolioContextType = {
    student,
    settings,
    updateSettings,
    setStudent,
    isLoading,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};