import { useEffect, useMemo, useState } from 'react'
import { apiPost } from '@/shared/api/apiClient'
import { useAuthStore } from '@/shared/model/authStore'

// Raw DB row type (minimal)
interface LearnerRow {
  id: string
  universityId?: string
  profile?: any
  createdAt?: string
  updatedAt?: string
  skill_passports?: {
    projects?: any[]
    certificates?: any[]
    assessments?: any[]
  } | null
  email?: string
  name?: string
  age?: number
  date_of_birth?: string
  contact_number?: string
  alternate_number?: string
  district_name?: string
  university?: string
  branch_field?: string
  college_school_name?: string
  registration_number?: string
  course_name?: string
  bio?: string
  university_main?: string
  imported_at?: string
  contact_dial_code?: string
  // School-specific fields
  school_id?: string
  grade?: string
  section?: string
  roll_number?: string
  admission_number?: string
  category?: string
  quota?: string
  bloodGroup?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  approval_status?: string
  learner_type?: string
  learner_id?: string
  // Additional fields
  currentCgpa?: string | number
  college_id?: string
  admission_academic_year?: string
  // Joined tables
  skills?: any[]
  projects?: any[]
  certificates?: any[]
  education?: any[]
  experience?: any[]
  trainings?: any[]
}

export interface LearnerProfile {
  name?: string
  email?: string
  registration_number?: number | string
  contact_number_dial_code?: number | string
  contact_number?: number | string
  alternate_number?: number | string
  date_of_birth?: string
  branch_field?: string
  nm_id?: string
  trainer_name?: string
  university?: string
  district_name?: string
  college_school_name?: string
  age?: number
  course?: string
  skill?: string
  imported_at?: string
  education?: any[]
  technicalSkills?: any[]
  softSkills?: any[]
}

export interface UICandidate {
  id: string
  name: string
  email?: string
  phone?: string
  location?: string
  college?: string
  dept?: string
  class?: string
  subjects?: string[]
  skills: string[] | any[]
  badges: string[]
  ai_score_overall: number
  score?: number
  admission_status?: string
  applied_date?: string
  last_updated?: string
  contact_number?: string
  date_of_birth?: string
  profile?: any
  projects?: any[]
  certificates?: any[]
  education?: any[]
  experience?: any[]
  trainings?: any[]
  interests?: string[]
  assessments?: any[]
  universityId?: string
  // School-specific fields
  school_id?: string
  grade?: string
  section?: string
  roll_number?: string
  admission_number?: string
  category?: string
  quota?: string
  bloodGroup?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  approval_status?: string
  learner_type?: string
  learner_id?: string
  college_school_name?: string
  age?: number
  gender?: string
  district_name?: string
  university?: string
  contactNumber?: string
  // Additional fields for profile display
  currentCgpa?: string | number
  course_name?: string
  branch_field?: string
  enrollment_status?: string
  // Promotion-related fields
  semester?: number
  college_id?: string
  admission_academic_year?: string
}

function safeParseProfile(input: unknown): LearnerProfile | null {
  if (!input) return null
  try {
    // If it's already an object, return it
    if (typeof input === 'object') return input as LearnerProfile
    let text = String(input)
    // Handle double-encoded JSON strings like: "{\"name\":...}"
    // Remove wrapping quotes if present
    if (text.startsWith('"') && text.endsWith('"')) {
      try {
        text = JSON.parse(text)
      } catch {
        // fallthrough; will try to parse as-is below
      }
    }
    const firstParse = JSON.parse(text)
    // Sometimes it's actually a quoted JSON string inside
    if (typeof firstParse === 'string') {
      return JSON.parse(firstParse) as LearnerProfile
    }
    return firstParse as LearnerProfile
  } catch {
    return null
  }
}

function mapToUICandidate(row: LearnerRow): UICandidate {
  const profile = safeParseProfile(row.profile) || {}
  const passport = row.skill_passports || {}

  // Use direct fields first, then fallback to profile
  const name = row.name || profile.name || 'Unknown'
  const email = row.email || profile.email
  const rawDial = row.contact_dial_code || profile.contact_number_dial_code ? String(row.contact_dial_code || profile.contact_number_dial_code).replace(/\.0$/, '') : ''
  // Remove any existing + from dial code to avoid double ++
  const dial = rawDial.replace(/^\+/, '')
  const phoneNum = row.contact_number || profile.contact_number ? String(row.contact_number || profile.contact_number).replace(/\.0$/, '') : ''
  const altNum = row.alternate_number || profile.alternate_number ? String(row.alternate_number || profile.alternate_number).replace(/\.0$/, '') : ''
  const phone = phoneNum || altNum ? `${dial ? '+' + dial + ' ' : ''}${phoneNum || altNum}` : undefined

  // Use direct fields for college and department
  const college = row.college_school_name || row.university || profile.college_school_name || profile.university
  const dept = row.branch_field || row.course_name || profile.branch_field || profile.course
  const location = row.district_name || profile.district_name

  // Class is grade-section for school learners, or course name for university learners
  const classValue = row.grade && row.section 
    ? `${row.grade}-${row.section}` 
    : row.course_name || row.branch_field || profile.course || profile.branch_field || 'N/A'

  // Subjects from skills or branch field
  const skillsText = profile.skill || row.branch_field || row.course_name || ''
  const subjects = skillsText
    .split(/[,;|&]/)
    .map(s => s.trim())
    .filter(Boolean)

  // Extract skills from the joined skills table
  const rawSkills = Array.isArray(row.skills) ? row.skills : []
  const skills = rawSkills.length > 0 
    ? rawSkills.map(s => s.name || s.title || s).filter(Boolean)
    : subjects // Fallback to subjects if no skills table data

  const rawProjects = Array.isArray(row.projects) ? row.projects : []
  const rawCertificates = Array.isArray(row.certificates) ? row.certificates : []
  const rawEducation = Array.isArray(row.education) ? row.education : []
  const rawExperience = Array.isArray(row.experience) ? row.experience : []
  const rawTrainings = Array.isArray(row.trainings) ? row.trainings : []
  const rawAssessments = Array.isArray(passport.assessments) ? passport.assessments : []

  const projects = rawProjects
    .filter(project => project?.approval_status === 'approved' || project?.enabled === true || !project?.approval_status)
    .map(project => ({
      ...project,
      verifiedAt: project?.updated_at || project?.created_at
    }))

  const certificates = rawCertificates
    .filter(certificate => certificate?.approval_status === 'approved' || certificate?.enabled === true || !certificate?.approval_status)
    .map(certificate => ({
      ...certificate,
      verifiedAt: certificate?.updated_at || certificate?.created_at
    }))

  const education = rawEducation
    .filter(edu => edu?.approval_status === 'approved' || !edu?.approval_status)
    .map(edu => ({
      ...edu,
      verifiedAt: edu?.updated_at || edu?.created_at
    }))

  const experience = rawExperience
    .filter(exp => exp?.approval_status === 'approved' || !exp?.approval_status)
    .map(exp => ({
      ...exp,
      verifiedAt: exp?.updated_at || exp?.created_at
    }))

  const trainings = rawTrainings
    .filter(training => training?.approval_status === 'approved' || !training?.approval_status)
    .map(training => ({
      ...training,
      verifiedAt: training?.updated_at || training?.created_at
    }))

  const assessments = rawAssessments

  // Use actual database fields instead of mock data
  const score = 0 // No score for school learners
  const admission_status = (row as any).approval_status || 'approved' // Use actual approval_status from DB

  return {
    id: row.id,
    name,
    email,
    phone,
    contact_number: row.contact_number,
    contactNumber: row.contact_number,
    college,
    dept,
    class: classValue,
    location,
    subjects,
    badges: ['institution_verified'],
    ai_score_overall: 0,
    score,
    admission_status,
    applied_date: row.imported_at || row.createdAt,
    last_updated: row.updatedAt || profile.imported_at || row.createdAt,
    date_of_birth: row.date_of_birth || profile.date_of_birth,
    profile: {
      ...profile,
      name: row.name || profile.name,
      email: row.email || profile.email,
      contact_number: row.contact_number || profile.contact_number,
      university: college,
      // Only include education for university learners (those with education data)
      education: education.length > 0 ? education : profile.education || [],
      technicalSkills: rawSkills.filter(skill => skill.type === 'technical'),
      softSkills: rawSkills.filter(skill => skill.type === 'soft'),
    },
    // Include all related table data at the top level for career path generation
    skills: rawSkills.length > 0 ? rawSkills : skills, // Use raw skills from table, fallback to derived skills
    projects,
    certificates,
    education,
    experience,
    trainings,
    assessments,
    universityId: row.universityId,
    // Pass through all school-specific fields
    school_id: row.school_id,
    grade: row.grade,
    section: row.section,
    roll_number: row.roll_number,
    admission_number: row.admission_number,
    category: row.category,
    quota: row.quota,
    bloodGroup: row.bloodGroup,
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail,
    guardianRelation: row.guardianRelation,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    pincode: row.pincode,
    approval_status: (row as any).approval_status,
    learner_type: row.learner_type,
    learner_id: row.learner_id,
    college_school_name: row.college_school_name,
    age: row.age,
    gender: (row as any).gender,
    district_name: row.district_name,
    university: row.university,
    // Additional fields for profile display
    currentCgpa: (row as any).currentCgpa,
    course_name: row.course_name,
    branch_field: row.branch_field,
    enrollment_status: (row as any).approval_status || 'approved',
    // Add semester field for promotion functionality
    semester: (row as any).semester,
    college_id: (row as any).college_id,
    admission_academic_year: (row as any).admission_academic_year,
  }
}

interface UseLearnersOptions {
  searchTerm?: string
  page?: number
  pageSize?: number
}

export function useAdminLearners(options: UseLearnersOptions = {}) {
  const { searchTerm = '', page = 1, pageSize = 500 } = options
  const [data, setData] = useState<UICandidate[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)

  useEffect(() => {
    let isMounted = true
    const fetchlearners = async () => {
      setLoading(true)
      setError(null)
      try {
        let schoolId: string | null = null;
        let collegeId: string | null = null;
        let userRole: string | null = null;
        let userId: string | null = null;
        let universityId: string | null = null;

        const storedUser = (useAuthStore.getState().user ? JSON.stringify(useAuthStore.getState().user) : localStorage.getItem("user"));
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            userRole = userData.role;
            if (userData.role === 'school_admin' && userData.schoolId) {
              schoolId = userData.schoolId;
            } else if (userData.role === 'college_admin' && userData.collegeId) {
              collegeId = userData.collegeId;
            } else if (userData.role === 'university_admin' && (userData.universityId || userData.organizationId)) {
              universityId = userData.universityId || userData.organizationId;
            }
          } catch (e) {
            // Silently fail
          }
        }

        if (!schoolId && !collegeId) {
          const user = useAuthStore.getState().user;
          if (user) {
            userId = user.id;
            const userRes = await apiPost('/learner-profile/actions', { action: 'fetch-user-by-id', userId });

            if (userRes?.data) {
              userRole = userRes.data.role || null;

              if (userRole === 'college_admin') {
                const orgRes = await apiPost('/learner-profile/actions', {
                  action: 'fetch-org-by-admin', userId: user.id, email: user.email, orgType: 'college',
                });
                if (orgRes?.data?.id) collegeId = orgRes.data.id;
              } else {
                const educatorRes = await apiPost('/learner-profile/actions', {
                  action: 'fetch-school-educator-by-user', userId: user.id,
                });
                if (educatorRes?.data?.school_id) {
                  schoolId = educatorRes.data.school_id;
                } else {
                  const orgRes = await apiPost('/learner-profile/actions', {
                    action: 'fetch-org-by-admin', userId: user.id, email: user.email, orgType: 'school',
                  });
                  if (orgRes?.data?.id) schoolId = orgRes.data.id;
                }
              }
            }
          }
        }

        if (userRole === 'university_admin' && !universityId && userId) {
          const userRes = await apiPost('/learner-profile/actions', { action: 'fetch-user-by-id', userId });
          if (userRes?.data?.organizationId) {
            universityId = userRes.data.organizationId;
          }
        }

        let collegeIds: string[] = [];
        if (universityId) {
          const orgsRes = await apiPost('/learner-profile/actions', { action: 'fetch-orgs-by-type', orgType: 'college' });
          if (orgsRes?.data?.length) {
            collegeIds = orgsRes.data.map((c: any) => c.id);
          }
        }

        const countRes = await apiPost('/learner-profile/actions', {
          action: 'fetch-learner-count',
          schoolId, collegeId, universityId, searchTerm,
        });
        if (countRes?.data?.count !== undefined) {
          setTotalCount(countRes.data.count);
        }

        let result;
        try {
          result = await apiPost('/learner-profile/actions', {
            action: 'fetch-learners-admin',
            schoolId, collegeId, universityId, searchTerm, page, pageSize, useSimple: false,
          });
        } catch {
          result = await apiPost('/learner-profile/actions', {
            action: 'fetch-learners-admin',
            schoolId, collegeId, universityId, searchTerm, page, pageSize, useSimple: true,
          });
        }
        
        if (!isMounted) return;
        
        // Log sample data to verify related tables are loaded
        if (result.data && result.data.length > 0) {
          const sample = result.data[0] as LearnerRow;
          // Silently verify data structure - no logging needed
        }
        
        const mapped = (result.data as LearnerRow[]).map(mapToUICandidate);
        setData(mapped);
      } catch (e: any) {
        if (!isMounted) return;
        
        let errorMessage = 'Failed to load learners';
        if (e?.message?.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to database. Please check your internet connection.';
        } else if (e?.message) {
          errorMessage = `Database error: ${e.message}`;
        }
        
        setError(errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchlearners()
    return () => {
      isMounted = false
    }
  }, [searchTerm, page, pageSize])

  const stats = useMemo(() => ({ 
    count: data.length,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  }), [data.length, totalCount, pageSize])

  return { learners: data, loading, error, stats, totalCount }
}

// Export alias for backward compatibility
export { useAdminLearners as useLearners };
