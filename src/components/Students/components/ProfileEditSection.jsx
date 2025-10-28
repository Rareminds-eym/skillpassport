import React, { useState, useEffect } from 'react';
import { Edit3, BookOpen, Code, Briefcase, MessageCircle, Award, User, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SkillsEditModal,
  PersonalInfoEditModal
} from './ProfileEditModals';
import { useStudentDataByEmail } from '../../../hooks/useStudentDataByEmail';
import { useAuth } from '../../../context/AuthContext';
import DatabaseSaveVerification from './DatabaseSaveVerification';
import StudentFindingDebug from './StudentFindingDebug';
import QuickFix from './QuickFix';
import PersonalInfoSummary from './PersonalInfoSummary';
import ResumeParser from './ResumeParser';
import ResumeParserTester from './ResumeParserTester';
import { mergeResumeData } from '../../../services/resumeParserService';
import {
  educationData,
  trainingData,
  experienceData,
  technicalSkills,
  softSkills
} from '../data/mockData';

const ProfileEditSection = ({ profileEmail }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showResumeParser, setShowResumeParser] = useState(false);
  const [showTester, setShowTester] = useState(false);
  
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
    refresh,
    updateProfile,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills,
    updateProjects,
    updateCertificates
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
    console.log(`🔵 handleSave called for section: ${section}`);
    console.log(`🔵 Data to save:`, data);
    console.log(`🔵 User email:`, userEmail);
    console.log(`🔵 Display email:`, displayEmail);
    
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // Save to Supabase if user is logged in
    if (userEmail && studentData?.profile) {
      try {
        console.log(`🔄 ProfileEditSection: Saving ${section} data:`, data);
        console.log(`🔄 User email:`, userEmail);
        console.log(`🔄 Student data exists:`, !!studentData);
        
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
          case 'personalInfo':
            console.log('🔵 Calling updateProfile with:', data);
            result = await updateProfile(data);
            console.log('🔵 updateProfile result:', result);
            // Refresh the data after updating personal info
            if (result?.success) {
              console.log('🔵 Update successful, refreshing data...');
              await refresh();
              setRefreshCounter(prev => prev + 1); // Force re-render of modal
              console.log('🔵 Data refreshed successfully');
            } else {
              console.error('🔵 Update failed:', result?.error);
            }
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
      console.warn('   - userEmail:', userEmail);
      console.warn('   - studentData?.profile:', studentData?.profile);
    }
  };

  const handleResumeDataExtracted = async (parsedData) => {
    console.log('📄 Resume data extracted:', parsedData);
    
    try {
      // Merge parsed data with existing profile data
      const currentProfile = studentData?.profile || {};
      const mergedData = mergeResumeData(currentProfile, parsedData);
      
      console.log('🔀 Merged resume data:', mergedData);
      
      // Update profile with merged data
      if (userEmail && studentData?.profile) {
        // Update personal info
        await handleSave('personalInfo', {
          name: mergedData.name,
          email: mergedData.email,
          contact_number: mergedData.contact_number,
          age: mergedData.age,
          date_of_birth: mergedData.date_of_birth,
          college_school_name: mergedData.college_school_name,
          university: mergedData.university,
          registration_number: mergedData.registration_number,
          district_name: mergedData.district_name,
          branch_field: mergedData.branch_field,
          trainer_name: mergedData.trainer_name,
          nm_id: mergedData.nm_id,
          course: mergedData.course,
          alternate_number: mergedData.alternate_number,
          contact_number_dial_code: mergedData.contact_number_dial_code,
          skill: mergedData.skill
        });
        
        // Update education if present
        if (mergedData.education && mergedData.education.length > 0) {
          await handleSave('education', mergedData.education);
        }
        
        // Update training if present
        if (mergedData.training && mergedData.training.length > 0) {
          await handleSave('training', mergedData.training);
        }
        
        // Update experience if present
        if (mergedData.experience && mergedData.experience.length > 0) {
          await handleSave('experience', mergedData.experience);
        }
        
        // Update projects if present
        if (mergedData.projects && mergedData.projects.length > 0) {
          console.log('📦 Saving projects:', mergedData.projects);
          await handleSave('projects', mergedData.projects);
        }
        
        // Update certificates if present
        if (mergedData.certificates && mergedData.certificates.length > 0) {
          console.log('📜 Saving certificates:', mergedData.certificates);
          await handleSave('certificates', mergedData.certificates);
        }
        
        // Update technical skills if present
        if (mergedData.technicalSkills && mergedData.technicalSkills.length > 0) {
          await handleSave('technicalSkills', mergedData.technicalSkills);
        }
        
        // Update soft skills if present
        if (mergedData.softSkills && mergedData.softSkills.length > 0) {
          await handleSave('softSkills', mergedData.softSkills);
        }
        
        // Refresh the data
        await refresh();
        setRefreshCounter(prev => prev + 1);
        
        console.log('✅ Resume data successfully saved to database');
      }
      
      // Close the resume parser modal
      setShowResumeParser(false);
    } catch (error) {
      console.error('❌ Error saving resume data:', error);
    }
  };

  const editSections = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      icon: User,
      description: 'Manage your personal details, contact information, and educational background',
      color: 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      data: studentData?.profile || {},
      count: 1 // Always show as having data since it's basic profile info
    },
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
      title: 'My Technical Skills',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Loading your profile...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/60 backdrop-blur-sm text-blue-700 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            Professional Profile
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 tracking-tight">
            {isOwnProfile ? 'Your Profile' : studentData?.profile?.name || 'Student Profile'}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {isOwnProfile 
              ? 'Manage your professional information and showcase your skills, experience, and achievements.' 
              : 'Comprehensive profile overview with skills, experience, and qualifications.'}
          </p>
          
          {/* Resume Upload Button - Only show for own profile */}
          {isOwnProfile && (
            <div className="mt-6 space-y-3">
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowResumeParser(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Resume & Auto-Fill Profile
                </Button>
                <Button
                  onClick={() => setShowTester(true)}
                  variant="outline"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Test Mode
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Upload your resume to automatically extract and fill your profile information
              </p>
            </div>
          )}
          
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
              <Card 
                key={section.id} 
                className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-2 ${section.color.split('text-')[0]} shadow-lg hover:shadow-2xl transition-all duration-500 ${isOwnProfile ? 'cursor-pointer hover:scale-[1.03] hover:-translate-y-1' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                <CardContent className="relative p-7">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl ${section.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    {section.count > 0 && (
                      <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-semibold px-3 py-1.5 shadow-sm">
                        {section.count}
                      </Badge>
                    )}
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2.5 group-hover:text-gray-800 transition-colors">{section.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{section.description}</p>
                  </div>
                  {isOwnProfile && (
                    <div className="space-y-2.5">
                      {section.id === 'personalInfo' && (
                        <Button
                          onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                          variant="outline"
                          className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-medium"
                        >
                          <User className="w-4 h-4 mr-2" />
                          {expandedSection === section.id ? 'Hide Details' : 'View Details'}
                        </Button>
                      )}
                      <Button
                        onClick={() => setActiveModal(section.id)}
                        className={`w-full ${section.buttonColor} text-white font-semibold shadow-md hover:shadow-xl transition-all duration-300`}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        {section.id === 'personalInfo' ? 'Edit Profile' : 'Manage'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Expanded Section Details */}
        {expandedSection === 'personalInfo' && (
          <div className="mt-10">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>
                <PersonalInfoSummary 
                  data={studentData?.profile} 
                  isOwnProfile={isOwnProfile}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modals - Only show if own profile */}
        {isOwnProfile && (
          <>
            <PersonalInfoEditModal
              key={`personal-${refreshCounter}`}
              isOpen={activeModal === 'personalInfo'}
              onClose={() => setActiveModal(null)}
              data={studentData?.profile}
              onSave={(data) => handleSave('personalInfo', data)}
            />

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

        {/* Resume Parser Modal */}
        {showResumeParser && (
          <ResumeParser
            onDataExtracted={handleResumeDataExtracted}
            onClose={() => setShowResumeParser(false)}
          />
        )}

        {/* Resume Parser Tester Modal */}
        {showTester && (
          <ResumeParserTester
            userId={user?.id}
            onClose={() => setShowTester(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEditSection;