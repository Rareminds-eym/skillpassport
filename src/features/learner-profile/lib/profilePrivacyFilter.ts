export type ViewerType = 'owner' | 'recruiter' | 'public';

export interface PrivacySettings {
  profileVisibility: 'public' | 'recruiters' | 'private';
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  allowRecruiterContact?: boolean;
  showInTalentPool?: boolean;
}

interface ProfileData {
  [key: string]: any;
}

export function filterProfileByPrivacy(
  profileData: ProfileData,
  privacySettings: PrivacySettings,
  viewerType: ViewerType
): ProfileData {
  if (!profileData) return profileData;

  // Owner always sees everything
  if (viewerType === 'owner') {
    return profileData;
  }

  // Determine if viewer can access profile at all
  const canAccessProfile = canViewProfile(privacySettings, viewerType);

  if (!canAccessProfile) {
    return {
      id: profileData.id,
      name: profileData.name || 'Private Profile',
      message: 'This profile is private',
    };
  }

  // Start with full profile
  let filtered = { ...profileData };

  // Filter contact information based on visibility settings
  if (!privacySettings.showEmail) {
    filtered.email = undefined;
  }
  if (!privacySettings.showPhone) {
    filtered.phone = undefined;
    filtered.contact_number = undefined;
    filtered.contactNumber = undefined;
  }
  if (!privacySettings.showLocation) {
    filtered.location = undefined;
    filtered.city = undefined;
    filtered.state = undefined;
    filtered.district_name = undefined;
    filtered.address = undefined;
  }

  // For public viewers, hide sensitive information even if toggles are on
  if (viewerType === 'public') {
    filtered.aadhar_number = undefined;
    filtered.aadharNumber = undefined;
    filtered.dateOfBirth = undefined;
    filtered.date_of_birth = undefined;
    filtered.guardianName = undefined;
    filtered.guardianPhone = undefined;
    filtered.guardianEmail = undefined;
    filtered.workExperience = undefined;
    filtered.work_experience = undefined;
  }

  // Hide recruiter-sensitive settings
  filtered.privacySettings = undefined;
  filtered.notificationSettings = undefined;

  return filtered;
}

export function canViewProfile(
  privacySettings: PrivacySettings,
  viewerType: ViewerType
): boolean {
  if (viewerType === 'owner') return true;

  const visibility = privacySettings.profileVisibility;

  if (visibility === 'private') {
    return false;
  }

  if (visibility === 'recruiters' && viewerType !== 'recruiter') {
    return false;
  }

  return true;
}

export function canContactLearner(
  privacySettings: PrivacySettings,
  viewerType: ViewerType
): boolean {
  if (viewerType === 'owner') return false; // Can't contact yourself

  if (!privacySettings.allowRecruiterContact) {
    return false;
  }

  if (viewerType === 'recruiter') {
    return true;
  }

  return false;
}

export function isInTalentPool(
  privacySettings: PrivacySettings,
  viewerType: ViewerType
): boolean {
  if (viewerType === 'owner') return false;

  if (!privacySettings.showInTalentPool) {
    return false;
  }

  // Only recruiters can find learners in talent pool
  if (viewerType === 'recruiter') {
    return true;
  }

  return false;
}

export function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'Public - Visible to everyone';
    case 'recruiters':
      return 'Recruiters Only - Visible to recruiters';
    case 'private':
      return 'Private - Only visible to you';
    default:
      return 'Unknown';
  }
}
