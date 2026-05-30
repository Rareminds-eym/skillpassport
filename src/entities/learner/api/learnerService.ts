import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
/**
 * Consolidated Learner Service
 * Handles all learner-related operations with TypeScript types
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';
import { apiGet, apiPost } from '@/shared/api/apiClient';
import {
  ServiceResponse,
  UserCreateData,
  LearnerUpdateData,
  LearnerApiResponse,
  Learner,
} from '@/entities/learner/model/types';


const logger = getLogger('learner-service');

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate UUID
 */
const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

/**
 * Format phone number with country code
 */
function formatPhoneNumber(number?: string, dialCode: number = 91): string {
  if (!number) return '';
  const code = typeof dialCode === 'number' ? dialCode : 91;
  return `+${code} ${number}`;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate avatar URL from name
 */
function generateAvatar(name?: string): string {
  if (!name) return 'https://ui-avatars.com/api/?name=Learner&background=4F46E5&color=fff';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4F46E5&color=fff&size=200`;
}

// ==================== CORE LEARNER FUNCTIONS ====================

/**
 * Create a user record in the users table
 */
export const createUserRecord = async (userId: string, userData: UserCreateData): Promise<ServiceResponse> => {
  try {
    const { email, firstName, lastName, user_role, role, dateOfBirth } = userData;

    const userRecord = {
      id: userId,
      email: email,
      firstName: firstName || null,
      lastName: lastName || null,
      role: role || user_role || 'learner',
      isActive: true,
      dob: dateOfBirth || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([userRecord])
      .select()
      .single();

    if (error) {
      logger.error('Error creating user record', error);
      return { success: false, data: null, error: error.message };
    }

    logger.info('User record created successfully', { userId });
    return { success: true, data: data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Unexpected error creating user record', error instanceof Error ? error : new Error(String(error)));
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Create a learner record in the learners table
 */
export const createLearner = async (learnerData: LearnerData, userId: string): Promise<ServiceResponse> => {
  try {
    const {
      name,
      email,
      phone,
      learnerType,
      schoolId,
      collegeId,
      country,
      state,
      city,
      preferredLanguage,
      referralCode
    } = learnerData;

    const normalizedlearnerType = learnerType?.toLowerCase().replace('-learner', '').replace('-educator', '') || 'learner';

    const learner = {
      id: userId,
      user_id: userId,
      name: name,
      email: email,
      contact_number: phone || null,
      learner_type: normalizedlearnerType,
      school_id: schoolId || null,
      college_id: collegeId || null,
      country: country || null,
      state: state || null,
      city: city || null,
      preferred_language: preferredLanguage || 'en',
      referral_code: referralCode || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learners')
      .insert([learner])
      .select()
      .single();

    if (error) {
      logger.error('Error creating learner record', error, { userId, email: learnerData.email });
      return { success: false, data: null, error: error.message };
    }

    logger.info('Learner record created successfully', { learnerId: data.id });
    return { success: true, data: data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Unexpected error creating learner', error instanceof Error ? error : new Error(String(error)), { userId, email: learnerData.email });
    return { success: false, data: null, error: errorMessage };
  }
};


/**
 * Update learner by learner ID
 */
export const updateLearner = async (learnerId: string, updates: LearnerUpdateData): Promise<ServiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', learnerId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating learner', error, { learnerId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Unexpected error updating learner', error instanceof Error ? error : new Error(String(error)), { learnerId });
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Soft delete a learner by learner ID
 */
export const softDeleteLearner = async (learnerId: string, educatorId: string): Promise<ServiceResponse> => {
  try {
    const { data, error } = await supabase
      .from('learners')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: educatorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', learnerId)
      .select()
      .single();

    if (error) {
      logger.error('Error soft deleting learner', error, { learnerId });
      return { success: false, data: null, error: error.message };
    }

    logger.info('Learner soft deleted successfully', { learnerId: data.id });
    return { success: true, data: data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Unexpected error soft deleting learner', error instanceof Error ? error : new Error(String(error)), { learnerId });
    return { success: false, data: null, error: errorMessage };
  }
};

// ==================== EMAIL-BASED FUNCTIONS ====================

/**
 * Transform profile data to consistent format
 */
function transformProfileData(profile: ProfileInput | null, email: string, learnerRecord: LearnerRecordInput | null = null): TransformedProfile | null {
  if (!profile && !learnerRecord) {
    return null;
  }

  const data = learnerRecord || {};
  const profileData = profile || {};

  const age = data.age || profileData.age || calculateAge((data.date_of_birth || data.dateOfBirth || profileData.date_of_birth || profileData.dateOfBirth) as string);
  const registrationNumber = data.registration_number || profileData.registration_number || profileData.registrationNumber;
  const passportId = registrationNumber ? `SP-${registrationNumber}` : 'SP-0000';

  const phone = formatPhoneNumber(
    (data.contact_number || data.contactNumber || profileData.contact_number || profileData.phone) as string,
    data.contact_dial_code || profileData.contact_number_dial_code
  );
  const alternatePhone = formatPhoneNumber((data.alternate_number || profileData.alternate_number || profileData.alternatePhone) as string);

  return {
    profile: {
      name: data.name || profileData.name || 'Learner',
      email: email || data.email || profileData.email || '',
      passportId: passportId,
      department: data.branch_field || profileData.branch_field || profileData.department || '',
      university: data.university || profileData.university || '',
      photo: generateAvatar((data.name || profileData.name) as string),
      verified: true,
      employabilityScore: 75,
      cgpa: 'N/A',
      yearOfPassing: '',
      phone: phone,
      alternatePhone: alternatePhone,
      age: age,
      dateOfBirth: data.date_of_birth || data.dateOfBirth || profileData.date_of_birth || profileData.dateOfBirth || '',
      district: data.district_name || profileData.district_name || profileData.district || '',
      college: data.college_school_name || profileData.college_school_name || profileData.college || '',
      registrationNumber: registrationNumber || '',
      classYear: data.class_year || profileData.classYear || '',
      github_link: data.github_link || profileData.github_link || '',
      portfolio_link: data.portfolio_link || profileData.portfolio_link || '',
      linkedin_link: data.linkedin_link || profileData.linkedin_link || '',
      twitter_link: data.twitter_link || profileData.twitter_link || '',
      instagram_link: data.instagram_link || profileData.instagram_link || '',
      facebook_link: data.facebook_link || profileData.facebook_link || '',
      other_social_links: data.other_social_links || profileData.other_social_links || [],
    },
    education: profileData.education || [],
    training: profileData.training || (data.course_name || profileData.course ? [{
      course: data.course_name || profileData.course || '',
      provider: '',
      startDate: '',
      endDate: '',
      status: 'ongoing' as const
    }] : []),
    experience: profileData.experience || [],
    technicalSkills: profileData.technicalSkills || [],
    softSkills: profileData.softSkills || [],
    projects: Array.isArray(profileData.projects) ? profileData.projects : [],
    certificates: Array.isArray(profileData.certificates) ? profileData.certificates : [],
    recentUpdates: [
      {
        id: 1,
        message: `Enrolled in ${data.course_name || profileData.course || 'course'}`,
        timestamp: data.imported_at || profileData.imported_at || new Date().toISOString(),
        type: 'achievement'
      }
    ],
    suggestions: [
      {
        id: 1,
        message: 'Complete your profile with project details',
        priority: 3,
        isActive: true
      }
    ],
    opportunities: []
  };
}


/**
 * Fetch learner data by email from Supabase
 */
export const getlearnerByEmail = async (email: string): Promise<ServiceResponse> => {
  try {
    // Route through the secure backend endpoint to bypass RLS
    const { ssoClient } = await import('@/shared/api/ssoClient');
    const getCurrentSession = () => ({ data: { session: { access_token: ssoClient.getAccessToken() } } });
    const user = useAuthStore.getState().user;

    const origin = window.location.origin;
    const response = await ssoClient.fetch(`${origin}/api/learners/by-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(ssoClient.getAccessToken() ? { } : {}),
      },
    });

    const result = await response.json();

    if (!result.success || !result.data) {
      const errorMsg = result.error || 'No data found for this email.';
      logger.error('API error fetching learner by email', new Error(errorMsg), { email });
      return { success: false, data: null, error: errorMsg };
    }

    const data = result.data;
    const error = null;

    // Create profile data from individual columns
    const profileData = {
      name: data.name || 'Learner',
      email: data.email || email,
      age: data.age,
      dateOfBirth: data.date_of_birth || data.dateOfBirth,
      phone: formatPhoneNumber(data.contact_number || data.contactNumber, data.contact_dial_code),
      alternatePhone: formatPhoneNumber(data.alternate_number),
      district: data.district_name,
      university: data.university,
      department: data.branch_field,
      college: data.college_school_name,
      registrationNumber: data.registration_number,

      // Guardian info
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail,
      guardianRelation: data.guardianRelation,

      // Personal details
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      bio: data.bio,

      // Location
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,

      // Social links
      github_link: data.github_link,
      linkedin_link: data.linkedin_link,
      twitter_link: data.twitter_link,
      facebook_link: data.facebook_link,
      instagram_link: data.instagram_link,
      portfolio_link: data.portfolio_link,
      youtube_link: data.youtube_link,
      other_social_links: data.other_social_links || [],

      // Files
      resumeUrl: data.resumeUrl,
      profilePicture: data.profilePicture,

      // School/College specific
      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,

      // Additional fields
      hobbies: data.hobbies || [],
      languages: data.languages || [],
      interests: data.interests || [],

      // New fields for gap years, work experience, and academic info
      gapInStudies: data.gap_in_studies || false,
      gapYears: data.gap_years || 0,
      gapReason: data.gap_reason || '',
      workExperience: data.work_experience || '',
      aadharNumber: data.aadhar_number || '',
      backlogsHistory: data.backlogs_history || '',
      currentBacklogs: data.current_backlogs || 0,

      // Generate passport ID from registration number
      passportId: data.registration_number ? `SP-${data.registration_number}` : 'SP-0000',
      verified: true,
      employabilityScore: 75,
      cgpa: data.currentCgpa || 'N/A',
      photo: generateAvatar(data.name)
    };

    // Transform profile data to consistent format
    const transformedProfile = transformProfileData(profileData, email, data);
    if (!transformedProfile) {
      return { success: false, data: null, error: 'Failed to transform profile data' };
    }

    // Extract skill_passports data (if exists)
    const passport = data.skill_passports || {};

    // Format skills from skills table
    const tableSkills = Array.isArray(data?.skills) ? data.skills : [];
    const technicalSkills = tableSkills
      .filter((skill: SkillRecord) => skill.type === 'technical')
      .map((skill: SkillRecord) => ({
        id: skill.id,
        name: skill.name,
        level: skill.level || 3,
        proficiency_level: skill.proficiency_level || 'Intermediate',
        rating: skill.level || 3,
        type: 'technical',
        description: skill.description || '',
        examples: skill.examples || '',
        verified: skill.verified || false,
        enabled: skill.enabled !== undefined ? skill.enabled : true,
        approval_status: skill.approval_status || 'approved',
        createdAt: skill.created_at,
        updatedAt: skill.updated_at,
      }));

    const softSkills = tableSkills
      .filter((skill: SkillRecord) => skill.type === 'soft')
      .map((skill: SkillRecord) => ({
        id: skill.id,
        name: skill.name,
        level: skill.level || 3,
        proficiency_level: skill.proficiency_level || 'Intermediate',
        rating: skill.level || 3,
        type: 'soft',
        description: skill.description || '',
        examples: skill.examples || '',
        verified: skill.verified || false,
        enabled: skill.enabled !== undefined ? skill.enabled : true,
        approval_status: skill.approval_status || 'approved',
        createdAt: skill.created_at,
        updatedAt: skill.updated_at,
      }));

    // Format education from education table
    const tableEducation = Array.isArray(data?.education) ? data.education : [];
    const formattedEducation = tableEducation.map((edu: EducationRecord) => {
      const displayData = (edu.has_pending_edit && edu.verified_data)
        ? edu.verified_data
        : edu;

      return {
        id: edu.id,
        level: displayData.level || "Bachelor's",
        degree: displayData.degree || "",
        department: displayData.department || "",
        university: displayData.university || "",
        yearOfPassing: displayData.year_of_passing || "",
        cgpa: displayData.cgpa || "",
        status: displayData.status || "ongoing",
        approval_status: edu.approval_status || "pending",
        verified: edu.approval_status === "approved" || edu.approval_status === "verified",
        processing: edu.has_pending_edit || (edu.approval_status !== "approved" && edu.approval_status !== "verified"),
        enabled: displayData.enabled !== undefined ? displayData.enabled : true,
        has_pending_edit: edu.has_pending_edit || false,
        createdAt: edu.created_at,
        updatedAt: edu.updated_at,
      };
    });

    // Format trainings
    const tableTrainings = Array.isArray(data?.trainings) ? data.trainings : [];
    const approvedTrainings = tableTrainings.filter(
      (train: TrainingRecord) => train.approval_status === 'approved' ||
        train.approval_status === 'verified' ||
        train.approval_status === 'pending' ||
        train.has_pending_edit === true
    );

    // Fetch training certificates and skills
    const trainingIds = approvedTrainings.map((t: TrainingRecord) => t.id).filter(Boolean);
    let trainingCertificates: CertificateRecord[] = [];
    let trainingSkills: SkillRecord[] = [];

    if (trainingIds.length > 0) {
      const { data: certData } = await supabase
        .from('certificates')
        .select('training_id, link')
        .in('training_id', trainingIds);

      trainingCertificates = certData || [];

      const { data: skillsData } = await supabase
        .from('skills')
        .select('training_id, name, type, level, description')
        .in('training_id', trainingIds);

      trainingSkills = skillsData || [];
    }

    const formattedTrainings = approvedTrainings.map((train: TrainingRecord) => {
      // For display purposes, use verified_data if available, but for editing we need current data
      const displayData = (train.has_pending_edit && train.verified_data)
        ? train.verified_data
        : train;

      const cert = trainingCertificates.find(c => c.training_id === train.id);
      const skills = trainingSkills
        .filter(s => s.training_id === train.id)
        .map(s => ({
          name: s.name,
          type: s.type,
          level: s.level || 3,
          description: s.description || ''
        }));

      return {
        id: train.id,
        title: displayData.title || "",
        course: displayData.title || "",
        organization: displayData.organization || "",
        provider: displayData.organization || "",
        start_date: displayData.start_date,
        end_date: displayData.end_date,
        startDate: displayData.start_date,
        endDate: displayData.end_date,
        duration: displayData.duration || "",
        description: displayData.description || "",
        status: displayData.status || "ongoing",
        // Always use current data for numeric fields, not verified_data
        completedModules: train.completed_modules || 0,
        totalModules: train.total_modules || 0,
        hoursSpent: train.hours_spent || 0,
        // Also include the database field names for fallback
        completed_modules: train.completed_modules || 0,
        total_modules: train.total_modules || 0,
        hours_spent: train.hours_spent || 0,
        course_id: train.course_id || null,
        source: train.source || null,
        certificateUrl: cert?.link || "",
        skills: skills,
        approval_status: train.approval_status,
        verified: train.approval_status === 'approved' || train.approval_status === 'verified',
        processing: train.has_pending_edit || train.approval_status === 'pending',
        enabled: displayData.enabled !== undefined ? displayData.enabled : true,
        has_pending_edit: train.has_pending_edit || false,
        createdAt: train.created_at,
        updatedAt: train.updated_at,
      };
    });

    // Format certificates
    const tableCertificates = Array.isArray(data?.certificates) ? data.certificates : [];
    const formattedTableCertificates = tableCertificates.map((certificate: CertificateRecord) => {
      const displayData = (certificate.has_pending_edit && certificate.verified_data)
        ? certificate.verified_data
        : certificate;

      const issuedOnValue = displayData?.issued_on || displayData?.issuedOn || null;
      const issuedOnFormatted = issuedOnValue ? new Date(issuedOnValue).toISOString().split("T")[0] : "";
      const approvalSource = displayData?.approval_status || displayData?.status || "pending";
      const approvalStatus = typeof approvalSource === "string" ? approvalSource.toLowerCase() : "pending";
      const statusSource = displayData?.status || (displayData?.enabled === false ? "disabled" : "active");
      const statusValue = typeof statusSource === "string" ? statusSource.toLowerCase() : "active";
      const documentUrlValue = displayData?.link || null;

      return {
        id: certificate?.id,
        title: displayData?.title || "",
        issuer: displayData?.issuer || "",
        issuedOn: issuedOnFormatted,
        level: displayData?.level || "",
        description: displayData?.description || "",
        credentialId: displayData?.credential_id || "",
        link: displayData?.link || "",
        status: statusValue,
        approval_status: approvalStatus,
        verified: approvalStatus === "approved" || approvalStatus === "verified",
        processing: certificate.has_pending_edit || (approvalStatus !== "approved" && approvalStatus !== "verified"),
        enabled: statusValue !== "disabled",
        document_url: documentUrlValue,
        documentLink: documentUrlValue || "",
        has_pending_edit: certificate.has_pending_edit || false,
        createdAt: certificate?.created_at,
        updatedAt: certificate?.updated_at,
      };
    });

    // Format experience
    const tableExperience = Array.isArray(data?.experience) ? data.experience : [];
    const formattedExperience = tableExperience.map((exp: ExperienceRecord) => {
      const displayData = (exp.has_pending_edit && exp.verified_data)
        ? exp.verified_data
        : exp;

      return {
        id: exp.id,
        organization: displayData.organization || "",
        role: displayData.role || "",
        start_date: displayData.start_date,
        end_date: displayData.end_date,
        duration: displayData.duration || "",
        description: displayData.description || "",
        verified: displayData.verified || exp.approval_status === 'approved' || exp.approval_status === 'verified',
        approval_status: exp.approval_status || "pending",
        processing: exp.has_pending_edit || exp.approval_status === 'pending',
        enabled: displayData.enabled !== undefined ? displayData.enabled : true,
        has_pending_edit: exp.has_pending_edit || false,
        createdAt: exp.created_at,
        updatedAt: exp.updated_at,
      };
    });

    // Merge data
    const mergedData = {
      id: data.id,
      learner_id: data.learner_id,
      universityId: data.universityId,
      email: data.email || transformedProfile.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,

      users: data.users || null,
      userRole: data.users?.role || null,

      school_id: data.school_id,
      university_college_id: data.university_college_id,
      school: data.school || null,
      universityCollege: data.university_colleges || null,

      grade: data.grade,
      section: data.section,
      roll_number: data.roll_number,
      admission_number: data.admission_number,

      profile: transformedProfile,
      ...transformedProfile,

      name: data.name || transformedProfile.name,
      approval_status: data.approval_status,
      age: data.age || transformedProfile.age,
      date_of_birth: data.date_of_birth || transformedProfile.date_of_birth,
      contact_number: data.contact_number || transformedProfile.contact_number,
      university: data.university || transformedProfile.university,
      branch_field: data.branch_field || transformedProfile.branch_field,
      college_school_name: data.college_school_name || transformedProfile.college,
      college_id: data.college_id,
      github_link: data.github_link || transformedProfile.github_link,
      linkedin_link: data.linkedin_link || transformedProfile.linkedin_link,
      twitter_link: data.twitter_link || transformedProfile.twitter_link,
      facebook_link: data.facebook_link || transformedProfile.facebook_link,
      instagram_link: data.instagram_link || transformedProfile.instagram_link,
      portfolio_link: data.portfolio_link || transformedProfile.portfolio_link,
      youtube_link: data.youtube_link || transformedProfile.youtube_link,

      projects: Array.isArray(data.projects)
        ? data.projects
          .filter((project: ProjectRecord) =>
            project.approval_status === 'verified' ||
            project.approval_status === 'approved'
          )
          .map((project: ProjectRecord) => ({
            ...project,
            id: project.id,
            title: project.title,
            description: project.description,
            role: project.role,
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date,
            duration: project.duration,
            tech: project.tech_stack,
            tech_stack: project.tech_stack,
            link: project.demo_link,
            demo_link: project.demo_link,
            organization: project.organization,
            github: project.github_link,
            github_link: project.github_link,
            github_url: project.github_link,
            certificate_url: project.certificate_url,
            video_url: project.video_url,
            ppt_url: project.ppt_url,
            approval_status: project.approval_status,
            created_at: project.created_at,
            updated_at: project.updated_at,
            enabled: project.enabled ?? true,
            verifiedAt:
              project?.approval_status === 'approved' || project?.status === 'verified'
                ? project?.updated_at || project?.created_at
                : null
          }))
        : [],
      certificates: formattedTableCertificates,
      assessments: passport.assessments || [],
      technicalSkills: technicalSkills.length > 0 ? technicalSkills : transformedProfile.technicalSkills,
      softSkills: softSkills.length > 0 ? softSkills : transformedProfile.softSkills,
      training: formattedTrainings.length > 0 ? formattedTrainings : transformedProfile.training,
      experience: formattedExperience,
      education: formattedEducation.length > 0 ? formattedEducation : transformedProfile.education,

      passportId: passport.id,
      passportStatus: passport.status,
      aiVerification: passport.aiVerification,
      nsqfLevel: passport.nsqfLevel,
      passportSkills: passport.skills || [],

      rawData: data
    };

    return { success: true, data: mergedData, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in getlearnerByEmail', err instanceof Error ? err : new Error(String(err)), { email });
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Fetch learner data by learner ID from Supabase
 */
export const getlearnerById = async (learnerId: string): Promise<ServiceResponse> => {
  try {
    let { data, error } = await supabase
      .from('learners')
      .select(`
        *,
        users!fk_learners_user (
          role
        ),
        school:organizations!learners_school_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          university:organizations!university_colleges_university_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
          )
        ),
        skill_passports (
          id,
          projects,
          certificates,
          assessments,
          status,
          aiVerification,
          nsqfLevel,
          skills,
          createdAt,
          updatedAt
        ),
        projects (
          id,
          title,
          description,
          role,
          status,
          start_date,
          end_date,
          duration,
          organization,
          tech_stack,
          demo_link,
          github_link,
          enabled,
          approval_status,
          created_at,
          updated_at,
          certificate_url,
          video_url,
          ppt_url
        ),
        certificates (*),
        experience (*),
        skills(*),
        trainings (*),
        education (*) 
      `)
      .eq('id', learnerId)
      .maybeSingle();

    if (error) {
      logger.error('Supabase error fetching learner by ID', error);
      return { success: false, data: null, error: error.message };
    }

    if (!data) {
      return { success: false, data: null, error: 'No data found for this learner ID.' };
    }

    // Use the same data processing logic as getlearnerByEmail
    const email = data.email;
    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in getlearnerById', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
};

/**
 * Find learner record by email
 */
export async function findlearnerByEmail(email: string): Promise<ServiceResponse> {
  try {
    const { data: learnerRecord, error } = await supabase
      .from('learners')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      logger.error('Database error finding learner', error, { email });
      return { success: false, data: null, error: error.message };
    }

    if (!learnerRecord) {
      return { success: false, data: null, error: 'Learner not found' };
    }

    return { success: true, data: learnerRecord, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in findlearnerByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update learner by email
 */
export async function updatelearnerByEmail(email: string, updates: LearnerUpdateData): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      logger.error('Failed to find learner', new Error(findResult.error || 'Unknown error'));
      return findResult;
    }

    const learnerRecord = findResult.data;

    // Map updates to correct column names
    const columnUpdates: DatabaseUpdateData = {};

    const fieldMapping: Record<string, string> = {
      'name': 'name',
      'email': 'email',
      'age': 'age',
      'dateOfBirth': 'date_of_birth',
      'date_of_birth': 'date_of_birth',
      'phone': 'contact_number',
      'contactNumber': 'contact_number',
      'contact_number': 'contact_number',
      'alternatePhone': 'alternate_number',
      'alternate_number': 'alternate_number',
      'contact_number_dial_code': 'contact_dial_code',
      'contact_dial_code': 'contact_dial_code',
      'location': 'address',
      'bio': 'bio',
      'district': 'district_name',
      'district_name': 'district_name',
      'address': 'address',
      'city': 'city',
      'state': 'state',
      'country': 'country',
      'pincode': 'pincode',
      'university': 'university',
      'department': 'branch_field',
      'branch_field': 'branch_field',
      'college': 'college_school_name',
      'college_school_name': 'college_school_name',
      'registrationNumber': 'registration_number',
      'registration_number': 'registration_number',
      'guardianName': 'guardianName',
      'guardianPhone': 'guardianPhone',
      'guardianEmail': 'guardianEmail',
      'guardianRelation': 'guardianRelation',
      'gender': 'gender',
      'bloodGroup': 'bloodGroup',
      'linkedinUrl': 'linkedin_link',
      'githubUrl': 'github_link',
      'portfolioUrl': 'portfolio_link',
      'github_link': 'github_link',
      'linkedin_link': 'linkedin_link',
      'twitter_link': 'twitter_link',
      'facebook_link': 'facebook_link',
      'instagram_link': 'instagram_link',
      'portfolio_link': 'portfolio_link',
      'youtube_link': 'youtube_link',
      'resumeUrl': 'resumeUrl',
      'profilePicture': 'profilePicture',
      'grade': 'grade',
      'section': 'section',
      'roll_number': 'roll_number',
      'admission_number': 'admission_number',
      'gapInStudies': 'gap_in_studies',
      'gap_in_studies': 'gap_in_studies',
      'gapYears': 'gap_years',
      'gap_years': 'gap_years',
      'gapReason': 'gap_reason',
      'gap_reason': 'gap_reason',
      'workExperience': 'work_experience',
      'work_experience': 'work_experience',
      'aadharNumber': 'aadhar_number',
      'aadhar_number': 'aadhar_number',
      'backlogsHistory': 'backlogs_history',
      'backlogs_history': 'backlogs_history',
      'currentBacklogs': 'current_backlogs',
      'current_backlogs': 'current_backlogs'
    };

    Object.keys(updates || {}).forEach(key => {
      const columnName = fieldMapping[key] || key;

      if (key === 'profile' && typeof updates[key] === 'object' && updates[key] !== null) {
        const profileUpdates = updates[key] as DatabaseUpdateData;
        Object.keys(profileUpdates).forEach(profileKey => {
          const profileColumnName = fieldMapping[profileKey] || profileKey;
          if (profileUpdates[profileKey] !== undefined) {
            columnUpdates[profileColumnName] = profileUpdates[profileKey];
          }
        });
      } else if (updates[key] !== undefined) {
        columnUpdates[columnName] = updates[key];
      }
    });

    // Handle special JSONB fields
    if (updates.other_social_links || updates.otherSocialLinks) {
      columnUpdates.other_social_links = updates.other_social_links || updates.otherSocialLinks;
    }
    if (updates.hobbies) {
      columnUpdates.hobbies = updates.hobbies;
    }
    if (updates.languages) {
      columnUpdates.languages = updates.languages;
    }
    if (updates.interests) {
      columnUpdates.interests = updates.interests;
    }
    if (updates.metadata) {
      columnUpdates.metadata = updates.metadata;
    }
    if (updates.notification_settings || updates.notificationSettings) {
      columnUpdates.notification_settings = updates.notification_settings || updates.notificationSettings;
    }

    columnUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('learners')
      .update(columnUpdates)
      .eq('id', (learnerRecord as LearnerRecord).id)
      .select()
      .single();

    if (error) {
      logger.error('Supabase update error', error, { email });
      return { success: false, data: null, error: error.message };
    }

    const updatedResult = await getlearnerByEmail(email);

    return {
      success: true,
      data: updatedResult.success ? updatedResult.data : data,
      error: null
    };

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updatelearnerByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}
// ==================== UPDATE FUNCTIONS FOR SPECIFIC DATA TYPES ====================

/**
 * Update training by email
 */
export async function updateTrainingByEmail(email: string, trainingData: TrainingUpdateDataFull[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing training records
    const { data: existingTrainings, error: existingError } = await supabase
      .from('trainings')
      .select('*')
      .eq('learner_id', learnerId);
    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format training data for database
    const formatted = (trainingData || [])
      .filter((train: TrainingUpdateDataFull) => {
        const titleField = train.course || train.title;
        return train && typeof titleField === 'string' && titleField.trim().length > 0;
      })
      .map((train: TrainingUpdateDataFull) => {
        const titleValue = train.course || train.title || '';

        const record: TrainingCreateData = {
          id: generateUuid(),
          learner_id: learnerId,
          title: titleValue.trim(),
          organization: train.provider?.trim() || train.organization?.trim() || null,
          start_date: train.startDate || train.start_date || null,
          end_date: train.endDate || train.end_date || null,
          duration: train.duration?.trim() || null,
          description: train.description?.trim() || null,
          status: train.status || 'ongoing',
          completed_modules: parseInt(String(train.completedModules || train.completed_modules)) || 0,
          total_modules: parseInt(String(train.totalModules || train.total_modules)) || 0,
          hours_spent: parseInt(String(train.hoursSpent || train.hours_spent)) || 0,
          approval_status: 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof train.id === 'string' ? train.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
          record.approval_status = 'pending';
        }

        // Handle versioning for existing records
        const existingRecord = (existingTrainings || []).find((e: TrainingRecord) => e.id === record.id);

        if (existingRecord && existingRecord.has_pending_edit === true) {
          record.verified_data = existingRecord.verified_data;
          record.pending_edit_data = { ...record };
          record.has_pending_edit = true;
          record.approval_status = 'pending';
        } else if (existingRecord && (existingRecord.approval_status === 'verified' || existingRecord.approval_status === 'approved')) {
          const normalize = (val: unknown) => (val === null || val === undefined || val === '') ? null : val;

          const hasChanges =
            normalize(record.title) !== normalize(existingRecord.title) ||
            normalize(record.organization) !== normalize(existingRecord.organization) ||
            normalize(record.start_date) !== normalize(existingRecord.start_date) ||
            normalize(record.end_date) !== normalize(existingRecord.end_date) ||
            normalize(record.duration) !== normalize(existingRecord.duration) ||
            normalize(record.description) !== normalize(existingRecord.description) ||
            normalize(record.status) !== normalize(existingRecord.status);

          if (hasChanges) {
            const verifiedData = {
              title: existingRecord.title,
              organization: existingRecord.organization,
              start_date: existingRecord.start_date,
              end_date: existingRecord.end_date,
              duration: existingRecord.duration,
              description: existingRecord.description,
              status: existingRecord.status,
              approval_status: existingRecord.approval_status
            };

            record.verified_data = verifiedData;
            record.pending_edit_data = { ...record };
            record.has_pending_edit = true;
            record.approval_status = 'pending';
          } else {
            record.verified_data = null;
            record.pending_edit_data = null;
            record.has_pending_edit = false;
            record.approval_status = existingRecord.approval_status;
          }
        } else {
          record.verified_data = null;
          record.pending_edit_data = null;
          record.has_pending_edit = false;
          if (existingRecord) {
            record.approval_status = existingRecord.approval_status;
          } else {
            record.approval_status = 'pending';
          }
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingTrainings || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records and their related data
    if (toDelete.length > 0) {
      await supabase.from('certificates').delete().in('training_id', toDelete);
      await supabase.from('skills').delete().in('training_id', toDelete);

      const { error: deleteError } = await supabase
        .from('trainings')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting trainings', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert training records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('trainings')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting trainings', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }

      // Handle skills for each training
      for (const training of formatted) {
        const trainingId = training.id;
        const originalTrainingData = trainingData.find((t: TrainingUpdateDataFull) => t.id === trainingId);

        // Get skills from either skills array or skillsList array
        let skillsFromTraining: SkillData[] = [];
        if (originalTrainingData?.skills && Array.isArray(originalTrainingData.skills)) {
          skillsFromTraining = originalTrainingData.skills;
        } else if (originalTrainingData?.skillsList && Array.isArray(originalTrainingData.skillsList)) {
          skillsFromTraining = originalTrainingData.skillsList;
        }

        if (skillsFromTraining.length > 0) {
          // Get existing skills for this training
          const { data: existingSkills } = await supabase
            .from('skills')
            .select('id, name, type')
            .eq('training_id', trainingId) as { data: SkillRecord[] | null };

          const existingSkillsMap = new Map(
            (existingSkills || []).map((s: SkillRecord) => [`${s.name.toLowerCase().trim()}_${s.type}`, s])
          );

          // Process skills - preserve the type from the skill object
          const skillsToProcess = skillsFromTraining.map((skill: SkillData) => {
            if (typeof skill === 'object' && skill && skill.name) {
              return {
                name: skill.name.trim(),
                type: skill.type // Use the actual type from the skill object
              };
            } else if (typeof skill === 'string') {
              return {
                name: skill.trim(),
                type: 'technical' as const
              };
            }
            return null;
          }).filter(skill => skill !== null && skill.name);

          // Find skills to add
          const skillsToAdd = skillsToProcess.filter(skill => {
            if (!skill) return false;
            const key = `${skill.name.toLowerCase()}_${skill.type}`;
            return !existingSkillsMap.has(key);
          });

          // Find skills to remove
          const currentSkillKeys = new Set(
            skillsToProcess.filter(skill => skill !== null).map(skill => `${skill!.name.toLowerCase()}_${skill!.type}`)
          );
          const skillIdsToDelete = (existingSkills || [])
            .filter(s => !currentSkillKeys.has(`${s.name.toLowerCase().trim()}_${s.type}`))
            .map(s => s.id);

          // Delete removed skills
          if (skillIdsToDelete.length > 0) {
            await supabase
              .from('skills')
              .delete()
              .in('id', skillIdsToDelete);
          }

          // Add new skills
          if (skillsToAdd.length > 0) {
            const skillRecords = skillsToAdd.filter(skill => skill !== null).map((skill) => ({
              id: generateUuid(),
              learner_id: learnerId,
              training_id: trainingId,
              name: skill!.name,
              type: skill!.type,
              level: 3,
              created_at: nowIso,
              updated_at: nowIso,
            }));

            const { error: skillsInsertError } = await supabase
              .from('skills')
              .insert(skillRecords);

            if (skillsInsertError) {
              logger.error('Error inserting skills', skillsInsertError);
            }
          }
        } else {
          // No skills, delete any existing skills for this training
          await supabase
            .from('skills')
            .delete()
            .eq('training_id', trainingId);
        }
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateTrainingByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update technical skills by email
 */
export async function updateTechnicalSkillsByEmail(email: string, skillsData: SkillUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing technical skills only
    const { data: existingSkills, error: existingError } = await supabase
      .from('skills')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('type', 'technical');

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format technical skills data
    const formatted = (skillsData || [])
      .filter((skill: SkillUpdateData) => skill && skill.name && typeof skill.name === 'string' && skill.name.trim().length > 0)
      .map((skill: SkillUpdateData) => {
        const record: SkillCreateData = {
          learner_id: learnerId,
          name: skill.name!.trim(),
          type: 'technical',
          level: Number(skill.level || skill.rating || 3),
          proficiency_level: skill.proficiency_level || 'Intermediate',
          description: skill.description?.trim() || '',
          verified: skill.verified || false,
          enabled: skill.enabled !== undefined ? skill.enabled : true,
          approval_status: skill.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID (technical skills)
        const rawId = typeof skill.id === 'string' ? skill.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which technical skills to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingSkills || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed technical skills
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting technical skills', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert technical skills records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('skills')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting technical skills', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateTechnicalSkillsByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update soft skills by email
 */
export async function updateSoftSkillsByEmail(email: string, skillsData: SkillUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing soft skills only
    const { data: existingSkills, error: existingError } = await supabase
      .from('skills')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('type', 'soft');

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format soft skills data
    const formatted = (skillsData || [])
      .filter((skill: SkillUpdateData) => skill && skill.name && typeof skill.name === 'string' && skill.name.trim().length > 0)
      .map((skill: SkillUpdateData) => {
        const record: SkillCreateData = {
          learner_id: learnerId,
          name: skill.name!.trim(),
          type: 'soft',
          level: Number(skill.level || skill.rating || 3),
          proficiency_level: skill.proficiency_level || 'Intermediate',
          description: skill.description?.trim() || '',
          verified: skill.verified || false,
          enabled: skill.enabled !== undefined ? skill.enabled : true,
          approval_status: skill.approval_status || 'pending',
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID (soft skills)
        const rawId = typeof skill.id === 'string' ? skill.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which soft skills to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingSkills || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed soft skills
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting soft skills', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert soft skills records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('skills')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting soft skills', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateSoftSkillsByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update experience by email
 */
export async function updateExperienceByEmail(email: string, experienceData: ExperienceUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing experience records
    const { data: existingExperience, error: existingError } = await supabase
      .from('experience')
      .select('*')
      .eq('learner_id', learnerId);

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format experience data
    const formatted = (experienceData || [])
      .filter((exp: ExperienceUpdateData) => exp && exp.organization && typeof exp.organization === 'string' && exp.organization.trim().length > 0)
      .map((exp: ExperienceUpdateData) => {
        const record: ExperienceCreateData = {
          learner_id: learnerId,
          organization: exp.organization?.trim() || '',
          role: exp.role?.trim() || '',
          start_date: exp.start_date || null,
          end_date: exp.end_date || null,
          duration: exp.duration?.trim() || '',
          description: exp.description?.trim() || '',
          verified: exp.verified || false,
          approval_status: exp.approval_status || 'pending',
          enabled: exp.enabled !== undefined ? exp.enabled : true,
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof exp.id === 'string' ? exp.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingExperience || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('experience')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting experience', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert experience records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('experience')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting experience', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateExperienceByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update education by email
 */
export async function updateEducationByEmail(email: string, educationData: EducationUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing education records
    const { data: existingEducation, error: existingError } = await supabase
      .from('education')
      .select('*')
      .eq('learner_id', learnerId);

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format education data
    const formatted = (educationData || [])
      .filter((edu: EducationUpdateData) => {
        const degreeField = edu.degree || edu.qualification;
        return edu && typeof degreeField === 'string' && (degreeField as string).trim().length > 0;
      })
      .map((edu: EducationUpdateData) => {
        const record: EducationCreateData = {
          learner_id: learnerId,
          level: edu.level?.trim() || "Bachelor's",
          degree: (edu.degree || edu.qualification)?.trim() || "",
          department: edu.department?.trim() || "",
          university: edu.university?.trim() || "",
          year_of_passing: (edu.yearOfPassing || edu.year_of_passing)?.toString().trim() || "",
          cgpa: edu.cgpa?.toString().trim() || "",
          status: edu.status?.trim() || "ongoing",
          approval_status: edu.approval_status || 'pending',
          enabled: typeof edu.enabled === 'boolean' ? edu.enabled : true,
          has_pending_edit: false,
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof edu.id === 'string' ? edu.id.trim() : null;
        if (rawId && rawId.length === 36 && rawId.includes('-')) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingEducation || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('education')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting education', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert education records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('education')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting education', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateEducationByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update certificates by email
 */
export async function updateCertificatesByEmail(email: string, certificatesData: CertificateUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing certificates
    const { data: existingCertificates, error: existingError } = await supabase
      .from('certificates')
      .select('*')
      .eq('learner_id', learnerId);

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format certificates data
    const formatted = (certificatesData || [])
      .filter((cert: CertificateUpdateData) => cert && cert.title && typeof cert.title === 'string' && cert.title.trim().length > 0)
      .map((cert: CertificateUpdateData) => {
        const record: CertificateCreateData = {
          learner_id: learnerId,
          title: cert.title?.trim() || '',
          issuer: cert.issuer?.trim() || '',
          issued_on: cert.issuedOn || cert.issued_on || null,
          expiry_date: cert.expiryDate || cert.expiry_date || null,
          level: cert.level?.trim() || '',
          description: cert.description?.trim() || '',
          credential_id: (cert.credentialId || cert.credential_id)?.trim() || '',
          link: (cert.link || cert.documentLink)?.trim() || '',
          category: cert.category?.trim() || '',
          platform: cert.platform?.trim() || '',
          instructor: cert.instructor?.trim() || '',
          status: cert.status || 'active',
          approval_status: cert.approval_status || 'pending',
          enabled: cert.enabled !== undefined ? cert.enabled : true,
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof cert.id === 'string' ? cert.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingCertificates || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('certificates')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting certificates', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert certificates records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('certificates')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting certificates', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateCertificatesByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update skills by email - handles both technical and soft skills
 */
export async function updateSkillsByEmail(email: string, skillsData: SkillUpdateData[] = []): Promise<ServiceResponse> {
  try {
    // Separate skills by type
    const technicalSkills = skillsData.filter(skill => skill.type === 'technical');
    const softSkills = skillsData.filter(skill => skill.type === 'soft');

    // Update technical skills if any
    if (technicalSkills.length > 0) {
      const techResult = await updateTechnicalSkillsByEmail(email, technicalSkills);
      if (!techResult.success) {
        return techResult;
      }
    }

    // Update soft skills if any
    if (softSkills.length > 0) {
      const softResult = await updateSoftSkillsByEmail(email, softSkills);
      if (!softResult.success) {
        return softResult;
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateSkillsByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update projects by email
 */
export async function updateProjectsByEmail(email: string, projectsData: ProjectUpdateData[] = []): Promise<ServiceResponse> {
  try {
    const findResult = await findlearnerByEmail(email);
    if (!findResult.success) {
      return findResult;
    }

    const learnerRecord = findResult.data as LearnerRecord;
    const learnerId = learnerRecord.id;

    // Get existing projects
    const { data: existingProjects, error: existingError } = await supabase
      .from('projects')
      .select('*')
      .eq('learner_id', learnerId);

    if (existingError) {
      return { success: false, data: null, error: existingError.message };
    }

    const nowIso = new Date().toISOString();

    // Format projects data
    const formatted = (projectsData || [])
      .filter((project: ProjectUpdateData) => project && project.title && typeof project.title === 'string' && project.title.trim().length > 0)
      .map((project: ProjectUpdateData) => {
        const record: ProjectCreateData = {
          learner_id: learnerId,
          title: project.title?.trim() || '',
          description: project.description?.trim() || '',
          role: project.role?.trim() || '',
          status: project.status || 'ongoing',
          start_date: project.start_date || project.startDate || null,
          end_date: project.end_date || project.endDate || null,
          duration: project.duration?.trim() || '',
          organization: project.organization?.trim() || '',
          tech_stack: project.tech_stack || project.tech || project.technologies || [],
          demo_link: project.demo_link || project.link || project.demoUrl || '',
          github_link: project.github_link || project.github || project.githubUrl || '',
          certificate_url: project.certificate_url || '',
          video_url: project.video_url || '',
          ppt_url: project.ppt_url || '',
          approval_status: project.approval_status || 'pending',
          enabled: project.enabled !== undefined ? project.enabled : true,
          updated_at: nowIso,
        };

        // Preserve existing ID if valid UUID
        const rawId = typeof project.id === 'string' ? project.id.trim() : null;
        if (rawId && rawId.length === 36) {
          record.id = rawId;
        } else {
          record.id = generateUuid();
        }

        return record;
      });

    // Determine which records to delete
    const incomingIds = new Set(formatted.map((record) => record.id));
    const toDelete = (existingProjects || [])
      .filter((existing) => !incomingIds.has(existing.id))
      .map((existing) => existing.id);

    // Delete removed records
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        logger.error('Error deleting projects', deleteError);
        return { success: false, data: null, error: deleteError.message };
      }
    }

    // Upsert projects records
    if (formatted.length > 0) {
      const { error: upsertError } = await supabase
        .from('projects')
        .upsert(formatted, { onConflict: 'id' });

      if (upsertError) {
        logger.error('Error upserting projects', upsertError);
        return { success: false, data: null, error: upsertError.message };
      }
    }

    return await getlearnerByEmail(email);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Exception in updateProjectsByEmail', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Update a single training record by ID
 */
export async function updateSingleTrainingById(trainingId: string, updateData: TrainingUpdateDataFull): Promise<ServiceResponse> {
  try {
    const nowIso = new Date().toISOString();
    const updateRecord = {
      title: updateData.course?.trim() || updateData.title?.trim(),
      organization: updateData.provider?.trim() || updateData.organization?.trim() || null,
      start_date: updateData.startDate || updateData.start_date || null,
      end_date: updateData.endDate || updateData.end_date || null,
      duration: updateData.duration?.trim() || null,
      description: updateData.description?.trim() || null,
      status: updateData.status || 'ongoing',
      completed_modules: parseInt(String(updateData.completedModules || updateData.completed_modules)) || 0,
      total_modules: parseInt(String(updateData.totalModules || updateData.total_modules)) || 0,
      hours_spent: parseInt(String(updateData.hoursSpent || updateData.hours_spent)) || 0,
      updated_at: nowIso,
    };

    const { data: updatedTraining, error: updateError } = await supabase
      .from('trainings')
      .update(updateRecord)
      .eq('id', trainingId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating training', updateError);
      return { success: false, data: null, error: updateError.message };
    }

    // Handle skills update if provided
    const skills = updateData.skills;
    if (Array.isArray(skills)) {
      const learnerId = updatedTraining.learner_id;

      // Get existing skills for this training
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('id, name, type, level, description')
        .eq('training_id', trainingId);

      // Normalize skills to objects with full data
      const normalizedSkills = skills.map((skill: SkillData | SkillInput | string): NormalizedSkill | null => {
        if (typeof skill === 'object' && skill && skill.name) {
          // Handle SkillData type with string level
          const level = typeof skill.level === 'string' ?
            ({ 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 }[skill.level] || 3) :
            (skill.level || 3);

          return {
            name: skill.name.trim(),
            type: skill.type || 'technical',
            level: level,
            description: skill.description || ''
          };
        } else if (typeof skill === 'string') {
          return {
            name: skill.trim(),
            type: 'technical',
            level: 3,
            description: ''
          };
        }
        return null;
      }).filter((skill): skill is NormalizedSkill => skill !== null && !!skill.name);

      // Create a map of existing skills by name+type for comparison
      const existingSkillsMap = new Map(
        (existingSkills || []).map(s => [
          `${s.name.toLowerCase().trim()}_${s.type}`,
          s
        ])
      );

      // Find skills to add or update
      const skillsToUpsert = [];
      const processedKeys = new Set();

      for (const skill of normalizedSkills) {
        const key = `${skill.name.toLowerCase()}_${skill.type}`;
        processedKeys.add(key);

        const existing = existingSkillsMap.get(key);

        if (existing) {
          // Check if we need to update
          if (existing.level !== skill.level || existing.description !== skill.description) {
            await supabase
              .from('skills')
              .update({
                level: skill.level,
                description: skill.description,
                updated_at: nowIso
              })
              .eq('id', existing.id);
          }
        } else {
          // New skill to add
          skillsToUpsert.push({
            id: generateUuid(),
            learner_id: learnerId,
            training_id: trainingId,
            name: skill.name,
            type: skill.type,
            level: skill.level,
            description: skill.description,
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
      }

      // Find skills to remove
      const skillIdsToDelete = (existingSkills || [])
        .filter(s => !processedKeys.has(`${s.name.toLowerCase().trim()}_${s.type}`))
        .map(s => s.id);

      // Delete removed skills
      if (skillIdsToDelete.length > 0) {
        await supabase
          .from('skills')
          .delete()
          .in('id', skillIdsToDelete);
      }

      // Insert new skills
      if (skillsToUpsert.length > 0) {
        await supabase
          .from('skills')
          .insert(skillsToUpsert);
      }
    }

    return { success: true, data: updatedTraining, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    logger.error('Error updating single training', err instanceof Error ? err : new Error(String(err)));
    return { success: false, data: null, error: errorMessage };
  }
}

/**
 * Get learner by user ID
 * Uses authenticated API via ssoClient - secure, with token validation
 */
export const getLearnerByUserId = async (userId: string): Promise<ServiceResponse<Learner>> => {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    logger.warn('Invalid user ID provided to getLearnerByUserId', { userId });
    return { success: false, data: null, error: 'Invalid user ID format' };
  }

  try {
    const response = await apiGet<LearnerApiResponse>(`/learners?id=${encodeURIComponent(userId)}`);
    const learnerData: Learner | undefined = response?.learner || (response as Learner);

    if (!learnerData || !learnerData.id) {
      logger.warn('No learner data in response', { userId });
      return { success: false, data: null, error: 'No learner data found' };
    }

    logger.info('Learner fetched successfully by user ID', { userId });
    return { success: true, data: learnerData, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching learner by user ID', error instanceof Error ? error : new Error(String(error)));
    return { success: false, data: null, error: errorMessage };
  }
};
