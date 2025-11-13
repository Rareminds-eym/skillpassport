import { useCallback, useEffect, useMemo, useState } from 'react'
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
}

export interface UICandidate {
  id: string
  name: string
  email?: string
  phone?: string
  location?: string
  college?: string
  dept?: string
  skills: string[]
  badges: string[]
  ai_score_overall: number
  last_updated?: string
  profile?: any
  projects?: any[]
  certificates?: any[]
  assessments?: any[]
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

  const name = profile.name || 'Unknown'
  const email = profile.email
  const dial = profile.contact_number_dial_code ? String(profile.contact_number_dial_code).replace(/\.0$/, '') : ''
  const phoneNum = profile.contact_number ? String(profile.contact_number).replace(/\.0$/, '') : ''
  const altNum = profile.alternate_number ? String(profile.alternate_number).replace(/\.0$/, '') : ''
  const phone = phoneNum || altNum ? `${dial ? '+' + dial + ' ' : ''}${phoneNum || altNum}` : undefined

  const college = profile.college_school_name || profile.university
  const dept = profile.branch_field || profile.course
  const location = profile.district_name

  // Split skills on common separators
  const skills = (profile.skill || '')
    .split(/[,;|&]/)
    .map(s => s.trim())
    .filter(Boolean)

  const rawProjects = Array.isArray(passport.projects) ? passport.projects : []
  const rawCertificates = Array.isArray(passport.certificates) ? passport.certificates : []
  const rawAssessments = Array.isArray(passport.assessments) ? passport.assessments : []

  const projects = rawProjects
    .filter(project => project?.verified === true || project?.status === 'verified')
    .map(project => ({
      ...project,
      verifiedAt: project?.verifiedAt || project?.updatedAt || project?.createdAt
    }))

  const certificates = rawCertificates
    .filter(certificate => certificate?.verified === true || certificate?.status === 'verified')
    .map(certificate => ({
      ...certificate,
      verifiedAt: certificate?.verifiedAt || certificate?.updatedAt || certificate?.createdAt
    }))

  const assessments = rawAssessments

  return {
    id: row.id,
    name,
    email,
    phone,
    college,
    dept,
    location,
    skills,
    badges: ['institution_verified'],
    ai_score_overall: 0,
    last_updated: row.updatedAt || profile.imported_at || row.createdAt,
    profile: row.profile,
    projects,
    certificates,
    assessments,
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
          .select('id, universityId, profile, createdAt, updatedAt, skill_passports(projects, certificates, assessments)')
          .order('updatedAt', { ascending: false })
          .limit(500)
        if (error) throw error
        if (!isMounted) return
        const mapped = (data as StudentRow[]).map(mapToUICandidate)
        setData(mapped)
      } catch (e: any) {
        if (!isMounted) return
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