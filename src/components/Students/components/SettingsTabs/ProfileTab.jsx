import React, { useState, useRef, useEffect } from "react";
import { User, FileText, Briefcase, Shield, Globe, Upload, Save, CheckCircle, Award, FolderGit2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  handleSaveProfile,
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
          />
        );
      case "additional":
        return (
          <AdditionalInfoTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
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
          />
        );
      case "academic":
        return (
          <AcademicDetailsTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
            educationData={educationData}
            setShowEducationModal={setShowEducationModal}
          />
        );
      case "skills":
        return (
          <SkillsTab
            softSkillsData={softSkillsData}
            setShowSoftSkillsModal={setShowSoftSkillsModal}
            technicalSkillsData={technicalSkillsData}
            setShowTechnicalSkillsModal={setShowTechnicalSkillsModal}
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
          />
        );
      case "social":
        return (
          <SocialLinksTab
            profileData={profileData}
            handleProfileChange={handleProfileChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm shadow-slate-200/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Profile Information
              </span>
            </CardTitle>
            
            {/* Upload Resume Button */}
            <Button
              onClick={() => setShowResumeParser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-medium flex items-center gap-2 text-sm sm:text-base"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Resume Auto-Fill</span>
              <span className="sm:hidden">Auto-Fill</span>
            </Button>
          </div>
        </CardHeader>
        
        {/* Sticky Horizontal Tabs */}
        <div className="px-6 pb-4">
          <div className="relative">
            {/* Left scroll indicator */}
            {showLeftIndicator && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 flex items-center justify-start pointer-events-none">
                <div className="w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Right scroll indicator */}
            {showRightIndicator && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-end pointer-events-none">
                <div className="w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
            
            <div 
              ref={scrollContainerRef}
              className="flex gap-1 overflow-x-auto border-b border-gray-200 scrollbar-hide"
              onScroll={checkScrollPosition}
            >
              {profileTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = (profileActiveTab || "personal") === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setProfileActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 font-medium text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors min-w-fit ${
                      isActive
                        ? "text-blue-600 border-blue-600 bg-blue-50"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="pt-6 p-6 space-y-8">
        {/* Render Active Tab Content */}
        {renderActiveTab()}

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-slate-100">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className={`
              inline-flex items-center gap-2
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white font-medium
              px-6 py-2.5 rounded-lg
              shadow-[0_2px_6px_rgba(0,0,0,0.05)]
              hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)]
              active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]
              transition-all duration-200 ease-in-out
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;