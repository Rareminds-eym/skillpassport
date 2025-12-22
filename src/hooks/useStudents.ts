import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Skill from skills table
interface Skill {
  id: string
  student_id: string
  name: string
  type?: string
  level?: number
  description?: string
  verified?: boolean
  enabled?: boolean
  approval_status?: string
  created_at?: string
  updated_at?: string
}

// Project from projects table
interface Project {
  id: string
  student_id: string
  title: string
  description?: string
  status?: string
  start_date?: string
  end_date?: string
  duration?: string
  tech_stack?: string[]
  demo_link?: string
  github_link?: string
  approval_status?: string
  certificate_url?: string
  video_url?: string
  ppt_url?: string
  organization?: string
  enabled?: boolean
  created_at?: string
  updated_at?: string
}

// Certificate from certificates table
interface Certificate {
  id: string
  student_id: string
  title: string
  issuer?: string
  level?: string
  credential_id?: string
  link?: string
  issued_on?: string
  description?: string
  status?: string
  approval_status?: string
  document_url?: string
  enabled?: boolean
  created_at?: string
  updated_at?: string
}

// Experience from experience table
interface Experience {
  id: string
  student_id: string
  organization?: string
  role?: string
  start_date?: string
  end_date?: string
  duration?: string
  verified?: boolean
  approval_status?: string
  created_at?: string
  updated_at?: string
}

// Training from trainings table
interface Training {
  id: string
  student_id: string
  title: string
  organization?: string
  start_date?: string
  end_date?: string
  duration?: string
  description?: string
  approval_status?: string
  created_at?: string
  updated_at?: string
}

// Raw DB row type (based on actual students table schema)
interface StudentRow {
  id: string
  user_id?: string
  student_id?: string // new system-generated student identifier (replaces legacy nm_id column)
  name?: string
  email?: string
  contact_number?: string
  alternate_number?: string
  contact_dial_code?: string
  date_of_birth?: string
  age?: number
  gender?: string
  bloodGroup?: string
  district_name?: string
  university?: string
  university_main?: string
  branch_field?: string
  college_school_name?: string
  course_name?: string
  registration_number?: string
  enrollmentNumber?: string
  enrollment_number?: string
  github_link?: string
  linkedin_link?: string
  twitter_link?: string
  facebook_link?: string
  instagram_link?: string
  portfolio_link?: string
  youtube_link?: string
  other_social_links?: Record<string, unknown>
  approval_status?: string
  trainer_name?: string
  bio?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  resume_url?: string
  resumeUrl?: string
  profile_picture?: string
  profilePicture?: string
  contactNumber?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  imported_at?: string
  school_id?: string
  college_id?: string
  schools?: {
    id: string
    name: string
    code: string
    city?: string
    state?: string
    country?: string
  } | {
    id: string
    name: string
    code: string
    city?: string
    state?: string
    country?: string
  }[]
  colleges?: {
    id: string
    name: string
    code?: string
    city?: string
    state?: string
    country?: string
  } | {
    id: string
    name: string
    code?: string
    city?: string
    state?: string
    country?: string
  }[]
  grade?: string
  section?: string
  roll_number?: string
  admission_number?: string
  currentCgpa?: number
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
  enrollmentDate?: string
  expectedGraduationDate?: string
  student_type?: string
  hobbies?: string[]
  languages?: string[]
  interests?: string[]
  category?: string
  quota?: string
  metadata?: Record<string, unknown>
  notification_settings?: Record<string, unknown>
  // Related data from joins
  skills?: Skill[]
  projects?: Project[]
  certificates?: Certificate[]
  experience?: Experience[]
  trainings?: Training[]
}

export interface UICandidate {
  id: string
  user_id?: string
  name: string
  email?: string
  phone?: string
  location?: string
  college?: string
  dept?: string
  university?: string
  registration_number?: string
  skills: Skill[]
  projects: Project[]
  certificates: Certificate[]
  experience: Experience[]
  trainings: Training[]
  badges: string[]
  ai_score_overall: number
  last_updated?: string
  // Social links
  github_link?: string
  linkedin_link?: string
  twitter_link?: string
  facebook_link?: string
  instagram_link?: string
  portfolio_link?: string
  youtube_link?: string
  other_social_links?: Record<string, unknown>
  // Personal details
  age?: number
  gender?: string
  bloodGroup?: string
  date_of_birth?: string
  bio?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
  // Academic details
  grade?: string
  section?: string
  roll_number?: string
  admission_number?: string
  currentCgpa?: number
  enrollmentDate?: string
  expectedGraduationDate?: string
  student_type?: string
  // Guardian details
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelation?: string
  // Additional fields
  nm_id?: string
  trainer_name?: string
  district_name?: string
  branch_field?: string
  course_name?: string
  contact_number?: string
  alternate_number?: string
  contact_dial_code?: string
  imported_at?: string
  updated_at?: string
  school_id?: string
  college_id?: string
  college_school_name?: string // Original field
  school_name?: string // Proper school name from join
  approval_status?: string // Add this field
  hobbies?: string[]
  languages?: string[]
  interests?: string[]
  category?: string
  quota?: string
  metadata?: Record<string, unknown>
  notification_settings?: Record<string, unknown>
  resumeUrl?: string
  profilePicture?: string
}

function mapToUICandidate(row: StudentRow): UICandidate {
  // Format phone number - handle both camelCase and snake_case
  const dial = row.contact_dial_code ? String(row.contact_dial_code).replace(/\.0$/, '') : ''
  const phoneNum = (row.contactNumber || row.contact_number) ? String(row.contactNumber || row.contact_number).replace(/\.0$/, '') : ''
  const altNum = row.alternate_number ? String(row.alternate_number).replace(/\.0$/, '') : ''
  const phone = phoneNum || altNum ? `${dial ? '+' + dial + ' ' : ''}${phoneNum || altNum}` : undefined

  // Get school name from joined data or fallback to college_school_name
  const schoolData = Array.isArray(row.schools) ? row.schools[0] : row.schools
  const collegeData = Array.isArray(row.colleges) ? row.colleges[0] : row.colleges
  const schoolName = schoolData?.name || row.college_school_name
  const collegeName = collegeData?.name || row.college_school_name || row.university

  const dept = row.branch_field || row.course_name
  const location = row.district_name || row.city

  // Use skills from the skills table (already fetched via join)
  const skills = Array.isArray(row.skills) ? row.skills.filter(s => s.enabled !== false) : []
  
  // Use projects from the projects table
  const projects = Array.isArray(row.projects) ? row.projects.filter(p => p.enabled !== false) : []
  
  // Use certificates from the certificates table
  const certificates = Array.isArray(row.certificates) ? row.certificates.filter(c => c.enabled !== false) : []
  
  // Use experience from the experience table
  const experience = Array.isArray(row.experience) ? row.experience : []
  
  // Use trainings from the trainings table
  const trainings = Array.isArray(row.trainings) ? row.trainings : []

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || 'Unknown',
    email: row.email,
    phone,
    college: collegeName,
    dept,
    university: row.university_main || row.university,
    location,
    registration_number: row.registration_number || row.enrollmentNumber || row.enrollment_number,
    skills,
    projects,
    certificates,
    experience,
    trainings,
    badges: ['institution_verified'],
    ai_score_overall: 0,
    last_updated: row.updatedAt || row.updated_at || row.imported_at || row.createdAt || row.created_at,
    // Social links
    github_link: row.github_link,
    linkedin_link: row.linkedin_link,
    twitter_link: row.twitter_link,
    facebook_link: row.facebook_link,
    instagram_link: row.instagram_link,
    portfolio_link: row.portfolio_link,
    youtube_link: row.youtube_link,
    other_social_links: row.other_social_links,
    // Personal details
    age: row.age,
    gender: row.gender,
    bloodGroup: row.bloodGroup,
    date_of_birth: row.date_of_birth,
    bio: row.bio,
    address: row.address,
    city: row.city,
    state: row.state,
    country: row.country,
    pincode: row.pincode,
    // Academic details
    grade: row.grade,
    section: row.section,
    roll_number: row.roll_number,
    admission_number: row.admission_number,
    currentCgpa: row.currentCgpa,
    enrollmentDate: row.enrollmentDate,
    expectedGraduationDate: row.expectedGraduationDate,
    student_type: row.student_type,
    // Guardian details
    guardianName: row.guardianName,
    guardianPhone: row.guardianPhone,
    guardianEmail: row.guardianEmail,
    guardianRelation: row.guardianRelation,
    // Additional fields
    nm_id: row.student_id,
    trainer_name: row.trainer_name,
    district_name: row.district_name,
    branch_field: row.branch_field,
    course_name: row.course_name,
    contact_number: row.contactNumber || row.contact_number,
    alternate_number: row.alternate_number,
    contact_dial_code: row.contact_dial_code,
    imported_at: row.imported_at,
    updated_at: row.updatedAt || row.updated_at,
    school_id: row.school_id,
    college_id: row.college_id,
    college_school_name: row.college_school_name, // Keep original field
    school_name: schoolName, // Add proper school name
    approval_status: row.approval_status, // Add this field
    hobbies: row.hobbies,
    languages: row.languages,
    interests: row.interests,
    category: row.category,
    quota: row.quota,
    metadata: row.metadata,
    notification_settings: row.notification_settings,
    resumeUrl: row.resumeUrl,
    profilePicture: row.profilePicture,
  }
}

interface UseStudentsOptions {
  schoolId?: string | null;
  collegeId?: string | null;
  classIds?: string[]; // Add class IDs for filtering
}

export function useStudents(options?: UseStudentsOptions) {
  const [data, setData] = useState<UICandidate[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const schoolId = options?.schoolId
  const collegeId = options?.collegeId
  const classIds = options?.classIds

  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if educator has no class assignments (and is not admin)
      if (classIds !== undefined && classIds.length === 0 && schoolId) {
        // Educator has no class assignments - return empty array
        setData([]);
        return;
      }

      let query = supabase
        .from('students')
        .select(`
          id,
          user_id,
          student_id,
          name,
          email,
          contact_number,
          alternate_number,
          contact_dial_code,
          date_of_birth,
          age,
          gender,
          bloodGroup,
          district_name,
          university,
          university_main,
          branch_field,
          college_school_name,
          course_name,
          registration_number,
          enrollmentNumber,
          github_link,
          linkedin_link,
          twitter_link,
          facebook_link,
          instagram_link,
          portfolio_link,
          youtube_link,
          other_social_links,
          approval_status,
          trainer_name,
          bio,
          address,
          city,
          state,
          country,
          pincode,
          resumeUrl,
          profilePicture,
          contactNumber,
          created_at,
          createdAt,
          updated_at,
          updatedAt,
          imported_at,
          school_id,
          college_id,
          schools!students_school_id_fkey (
            id,
            name,
            code,
            city,
            state,
            country
          ),
          colleges!students_college_id_fkey (
            id,
            name,
            code,
            city,
            state,
            country
          ),
          grade,
          section,
          roll_number,
          admission_number,
          currentCgpa,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          enrollmentDate,
          expectedGraduationDate,
          student_type,
          hobbies,
          languages,
          interests,
          category,
          quota,
          metadata,
          notification_settings,
          skills!skills_student_id_fkey(
            id,
            name,
            type,
            level,
            description,
            verified,
            enabled,
            approval_status,
            created_at,
            updated_at
          ),
          projects!projects_student_id_fkey(
            id,
            title,
            description,
            status,
            start_date,
            end_date,
            duration,
            tech_stack,
            demo_link,
            github_link,
            approval_status,
            certificate_url,
            video_url,
            ppt_url,
            organization,
            enabled,
            created_at,
            updated_at
          ),
          certificates!certificates_student_id_fkey(
            id,
            title,
            issuer,
            level,
            credential_id,
            link,
            issued_on,
            description,
            status,
            approval_status,
            document_url,
            enabled,
            created_at,
            updated_at
          ),
          experience!experience_student_id_fkey(
            id,
            organization,
            role,
            start_date,
            end_date,
            duration,
            verified,
            approval_status,
            created_at,
            updated_at
          ),
          trainings!trainings_student_id_fkey(
            id,
            title,
            organization,
            start_date,
            end_date,
            duration,
            description,
            approval_status,
            created_at,
            updated_at
          )
        `)
        .eq('is_deleted', false)

      // Apply filtering logic
      if (classIds && classIds.length > 0) {
        // For school educators: filter by assigned class IDs
        query = query.in('school_class_id', classIds)
      } else if (schoolId) {
        // Fallback: filter by school ID (for admins or when no class assignments check)
        query = query.eq('school_id', schoolId)
      } else if (collegeId) {
        // For college educators: filter by college ID
        query = query.eq('college_id', collegeId)
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(500)

      if (error) throw error
      
      const mapped = (data as StudentRow[]).map(mapToUICandidate)
      setData(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const wrappedFetch = async () => {
      if (!isMounted) return
      // Only fetch if we have filtering criteria
      if (options !== undefined && !schoolId && !collegeId && (!classIds || classIds.length === 0)) {
        return
      }
      await fetchStudents()
    }
    wrappedFetch()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, collegeId, classIds])

  const stats = useMemo(() => ({ count: data.length }), [data])

  return { students: data, loading, error, stats, refetch: fetchStudents }
}
