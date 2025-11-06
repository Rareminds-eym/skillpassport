import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Students/components/ui/card";
import { Button } from "../../components/Students/components/ui/button";
import { Badge } from "../../components/Students/components/ui/badge";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Trash2,
  Globe,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudentDataByEmail } from "../../hooks/useStudentDataByEmail";
import { useRecentUpdates } from "../../hooks/useRecentUpdates";
import { useRecentUpdatesLegacy } from "../../hooks/useRecentUpdatesLegacy";
import { useToast } from "../../hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userEmail = user?.email;
  const { studentData, updateProfile } = useStudentDataByEmail(
    userEmail,
    false
  );

  // Fetch recent updates
  const {
    recentUpdates,
    loading: recentUpdatesLoading,
    error: recentUpdatesError,
    refreshRecentUpdates,
  } = useRecentUpdates();

  const {
    recentUpdates: recentUpdatesLegacy,
    loading: recentUpdatesLoadingLegacy,
    error: recentUpdatesErrorLegacy,
    refreshRecentUpdates: refreshRecentUpdatesLegacy,
  } = useRecentUpdatesLegacy();

  const finalRecentUpdates =
    recentUpdates.length > 0 ? recentUpdates : recentUpdatesLegacy;
  const finalLoading = recentUpdatesLoading || recentUpdatesLoadingLegacy;
  const finalError = recentUpdatesError || recentUpdatesErrorLegacy;
  const finalRefresh = () => {
    refreshRecentUpdates();
    refreshRecentUpdatesLegacy();
  };

  const [showAllRecentUpdates, setShowAllRecentUpdates] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    dateOfBirth: "",
    bio: "",
    linkedIn: "",
    github: "",
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
    if (studentData?.profile) {
      setProfileData({
        name: studentData.profile.name || "",
        email: studentData.profile.email || userEmail || "",
        phone: studentData.profile.phone || "",
        location: studentData.profile.district || "",
        dateOfBirth: studentData.profile.dateOfBirth || "",
        bio: studentData.profile.bio || "",
        linkedIn: studentData.profile.linkedIn || "",
        github: studentData.profile.github || "",
        portfolio: studentData.profile.portfolio || "",
      });

      if (studentData.profile.notificationSettings) {
        setNotificationSettings(studentData.profile.notificationSettings);
      }

      if (studentData.profile.privacySettings) {
        setPrivacySettings(studentData.profile.privacySettings);
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
      // await updateProfile(profileData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      finalRefresh();
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

    setIsSaving(true);
    try {
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      finalRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // await updateProfile({ notificationSettings });
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
      finalRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      // await updateProfile({ privacySettings });
      toast({
        title: "Success",
        description: "Privacy settings updated",
      });
      finalRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

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

            {/* Recent Updates */}
            <div className="bg-white/80 backdrop-blur-sm border-0 shadow-sm shadow-slate-200/50">
              <CardHeader className="px-6 py-4 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Recent Updates
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 p-6">
                {recentUpdatesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recentUpdatesError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-3 font-medium">
                      Failed to load recent updates
                    </p>
                    <Button
                      onClick={refreshRecentUpdates}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 text-sm rounded-md transition-colors"
                    >
                      Retry
                    </Button>
                  </div>
                ) : recentUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 font-medium">
                      No recent updates available
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className={`space-y-2 ${
                        showAllRecentUpdates
                          ? "max-h-96 overflow-y-auto pr-2 scroll-smooth recent-updates-scroll"
                          : ""
                      }`}
                    >
                      {(showAllRecentUpdates
                        ? recentUpdates
                        : recentUpdates.slice(0, 5)
                      ).map((update, idx) => {
                        // Format the message from activity structure
                        const message =
                          update.message ||
                          `${update.user} ${update.action} ${update.candidate}`;

                        // Determine color based on activity type
                        const getActivityColor = (type) => {
                          switch (type) {
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
                        };

                        return (
                          <div
                            key={
                              update.id || `update-${update.timestamp}-${idx}`
                            }
                            className={`p-3 rounded-lg border hover:shadow-sm transition-all flex items-start gap-3 ${getActivityColor(
                              update.type
                            )}`}
                          >
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-0.5">
                                {update.user && (
                                  <span className="text-blue-700">
                                    {update.user}
                                  </span>
                                )}
                                {update.action && (
                                  <span className="text-gray-700">
                                    {" "}
                                    {update.action}{" "}
                                  </span>
                                )}
                                {update.candidate && (
                                  <span className="font-semibold">
                                    {update.candidate}
                                  </span>
                                )}
                                {update.message && (
                                  <span className="text-gray-700">
                                    {update.message}
                                  </span>
                                )}
                              </p>
                              {update.details && (
                                <p className="text-xs text-gray-600 mb-1">
                                  {update.details}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {typeof update.timestamp === "string" &&
                                update.timestamp.includes("ago")
                                  ? update.timestamp
                                  : new Date(update.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {recentUpdates.length > 5 && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium text-sm rounded-md transition-all"
                          onClick={() =>
                            setShowAllRecentUpdates(!showAllRecentUpdates)
                          }
                        >
                          {showAllRecentUpdates ? "See Less" : "See More"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </div>
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
                <CardContent className="pt-6 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        Full Name
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
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
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
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) =>
                          handleProfileChange("location", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="City, Country"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
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

                  {/* Social Links */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
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
                      ].map((field) => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
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

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <strong className="font-semibold">
                          Password requirements:
                        </strong>{" "}
                        At least 8 characters with uppercase, lowercase,
                        numbers, and special characters.
                      </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
