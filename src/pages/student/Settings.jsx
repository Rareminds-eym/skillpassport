import {
    AlertCircle,
    Bell,
    Briefcase,
    ChevronRight,
    CreditCard,
    Eye,
    EyeOff,
    Globe,
    Lock,
    Mail,
    MapPin,
    Phone,
    Plus,
    Save,
    Settings as SettingsIcon,
    Shield,
    User
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../../components/Students/components/ui/badge";
import { Button } from "../../components/Students/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/Students/components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { useStudentSettings } from "../../hooks/useStudentSettings";
import { useInstitutions } from "../../hooks/useInstitutions";

import { SubscriptionSettingsSection } from "../../components/Subscription/SubscriptionSettingsSection";
import { useToast } from "../../hooks/use-toast";
import useStudentMessageNotifications from "../../hooks/useStudentMessageNotifications";
import { useStudentUnreadCount } from "../../hooks/useStudentMessages";
import { useStudentRealtimeActivities } from "../../hooks/useStudentRealtimeActivities";

const Settings = () => {
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

  // Get student ID for messaging
  const studentId = studentData?.id;

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

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

  // Debug: Log institutions data
  useEffect(() => {
    console.log('📚 Institutions loaded:', {
      schools: schools?.length || 0,
      colleges: colleges?.length || 0,
      universityColleges: universityColleges?.length || 0,
      programs: programs?.length || 0,
      schoolClasses: schoolClasses?.length || 0,
    });
  }, [schools, colleges, universityColleges, programs, schoolClasses]);

  // Handle "Add New" selection
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
    
    // Hide custom inputs when selecting from dropdown
    if (field === 'schoolId' && value) {
      setShowCustomSchool(false);
      setCustomSchoolName('');
    } else if (field === 'universityId' && value) {
      setShowCustomUniversity(false);
      setCustomUniversityName('');
    } else if (field === 'universityCollegeId' && value) {
      setShowCustomCollege(false);
      setCustomCollegeName('');
    } else if (field === 'schoolClassId' && value) {
      setShowCustomSchoolClass(false);
      setCustomSchoolClassName('');
    } else if (field === 'programId' && value) {
      setShowCustomProgram(false);
      setCustomProgramName('');
    } else if (field === 'programSectionId' && value) {
      setShowCustomSemester(false);
      setCustomSemesterName('');
    }
    
    // Cascading logic: clear dependent fields
    if (field === 'schoolId') {
      // If school is selected, clear all university-related fields (including custom)
      setProfileData(prev => ({
        ...prev,
        schoolId: value,
        schoolClassId: '',
        grade: '', // Clear grade when school changes
        // Clear university path (both dropdown and custom)
        universityId: '',
        universityCollegeId: '',
        departmentId: '',
        programId: '',
        programSectionId: '',
        university: '',
        college: '',
        branch: '',
        section: '',
      }));
      // Clear custom university fields
      setShowCustomUniversity(false);
      setCustomUniversityName('');
      setShowCustomCollege(false);
      setCustomCollegeName('');
      setShowCustomProgram(false);
      setCustomProgramName('');
      setShowCustomSemester(false);
      setCustomSemesterName('');
    } else if (field === 'schoolClassId') {
      // If school class is selected, auto-set grade
      const selectedClass = schoolClasses.find(sc => sc.id === value);
      const gradeValue = selectedClass ? `Grade ${selectedClass.grade}` : '';
      setProfileData(prev => ({
        ...prev,
        schoolClassId: value,
        grade: gradeValue,
      }));
    } else if (field === 'universityId') {
      // If university is selected, clear all school-related fields (including custom)
      setProfileData(prev => ({
        ...prev,
        universityId: value,
        universityCollegeId: '',
        programId: '',
        programSectionId: '',
        grade: '', // Clear grade when university changes
        // Clear school path (both dropdown and custom)
        schoolId: '',
        schoolClassId: '',
        college: '', // This field is used for custom school name
        section: '', // This field is used for custom class name
      }));
      // Clear custom school fields
      setShowCustomSchool(false);
      setCustomSchoolName('');
      setShowCustomSchoolClass(false);
      setCustomSchoolClassName('');
    } else if (field === 'universityCollegeId') {
      // If university college changes, clear program
      setProfileData(prev => ({
        ...prev,
        universityCollegeId: value,
        programId: '',
        programSectionId: '',
        grade: '', // Clear grade when college changes
      }));
    } else if (field === 'programId') {
      // If program is selected, auto-set grade based on degree level
      const selectedProgram = programs.find(p => p.id === value);
      let gradeValue = '';
      if (selectedProgram) {
        const degreeLevel = selectedProgram.degree_level?.toLowerCase();
        if (degreeLevel?.includes('undergraduate') || degreeLevel?.includes('bachelor')) {
          gradeValue = 'UG Year 1'; // Shortened to fit 10 char limit
        } else if (degreeLevel?.includes('postgraduate') || degreeLevel?.includes('master') || degreeLevel?.includes('pg')) {
          gradeValue = 'PG Year 1'; // Shortened to fit 10 char limit
        } else if (degreeLevel?.includes('diploma')) {
          gradeValue = 'Diploma';
        }
      }
      setProfileData(prev => ({
        ...prev,
        programId: value,
        programSectionId: '',
        grade: gradeValue,
      }));
    } else if (field === 'programSectionId') {
      // If program section is selected, auto-set semester and grade
      const selectedSection = programSections.find(ps => ps.id === value);
      if (selectedSection) {
        const semesterNum = selectedSection.semester;
        const year = Math.ceil(semesterNum / 2);
        
        // Determine if UG or PG based on current grade or program
        const currentGrade = profileData.grade || '';
        let gradeValue = '';
        
        if (currentGrade.includes('PG') || semesterNum <= 4) {
          // PG programs (2 years = 4 semesters)
          gradeValue = semesterNum <= 2 ? 'PG Year 1' : 'PG Year 2';
        } else {
          // UG programs (4 years = 8 semesters)
          gradeValue = `UG Year ${Math.min(year, 4)}`;
        }
        
        setProfileData(prev => ({
          ...prev,
          programSectionId: value,
          semester: semesterNum,
          grade: gradeValue,
        }));
      } else {
        setProfileData(prev => ({
          ...prev,
          programSectionId: value,
        }));
      }
    } else if (field === 'collegeId') {
      // If college changes, clear program
      setProfileData(prev => ({
        ...prev,
        collegeId: value,
        programId: '',
      }));
    } else {
      handleProfileChange(field, value);
    }
  };

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
      });

      // Detect custom entries (B2C students) and show custom input fields
      // If text fields have data but no ID is set, show custom input
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
      // Check for custom semester/section (stored in section field)
      if (studentData.section && !studentData.programSectionId) {
        setShowCustomSemester(true);
        setCustomSemesterName(studentData.section);
      }

      // Load notification settings - only when not saving
      if (studentData.notificationSettings && !savingRef.current) {
        setNotificationSettings(studentData.notificationSettings);
      }

      // Load privacy settings - only when not saving
      if (studentData.privacySettings && !savingRef.current) {
        setPrivacySettings(studentData.privacySettings);
      }
    }
  }, [studentData, userEmail]);

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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(profileData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      // Refresh recent updates if available
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
        description: "Failed to update profile",
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
      console.log('🔐 Attempting password change for:', userEmail);
      
      const result = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      console.log('🔐 Password change result:', result);
      
      if (result && result.success === false) {
        console.error('❌ Password change failed:', result.error);
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
      
      // Refresh recent updates if available
      try {
        if (refreshRecentUpdates && typeof refreshRecentUpdates === 'function') {
          await refreshRecentUpdates();
        }
      } catch (refreshError) {
        console.warn('Could not refresh recent updates:', refreshError);
      }
    } catch (error) {
      console.error('❌ Password change exception:', error);
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
      // Save the current state before update
      const currentSettings = { ...notificationSettings };
      
      await updateProfile({ notificationSettings: currentSettings });
      
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
      
      // Keep the current state (don't let it be overwritten)
      setNotificationSettings(currentSettings);
      
      // Refresh recent updates if available
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
      // Save the current state before update
      const currentSettings = { ...privacySettings };
      
      await updateProfile({ privacySettings: currentSettings });
      
      toast({
        title: "Success",
        description: "Privacy settings updated",
      });
      
      // Keep the current state (don't let it be overwritten)
      setPrivacySettings(currentSettings);
      
      // Refresh recent updates if available
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

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "subscription", label: "Subscription", icon: CreditCard },
  ];

  // Show loading state
  if (studentLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-sm shadow-blue-500/20">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Settings
              </h1>
              <p className="text-gray-600 mt-0.5">
                Manage your account preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SIDEBAR - Navigation & Updates */}
          <div className="lg:col-span-1 space-y-6">
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
                          {/* Left side: Icon + Label */}
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
                              {tab.description && (
                                <p
                                  className={`
                        text-xs transition-colors mt-0.5
                        ${
                          isActive
                            ? "text-gray-600"
                            : "text-gray-500 group-hover:text-gray-600"
                        }
                      `}
                                >
                                  {tab.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right side: Badge + Chevron */}
                          <div className="flex items-center gap-2">
                            {tab.badge && (
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                                className={`
                        text-xs font-medium px-2 py-0.5 border
                        ${
                          isActive
                            ? "bg-blue-100 text-blue-700 border-blue-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                            : "bg-gray-100 text-gray-600 border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        }
                      `}
                              >
                                {tab.badge}
                              </Badge>
                            )}
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
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Recent Updates - Hidden per user request */}
            {/* <RecentUpdatesCard
              ref={recentUpdatesRef}
              updates={recentUpdates}
              loading={recentUpdatesLoading}
              error={
                recentUpdatesError ? "Failed to load recent updates" : null
              }
              onRetry={refreshRecentUpdates}
              emptyMessage="No recent updates available"
              isExpanded={showAllRecentUpdates}
              onToggle={(next) => setShowAllRecentUpdates(next)}
              badgeContent={
                unreadCount > 0 ? (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-nowrap text-nowrap">
                    <MessageCircleIcon className="w-3.5 h-3.5" />
                    {unreadCount} {unreadCount === 1 ? "message" : "messages"}
                  </Badge>
                ) : null
              }
              getUpdateClassName={(update) => {
                switch (update.type) {
                  case "shortlist_added":
                    return "bg-yellow-50 border-yellow-300";
                  case "offer_extended":
                    return "bg-green-50 border-green-300";
                  case "offer_accepted":
                    return "bg-emerald-50 border-emerald-300";
                  case "placement_hired":
                    return "bg-purple-50 border-purple-300";
                  case "stage_change":
                    return "bg-indigo-50 border-indigo-300";
                  case "application_rejected":
                    return "bg-red-50 border-red-300";
                  default:
                    return "bg-gray-50 border-gray-200";
                }
              }}
            /> */}
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100 pb-5">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Profile Information
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-6 space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) =>
                            handleProfileChange("name", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          disabled
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            handleProfileChange("phone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter phone number"
                        />
                      </div>

                      {/* Alternate Phone */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Alternate Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.alternatePhone}
                          onChange={(e) =>
                            handleProfileChange(
                              "alternatePhone",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter alternate phone number"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) =>
                            handleProfileChange("dateOfBirth", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Gender
                        </label>
                        <select
                          value={profileData.gender}
                          onChange={(e) =>
                            handleProfileChange("gender", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Blood Group */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Blood Group
                        </label>
                        <select
                          value={profileData.bloodGroup}
                          onChange={(e) =>
                            handleProfileChange("bloodGroup", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Address
                        </label>
                        <textarea
                          value={profileData.address}
                          onChange={(e) =>
                            handleProfileChange("address", e.target.value)
                          }
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                          placeholder="Enter your full address"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) =>
                            handleProfileChange("location", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter city"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          value={profileData.state}
                          onChange={(e) =>
                            handleProfileChange("state", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter state"
                        />
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Country
                        </label>
                        <input
                          type="text"
                          value={profileData.country}
                          onChange={(e) =>
                            handleProfileChange("country", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter country"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={profileData.pincode}
                          onChange={(e) =>
                            handleProfileChange("pincode", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Institutional IDs Section */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Institution Details
                      </h3>
                      {/* Clear Path Buttons */}
                      <div className="flex gap-2">
                        {(profileData.schoolId || profileData.schoolClassId || showCustomSchool || customSchoolName || showCustomSchoolClass || customSchoolClassName) && (
                          <button
                            type="button"
                            onClick={() => {
                              // Clear all school-related fields
                              setProfileData(prev => ({
                                ...prev,
                                schoolId: '',
                                schoolClassId: '',
                                college: '',
                                section: '',
                              }));
                              setShowCustomSchool(false);
                              setCustomSchoolName('');
                              setShowCustomSchoolClass(false);
                              setCustomSchoolClassName('');
                              toast({
                                title: "School path cleared",
                                description: "You can now select university",
                              });
                            }}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Clear School Path
                          </button>
                        )}
                        {(profileData.universityId || profileData.universityCollegeId || profileData.programId || showCustomUniversity || customUniversityName || showCustomCollege || customCollegeName || showCustomProgram || customProgramName) && (
                          <button
                            type="button"
                            onClick={() => {
                              // Clear all university-related fields
                              setProfileData(prev => ({
                                ...prev,
                                universityId: '',
                                universityCollegeId: '',
                                programId: '',
                                programSectionId: '',
                                university: '',
                                branch: '',
                              }));
                              setShowCustomUniversity(false);
                              setCustomUniversityName('');
                              setShowCustomCollege(false);
                              setCustomCollegeName('');
                              setShowCustomProgram(false);
                              setCustomProgramName('');
                              setShowCustomSemester(false);
                              setCustomSemesterName('');
                              toast({
                                title: "University path cleared",
                                description: "You can now select school",
                              });
                            }}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            Clear University Path
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Organization Membership Card - Shows when assigned via invitation */}
                    {(studentData?.schoolOrganization || studentData?.collegeOrganization) && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">Organization Membership</h4>
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              You are a member of the following organization through an accepted invitation.
                            </p>
                            <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                              {studentData?.schoolOrganization && (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{studentData.schoolOrganization.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {studentData.schoolOrganization.organization_type === 'school' ? 'School' : 'Organization'}
                                      {studentData.schoolOrganization.city && ` • ${studentData.schoolOrganization.city}`}
                                      {studentData.schoolOrganization.state && `, ${studentData.schoolOrganization.state}`}
                                    </p>
                                  </div>
                                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    Read-only
                                  </div>
                                </div>
                              )}
                              {studentData?.collegeOrganization && (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{studentData.collegeOrganization.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {studentData.collegeOrganization.organization_type === 'college' ? 'College' : 'Organization'}
                                      {studentData.collegeOrganization.city && ` • ${studentData.collegeOrganization.city}`}
                                      {studentData.collegeOrganization.state && `, ${studentData.collegeOrganization.state}`}
                                    </p>
                                  </div>
                                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    Read-only
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* School */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          School
                        </label>
                        {!showCustomSchool ? (
                          <>
                            <select
                              value={profileData.schoolId}
                              onChange={(e) =>
                                handleInstitutionChange("schoolId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={!!profileData.universityId || showCustomUniversity || !!customUniversityName || !!profileData.universityCollegeId || showCustomCollege || !!customCollegeName}
                            >
                              <option value="">
                                {(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) ? 'University path selected - clear to use school' : 'Select School'}
                              </option>
                              {schools.map((school) => (
                                <option key={school.id} value={school.id}>
                                  {school.name} {school.city && `- ${school.city}`}
                                </option>
                              ))}
                              {!(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom School
                                </option>
                              )}
                            </select>
                            {(profileData.universityId || showCustomUniversity || customUniversityName || profileData.universityCollegeId || showCustomCollege || customCollegeName) && (
                              <p className="text-xs text-gray-500">Clear university path to use school</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customSchoolName}
                              onChange={(e) => {
                                const schoolName = e.target.value;
                                setCustomSchoolName(schoolName);
                                handleProfileChange("college", schoolName); // Store in college_school_name field
                                
                                // Clear university path when custom school is entered
                                if (schoolName) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    universityId: '',
                                    universityCollegeId: '',
                                    programId: '',
                                    programSectionId: '',
                                    university: '',
                                    branch: '',
                                    section: '',
                                  }));
                                  setShowCustomUniversity(false);
                                  setCustomUniversityName('');
                                  setShowCustomCollege(false);
                                  setCustomCollegeName('');
                                  setShowCustomProgram(false);
                                  setCustomProgramName('');
                                  setShowCustomSemester(false);
                                  setCustomSemesterName('');
                                }
                              }}
                              placeholder="Enter your school name"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomSchool(false);
                                setCustomSchoolName('');
                                handleProfileChange("college", '');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>

                      {/* School Class */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          School Class
                        </label>
                        {!showCustomSchoolClass ? (
                          <>
                            <select
                              value={profileData.schoolClassId}
                              onChange={(e) =>
                                handleInstitutionChange("schoolClassId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={(!profileData.schoolId && !showCustomSchool && !customSchoolName) || !!profileData.universityId || showCustomUniversity || !!customUniversityName}
                            >
                              <option value="">
                                {(profileData.schoolId || showCustomSchool || customSchoolName) ? 'Select Class' : 'Select a school first'}
                              </option>
                              {schoolClasses
                                .filter(sc => !profileData.schoolId || sc.school_id === profileData.schoolId)
                                .map((schoolClass) => (
                                  <option key={schoolClass.id} value={schoolClass.id}>
                                    {schoolClass.name || `Grade ${schoolClass.grade} - ${schoolClass.section}`}
                                  </option>
                                ))}
                              {(profileData.schoolId || showCustomSchool || customSchoolName) && !(profileData.universityId || showCustomUniversity || customUniversityName) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom Class
                                </option>
                              )}
                            </select>
                            {(!profileData.schoolId && !showCustomSchool && !customSchoolName) && (
                              <p className="text-xs text-gray-500">Please select a school first</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customSchoolClassName}
                              onChange={(e) => {
                                const className = e.target.value;
                                setCustomSchoolClassName(className);
                                // Store in section field
                                handleProfileChange("section", className);
                                
                                // Auto-extract and set grade from class name
                                // e.g., "Grade 10-A" -> "Grade 10", "Class 12-B" -> "Grade 12"
                                const gradeMatch = className.match(/(?:Grade|Class)\s*(\d+)/i);
                                if (gradeMatch) {
                                  const gradeNum = gradeMatch[1];
                                  handleProfileChange("grade", `Grade ${gradeNum}`);
                                }
                              }}
                              placeholder="Enter class/section (e.g., Grade 10-A)"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomSchoolClass(false);
                                setCustomSchoolClassName('');
                                handleProfileChange("section", '');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>

                      {/* University */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          University
                        </label>
                        {!showCustomUniversity ? (
                          <>
                            <select
                              value={profileData.universityId}
                              onChange={(e) =>
                                handleInstitutionChange("universityId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={!!profileData.schoolId || showCustomSchool || !!customSchoolName || !!profileData.schoolClassId || showCustomSchoolClass || !!customSchoolClassName}
                            >
                              <option value="">
                                {(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) ? 'School path selected - clear to use university' : 'Select University'}
                              </option>
                              {universities.map((uni) => (
                                <option key={uni.id} value={uni.id}>
                                  {uni.name} {uni.code && `(${uni.code})`}
                                </option>
                              ))}
                              {!(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom University
                                </option>
                              )}
                            </select>
                            {(profileData.schoolId || showCustomSchool || customSchoolName || profileData.schoolClassId || showCustomSchoolClass || customSchoolClassName) && (
                              <p className="text-xs text-gray-500">Clear school path to use university</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customUniversityName}
                              onChange={(e) => {
                                const universityName = e.target.value;
                                setCustomUniversityName(universityName);
                                handleProfileChange("university", universityName);
                                
                                // Clear school path when custom university is entered
                                if (universityName) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    schoolId: '',
                                    schoolClassId: '',
                                    college: '', // This field is used for custom school name
                                    section: '', // This field is used for custom class name
                                  }));
                                  setShowCustomSchool(false);
                                  setCustomSchoolName('');
                                  setShowCustomSchoolClass(false);
                                  setCustomSchoolClassName('');
                                }
                              }}
                              placeholder="Enter your university name"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomUniversity(false);
                                setCustomUniversityName('');
                                handleProfileChange("university", '');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>

                      {/* College (University College) */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          College
                        </label>
                        {!showCustomCollege ? (
                          <>
                            <select
                              value={profileData.universityCollegeId}
                              onChange={(e) =>
                                handleInstitutionChange("universityCollegeId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={(!profileData.universityId && !showCustomUniversity && !customUniversityName) || !!profileData.schoolId || showCustomSchool || !!customSchoolName}
                            >
                              <option value="">
                                {(profileData.universityId || showCustomUniversity || customUniversityName) ? 'Select College' : 'Select university first'}
                              </option>
                              {universityColleges
                                .filter(uc => !profileData.universityId || uc.university_id === profileData.universityId)
                                .map((uc) => (
                                  <option key={uc.id} value={uc.id}>
                                    {uc.name} {uc.code && `(${uc.code})`}
                                  </option>
                                ))}
                              {(profileData.universityId || showCustomUniversity || customUniversityName) && !(profileData.schoolId || showCustomSchool || customSchoolName) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom College
                                </option>
                              )}
                            </select>
                            {(!profileData.universityId && !showCustomUniversity && !customUniversityName) && (
                              <p className="text-xs text-gray-500">Please select a university first</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customCollegeName}
                              onChange={(e) => {
                                const collegeName = e.target.value;
                                setCustomCollegeName(collegeName);
                                handleProfileChange("college", collegeName);
                                
                                // Clear school path when custom college is entered
                                if (collegeName) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    schoolId: '',
                                    schoolClassId: '',
                                  }));
                                  setShowCustomSchool(false);
                                  setCustomSchoolName('');
                                  setShowCustomSchoolClass(false);
                                  setCustomSchoolClassName('');
                                }
                              }}
                              placeholder="Enter your college name"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomCollege(false);
                                setCustomCollegeName('');
                                handleProfileChange("college", '');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>

                      {/* Program */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Program
                        </label>
                        {!showCustomProgram ? (
                          <>
                            <select
                              value={profileData.programId}
                              onChange={(e) =>
                                handleInstitutionChange("programId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) || !!profileData.schoolId || showCustomSchool || !!customSchoolName}
                            >
                              <option value="">
                                {(profileData.universityCollegeId || showCustomCollege || customCollegeName) ? 'Select Program' : 'Select college first'}
                              </option>
                              {programs.map((program) => (
                                <option key={program.id} value={program.id}>
                                  {program.name} {program.degree_level && `(${program.degree_level})`}
                                </option>
                              ))}
                              {(profileData.universityCollegeId || showCustomCollege || customCollegeName) && !(profileData.schoolId || showCustomSchool || customSchoolName) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom Program
                                </option>
                              )}
                            </select>
                            {(!profileData.universityCollegeId && !showCustomCollege && !customCollegeName) && (
                              <p className="text-xs text-gray-500">Please select a college first</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customProgramName}
                              onChange={(e) => {
                                const programName = e.target.value;
                                setCustomProgramName(programName);
                                // Store in branch_field
                                handleProfileChange("branch", programName);
                                
                                // Auto-set grade based on program name
                                const lowerName = programName.toLowerCase();
                                if (lowerName.includes('bachelor') || lowerName.includes('b.tech') || lowerName.includes('b.sc') || lowerName.includes('bca') || lowerName.includes('ug')) {
                                  handleProfileChange("grade", "UG Year 1");
                                } else if (lowerName.includes('master') || lowerName.includes('m.tech') || lowerName.includes('m.sc') || lowerName.includes('mca') || lowerName.includes('pg') || lowerName.includes('mba')) {
                                  handleProfileChange("grade", "PG Year 1");
                                } else if (lowerName.includes('diploma')) {
                                  handleProfileChange("grade", "Diploma");
                                }
                              }}
                              placeholder="Enter program name (e.g., B.Tech Computer Science)"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomProgram(false);
                                setCustomProgramName('');
                                handleProfileChange("branch", '');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>

                      {/* Semester/Section */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Semester / Section
                        </label>
                        {!showCustomSemester ? (
                          <>
                            <select
                              value={profileData.programSectionId}
                              onChange={(e) =>
                                handleInstitutionChange("programSectionId", e.target.value)
                              }
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                              disabled={!profileData.programId && !showCustomProgram}
                            >
                              <option value="">
                                {profileData.programId || showCustomProgram ? 'Select Semester/Section' : 'Select program first'}
                              </option>
                              {programSections
                                .filter(ps => !profileData.programId || ps.program_id === profileData.programId)
                                .map((ps) => (
                                  <option key={ps.id} value={ps.id}>
                                    Semester {ps.semester} - Section {ps.section}
                                  </option>
                                ))}
                              {(profileData.programId || showCustomProgram) && (
                                <option value="add_new" className="font-semibold text-blue-600">
                                  + Add Custom Semester
                                </option>
                              )}
                            </select>
                            {!profileData.programId && !showCustomProgram && (
                              <p className="text-xs text-gray-500">Please select a program first</p>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={customSemesterName}
                              onChange={(e) => {
                                const semesterText = e.target.value;
                                setCustomSemesterName(semesterText);
                                
                                // Auto-extract semester number
                                const semesterMatch = semesterText.match(/(\d+)/);
                                if (semesterMatch) {
                                  const semesterNum = parseInt(semesterMatch[1]);
                                  
                                  // Auto-update grade based on semester
                                  // Semesters 1-2 = Year 1, 3-4 = Year 2, 5-6 = Year 3, 7-8 = Year 4
                                  const year = Math.ceil(semesterNum / 2);
                                  
                                  // Check if it's UG or PG based on current grade or default to UG
                                  const currentGrade = profileData.grade || '';
                                  let newGrade = '';
                                  
                                  if (currentGrade.includes('PG') || semesterNum <= 4) {
                                    // For PG programs (usually 2 years = 4 semesters)
                                    if (semesterNum <= 2) {
                                      newGrade = "PG Year 1";
                                    } else {
                                      newGrade = "PG Year 2";
                                    }
                                  } else {
                                    // For UG programs (usually 4 years = 8 semesters)
                                    newGrade = `UG Year ${Math.min(year, 4)}`;
                                  }
                                  
                                  // Update both section, semester, and grade together
                                  setProfileData(prev => ({
                                    ...prev,
                                    section: semesterText,
                                    semester: semesterNum,
                                    grade: newGrade,
                                  }));
                                }
                              }}
                              placeholder="Enter semester/section (e.g., Semester 3, 5th Sem)"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomSemester(false);
                                setCustomSemesterName('');
                                handleProfileChange("section", '');
                                handleProfileChange("semester", null);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              ← Back to dropdown
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Academic Details Subsection - Added from Academic Information */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        Academic Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Registration Number */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Registration Number
                          </label>
                          <input
                            type="text"
                            value={profileData.registrationNumber}
                            onChange={(e) =>
                              handleProfileChange(
                                "registrationNumber",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="Enter registration number"
                          />
                        </div>

                        {/* Enrollment Number */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Enrollment Number
                          </label>
                          <input
                            type="text"
                            value={profileData.enrollmentNumber}
                            onChange={(e) =>
                              handleProfileChange(
                                "enrollmentNumber",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="Enter enrollment number"
                          />
                        </div>

                        {/* Current CGPA */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Current CGPA
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={profileData.currentCgpa}
                            onChange={(e) =>
                              handleProfileChange("currentCgpa", e.target.value)
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="Enter current CGPA"
                          />
                        </div>

                        {/* Grade */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Grade/Class
                          </label>
                          <select
                            value={profileData.grade}
                            onChange={(e) =>
                              handleProfileChange("grade", e.target.value)
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          >
                            <option value="">Select Grade/Class</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="Grade 7">Grade 7</option>
                            <option value="Grade 8">Grade 8</option>
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                            <option value="Diploma">Diploma</option>
                            <option value="UG Year 1">UG Year 1</option>
                            <option value="UG Year 2">UG Year 2</option>
                            <option value="UG Year 3">UG Year 3</option>
                            <option value="UG Year 4">UG Year 4</option>
                            <option value="PG Year 1">PG Year 1</option>
                            <option value="PG Year 2">PG Year 2</option>
                            <option value="PG">PG</option>
                          </select>
                        </div>

                        {/* Grade Start Date */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Grade Start Date
                          </label>
                          <input
                            type="date"
                            value={profileData.gradeStartDate}
                            onChange={(e) =>
                              handleProfileChange("gradeStartDate", e.target.value)
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      Guardian Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Guardian Name */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Guardian Name
                        </label>
                        <input
                          type="text"
                          value={profileData.guardianName}
                          onChange={(e) =>
                            handleProfileChange("guardianName", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter guardian name"
                        />
                      </div>

                      {/* Guardian Relation */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Relation
                        </label>
                        <select
                          value={profileData.guardianRelation}
                          onChange={(e) =>
                            handleProfileChange(
                              "guardianRelation",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        >
                          <option value="">Select Relation</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Uncle">Uncle</option>
                          <option value="Aunt">Aunt</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Guardian Phone */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Guardian Phone
                        </label>
                        <input
                          type="tel"
                          value={profileData.guardianPhone}
                          onChange={(e) =>
                            handleProfileChange("guardianPhone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter guardian phone"
                        />
                      </div>

                      {/* Guardian Email */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Guardian Email
                        </label>
                        <input
                          type="email"
                          value={profileData.guardianEmail}
                          onChange={(e) =>
                            handleProfileChange("guardianEmail", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter guardian email"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) =>
                        handleProfileChange("bio", e.target.value)
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Bio */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Bio
                    </h3>
                    <div className="space-y-2">
                      <textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          handleProfileChange("bio", e.target.value)
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        {
                          key: "linkedIn",
                          label: "LinkedIn",
                          placeholder: "https://linkedin.com/in/yourprofile",
                        },
                        {
                          key: "github",
                          label: "GitHub",
                          placeholder: "https://github.com/yourusername",
                        },
                        {
                          key: "portfolio",
                          label: "Portfolio",
                          placeholder: "https://yourportfolio.com",
                        },
                        {
                          key: "twitter",
                          label: "Twitter",
                          placeholder: "https://twitter.com/yourusername",
                        },
                        {
                          key: "facebook",
                          label: "Facebook",
                          placeholder: "https://facebook.com/yourprofile",
                        },
                        {
                          key: "instagram",
                          label: "Instagram",
                          placeholder: "https://instagram.com/yourusername",
                        },
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            {field.label}
                          </label>
                          <input
                            type="url"
                            value={profileData[field.key]}
                            onChange={(e) =>
                              handleProfileChange(field.key, e.target.value)
                            }
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

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
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100 pb-5">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Security Settings
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-6 space-y-6">
                  {/* Email Info Display */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1 text-sm">Account Email</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Password changes will be applied to: <strong>{userEmail || 'Not available'}</strong>
                        </p>
                        <p className="text-xs text-blue-600">
                          If this email is incorrect, please log out and log in again.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">
                      Change Password
                    </h3>

                    {[
                      {
                        key: "currentPassword",
                        label: "Current Password",
                        show: showCurrentPassword,
                        setShow: setShowCurrentPassword,
                      },
                      {
                        key: "newPassword",
                        label: "New Password",
                        show: showNewPassword,
                        setShow: setShowNewPassword,
                      },
                      {
                        key: "confirmPassword",
                        label: "Confirm New Password",
                        show: showConfirmPassword,
                        setShow: setShowConfirmPassword,
                      },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.show ? "text" : "password"}
                            value={passwordData[field.key]}
                            onChange={(e) =>
                              handlePasswordChange(field.key, e.target.value)
                            }
                            className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => field.setShow(!field.show)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            {field.show ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Password Requirements:
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className={passwordData.newPassword.length >= 8 ? "text-green-600 font-bold" : "text-gray-400"}>
                            {passwordData.newPassword.length >= 8 ? "✓" : "○"}
                          </span>
                          At least 8 characters long
                        </li>
                        <li className="flex items-center gap-2">
                          <span className={passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword ? "text-green-600 font-bold" : "text-gray-400"}>
                            {passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword ? "✓" : "○"}
                          </span>
                          Passwords match
                        </li>
                        <li className="flex items-center gap-2">
                          <span className={passwordData.newPassword && passwordData.currentPassword && passwordData.newPassword !== passwordData.currentPassword ? "text-green-600 font-bold" : "text-gray-400"}>
                            {passwordData.newPassword && passwordData.currentPassword && passwordData.newPassword !== passwordData.currentPassword ? "✓" : "○"}
                          </span>
                          Different from current password
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <Button
                      onClick={handleSavePassword}
                      disabled={
                        isSaving ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                      }
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
                      <Lock className="w-4 h-4 mr-2" />
                      {isSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100 pb-5">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Notification Preferences
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-6 space-y-6">
                  <div className="space-y-3">
                    {[
                      {
                        key: "emailNotifications",
                        label: "Email Notifications",
                        description: "Receive notifications via email",
                      },
                      {
                        key: "applicationUpdates",
                        label: "Application Updates",
                        description: "Get notified about application status",
                      },
                      {
                        key: "newOpportunities",
                        label: "New Opportunities",
                        description: "Alerts for new job opportunities",
                      },
                      {
                        key: "recruitingMessages",
                        label: "Recruiting Messages",
                        description: "Notifications from recruiters",
                      },
                      // {
                      //   key: "weeklyDigest",
                      //   label: "Weekly Digest",
                      //   description: "Weekly summary of activities",
                      // },
                      // {
                      //   key: "monthlyReport",
                      //   label: "Monthly Report",
                      //   description: "Monthly progress report",
                      // },
                      // {
                      //   key: "pushNotifications",
                      //   label: "Push Notifications",
                      //   description: "Browser push notifications",
                      // },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {setting.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {setting.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                            notificationSettings[setting.key]
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                              notificationSettings[setting.key]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <Button
                      onClick={handleSaveNotifications}
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
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-100 pb-5">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      Privacy Settings
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 p-6 space-y-6">
                  {/* Profile Visibility */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">
                      Profile Visibility
                    </h3>
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-gray-700">
                        Who can see your profile?
                      </label>

                      {/* Custom Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setPrivacySettings((prev) => ({
                              ...prev,
                              dropdownOpen: !prev.dropdownOpen,
                            }))
                          }
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {privacySettings.profileVisibility === "public" && (
                              <Globe className="w-4 h-4 text-blue-600" />
                            )}
                            {privacySettings.profileVisibility ===
                              "recruiters" && (
                              <Briefcase className="w-4 h-4 text-blue-600" />
                            )}
                            {privacySettings.profileVisibility ===
                              "private" && (
                              <Lock className="w-4 h-4 text-blue-600" />
                            )}
                            <span className="capitalize">
                              {privacySettings.profileVisibility === "public"
                                ? "Public - Anyone can view"
                                : privacySettings.profileVisibility ===
                                  "recruiters"
                                ? "Recruiters Only"
                                : "Private - Only you"}
                            </span>
                          </div>
                          <svg
                            className="w-4 h-4 text-gray-500 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {privacySettings.dropdownOpen && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                            {[
                              {
                                value: "public",
                                label: "Public - Anyone can view",
                                icon: Globe,
                              },
                              {
                                value: "recruiters",
                                label: "Recruiters Only",
                                icon: Briefcase,
                              },
                              {
                                value: "private",
                                label: "Private - Only you",
                                icon: Lock,
                              },
                            ].map((option) => {
                              const Icon = option.icon;
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    handlePrivacyChange(
                                      "profileVisibility",
                                      option.value
                                    );
                                    setPrivacySettings((prev) => ({
                                      ...prev,
                                      dropdownOpen: false,
                                    }));
                                  }}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-blue-50 transition-all ${
                                    privacySettings.profileVisibility ===
                                    option.value
                                      ? "bg-blue-50 text-blue-700 font-semibold"
                                      : "text-gray-700"
                                  }`}
                                >
                                  <Icon className="w-4 h-4 text-blue-600" />
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Visibility */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">
                      Contact Information
                    </h3>
                    {[
                      {
                        key: "showEmail",
                        label: "Show Email Address",
                        icon: Mail,
                      },
                      {
                        key: "showPhone",
                        label: "Show Phone Number",
                        icon: Phone,
                      },
                      {
                        key: "showLocation",
                        label: "Show Location",
                        icon: MapPin,
                      },
                    ].map((setting) => {
                      const Icon = setting.icon;
                      return (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Icon className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {setting.label}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handlePrivacyChange(
                                setting.key,
                                !privacySettings[setting.key]
                              )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                              privacySettings[setting.key]
                                ? "bg-blue-600"
                                : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                                privacySettings[setting.key]
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recruiter Interaction */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-900">
                      Recruiter Interaction
                    </h3>
                    {[
                      {
                        key: "allowRecruiterContact",
                        label: "Allow Recruiter Contact",
                        description: "Recruiters can send you messages",
                      },
                      {
                        key: "showInTalentPool",
                        label: "Show in Talent Pool",
                        description: "Appear in recruiter searches",
                      },
                    ].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {setting.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {setting.description}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handlePrivacyChange(
                              setting.key,
                              !privacySettings[setting.key]
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                            privacySettings[setting.key]
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                              privacySettings[setting.key]
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Danger Zone */}
                  {/* <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">
                      Danger Zone
                    </h3>
                    <div className="p-5 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 mb-1">
                            Delete Account
                          </p>
                          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Permanently delete your account and all data. This
                            action cannot be undone.
                          </p>
                          <Button
                            variant="outline"
                            className="border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 rounded-xl transition-all"
                            // onClick={() => {
                            //   if (
                            //     window.confirm(
                            //       "Are you sure you want to delete your account? This action cannot be undone."
                            //     )
                            //   ) {
                            //     toast({
                            //       title: "Account Deletion",
                            //       description:
                            //         "Please contact support to delete your account",
                            //     });
                            //   }
                            // }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  <div className="flex justify-end pt-6 border-t border-slate-100">
                    <Button
                      onClick={handleSavePrivacy}
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
                      <Save
                        className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`}
                      />
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Settings */}
            {activeTab === "subscription" && (
              <SubscriptionSettingsSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
