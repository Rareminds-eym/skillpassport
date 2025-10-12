import React, { useState, useEffect } from 'react';
import { Edit3, BookOpen, Code, Briefcase, MessageCircle, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal
} from './ProfileEditModals';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { useAuth } from '../../../context/AuthContext';
import DatabaseSaveVerification from './DatabaseSaveVerification';
import StudentFindingDebug from './StudentFindingDebug';
import QuickFix from './QuickFix';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../data/mockData';

const ProfileEditSection = ({ profileEmail }) => {
  const [activeModal, setActiveModal] = useState(null);
  
  // Get user email from auth context
  const { user } = useAuth();
  const userEmail = user?.email;
  
  // Determine which email to fetch data for
  const displayEmail = profileEmail || userEmail;
  
  // Check if viewing own profile or someone else's
  const isOwnProfile = !profileEmail || profileEmail === userEmail;

  // Use Supabase hook for real data
  const {
    studentData,
    loading,
    error,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills
  } = useStudentDataByEmail(displayEmail);

  // Extract data from Supabase or use fallback
  const education = studentData?.education || educationData;
  const training = studentData?.training || trainingData;
  const experience = studentData?.experience || experienceData;
  const techSkills = studentData?.technicalSkills || technicalSkills;
  const soft = studentData?.softSkills || softSkills;

  const [userData, setUserData] = useState({
    education: education,
    training: training,
    experience: experience,
    technicalSkills: techSkills,
    softSkills: soft
  });

  // Update local state when Supabase data changes
  useEffect(() => {
    setUserData({
      education: education,
      training: training,
      experience: experience,
      technicalSkills: techSkills,
      softSkills: soft
    });
  }, [studentData, education, training, experience, techSkills, soft]);

  const handleSave = async (section, data) => {
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // Save to Supabase if user is logged in
    if (userEmail && studentData?.profile) {
      try {
        console.log(`🔄 ProfileEditSection: Saving ${section} data:`, data);
        
        let result;
        switch (section) {
          case 'education':
            result = await updateEducation(data);
            break;
          case 'training':
            result = await updateTraining(data);
            break;
          case 'experience':
            result = await updateExperience(data);
            break;
          case 'technicalSkills':
            result = await updateTechnicalSkills(data);
            break;
          case 'softSkills':
            result = await updateSoftSkills(data);
            break;
          default:
            console.warn('Unknown section:', section);
            return;
        }

        if (result?.success) {
          console.log(`✅ ProfileEditSection: ${section} saved successfully to database`);
        } else {
          console.error(`❌ ProfileEditSection: Error saving ${section}:`, result?.error);
        }
      } catch (err) {
        console.error(`❌ ProfileEditSection: Error saving ${section} to Supabase:`, err);
      }
    } else {
      console.warn('⚠️ ProfileEditSection: No user email or student data - saving locally only');
    }
  };

  const editSections = [
    {
      id: 'education',
      title: 'My Education',
      icon: Award,
      description: 'Manage your academic qualifications - Add multiple degrees, certifications',
  color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: userData.education,
      count: Array.isArray(userData.education) ? userData.education.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'training',
      title: 'My Training',
      icon: BookOpen,
      description: 'Add courses and certifications',
  color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: userData.training,
      count: Array.isArray(userData.training) ? userData.training.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'experience',
      title: 'My Experience',
      icon: Briefcase,
      description: 'Add internships and work experience',
  color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: userData.experience,
      count: Array.isArray(userData.experience) ? userData.experience.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'softSkills',
      title: 'My Soft Skills',
      icon: MessageCircle,
      description: 'Languages and communication skills',
  color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: userData.softSkills,
      count: Array.isArray(userData.softSkills) ? userData.softSkills.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'technicalSkills',
      title: 'My Skills (Technical)',
      icon: Code,
      description: 'Programming languages and technical skills',
  color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: userData.technicalSkills,
      count: Array.isArray(userData.technicalSkills) ? userData.technicalSkills.length : 0
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gray-50 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-gray-50 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Unable to Load Profile</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">Using offline mode with mock data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isOwnProfile ? 'Edit Your Profile' : `${studentData?.profile?.name || 'Student'}'s Profile`}
          </h2>
          <p className="text-gray-600">
            {isOwnProfile 
              ? 'Click on any section below to add or update your details' 
              : 'View student profile information'}
          </p>
          
          {/* Database Connection Status - Only show for own profile */}
          {/* {isOwnProfile && (
            <>
              {userEmail && studentData?.profile ? (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Connected to Database - Changes will be saved</span>
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-amber-700 font-medium">Offline Mode - Changes saved locally only</span>
                </div>
              )}
            </>
          )} */}
        </div>

        {/* Quick Fix Notification - Only for own profile */}
        {isOwnProfile && (
          <div className="mb-4">
            <QuickFix />
          </div>
        )}

        {/* Database Save Verification Component - Only for own profile */}
        {isOwnProfile && (
          <div className="mb-8">
            <DatabaseSaveVerification />
          </div>
        )}

        {/* Debug Component for Testing Student Finding - Only for own profile */}
        {isOwnProfile && (
          <div className="mb-8">
            <StudentFindingDebug />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} className={`hover:shadow-xl transition-all duration-300 ${isOwnProfile ? 'cursor-pointer hover:scale-105' : ''} border-2 ${section.color.split('text-')[0]}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    {section.count > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 font-semibold">
                        {section.count} items
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{section.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{section.description}</p>
                  {isOwnProfile && (
                    <Button
                      onClick={() => setActiveModal(section.id)}
                      className={`w-full ${section.buttonColor} text-white font-medium shadow-md hover:shadow-lg transition-all duration-200`}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {section.id === 'education' ? 'Manage Education' : 'Edit Details'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modals - Only show if own profile */}
        {isOwnProfile && (
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
    </div>
  );
};

export default ProfileEditSection;