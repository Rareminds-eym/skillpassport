// Student Context Builder - Cloudflare Workers Version

import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudentProfile } from '../types/career-ai';

export async function buildStudentContext(
  supabase: SupabaseClient, 
  studentId: string
): Promise<StudentProfile | null> {
  try {
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

    // Fetch skills from skills table
    const { data: skillsData } = await supabase
      .from('skills')
      .select('name, type, level, verified')
      .eq('student_id', actualStudentId)
      .eq('enabled', true);

    let technicalSkills = (skillsData || [])
      .filter((s: any) => s.type === 'technical')
      .map((s: any) => ({ name: s.name, level: s.level || 3, type: 'technical', verified: s.verified || false }));
    
    let softSkills = (skillsData || [])
      .filter((s: any) => s.type === 'soft')
      .map((s: any) => ({ name: s.name, level: s.level || 3 }));

    // FALLBACK: If no skills in DB, check profile JSONB
    if (technicalSkills.length === 0 && profile.technicalSkills) {
      technicalSkills = (profile.technicalSkills || [])
        .filter((s: any) => s.enabled !== false)
        .map((s: any) => ({ name: s.name, level: s.level || 3, type: 'technical', verified: s.verified || false }));
    }

    if (softSkills.length === 0 && profile.softSkills) {
      softSkills = (profile.softSkills || [])
        .filter((s: any) => s.enabled !== false)
        .map((s: any) => ({ name: s.name, level: s.level || 3 }));
    }

    // Fetch related data
    const [educationRes, experienceRes, projectsRes, trainingsRes, certificatesRes] = await Promise.all([
      supabase.from('education').select('*').eq('student_id', actualStudentId).order('year_of_passing', { ascending: false }),
      supabase.from('experience').select('*').eq('student_id', actualStudentId).order('start_date', { ascending: false }),
      supabase.from('projects').select('*').eq('student_id', actualStudentId).eq('enabled', true),
      supabase.from('trainings').select('*').eq('student_id', actualStudentId),
      supabase.from('certificates').select('*').eq('student_id', actualStudentId).eq('enabled', true)
    ]);

    const education = educationRes.data || profile.education || [];
    const experience = experienceRes.data || profile.experience || [];
    const projects = projectsRes.data || profile.projects || [];
    const trainings = trainingsRes.data || profile.training || [];
    const certificates = certificatesRes.data || profile.certificates || [];

    // Remove duplicate skills
    const uniqueSkillNames = new Set<string>();
    technicalSkills = technicalSkills.filter(s => {
      const lowerName = s.name?.toLowerCase();
      if (uniqueSkillNames.has(lowerName)) return false;
      uniqueSkillNames.add(lowerName);
      return true;
    });

    return {
      id: student?.id || studentId,
      name: student?.name || profile.name || 'Student',
      email: student?.email || profile.email || '',
      department: student?.branch_field || profile.branch_field || education?.[0]?.department || 'General',
      university: student?.university || profile.university || education?.[0]?.university || '',
      cgpa: student?.currentCgpa || education?.[0]?.cgpa || '',
      yearOfPassing: education?.[0]?.year_of_passing || '',
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
