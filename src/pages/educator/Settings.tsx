import React, { useState } from 'react';
import {
  BellIcon,
  LockClosedIcon,
  UserIcon,
  CogIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface SettingsState {
  fullName: string;
  email: string;
  department: string;
  phone: string;
  bio: string;
  title: string;
  officeLocation: string;
  officeHours: string;
  employeeId: string;
  yearsOfExperience: string;
  specialization: string;
  educationLevel: string;
  linkedinUrl: string;
  websiteUrl: string;
  emailNotifications: boolean;
  activityNotifications: boolean;
  studentSubmissionNotifications: boolean;
  weeklyReportNotifications: boolean;
  pushNotifications: boolean;
  classTimeZone: string;
  preferredLanguage: string;
  autoGradeEnabled: boolean;
  enablePeerReview: boolean;
  profileVisibility: 'public' | 'private' | 'institution-only';
  shareAnalytics: boolean;
}

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
        </div>
      </div>
    </div>
    <div className="px-6 py-5">
      {children}
    </div>
  </div>
);

const SettingToggle: React.FC<{
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex-1 pr-4">
      <label className="text-sm font-medium text-slate-900 cursor-pointer block">
        {label}
      </label>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${enabled ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </button>
  </div>
);

const SettingInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readonly?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, type = 'text', placeholder, readonly = false, icon }) => (
  <div className="py-3">
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readonly}
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 text-sm rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${readonly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
          }`}
      />
    </div>
  </div>
);

const SettingSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}> = ({ label, value, onChange, options, icon }) => (
  <div className="py-3">
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none pr-10`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-slate-400 w-4 h-4 pointer-events-none" />
    </div>
  </div>
);

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    fullName: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@institution.edu',
    department: 'Computer Science',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate educator with 10+ years of experience in computer science and student mentorship.',
    title: 'Associate Professor',
    officeLocation: 'Building A, Room 305',
    officeHours: 'Mon & Wed 2:00 PM - 4:00 PM',
    employeeId: 'EMP-2019-CS-042',
    yearsOfExperience: '12',
    specialization: 'Artificial Intelligence, Machine Learning',
    educationLevel: 'PhD in Computer Science',
    linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
    websiteUrl: 'https://sarahjohnson.edu',
    emailNotifications: true,
    activityNotifications: true,
    studentSubmissionNotifications: true,
    weeklyReportNotifications: true,
    pushNotifications: false,
    classTimeZone: 'EST',
    preferredLanguage: 'English',
    autoGradeEnabled: false,
    enablePeerReview: true,
    profileVisibility: 'institution-only',
    shareAnalytics: true,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'teaching' | 'privacy' | 'security'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string>('');

  const handleSave = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSaveStatus('saved');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'teaching', label: 'Teaching', icon: CogIcon },
    { id: 'security', label: 'Security', icon: LockClosedIcon },
    { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header - responsive layout */}
      <div className='p-4 sm:p-6 lg:p-8 mb-2'>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Educator Settings</h1>
        <p className="text-base md:text-lg mt-2 text-gray-600">
          Manage your personal, teaching, and privacy preferences here.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-72 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-2">
              Settings
            </h2>
            <hr className='mb-4 border-t border-slate-200' />
            <div className="space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    <div
                      className={`p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'
                        }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {/* Save Status Alert */}
          {saveStatus !== 'idle' && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${saveStatus === 'saving'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : saveStatus === 'saved'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Saving changes...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Settings saved successfully</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Failed to save settings. Please try again.</span>
                </>
              )}
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <SettingsSection
                title="Profile Photo"
                description="Update your profile picture"
                icon={<PhotoIcon className="w-5 h-5" />}
              >
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
                      {getInitials(settings.fullName)}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50">
                      <PhotoIcon className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Upload Photo
                    </button>
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG or GIF. Maximum file size 5MB.</p>
                  </div>
                </div>
              </SettingsSection>

              {/* Personal Information */}
              <SettingsSection
                title="Personal Information"
                description="Update your personal details"
                icon={<UserIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  <SettingInput
                    label="Full Name"
                    value={settings.fullName}
                    onChange={(value) => updateSetting('fullName', value)}
                    placeholder="Enter your full name"
                  />
                  <SettingInput
                    label="Email Address"
                    type="email"
                    value={settings.email}
                    onChange={(value) => updateSetting('email', value)}
                    icon={<EnvelopeIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Phone Number"
                    type="tel"
                    value={settings.phone}
                    onChange={(value) => updateSetting('phone', value)}
                    placeholder="+1 (555) 000-0000"
                  />
                  <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={settings.bio}
                      onChange={(e) => updateSetting('bio', e.target.value)}
                      placeholder="Tell students about yourself..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">{settings.bio.length}/500 characters</p>
                  </div>
                </div>
              </SettingsSection>

              {/* Professional Information */}
              {/* <SettingsSection
                title="Professional Information"
                description="Your academic and professional details"
                icon={<BriefcaseIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  <SettingInput
                    label="Job Title"
                    value={settings.title}
                    onChange={(value) => updateSetting('title', value)}
                    placeholder="e.g., Associate Professor"
                    icon={<BriefcaseIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Department"
                    value={settings.department}
                    onChange={(value) => updateSetting('department', value)}
                    placeholder="e.g., Computer Science"
                    icon={<BuildingOfficeIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Employee ID"
                    value={settings.employeeId}
                    onChange={(value) => updateSetting('employeeId', value)}
                    placeholder="e.g., EMP-2019-CS-042"
                    readonly={true}
                  />
                  <SettingInput
                    label="Years of Experience"
                    type="number"
                    value={settings.yearsOfExperience}
                    onChange={(value) => updateSetting('yearsOfExperience', value)}
                    placeholder="e.g., 12"
                  />
                  <SettingSelect
                    label="Highest Education Level"
                    value={settings.educationLevel}
                    onChange={(value) => updateSetting('educationLevel', value)}
                    options={[
                      { value: 'PhD in Computer Science', label: 'PhD in Computer Science' },
                      { value: 'PhD in Education', label: 'PhD in Education' },
                      { value: 'PhD in Mathematics', label: 'PhD in Mathematics' },
                      { value: 'Masters Degree', label: 'Masters Degree' },
                      { value: 'Bachelors Degree', label: 'Bachelors Degree' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    icon={<AcademicCapIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Area of Specialization"
                    value={settings.specialization}
                    onChange={(value) => updateSetting('specialization', value)}
                    placeholder="e.g., Artificial Intelligence, Machine Learning"
                  />
                </div>
              </SettingsSection> */}

              {/* Office & Availability */}
              {/* <SettingsSection
                title="Office & Availability"
                description="Help students know where and when to find you"
                icon={<BuildingOfficeIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  <SettingInput
                    label="Office Location"
                    value={settings.officeLocation}
                    onChange={(value) => updateSetting('officeLocation', value)}
                    placeholder="e.g., Building A, Room 305"
                    icon={<BuildingOfficeIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Office Hours"
                    value={settings.officeHours}
                    onChange={(value) => updateSetting('officeHours', value)}
                    placeholder="e.g., Mon & Wed 2:00 PM - 4:00 PM"
                    icon={<ClockIcon className="w-4 h-4" />}
                  />
                </div>
              </SettingsSection> */}

              {/* Online Presence */}
              {/* <SettingsSection
                title="Online Presence"
                description="Connect your professional profiles"
                icon={<LinkIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  <SettingInput
                    label="LinkedIn Profile"
                    value={settings.linkedinUrl}
                    onChange={(value) => updateSetting('linkedinUrl', value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    icon={<LinkIcon className="w-4 h-4" />}
                  />
                  <SettingInput
                    label="Personal Website"
                    value={settings.websiteUrl}
                    onChange={(value) => updateSetting('websiteUrl', value)}
                    placeholder="https://yourwebsite.com"
                    icon={<GlobeAltIcon className="w-4 h-4" />}
                  />
                </div>
              </SettingsSection> */}
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <SettingsSection
                title="Email Notifications"
                description="Choose what updates you want to receive"
                icon={<EnvelopeIcon className="w-5 h-5" />}
              >
                <div className="space-y-0">
                  <SettingToggle
                    label="Email Notifications"
                    description="Receive email notifications for important updates"
                    enabled={settings.emailNotifications}
                    onChange={(value) => updateSetting('emailNotifications', value)}
                  />
                  <SettingToggle
                    label="Activity Alerts"
                    description="Get notified when students engage with content"
                    enabled={settings.activityNotifications}
                    onChange={(value) => updateSetting('activityNotifications', value)}
                  />
                  <SettingToggle
                    label="Submission Notifications"
                    description="Receive alerts for new assignment submissions"
                    enabled={settings.studentSubmissionNotifications}
                    onChange={(value) => updateSetting('studentSubmissionNotifications', value)}
                  />
                  <SettingToggle
                    label="Weekly Reports"
                    description="Get a summary of your class activity every week"
                    enabled={settings.weeklyReportNotifications}
                    onChange={(value) => updateSetting('weeklyReportNotifications', value)}
                  />
                </div>
              </SettingsSection>

              <SettingsSection
                title="Push Notifications"
                description="Manage browser and mobile notifications"
                icon={<BellIcon className="w-5 h-5" />}
              >
                <SettingToggle
                  label="Enable Push Notifications"
                  description="Receive real-time notifications on your devices"
                  enabled={settings.pushNotifications}
                  onChange={(value) => updateSetting('pushNotifications', value)}
                />
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">Browser permission required for push notifications</p>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'teaching' && (
            <div className="space-y-6">
              {/* General Preferences */}
              <SettingsSection
                title="General Preferences"
                description="Configure your teaching environment and class setup"
                icon={<CogIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  <SettingSelect
                    label="Time Zone"
                    value={settings.classTimeZone}
                    onChange={(value) => updateSetting('classTimeZone', value)}
                    options={[
                      { value: 'EST', label: 'Eastern (EST)' },
                      { value: 'CST', label: 'Central (CST)' },
                      { value: 'MST', label: 'Mountain (MST)' },
                      { value: 'PST', label: 'Pacific (PST)' },
                      { value: 'GMT', label: 'GMT' },
                    ]}
                    icon={<ClockIcon className="w-4 h-4" />}
                  />
                  <SettingSelect
                    label="Language"
                    value={settings.preferredLanguage}
                    onChange={(value) => updateSetting('preferredLanguage', value)}
                    options={[
                      { value: 'English', label: 'English' },
                      { value: 'Spanish', label: 'Spanish' },
                      { value: 'French', label: 'French' },
                      { value: 'German', label: 'German' },
                    ]}
                    icon={<GlobeAltIcon className="w-4 h-4" />}
                  />
                </div>
              </SettingsSection>

              {/* Assessment Configuration */}
              <SettingsSection
                title="Assessment Configuration"
                description="Define how student assessments and feedback are managed"
                icon={<CheckCircleIcon className="w-5 h-5" />}
              >
                <div className="space-y-0">
                  {/* Peer Review */}
                  <SettingToggle
                    label="Enable Peer Review"
                    description="Allow students to review and provide feedback on each other's assignments"
                    enabled={settings.enablePeerReview}
                    onChange={(value) => updateSetting('enablePeerReview', value)}
                  />

                  {/* Auto Skill Tagging */}
                  <SettingToggle
                    label="Auto Skill Tagging"
                    description="Automatically tag student submissions with relevant skill categories"
                    enabled={settings.shareAnalytics}
                    onChange={(value) => updateSetting('shareAnalytics', value)}
                  />

                  {/* Assignment Due Reminders */}
                  <SettingToggle
                    label="Assignment Due Reminders"
                    description="Send automated reminders to students 24 hours before deadlines"
                    enabled={settings.weeklyReportNotifications}
                    onChange={(value) => updateSetting('weeklyReportNotifications', value)}
                  />
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <SettingsSection
                title="Profile Visibility"
                description="Control who can see your profile information"
                icon={<EyeIcon className="w-5 h-5" />}
              >
                <SettingSelect
                  label="Who can view your profile"
                  value={settings.profileVisibility}
                  onChange={(value) => updateSetting('profileVisibility', value as any)}
                  options={[
                    { value: 'public', label: 'Public - Anyone' },
                    { value: 'institution-only', label: 'Institution Members Only' },
                    { value: 'private', label: 'Private - My Students Only' },
                  ]}
                />
              </SettingsSection>

              <SettingsSection
                title="Data & Privacy"
                description="Manage how your data is used"
                icon={<ShieldCheckIcon className="w-5 h-5" />}
              >
                <SettingToggle
                  label="Share Usage Analytics"
                  description="Help improve the platform with anonymized usage data"
                  enabled={settings.shareAnalytics}
                  onChange={(value) => updateSetting('shareAnalytics', value)}
                />
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600">Your data is never shared with third parties and remains anonymous</p>
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <SettingsSection
                title="Change Password"
                description="Update your account password"
                icon={<LockClosedIcon className="w-5 h-5" />}
              >
                <div className="space-y-1">
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{passwordError}</p>
                    </div>
                  )}

                  <SettingInput
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(value) => {
                      setPasswordData({ ...passwordData, currentPassword: value });
                      setPasswordError('');
                    }}
                    placeholder="Enter your current password"
                    icon={<LockClosedIcon className="w-4 h-4" />}
                  />

                  <SettingInput
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(value) => {
                      setPasswordData({ ...passwordData, newPassword: value });
                      setPasswordError('');
                    }}
                    placeholder="Enter your new password (min. 8 characters)"
                    icon={<LockClosedIcon className="w-4 h-4" />}
                  />

                  <SettingInput
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(value) => {
                      setPasswordData({ ...passwordData, confirmPassword: value });
                      setPasswordError('');
                    }}
                    placeholder="Re-enter your new password"
                    icon={<LockClosedIcon className="w-4 h-4" />}
                  />

                  <div className="pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={saveStatus === 'saving'}
                      className="w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saveStatus === 'saving' ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Password Requirements:</strong> Must be at least 8 characters long and contain a mix of letters, numbers, and symbols for better security.
                    </p>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Action Buttons */}
          {activeTab !== 'security' && (
            <div className="flex items-center justify-end gap-3 pt-4 pb-4 border-t border-slate-200">
              <button className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;