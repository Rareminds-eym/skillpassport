import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, PortfolioSettings } from '../types/student';
import { mockStudent } from '../utils/supabase';

interface PortfolioContextType {
  student: Student | null;
  settings: PortfolioSettings;
  updateSettings: (newSettings: Partial<PortfolioSettings>) => void;
  setStudent: (student: Student) => void;
  isLoading: boolean;
}

const defaultSettings: PortfolioSettings = {
  layout: 'modern',
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  animation: 'fade',
  fontSize: 16,
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
  const [student, setStudent] = useState<Student | null>(null);
  const [settings, setSettings] = useState<PortfolioSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

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

    // For demo purposes, use mock data
    // In production, you would fetch the student data based on authentication
    try {
      setStudent(mockStudent);
    } catch (error) {
      console.error('Error setting mock student:', error);
    }
    
    setIsLoading(false);
  }, []);

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