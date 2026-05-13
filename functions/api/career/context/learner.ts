// Learner Context Builder

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LearnerProfile } from '../types';

export async function buildlearnerContext(
  supabase: SupabaseClient, 
  learnerId: string
): Promise<LearnerProfile | null> {
  try {
    let learner: any = null;
    let actualLearnerId = learnerId;
    
    const { data: learnerByUserId, error } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', learnerId)
      .single();
    
    if (!error && learnerByUserId) {
      learner = learnerByUserId;
      actualLearnerId = learner.id;
    } else {
      const { data: learnerById, error: error2 } = await supabase
        .from('learners')
        .select('*')
        .eq('id', learnerId)
        .single();
      
      if (error2 || !learnerById) {
        console.error('Error fetching learner:', error || error2);
        return null;
      }
      learner = learnerById;
      actualLearnerId = learner.id;
    }

    const profile = learner?.profile || {};

    // Fetch skills from skills table
    const { data: skillsData } = await supabase
      .from('skills')
      .select('name, type, level, verified')
      .eq('learner_id', actualLearnerId)
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
      supabase.from('education').select('*').eq('learner_id', actualLearnerId).order('year_of_passing', { ascending: false }),
      supabase.from('experience').select('*').eq('learner_id', actualLearnerId).order('start_date', { ascending: false }),
      supabase.from('projects').select('*').eq('learner_id', actualLearnerId).eq('enabled', true),
      supabase.from('trainings').select('*').eq('learner_id', actualLearnerId),
      supabase.from('certificates').select('*').eq('learner_id', actualLearnerId).eq('enabled', true)
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

    // Determine if this is a school learner based on grade field
    const isSchoolLearner = learner?.grade && learner.grade.toLowerCase().includes('grade');
    
    // Extract grade number for school learners
    let gradeNumber: number | null = null;
    if (isSchoolLearner && learner?.grade) {
      const match = learner.grade.match(/grade\s*(\d+)/i);
      if (match) {
        gradeNumber = parseInt(match[1], 10);
      }
    }
    
    return {
      id: learner?.id || learnerId,
      name: learner?.name || profile.name || 'Learner',
      email: learner?.email || profile.email || '',
      // For school learners, use grade instead of branch_field
      department: isSchoolLearner 
        ? learner?.grade || 'General'
        : (learner?.branch_field || profile.branch_field || education?.[0]?.department || 'General'),
      university: learner?.university || profile.university || education?.[0]?.university || '',
      cgpa: learner?.currentCgpa || education?.[0]?.cgpa || '',
      yearOfPassing: education?.[0]?.year_of_passing || '',
      grade: learner?.grade || '',
      gradeNumber, // Add grade number for context
      bio: learner?.bio || '',
      technicalSkills,
      softSkills,
      education,
      experience,
      projects,
      trainings,
      certificates,
      hobbies: learner?.hobbies || [],
      interests: learner?.interests || [],
      languages: learner?.languages || []
    };
  } catch (error) {
    console.error('Error in buildlearnerContext:', error);
    return null;
  }
}
