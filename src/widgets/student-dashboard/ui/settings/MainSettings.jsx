import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  ChevronRight,
  CreditCard,
  Lock,
  Settings as SettingsIcon,
  Shield,
  User
} from "lucide-react";
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/ButtonNew';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';

import { useStudentSettings } from '@/entities/student';
import { useStudentDataByEmail } from '@/entities/student';
import { useEntityData } from './hooks/useEntityData';
import { useInstitutions } from '@/entities/institution';
import { SubscriptionSettingsSection } from '@/features/subscription';
import { 
  EducationEditModal, 
  SoftSkillsEditModal, 
  SkillsEditModal, 
  ExperienceEditModal, 
  CertificatesEditModal, 
  ProjectsEditModal 
} from '@/features/student-profile';
import toast from 'react-hot-toast';
import { useStudentMessageNotifications } from '@/entities/student';
import { useStudentUnreadCount } from "@/entities/student";
import { useStudentRealtimeActivities } from '@/entities/student/model/useStudentRealtimeActivities';
import ResumeParser from "../ResumeParser";
import { mergeResumeData } from '@/features/digital-portfolio';
import { safeSave } from '@/shared/lib/settingsErrorHandler';
import { createToggleSkillHandler, mergeProfileData } from './helpers/settingsHelpers';
import { useSaveHandlers } from './hooks/useSaveHandlers';

// Import tab components
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import NotificationsTab from "./NotificationsTab";
import PrivacyTab from "./PrivacyTab";

import { useUser } from '@/shared/model/authStore';
const MainSettings = () => {
  const user = useUser();
  const location = useLocation();
  const userEmail = user?.email;
  const recentUpdatesRef = useRef(null);

  const {
    studentData,
    loading: studentLoading,
    error: studentError,
    updateProfile,
    updatePassword,
  } = useStudentSettings(userEmail);

  // Get education data from the same source as Dashboard
  const {
    studentData: studentDataWithEducation,
    loading: educationLoading,
    updateEducation,
    updateTechnicalSkills,
    updateSoftSkills,
    updateSkills,
    updateExperience,
    updateProjects,
    updateCertificates,
  } = useStudentDataByEmail(userEmail);

  // Get student ID for messaging
  const studentId = studentData?.id;

  // Use unified entity data hook
  const { entities, loading: entityLoading, refresh: entityRefresh } = useEntityData(studentId, studentDataWithEducation);

  // Extract entity data for easier access
  const educationData = entities.education;
  const softSkillsData = entities.softSkills;
  const technicalSkillsData = entities.technicalSkills;
  const experienceData = entities.experience;
  const certificatesData = entities.certificates;
  const projectsData = entities.projects;

  // Setup message notifications with hot-toast
  useStudentMessageNotifications({
    studentId,
    enabled: !!studentId,
    playSound: true,
    onMessageReceived: () => {
      // Refresh Recent Updates to show new message activity
      setTimeout(() => {
        try {
          if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
            refreshRecentUpdates();
          }
        } catch (error) {
          console.warn('Could not refresh recent updates:', error);
        }
      }, 1000);
    },
  });

  // Get unread message count with realtime updates
  const { unreadCount } = useStudentUnreadCount(studentId, !!studentId);

  // Fetch recent updates data from recruitment tables (student-specific)
  const {
    activities: recentUpdates,
    isLoading: recentUpdatesLoading,
    isError: recentUpdatesError,
    refetch: refreshRecentUpdates,
    isConnected: realtimeConnected,
  } = useStudentRealtimeActivities(userEmail, 10);

  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Modal states
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showSoftSkillsModal, setShowSoftSkillsModal] = useState(false);
  const [showTechnicalSkillsModal, setShowTechnicalSkillsModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showResumeParser, setShowResumeParser] = useState(false);

  // Custom institution states
  const [showCustomSchool, setShowCustomSchool] = useState(false);
  const [showCustomUniversity, setShowCustomUniversity] = useState(false);
  const [showCustomCollege, setShowCustomCollege] = useState(false);
  const [showCustomSchoolClass, setShowCustomSchoolClass] = useState(false);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  const [showCustomSemester, setShowCustomSemester] = useState(false);
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [customUniversityName, setCustomUniversityName] = useState('');
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customSchoolClassName, setCustomSchoolClassName] = useState('');
  const [customProgramName, setCustomProgramName] = useState('');
  const [customSemesterName, setCustomSemesterName] = useState('');

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Use unified save handlers hook
  const saveHandlers = useSaveHandlers({
    updateProfile,
    updatePassword,
    updateEducation,
    updateSoftSkills,
    updateSkills: updateTechnicalSkills,
    updateExperience,
    updateCertificates,
    updateProjects,
    refreshFunctions: {
      recentUpdates: refreshRecentUpdates,
      education: entityRefresh.education,
      softSkills: entityRefresh.softSkills,
      technicalSkills: entityRefresh.technicalSkills,
      experience: entityRefresh.experience,
      certificates: entityRefresh.certificates,
      projects: entityRefresh.projects,
    },
    studentId,
    userId: user?.id,
  });

  const { isSaving, setIsSaving } = saveHandlers;

  // Fetch institutions data
  const {
    schools,
    colleges,
    universities,
    universityColleges,
    departments,
    programs,
    programSections,
    schoolClasses,
    loading: institutionsLoading,
    refreshInstitutions,
  } = useInstitutions();

  const savingRef = useRef(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    location: "",
    address: "",
    state: "",
    country: "India",
    pincode: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    university: "",
    branch: "",
    college: "",
    registrationNumber: "",
    enrollmentNumber: "",
    currentCgpa: "",
    grade: "",
    gradeStartDate: "",
    universityCollegeId: "",
    universityId: "",
    schoolId: "",
    schoolClassId: "",
    collegeId: "",
    programId: "",
    programSectionId: "",
    semester: "",
    section: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianRelation: "",
    bio: "",
    linkedIn: "",
    github: "",
    twitter: "",
    facebook: "",
    instagram: "",
    portfolio: "",
    // Required fields for profile validation
    aadharNumber: "",
    gapInStudies: false,
    gapYears: 0,
    gapReason: "",
    currentBacklogs: 0,
    backlogsHistory: "",
    workExperience: "",
    // New JSON fields
    interests: "",
    languages: "",
    hobbies: "",
  });

  // Password settings state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    applicationUpdates: true,
    newOpportunities: true,
    recruitingMessages: true,
    weeklyDigest: false,
    monthlyReport: false,
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowRecruiterContact: true,
    showInTalentPool: true,
  });

  // Load student data into form - only update when studentData actually changes with valid data
  useEffect(() => {
    // Only update if we have valid student data and we're not currently saving
    if (studentData && studentData.id && !savingRef.current && !studentLoading) {
      const merged = mergeProfileData(studentData, userEmail);
      if (merged) {
        setProfileData(merged);
      }

      // Detect custom entries (B2C students) and show custom input fields
      // Determine student type from role
      const userRole = studentData?.userRole;
      const isSchoolStudent = userRole === 'school_student';
      const isCollegeStudent = userRole === 'college_student';
      
      // Check if it's a school path (has schoolId or schoolClassId) vs university path
      // For role-based detection, also consider the role itself
      const hasSchoolData = studentData.schoolId || studentData.schoolClassId || studentData.schoolName;
      const hasUniversityData = studentData.universityId || studentData.universityCollegeId || studentData.programId || studentData.university || studentData.college;
      const isSchoolPath = hasSchoolData || (isSchoolStudent && !hasUniversityData);
      const isUniversityPath = hasUniversityData || (isCollegeStudent && !hasSchoolData);
      
      // Custom school name (for school students, stored in schoolName field)
      if (isSchoolStudent && studentData.schoolName && (!studentData.schoolId || studentData.schoolId === '')) {
        setShowCustomSchool(true);
        setCustomSchoolName(studentData.schoolName);
      }
      
      // Custom school class - derive from grade field, NOT from section
      // Section field should remain independent for roll numbers
      if (studentData.grade && (!studentData.schoolClassId || studentData.schoolClassId === '') && (studentData.schoolId || studentData.schoolName) && !isUniversityPath) {
        // Extract numeric grade from grade field (e.g., "Grade 10" -> "10")
        const gradeMatch = studentData.grade.match(/Grade\s*(\d+)/i);
        if (gradeMatch) {
          setShowCustomSchoolClass(true);
          setCustomSchoolClassName(gradeMatch[1]); // Just the number, e.g., "10"
        }
      }
      
      // Custom university name
      console.log('🔍 Checking university:', {
        university: studentData.university,
        universityId: studentData.universityId,
        shouldShow: studentData.university && (!studentData.universityId || studentData.universityId === '')
      });
      if (studentData.university && (!studentData.universityId || studentData.universityId === '')) {
        setShowCustomUniversity(true);
        setCustomUniversityName(studentData.university);
        console.log('✅ Set custom university:', studentData.university);
      }
      
      // Custom college name (for college students, stored in college field)
      // Check after university to ensure university path is established
      console.log('🔍 Checking college:', {
        isCollegeStudent,
        college: studentData.college,
        universityCollegeId: studentData.universityCollegeId,
        shouldShow: isCollegeStudent && studentData.college && (!studentData.universityCollegeId || studentData.universityCollegeId === '')
      });
      if (isCollegeStudent && studentData.college && (!studentData.universityCollegeId || studentData.universityCollegeId === '')) {
        setShowCustomCollege(true);
        setCustomCollegeName(studentData.college);
        console.log('✅ Set custom college:', studentData.college);
        
        // IMPORTANT: If there's a custom college but no university, enable custom university input
        // This allows B2C college students to enter both custom college and custom university
        if (!studentData.university && !studentData.universityId) {
          console.log('🔓 Enabling custom university input for custom college');
          setShowCustomUniversity(true);
        }
      }
      
      // Custom program name
      if (studentData.branch && (!studentData.programId || studentData.programId === '')) {
        setShowCustomProgram(true);
        setCustomProgramName(studentData.branch);
      }
      
      // Custom semester (only for university path)
      if (studentData.section && (!studentData.programSectionId || studentData.programSectionId === '') && isUniversityPath) {
        setShowCustomSemester(true);
        setCustomSemesterName(studentData.section);
      }

      // Load notification settings
      if (studentData.notificationSettings && !savingRef.current) {
        setNotificationSettings(studentData.notificationSettings);
      }

      // Load privacy settings
      if (studentData.privacySettings && !savingRef.current) {
        setPrivacySettings(studentData.privacySettings);
      }

      // Education data is now handled automatically by the hook
      // No need to manually set education data
    }
  }, [studentData, userEmail, studentLoading]);

  // Education data is now automatically available from studentDataWithEducation
  // No separate useEffect needed

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings((prev) => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }));
  };

  // Handle "Add New" selection for institutions
  const handleInstitutionChange = (field, value) => {
    if (value === 'add_new') {
      const typeMap = {
        schoolId: 'School',
        collegeId: 'College',
        universityId: 'University',
        universityCollegeId: 'University College',
        programId: 'Program',
        programSectionId: 'Semester/Section',
        schoolClassId: 'Class',
      };
      
      // Show custom input for B2C students
      if (field === 'schoolId') {
        setShowCustomSchool(true);
        return;
      } else if (field === 'universityId') {
        setShowCustomUniversity(true);
        return;
      } else if (field === 'universityCollegeId') {
        setShowCustomCollege(true);
        return;
      } else if (field === 'schoolClassId') {
        setShowCustomSchoolClass(true);
        return;
      } else if (field === 'programId') {
        setShowCustomProgram(true);
        return;
      } else if (field === 'programSectionId') {
        setShowCustomSemester(true);
        return;
      }
      
      toast.success(`Please contact your administrator to add a new ${typeMap[field].toLowerCase()}.`);
      return;
    }
    
    // Sync School Class with grade field ONLY for school students
    if (field === 'schoolClassId' && value) {
      // Check if this is a school student (not university path)
      const isUniversityPath = profileData.universityId || profileData.universityCollegeId || profileData.programId;
      
      if (!isUniversityPath) {
        const selectedClass = schoolClasses.find(sc => sc.id === value);
        if (selectedClass && selectedClass.grade) {
          // Map school class grade to Academic Details grade format
          const gradeMapping = {
            '6': 'Grade 6',
            '7': 'Grade 7',
            '8': 'Grade 8',
            '9': 'Grade 9',
            '10': 'Grade 10',
            '11': 'Grade 11',
            '12': 'Grade 12',
          };
          const mappedGrade = gradeMapping[selectedClass.grade] || `Grade ${selectedClass.grade}`;
          handleProfileChange('grade', mappedGrade);
          
          // Don't update section field - it should remain independent
          // The schoolClassId foreign key is sufficient for tracking the class
        }
      }
    }
    
    // Handle cascading logic and field updates
    handleProfileChange(field, value);
  };

  // Technical Skills toggle enabled handler - using helper
  const handleToggleTechnicalSkillEnabled = createToggleSkillHandler(entityRefresh.technicalSkills);

  // Soft Skills toggle enabled handler - using helper
  const handleToggleSoftSkillEnabled = createToggleSkillHandler(entityRefresh.softSkills);

  // Extract save handlers from hook
  const {
    handleEducationSave,
    handleSoftSkillsSave,
    handleTechnicalSkillsSave,
    handleExperienceSave,
    handleCertificatesSave,
    handleProjectsSave,
    handleSavePassword,
    handleSaveNotifications,
    handleSavePrivacy,
  } = saveHandlers;

  // Extract profile save handlers from hook
  const {
    handleSavePersonalInfo: savePersonalInfo,
    handleSaveAdditionalInfo: saveAdditionalInfo,
    handleSaveAcademicDetails: saveAcademicDetails,
    handleSaveGuardianInfo: saveGuardianInfo,
    handleSaveSocialLinks: saveSocialLinks,
  } = saveHandlers;

  // Wrapper functions to pass profileData fields
  const handleSavePersonalInfo = () => savePersonalInfo({
    name: profileData.name,
    phone: profileData.phone,
    alternatePhone: profileData.alternatePhone,
    address: profileData.address,
    location: profileData.location,
    state: profileData.state,
    country: profileData.country,
    pincode: profileData.pincode,
    dateOfBirth: profileData.dateOfBirth,
    age: profileData.age,
    gender: profileData.gender,
    bloodGroup: profileData.bloodGroup,
  });

  const handleSaveAdditionalInfo = () => {
    // Validate Aadhar number before saving (only if it has a value and is not empty)
    if (profileData.aadharNumber && profileData.aadharNumber.trim() !== '') {
      if (profileData.aadharNumber.length !== 12) {
        toast.error("Aadhar number must be exactly 12 digits");
        return;
      }
      
      if (profileData.aadharNumber.startsWith('0') || profileData.aadharNumber.startsWith('1')) {
        toast.error("Aadhar number cannot start with 0 or 1");
        return;
      }
    }
    
    return saveAdditionalInfo({
      aadharNumber: profileData.aadharNumber,
      gapInStudies: profileData.gapInStudies,
      gapYears: profileData.gapYears,
      gapReason: profileData.gapReason,
      workExperience: profileData.workExperience,
      currentBacklogs: profileData.currentBacklogs,
      backlogsHistory: profileData.backlogsHistory,
      interests: profileData.interests,
      languages: profileData.languages,
      hobbies: profileData.hobbies,
    });
  };

  const handleSaveAcademicDetails = () => saveAcademicDetails({
    registrationNumber: profileData.registrationNumber,
    enrollmentNumber: profileData.enrollmentNumber,
    currentCgpa: profileData.currentCgpa,
    grade: profileData.grade,
    gradeStartDate: profileData.gradeStartDate,
  });

  const handleSaveGuardianInfo = () => saveGuardianInfo({
    guardianName: profileData.guardianName,
    guardianPhone: profileData.guardianPhone,
    guardianEmail: profileData.guardianEmail,
    guardianRelation: profileData.guardianRelation,
  });

  const handleSaveSocialLinks = () => saveSocialLinks({
    bio: profileData.bio,
    linkedIn: profileData.linkedIn,
    github: profileData.github,
    twitter: profileData.twitter,
    facebook: profileData.facebook,
    instagram: profileData.instagram,
    portfolio: profileData.portfolio,
  });

  // Institution Details Tab - save institution information
  const handleSaveInstitutionDetails = async () => {
    setIsSaving(true);
    
    try {
      const dataToSave = { ...profileData };
      
      // Determine student type from role
      const userRole = studentData?.userRole;
      const isSchoolStudent = userRole === 'school_student';
      const isCollegeStudent = userRole === 'college_student';
      
      // Determine which path the student is on
      const isUniversityPath = dataToSave.universityId || showCustomUniversity || customUniversityName || 
                               dataToSave.universityCollegeId || showCustomCollege || customCollegeName ||
                               dataToSave.programId || showCustomProgram || customProgramName;
      const isSchoolPath = dataToSave.schoolId || showCustomSchool || customSchoolName ||
                           dataToSave.schoolClassId || showCustomSchoolClass || customSchoolClassName;
      
      // Clear school fields if on university path
      if (isUniversityPath) {
        dataToSave.schoolId = null;
        dataToSave.schoolClassId = null;
        // Don't clear college field as it's used for university college name
      }
      
      // Clear university fields if on school path
      if (isSchoolPath && !isUniversityPath) {
        dataToSave.universityId = null;
        dataToSave.universityCollegeId = null;
        dataToSave.programId = null;
        dataToSave.programSectionId = null;
        dataToSave.university = null;
        dataToSave.branch = null;
        
        // IMPORTANT: Clear section field for school students
        // Section should only be used for university students (semester/section)
        // For school students, class info comes from schoolClassId or grade
        if (!dataToSave.programSectionId && !showCustomSemester) {
          dataToSave.section = null;
        }
      }
      
      // Clear grade if no program/class is selected
      if (isUniversityPath && !dataToSave.programId && !showCustomProgram && !customProgramName) {
        dataToSave.grade = null;
      }
      if (isSchoolPath && !dataToSave.schoolClassId && !showCustomSchoolClass && !customSchoolClassName) {
        dataToSave.grade = null;
      }
      
      // Convert empty string IDs to null
      if (dataToSave.programId === '') dataToSave.programId = null;
      if (dataToSave.universityCollegeId === '') dataToSave.universityCollegeId = null;
      if (dataToSave.schoolId === '') dataToSave.schoolId = null;
      if (dataToSave.schoolClassId === '') dataToSave.schoolClassId = null;
      if (dataToSave.collegeId === '') dataToSave.collegeId = null;
      if (dataToSave.universityId === '') dataToSave.universityId = null;
      if (dataToSave.programSectionId === '') dataToSave.programSectionId = null;
      
      // Convert empty course_name to null
      if (dataToSave.courseName === '' || dataToSave.courseName === undefined) {
        dataToSave.courseName = null;
      }
      
      // Custom program name → branch field (for assessment tests)
      if (showCustomProgram && customProgramName) {
        dataToSave.branch = customProgramName;
        dataToSave.programId = null;
      }
      
      // Custom college name → college field (for college students)
      if (showCustomCollege && customCollegeName) {
        dataToSave.college = customCollegeName;
        dataToSave.universityCollegeId = null;
      }
      
      // Custom university name → university field
      if (showCustomUniversity && customUniversityName) {
        dataToSave.university = customUniversityName;
        dataToSave.universityId = null;
      }
      
      // Custom school name → college field (for school students)
      // The college_school_name column is shared between school and college students
      if (showCustomSchool && customSchoolName) {
        dataToSave.college = customSchoolName;
        dataToSave.schoolId = null;
      }
      
      // Custom semester → section field AND sync grade for university students
      if (showCustomSemester && customSemesterName) {
        dataToSave.section = customSemesterName;
        dataToSave.programSectionId = null;
        
        // Auto-detect year from semester and update grade for university students
        const lowerSemester = customSemesterName.toLowerCase();
        let yearNumber = null;
        let semesterNumber = null;
        let validationError = null;
        
        // Check for patterns like "1st year", "2nd year", "3rd year", "4th year"
        const yearMatch = lowerSemester.match(/(\d+)(?:st|nd|rd|th)?\s*year/);
        if (yearMatch) {
          yearNumber = parseInt(yearMatch[1]);
          
          // Validate year based on program type
          if (dataToSave.grade && dataToSave.grade.includes('UG') && yearNumber > 5) {
            validationError = 'UG programs typically have max 5 years (10 semesters)';
          } else if (dataToSave.grade && dataToSave.grade.includes('PG') && yearNumber > 2) {
            validationError = 'PG programs typically have max 2 years (4 semesters)';
          }
        } else {
          // Check for semester numbers and convert to year
          const semMatch = lowerSemester.match(/(?:semester|sem)?\s*(\d+)/);
          if (semMatch) {
            semesterNumber = parseInt(semMatch[1]);
            
            // Validate semester based on program type
            if (dataToSave.grade && dataToSave.grade.includes('UG') && semesterNumber > 10) {
              validationError = 'UG programs typically have max 10 semesters';
            } else if (dataToSave.grade && dataToSave.grade.includes('PG') && semesterNumber > 4) {
              validationError = 'PG programs typically have max 4 semesters';
            } else if (dataToSave.grade && dataToSave.grade.includes('Diploma') && semesterNumber > 6) {
              validationError = 'Diploma programs typically have max 6 semesters';
            }
            
            yearNumber = Math.ceil(semesterNumber / 2);
          }
        }
        
        // Show validation error if semester/year is invalid
        if (validationError) {
          toast.error(validationError);
          return; // Don't save if validation fails
        }
        
        // Update grade based on detected year and current program type (only if no validation error)
        if (yearNumber && dataToSave.grade) {
          let newGrade = '';
          if (dataToSave.grade.includes('UG')) {
            newGrade = `UG Year ${yearNumber}`;
          } else if (dataToSave.grade.includes('PG')) {
            newGrade = `PG Year ${yearNumber}`;
          }
          
          // Validate grade length (database limit is 10 characters)
          if (newGrade && newGrade.length > 10) {
            toast.error("Grade value is too long. Please use shorter format (max 10 characters).");
            return;
          }
          
          dataToSave.grade = newGrade;
        }
      }
      
      // Custom school class → sync to grade ONLY (ONLY for school students)
      // NOTE: We do NOT store custom class in section field - section should remain independent
      if (showCustomSchoolClass && customSchoolClassName) {
        dataToSave.schoolClassId = null;
        
        // Only sync grade for school students (not university path)
        const isUniversityPath = dataToSave.universityId || dataToSave.universityCollegeId || dataToSave.programId;
        if (!isUniversityPath) {
          // Extract grade from custom class name (e.g., "Grade 10-A" or "10" -> "Grade 10")
          const gradeMatch = customSchoolClassName.match(/(?:Grade\s*)?(\d+)/i);
          if (gradeMatch) {
            const numericGrade = gradeMatch[1];
            dataToSave.grade = `Grade ${numericGrade}`;
          }
        }
        // Store custom class name in a display field if needed, but NOT in section
        // The section field should remain independent for roll number/section assignment
      }
      
      // If schoolClassId is selected from dropdown, clear custom class
      if (dataToSave.schoolClassId && dataToSave.schoolClassId !== null) {
        // Don't override section if it's a valid schoolClassId
        // The section field should only be used for custom entries
      }
      
      await updateProfile(dataToSave);
      toast.success("Institution details updated successfully");
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: dataToSave }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating institution details:', error);
      toast.error(error.message || "Failed to update institution details");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle resume data extraction and auto-fill
  const handleResumeDataExtracted = async (parsedData) => {
    try {
      const currentProfile = profileData;
      const mergedData = mergeResumeData(currentProfile, parsedData);
      
      setProfileData(mergedData);
      
      await updateProfile(mergedData);
      
      if (parsedData.education && parsedData.education.length > 0) {
        // Education data will be automatically updated by the hook
        if (updateEducation) {
          await updateEducation(parsedData.education);
        }
      }
      
      toast.success("Profile auto-filled from resume successfully!");
      
      setShowResumeParser(false);
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      toast.error("Failed to auto-fill profile from resume. Please try again.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "subscription", label: "Subscription", icon: CreditCard },
  ];

  // Show loading state
  if (studentLoading || educationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (studentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Settings
            </h2>
            <p className="text-gray-600 mb-4">{studentError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-10">
          <div className="flex items-center gap-3 lg:gap-4 mb-3">
            <div className="p-2.5 lg:p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl lg:rounded-2xl shadow-sm shadow-blue-500/20">
              <SettingsIcon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
              <p className="text-sm lg:text-base text-gray-600 mt-0.5">Manage your account preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* LEFT SIDEBAR - Navigation */}
          <div className="lg:col-span-1 space-y-6 order-1 lg:order-1">
            <div className="sticky top-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm shadow-slate-200/50">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="text-sm font-semibold text-gray-800 tracking-wide flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-blue-600" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-3">
                  <nav className="space-y-3">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full rounded-xl transition-all duration-300 group relative ${
                            isActive
                              ? "bg-gradient-to-r from-blue-50/70 to-indigo-50/60 border-l-4 border-blue-500"
                              : "hover:bg-gray-50/70 border-l-4 border-transparent hover:border-gray-200 hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
                          }`}
                        >
                          <div className="flex items-center justify-between px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg transition-all duration-300 ${
                                  isActive
                                    ? "bg-blue-500"
                                    : "bg-gray-100 group-hover:bg-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                                }`}
                              >
                                <Icon
                                  className={`w-4 h-4 transition-colors ${
                                    isActive
                                      ? "text-white"
                                      : "text-gray-600 group-hover:text-gray-800"
                                  }`}
                                />
                              </div>
                              <div className="text-left">
                                <p
                                  className={`font-medium text-[0.9rem] transition-colors leading-tight ${
                                    isActive
                                      ? "text-gray-900"
                                      : "text-gray-700 group-hover:text-gray-900"
                                  }`}
                                >
                                  {tab.label}
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 transition-all duration-300 ${
                                isActive
                                  ? "text-blue-500 translate-x-1"
                                  : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="lg:col-span-3 order-2 lg:order-2">
              {/* Profile Settings */}
              {activeTab === "profile" && (
              <ProfileTab
                profileData={profileData}
                handleProfileChange={handleProfileChange}
                handleInstitutionChange={handleInstitutionChange}
                isSaving={isSaving}
                initialActiveSubTab={location.state?.activeSubTab}
                // Tab-specific save handlers
                handleSavePersonalInfo={handleSavePersonalInfo}
                handleSaveAdditionalInfo={handleSaveAdditionalInfo}
                handleSaveInstitutionDetails={handleSaveInstitutionDetails}
                handleSaveAcademicDetails={handleSaveAcademicDetails}
                handleSaveGuardianInfo={handleSaveGuardianInfo}
                handleSaveSocialLinks={handleSaveSocialLinks}
                setShowResumeParser={setShowResumeParser}
                schools={schools}
                colleges={colleges}
                universities={universities}
                universityColleges={universityColleges}
                departments={departments}
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
                educationData={educationData}
                setShowEducationModal={setShowEducationModal}
                // New profile section props - now using real data
                softSkillsData={softSkillsData}
                setShowSoftSkillsModal={setShowSoftSkillsModal}
                technicalSkillsData={technicalSkillsData}
                setShowTechnicalSkillsModal={setShowTechnicalSkillsModal}
                experienceData={experienceData}
                setShowExperienceModal={setShowExperienceModal}
                certificatesData={certificatesData}
                setShowCertificatesModal={setShowCertificatesModal}
                projectsData={projectsData}
                setShowProjectsModal={setShowProjectsModal}
                studentData={studentData}
                // Toggle handlers for skills
                onToggleTechnicalSkillEnabled={handleToggleTechnicalSkillEnabled}
                onToggleSoftSkillEnabled={handleToggleSoftSkillEnabled}
              />
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <SecurityTab
                passwordData={passwordData}
                handlePasswordChange={handlePasswordChange}
                handleSavePassword={handleSavePassword}
                isSaving={isSaving}
                userEmail={userEmail}
              />
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <NotificationsTab
                notificationSettings={notificationSettings}
                handleNotificationToggle={handleNotificationToggle}
                handleSaveNotifications={handleSaveNotifications}
                isSaving={isSaving}
              />
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <PrivacyTab
                privacySettings={privacySettings}
                handlePrivacyChange={handlePrivacyChange}
                handleSavePrivacy={handleSavePrivacy}
                isSaving={isSaving}
              />
            )}

            {/* Subscription Settings */}
            {activeTab === "subscription" && (
              <SubscriptionSettingsSection />
            )}
          </div>
        </div>

        {/* Education Edit Modal */}
        {showEducationModal && (
          <EducationEditModal
            isOpen={showEducationModal}
            onClose={() => setShowEducationModal(false)}
            data={educationData}
            onSave={handleEducationSave}
          />
        )}

        {/* Soft Skills Edit Modal */}
        {showSoftSkillsModal && (
          <SoftSkillsEditModal
            isOpen={showSoftSkillsModal}
            onClose={() => setShowSoftSkillsModal(false)}
            data={softSkillsData}
            onSave={handleSoftSkillsSave}
          />
        )}

        {/* Technical Skills Edit Modal - Using same modal type as Dashboard */}
        {showTechnicalSkillsModal && (
          <SkillsEditModal
            isOpen={showTechnicalSkillsModal}
            onClose={() => setShowTechnicalSkillsModal(false)}
            data={technicalSkillsData || []}
            onSave={handleTechnicalSkillsSave}
            title="Skills"
          />
        )}

        {/* Experience Edit Modal */}
        {showExperienceModal && (
          <ExperienceEditModal
            isOpen={showExperienceModal}
            onClose={() => setShowExperienceModal(false)}
            data={experienceData}
            onSave={handleExperienceSave}
          />
        )}

        {/* Certificates Edit Modal */}
        {showCertificatesModal && (
          <CertificatesEditModal
            isOpen={showCertificatesModal}
            onClose={() => setShowCertificatesModal(false)}
            data={certificatesData}
            onSave={handleCertificatesSave}
          />
        )}

        {/* Projects Edit Modal */}
        {showProjectsModal && (
          <ProjectsEditModal
            isOpen={showProjectsModal}
            onClose={() => setShowProjectsModal(false)}
            data={projectsData}
            onSave={handleProjectsSave}
          />
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

export default MainSettings;