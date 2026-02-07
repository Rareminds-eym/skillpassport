import React, { useEffect, useRef, useState } from "react";
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
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../../../context/AuthContext";
import { useStudentSettings } from "../../../../hooks/useStudentSettings";
import { useStudentDataByEmail } from "../../../../hooks/useStudentDataByEmail";
import { useStudentCertificates } from "../../../../hooks/useStudentCertificates";
import { useStudentProjects } from "../../../../hooks/useStudentProjects";
import { useStudentExperience } from "../../../../hooks/useStudentExperience";
import { useStudentEducation } from "../../../../hooks/useStudentEducation";
import { useStudentTechnicalSkills, useStudentSoftSkills } from "../../../../hooks/useStudentSkills";
import { useInstitutions } from "../../../../hooks/useInstitutions";
import { SubscriptionSettingsSection } from "../../../Subscription/SubscriptionSettingsSection";
import { 
  EducationEditModal, 
  SoftSkillsEditModal, 
  SkillsEditModal, 
  ExperienceEditModal, 
  CertificatesEditModal, 
  ProjectsEditModal 
} from "../ProfileEditModals";
import { useToast } from "../../../../hooks/use-toast";
import useStudentMessageNotifications from "../../../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../../../hooks/useStudentMessages";
import { useStudentRealtimeActivities } from "../../../../hooks/useStudentRealtimeActivities";
import ResumeParser from "../ResumeParser";
import { mergeResumeData } from "../../../../services/resumeParserService";

// Import tab components
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import NotificationsTab from "./NotificationsTab";
import PrivacyTab from "./PrivacyTab";

const MainSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  // Fetch certificates from dedicated table
  const {
    certificates: tableCertificates,
    loading: certificatesLoading,
    error: certificatesError,
    refresh: refreshCertificates
  } = useStudentCertificates(studentId, !!studentId);

  // Fetch projects from dedicated table
  const {
    projects: tableProjects,
    loading: projectsLoading,
    error: projectsError,
    refresh: refreshProjects
  } = useStudentProjects(studentId, !!studentId);

  // Fetch experience from dedicated table
  const {
    experience: tableExperience,
    loading: experienceLoading,
    error: experienceError,
    refresh: refreshExperience
  } = useStudentExperience(studentId, !!studentId);

  // Fetch education from dedicated table
  const {
    education: tableEducation,
    loading: educationTableLoading,
    error: educationTableError,
    refresh: refreshEducation
  } = useStudentEducation(studentId, !!studentId);

  // Fetch technical skills from dedicated table
  const {
    skills: tableTechnicalSkills,
    loading: technicalSkillsLoading,
    error: technicalSkillsError,
    refresh: refreshTechnicalSkills
  } = useStudentTechnicalSkills(studentId, !!studentId);

  // Fetch soft skills from dedicated table
  const {
    skills: tableSoftSkills,
    loading: softSkillsLoading,
    error: softSkillsError,
    refresh: refreshSoftSkills
  } = useStudentSoftSkills(studentId, !!studentId);

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
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // Education management state - now using real data from dedicated table
  const educationData = Array.isArray(tableEducation) && tableEducation.length > 0 
    ? tableEducation 
    : studentDataWithEducation?.education || [];
  
  // Debug: Log education data source
  console.log('🔍 MainSettings - Education data source:', {
    tableEducationLength: tableEducation?.length || 0,
    tableEducation: tableEducation,
    fallbackLength: (studentDataWithEducation?.education || []).length,
    usingTableData: Array.isArray(tableEducation) && tableEducation.length > 0,
    finalEducationData: educationData
  });
  
  const [showEducationModal, setShowEducationModal] = useState(false);

  // Profile sections data - now using real data from studentDataWithEducation
  const softSkillsData = Array.isArray(tableSoftSkills) && tableSoftSkills.length > 0 
    ? tableSoftSkills 
    : studentDataWithEducation?.softSkills || [];
  const [showSoftSkillsModal, setShowSoftSkillsModal] = useState(false);
  
  const technicalSkillsData = Array.isArray(tableTechnicalSkills) && tableTechnicalSkills.length > 0 
    ? tableTechnicalSkills 
    : studentDataWithEducation?.technicalSkills || [];
  const [showTechnicalSkillsModal, setShowTechnicalSkillsModal] = useState(false);
  
  // Use experience from dedicated table, fallback to profile data
  const experienceData = Array.isArray(tableExperience) && tableExperience.length > 0 
    ? tableExperience 
    : studentDataWithEducation?.experience || [];
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  
  // Use certificates from dedicated table, fallback to profile data
  const certificatesData = Array.isArray(tableCertificates) && tableCertificates.length > 0 
    ? tableCertificates 
    : studentDataWithEducation?.certificates || [];
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  
  // Use projects from dedicated table, fallback to profile data
  const projectsData = Array.isArray(tableProjects) && tableProjects.length > 0 
    ? tableProjects 
    : studentDataWithEducation?.projects || [];
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // Resume parser state
  const [showResumeParser, setShowResumeParser] = useState(false);

  // State for custom institution entry (B2C students)
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

  // Load student data into form
  useEffect(() => {
    if (studentData && !savingRef.current) {
      setProfileData({
        name: studentData.name || "",
        email: studentData.email || userEmail || "",
        phone: studentData.phone || "",
        alternatePhone: studentData.alternatePhone || "",
        location: studentData.location || "",
        address: studentData.address || "",
        state: studentData.state || "",
        country: studentData.country || "India",
        pincode: studentData.pincode || "",
        dateOfBirth: studentData.dateOfBirth || "",
        age: studentData.age || "",
        gender: studentData.gender || "",
        bloodGroup: studentData.bloodGroup || "",
        university: studentData.university || "",
        branch: studentData.branch || "",
        college: studentData.college || "",
        registrationNumber: studentData.registrationNumber || "",
        enrollmentNumber: studentData.enrollmentNumber || "",
        currentCgpa: studentData.currentCgpa || "",
        grade: studentData.grade || "",
        gradeStartDate: studentData.gradeStartDate || "",
        universityCollegeId: studentData.universityCollegeId || "",
        universityId: studentData.universityId || "",
        schoolId: studentData.schoolId || "",
        schoolClassId: studentData.schoolClassId || "",
        collegeId: studentData.collegeId || "",
        programId: studentData.programId || "",
        programSectionId: studentData.programSectionId || "",
        semester: studentData.semester || "",
        section: studentData.section || "",
        guardianName: studentData.guardianName || "",
        guardianPhone: studentData.guardianPhone || "",
        guardianEmail: studentData.guardianEmail || "",
        guardianRelation: studentData.guardianRelation || "",
        bio: studentData.bio || "",
        linkedIn: studentData.linkedIn || "",
        github: studentData.github || "",
        twitter: studentData.twitter || "",
        facebook: studentData.facebook || "",
        instagram: studentData.instagram || "",
        portfolio: studentData.portfolio || "",
        // New fields for gap years, work experience, and academic info
        gapInStudies: studentData.gapInStudies || false,
        gapYears: studentData.gapYears || 0,
        gapReason: studentData.gapReason || "",
        workExperience: studentData.workExperience || "",
        aadharNumber: studentData.aadharNumber || "",
        backlogsHistory: studentData.backlogsHistory || "",
        currentBacklogs: studentData.currentBacklogs || 0,
      });

      // Detect custom entries (B2C students) and show custom input fields
      if (studentData.college && !studentData.universityCollegeId) {
        setShowCustomCollege(true);
        setCustomCollegeName(studentData.college);
      }
      if (studentData.university && !studentData.universityId) {
        setShowCustomUniversity(true);
        setCustomUniversityName(studentData.university);
      }
      if (studentData.branch && !studentData.programId) {
        setShowCustomProgram(true);
        setCustomProgramName(studentData.branch);
      }
      if (studentData.section && !studentData.programSectionId) {
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
  }, [studentData, userEmail]);

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
      
      toast({
        title: `Add New ${typeMap[field]}`,
        description: `Please contact your administrator to add a new ${typeMap[field].toLowerCase()}.`,
      });
      return;
    }
    
    // Handle cascading logic and field updates
    handleProfileChange(field, value);
  };

  // Education management functions
  const handleEducationSave = async (educationList) => {
    try {
      setIsSaving(true);
      
      console.log('💾 MainSettings: Saving education list:', educationList);
      
      const result = await updateEducation(educationList);
      
      console.log('✅ MainSettings: Education save result:', result);
      
      if (result.success) {
        // Refresh education data from table to get updated versioning fields
        if (refreshEducation && typeof refreshEducation === 'function') {
          console.log('🔄 MainSettings: Refreshing education data...');
          await refreshEducation();
          console.log('✅ MainSettings: Education data refreshed');
        }
        
        setShowEducationModal(false);
        
        toast({
          title: "Success",
          description: "Education updated successfully",
        });
        
        try {
          if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
            await refreshRecentUpdates();
          }
        } catch (refreshError) {
          console.warn('Could not refresh recent updates:', refreshError);
        }
      } else {
        throw new Error(result.error || 'Failed to update education');
      }
    } catch (error) {
      console.error('Education save error:', error);
      toast({
        title: "Error",
        description: "Failed to update education. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Soft Skills management functions
  const handleSoftSkillsSave = async (skillsList) => {
    try {
      setIsSaving(true);
      
      const result = await updateSoftSkills(skillsList);
      
      if (result.success) {
        setShowSoftSkillsModal(false);
        
        // Refresh soft skills data from table to get updated versioning fields
        if (refreshSoftSkills && typeof refreshSoftSkills === 'function') {
          await refreshSoftSkills();
        }
        
        toast({
          title: "Success",
          description: "Soft skills updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update soft skills');
      }
    } catch (error) {
      console.error('Soft skills save error:', error);
      toast({
        title: "Error",
        description: "Failed to update soft skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Technical Skills management functions
  const handleTechnicalSkillsSave = async (skillsList) => {
    try {
      setIsSaving(true);
      
      // Ensure all skills have type: "technical" when coming from Technical Skills (matching Dashboard)
      const skillsWithType = skillsList.map(skill => ({
        ...skill,
        type: "technical" // Force technical type for skills from Technical Skills
      }));
      
      console.log('🔧 Settings: Technical skills data being saved:', skillsWithType);
      
      // Use updateSkills (same as Dashboard) instead of updateTechnicalSkills
      const result = await updateSkills(skillsWithType);
      
      if (result.success) {
        setShowTechnicalSkillsModal(false);
        
        // Refresh technical skills data from table to get updated versioning fields
        if (refreshTechnicalSkills && typeof refreshTechnicalSkills === 'function') {
          await refreshTechnicalSkills();
        }
        
        toast({
          title: "Success",
          description: "Technical skills updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update technical skills');
      }
    } catch (error) {
      console.error('Technical skills save error:', error);
      toast({
        title: "Error",
        description: "Failed to update technical skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Experience management functions
  const handleExperienceSave = async (experienceList) => {
    try {
      setIsSaving(true);
      
      console.log('💾 MainSettings: Saving experience list:', experienceList);
      
      const result = await updateExperience(experienceList);
      
      console.log('✅ MainSettings: Experience save result:', result);
      
      if (result.success) {
        // Refresh experience from table
        if (refreshExperience) {
          console.log('🔄 MainSettings: Refreshing experience data...');
          await refreshExperience();
          console.log('✅ MainSettings: Experience data refreshed');
        }
        
        setShowExperienceModal(false);
        
        toast({
          title: "Success",
          description: "Experience updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update experience');
      }
    } catch (error) {
      console.error('Experience save error:', error);
      toast({
        title: "Error",
        description: "Failed to update experience. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Certificates management functions
  const handleCertificatesSave = async (certificatesList) => {
    try {
      setIsSaving(true);
      
      const result = await updateCertificates(certificatesList);
      
      if (result.success) {
        setShowCertificatesModal(false);
        
        // Refresh certificates from table
        if (refreshCertificates) {
          refreshCertificates();
        }
        
        toast({
          title: "Success",
          description: "Certificates updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update certificates');
      }
    } catch (error) {
      console.error('Certificates save error:', error);
      toast({
        title: "Error",
        description: "Failed to update certificates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Projects management functions
  const handleProjectsSave = async (projectsList) => {
    try {
      setIsSaving(true);
      
      const result = await updateProjects(projectsList);
      
      if (result.success) {
        setShowProjectsModal(false);
        
        // Refresh projects from table
        if (refreshProjects) {
          refreshProjects();
        }
        
        toast({
          title: "Success",
          description: "Projects updated successfully",
        });
      } else {
        throw new Error(result.error || 'Failed to update projects');
      }
    } catch (error) {
      console.error('Projects save error:', error);
      toast({
        title: "Error",
        description: "Failed to update projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Technical Skills toggle enabled handler
  const handleToggleTechnicalSkillEnabled = async (index) => {
    const skill = tableTechnicalSkills[index];
    if (!skill) return;
    
    const newState = !skill.enabled;
    
    // Don't allow hiding/showing items that are pending verification or approval
    if (skill.approval_status === 'pending' || skill._hasPendingEdit) {
      toast({ 
        title: "Cannot Hide/Show", 
        description: "You cannot hide or show skills that are pending verification or approval.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Update only the enabled field directly in database
      const { error } = await supabase
        .from('skills')
        .update({ enabled: newState })
        .eq('id', skill.id);
      
      if (error) throw error;
      
      // Refresh technical skills to get updated data
      if (refreshTechnicalSkills) {
        await refreshTechnicalSkills();
      }
      
      toast({ 
        title: newState ? "Visibility Enabled" : "Visibility Disabled", 
        description: `Technical skill ${newState ? 'is now visible' : 'is now hidden'} on your profile.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling technical skill visibility:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update visibility. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  // Soft Skills toggle enabled handler
  const handleToggleSoftSkillEnabled = async (index) => {
    const skill = tableSoftSkills[index];
    if (!skill) return;
    
    const newState = !skill.enabled;
    
    // Don't allow hiding/showing items that are pending verification or approval
    if (skill.approval_status === 'pending' || skill._hasPendingEdit) {
      toast({ 
        title: "Cannot Hide/Show", 
        description: "You cannot hide or show skills that are pending verification or approval.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    try {
      // Import supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      // Update only the enabled field directly in database
      const { error } = await supabase
        .from('skills')
        .update({ enabled: newState })
        .eq('id', skill.id);
      
      if (error) throw error;
      
      // Refresh soft skills to get updated data
      if (refreshSoftSkills) {
        await refreshSoftSkills();
      }
      
      toast({ 
        title: newState ? "Visibility Enabled" : "Visibility Disabled", 
        description: `Soft skill ${newState ? 'is now visible' : 'is now hidden'} on your profile.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling soft skill visibility:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update visibility. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  // General profile save handler - validates and saves all profile data
  const handleSaveProfile = async () => {
    // Validate Aadhar number before saving (only if it has a value and is not empty)
    if (profileData.aadharNumber && profileData.aadharNumber.trim() !== '') {
      if (profileData.aadharNumber.length !== 12) {
        toast({
          title: "Validation Error",
          description: "Aadhar number must be exactly 12 digits",
          variant: "destructive",
        });
        return;
      }
      
      if (profileData.aadharNumber.startsWith('0') || profileData.aadharNumber.startsWith('1')) {
        toast({
          title: "Validation Error",
          description: "Aadhar number cannot start with 0 or 1",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateProfile(profileData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: profileData }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Tab-specific save handlers - only save relevant fields for each tab
  
  // Personal Info Tab - save basic personal information
  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      const personalInfoFields = {
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
      };
      
      await updateProfile(personalInfoFields);
      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: personalInfoFields }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating personal info:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Additional Info Tab - save additional fields including Aadhar
  const handleSaveAdditionalInfo = async () => {
    // Validate Aadhar number before saving (only if it has a value and is not empty)
    if (profileData.aadharNumber && profileData.aadharNumber.trim() !== '') {
      if (profileData.aadharNumber.length !== 12) {
        toast({
          title: "Validation Error",
          description: "Aadhar number must be exactly 12 digits",
          variant: "destructive",
        });
        return;
      }
      
      if (profileData.aadharNumber.startsWith('0') || profileData.aadharNumber.startsWith('1')) {
        toast({
          title: "Validation Error",
          description: "Aadhar number cannot start with 0 or 1",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // Merge custom institution fields into profileData before saving
      const dataToSave = { ...profileData };
      
      // Custom program name → branch field (for assessment tests)
      if (showCustomProgram && customProgramName) {
        dataToSave.branch = customProgramName;
        dataToSave.programId = null; // Clear FK to use manual entry
      }
      
      // Custom college name → college field
      if (showCustomCollege && customCollegeName) {
        dataToSave.college = customCollegeName;
        dataToSave.universityCollegeId = null;
      }
      
      // Custom university name → university field
      if (showCustomUniversity && customUniversityName) {
        dataToSave.university = customUniversityName;
        dataToSave.universityId = null;
      }
      
      // Custom school name → college field (school uses same field)
      if (showCustomSchool && customSchoolName) {
        dataToSave.college = customSchoolName;
        dataToSave.schoolId = null;
      }
      
      // Custom semester → section field
      if (showCustomSemester && customSemesterName) {
        dataToSave.section = customSemesterName;
        dataToSave.programSectionId = null;
      }
      
      // Custom school class → section field
      if (showCustomSchoolClass && customSchoolClassName) {
        dataToSave.section = customSchoolClassName;
        dataToSave.schoolClassId = null;
      }
      
      await updateProfile(dataToSave);
      toast({
        title: "Success",
        description: "Academic details updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: academicFields }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating academic details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update academic details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Institution Details Tab - save institution-related fields
  const handleSaveInstitutionDetails = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { ...profileData };
      
      // Custom program name → branch field (for assessment tests)
      if (showCustomProgram && customProgramName) {
        dataToSave.branch = customProgramName;
        dataToSave.programId = null;
      }
      
      // Custom college name → college field
      if (showCustomCollege && customCollegeName) {
        dataToSave.college = customCollegeName;
        dataToSave.universityCollegeId = null;
      }
      
      // Custom university name → university field
      if (showCustomUniversity && customUniversityName) {
        dataToSave.university = customUniversityName;
        dataToSave.universityId = null;
      }
      
      // Custom school name → college field (school uses same field)
      if (showCustomSchool && customSchoolName) {
        dataToSave.college = customSchoolName;
        dataToSave.schoolId = null;
      }
      
      // Custom semester → section field
      if (showCustomSemester && customSemesterName) {
        dataToSave.section = customSemesterName;
        dataToSave.programSectionId = null;
      }
      
      // Custom school class → section field
      if (showCustomSchoolClass && customSchoolClassName) {
        dataToSave.section = customSchoolClassName;
        dataToSave.schoolClassId = null;
      }
      
      await updateProfile(dataToSave);
      toast({
        title: "Success",
        description: "Institution details updated successfully",
      });
      
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
      toast({
        title: "Error",
        description: error.message || "Failed to update institution details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Academic Details Tab - save academic-related fields
  const handleSaveAcademicDetails = async () => {
    setIsSaving(true);
    try {
      const academicFields = {
        rollNumber: profileData.rollNumber,
        registrationNumber: profileData.registrationNumber,
        yearOfStudy: profileData.yearOfStudy,
        cgpa: profileData.cgpa,
        percentage: profileData.percentage,
      };
      
      await updateProfile(academicFields);
      toast({
        title: "Success",
        description: "Academic details updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: academicFields }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating academic details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update academic details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Guardian Info Tab - save guardian information
  const handleSaveGuardianInfo = async () => {
    setIsSaving(true);
    try {
      const guardianFields = {
        guardianName: profileData.guardianName,
        guardianPhone: profileData.guardianPhone,
        guardianEmail: profileData.guardianEmail,
        guardianRelation: profileData.guardianRelation,
      };
      
      await updateProfile(guardianFields);
      toast({
        title: "Success",
        description: "Guardian information updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: guardianFields }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating guardian info:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update guardian information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Social Links Tab - save social media and bio
  const handleSaveSocialLinks = async () => {
    setIsSaving(true);
    try {
      const socialFields = {
        bio: profileData.bio,
        linkedIn: profileData.linkedIn,
        github: profileData.github,
        twitter: profileData.twitter,
        facebook: profileData.facebook,
        instagram: profileData.instagram,
        portfolio: profileData.portfolio,
      };
      
      await updateProfile(socialFields);
      toast({
        title: "Success",
        description: "Social links updated successfully",
      });
      
      window.dispatchEvent(new CustomEvent('student_settings_updated', {
        detail: { type: 'profile_updated', data: socialFields }
      }));
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error updating social links:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update social links",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      if (result && result.success === false) {
        toast({
          title: "Password Change Failed",
          description: result.error || "Failed to update password",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Password updated successfully! You can now use your new password to log in.",
      });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    savingRef.current = true;
    try {
      const currentSettings = { ...notificationSettings };
      
      await updateProfile({ notificationSettings: currentSettings });
      
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
      
      setNotificationSettings(currentSettings);
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        savingRef.current = false;
      }, 1000);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    savingRef.current = true;
    try {
      const currentSettings = { ...privacySettings };
      
      await updateProfile({ privacySettings: currentSettings });
      
      toast({
        title: "Success",
        description: "Privacy settings updated",
      });
      
      setPrivacySettings(currentSettings);
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        savingRef.current = false;
      }, 1000);
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
      
      toast({
        title: "Success",
        description: "Profile auto-filled from resume successfully!",
      });
      
      setShowResumeParser(false);
      
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Error saving resume data:', error);
      toast({
        title: "Error",
        description: "Failed to auto-fill profile from resume. Please try again.",
        variant: "destructive",
      });
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                Settings
              </h1>
              <p className="text-sm lg:text-base text-gray-600 mt-0.5">
                Manage your account preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* LEFT SIDEBAR - Navigation */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
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
                          className={`w-full rounded-xl transition-all duration-300 group relative
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-50/70 to-indigo-50/60 border-l-4 border-blue-500"
                                : "hover:bg-gray-50/70 border-l-4 border-transparent hover:border-gray-200 hover:shadow-[0_1px_6px_rgba(0,0,0,0.03)]"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`
                                  p-2 rounded-lg transition-all duration-300
                                  ${
                                    isActive
                                      ? "bg-blue-500"
                                      : "bg-gray-100 group-hover:bg-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                                  }
                                `}
                              >
                                <Icon
                                  className={`
                                    w-4 h-4 transition-colors
                                    ${
                                      isActive
                                        ? "text-white"
                                        : "text-gray-600 group-hover:text-gray-800"
                                    }
                                  `}
                                />
                              </div>

                              <div className="text-left">
                                <p
                                  className={`
                                    font-medium text-[0.9rem] transition-colors leading-tight
                                    ${
                                      isActive
                                        ? "text-gray-900"
                                        : "text-gray-700 group-hover:text-gray-900"
                                    }
                                  `}
                                >
                                  {tab.label}
                                </p>
                              </div>
                            </div>

                            <ChevronRight
                              className={`
                                w-4 h-4 transition-all duration-300
                                ${
                                  isActive
                                    ? "text-blue-500 translate-x-1"
                                    : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                                }
                              `}
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
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <ProfileTab
                profileData={profileData}
                handleProfileChange={handleProfileChange}
                handleInstitutionChange={handleInstitutionChange}
                isSaving={isSaving}
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