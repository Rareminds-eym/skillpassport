// @ts-nocheck - Excluded from typecheck for gradual migration
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  CogIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PhotoIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { SubscriptionSettingsSection } from '../../components/Subscription/SubscriptionSettingsSection';

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
  city: string;
  state: string;
  country: string;
  pincode: string;
  gender: string;
  role: string;
  onboardingStatus: string;
  dateOfBirth: string;
  verificationStatus: string;
  subjectExpertise: Array<{
    name: string;
    proficiency: string;
    years_experience: number;
  }>;
  idProofUrl: string;
  degreeCertificateUrl: string;
  experienceLettersUrl: string[];
  resumeUrl: string;
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

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
}) => (
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">{icon}</div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
        </div>
      </div>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// Enhanced Accordion Section Component
const AccordionSection: React.FC<{
  sectionKey: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  showSaveButtons?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}> = ({
  sectionKey,
  title,
  description,
  icon,
  children,
  isExpanded,
  onToggle,
  showSaveButtons = false,
  onSave,
  onCancel,
  saveStatus = 'idle',
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 transition-all duration-200 border-b border-slate-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 shadow-sm">
              {icon}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRightIcon
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-6 bg-white">
          {children}

          {/* Save/Cancel Buttons */}
          {showSaveButtons && isExpanded && (
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={saveStatus === 'saving'}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saveStatus === 'saving' && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingToggle: React.FC<{
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex-1 pr-4">
      <label className="text-sm font-medium text-slate-900 cursor-pointer block">{label}</label>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-slate-300'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
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
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
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
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 text-sm rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
          readonly ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
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
  readonly?: boolean;
}> = ({ label, value, onChange, options, icon, readonly = false }) => (
  <div className="py-3">
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readonly}
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none pr-10 ${readonly ? 'bg-slate-50 cursor-not-allowed' : ''}`}
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
  // @ts-expect-error - Auto-suppressed for migration
  const { user } = useAuth();
  const userEmail = user?.email;

  // Add loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educatorData, setEducatorData] = useState<any>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // @ts-expect-error - Auto-suppressed for migration
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document upload states
  const [documentUploading, setDocumentUploading] = useState<{ [key: string]: boolean }>({});
  const [documentErrors, setDocumentErrors] = useState<{ [key: string]: string }>({});
  const [pendingDocuments, setPendingDocuments] = useState<{ [key: string]: File[] }>({});
  const [showDocumentConfirmation, setShowDocumentConfirmation] = useState<{
    [key: string]: boolean;
  }>({});
  // @ts-expect-error - Auto-suppressed for migration
  const idProofInputRef = useRef<HTMLInputElement>(null);
  // @ts-expect-error - Auto-suppressed for migration
  const degreeInputRef = useRef<HTMLInputElement>(null);
  // @ts-expect-error - Auto-suppressed for migration
  const experienceInputRef = useRef<HTMLInputElement>(null);
  // @ts-expect-error - Auto-suppressed for migration
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // @ts-expect-error - Auto-suppressed for migration
  const [settings, setSettings] = useState<SettingsState>({
    fullName: '',
    email: '',
    department: '',
    phone: '',
    bio: '',
    title: '',
    officeLocation: '',
    officeHours: '',
    employeeId: '',
    yearsOfExperience: '',
    specialization: '',
    educationLevel: '',
    linkedinUrl: '',
    websiteUrl: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    gender: '',
    role: '',
    onboardingStatus: '',
    dateOfBirth: '',
    verificationStatus: '',
    subjectExpertise: [],
    idProofUrl: '',
    degreeCertificateUrl: '',
    experienceLettersUrl: [],
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
  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'teaching' | 'privacy' | 'security'
  >('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string>('');

  // Accordion state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    photo: true,
    personal: true,
    professional: false,
    expertise: false,
    documents: false,
    address: false,
  });

  // Dropdown state for settings menu
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Photo removal confirmation state
  const [showRemovePhotoConfirmation, setShowRemovePhotoConfirmation] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);

  // Data fetching function
  const fetchEducatorData = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch educator data using your actual table structure
      const { data, error } = await supabase
        .from('school_educators')
        .select(
          `
          *,
          schools (
            name,
            address
          )
        `
        )
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Error fetching educator:', error);
        setError('Failed to load profile data');
        return;
      }

      setEducatorData(data);

      // Map your actual database fields to form fields
      setSettings((prev) => ({
        ...prev,
        fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        email: data.email || '',
        department: data.department || '',
        phone: data.phone_number || '', // Note: your field is phone_number
        bio: data.metadata?.bio || '', // Bio might be in metadata
        title: data.designation || '', // Your field is designation
        officeLocation: data.address || '',
        employeeId: data.employee_id || '',
        yearsOfExperience: data.experience_years?.toString() || '',
        specialization: data.specialization || '',
        educationLevel: data.qualification || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        pincode: data.pincode || '',
        gender: data.gender || '',
        role: data.role || '',
        onboardingStatus: data.onboarding_status || '',
        dateOfBirth: data.dob || '',
        verificationStatus: data.verification_status || '',
        subjectExpertise: data.subject_expertise || [],
        idProofUrl: data.id_proof_url || '',
        degreeCertificateUrl: data.degree_certificate_url || '',
        experienceLettersUrl: data.experience_letters_url || [],
        resumeUrl: data.resume_url || '',
        // Load preferences from metadata if exists
        ...data.metadata?.preferences,
      }));
    } catch (error) {
      console.error('Error in fetchEducatorData:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setPhotoError(null);

    // Validate file
    // @ts-expect-error - Auto-suppressed for migration
    const validation = validateFile(file, {
      maxSize: 5, // 5MB
      allowedTypes: ['jpg', 'jpeg', 'png', 'gif'],
    });

    if (!validation.valid) {
      setPhotoError(validation.error || 'Invalid file');
      return;
    }

    setPhotoUploading(true);

    try {
      // Upload to Cloudflare R2 storage
      // @ts-expect-error - Auto-suppressed for migration
      const uploadResult = await uploadFile(file, 'educator-photos');

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update educator record with photo URL
      const { error: updateError } = await supabase
        .from('school_educators')
        .update({
          photo_url: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (updateError) {
        throw new Error('Failed to save photo URL to database');
      }

      // Refresh educator data to show new photo
      await fetchEducatorData();

      // Show success message
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Photo upload error:', error);
      setPhotoError(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger file input
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // Document upload handlers
  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: 'id-proof' | 'degree' | 'experience' | 'resume'
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!educatorData) {
      setDocumentErrors((prev) => ({
        ...prev,
        [documentType]: 'Educator data not loaded',
      }));
      return;
    }

    // Reset previous errors
    setDocumentErrors((prev) => ({
      ...prev,
      [documentType]: '',
    }));

    // Validate files first
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      // @ts-expect-error - Auto-suppressed for migration
      const validation = validateFile(file, {
        maxSize: 10, // 10MB for documents
        allowedTypes:
          documentType === 'resume' ? ['pdf', 'doc', 'docx'] : ['pdf', 'jpg', 'jpeg', 'png'],
      });

      if (!validation.valid) {
        setDocumentErrors((prev) => ({
          ...prev,
          [documentType]: `${file.name}: ${validation.error}`,
        }));
        return;
      }
    }

    // Store files for confirmation
    setPendingDocuments((prev) => ({
      ...prev,
      [documentType]: fileArray,
    }));

    // Show confirmation dialog
    setShowDocumentConfirmation((prev) => ({
      ...prev,
      [documentType]: true,
    }));

    // Reset file input
    event.target.value = '';
  };

  // Confirm and upload documents
  const confirmDocumentUpload = async (
    documentType: 'id-proof' | 'degree' | 'experience' | 'resume'
  ) => {
    const files = pendingDocuments[documentType];
    if (!files || files.length === 0) return;

    setDocumentUploading((prev) => ({
      ...prev,
      [documentType]: true,
    }));

    setShowDocumentConfirmation((prev) => ({
      ...prev,
      [documentType]: false,
    }));

    try {
      const teacherId = educatorData.id || educatorData.user_id;

      if (documentType === 'experience') {
        // Handle multiple experience letters
        const uploadPromises = files.map((file) =>
          // @ts-expect-error - Auto-suppressed for migration
          storageService.uploadTeacherDocument(file, teacherId, documentType)
        );

        const results = await Promise.all(uploadPromises);

        // Check if all uploads succeeded
        const failedUploads = results.filter((result) => !result.success);
        if (failedUploads.length > 0) {
          throw new Error(`Failed to upload ${failedUploads.length} file(s)`);
        }

        const newUrls = results.map((result) => result.url).filter(Boolean) as string[];
        const updatedUrls = [...settings.experienceLettersUrl, ...newUrls];

        // Update database
        const { error: updateError } = await supabase
          .from('school_educators')
          .update({
            experience_letters_url: updatedUrls,
            updated_at: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (updateError) {
          throw new Error('Failed to save document URLs to database');
        }

        // Update local state
        updateSetting('experienceLettersUrl', updatedUrls);
      } else if (documentType === 'resume') {
        // Handle single resume document
        const file = files[0];

        // Upload to storage
        // @ts-expect-error - Auto-suppressed for migration
        const result = await storageService.uploadTeacherDocument(file, teacherId, documentType);

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update database
        const { error: updateError } = await supabase
          .from('school_educators')
          .update({
            resume_url: result.url,
            updated_at: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (updateError) {
          throw new Error('Failed to save document URL to database');
        }

        // Update local state
        updateSetting('resumeUrl', result.url || '');
      } else {
        // Handle single document (ID proof or degree)
        const file = files[0];

        // Upload to storage
        // @ts-expect-error - Auto-suppressed for migration
        const result = await storageService.uploadTeacherDocument(file, teacherId, documentType);

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update database
        const updateField = documentType === 'id-proof' ? 'id_proof_url' : 'degree_certificate_url';
        const { error: updateError } = await supabase
          .from('school_educators')
          .update({
            [updateField]: result.url,
            updated_at: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (updateError) {
          throw new Error('Failed to save document URL to database');
        }

        // Update local state
        if (documentType === 'id-proof') {
          updateSetting('idProofUrl', result.url || '');
        } else if (documentType === 'degree') {
          updateSetting('degreeCertificateUrl', result.url || '');
        }
      }

      // Refresh educator data
      await fetchEducatorData();

      // Show success message
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(`${documentType} upload error:`, error);
      setDocumentErrors((prev) => ({
        ...prev,
        [documentType]: error instanceof Error ? error.message : 'Upload failed',
      }));
    } finally {
      setDocumentUploading((prev) => ({
        ...prev,
        [documentType]: false,
      }));

      // Clear pending documents
      setPendingDocuments((prev) => ({
        ...prev,
        [documentType]: [],
      }));
    }
  };

  // Cancel document upload
  const cancelDocumentUpload = (documentType: 'id-proof' | 'degree' | 'experience' | 'resume') => {
    setShowDocumentConfirmation((prev) => ({
      ...prev,
      [documentType]: false,
    }));

    setPendingDocuments((prev) => ({
      ...prev,
      [documentType]: [],
    }));
  };

  // Trigger document upload
  const triggerDocumentUpload = (documentType: 'id-proof' | 'degree' | 'experience' | 'resume') => {
    switch (documentType) {
      case 'id-proof':
        idProofInputRef.current?.click();
        break;
      case 'degree':
        degreeInputRef.current?.click();
        break;
      case 'experience':
        experienceInputRef.current?.click();
        break;
      case 'resume':
        resumeInputRef.current?.click();
        break;
    }
  };

  // Remove experience letter
  const removeExperienceLetter = async (index: number) => {
    if (!userEmail) return;

    try {
      const updatedUrls = settings.experienceLettersUrl.filter((_, i) => i !== index);

      // Update database
      const { error: updateError } = await supabase
        .from('school_educators')
        .update({
          experience_letters_url: updatedUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (updateError) {
        throw new Error('Failed to update database');
      }

      // Update local state
      updateSetting('experienceLettersUrl', updatedUrls);

      // Refresh data
      await fetchEducatorData();
    } catch (error) {
      console.error('Error removing experience letter:', error);
      setDocumentErrors((prev) => ({
        ...prev,
        experience: error instanceof Error ? error.message : 'Failed to remove document',
      }));
    }
  };

  // View document
  const viewDocument = (url: string) => {
    // @ts-expect-error - Auto-suppressed for migration
    const viewUrl = getDocumentUrl(url, 'inline');
    window.open(viewUrl, '_blank');
  };

  // Handle photo removal
  const handlePhotoRemove = async () => {
    if (!userEmail || !educatorData?.photo_url) return;

    setPhotoRemoving(true);
    setShowRemovePhotoConfirmation(false);

    try {
      // Update educator record to remove photo URL
      const { error: updateError } = await supabase
        .from('school_educators')
        .update({
          photo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (updateError) {
        throw new Error('Failed to remove photo from database');
      }

      // Refresh educator data to show changes
      await fetchEducatorData();

      // Show success message
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Photo removal error:', error);
      setPhotoError(error instanceof Error ? error.message : 'Failed to remove photo');
    } finally {
      setPhotoRemoving(false);
    }
  };

  // Load data on component mount
  // @ts-expect-error - Auto-suppressed for migration
  useEffect(() => {
    if (userEmail) {
      fetchEducatorData();
    }
  }, [userEmail]);

  const handleSave = async () => {
    if (!userEmail || !educatorData) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');

    try {
      // Update educator profile using your actual field names
      const { error } = await supabase
        .from('school_educators')
        .update({
          first_name: settings.fullName.split(' ')[0] || '',
          last_name: settings.fullName.split(' ').slice(1).join(' ') || '',
          phone_number: settings.phone, // Your field is phone_number
          department: settings.department,
          designation: settings.title, // Your field is designation
          specialization: settings.specialization,
          qualification: settings.educationLevel,
          experience_years: parseInt(settings.yearsOfExperience) || null,
          address: settings.officeLocation,
          city: settings.city,
          state: settings.state,
          country: settings.country,
          pincode: settings.pincode,
          gender: settings.gender,
          onboarding_status: settings.onboardingStatus, // Now editable
          dob: settings.dateOfBirth || null,
          subject_expertise: settings.subjectExpertise,
          // Store bio and other preferences in metadata
          metadata: {
            ...educatorData.metadata,
            bio: settings.bio,
            preferences: {
              ...educatorData.metadata?.preferences,
              // Store any additional settings here
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('email', userEmail);

      if (error) {
        console.error('Error updating profile:', error);
        setSaveStatus('error');
        return;
      }

      setSaveStatus('saved');

      // Refresh the data
      await fetchEducatorData();
    } catch (error) {
      console.error('Error in handleSave:', error);
      setSaveStatus('error');
    }

    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
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
    { id: 'subscription', label: 'Subscription', icon: CreditCardIcon },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Toggle accordion section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header - responsive layout */}
      <div className="p-4 sm:p-6 lg:p-8 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Educator Settings</h1>
            <p className="text-base md:text-lg mt-2 text-gray-600">
              Manage your personal, teaching, and privacy preferences here.
            </p>
          </div>

          {/* Settings Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <CogIcon className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {tabs.find((tab) => tab.id === activeTab)?.label || 'Settings'}
              </span>
              <ChevronRightIcon
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  showSettingsDropdown ? 'rotate-90' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showSettingsDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                    Settings Categories
                  </div>
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as typeof activeTab);
                          setShowSettingsDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Content Area - Full Width */}
        <div className="space-y-6">
          {/* Save Status Alert */}
          {saveStatus !== 'idle' && (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                saveStatus === 'saving'
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
                  <span className="text-sm font-medium">
                    Failed to save settings. Please try again.
                  </span>
                </>
              )}
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading profile...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800">{error}</span>
                  </div>
                  <button
                    onClick={fetchEducatorData}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Profile Content - Only show when not loading and no error */}
              {!loading && !error && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <AccordionSection
                    sectionKey="photo"
                    title="Profile Photo"
                    description="Update your profile picture"
                    icon={<PhotoIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.photo}
                    onToggle={() => toggleSection('photo')}
                  >
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        {/* Profile Photo Display */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl border-2 border-slate-200 shadow-lg">
                          {educatorData?.photo_url ? (
                            <img
                              // @ts-expect-error - Auto-suppressed for migration
                              src={getDocumentUrl(educatorData.photo_url, 'inline')}
                              alt={`${settings.fullName || 'Educator'} Profile`}
                              className="w-full h-full object-cover transition-opacity duration-200"
                              onLoad={(e) => {
                                // Show image and hide fallback
                                e.currentTarget.style.opacity = '1';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'none';
                              }}
                              onError={(e) => {
                                // Hide image and show fallback
                                console.error(
                                  'Failed to load profile image:',
                                  educatorData.photo_url
                                );
                                e.currentTarget.style.opacity = '0';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              style={{ opacity: 0 }}
                            />
                          ) : null}

                          {/* Fallback initials - always rendered but conditionally shown */}
                          <div
                            className={`absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xl ${
                              educatorData?.photo_url ? 'opacity-0' : 'opacity-100'
                            } transition-opacity duration-200`}
                            style={{ display: educatorData?.photo_url ? 'none' : 'flex' }}
                          >
                            {getInitials(settings.fullName || 'ED')}
                          </div>
                        </div>

                        {/* Photo upload overlay button */}
                        <button
                          onClick={triggerPhotoUpload}
                          disabled={photoUploading}
                          className="absolute -bottom-2 -right-2 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          title="Change profile photo"
                        >
                          {photoUploading ? (
                            <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />
                          ) : (
                            <PhotoIcon className="w-4 h-4 text-slate-600 hover:text-blue-600 transition-colors" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1">
                        {/* Upload and Remove buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={triggerPhotoUpload}
                            disabled={photoUploading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {photoUploading ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Upload Photo
                              </>
                            )}
                          </button>

                          {/* Remove Photo Button - only show if photo exists */}
                          {educatorData?.photo_url && (
                            <button
                              onClick={() => setShowRemovePhotoConfirmation(true)}
                              disabled={photoRemoving}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {photoRemoving ? (
                                <>
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                  Removing...
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Remove Photo
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* File input (hidden) */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />

                        <p className="text-xs text-slate-500 mt-2">
                          JPG, PNG or GIF. Maximum file size 5MB.
                        </p>

                        {/* Photo upload error */}
                        {photoError && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{photoError}</p>
                          </div>
                        )}

                        {/* Current photo status */}
                        {educatorData?.photo_url && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-700 font-medium">
                                Profile photo active
                              </p>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Accessible via:{' '}
                              // @ts-expect-error - Auto-suppressed for migration
                              {getDocumentUrl(educatorData.photo_url, 'inline').length > 50
                                // @ts-expect-error - Auto-suppressed for migration
                                ? `${getDocumentUrl(educatorData.photo_url, 'inline').substring(0, 50)}...`
                                // @ts-expect-error - Auto-suppressed for migration
                                : getDocumentUrl(educatorData.photo_url, 'inline')}
                            </p>
                          </div>
                        )}

                        {!educatorData?.photo_url && !photoUploading && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <PhotoIcon className="w-4 h-4 text-blue-600" />
                              <p className="text-sm text-blue-700 font-medium">No profile photo</p>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                              Upload a photo to personalize your profile
                            </p>
                          </div>
                        )}

                        {/* Remove Photo Confirmation Dialog */}
                        {showRemovePhotoConfirmation && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <svg
                                  className="w-5 h-5 text-red-600 mt-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-red-900 mb-1">
                                  Remove Profile Photo
                                </h4>
                                <p className="text-sm text-red-800 mb-3">
                                  Are you sure you want to remove your profile photo? This action
                                  cannot be undone. Your profile will show initials instead.
                                </p>
                                <div className="flex gap-3">
                                  <button
                                    onClick={handlePhotoRemove}
                                    disabled={photoRemoving}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Yes, Remove Photo
                                  </button>
                                  <button
                                    onClick={() => setShowRemovePhotoConfirmation(false)}
                                    className="px-3 py-1.5 text-sm bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionSection>

                  {/* Personal Information */}
                  <AccordionSection
                    sectionKey="personal"
                    title="Personal Information"
                    description="Update your personal details"
                    icon={<UserIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.personal}
                    onToggle={() => toggleSection('personal')}
                    showSaveButtons={true}
                    onSave={handleSave}
                    onCancel={() => fetchEducatorData()}
                    saveStatus={saveStatus}
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
                        readonly={true}
                      />
                      <SettingInput
                        label="Phone Number"
                        type="tel"
                        value={settings.phone}
                        onChange={(value) => updateSetting('phone', value)}
                        placeholder="+1 (555) 000-0000"
                      />
                      <SettingInput
                        label="Employee ID"
                        value={settings.employeeId}
                        onChange={(value) => updateSetting('employeeId', value)}
                        readonly={true}
                      />
                      <SettingSelect
                        label="Gender"
                        value={settings.gender}
                        onChange={(value) => updateSetting('gender', value)}
                        options={[
                          { value: '', label: 'Select Gender' },
                          { value: 'Male', label: 'Male' },
                          { value: 'Female', label: 'Female' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                      <SettingInput
                        label="Date of Birth"
                        type="date"
                        value={settings.dateOfBirth}
                        onChange={(value) => updateSetting('dateOfBirth', value)}
                      />
                      <div className="py-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                        <textarea
                          value={settings.bio}
                          onChange={(e) => updateSetting('bio', e.target.value)}
                          placeholder="Tell students about yourself..."
                          rows={4}
                          maxLength={500}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-1.5">
                          {settings.bio.length}/500 characters
                        </p>
                      </div>
                    </div>
                  </AccordionSection>

                  {/* Professional Information */}
                  <AccordionSection
                    sectionKey="professional"
                    title="Professional Information"
                    description="Your academic and professional details"
                    // @ts-expect-error - Auto-suppressed for migration
                    icon={<BriefcaseIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.professional}
                    onToggle={() => toggleSection('professional')}
                    showSaveButtons={true}
                    onSave={handleSave}
                    onCancel={() => fetchEducatorData()}
                    saveStatus={saveStatus}
                  >
                    <div className="space-y-1">
                      <SettingInput
                        label="Designation"
                        value={settings.title}
                        onChange={(value) => updateSetting('title', value)}
                        placeholder="e.g., Associate Professor"
                        // @ts-expect-error - Auto-suppressed for migration
                        icon={<BriefcaseIcon className="w-4 h-4" />}
                      />
                      <SettingInput
                        label="Department"
                        value={settings.department}
                        onChange={(value) => updateSetting('department', value)}
                        placeholder="e.g., Computer Science"
                        // @ts-expect-error - Auto-suppressed for migration
                        icon={<BuildingOfficeIcon className="w-4 h-4" />}
                      />
                      <SettingInput
                        label="Specialization"
                        value={settings.specialization}
                        onChange={(value) => updateSetting('specialization', value)}
                        placeholder="e.g., Artificial Intelligence"
                      />
                      <SettingInput
                        label="Qualification"
                        value={settings.educationLevel}
                        onChange={(value) => updateSetting('educationLevel', value)}
                        placeholder="e.g., PhD in Computer Science"
                        // @ts-expect-error - Auto-suppressed for migration
                        icon={<AcademicCapIcon className="w-4 h-4" />}
                      />
                      <SettingInput
                        label="Years of Experience"
                        type="number"
                        value={settings.yearsOfExperience}
                        onChange={(value) => updateSetting('yearsOfExperience', value)}
                        placeholder="e.g., 12"
                      />
                      <SettingSelect
                        label="Role"
                        value={settings.role}
                        onChange={(value) => updateSetting('role', value)}
                        options={[
                          { value: '', label: 'Select Role' },
                          { value: 'school_admin', label: 'School Admin' },
                          { value: 'principal', label: 'Principal' },
                          { value: 'it_admin', label: 'IT Admin' },
                          { value: 'class_teacher', label: 'Class Teacher' },
                          { value: 'subject_teacher', label: 'Subject Teacher' },
                        ]}
                      />
                      <SettingSelect
                        label="Onboarding Status"
                        value={settings.onboardingStatus}
                        onChange={(value) => updateSetting('onboardingStatus', value)}
                        options={[
                          { value: '', label: 'Select Status' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'verified', label: 'Verified' },
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                        ]}
                      />
                      <SettingInput
                        label="Verification Status"
                        value={settings.verificationStatus || 'Not Set'}
                        onChange={() => {}} // No-op since it's readonly
                        readonly={true}
                        placeholder="Verification status from database"
                      />
                    </div>
                  </AccordionSection>

                  {/* Subject Expertise Section */}
                  <AccordionSection
                    sectionKey="expertise"
                    title="Subject Expertise"
                    description="Your teaching subjects and proficiency levels"
                    // @ts-expect-error - Auto-suppressed for migration
                    icon={<AcademicCapIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.expertise}
                    onToggle={() => toggleSection('expertise')}
                    showSaveButtons={true}
                    onSave={handleSave}
                    onCancel={() => fetchEducatorData()}
                    saveStatus={saveStatus}
                  >
                    <div className="space-y-4">
                      {settings.subjectExpertise.map((subject, index) => (
                        <div
                          key={index}
                          className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Subject Name
                              </label>
                              <input
                                type="text"
                                value={subject.name}
                                onChange={(e) => {
                                  const newExpertise = [...settings.subjectExpertise];
                                  newExpertise[index].name = e.target.value;
                                  updateSetting('subjectExpertise', newExpertise);
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="e.g., Mathematics"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Proficiency
                              </label>
                              <select
                                value={subject.proficiency}
                                onChange={(e) => {
                                  const newExpertise = [...settings.subjectExpertise];
                                  newExpertise[index].proficiency = e.target.value;
                                  updateSetting('subjectExpertise', newExpertise);
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                              >
                                <option value="">Select Level</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                Years Experience
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={subject.years_experience}
                                  onChange={(e) => {
                                    const newExpertise = [...settings.subjectExpertise];
                                    newExpertise[index].years_experience =
                                      parseInt(e.target.value) || 0;
                                    updateSetting('subjectExpertise', newExpertise);
                                  }}
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                  placeholder="Years"
                                  min="0"
                                />
                                <button
                                  onClick={() => {
                                    const newExpertise = settings.subjectExpertise.filter(
                                      (_, i) => i !== index
                                    );
                                    updateSetting('subjectExpertise', newExpertise);
                                  }}
                                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                                  title="Remove subject"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newExpertise = [
                            ...settings.subjectExpertise,
                            {
                              name: '',
                              proficiency: '',
                              years_experience: 0,
                            },
                          ];
                          updateSetting('subjectExpertise', newExpertise);
                        }}
                        className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        // @ts-expect-error - Auto-suppressed for migration
                        <PlusCircleIcon className="w-5 h-5" />
                        Add Subject Expertise
                      </button>
                    </div>
                  </AccordionSection>

                  {/* Professional Documents Section */}
                  <AccordionSection
                    sectionKey="documents"
                    title="Professional Documents"
                    description="Upload and manage your professional documents"
                    // @ts-expect-error - Auto-suppressed for migration
                    icon={<DocumentTextIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.documents}
                    onToggle={() => toggleSection('documents')}
                  >
                    <div className="space-y-4">
                      {/* ID Proof */}
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">ID Proof</h4>
                            <p className="text-xs text-slate-600">Government issued ID document</p>
                          </div>
                          <button
                            onClick={() => triggerDocumentUpload('id-proof')}
                            disabled={documentUploading['id-proof']}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {documentUploading['id-proof'] ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={idProofInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'id-proof')}
                          className="hidden"
                        />

                        {settings.idProofUrl ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Document uploaded</span>
                            <button
                              onClick={() => viewDocument(settings.idProofUrl)}
                              className="text-blue-600 hover:underline ml-2"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No document uploaded</p>
                        )}

                        {/* Upload error */}
                        {documentErrors['id-proof'] && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{documentErrors['id-proof']}</p>
                          </div>
                        )}

                        {/* Confirmation Dialog */}
                        {showDocumentConfirmation['id-proof'] && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  Confirm Upload
                                </h5>
                                <p className="text-xs text-blue-800 mb-2">
                                  Ready to upload: {pendingDocuments['id-proof']?.[0]?.name}
                                </p>
                                <p className="text-xs text-blue-700">
                                  This will replace your current ID proof document. Continue?
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => confirmDocumentUpload('id-proof')}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Confirm Upload
                              </button>
                              <button
                                onClick={() => cancelDocumentUpload('id-proof')}
                                className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Degree Certificate */}
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              Degree Certificate
                            </h4>
                            <p className="text-xs text-slate-600">
                              Highest education degree certificate
                            </p>
                          </div>
                          <button
                            onClick={() => triggerDocumentUpload('degree')}
                            disabled={documentUploading['degree']}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {documentUploading['degree'] ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={degreeInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleDocumentUpload(e, 'degree')}
                          className="hidden"
                        />

                        {settings.degreeCertificateUrl ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Document uploaded</span>
                            <button
                              onClick={() => viewDocument(settings.degreeCertificateUrl)}
                              className="text-blue-600 hover:underline ml-2"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No document uploaded</p>
                        )}

                        {/* Upload error */}
                        {documentErrors['degree'] && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{documentErrors['degree']}</p>
                          </div>
                        )}

                        {/* Confirmation Dialog */}
                        {showDocumentConfirmation['degree'] && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  Confirm Upload
                                </h5>
                                <p className="text-xs text-blue-800 mb-2">
                                  Ready to upload: {pendingDocuments['degree']?.[0]?.name}
                                </p>
                                <p className="text-xs text-blue-700">
                                  This will replace your current degree certificate. Continue?
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => confirmDocumentUpload('degree')}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Confirm Upload
                              </button>
                              <button
                                onClick={() => cancelDocumentUpload('degree')}
                                className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Experience Letters */}
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              Experience Letters
                            </h4>
                            <p className="text-xs text-slate-600">
                              Previous employment experience letters (multiple files allowed)
                            </p>
                          </div>
                          <button
                            onClick={() => triggerDocumentUpload('experience')}
                            disabled={documentUploading['experience']}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {documentUploading['experience'] ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={experienceInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          onChange={(e) => handleDocumentUpload(e, 'experience')}
                          className="hidden"
                        />

                        {settings.experienceLettersUrl.length > 0 ? (
                          <div className="space-y-2">
                            {settings.experienceLettersUrl.map((url, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  <span>Experience Letter {index + 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => viewDocument(url)}
                                    className="text-blue-600 hover:underline text-sm"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => removeExperienceLetter(index)}
                                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                                    title="Remove document"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No documents uploaded</p>
                        )}

                        {/* Upload error */}
                        {documentErrors['experience'] && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{documentErrors['experience']}</p>
                          </div>
                        )}

                        {/* Confirmation Dialog */}
                        {showDocumentConfirmation['experience'] && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  Confirm Upload
                                </h5>
                                <p className="text-xs text-blue-800 mb-2">
                                  Ready to upload {pendingDocuments['experience']?.length || 0}{' '}
                                  file(s):
                                </p>
                                <ul className="text-xs text-blue-700 mb-2 ml-3">
                                  {pendingDocuments['experience']?.map((file, index) => (
                                    <li key={index} className="list-disc">
                                      {file.name}
                                    </li>
                                  ))}
                                </ul>
                                <p className="text-xs text-blue-700">
                                  These will be added to your existing experience letters. Continue?
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => confirmDocumentUpload('experience')}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Confirm Upload
                              </button>
                              <button
                                onClick={() => cancelDocumentUpload('experience')}
                                className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload info */}
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">
                            You can upload multiple experience letters. Supported formats: PDF, JPG,
                            PNG. Max size: 10MB per file.
                          </p>
                        </div>
                      </div>

                      {/* Resume/CV */}
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">Resume/CV</h4>
                            <p className="text-xs text-slate-600">
                              Your current resume or curriculum vitae
                            </p>
                          </div>
                          <button
                            onClick={() => triggerDocumentUpload('resume')}
                            disabled={documentUploading['resume']}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {documentUploading['resume'] ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={resumeInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleDocumentUpload(e, 'resume')}
                          className="hidden"
                        />

                        {settings.resumeUrl ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Resume uploaded</span>
                            <button
                              onClick={() => viewDocument(settings.resumeUrl)}
                              className="text-blue-600 hover:underline ml-2"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No resume uploaded</p>
                        )}

                        {/* Upload error */}
                        {documentErrors['resume'] && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{documentErrors['resume']}</p>
                          </div>
                        )}

                        {/* Confirmation Dialog */}
                        {showDocumentConfirmation['resume'] && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  Confirm Upload
                                </h5>
                                <p className="text-xs text-blue-800 mb-2">
                                  Ready to upload: {pendingDocuments['resume']?.[0]?.name}
                                </p>
                                <p className="text-xs text-blue-700">
                                  This will replace your current resume. Continue?
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => confirmDocumentUpload('resume')}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Confirm Upload
                              </button>
                              <button
                                onClick={() => cancelDocumentUpload('resume')}
                                className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload info */}
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">
                            Upload your resume in PDF, DOC, or DOCX format. Max size: 10MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionSection>

                  {/* Address Information */}
                  <AccordionSection
                    sectionKey="address"
                    title="Address Information"
                    description="Your contact address details"
                    // @ts-expect-error - Auto-suppressed for migration
                    icon={<BuildingOfficeIcon className="w-5 h-5" />}
                    isExpanded={expandedSections.address}
                    onToggle={() => toggleSection('address')}
                    showSaveButtons={true}
                    onSave={handleSave}
                    onCancel={() => fetchEducatorData()}
                    saveStatus={saveStatus}
                  >
                    <div className="space-y-1">
                      <SettingInput
                        label="Address"
                        value={settings.officeLocation}
                        onChange={(value) => updateSetting('officeLocation', value)}
                        placeholder="Enter your address"
                        // @ts-expect-error - Auto-suppressed for migration
                        icon={<BuildingOfficeIcon className="w-4 h-4" />}
                      />
                      <SettingInput
                        label="City"
                        value={settings.city}
                        onChange={(value) => updateSetting('city', value)}
                        placeholder="Enter city"
                      />
                      <SettingInput
                        label="State"
                        value={settings.state}
                        onChange={(value) => updateSetting('state', value)}
                        placeholder="Enter state"
                      />
                      <SettingInput
                        label="Country"
                        value={settings.country}
                        onChange={(value) => updateSetting('country', value)}
                        placeholder="Enter country"
                      />
                      <SettingInput
                        label="Pincode"
                        value={settings.pincode}
                        onChange={(value) => updateSetting('pincode', value)}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </AccordionSection>
                </div>
              )}
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
                  <p className="text-xs text-amber-800">
                    Browser permission required for push notifications
                  </p>
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
                  <p className="text-xs text-slate-600">
                    Your data is never shared with third parties and remains anonymous
                  </p>
                </div>
              </SettingsSection>
            </div>
          )}

          {/* Subscription Settings */}
          // @ts-expect-error - Auto-suppressed for migration
          {activeTab === 'subscription' && <SubscriptionSettingsSection />}

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
                      <strong>Password Requirements:</strong> Must be at least 8 characters long and
                      contain a mix of letters, numbers, and symbols for better security.
                    </p>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
