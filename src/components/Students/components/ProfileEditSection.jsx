import { useState, useEffect } from 'react';
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
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showResumeParser, setShowResumeParser] = useState(false);
  
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
    
    setUserData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // Save to Supabase if user is logged in
    if (userEmail && studentData?.profile) {
      try {
        
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
          case 'projects':
            result = await updateProjects(data);
            break;
          case 'certificates':
            result = await updateCertificates(data);
            break;
          case 'technicalSkills':
            result = await updateTechnicalSkills(data);
            break;
          case 'softSkills':
            result = await updateSoftSkills(data);
            break;
          case 'personalInfo':
            result = await updateProfile(data);
            // Refresh the data after updating personal info
            if (result?.success) {
              await refresh();
              setRefreshCounter(prev => prev + 1); // Force re-render of modal
            } else {
              console.error('🔵 Update failed:', result?.error);
            }
            break;
          default:
            return;
        }

        if (result?.success) {
        } else {
          console.error(`❌ ProfileEditSection: Error saving ${section}:`, result?.error);
        }
      } catch (err) {
        console.error(`❌ ProfileEditSection: Error saving ${section} to Supabase:`, err);
      }
    } else {
    }
  };

  const handleResumeDataExtracted = async (parsedData) => {
    
    try {
      // Merge parsed data with existing profile data
      const currentProfile = studentData?.profile || {};
      const mergedData = mergeResumeData(currentProfile, parsedData);
      
      
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
          await handleSave('projects', mergedData.projects);
        }
        
        // Update certificates if present
        if (mergedData.certificates && mergedData.certificates.length > 0) {
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
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: studentData?.profile || {},
      count: 1 // Always show as having data since it's basic profile info
    },
    {
      id: 'education',
      title: 'Education',
      icon: Award,
      description: 'Manage your academic qualifications - Add multiple degrees, certifications',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: userData.education,
      count: Array.isArray(userData.education) ? userData.education.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'training',
      title: 'Training',
      icon: BookOpen,
      description: 'Add courses and certifications',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: userData.training,
      count: Array.isArray(userData.training) ? userData.training.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: Briefcase,
      description: 'Add internships and work experience',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: userData.experience,
      count: Array.isArray(userData.experience) ? userData.experience.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'softSkills',
      title: 'Soft Skills',
      icon: MessageCircle,
      description: 'Languages and communication skills',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: userData.softSkills,
      count: Array.isArray(userData.softSkills) ? userData.softSkills.filter(item => item.enabled !== false).length : 0
    },
    {
      id: 'technicalSkills',
      title: 'Technical Skills',
      icon: Code,
      description: 'Programming languages and technical skills',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: userData.technicalSkills,
      count: Array.isArray(userData.technicalSkills) ? userData.technicalSkills.length : 0
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-6 text-slate-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-red-800 font-semibold mb-2">Unable to Load Profile</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">Using offline mode with mock data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Professional Profile
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {isOwnProfile ? 'Your Profile' : studentData?.profile?.name || 'Student Profile'}
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {isOwnProfile
              ? 'Manage your professional information and showcase your skills, experience, and achievements.'
              : 'Comprehensive profile overview with skills, experience, and qualifications.'}
          </p>

          {/* Resume Upload Button - Only show for own profile */}
          {isOwnProfile && (
            <div className="mt-8">
              <Button
                onClick={() => setShowResumeParser(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume & Auto-Fill Profile
              </Button>
              <p className="text-sm text-slate-500 mt-3">
                Upload your resume to automatically extract and fill your profile information
              </p>
            </div>
          )}
        </div>

        {/* Quick Fix Notification - Only for own profile */}
        {isOwnProfile && (
          <div className="mb-6">
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

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card
                key={section.id}
                className="group relative bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 rounded-xl overflow-hidden flex flex-col h-full hover:-translate-y-1"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Icon Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${section.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className={`w-6 h-6 ${section.iconColor}`} />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-grow mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{section.description}</p>
                  </div>

                  {/* Action Buttons */}
                  {isOwnProfile && (
                    <div className="space-y-3 mt-auto">
                      {section.id === 'personalInfo' && (
                        <Button
                          onClick={() => setActiveModal('viewPersonalInfo')}
                          variant="outline"
                          className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium py-2.5"
                        >
                          <User className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      <Button
                        onClick={() => setActiveModal(section.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
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

        {/* Personal Info View Modal */}
        {activeModal === 'viewPersonalInfo' && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              {/* Modal Header */}
              <div className="bg-blue-50/50 px-8 py-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                      <p className="text-sm text-slate-600 mt-1">Complete overview of your profile details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
                <PersonalInfoSummary
                  data={studentData?.profile}
                  studentData={studentData}
                  isOwnProfile={isOwnProfile}
                />
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end gap-3">
                <Button
                  onClick={() => setActiveModal(null)}
                  variant="outline"
                  className="px-6 py-2.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setActiveModal(null);
                    setTimeout(() => setActiveModal('personalInfo'), 100);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
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
              showAllStatuses={true}
            />

            <SkillsEditModal
              isOpen={activeModal === 'technicalSkills'}
              onClose={() => setActiveModal(null)}
              data={userData.technicalSkills}
              title="Technical Skills"
              type="Skill"
              onSave={(data) => handleSave('technicalSkills', data)}
              showAllStatuses={true}
            />
          </>
        )}

        {/* Resume Parser Modal */}
        {showResumeParser && (
          <ResumeParser
            onDataExtracted={handleResumeDataExtracted}
            onClose={() => setShowResumeParser(false)}
            userEmail={userEmail}
            studentData={studentData}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEditSection;