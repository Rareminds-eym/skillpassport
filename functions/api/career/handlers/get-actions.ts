// Get Grade-Appropriate Career Actions

import type { SupabaseClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../src/functions-lib/response';

export interface CareerAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  iconBg: string;
  iconColor: string;
}

type GradeLevel = 'middle' | 'highschool' | 'higher_secondary' | 'after10' | 'after12' | 'college';

const GRADE_ACTIONS: Record<GradeLevel, CareerAction[]> = {
  middle: [
    { id: 'interests', label: 'Discover Interests', icon: 'Sparkles', prompt: 'Help me discover what I enjoy and am good at', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'explore', label: 'Explore Careers', icon: 'Compass', prompt: 'Show me different careers I can explore', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'strengths', label: 'My Strengths', icon: 'Star', prompt: 'What are my natural strengths and talents?', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { id: 'subjects', label: 'Subject Help', icon: 'BookOpen', prompt: 'Which subjects should I focus on?', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'hobbies', label: 'Hobby to Career', icon: 'Heart', prompt: 'Can my hobbies become a career?', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { id: 'skills', label: 'Build Skills', icon: 'Target', prompt: 'What skills should I start learning?', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ],
  
  highschool: [
    { id: 'stream', label: 'Stream Selection', icon: 'GitBranch', prompt: 'Help me choose Science, Commerce, or Arts stream', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'aptitude', label: 'Career Match', icon: 'Target', prompt: 'What careers match my aptitude and interests?', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'subjects', label: 'Subject Planning', icon: 'BookOpen', prompt: 'Which subjects align with my career goals?', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'skills', label: 'Skill Building', icon: 'Wrench', prompt: 'What skills should I develop now?', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'options', label: 'Career Options', icon: 'Briefcase', prompt: 'What career paths are available in my stream?', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 'guidance', label: 'Career Guidance', icon: 'TrendingUp', prompt: 'Guide me on my career journey', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  ],
  
  after10: [
    { id: 'stream', label: 'Stream Selection', icon: 'GitBranch', prompt: 'Help me choose Science, Commerce, or Arts stream', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'aptitude', label: 'Career Match', icon: 'Target', prompt: 'What careers match my aptitude and interests?', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'subjects', label: 'Subject Planning', icon: 'BookOpen', prompt: 'Which subjects align with my career goals?', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'skills', label: 'Skill Building', icon: 'Wrench', prompt: 'What skills should I develop now?', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'options', label: 'Career Options', icon: 'Briefcase', prompt: 'What career paths are available in my stream?', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 'guidance', label: 'Career Guidance', icon: 'TrendingUp', prompt: 'Guide me on my career journey', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  ],
  
  higher_secondary: [
    { id: 'college', label: 'College Selection', icon: 'GraduationCap', prompt: 'Which colleges and courses are best for me?', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'entrance', label: 'Entrance Exams', icon: 'FileText', prompt: 'Which entrance exams should I prepare for?', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'major', label: 'Choose Major', icon: 'BookOpen', prompt: 'Help me choose the right major/course', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'career-paths', label: 'Career Paths', icon: 'TrendingUp', prompt: 'What careers can I pursue after 12th?', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
    { id: 'skills', label: 'Skill Gap', icon: 'Target', prompt: 'What skills do I need for my target field?', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'study-plan', label: 'Study Plan', icon: 'Calendar', prompt: 'Create a study plan for entrance exams', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 'applications', label: 'Applications', icon: 'FileCheck', prompt: 'Help me with college applications', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { id: 'counseling', label: 'Counseling', icon: 'Lightbulb', prompt: 'I need career counseling', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ],
  
  after12: [
    { id: 'college', label: 'College Selection', icon: 'GraduationCap', prompt: 'Which colleges and courses are best for me?', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'entrance', label: 'Entrance Exams', icon: 'FileText', prompt: 'Which entrance exams should I prepare for?', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'major', label: 'Choose Major', icon: 'BookOpen', prompt: 'Help me choose the right major/course', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'career-paths', label: 'Career Paths', icon: 'TrendingUp', prompt: 'What careers can I pursue after 12th?', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
    { id: 'skills', label: 'Skill Gap', icon: 'Target', prompt: 'What skills do I need for my target field?', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'study-plan', label: 'Study Plan', icon: 'Calendar', prompt: 'Create a study plan for entrance exams', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 'applications', label: 'Applications', icon: 'FileCheck', prompt: 'Help me with college applications', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { id: 'counseling', label: 'Counseling', icon: 'Lightbulb', prompt: 'I need career counseling', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ],
  
  college: [
    { id: 'jobs', label: 'Find Jobs', icon: 'Briefcase', prompt: 'What jobs match my skills and experience?', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { id: 'skills', label: 'Skill Gap Analysis', icon: 'Target', prompt: 'Analyze my skill gaps for target roles', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { id: 'interview', label: 'Interview Prep', icon: 'MessageSquare', prompt: 'Help me prepare for technical interviews', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { id: 'resume', label: 'Resume Review', icon: 'FileText', prompt: 'Review and improve my resume', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { id: 'internship', label: 'Internships', icon: 'Briefcase', prompt: 'Help me find relevant internships', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { id: 'learning', label: 'Learning Path', icon: 'GraduationCap', prompt: 'Create a learning roadmap for my goals', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
    { id: 'network', label: 'Networking', icon: 'Users', prompt: 'Networking strategies for my field', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
    { id: 'career', label: 'Career Growth', icon: 'TrendingUp', prompt: 'Plan my career growth and transitions', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ],
};

async function getStudentGradeLevel(supabase: SupabaseClient, studentId: string): Promise<GradeLevel> {
  try {
    // Try to get from personal_assessment_attempts first (most recent)
    const { data: attemptData } = await supabase
      .from('personal_assessment_attempts')
      .select('grade_level')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptData?.grade_level) {
      return attemptData.grade_level as GradeLevel;
    }

    // Fallback: Check students table
    const { data: studentData } = await supabase
      .from('students')
      .select('grade')
      .or(`user_id.eq.${studentId},id.eq.${studentId}`)
      .maybeSingle();

    if (studentData?.grade) {
      // Map grade to grade_level
      const grade = studentData.grade.toLowerCase();
      if (grade.includes('6') || grade.includes('7') || grade.includes('8')) return 'middle';
      if (grade.includes('9') || grade.includes('10')) return 'highschool';
      if (grade.includes('11') || grade.includes('12')) return 'higher_secondary';
    }

    // Default to college for degree students
    return 'college';
  } catch (error) {
    console.error('Error fetching grade level:', error);
    return 'college'; // Default
  }
}

export async function handleGetActions(request: Request, env: any): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Get student's grade level
    const gradeLevel = await getStudentGradeLevel(supabase, user.id);
    
    // Get appropriate actions
    const actions = GRADE_ACTIONS[gradeLevel] || GRADE_ACTIONS.college;

    return jsonResponse({
      success: true,
      gradeLevel,
      actions
    });

  } catch (error) {
    console.error('[ERROR] get-actions:', error);
    return jsonResponse({ error: 'Failed to fetch actions' }, 500);
  }
}
