import { useState, useRef, useEffect } from "react";
import { User, FileText, Briefcase, Shield, Globe, Upload, CheckCircle, Award, FolderGit2 } from "lucide-react";
import { Button } from "../ui/button";

// Import sub-components
import PersonalInfoTab from "./ProfileSubTabs/PersonalInfoTab";
import AdditionalInfoTab from "./ProfileSubTabs/AdditionalInfoTab";
import InstitutionDetailsTab from "./ProfileSubTabs/InstitutionDetailsTab";
import AcademicDetailsTab from "./ProfileSubTabs/AcademicDetailsTab";
import GuardianInfoTab from "./ProfileSubTabs/GuardianInfoTab";
import SocialLinksTab from "./ProfileSubTabs/SocialLinksTab";
import SkillsTab from "./ProfileSubTabs/SkillsTab";
import ExperienceTab from "./ProfileSubTabs/ExperienceTab";
import CertificatesTab from "./ProfileSubTabs/CertificatesTab";
import ProjectsTab from "./ProfileSubTabs/ProjectsTab";

const ProfileTab = ({
  profileData,
  handleProfileChange,
  handleInstitutionChange,
  isSaving,
  // Tab-specific save handlers
  handleSavePersonalInfo,
  handleSaveAdditionalInfo,
  handleSaveInstitutionDetails,
  handleSaveAcademicDetails,
  handleSaveGuardianInfo,
  handleSaveSocialLinks,
  setShowResumeParser,
  // Institution data
  schools,
  colleges,
  universities,
  universityColleges,
  departments,
  programs,
  programSections,
  schoolClasses,
  // Custom institution states
  showCustomSchool,
  setShowCustomSchool,
  showCustomUniversity,
  setShowCustomUniversity,
  showCustomCollege,
  setShowCustomCollege,
  showCustomSchoolClass,
  setShowCustomSchoolClass,
  showCustomProgram,
  setShowCustomProgram,
  showCustomSemester,
  setShowCustomSemester,
  customSchoolName,
  setCustomSchoolName,
  customUniversityName,
  setCustomUniversityName,
  customCollegeName,
  setCustomCollegeName,
  customSchoolClassName,
  setCustomSchoolClassName,
  customProgramName,
  setCustomProgramName,
  customSemesterName,
  setCustomSemesterName,
  // Education data
  educationData,
  setShowEducationModal,
  // New profile data
  softSkillsData,
  setShowSoftSkillsModal,
  technicalSkillsData,
  setShowTechnicalSkillsModal,
  experienceData,
  setShowExperienceModal,
  certificatesData,
  setShowCertificatesModal,
  projectsData,
  setShowProjectsModal,
  // Student data
  studentData,
  // Toggle handlers for skills
  onToggleTechnicalSkillEnabled,
  onToggleSoftSkillEnabled,
}) => {
  const [profileActiveTab, setProfileActiveTab] = useState("personal");
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(true);
  const scrollContainerRef = useRef(null);

  // Check scroll position to show/hide indicators
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftIndicator(scrollLeft > 0);
      setShowRightIndicator(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll to next/previous tab when clicking indicators
  const scrollToNextTab = () => {
    const currentIndex = profileTabs.findIndex(tab => tab.id === profileActiveTab);
    if (currentIndex < profileTabs.length - 1) {
      setProfileActiveTab(profileTabs[currentIndex + 1].id);
      // Scroll the tab into view
      setTimeout(() => {
        const tabButtons = scrollContainerRef.current?.querySelectorAll('button');
        if (tabButtons && tabButtons[currentIndex + 1]) {
          tabButtons[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  };

  const scrollToPreviousTab = () => {
    const currentIndex = profileTabs.findIndex(tab => tab.id === profileActiveTab);
    if (currentIndex > 0) {
      setProfileActiveTab(profileTabs[currentIndex - 1].id);
      // Scroll the tab into view
      setTimeout(() => {
        const tabButtons = scrollContainerRef.current?.querySelectorAll('button');
        if (tabButtons && tabButtons[currentIndex - 1]) {
          tabButtons[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 50);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const profileTabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "additional", label: "Additional Info", icon: FileText },
    { id: "institution", label: "Institution Details", icon: Briefcase },
    { id: "academic", label: "Academic Details", icon: Briefcase },
    { id: "skills", label: "Skills", icon: CheckCircle },
    { id: "experience", label: "My Experience", icon: Briefcase },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "projects", label: "Projects/Internships", icon: FolderGit2 },
    { id: "guardian", label: "Guardian Info", icon: Shield },
    { id: "social", label: "Social Links", icon: Globe },
  ];

  const renderActiveTab = () => {
    switch (profileActiveTab) {
      case "personal":
        return (
          <PersonalInfoTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSavePersonalInfo}
            isSaving={isSaving}
          />
        );
      case "additional":
        return (
          <AdditionalInfoTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSaveAdditionalInfo}
            isSaving={isSaving}
          />
        );
      case "institution":
        return (
          <InstitutionDetailsTab
            profileData={profileData}
            handleInstitutionChange={handleInstitutionChange}
            schools={schools}
            colleges={colleges}
            universities={universities}
            universityColleges={universityColleges}
            programs={programs}
            programSections={programSections}
            schoolClasses={schoolClasses}
            showCustomSchool={showCustomSchool}
            setShowCustomSchool={setShowCustomSchool}
            showCustomUniversity={showCustomUniversity}
            setShowCustomUniversity={setShowCustomUniversity}
            showCustomCollege={showCustomCollege}
            setShowCustomCollege={setShowCustomCollege}
            showCustomSchoolClass={showCustomSchoolClass}
            setShowCustomSchoolClass={setShowCustomSchoolClass}
            showCustomProgram={showCustomProgram}
            setShowCustomProgram={setShowCustomProgram}
            showCustomSemester={showCustomSemester}
            setShowCustomSemester={setShowCustomSemester}
            customSchoolName={customSchoolName}
            setCustomSchoolName={setCustomSchoolName}
            customUniversityName={customUniversityName}
            setCustomUniversityName={setCustomUniversityName}
            customCollegeName={customCollegeName}
            setCustomCollegeName={setCustomCollegeName}
            customSchoolClassName={customSchoolClassName}
            setCustomSchoolClassName={setCustomSchoolClassName}
            customProgramName={customProgramName}
            setCustomProgramName={setCustomProgramName}
            customSemesterName={customSemesterName}
            setCustomSemesterName={setCustomSemesterName}
            studentData={studentData}
            handleSaveProfile={handleSaveInstitutionDetails}
            isSaving={isSaving}
          />
        );
      case "academic":
        return (
          <AcademicDetailsTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            educationData={educationData}
            setShowEducationModal={setShowEducationModal}
            handleSaveProfile={handleSaveAcademicDetails}
            isSaving={isSaving}
          />
        );
      case "skills":
        return (
          <SkillsTab
            softSkillsData={softSkillsData}
            setShowSoftSkillsModal={setShowSoftSkillsModal}
            technicalSkillsData={technicalSkillsData}
            setShowTechnicalSkillsModal={setShowTechnicalSkillsModal}
            onToggleTechnicalSkillEnabled={onToggleTechnicalSkillEnabled}
            onToggleSoftSkillEnabled={onToggleSoftSkillEnabled}
          />
        );
      case "experience":
        return (
          <ExperienceTab
            experienceData={experienceData}
            setShowExperienceModal={setShowExperienceModal}
          />
        );
      case "certificates":
        return (
          <CertificatesTab
            certificatesData={certificatesData}
            setShowCertificatesModal={setShowCertificatesModal}
          />
        );
      case "projects":
        return (
          <ProjectsTab
            projectsData={projectsData}
            setShowProjectsModal={setShowProjectsModal}
          />
        );
      case "guardian":
        return (
          <GuardianInfoTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSaveGuardianInfo}
            isSaving={isSaving}
          />
        );
      case "social":
        return (
          <SocialLinksTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            handleSaveProfile={handleSaveSocialLinks}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-0">
      {/* Minimal Sticky Header */}
      <div className="sticky top-0 z-20 glass-effect border-b border-slate-200/60">
        <div className="p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-slate-500">
                Manage your personal details and preferences
              </p>
            </div>
            
            <Button
              onClick={() => setShowResumeParser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 button-press flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Auto-fill from Resume
            </Button>
          </div>
        </div>
        
        {/* Horizontal Tabs with Smooth Scroll */}
        <div className="relative px-6">
          {showLeftIndicator && (
            <div 
              onClick={scrollToPreviousTab}
              className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/90 to-transparent z-10 flex items-center justify-start cursor-pointer pl-2"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:shadow transition-all">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          )}
          
          {showRightIndicator && (
            <div 
              onClick={scrollToNextTab}
              className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent z-10 flex items-center justify-end cursor-pointer pr-2"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:border-blue-400 hover:shadow transition-all">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
          
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-4"
            onScroll={checkScrollPosition}
          >
            {profileTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = (profileActiveTab || "personal") === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProfileActiveTab(tab.id)}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 min-w-fit button-press ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="p-6 lg:p-8">
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default ProfileTab;