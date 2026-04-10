import { supabase } from '@/shared/api/supabaseClient';

export const courseDetailsService = {
  async getCourseSkills(courseIds: string[]) {
    const { data, error } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);
    
    if (error) throw error;
    return data;
  },

  async getCourseClasses(courseIds: string[]) {
    const { data, error } = await supabase
      .from('course_classes')
      .select('course_id, class_name')
      .in('course_id', courseIds);
    
    if (error) throw error;
    return data;
  },

  async getCourseModules(courseIds: string[]) {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*, lessons(*, lesson_resources(*))')
      .in('course_id', courseIds)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
