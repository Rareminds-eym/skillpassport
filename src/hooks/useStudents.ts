// // import { useCallback, useEffect, useMemo, useState } from 'react'
// // import { supabase } from '../lib/supabaseClient'

// // // Raw DB row type (minimal)
// // interface StudentRow {
// //   id: string
// //   universityId?: string
// //   profile?: any
// //   createdAt?: string
// //   updatedAt?: string
// //   skill_passports?: {
// //     projects?: any[]
// //     certificates?: any[]
// //     assessments?: any[]
// //   } | null
// // }

// // export interface StudentProfile {
// //   name?: string
// //   email?: string
// //   registration_number?: number | string
// //   contact_number_dial_code?: number | string
// //   contact_number?: number | string
// //   alternate_number?: number | string
// //   date_of_birth?: string
// //   branch_field?: string
// //   nm_id?: string
// //   trainer_name?: string
// //   university?: string
// //   district_name?: string
// //   college_school_name?: string
// //   age?: number
// //   course?: string
// //   skill?: string
// //   imported_at?: string
// // }

// // export interface UICandidate {
// //   id: string
// //   name: string
// //   email?: string
// //   phone?: string
// //   location?: string
// //   college?: string
// //   dept?: string
// //   skills: string[]
// //   badges: string[]
// //   ai_score_overall: number
// //   last_updated?: string
// //   profile?: any
// //   projects?: any[]
// //   certificates?: any[]
// //   assessments?: any[]
// // }

// // function safeParseProfile(input: unknown): StudentProfile | null {
// //   if (!input) return null
// //   try {
// //     // If it's already an object, return it
// //     if (typeof input === 'object') return input as StudentProfile
// //     let text = String(input)
// //     // Handle double-encoded JSON strings like: "{\"name\":...}"
// //     // Remove wrapping quotes if present
// //     if (text.startsWith('"') && text.endsWith('"')) {
// //       try {
// //         text = JSON.parse(text)
// //       } catch {
// //         // fallthrough; will try to parse as-is below
// //       }
// //     }
// //     const firstParse = JSON.parse(text)
// //     // Sometimes it's actually a quoted JSON string inside
// //     if (typeof firstParse === 'string') {
// //       return JSON.parse(firstParse) as StudentProfile
// //     }
// //     return firstParse as StudentProfile
// //   } catch {
// //     return null
// //   }
// // }

// // function mapToUICandidate(row: StudentRow): UICandidate {
// //   const profile = safeParseProfile(row.profile) || {}
// //   const passport = row.skill_passports || {}

// //   const name = profile.name || 'Unknown'
// //   const email = profile.email
// //   const dial = profile.contact_number_dial_code ? String(profile.contact_number_dial_code).replace(/\.0$/, '') : ''
// //   const phoneNum = profile.contact_number ? String(profile.contact_number).replace(/\.0$/, '') : ''
// //   const altNum = profile.alternate_number ? String(profile.alternate_number).replace(/\.0$/, '') : ''
// //   const phone = phoneNum || altNum ? `${dial ? '+' + dial + ' ' : ''}${phoneNum || altNum}` : undefined

// //   const college = profile.college_school_name || profile.university
// //   const dept = profile.branch_field || profile.course
// //   const location = profile.district_name

// //   // Split skills on common separators
// //   const skills = (profile.skill || '')
// //     .split(/[,;|&]/)
// //     .map(s => s.trim())
// //     .filter(Boolean)

// //   const rawProjects = Array.isArray(passport.projects) ? passport.projects : []
// //   const rawCertificates = Array.isArray(passport.certificates) ? passport.certificates : []
// //   const rawAssessments = Array.isArray(passport.assessments) ? passport.assessments : []

// //   const projects = rawProjects
// //     .filter(project => project?.verified === true || project?.status === 'verified')
// //     .map(project => ({
// //       ...project,
// //       verifiedAt: project?.verifiedAt || project?.updatedAt || project?.createdAt
// //     }))

// //   const certificates = rawCertificates
// //     .filter(certificate => certificate?.verified === true || certificate?.status === 'verified')
// //     .map(certificate => ({
// //       ...certificate,
// //       verifiedAt: certificate?.verifiedAt || certificate?.updatedAt || certificate?.createdAt
// //     }))

// //   const assessments = rawAssessments

// //   return {
// //     id: row.id,
// //     name,
// //     email,
// //     phone,
// //     college,
// //     dept,
// //     location,
// //     skills,
// //     badges: ['institution_verified'],
// //     ai_score_overall: 0,
// //     last_updated: row.updatedAt || profile.imported_at || row.createdAt,
// //     profile: row.profile,
// //     projects,
// //     certificates,
// //     assessments,
// //   }
// // }

// // export function useStudents() {
// //   const [data, setData] = useState<UICandidate[]>([])
// //   const [loading, setLoading] = useState<boolean>(false)
// //   const [error, setError] = useState<string | null>(null)

// //   useEffect(() => {
// //     let isMounted = true
// //     const fetchStudents = async () => {
// //       setLoading(true)
// //       setError(null)
// //       try {
// //         const { data, error } = await supabase
// //           .from('students')
// //           .select('id, universityId, profile, createdAt, updatedAt, skill_passports(projects, certificates, assessments)')
// //           .order('updatedAt', { ascending: false })
// //           .limit(500)
// //         if (error) throw error
// //         if (!isMounted) return
// //         const mapped = (data as StudentRow[]).map(mapToUICandidate)
// //         setData(mapped)
// //       } catch (e: any) {
// //         if (!isMounted) return
// //         setError(e?.message || 'Failed to load students')
// //       } finally {
// //         if (isMounted) setLoading(false)
// //       }
// //     }
// //     fetchStudents()
// //     return () => {
// //       isMounted = false
// //     }
// //   }, [])

// //   const stats = useMemo(() => ({ count: data.length }), [data])

// //   return { students: data, loading, error, stats }
// // }

// import { useCallback, useEffect, useMemo, useState } from 'react'
// import { supabase } from '../lib/supabaseClient'

// // Raw DB row type
// interface StudentRow {
//   id: string
//   universityId?: string
//   name?: string
//   email?: string
//   age?: number
//   contact_number?: string
//   alternate_number?: string
//   contact_dial_code?: string
//   district_name?: string
//   university?: string
//   branch_field?: string
//   college_school_name?: string
//   registration_number?: string
//   date_of_birth?: string
//   dateOfBirth?: string
//   profile?: any
//   createdAt?: string
//   updatedAt?: string
//   created_at?: string
//   updated_at?: string
//   imported_at?: string
//   // Related data
//   certificates?: any[]
//   education?: any[]
//   experience?: any[]
//   skills?: any[]
//   trainings?: any[]
//   skill_passports?: {
//     projects?: any[]
//     certificates?: any[]
//     assessments?: any[]
//   } | null
// }

// export interface UICandidate {
//   id: string
//   name: string
//   email?: string
//   phone?: string
//   location?: string
//   college?: string
//   dept?: string
//   skills: string[]
//   badges: string[]
//   ai_score_overall: number
//   last_updated?: string
//   profile?: any
//   projects?: any[]
//   certificates?: any[]
//   assessments?: any[]
//   education?: any[]
//   experience?: any[]
//   trainings?: any[]
// }

// function safeParseProfile(input: unknown): any | null {
//   if (!input) return null
//   try {
//     if (typeof input === 'object' && input !== null) return input
//     let text = String(input)
//     if (text.startsWith('"') && text.endsWith('"')) {
//       try {
//         text = JSON.parse(text)
//       } catch {
//         // fallthrough
//       }
//     }
//     const firstParse = JSON.parse(text)
//     if (typeof firstParse === 'string') {
//       return JSON.parse(firstParse)
//     }
//     return firstParse
//   } catch (error) {
//     console.error('Failed to parse profile:', error)
//     return null
//   }
// }

// function mapToUICandidate(row: StudentRow): UICandidate {
//   const profile = safeParseProfile(row.profile) || {}

//   // Get name from direct column first, then fallback to profile
//   const name = row.name || 
//                 profile.name || 
//                 profile.student_name || 
//                 profile.full_name || 
//                 'Unknown'
  
//   // Get email from direct column first
//   const email = row.email || profile.email

//   // Build phone number
//   const dialCode = row.contact_dial_code || profile.contact_number_dial_code || ''
//   const dialCodeStr = dialCode ? String(dialCode).replace(/\.0$/, '') : ''
//   const phone = row.contact_number || profile.contact_number || ''
//   const phoneStr = phone ? String(phone).replace(/\.0$/, '') : ''
//   const altPhone = row.alternate_number || profile.alternate_number || ''
//   const altPhoneStr = altPhone ? String(altPhone).replace(/\.0$/, '') : ''
//   const phoneNumber = phoneStr || altPhoneStr
//   const formattedPhone = phoneNumber 
//     ? `${dialCodeStr ? '+' + dialCodeStr + ' ' : ''}${phoneNumber}` 
//     : undefined

//   // Get college, dept, location from direct columns first
//   const college = row.college_school_name || 
//                   profile.college_school_name || 
//                   row.university || 
//                   profile.university
  
//   const dept = row.branch_field || 
//                profile.branch_field || 
//                profile.course || 
//                profile.department

//   const location = row.district_name || 
//                    profile.district_name || 
//                    profile.location

//   // Get skills from skills table (technical and soft)
//   const technicalSkills = (row.skills || [])
//     .filter((s: any) => s?.type === 'technical' && s?.enabled !== false)
//     .map((s: any) => s.name)
  
//   const softSkills = (row.skills || [])
//     .filter((s: any) => s?.type === 'soft' && s?.enabled !== false)
//     .map((s: any) => s.name)

//   // Also get skills from profile if they exist
//   const profileSkills = (profile.skill || profile.skills || '')
//     .toString()
//     .split(/[,;|&]/)
//     .map((s: string) => s.trim())
//     .filter(Boolean)

//   // Combine all skills and remove duplicates
//   const allSkills = [...new Set([...technicalSkills, ...softSkills, ...profileSkills])]

//   // Get certificates from certificates table
//   const certificates = (row.certificates || [])
//     .filter((cert: any) => cert?.enabled !== false)
//     .map((cert: any) => ({
//       id: cert.id,
//       title: cert.title,
//       issuer: cert.issuer,
//       level: cert.level,
//       credentialId: cert.credential_id,
//       link: cert.link,
//       issuedOn: cert.issued_on,
//       description: cert.description,
//       status: cert.status,
//       documentUrl: cert.document_url,
//       verified: cert.approval_status === 'verified' || cert.approval_status === 'approved',
//       createdAt: cert.created_at,
//       updatedAt: cert.updated_at
//     }))

//   // Get education from education table
//   const education = (row.education || []).map((edu: any) => ({
//     id: edu.id,
//     level: edu.level,
//     degree: edu.degree,
//     department: edu.department,
//     university: edu.university,
//     yearOfPassing: edu.year_of_passing,
//     cgpa: edu.cgpa,
//     status: edu.status,
//     createdAt: edu.created_at,
//     updatedAt: edu.updated_at
//   }))

//   // Get experience from experience table
//   const experience = (row.experience || []).map((exp: any) => ({
//     id: exp.id,
//     organization: exp.organization,
//     role: exp.role,
//     startDate: exp.start_date,
//     endDate: exp.end_date,
//     duration: exp.duration,
//     verified: exp.verified,
//     createdAt: exp.created_at,
//     updatedAt: exp.updated_at
//   }))

//   // Get trainings from trainings table
//   const trainings = (row.trainings || []).map((training: any) => ({
//     id: training.id,
//     title: training.title,
//     organization: training.organization,
//     startDate: training.start_date,
//     endDate: training.end_date,
//     duration: training.duration,
//     description: training.description,
//     createdAt: training.created_at,
//     updatedAt: training.updated_at
//   }))

//   // Get projects from skill_passports
//   const passport = row.skill_passports || {}
//   const rawProjects = Array.isArray(passport.projects) ? passport.projects : []
//   const rawAssessments = Array.isArray(passport.assessments) ? passport.assessments : []

//   const projects = rawProjects
//     .filter(project => project?.verified === true || project?.status === 'verified')
//     .map(project => ({
//       ...project,
//       verifiedAt: project?.verifiedAt || project?.updatedAt || project?.createdAt
//     }))

//   const assessments = rawAssessments

//   return {
//     id: row.id,
//     name,
//     email,
//     phone: formattedPhone,
//     college,
//     dept,
//     location,
//     skills: allSkills,
//     badges: ['institution_verified'],
//     ai_score_overall: 0,
//     last_updated: row.updated_at || row.updatedAt || row.imported_at || row.created_at || row.createdAt,
//     profile: row.profile,
//     projects,
//     certificates,
//     assessments,
//     education,
//     experience,
//     trainings,
//   }
// }

// export function useStudents() {
//   const [data, setData] = useState<UICandidate[]>([])
//   const [loading, setLoading] = useState<boolean>(false)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     let isMounted = true
//     const fetchStudents = async () => {
//       setLoading(true)
//       setError(null)
//       try {
//         const { data, error } = await supabase
//           .from('students')
//           .select(`
//             id,
//             universityId,
//             name,
//             email,
//             age,
//             contact_number,
//             alternate_number,
//             contact_dial_code,
//             district_name,
//             university,
//             branch_field,
//             college_school_name,
//             registration_number,
//             date_of_birth,
//             dateOfBirth,
//             profile,
//             createdAt,
//             updatedAt,
//             created_at,
//             updated_at,
//             imported_at,
//             certificates (
//               id,
//               title,
//               issuer,
//               level,
//               credential_id,
//               link,
//               issued_on,
//               description,
//               status,
//               approval_status,
//               document_url,
//               enabled,
//               created_at,
//               updated_at
//             ),
//             education (
//               id,
//               level,
//               degree,
//               department,
//               university,
//               year_of_passing,
//               cgpa,
//               status,
//               created_at,
//               updated_at
//             ),
//             experience (
//               id,
//               organization,
//               role,
//               start_date,
//               end_date,
//               duration,
//               verified,
//               created_at,
//               updated_at
//             ),
//             skills (
//               id,
//               name,
//               type,
//               level,
//               description,
//               verified,
//               enabled,
//               created_at,
//               updated_at
//             ),
//             trainings (
//               id,
//               title,
//               organization,
//               start_date,
//               end_date,
//               duration,
//               description,
//               created_at,
//               updated_at
//             ),
//             skill_passports (
//               projects,
//               certificates,
//               assessments
//             )
//           `)
//           .order('updated_at', { ascending: false })
//           .limit(500)
        
//         if (error) throw error
//         if (!isMounted) return
        
//         const mapped = (data as StudentRow[]).map(mapToUICandidate)
        
//         // Debug logging
//         console.log('Total students loaded:', mapped.length)
//         console.log('Sample student:', mapped[0])
//         console.log('Students with "Unknown" name:', mapped.filter(s => s.name === 'Unknown').length)
        
//         setData(mapped)
//       } catch (e: any) {
//         if (!isMounted) return
//         console.error('Error loading students:', e)
//         setError(e?.message || 'Failed to load students')
//       } finally {
//         if (isMounted) setLoading(false)
//       }
//     }
//     fetchStudents()
//     return () => {
//       isMounted = false
//     }
//   }, [])

//   const stats = useMemo(() => ({ count: data.length }), [data])

//   return { students: data, loading, error, stats }
// }

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Raw DB row type
interface StudentRow {
  id: string
  universityId?: string
  name?: string
  email?: string
  age?: number
  contact_number?: string
  alternate_number?: string
  contact_dial_code?: string
  district_name?: string
  university?: string
  branch_field?: string
  college_school_name?: string
  registration_number?: string
  date_of_birth?: string
  dateOfBirth?: string
  profile?: any
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
  imported_at?: string
  // Related data
  certificates?: any[]
  education?: any[]
  experience?: any[]
  skills?: any[]
  trainings?: any[]
  projects?: any[]
  skill_passports?: {
    projects?: any[]
    certificates?: any[]
    assessments?: any[]
  } | null
}

export interface UICandidate {
  id: string
  name: string
  email?: string
  age?: number
  phone?: string
  location?: string
  college?: string
  dept?: string
  year?: string
  skills: string[]
  badges: string[]
  ai_score_overall: number
  last_updated?: string
  profile?: any
  projects?: any[]
  certificates?: any[]
  assessments?: any[]
  education?: any[]
  experience?: any[]
  trainings?: any[]
  // Add raw data for debugging and fallback
  rawData?: StudentRow
}

function safeParseProfile(input: unknown): any | null {
  if (!input) return null
  try {
    if (typeof input === 'object' && input !== null) return input
    let text = String(input)
    if (text.startsWith('"') && text.endsWith('"')) {
      try {
        text = JSON.parse(text)
      } catch {
        // fallthrough
      }
    }
    const firstParse = JSON.parse(text)
    if (typeof firstParse === 'string') {
      return JSON.parse(firstParse)
    }
    return firstParse
  } catch (error) {
    console.error('Failed to parse profile:', error)
    return null
  }
}

function mapToUICandidate(row: StudentRow): UICandidate {
  const profile = safeParseProfile(row.profile) || {}

  // Get name from direct column first, then fallback to profile
  const name = row.name || 
                profile.name || 
                profile.student_name || 
                profile.full_name || 
                'Unknown'
  
  // Get email from direct column first
  const email = row.email || profile.email
  const age = row.age || profile.age
  // Build phone number
  const dialCode = row.contact_dial_code || profile.contact_number_dial_code || ''
  const dialCodeStr = dialCode ? String(dialCode).replace(/\.0$/, '') : ''
  const phone = row.contact_number || profile.contact_number || ''
  const phoneStr = phone ? String(phone).replace(/\.0$/, '') : ''
  const altPhone = row.alternate_number || profile.alternate_number || ''
  const altPhoneStr = altPhone ? String(altPhone).replace(/\.0$/, '') : ''
  const phoneNumber = phoneStr || altPhoneStr
  const formattedPhone = phoneNumber 
    ? `${dialCodeStr ? '+' + dialCodeStr + ' ' : ''}${phoneNumber}` 
    : undefined

  // Get college, dept, location from direct columns first
  const college = row.college_school_name || 
                  profile.college_school_name || 
                  row.university || 
                  profile.university
  
  const dept = row.branch_field || 
               profile.branch_field || 
               profile.course || 
               profile.department

  const location = row.district_name || 
                   profile.district_name || 
                   profile.location

  // Get skills from skills table (technical and soft)
  const technicalSkills = (row.skills || [])
    .filter((s: any) => s?.type === 'technical' && s?.enabled !== false)
    .map((s: any) => s.name)
  
  const softSkills = (row.skills || [])
    .filter((s: any) => s?.type === 'soft' && s?.enabled !== false)
    .map((s: any) => s.name)

  // Also get skills from profile if they exist
  const profileSkills = (profile.skill || profile.skills || '')
    .toString()
    .split(/[,;|&]/)
    .map((s: string) => s.trim())
    .filter(Boolean)

  // Combine all skills and remove duplicates
  const allSkills = [...new Set([...technicalSkills, ...softSkills, ...profileSkills])]

  // Get certificates from certificates table - FIXED: Ensure all certificates are included
  const certificates = (row.certificates || [])
    .filter((cert: any) => cert && cert.id) // Only filter out null/undefined
    .map((cert: any) => ({
      id: cert.id,
      title: cert.title || 'Untitled Certificate',
      issuer: cert.issuer || 'Unknown Issuer',
      level: cert.level,
      credentialId: cert.credential_id,
      link: cert.link,
      issuedOn: cert.issued_on,
      description: cert.description,
      status: cert.status,
      documentUrl: cert.document_url,
      verified: cert.approval_status === 'verified' || cert.approval_status === 'approved',
      enabled: cert.enabled,
      createdAt: cert.created_at,
      updatedAt: cert.updated_at
    }))

  // Get education from education table
  const education = (row.education || [])
    .filter((edu: any) => edu && edu.id)
    .map((edu: any) => ({
      id: edu.id,
      level: edu.level,
      degree: edu.degree || 'Degree',
      department: edu.department,
      university: edu.university || 'University',
      yearOfPassing: edu.year_of_passing,
      cgpa: edu.cgpa,
      status: edu.status,
      createdAt: edu.created_at,
      updatedAt: edu.updated_at
    }))

  // Get experience from experience table
  const experience = (row.experience || [])
    .filter((exp: any) => exp && exp.id)
    .map((exp: any) => ({
      id: exp.id,
      organization: exp.organization || 'Organization',
      role: exp.role || 'Role',
      title: exp.role || 'Role',
      startDate: exp.start_date,
      endDate: exp.end_date,
      duration: exp.duration,
      verified: exp.verified,
      createdAt: exp.created_at,
      updatedAt: exp.updated_at
    }))

  // Get trainings from trainings table
  const trainings = (row.trainings || [])
    .filter((training: any) => training && training.id)
    .map((training: any) => ({
      id: training.id,
      title: training.title || 'Training',
      organization: training.organization || 'Organization',
      startDate: training.start_date,
      endDate: training.end_date,
      duration: training.duration,
      description: training.description,
      createdAt: training.created_at,
      updatedAt: training.updated_at
    }))

  // Get projects from both projects table and skill_passports
  const tableProjects = (row.projects || [])
    .filter((project: any) => project && project.enabled !== false)
    .map((project: any) => ({
      id: project.id,
      title: project.title || 'Untitled Project',
      description: project.description,
      techStack: project.tech_stack || [],
      link: project.demo_link || project.github_link,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      duration: project.duration,
      verified: project.approval_status === 'verified' || project.approval_status === 'approved',
      verifiedAt: project.updated_at || project.created_at,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      approval_status: project.approval_status
    }))

  const passport = row.skill_passports || {}
  const passportProjects = Array.isArray(passport.projects) ? passport.projects : []
  const rawAssessments = Array.isArray(passport.assessments) ? passport.assessments : []

  const mappedPassportProjects = passportProjects
    .filter((project: any) => project && (project.title || project.name))
    .map((project: any) => ({
      id: project.id || project.title,
      title: project.title || project.name || 'Untitled Project',
      description: project.description,
      techStack: project.techStack || project.tech_stack || project.technologies || [],
      link: project.link || project.url || project.github_url,
      status: project.status,
      start_date: project.start_date || project.startDate,
      end_date: project.end_date || project.endDate,
      duration: project.duration,
      verified: project.verified === true || project.status === 'verified',
      verifiedAt: project.verifiedAt || project.updatedAt || project.createdAt,
      createdAt: project.createdAt || project.created_at,
      updatedAt: project.updatedAt || project.updated_at,
      approval_status: project.approval_status || (project.verified ? 'verified' : 'pending')
    }))

  // Combine and deduplicate projects
  const allProjects = [...tableProjects, ...mappedPassportProjects]
  const projectsMap = new Map()
  allProjects.forEach(project => {
    if (!projectsMap.has(project.id)) {
      projectsMap.set(project.id, project)
    }
  })
  const projects = Array.from(projectsMap.values())

  const assessments = rawAssessments.map(assessment => ({
    id: assessment.id || assessment.name,
    name: assessment.name || assessment.title || 'Assessment',
    score: assessment.score,
    date: assessment.date || assessment.completedAt,
    status: assessment.status,
    ...assessment
  }))

  // Debug log for this student
  console.log(`Mapping student ${name}:`, {
    certificatesCount: certificates.length,
    projectsCount: projects.length,
    experienceCount: experience.length,
    educationCount: education.length,
    trainingsCount: trainings.length,
    assessmentsCount: assessments.length
  })

  return {
    id: row.id,
    name,
    email,
    age,
    phone: formattedPhone,
    college,
    dept,
    location,
    year: profile.year || profile.academic_year,
    skills: allSkills,
    badges: ['institution_verified'],
    ai_score_overall: 0,
    last_updated: row.updated_at || row.updatedAt || row.imported_at || row.created_at || row.createdAt,
    profile: row.profile,
    projects,
    certificates,
    assessments,
    education,
    experience,
    trainings,
    // Include raw data for debugging
    rawData: row
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
        const { data, error } = await supabase
          .from('students')
          .select(`
            id,
            universityId,
            name,
            email,
            age,
            contact_number,
            alternate_number,
            contact_dial_code,
            district_name,
            university,
            branch_field,
            college_school_name,
            registration_number,
            date_of_birth,
            dateOfBirth,
            profile,
            createdAt,
            updatedAt,
            created_at,
            updated_at,
            imported_at,
            certificates (
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
            education (
              id,
              level,
              degree,
              department,
              university,
              year_of_passing,
              cgpa,
              status,
              created_at,
              updated_at
            ),
            experience (
              id,
              organization,
              role,
              start_date,
              end_date,
              duration,
              verified,
              created_at,
              updated_at
            ),
            skills (
              id,
              name,
              type,
              level,
              description,
              verified,
              enabled,
              created_at,
              updated_at
            ),
            trainings (
              id,
              title,
              organization,
              start_date,
              end_date,
              duration,
              description,
              created_at,
              updated_at
            ),
            projects (
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
              created_at,
              updated_at,
              certificate_url,
              video_url,
              ppt_url,
              organization,
              enabled
            ),
            skill_passports (
              projects,
              certificates,
              assessments
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(500)
        
        if (error) throw error
        if (!isMounted) return
        
        const mapped = (data as StudentRow[]).map(mapToUICandidate)
        
        // Enhanced debug logging
        console.log('=== STUDENTS DATA LOADED ===')
        console.log('Total students loaded:', mapped.length)
        if (mapped.length > 0) {
          console.log('Sample student:', mapped[0])
          console.log('Sample student full data:', {
            name: mapped[0].name,
            certificates: mapped[0].certificates,
            projects: mapped[0].projects,
            experience: mapped[0].experience,
            education: mapped[0].education,
            trainings: mapped[0].trainings,
            assessments: mapped[0].assessments
          })
        }
        console.log('Students with "Unknown" name:', mapped.filter(s => s.name === 'Unknown').length)
        console.log('Students with certificates:', mapped.filter(s => s.certificates && s.certificates.length > 0).length)
        console.log('Students with projects:', mapped.filter(s => s.projects && s.projects.length > 0).length)
        console.log('Students with experience:', mapped.filter(s => s.experience && s.experience.length > 0).length)
        console.log('===========================')
        
        setData(mapped)
      } catch (e: any) {
        if (!isMounted) return
        console.error('Error loading students:', e)
        setError(e?.message || 'Failed to load students')
      } finally {
        if (isMounted) setLoading(false)
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