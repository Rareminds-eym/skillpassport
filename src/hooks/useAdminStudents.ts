import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Raw DB row type (minimal)
interface StudentRow {
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
  // Joined tables
  skills?: any[]
  projects?: any[]
  certificates?: any[]
  education?: any[]
  experience?: any[]
  trainings?: any[]
}

export interface StudentProfile {
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
}

function safeParseProfile(input: unknown): StudentProfile | null {
  if (!input) return null
  try {
    // If it's already an object, return it
    if (typeof input === 'object') return input as StudentProfile
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
      return JSON.parse(firstParse) as StudentProfile
    }
    return firstParse as StudentProfile
  } catch {
    return null
  }
}

function mapToUICandidate(row: StudentRow): UICandidate {
  const profile = safeParseProfile(row.profile) || {}
  const passport = row.skill_passports || {}

  // Use direct fields first, then fallback to profile
  const name = row.name || profile.name || 'Unknown'
  const email = row.email || profile.email
  const dial = row.contact_dial_code || profile.contact_number_dial_code ? String(row.contact_dial_code || profile.contact_number_dial_code).replace(/\.0$/, '') : ''
  const phoneNum = row.contact_number || profile.contact_number ? String(row.contact_number || profile.contact_number).replace(/\.0$/, '') : ''
  const altNum = row.alternate_number || profile.alternate_number ? String(row.alternate_number || profile.alternate_number).replace(/\.0$/, '') : ''
  const phone = phoneNum || altNum ? `${dial ? '+' + dial + ' ' : ''}${phoneNum || altNum}` : undefined

  // Use direct fields for college and department
  const college = row.college_school_name || row.university || profile.college_school_name || profile.university
  const dept = row.branch_field || row.course_name || profile.branch_field || profile.course
  const location = row.district_name || profile.district_name

  // Class is the course name or branch field
  const classValue = row.course_name || row.branch_field || profile.course || profile.branch_field || 'N/A'

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

  // Generate a mock score and status for now
  const score = Math.floor(Math.random() * 30) + 70 // Random score 70-100
  const statuses = ['pending', 'approved', 'waitlisted']
  const admission_status = statuses[Math.floor(Math.random() * statuses.length)]

  return {
    id: row.id,
    name,
    email,
    phone,
    contact_number: row.contact_number,
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
      education: education.length > 0 ? education : profile.education || [{
        degree: dept,
        level: classValue,
        cgpa: (Math.random() * 3 + 7).toFixed(2), // Random CGPA 7-10
      }],
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
  }
}

export function useStudents() {
  const [data, setData] = useState<UICandidate[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchStudents = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching students from Supabase...');
        
        // Try full query first
        let result = await supabase
          .from('students')
          .select(`*,
            skills!skills_student_id_fkey(id,name,type,level,description,verified,enabled,approval_status,created_at,updated_at),
            projects!projects_student_id_fkey(id,title,description,status,start_date,end_date,duration,tech_stack,demo_link,github_link,approval_status,certificate_url,video_url,ppt_url,organization,enabled,created_at,updated_at),
            certificates!certificates_student_id_fkey(id,title,issuer,level,credential_id,link,issued_on,description,status,approval_status,document_url,enabled,created_at,updated_at),
            education!education_student_id_fkey(id,level,degree,department,university,year_of_passing,cgpa,status,approval_status,created_at,updated_at),
            experience!experience_student_id_fkey(id,organization,role,start_date,end_date,duration,verified,approval_status,created_at,updated_at),
            trainings!trainings_student_id_fkey(id,title,organization,start_date,end_date,duration,description,approval_status,created_at,updated_at)`)
          .order('updatedAt', { ascending: false })
          .limit(500);
        
        // If full query fails, try simpler query
        if (result.error) {
          console.warn('Full query failed, trying simple query:', result.error);
          result = await supabase
            .from('students')
            .select('*')
            .order('updatedAt', { ascending: false })
            .limit(500);
        }
        
        if (result.error) {
          console.error('Supabase query error:', result.error);
          throw result.error;
        }
        
        if (!isMounted) return;
        
        console.log(`Fetched ${result.data?.length || 0} students`);
        
        // Log sample data to verify related tables are loaded
        if (result.data && result.data.length > 0) {
          const sample = result.data[0] as StudentRow;
          console.log('Sample student data structure:', {
            hasSkills: Array.isArray(sample.skills) && sample.skills.length > 0,
            hasCertificates: Array.isArray(sample.certificates) && sample.certificates.length > 0,
            hasProjects: Array.isArray(sample.projects) && sample.projects.length > 0,
            hasEducation: Array.isArray(sample.education) && sample.education.length > 0,
            hasExperience: Array.isArray(sample.experience) && sample.experience.length > 0,
            hasTrainings: Array.isArray(sample.trainings) && sample.trainings.length > 0,
          });
        }
        
        const mapped = (result.data as StudentRow[]).map(mapToUICandidate);
        setData(mapped);
      } catch (e: any) {
        console.error('Error in fetchStudents:', e);
        if (!isMounted) return;
        
        let errorMessage = 'Failed to load students';
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
    fetchStudents()
    return () => {
      isMounted = false
    }
  }, [])

  const stats = useMemo(() => ({ count: data.length }), [data])

  return { students: data, loading, error, stats }
}