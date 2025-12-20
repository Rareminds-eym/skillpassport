// Student Context Builder

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.38.4';
import type { StudentProfile } from '../types/career-ai.ts';

export async function buildStudentContext(
  supabase: SupabaseClient, 
  studentId: string
): Promise<StudentProfile | null> {
  try {
    // Fetch student basic info - try user_id first, then id
    let student: any = null;
    let actualStudentId = studentId;
    
    const { data: studentByUserId, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', studentId)
      .single();
    
    if (!error && studentByUserId) {
      student = studentByUserId;
      actualStudentId = student.id;
    } else {
      const { data: studentById, error: error2 } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error2 || !studentById) {
        console.error('Error fetching student:', error || error2);
        return null;
      }
      student = studentById;
      actualStudentId = student.id;
    }

    const profile = student?.profile || {};
    console.log(`[buildStudentContext] Student found: ${student.name}, actualStudentId: ${actualStudentId}`);

    // Fetch skills from skills table
    const { data: skillsData } = await supabase
      .from('skills')
      .select('name, type, level, verified')
      .eq('student_id', actualStudentId)
      .eq('enabled', true);

    console.log(`[buildStudentContext] Skills from DB: ${skillsData?.length || 0} skills found`);

    // Start with skills from the database
    let technicalSkills = (skillsData || [])
      .filter((s: any) => s.type === 'technical')
      .map((s: any) => ({ name: s.name, level: s.level || 3, type: 'technical', verified: s.verified || false }));
    
    let softSkills = (skillsData || [])
      .filter((s: any) => s.type === 'soft')
      .map((s: any) => ({ name: s.name, level: s.level || 3 }));

    // FALLBACK: If no skills in DB, check profile JSONB
    if (technicalSkills.length === 0 && profile.technicalSkills && Array.isArray(profile.technicalSkills)) {
      console.log(`[buildStudentContext] Using skills from profile JSONB: ${profile.technicalSkills.length} skills`);
      technicalSkills = profile.technicalSkills
        .filter((s: any) => s.enabled !== false)
        .map((s: any) => ({ name: s.name, level: s.level || 3, type: 'technical', verified: s.verified || false }));
    }

    if (softSkills.length === 0 && profile.softSkills && Array.isArray(profile.softSkills)) {
      softSkills = profile.softSkills
        .filter((s: any) => s.enabled !== false)
        .map((s: any) => ({ name: s.name, level: s.level || 3 }));
    }

    // Fetch education
    const { data: educationData } = await supabase
      .from('education')
      .select('*')
      .eq('student_id', actualStudentId)
      .order('year_of_passing', { ascending: false });

    let education = educationData || [];
    if (education.length === 0 && profile.education && Array.isArray(profile.education)) {
      education = profile.education.filter((e: any) => e.enabled !== false);
    }

    // Fetch experience
    const { data: experienceData } = await supabase
      .from('experience')
      .select('*')
      .eq('student_id', actualStudentId)
      .order('start_date', { ascending: false });

    let experience = experienceData || [];
    if (experience.length === 0 && profile.experience && Array.isArray(profile.experience)) {
      experience = profile.experience.filter((e: any) => e.enabled !== false);
    }

    // Fetch projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', actualStudentId)
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    let projects = projectsData || [];
    if (projects.length === 0 && profile.projects && Array.isArray(profile.projects)) {
      projects = profile.projects.filter((p: any) => p.enabled !== false);
    }

    // Fetch trainings
    const { data: trainingsData } = await supabase
      .from('trainings')
      .select('*')
      .eq('student_id', actualStudentId)
      .order('created_at', { ascending: false });

    let trainings = trainingsData || [];
    if (trainings.length === 0 && profile.training && Array.isArray(profile.training)) {
      trainings = profile.training;
    }

    // Fetch certificates
    const { data: certificatesData } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', actualStudentId)
      .eq('enabled', true)
      .order('issued_on', { ascending: false });

    let certificates = certificatesData || [];
    if (certificates.length === 0 && profile.certificates && Array.isArray(profile.certificates)) {
      certificates = profile.certificates.filter((c: any) => c.enabled !== false);
    }

    // Extract additional skills from projects' tech_stack
    if (projects && projects.length > 0) {
      projects.forEach((p: any) => {
        const techStack = p.tech_stack || p.technologies || [];
        techStack.forEach((skill: string) => {
          if (skill && typeof skill === 'string' && !technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
            technicalSkills.push({ name: skill, level: 3, type: 'technical', verified: false });
          }
        });
      });
    }

    // Remove duplicate skills
    const uniqueSkillNames = new Set<string>();
    technicalSkills = technicalSkills.filter(s => {
      const lowerName = s.name?.toLowerCase();
      if (uniqueSkillNames.has(lowerName)) return false;
      uniqueSkillNames.add(lowerName);
      return true;
    });

    console.log(`[buildStudentContext] Final technical skills: ${technicalSkills.map(s => s.name).join(', ')}`);

    return {
      id: student?.id || studentId,
      name: student?.name || profile.name || 'Student',
      email: student?.email || profile.email || '',
      department: student?.branch_field || profile.branch_field || education?.[0]?.department || 'General',
      university: student?.university || profile.university || education?.[0]?.university || '',
      cgpa: student?.currentCgpa || education?.[0]?.cgpa || '',
      yearOfPassing: education?.[0]?.year_of_passing || education?.[0]?.yearOfPassing || '',
      grade: student?.grade || '',
      bio: student?.bio || '',
      technicalSkills,
      softSkills,
      education,
      experience,
      projects,
      trainings,
      certificates,
      hobbies: student?.hobbies || [],
      interests: student?.interests || [],
      languages: student?.languages || []
    };
  } catch (error) {
    console.error('Error in buildStudentContext:', error);
    return null;
  }
}
