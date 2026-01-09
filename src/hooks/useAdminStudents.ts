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
  student_type?: string
  student_id?: string
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
  student_type?: string
  student_id?: string
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

  // Class is grade-section for school students, or course name for university students
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
  const score = 0 // No score for school students
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
      // Only include education for university students (those with education data)
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
    student_type: row.student_type,
    student_id: row.student_id,
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

interface UseStudentsOptions {
  searchTerm?: string
  page?: number
  pageSize?: number
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { searchTerm = '', page = 1, pageSize = 500 } = options
  const [data, setData] = useState<UICandidate[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)

  useEffect(() => {
    let isMounted = true
    const fetchStudents = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('🚀 [UPDATED CODE v4.0] Fetching students with school/college filtering...');
        
        // Get current user's school_id or college_id
        let schoolId: string | null = null;
        let collegeId: string | null = null;
        let userRole: string | null = null;
        let userId: string | null = null;
        let universityId: string | null = null;
        
        // First, check if user is logged in via AuthContext (for school/college admins)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('📦 Found user in localStorage:', userData.email, 'role:', userData.role);
            userRole = userData.role;
            
            if (userData.role === 'school_admin' && userData.schoolId) {
              schoolId = userData.schoolId;
              console.log('✅ School admin detected, using schoolId from localStorage:', schoolId);
            } else if (userData.role === 'college_admin' && userData.collegeId) {
              collegeId = userData.collegeId;
              console.log('✅ College admin detected, using collegeId from localStorage:', collegeId);
            } else if (userData.role === 'university_admin' && (userData.universityId || userData.organizationId)) {
              universityId = userData.universityId || userData.organizationId;
              console.log('✅ University admin detected, using universityId from localStorage:', universityId);
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
        
        // If not found in localStorage, try Supabase Auth
        if (!schoolId && !collegeId) {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log('🔍 Checking Supabase auth user:', user.email);
            userId = user.id;
            
            // Get user role from users table
            const { data: userRecord } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();
            
            userRole = userRecord?.role || null;
            console.log('👤 User role from database:', userRole);
            
            // Check for college admin (using unified organizations table)
            if (userRole === 'college_admin') {
              // Find college by matching admin_id or email in organizations table
              const { data: college } = await supabase
                .from('organizations')
                .select('id, name, email')
                .eq('organization_type', 'college')
                .or(`admin_id.eq.${user.id},email.ilike.${user.email}`)
                .maybeSingle();
              
              if (college?.id) {
                collegeId = college.id;
                console.log('✅ Found college_id for college admin:', collegeId, 'College:', college.name);
              } else {
                console.warn('⚠️ College admin but no matching college found for user:', user.id);
                // Try fetching all colleges to debug
                const { data: allColleges } = await supabase
                  .from('organizations')
                  .select('id, name, email, admin_id')
                  .eq('organization_type', 'college');
                console.log('📋 All colleges in database:', allColleges);
              }
            }
            // Check for school admin/educator
            else {
              // Check school_educators table
              const { data: educator } = await supabase
                .from('school_educators')
                .select('school_id')
                .eq('user_id', user.id)
                .maybeSingle();
              
              if (educator?.school_id) {
                schoolId = educator.school_id;
                console.log('✅ Found school_id in school_educators:', schoolId);
              } else {
                // Check organizations table for school by admin_id or email
                const { data: school } = await supabase
                  .from('organizations')
                  .select('id')
                  .eq('organization_type', 'school')
                  .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
                  .maybeSingle();
                
                schoolId = school?.id || null;
                if (schoolId) {
                  console.log('✅ Found school_id in organizations table:', schoolId);
                }
              }
            }
          }
        }
        
        // For university admin, get organizationId from users table if not already set
        if (userRole === 'university_admin' && !universityId && userId) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('organizationId')
            .eq('id', userId)
            .maybeSingle();
          
          if (dbUser?.organizationId) {
            universityId = dbUser.organizationId;
            console.log('✅ Got universityId from users table:', universityId);
          }
        }
        
        let collegeIds: string[] = [];
        
        // If university admin, get all colleges under this university (from organizations table)
        if (universityId) {
          console.log('🏫 Fetching colleges for university:', universityId);
          // Note: This assumes colleges have a reference to their parent university
          // You may need to adjust based on your actual data model
          const { data: colleges, error: collegesError } = await supabase
            .from('organizations')
            .select('id')
            .eq('organization_type', 'college');
          
          if (collegesError) {
            console.error('Error fetching colleges:', collegesError);
          } else if (colleges && colleges.length > 0) {
            collegeIds = colleges.map(c => c.id);
            console.log('✅ Found', collegeIds.length, 'colleges');
          }
        }
        
        // First, get total count for pagination
        let countQuery = supabase
          .from('students')
          .select('id', { count: 'exact', head: true });
        
        // Apply same filters to count query
        if (schoolId) {
          countQuery = countQuery.eq('school_id', schoolId);
        } else if (collegeId) {
          countQuery = countQuery.eq('college_id', collegeId);
        } else if (universityId) {
          countQuery = countQuery.eq('universityId', universityId);
        }
        
        if (searchTerm && searchTerm.trim()) {
          countQuery = countQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
        }
        
        const { count } = await countQuery;
        if (count !== null) {
          setTotalCount(count);
        }
        
        // Calculate pagination range
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        
        // Build the query - use foreign key hints for joins
        let query = supabase
          .from('students')
          .select(`*,
            skills!skills_student_id_fkey(id,name,type,level,description,verified,enabled,approval_status,created_at,updated_at),
            projects!projects_student_id_fkey(id,title,description,status,start_date,end_date,duration,tech_stack,demo_link,github_link,approval_status,certificate_url,video_url,ppt_url,organization,enabled,created_at,updated_at),
            certificates!certificates_student_id_fkey(id,title,issuer,level,credential_id,link,issued_on,description,status,approval_status,document_url,enabled,created_at,updated_at),
            education!education_student_id_fkey(id,level,degree,department,university,year_of_passing,cgpa,status,approval_status,created_at,updated_at),
            experience!experience_student_id_fkey(id,organization,role,start_date,end_date,duration,verified,approval_status,created_at,updated_at),
            trainings!trainings_student_id_fkey(id,title,organization,start_date,end_date,duration,description,approval_status,created_at,updated_at)`)
          .order('updatedAt', { ascending: false })
          .range(startIndex, endIndex);
        
        // Filter by school_id, college_id, or universityId based on user role
        if (schoolId) {
          console.log('✅ Filtering students by school_id:', schoolId);
          query = query.eq('school_id', schoolId);
        } else if (collegeId) {
          console.log('✅ Filtering students by college_id:', collegeId);
          query = query.eq('college_id', collegeId);
        } else if (universityId) {
          console.log('✅ Filtering students by universityId:', universityId);
          query = query.eq('universityId', universityId);
        } else {
          console.warn('⚠️ No school_id, college_id, or universityId found - User role:', userRole);
          console.warn('⚠️ This will fetch ALL students - this should not happen for admins');
        }
        
        // Apply search filter to main query (same as count query)
        if (searchTerm && searchTerm.trim()) {
          // console.log('🔍 Applying search filter to main query:', searchTerm);
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
        }
        
        let result = await query;
        
        // If full query fails, try simpler query
        if (result.error) {
          console.warn('Full query failed, trying simple query:', result.error);
          let simpleQuery = supabase
            .from('students')
            .select('*')
            .order('updatedAt', { ascending: false })
            .limit(500);
          
          // Filter by school_id, college_id, or universityId based on user role
          if (schoolId) {
            simpleQuery = simpleQuery.eq('school_id', schoolId);
          } else if (collegeId) {
            simpleQuery = simpleQuery.eq('college_id', collegeId);
          } else if (universityId) {
            simpleQuery = simpleQuery.eq('universityId', universityId);
          }
          
          // Apply search filter to simple query as well
          if (searchTerm && searchTerm.trim()) {
            // console.log('🔍 Applying search filter to simple query:', searchTerm);
            simpleQuery = simpleQuery.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%,section.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
          }
          
          result = await simpleQuery;
        }
        
        if (result.error) {
          console.error('Supabase query error:', result.error);
          throw result.error;
        }
        
        if (!isMounted) return;
        
        const filterType = schoolId ? 'school_id' : collegeId ? 'college_id' : 'ALL';
        const filterId = schoolId || collegeId || 'ALL';
        console.log(`✅ Fetched ${result.data?.length || 0} students for ${filterType}: ${filterId}`);
        
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
  }, [searchTerm, page, pageSize])

  const stats = useMemo(() => ({ 
    count: data.length,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  }), [data.length, totalCount, pageSize])

  return { students: data, loading, error, stats, totalCount }
}