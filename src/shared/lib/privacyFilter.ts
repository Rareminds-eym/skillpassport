/**
 * Privacy filtering utilities for learner profile data
 * Enforces privacy settings at the application level
 */

export interface PrivacySettings {
  profileVisibility: 'public' | 'recruiters' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
}

export interface ViewerContext {
  isOwner: boolean;
  isAdmin: boolean;
  isEducator: boolean;
  isRecruiter: boolean;
}

/**
 * Determine if a viewer can access a profile based on privacy settings
 */
export function canViewProfile(
  privacySettings: PrivacySettings,
  viewerContext: ViewerContext
): boolean {
  if (!privacySettings) {
    return false;
  }

  const { profileVisibility } = privacySettings;
  const { isOwner, isAdmin, isEducator, isRecruiter } = viewerContext;

  // Owner and admin can always view
  if (isOwner || isAdmin) {
    return true;
  }

  // Apply visibility rules
  switch (profileVisibility) {
    case 'public':
      return true;
    case 'recruiters':
      return isRecruiter || isEducator;
    case 'private':
      return false;
    default:
      return false;
  }
}

/**
 * Filter sensitive fields from learner data based on privacy settings
 */
export function filterLearnerDataByPrivacy(
  learnerData: any,
  privacySettings: PrivacySettings,
  viewerContext: ViewerContext
): any {
  const { isOwner } = viewerContext;

  // Owner sees all data
  if (isOwner) {
    return learnerData;
  }

  const filtered = { ...learnerData };

  // Apply field-level privacy filters
  if (!privacySettings.showEmail) {
    filtered.email = undefined;
    filtered.contact_email = undefined;
  }

  if (!privacySettings.showPhone) {
    filtered.phone = undefined;
    filtered.mobile = undefined;
  }

  if (!privacySettings.showLocation) {
    filtered.location = undefined;
    filtered.city = undefined;
    filtered.state = undefined;
    filtered.country = undefined;
  }

  return filtered;
}

/**
 * Validate privacy settings structure with safe defaults
 */
export function normalizePrivacySettings(
  settings: any
): PrivacySettings {
  const validVisibilities = ['public', 'recruiters', 'private'];

  const profileVisibility = validVisibilities.includes(settings?.profileVisibility)
    ? settings.profileVisibility
    : 'public';

  return {
    profileVisibility: profileVisibility as PrivacySettings['profileVisibility'],
    showEmail: settings?.showEmail !== false,
    showPhone: settings?.showPhone !== false,
    showLocation: settings?.showLocation !== false,
  };
}

/**
 * Create viewer context from user role
 */
export function createViewerContext(
  userRole: string | null | undefined,
  isProfileOwner: boolean
): ViewerContext {
  const role = userRole?.toLowerCase() ?? 'guest';

  return {
    isOwner: isProfileOwner,
    isAdmin: role.includes('admin') || role === 'principal' || role === 'it_admin',
    isEducator: role === 'educator' || role === 'school_educator' || role === 'college_educator',
    isRecruiter: role === 'recruiter',
  };
}
