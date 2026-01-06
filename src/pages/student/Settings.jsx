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

import { SubscriptionSettingsSection } from "../../components/subscription/SubscriptionSettingsSection";
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

                  {/* Academic Information */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Academic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* University */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          University
                        </label>
                        <input
                          type="text"
                          value={profileData.university}
                          onChange={(e) =>
                            handleProfileChange("university", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter university name"
                        />
                      </div>

                      {/* College */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          College/School
                        </label>
                        <input
                          type="text"
                          value={profileData.college}
                          onChange={(e) =>
                            handleProfileChange("college", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter college/school name"
                        />
                      </div>

                      {/* Branch */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Branch/Field
                        </label>
                        <input
                          type="text"
                          value={profileData.branch}
                          onChange={(e) =>
                            handleProfileChange("branch", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                          placeholder="Enter branch/field of study"
                        />
                      </div>

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
