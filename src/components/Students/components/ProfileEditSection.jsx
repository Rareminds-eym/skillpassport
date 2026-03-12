import { useState } from 'react';
import { Edit3, BookOpen, Code, Briefcase, MessageCircle, Award, User, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  EducationEditModal,
  TrainingEditModal,
  ExperienceEditModal,
  SoftSkillsEditModal,
  TechnicalSkillsEditModal,
  PersonalInfoEditModal,
  ProjectsEditModal,
  CertificatesEditModal
} from './ProfileEditModals';
import { useStudentData } from '../../../hooks/useStudentData';
import { useUser } from '../../../stores';
import PersonalInfoSummary from './PersonalInfoSummary';
import ResumeParser from './ResumeParser';
import { mergeResumeData } from '../../../services/resumeParserService';

const ProfileEditSection = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [showResumeParser, setShowResumeParser] = useState(false);
  
  const user = useUser();
  
  // Use new architecture - ID-based state management
  const {
    student,
    education,
    experience,
    skills,
    trainings,
    certificates,
    projects,
    isLoading,
    error,
    updateStudentData,
    updateEducationBulk,
    updateExperienceBulk,
    updateSkillsBulk,
    updateTechnicalSkillsBulk,
    updateSoftSkillsBulk,
    updateTrainingsBulk,
    updateCertificatesBulk,
    updateProjectsBulk,
    refreshProfile
  } = useStudentData({ loadRelated: true });

  // Separate skills by type
  const technicalSkills = skills.filter(s => s.type === 'technical');
  const softSkills = skills.filter(s => s.type === 'soft');

  const handleSave = async (section, data) => {
    try {
      switch (section) {
        case 'education':
          await updateEducationBulk(data);
          break;
        case 'training':
          await updateTrainingsBulk(data);
          break;
        case 'experience':
          await updateExperienceBulk(data);
          break;
        case 'projects':
          await updateProjectsBulk(data);
          break;
        case 'certificates':
          await updateCertificatesBulk(data);
          break;
        case 'technicalSkills':
          await updateTechnicalSkillsBulk(data);
          break;
        case 'softSkills':
          await updateSoftSkillsBulk(data);
          break;
        case 'personalInfo':
          await updateStudentData(data);
          await refreshProfile();
          break;
        default:
          return;
      }
    } catch (err) {
      console.error(`Error saving ${section}:`, err);
    }
  };

  const handleResumeDataExtracted = async (parsedData) => {
    try {
      const mergedData = mergeResumeData(student || {}, parsedData);
      
      // Update personal info
      await handleSave('personalInfo', {
        name: mergedData.name,
        email: mergedData.email,
        contact_number: mergedData.contact_number,
        date_of_birth: mergedData.date_of_birth
      });
      
      // Update entities if present
      if (mergedData.education?.length > 0) {
        await handleSave('education', mergedData.education);
      }
      if (mergedData.training?.length > 0) {
        await handleSave('training', mergedData.training);
      }
      if (mergedData.experience?.length > 0) {
        await handleSave('experience', mergedData.experience);
      }
      if (mergedData.technicalSkills?.length > 0) {
        await handleSave('technicalSkills', mergedData.technicalSkills);
      }
      if (mergedData.softSkills?.length > 0) {
        await handleSave('softSkills', mergedData.softSkills);
      }
      
      await refreshProfile();
      setShowResumeParser(false);
    } catch (error) {
      console.error('Error saving resume data:', error);
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
      data: student || {},
      count: 1
    },
    {
      id: 'education',
      title: 'Education',
      icon: Award,
      description: 'Manage your academic qualifications - Add multiple degrees, certifications',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: education,
      count: education.filter(item => item.enabled !== false).length
    },
    {
      id: 'training',
      title: 'Training',
      icon: BookOpen,
      description: 'Add courses and certifications',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: trainings,
      count: trainings.filter(item => item.enabled !== false).length
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: Briefcase,
      description: 'Add internships and work experience',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: experience,
      count: experience.filter(item => item.enabled !== false).length
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: Code,
      description: 'Showcase your projects and portfolio work',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: projects,
      count: projects.filter(item => item.enabled !== false).length
    },
    {
      id: 'certificates',
      title: 'Certificates',
      icon: Award,
      description: 'Add professional certifications and credentials',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: certificates,
      count: certificates.filter(item => item.enabled !== false).length
    },
    {
      id: 'softSkills',
      title: 'Soft Skills',
      icon: MessageCircle,
      description: 'Languages and communication skills',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      data: softSkills,
      count: softSkills.filter(item => item.enabled !== false).length
    },
    {
      id: 'technicalSkills',
      title: 'Technical Skills',
      icon: Code,
      description: 'Programming languages and technical skills',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      data: technicalSkills,
      count: technicalSkills.length
    }
  ];

  // Show loading state
  if (isLoading) {
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
            Your Profile
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Manage your professional information and showcase your skills, experience, and achievements.
          </p>

          {/* Resume Upload Button */}
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
        </div>

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
                  data={student}
                  studentData={{ student, education, experience, skills, trainings, certificates }}
                  isOwnProfile={true}
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

        {/* Modals */}
        <PersonalInfoEditModal
          isOpen={activeModal === 'personalInfo'}
          onClose={() => setActiveModal(null)}
          data={student}
          onSave={(data) => handleSave('personalInfo', data)}
        />

        <EducationEditModal
          isOpen={activeModal === 'education'}
          onClose={() => setActiveModal(null)}
          data={education}
          onSave={(data) => handleSave('education', data)}
        />

        <TrainingEditModal
          isOpen={activeModal === 'training'}
          onClose={() => setActiveModal(null)}
          data={trainings}
          onSave={(data) => handleSave('training', data)}
        />

        <ExperienceEditModal
          isOpen={activeModal === 'experience'}
          onClose={() => setActiveModal(null)}
          data={experience}
          onSave={(data) => handleSave('experience', data)}
        />

        <SoftSkillsEditModal
          isOpen={activeModal === 'softSkills'}
          onClose={() => setActiveModal(null)}
          data={softSkills}
          onSave={(data) => handleSave('softSkills', data)}
        />

        <TechnicalSkillsEditModal
          isOpen={activeModal === 'technicalSkills'}
          onClose={() => setActiveModal(null)}
          data={technicalSkills}
          onSave={(data) => handleSave('technicalSkills', data)}
        />

        <ProjectsEditModal
          isOpen={activeModal === 'projects'}
          onClose={() => setActiveModal(null)}
          data={projects}
          onSave={(data) => handleSave('projects', data)}
        />

        <CertificatesEditModal
          isOpen={activeModal === 'certificates'}
          onClose={() => setActiveModal(null)}
          data={certificates}
          onSave={(data) => handleSave('certificates', data)}
        />

        {/* Resume Parser Modal */}
        {showResumeParser && (
          <ResumeParser
            onDataExtracted={handleResumeDataExtracted}
            onClose={() => setShowResumeParser(false)}
            userEmail={user?.email}
            studentData={{ student, education, experience, skills, trainings, certificates }}
            user={user}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEditSection;